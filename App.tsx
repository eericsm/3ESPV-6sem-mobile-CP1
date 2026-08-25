import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Loading } from './src/components/Loading';
import { AuthProvider } from './src/contexts/AuthContext';
import { useAuth } from './src/hooks/useAuth';
import { LoginScreen } from './src/screens/LoginScreen';
import { MenuScreen } from './src/screens/MenuScreen';

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

    const content = useMemo(() => {
        if (loading) {
            return (
                <View style={styles.loadingContainer}>
                    <Loading label="Abrindo aplicativo..." />
                </View>
            );
        }

        if (user) {
            return <MenuScreen />;
        }

        return <LoginScreen />;
    }, [loading, user]);

    return content;
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0F172A',
    },
});