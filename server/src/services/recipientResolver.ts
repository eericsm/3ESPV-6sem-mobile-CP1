import { database, firestore } from './firebaseAdmin';
import type { ChatGroupDocument, ChatMessageRecord } from '../types';

export class MessageValidationError extends Error {}

export const loadMessage = async (
    conversationId: string,
    messageId: string,
): Promise<ChatMessageRecord> => {
    const snapshot = await database.ref(`messages/${conversationId}/${messageId}`).get();

    if (!snapshot.exists()) {
        throw new MessageValidationError('Mensagem não encontrada');
    }

    return snapshot.val() as ChatMessageRecord;
};

export const assertSenderMatches = (message: ChatMessageRecord, requesterUid: string): void => {
    if (message.senderId !== requesterUid) {
        throw new MessageValidationError('O remetente da mensagem não corresponde ao usuário autenticado');
    }
};

const resolveDirectRecipients = async (
    conversationId: string,
    senderId: string,
): Promise<string[]> => {
    const conversationDoc = await firestore.collection('directConversations').doc(conversationId).get();

    if (!conversationDoc.exists) {
        throw new MessageValidationError('Conversa direta não encontrada');
    }

    const participantIds = (conversationDoc.data()?.participantIds as string[]) ?? [];
    return participantIds.filter((uid) => uid !== senderId);
};

const resolveGroupRecipients = async (
    groupId: string,
    message: ChatMessageRecord,
): Promise<string[]> => {
    const groupDoc = await firestore.collection('groups').doc(groupId).get();

    if (!groupDoc.exists) {
        throw new MessageValidationError('Grupo não encontrado');
    }

    const group = groupDoc.data() as ChatGroupDocument;

    switch (group.notificationPolicy) {
        case 'all_group_messages':
            return group.memberIds.filter((uid) => uid !== message.senderId);
        case 'mentioned_members':
            return message.mentionedUserIds.filter(
                (uid) => uid !== message.senderId && group.memberIds.includes(uid),
            );
        case 'direct_messages_only':
        case 'disabled':
        default:
            return [];
    }
};

export const resolveRecipients = async (
    conversationId: string,
    message: ChatMessageRecord,
): Promise<string[]> => {
    if (message.conversationType === 'direct') {
        return resolveDirectRecipients(conversationId, message.senderId);
    }

    return resolveGroupRecipients(conversationId, message);
};
