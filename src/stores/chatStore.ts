import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Attachment {
  id: string;
  type: 'image' | 'file';
  name: string;
  url: string;
  base64?: string;
  mimeType?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: Attachment[];
  isStreaming?: boolean;
}

const EMPTY_MESSAGES: Message[] = [];

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  unreadCount: number;
  draft: string;
}

interface ChatState {
  conversations: Conversation[];
  currentConversationId: string | null;
  isLoading: boolean;
  isAssistantTyping: boolean;
  pendingAttachments: Attachment[];
  visibleConversationsCount: number;
  
  // Conversation actions
  createConversation: () => string;
  setCurrentConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  updateConversationTitle: (id: string, title: string) => void;
  loadMoreConversations: () => void;
  
  // Message actions
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>, conversationId?: string) => string;
  updateMessage: (id: string, content: string) => void;
  setMessageStreaming: (id: string, isStreaming: boolean) => void;
  setDraft: (id: string, draft: string) => void;
  
  // UI state
  setLoading: (loading: boolean) => void;
  setAssistantTyping: (isTyping: boolean) => void;
  addAttachment: (attachment: Omit<Attachment, 'id'>) => void;
  removeAttachment: (id: string) => void;
  clearAttachments: () => void;
  syncFromStorage: () => void;
  
  // Getters
  getCurrentConversation: () => Conversation | undefined;
  getMessages: () => Message[];
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      currentConversationId: null,
      isLoading: false,
      isAssistantTyping: false,
      pendingAttachments: [],
      visibleConversationsCount: 10,

      createConversation: () => {
        const state = get();
        const emptyConversation = state.conversations.find((c) => c.messages.length === 0);

        if (emptyConversation) {
          set({ currentConversationId: emptyConversation.id });
          return emptyConversation.id;
        }

        const id = crypto.randomUUID();
        const newConversation: Conversation = {
          id,
          title: 'محادثة جديدة',
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          unreadCount: 0,
          draft: '',
        };
        set((state) => ({
          conversations: [newConversation, ...state.conversations],
          currentConversationId: id,
        }));
        return id;
      },

      setCurrentConversation: (id) => {
        set((state) => ({
          currentConversationId: id,
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, unreadCount: 0 } : c
          ),
        }));
      },

      deleteConversation: (id) => {
        set((state) => {
          const newConversations = state.conversations.filter((c) => c.id !== id);
          const newCurrentId = state.currentConversationId === id
            ? (newConversations[0]?.id || null)
            : state.currentConversationId;
          return {
            conversations: newConversations,
            currentConversationId: newCurrentId,
          };
        });
      },

      updateConversationTitle: (id, title) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, title, updatedAt: new Date() } : c
          ),
        }));
      },

      loadMoreConversations: () => {
        set((state) => ({
          visibleConversationsCount: state.visibleConversationsCount + 10,
        }));
      },

      addMessage: (message, targetConversationId) => {
        const state = get();
        let conversationId = targetConversationId || state.currentConversationId;
        
        // Auto-create conversation if none exists
        if (!conversationId) {
          conversationId = get().createConversation();
        }

        const id = crypto.randomUUID();
        const newMessage: Message = {
          ...message,
          id,
          timestamp: new Date(),
        };

        set((state) => ({
          conversations: state.conversations.map((c) => {
            if (c.id === conversationId) {
              // Update title from first user message
              const shouldUpdateTitle = c.messages.length === 0 && message.role === 'user';
              const newTitle = shouldUpdateTitle 
                ? message.content.slice(0, 40) + (message.content.length > 40 ? '...' : '')
                : c.title;
              
              return {
                ...c,
                title: newTitle,
                messages: [...c.messages, newMessage],
                updatedAt: new Date(),
                unreadCount: c.id === state.currentConversationId ? 0 : c.unreadCount + 1,
              };
            }
            return c;
          }),
        }));

        return id;
      },

      updateMessage: (id, content) => {
        set((state) => ({
          conversations: state.conversations.map((c) => ({
            ...c,
            messages: c.messages.map((msg) =>
              msg.id === id ? { ...msg, content } : msg
            ),
          })),
        }));
      },

      setMessageStreaming: (id, isStreaming) => {
        set((state) => ({
          conversations: state.conversations.map((c) => ({
            ...c,
            messages: c.messages.map((msg) =>
              msg.id === id ? { ...msg, isStreaming } : msg
            ),
          })),
        }));
      },

      setDraft: (id, draft) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, draft } : c
          ),
        }));
      },

      setLoading: (loading) => set({ isLoading: loading }),

      setAssistantTyping: (isTyping) => set({ isAssistantTyping: isTyping }),

      addAttachment: (attachment) => {
        const id = crypto.randomUUID();
        set((state) => ({
          pendingAttachments: [...state.pendingAttachments, { ...attachment, id }],
        }));
      },

      removeAttachment: (id) => {
        set((state) => ({
          pendingAttachments: state.pendingAttachments.filter((a) => a.id !== id),
        }));
      },

      clearAttachments: () => set({ pendingAttachments: [] }),

      syncFromStorage: () => {
        // Triggered by storage event to reload persisted state
        const storage = localStorage.getItem('roblox-chat-storage');
        if (storage) {
          try {
            const parsed = JSON.parse(storage);
            if (parsed.state) {
              set({
                conversations: parsed.state.conversations,
                currentConversationId: parsed.state.currentConversationId,
              });
            }
          } catch (e) {
            console.error('Failed to sync from storage:', e);
          }
        }
      },

      getCurrentConversation: () => {
        const state = get();
        return state.conversations.find((c) => c.id === state.currentConversationId);
      },

      getMessages: () => {
        const state = get();
        const conversation = state.conversations.find((c) => c.id === state.currentConversationId);
        return conversation?.messages || EMPTY_MESSAGES;
      },
    }),
    {
      name: 'roblox-chat-storage',
      partialize: (state) => ({
        conversations: state.conversations,
        currentConversationId: state.currentConversationId,
      }),
    }
  )
);
