import {
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    OAuthProvider,
    signInWithCredential,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    type User,
    type UserCredential,
} from 'firebase/auth';
import { set, ref } from 'firebase/database';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { firebaseAuth, firebaseDatabase } from './firebase';
import type { AuthProvider, ChatUser } from '../types/user';

export type SignInCredentials = {
    email: string;
    password: string;
};

export type SignUpCredentials = SignInCredentials & {
    name: string;
};

export type ProviderSignInResult = {
    user: ChatUser;
    provider: AuthProvider;
};

WebBrowser.maybeCompleteAuthSession();

const googleIssuer = 'https://accounts.google.com';
const googleClientId = '962570539319-s35fi8i6513cjjvm3rjj2p2lnufsfjfu.apps.googleusercontent.com';

const buildNonce = async (): Promise<string> => {
    const randomBytes = Crypto.getRandomBytes(16);
    return Array.from(randomBytes)
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');
};

const getProviderFromFirebaseUser = (user: User): AuthProvider => {
    const providerId = user.providerData[0]?.providerId;

    if (providerId === 'google.com') {
        return 'google';
    }

    if (providerId === 'apple.com') {
        return 'apple';
    }

    return 'password';
};

export const mapFirebaseUserToChatUser = (user: User): ChatUser => {
    return {
        uid: user.uid,
        name: user.displayName ?? user.email?.split('@')[0] ?? 'Usuário',
        email: user.email,
        provider: getProviderFromFirebaseUser(user),
    };
};

const saveUserProfile = async (user: User): Promise<void> => {
    const userProfile: ChatUser = mapFirebaseUserToChatUser(user);
    const userRef = ref(firebaseDatabase, `users/${user.uid}`);

    await set(userRef, {
        uid: userProfile.uid,
        name: userProfile.name,
        email: userProfile.email,
        provider: userProfile.provider,
    });
};

export const signInWithEmail = async (
    credentials: SignInCredentials,
): Promise<UserCredential> => {
    const credential = await signInWithEmailAndPassword(
        firebaseAuth,
        credentials.email,
        credentials.password,
    );

    await saveUserProfile(credential.user);
    return credential;
};

export const signUpWithEmail = async (
    credentials: SignUpCredentials,
): Promise<UserCredential> => {
    const credential = await createUserWithEmailAndPassword(
        firebaseAuth,
        credentials.email,
        credentials.password,
    );

    await updateProfile(credential.user, {
        displayName: credentials.name,
    });

    await saveUserProfile(credential.user);
    return credential;
};

export const signInWithGoogle = async (): Promise<ProviderSignInResult> => {
    if (googleClientId.startsWith('PASTE_')) {
        throw new Error('Configure the Google client ID before using Google login');
    }

    const discovery = await AuthSession.fetchDiscoveryAsync(googleIssuer);
    const redirectUri = AuthSession.makeRedirectUri({ scheme: '6sem-mobile-cp1' });

    if (/localhost|127\.0\.0\.1/.test(redirectUri)) {
        throw new Error(
            'Google OAuth bloqueado: adicione http://localhost:8081 e o handler do Firebase no Google Cloud Console.',
        );
    }

    const request = new AuthSession.AuthRequest({
        clientId: googleClientId,
        responseType: AuthSession.ResponseType.IdToken,
        redirectUri,
        scopes: ['openid', 'profile', 'email'],
        usePKCE: false,
    });

    await request.makeAuthUrlAsync(discovery);
    const result = await request.promptAsync(discovery);

    if (result.type !== 'success') {
        throw new Error('Google sign-in canceled');
    }

    const tokenResponse = AuthSession.TokenResponse.fromQueryParams(result.params);
    const idToken = tokenResponse.idToken ?? result.params.id_token ?? null;

    if (!idToken) {
        throw new Error(
            'Google OAuth não retornou o token de identidade. Verifique o redirect URI no Google Cloud Console.',
        );
    }

    const credential = GoogleAuthProvider.credential(idToken, tokenResponse.accessToken);
    const firebaseCredential = await signInWithCredential(firebaseAuth, credential);
    await saveUserProfile(firebaseCredential.user);

    return {
        user: mapFirebaseUserToChatUser(firebaseCredential.user),
        provider: 'google',
    };
};

export const signInWithApple = async (): Promise<ProviderSignInResult> => {
    const available = await AppleAuthentication.isAvailableAsync();

    if (!available) {
        throw new Error('Apple sign-in is not available on this device');
    }

    const nonce = await buildNonce();
    const appleCredential = await AppleAuthentication.signInAsync({
        requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce,
    });

    if (!appleCredential.identityToken) {
        throw new Error('Apple identity token missing');
    }

    const provider = new OAuthProvider('apple.com');
    const firebaseCredential = provider.credential({
        idToken: appleCredential.identityToken,
        rawNonce: nonce,
    });
    const result = await signInWithCredential(firebaseAuth, firebaseCredential);
    await saveUserProfile(result.user);

    return {
        user: mapFirebaseUserToChatUser(result.user),
        provider: 'apple',
    };
};

export const signOutAuth = async (): Promise<void> => {
    await signOut(firebaseAuth);
};
