import { StyleSheet, Text, View } from 'react-native';

type ErrorMessageProps = {
    message: string;
};

export const ErrorMessage = ({ message }: ErrorMessageProps) => {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>{message}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#450A0A',
        borderWidth: 1,
        borderColor: '#B91C1C',
        borderRadius: 12,
        padding: 12,
    },
    text: {
        color: '#FCA5A5',
        fontSize: 13,
    },
});
