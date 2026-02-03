/**
 * @fileoverview رأس صفحة الدردشة - Chat Header Component
 * 
 * @description
 * يعرض:
 * - شعار التطبيق
 * - اسم المساعد
 * - مؤشر الاتصال
 * - زر القائمة الجانبية
 * 
 * @layout
 * ```
 * ┌────────────────────────────────────────────────────────┐
 * │  [Logo]  Roblox Expert ✨                    [Menu] 📋  │
 * │          Gemini 3.0 Flash                              │
 * └────────────────────────────────────────────────────────┘
 * ```
 * 
 * @accessibility
 * - aria-label على زر القائمة
 * - أيقونات بـ strokeWidth موحد
 */

import { Bot, Menu, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ============================================================================
// TYPES
// ============================================================================

interface ChatHeaderProps {
  /** معالج فتح/إغلاق الشريط الجانبي */
  onOpenSidebar: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * مكون رأس الصفحة
 * 
 * @example
 * ```tsx
 * <ChatHeader onOpenSidebar={() => setSidebarOpen(!sidebarOpen)} />
 * ```
 */
export const ChatHeader = ({ onOpenSidebar }: ChatHeaderProps) => {
  return (
    <header className="flex-shrink-0 flex items-center justify-between px-4 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] pb-3 border-b border-border bg-card/50 backdrop-blur-xl">
      {/* ═══════════════════════════════════════════════════════════════════
          LEFT: Logo + Info
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-3">
        {/* ───────────────────────────────────────────────────────────────────
            LOGO CONTAINER
            
            @size 40px (w-10 h-10)
            @icon Bot h-5 w-5
            ─────────────────────────────────────────────────────────────────── */}
        <div className="relative">
          <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center shadow-glow">
            <Bot className="h-5 w-5 text-background" strokeWidth={2} />
          </div>
          {/* مؤشر الاتصال (Online indicator) */}
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-foreground rounded-full border-2 border-background" />
        </div>
        
        {/* ───────────────────────────────────────────────────────────────────
            TEXT INFO
            ─────────────────────────────────────────────────────────────────── */}
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

      {/* ═══════════════════════════════════════════════════════════════════
          RIGHT: Menu Button
          ═══════════════════════════════════════════════════════════════════ */}
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
