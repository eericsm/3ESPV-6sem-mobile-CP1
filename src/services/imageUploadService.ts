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

export const uploadImage = async (publicId: string, localUri: string): Promise<string> => {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
        throw new Error(
            'Cloudinary não está configurado. Defina EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME e EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET.',
        );
    }

    const filePart: ReactNativeFilePart = {
        uri: localUri,
        name: `${publicId}.jpg`,
        type: 'image/jpeg',
    };

    const formData = new FormData();
    formData.append('file', filePart as unknown as Blob);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('public_id', publicId);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        throw new Error('Não foi possível enviar a imagem para o Cloudinary');
    }

    const data = (await response.json()) as CloudinaryUploadResponse;
    return data.secure_url;
};
