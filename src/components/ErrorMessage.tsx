import { Text, View } from 'react-native';

type ErrorMessageProps = {
    message: string;
};

export const ErrorMessage = ({ message }: ErrorMessageProps) => {
    return (
        <View>
            <Text>{message}</Text>
        </View>
    );
};
