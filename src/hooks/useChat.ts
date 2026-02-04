/**
 * @fileoverview Hook رئيسي لإدارة إرسال واستقبال الرسائل
 * 
 * @description
 * هذا الـ Hook يعمل كجسر بين واجهة المستخدم والخادم.
 * يدير:
 * - إرسال الرسائل مع المرفقات
 * - استقبال الردود بتقنية Streaming (SSE)
 * - حالات التحميل والأخطاء
 * 
 * @dependencies
 * - useChatStore: للوصول للحالة المركزية
 * - sonner: لعرض إشعارات الأخطاء
 * 
 * @impact
 * ⚠️ WARNING: أي تعديل يؤثر على:
 * - ChatContainer.tsx: يستخدم sendMessage
 * - ChatInput.tsx: يعتمد على حالة isLoading
 * 
 * @architecture
 * ```
 * useChat Hook
 *     │
 *     ├── Reads from Store ──► messages, isLoading
 *     │
 *     ├── Calls Edge Function ──► /functions/v1/chat
 *     │
 *     └── Updates Store ──► addMessage, updateMessage, setStreaming
 * ```
 */

import { useCallback } from 'react';
import { useChatStore, Attachment } from '@/stores/chatStore';
import { toast } from 'sonner';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * رابط Edge Function للدردشة
 * 
 * @note
 * يستخدم متغير البيئة VITE_SUPABASE_URL
 * يجب التأكد من تكوينه في .env
 */
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

/**
 * الحد الأقصى لحجم محتوى الملفات المرسلة كنص داخل الرسالة.
 */
const MAX_FILE_CONTENT_CHARS = 4000;

/**
 * التحقق من أنواع الملفات النصية القابلة للقراءة.
 */
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

/**
 * بنية الرسالة للإرسال إلى API
 * 
 * @property role - دور المرسل
 * @property content - المحتوى (نص أو مصفوفة متعددة الوسائط)
 * 
 * @note
 * يختلف عن Message في chatStore لأنه يدعم:
 * - المحتوى النصي البسيط
 * - المحتوى متعدد الأجزاء (نص + صور)
 */
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

/**
 * Hook لإدارة الدردشة
 * 
 * @returns
 * - messages: رسائل المحادثة الحالية
 * - isLoading: هل جاري تحميل رد؟
 * - sendMessage: دالة إرسال رسالة جديدة
 * 
 * @example
 * ```tsx
 * const { messages, isLoading, sendMessage } = useChat();
 * 
 * const handleSend = () => {
 *   sendMessage('مرحباً!', []);
 * };
 * ```
 * 
 * @performance
 * - يستخدم useCallback لتجنب إعادة إنشاء الدوال
 * - يستخدم getState() للحصول على مراجع ثابتة للـ actions
 */
export const useChat = () => {
  // ─────────────────────────────────────────────────────────────────────────
  // STATE SUBSCRIPTIONS
  // ─────────────────────────────────────────────────────────────────────────
  
  const isLoading = useChatStore((state) => state.isLoading);
  const messages = useChatStore((state) => state.getMessages());

  // ─────────────────────────────────────────────────────────────────────────
  // STORE ACTIONS (STABLE REFERENCES)
  // ─────────────────────────────────────────────────────────────────────────
  
  /**
   * الحصول على مراجع ثابتة للـ actions من المتجر
   * 
   * @optimization
   * getState() يُرجع الحالة الحالية دون subscription
   * هذا يمنع re-renders عند تغير الحالة
   */
  const storeActions = useChatStore.getState();
  const addMessage = storeActions.addMessage;
  const updateMessage = storeActions.updateMessage;
  const setMessageStreaming = storeActions.setMessageStreaming;
  const setLoading = storeActions.setLoading;
  const setAssistantTyping = storeActions.setAssistantTyping;
  const getMessages = storeActions.getMessages;

  // ─────────────────────────────────────────────────────────────────────────
  // SEND MESSAGE FUNCTION
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * إرسال رسالة جديدة
   * 
   * @param content - نص الرسالة
   * @param attachments - المرفقات (صور/ملفات)
   * 
   * @flow
   * 1. التحقق من المدخلات (Guard Clause)
   * 2. إضافة رسالة المستخدم للمتجر
   * 3. تفعيل حالات التحميل
   * 4. تحضير الرسائل للـ API
   * 5. إرسال الطلب
   * 6. معالجة الـ Stream
   * 7. تحديث حالة الرسالة
   * 
   * @errorHandling
   * - 429: Rate Limit
   * - 402: Payment Required
   * - أخطاء الشبكة العامة
   * 
   * @throws لا يرمي استثناءات - يعرض toast بدلاً من ذلك
   */
  const sendMessage = useCallback(
    async (content: string, attachments: Attachment[] = []) => {
      // ═══════════════════════════════════════════════════════════════════════
      // GUARD CLAUSES
      // ═══════════════════════════════════════════════════════════════════════
      
      // التحقق من وجود محتوى
      if (!content.trim() && attachments.length === 0) {
        return; // لا شيء للإرسال
      }

      // ═══════════════════════════════════════════════════════════════════════
      // STEP 1: ADD USER MESSAGE TO STORE
      // ═══════════════════════════════════════════════════════════════════════
      
      addMessage({
        role: 'user',
        content,
        attachments: attachments.length > 0 ? attachments : undefined,
        status: 'sent',
      });

      // ═══════════════════════════════════════════════════════════════════════
      // STEP 2: ACTIVATE LOADING STATES
      // ═══════════════════════════════════════════════════════════════════════
      
      setLoading(true);
      setAssistantTyping(true); // يُظهر thinking indicator

      // ═══════════════════════════════════════════════════════════════════════
      // STEP 3: PREPARE MESSAGES FOR API
      // ═══════════════════════════════════════════════════════════════════════
      
      // الحصول على الرسائل المحدثة (تتضمن رسالة المستخدم الجديدة)
      const currentMessages = getMessages();
      
      // تحويل الرسائل لصيغة API
      const apiMessages: ChatMessage[] = currentMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // ═══════════════════════════════════════════════════════════════════════
      // STEP 4: BUILD MULTIPART CONTENT (IF ATTACHMENTS EXIST)
      // ═══════════════════════════════════════════════════════════════════════
      
      let userContent: ChatMessage['content'];
      
      if (attachments.length > 0) {
        // بناء محتوى متعدد الأجزاء (نص + صور)
        const contentParts: Array<{ 
          type: string; 
          text?: string; 
          image_url?: { url: string } 
        }> = [];
        
        // إضافة النص إن وجد
        if (content.trim()) {
          contentParts.push({ type: 'text', text: content });
        }
        
        // إضافة المرفقات
        attachments.forEach((attachment) => {
          if (attachment.type === 'image' && attachment.base64 && attachment.mimeType) {
            // صورة: تُرسل كـ base64 data URL
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
        // محتوى نصي بسيط
        userContent = content;
      }

      // إضافة رسالة المستخدم الجديدة للـ API
      apiMessages.push({
        role: 'user',
        content: userContent,
      });

      // ═══════════════════════════════════════════════════════════════════════
      // STEP 5: ADD PLACEHOLDER FOR ASSISTANT RESPONSE
      // ═══════════════════════════════════════════════════════════════════════
      
      const assistantId = addMessage({
        role: 'assistant',
        content: '',
        isStreaming: true,
        status: 'sending',
      });

      // ═══════════════════════════════════════════════════════════════════════
      // STEP 6: SEND REQUEST AND HANDLE STREAM
      // ═══════════════════════════════════════════════════════════════════════
      
      try {
        const response = await fetch(CHAT_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: apiMessages }),
        });

        // ─────────────────────────────────────────────────────────────────────
        // ERROR HANDLING: HTTP ERRORS
        // ─────────────────────────────────────────────────────────────────────
        
        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          
          // Rate Limit Error
          if (response.status === 429) {
            throw new Error('تم تجاوز الحد المسموح. يرجى الانتظار قليلاً (Rate Limit).');
          }
          
          // Payment Required
          if (response.status === 402) {
            throw new Error('نفدت الرصيد في بوابة الذكاء الاصطناعي (Payment Required). يرجى التأكد من توفر الرصيد في حساب Lovable الخاص بك للمتابعة.');
          }
          
          // Generic Server Error
          throw new Error(error.error || 'فشل في الحصول على الرد من الخادم');
        }

        // Guard: التحقق من وجود body
        if (!response.body) {
          throw new Error('لا يوجد رد');
        }

        // ─────────────────────────────────────────────────────────────────────
        // STREAM PROCESSING: SSE (Server-Sent Events)
        // ─────────────────────────────────────────────────────────────────────
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let textBuffer = '';
        let fullContent = '';

        // قراءة الـ stream chunk by chunk
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // فك ترميز البيانات وإضافتها للـ buffer
          textBuffer += decoder.decode(value, { stream: true });

          // معالجة كل سطر مكتمل
          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);

            // تنظيف السطر
            if (line.endsWith('\r')) line = line.slice(0, -1);
            
            // تجاهل التعليقات والأسطر الفارغة
            if (line.startsWith(':') || line.trim() === '') continue;
            
            // التحقق من صيغة SSE
            if (!line.startsWith('data: ')) continue;

            const jsonStr = line.slice(6).trim();
            
            // نهاية الـ stream
            if (jsonStr === '[DONE]') break;

            try {
              // تحليل JSON واستخراج المحتوى
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              
              if (content) {
                // إخفاء thinking indicator عند وصول أول محتوى
                if (fullContent === '') {
                  setAssistantTyping(false);
                }
                
                // تحديث المحتوى
                fullContent += content;
                updateMessage(assistantId, fullContent, 'delivered');
              }
            } catch {
              // JSON غير مكتمل: إعادته للـ buffer للمعالجة لاحقاً
              textBuffer = line + '\n' + textBuffer;
              break;
            }
          }
        }

        // ─────────────────────────────────────────────────────────────────────
        // FINAL FLUSH: معالجة أي بيانات متبقية
        // ─────────────────────────────────────────────────────────────────────
        
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
              // تجاهل الأخطاء في النهاية
            }
          }
        }

        // ═══════════════════════════════════════════════════════════════════════
        // STEP 7: FINALIZE MESSAGE
        // ═══════════════════════════════════════════════════════════════════════
        
        setMessageStreaming(assistantId, false);
        updateMessage(assistantId, fullContent, 'read');
        
      } catch (error) {
        // ═══════════════════════════════════════════════════════════════════════
        // ERROR HANDLING: CATCH-ALL
        // ═══════════════════════════════════════════════════════════════════════
        
        console.error('Chat error:', error);
        
        const errorMessage = error instanceof Error 
          ? error.message 
          : 'حدث خطأ غير معروف';
        
        // تحديث رسالة المساعد برسالة الخطأ
        updateMessage(assistantId, `عذراً، حدث خطأ: ${errorMessage}`);
        setMessageStreaming(assistantId, false);
        
        // عرض إشعار للمستخدم
        toast.error(errorMessage);
        
      } finally {
        // ═══════════════════════════════════════════════════════════════════════
        // CLEANUP: Reset Loading States
        // ═══════════════════════════════════════════════════════════════════════
        
        setLoading(false);
        setAssistantTyping(false);
      }
    },
    [] // المراجع من getState() ثابتة، لا حاجة لـ dependencies
  );

  // ─────────────────────────────────────────────────────────────────────────
  // RETURN VALUE
  // ─────────────────────────────────────────────────────────────────────────

  return {
    messages,
    isLoading,
    sendMessage,
  };
};
