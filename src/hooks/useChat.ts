/**
 * @fileoverview Hook رئيسي لإدارة إرسال واستقبال الرسائل
 * 
 * @description
 * يدير إرسال الرسائل مع المرفقات واستقبال الردود بتقنية Streaming (SSE)
 * مع دعم إعادة التوليد
 */

import { useCallback } from 'react';
import { useChatStore, Attachment } from '@/stores/chatStore';
import { toast } from 'sonner';

// ============================================================================
// CONSTANTS
// ============================================================================

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
const MAX_FILE_CONTENT_CHARS = 4000;
const MAX_FILE_DECODE_BYTES = 200 * 1024;

const TEXT_MIME_TYPES = new Set([
  'text/plain',
  'text/markdown',
  'application/json',
  'application/xml',
  'text/xml',
  'application/javascript',
  'text/javascript',
  'application/x-lua',
  'text/x-lua',
]);

const TEXT_EXTENSIONS = new Set(['.txt', '.md', '.json', '.xml', '.js', '.ts', '.lua']);

const isTextFile = (attachment: Attachment) => {
  if (attachment.mimeType && TEXT_MIME_TYPES.has(attachment.mimeType)) {
    return true;
  }
  const lowerName = attachment.name.toLowerCase();
  return Array.from(TEXT_EXTENSIONS).some((ext) => lowerName.endsWith(ext));
};

const decodeBase64ToText = (base64: string) => {
  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  } catch {
    return null;
  }
};

const estimateBase64Bytes = (base64: string) => {
  const sanitized = base64.replace(/=+$/, '');
  return Math.floor((sanitized.length * 3) / 4);
};

const formatBytes = (bytes?: number) => {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
};

// ============================================================================
// TYPES
// ============================================================================

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | Array<{ 
    type: string; 
    text?: string; 
    image_url?: { url: string } 
  }>;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export const useChat = () => {
  // ─────────────────────────────────────────────────────────────────────────
  // STATE SUBSCRIPTIONS
  // ─────────────────────────────────────────────────────────────────────────
  
  const isLoading = useChatStore((state) => state.isLoading);
  const messages = useChatStore((state) => state.getMessages());

  // ─────────────────────────────────────────────────────────────────────────
  // STORE ACTIONS (STABLE REFERENCES)
  // ─────────────────────────────────────────────────────────────────────────
  
  const storeActions = useChatStore.getState();
  const addMessage = storeActions.addMessage;
  const updateMessage = storeActions.updateMessage;
  const setMessageStreaming = storeActions.setMessageStreaming;
  const setLoading = storeActions.setLoading;
  const setAssistantTyping = storeActions.setAssistantTyping;
  const getMessages = storeActions.getMessages;
  const deleteMessage = storeActions.deleteMessage;

  // ─────────────────────────────────────────────────────────────────────────
  // SEND MESSAGE FUNCTION
  // ─────────────────────────────────────────────────────────────────────────

  const sendMessage = useCallback(
    async (content: string, attachments: Attachment[] = []) => {
      if (!content.trim() && attachments.length === 0) {
        return;
      }

      addMessage({
        role: 'user',
        content,
        attachments: attachments.length > 0 ? attachments : undefined,
        status: 'sent',
      });

      setLoading(true);
      setAssistantTyping(true);

      const currentMessages = getMessages();
      
      const apiMessages: ChatMessage[] = currentMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      let userContent: ChatMessage['content'];
      
      if (attachments.length > 0) {
        const contentParts: Array<{ 
          type: string; 
          text?: string; 
          image_url?: { url: string } 
        }> = [];
        
        if (content.trim()) {
          contentParts.push({ type: 'text', text: content });
        }
        
        attachments.forEach((attachment) => {
          if (attachment.type === 'image' && attachment.base64 && attachment.mimeType) {
            contentParts.push({
              type: 'image_url',
              image_url: {
                url: `data:${attachment.mimeType};base64,${attachment.base64}`,
              },
            });
            return;
          }

          if (attachment.type !== 'file') {
            return;
          }

          const sizeLabel = formatBytes(attachment.size);
          const metadata = [
            `Attached file: ${attachment.name}`,
            attachment.mimeType ? `type: ${attachment.mimeType}` : null,
            sizeLabel ? `size: ${sizeLabel}` : null,
          ]
            .filter(Boolean)
            .join(' | ');

          if (attachment.base64 && isTextFile(attachment)) {
            const attachmentSize = attachment.size ?? estimateBase64Bytes(attachment.base64);
            if (attachmentSize > MAX_FILE_DECODE_BYTES) {
              contentParts.push({
                type: 'text',
                text: `${metadata}\n\n[Text file too large to include. Size limit: ${formatBytes(MAX_FILE_DECODE_BYTES)}]`,
              });
              return;
            }
            const decodedText = decodeBase64ToText(attachment.base64);
            if (decodedText) {
              const trimmed = decodedText.trim();
              const contentSlice = trimmed.slice(0, MAX_FILE_CONTENT_CHARS);
              const truncated = trimmed.length > MAX_FILE_CONTENT_CHARS;
              contentParts.push({
                type: 'text',
                text: `${metadata}\n\n${contentSlice}${truncated ? '\n\n[Content truncated]' : ''}`,
              });
              return;
            }
          }

          contentParts.push({
            type: 'text',
            text: `${metadata}\n\n[Binary file attached. Content not included.]`,
          });
        });
        
        userContent = contentParts;
      } else {
        userContent = content;
      }

      apiMessages.push({
        role: 'user',
        content: userContent,
      });

      const assistantId = addMessage({
        role: 'assistant',
        content: '',
        isStreaming: true,
        status: 'sending',
      });

      try {
        const response = await fetch(CHAT_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: apiMessages }),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          
          if (response.status === 429) {
            throw new Error('تم تجاوز الحد المسموح. يرجى الانتظار قليلاً (Rate Limit).');
          }
          
          if (response.status === 402) {
            throw new Error('نفدت الرصيد في بوابة الذكاء الاصطناعي (Payment Required).');
          }
          
          throw new Error(error.error || 'فشل في الحصول على الرد من الخادم');
        }

        if (!response.body) {
          throw new Error('لا يوجد رد');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let textBuffer = '';
        let fullContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          textBuffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);

            if (line.endsWith('\r')) line = line.slice(0, -1);
            if (line.startsWith(':') || line.trim() === '') continue;
            if (!line.startsWith('data: ')) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') break;

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              
              if (content) {
                if (fullContent === '') {
                  setAssistantTyping(false);
                }
                
                fullContent += content;
                updateMessage(assistantId, fullContent, 'delivered');
              }
            } catch {
              textBuffer = line + '\n' + textBuffer;
              break;
            }
          }
        }

        if (textBuffer.trim()) {
          for (let raw of textBuffer.split('\n')) {
            if (!raw) continue;
            if (raw.endsWith('\r')) raw = raw.slice(0, -1);
            if (raw.startsWith(':') || raw.trim() === '') continue;
            if (!raw.startsWith('data: ')) continue;
            
            const jsonStr = raw.slice(6).trim();
            if (jsonStr === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) {
                fullContent += content;
                updateMessage(assistantId, fullContent);
              }
            } catch {
              // تجاهل الأخطاء
            }
          }
        }

        setMessageStreaming(assistantId, false);
        updateMessage(assistantId, fullContent, 'read');
        
      } catch (error) {
        console.error('Chat error:', error);
        
        const errorMessage = error instanceof Error 
          ? error.message 
          : 'حدث خطأ غير معروف';
        
        updateMessage(assistantId, `عذراً، حدث خطأ: ${errorMessage}`);
        setMessageStreaming(assistantId, false);
        
        toast.error(errorMessage);
        
      } finally {
        setLoading(false);
        setAssistantTyping(false);
      }
    },
    []
  );

  // ─────────────────────────────────────────────────────────────────────────
  // REGENERATE LAST MESSAGE
  // ─────────────────────────────────────────────────────────────────────────

  const regenerateLastMessage = useCallback(async () => {
    const currentMessages = getMessages();
    
    // البحث عن آخر رسالة من المستخدم
    let lastUserMessageIndex = -1;
    for (let i = currentMessages.length - 1; i >= 0; i--) {
      if (currentMessages[i].role === 'user') {
        lastUserMessageIndex = i;
        break;
      }
    }

    if (lastUserMessageIndex === -1) {
      toast.error('لا توجد رسالة لإعادة توليدها');
      return;
    }

    const lastUserMessage = currentMessages[lastUserMessageIndex];
    
    // حذف آخر رسالة من المساعد
    const lastAssistantMessage = currentMessages[currentMessages.length - 1];
    if (lastAssistantMessage?.role === 'assistant') {
      deleteMessage(lastAssistantMessage.id);
    }

    // إعادة إرسال رسالة المستخدم
    setLoading(true);
    setAssistantTyping(true);

    // تحضير الرسائل (بدون آخر رسالة من المساعد)
    const apiMessages: ChatMessage[] = currentMessages
      .slice(0, lastUserMessageIndex + 1)
      .map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

    const assistantId = addMessage({
      role: 'assistant',
      content: '',
      isStreaming: true,
      status: 'sending',
    });

    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        
        if (response.status === 429) {
          throw new Error('تم تجاوز الحد المسموح. يرجى الانتظار قليلاً.');
        }
        
        if (response.status === 402) {
          throw new Error('نفدت الرصيد في بوابة الذكاء الاصطناعي.');
        }
        
        throw new Error(error.error || 'فشل في إعادة التوليد');
      }

      if (!response.body) {
        throw new Error('لا يوجد رد');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            
            if (content) {
              if (fullContent === '') {
                setAssistantTyping(false);
              }
              
              fullContent += content;
              updateMessage(assistantId, fullContent, 'delivered');
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      setMessageStreaming(assistantId, false);
      updateMessage(assistantId, fullContent, 'read');
      toast.success('تم إعادة التوليد بنجاح');
      
    } catch (error) {
      console.error('Regenerate error:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'حدث خطأ غير معروف';
      
      updateMessage(assistantId, `عذراً، حدث خطأ: ${errorMessage}`);
      setMessageStreaming(assistantId, false);
      
      toast.error(errorMessage);
      
    } finally {
      setLoading(false);
      setAssistantTyping(false);
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // RETURN VALUE
  // ─────────────────────────────────────────────────────────────────────────

  return {
    messages,
    isLoading,
    sendMessage,
    regenerateLastMessage,
  };
};
