import { useRef, useEffect, useState } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ChatHeader } from './ChatHeader';
import { WelcomeScreen } from './WelcomeScreen';
import { ConversationSidebar } from './ConversationSidebar';
import { useChat } from '@/hooks/useChat';
import { useChatStore } from '@/stores/chatStore';

export const ChatContainer = () => {
  const { messages, isLoading, sendMessage } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const pendingAttachments = useChatStore((state) => state.pendingAttachments);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-scroll during streaming
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.isStreaming) {
      scrollToBottom();
    }
  }, [messages[messages.length - 1]?.content]);

  const handleSend = (content: string, attachments: typeof pendingAttachments) => {
    sendMessage(content, attachments);
  };

  const handleQuickPrompt = (prompt: string) => {
    sendMessage(prompt, []);
  };

  return (
    <div className="fixed inset-0 flex bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <ConversationSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isMobile={false}
      />

      {/* Main content area - fixed layout */}
      <main className="flex-1 flex flex-col min-w-0 h-full">
        {/* Fixed Header */}
        <ChatHeader onOpenSidebar={() => setSidebarOpen(!sidebarOpen)} />

        {/* Scrollable message area - ONLY scrollable element */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth"
        >
          {messages.length === 0 ? (
            <WelcomeScreen onPromptClick={handleQuickPrompt} />
          ) : (
            <div className="divide-y divide-border/30">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              <div ref={messagesEndRef} className="h-1" />
            </div>
          )}
        </div>

        {/* Fixed Input Area */}
        <ChatInput onSend={handleSend} disabled={isLoading} />
      </main>

      {/* Mobile Sidebar Overlay */}
      <ConversationSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isMobile={true}
      />
    </div>
  );
};
