import { Text, View } from 'react-native';
import type { ChatMessage as ChatMessageType } from '../types/chat';

type ChatMessageProps = {
    message: ChatMessageType;
    isMine: boolean;
};

export const ChatMessage = ({ message, isMine }: ChatMessageProps) => {
    return (
        <View>
            <Text>{isMine ? 'Você' : 'Contato'}</Text>
            <Text>{message.text}</Text>
        </View>
    );
};
