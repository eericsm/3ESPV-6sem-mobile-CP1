import {
    arrayRemove,
    arrayUnion,
    collection,
    doc,
    getDoc,
    onSnapshot,
    query,
    runTransaction,
    serverTimestamp,
    where,
    type Unsubscribe,
} from 'firebase/firestore';
import { firebaseFirestore } from './firebase';
import { registerGroupOwner, removeConversationMember } from './chatService';
import { addUserToGroup, removeUserFromGroup } from './userService';
import type { ChatGroup, NotificationPolicy } from '../types/group';
import { canReduceLimit } from '../utils/groupValidation';

export type CreateGroupInput = {
    name: string;
    photoUrl: string;
    ownerId: string;
    memberIds: string[];
    memberLimit: number;
    notificationPolicy: NotificationPolicy;
};

const toChatGroup = (id: string, data: Record<string, unknown>): ChatGroup => {
    return {
        id,
        name: (data.name as string) ?? '',
        photoUrl: (data.photoUrl as string) ?? '',
        ownerId: (data.ownerId as string) ?? '',
        memberIds: (data.memberIds as string[]) ?? [],
        memberLimit: (data.memberLimit as number) ?? 0,
        notificationPolicy: (data.notificationPolicy as NotificationPolicy) ?? 'all_group_messages',
        createdAt: (data.createdAt as number) ?? Date.now(),
        updatedAt: (data.updatedAt as number) ?? Date.now(),
    };
};

export const createGroup = async (input: CreateGroupInput): Promise<ChatGroup> => {
    const memberIds = Array.from(new Set([input.ownerId, ...input.memberIds]));

    if (memberIds.length < 2) {
        throw new Error('O grupo precisa de pelo menos dois integrantes');
    }

    if (!Number.isInteger(input.memberLimit) || input.memberLimit < memberIds.length) {
        throw new Error('O limite de integrantes deve ser maior ou igual à quantidade inicial');
    }

    const groupRef = doc(collection(firebaseFirestore, 'groups'));

    await runTransaction(firebaseFirestore, async (transaction) => {
        transaction.set(groupRef, {
            name: input.name,
            photoUrl: input.photoUrl,
            ownerId: input.ownerId,
            memberIds,
            memberLimit: input.memberLimit,
            notificationPolicy: input.notificationPolicy,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
    });

    await Promise.all(memberIds.map((uid) => addUserToGroup(uid, groupRef.id)));
    await registerGroupOwner(groupRef.id, input.ownerId);

    return {
        id: groupRef.id,
        name: input.name,
        photoUrl: input.photoUrl,
        ownerId: input.ownerId,
        memberIds,
        memberLimit: input.memberLimit,
        notificationPolicy: input.notificationPolicy,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };
};

export const getGroupById = async (groupId: string): Promise<ChatGroup | null> => {
    const groupRef = doc(firebaseFirestore, 'groups', groupId);
    const snapshot = await getDoc(groupRef);

    if (!snapshot.exists()) {
        return null;
    }

    return toChatGroup(groupId, snapshot.data());
};

export const addMember = async (groupId: string, uid: string): Promise<void> => {
    const groupRef = doc(firebaseFirestore, 'groups', groupId);

    await runTransaction(firebaseFirestore, async (transaction) => {
        const snapshot = await transaction.get(groupRef);

        if (!snapshot.exists()) {
            throw new Error('Grupo não encontrado');
        }

        const group = toChatGroup(groupId, snapshot.data());

        if (group.memberIds.includes(uid)) {
            return;
        }

        if (group.memberIds.length >= group.memberLimit) {
            throw new Error('O grupo já atingiu o limite de integrantes');
        }

        transaction.update(groupRef, {
            memberIds: arrayUnion(uid),
            updatedAt: serverTimestamp(),
        });
    });

    await addUserToGroup(uid, groupId);
};

export const removeMember = async (groupId: string, uid: string): Promise<void> => {
    const groupRef = doc(firebaseFirestore, 'groups', groupId);

    await runTransaction(firebaseFirestore, async (transaction) => {
        const snapshot = await transaction.get(groupRef);

        if (!snapshot.exists()) {
            throw new Error('Grupo não encontrado');
        }

        const group = toChatGroup(groupId, snapshot.data());

        if (group.ownerId === uid) {
            throw new Error('O proprietário não pode ser removido do grupo');
        }

        transaction.update(groupRef, {
            memberIds: arrayRemove(uid),
            updatedAt: serverTimestamp(),
        });
    });

    await removeUserFromGroup(uid, groupId);
    await removeConversationMember(groupId, uid);
};

export const updateMemberLimit = async (groupId: string, newLimit: number): Promise<void> => {
    const groupRef = doc(firebaseFirestore, 'groups', groupId);

    await runTransaction(firebaseFirestore, async (transaction) => {
        const snapshot = await transaction.get(groupRef);

        if (!snapshot.exists()) {
            throw new Error('Grupo não encontrado');
        }

        const group = toChatGroup(groupId, snapshot.data());

        if (!canReduceLimit(group, newLimit)) {
            throw new Error('O novo limite não pode ser menor que a quantidade atual de integrantes');
        }

        transaction.update(groupRef, {
            memberLimit: newLimit,
            updatedAt: serverTimestamp(),
        });
    });
};

export const updateGroupPhoto = async (groupId: string, photoUrl: string): Promise<void> => {
    const groupRef = doc(firebaseFirestore, 'groups', groupId);
    await runTransaction(firebaseFirestore, async (transaction) => {
        transaction.update(groupRef, {
            photoUrl,
            updatedAt: serverTimestamp(),
        });
    });
};

export const updateNotificationPolicy = async (
    groupId: string,
    policy: NotificationPolicy,
): Promise<void> => {
    const groupRef = doc(firebaseFirestore, 'groups', groupId);
    await runTransaction(firebaseFirestore, async (transaction) => {
        transaction.update(groupRef, {
            notificationPolicy: policy,
            updatedAt: serverTimestamp(),
        });
    });
};

export const subscribeToUserGroups = (
    uid: string,
    onUpdate: (groups: ChatGroup[]) => void,
): Unsubscribe => {
    const groupsRef = collection(firebaseFirestore, 'groups');
    const userGroupsQuery = query(groupsRef, where('memberIds', 'array-contains', uid));

    return onSnapshot(userGroupsQuery, (snapshot) => {
        const groups = snapshot.docs
            .map((groupDoc) => toChatGroup(groupDoc.id, groupDoc.data()))
            .sort((first, second) => second.updatedAt - first.updatedAt);

        onUpdate(groups);
    });
};
