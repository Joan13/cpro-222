import { View, Text, Pressable, Image, Dimensions, StyleSheet, ScrollView, PanResponder, Animated, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { useEffect, useState, useRef, useMemo } from 'react';
import { NavProps, TChat, TMessage, TStory } from "../../types/types";
import { strings } from "../../lang/lang";
import { IconApp } from "../../components/app/IconApp";
import { YambiText } from "../../components/app/Text";
import BottomSheet from "../../components/app/BottomSheet";
import ViewersItem from "../../components/lists/stories/ViewersItem";
import { useAppDispatch, useAppSelector } from "../../store/app/hooks";
import { useObject, useQuery, useRealm } from "@realm/react";
import { Stories, UserChats, UserContacts } from "../../store/database/Models";
import { Image as ExpoImage } from 'expo-image';
import { media_url, randomString, renderDateTime, SocketApp } from "../../../GlobalVariables";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { cleanExpiredLocalStories, isStoryExpired } from "../../utils/storyCleanup";
import { isPhotoStory, parseStoryStyles } from "../../utils/storyUtils";
import moment from "moment";
import ModalApp from "../../components/app/ModalApp";
import { setShowModalApp } from "../../store/reducers/appSlice";

const STORY_DURATION = 5000; // 5 seconds per story

const UserStories = ({ navigation, route }: NavProps) => {
    const theme = useAppSelector(state => state.app_theme.colors);
    const user_data = useAppSelector(state => state.user_data);
    const contactsList = useAppSelector(state => state.app.raw_contacts);
    const insets = useSafeAreaInsets();

    const realm = useRealm();

    const { phone_number, story_id } = route.params;

    const rawStories = useQuery(Stories, sts => {
        return sts.filtered('phone_number == $0', phone_number).sorted('createdAt', false);
    }, [phone_number]);

    const allStories = useQuery(Stories);

    const stories = rawStories.filter(st => !isStoryExpired(st));

    const initialStorySetRef = useRef<boolean>(false);
    const [currentIndex, setCurrentIndex] = useState<number>(() => {
        if (story_id && rawStories) {
            const valid = rawStories.filter(st => !isStoryExpired(st));
            const idx = valid.findIndex(st => st._id === story_id);
            if (idx !== -1) {
                return idx;
            }
        }
        return 0;
    });

    useEffect(() => {
        if (!initialStorySetRef.current && story_id && stories.length > 0) {
            const idx = stories.findIndex(st => st._id === story_id);
            if (idx !== -1) {
                setCurrentIndex(idx);
            }
            initialStorySetRef.current = true;
        }
    }, [story_id, stories]);

    const [progress, setProgress] = useState<number>(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Compute ordered list of all users with active stories (unseen first, then newest to oldest)
    const allUsersWithStories = useMemo(() => {
        const assembledStories: any[] = [];

        // 1. Logged-in user's active status (if present)
        const myActiveStories = allStories.filter(st => st.phone_number === user_data.phone_number && !isStoryExpired(st));
        if (myActiveStories.length > 0) {
            const hasUnseen = myActiveStories.some(st => {
                let viewersList: any[] = [];
                try { viewersList = JSON.parse(st.viewers || '[]'); } catch (e) { }
                return !viewersList.some((v: any) =>
                    typeof v === 'string' ? v === user_data.phone_number : (v.phone_number === user_data.phone_number || v.phone === user_data.phone_number)
                );
            });
            assembledStories.push({
                phone_number: user_data.phone_number,
                lastDate: myActiveStories[myActiveStories.length - 1].createdAt,
                hasUnseen: hasUnseen
            });
        }

        // 2. Other users with active stories
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

        const otherUsers: any[] = [];
        for (const pPhone in storiesByPhone) {
            const uStories = storiesByPhone[pPhone];
            if (uStories.length > 0) {
                const hasUnseen = uStories.some(st => {
                    let viewersList: any[] = [];
                    try { viewersList = JSON.parse(st.viewers || '[]'); } catch (e) { }
                    return !viewersList.some((v: any) =>
                        typeof v === 'string' ? v === user_data.phone_number : (v.phone_number === user_data.phone_number || v.phone === user_data.phone_number)
                    );
                });
                otherUsers.push({
                    phone_number: pPhone,
                    lastDate: uStories[uStories.length - 1].createdAt,
                    hasUnseen: hasUnseen
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

        return assembledStories.concat(otherUsers);
    }, [allStories, user_data.phone_number]);

    const hasInitializedIndexRef = useRef<boolean>(false);

    useEffect(() => {
        cleanExpiredLocalStories(realm);
    }, [realm]);

    // Calculate initial story index based on view history:
    // 1. Show the one after the latest already seen.
    // 2. If no story seen, start from first (0).
    // 3. If all stories seen, start from first (0).
    useEffect(() => {
        if (stories && stories.length > 0 && !hasInitializedIndexRef.current) {
            hasInitializedIndexRef.current = true;
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
                        : (v.phone_number === user_data.phone_number || v.phone === user_data.phone_number)
                );
                if (hasViewed) {
                    lastSeenIndex = i;
                }
            }

            if (lastSeenIndex === -1) {
                setCurrentIndex(0);
            } else if (lastSeenIndex >= stories.length - 1) {
                setCurrentIndex(0);
            } else {
                setCurrentIndex(lastSeenIndex + 1);
            }
        }
    }, [stories?.length, user_data.phone_number]);

    const [isPaused, setIsPaused] = useState<boolean>(false);
    const isPausedRef = useRef<boolean>(false);
    const pressStartTimeRef = useRef<number>(0);
    const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isSwipingRef = useRef<boolean>(false);

    useEffect(() => {
        isPausedRef.current = isPaused;
    }, [isPaused]);

    const handlePressIn = () => {
        isSwipingRef.current = false;
        pressStartTimeRef.current = Date.now();
        if (holdTimerRef.current) clearTimeout(holdTimerRef.current);

        holdTimerRef.current = setTimeout(() => {
            setIsPaused(true);
        }, 180);
    };

    const handlePressOutLeft = () => {
        if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
        const pressDuration = Date.now() - pressStartTimeRef.current;

        if (isSwipingRef.current || showViewersSheet) {
            isSwipingRef.current = false;
            return;
        }

        if (isPausedRef.current) {
            setIsPaused(false);
        }

        if (pressDuration < 200) {
            handlePrev();
        }
    };

    const handlePressOutRight = () => {
        if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
        const pressDuration = Date.now() - pressStartTimeRef.current;

        if (isSwipingRef.current || showViewersSheet) {
            isSwipingRef.current = false;
            return;
        }

        if (isPausedRef.current) {
            setIsPaused(false);
        }

        if (pressDuration < 200) {
            handleNext();
        }
    };

    const targetContact = useObject(UserContacts, phone_number);

    const ShowUserName = () => {
        if (phone_number === user_data.phone_number) {
            return strings.my_status || "My Status";
        }
        const contact = contactsList.find((cc) => cc.phoneNumber === phone_number);
        if (contact?.displayName) {
            return contact.displayName;
        }
        return targetContact?.user_names || phone_number;
    };

    const targetProfilePic = phone_number === user_data.phone_number
        ? user_data.user_profile
        : targetContact?.user_profile || "";

    useEffect(() => {
        navigation.setOptions({ headerShown: false });
    }, [navigation]);

    // Manage story progress timer with pause capability on touch hold
    useEffect(() => {
        if (!stories || stories.length === 0) return;

        setProgress(0);
        let elapsedTime = 0;
        const intervalTime = 50;

        intervalRef.current = setInterval(() => {
            if (isPausedRef.current) {
                return;
            }
            elapsedTime += intervalTime;
            const currentProgress = Math.min(1, elapsedTime / STORY_DURATION);
            setProgress(currentProgress);

            if (elapsedTime >= STORY_DURATION) {
                if (intervalRef.current) clearInterval(intervalRef.current);
                handleNext();
            }
        }, intervalTime);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [currentIndex, stories?.length]);

    const handleNext = () => {
        if (currentIndex < stories.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            const userIdx = allUsersWithStories.findIndex(u => u.phone_number === phone_number);
            if (userIdx !== -1 && userIdx < allUsersWithStories.length - 1) {
                const nextUserPhone = allUsersWithStories[userIdx + 1].phone_number;
                navigation.replace("UserStories", { phone_number: nextUserPhone });
            } else {
                navigation.goBack();
            }
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        } else {
            const userIdx = allUsersWithStories.findIndex(u => u.phone_number === phone_number);
            if (userIdx > 0) {
                const prevUserPhone = allUsersWithStories[userIdx - 1].phone_number;
                navigation.replace("UserStories", { phone_number: prevUserPhone });
            } else {
                setProgress(0);
            }
        }
    };

    useEffect(() => {
        if ((!stories || stories.length === 0) && phone_number === user_data.phone_number) {
            navigation.replace("NewStory", { flag: 1 });
        }
    }, [stories, phone_number, user_data.phone_number, navigation]);

    if (!stories || stories.length === 0) {
        return (
            <View style={[styles.container, { backgroundColor: '#000000', paddingTop: insets.top }]}>
                <View style={styles.headerRow}>
                    <Pressable onPress={() => navigation.goBack()} style={styles.closeBtn}>
                        <IconApp pack="FI" name="x" size={24} color="#FFFFFF" />
                    </Pressable>
                </View>
                <View style={styles.centerContent}>
                    <Text style={{ color: '#FFFFFF', fontSize: 16, marginBottom: 16 }}>{strings.no_active_stories}</Text>
                    {phone_number === user_data.phone_number && (
                        <Pressable
                            onPress={() => navigation.replace("NewStory", { flag: 1 })}
                            style={{
                                backgroundColor: theme.high_color || '#1D2A44',
                                paddingHorizontal: 20,
                                paddingVertical: 10,
                                borderRadius: 20
                            }}>
                            <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>{strings.add_story}</Text>
                        </Pressable>
                    )}
                </View>
            </View>
        );
    }

    const currentStory: TStory = stories[currentIndex];
    const isPhotoStatus = isPhotoStory(currentStory);
    const storyStyles = parseStoryStyles(currentStory);

    const statusBgColor = storyStyles.backgroundColor || theme.high_color || '#1D2A44';
    const statusFgColor = storyStyles.foregroundColor || '#FFFFFF';
    const statusFontWeight = storyStyles.fontWeight || 'bold';
    const statusFontStyle = storyStyles.fontStyle || 'normal';
    const statusTextAlign = storyStyles.textAlign || 'center';

    useEffect(() => {
        if (!currentStory || !user_data.phone_number || !currentStory._id) return;
        if (user_data.phone_number === currentStory.phone_number) return;

        let viewersList: any[] = [];
        try {
            viewersList = JSON.parse(currentStory.viewers || '[]');
        } catch (e) {
            viewersList = [];
        }

        const hasViewed = viewersList.some((v: any) =>
            typeof v === 'string' ? v === user_data.phone_number : (v.phone_number === user_data.phone_number || v.phone === user_data.phone_number)
        );

        if (!hasViewed) {
            const nowTime = new Date().toISOString();
            const newViewer = {
                phone_number: user_data.phone_number,
                time: nowTime
            };
            viewersList.push(newViewer);
            const updatedViewers = JSON.stringify(viewersList);

            realm.write(() => {
                try {
                    const realmStory = realm.objectForPrimaryKey<Stories>('Stories', currentStory._id);
                    if (realmStory) {
                        realmStory.viewers = updatedViewers;
                    }
                } catch (e) { }
            });

            SocketApp.emit('OnViewStatus', {
                story_id: currentStory._id,
                viewer_phone: user_data.phone_number,
                time: nowTime
            });
        }
    }, [currentIndex, currentStory?._id, currentStory?.phone_number, user_data.phone_number, realm]);

    const [showViewersSheet, setShowViewersSheet] = useState<boolean>(false);
    const [replyText, setReplyText] = useState<string>('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
    const dispatch = useAppDispatch();

    const handleSendStatusReply = () => {
        if (!replyText.trim() || !currentStory) return;

        const textToSend = replyText.trim();
        const tokenn = randomString(32);
        const time = new Date().toISOString();

        const isPhoto = isPhotoStory(currentStory);
        const statusCaption = isPhoto
            ? (currentStory.caption || 'Photo')
            : (currentStory.caption || currentStory.main_text || '');

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
            alignment: moment().utc().toISOString()
        };

        let chatt = realm.objectForPrimaryKey<UserChats>('UserChats', currentStory.phone_number);

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

        setReplyText('');
        setIsPaused(false);
    };

    const handleDeleteStory = () => {
        if (!currentStory) return;
        const storyId = currentStory._id;
        const onlyWith = currentStory.only_with || '[]';

        // Emit socket event for backend to delete story and notify contacts
        SocketApp.emit('DeleteStory', {
            story_id: storyId,
            phone_number: user_data.phone_number,
            only_with: onlyWith
        });

        // Delete from local Realm immediately
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
            navigation.goBack();
        } else if (currentIndex >= stories.length - 1) {
            setCurrentIndex(stories.length - 2);
        }
    };

    const translateY = useRef(new Animated.Value(0)).current;

    const isMyStory = phone_number === user_data.phone_number;

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                const isHorizontalSwipe = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
                const isVerticalSwipe = Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && Math.abs(gestureState.dy) > 10;
                const isSwipeDown = gestureState.dy > 10;
                const isSwipeUp = isMyStory && gestureState.dy < -10;
                return isHorizontalSwipe || (isVerticalSwipe && (isSwipeDown || isSwipeUp));
            },
            onPanResponderGrant: () => {
                isSwipingRef.current = true;
                setIsPaused(true);
            },
            onPanResponderMove: (_, gestureState) => {
                isSwipingRef.current = true;
                if (Math.abs(gestureState.dy) > Math.abs(gestureState.dx)) {
                    if (gestureState.dy > 0) {
                        translateY.setValue(gestureState.dy);
                    } else if (isMyStory && gestureState.dy < -10) {
                        setShowViewersSheet(true);
                        setIsPaused(true);
                    }
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                const isHorizontalSwipe = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 35;
                const isVerticalSwipe = Math.abs(gestureState.dy) > Math.abs(gestureState.dx);

                if (isHorizontalSwipe || Math.abs(gestureState.vx) > 0.3) {
                    if (gestureState.dx < -30 || gestureState.vx < -0.3) {
                        // Slide Left -> Go to Next User's Status
                        const userIdx = allUsersWithStories.findIndex(u => u.phone_number === phone_number);
                        if (userIdx !== -1 && userIdx < allUsersWithStories.length - 1) {
                            const nextUserPhone = allUsersWithStories[userIdx + 1].phone_number;
                            navigation.replace("UserStories", { phone_number: nextUserPhone });
                        } else {
                            navigation.goBack();
                        }
                    } else if (gestureState.dx > 30 || gestureState.vx > 0.3) {
                        // Slide Right -> Go to Previous User's Status
                        const userIdx = allUsersWithStories.findIndex(u => u.phone_number === phone_number);
                        if (userIdx > 0) {
                            const prevUserPhone = allUsersWithStories[userIdx - 1].phone_number;
                            navigation.replace("UserStories", { phone_number: prevUserPhone });
                        } else {
                            navigation.goBack();
                        }
                    }
                } else if (isVerticalSwipe && (gestureState.dy > 120 || gestureState.vy > 0.5)) {
                    Animated.timing(translateY, {
                        toValue: Dimensions.get('window').height,
                        duration: 150,
                        useNativeDriver: true,
                    }).start(() => {
                        navigation.goBack();
                    });
                } else if (isMyStory && isVerticalSwipe && (gestureState.dy < -20 || gestureState.vy < -0.2)) {
                    setShowViewersSheet(true);
                    setIsPaused(true);
                    Animated.spring(translateY, {
                        toValue: 0,
                        useNativeDriver: true,
                        bounciness: 5,
                    }).start();
                } else {
                    Animated.spring(translateY, {
                        toValue: 0,
                        useNativeDriver: true,
                        bounciness: 5,
                    }).start(() => {
                        if (!showViewersSheet) {
                            setIsPaused(false);
                        }
                    });
                }
            },
            onPanResponderTerminate: () => {
                Animated.spring(translateY, {
                    toValue: 0,
                    useNativeDriver: true,
                }).start(() => {
                    if (!showViewersSheet) {
                        setIsPaused(false);
                    }
                });
            }
        })
    ).current;

    let currentViewers: any[] = [];
    try {
        currentViewers = JSON.parse(currentStory?.viewers || '[]');
    } catch (e) {
        currentViewers = [];
    }

    return (
        <Animated.View
            {...panResponder.panHandlers}
            style={[
                styles.container,
                {
                    backgroundColor: '#000000',
                    transform: [{ translateY }]
                }
            ]}>
            {/* Main Content */}
            {isPhotoStatus ? (
                <View style={styles.mediaContainer}>
                    <ExpoImage
                        style={styles.fullMedia}
                        contentFit="contain"
                        source={media_url + "/photo_status/" + currentStory.main_text}
                    />
                    {currentStory.caption ? (
                        <View style={[styles.captionOverlay, { bottom: insets.bottom + 64 }]}>
                            <Text style={styles.captionText}>{currentStory.caption}</Text>
                        </View>
                    ) : null}
                </View>
            ) : (
                <View style={[styles.textStatusContainer, { backgroundColor: statusBgColor }]}>
                    <Text style={[
                        styles.textStatusTitle,
                        {
                            color: statusFgColor,
                            fontWeight: statusFontWeight,
                            fontStyle: statusFontStyle,
                            textAlign: statusTextAlign
                        }
                    ]}>
                        {currentStory.caption || currentStory.main_text}
                    </Text>
                </View>
            )}

            {/* Bottom Viewers Button */}
            {phone_number === user_data.phone_number && (
                <View style={[styles.bottomViewersContainer, { paddingBottom: insets.bottom + 16 }]} pointerEvents="box-none">
                    <Pressable
                        onPress={() => {
                            setIsPaused(true);
                            setShowViewersSheet(true);
                        }}
                        style={styles.eyeBtn}>
                        <IconApp pack="FI" name="eye" size={18} color="#FFFFFF" />
                        <Text style={styles.eyeCountText}>{currentViewers.length}</Text>
                    </Pressable>
                </View>
            )}

            {/* Status Reply Input for Other User's Status */}
            {phone_number !== user_data.phone_number && (
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={[styles.replyContainer, { paddingBottom: insets.bottom + 12 }]}
                    pointerEvents="box-none"
                >
                    <View style={styles.replyRow}>
                        <TextInput
                            style={styles.replyInput}
                            placeholder={strings.type_message}
                            placeholderTextColor="rgba(255, 255, 255, 0.6)"
                            value={replyText}
                            onChangeText={setReplyText}
                            onFocus={() => setIsPaused(true)}
                            onBlur={() => {
                                if (replyText.trim() === '') {
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
                </KeyboardAvoidingView>
            )}

            {/* Top Controls & Overlay */}
            <View style={[styles.topOverlay, { paddingTop: insets.top + 8, opacity: isPaused ? 0.2 : 1 }]}>
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
                                <View style={[styles.progressSegmentFill, { width: fillWidth as any }]} />
                            </View>
                        );
                    })}
                </View>

                {/* User Header Info */}
                <View style={styles.headerInfoRow}>
                    <View style={styles.userRow}>
                        <View style={styles.avatarBorder}>
                            {targetProfilePic === "" ? (
                                <Image
                                    source={require('./../../assets/profile_black.jpg')}
                                    style={styles.avatarImg}
                                />
                            ) : (
                                <ExpoImage
                                    style={styles.avatarImg}
                                    contentFit="cover"
                                    source={media_url + "/profile_pictures/" + targetProfilePic}
                                />
                            )}
                        </View>
                        <View style={{ marginLeft: 10 }}>
                            <Text style={styles.userNameText}>{ShowUserName()}</Text>
                            <Text style={styles.timeText}>{renderDateTime(currentStory.createdAt, 1, false)}</Text>
                        </View>
                    </View>

                    <Pressable onPress={() => navigation.goBack()} style={styles.closeBtn} hitSlop={10}>
                        <IconApp pack="FI" name="x" size={24} color="#FFFFFF" />
                    </Pressable>
                </View>
            </View>

            {/* Tap Navigation Touch Zones with Hold-to-Pause support */}
            <View style={styles.touchOverlay} pointerEvents="box-none">
                <Pressable
                    style={styles.touchLeft}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOutLeft}
                />
                <Pressable
                    style={styles.touchRight}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOutRight}
                />
            </View>

            {/* Viewers BottomSheet */}
            <BottomSheet
                visible={showViewersSheet}
                onClose={() => {
                    setShowViewersSheet(false);
                    setIsPaused(false);
                }}
            >
                <View style={{ width: '100%', paddingBottom: 20, paddingHorizontal: 20 }}>
                    {/* Bottom sheet header with delete button */}
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
                        <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 30 }}>
                            <IconApp pack="FI" name="eye-off" size={36} color={theme.gray} />
                            <YambiText text={strings.no_views_yet} style={{ marginTop: 10, color: theme.gray, fontSize: 14 }} />
                        </View>
                    ) : (
                        currentViewers.map((viewerItem, idx) => {
                            const viewerPhone = typeof viewerItem === 'string' ? viewerItem : (viewerItem.phone_number || viewerItem.phone);
                            const viewTime = typeof viewerItem === 'object' ? (viewerItem.time || viewerItem.timestamp || viewerItem.createdAt) : undefined;

                            const viewerContact = contactsList.find((c: any) => c.phoneNumber === viewerPhone || c.phone_number === viewerPhone);
                            const viewerName = viewerContact ? (viewerContact.displayName || viewerPhone) : viewerPhone;

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
                        text={strings.delete_story_confirm || 'Are you sure you want to delete this status? It will be removed for everyone.'}
                        style={{ fontSize: 14, color: theme.gray, textAlign: 'center' }}
                    />
                </ModalApp>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: 'relative'
    },
    mediaContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    fullMedia: {
        width: '100%',
        height: '100%'
    },
    captionOverlay: {
        position: 'absolute',
        bottom: 40,
        left: 16,
        right: 16,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 14
    },
    captionText: {
        color: '#FFFFFF',
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22
    },
    textStatusContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30
    },
    textStatusTitle: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        lineHeight: 34
    },
    bottomViewersContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 20
    },
    eyeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.25)'
    },
    eyeCountText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 6
    },
    topOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 12,
        zIndex: 10
    },
    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10
    },
    progressSegmentBg: {
        flex: 1,
        height: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.35)',
        borderRadius: 2,
        marginHorizontal: 2,
        overflow: 'hidden'
    },
    progressSegmentFill: {
        height: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 2
    },
    headerInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 4
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    avatarBorder: {
        width: 38,
        height: 38,
        borderRadius: 19,
        borderWidth: 1.5,
        borderColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden'
    },
    avatarImg: {
        width: 36,
        height: 36,
        borderRadius: 18
    },
    userNameText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold'
    },
    timeText: {
        color: 'rgba(255, 255, 255, 0.75)',
        fontSize: 11,
        marginTop: 1
    },
    closeBtn: {
        padding: 4
    },
    touchOverlay: {
        ...StyleSheet.absoluteFillObject,
        flexDirection: 'row',
        zIndex: 5
    },
    touchLeft: {
        width: '35%',
        height: '100%'
    },
    touchRight: {
        width: '65%',
        height: '100%'
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: 16,
        paddingVertical: 10
    },
    replyContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        zIndex: 20
    },
    replyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: Platform.OS === 'ios' ? 10 : 4,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)'
    },
    replyInput: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 14,
        paddingVertical: 6
    },
    replySendBtn: {
        marginLeft: 10,
        backgroundColor: '#1D2A44',
        width: 34,
        height: 34,
        borderRadius: 17,
        justifyContent: 'center',
        alignItems: 'center'
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

export default UserStories;