import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../hooks/useAuth';

export const MenuScreen = () => {
    const { user, signOut, loading } = useAuth();

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Menu</Text>
            <Text style={styles.subtitle}>Você entrou com sucesso e já pode seguir para o chat.</Text>

            <View style={styles.card}>
                <Text style={styles.label}>Usuário</Text>
                <Text style={styles.value}>{user?.name}</Text>
                <Text style={styles.meta}>{user?.email ?? 'Sem e-mail'}</Text>
                <Text style={styles.meta}>Provider: {user?.provider}</Text>
            </View>

            <Pressable style={styles.button} onPress={signOut} disabled={loading}>
                {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Sair</Text>}
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
        padding: 24,
        justifyContent: 'center',
        gap: 18,
    },
    title: {
        color: '#F8FAFC',
        fontSize: 30,
        fontWeight: '700',
    },
    subtitle: {
        color: '#CBD5E1',
        fontSize: 15,
        lineHeight: 22,
    },
    card: {
        backgroundColor: '#111827',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#243044',
        gap: 8,
    },
    label: {
        color: '#38BDF8',
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    value: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: '700',
    },
    meta: {
        color: '#CBD5E1',
        fontSize: 14,
    },
    button: {
        minHeight: 52,
        borderRadius: 14,
        backgroundColor: '#EF4444',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
