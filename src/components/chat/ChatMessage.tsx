/**
 * @fileoverview مكون عرض الرسالة الواحدة - Single Message Display Component
 * 
 * @description
 * يعرض رسالة واحدة مع:
 * - اسم المرسل
 * - المرفقات (صور/ملفات)
 * - المحتوى (مع دعم streaming)
 * - مؤشر التفكير (thinking indicator)
 * 
 * @note
 * تمت إزالة الأيقونات الدائرية للمرسل حسب طلب المستخدم.
 * الآن يظهر فقط اسم المرسل بتصميم نظيف.
 * 
 * @dependencies
 * - ThinkingIndicator: مؤشر التحميل الدائري
 * - StreamingText: عرض النص المتدفق
 * 
 * @performance
 * - يستخدم memo لتجنب re-renders غير ضرورية
 * - يتجاهل التحديثات إذا لم تتغير الرسالة
 * 
 * @accessibility
 * - aria-live للمحتوى المتدفق
 * - تباين ألوان مناسب
 */

import { memo } from 'react';
import { cn } from '@/lib/utils';
import { Message } from '@/stores/chatStore';
import { ThinkingIndicator } from './ThinkingIndicator';
import { StreamingText } from './StreamingText';

// ============================================================================
// TYPES
// ============================================================================

interface ChatMessageProps {
  /** بيانات الرسالة للعرض */
  message: Message;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * مكون عرض الرسالة
 * 
 * @memoized لتحسين الأداء
 * 
 * @states
 * - isWaiting: الرسالة في حالة انتظار (isStreaming=true, content='')
 * - isStreaming: الرسالة قيد البث (isStreaming=true, content!='')
 * - completed: الرسالة مكتملة (isStreaming=false)
 * 
 * @example
 * ```tsx
 * <ChatMessage message={userMessage} />
 * ```
 */
export const ChatMessage = memo(({ message }: ChatMessageProps) => {
  // ─────────────────────────────────────────────────────────────────────────
  // DERIVED STATE
  // ─────────────────────────────────────────────────────────────────────────
  
  /** هل الرسالة من المستخدم؟ */
  const isUser = message.role === 'user';
  
  /** 
   * هل في حالة انتظار؟
   * 
   * @condition isStreaming=true AND content=''
   * @shows ThinkingIndicator
   */
  const isWaiting = message.isStreaming && !message.content;
  
  /**
   * هل في حالة بث؟
   * 
   * @condition isStreaming=true AND content!=''
   * @shows StreamingText with cursor
   */
  const isStreaming = message.isStreaming && !!message.content;

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div
      className={cn(
        'message-enter px-4 py-5',
        isUser
          ? 'bg-transparent border-r-2 border-foreground/10'
          : 'bg-card/30 border-l-2 border-foreground/10'
      )}
    >
      {/* ═══════════════════════════════════════════════════════════════════
          MESSAGE CONTENT - Clean Layout without Avatar
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="max-w-3xl mx-auto space-y-2">
        {/* ───────────────────────────────────────────────────────────────────
            SENDER NAME - Clean Text Only
            ─────────────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-sm font-semibold",
            isUser ? "text-muted-foreground" : "text-foreground"
          )}>
            {isUser ? 'أنت' : 'Roblox Expert'}
          </span>
        </div>

        {/* ───────────────────────────────────────────────────────────────────
            ATTACHMENTS (if any)
            ─────────────────────────────────────────────────────────────────── */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {message.attachments.map((attachment) => (
              <div key={attachment.id} className="relative group">
                {attachment.type === 'image' ? (
                  /* صورة */
                  <img
                    src={attachment.url}
                    alt={attachment.name}
                    className="h-20 rounded-lg border border-border object-cover"
                  />
                ) : (
                  /* ملف */
                  <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg border border-border">
                    <span className="text-sm text-foreground">{attachment.name}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────────────
            CONTENT AREA
            
            @states
            - Waiting: shows ThinkingIndicator
            - Streaming: shows StreamingText with cursor
            - Complete: shows StreamingText without cursor
            
            @accessibility
            - aria-live="polite" للمحتوى المتدفق
            ─────────────────────────────────────────────────────────────────── */}
        <div 
          className="relative min-h-[1.5rem]"
          aria-live={isStreaming ? "polite" : "off"}
          aria-atomic="false"
        >
          {/* Thinking indicator - visible when waiting */}
          <ThinkingIndicator isVisible={isWaiting} className="absolute inset-0" />
          
          {/* Text content - fades in when content arrives */}
          <div 
            className={cn(
              'transition-opacity duration-300 ease-out',
              isWaiting ? 'opacity-0' : 'opacity-100'
            )}
          >
            {!isWaiting && (
              <StreamingText 
                content={message.content} 
                isStreaming={isStreaming} 
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

// Required for React DevTools
ChatMessage.displayName = 'ChatMessage';
