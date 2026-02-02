import { Bot, Menu, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatHeaderProps {
  onOpenSidebar: () => void;
}

export const ChatHeader = ({ onOpenSidebar }: ChatHeaderProps) => {
  return (
    <header className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-border bg-card/50 backdrop-blur-xl safe-area-inset-top">
      <div className="flex items-center gap-3">
        {/* Logo container - consistent sizing */}
        <div className="relative">
          <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center shadow-glow">
            <Bot className="h-5 w-5 text-background" strokeWidth={2} />
          </div>
          {/* Online indicator */}
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-foreground rounded-full border-2 border-background" />
        </div>
        
        <div>
          <h1 className="text-base font-semibold text-foreground flex items-center gap-2">
            Roblox Expert
            <Sparkles className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
          </h1>
          <p className="text-xs text-muted-foreground">
            Gemini 3.0 Flash
          </p>
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={onOpenSidebar}
        aria-label="فتح القائمة الجانبية"
        className="h-10 w-10 text-muted-foreground hover:text-foreground transition-colors"
      >
        <Menu className="h-5 w-5" strokeWidth={2} />
      </Button>
    </header>
  );
};
