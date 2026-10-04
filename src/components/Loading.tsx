import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

type LoadingProps = {
    label?: string;
};

export const Loading = ({ label = 'Carregando...' }: LoadingProps) => {
    return (
        <View style={styles.container}>
            <ActivityIndicator color="#38BDF8" />
            <Text style={styles.label}>{label}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    label: {
        color: '#CBD5E1',
        fontSize: 14,
    },
});
