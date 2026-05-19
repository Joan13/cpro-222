import { Vibration, ViewStyle } from "react-native"
import { useAppSelector } from "../../store/app/hooks";
import Switch from 'react-native-ui-lib/switch';

export interface IButton {
    value: boolean;
    loadEnabled?: boolean;
    small?: boolean;
    disabled?: boolean;
    styles?: ViewStyle;
    onPress?: () => void;
}

const SwitchApp: React.FC<IButton> = ({ value, small, disabled, onPress, loadEnabled }) => {
    const theme = useAppSelector(state => state.app_theme.colors);
    // const loading_button = useAppSelector(state => state.app.loading_button);

    // const show_load = () => {
    //     if (loadEnabled) {
    //         if (loading_button) {
    //             return true;
    //         }
    //     }

    //     return false;
    // }

    return (
        <Switch
            // trackColor={{ false: theme.gray, true: theme.high_color }}
            thumbColor={theme.background}
            // ios_backgroundColor="#3e3e3e"
            onValueChange={onPress}
            value={value}

            onColor={theme.high_color}
            offColor={theme.gray}
            disabledColor={theme.border}
            // thumbColor={theme.border}
            thumbSize={small ? 12 : 20}
            width={small ? 30 : 44}
            height={small ? 17 : 25}
            // value={value}
            disabled={disabled}
            // onValueChange={() => {
            //     // Vibration.vibrate(20);
            //     onPress();
            // }}
        />
    )
}

export default SwitchApp;
