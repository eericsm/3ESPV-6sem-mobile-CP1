import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from './Avatar';
import type { ChatUser } from '../types/user';

type UserItemProps = {
    user: ChatUser;
    onPress: (user: ChatUser) => void;
    selected?: boolean;
};

export const UserItem = ({ user, onPress, selected = false }: UserItemProps) => {
    return (
        <Pressable
            style={[styles.card, selected && styles.cardSelected]}
            onPress={() => onPress(user)}
        >
            <Avatar name={user.name} photoUrl={user.photoUrl} size={44} />
            <View style={styles.info}>
                <Text style={styles.name}>{user.name}</Text>
            </View>
            {selected ? <Text style={styles.selectedMark}>✓</Text> : null}
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
    cardSelected: {
        borderColor: '#38BDF8',
        backgroundColor: '#0C2233',
    },
    info: {
        flex: 1,
    },
    name: {
        color: '#F8FAFC',
        fontSize: 16,
        fontWeight: '700',
    },
    selectedMark: {
        color: '#38BDF8',
        fontSize: 18,
        fontWeight: '700',
    },
});
