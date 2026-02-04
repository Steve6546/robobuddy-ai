/**
 * @fileoverview الحاوية الرئيسية للدردشة - Main Chat Container
 * 
 * @description
 * هذا المكون هو الحاوية الرئيسية التي تجمع جميع أجزاء واجهة الدردشة.
 * يدير:
 * - عرض الرسائل
 * - التمرير التلقائي
 * - الشريط الجانبي للمحادثات
 * - المساحة الفارغة عند عدم وجود رسائل
 * 
 * @dependencies
 * - useChat: للحصول على الرسائل وإرسالها
 * - useChatStore: للمرفقات المعلقة
 * - All chat components
 * 
 * @layout
 * ```
 * ┌─────────────────────────────────────────────────────────────┐
 * │  ┌──────────────┐  ┌────────────────────────────────────┐  │
 * │  │              │  │           ChatHeader               │  │
 * │  │   Sidebar    │  ├────────────────────────────────────┤  │
 * │  │  (Desktop)   │  │                                    │  │
 * │  │              │  │         Messages Area              │  │
 * │  │              │  │                                    │  │
 * │  │              │  ├────────────────────────────────────┤  │
 * │  │              │  │           ChatInput                │  │
 * │  └──────────────┘  └────────────────────────────────────┘  │
 * └─────────────────────────────────────────────────────────────┘
 * ```
 * 
 * @accessibility
 * - يدعم التنقل بلوحة المفاتيح
 * - يدعم RTL (العربية)
 * 
 * @performance
 * - يستخدم refs لتجنب re-renders غير ضرورية
 * - التمرير السلس مع requestAnimationFrame
 */

import { useRef, useEffect, useState } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ChatHeader } from './ChatHeader';
import { ConversationSidebar } from './ConversationSidebar';
import { useChat } from '@/hooks/useChat';
import { useChatStore } from '@/stores/chatStore';

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * حاوية الدردشة الرئيسية
 * 
 * @example
 * ```tsx
 * // في Index.tsx
 * const Index = () => {
 *   return <ChatContainer />;
 * };
 * ```
 */
export const ChatContainer = () => {
  // ─────────────────────────────────────────────────────────────────────────
  // HOOKS & STATE
  // ─────────────────────────────────────────────────────────────────────────
  
  const { messages, isLoading, sendMessage } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const pendingAttachments = useChatStore((state) => state.pendingAttachments);
  
  /** حالة فتح/إغلاق الشريط الجانبي */
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // ─────────────────────────────────────────────────────────────────────────
  // AUTO-SCROLL LOGIC
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * التمرير السلس لأسفل القائمة
   * 
   * @behavior
   * يستخدم scrollTo مع behavior: 'smooth' للحركة الناعمة
   */
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  /**
   * التمرير التلقائي عند تغير الرسائل
   * 
   * @triggers
   * - إضافة رسالة جديدة
   * - تغير المحادثة
   */
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * التمرير أثناء البث (streaming)
   * 
   * @triggers
   * - تحديث محتوى الرسالة الأخيرة أثناء البث
   * 
   * @note
   * يتحقق من isStreaming لتجنب التمرير غير الضروري
   */
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.isStreaming) {
      scrollToBottom();
    }
  }, [messages[messages.length - 1]?.content]);

  // ─────────────────────────────────────────────────────────────────────────
  // EVENT HANDLERS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * معالج إرسال الرسالة
   * 
   * @param content - نص الرسالة
   * @param attachments - المرفقات
   */
  const handleSend = (content: string, attachments: typeof pendingAttachments) => {
    sendMessage(content, attachments);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 flex bg-background overflow-hidden">
      {/* ═══════════════════════════════════════════════════════════════════
          DESKTOP SIDEBAR
          ═══════════════════════════════════════════════════════════════════ */}
      <ConversationSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isMobile={false}
      />

      {/* ═══════════════════════════════════════════════════════════════════
          MAIN CONTENT AREA
          ═══════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 flex flex-col min-w-0 h-full">
        {/* ───────────────────────────────────────────────────────────────────
            HEADER: Fixed at top
            ─────────────────────────────────────────────────────────────────── */}
        <ChatHeader onOpenSidebar={() => setSidebarOpen(!sidebarOpen)} />

        {/* ───────────────────────────────────────────────────────────────────
            MESSAGES AREA: Only scrollable element
            
            @note
            overflow-y-auto هنا فقط، باقي الصفحة ثابتة
            ─────────────────────────────────────────────────────────────────── */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth"
        >
          <div className="divide-y divide-border/30">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {/* عنصر فارغ للتمرير لأسفله */}
            <div ref={messagesEndRef} className="h-1" />
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────────────
            INPUT AREA: Fixed at bottom
            ─────────────────────────────────────────────────────────────────── */}
        <ChatInput onSend={handleSend} disabled={isLoading} />
      </main>

      {/* ═══════════════════════════════════════════════════════════════════
          MOBILE SIDEBAR OVERLAY
          
          @note
          يظهر فوق المحتوى على الشاشات الصغيرة
          ═══════════════════════════════════════════════════════════════════ */}
      <ConversationSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isMobile={true}
      />
    </div>
  );
};
