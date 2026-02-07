/**
 * @fileoverview الشريط الجانبي للمحادثات - Conversations Sidebar
 * 
 * @description
 * يعرض قائمة المحادثات السابقة مع:
 * - إنشاء محادثة جديدة
 * - البحث في المحادثات
 * - حذف المحادثات
 * - التنقل بين المحادثات
 * 
 * @responsive
 * - Desktop: شريط جانبي ثابت
 * - Mobile: overlay مع backdrop
 * 
 * @accessibility
 * - aria-labels على جميع الأزرار
 * - focus-visible للتنقل بلوحة المفاتيح
 * - role="listbox" للقائمة
 */

import { MessageSquare, Plus, Trash2, X, Search } from 'lucide-react';
import { useChatStore, Conversation } from '@/stores/chatStore';
import { cn } from '@/lib/utils';
import { formatRelativeDate } from '@/lib/dateUtils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { UserMenu } from '@/components/auth/UserMenu';
import { useState, useMemo } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface ConversationSidebarProps {
  /** هل الشريط مفتوح؟ */
  isOpen: boolean;
  /** دالة الإغلاق */
  onClose: () => void;
  /** هل هذا عرض الموبايل؟ */
  isMobile?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * الحد الأقصى لعرض معاينة الرسالة
 * @value 80 حرف
 */
const MAX_PREVIEW_LENGTH = 80;

// ============================================================================
// COMPONENT
// ============================================================================

export const ConversationSidebar = ({ isOpen, onClose, isMobile = false }: ConversationSidebarProps) => {
  // ─────────────────────────────────────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────────────────────────────────────
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // ─────────────────────────────────────────────────────────────────────────
  // STORE
  // ─────────────────────────────────────────────────────────────────────────
  
  const conversations = useChatStore((state) => state.conversations);
  const currentConversationId = useChatStore((state) => state.currentConversationId);
  const visibleConversationsCount = useChatStore((state) => state.visibleConversationsCount);

  const {
    createConversation,
    setCurrentConversation,
    deleteConversation,
    loadMoreConversations,
  } = useChatStore.getState();

  // ─────────────────────────────────────────────────────────────────────────
  // FILTERED DATA
  // ─────────────────────────────────────────────────────────────────────────

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;

    const query = searchQuery.toLowerCase();
    return conversations.filter((c) => {
      const titleMatch = c.title.toLowerCase().includes(query);
      const messageMatch = c.messages.some((m) =>
        m.content.toLowerCase().includes(query)
      );
      return titleMatch || messageMatch;
    });
  }, [conversations, searchQuery]);

  // ─────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────────────────

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    if (q.trim()) {
      setIsSearching(true);
      setTimeout(() => setIsSearching(false), 300);
    } else {
      setIsSearching(false);
    }
  };

  const visibleConversations = filteredConversations.slice(0, visibleConversationsCount);
  const hasMore = filteredConversations.length > visibleConversationsCount;

  const handleNewChat = () => {
    createConversation();
    if (isMobile) onClose();
  };

  const handleSelectConversation = (id: string) => {
    setCurrentConversation(id);
    if (isMobile) onClose();
  };

  const handleDeleteConversation = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteConversation(id);
  };

  /**
   * اقتطاع النص مع إضافة ...
   */
  const truncateText = (text: string, maxLength: number = MAX_PREVIEW_LENGTH): string => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '...';
  };

  if (isMobile) {
    return (
      <>
        {/* Mobile Overlay Backdrop */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />
        )}

        {/* Mobile Sidebar */}
        <aside
          className={cn(
            'fixed top-0 right-0 h-full w-80 bg-card border-l border-border z-50 lg:hidden',
            'transform transition-transform duration-300 ease-out',
            isOpen ? 'translate-x-0' : 'translate-x-full'
          )}
        >
          <SidebarContent
            onClose={onClose}
            searchQuery={searchQuery}
            setSearchQuery={handleSearchChange}
            isSearching={isSearching}
            visibleConversations={visibleConversations}
            currentConversationId={currentConversationId}
            handleNewChat={handleNewChat}
            handleSelectConversation={handleSelectConversation}
            handleDeleteConversation={handleDeleteConversation}
            hasMore={hasMore}
            loadMoreConversations={loadMoreConversations}
            truncateText={truncateText}
          />
        </aside>
      </>
    );
  }

  // Desktop Sidebar
  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col h-full bg-card border-r border-border transition-all duration-300 ease-out overflow-hidden',
        isOpen ? "w-80" : "w-0 border-r-0"
      )}
    >
      <div className="w-80 h-full flex flex-col flex-shrink-0">
        <SidebarContent
          onClose={onClose}
          searchQuery={searchQuery}
          setSearchQuery={handleSearchChange}
          isSearching={isSearching}
          visibleConversations={visibleConversations}
          currentConversationId={currentConversationId}
          handleNewChat={handleNewChat}
          handleSelectConversation={handleSelectConversation}
          handleDeleteConversation={handleDeleteConversation}
          hasMore={hasMore}
          loadMoreConversations={loadMoreConversations}
          truncateText={truncateText}
        />
      </div>
    </aside>
  );
};

// ============================================================================
// SIDEBAR CONTENT COMPONENT
// ============================================================================

interface SidebarContentProps {
  onClose: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isSearching?: boolean;
  visibleConversations: Conversation[];
  currentConversationId: string | null;
  handleNewChat: () => void;
  handleSelectConversation: (id: string) => void;
  handleDeleteConversation: (e: React.MouseEvent, id: string) => void;
  hasMore: boolean;
  loadMoreConversations: () => void;
  truncateText: (text: string, maxLength?: number) => string;
}

/**
 * محتوى الشريط الجانبي
 * 
 * @description
 * مكون داخلي يعرض محتوى الشريط الجانبي.
 * تم فصله لإعادة الاستخدام بين Desktop و Mobile.
 */
function SidebarContent({
  onClose,
  searchQuery,
  setSearchQuery,
  isSearching,
  visibleConversations,
  currentConversationId,
  handleNewChat,
  handleSelectConversation,
  handleDeleteConversation,
  hasMore,
  loadMoreConversations,
  truncateText
}: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ═══════════════════════════════════════════════════════════════════
          HEADER
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">المحادثات</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="إغلاق القائمة الجانبية"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" strokeWidth={2} />
        </Button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          ACTION AREA
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex-shrink-0 p-4 space-y-3">
        {/* New Chat Button */}
        <Button
          onClick={handleNewChat}
          className="w-full gap-2 bg-foreground text-background hover:bg-foreground/90"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          محادثة جديدة
        </Button>

        {/* Search Input */}
        <div className="relative">
          <Search className={cn(
            "absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-all",
            isSearching && "animate-pulse scale-110 text-foreground"
          )} strokeWidth={2} />
          <Input
            placeholder="بحث في المحادثات..."
            aria-label="بحث في المحادثات"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-9"
          />
          {isSearching && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <div className="thinking-spinner !w-3 !h-3 !border-[1.5px]" />
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          CONVERSATIONS LIST
          
          @accessibility
          - role="listbox" للقائمة
          - aria-selected للعنصر النشط
          ═══════════════════════════════════════════════════════════════════ */}
      <ScrollArea className="flex-1 px-2">
        <div 
          role="listbox" 
          aria-label="قائمة المحادثات"
          className="space-y-1 pb-4"
        >
          {visibleConversations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {searchQuery ? 'لا توجد نتائج للبحث' : 'لا توجد محادثات سابقة'}
            </div>
          ) : (
            <>
              {visibleConversations.map((conversation) => {
                const lastMessage = conversation.messages[conversation.messages.length - 1];
                const isActive = conversation.id === currentConversationId;

                return (
                  <div
                    key={conversation.id}
                    role="option"
                    aria-selected={isActive}
                    className={cn(
                      'group flex items-center gap-2 rounded-lg p-2.5 text-right transition-colors duration-200',
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-foreground hover:bg-muted focus-within:bg-muted'
                    )}
                  >
                    {/* Main Button - Compact Layout */}
                    <button
                      type="button"
                      onClick={() => handleSelectConversation(conversation.id)}
                      className="flex flex-1 items-center gap-2.5 text-right outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded-md min-w-0"
                    >
                      {/* Icon */}
                      <div className="relative flex-shrink-0">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
                        {conversation.unreadCount > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                          </span>
                        )}
                      </div>
                      
                      {/* Content - Single Line */}
                      <div className="flex-1 min-w-0 flex items-center gap-2">
                        <p className="text-sm font-medium truncate flex-1">
                          {conversation.title}
                        </p>
                        <span className="text-[10px] text-muted-foreground flex-shrink-0">
                          {formatRelativeDate(conversation.updatedAt)}
                        </span>
                        {conversation.unreadCount > 0 && (
                          <Badge variant="default" className="h-4 px-1 min-w-[1rem] text-[10px] flex-shrink-0">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </button>
                    
                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteConversation(e, conversation.id)}
                      aria-label="حذف المحادثة"
                      className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-destructive p-1.5 hover:bg-destructive/20 rounded transition-all flex-shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" strokeWidth={2} />
                    </button>
                  </div>
                );
              })}

              {hasMore && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadMoreConversations}
                  className="w-full mt-2 text-muted-foreground hover:text-foreground"
                >
                  تحميل المزيد
                </Button>
              )}
            </>
          )}
        </div>
      </ScrollArea>

      {/* ═══════════════════════════════════════════════════════════════════
          FOOTER - User Menu
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex-shrink-0 border-t border-border">
        <UserMenu />
      </div>
    </div>
  );
}
