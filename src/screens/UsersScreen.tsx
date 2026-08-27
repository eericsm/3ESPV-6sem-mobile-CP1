import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { UserItem } from '../components/UserItem';
import { listCompatibleUsers } from '../services/chatService';
import type { ChatUser } from '../types/user';

type UsersScreenProps = {
    currentUser: ChatUser;
    onSelectUser: (user: ChatUser) => void;
};

export const UsersScreen = ({ currentUser, onSelectUser }: UsersScreenProps) => {
    const [users, setUsers] = useState<ChatUser[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const fetchUsers = async () => {
            try {
                setLoading(true);
                setError(null);
                const compatibleUsers = await listCompatibleUsers(currentUser);
                if (isMounted) {
                    setUsers(compatibleUsers);
                }
            } catch (caughtError) {
                if (isMounted) {
                    const message =
                        caughtError instanceof Error ? caughtError.message : 'Não foi possível carregar os contatos';
                    setError(message);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        void fetchUsers();

        return () => {
            isMounted = false;
        };
    }, [currentUser]);

    if (loading) {
        return (
            <View style={styles.emptyState}>
                <ActivityIndicator color="#38BDF8" />
                <Text style={styles.emptyText}>Carregando contatos...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.emptyState}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Contatos</Text>

            {users.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>Nenhum contato disponível para o seu tipo de login.</Text>
                </View>
            ) : (
                <FlatList
                    data={users}
                    keyExtractor={(user) => user.uid}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => (
                        <UserItem user={item} onPress={() => onSelectUser(item)} />
                    )}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        gap: 12,
    },
    title: {
        color: '#F8FAFC',
        fontSize: 24,
        fontWeight: '700',
    },
    listContent: {
        gap: 10,
        paddingBottom: 20,
    },
    emptyState: {
        flex: 1,
        minHeight: 180,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#111827',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#243044',
        padding: 20,
    },
    emptyText: {
        color: '#CBD5E1',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 12,
    },
    errorText: {
        color: '#FCA5A5',
        fontSize: 14,
        textAlign: 'center',
    },
});
