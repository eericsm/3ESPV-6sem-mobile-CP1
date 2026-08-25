import {
    createContext,
    useCallback,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { firebaseAuth } from '../services/firebase';
import {
    mapFirebaseUserToChatUser,
    signInWithEmail,
    signOutAuth,
    signUpWithEmail,
    type SignInCredentials,
    type SignUpCredentials,
} from '../services/authService';
import type { ChatUser } from '../types/user';

export type AuthState = {
    user: ChatUser | null;
    loading: boolean;
    error: string | null;
};

export type AuthContextValue = AuthState & {
    signIn: (credentials: SignInCredentials) => Promise<void>;
    signUp: (credentials: SignUpCredentials) => Promise<void>;
    signOut: () => Promise<void>;
    clearError: () => void;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
    children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<ChatUser | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(firebaseAuth, (firebaseUser) => {
            setUser(firebaseUser ? mapFirebaseUserToChatUser(firebaseUser) : null);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const signIn = useCallback(async (credentials: SignInCredentials) => {
        setLoading(true);
        setError(null);

        try {
            await signInWithEmail(credentials);
        } catch (caughtError) {
            setError(caughtError instanceof Error ? caughtError.message : 'Falha ao entrar');
            throw caughtError;
        } finally {
            setLoading(false);
        }
    }, []);

    const signUp = useCallback(async (credentials: SignUpCredentials) => {
        setLoading(true);
        setError(null);

        try {
            await signUpWithEmail(credentials);
        } catch (caughtError) {
            setError(caughtError instanceof Error ? caughtError.message : 'Falha ao criar conta');
            throw caughtError;
        } finally {
            setLoading(false);
        }
    }, []);

    const signOut = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            await signOutAuth();
        } catch (caughtError) {
            setError(caughtError instanceof Error ? caughtError.message : 'Falha ao sair');
            throw caughtError;
        } finally {
            setLoading(false);
        }
    }, []);

    const value = useMemo<AuthContextValue>(
        () => ({
            user,
            loading,
            error,
            signIn,
            signUp,
            signOut,
            clearError,
        }),
        [user, loading, error, signIn, signUp, signOut, clearError],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
