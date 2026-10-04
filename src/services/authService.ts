import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    type User,
    type UserCredential,
} from 'firebase/auth';
import { firebaseAuth } from './firebase';
import { createUserProfile, uploadProfilePhoto } from './userService';
import type { ChatUser } from '../types/user';

export type SignInCredentials = {
    email: string;
    password: string;
};

export type SignUpCredentials = {
    name: string;
    email: string;
    password: string;
    phoneNumber: string;
    birthDate: string;
    photoLocalUri: string | null;
};

export const mapFirebaseUserToChatUser = (user: User): ChatUser => {
    return {
        uid: user.uid,
        name: user.displayName ?? user.email?.split('@')[0] ?? 'Usuário',
        email: user.email ?? '',
        phoneNumber: '',
        birthDate: '',
        photoUrl: user.photoURL ?? '',
        createdAt: user.metadata.creationTime ? Date.parse(user.metadata.creationTime) : Date.now(),
    };
};

export const signInWithEmail = async (
    credentials: SignInCredentials,
): Promise<UserCredential> => {
    return signInWithEmailAndPassword(firebaseAuth, credentials.email, credentials.password);
};

export const signUpWithEmail = async (
    credentials: SignUpCredentials,
): Promise<UserCredential> => {
    const credential = await createUserWithEmailAndPassword(
        firebaseAuth,
        credentials.email,
        credentials.password,
    );

    const photoUrl = credentials.photoLocalUri
        ? await uploadProfilePhoto(credential.user.uid, credentials.photoLocalUri)
        : '';

    await updateProfile(credential.user, {
        displayName: credentials.name,
        photoURL: photoUrl || null,
    });

    await createUserProfile({
        uid: credential.user.uid,
        name: credentials.name,
        email: credentials.email,
        phoneNumber: credentials.phoneNumber,
        birthDate: credentials.birthDate,
        photoUrl,
        createdAt: Date.now(),
    });

    return credential;
};

export const signOutAuth = async (): Promise<void> => {
    await signOut(firebaseAuth);
};
