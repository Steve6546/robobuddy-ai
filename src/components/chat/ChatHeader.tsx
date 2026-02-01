import { Bot, Trash2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChatStore } from '@/stores/chatStore';

export const ChatHeader = () => {
  const clearMessages = useChatStore((state) => state.clearMessages);
  const messagesCount = useChatStore((state) => state.messages.length);

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow">
            <Bot className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-background animate-pulse" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-foreground flex items-center gap-2">
            Roblox Studio Expert
            <Sparkles className="h-4 w-4 text-primary" />
          </h1>
          <p className="text-sm text-muted-foreground">
            Your AI-powered Roblox development assistant
          </p>
        </div>
      </div>

      {messagesCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearMessages}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear Chat
        </Button>
      )}
    </header>
  );
};
