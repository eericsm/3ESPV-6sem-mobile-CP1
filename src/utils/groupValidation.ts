import type { ChatGroup } from '../types/group';

export const availableSlots = (group: Pick<ChatGroup, 'memberIds' | 'memberLimit'>): number => {
    return Math.max(group.memberLimit - group.memberIds.length, 0);
};

export const hasAvailableSlots = (group: Pick<ChatGroup, 'memberIds' | 'memberLimit'>): boolean => {
    return availableSlots(group) > 0;
};

export const canReduceLimit = (
    group: Pick<ChatGroup, 'memberIds'>,
    newLimit: number,
): boolean => {
    return Number.isInteger(newLimit) && newLimit >= group.memberIds.length;
};

export const isGroupOwner = (group: Pick<ChatGroup, 'ownerId'>, uid: string): boolean => {
    return group.ownerId === uid;
};

export const isGroupMember = (group: Pick<ChatGroup, 'memberIds'>, uid: string): boolean => {
    return group.memberIds.includes(uid);
};
