import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

type AvatarProps = {
    name: string;
    photoUrl?: string;
    size?: number;
};

export const Avatar = ({ name, photoUrl, size = 48 }: AvatarProps) => {
    const [failed, setFailed] = useState<boolean>(false);
    const initial = name.trim().charAt(0).toUpperCase() || '?';
    const dimensionStyle = { width: size, height: size, borderRadius: size / 2 };

    if (photoUrl && !failed) {
        return (
            <Image
                source={{ uri: photoUrl }}
                style={[styles.image, dimensionStyle]}
                onError={() => setFailed(true)}
            />
        );
    }

    return (
        <View style={[styles.fallback, dimensionStyle]}>
            <Text style={[styles.initial, { fontSize: size * 0.4 }]}>{initial}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    image: {
        backgroundColor: '#1E293B',
    },
    fallback: {
        backgroundColor: '#1E293B',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#334155',
    },
    initial: {
        color: '#94A3B8',
        fontWeight: '700',
    },
});
