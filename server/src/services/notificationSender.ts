import { firestore, messaging } from './firebaseAdmin';
import type { ChatMessageRecord, DeviceTokenDocument } from '../types';

const loadEnabledTokens = async (uid: string): Promise<{ id: string; token: string }[]> => {
    const devicesSnapshot = await firestore.collection('users').doc(uid).collection('devices').get();

    return devicesSnapshot.docs
        .map((deviceDoc) => ({ id: deviceDoc.id, ...(deviceDoc.data() as DeviceTokenDocument) }))
        .filter((device) => device.enabled)
        .map((device) => ({ id: device.id, token: device.token }));
};

const disableToken = async (uid: string, deviceId: string): Promise<void> => {
    await firestore.collection('users').doc(uid).collection('devices').doc(deviceId).update({
        enabled: false,
    });
};

export const sendMessageNotifications = async (
    conversationId: string,
    message: ChatMessageRecord,
    recipientIds: string[],
): Promise<void> => {
    if (recipientIds.length === 0) {
        return;
    }

    const recipientDevices = await Promise.all(
        recipientIds.map(async (uid) => ({ uid, devices: await loadEnabledTokens(uid) })),
    );

    const allDevices = recipientDevices.flatMap(({ uid, devices }) =>
        devices.map((device) => ({ uid, ...device })),
    );

    if (allDevices.length === 0) {
        return;
    }

    const response = await messaging.sendEachForMulticast({
        tokens: allDevices.map((device) => device.token),
        notification: {
            title: message.conversationType === 'group' ? 'Nova mensagem no grupo' : 'Nova mensagem',
            body: message.text,
        },
        data: {
            conversationId,
            conversationType: message.conversationType,
        },
    });

    await Promise.all(
        response.responses.map(async (result, index) => {
            if (result.success) {
                return;
            }

            const errorCode = result.error?.code;

            if (
                errorCode === 'messaging/registration-token-not-registered' ||
                errorCode === 'messaging/invalid-registration-token'
            ) {
                const device = allDevices[index];
                await disableToken(device.uid, device.id);
            }
        }),
    );
};
