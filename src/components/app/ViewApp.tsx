
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
            case "design_tip_1":
                return theme.design_tip1;
            case "design_tip_2":
                return theme.design_tip2;
            case "text_design_1":
                return theme.text_design1;
            case "text_design_2":
                return theme.text_design2;
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

