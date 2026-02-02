import { cn } from '@/lib/utils';

interface ThinkingIndicatorProps {
  className?: string;
  isVisible: boolean;
}

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
      {/* Circular spinner - ChatGPT style */}
      <div className="thinking-spinner" />
      <span className="text-sm text-muted-foreground animate-pulse-subtle">
        جاري التفكير...
      </span>
    </div>
  );
};
