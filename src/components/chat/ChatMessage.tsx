import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, Bot, User } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Message } from '@/stores/chatStore';
import { LoadingIndicator } from './LoadingIndicator';

interface ChatMessageProps {
  message: Message;
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

export const ChatMessage = memo(({ message }: ChatMessageProps) => {
  const isUser = message.role === 'user';
  const isWaiting = message.isStreaming && !message.content;

  return (
    <div
      className={cn(
        'message-enter flex gap-3 px-4 py-5',
        isUser ? 'bg-transparent' : 'bg-card/30'
      )}
    >
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser
            ? 'bg-muted text-foreground'
            : 'bg-foreground text-background'
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            {isUser ? 'أنت' : 'Roblox Expert'}
          </span>
        </div>

        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
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

        {isWaiting ? (
          <LoadingIndicator />
        ) : (
          <div className="prose prose-invert prose-sm max-w-none">
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
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
});

ChatMessage.displayName = 'ChatMessage';
