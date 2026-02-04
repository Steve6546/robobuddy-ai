/**
 * @fileoverview مكون حقل إدخال الرسائل - Chat Input Component
 * 
 * @description
 * يوفر:
 * - حقل نص قابل للتمدد تلقائياً
 * - زر إرسال
 * - قائمة إضافة مرفقات (صور/ملفات)
 * - معاينة المرفقات المعلقة
 * - حفظ المسودة تلقائياً
 * 
 * @dependencies
 * - useChatStore: للمرفقات والمسودة
 * - Shadcn UI components
 * 
 * @accessibility
 * - aria-label على جميع الأزرار
 * - dir="auto" للنص
 * - دعم لوحة المفاتيح (Enter للإرسال)
 * 
 * @keyboard
 * - Enter: إرسال الرسالة
 * - Shift+Enter: سطر جديد
 */

import { useState, useRef, useCallback, KeyboardEvent, useEffect } from 'react';
import { Send, Plus, ImageIcon, FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChatStore, Attachment } from '@/stores/chatStore';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// ============================================================================
// TYPES
// ============================================================================

interface ChatInputProps {
  /** دالة الإرسال */
  onSend: (content: string, attachments: Attachment[]) => void;
  /** هل الإدخال معطل؟ (أثناء التحميل) */
  disabled?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * الحد الأقصى لارتفاع حقل النص (بالبكسل)
 * 
 * @value 160px (~6 أسطر)
 */
const MAX_TEXTAREA_HEIGHT = 160;

/**
 * أنواع الملفات المسموح بها
 */
const ALLOWED_FILE_TYPES = '.txt,.pdf,.doc,.docx,.lua,.json,.xml';

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * مكون حقل إدخال الدردشة
 * 
 * @example
 * ```tsx
 * <ChatInput 
 *   onSend={(content, attachments) => sendMessage(content, attachments)} 
 *   disabled={isLoading} 
 * />
 * ```
 */
export const ChatInput = ({ onSend, disabled }: ChatInputProps) => {
  // ─────────────────────────────────────────────────────────────────────────
  // STATE & REFS
  // ─────────────────────────────────────────────────────────────────────────
  
  /** قيمة حقل النص */
  const [value, setValue] = useState('');
  
  /** مرجع حقل النص */
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  /** مرجع إدخال الملفات */
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  /** مرجع إدخال الصور */
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  // ─────────────────────────────────────────────────────────────────────────
  // STORE SUBSCRIPTIONS
  // ─────────────────────────────────────────────────────────────────────────
  
  const currentConversationId = useChatStore(state => state.currentConversationId);
  const pendingAttachments = useChatStore(state => state.pendingAttachments);
  
  // Actions (stable references)
  const { addAttachment, removeAttachment, clearAttachments, setDraft } = useChatStore.getState();

  // ─────────────────────────────────────────────────────────────────────────
  // EFFECTS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * تحميل المسودة عند تغيير المحادثة
   * 
   * @triggers
   * - تغيير currentConversationId
   * 
   * @behavior
   * 1. يجلب المسودة المحفوظة للمحادثة
   * 2. يحدث قيمة الحقل
   * 3. يعيد حساب ارتفاع الحقل
   */
  useEffect(() => {
    const conversation = useChatStore.getState().conversations.find(c => c.id === currentConversationId);
    setValue(conversation?.draft || '');

    // إعادة حساب الارتفاع بعد تحديث القيمة
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
      }
    }, 0);
  }, [currentConversationId]);

  // ─────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * تحديث ارتفاع حقل النص تلقائياً
   * 
   * @behavior
   * يتمدد الحقل مع المحتوى حتى MAX_TEXTAREA_HEIGHT
   */
  const handleResize = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
    }
  }, []);

  /**
   * إرسال الرسالة
   * 
   * @guards
   * - لا يرسل إذا كان disabled
   * - لا يرسل إذا كان المحتوى فارغاً ولا يوجد مرفقات
   * 
   * @sideEffects
   * - يمسح حقل النص
   * - يمسح المسودة
   * - يمسح المرفقات المعلقة
   * - يعيد الارتفاع للافتراضي
   */
  const handleSubmit = useCallback(() => {
    // Guard Clauses
    if (disabled) return;
    if (!value.trim() && pendingAttachments.length === 0) return;
    
    // إرسال
    onSend(value.trim(), pendingAttachments);
    
    // تنظيف
    setValue('');
    if (currentConversationId) {
      setDraft(currentConversationId, '');
    }
    clearAttachments();
    
    // إعادة ضبط الارتفاع
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [value, pendingAttachments, disabled, onSend, clearAttachments, currentConversationId, setDraft]);

  /**
   * معالج ضغط المفاتيح
   * 
   * @behavior
   * - Enter: إرسال
   * - Shift+Enter: سطر جديد
   */
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  /**
   * معالجة الملف المرفق
   * 
   * @param file - الملف المختار
   * @param type - نوع المرفق (image/file)
   * 
   * @behavior
   * 1. ينشئ URL مؤقت للعرض
   * 2. يحول الملف إلى base64
   * 3. يضيف المرفق للمتجر
   */
  const processFile = async (file: File, type: 'image' | 'file') => {
    const url = URL.createObjectURL(file);
    const reader = new FileReader();
    
    reader.onload = () => {
      const base64 = reader.result as string;
      addAttachment({
        type,
        name: file.name,
        url,
        base64: base64.split(',')[1], // إزالة data:mime/type;base64,
        mimeType: file.type
      });
    };
    
    reader.readAsDataURL(file);
  };

  /**
   * معالج اختيار الصور
   */
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => processFile(file, 'image'));
    }
    e.target.value = ''; // إعادة ضبط للسماح باختيار نفس الملف
  };

  /**
   * معالج اختيار الملفات
   */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => processFile(file, 'file'));
    }
    e.target.value = '';
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex-shrink-0 border-t border-border bg-card/50 backdrop-blur-xl px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
      {/* ═══════════════════════════════════════════════════════════════════
          ATTACHMENTS PREVIEW
          ═══════════════════════════════════════════════════════════════════ */}
      {pendingAttachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {pendingAttachments.map(attachment => (
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
                <FileText className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
              )}
              <span className="text-sm text-foreground max-w-28 truncate">
                {attachment.name}
              </span>
              {/* 
                زر الإزالة
                @accessibility focus-visible:opacity-100 للوصول بلوحة المفاتيح
              */}
              <button 
                onClick={() => removeAttachment(attachment.id)} 
                aria-label="إزالة المرفق"
                className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring transition-opacity"
              >
                <X className="h-3 w-3" strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          INPUT ROW
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="gap-2 flex-row flex items-end justify-end">
        {/* ───────────────────────────────────────────────────────────────────
            ATTACHMENT BUTTON
            ─────────────────────────────────────────────────────────────────── */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              aria-label="إضافة مرفقات"
              className={cn(
                "h-10 w-10 rounded-xl border border-border bg-muted text-muted-foreground transition-all flex-shrink-0",
                "hover:bg-accent hover:text-foreground",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              )}
            >
              <Plus className="h-5 w-5" strokeWidth={2} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            <DropdownMenuItem onClick={() => imageInputRef.current?.click()}>
              <ImageIcon className="h-4 w-4 mr-2" strokeWidth={2} />
              رفع صورة
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
              <FileText className="h-4 w-4 mr-2" strokeWidth={2} />
              رفع ملف
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* ───────────────────────────────────────────────────────────────────
            HIDDEN FILE INPUTS
            ─────────────────────────────────────────────────────────────────── */}
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
          accept={ALLOWED_FILE_TYPES}
          multiple 
          className="hidden" 
          onChange={handleFileSelect} 
        />

        {/* ───────────────────────────────────────────────────────────────────
            TEXT INPUT
            ─────────────────────────────────────────────────────────────────── */}
        <div className="flex-1 relative">
          <textarea 
            ref={textareaRef} 
            value={value} 
            onChange={e => {
              const newValue = e.target.value;
              setValue(newValue);
              handleResize();
              
              // حفظ المسودة تلقائياً
              if (currentConversationId) {
                setDraft(currentConversationId, newValue);
              }
            }} 
            onKeyDown={handleKeyDown} 
            placeholder="اسأل عن Roblox Studio..." 
            aria-label="اكتب رسالتك هنا"
            disabled={disabled} 
            rows={1} 
            dir="auto" 
            className={cn(
              'w-full resize-none rounded-xl border border-border bg-muted/50 px-4 py-3',
              'text-foreground placeholder:text-muted-foreground',
              'focus:outline-none focus:ring-1 focus:ring-foreground/30 focus:border-foreground/30',
              'transition-all duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'max-h-40'
            )} 
          />
        </div>

        {/* ───────────────────────────────────────────────────────────────────
            SEND BUTTON
            ─────────────────────────────────────────────────────────────────── */}
        <Button 
          onClick={handleSubmit} 
          disabled={disabled || (!value.trim() && pendingAttachments.length === 0)} 
          size="icon" 
          aria-label="إرسال الرسالة"
          className={cn(
            'h-10 w-10 rounded-xl border border-border transition-all duration-200 flex-shrink-0',
            'bg-foreground text-background hover:bg-foreground/90',
            'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <Send className="h-4 w-4" strokeWidth={2} />
        </Button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          FOOTER NOTE
          ═══════════════════════════════════════════════════════════════════ */}
      <p className="text-xs text-muted-foreground text-center mt-3">
        Roblox Expert · Gemini 3.0 Flash
      </p>
    </div>
  );
};
