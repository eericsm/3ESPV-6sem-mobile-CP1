import {
    arrayRemove,
    arrayUnion,
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
} from 'firebase/firestore';
import { firebaseFirestore } from './firebase';
import { uploadImage } from './imageUploadService';
import type { ChatUser, UserDocument } from '../types/user';

// Cada usuário tem um doc público (users/{uid}: nome, foto, groupIds) legível por
// qualquer autenticado -- necessário para a tela de contatos e para o cálculo de
// "integrantes em comum" nas regras do Firestore -- e um doc privado
// (users/{uid}/private/profile: e-mail, celular, nascimento) legível apenas pelo
// próprio usuário ou por quem compartilha uma conversa/grupo com ele.
type PublicFields = Pick<UserDocument, 'name' | 'photoUrl' | 'createdAt' | 'groupIds'>;
type PrivateFields = Pick<ChatUser, 'email' | 'phoneNumber' | 'birthDate'>;

const privateDocRef = (uid: string) => doc(firebaseFirestore, 'users', uid, 'private', 'profile');
const publicDocRef = (uid: string) => doc(firebaseFirestore, 'users', uid);

const toChatUser = (
    uid: string,
    publicData: Partial<PublicFields>,
    privateData: Partial<PrivateFields> | null,
): ChatUser => {
    return {
        uid,
        name: publicData.name ?? 'Usuário',
        photoUrl: publicData.photoUrl ?? '',
        createdAt: publicData.createdAt ?? Date.now(),
        email: privateData?.email ?? '',
        phoneNumber: privateData?.phoneNumber ?? '',
        birthDate: privateData?.birthDate ?? '',
    };
};

export const getUserProfile = async (uid: string): Promise<ChatUser | null> => {
    const publicSnapshot = await getDoc(publicDocRef(uid));

    if (!publicSnapshot.exists()) {
        return null;
    }

    let privateData: Partial<PrivateFields> | null = null;

    try {
        const privateSnapshot = await getDoc(privateDocRef(uid));
        privateData = privateSnapshot.exists() ? (privateSnapshot.data() as PrivateFields) : null;
    } catch {
        // Sem conexão (conversa ou grupo em comum) com este usuário: dados cadastrais ficam indisponíveis.
        privateData = null;
    }

    return toChatUser(uid, publicSnapshot.data() as Partial<PublicFields>, privateData);
};

export const upsertUserProfile = async (user: ChatUser): Promise<void> => {
    await updateDoc(publicDocRef(user.uid), {
        name: user.name,
        photoUrl: user.photoUrl,
    });

    await setDoc(privateDocRef(user.uid), {
        email: user.email,
        phoneNumber: user.phoneNumber,
        birthDate: user.birthDate,
    });
};

export const createUserProfile = async (user: ChatUser): Promise<void> => {
    await setDoc(publicDocRef(user.uid), {
        uid: user.uid,
        name: user.name,
        photoUrl: user.photoUrl,
        createdAt: Date.now(),
        groupIds: [],
    });

    await setDoc(privateDocRef(user.uid), {
        email: user.email,
        phoneNumber: user.phoneNumber,
        birthDate: user.birthDate,
    });
};

export const listAllUsers = async (currentUserId: string): Promise<ChatUser[]> => {
    const usersRef = collection(firebaseFirestore, 'users');
    const snapshot = await getDocs(usersRef);

    return snapshot.docs
        .filter((userDoc) => userDoc.id !== currentUserId)
        .map((userDoc) => toChatUser(userDoc.id, userDoc.data() as Partial<PublicFields>, null))
        .sort((first, second) => first.name.localeCompare(second.name));
};

export const getUsersByIds = async (uids: string[]): Promise<ChatUser[]> => {
    const profiles = await Promise.all(uids.map((uid) => getUserProfile(uid)));
    return profiles.filter((profile): profile is ChatUser => profile !== null);
};

export const addUserToGroup = async (uid: string, groupId: string): Promise<void> => {
    await updateDoc(publicDocRef(uid), {
        groupIds: arrayUnion(groupId),
    });
};

export const removeUserFromGroup = async (uid: string, groupId: string): Promise<void> => {
    await updateDoc(publicDocRef(uid), {
        groupIds: arrayRemove(groupId),
    });
};

export const uploadProfilePhoto = async (uid: string, localUri: string): Promise<string> => {
    return uploadImage(`profilePhotos/${uid}`, localUri);
};

export const uploadGroupPhoto = async (groupId: string, localUri: string): Promise<string> => {
    return uploadImage(`groupPhotos/${groupId}`, localUri);
};
