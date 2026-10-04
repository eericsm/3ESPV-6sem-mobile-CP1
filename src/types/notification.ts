import type { NotificationPolicy } from './group';

export type DevicePlatform = 'android' | 'ios' | 'web';

export type DeviceToken = {
    token: string;
    platform: DevicePlatform;
    enabled: boolean;
    updatedAt: number;
};

export type NotificationSettings = {
    conversationId: string;
    policy: NotificationPolicy;
    updatedBy: string;
    updatedAt: number;
};

export type NotificationPayload = {
    conversationId: string;
    conversationType: 'direct' | 'group';
};
