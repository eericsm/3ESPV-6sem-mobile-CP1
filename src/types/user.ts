export type AuthProvider = 'password' | 'google' | 'apple';

export type ChatUser = {
    uid: string;
    name: string;
    email: string | null;
    provider: AuthProvider;
};
