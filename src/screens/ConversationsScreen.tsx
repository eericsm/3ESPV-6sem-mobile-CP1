import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { ConversationItem } from '../components/ConversationItem';
import { subscribeToDirectConversations } from '../services/chatService';
import { getGroupById, subscribeToUserGroups } from '../services/groupService';
import { getUserProfile, getUsersByIds } from '../services/userService';
import { useAuth } from '../hooks/useAuth';
import { ChatScreen, type ChatTarget } from './ChatScreen';
import { GroupFormScreen } from './GroupFormScreen';
import { UsersScreen } from './UsersScreen';
import type { DirectConversation } from '../types/chat';
import type { ChatGroup } from '../types/group';
import type { ChatUser } from '../types/user';
import type { NotificationPayload } from '../types/notification';

type ListItem =
    | { kind: 'direct'; conversation: DirectConversation; participant: ChatUser | null }
    | { kind: 'group'; group: ChatGroup };

type ScreenView = 'list' | 'users' | 'groupForm';

type ConversationsScreenProps = {
    pendingNotification?: NotificationPayload | null;
    onPendingNotificationHandled?: () => void;
};

export const ConversationsScreen = ({
    pendingNotification,
    onPendingNotificationHandled,
}: ConversationsScreenProps) => {
    const { user, signOut, loading: authLoading } = useAuth();
    const [view, setView] = useState<ScreenView>('list');
    const [conversations, setConversations] = useState<DirectConversation[]>([]);
    const [groups, setGroups] = useState<ChatGroup[]>([]);
    const [participantsById, setParticipantsById] = useState<Map<string, ChatUser>>(new Map());
    const [chatTarget, setChatTarget] = useState<ChatTarget | null>(null);
    const [editingGroup, setEditingGroup] = useState<ChatGroup | null>(null);

    useEffect(() => {
        if (!user) {
            return;
        }

        const unsubscribeConversations = subscribeToDirectConversations(user.uid, setConversations);
        const unsubscribeGroups = subscribeToUserGroups(user.uid, setGroups);

        return () => {
            unsubscribeConversations();
            unsubscribeGroups();
        };
    }, [user]);

    useEffect(() => {
        if (!user || conversations.length === 0) {
            return;
        }

        const otherUserIds = Array.from(
            new Set(
                conversations.map((conversation) =>
                    conversation.participants.find((participantId) => participantId !== user.uid) ?? '',
                ),
            ),
        ).filter(Boolean);

        const missingIds = otherUserIds.filter((uid) => !participantsById.has(uid));

        if (missingIds.length === 0) {
            return;
        }

        let isMounted = true;

        getUsersByIds(missingIds).then((users) => {
            if (!isMounted) {
                return;
            }

            setParticipantsById((current) => {
                const next = new Map(current);
                users.forEach((fetchedUser) => next.set(fetchedUser.uid, fetchedUser));
                return next;
            });
        });

        return () => {
            isMounted = false;
        };
    }, [conversations, user, participantsById]);

    useEffect(() => {
        if (!pendingNotification || !user) {
            return;
        }

        let isMounted = true;

        const openFromNotification = async () => {
            if (pendingNotification.conversationType === 'group') {
                const existingGroup = groups.find((group) => group.id === pendingNotification.conversationId);
                const resolvedGroup = existingGroup ?? (await getGroupById(pendingNotification.conversationId));

                if (isMounted && resolvedGroup) {
                    setChatTarget({ type: 'group', group: resolvedGroup });
                }

                return;
            }

            const otherUserId = pendingNotification.conversationId
                .split('_')
                .find((id) => id !== user.uid);

            if (!otherUserId) {
                return;
            }

            const participant = await getUserProfile(otherUserId);

            if (isMounted && participant) {
                setChatTarget({ type: 'direct', participant });
            }
        };

        void openFromNotification().finally(() => {
            onPendingNotificationHandled?.();
        });

        return () => {
            isMounted = false;
        };
    }, [pendingNotification, user, groups, onPendingNotificationHandled]);

    const items = useMemo<ListItem[]>(() => {
        if (!user) {
            return [];
        }

        const directItems: ListItem[] = conversations.map((conversation) => {
            const otherUserId = conversation.participants.find((id) => id !== user.uid) ?? '';
            return {
                kind: 'direct',
                conversation,
                participant: participantsById.get(otherUserId) ?? null,
            };
        });

        const groupItems: ListItem[] = groups.map((group) => ({ kind: 'group', group }));

        return [...directItems, ...groupItems].sort((first, second) => {
            const firstTime = first.kind === 'direct' ? first.conversation.createdAt : first.group.updatedAt;
            const secondTime = second.kind === 'direct' ? second.conversation.createdAt : second.group.updatedAt;
            return secondTime - firstTime;
        });
    }, [conversations, groups, participantsById, user]);

    if (!user) {
        return null;
    }

    if (chatTarget) {
        return <ChatScreen currentUser={user} target={chatTarget} onBack={() => setChatTarget(null)} />;
    }

    if (view === 'users') {
        return (
            <View style={styles.subScreen}>
                <View style={styles.header}>
                    <Pressable style={styles.backButton} onPress={() => setView('list')}>
                        <Text style={styles.backText}>Voltar</Text>
                    </Pressable>
                    <Text style={styles.headerTitle}>Nova conversa</Text>
                </View>
                <View style={styles.subScreenContent}>
                    <UsersScreen
                        currentUser={user}
                        onSelectUser={(selectedUser) => {
                            setView('list');
                            setChatTarget({ type: 'direct', participant: selectedUser });
                        }}
                    />
                </View>
            </View>
        );
    }

    if (view === 'groupForm') {
        return (
            <GroupFormScreen
                currentUser={user}
                existingGroup={editingGroup}
                onBack={() => {
                    setView('list');
                    setEditingGroup(null);
                }}
                onSaved={(group) => {
                    setView('list');
                    setEditingGroup(null);
                    setChatTarget({ type: 'group', group });
                }}
            />
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <View style={styles.identityCard}>
                    <Text style={styles.label}>Usuário</Text>
                    <Text style={styles.value}>{user.name}</Text>
                    <Text style={styles.meta}>{user.email}</Text>
                </View>

                <Pressable style={styles.logoutButton} onPress={signOut} disabled={authLoading}>
                    {authLoading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.logoutText}>Sair</Text>
                    )}
                </Pressable>
            </View>

            <View style={styles.actionsRow}>
                <Pressable style={styles.actionButton} onPress={() => setView('users')}>
                    <Text style={styles.actionButtonText}>Nova conversa</Text>
                </Pressable>
                <Pressable
                    style={styles.actionButton}
                    onPress={() => {
                        setEditingGroup(null);
                        setView('groupForm');
                    }}
                >
                    <Text style={styles.actionButtonText}>Criar grupo</Text>
                </Pressable>
            </View>

            <Text style={styles.title}>Conversas</Text>

            {items.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>Nenhuma conversa ainda. Comece uma conversa ou crie um grupo.</Text>
                </View>
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={(item) => (item.kind === 'direct' ? item.conversation.id : item.group.id)}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => {
                        if (item.kind === 'direct') {
                            return (
                                <ConversationItem
                                    type="direct"
                                    title={item.participant?.name ?? 'Usuário'}
                                    photoUrl={item.participant?.photoUrl}
                                    onPress={() => {
                                        if (item.participant) {
                                            setChatTarget({ type: 'direct', participant: item.participant });
                                        }
                                    }}
                                />
                            );
                        }

                        return (
                            <ConversationItem
                                type="group"
                                title={item.group.name}
                                photoUrl={item.group.photoUrl}
                                subtitle={`${item.group.memberIds.length} integrante(s)`}
                                onPress={() => setChatTarget({ type: 'group', group: item.group })}
                            />
                        );
                    }}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
        padding: 20,
        gap: 16,
    },
    subScreen: {
        flex: 1,
        backgroundColor: '#0F172A',
    },
    subScreenContent: {
        flex: 1,
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
        gap: 12,
    },
    headerTitle: {
        color: '#F8FAFC',
        fontSize: 20,
        fontWeight: '700',
    },
    backButton: {
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 10,
        backgroundColor: '#111827',
    },
    backText: {
        color: '#E2E8F0',
        fontWeight: '700',
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
    actionsRow: {
        flexDirection: 'row',
        gap: 10,
    },
    actionButton: {
        flex: 1,
        minHeight: 48,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#334155',
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionButtonText: {
        color: '#38BDF8',
        fontWeight: '700',
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
    },
});
