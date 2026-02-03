/**
 * @fileoverview مكون عرض الرسالة الواحدة - Single Message Display Component
 * 
 * @description
 * يعرض رسالة واحدة مع:
 * - أيقونة المرسل (مستخدم/مساعد)
 * - اسم المرسل
 * - المرفقات (صور/ملفات)
 * - المحتوى (مع دعم streaming)
 * - مؤشر التفكير (thinking indicator)
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
 * - أيقونات بـ strokeWidth موحد
 * - تباين ألوان مناسب
 */

import { memo } from 'react';
import { Bot, User } from 'lucide-react';
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
        'message-enter flex gap-3 px-4 py-5',
        isUser ? 'bg-transparent' : 'bg-card/30'
      )}
    >
      {/* ═══════════════════════════════════════════════════════════════════
          AVATAR
          
          @size 32px (w-8 h-8)
          @icons User/Bot with h-4 w-4
          ═══════════════════════════════════════════════════════════════════ */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser
            ? 'bg-muted text-foreground'
            : 'bg-foreground text-background'
        )}
      >
        {isUser ? (
          <User className="h-4 w-4" strokeWidth={2} />
        ) : (
          <Bot className="h-4 w-4" strokeWidth={2} />
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          MESSAGE CONTENT
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* ───────────────────────────────────────────────────────────────────
            SENDER NAME
            ─────────────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            {isUser ? 'أنت' : 'Roblox Expert'}
          </span>
        </div>

        {/* ───────────────────────────────────────────────────────────────────
            ATTACHMENTS (if any)
            ─────────────────────────────────────────────────────────────────── */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
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
            ─────────────────────────────────────────────────────────────────── */}
        <div className="relative min-h-[1.5rem]">
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
