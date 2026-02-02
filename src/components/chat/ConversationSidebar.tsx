import { MessageSquare, Plus, Trash2, X, Search } from 'lucide-react';
import { useChatStore, Conversation } from '@/stores/chatStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useState, useMemo } from 'react';

interface ConversationSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile?: boolean;
}

export const ConversationSidebar = ({ isOpen, onClose, isMobile = false }: ConversationSidebarProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const conversations = useChatStore((state) => state.conversations);
  const currentConversationId = useChatStore((state) => state.currentConversationId);
  const visibleConversationsCount = useChatStore((state) => state.visibleConversationsCount);

  const {
    createConversation,
    setCurrentConversation,
    deleteConversation,
    loadMoreConversations,
  } = useChatStore.getState();

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

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'اليوم';
    if (diffDays === 1) return 'أمس';
    if (diffDays < 7) return `منذ ${diffDays} أيام`;
    return d.toLocaleDateString('ar-SA');
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
            formatDate={formatDate}
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
          formatDate={formatDate}
        />
      </div>
    </aside>
  );
};

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
  formatDate: (date: Date) => string;
}

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
  formatDate
}: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">المحادثات</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" strokeWidth={2} />
        </Button>
      </div>

      {/* Action Area */}
      <div className="flex-shrink-0 p-4 space-y-4">
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

      {/* Conversations List - Internal scroll */}
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1 pb-4">
          {visibleConversations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {searchQuery ? 'لا توجد نتائج للبحث' : 'لا توجد محادثات سابقة'}
            </div>
          ) : (
            <>
              {visibleConversations.map((conversation) => {
                const lastMessage = conversation.messages[conversation.messages.length - 1];

                return (
                  <button
                    key={conversation.id}
                    onClick={() => handleSelectConversation(conversation.id)}
                    className={cn(
                      'w-full flex items-start gap-3 p-3 rounded-lg text-right',
                      'transition-colors duration-200 group',
                      conversation.id === currentConversationId
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-muted text-foreground'
                    )}
                  >
                    <div className="relative flex-shrink-0">
                      <MessageSquare className="h-5 w-5 mt-0.5 text-muted-foreground" strokeWidth={2} />
                      {conversation.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium truncate">
                          {conversation.title}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <Badge variant="default" className="h-4 px-1 min-w-[1rem] text-[10px]">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                      {lastMessage && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {lastMessage.content}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(conversation.updatedAt)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDeleteConversation(e, conversation.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/20 rounded transition-all flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" strokeWidth={2} />
                    </button>
                  </button>
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

      {/* Footer */}
      <div className="flex-shrink-0 p-4 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          المحادثات محفوظة محلياً
        </p>
      </div>
    </div>
  );
}
