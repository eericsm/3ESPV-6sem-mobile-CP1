import { Pressable, Text, TextInput, View } from 'react-native';

type ChatInputProps = {
    value: string;
    onChangeText: (text: string) => void;
    onSend: () => void;
    disabled?: boolean;
};

export const ChatInput = ({ value, onChangeText, onSend, disabled }: ChatInputProps) => {
    return (
        <View>
            <TextInput value={value} onChangeText={onChangeText} placeholder="Digite uma mensagem" />
            <Pressable onPress={onSend} disabled={disabled}>
                <Text>Enviar</Text>
            </Pressable>
        </View>
    );
};
