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

const SwitchApp: React.FC<IButton> = ({ value, small, disabled, onPress, loadEnabled }) => {
    const theme = useAppSelector(state => state.app_theme.colors);

    return (
        <Host matchContents>
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
                    disabledCheckedTrackColor: theme.border,

                    disabledUncheckedThumbColor: theme.background,
                    disabledUncheckedTrackColor: theme.border,
                    disabledUncheckedBorderColor: theme.border,
                }}

                enabled={!disabled}
            />
        </Host>
    )
}

export default SwitchApp;
