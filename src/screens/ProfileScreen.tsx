import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../components/Avatar';
import type { ChatUser } from '../types/user';

type ProfileScreenProps = {
    user: ChatUser;
    onBack: () => void;
};

const formatField = (value: string, fallback: string): string => {
    return value.trim().length > 0 ? value : fallback;
};

export const ProfileScreen = ({ user, onBack }: ProfileScreenProps) => {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable style={styles.backButton} onPress={onBack}>
                    <Text style={styles.backText}>Voltar</Text>
                </Pressable>
                <Text style={styles.title}>Perfil</Text>
            </View>

            <View style={styles.content}>
                <Avatar name={user.name} photoUrl={user.photoUrl} size={96} />
                <Text style={styles.name}>{user.name}</Text>

                <View style={styles.infoCard}>
                    <InfoRow label="E-mail" value={formatField(user.email, 'Não informado')} />
                    <InfoRow label="Celular" value={formatField(user.phoneNumber, 'Não informado')} />
                    <InfoRow label="Nascimento" value={formatField(user.birthDate, 'Não informado')} />
                </View>
            </View>
        </View>
    );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
        gap: 12,
    },
    backButton: {
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 10,
        backgroundColor: '#111827',
    },
    backText: {
        color: '#E2E8F0',
        fontWeight: '700',
    },
    title: {
        color: '#F8FAFC',
        fontSize: 22,
        fontWeight: '700',
    },
    content: {
        alignItems: 'center',
        padding: 24,
        gap: 16,
    },
    name: {
        color: '#F8FAFC',
        fontSize: 22,
        fontWeight: '700',
    },
    infoCard: {
        width: '100%',
        backgroundColor: '#111827',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#243044',
        padding: 16,
        gap: 14,
    },
    infoRow: {
        gap: 2,
    },
    infoLabel: {
        color: '#38BDF8',
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    infoValue: {
        color: '#F8FAFC',
        fontSize: 16,
    },
});
