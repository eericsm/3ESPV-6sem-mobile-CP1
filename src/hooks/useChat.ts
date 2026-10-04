import { useCallback, useEffect, useState } from 'react';
import { sendMessage, subscribeToMessages } from '../services/chatService';
import type { ChatMessage, ConversationType, MessageTarget } from '../types/chat';

export type UseChatResult = {
    messages: ChatMessage[];
    loading: boolean;
    error: string | null;
    sending: boolean;
    send: (text: string, target?: MessageTarget, mentionedUserIds?: string[]) => Promise<void>;
};

export const useChat = (
    conversationId: string | null,
    conversationType: ConversationType,
    senderId: string | null,
): UseChatResult => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [sending, setSending] = useState<boolean>(false);

    useEffect(() => {
        if (!conversationId) {
            setMessages([]);
            setLoading(false);
            return;
        }

        setLoading(true);

        const unsubscribe = subscribeToMessages(conversationId, (nextMessages) => {
            setMessages(nextMessages);
            setLoading(false);
        });

        return unsubscribe;
    }, [conversationId]);

    const send = useCallback(
        async (text: string, target?: MessageTarget, mentionedUserIds?: string[]) => {
            const trimmed = text.trim();

            if (!trimmed || !conversationId || !senderId) {
                return;
            }

            setSending(true);
            setError(null);

            try {
                await sendMessage({
                    conversationId,
                    conversationType,
                    senderId,
                    text: trimmed,
                    target,
                    mentionedUserIds,
                });
            } catch (caughtError) {
                setError(
                    caughtError instanceof Error ? caughtError.message : 'Não foi possível enviar a mensagem',
                );
                throw caughtError;
            } finally {
                setSending(false);
            }
        },
        [conversationId, conversationType, senderId],
    );

    return { messages, loading, error, sending, send };
};
