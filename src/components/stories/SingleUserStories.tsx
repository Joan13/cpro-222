import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    Pressable,
    Image,
    StyleSheet,
    TextInput,
    Platform,
    Keyboard,
    GestureResponderEvent,
    Dimensions,
} from 'react-native';
import Animated, {
    useAnimatedKeyboard,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
    withSpring,
    interpolate,
    Extrapolation,
    Easing,
    type SharedValue,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
import { TChat, TMessage, TStory } from '../../types/types';
import { strings } from '../../lang/lang';
import { IconApp } from '../app/IconApp';
import { YambiText } from '../app/Text';
import BottomSheet from '../app/BottomSheet';
import ViewersItem from '../lists/stories/ViewersItem';
import { useAppDispatch, useAppSelector } from '../../store/app/hooks';
import { useObject, useQuery, useRealm } from '@realm/react';
import { Stories, UserChats, UserContacts } from '../../store/database/Models';
import { Image as ExpoImage } from 'expo-image';
import { media_url, randomString, renderDateTime, SocketApp } from '../../../GlobalVariables';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isStoryExpired } from '../../utils/storyCleanup';
import { isPhotoStory, parseStoryStyles } from '../../utils/storyUtils';
import moment from 'moment';
import ModalApp from '../app/ModalApp';
import { setShowModalApp } from '../../store/reducers/appSlice';

const STORY_DURATION = 5000; // 5 seconds per story

interface SingleUserStoriesProps {
    userPhone: string;
    isActive: boolean;
    initialStoryId?: string;
    storyIndex?: number;
    onStoryIndexChange?: (index: number) => void;
    isInteracting?: boolean;
    onNextUser: () => void;
    onPrevUser: () => void;
    onClose: () => void;
    onOpenViewers?: () => void;
    onAddStory?: () => void;
    swipeUpTrigger?: number;
    userIndex?: number;
    scrollX?: SharedValue<number>;
}

export const SingleUserStories: React.FC<SingleUserStoriesProps> = ({
    userPhone,
    isActive,
    initialStoryId,
    storyIndex,
    onStoryIndexChange,
    isInteracting = false,
    onNextUser,
    onPrevUser,
    onClose,
    onAddStory,
    swipeUpTrigger,
    userIndex,
    scrollX,
}) => {
    const theme = useAppSelector((state) => state.app_theme.colors);
    const user_data = useAppSelector((state) => state.user_data);
    const contactsList = useAppSelector((state) => state.app.raw_contacts);
    const insets = useSafeAreaInsets();
    const realm = useRealm();
    const dispatch = useAppDispatch();

    const rawStories = useQuery(
        Stories,
        (sts) =>
            sts.filtered('phone_number == $0', userPhone).sorted('createdAt', false),
        [userPhone]
    );

    const stories = rawStories.filter((st) => !isStoryExpired(st));

    const [currentIndex, setCurrentIndex] = useState<number>(storyIndex ?? 0);
    const [progress, setProgress] = useState<number>(0);
    const [isPaused, setIsPaused] = useState<boolean>(false);
    const isPausedRef = useRef<boolean>(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const [showViewersSheet, setShowViewersSheet] = useState<boolean>(false);
    const [replyText, setReplyText] = useState<string>('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

    const [isKeyboardVisible, setIsKeyboardVisible] = useState<boolean>(false);
    const isKeyboardVisibleRef = useRef<boolean>(false);
    const keyboard = useAnimatedKeyboard({ isStatusBarTranslucentAndroid: true });
    const keyboardOffset = useSharedValue<number>(0);

    const replyInputRef = useRef<TextInput>(null);
    const prevSwipeUpTriggerRef = useRef<number>(swipeUpTrigger ?? 0);
    const lastSwipeUpTimeRef = useRef<number>(0);

    const isActiveRef = useRef<boolean>(isActive);
    useEffect(() => {
        isActiveRef.current = isActive;
    }, [isActive]);

    const handleSwipeUpAction = useCallback(() => {
        if (!isActiveRef.current || isInteracting) return;
        const now = Date.now();
        if (now - lastSwipeUpTimeRef.current < 400) return;
        lastSwipeUpTimeRef.current = now;

        if (showViewersSheet || isKeyboardVisibleRef.current || isKeyboardVisible) {
            return;
        }
        if (userPhone === user_data.phone_number) {
            setIsPaused(true);
            setShowViewersSheet(true);
        } else {
            setIsPaused(true);
            setTimeout(() => {
                if (isActiveRef.current) {
                    replyInputRef.current?.focus();
                }
            }, 50);
        }
    }, [userPhone, user_data.phone_number, showViewersSheet, isKeyboardVisible, isInteracting]);

    useEffect(() => {
        if (!isActive) {
            prevSwipeUpTriggerRef.current = swipeUpTrigger ?? 0;
            return;
        }
        if (swipeUpTrigger && swipeUpTrigger > prevSwipeUpTriggerRef.current) {
            prevSwipeUpTriggerRef.current = swipeUpTrigger;
            handleSwipeUpAction();
        } else {
            prevSwipeUpTriggerRef.current = swipeUpTrigger ?? 0;
        }
    }, [swipeUpTrigger, isActive, handleSwipeUpAction]);

    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const showSub = Keyboard.addListener(showEvent, (e) => {
            if (!isActiveRef.current) {
                return;
            }
            isKeyboardVisibleRef.current = true;
            setIsKeyboardVisible(true);
            setIsPaused(true);
            const kbHeight = e.endCoordinates.height;
            const offset = Math.max(0, kbHeight - insets.bottom);
            keyboardOffset.value = Platform.OS === 'ios'
                ? withTiming(offset, { duration: e.duration || 250, easing: Easing.bezier(0.33, 1, 0.68, 1) })
                : withTiming(offset, { duration: 200, easing: Easing.out(Easing.quad) });
        });

        const hideSub = Keyboard.addListener(hideEvent, (e) => {
            isKeyboardVisibleRef.current = false;
            setIsKeyboardVisible(false);
            keyboardOffset.value = Platform.OS === 'ios'
                ? withTiming(0, { duration: e?.duration || 250, easing: Easing.bezier(0.33, 1, 0.68, 1) })
                : withTiming(0, { duration: 200, easing: Easing.out(Easing.quad) });
            if (isActiveRef.current) {
                setIsPaused(false);
            }
        });

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, [insets.bottom]);

    const resetStoryInteractionState = useCallback(() => {
        Keyboard.dismiss();
        replyInputRef.current?.blur();
        setReplyText('');
        setIsKeyboardVisible(false);
        isKeyboardVisibleRef.current = false;
        keyboardOffset.value = 0;
        setShowViewersSheet(false);
        setShowDeleteConfirm(false);
        setIsPaused(false);
        isPausedRef.current = false;
        hasMovedRef.current = false;
        isHoldingRef.current = false;
        touchStartPosRef.current = { x: 0, y: 0 };
        lastSwipeUpTimeRef.current = 0;
        if (holdTimerRef.current) {
            clearTimeout(holdTimerRef.current);
            holdTimerRef.current = null;
        }
    }, [keyboardOffset]);

    useEffect(() => {
        if (!isActive) {
            resetStoryInteractionState();
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            elapsedTimeRef.current = 0;
            setProgress(0);
        }
    }, [isActive, resetStoryInteractionState]);

    useEffect(() => {
        resetStoryInteractionState();
        hasInitializedIndexRef.current = false;
        elapsedTimeRef.current = 0;
        setProgress(0);
    }, [userPhone, resetStoryInteractionState]);

    useEffect(() => {
        resetStoryInteractionState();
    }, [currentIndex, resetStoryInteractionState]);

    const bottomSheetPosition = useSharedValue<number>(0);

    useEffect(() => {
        if (showViewersSheet && isActive) {
            bottomSheetPosition.value = withSpring(1, {
                damping: 22,
                stiffness: 220,
                mass: 0.8,
            });
        } else {
            bottomSheetPosition.value = withSpring(0, {
                damping: 24,
                stiffness: 240,
                mass: 0.8,
            });
        }
    }, [showViewersSheet, isActive]);

    useEffect(() => {
        if (!isActive) {
            setShowViewersSheet(false);
            bottomSheetPosition.value = 0;
        }
    }, [isActive]);

    // Background scale & rounded corners tied to bottom sheet position (Instagram-style)
    const backgroundAnimatedStyle = useAnimatedStyle(() => {
        const scale = interpolate(
            bottomSheetPosition.value,
            [0, 1],
            [1, 0.9],
            Extrapolation.CLAMP
        );
        const borderRadius = interpolate(
            bottomSheetPosition.value,
            [0, 1],
            [0, 20],
            Extrapolation.CLAMP
        );

        return {
            transform: [{ scale }],
            borderRadius,
            overflow: 'hidden',
        };
    });

    const replyAnimatedStyle = useAnimatedStyle(() => {
        const offset = keyboardOffset.value;
        return {
            transform: [{ translateY: -offset }],
        };
    });

    const ui2DAnimatedStyle = useAnimatedStyle(() => {
        if (!scrollX || userIndex === undefined) {
            return { opacity: 1 };
        }
        const relX = scrollX.value - userIndex * SCREEN_WIDTH;
        if (Math.abs(relX) >= SCREEN_WIDTH) {
            return { opacity: 0 };
        }
        const ratio = Math.abs(relX) / SCREEN_WIDTH;
        // 2D UI cross-fade: fades out gracefully during cube swipe
        const opacity = Math.max(0, 1 - ratio * 1.8);
        return {
            opacity,
        };
    }, [scrollX, userIndex]);

    const hasInitializedIndexRef = useRef<boolean>(false);
    const touchStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const hasMovedRef = useRef<boolean>(false);
    const isHoldingRef = useRef<boolean>(false);
    const holdTimerRef = useRef<NodeJS.Timeout | null>(null);

    const isInteractingRef = useRef<boolean>(isInteracting);
    useEffect(() => {
        isInteractingRef.current = isInteracting;
    }, [isInteracting]);

    useEffect(() => {
        isPausedRef.current = isPaused || isInteracting || !isActive;
    }, [isPaused, isInteracting, isActive]);

    useEffect(() => {
        if (isInteracting) {
            hasMovedRef.current = true;
            if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
        }
    }, [isInteracting]);

    // Initialize story index based on prior storyIndex, explicit initialStoryId, or first unseen status
    useEffect(() => {
        if (stories && stories.length > 0 && !hasInitializedIndexRef.current) {
            hasInitializedIndexRef.current = true;

            if (storyIndex !== undefined && storyIndex >= 0 && storyIndex < stories.length) {
                setCurrentIndex(storyIndex);
                setProgress(0);
                return;
            }

            if (initialStoryId) {
                const targetIdx = stories.findIndex(
                    (st) => String(st._id) === String(initialStoryId)
                );
                if (targetIdx !== -1) {
                    setCurrentIndex(targetIdx);
                    onStoryIndexChange?.(targetIdx);
                    setProgress(0);
                    return;
                }
            }

            let lastSeenIndex = -1;
            for (let i = 0; i < stories.length; i++) {
                let viewersList: any[] = [];
                try {
                    viewersList = JSON.parse(stories[i].viewers || '[]');
                } catch (e) {
                    viewersList = [];
                }
                const hasViewed = viewersList.some((v: any) =>
                    typeof v === 'string'
                        ? v === user_data.phone_number
                        : v.phone_number === user_data.phone_number ||
                        v.phone === user_data.phone_number
                );
                if (hasViewed) {
                    lastSeenIndex = i;
                }
            }

            const initialIdx =
                lastSeenIndex === -1 || lastSeenIndex >= stories.length - 1
                    ? 0
                    : lastSeenIndex + 1;
            setCurrentIndex(initialIdx);
            onStoryIndexChange?.(initialIdx);
        }
    }, [stories?.length, user_data.phone_number, initialStoryId, storyIndex]);

    // Keep currentIndex in sync if parent explicitly changes storyIndex
    useEffect(() => {
        if (
            storyIndex !== undefined &&
            storyIndex !== currentIndex &&
            storyIndex >= 0 &&
            storyIndex < stories.length
        ) {
            setCurrentIndex(storyIndex);
            setProgress(0);
        }
    }, [storyIndex, stories.length]);

    // Ensure paused state and interval are cleared when inactive
    useEffect(() => {
        if (!isActive) {
            setIsPaused(false);
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            setProgress(0);
        }
    }, [isActive]);

    const targetContact = useObject(UserContacts, userPhone);

    const ShowUserName = () => {
        if (userPhone === user_data.phone_number) {
            return strings.my_status || 'My Status';
        }
        const contact = contactsList.find((cc) => cc.phoneNumber === userPhone);
        if (contact?.displayName) {
            return contact.displayName;
        }
        return targetContact?.user_names || userPhone;
    };

    const targetProfilePic =
        userPhone === user_data.phone_number
            ? user_data.user_profile
            : targetContact?.user_profile || '';

    const handleNext = () => {
        resetStoryInteractionState();
        if (currentIndex < stories.length - 1) {
            const nextIdx = currentIndex + 1;
            setCurrentIndex(nextIdx);
            onStoryIndexChange?.(nextIdx);
        } else {
            onNextUser();
        }
    };

    const handlePrev = () => {
        resetStoryInteractionState();
        if (currentIndex > 0) {
            const prevIdx = currentIndex - 1;
            setCurrentIndex(prevIdx);
            onStoryIndexChange?.(prevIdx);
        } else {
            onPrevUser();
        }
    };

    const elapsedTimeRef = useRef<number>(0);

    // Reset timer progression on story or contact change
    useEffect(() => {
        elapsedTimeRef.current = 0;
        setProgress(0);
    }, [currentIndex, userPhone]);

    // Story timer progression
    useEffect(() => {
        if (!stories || stories.length === 0 || !isActive) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        const intervalTime = 50;
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        intervalRef.current = setInterval(() => {
            if (isPausedRef.current || isInteractingRef.current) {
                return;
            }
            elapsedTimeRef.current += intervalTime;
            const currentProgress = Math.min(1, elapsedTimeRef.current / STORY_DURATION);
            setProgress(currentProgress);

            if (elapsedTimeRef.current >= STORY_DURATION) {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
                handleNext();
            }
        }, intervalTime);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [currentIndex, stories?.length, isActive]);

    // Handle touch zones with hold-to-pause and click-to-advance (strictly rejecting swipes)
    const handleTouchStart = (e: GestureResponderEvent) => {
        if (isKeyboardVisibleRef.current || isKeyboardVisible || keyboard.height.value > 10 || keyboardOffset.value > 10) {
            return;
        }
        touchStartPosRef.current = {
            x: e.nativeEvent.pageX,
            y: e.nativeEvent.pageY,
        };
        hasMovedRef.current = false;
        isHoldingRef.current = false;

        if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
        holdTimerRef.current = setTimeout(() => {
            if (!hasMovedRef.current && !isInteracting) {
                isHoldingRef.current = true;
                setIsPaused(true);
            }
        }, 200);
    };

    const handleTouchMove = (e: GestureResponderEvent) => {
        const dx = Math.abs(e.nativeEvent.pageX - touchStartPosRef.current.x);
        const dy = Math.abs(e.nativeEvent.pageY - touchStartPosRef.current.y);
        if (dx > 8 || dy > 8) {
            hasMovedRef.current = true;
            if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
            setIsPaused(true);
        }
    };

    const handleTouchCancel = () => {
        if (holdTimerRef.current) {
            clearTimeout(holdTimerRef.current);
            holdTimerRef.current = null;
        }
        hasMovedRef.current = false;
        isHoldingRef.current = false;
    };

    const handleTouchEnd = () => {
        if (holdTimerRef.current) {
            clearTimeout(holdTimerRef.current);
            holdTimerRef.current = null;
        }

        hasMovedRef.current = false;

        if (isHoldingRef.current || isPausedRef.current) {
            if (!isKeyboardVisibleRef.current && !isKeyboardVisible && keyboardOffset.value <= 10 && !showViewersSheet) {
                setIsPaused(false);
            }
            setTimeout(() => {
                isHoldingRef.current = false;
            }, 60);
        }
    };

    const handleTapLeft = () => {
        if (isKeyboardVisibleRef.current || isKeyboardVisible || keyboardOffset.value > 10) {
            Keyboard.dismiss();
            replyInputRef.current?.blur();
            return;
        }
        if (showViewersSheet || isInteracting || hasMovedRef.current || isHoldingRef.current) {
            return;
        }
        handlePrev();
    };

    const handleTapRight = () => {
        if (isKeyboardVisibleRef.current || isKeyboardVisible || keyboardOffset.value > 10) {
            Keyboard.dismiss();
            replyInputRef.current?.blur();
            return;
        }
        if (showViewersSheet || isInteracting || hasMovedRef.current || isHoldingRef.current) {
            return;
        }
        handleNext();
    };

    const currentStory: TStory | undefined = stories[currentIndex];

    // Mark current story as viewed
    useEffect(() => {
        if (!isActive || !currentStory || !user_data.phone_number || !currentStory._id) return;
        if (user_data.phone_number === currentStory.phone_number) return;

        let viewersList: any[] = [];
        try {
            viewersList = JSON.parse(currentStory.viewers || '[]');
        } catch (e) {
            viewersList = [];
        }

        const hasViewed = viewersList.some((v: any) =>
            typeof v === 'string'
                ? v === user_data.phone_number
                : v.phone_number === user_data.phone_number ||
                v.phone === user_data.phone_number
        );

        if (!hasViewed) {
            const nowTime = new Date().toISOString();
            const newViewer = {
                phone_number: user_data.phone_number,
                time: nowTime,
            };
            viewersList.push(newViewer);
            const updatedViewers = JSON.stringify(viewersList);

            realm.write(() => {
                try {
                    const realmStory = realm.objectForPrimaryKey<Stories>(
                        'Stories',
                        currentStory._id
                    );
                    if (realmStory) {
                        realmStory.viewers = updatedViewers;
                    }
                } catch (e) { }
            });

            SocketApp.emit('OnViewStatus', {
                story_id: currentStory._id,
                viewer_phone: user_data.phone_number,
                time: nowTime,
            });
        }
    }, [currentIndex, currentStory?._id, currentStory?.phone_number, user_data.phone_number, isActive, realm]);

    const handleSendStatusReply = () => {
        if (!replyText.trim() || !currentStory) return;

        const textToSend = replyText.trim();
        const tokenn = randomString(32);
        const time = new Date().toISOString();

        const isPhoto = isPhotoStory(currentStory);
        const statusCaption = isPhoto
            ? currentStory.caption || 'Photo'
            : currentStory.caption || currentStory.main_text || '';

        const msg: TMessage = {
            sender: user_data.phone_number,
            receiver: currentStory.phone_number,
            main_text_message: textToSend,
            caption: statusCaption,
            message_type: 5,
            reactions: '[]',
            response_to: currentStory._id,
            message_read: 0,
            message_effect: isPhoto ? 1 : 0,
            read_once: 0,
            flag: 0,
            token: tokenn,
            deleted: 0,
            platform: Platform.OS,
            createdAt: time,
            receivedAt: '',
            readAt: '',
            playedAt: '',
            cc: moment(time).format('DD/MM/YYYY'),
            alignment: moment().utc().toISOString(),
        };

        let chatt = realm.objectForPrimaryKey<UserChats>(
            'UserChats',
            currentStory.phone_number
        );

        let chat: TChat = {
            _id: currentStory.phone_number,
            phone_number: currentStory.phone_number,
            user: user_data.phone_number,
            type_chat: 0,
            last_message: tokenn,
            flag: 0,
            favorite: 0,
            pinned: 0,
            chat_read: 1,
            deleted: 0,
            chat_effect: 0,
            createdAt: time,
            updatedAt: time,
        };

        if (chatt !== null && chatt !== undefined) {
            chat = {
                _id: chatt._id,
                phone_number: chatt.phone_number,
                user: chatt.user,
                type_chat: chatt.type_chat,
                last_message: tokenn,
                flag: chatt.flag,
                favorite: chatt.favorite ?? 0,
                pinned: chatt.pinned ?? 0,
                chat_read: 1,
                deleted: 0,
                chat_effect: chatt.chat_effect,
                createdAt: time,
                updatedAt: moment().format(),
            };
        }

        realm.write(() => {
            try {
                realm.create('UsersMessages', msg);
                realm.create('UserChats', chat, true);
            } catch (error) { }
        });

        SocketApp.emit('newMessage', msg);

        Keyboard.dismiss();
        setReplyText('');
        setIsPaused(false);
    };

    const handleDeleteStory = () => {
        if (!currentStory) return;
        const storyId = currentStory._id;
        const onlyWith = currentStory.only_with || '[]';

        SocketApp.emit('DeleteStory', {
            story_id: storyId,
            phone_number: user_data.phone_number,
            only_with: onlyWith,
        });

        realm.write(() => {
            try {
                const realmStory = realm.objectForPrimaryKey<Stories>('Stories', storyId);
                if (realmStory) {
                    realm.delete(realmStory);
                }
            } catch (e) { }
        });

        setShowDeleteConfirm(false);
        setShowViewersSheet(false);
        dispatch(setShowModalApp(false));

        if (stories.length <= 1) {
            onClose();
        } else if (currentIndex >= stories.length - 1) {
            setCurrentIndex(stories.length - 2);
        }
    };

    if (!stories || stories.length === 0) {
        return (
            <View style={[styles.container, { backgroundColor: '#000000', paddingTop: insets.top }]}>
                <View style={styles.headerRow}>
                    <Pressable onPress={onClose} style={styles.closeBtn}>
                        <IconApp pack="FI" name="x" size={24} color="#FFFFFF" />
                    </Pressable>
                </View>
                <View style={styles.centerContent}>
                    <Text style={{ color: '#FFFFFF', fontSize: 16, marginBottom: 16 }}>
                        {strings.no_active_stories}
                    </Text>
                    {userPhone === user_data.phone_number && onAddStory && (
                        <Pressable
                            onPress={onAddStory}
                            style={{
                                backgroundColor: theme.high_color || '#1D2A44',
                                paddingHorizontal: 20,
                                paddingVertical: 10,
                                borderRadius: 20,
                            }}
                        >
                            <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>
                                {strings.add_story}
                            </Text>
                        </Pressable>
                    )}
                </View>
            </View>
        );
    }

    if (!currentStory) return null;

    const isPhotoStatus = isPhotoStory(currentStory);
    const storyStyles = parseStoryStyles(currentStory);

    const statusBgColor = storyStyles.backgroundColor || theme.high_color || '#1D2A44';
    const statusFgColor = storyStyles.foregroundColor || '#FFFFFF';
    const statusFontWeight = storyStyles.fontWeight || 'bold';
    const statusFontStyle = storyStyles.fontStyle || 'normal';
    const statusTextAlign = storyStyles.textAlign || 'center';

    let currentViewers: any[] = [];
    try {
        currentViewers = JSON.parse(currentStory?.viewers || '[]');
    } catch (e) {
        currentViewers = [];
    }

    const renderMediaContent = () => {
        if (isPhotoStatus) {
            return (
                <View style={styles.mediaContainer}>
                    <ExpoImage
                        style={styles.fullMedia}
                        contentFit="contain"
                        source={media_url + '/photo_status/' + currentStory.main_text}
                    />
                    {currentStory.caption ? (
                        <View style={[styles.captionOverlay, { bottom: insets.bottom + 64 }]}>
                            <Text style={styles.captionText}>{currentStory.caption}</Text>
                        </View>
                    ) : null}
                </View>
            );
        }

        return (
            <View style={[styles.textStatusContainer, { backgroundColor: statusBgColor }]}>
                <Text
                    style={[
                        styles.textStatusTitle,
                        {
                            color: statusFgColor,
                            fontWeight: statusFontWeight,
                            fontStyle: statusFontStyle,
                            textAlign: statusTextAlign,
                        },
                    ]}
                >
                    {currentStory.caption || currentStory.main_text}
                </Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Scaled Background & Content (Instagram-style when BottomSheet opens) */}
            <Animated.View
                style={[
                    StyleSheet.absoluteFillObject,
                    { backgroundColor: '#000000' },
                    backgroundAnimatedStyle,
                ]}
            >
                {/* Media Content */}
                {renderMediaContent()}

                {/* 2D Fixed UI Layer (Cross-Fade Opacity, NO 3D Rotation) */}
                <Animated.View
                    style={[StyleSheet.absoluteFillObject, ui2DAnimatedStyle]}
                    pointerEvents="box-none"
                >
                {/* Bottom Viewers Button (Own Status) */}
                {userPhone === user_data.phone_number && (
                    <View
                        style={[styles.bottomViewersContainer, { paddingBottom: insets.bottom + 16 }]}
                        pointerEvents={isActive && !isInteracting ? 'box-none' : 'none'}
                    >
                        <Pressable
                            onPress={() => {
                                if (!isActive || isInteracting) return;
                                setIsPaused(true);
                                setShowViewersSheet(true);
                            }}
                            style={styles.eyeBtn}
                        >
                            <IconApp pack="FI" name="eye" size={18} color="#FFFFFF" />
                            <Text style={styles.eyeCountText}>{currentViewers.length}</Text>
                        </Pressable>
                    </View>
                )}

                {/* Multiline Reply Input for Other User's Status */}
                {userPhone !== user_data.phone_number && (
                    <Animated.View
                        style={[
                            styles.replyContainer,
                            { paddingBottom: insets.bottom + 12 },
                            replyAnimatedStyle,
                        ]}
                        pointerEvents={isActive ? 'box-none' : 'none'}
                    >
                        <View style={styles.replyRow}>
                            <TextInput
                                ref={replyInputRef}
                                style={styles.replyInput}
                                placeholder={strings.type_message}
                                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                                value={replyText}
                                onChangeText={setReplyText}
                                multiline={true}
                                editable={isActive && !isInteracting}
                                onFocus={() => {
                                    isKeyboardVisibleRef.current = true;
                                    setIsKeyboardVisible(true);
                                    setIsPaused(true);
                                }}
                                onBlur={() => {
                                    if (replyText.trim() === '' && !isKeyboardVisibleRef.current) {
                                        setIsPaused(false);
                                    }
                                }}
                            />
                            {replyText.trim().length > 0 && (
                                <Pressable
                                    onPress={handleSendStatusReply}
                                    style={styles.replySendBtn}
                                    hitSlop={10}
                                >
                                    <IconApp pack="FI" name="send" size={18} color="#FFFFFF" />
                                </Pressable>
                            )}
                        </View>
                    </Animated.View>
                )}

                {/* Backdrop to dismiss keyboard on outside tap when keyboard is open */}
                {isKeyboardVisible && (
                    <Pressable
                        style={styles.keyboardDismissOverlay}
                        onPress={() => {
                            Keyboard.dismiss();
                        }}
                    />
                )}

                {/* Top Controls & Overlay */}
                <View
                    style={[
                        styles.topOverlay,
                        { paddingTop: insets.top + 8, opacity: isPaused ? 0.2 : 1 },
                    ]}
                >
                    {/* Segmented Progress Bars */}
                    <View style={styles.progressRow}>
                        {stories.map((s, idx) => {
                            let fillWidth = '0%';
                            if (idx < currentIndex) {
                                fillWidth = '100%';
                            } else if (idx === currentIndex) {
                                fillWidth = `${progress * 100}%`;
                            }

                            return (
                                <View key={s._id || idx} style={styles.progressSegmentBg}>
                                    <View
                                        style={[
                                            styles.progressSegmentFill,
                                            { width: fillWidth as any },
                                        ]}
                                    />
                                </View>
                            );
                        })}
                    </View>

                    {/* User Header Info */}
                    <View style={styles.headerInfoRow}>
                        <View style={styles.userRow}>
                            <View style={styles.avatarBorder}>
                                {targetProfilePic === '' ? (
                                    <Image
                                        source={require('../../assets/profile_black.jpg')}
                                        style={styles.avatarImg}
                                    />
                                ) : (
                                    <ExpoImage
                                        style={styles.avatarImg}
                                        contentFit="cover"
                                        source={media_url + '/profile_pictures/' + targetProfilePic}
                                    />
                                )}
                            </View>
                            <View style={{ marginLeft: 10 }}>
                                <Text style={styles.userNameText}>{ShowUserName()}</Text>
                                <Text style={styles.timeText}>
                                    {renderDateTime(currentStory.createdAt, 1, false)}
                                </Text>
                            </View>
                        </View>

                        <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={10}>
                            <IconApp pack="FI" name="x" size={24} color="#FFFFFF" />
                        </Pressable>
                    </View>
                </View>

                {/* Tap Navigation Touch Zones */}
                <View style={styles.touchOverlay} pointerEvents={isActive && !isInteracting ? 'box-none' : 'none'}>
                    <Pressable
                        style={styles.touchLeft}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onTouchCancel={handleTouchCancel}
                        onPress={handleTapLeft}
                    />
                    <Pressable
                        style={styles.touchRight}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onTouchCancel={handleTouchCancel}
                        onPress={handleTapRight}
                    />
                </View>
            </Animated.View>
            </Animated.View>

            {/* Viewers BottomSheet */}
            <BottomSheet
                visible={showViewersSheet && isActive}
                onClose={() => {
                    setShowViewersSheet(false);
                    setIsPaused(false);
                }}
            >
                <View style={{ width: '100%', paddingBottom: 20, paddingHorizontal: 20 }}>
                    <View style={styles.viewersSheetHeader}>
                        <YambiText
                            text={strings.views || 'Views'}
                            bold
                            style={{ fontSize: 16, color: theme.text }}
                        />
                        <Pressable
                            onPress={() => {
                                dispatch(setShowModalApp(true));
                                setShowDeleteConfirm(true);
                            }}
                            hitSlop={10}
                            style={styles.deleteStoryBtn}
                        >
                            <IconApp pack="FI" name="trash-2" size={20} color={theme.error} />
                        </Pressable>
                    </View>

                    {currentViewers.length === 0 ? (
                        <View
                            style={{
                                alignItems: 'center',
                                justifyContent: 'center',
                                paddingVertical: 30,
                            }}
                        >
                            <IconApp pack="FI" name="eye-off" size={36} color={theme.gray} />
                            <YambiText
                                text={strings.no_views_yet}
                                style={{ marginTop: 10, color: theme.gray, fontSize: 14 }}
                            />
                        </View>
                    ) : (
                        currentViewers.map((viewerItem, idx) => {
                            const viewerPhone =
                                typeof viewerItem === 'string'
                                    ? viewerItem
                                    : viewerItem.phone_number || viewerItem.phone;
                            const viewTime =
                                typeof viewerItem === 'object'
                                    ? viewerItem.time ||
                                    viewerItem.timestamp ||
                                    viewerItem.createdAt
                                    : undefined;

                            const viewerContact = contactsList.find(
                                (c: any) =>
                                    c.phoneNumber === viewerPhone ||
                                    c.phone_number === viewerPhone
                            );
                            const viewerName = viewerContact
                                ? viewerContact.displayName || viewerPhone
                                : viewerPhone;

                            return (
                                <ViewersItem
                                    key={viewerPhone + idx}
                                    viewerPhone={viewerPhone}
                                    viewerName={viewerName}
                                    viewTime={viewTime}
                                    isLast={idx === currentViewers.length - 1}
                                />
                            );
                        })
                    )}
                </View>
            </BottomSheet>

            {/* Delete Story Confirm Modal */}
            {showDeleteConfirm && (
                <ModalApp
                    title={strings.delete_story || 'Delete status'}
                    singleButton={false}
                    textAction={strings.delete || 'Delete'}
                    textCancel={strings.close || 'Cancel'}
                    close_button_color={theme.error}
                    onAction={handleDeleteStory}
                    onClose={() => {
                        setShowDeleteConfirm(false);
                        dispatch(setShowModalApp(false));
                    }}
                >
                    <YambiText
                        text={
                            strings.delete_story_confirm ||
                            'Are you sure you want to delete this status? It will be removed for everyone.'
                        }
                        style={{ fontSize: 14, color: theme.gray, textAlign: 'center' }}
                    />
                </ModalApp>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
        position: 'relative',
    },
    mediaContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullMedia: {
        width: '100%',
        height: '100%',
    },
    captionOverlay: {
        position: 'absolute',
        bottom: 40,
        left: 16,
        right: 16,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 14,
    },
    captionText: {
        color: '#FFFFFF',
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
    },
    textStatusContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    textStatusTitle: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        lineHeight: 34,
    },
    bottomViewersContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 20,
    },
    eyeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.25)',
    },
    eyeCountText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 6,
    },
    topOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 12,
        zIndex: 10,
    },
    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    progressSegmentBg: {
        flex: 1,
        height: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.35)',
        borderRadius: 2,
        marginHorizontal: 2,
        overflow: 'hidden',
    },
    progressSegmentFill: {
        height: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 2,
    },
    headerInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarBorder: {
        width: 38,
        height: 38,
        borderRadius: 19,
        borderWidth: 1.5,
        borderColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    avatarImg: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    userNameText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    timeText: {
        color: 'rgba(255, 255, 255, 0.75)',
        fontSize: 11,
        marginTop: 1,
    },
    closeBtn: {
        padding: 4,
    },
    touchOverlay: {
        ...StyleSheet.absoluteFillObject,
        flexDirection: 'row',
        zIndex: 5,
    },
    touchLeft: {
        width: '35%',
        height: '100%',
    },
    touchRight: {
        width: '65%',
        height: '100%',
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    keyboardDismissOverlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 15,
    },
    replyContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        zIndex: 20,
    },
    replyRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: Platform.OS === 'ios' ? 8 : 4,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    replyInput: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 14,
        paddingVertical: 6,
        maxHeight: 120,
    },
    replySendBtn: {
        marginLeft: 10,
        backgroundColor: '#1D2A44',
        width: 34,
        height: 34,
        borderRadius: 17,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Platform.OS === 'ios' ? 2 : 3,
    },
    viewersSheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        marginBottom: 4,
    },
    deleteStoryBtn: {
        padding: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default SingleUserStories;
