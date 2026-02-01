import { useState, useRef, useCallback, KeyboardEvent } from 'react';
import { Send, Plus, ImageIcon, FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChatStore, Attachment } from '@/stores/chatStore';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ChatInputProps {
  onSend: (content: string, attachments: Attachment[]) => void;
  disabled?: boolean;
}

export const ChatInput = ({ onSend, disabled }: ChatInputProps) => {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const { pendingAttachments, addAttachment, removeAttachment, clearAttachments } = useChatStore();

  const handleResize = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, []);

  const handleSubmit = useCallback(() => {
    if ((!value.trim() && pendingAttachments.length === 0) || disabled) return;

    onSend(value.trim(), pendingAttachments);
    setValue('');
    clearAttachments();

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [value, pendingAttachments, disabled, onSend, clearAttachments]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const processFile = async (file: File, type: 'image' | 'file') => {
    const url = URL.createObjectURL(file);
    
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      addAttachment({
        type,
        name: file.name,
        url,
        base64: base64.split(',')[1],
        mimeType: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => processFile(file, 'image'));
    }
    e.target.value = '';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => processFile(file, 'file'));
    }
    e.target.value = '';
  };

  return (
    <div className="border-t border-border bg-card/50 backdrop-blur-xl p-4">
      {/* Attachments Preview */}
      {pendingAttachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {pendingAttachments.map((attachment) => (
            <div
              key={attachment.id}
              className="relative group flex items-center gap-2 px-3 py-2 bg-muted rounded-lg border border-border"
            >
              {attachment.type === 'image' ? (
                <img
                  src={attachment.url}
                  alt={attachment.name}
                  className="h-10 w-10 rounded object-cover"
                />
              ) : (
                <FileText className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-sm text-foreground max-w-28 truncate">
                {attachment.name}
              </span>
              <button
                onClick={() => removeAttachment(attachment.id)}
                className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Attachment Button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-xl bg-muted hover:bg-accent text-muted-foreground hover:text-foreground transition-all flex-shrink-0"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            <DropdownMenuItem onClick={() => imageInputRef.current?.click()}>
              <ImageIcon className="h-4 w-4 mr-2" />
              رفع صورة
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
              <FileText className="h-4 w-4 mr-2" />
              رفع ملف
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Hidden File Inputs */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleImageSelect}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.pdf,.doc,.docx,.lua,.json,.xml"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Text Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              handleResize();
            }}
            onKeyDown={handleKeyDown}
            placeholder="اسأل عن Roblox Studio..."
            disabled={disabled}
            rows={1}
            dir="auto"
            className={cn(
              'w-full resize-none rounded-xl border border-border bg-muted/50 px-4 py-3',
              'text-foreground placeholder:text-muted-foreground',
              'focus:outline-none focus:ring-1 focus:ring-foreground/30 focus:border-foreground/30',
              'transition-all duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          />
        </div>

        {/* Send Button */}
        <Button
          onClick={handleSubmit}
          disabled={disabled || (!value.trim() && pendingAttachments.length === 0)}
          size="icon"
          className={cn(
            'h-10 w-10 rounded-xl transition-all duration-200 flex-shrink-0',
            'bg-foreground hover:bg-foreground/90 text-background',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center mt-3">
        Roblox Expert · Gemini 3.0 Flash
      </p>
    </div>
  );
};
