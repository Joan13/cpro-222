import { Pressable, View, Dimensions, Image } from "react-native";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import FastImage from "react-native-fast-image";
import { useAppSelector } from "../../store/app/hooks";
import { NavProps } from "../../types/types";
import { TextNormalYambiGray } from "../../components/app/Text";
import { strings } from "../../lang/lang";
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withSpring, 
    withTiming,
    runOnJS 
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import AppActivityIndicator from "../../components/app/AppActivityIndicator";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

/** Rest / “fit” zoom level after pinch ends. */
const BASE_ZOOM = 1;
/** Allow pinch to zoom out slightly below fit (rubber band), then spring back on release. */
const PINCH_MIN_SCALE = 0.88;
const MAX_ZOOM = 4;

/** Pinch-to-zoom + one-finger pan when zoomed; pan clamped from contain layout so background never shows. */
const ZoomablePhotoItem = ({ uri, backgroundColor }: { uri: string; backgroundColor: string }) => {
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
        recomputeRef.current();
        let cancelled = false;
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
        return () => { cancelled = true; };
    }, [uri]);

    const zoomGestures = useMemo(() => {
        const maxPan = (disp: number, box: number, s: number) => {
            'worklet';
            return Math.max(0, (disp * s - box) / 2);
        };

        const clampPanToScale = () => {
            'worklet';
            const s = scale.value;
            if (s <= BASE_ZOOM + 0.001) {
                translateX.value = 0;
                translateY.value = 0;
                savedTx.value = 0;
                savedTy.value = 0;
                return;
            }
            const padX = maxPan(dispW.value, boxW.value, s);
            const padY = maxPan(dispH.value, boxH.value, s);
            translateX.value = Math.min(Math.max(translateX.value, -padX), padX);
            translateY.value = Math.min(Math.max(translateY.value, -padY), padY);
            savedTx.value = translateX.value;
            savedTy.value = translateY.value;
        };

        const pinchGesture = Gesture.Pinch()
            .onStart(() => {
                savedScale.value = scale.value;
            })
            .onUpdate((e) => {
                const next = savedScale.value * e.scale;
                scale.value = Math.min(Math.max(next, PINCH_MIN_SCALE), MAX_ZOOM);
                clampPanToScale();
            })
            .onEnd(() => {
                savedScale.value = scale.value;
                if (scale.value < BASE_ZOOM - 0.001) {
                    scale.value = withSpring(BASE_ZOOM);
                    savedScale.value = BASE_ZOOM;
                    translateX.value = withSpring(0);
                    translateY.value = withSpring(0);
                    savedTx.value = 0;
                    savedTy.value = 0;
                } else {
                    clampPanToScale();
                }
            });

        /** Do not activate on first finger down — wait for movement or fail when 2nd finger joins (pinch). */
        const panGesture = Gesture.Pan()
            .maxPointers(1)
            .manualActivation(true)
            .onTouchesDown((e, state) => {
                panActivatedThisStroke.value = 0;
                if (e.numberOfTouches > 1) {
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
                if (e.numberOfTouches > 1) {
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
            .onEnd(() => {
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
                    scale.value = withSpring(BASE_ZOOM);
                    savedScale.value = BASE_ZOOM;
                    translateX.value = withSpring(0);
                    translateY.value = withSpring(0);
                    savedTx.value = 0;
                    savedTy.value = 0;
                } else {
                    scale.value = MAX_ZOOM;
                    savedScale.value = MAX_ZOOM;
                    clampPanToScale();
                }
            });

        return Gesture.Simultaneous(pinchGesture, panGesture, doubleTapGesture);
    }, []);

    /** Pan moves this layer; scale only applies to the exact contain rect so image edges match limits. */
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
                        <FastImage
                            style={{ width: '100%', height: '100%' }}
                            resizeMode={FastImage.resizeMode.contain}
                            source={{
                                priority: FastImage.priority.high,
                                cache: 'immutable',
                                uri,
                            }}
                            onLoadStart={() => setLoading(true)}
                            onLoad={(e: { nativeEvent?: { width?: number; height?: number } }) => {
                                const w = e.nativeEvent?.width;
                                const h = e.nativeEvent?.height;
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
    const imageArray = images && images.length > 0 ? images : (source ? [source] : []);
    const hasMultipleImages = imageArray.length > 1;
    const initialIdx = initialIndex !== undefined ? initialIndex : 0;
    const [currentIndex, setCurrentIndex] = useState(initialIdx);

    // Shared values for animations
    const translateY = useSharedValue(0);
    const translateX = useSharedValue(-initialIdx * SCREEN_WIDTH);
    const opacity = useSharedValue(1);

    // Update translateX when currentIndex changes programmatically
    useEffect(() => {
        translateX.value = withSpring(-currentIndex * SCREEN_WIDTH, {
            damping: 20,
            stiffness: 90,
        });
    }, [currentIndex]);

    const closePhoto = () => {
        navigation.goBack();
    };

    const goToNextImage = () => {
        if (currentIndex < imageArray.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const goToPreviousImage = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    // Horizontal pan gesture for left/right navigation (1 finger only so pinch can use 2)
    const horizontalPanGesture = Gesture.Pan()
        .maxPointers(1)
        .enabled(hasMultipleImages)
        .activeOffsetX([-10, 10]) // Require horizontal movement
        .onUpdate((event) => {
            // Only allow horizontal movement if it's the primary direction
            if (Math.abs(event.translationX) > Math.abs(event.translationY)) {
                const newTranslateX = -currentIndex * SCREEN_WIDTH + event.translationX;
                // Clamp the translation to prevent over-scrolling
                const minX = -(imageArray.length - 1) * SCREEN_WIDTH;
                const maxX = 0;
                translateX.value = Math.max(minX, Math.min(maxX, newTranslateX));
            }
        })
        .onEnd((event) => {
            // Only process if horizontal movement was primary
            if (Math.abs(event.translationX) > Math.abs(event.translationY)) {
                const threshold = SCREEN_WIDTH * 0.3;
                const shouldSwipe = Math.abs(event.translationX) > threshold || Math.abs(event.velocityX) > 500;

                if (shouldSwipe) {
                    if (event.translationX > 0 && currentIndex > 0) {
                        // Swipe right - go to previous image
                        runOnJS(goToPreviousImage)();
                    } else if (event.translationX < 0 && currentIndex < imageArray.length - 1) {
                        // Swipe left - go to next image
                        runOnJS(goToNextImage)();
                    } else {
                        // Snap back to current position
                        translateX.value = withSpring(-currentIndex * SCREEN_WIDTH, {
                            damping: 20,
                            stiffness: 90,
                        });
                    }
                } else {
                    // Snap back to current position
                    translateX.value = withSpring(-currentIndex * SCREEN_WIDTH, {
                        damping: 20,
                        stiffness: 90,
                    });
                }
            } else {
                // Reset if gesture was cancelled
                translateX.value = withSpring(-currentIndex * SCREEN_WIDTH, {
                    damping: 20,
                    stiffness: 90,
                });
            }
        });

    // Vertical pan gesture for closing (downward swipe) — 1 finger only
    const verticalPanGesture = Gesture.Pan()
        .maxPointers(1)
        .activeOffsetY([20, SCREEN_HEIGHT]) // Require a noticeable downward swipe
        .onUpdate((event) => {
            // Only allow downward swipes and prioritize vertical over horizontal
            if (event.translationY > 0 && Math.abs(event.translationY) > Math.abs(event.translationX)) {
                translateY.value = event.translationY;
                // Reduce opacity as user swipes down
                opacity.value = 1 - (event.translationY / SCREEN_HEIGHT) * 0.8;
            }
        })
        .onEnd((event) => {
            // Only process if vertical movement was primary
            if (Math.abs(event.translationY) > Math.abs(event.translationX) && event.translationY > 0) {
            if (event.translationY > SCREEN_HEIGHT * 0.3 || event.velocityY > 500) {
                    // Smooth slideDown animation
                    translateY.value = withTiming(SCREEN_HEIGHT, { 
                        duration: 300,
                    });
                    opacity.value = withTiming(0, { 
                        duration: 300,
                    }, () => {
                    runOnJS(closePhoto)();
                });
            } else {
                // Spring back to original position
                    translateY.value = withSpring(0, { damping: 20, stiffness: 90 });
                    opacity.value = withSpring(1, { damping: 20, stiffness: 90 });
                }
            } else {
                // Reset if gesture was cancelled
                translateY.value = withSpring(0, { damping: 20, stiffness: 90 });
                opacity.value = withSpring(1, { damping: 20, stiffness: 90 });
            }
        });

    // Combined gesture - both horizontal and vertical can work
    const combinedGesture = Gesture.Simultaneous(horizontalPanGesture, verticalPanGesture);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value }
            ],
            opacity: opacity.value,
        } as any;
    });

    const renderImageItem = useCallback(({ item, index: _index }: { item: string; index: number }) => {
        if (item === "") {
            return (
                    <Pressable onPress={() => navigation.goBack()} style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                        <TextNormalYambiGray text={strings.no_picture} />
                </Pressable>
            );
        }

        return (
            <ZoomablePhotoItem uri={item} backgroundColor={app_theme.colors.background} />
        );
    }, [navigation, app_theme.colors.background]);


    if (imageArray.length === 0) {
        return (
            <View style={{
                flex: 1,
                backgroundColor: app_theme.colors.background,
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                <TextNormalYambiGray text={strings.no_picture} />
            </View>
        );
    }

    // Render all images in a horizontal row for multiple images
    const renderImagesContainer = () => {
        if (hasMultipleImages) {
            return (
                <Animated.View style={{
                    flexDirection: 'row',
                    width: SCREEN_WIDTH * imageArray.length,
                    height: '100%',
                }}>
                    {imageArray.map((item, idx) => (
                        <View key={idx} style={{ width: SCREEN_WIDTH, height: '100%' }}>
                            {renderImageItem({ item, index: idx })}
                        </View>
                    ))}
                </Animated.View>
            );
        } else {
            return renderImageItem({ item: imageArray[0], index: 0 });
        }
    };

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={{
                flex: 1,
                backgroundColor: app_theme.colors.background
            }}>
                <GestureDetector gesture={combinedGesture}>
                    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
                        {renderImagesContainer()}
                    </Animated.View>
                </GestureDetector>
            </View>
        </GestureHandlerRootView>
    )
}

export default ViewPhoto;
