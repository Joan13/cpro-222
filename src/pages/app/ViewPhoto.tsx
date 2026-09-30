import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Pressable, View, Dimensions, Image, StyleSheet } from "react-native";
import { Image as ExpoImage } from 'expo-image';
import { useAppSelector } from "../../store/app/hooks";
import { NavProps } from "../../types/types";
import { TextNormalYambiGray, YambiText } from "../../components/app/Text";
import { IconApp } from "../../components/app/IconApp";
import { strings } from "../../lang/lang";
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withTiming,
    withSpring,
    runOnJS,
    Easing,
    cancelAnimation,
    interpolate,
    Extrapolation,
    type SharedValue,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import AppActivityIndicator from "../../components/app/AppActivityIndicator";
import { StoryUserPage } from "../../components/stories/StoryCubeFace";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

/** Rest / “fit” zoom level after pinch ends. */
const BASE_ZOOM = 1;
/** Allow pinch to zoom out slightly below fit (rubber band), then spring back on release. */
const PINCH_MIN_SCALE = 0.7;
const MAX_ZOOM = 4;
const DISMISS_THRESHOLD = 120;

/** Pinch-to-zoom + one-finger pan when zoomed; pan clamped from contain layout so background never shows. */
const ZoomablePhotoItem = ({
    uri,
    backgroundColor,
    isZoomedShared,
    isPinchingShared,
    isActive,
}: {
    uri: string;
    backgroundColor: string;
    isZoomedShared: SharedValue<boolean>;
    isPinchingShared: SharedValue<boolean>;
    isActive?: boolean;
}) => {
    const [loading, setLoading] = useState(true);
    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const savedTx = useSharedValue(0);
    const savedTy = useSharedValue(0);
    /** First-finger position so pan does not activate on touch-down (allows pinch to start). */
    const panStartX = useSharedValue(0);
    const panStartY = useSharedValue(0);
    const panActivatedThisStroke = useSharedValue(0);

    const boxW = useSharedValue(SCREEN_WIDTH);
    const boxH = useSharedValue(SCREEN_HEIGHT);
    const natW = useSharedValue(0);
    const natH = useSharedValue(0);
    const dispW = useSharedValue(SCREEN_WIDTH);
    const dispH = useSharedValue(SCREEN_HEIGHT);

    const recomputeDisplayed = () => {
        const cw = boxW.value;
        const ch = boxH.value;
        const iw = natW.value;
        const ih = natH.value;
        if (cw <= 0 || ch <= 0) {
            return;
        }
        if (iw <= 0 || ih <= 0) {
            dispW.value = cw;
            dispH.value = ch;
            return;
        }
        const ir = iw / ih;
        const cr = cw / ch;
        if (ir > cr) {
            dispW.value = cw;
            dispH.value = cw / ir;
        } else {
            dispH.value = ch;
            dispW.value = ch * ir;
        }
    };

    const recomputeRef = useRef(recomputeDisplayed);
    recomputeRef.current = recomputeDisplayed;

    useEffect(() => {
        natW.value = 0;
        natH.value = 0;
        scale.value = 1;
        savedScale.value = 1;
        translateX.value = 0;
        translateY.value = 0;
        savedTx.value = 0;
        savedTy.value = 0;
        isZoomedShared.value = false;
        recomputeRef.current();

        let cancelled = false;
        if (uri.startsWith('http')) {
            Image.getSize(
                uri,
                (w, h) => {
                    if (cancelled || !w || !h) return;
                    natW.value = w;
                    natH.value = h;
                    recomputeRef.current();
                },
                () => { }
            );
        }
        return () => { cancelled = true; };
    }, [uri]);

    // Reset zoom state if this slide becomes inactive (e.g. user swiped to another photo)
    useEffect(() => {
        if (isActive === false) {
            scale.value = 1;
            savedScale.value = 1;
            translateX.value = 0;
            translateY.value = 0;
            savedTx.value = 0;
            savedTy.value = 0;
        }
    }, [isActive]);

    const zoomGestures = useMemo(() => {
        const maxPan = (disp: number, box: number, s: number) => {
            'worklet';
            return Math.max(0, (disp * s - box) / 2);
        };

        const clampPanToScale = (s?: number) => {
            'worklet';
            const currentScale = s !== undefined ? s : scale.value;
            if (currentScale <= BASE_ZOOM) {
                translateX.value = 0;
                translateY.value = 0;
                return;
            }
            const padX = maxPan(dispW.value, boxW.value, currentScale);
            const padY = maxPan(dispH.value, boxH.value, currentScale);
            translateX.value = Math.min(Math.max(translateX.value, -padX), padX);
            translateY.value = Math.min(Math.max(translateY.value, -padY), padY);
        };

        const pinchGesture = Gesture.Pinch()
            .onStart(() => {
                isPinchingShared.value = true;
                isZoomedShared.value = true;
                savedScale.value = scale.value;
            })
            .onUpdate((e) => {
                const next = savedScale.value * e.scale;
                scale.value = Math.min(Math.max(next, PINCH_MIN_SCALE), MAX_ZOOM);
                clampPanToScale(scale.value);
            })
            .onFinalize(() => {
                isPinchingShared.value = false;
                if (scale.value < BASE_ZOOM + 0.05) {
                    scale.value = withTiming(BASE_ZOOM, { duration: 200, easing: Easing.out(Easing.quad) }, (finished) => {
                        if (finished) {
                            isZoomedShared.value = false;
                        }
                    });
                    savedScale.value = BASE_ZOOM;
                    translateX.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.quad) });
                    translateY.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.quad) });
                    savedTx.value = 0;
                    savedTy.value = 0;
                } else {
                    savedScale.value = scale.value;
                    isZoomedShared.value = true;
                    clampPanToScale(scale.value);
                    savedTx.value = translateX.value;
                    savedTy.value = translateY.value;
                }
            });

        const panGesture = Gesture.Pan()
            .maxPointers(1)
            .manualActivation(true)
            .onTouchesDown((e, state) => {
                panActivatedThisStroke.value = 0;
                if (e.numberOfTouches > 1 || isPinchingShared.value) {
                    state.fail();
                    return;
                }
                if (e.allTouches.length > 0) {
                    const t = e.allTouches[0];
                    panStartX.value = t.x;
                    panStartY.value = t.y;
                }
            })
            .onTouchesMove((e, state) => {
                if (e.numberOfTouches > 1 || isPinchingShared.value) {
                    state.fail();
                    return;
                }
                if (scale.value <= BASE_ZOOM + 0.02) {
                    state.fail();
                    return;
                }
                if (panActivatedThisStroke.value === 1) {
                    return;
                }
                if (e.allTouches.length > 0) {
                    const t = e.allTouches[0];
                    const dx = t.x - panStartX.value;
                    const dy = t.y - panStartY.value;
                    if (dx * dx + dy * dy > 64) {
                        state.activate();
                        panActivatedThisStroke.value = 1;
                    }
                }
            })
            .onStart(() => {
                savedTx.value = translateX.value;
                savedTy.value = translateY.value;
            })
            .onUpdate((e) => {
                if (isPinchingShared.value) return;
                const s = scale.value;
                if (s <= BASE_ZOOM + 0.02) {
                    return;
                }
                const padX = maxPan(dispW.value, boxW.value, s);
                const padY = maxPan(dispH.value, boxH.value, s);
                translateX.value = Math.min(
                    Math.max(savedTx.value + e.translationX, -padX),
                    padX
                );
                translateY.value = Math.min(
                    Math.max(savedTy.value + e.translationY, -padY),
                    padY
                );
            })
            .onFinalize(() => {
                savedTx.value = translateX.value;
                savedTy.value = translateY.value;
            });

        const doubleTapGesture = Gesture.Tap()
            .numberOfTaps(2)
            .maxDuration(320)
            .maxDistance(24)
            .onEnd(() => {
                'worklet';
                if (scale.value > BASE_ZOOM + 0.05) {
                    scale.value = withTiming(BASE_ZOOM, { duration: 200, easing: Easing.out(Easing.quad) }, (finished) => {
                        if (finished) {
                            isZoomedShared.value = false;
                        }
                    });
                    savedScale.value = BASE_ZOOM;
                    translateX.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.quad) });
                    translateY.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.quad) });
                    savedTx.value = 0;
                    savedTy.value = 0;
                } else {
                    const targetZoom = 2.5;
                    scale.value = withTiming(targetZoom, { duration: 200, easing: Easing.out(Easing.quad) });
                    savedScale.value = targetZoom;
                    isZoomedShared.value = true;
                    clampPanToScale(targetZoom);
                }
            });

        return Gesture.Simultaneous(pinchGesture, panGesture, doubleTapGesture);
    }, [isZoomedShared, isPinchingShared]);

    const panStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
        ],
    } as any));

    const scaledImageFrameStyle = useAnimatedStyle(() => ({
        position: 'absolute' as const,
        left: (boxW.value - dispW.value) / 2,
        top: (boxH.value - dispH.value) / 2,
        width: dispW.value,
        height: dispH.value,
        transform: [{ scale: scale.value }],
    }));

    return (
        <View
            onLayout={(e) => {
                const { width, height } = e.nativeEvent.layout;
                if (width > 0 && height > 0) {
                    boxW.value = width;
                    boxH.value = height;
                    recomputeRef.current();
                }
            }}
            style={{
                width: SCREEN_WIDTH,
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden',
                backgroundColor,
            }}>
            <GestureDetector gesture={zoomGestures}>
                <Animated.View style={[{ width: '100%', height: '100%' }, panStyle]}>
                    <Animated.View style={scaledImageFrameStyle}>
                        <ExpoImage
                            style={{ width: '100%', height: '100%' }}
                            contentFit="contain"
                            source={{
                                uri,
                            }}
                            onLoadStart={() => setLoading(true)}
                            onLoad={(e) => {
                                const w = e.source?.width;
                                const h = e.source?.height;
                                if (w && h && w > 0 && h > 0) {
                                    natW.value = w;
                                    natH.value = h;
                                    recomputeRef.current();
                                }
                            }}
                            onLoadEnd={() => setLoading(false)}
                        />
                    </Animated.View>
                </Animated.View>
            </GestureDetector>
            {loading && (
                <View style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'transparent',
                }}>
                    <AppActivityIndicator />
                </View>
            )}
        </View>
    );
};

const ViewPhoto = ({ route, navigation }: NavProps) => {
    const app_theme = useAppSelector(state => state.app_theme);

    // Support both old format (source) and new format (images array)
    const { source, images, initialIndex } = route.params as { 
        source?: string; 
        images?: string[]; 
        initialIndex?: number;
    };

    // Determine if we have multiple images
    const imageArray = useMemo(() => {
        if (images && images.length > 0) return images;
        if (source) return [source];
        return [];
    }, [images, source]);

    const hasMultipleImages = imageArray.length > 1;
    const initialIdx = initialIndex !== undefined ? Math.min(Math.max(0, initialIndex), Math.max(0, imageArray.length - 1)) : 0;
    const [currentIndex, setCurrentIndex] = useState(initialIdx);

    // Shared values for 3D Cube (scrollX) and swipe-down dismiss (translateY)
    const scrollX = useSharedValue<number>(initialIdx * SCREEN_WIDTH);
    const translateY = useSharedValue<number>(0);

    // Shared values to track gesture and zoom state
    const gestureDirection = useSharedValue<number>(0); // 0: none, 1: horizontal (cube), 2: vertical (dismiss)
    const gestureStartScrollX = useSharedValue<number>(initialIdx * SCREEN_WIDTH);
    const isDismissing = useSharedValue<boolean>(false);
    const isZoomedShared = useSharedValue<boolean>(false);
    const isPinchingShared = useSharedValue<boolean>(false);

    useEffect(() => {
        navigation.setOptions({ headerShown: false });
    }, [navigation]);

    const handleDismiss = useCallback(() => {
        navigation.goBack();
    }, [navigation]);

    const goToIndex = useCallback((targetIdx: number) => {
        if (targetIdx === currentIndex || targetIdx < 0 || targetIdx >= imageArray.length) return;
        cancelAnimation(scrollX);
        isZoomedShared.value = false;
        scrollX.value = withTiming(
            targetIdx * SCREEN_WIDTH,
            { duration: 220, easing: Easing.out(Easing.cubic) },
            (finished) => {
                if (finished) {
                    runOnJS(setCurrentIndex)(targetIdx);
                }
            }
        );
    }, [currentIndex, imageArray.length, scrollX, isZoomedShared]);

    // Gesture Handler for 3D Cube pan and swipe-down dismiss (mirroring UserStories.tsx)
    const panGesture = useMemo(
        () =>
            Gesture.Pan()
                .maxPointers(1)
                .activeOffsetX([-15, 15])
                .activeOffsetY([-15, 15])
                .onBegin(() => {
                    if (isZoomedShared.value || isPinchingShared.value) return;
                    if (!isDismissing.value) {
                        cancelAnimation(scrollX);
                        cancelAnimation(translateY);
                        gestureDirection.value = 0;
                        gestureStartScrollX.value = scrollX.value;
                    }
                })
                .onUpdate((event) => {
                    if (isDismissing.value || isZoomedShared.value || isPinchingShared.value) return;

                    const absX = Math.abs(event.translationX);
                    const absY = Math.abs(event.translationY);

                    // Determine lock direction once movement starts:
                    // Downward swipe (translationY > 10 and absY > absX * 1.2) locks vertical dismiss
                    // Horizontal swipe (absX > 10 and absX > absY * 1.2) locks 3D cube slider
                    if (gestureDirection.value === 0) {
                        if (absY > absX * 1.2 && event.translationY > 10) {
                            gestureDirection.value = 2; // Vertical dismiss
                        } else if (absX > absY * 1.2 && absX > 10) {
                            gestureDirection.value = 1; // Horizontal 3D cube
                        }
                    }

                    if (gestureDirection.value === 2) {
                        // Vertical drag down (Pull-to-dismiss)
                        if (event.translationY > 0) {
                            translateY.value = event.translationY;
                        }
                    } else if (gestureDirection.value === 1) {
                        // Horizontal 3D cube rotation with elastic resistance at edges
                        const minScroll = 0;
                        const maxScroll = Math.max(0, (imageArray.length - 1) * SCREEN_WIDTH);
                        const currentTarget = gestureStartScrollX.value - event.translationX;
                        if (currentTarget < minScroll) {
                            scrollX.value = minScroll + (currentTarget - minScroll) * 0.35;
                        } else if (currentTarget > maxScroll) {
                            scrollX.value = maxScroll + (currentTarget - maxScroll) * 0.35;
                        } else {
                            scrollX.value = currentTarget;
                        }
                    }
                })
                .onEnd((event) => {
                    if (isDismissing.value || isZoomedShared.value || isPinchingShared.value) return;

                    if (gestureDirection.value === 2) {
                        // Dismiss if dragged down > DISMISS_THRESHOLD OR downward velocity > 600
                        if (event.translationY > DISMISS_THRESHOLD || event.velocityY > 600) {
                            isDismissing.value = true;
                            translateY.value = withTiming(
                                SCREEN_HEIGHT,
                                { duration: 260, easing: Easing.out(Easing.cubic) },
                                (finished) => {
                                    if (finished) {
                                        runOnJS(handleDismiss)();
                                    }
                                }
                            );
                        } else {
                            translateY.value = withTiming(0, {
                                duration: 180,
                                easing: Easing.out(Easing.cubic),
                            });
                        }
                    } else if (gestureDirection.value === 1) {
                        // Horizontal 3D Cube snap
                        const maxIdx = Math.max(0, imageArray.length - 1);
                        let targetIdx = currentIndex;

                        const velocityThreshold = 400;
                        const distanceThreshold = SCREEN_WIDTH * 0.25;

                        if (event.velocityX < -velocityThreshold) {
                            targetIdx = Math.min(maxIdx, currentIndex + 1);
                        } else if (event.velocityX > velocityThreshold) {
                            targetIdx = Math.max(0, currentIndex - 1);
                        } else if (event.translationX < -distanceThreshold) {
                            targetIdx = Math.min(maxIdx, currentIndex + 1);
                        } else if (event.translationX > distanceThreshold) {
                            targetIdx = Math.max(0, currentIndex - 1);
                        } else {
                            targetIdx = currentIndex;
                        }

                        if (targetIdx !== currentIndex) {
                            scrollX.value = withTiming(
                                targetIdx * SCREEN_WIDTH,
                                { duration: 220, easing: Easing.out(Easing.cubic) },
                                (finished) => {
                                    if (finished) {
                                        runOnJS(setCurrentIndex)(targetIdx);
                                    }
                                }
                            );
                        } else {
                            scrollX.value = withTiming(
                                currentIndex * SCREEN_WIDTH,
                                { duration: 180, easing: Easing.out(Easing.cubic) }
                            );
                        }
                    }
                    gestureDirection.value = 0;
                })
                .onFinalize(() => {
                    if (!isDismissing.value && !isZoomedShared.value && !isPinchingShared.value) {
                        translateY.value = withTiming(0, {
                            duration: 160,
                            easing: Easing.out(Easing.quad),
                        });
                    }
                }),
        [
            currentIndex,
            imageArray.length,
            handleDismiss,
            gestureDirection,
            gestureStartScrollX,
            translateY,
            scrollX,
            isZoomedShared,
            isPinchingShared,
            isDismissing,
        ]
    );

    const containerAnimatedStyle = useAnimatedStyle(() => {
        const dismissScale = interpolate(
            translateY.value,
            [0, SCREEN_HEIGHT * 0.6],
            [1, 0.88],
            Extrapolation.CLAMP
        );
        const dismissRadius = interpolate(
            translateY.value,
            [0, SCREEN_HEIGHT * 0.3],
            [0, 20],
            Extrapolation.CLAMP
        );

        return {
            transform: [
                { translateY: translateY.value },
                { scale: dismissScale },
            ] as any,
            borderRadius: dismissRadius,
            overflow: 'hidden',
        };
    });

    const animatedBackgroundStyle = useAnimatedStyle(() => {
        const bgOpacity = interpolate(
            translateY.value,
            [0, SCREEN_HEIGHT / 2],
            [1, 0],
            Extrapolation.CLAMP
        );

        return {
            backgroundColor: `rgba(0, 0, 0, ${bgOpacity})`,
        };
    });

    const controlsAnimatedStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            translateY.value,
            [0, 60],
            [1, 0],
            Extrapolation.CLAMP
        );

        return {
            opacity,
        };
    });

    if (imageArray.length === 0 || (imageArray.length === 1 && imageArray[0] === "")) {
        return (
            <GestureHandlerRootView style={styles.root}>
                <View style={[styles.root, { backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' }]}>
                    <Pressable
                        onPress={handleDismiss}
                        style={{
                            position: 'absolute',
                            top: 40,
                            left: 16,
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            justifyContent: 'center',
                            alignItems: 'center',
                            zIndex: 10,
                        }}
                    >
                        <IconApp pack="FI" name="x" size={22} color="#FFFFFF" />
                    </Pressable>
                    <TextNormalYambiGray text={strings.no_picture} />
                </View>
            </GestureHandlerRootView>
        );
    }

    return (
        <GestureHandlerRootView style={styles.root}>
            <Animated.View style={[StyleSheet.absoluteFill, animatedBackgroundStyle]}>
                <GestureDetector gesture={panGesture}>
                    <Animated.View style={[styles.container, containerAnimatedStyle]}>
                        {/* Header Overlay */}
                        <Animated.View style={[styles.headerOverlay, controlsAnimatedStyle]}>
                            <Pressable
                                onPress={handleDismiss}
                                hitSlop={12}
                                style={styles.closeBtn}
                            >
                                <IconApp pack="FI" name="x" size={22} color="#FFFFFF" />
                            </Pressable>

                            {hasMultipleImages && (
                                <View style={styles.counterBadge}>
                                    <YambiText
                                        size="small"
                                        color="white"
                                        bold
                                        text={`${currentIndex + 1} / ${imageArray.length}`}
                                    />
                                </View>
                            )}
                        </Animated.View>

                        {/* StoryUserPage 3D Cube Faces for Photos */}
                        {imageArray.map((item, idx) => {
                            if (Math.abs(idx - currentIndex) > 1) {
                                return null;
                            }

                            return (
                                <StoryUserPage
                                    key={idx}
                                    index={idx}
                                    currentUserIndex={currentIndex}
                                    scrollX={scrollX}
                                    width={SCREEN_WIDTH}
                                    height={SCREEN_HEIGHT}
                                    pointerEvents={idx === currentIndex ? 'auto' : 'none'}
                                >
                                    <ZoomablePhotoItem
                                        uri={item}
                                        backgroundColor="transparent"
                                        isZoomedShared={isZoomedShared}
                                        isPinchingShared={isPinchingShared}
                                        isActive={idx === currentIndex}
                                    />
                                </StoryUserPage>
                            );
                        })}

                        {/* Bottom Pagination Dots */}
                        {hasMultipleImages && (
                            <Animated.View style={[styles.footerOverlay, controlsAnimatedStyle]}>
                                {imageArray.map((_, idx) => (
                                    <Pressable
                                        key={idx}
                                        onPress={() => goToIndex(idx)}
                                        hitSlop={10}
                                        style={[
                                            styles.dot,
                                            {
                                                width: currentIndex === idx ? 22 : 8,
                                                backgroundColor:
                                                    currentIndex === idx
                                                        ? (app_theme.colors.high_color || '#FFFFFF')
                                                        : 'rgba(255,255,255,0.4)',
                                            },
                                        ]}
                                    />
                                ))}
                            </Animated.View>
                        )}
                    </Animated.View>
                </GestureDetector>
            </Animated.View>
        </GestureHandlerRootView>
    );
};

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: 'transparent',
        overflow: 'hidden',
    },
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    headerOverlay: {
        position: 'absolute',
        top: 40,
        left: 0,
        right: 0,
        zIndex: 30,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    closeBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    counterBadge: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 16,
    },
    footerOverlay: {
        position: 'absolute',
        bottom: 36,
        left: 0,
        right: 0,
        zIndex: 30,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dot: {
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
    },
});

export default ViewPhoto;
