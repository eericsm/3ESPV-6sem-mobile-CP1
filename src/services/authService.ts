import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    type User,
    type UserCredential,
} from 'firebase/auth';
import { firebaseAuth } from './firebase';
import { createUserProfile, updateUserPhoto, uploadProfilePhoto } from './userService';
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

    // O perfil no Firestore é criado logo em seguida, sem depender do upload da
    // foto: se o upload falhar (rede instável, Cloudinary fora do ar etc.), a
    // conta não pode ficar sem perfil -- a foto é só um complemento best-effort.
    await createUserProfile({
        uid: credential.user.uid,
        name: credentials.name,
        email: credentials.email,
        phoneNumber: credentials.phoneNumber,
        birthDate: credentials.birthDate,
        photoUrl: '',
        createdAt: Date.now(),
    });

    await updateProfile(credential.user, {
        displayName: credentials.name,
    });

    if (credentials.photoLocalUri) {
        try {
            const photoUrl = await uploadProfilePhoto(credential.user.uid, credentials.photoLocalUri);
            await Promise.all([
                updateUserPhoto(credential.user.uid, photoUrl),
                updateProfile(credential.user, { photoURL: photoUrl }),
            ]);
        } catch {
            // Cadastro já está completo; a foto pode ser definida depois.
        }
    }

    return credential;
};

export const signOutAuth = async (): Promise<void> => {
    await signOut(firebaseAuth);
};
