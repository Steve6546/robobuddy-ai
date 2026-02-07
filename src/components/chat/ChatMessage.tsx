/**
 * @fileoverview مكون عرض الرسالة الواحدة - Single Message Display Component
 * 
 * @description
 * يعرض رسالة واحدة مع:
 * - اسم المرسل
 * - المرفقات (صور/ملفات)
 * - المحتوى (مع دعم streaming)
 * - مؤشر التفكير (thinking indicator)
 * - أزرار النسخ وإعادة التوليد
 */

import { memo, useState } from 'react';
import { cn } from '@/lib/utils';
import { Message } from '@/stores/chatStore';
import { ThinkingIndicator } from './ThinkingIndicator';
import { StreamingText } from './StreamingText';
import { Copy, Check, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

interface ChatMessageProps {
  /** بيانات الرسالة للعرض */
  message: Message;
  /** هل هذه الرسالة الأخيرة؟ (لإظهار زر الإعادة) */
  isLastAssistant?: boolean;
  /** دالة إعادة التوليد */
  onRegenerate?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * مكون عرض الرسالة
 */
export const ChatMessage = memo(({ message, isLastAssistant, onRegenerate }: ChatMessageProps) => {
  // ─────────────────────────────────────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────────────────────────────────────
  
  const [copied, setCopied] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────
  // DERIVED STATE
  // ─────────────────────────────────────────────────────────────────────────
  
  /** هل الرسالة من المستخدم؟ */
  const isUser = message.role === 'user';
  
  /** هل في حالة انتظار؟ */
  const isWaiting = message.isStreaming && !message.content;
  
  /** هل في حالة بث؟ */
  const isStreaming = message.isStreaming && !!message.content;

  // ─────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * نسخ محتوى الرسالة
   */
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      toast.success('تم النسخ!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('فشل في النسخ');
    }
  };

  /**
   * إعادة توليد الرد
   */
  const handleRegenerate = () => {
    if (onRegenerate) {
      onRegenerate();
    }
  };

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
      <div className="max-w-3xl mx-auto space-y-2">
        {/* ───────────────────────────────────────────────────────────────────
            SENDER NAME
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
                  <img
                    src={attachment.url}
                    alt={attachment.name}
                    className="h-20 rounded-lg border border-border object-cover"
                  />
                ) : (
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
            ─────────────────────────────────────────────────────────────────── */}
        <div 
          className="relative min-h-[1.5rem]"
          aria-live={isStreaming ? "polite" : "off"}
          aria-atomic="false"
        >
          {/* Thinking indicator */}
          <ThinkingIndicator isVisible={isWaiting} className="absolute inset-0" />
          
          {/* Text content */}
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

        {/* ───────────────────────────────────────────────────────────────────
            ACTION BUTTONS - Copy & Regenerate (Assistant only)
            ─────────────────────────────────────────────────────────────────── */}
        {!isUser && !isWaiting && !isStreaming && message.content && (
          <div className="flex items-center gap-2 pt-2 border-t border-border/30">
            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs",
                "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                "transition-colors duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
              aria-label="نسخ الرسالة"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>تم النسخ</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>نسخ</span>
                </>
              )}
            </button>

            {/* Regenerate Button - Only for last assistant message */}
            {isLastAssistant && onRegenerate && (
              <button
                onClick={handleRegenerate}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs",
                  "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  "transition-colors duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
                aria-label="إعادة التوليد"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>إعادة</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

ChatMessage.displayName = 'ChatMessage';
