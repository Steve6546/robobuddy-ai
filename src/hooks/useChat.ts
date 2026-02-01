import { useCallback } from 'react';
import { useChatStore, Attachment, Message } from '@/stores/chatStore';
import { toast } from 'sonner';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

export const useChat = () => {
  const {
    messages,
    isLoading,
    addMessage,
    updateMessage,
    setMessageStreaming,
    setLoading,
  } = useChatStore();

  const sendMessage = useCallback(
    async (content: string, attachments: Attachment[] = []) => {
      if (!content.trim() && attachments.length === 0) return;

      // Add user message
      addMessage({
        role: 'user',
        content,
        attachments: attachments.length > 0 ? attachments : undefined,
      });

      setLoading(true);

      // Prepare messages for API
      const apiMessages: ChatMessage[] = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Build content for the new message
      let userContent: ChatMessage['content'];
      
      if (attachments.length > 0) {
        const contentParts: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];
        
        // Add text if present
        if (content.trim()) {
          contentParts.push({ type: 'text', text: content });
        }
        
        // Add images
        attachments.forEach((attachment) => {
          if (attachment.type === 'image' && attachment.base64 && attachment.mimeType) {
            contentParts.push({
              type: 'image_url',
              image_url: {
                url: `data:${attachment.mimeType};base64,${attachment.base64}`,
              },
            });
          } else if (attachment.type === 'file' && attachment.base64) {
            // For files, add as text context
            contentParts.push({
              type: 'text',
              text: `[Attached file: ${attachment.name}]`,
            });
          }
        });
        
        userContent = contentParts;
      } else {
        userContent = content;
      }

      apiMessages.push({
        role: 'user',
        content: userContent,
      });

      // Add assistant message placeholder
      const assistantId = addMessage({
        role: 'assistant',
        content: '',
        isStreaming: true,
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
            throw new Error('Rate limit exceeded. Please wait a moment before trying again.');
          }
          if (response.status === 402) {
            throw new Error('AI credits exhausted. Please add more credits to continue.');
          }
          throw new Error(error.error || 'Failed to get response');
        }

        if (!response.body) {
          throw new Error('No response body');
        }

        // Stream the response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let textBuffer = '';
        let fullContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          textBuffer += decoder.decode(value, { stream: true });

          // Process line by line
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
                fullContent += content;
                updateMessage(assistantId, fullContent);
              }
            } catch {
              // Incomplete JSON, put back
              textBuffer = line + '\n' + textBuffer;
              break;
            }
          }
        }

        // Final flush
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
              /* ignore */
            }
          }
        }

        setMessageStreaming(assistantId, false);
      } catch (error) {
        console.error('Chat error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        updateMessage(assistantId, `Sorry, I encountered an error: ${errorMessage}`);
        setMessageStreaming(assistantId, false);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [messages, addMessage, updateMessage, setMessageStreaming, setLoading]
  );

  return {
    messages,
    isLoading,
    sendMessage,
  };
};
