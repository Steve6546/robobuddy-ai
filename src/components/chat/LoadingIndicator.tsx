import { cn } from '@/lib/utils';

interface LoadingIndicatorProps {
  className?: string;
}

export const LoadingIndicator = ({ className }: LoadingIndicatorProps) => {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Circular spinner like ChatGPT */}
      <div className="loading-spinner" />
      <span className="text-sm text-muted-foreground">جاري التفكير...</span>
    </div>
  );
};
