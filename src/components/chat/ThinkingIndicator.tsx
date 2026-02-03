/**
 * @fileoverview مؤشر التفكير الدائري - Thinking Indicator Component
 * 
 * @description
 * يعرض أنميشن تحميل دائرية مع نص "جاري التفكير..."
 * يظهر أثناء انتظار رد الذكاء الاصطناعي.
 * 
 * @design
 * - مستوحى من تصميم ChatGPT
 * - spinner دائري ناعم
 * - نص متوهج (pulse animation)
 * 
 * @animation
 * يستخدم CSS animation في index.css:
 * - .thinking-spinner: دوران 0.8 ثانية
 * - .animate-pulse-subtle: توهج ناعم
 * 
 * @accessibility
 * - role="status" للقارئات
 * - انتقال سلس للظهور/الاختفاء
 */

import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface ThinkingIndicatorProps {
  /** classes إضافية للتخصيص */
  className?: string;
  /** هل المؤشر مرئي؟ */
  isVisible: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * مكون مؤشر التفكير
 * 
 * @example
 * ```tsx
 * <ThinkingIndicator isVisible={isWaiting} className="absolute inset-0" />
 * ```
 * 
 * @behavior
 * - عند isVisible=true: يظهر مع انتقال سلس
 * - عند isVisible=false: يختفي مع انتقال + pointer-events-none
 */
export const ThinkingIndicator = ({ className, isVisible }: ThinkingIndicatorProps) => {
  return (
    <div 
      role="status"
      className={cn(
        'flex items-center gap-3 transition-all duration-300 ease-out',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none',
        className
      )}
    >
      {/* ═══════════════════════════════════════════════════════════════════
          CIRCULAR SPINNER
          
          @style تعريف في index.css → .thinking-spinner
          @animation spin-smooth 0.8s cubic-bezier
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="thinking-spinner" />
      
      {/* ═══════════════════════════════════════════════════════════════════
          TEXT
          
          @animation animate-pulse-subtle (توهج ناعم)
          ═══════════════════════════════════════════════════════════════════ */}
      <span className="text-sm text-muted-foreground animate-pulse-subtle">
        جاري التفكير...
      </span>
    </div>
  );
};
