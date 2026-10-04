import { useCallback, useEffect, useState } from 'react';
import { registerDeviceForPushNotifications } from '../services/notificationService';

export type UseNotificationsResult = {
    permissionGranted: boolean;
    error: string | null;
};

export const useNotifications = (uid: string | null): UseNotificationsResult => {
    const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const register = useCallback(async (userId: string) => {
        try {
            const granted = await registerDeviceForPushNotifications(userId);
            setPermissionGranted(granted);
            setError(granted ? null : 'Permissão de notificações negada');
        } catch (caughtError) {
            setError(
                caughtError instanceof Error
                    ? caughtError.message
                    : 'Não foi possível registrar o dispositivo para notificações',
            );
        }
    }, []);

    useEffect(() => {
        if (!uid) {
            setPermissionGranted(false);
            return;
        }

        void register(uid);
    }, [uid, register]);

    return { permissionGranted, error };
};
