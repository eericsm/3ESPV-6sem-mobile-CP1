import type { AuthProvider } from '../types/user';

export const isCompatibleProvider = (
    currentProvider: AuthProvider,
    targetProvider: AuthProvider,
): boolean => {
    if (currentProvider === 'password') {
        return targetProvider === 'google' || targetProvider === 'apple';
    }

    return targetProvider === 'password';
};

export const canStartConversation = (
    currentUserId: string,
    targetUserId: string,
    currentProvider: AuthProvider,
    targetProvider: AuthProvider,
): boolean => {
    return currentUserId !== targetUserId && isCompatibleProvider(currentProvider, targetProvider);
};
