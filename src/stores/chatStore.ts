/**
 * @fileoverview متجر الحالة المركزي للدردشة - Central Chat State Store
 * 
 * @description
 * هذا الملف هو قلب التطبيق. يدير جميع حالات الدردشة بما في ذلك:
 * - المحادثات (Conversations)
 * - الرسائل (Messages)
 * - المرفقات (Attachments)
 * - حالات التحميل (Loading States)
 * 
 * يستخدم Zustand مع middleware للحفظ التلقائي في localStorage.
 * 
 * @dependencies
 * - zustand: إدارة الحالة
 * - zustand/middleware/persist: الحفظ المحلي
 * 
 * @impact
 * ⚠️ WARNING: أي تعديل على هذا الملف يؤثر على:
 * - جميع مكونات الدردشة (ChatContainer, ChatMessage, ChatInput, etc.)
 * - الـ Hook الرئيسي (useChat)
 * - بيانات المستخدمين المحفوظة في localStorage
 * 
 * @architecture
 * ```
 * ┌─────────────────────────────────────────────┐
 * │              ChatState                      │
 * ├─────────────────────────────────────────────┤
 * │  State:                                     │
 * │  - conversations[]                          │
 * │  - currentConversationId                    │
 * │  - isLoading, isAssistantTyping            │
 * │  - pendingAttachments[]                     │
 * ├─────────────────────────────────────────────┤
 * │  Actions:                                   │
 * │  - createConversation()                     │
 * │  - addMessage()                             │
 * │  - updateMessage()                          │
 * │  - ... (see interface)                      │
 * ├─────────────────────────────────────────────┤
 * │  Selectors:                                 │
 * │  - getCurrentConversation()                 │
 * │  - getMessages()                            │
 * └─────────────────────────────────────────────┘
 * ```
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * مرفق الرسالة (صورة أو ملف)
 * 
 * @property id - معرف فريد للمرفق
 * @property type - نوع المرفق: 'image' للصور، 'file' للملفات
 * @property name - اسم الملف الأصلي
 * @property url - رابط blob للعرض المحلي
 * @property base64 - البيانات بتنسيق base64 للإرسال إلى الخادم
 * @property mimeType - نوع MIME للملف (مثل: image/png)
 * 
 * @example
 * const imageAttachment: Attachment = {
 *   id: 'abc-123',
 *   type: 'image',
 *   name: 'screenshot.png',
 *   url: 'blob:http://...',
 *   base64: 'iVBORw0KGgo...',
 *   mimeType: 'image/png'
 * };
 */
export interface Attachment {
  id: string;
  type: 'image' | 'file';
  name: string;
  url: string;
  base64?: string;
  mimeType?: string;
  size?: number;
}

/**
 * حالة الرسالة في دورة الإرسال
 * 
 * @value 'sending' - جاري الإرسال
 * @value 'sent' - تم الإرسال للخادم
 * @value 'delivered' - تم استلام الرد
 * @value 'read' - تم عرض الرسالة للمستخدم
 * 
 * @extensionPoint
 * يمكن إضافة حالات جديدة مثل:
 * - 'failed': فشل الإرسال
 * - 'queued': في قائمة الانتظار
 */
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';

/**
 * بنية الرسالة الواحدة
 * 
 * @property id - معرف فريد (UUID v4)
 * @property role - دور المرسل: 'user' للمستخدم، 'assistant' للذكاء الاصطناعي
 * @property content - محتوى الرسالة (يدعم Markdown)
 * @property timestamp - وقت الإرسال
 * @property attachments - المرفقات (اختياري)
 * @property isStreaming - هل الرسالة قيد البث؟ (للـ AI responses)
 * @property status - حالة الإرسال
 * 
 * @example
 * const userMessage: Message = {
 *   id: 'msg-123',
 *   role: 'user',
 *   content: 'كيف أنشئ نظام حفظ البيانات؟',
 *   timestamp: new Date(),
 *   status: 'sent'
 * };
 */
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: Attachment[];
  isStreaming?: boolean;
  status?: MessageStatus;
}

/**
 * ثابت للصفيف الفارغ - يمنع إعادة إنشاء صفيف جديد في كل استدعاء
 * 
 * @optimization
 * هذا يمنع re-renders غير ضرورية عندما لا توجد رسائل
 */
const EMPTY_MESSAGES: Message[] = [];

/**
 * بنية المحادثة الواحدة
 * 
 * @property id - معرف فريد (UUID v4)
 * @property title - عنوان المحادثة (يُستخرج من أول رسالة)
 * @property messages - قائمة الرسائل
 * @property createdAt - تاريخ الإنشاء
 * @property updatedAt - تاريخ آخر تحديث
 * @property unreadCount - عدد الرسائل غير المقروءة
 * @property draft - مسودة الرسالة الحالية
 * 
 * @relationship
 * Conversation 1 ─────< Message (one-to-many)
 */
export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  unreadCount: number;
  draft: string;
}

// ============================================================================
// STATE INTERFACE
// ============================================================================

/**
 * واجهة الحالة الكاملة للمتجر
 * 
 * تنقسم إلى:
 * 1. State Properties: البيانات
 * 2. Conversation Actions: إدارة المحادثات
 * 3. Message Actions: إدارة الرسائل
 * 4. UI State Actions: حالات الواجهة
 * 5. Selectors: استعلامات البيانات
 */
interface ChatState {
  // ─────────────────────────────────────────────────────────────────────────
  // STATE PROPERTIES
  // ─────────────────────────────────────────────────────────────────────────
  
  /** قائمة جميع المحادثات */
  conversations: Conversation[];
  
  /** معرف المحادثة النشطة حالياً */
  currentConversationId: string | null;
  
  /** هل جاري تحميل رد من الخادم؟ */
  isLoading: boolean;
  
  /** هل المساعد يكتب؟ (للـ thinking indicator) */
  isAssistantTyping: boolean;
  
  /** المرفقات المعلقة قبل إرسال الرسالة */
  pendingAttachments: Attachment[];
  
  /** عدد المحادثات المعروضة (للـ pagination) */
  visibleConversationsCount: number;
  
  // ─────────────────────────────────────────────────────────────────────────
  // CONVERSATION ACTIONS
  // ─────────────────────────────────────────────────────────────────────────
  
  /**
   * إنشاء محادثة جديدة
   * 
   * @returns معرف المحادثة الجديدة
   * 
   * @behavior
   * - إذا كانت هناك محادثة فارغة، يُعاد استخدامها
   * - خلاف ذلك، تُنشأ محادثة جديدة
   */
  createConversation: () => string;
  
  /**
   * تعيين المحادثة النشطة
   * 
   * @param id - معرف المحادثة
   * 
   * @sideEffects
   * - يُصفّر عداد الرسائل غير المقروءة للمحادثة
   */
  setCurrentConversation: (id: string) => void;
  
  /**
   * حذف محادثة
   * 
   * @param id - معرف المحادثة للحذف
   * 
   * @behavior
   * - إذا كانت المحادثة المحذوفة هي النشطة، يُنتقل للأولى
   */
  deleteConversation: (id: string) => void;
  
  /**
   * تحديث عنوان المحادثة
   * 
   * @param id - معرف المحادثة
   * @param title - العنوان الجديد
   */
  updateConversationTitle: (id: string, title: string) => void;
  
  /**
   * تحميل المزيد من المحادثات (pagination)
   * 
   * @behavior
   * يزيد visibleConversationsCount بـ 10
   */
  loadMoreConversations: () => void;
  
  // ─────────────────────────────────────────────────────────────────────────
  // MESSAGE ACTIONS
  // ─────────────────────────────────────────────────────────────────────────
  
  /**
   * إضافة رسالة جديدة
   * 
   * @param message - بيانات الرسالة (بدون id و timestamp)
   * @param conversationId - معرف المحادثة المستهدفة (اختياري، يستخدم الحالية)
   * @returns معرف الرسالة الجديدة
   * 
   * @behavior
   * - إذا لم تكن هناك محادثة، تُنشأ واحدة تلقائياً
   * - يُحدّث عنوان المحادثة من أول رسالة للمستخدم
   * - يُزاد عداد الرسائل غير المقروءة للمحادثات غير النشطة
   */
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>, conversationId?: string) => string;
  
  /**
   * تحديث محتوى رسالة موجودة
   * 
   * @param id - معرف الرسالة
   * @param content - المحتوى الجديد
   * @param status - الحالة الجديدة (اختياري)
   * 
   * @usedBy
   * - useChat hook أثناء streaming response
   */
  updateMessage: (id: string, content: string, status?: MessageStatus) => void;
  
  /**
   * تعيين حالة البث للرسالة
   * 
   * @param id - معرف الرسالة
   * @param isStreaming - هل قيد البث؟
   */
  setMessageStreaming: (id: string, isStreaming: boolean) => void;
  
  /**
   * حذف رسالة
   * 
   * @param id - معرف الرسالة للحذف
   */
  deleteMessage: (id: string) => void;
  
  /**
   * حفظ مسودة الرسالة
   * 
   * @param id - معرف المحادثة
   * @param draft - نص المسودة
   */
  setDraft: (id: string, draft: string) => void;
  
  // ─────────────────────────────────────────────────────────────────────────
  // UI STATE ACTIONS
  // ─────────────────────────────────────────────────────────────────────────
  
  /**
   * تعيين حالة التحميل
   */
  setLoading: (loading: boolean) => void;
  
  /**
   * تعيين حالة كتابة المساعد
   */
  setAssistantTyping: (isTyping: boolean) => void;
  
  /**
   * إضافة مرفق معلق
   */
  addAttachment: (attachment: Omit<Attachment, 'id'>) => void;
  
  /**
   * إزالة مرفق معلق
   */
  removeAttachment: (id: string) => void;
  
  /**
   * مسح جميع المرفقات المعلقة
   */
  clearAttachments: () => void;
  
  /**
   * مزامنة الحالة من التخزين المحلي
   * 
   * @usedBy
   * - storage event listener لمزامنة التبويبات
   */
  syncFromStorage: () => void;
  
  // ─────────────────────────────────────────────────────────────────────────
  // SELECTORS (GETTERS)
  // ─────────────────────────────────────────────────────────────────────────
  
  /**
   * الحصول على المحادثة النشطة
   */
  getCurrentConversation: () => Conversation | undefined;
  
  /**
   * الحصول على رسائل المحادثة النشطة
   * 
   * @returns صفيف الرسائل أو صفيف فارغ ثابت
   */
  getMessages: () => Message[];
}

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

/**
 * متجر الدردشة المركزي
 * 
 * @example
 * // استخدام في مكون React
 * const messages = useChatStore(state => state.getMessages());
 * const { addMessage } = useChatStore.getState();
 * 
 * @example
 * // استخدام خارج React
 * const state = useChatStore.getState();
 * state.addMessage({ role: 'user', content: 'Hello' });
 */
export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      // ═══════════════════════════════════════════════════════════════════════
      // INITIAL STATE
      // ═══════════════════════════════════════════════════════════════════════
      
      conversations: [],
      currentConversationId: null,
      isLoading: false,
      isAssistantTyping: false,
      pendingAttachments: [],
      visibleConversationsCount: 10,

      // ═══════════════════════════════════════════════════════════════════════
      // CONVERSATION ACTIONS
      // ═══════════════════════════════════════════════════════════════════════

      createConversation: () => {
        const state = get();
        
        // تحسين: إعادة استخدام المحادثة الفارغة بدلاً من إنشاء جديدة
        const emptyConversation = state.conversations.find((c) => c.messages.length === 0);

        if (emptyConversation) {
          set({ currentConversationId: emptyConversation.id });
          return emptyConversation.id;
        }

        // إنشاء محادثة جديدة
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
          // تصفير عداد الرسائل غير المقروءة عند فتح المحادثة
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, unreadCount: 0 } : c
          ),
        }));
      },

      deleteConversation: (id) => {
        set((state) => {
          const newConversations = state.conversations.filter((c) => c.id !== id);
          
          // إذا حُذفت المحادثة النشطة، انتقل للأولى
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

      // ═══════════════════════════════════════════════════════════════════════
      // MESSAGE ACTIONS
      // ═══════════════════════════════════════════════════════════════════════

      addMessage: (message, targetConversationId) => {
        const state = get();
        let conversationId = targetConversationId || state.currentConversationId;
        
        // إنشاء محادثة تلقائياً إذا لم تكن موجودة
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
              // تحديث العنوان من أول رسالة للمستخدم
              const shouldUpdateTitle = c.messages.length === 0 && message.role === 'user';
              const newTitle = shouldUpdateTitle 
                ? message.content.slice(0, 40) + (message.content.length > 40 ? '...' : '')
                : c.title;
              
              return {
                ...c,
                title: newTitle,
                messages: [...c.messages, newMessage],
                updatedAt: new Date(),
                // زيادة عداد غير المقروءة للمحادثات غير النشطة
                unreadCount: c.id === state.currentConversationId ? 0 : c.unreadCount + 1,
              };
            }
            return c;
          }),
        }));

        return id;
      },

      updateMessage: (id, content, status) => {
        set((state) => ({
          conversations: state.conversations.map((c) => ({
            ...c,
            messages: c.messages.map((msg) =>
              msg.id === id
                ? { ...msg, content, status: status || msg.status }
                : msg
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

      deleteMessage: (id) => {
        set((state) => ({
          conversations: state.conversations.map((c) => ({
            ...c,
            messages: c.messages.filter((msg) => msg.id !== id),
            updatedAt: new Date(),
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

      // ═══════════════════════════════════════════════════════════════════════
      // UI STATE ACTIONS
      // ═══════════════════════════════════════════════════════════════════════

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
        // ⚠️ WARNING: هذه الدالة تقرأ مباشرة من localStorage
        // تُستخدم للمزامنة بين التبويبات
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
            // Guard: التعامل مع JSON غير صالح
            console.error('Failed to sync from storage:', e);
          }
        }
      },

      // ═══════════════════════════════════════════════════════════════════════
      // SELECTORS
      // ═══════════════════════════════════════════════════════════════════════

      getCurrentConversation: () => {
        const state = get();
        return state.conversations.find((c) => c.id === state.currentConversationId);
      },

      getMessages: () => {
        const state = get();
        const conversation = state.conversations.find((c) => c.id === state.currentConversationId);
        // تحسين: إرجاع ثابت فارغ لمنع re-renders
        return conversation?.messages || EMPTY_MESSAGES;
      },
    }),
    {
      // ═══════════════════════════════════════════════════════════════════════
      // PERSIST CONFIGURATION
      // ═══════════════════════════════════════════════════════════════════════
      
      name: 'roblox-chat-storage',
      
      /**
       * اختيار البيانات المراد حفظها
       * 
       * @note
       * لا نحفظ:
       * - isLoading: حالة مؤقتة
       * - isAssistantTyping: حالة مؤقتة
       * - pendingAttachments: لم تُرسل بعد
       * - visibleConversationsCount: UI state
       */
      partialize: (state) => ({
        conversations: state.conversations,
        currentConversationId: state.currentConversationId,
      }),
    }
  )
);
