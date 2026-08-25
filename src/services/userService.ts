import type { ChatUser } from '../types/user';

export const upsertUserProfile = async (user: ChatUser): Promise<void> => {
    void user;
    throw new Error('Not implemented');
};

export const getUserProfile = async (uid: string): Promise<ChatUser | null> => {
    void uid;
    throw new Error('Not implemented');
};
