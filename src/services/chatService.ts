import type { ChatMessage, Conversation } from '../types/chat';
import type { ChatUser } from '../types/user';

export type MessageListener = (messages: ChatMessage[]) => void;

export const getOrCreateConversation = async (
    currentUserId: string,
    targetUserId: string,
): Promise<Conversation> => {
    void currentUserId;
    void targetUserId;
    throw new Error('Not implemented');
};

export const sendMessage = async (
    conversationId: string,
    message: Omit<ChatMessage, 'id' | 'createdAt'>,
): Promise<void> => {
    void conversationId;
    void message;
    throw new Error('Not implemented');
};

export const subscribeToMessages = (
    conversationId: string,
    onUpdate: MessageListener,
): (() => void) => {
    void conversationId;
    void onUpdate;
    throw new Error('Not implemented');
};

export const listCompatibleUsers = async (
    currentUser: ChatUser,
): Promise<ChatUser[]> => {
    void currentUser;
    throw new Error('Not implemented');
};
