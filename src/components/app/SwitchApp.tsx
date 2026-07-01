import { ViewStyle } from "react-native"
import { useAppSelector } from "../../store/app/hooks";
import { Host, Switch } from '@expo/ui/jetpack-compose';

export interface IButton {
    value: boolean;
    loadEnabled?: boolean;
    small?: boolean;
    disabled?: boolean;
    styles?: ViewStyle;
    onPress?: () => void;
}

const SwitchApp: React.FC<IButton> = ({ value, small, disabled, onPress, loadEnabled, styles }) => {
    const theme = useAppSelector(state => state.app_theme.colors);

    const defaultStyle: ViewStyle = {
        width: small ? 46 : 52,
        height: small ? 28 : 32,
        justifyContent: 'center',
        alignItems: 'center',
    };

    return (
        <Host matchContents style={[defaultStyle, styles]}>
            <Switch
                onCheckedChange={onPress}
                value={value}
                colors={{
                    checkedThumbColor: theme.background,
                    checkedTrackColor: theme.high_color,
                    uncheckedThumbColor: theme.background,
                    uncheckedTrackColor: theme.gray,
                    uncheckedBorderColor: theme.gray,

                    disabledCheckedThumbColor: theme.background,
                    disabledCheckedTrackColor: theme.gray + "50",

                    disabledUncheckedThumbColor: theme.background,
                    disabledUncheckedTrackColor: theme.gray + "50",
                    disabledUncheckedBorderColor: theme.gray + "50",
                }}

                enabled={!disabled}
            />
        </Host>
    )
}

export default SwitchApp;
