import { useEffect, useState } from 'react';
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
import * as AppleAuthentication from 'expo-apple-authentication';
import { AppleAuthenticationButton } from 'expo-apple-authentication';
import { ErrorMessage } from '../components/ErrorMessage';
import { useAuth } from '../hooks/useAuth';
import { signInWithApple, signInWithGoogle } from '../services/authService';

export const LoginScreen = () => {
    const { signIn, signUp, loading, error, clearError, setError } = useAuth();
    const [isCreatingAccount, setIsCreatingAccount] = useState<boolean>(false);
    const [name, setName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [providerLoading, setProviderLoading] = useState<'google' | 'apple' | null>(null);
    const [appleAvailable, setAppleAvailable] = useState<boolean>(false);

    useEffect(() => {
        void AppleAuthentication.isAvailableAsync()
            .then((available) => setAppleAvailable(available))
            .catch(() => setAppleAvailable(false));
    }, []);

    const handleSubmit = async () => {
        clearError();

        if (!email.trim() || !password.trim()) {
            return;
        }

        if (isCreatingAccount) {
            if (!name.trim()) {
                return;
            }

            await signUp({ name: name.trim(), email: email.trim(), password });
            return;
        }

        await signIn({ email: email.trim(), password });
    };

    const handleGoogleSignIn = async () => {
        clearError();
        setProviderLoading('google');

        try {
            await signInWithGoogle();
        } catch (caughtError) {
            const message =
                caughtError instanceof Error
                    ? caughtError.message
                    : 'Não foi possível entrar com Google. Verifique o redirect URI no Google Cloud Console.';
            setError(message);
        } finally {
            setProviderLoading(null);
        }
    };

    const handleAppleSignIn = async () => {
        clearError();
        setProviderLoading('apple');

        try {
            await signInWithApple();
        } catch (caughtError) {
            const message =
                caughtError instanceof Error
                    ? caughtError.message
                    : 'Não foi possível entrar com Apple neste dispositivo.';
            setError(message);
        } finally {
            setProviderLoading(null);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={styles.card}>
                <Text style={styles.title}>{isCreatingAccount ? 'Criar conta' : 'Entrar'}</Text>
                <Text style={styles.subtitle}>
                    Use e-mail/senha, Google ou Apple para acessar o app.
                </Text>

                {isCreatingAccount ? (
                    <TextInput
                        style={styles.input}
                        placeholder="Nome"
                        placeholderTextColor="#64748B"
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                    />
                ) : null}

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
                        <Text style={styles.primaryButtonText}>
                            {isCreatingAccount ? 'Criar conta' : 'Entrar'}
                        </Text>
                    )}
                </Pressable>

                <Pressable
                    style={styles.secondaryButton}
                    onPress={() => setIsCreatingAccount((currentValue) => !currentValue)}
                    disabled={loading}
                >
                    <Text style={styles.secondaryButtonText}>
                        {isCreatingAccount ? 'Já tenho conta' : 'Criar conta'}
                    </Text>
                </Pressable>

                <View style={styles.divider} />

                <Pressable
                    style={styles.googleButton}
                    onPress={handleGoogleSignIn}
                    disabled={loading || providerLoading !== null}
                >
                    {providerLoading === 'google' ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.providerButtonText}>Entrar com Google</Text>
                    )}
                </Pressable>

                {appleAvailable ? (
                    <AppleAuthenticationButton
                        buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                        cornerRadius={14}
                        style={styles.appleButton}
                        onPress={handleAppleSignIn}
                    />
                ) : null}
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
    divider: {
        height: 1,
        backgroundColor: '#334155',
        marginVertical: 4,
    },
    googleButton: {
        minHeight: 52,
        borderRadius: 14,
        backgroundColor: '#EA4335',
        alignItems: 'center',
        justifyContent: 'center',
    },
    appleButton: {
        width: '100%',
        height: 52,
    },
    providerButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 15,
    },
});
