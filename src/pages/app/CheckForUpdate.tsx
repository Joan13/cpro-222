import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppSelector } from '../../store/app/hooks';

const CheckForUpdate = () => {

    const theme = useAppSelector(state => state.app_theme);

    return (
        <SafeAreaView style={{ backgroundColor: theme.colors.background, flex: 1, borderColor: theme.colors.border, borderTopWidth: 1 }}>
            
        </SafeAreaView>
    )
}

export default CheckForUpdate;

