import { Text, TextStyle } from "react-native"
import { useAppSelector } from "../../store/app/hooks";

export interface IYambiText {
    text: string;
    bold?: boolean;
    numberLines?: number;
    style?: TextStyle;
    size?: "xsmall" | "small" | "normal" | "big";
    color?: "default" | "gray" | "high" | "high2" | "high3" | "design" | "error" | "success" | "badge" | "white"; // <<< AJOUT
    lineThrough?: boolean;
}

export const YambiText: React.FC<IYambiText> = ({
    text,
    bold,
    numberLines,
    style,
    size = "normal",
    color = "default",
    lineThrough
}) => {

    const theme = useAppSelector(state => state.app_theme);
    const app_description = useAppSelector(state => state.persisted_app.app_description);

    const fontSize = {
        xsmall: 12,
        small: app_description.small_general_font_size,
        normal: app_description.general_font_size,
        big: app_description.big_general_font_size
    }[size];

    const textColor = {
        default: theme.colors.text,
        gray: theme.colors.gray,
        high: theme.colors.high_color,
        high2: theme.colors.high_color2,
        high3: theme.colors.high_color3,
        design: theme.colors.text_design2,
        error: theme.colors.error,
        success: theme.colors.success,
        badge: theme.colors.badge_color,
        white: "white" // <<< AJOUT
    }[color];

    return (
        <Text
            numberOfLines={numberLines}
            style={[
                style,
                {
                    color: textColor,
                    fontSize,
                    fontWeight: bold ? app_description.general_font_weight as any : 'normal',
                    textDecorationLine: lineThrough ? 'line-through' : 'none'
                }
            ]}
        >
            {text}
        </Text>
    );
};


export interface IText {
    text: string;
    bold?: boolean;
    styles?: TextStyle;
    numberLines?: number;
}

export const TextNormalYambi: React.FC<IText> = ({ text, bold, styles, numberLines }) => {

    const theme = useAppSelector(state => state.app_theme);
    const app_description = useAppSelector(state => state.persisted_app.app_description);

    return (
        <Text
            numberOfLines={numberLines}
            style={[styles, {
                color: theme.colors.text,
                fontSize: app_description.general_font_size,
                fontWeight: bold ? app_description.general_font_weight as any : 'normal'
            }]}>{text}</Text>
    )
}

export const TextBigYambi: React.FC<IText> = ({ text, bold, styles, numberLines }) => {

    const theme = useAppSelector(state => state.app_theme);
    const app_description = useAppSelector(state => state.persisted_app.app_description);

    return (
        <Text
            numberOfLines={numberLines}
            style={[styles, {
                color: theme.colors.text,
                fontSize: app_description.big_general_font_size,
                fontWeight: bold ? app_description.big_general_font_weight as any : 'normal'
            }]}>{text}</Text>
    )
}

export const TextSmallYambi: React.FC<IText> = ({ text, bold, styles, numberLines }) => {

    const theme = useAppSelector(state => state.app_theme);
    const app_description = useAppSelector(state => state.persisted_app.app_description);

    return (
        <Text
            numberOfLines={numberLines}
            style={[styles, {
                color: theme.colors.text,
                fontSize: app_description.small_general_font_size,
                fontWeight: bold ? app_description.small_general_font_weight as any : 'normal'
            }]}>{text}</Text>
    )
}


// Gray color

export const TextNormalYambiGray: React.FC<IText> = ({ text, bold, styles, numberLines }) => {

    const theme = useAppSelector(state => state.app_theme);
    const app_description = useAppSelector(state => state.persisted_app.app_description);

    return (
        <Text
            numberOfLines={numberLines}
            style={[styles, {
                color: theme.colors.gray,
                fontSize: app_description.general_font_size,
                fontWeight: bold ? app_description.general_font_weight as any : 'normal'
            }]}>{text}</Text>
    )
}

export const TextBigYambiGray: React.FC<IText> = ({ text, bold, styles, numberLines }) => {

    const theme = useAppSelector(state => state.app_theme);
    const app_description = useAppSelector(state => state.persisted_app.app_description);

    return (
        <Text
            numberOfLines={numberLines}
            style={[styles, {
                color: theme.colors.gray,
                fontSize: app_description.big_general_font_size,
                fontWeight: bold ? app_description.big_general_font_weight as any : 'normal'
            }]}>{text}</Text>
    )
}

export const TextSmallYambiGray: React.FC<IText> = ({ text, bold, styles, numberLines }) => {

    const theme = useAppSelector(state => state.app_theme);
    const app_description = useAppSelector(state => state.persisted_app.app_description);

    return (
        <Text
            numberOfLines={numberLines}
            style={[styles, {
                color: theme.colors.gray,
                fontSize: app_description.small_general_font_size,
                fontWeight: bold ? app_description.small_general_font_weight as any : 'normal'
            }]}>{text}</Text>
    )
}

// // High color

export const TextNormalYambiHighColor: React.FC<IText> = ({ text, bold, styles, numberLines }) => {

    const theme = useAppSelector(state => state.app_theme);
    const app_description = useAppSelector(state => state.persisted_app.app_description);

    return (
        <Text
            numberOfLines={numberLines}
            style={[styles, {
                color: theme.colors.high_color,
                fontSize: app_description.general_font_size,
                fontWeight: bold ? app_description.general_font_weight as any : 'normal'
            }]}>{text}</Text>
    )
}

export const TextNormalYambiHighColor2: React.FC<IText> = ({ text, bold, styles, numberLines }) => {

    const theme = useAppSelector(state => state.app_theme);
    const app_description = useAppSelector(state => state.persisted_app.app_description);

    return (
        <Text
            numberOfLines={numberLines}
            style={[styles, {
                color: theme.colors.high_color2,
                fontSize: app_description.general_font_size,
                fontWeight: bold ? app_description.general_font_weight as any : 'normal'
            }]}>{text}</Text>
    )
}

export const TextNormalYambiHighColor3: React.FC<IText> = ({ text, bold, styles, numberLines }) => {

    const theme = useAppSelector(state => state.app_theme);
    const app_description = useAppSelector(state => state.persisted_app.app_description);

    return (
        <Text
            numberOfLines={numberLines}
            style={[styles, {
                color: theme.colors.high_color3,
                fontSize: app_description.general_font_size,
                fontWeight: bold ? app_description.general_font_weight as any : 'normal'
            }]}>{text}</Text>
    )
}

export const TextSmallYambiHighColor2: React.FC<IText> = ({ text, bold, styles, numberLines }) => {

    const theme = useAppSelector(state => state.app_theme);
    const app_description = useAppSelector(state => state.persisted_app.app_description);

    return (
        <Text
            numberOfLines={numberLines}
            style={[styles, {
                color: theme.colors.high_color2,
                fontSize: app_description.small_general_font_size,
                fontWeight: bold ? app_description.small_general_font_weight as any : 'normal'
            }]}>{text}</Text>
    )
}

export const TextSmallYambiHighColor3: React.FC<IText> = ({ text, bold, styles, numberLines }) => {

    const theme = useAppSelector(state => state.app_theme);
    const app_description = useAppSelector(state => state.persisted_app.app_description);

    return (
        <Text
            numberOfLines={numberLines}
            style={[styles, {
                color: theme.colors.high_color3,
                fontSize: app_description.small_general_font_size,
                fontWeight: bold ? app_description.small_general_font_weight as any : 'normal'
            }]}>{text}</Text>
    )
}

export const TextBigYambiHighColor: React.FC<IText> = ({ text, bold, styles, numberLines }) => {

    const theme = useAppSelector(state => state.app_theme);
    const app_description = useAppSelector(state => state.persisted_app.app_description);

    return (
        <Text
            numberOfLines={numberLines}
            style={[styles, {
                color: theme.colors.high_color,
                fontSize: app_description.big_general_font_size,
                fontWeight: bold ? app_description.big_general_font_weight as any : 'normal'
            }]}>{text}</Text>
    )
}

export const TextSmallYambiHighColor: React.FC<IText> = ({ text, bold, styles, numberLines }) => {

    const theme = useAppSelector(state => state.app_theme);
    const app_description = useAppSelector(state => state.persisted_app.app_description);

    return (
        <Text
            numberOfLines={numberLines}
            style={[styles, {
                color: theme.colors.high_color,
                fontSize: app_description.small_general_font_size,
                fontWeight: bold ? app_description.small_general_font_weight as any : 'normal'
            }]}>{text}</Text>
    )
}

// // InDesign Color

export const TextNormalYambiInDesign: React.FC<IText> = ({ text, bold, styles, numberLines }) => {

    const theme = useAppSelector(state => state.app_theme);
    const app_description = useAppSelector(state => state.persisted_app.app_description);

    return (
        <Text
            numberOfLines={numberLines}
            style={[styles, {
                color: theme.colors.text_design2,
                fontSize: app_description.general_font_size,
                fontWeight: bold ? app_description.general_font_weight as any : 'normal'
            }]}>{text}</Text>
    )
}

export const TextBigYambiInDesign: React.FC<IText> = ({ text, bold, styles, numberLines }) => {

    const theme = useAppSelector(state => state.app_theme);
    const app_description = useAppSelector(state => state.persisted_app.app_description);

    return (
        <Text
            numberOfLines={numberLines}
            style={[styles, {
                color: theme.colors.text_design2,
                fontSize: app_description.big_general_font_size,
                fontWeight: bold ? app_description.big_general_font_weight as any : 'normal'
            }]}>{text}</Text>
    )
}

export const TextSmallYambiInDesign: React.FC<IText> = ({ text, bold, styles, numberLines }) => {

    const theme = useAppSelector(state => state.app_theme);
    const app_description = useAppSelector(state => state.persisted_app.app_description);

    return (
        <Text
            numberOfLines={numberLines}
            style={[styles, {
                color: theme.colors.text_design2,
                fontSize: app_description.small_general_font_size,
                fontWeight: bold ? app_description.small_general_font_weight as any : 'normal'
            }]}>{text}</Text>
    )
}

export const TextSmallYambiError: React.FC<IText> = ({ text, bold, styles, numberLines }) => {

    const theme = useAppSelector(state => state.app_theme);
    const app_description = useAppSelector(state => state.persisted_app.app_description);

    return (
        <Text
            numberOfLines={numberLines}
            style={[styles, {
                color: theme.colors.error,
                fontSize: app_description.small_general_font_size,
                fontWeight: bold ? app_description.small_general_font_weight as any : 'normal'
            }]}>{text}</Text>
    )
}

export const TextNormalYambiError: React.FC<IText> = ({ text, bold, styles, numberLines }) => {

    const theme = useAppSelector(state => state.app_theme);
    const app_description = useAppSelector(state => state.persisted_app.app_description);

    return (
        <Text
            numberOfLines={numberLines}
            style={[styles, {
                color: theme.colors.error,
                fontSize: app_description.general_font_size,
                fontWeight: bold ? app_description.general_font_weight as any : 'normal'
            }]}>{text}</Text>
    )
}

export const TextSmallYambiSuccess: React.FC<IText> = ({ text, bold, styles, numberLines }) => {

    const theme = useAppSelector(state => state.app_theme);
    const app_description = useAppSelector(state => state.persisted_app.app_description);

    return (
        <Text
            numberOfLines={numberLines}
            style={[styles, {
                color: theme.colors.success,
                fontSize: app_description.small_general_font_size,
                fontWeight: bold ? app_description.small_general_font_weight as any : 'normal'
            }]}>{text}</Text>
    )
}

export const TextNormalYambiSuccess: React.FC<IText> = ({ text, bold, styles, numberLines }) => {

    const theme = useAppSelector(state => state.app_theme);
    const app_description = useAppSelector(state => state.persisted_app.app_description);

    return (
        <Text
            numberOfLines={numberLines}
            style={[styles, {
                color: theme.colors.success,
                fontSize: app_description.general_font_size,
                fontWeight: bold ? app_description.general_font_weight as any : 'normal'
            }]}>{text}</Text>
    )
}

