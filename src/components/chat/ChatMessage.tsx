import { memo } from 'react';
import { Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Message } from '@/stores/chatStore';
import { ThinkingIndicator } from './ThinkingIndicator';
import { StreamingText } from './StreamingText';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage = memo(({ message }: ChatMessageProps) => {
  const isUser = message.role === 'user';
  const isWaiting = message.isStreaming && !message.content;
  const isStreaming = message.isStreaming && !!message.content;

  return (
    <div
      className={cn(
        'message-enter flex gap-3 px-4 py-5',
        isUser ? 'bg-transparent' : 'bg-card/30'
      )}
    >
      {/* Avatar - consistent 32px size for all icons */}
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

      <div className="flex-1 min-w-0 space-y-2">
        {/* Name badge */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            {isUser ? 'أنت' : 'Roblox Expert'}
          </span>
        </div>

        {/* Attachments */}
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

        {/* Content area with thinking/streaming states */}
        <div className="relative min-h-[1.5rem]">
          {/* Thinking indicator - visible when waiting for response */}
          <ThinkingIndicator isVisible={isWaiting} className="absolute inset-0" />
          
          {/* Streaming text - fades in when content arrives */}
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

ChatMessage.displayName = 'ChatMessage';
