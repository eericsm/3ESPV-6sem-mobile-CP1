import { Text, View } from 'react-native';

type LoadingProps = {
    label?: string;
};

export const Loading = ({ label = 'Carregando...' }: LoadingProps) => {
    return (
        <View>
            <Text>{label}</Text>
        </View>
    );
};
