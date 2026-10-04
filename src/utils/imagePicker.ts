import * as ImagePicker from 'expo-image-picker';

export const pickImageFromLibrary = async (): Promise<string | null> => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
        throw new Error('Permissão para acessar a galeria foi negada');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
    });

    if (result.canceled || result.assets.length === 0) {
        return null;
    }

    return result.assets[0].uri;
};
