import { useEffect, useState } from 'react';
import type { ChatMessage, Conversation } from '../types/chat';

export type UseChatResult = {
    conversation: Conversation | null;
    messages: ChatMessage[];
    loading: boolean;
    error: string | null;
};

export const useChat = (conversationId: string | null): UseChatResult => {
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        void conversationId;
        setConversation(null);
        setMessages([]);
        setLoading(false);
        setError(null);
    }, [conversationId]);

    return {
        conversation,
        messages,
        loading,
        error,
    };
};
