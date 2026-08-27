import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ChatUser } from '../types/user';

type UserItemProps = {
    user: ChatUser;
    onPress: (user: ChatUser) => void;
};

export const UserItem = ({ user, onPress }: UserItemProps) => {
    return (
        <Pressable style={styles.card} onPress={() => onPress(user)}>
            <View>
                <Text style={styles.name}>{user.name}</Text>
                <Text style={styles.meta}>{user.email ?? 'Sem e-mail'}</Text>
                <Text style={styles.meta}>Provider: {user.provider}</Text>
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#111827',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#243044',
    },
    name: {
        color: '#F8FAFC',
        fontSize: 18,
        fontWeight: '700',
    },
    meta: {
        color: '#CBD5E1',
        fontSize: 13,
        marginTop: 4,
    },
});
