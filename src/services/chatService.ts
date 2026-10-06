import {
    collection,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    query,
    serverTimestamp,
    setDoc,
    where,
    type Unsubscribe,
} from 'firebase/firestore';
import {
    get,
    off,
    onValue,
    push,
    ref,
    serverTimestamp as rtdbServerTimestamp,
    set,
} from 'firebase/database';
import { firebaseDatabase, firebaseFirestore } from './firebase';
import { notifyNewMessage } from './notificationService';
import { buildDirectConversationId } from '../utils/conversationId';
import type { ChatMessage, ConversationType, DirectConversation, MessageTarget } from '../types/chat';

export type MessageListener = (messages: ChatMessage[]) => void;

export const registerSelfAsConversationMember = async (
    conversationId: string,
    uid: string,
): Promise<void> => {
    const memberRef = ref(firebaseDatabase, `conversationMembers/${conversationId}/${uid}`);
    await set(memberRef, true);
};

export const registerGroupOwner = async (groupId: string, ownerId: string): Promise<void> => {
    const ownerRef = ref(firebaseDatabase, `groupOwners/${groupId}`);
    await set(ownerRef, ownerId);
};

export const getOrCreateDirectConversation = async (
    currentUserId: string,
    targetUserId: string,
): Promise<DirectConversation> => {
    if (currentUserId === targetUserId) {
        throw new Error('Não é possível conversar consigo mesmo');
    }

    const conversationId = buildDirectConversationId(currentUserId, targetUserId);
    const conversationRef = doc(firebaseFirestore, 'directConversations', conversationId);
    const snapshot = await getDoc(conversationRef);

    if (snapshot.exists()) {
        const data = snapshot.data();
        await registerSelfAsConversationMember(conversationId, currentUserId);

        return {
            id: conversationId,
            type: 'direct',
            participants: [currentUserId, targetUserId],
            createdAt: (data.createdAt as number) ?? Date.now(),
        };
    }

    await setDoc(conversationRef, {
        participantIds: [currentUserId, targetUserId],
        createdAt: serverTimestamp(),
    });

    await registerSelfAsConversationMember(conversationId, currentUserId);

    return {
        id: conversationId,
        type: 'direct',
        participants: [currentUserId, targetUserId],
        createdAt: Date.now(),
    };
};

export const listDirectConversations = async (uid: string): Promise<DirectConversation[]> => {
    const conversationsRef = collection(firebaseFirestore, 'directConversations');
    const userConversationsQuery = query(conversationsRef, where('participantIds', 'array-contains', uid));
    const snapshot = await getDocs(userConversationsQuery);

    return snapshot.docs.map((conversationDoc) => {
        const data = conversationDoc.data();
        const participantIds = (data.participantIds as string[]) ?? [];

        return {
            id: conversationDoc.id,
            type: 'direct',
            participants: [participantIds[0] ?? '', participantIds[1] ?? ''],
            createdAt: (data.createdAt as number) ?? Date.now(),
        } satisfies DirectConversation;
    });
};

export const subscribeToDirectConversations = (
    uid: string,
    onUpdate: (conversations: DirectConversation[]) => void,
): Unsubscribe => {
    const conversationsRef = collection(firebaseFirestore, 'directConversations');
    const userConversationsQuery = query(conversationsRef, where('participantIds', 'array-contains', uid));

    return onSnapshot(userConversationsQuery, (snapshot) => {
        const conversations = snapshot.docs.map((conversationDoc) => {
            const data = conversationDoc.data();
            const participantIds = (data.participantIds as string[]) ?? [];

            return {
                id: conversationDoc.id,
                type: 'direct',
                participants: [participantIds[0] ?? '', participantIds[1] ?? ''],
                createdAt: (data.createdAt as number) ?? Date.now(),
            } satisfies DirectConversation;
        });

        onUpdate(conversations);
    });
};

export const removeConversationMember = async (
    conversationId: string,
    uid: string,
): Promise<void> => {
    const memberRef = ref(firebaseDatabase, `conversationMembers/${conversationId}/${uid}`);
    await set(memberRef, null);
};

export type SendMessageInput = {
    conversationId: string;
    conversationType: ConversationType;
    senderId: string;
    text: string;
    target?: MessageTarget;
    mentionedUserIds?: string[];
};

export const sendMessage = async (input: SendMessageInput): Promise<void> => {
    const messagesRef = ref(firebaseDatabase, `messages/${input.conversationId}`);
    const newMessageRef = push(messagesRef);
    const messageId = newMessageRef.key;

    if (!messageId) {
        throw new Error('Não foi possível gerar o identificador da mensagem');
    }

    await set(newMessageRef, {
        id: messageId,
        conversationId: input.conversationId,
        conversationType: input.conversationType,
        senderId: input.senderId,
        text: input.text,
        target: input.target ?? { type: 'conversation' },
        mentionedUserIds: input.mentionedUserIds ?? [],
        createdAt: rtdbServerTimestamp(),
    });

    void notifyNewMessage(input.conversationId, messageId);
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
                    conversationType: payload.conversationType ?? 'direct',
                    senderId: payload.senderId ?? '',
                    text: payload.text ?? '',
                    target: payload.target ?? { type: 'conversation' },
                    mentionedUserIds: payload.mentionedUserIds ?? [],
                    createdAt: payload.createdAt ?? Date.now(),
                } satisfies ChatMessage;
            })
            // Ordena pela própria push key (não por createdAt): o ID gerado por
            // push() usa o relógio do servidor já corrigido para clock skew do
            // cliente, então a ordem fica correta mesmo que os dispositivos dos
            // dois usuários tenham horários locais diferentes.
            .sort((first, second) => (first.id < second.id ? -1 : first.id > second.id ? 1 : 0));

        onUpdate(nextMessages);
    });

    return () => {
        off(messagesRef, 'value', unsubscribe);
    };
};

export const getConversationMembers = async (conversationId: string): Promise<string[]> => {
    const membersRef = ref(firebaseDatabase, `conversationMembers/${conversationId}`);
    const snapshot = await get(membersRef);
    const membersValue = (snapshot.val() ?? {}) as Record<string, boolean>;

    return Object.keys(membersValue).filter((uid) => membersValue[uid]);
};
