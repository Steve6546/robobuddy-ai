/**
 * @fileoverview الحاوية الرئيسية للدردشة - Main Chat Container
 * 
 * @description
 * يدير عرض الرسائل والتمرير التلقائي والشريط الجانبي وشاشة الترحيب
 * مع زر التمرير للأسفل عند التصفح للأعلى
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ChatHeader } from './ChatHeader';
import { WelcomeScreen } from './WelcomeScreen';
import { ConversationSidebar } from './ConversationSidebar';
import { useChat } from '@/hooks/useChat';
import { useChatStore } from '@/stores/chatStore';
import { ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// COMPONENT
// ============================================================================

export const ChatContainer = () => {
  // ─────────────────────────────────────────────────────────────────────────
  // HOOKS & STATE
  // ─────────────────────────────────────────────────────────────────────────
  
  const { messages, isLoading, sendMessage, regenerateLastMessage } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const pendingAttachments = useChatStore((state) => state.pendingAttachments);
  
  /** حالة فتح/إغلاق الشريط الجانبي */
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  /** هل يجب إظهار زر التمرير للأسفل؟ */
  const [showScrollButton, setShowScrollButton] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────
  // SCROLL LOGIC
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * التمرير السلس لأسفل القائمة
   */
  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, []);

  /**
   * مراقبة موضع التمرير لإظهار/إخفاء الزر
   */
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    
    // إظهار الزر إذا كان المستخدم بعيداً عن الأسفل بأكثر من 200px
    setShowScrollButton(distanceFromBottom > 200);
  }, []);

  /**
   * التمرير التلقائي عند تغير الرسائل
   */
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  /**
   * التمرير أثناء البث
   */
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.isStreaming) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  /**
   * إضافة مستمع التمرير
   */
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // ─────────────────────────────────────────────────────────────────────────
  // EVENT HANDLERS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * معالج إرسال الرسالة
   */
  const handleSend = (content: string, attachments: typeof pendingAttachments) => {
    sendMessage(content, attachments);
  };

  /**
   * معالج إعادة التوليد
   */
  const handleRegenerate = useCallback(() => {
    if (regenerateLastMessage) {
      regenerateLastMessage();
    }
  }, [regenerateLastMessage]);

  /**
   * تحديد فهرس آخر رسالة من المساعد
   */
  const lastAssistantIndex = messages.reduce((lastIndex, msg, index) => {
    return msg.role === 'assistant' ? index : lastIndex;
  }, -1);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 flex h-[100dvh] bg-background overflow-hidden">
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
      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* ───────────────────────────────────────────────────────────────────
            HEADER
            ─────────────────────────────────────────────────────────────────── */}
        <ChatHeader onOpenSidebar={() => setSidebarOpen(!sidebarOpen)} />

        {/* ───────────────────────────────────────────────────────────────────
            MESSAGES AREA
            ─────────────────────────────────────────────────────────────────── */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth overscroll-contain touch-pan-y"
        >
          {messages.length === 0 ? (
            <WelcomeScreen />
          ) : (
            <div className="divide-y divide-border/30">
              {messages.map((message, index) => (
                <ChatMessage 
                  key={message.id} 
                  message={message}
                  isLastAssistant={index === lastAssistantIndex && message.role === 'assistant'}
                  onRegenerate={handleRegenerate}
                />
              ))}
              <div ref={messagesEndRef} className="h-1" />
            </div>
          )}
        </div>

        {/* ───────────────────────────────────────────────────────────────────
            SCROLL TO BOTTOM BUTTON
            ─────────────────────────────────────────────────────────────────── */}
        {showScrollButton && (
          <button
            onClick={scrollToBottom}
            className={cn(
              "absolute bottom-24 left-1/2 -translate-x-1/2 z-10",
              "flex items-center justify-center",
              "h-10 w-10 rounded-full",
              "bg-muted/90 backdrop-blur-sm border border-border",
              "text-foreground shadow-lg",
              "hover:bg-muted transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "animate-bounce"
            )}
            aria-label="التمرير للأسفل"
          >
            <ArrowDown className="h-5 w-5" />
          </button>
        )}

        {/* ───────────────────────────────────────────────────────────────────
            INPUT AREA
            ─────────────────────────────────────────────────────────────────── */}
        <ChatInput onSend={handleSend} disabled={isLoading} />
      </main>

      {/* ═══════════════════════════════════════════════════════════════════
          MOBILE SIDEBAR OVERLAY
          ═══════════════════════════════════════════════════════════════════ */}
      <ConversationSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isMobile={true}
      />
    </div>
  );
};
