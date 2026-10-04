import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from './Avatar';
import type { ChatUser } from '../types/user';

type GroupMemberItemProps = {
    member: ChatUser;
    isOwner?: boolean;
    onPress?: (member: ChatUser) => void;
    onRemove?: (member: ChatUser) => void;
};

export const GroupMemberItem = ({ member, isOwner = false, onPress, onRemove }: GroupMemberItemProps) => {
    return (
        <Pressable style={styles.card} onPress={() => onPress?.(member)}>
            <Avatar name={member.name} photoUrl={member.photoUrl} size={40} />
            <View style={styles.info}>
                <Text style={styles.name}>{member.name}</Text>
                {isOwner ? <Text style={styles.ownerBadge}>Proprietário</Text> : null}
            </View>
            {onRemove ? (
                <Pressable style={styles.removeButton} onPress={() => onRemove(member)}>
                    <Text style={styles.removeText}>Remover</Text>
                </Pressable>
            ) : null}
        </Pressable>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#111827',
        borderRadius: 14,
        padding: 12,
        borderWidth: 1,
        borderColor: '#243044',
    },
    info: {
        flex: 1,
    },
    name: {
        color: '#F8FAFC',
        fontSize: 15,
        fontWeight: '600',
    },
    ownerBadge: {
        color: '#38BDF8',
        fontSize: 11,
        fontWeight: '700',
        marginTop: 2,
    },
    removeButton: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 10,
        backgroundColor: '#450A0A',
    },
    removeText: {
        color: '#FCA5A5',
        fontSize: 12,
        fontWeight: '700',
    },
});
