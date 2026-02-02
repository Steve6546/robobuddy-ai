import { useState, useEffect, useRef, memo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';

interface StreamingTextProps {
  content: string;
  isStreaming: boolean;
}

const CodeBlock = memo(({ language, children }: { language: string; children: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayLanguage = language === 'lua' ? 'Lua' : language;

  return (
    <div className="group relative my-4 rounded-lg border border-border bg-muted overflow-hidden">
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

export const StreamingText = memo(({ content, isStreaming }: StreamingTextProps) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const contentRef = useRef(content);
  const indexRef = useRef(0);
  const animationRef = useRef<number>();
  const lastUpdateRef = useRef(0);

  useEffect(() => {
    // If content changed significantly (new chunk arrived)
    if (content !== contentRef.current) {
      const newChars = content.slice(contentRef.current.length);
      contentRef.current = content;
      
      // If streaming and we have new content, animate it
      if (isStreaming && newChars) {
        // Cancel existing animation
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }

        const animateChars = (timestamp: number) => {
          // Calculate characters to reveal based on time elapsed
          // This creates a smooth, model-speed-coupled animation
          const timeDelta = timestamp - lastUpdateRef.current;
          
          // Adaptive speed: faster when catching up, slower when keeping pace
          const charsToReveal = Math.max(1, Math.ceil(timeDelta / 15));
          const targetIndex = Math.min(indexRef.current + charsToReveal, content.length);
          
          if (indexRef.current < targetIndex) {
            indexRef.current = targetIndex;
            setDisplayedContent(content.slice(0, indexRef.current));
            lastUpdateRef.current = timestamp;
          }

          if (indexRef.current < content.length) {
            animationRef.current = requestAnimationFrame(animateChars);
          }
        };

        lastUpdateRef.current = performance.now();
        animationRef.current = requestAnimationFrame(animateChars);
      }
    }

    // When streaming ends, ensure all content is displayed
    if (!isStreaming && content) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      // Smooth final reveal
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

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [content, isStreaming]);

  // Reset when content is empty (new message)
  useEffect(() => {
    if (!content) {
      contentRef.current = '';
      indexRef.current = 0;
      setDisplayedContent('');
    }
  }, [content]);

  // For non-streaming content, show immediately
  if (!isStreaming && content && displayedContent.length >= content.length) {
    return (
      <div className="prose prose-invert prose-sm max-w-none streaming-text">
        <ReactMarkdown
          components={{
            code({ node, className, children, ...props }) {
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
            p({ children }) {
              return <p className="mb-4 last:mb-0 leading-relaxed text-foreground/90">{children}</p>;
            },
            ul({ children }) {
              return <ul className="list-disc pl-6 mb-4 space-y-2 text-foreground/90">{children}</ul>;
            },
            ol({ children }) {
              return <ol className="list-decimal pl-6 mb-4 space-y-2 text-foreground/90">{children}</ol>;
            },
            strong({ children }) {
              return <strong className="font-semibold text-foreground">{children}</strong>;
            },
            h1({ children }) {
              return <h1 className="text-xl font-bold mb-4 text-foreground">{children}</h1>;
            },
            h2({ children }) {
              return <h2 className="text-lg font-semibold mb-3 text-foreground">{children}</h2>;
            },
            h3({ children }) {
              return <h3 className="text-base font-semibold mb-2 text-foreground">{children}</h3>;
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  }

  // Streaming content with cursor
  return (
    <div className="prose prose-invert prose-sm max-w-none streaming-text">
      <ReactMarkdown
        components={{
          code({ node, className, children, ...props }) {
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
          p({ children }) {
            return <p className="mb-4 last:mb-0 leading-relaxed text-foreground/90">{children}</p>;
          },
          ul({ children }) {
            return <ul className="list-disc pl-6 mb-4 space-y-2 text-foreground/90">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal pl-6 mb-4 space-y-2 text-foreground/90">{children}</ol>;
          },
          strong({ children }) {
            return <strong className="font-semibold text-foreground">{children}</strong>;
          },
          h1({ children }) {
            return <h1 className="text-xl font-bold mb-4 text-foreground">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="text-lg font-semibold mb-3 text-foreground">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="text-base font-semibold mb-2 text-foreground">{children}</h3>;
          },
        }}
      >
        {displayedContent}
      </ReactMarkdown>
      {isStreaming && (
        <span className="inline-block w-0.5 h-4 bg-foreground ml-0.5 streaming-cursor" />
      )}
    </div>
  );
});

StreamingText.displayName = 'StreamingText';
