/**
 * @fileoverview مكون عرض النص المتدفق - Streaming Text Display Component
 * 
 * @description
 * يعرض النص بأنميشن حرف بحرف متزامن مع سرعة استجابة النموذج.
 * يدعم:
 * - Markdown rendering (headers, lists, bold, code)
 * - Code blocks with syntax highlighting
 * - نسخ الكود
 * - مؤشر كتابة وامض أثناء البث
 * 
 * @dependencies
 * - react-markdown: تحويل Markdown إلى React
 * - react-syntax-highlighter: تلوين الكود
 * 
 * @performance
 * - يستخدم memo لتجنب re-renders غير ضرورية
 * - يستخدم requestAnimationFrame للأنميشن السلسة
 * - Adaptive speed: السرعة تتكيف مع سرعة وصول البيانات
 * 
 * @animation
 * ```
 * Model Response ───► textBuffer ───► displayedContent
 *                         │
 *                         ▼
 *                 requestAnimationFrame
 *                 (character by character)
 * ```
 */

import { useState, useEffect, useRef, memo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface StreamingTextProps {
  /** المحتوى النصي للعرض */
  content: string;
  /** هل النص قيد البث؟ */
  isStreaming: boolean;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * مكون عرض كتلة الكود
 * 
 * @features
 * - تلوين بناء الجملة
 * - أرقام الأسطر
 * - زر نسخ
 * - عرض اسم اللغة
 * 
 * @memoized لتجنب re-renders عند تحديث النص المحيط
 */
const CodeBlock = memo(({ language, children }: { language: string; children: string }) => {
  const [copied, setCopied] = useState(false);

  /**
   * نسخ الكود للحافظة
   * 
   * @behavior
   * 1. ينسخ المحتوى
   * 2. يظهر رسالة "تم النسخ" لمدة 2 ثانية
   */
  const handleCopy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // تحويل اسم اللغة للعرض
  const displayLanguage = language === 'lua' ? 'Lua' : language;

  return (
    <div className="group relative my-4 rounded-lg border border-border bg-muted overflow-hidden">
      {/* ─────────────────────────────────────────────────────────────────────
          HEADER: Language name + Copy button
          ───────────────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background/50">
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
          {displayLanguage || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
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
      </div>
      
      {/* ─────────────────────────────────────────────────────────────────────
          CODE CONTENT
          ───────────────────────────────────────────────────────────────────── */}
      <SyntaxHighlighter
        language={language || 'text'}
        style={oneDark}
        showLineNumbers
        customStyle={{
          margin: 0,
          padding: '1rem',
          background: 'transparent',
          fontSize: '0.875rem',
        }}
        lineNumberStyle={{
          color: 'hsl(var(--muted-foreground))',
          opacity: 0.4,
          minWidth: '2.5em',
        }}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  );
});

CodeBlock.displayName = 'CodeBlock';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * مكون عرض النص المتدفق
 * 
 * @algorithm
 * 1. عند وصول محتوى جديد، يُضاف للـ buffer
 * 2. requestAnimationFrame يكشف الحروف تدريجياً
 * 3. السرعة تتكيف: أسرع عند التأخر، أبطأ عند المواكبة
 * 4. عند انتهاء البث، يُكشف كل المحتوى المتبقي
 * 
 * @example
 * ```tsx
 * <StreamingText content={message.content} isStreaming={message.isStreaming} />
 * ```
 */
export const StreamingText = memo(({ content, isStreaming }: StreamingTextProps) => {
  // ─────────────────────────────────────────────────────────────────────────
  // STATE & REFS
  // ─────────────────────────────────────────────────────────────────────────
  
  /** المحتوى المعروض حالياً */
  const [displayedContent, setDisplayedContent] = useState('');
  
  /** آخر قيمة محتوى (للمقارنة) */
  const contentRef = useRef(content);
  
  /** موضع الحرف الحالي */
  const indexRef = useRef(0);
  
  /** معرف الأنميشن */
  const animationRef = useRef<number>();
  
  /** وقت آخر تحديث */
  const lastUpdateRef = useRef(0);

  // ─────────────────────────────────────────────────────────────────────────
  // STREAMING ANIMATION EFFECT
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    // التحقق من تغير المحتوى
    if (content !== contentRef.current) {
      const newChars = content.slice(contentRef.current.length);
      contentRef.current = content;
      
      // إذا كان البث نشطاً ووصل محتوى جديد
      if (isStreaming && newChars) {
        // إلغاء الأنميشن السابقة
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }

        /**
         * دالة الأنميشن - تكشف الحروف تدريجياً
         * 
         * @param timestamp - الوقت من requestAnimationFrame
         * 
         * @algorithm
         * - حساب الفارق الزمني منذ آخر تحديث
         * - تحديد عدد الحروف للكشف (adaptive)
         * - تحديث المحتوى المعروض
         * - جدولة الإطار التالي إذا لم ننتهِ
         */
        const animateChars = (timestamp: number) => {
          const timeDelta = timestamp - lastUpdateRef.current;
          
          // سرعة تكيفية: أسرع عند التأخر
          const charsToReveal = Math.max(1, Math.ceil(timeDelta / 15));
          const targetIndex = Math.min(indexRef.current + charsToReveal, content.length);
          
          if (indexRef.current < targetIndex) {
            indexRef.current = targetIndex;
            setDisplayedContent(content.slice(0, indexRef.current));
            lastUpdateRef.current = timestamp;
          }

          // استمرار الأنميشن إذا لم ننتهِ
          if (indexRef.current < content.length) {
            animationRef.current = requestAnimationFrame(animateChars);
          }
        };

        lastUpdateRef.current = performance.now();
        animationRef.current = requestAnimationFrame(animateChars);
      }
    }

    // عند انتهاء البث، كشف كل المحتوى المتبقي
    if (!isStreaming && content) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      /**
       * كشف نهائي سلس
       * 
       * @behavior
       * يكشف المحتوى المتبقي بخطوات أكبر لإنهاء سريع
       */
      const finalReveal = () => {
        const remaining = content.length - indexRef.current;
        if (remaining > 0) {
          const step = Math.max(1, Math.ceil(remaining / 10));
          indexRef.current = Math.min(indexRef.current + step, content.length);
          setDisplayedContent(content.slice(0, indexRef.current));
          
          if (indexRef.current < content.length) {
            animationRef.current = requestAnimationFrame(finalReveal);
          }
        }
      };
      
      animationRef.current = requestAnimationFrame(finalReveal);
    }

    // تنظيف عند إلغاء المكون
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [content, isStreaming]);

  // ─────────────────────────────────────────────────────────────────────────
  // RESET EFFECT
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * إعادة ضبط عند رسالة جديدة
   */
  useEffect(() => {
    if (!content) {
      contentRef.current = '';
      indexRef.current = 0;
      setDisplayedContent('');
    }
  }, [content]);

  // ─────────────────────────────────────────────────────────────────────────
  // MARKDOWN COMPONENTS CONFIGURATION
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * تكوين مكونات ReactMarkdown
   * 
   * @note
   * يتم استخدام نفس التكوين لكلا الحالتين (streaming/complete)
   */
  const markdownComponents = {
    code({ className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      const isInline = !match && !className;

      if (isInline) {
        return (
          <code
            className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono text-sm"
            {...props}
          >
            {children}
          </code>
        );
      }

      return (
        <CodeBlock language={match ? match[1] : ''}>
          {String(children).replace(/\n$/, '')}
        </CodeBlock>
      );
    },
    p({ children }: any) {
      return <p className="mb-4 last:mb-0 leading-relaxed text-foreground/90">{children}</p>;
    },
    ul({ children }: any) {
      return <ul className="list-disc pl-6 mb-4 space-y-2 text-foreground/90">{children}</ul>;
    },
    ol({ children }: any) {
      return <ol className="list-decimal pl-6 mb-4 space-y-2 text-foreground/90">{children}</ol>;
    },
    strong({ children }: any) {
      return <strong className="font-semibold text-foreground">{children}</strong>;
    },
    h1({ children }: any) {
      return <h1 className="text-xl font-bold mb-4 text-foreground">{children}</h1>;
    },
    h2({ children }: any) {
      return <h2 className="text-lg font-semibold mb-3 text-foreground">{children}</h2>;
    },
    h3({ children }: any) {
      return <h3 className="text-base font-semibold mb-2 text-foreground">{children}</h3>;
    },
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  // المحتوى المكتمل (بدون مؤشر)
  if (!isStreaming && content && displayedContent.length >= content.length) {
    return (
      <div
        className="prose prose-invert prose-sm max-w-none streaming-text"
        aria-live="off"
      >
        <ReactMarkdown components={markdownComponents}>
          {content}
        </ReactMarkdown>
      </div>
    );
  }

  // المحتوى أثناء البث (مع مؤشر)
  return (
    <div
      className="prose prose-invert prose-sm max-w-none streaming-text"
      aria-live="polite"
      aria-atomic="false"
      aria-relevant="additions text"
    >
      <ReactMarkdown components={markdownComponents}>
        {displayedContent}
      </ReactMarkdown>
      {/* مؤشر الكتابة الوامض */}
      {isStreaming && (
        <span className="inline-block w-0.5 h-4 bg-foreground ml-0.5 streaming-cursor" />
      )}
    </div>
  );
});

StreamingText.displayName = 'StreamingText';
