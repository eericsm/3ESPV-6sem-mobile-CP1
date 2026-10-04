import { Router } from 'express';
import { authenticate, type AuthenticatedRequest } from '../middleware/authenticate';
import { firestore } from '../services/firebaseAdmin';
import { sendMessageNotifications } from '../services/notificationSender';
import { assertSenderMatches, loadMessage, MessageValidationError, resolveRecipients } from '../services/recipientResolver';

export const notificationsRouter = Router();

const markMessageAsProcessed = async (messageId: string): Promise<boolean> => {
    const processedRef = firestore.collection('processedMessages').doc(messageId);

    return firestore.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(processedRef);

        if (snapshot.exists) {
            return false;
        }

        transaction.set(processedRef, { processedAt: Date.now() });
        return true;
    });
};

notificationsRouter.post(
    '/notifications/messages',
    authenticate,
    async (request: AuthenticatedRequest, response) => {
        const { conversationId, messageId } = request.body as {
            conversationId?: string;
            messageId?: string;
        };

        if (!conversationId || !messageId || !request.userId) {
            response.status(400).json({ error: 'conversationId e messageId são obrigatórios' });
            return;
        }

        try {
            const message = await loadMessage(conversationId, messageId);
            assertSenderMatches(message, request.userId);

            const isNewMessage = await markMessageAsProcessed(messageId);

            if (!isNewMessage) {
                response.status(200).json({ status: 'already_processed' });
                return;
            }

            const recipientIds = await resolveRecipients(conversationId, message);
            await sendMessageNotifications(conversationId, message, recipientIds);

            response.status(200).json({ status: 'sent', recipients: recipientIds.length });
        } catch (error) {
            if (error instanceof MessageValidationError) {
                response.status(403).json({ error: error.message });
                return;
            }

            response.status(500).json({ error: 'Falha ao processar a notificação' });
        }
    },
);
