import { useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { Avatar } from '../components/Avatar';
import { ChatMessage } from '../components/ChatMessage';
import { GroupMemberItem } from '../components/GroupMemberItem';
import { ProfileScreen } from './ProfileScreen';
import { getOrCreateDirectConversation, registerSelfAsConversationMember } from '../services/chatService';
import { getUsersByIds } from '../services/userService';
import { useChat } from '../hooks/useChat';
import { isGroupOwner } from '../utils/groupValidation';
import type { ChatGroup } from '../types/group';
import type { ChatUser } from '../types/user';

export type ChatTarget =
    | { type: 'direct'; participant: ChatUser }
    | { type: 'group'; group: ChatGroup };

type ChatScreenProps = {
    currentUser: ChatUser;
    target: ChatTarget;
    onBack: () => void;
};

export const ChatScreen = ({ currentUser, target, onBack }: ChatScreenProps) => {
    const [conversationId, setConversationId] = useState<string | null>(
        target.type === 'group' ? target.group.id : null,
    );
    const [resolvingConversation, setResolvingConversation] = useState<boolean>(target.type === 'direct');
    const [resolveError, setResolveError] = useState<string | null>(null);
    const [groupMembers, setGroupMembers] = useState<ChatUser[]>([]);
    const [draft, setDraft] = useState<string>('');
    const [mentionedMember, setMentionedMember] = useState<ChatUser | null>(null);
    const [showMembers, setShowMembers] = useState<boolean>(false);
    const [viewingProfile, setViewingProfile] = useState<ChatUser | null>(null);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        if (target.type !== 'direct') {
            return;
        }

        let isMounted = true;

        getOrCreateDirectConversation(currentUser.uid, target.participant.uid)
            .then((conversation) => {
                if (isMounted) {
                    setConversationId(conversation.id);
                }
            })
            .catch((caughtError) => {
                if (isMounted) {
                    setResolveError(
                        caughtError instanceof Error ? caughtError.message : 'Não foi possível abrir a conversa',
                    );
                }
            })
            .finally(() => {
                if (isMounted) {
                    setResolvingConversation(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [target, currentUser.uid]);

    useEffect(() => {
        if (target.type !== 'group') {
            return;
        }

        void registerSelfAsConversationMember(target.group.id, currentUser.uid);
    }, [target, currentUser.uid]);

    useEffect(() => {
        if (target.type !== 'group') {
            setGroupMembers([]);
            return;
        }

        let isMounted = true;

        getUsersByIds(target.group.memberIds)
            .then((members) => {
                if (isMounted) {
                    setGroupMembers(members);
                }
            })
            .catch(() => {
                if (isMounted) {
                    setGroupMembers([]);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [target]);

    const { messages, loading, sending, error, send } = useChat(
        conversationId,
        target.type,
        currentUser.uid,
    );

    const memberNameById = useMemo(() => {
        const map = new Map<string, string>();
        map.set(currentUser.uid, currentUser.name);

        if (target.type === 'direct') {
            map.set(target.participant.uid, target.participant.name);
        } else {
            groupMembers.forEach((member) => map.set(member.uid, member.name));
        }

        return map;
    }, [target, groupMembers, currentUser]);

    useEffect(() => {
        if (messages.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: true });
        }
    }, [messages]);

    const handleSend = async () => {
        const trimmed = draft.trim();

        if (!trimmed) {
            return;
        }

        try {
            await send(
                trimmed,
                mentionedMember ? { type: 'member', memberId: mentionedMember.uid } : { type: 'conversation' },
                mentionedMember ? [mentionedMember.uid] : [],
            );
            setDraft('');
            setMentionedMember(null);
        } catch {
            // erro de envio é exibido via estado "error" do useChat
        }
    };

    if (viewingProfile) {
        return <ProfileScreen user={viewingProfile} onBack={() => setViewingProfile(null)} />;
    }

    const title = target.type === 'direct' ? target.participant.name : target.group.name;
    const photoUrl = target.type === 'direct' ? target.participant.photoUrl : target.group.photoUrl;

    if (showMembers && target.type === 'group') {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Pressable style={styles.backButton} onPress={() => setShowMembers(false)}>
                        <Text style={styles.backText}>Voltar</Text>
                    </Pressable>
                    <Text style={styles.title}>Integrantes</Text>
                </View>
                <ScrollView contentContainerStyle={styles.membersList}>
                    {groupMembers.map((member) => (
                        <GroupMemberItem
                            key={member.uid}
                            member={member}
                            isOwner={isGroupOwner(target.group, member.uid)}
                            onPress={() => setViewingProfile(member)}
                        />
                    ))}
                </ScrollView>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={styles.header}>
                <Pressable style={styles.backButton} onPress={onBack}>
                    <Text style={styles.backText}>Voltar</Text>
                </Pressable>
                <Pressable
                    style={styles.titleRow}
                    onPress={() => {
                        if (target.type === 'direct') {
                            setViewingProfile(target.participant);
                        } else {
                            setShowMembers(true);
                        }
                    }}
                >
                    <Avatar name={title} photoUrl={photoUrl} size={36} />
                    <Text style={styles.title}>{title}</Text>
                </Pressable>
            </View>

            {resolvingConversation || loading ? (
                <View style={styles.centerState}>
                    <ActivityIndicator color="#38BDF8" />
                    <Text style={styles.centerText}>Carregando conversa...</Text>
                </View>
            ) : resolveError ? (
                <View style={styles.centerState}>
                    <Text style={styles.centerText}>{resolveError}</Text>
                </View>
            ) : (
                <>
                    {messages.length === 0 ? (
                        <View style={styles.centerState}>
                            <Text style={styles.centerText}>Ainda não há mensagens.</Text>
                        </View>
                    ) : (
                        <FlatList
                            ref={flatListRef}
                            data={messages}
                            keyExtractor={(item) => item.id}
                            style={styles.list}
                            contentContainerStyle={styles.listContent}
                            renderItem={({ item }) => (
                                <ChatMessage
                                    message={item}
                                    isMine={item.senderId === currentUser.uid}
                                    senderName={memberNameById.get(item.senderId) ?? 'Contato'}
                                />
                            )}
                        />
                    )}
                </>
            )}

            {error ? (
                <View style={styles.sendErrorBanner}>
                    <Text style={styles.sendErrorText}>{error}</Text>
                </View>
            ) : null}

            {target.type === 'group' && groupMembers.length > 1 ? (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.mentionRow}
                >
                    {groupMembers
                        .filter((member) => member.uid !== currentUser.uid)
                        .map((member) => (
                            <Pressable
                                key={member.uid}
                                style={[
                                    styles.mentionChip,
                                    mentionedMember?.uid === member.uid && styles.mentionChipSelected,
                                ]}
                                onPress={() =>
                                    setMentionedMember((current) =>
                                        current?.uid === member.uid ? null : member,
                                    )
                                }
                            >
                                <Text style={styles.mentionChipText}>
                                    {mentionedMember?.uid === member.uid ? `→ ${member.name}` : member.name}
                                </Text>
                            </Pressable>
                        ))}
                </ScrollView>
            ) : null}

            <View style={styles.inputRow}>
                <TextInput
                    style={styles.input}
                    value={draft}
                    onChangeText={setDraft}
                    placeholder={mentionedMember ? `Mensagem para ${mentionedMember.name}` : 'Digite sua mensagem'}
                    placeholderTextColor="#64748B"
                    multiline
                />

                <Pressable
                    style={[styles.sendButton, (!draft.trim() || sending) && styles.sendButtonDisabled]}
                    onPress={handleSend}
                    disabled={!draft.trim() || sending}
                >
                    {sending ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.sendText}>Enviar</Text>
                    )}
                </Pressable>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
        gap: 12,
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
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    title: {
        color: '#F8FAFC',
        fontSize: 20,
        fontWeight: '700',
    },
    membersList: {
        padding: 16,
        gap: 8,
    },
    list: {
        flex: 1,
        paddingHorizontal: 14,
    },
    listContent: {
        paddingVertical: 12,
        gap: 10,
    },
    centerState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    centerText: {
        color: '#CBD5E1',
        marginTop: 12,
        textAlign: 'center',
    },
    sendErrorBanner: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    sendErrorText: {
        color: '#FCA5A5',
        fontSize: 13,
    },
    mentionRow: {
        paddingHorizontal: 12,
        gap: 8,
        paddingBottom: 8,
    },
    mentionChip: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: '#334155',
    },
    mentionChipSelected: {
        borderColor: '#38BDF8',
        backgroundColor: '#0C2233',
    },
    mentionChipText: {
        color: '#E2E8F0',
        fontSize: 13,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 12,
        gap: 10,
        borderTopWidth: 1,
        borderTopColor: '#1E293B',
        backgroundColor: '#0F172A',
    },
    input: {
        flex: 1,
        minHeight: 48,
        maxHeight: 120,
        backgroundColor: '#111827',
        borderRadius: 14,
        color: '#F8FAFC',
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#334155',
    },
    sendButton: {
        minWidth: 90,
        minHeight: 48,
        backgroundColor: '#38BDF8',
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
    sendText: {
        color: '#082F49',
        fontWeight: '700',
    },
});
