import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from './Avatar';

type ConversationItemProps = {
    type: 'direct' | 'group';
    title: string;
    subtitle?: string;
    photoUrl?: string;
    onPress: () => void;
};

export const ConversationItem = ({ type, title, subtitle, photoUrl, onPress }: ConversationItemProps) => {
    return (
        <Pressable style={styles.card} onPress={onPress}>
            <Avatar name={title} photoUrl={photoUrl} size={48} />
            <View style={styles.info}>
                <View style={styles.titleRow}>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.badge}>{type === 'group' ? 'Grupo' : 'Direto'}</Text>
                </View>
                {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#111827',
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: '#243044',
    },
    info: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    title: {
        color: '#F8FAFC',
        fontSize: 16,
        fontWeight: '700',
    },
    badge: {
        color: '#38BDF8',
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    subtitle: {
        color: '#CBD5E1',
        fontSize: 13,
        marginTop: 2,
    },
});
