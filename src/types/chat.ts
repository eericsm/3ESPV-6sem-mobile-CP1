export type Conversation = {
    id: string;
    participants: [string, string];
    createdAt: number;
};

export type ChatMessage = {
    id: string;
    conversationId: string;
    senderId: string;
    receiverId: string;
    text: string;
    createdAt: number;
};
