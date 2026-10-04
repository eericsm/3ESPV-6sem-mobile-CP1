import { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { Avatar } from '../components/Avatar';
import { ErrorMessage } from '../components/ErrorMessage';
import { useAuth } from '../hooks/useAuth';
import { pickImageFromLibrary } from '../utils/imagePicker';

const BIRTH_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

type RegisterScreenProps = {
    onBackToLogin: () => void;
};

export const RegisterScreen = ({ onBackToLogin }: RegisterScreenProps) => {
    const { signUp, loading, error, clearError, setError } = useAuth();
    const [name, setName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [phoneNumber, setPhoneNumber] = useState<string>('');
    const [birthDate, setBirthDate] = useState<string>('');
    const [photoLocalUri, setPhotoLocalUri] = useState<string | null>(null);

    const handlePickPhoto = async () => {
        clearError();

        try {
            const uri = await pickImageFromLibrary();

            if (uri) {
                setPhotoLocalUri(uri);
            }
        } catch (caughtError) {
            setError(
                caughtError instanceof Error ? caughtError.message : 'Não foi possível selecionar a foto',
            );
        }
    };

    const handleSubmit = async () => {
        clearError();

        if (!name.trim() || !email.trim() || !password.trim() || !phoneNumber.trim() || !birthDate.trim()) {
            setError('Preencha todos os campos obrigatórios');
            return;
        }

        if (password !== confirmPassword) {
            setError('As senhas não coincidem');
            return;
        }

        if (!BIRTH_DATE_PATTERN.test(birthDate.trim())) {
            setError('Informe a data de nascimento no formato AAAA-MM-DD');
            return;
        }

        try {
            await signUp({
                name: name.trim(),
                email: email.trim(),
                password,
                phoneNumber: phoneNumber.trim(),
                birthDate: birthDate.trim(),
                photoLocalUri,
            });
        } catch {
            // erro já fica disponível via contexto de autenticação
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.card}>
                    <Text style={styles.title}>Criar conta</Text>
                    <Text style={styles.subtitle}>Cadastre-se com e-mail e senha.</Text>

                    <Pressable style={styles.photoPicker} onPress={handlePickPhoto}>
                        <Avatar name={name || '?'} photoUrl={photoLocalUri ?? undefined} size={72} />
                        <Text style={styles.photoPickerLabel}>
                            {photoLocalUri ? 'Trocar foto' : 'Escolher foto de perfil'}
                        </Text>
                    </Pressable>

                    <TextInput
                        style={styles.input}
                        placeholder="Nome"
                        placeholderTextColor="#64748B"
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                    />

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

                    <TextInput
                        style={styles.input}
                        placeholder="Confirmar senha"
                        placeholderTextColor="#64748B"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Número de celular"
                        placeholderTextColor="#64748B"
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        keyboardType="phone-pad"
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Data de nascimento (AAAA-MM-DD)"
                        placeholderTextColor="#64748B"
                        value={birthDate}
                        onChangeText={setBirthDate}
                        keyboardType="numbers-and-punctuation"
                    />

                    {error ? <ErrorMessage message={error} /> : null}

                    <Pressable style={styles.primaryButton} onPress={handleSubmit} disabled={loading}>
                        {loading ? (
                            <ActivityIndicator color="#082F49" />
                        ) : (
                            <Text style={styles.primaryButtonText}>Criar conta</Text>
                        )}
                    </Pressable>

                    <Pressable style={styles.secondaryButton} onPress={onBackToLogin} disabled={loading}>
                        <Text style={styles.secondaryButtonText}>Já tenho conta</Text>
                    </Pressable>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
    },
    scrollContent: {
        flexGrow: 1,
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
    photoPicker: {
        alignItems: 'center',
        gap: 8,
    },
    photoPickerLabel: {
        color: '#38BDF8',
        fontSize: 13,
        fontWeight: '600',
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
