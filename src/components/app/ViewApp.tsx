
import { View, Text, ViewStyle } from "react-native"
import { useAppSelector } from "../../store/app/hooks";
import { ReactNode } from "react";
import { colorVariant } from "../../types/types";

export interface IVIew {
    type: number;
    color: colorVariant;
    styles?: ViewStyle;
    children: ReactNode;
}

const ViewApp: React.FC<IVIew> = ({ type, color, styles, children }) => {

    const theme = useAppSelector(state => state.app_theme.colors);
    const app_description = useAppSelector(state => state.persisted_app.app_description);

    const RenderViewBackgroundColor = () => {
        switch (color) {
            case "background":
                return theme.background;
            case "primary":
                return theme.primary;
            case "border":
                return theme.border;
            case "gray":
                return theme.gray;
            case "high_color":
                return theme.high_color;
            case "text":
                return theme.text;
            case "header_background_color":
                return theme.header_background_color;
            case "button_background_color":
                return theme.button_background_color;
            case "header_foreground_color":
                return theme.header_foreground_color;
            case "button_foreground_color":
                return theme.button_foreground_color;
            default:
                return theme.background;
        }
    }

    return (
        <View
            style={[styles, {
                backgroundColor: RenderViewBackgroundColor as any
            }]}>
                <Text>{color}</Text>
            {children}
        </View>
    )
}

export default ViewApp;

