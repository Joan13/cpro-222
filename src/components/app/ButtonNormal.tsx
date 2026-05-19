import { Text, ActivityIndicator, View, ViewStyle, Pressable, LayoutChangeEvent } from "react-native"
import { useAppSelector } from "../../store/app/hooks";
import Animated, { useAnimatedStyle, useSharedValue, withTiming, withDelay } from "react-native-reanimated";
import { useEffect, useState } from "react";
import { IconApp } from "./IconApp";

export interface IButton {
    title: string;
    loadEnabled?: boolean;
    normal?: boolean;
    outline?: boolean;
    ghost?: boolean;
    styles?: ViewStyle;
    onPress: () => void;
    disabled?: boolean;
    loading?: boolean;
    iconName?: string;
    iconPack?: string;
    iconSize?: number;
}

const ButtonNormal: React.FC<IButton> = ({ title, onPress, loadEnabled = false, normal, outline, ghost, styles, disabled = false, loading, iconName, iconPack, iconSize = 16 }) => {
    const theme = useAppSelector(state => state.app_theme.colors);
    const loading_button = useAppSelector(state => state.app.loading_button);

    const show_load = () => {
        if (loading !== undefined) {
            return loading;
        }

        if (loadEnabled) {
            if (loading_button) {
                return true;
            }
        }

        return false;
    }

    const isLoading = show_load();

    // Animation values
    const textTranslateX = useSharedValue(0);
    const indicatorOpacity = useSharedValue(0);

    // State for measurements
    const [indicatorWidth, setIndicatorWidth] = useState(0);

    // Update animation when loading state changes
    useEffect(() => {
        if (isLoading) {
            // Sequence: text moves right -> indicator fades in
            const translateAmount = indicatorWidth > 0 ? indicatorWidth / 2 + 10 : 30;
            textTranslateX.value = withTiming(translateAmount, { duration: 200 });
            indicatorOpacity.value = withDelay(200, withTiming(1, { duration: 200 }));
        } else {
            // Reverse sequence: indicator fades out -> text moves back
            indicatorOpacity.value = withTiming(0, { duration: 150 });
            textTranslateX.value = withDelay(150, withTiming(0, { duration: 200 }));
        }
    }, [isLoading, indicatorWidth]);

    // Measure indicator width
    const handleIndicatorLayout = (event: LayoutChangeEvent) => {
        const { width } = event.nativeEvent.layout;
        if (width > 0 && indicatorWidth === 0) {
            setIndicatorWidth(width);
        }
    };

    const animatedTextStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: textTranslateX.value }],
        };
    });

    const animatedIndicatorStyle = useAnimatedStyle(() => {
        return {
            display: loading ? 'flex' : 'none',
            opacity: indicatorOpacity.value,
        };
    });
    

    return (
        <Pressable
            style={[styles, {
                height: 40,
                backgroundColor: ghost ? "transparent" : outline ? "transparent" : normal ? theme.design_tip2 : theme.background,
                justifyContent: "center",
                alignItems: 'center',
                borderRadius: 7,
                elevation: ghost ? 0 : outline ? 0 : 3,
                borderWidth: ghost ? 0 : outline ? 1 : 0,
                /* high_color: text_design1/2 are often white for solid buttons and match background on light themes */
                borderColor: outline ? theme.high_color : theme.text_design2,
                opacity: disabled ? 0.5 : 1,
                overflow: 'hidden'
            }]}
            onPress={disabled || isLoading ? undefined : onPress}
            disabled={disabled || isLoading}>
            <View style={{
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                // width: '100%',
                height: '100%',
                position: 'relative'
            }}>
                {/* Loading indicator that fades in on the left */}
                <Animated.View
                    style={[{
                        // flexDirection: 'row',
                        // justifyContent: 'center',
                        // alignItems: 'center',
                        // position: 'absolute',
                        // left: 0,
                        // height: '100%',
                        // paddingRight: 10
                    }, animatedIndicatorStyle]}
                    onLayout={handleIndicatorLayout}>
                    <ActivityIndicator
                        color={ghost ? theme.high_color : outline ? theme.high_color : normal ? theme.text_design2 : theme.design_tip2}
                        size="small"
                    />
                </Animated.View>

                {/* Text that moves to the right when loading */}
                <Animated.View
                    style={[{
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        // width: '100%',
                        height: '100%'
                    }, animatedTextStyle]}>
                    {iconName && iconPack && (
                        <IconApp
                            name={iconName}
                            pack={iconPack}
                            size={iconSize}
                            color={ghost ? theme.high_color : outline ? theme.high_color : normal ? theme.text_design2 : theme.design_tip2}
                            styles={{ marginRight: title ? 8 : 0 }}
                        />
                    )}
                    <Text numberOfLines={1} style={{
                        color: ghost ? theme.high_color : outline ? theme.high_color : normal ? theme.text_design2 : theme.design_tip2,
                    }}>{title.toUpperCase()}</Text>
                </Animated.View>
            </View>
        </Pressable>
    )
}

export default ButtonNormal;
