import { MessageSquare, Plus, Trash2, X } from 'lucide-react';
import { useChatStore, Conversation } from '@/stores/chatStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ConversationSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConversationSidebar = ({ isOpen, onClose }: ConversationSidebarProps) => {
  const {
    conversations,
    currentConversationId,
    createConversation,
    setCurrentConversation,
    deleteConversation,
  } = useChatStore();

  const handleNewChat = () => {
    createConversation();
    onClose();
  };

  const handleSelectConversation = (id: string) => {
    setCurrentConversation(id);
    onClose();
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

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 right-0 h-full w-80 bg-card border-l border-border z-50',
          'transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">المحادثات</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* New Chat Button */}
          <div className="p-4">
            <Button
              onClick={handleNewChat}
              className="w-full gap-2 bg-foreground text-background hover:bg-foreground/90"
            >
              <Plus className="h-4 w-4" />
              محادثة جديدة
            </Button>
          </div>

          {/* Conversations List */}
          <ScrollArea className="flex-1 px-2">
            <div className="space-y-1 pb-4">
              {conversations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  لا توجد محادثات سابقة
                </div>
              ) : (
                conversations.map((conversation) => (
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
                    <MessageSquare className="h-5 w-5 mt-0.5 flex-shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {conversation.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(conversation.updatedAt)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDeleteConversation(e, conversation.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/20 rounded transition-all"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </button>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              المحادثات محفوظة محلياً
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
