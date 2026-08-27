import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { ChatMessage } from '../components/ChatMessage';
import { getOrCreateConversation, sendMessage, subscribeToMessages } from '../services/chatService';
import type { ChatMessage as ChatMessageType } from '../types/chat';
import type { ChatUser } from '../types/user';

type ChatScreenProps = {
    currentUser: ChatUser;
    participant: ChatUser;
    onBack: () => void;
};

export const ChatScreen = ({ currentUser, participant, onBack }: ChatScreenProps) => {
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessageType[]>([]);
    const [draft, setDraft] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [sending, setSending] = useState<boolean>(false);
    const flatListRef = useRef<FlatList<ChatMessageType>>(null);

    useEffect(() => {
        let isMounted = true;
        let unsubscribe: (() => void) | undefined;

        const initConversation = async () => {
            try {
                const conversation = await getOrCreateConversation(currentUser.uid, participant.uid);
                if (!isMounted) {
                    return;
                }

                setConversationId(conversation.id);
                unsubscribe = subscribeToMessages(conversation.id, (nextMessages) => {
                    if (isMounted) {
                        setMessages(nextMessages);
                        setLoading(false);
                    }
                });
            } catch {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        void initConversation();

        return () => {
            isMounted = false;
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [currentUser.uid, participant.uid]);

    useEffect(() => {
        if (messages.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: true });
        }
    }, [messages]);

    const handleSendMessage = async () => {
        const trimmed = draft.trim();

        if (!trimmed || !conversationId || sending) {
            return;
        }

        setSending(true);

        try {
            await sendMessage(conversationId, {
                conversationId,
                senderId: currentUser.uid,
                receiverId: participant.uid,
                text: trimmed,
            });
            setDraft('');
        } finally {
            setSending(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={styles.header}>
                <Pressable style={styles.backButton} onPress={onBack}>
                    <Text style={styles.backText}>Voltar</Text>
                </Pressable>
                <Text style={styles.title}>{participant.name}</Text>
            </View>

            {loading ? (
                <View style={styles.centerState}>
                    <ActivityIndicator color="#38BDF8" />
                    <Text style={styles.centerText}>Carregando conversa...</Text>
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
                                    senderName={
                                        item.senderId === currentUser.uid ? currentUser.name : participant.name
                                    }
                                />
                            )}
                        />
                    )}
                </>
            )}

            <View style={styles.inputRow}>
                <TextInput
                    style={styles.input}
                    value={draft}
                    onChangeText={setDraft}
                    placeholder="Digite sua mensagem"
                    placeholderTextColor="#64748B"
                    multiline
                />

                <Pressable
                    style={[styles.sendButton, (!draft.trim() || sending) && styles.sendButtonDisabled]}
                    onPress={handleSendMessage}
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
    title: {
        color: '#F8FAFC',
        fontSize: 22,
        fontWeight: '700',
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
