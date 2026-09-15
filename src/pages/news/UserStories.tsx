import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
    View,
    Dimensions,
    StyleSheet,
    Keyboard,
} from 'react-native';
import { NavProps } from '../../types/types';
import { useAppSelector } from '../../store/app/hooks';
import { useQuery, useRealm } from '@realm/react';
import { Stories } from '../../store/database/Models';
import { cleanExpiredLocalStories, isStoryExpired } from '../../utils/storyCleanup';
import {
    Gesture,
    GestureDetector,
    GestureHandlerRootView,
} from 'react-native-gesture-handler';
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
} from 'react-native-reanimated';
import { StoryUserPage } from '../../components/stories/StoryCubeFace';
import SingleUserStories from '../../components/stories/SingleUserStories';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const UserStories = ({ navigation, route }: NavProps) => {
    const { phone_number, story_id } = route.params;
    const user_data = useAppSelector((state) => state.user_data);
    const realm = useRealm();

    const allStories = useQuery(Stories, (sts) => sts.sorted('createdAt', false));

    useEffect(() => {
        cleanExpiredLocalStories(realm);
    }, [realm]);

    // Build the ordered list of all users with active stories
    const allUsersWithStories = useMemo(() => {
        const assembledStories: { phone_number: string; lastDate: string; hasUnseen: boolean }[] = [];

        // 1. Current user active stories (if any)
        const myActiveStories = allStories.filter(
            (st) => st.phone_number === user_data.phone_number && !isStoryExpired(st)
        );
        if (myActiveStories.length > 0) {
            const hasUnseen = myActiveStories.some((st) => {
                let viewersList: any[] = [];
                try {
                    viewersList = JSON.parse(st.viewers || '[]');
                } catch (e) {}
                return !viewersList.some((v: any) =>
                    typeof v === 'string'
                        ? v === user_data.phone_number
                        : v.phone_number === user_data.phone_number ||
                          v.phone === user_data.phone_number
                );
            });
            assembledStories.push({
                phone_number: user_data.phone_number,
                lastDate: myActiveStories[myActiveStories.length - 1].createdAt,
                hasUnseen,
            });
        }

        // 2. Contacts active stories
        const storiesByPhone: { [phone: string]: any[] } = {};
        for (let i = 0; i < allStories.length; i++) {
            const st = allStories[i];
            if (st.phone_number && st.phone_number !== user_data.phone_number && !isStoryExpired(st)) {
                if (!storiesByPhone[st.phone_number]) {
                    storiesByPhone[st.phone_number] = [];
                }
                storiesByPhone[st.phone_number].push(st);
            }
        }

        const otherUsers: { phone_number: string; lastDate: string; hasUnseen: boolean }[] = [];
        for (const pPhone in storiesByPhone) {
            const uStories = storiesByPhone[pPhone];
            if (uStories.length > 0) {
                const hasUnseen = uStories.some((st) => {
                    let viewersList: any[] = [];
                    try {
                        viewersList = JSON.parse(st.viewers || '[]');
                    } catch (e) {}
                    return !viewersList.some((v: any) =>
                        typeof v === 'string'
                            ? v === user_data.phone_number
                            : v.phone_number === user_data.phone_number ||
                              v.phone === user_data.phone_number
                    );
                });
                otherUsers.push({
                    phone_number: pPhone,
                    lastDate: uStories[uStories.length - 1].createdAt,
                    hasUnseen,
                });
            }
        }

        otherUsers.sort((a, b) => {
            if (a.hasUnseen !== b.hasUnseen) {
                return a.hasUnseen ? -1 : 1;
            }
            const timeA = new Date(a.lastDate).getTime();
            const timeB = new Date(b.lastDate).getTime();
            return timeB - timeA;
        });

        const fullList = assembledStories.concat(otherUsers);

        // Ensure the initially requested user is included in the list
        if (!fullList.some((u) => u.phone_number === phone_number)) {
            fullList.unshift({
                phone_number,
                lastDate: new Date().toISOString(),
                hasUnseen: false,
            });
        }

        return fullList;
    }, [allStories, user_data.phone_number, phone_number]);

    // Initial user index
    const initialUserIndex = useMemo(() => {
        const found = allUsersWithStories.findIndex((u) => u.phone_number === phone_number);
        return found !== -1 ? found : 0;
    }, [allUsersWithStories, phone_number]);

    const [currentUserIndex, setCurrentUserIndex] = useState<number>(initialUserIndex);
    const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
    const [isInteracting, setIsInteracting] = useState<boolean>(false);
    const [navDirection, setNavDirection] = useState<'next' | 'prev' | null>(null);
    const [userStoryIndices, setUserStoryIndices] = useState<Record<string, number>>({});
    const [swipeUpEvent, setSwipeUpEvent] = useState<{ userIndex: number; id: number } | null>(null);

    const handleSwipeUp = useCallback(() => {
        setSwipeUpEvent({ userIndex: currentUserIndex, id: Date.now() });
    }, [currentUserIndex]);

    // Shared values for 3D Cube (scrollX) and swipe-down dismiss (translateY)
    const scrollX = useSharedValue<number>(initialUserIndex * SCREEN_WIDTH);
    const translateY = useSharedValue<number>(0);

    // Track active gesture mode: 0: none, 1: horizontal (cube), 2: vertical (dismiss)
    const gestureDirection = useSharedValue<number>(0);
    const gestureStartScrollX = useSharedValue<number>(initialUserIndex * SCREEN_WIDTH);
    const isDismissing = useSharedValue<boolean>(false);
    const DISMISS_THRESHOLD = 120;

    useEffect(() => {
        navigation.setOptions({ headerShown: false });
    }, [navigation]);

    const dismissKeyboard = useCallback(() => {
        Keyboard.dismiss();
    }, []);

    const handleDismiss = useCallback(() => {
        dismissKeyboard();
        navigation.goBack();
    }, [navigation, dismissKeyboard]);

    const handleNextUser = useCallback(() => {
        dismissKeyboard();
        setSwipeUpEvent(null);
        if (currentUserIndex < allUsersWithStories.length - 1) {
            const targetIdx = currentUserIndex + 1;
            setNavDirection('next');
            setIsTransitioning(true);
            cancelAnimation(scrollX);
            scrollX.value = withTiming(
                targetIdx * SCREEN_WIDTH,
                { duration: 320, easing: Easing.out(Easing.cubic) },
                (finished) => {
                    if (finished) {
                        runOnJS(setCurrentUserIndex)(targetIdx);
                        runOnJS(setIsTransitioning)(false);
                    }
                }
            );
        } else {
            handleDismiss();
        }
    }, [currentUserIndex, allUsersWithStories.length, handleDismiss, scrollX, dismissKeyboard]);

    const handlePrevUser = useCallback(() => {
        dismissKeyboard();
        setSwipeUpEvent(null);
        if (currentUserIndex > 0) {
            const targetIdx = currentUserIndex - 1;
            setNavDirection('prev');
            setIsTransitioning(true);
            cancelAnimation(scrollX);
            scrollX.value = withTiming(
                targetIdx * SCREEN_WIDTH,
                { duration: 320, easing: Easing.out(Easing.cubic) },
                (finished) => {
                    if (finished) {
                        runOnJS(setCurrentUserIndex)(targetIdx);
                        runOnJS(setIsTransitioning)(false);
                    }
                }
            );
        }
    }, [currentUserIndex, scrollX, dismissKeyboard]);

    // Gesture Handler for 3D Cube pan and swipe-down dismiss
    const panGesture = useMemo(
        () =>
            Gesture.Pan()
                .activeOffsetX([-10, 10])
                .activeOffsetY([-10, 10])
                .onBegin(() => {
                    runOnJS(dismissKeyboard)();
                    if (!isDismissing.value) {
                        cancelAnimation(scrollX);
                        cancelAnimation(translateY);
                        gestureDirection.value = 0;
                        gestureStartScrollX.value = scrollX.value;
                    }
                })
                .onUpdate((event) => {
                    if (isDismissing.value) return;

                    const absX = Math.abs(event.translationX);
                    const absY = Math.abs(event.translationY);

                    // Determine lock direction once movement starts:
                    // Downward swipe (translationY > 10 and absY > absX * 1.2) locks vertical dismiss
                    // Upward swipe (translationY < -10 and absY > absX * 1.2) locks upward swipe (views/reply)
                    // Horizontal swipe (absX > 10 and absX > absY * 1.2) locks 3D cube rotation
                    if (gestureDirection.value === 0) {
                        if (absY > absX * 1.2 && event.translationY > 10) {
                            gestureDirection.value = 2; // Vertical dismiss
                            runOnJS(setIsInteracting)(true);
                        } else if (absY > absX * 1.2 && event.translationY < -10) {
                            gestureDirection.value = 3; // Upward swipe (viewer sheet or reply input)
                            runOnJS(setIsInteracting)(true);
                        } else if (absX > absY * 1.2 && absX > 10) {
                            gestureDirection.value = 1; // Horizontal 3D cube
                            runOnJS(setIsInteracting)(true);
                        }
                    }

                    if (gestureDirection.value === 2) {
                        // Vertical drag down (Pull-to-dismiss): translate directly with the finger
                        if (event.translationY > 0) {
                            translateY.value = event.translationY;
                        }
                    } else if (gestureDirection.value === 3) {
                        // Upward swipe: DO NOT modify translateY to prevent background shaking/jumping
                    } else if (gestureDirection.value === 1) {
                        // Horizontal 3D cube rotation
                        const minScroll = 0;
                        const maxScroll = (allUsersWithStories.length - 1) * SCREEN_WIDTH;
                        const currentTarget =
                            gestureStartScrollX.value - event.translationX;
                        // Add elastic resistance at edges
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
                    if (isDismissing.value) return;

                    if (gestureDirection.value === 2) {
                        // Dismiss if dragged down > DISMISS_THRESHOLD OR downward flick velocity > 600
                        if (event.translationY > DISMISS_THRESHOLD || event.velocityY > 600) {
                            isDismissing.value = true;
                            // 1. On anime TOUT le conteneur vers le bas (l'image reste 100% visible pendant la chute)
                            translateY.value = withTiming(
                                SCREEN_HEIGHT,
                                { duration: 260, easing: Easing.out(Easing.cubic) },
                                (finished) => {
                                    if (finished) {
                                        // 2. SEULEMENT ICI : On ferme l'écran une fois la vue sortie de l'écran
                                        runOnJS(handleDismiss)();
                                    }
                                }
                            );
                        } else {
                            // Si le seuil n'est pas atteint, on annule et on ramène le statut à 0
                            translateY.value = withSpring(
                                0,
                                {
                                    damping: 20,
                                    stiffness: 180,
                                },
                                (finished) => {
                                    if (finished) {
                                        runOnJS(setIsInteracting)(false);
                                    }
                                }
                            );
                        }
                    } else if (gestureDirection.value === 3) {
                        // Upward swipe: trigger viewers sheet or reply keyboard without shaking translateY
                        if (event.translationY < -25 || event.velocityY < -150) {
                            runOnJS(handleSwipeUp)();
                        }
                        runOnJS(setIsInteracting)(false);
                    } else if (gestureDirection.value === 1) {
                        // Horizontal 3D Cube snap
                        const maxIdx = allUsersWithStories.length - 1;
                        let targetIdx = currentUserIndex;

                        const velocityThreshold = 500;
                        const distanceThreshold = SCREEN_WIDTH * 0.35;

                        // Check flick velocity first, then distance threshold
                        if (event.velocityX < -velocityThreshold) {
                            targetIdx = Math.min(maxIdx, currentUserIndex + 1);
                        } else if (event.velocityX > velocityThreshold) {
                            targetIdx = Math.max(0, currentUserIndex - 1);
                        } else if (event.translationX < -distanceThreshold) {
                            targetIdx = Math.min(maxIdx, currentUserIndex + 1);
                        } else if (event.translationX > distanceThreshold) {
                            targetIdx = Math.max(0, currentUserIndex - 1);
                        } else {
                            targetIdx = currentUserIndex; // Clean return on small swipe (< 35%)
                        }

                        if (targetIdx > currentUserIndex) {
                            runOnJS(setNavDirection)('next');
                        } else if (targetIdx < currentUserIndex) {
                            runOnJS(setNavDirection)('prev');
                        }

                        if (targetIdx !== currentUserIndex) {
                            runOnJS(dismissKeyboard)();
                            runOnJS(setSwipeUpEvent)(null);
                            scrollX.value = withTiming(
                                targetIdx * SCREEN_WIDTH,
                                { duration: 280, easing: Easing.out(Easing.cubic) },
                                (finished) => {
                                    if (finished) {
                                        runOnJS(setCurrentUserIndex)(targetIdx);
                                    }
                                    runOnJS(setIsInteracting)(false);
                                }
                            );
                        } else {
                            scrollX.value = withSpring(
                                currentUserIndex * SCREEN_WIDTH,
                                {
                                    damping: 24,
                                    stiffness: 180,
                                    mass: 0.8,
                                },
                                (finished) => {
                                    if (finished) {
                                        runOnJS(setIsInteracting)(false);
                                    }
                                }
                            );
                        }
                    } else {
                        runOnJS(setIsInteracting)(false);
                    }
                    gestureDirection.value = 0;
                })
                .onFinalize(() => {
                    if (!isDismissing.value) {
                        translateY.value = withSpring(0);
                        if (gestureDirection.value === 0) {
                            runOnJS(setIsInteracting)(false);
                        }
                    }
                }),
        [
            currentUserIndex,
            allUsersWithStories.length,
            handleDismiss,
            handleSwipeUp,
            gestureDirection,
            gestureStartScrollX,
            translateY,
            scrollX,
        ]
    );

    const containerAnimatedStyle = useAnimatedStyle(() => {
        // Clamped dismiss scale and border radius
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

    return (
        <GestureHandlerRootView style={styles.root}>
            <Animated.View style={[StyleSheet.absoluteFill, animatedBackgroundStyle]}>
                <GestureDetector gesture={panGesture}>
                    <Animated.View style={[styles.container, containerAnimatedStyle]}>
                        {allUsersWithStories.map((user, idx) => {
                            // Render active user and immediate neighbors for optimal memory usage
                            if (Math.abs(idx - currentUserIndex) > 1) {
                                return null;
                            }

                            return (
                                <StoryUserPage
                                    key={user.phone_number}
                                    index={idx}
                                    currentUserIndex={currentUserIndex}
                                    scrollX={scrollX}
                                    width={SCREEN_WIDTH}
                                    height={SCREEN_HEIGHT}
                                    pointerEvents={idx === currentUserIndex ? 'auto' : 'none'}
                                >
                                    <SingleUserStories
                                        userPhone={user.phone_number}
                                        userIndex={idx}
                                        scrollX={scrollX}
                                        isActive={idx === currentUserIndex && !isTransitioning}
                                        initialStoryId={idx === initialUserIndex ? story_id : undefined}
                                        storyIndex={userStoryIndices[user.phone_number]}
                                        onStoryIndexChange={(sIdx) =>
                                            setUserStoryIndices((prev) => ({
                                                ...prev,
                                                [user.phone_number]: sIdx,
                                            }))
                                        }
                                        isInteracting={isInteracting}
                                        onNextUser={handleNextUser}
                                        onPrevUser={handlePrevUser}
                                        onClose={handleDismiss}
                                        onAddStory={() => navigation.replace('NewStory', { flag: 1 })}
                                        swipeUpTrigger={swipeUpEvent?.userIndex === idx ? swipeUpEvent.id : 0}
                                    />
                                </StoryUserPage>
                            );
                        })}
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
});

export default UserStories;