import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { firebaseAuth, firebaseFirestore } from './firebase';
import type { DevicePlatform } from '../types/notification';

const NOTIFICATIONS_API_URL = process.env.EXPO_PUBLIC_NOTIFICATIONS_API_URL ?? '';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
    }),
});

const getDevicePlatform = (): DevicePlatform => {
    if (Platform.OS === 'android') {
        return 'android';
    }

    if (Platform.OS === 'ios') {
        return 'ios';
    }

    return 'web';
};

export const registerDeviceForPushNotifications = async (uid: string): Promise<boolean> => {
    if (Platform.OS === 'web') {
        return false;
    }

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.DEFAULT,
        });
    }

    const permission = await Notifications.requestPermissionsAsync();

    if (permission.status !== 'granted') {
        return false;
    }

    const devicePushToken = await Notifications.getDevicePushTokenAsync();
    const deviceId = devicePushToken.data;

    const deviceRef = doc(firebaseFirestore, 'users', uid, 'devices', deviceId);
    await setDoc(deviceRef, {
        token: deviceId,
        platform: getDevicePlatform(),
        enabled: true,
        updatedAt: serverTimestamp(),
    });

    return true;
};

export const notifyNewMessage = async (
    conversationId: string,
    messageId: string,
): Promise<void> => {
    if (!NOTIFICATIONS_API_URL) {
        return;
    }

    const currentUser = firebaseAuth.currentUser;

    if (!currentUser) {
        return;
    }

    try {
        const idToken = await currentUser.getIdToken();

        await fetch(`${NOTIFICATIONS_API_URL}/notifications/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({ conversationId, messageId }),
        });
    } catch {
        // O envio de push é best-effort: falha aqui não deve impedir o envio da mensagem.
    }
};

export const addNotificationResponseListener = (
    onConversationSelected: (conversationId: string, conversationType: 'direct' | 'group') => void,
) => {
    return Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as {
            conversationId?: string;
            conversationType?: 'direct' | 'group';
        };

        if (data.conversationId && data.conversationType) {
            onConversationSelected(data.conversationId, data.conversationType);
        }
    });
};
