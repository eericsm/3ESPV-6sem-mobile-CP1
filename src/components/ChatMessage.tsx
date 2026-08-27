import { StyleSheet, Text, View } from 'react-native';
import type { ChatMessage as ChatMessageType } from '../types/chat';

type ChatMessageProps = {
    message: ChatMessageType;
    isMine: boolean;
    senderName?: string;
};

export const ChatMessage = ({ message, isMine, senderName = 'Contato' }: ChatMessageProps) => {
    return (
        <View style={[styles.bubble, isMine ? styles.mine : styles.other]}>
            <Text style={[styles.label, isMine ? styles.mineLabel : styles.otherLabel]}>
                {isMine ? 'Você' : senderName}
            </Text>
            <Text style={styles.text}>{message.text}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    bubble: {
        maxWidth: '80%',
        borderRadius: 16,
        padding: 12,
    },
    mine: {
        backgroundColor: '#38BDF8',
        alignSelf: 'flex-end',
    },
    other: {
        backgroundColor: '#111827',
        alignSelf: 'flex-start',
    },
    label: {
        fontSize: 11,
        fontWeight: '700',
        marginBottom: 4,
    },
    mineLabel: {
        color: '#082F49',
    },
    otherLabel: {
        color: '#CBD5E1',
    },
    text: {
        color: '#F8FAFC',
        fontSize: 15,
    },
});
