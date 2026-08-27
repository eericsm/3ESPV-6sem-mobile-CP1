import {
    get,
    off,
    onValue,
    push,
    ref,
    set,
} from 'firebase/database';
import { firebaseDatabase } from './firebase';
import type { ChatMessage, Conversation } from '../types/chat';
import type { ChatUser } from '../types/user';

export type MessageListener = (messages: ChatMessage[]) => void;

const getParticipantsKey = (firstUserId: string, secondUserId: string): string => {
    return [firstUserId, secondUserId].sort().join('_');
};

export const getOrCreateConversation = async (
    currentUserId: string,
    targetUserId: string,
): Promise<Conversation> => {
    const conversationsRef = ref(firebaseDatabase, 'conversations');
    const snapshot = await get(conversationsRef);
    const conversations: Record<string, { participants?: string[]; createdAt?: number }> = snapshot.val() ?? {};

    const existingConversation = Object.entries(conversations).find(([, value]) => {
        const participants = value.participants ?? [];
        return participants.length === 2 && participants.includes(currentUserId) && participants.includes(targetUserId);
    });

    if (existingConversation) {
        const [id, value] = existingConversation;
        return {
            id,
            participants: [currentUserId, targetUserId],
            createdAt: value.createdAt ?? Date.now(),
        };
    }

    const newConversationRef = push(conversationsRef);
    const conversation: Conversation = {
        id: newConversationRef.key ?? getParticipantsKey(currentUserId, targetUserId),
        participants: [currentUserId, targetUserId],
        createdAt: Date.now(),
    };

    await set(newConversationRef, {
        participants: conversation.participants,
        createdAt: conversation.createdAt,
    });

    return conversation;
};

export const sendMessage = async (
    conversationId: string,
    message: Omit<ChatMessage, 'id' | 'createdAt'>,
): Promise<void> => {
    const messagesRef = ref(firebaseDatabase, `messages/${conversationId}`);
    const newMessageRef = push(messagesRef);

    await set(newMessageRef, {
        ...message,
        id: newMessageRef.key,
        createdAt: Date.now(),
    });
};

export const subscribeToMessages = (
    conversationId: string,
    onUpdate: MessageListener,
): (() => void) => {
    const messagesRef = ref(firebaseDatabase, `messages/${conversationId}`);

    const unsubscribe = onValue(messagesRef, (snapshot) => {
        const messagesValue = snapshot.val() ?? {};

        const nextMessages = Object.entries(messagesValue)
            .map(([id, value]) => {
                const payload = value as Partial<ChatMessage>;
                return {
                    id,
                    conversationId,
                    senderId: payload.senderId ?? '',
                    receiverId: payload.receiverId ?? '',
                    text: payload.text ?? '',
                    createdAt: payload.createdAt ?? Date.now(),
                } satisfies ChatMessage;
            })
            .sort((first, second) => first.createdAt - second.createdAt);

        onUpdate(nextMessages);
    });

    return () => {
        off(messagesRef, 'value', unsubscribe);
    };
};

export const listCompatibleUsers = async (
    currentUser: ChatUser,
): Promise<ChatUser[]> => {
    const usersRef = ref(firebaseDatabase, 'users');
    const snapshot = await get(usersRef);
    const rawUsers = (snapshot.val() ?? {}) as Record<string, Partial<ChatUser>>;

    const providerCompatibility: Record<string, string[]> = {
        password: ['password', 'google', 'apple'],
        google: ['password'],
        apple: ['password'],
    };

    const allowedProviders = providerCompatibility[currentUser.provider] ?? ['password'];

    return Object.values(rawUsers)
        .filter((user) => {
            const typedUser = user as Partial<ChatUser>;
            return (
                Boolean(typedUser.uid) &&
                typedUser.uid !== currentUser.uid &&
                Boolean(typedUser.provider) &&
                allowedProviders.includes(typedUser.provider as string)
            );
        })
        .map((user) => {
            const typedUser = user as Partial<ChatUser>;
            return {
                uid: typedUser.uid ?? '',
                name: typedUser.name ?? 'Usuário',
                email: typedUser.email ?? null,
                provider: (typedUser.provider as ChatUser['provider']) ?? 'password',
            } satisfies ChatUser;
        })
        .sort((first, second) => first.name.localeCompare(second.name));
};
