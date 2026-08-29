import React from "react";
import { Text, TextStyle, Linking, View, Platform } from "react-native";
import { useAppSelector } from "../../store/app/hooks";
import { TTheme } from "../../types/types";
import { parseBlocks, InlineToken } from "../../utils/yambiTextParser";

export interface IYambiText {
    text?: string;
    children?: React.ReactNode;
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
    formatYambiText?: boolean;
    formatWhatsApp?: boolean;
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
        return <Text style={baseStyle}>{text}</Text>;
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
        return <Text key={index} style={baseStyle}>{part.text}</Text>;
    });
};

const renderInlineTokens = (
    tokens: InlineToken[],
    baseStyle: TextStyle,
    app_description: any,
    theme: any,
    isClickableLinks: boolean,
    effectiveLinkColor: string,
    onLinkPress?: (url: string) => void
) => {
    return tokens.map((token, index) => {
        const tokenStyle: TextStyle = { ...baseStyle };

        if (token.style.bold) {
            tokenStyle.fontWeight = 'bold';
        }
        if (token.style.italic) {
            tokenStyle.fontStyle = 'italic';
        }
        if (token.style.strikethrough) {
            tokenStyle.textDecorationLine =
                tokenStyle.textDecorationLine === 'underline'
                    ? 'underline line-through'
                    : 'line-through';
        }
        if (token.style.code) {
            tokenStyle.fontFamily = Platform.OS === 'ios' ? 'Courier' : 'monospace';
            tokenStyle.backgroundColor = theme?.dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)';
        }

        if (isClickableLinks) {
            return (
                <React.Fragment key={index}>
                    {renderTextWithLinks(token.text, tokenStyle, effectiveLinkColor, onLinkPress)}
                </React.Fragment>
            );
        }

        return (
            <Text key={index} style={tokenStyle}>
                {token.text}
            </Text>
        );
    });
};

export const YambiText: React.FC<IYambiText> = ({
    text,
    children,
    bold,
    numberLines,
    style,
    size = "normal",
    color = "default",
    lineThrough,
    clickableLinks = true,
    clickable_links,
    linkColor,
    onLinkPress,
    formatYambiText = true,
    formatWhatsApp,
}) => {
    const theme = useAppSelector(state => state.app_theme);
    const app_description = useAppSelector(state => state.persisted_app.app_description);

    const isClickableLinks = clickable_links !== undefined ? clickable_links : clickableLinks;
    const isFormatEnabled = formatYambiText && (formatWhatsApp === undefined || formatWhatsApp);

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
        fontWeight: bold ? (app_description.general_font_weight as any) : 'normal',
        textDecorationLine: lineThrough ? 'line-through' : (style?.textDecorationLine || 'none')
    };

    const effectiveLinkColor = linkColor || theme.colors.high_color;

    const rawText = text !== undefined ? text : (typeof children === 'string' ? children : undefined);
    const shouldFormat = isFormatEnabled && typeof rawText === 'string';

    if (!shouldFormat) {
        return (
            <Text
                numberOfLines={numberLines}
                style={[
                    style,
                    baseTextStyle
                ]}
            >
                {typeof rawText === 'string' && isClickableLinks
                    ? renderTextWithLinks(rawText, baseTextStyle, effectiveLinkColor, onLinkPress)
                    : (rawText !== undefined ? rawText : children)}
            </Text>
        );
    }

    const blocks = parseBlocks(rawText!);
    const hasBlockElements = blocks.some(b => b.type !== 'paragraph');

    if (!hasBlockElements) {
        return (
            <Text
                numberOfLines={numberLines}
                style={[
                    style,
                    baseTextStyle
                ]}
            >
                {blocks.map((block, bIdx) => (
                    <React.Fragment key={bIdx}>
                        {bIdx > 0 ? '\n' : ''}
                        {block.inlines ? renderInlineTokens(block.inlines, baseTextStyle, app_description, theme, isClickableLinks, effectiveLinkColor, onLinkPress) : null}
                    </React.Fragment>
                ))}
            </Text>
        );
    }

    return (
        <View style={style}>
            {blocks.map((block, bIdx) => {
                if (block.type === 'code_block') {
                    return (
                        <View key={bIdx} style={{
                            backgroundColor: theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                            borderRadius: 6,
                            padding: 8,
                            marginVertical: 4,
                            borderWidth: 1,
                            borderColor: theme.colors.border,
                        }}>
                            {block.language ? (
                                <Text style={{
                                    fontSize: 10,
                                    color: theme.colors.gray,
                                    fontWeight: 'bold',
                                    marginBottom: 4,
                                    textTransform: 'uppercase'
                                }}>
                                    {block.language}
                                </Text>
                            ) : null}
                            <Text style={{
                                fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                                fontSize: fontSize,
                                color: textColor,
                            }}>
                                {block.codeText}
                            </Text>
                        </View>
                    );
                }

                if (block.type === 'quote') {
                    return (
                        <View key={bIdx} style={{
                            borderLeftWidth: 3.5,
                            borderLeftColor: theme.colors.high_color,
                            paddingLeft: 10,
                            paddingVertical: 2,
                            marginVertical: 4,
                            backgroundColor: theme.colors.border + '20',
                            borderRadius: 4,
                        }}>
                            <Text style={baseTextStyle}>
                                {block.inlines ? renderInlineTokens(block.inlines, baseTextStyle, app_description, theme, isClickableLinks, effectiveLinkColor, onLinkPress) : null}
                            </Text>
                        </View>
                    );
                }

                if (block.type === 'bullet_list') {
                    return (
                        <View key={bIdx} style={{ flexDirection: 'row', alignItems: 'flex-start', marginVertical: 2 }}>
                            <Text style={[baseTextStyle, { marginRight: 6, fontWeight: 'bold' }]}>•</Text>
                            <Text style={[{ flex: 1 }, baseTextStyle]}>
                                {block.inlines ? renderInlineTokens(block.inlines, baseTextStyle, app_description, theme, isClickableLinks, effectiveLinkColor, onLinkPress) : null}
                            </Text>
                        </View>
                    );
                }

                if (block.type === 'numbered_list') {
                    return (
                        <View key={bIdx} style={{ flexDirection: 'row', alignItems: 'flex-start', marginVertical: 2 }}>
                            <Text style={[baseTextStyle, { marginRight: 6, fontWeight: 'bold' }]}>
                                {block.number}.
                            </Text>
                            <Text style={[{ flex: 1 }, baseTextStyle]}>
                                {block.inlines ? renderInlineTokens(block.inlines, baseTextStyle, app_description, theme, isClickableLinks, effectiveLinkColor, onLinkPress) : null}
                            </Text>
                        </View>
                    );
                }

                return (
                    <Text key={bIdx} style={baseTextStyle}>
                        {block.inlines ? renderInlineTokens(block.inlines, baseTextStyle, app_description, theme, isClickableLinks, effectiveLinkColor, onLinkPress) : null}
                    </Text>
                );
            })}
        </View>
    );
};


export interface IText {
    text?: string;
    children?: React.ReactNode;
    bold?: boolean;
    styles?: TextStyle;
    numberLines?: number;
}

export const TextNormalYambi: React.FC<IText> = ({ text, children, bold, styles, numberLines }) => (
    <YambiText text={text} children={children} bold={bold} style={styles} numberLines={numberLines} size="normal" color="default" />
);

export const TextBigYambi: React.FC<IText> = ({ text, children, bold, styles, numberLines }) => (
    <YambiText text={text} children={children} bold={bold} style={styles} numberLines={numberLines} size="big" color="default" />
);

export const TextSmallYambi: React.FC<IText> = ({ text, children, bold, styles, numberLines }) => (
    <YambiText text={text} children={children} bold={bold} style={styles} numberLines={numberLines} size="small" color="default" />
);


// Gray color

export const TextNormalYambiGray: React.FC<IText> = ({ text, children, bold, styles, numberLines }) => (
    <YambiText text={text} children={children} bold={bold} style={styles} numberLines={numberLines} size="normal" color="gray" />
);

export const TextBigYambiGray: React.FC<IText> = ({ text, children, bold, styles, numberLines }) => (
    <YambiText text={text} children={children} bold={bold} style={styles} numberLines={numberLines} size="big" color="gray" />
);

export const TextSmallYambiGray: React.FC<IText> = ({ text, children, bold, styles, numberLines }) => (
    <YambiText text={text} children={children} bold={bold} style={styles} numberLines={numberLines} size="small" color="gray" />
);

// High color

export const TextNormalYambiHighColor: React.FC<IText> = ({ text, children, bold, styles, numberLines }) => (
    <YambiText text={text} children={children} bold={bold} style={styles} numberLines={numberLines} size="normal" color="high" />
);

export const TextNormalYambiHighColor2: React.FC<IText> = ({ text, children, bold, styles, numberLines }) => (
    <YambiText text={text} children={children} bold={bold} style={styles} numberLines={numberLines} size="normal" color="high2" />
);

export const TextNormalYambiHighColor3: React.FC<IText> = ({ text, children, bold, styles, numberLines }) => (
    <YambiText text={text} children={children} bold={bold} style={styles} numberLines={numberLines} size="normal" color="high3" />
);

export const TextSmallYambiHighColor2: React.FC<IText> = ({ text, children, bold, styles, numberLines }) => (
    <YambiText text={text} children={children} bold={bold} style={styles} numberLines={numberLines} size="small" color="high2" />
);

export const TextSmallYambiHighColor3: React.FC<IText> = ({ text, children, bold, styles, numberLines }) => (
    <YambiText text={text} children={children} bold={bold} style={styles} numberLines={numberLines} size="small" color="high3" />
);

export const TextBigYambiHighColor: React.FC<IText> = ({ text, children, bold, styles, numberLines }) => (
    <YambiText text={text} children={children} bold={bold} style={styles} numberLines={numberLines} size="big" color="high" />
);

export const TextSmallYambiHighColor: React.FC<IText> = ({ text, children, bold, styles, numberLines }) => (
    <YambiText text={text} children={children} bold={bold} style={styles} numberLines={numberLines} size="small" color="high" />
);

// InDesign Color

export const TextNormalYambiInDesign: React.FC<IText> = ({ text, children, bold, styles, numberLines }) => (
    <YambiText text={text} children={children} bold={bold} style={styles} numberLines={numberLines} size="normal" color="design" />
);

export const TextBigYambiInDesign: React.FC<IText> = ({ text, children, bold, styles, numberLines }) => (
    <YambiText text={text} children={children} bold={bold} style={styles} numberLines={numberLines} size="big" color="design" />
);

export const TextSmallYambiInDesign: React.FC<IText> = ({ text, children, bold, styles, numberLines }) => (
    <YambiText text={text} children={children} bold={bold} style={styles} numberLines={numberLines} size="small" color="design" />
);

export const TextSmallYambiError: React.FC<IText> = ({ text, children, bold, styles, numberLines }) => (
    <YambiText text={text} children={children} bold={bold} style={styles} numberLines={numberLines} size="small" color="error" />
);

export const TextNormalYambiError: React.FC<IText> = ({ text, children, bold, styles, numberLines }) => (
    <YambiText text={text} children={children} bold={bold} style={styles} numberLines={numberLines} size="normal" color="error" />
);

export const TextSmallYambiSuccess: React.FC<IText> = ({ text, children, bold, styles, numberLines }) => (
    <YambiText text={text} children={children} bold={bold} style={styles} numberLines={numberLines} size="small" color="success" />
);

export const TextNormalYambiSuccess: React.FC<IText> = ({ text, children, bold, styles, numberLines }) => (
    <YambiText text={text} children={children} bold={bold} style={styles} numberLines={numberLines} size="normal" color="success" />
);
