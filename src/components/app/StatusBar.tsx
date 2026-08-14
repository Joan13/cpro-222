import { Platform } from "react-native"
import { useAppSelector } from "../../store/app/hooks";
import { StatusBar } from 'expo-status-bar';

const StatusBarYambi = () => {
    const theme = useAppSelector(state => state.app_theme);
    return (
        <StatusBar
            style={theme.statusbar as any}
        // translucent={Platform.OS === 'android' ? false : true}
        // backgroundColor={theme.colors.header_background_color}
        />
    )
}

export default StatusBarYambi;
