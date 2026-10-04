export type NotificationPolicy =
    | 'all_group_messages'
    | 'mentioned_members'
    | 'direct_messages_only'
    | 'disabled';

export type ChatGroupDocument = {
    ownerId: string;
    memberIds: string[];
    notificationPolicy: NotificationPolicy;
};

export type MessageTarget =
    | { type: 'conversation' }
    | { type: 'member'; memberId: string };

export type ChatMessageRecord = {
    senderId: string;
    text: string;
    conversationType: 'direct' | 'group';
    target: MessageTarget;
    mentionedUserIds: string[];
};

export type DeviceTokenDocument = {
    token: string;
    enabled: boolean;
};
