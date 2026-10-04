import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { Loading } from '../components/Loading';
import { UserItem } from '../components/UserItem';
import { listAllUsers } from '../services/userService';
import type { ChatUser } from '../types/user';

type UsersScreenProps = {
    currentUser: ChatUser;
    onSelectUser: (user: ChatUser) => void;
    selectedUserIds?: string[];
};

export const UsersScreen = ({ currentUser, onSelectUser, selectedUserIds = [] }: UsersScreenProps) => {
    const [users, setUsers] = useState<ChatUser[]>([]);
    const [search, setSearch] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const fetchUsers = async () => {
            try {
                setLoading(true);
                setError(null);
                const allUsers = await listAllUsers(currentUser.uid);
                if (isMounted) {
                    setUsers(allUsers);
                }
            } catch (caughtError) {
                if (isMounted) {
                    const message =
                        caughtError instanceof Error ? caughtError.message : 'Não foi possível carregar os usuários';
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
    }, [currentUser.uid]);

    const normalizedSearch = search.trim().toLowerCase();
    const filteredUsers = normalizedSearch
        ? users.filter((user) => user.name.toLowerCase().includes(normalizedSearch))
        : users;

    if (loading) {
        return <Loading label="Carregando usuários..." />;
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
            <TextInput
                style={styles.search}
                placeholder="Buscar por nome"
                placeholderTextColor="#64748B"
                value={search}
                onChangeText={setSearch}
                autoCapitalize="none"
            />

            {filteredUsers.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>Nenhum usuário encontrado.</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredUsers}
                    keyExtractor={(user) => user.uid}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => (
                        <UserItem
                            user={item}
                            selected={selectedUserIds.includes(item.uid)}
                            onPress={() => onSelectUser(item)}
                        />
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
    search: {
        backgroundColor: '#0B1220',
        color: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#334155',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 12,
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
    },
    errorText: {
        color: '#FCA5A5',
        fontSize: 14,
        textAlign: 'center',
    },
});
