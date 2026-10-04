export const buildDirectConversationId = (firstUserId: string, secondUserId: string): string => {
    return [firstUserId, secondUserId].sort().join('_');
};
