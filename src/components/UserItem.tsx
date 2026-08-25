import { Pressable, Text, View } from 'react-native';
import type { ChatUser } from '../types/user';

type UserItemProps = {
    user: ChatUser;
    onPress: (user: ChatUser) => void;
};

export const UserItem = ({ user, onPress }: UserItemProps) => {
    return (
        <Pressable onPress={() => onPress(user)}>
            <View>
                <Text>{user.name}</Text>
                <Text>{user.provider}</Text>
            </View>
        </Pressable>
    );
};
