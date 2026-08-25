import { Text, TextStyle, Linking } from "react-native"
import { useAppSelector } from "../../store/app/hooks";
import { TTheme } from "../../types/types";

export interface IYambiText {
    text: string;
    bold?: boolean;
    numberLines?: number;
    style?: TextStyle;
    size?: "xsmall" | "small" | "normal" | "big";
    color?: keyof TTheme['colors'] | "default" | "gray" | "high" | "high2" | "high3" | "design" | "error" | "success" | "badge" | "white" | (string & {});
    lineThrough?: boolean;
    clickableLinks?: boolean;
    clickable_links?: boolean;
    linkColor?: string;
    onLinkPress?: (url: string) => void;
}

export const renderTextWithLinks = (
    text: string,
    baseStyle: TextStyle,
    linkColor: string,
    onLinkPress?: (url: string) => void
) => {
    if (!text || typeof text !== 'string') return text;
    
    // Regex matching HTTP/HTTPS/WWW, emails, and bare domains (e.g. website.com, domain.co.uk, yambi.app)
    const urlRegex = /(?:https?:\/\/|www\.)[^\s<]+|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.(?:com|org|net|io|app|ai|co|info|biz|dev|me|tech|site|online|xyz|store|shop|blog|cd|fr|de|uk|ca|au|in|jp|cn|us|eu|[a-zA-Z]{2,})(?:\/[^\s]*)?/gi;
    
    const parts: { text: string; isUrl: boolean }[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = urlRegex.exec(text)) !== null) {
        const matchIndex = match.index;
        let url = match[0];
        
        let trailingPunctuation = '';
        while (url.length > 0 && /[.,;!?)]$/.test(url)) {
            trailingPunctuation = url.slice(-1) + trailingPunctuation;
            url = url.slice(0, -1);
        }

        if (matchIndex > lastIndex) {
            parts.push({ text: text.slice(lastIndex, matchIndex), isUrl: false });
        }

        if (url.length > 0) {
            parts.push({ text: url, isUrl: true });
        }
        
        if (trailingPunctuation.length > 0) {
            parts.push({ text: trailingPunctuation, isUrl: false });
        }

        lastIndex = urlRegex.lastIndex;
    }

    if (lastIndex < text.length) {
        parts.push({ text: text.slice(lastIndex), isUrl: false });
    }

    if (parts.length === 0 || !parts.some(p => p.isUrl)) {
        return text;
    }

    return parts.map((part, index) => {
        if (part.isUrl) {
            return (
                <Text
                    key={index}
                    style={[
                        baseStyle,
                        {
                            color: linkColor,
                            textDecorationLine: 'underline',
                        }
                    ]}
                    onPress={(e) => {
                        e.stopPropagation();
                        let targetUrl = part.text;
                        if (targetUrl.includes('@') && !targetUrl.toLowerCase().startsWith('mailto:')) {
                            targetUrl = 'mailto:' + targetUrl;
                        } else if (!/^https?:\/\//i.test(targetUrl) && !targetUrl.toLowerCase().startsWith('mailto:')) {
                            targetUrl = 'https://' + targetUrl;
                        }
                        if (onLinkPress) {
                            onLinkPress(targetUrl);
                        } else {
                            Linking.openURL(targetUrl).catch(err => {
                                console.error("Failed to open URL:", err);
                            });
                        }
                    }}>
                    {part.text}
                </Text>
            );
        }
        return part.text;
    });
};

export const YambiText: React.FC<IYambiText> = ({
    text,
    bold,
    numberLines,
    style,
    size = "normal",
    color = "default",
    lineThrough,
    clickableLinks = true,
    clickable_links,
    linkColor,
    onLinkPress
}) => {

    const theme = useAppSelector(state => state.app_theme);
    const app_description = useAppSelector(state => state.persisted_app.app_description);

    const isClickableLinks = clickable_links !== undefined ? clickable_links : clickableLinks;

    const fontSize = {
        xsmall: 12,
        small: app_description.small_general_font_size,
        normal: app_description.general_font_size,
        big: app_description.big_general_font_size
    }[size];

    const legacyColors: Record<string, string> = {
        default: theme.colors.text,
        gray: theme.colors.gray,
        high: theme.colors.high_color,
        high2: theme.colors.high_color2,
        high3: theme.colors.high_color3,
        design: theme.colors.button_foreground_color,
        error: theme.colors.error,
        success: theme.colors.success,
        badge: theme.colors.badge_color,
        white: "white"
    };

    let textColor = legacyColors[color];
    if (!textColor) {
        if (theme.colors && (color in theme.colors)) {
            textColor = (theme.colors as any)[color];
        } else {
            textColor = color || theme.colors.text;
        }
    }

    const baseTextStyle: TextStyle = {
        color: textColor,
        fontSize,
        fontWeight: bold ? app_description.general_font_weight as any : 'normal',
        textDecorationLine: lineThrough ? 'line-through' : (style?.textDecorationLine || 'none')
    };

    const effectiveLinkColor = linkColor || theme.colors.high_color;

    return (
        <Text
            numberOfLines={numberLines}
            style={[
                style,
                baseTextStyle
            ]}
        >
            {isClickableLinks
                ? renderTextWithLinks(text, baseTextStyle, effectiveLinkColor, onLinkPress)
                : text}
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
                color: theme.colors.button_foreground_color,
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
                color: theme.colors.button_foreground_color,
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
                color: theme.colors.button_foreground_color,
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

