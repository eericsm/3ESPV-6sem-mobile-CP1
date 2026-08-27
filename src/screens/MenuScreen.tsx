import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import type { ChatUser } from '../types/user';
import { ChatScreen } from './ChatScreen';
import { UsersScreen } from './UsersScreen';

export const MenuScreen = () => {
    const { user, signOut, loading } = useAuth();
    const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);

    if (!user) {
        return null;
    }

    if (selectedUser) {
        return (
            <ChatScreen
                currentUser={user}
                participant={selectedUser}
                onBack={() => setSelectedUser(null)}
            />
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <View style={styles.identityCard}>
                    <Text style={styles.label}>Usuário</Text>
                    <Text style={styles.value}>{user.name}</Text>
                    <Text style={styles.meta}>{user.email ?? 'Sem e-mail'}</Text>
                    <Text style={styles.meta}>Provider: {user.provider}</Text>
                </View>

                <Pressable style={styles.logoutButton} onPress={signOut} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.logoutText}>Sair</Text>
                    )}
                </Pressable>
            </View>

            <UsersScreen currentUser={user} onSelectUser={setSelectedUser} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
        padding: 20,
        gap: 18,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    identityCard: {
        flex: 1,
        backgroundColor: '#111827',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: '#243044',
    },
    label: {
        color: '#38BDF8',
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    value: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '700',
        marginTop: 6,
    },
    meta: {
        color: '#CBD5E1',
        fontSize: 13,
        marginTop: 4,
    },
    logoutButton: {
        minWidth: 90,
        minHeight: 52,
        borderRadius: 14,
        backgroundColor: '#EF4444',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoutText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
});
