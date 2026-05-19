import { ActivityIndicator, View, ViewStyle } from "react-native"
import { useAppSelector } from "../../store/app/hooks";
import { YambiText } from "./Text";
import { strings } from "../../lang/lang";

export interface IAppActivityIndicator {
    color?: string;
    size?: number;
    showLabel?: boolean;
    styles?: ViewStyle;
}

const AppActivityIndicator: React.FC<IAppActivityIndicator> = ({ color, size, styles, showLabel }) => {
    const theme = useAppSelector(state => state.app_theme.colors);

    return (
        <View
            style={[styles, {
                height: 20,
                backgroundColor: "transparent",
                justifyContent: "center",
                alignItems: 'center'
            }]}>
            <ActivityIndicator color={color ? color : theme.high_color} size={size ? size : 20} />
            {showLabel ? <YambiText text={strings.loading_content} size="small" color="gray" /> : null}
        </View>
    )
}

export default AppActivityIndicator;
