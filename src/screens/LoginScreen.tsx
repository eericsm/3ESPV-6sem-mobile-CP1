import { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { ErrorMessage } from '../components/ErrorMessage';
import { useAuth } from '../hooks/useAuth';

type LoginScreenProps = {
    onCreateAccount: () => void;
};

export const LoginScreen = ({ onCreateAccount }: LoginScreenProps) => {
    const { signIn, loading, error, clearError } = useAuth();
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');

    const handleSubmit = async () => {
        clearError();

        if (!email.trim() || !password.trim()) {
            return;
        }

        try {
            await signIn({ email: email.trim(), password });
        } catch {
            // erro já fica disponível via contexto de autenticação
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={styles.card}>
                <Text style={styles.title}>Entrar</Text>
                <Text style={styles.subtitle}>Use seu e-mail e senha para acessar o app.</Text>

                <TextInput
                    style={styles.input}
                    placeholder="E-mail"
                    placeholderTextColor="#64748B"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />

                <TextInput
                    style={styles.input}
                    placeholder="Senha"
                    placeholderTextColor="#64748B"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                {error ? <ErrorMessage message={error} /> : null}

                <Pressable style={styles.primaryButton} onPress={handleSubmit} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator color="#082F49" />
                    ) : (
                        <Text style={styles.primaryButtonText}>Entrar</Text>
                    )}
                </Pressable>

                <Pressable style={styles.secondaryButton} onPress={onCreateAccount} disabled={loading}>
                    <Text style={styles.secondaryButtonText}>Criar conta</Text>
                </Pressable>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
        justifyContent: 'center',
        padding: 24,
    },
    card: {
        gap: 14,
        backgroundColor: '#111827',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: '#243044',
    },
    title: {
        color: '#F8FAFC',
        fontSize: 28,
        fontWeight: '700',
    },
    subtitle: {
        color: '#CBD5E1',
        fontSize: 14,
        lineHeight: 20,
    },
    input: {
        backgroundColor: '#0B1220',
        color: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#334155',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    primaryButton: {
        minHeight: 52,
        borderRadius: 14,
        backgroundColor: '#38BDF8',
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButtonText: {
        color: '#082F49',
        fontWeight: '700',
        fontSize: 16,
    },
    secondaryButton: {
        minHeight: 52,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#334155',
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryButtonText: {
        color: '#E2E8F0',
        fontWeight: '600',
        fontSize: 15,
    },
});
