import { create } from 'zustand';

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

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  pendingAttachments: Attachment[];
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => string;
  updateMessage: (id: string, content: string) => void;
  setMessageStreaming: (id: string, isStreaming: boolean) => void;
  setLoading: (loading: boolean) => void;
  addAttachment: (attachment: Omit<Attachment, 'id'>) => void;
  removeAttachment: (id: string) => void;
  clearAttachments: () => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  pendingAttachments: [],

  addMessage: (message) => {
    const id = crypto.randomUUID();
    const newMessage: Message = {
      ...message,
      id,
      timestamp: new Date(),
    };
    set((state) => ({
      messages: [...state.messages, newMessage],
    }));
    return id;
  },

  updateMessage: (id, content) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, content } : msg
      ),
    }));
  },

  setMessageStreaming: (id, isStreaming) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, isStreaming } : msg
      ),
    }));
  },

  setLoading: (loading) => set({ isLoading: loading }),

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

  clearMessages: () => set({ messages: [] }),
}));
