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
import { Send, Plus, FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChatStore, Attachment } from '@/stores/chatStore';
import { Button } from '@/components/ui/button';

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
  
  /** مرجع إدخال المرفقات (صور + ملفات) */
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  
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
        mimeType: file.type,
        size: file.size
      });
    };
    
    reader.readAsDataURL(file);
  };

  /**
   * معالج اختيار المرفقات (صور + ملفات)
   */
  const handleAttachmentSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const isImage = file.type.startsWith('image/');
        processFile(file, isImage ? 'image' : 'file');
      });
    }
    e.target.value = '';
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  const imageAttachments = pendingAttachments.filter(attachment => attachment.type === 'image');
  const fileAttachments = pendingAttachments.filter(attachment => attachment.type === 'file');

  return (
    <div className="flex-shrink-0 border-t border-border bg-card/50 backdrop-blur-xl px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
      {/* ═══════════════════════════════════════════════════════════════════
          CENTERED CONTAINER - ChatGPT Style
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="max-w-2xl mx-auto">
        {/* ═══════════════════════════════════════════════════════════════════
            ATTACHMENTS PREVIEW
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="mb-3 flex flex-col gap-3">
          {imageAttachments.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {imageAttachments.map(attachment => (
                <div
                  key={attachment.id}
                  className="relative group rounded-xl border border-border bg-muted/60 p-1"
                >
                  <img
                    src={attachment.url}
                    alt={attachment.name}
                    className="h-20 w-full rounded-lg object-cover"
                  />
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

          {fileAttachments.length > 0 && (
            <div className="grid gap-2">
              {fileAttachments.map(attachment => (
                <div
                  key={attachment.id}
                  className="relative group flex items-center gap-3 rounded-xl border border-border bg-muted/60 px-3 py-2"
                >
                  <FileText className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
                  <span className="text-sm text-foreground truncate">
                    {attachment.name}
                  </span>
                  <button
                    onClick={() => removeAttachment(attachment.id)}
                    aria-label="إزالة المرفق"
                    className="ml-auto rounded-full p-1 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <X className="h-3 w-3" strokeWidth={2} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            INPUT BOX - Compact & Centered
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="relative rounded-2xl border border-border bg-muted/50 shadow-lg overflow-hidden">
          {/* ───────────────────────────────────────────────────────────────────
              TEXT INPUT
              ─────────────────────────────────────────────────────────────────── */}
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
              'w-full resize-none bg-transparent px-4 py-3 pr-24',
              'text-foreground placeholder:text-muted-foreground text-base',
              'focus:outline-none',
              'transition-all duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'max-h-32 min-h-[48px] overflow-y-auto',
              'border-0'
            )}
          />

          {/* ───────────────────────────────────────────────────────────────────
              ACTION BUTTONS - Inside Input
              ─────────────────────────────────────────────────────────────────── */}
          <div className="absolute right-2 bottom-2 flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="إضافة مرفقات"
              onClick={() => attachmentInputRef.current?.click()}
              className={cn(
                'h-8 w-8 rounded-lg text-muted-foreground transition-all',
                'hover:bg-accent hover:text-foreground',
                'focus-visible:ring-2 focus-visible:ring-ring'
              )}
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={disabled || (!value.trim() && pendingAttachments.length === 0)}
              size="icon"
              aria-label="إرسال الرسالة"
              className={cn(
                'h-8 w-8 rounded-lg transition-all duration-200',
                'bg-foreground text-background hover:bg-foreground/90',
                'focus-visible:ring-2 focus-visible:ring-ring',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              <Send className="h-3.5 w-3.5" strokeWidth={2} />
            </Button>
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────────────
            HIDDEN FILE INPUT
            ─────────────────────────────────────────────────────────────────── */}
        <input
          ref={attachmentInputRef}
          type="file"
          accept={`image/*,${ALLOWED_FILE_TYPES}`}
          multiple
          className="hidden"
          onChange={handleAttachmentSelect}
        />

        {/* ═══════════════════════════════════════════════════════════════════
            FOOTER NOTE
            ═══════════════════════════════════════════════════════════════════ */}
        <p className="text-xs text-muted-foreground text-center mt-3">
          Roblox Expert · Gemini 3.0 Flash
        </p>
      </div>
    </div>
  );
};
