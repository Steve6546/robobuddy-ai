import { describe, it, expect, beforeEach } from 'vitest';
import { useChatStore } from '../stores/chatStore';

describe('Chat Features', () => {
  beforeEach(() => {
    useChatStore.setState({
      conversations: [],
      currentConversationId: null,
      isLoading: false,
      pendingAttachments: [],
      visibleConversationsCount: 10,
    });
  });

  it('should reuse an empty conversation', () => {
    const { createConversation } = useChatStore.getState();

    const id1 = createConversation();
    const id2 = createConversation();

    expect(id1).toBe(id2);
    expect(useChatStore.getState().conversations.length).toBe(1);
  });

  it('should create a new conversation if the current one is not empty', () => {
    const { createConversation, addMessage } = useChatStore.getState();

    const id1 = createConversation();
    addMessage({ role: 'user', content: 'Hello' });

    const id2 = createConversation();

    expect(id1).not.toBe(id2);
    expect(useChatStore.getState().conversations.length).toBe(2);
  });

  it('should increment unreadCount for non-current conversation', () => {
    const { createConversation, addMessage, setCurrentConversation } = useChatStore.getState();

    const id1 = createConversation();
    addMessage({ role: 'user', content: 'Msg 1' });

    const id2 = createConversation();
    // Now id2 is current

    // Manually trigger addMessage for id1 is not directly possible via addMessage(msg)
    // because it uses currentConversationId.
    // However, our addMessage logic uses currentConversationId.

    // Let's simulate switching back and forth
    setCurrentConversation(id1);
    addMessage({ role: 'user', content: 'Msg 2' });
    expect(useChatStore.getState().conversations.find(c => c.id === id1)?.unreadCount).toBe(0);

    setCurrentConversation(id2);
    addMessage({ role: 'assistant', content: 'Msg 3' }, id1);

    const conv1 = useChatStore.getState().conversations.find(c => c.id === id1);
    expect(conv1?.unreadCount).toBe(1);
    expect(conv1?.messages.length).toBe(3);
    // In my implementation:
    /*
      addMessage: (message) => {
        ...
        let conversationId = state.currentConversationId;
        ...
        set((state) => ({
          conversations: state.conversations.map((c) => {
            if (c.id === conversationId) {
              ...
              unreadCount: c.id === state.currentConversationId ? 0 : c.unreadCount + 1,
            }
            return c;
          }),
        }));
    */
    // Since conversationId is initialized to state.currentConversationId,
    // c.id === conversationId will only be true for state.currentConversationId.
    // So c.id === state.currentConversationId will always be true in that block.

    // UNLESS state.currentConversationId changes between the start of addMessage and the set call?
    // In Zustand, set(state => ...) uses the latest state.

    // Wait, if I want to truly support adding messages to other conversations, I should update addMessage to accept an optional conversationId.

    // But the instructions didn't explicitly ask to change the signature of addMessage, just the logic.
    // "If the message is added to a conversation that is NOT currentConversationId, increment unreadCount for that conversation."

    // If I change addMessage signature:
    // addMessage: (message: ..., conversationId?: string) => string;

    // Let's check if I should do that. The prompt says "Implement the following update... Extend ChatState with...". It didn't mention changing addMessage signature, but it's the only way to make that logic meaningful if messages can come from elsewhere (like a socket).
  });

  it('should handle drafts correctly', () => {
    const { createConversation, setDraft, setCurrentConversation, addMessage } = useChatStore.getState();

    const id1 = createConversation();
    setDraft(id1, 'Draft 1');

    addMessage({ role: 'user', content: 'Hello' });
    const id2 = createConversation();
    setDraft(id2, 'Draft 2');

    expect(useChatStore.getState().conversations.find(c => c.id === id1)?.draft).toBe('Draft 1');
    expect(useChatStore.getState().conversations.find(c => c.id === id2)?.draft).toBe('Draft 2');

    setCurrentConversation(id1);
    expect(useChatStore.getState().conversations.find(c => c.id === id1)?.unreadCount).toBe(0);
  });

  it('should update message status', () => {
    const { createConversation, addMessage, updateMessage } = useChatStore.getState();

    createConversation();
    const msgId = addMessage({ role: 'user', content: 'Test', status: 'sending' });

    expect(useChatStore.getState().getMessages()[0].status).toBe('sending');

    updateMessage(msgId, 'Test Updated', 'sent');
    expect(useChatStore.getState().getMessages()[0].status).toBe('sent');
    expect(useChatStore.getState().getMessages()[0].content).toBe('Test Updated');
  });
});
