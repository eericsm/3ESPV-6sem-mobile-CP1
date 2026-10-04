import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Loading } from './src/components/Loading';
import { AuthProvider } from './src/contexts/AuthContext';
import { useAuth } from './src/hooks/useAuth';
import { useNotifications } from './src/hooks/useNotifications';
import { addNotificationResponseListener } from './src/services/notificationService';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { ConversationsScreen } from './src/screens/ConversationsScreen';
import type { NotificationPayload } from './src/types/notification';

export default function App() {
    return (
        <SafeAreaProvider>
            <AuthProvider>
                <AppContent />
                <StatusBar style="light" />
            </AuthProvider>
        </SafeAreaProvider>
    );
}

function AppContent() {
    const { user, loading } = useAuth();
    const [showRegister, setShowRegister] = useState<boolean>(false);
    const [pendingNotification, setPendingNotification] = useState<NotificationPayload | null>(null);

    useNotifications(user?.uid ?? null);

    useEffect(() => {
        const subscription = addNotificationResponseListener((conversationId, conversationType) => {
            setPendingNotification({ conversationId, conversationType });
        });

        return () => {
            subscription.remove();
        };
    }, []);

    const clearPendingNotification = useCallback(() => {
        setPendingNotification(null);
    }, []);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Loading label="Abrindo aplicativo..." />
            </View>
        );
    }

    if (!user) {
        return showRegister ? (
            <RegisterScreen onBackToLogin={() => setShowRegister(false)} />
        ) : (
            <LoginScreen onCreateAccount={() => setShowRegister(true)} />
        );
    }

    return (
        <ConversationsScreen
            pendingNotification={pendingNotification}
            onPendingNotificationHandled={clearPendingNotification}
        />
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0F172A',
    },
});
