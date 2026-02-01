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
  const pendingAttachments = useChatStore((state) => state.pendingAttachments);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (content: string, attachments: typeof pendingAttachments) => {
    sendMessage(content, attachments);
  };

  const handleQuickPrompt = (prompt: string) => {
    sendMessage(prompt, []);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <ChatHeader onOpenSidebar={() => setSidebarOpen(true)} />

      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <WelcomeScreen onPromptClick={handleQuickPrompt} />
        ) : (
          <div className="divide-y divide-border/30">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <ChatInput onSend={handleSend} disabled={isLoading} />

      <ConversationSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
    </div>
  );
};
