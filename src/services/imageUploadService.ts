import { Platform } from 'react-native';

// Fotos de perfil/grupo são enviadas pro Cloudinary (free tier, sem necessidade de
// cartão) em vez do Firebase Storage, que hoje exige o plano pago (Blaze) mesmo
// para uso dentro da cota gratuita. O upload usa um "unsigned upload preset" --
// seguro para ficar no cliente, pois não concede acesso de leitura/exclusão, só
// permite criar novos arquivos no preset configurado. Só a URL final é salva no
// Firestore (nunca a imagem em si).
const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME ?? '';
const CLOUDINARY_UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? '';

type ReactNativeFilePart = {
    uri: string;
    name: string;
    type: string;
};

type CloudinaryUploadResponse = {
    secure_url: string;
};

type CloudinaryErrorResponse = {
    error?: { message?: string };
};

// No navegador, FormData.append precisa de um Blob/File real -- o truque
// {uri, name, type} é uma convenção exclusiva do polyfill de FormData do React
// Native e não funciona em fetch/FormData nativos do browser (usados pela build
// web do Expo).
const appendFileToFormData = async (
    formData: FormData,
    localUri: string,
    publicId: string,
): Promise<void> => {
    if (Platform.OS === 'web') {
        const response = await fetch(localUri);
        const blob = await response.blob();
        formData.append('file', blob, `${publicId}.jpg`);
        return;
    }

    const filePart: ReactNativeFilePart = {
        uri: localUri,
        name: `${publicId}.jpg`,
        type: 'image/jpeg',
    };

    formData.append('file', filePart as unknown as Blob);
};

export const uploadImage = async (publicId: string, localUri: string): Promise<string> => {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
        throw new Error(
            'Cloudinary não está configurado. Defina EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME e EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET.',
        );
    }

    const formData = new FormData();
    await appendFileToFormData(formData, localUri, publicId);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('public_id', publicId);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as CloudinaryErrorResponse | null;
        const reason = errorBody?.error?.message ?? `HTTP ${response.status}`;
        throw new Error(`Não foi possível enviar a imagem para o Cloudinary (${reason})`);
    }

    const data = (await response.json()) as CloudinaryUploadResponse;
    return data.secure_url;
};
