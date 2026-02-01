import { describe, it, expect, beforeEach } from 'vitest';
import { useChatStore } from '../stores/chatStore';

describe('chatStore', () => {
  beforeEach(() => {
    // Reset the store before each test if possible
    // Since it's using persist, we might need to clear it or just use a fresh one
    useChatStore.setState({
      conversations: [],
      currentConversationId: null,
      isLoading: false,
      pendingAttachments: [],
    });
  });

  it('should return a stable empty array when no conversation exists', () => {
    const messages1 = useChatStore.getState().getMessages();
    const messages2 = useChatStore.getState().getMessages();

    expect(messages1).toEqual([]);
    expect(messages1).toBe(messages2); // Should be the same reference
  });

  it('should create a conversation and add a message', () => {
    const { addMessage, getMessages } = useChatStore.getState();

    const messageId = addMessage({
      role: 'user',
      content: 'Hello',
    });

    const messages = getMessages();
    expect(messages.length).toBe(1);
    expect(messages[0].content).toBe('Hello');
    expect(messages[0].id).toBe(messageId);

    const currentConversationId = useChatStore.getState().currentConversationId;
    expect(currentConversationId).not.toBeNull();
  });
});
