import { View, Text, Pressable, Image, Dimensions, StyleSheet, ScrollView, PanResponder, Animated } from "react-native";
import { useEffect, useState, useRef } from 'react';
import { NavProps, TStory } from "../../types/types";
import { strings } from "../../lang/lang";
import { IconApp } from "../../components/app/IconApp";
import { YambiText } from "../../components/app/Text";
import BottomSheet from "../../components/app/BottomSheet";
import { useAppDispatch, useAppSelector } from "../../store/app/hooks";
import { useObject, useQuery, useRealm } from "@realm/react";
import { Stories, UserContacts } from "../../store/database/Models";
import { Image as ExpoImage } from 'expo-image';
import { media_url, renderDateTime, SocketApp } from "../../../GlobalVariables";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { cleanExpiredLocalStories, isStoryExpired } from "../../utils/storyCleanup";

const STORY_DURATION = 5000; // 5 seconds per story

const UserStories = ({ navigation, route }: NavProps) => {
    const theme = useAppSelector(state => state.app_theme.colors);
    const user_data = useAppSelector(state => state.user_data);
    const contactsList = useAppSelector(state => state.app.raw_contacts);
    const insets = useSafeAreaInsets();

    const realm = useRealm();

    const { phone_number } = route.params;
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const [progress, setProgress] = useState<number>(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const rawStories = useQuery(Stories, sts => {
        return sts.filtered('phone_number == $0', phone_number).sorted('createdAt', false);
    }, [phone_number]);

    const stories = rawStories.filter(st => !isStoryExpired(st));

    useEffect(() => {
        cleanExpiredLocalStories(realm);
    }, [realm]);

    const [isPaused, setIsPaused] = useState<boolean>(false);
    const isPausedRef = useRef<boolean>(false);
    const pressStartTimeRef = useRef<number>(0);
    const holdTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        isPausedRef.current = isPaused;
    }, [isPaused]);

    const handlePressIn = () => {
        pressStartTimeRef.current = Date.now();
        if (holdTimerRef.current) clearTimeout(holdTimerRef.current);

        holdTimerRef.current = setTimeout(() => {
            setIsPaused(true);
        }, 180);
    };

    const handlePressOutLeft = () => {
        if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
        const pressDuration = Date.now() - pressStartTimeRef.current;

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
            navigation.goBack();
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        } else {
            setProgress(0);
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
    const isPhotoStatus = currentStory?.main_text !== "" && currentStory?.main_text !== undefined;

    let storyStyles: {
        backgroundColor?: string;
        foregroundColor?: string;
        fontWeight?: any;
        fontStyle?: any;
        textAlign?: any;
    } = {};

    try {
        if (currentStory?.styles) {
            storyStyles = JSON.parse(currentStory.styles);
        }
    } catch (e) { }

    const statusBgColor = storyStyles.backgroundColor || theme.high_color || '#1D2A44';
    const statusFgColor = storyStyles.foregroundColor || '#FFFFFF';
    const statusFontWeight = storyStyles.fontWeight || 'bold';
    const statusFontStyle = storyStyles.fontStyle || 'normal';
    const statusTextAlign = storyStyles.textAlign || 'center';

    useEffect(() => {
        if (!currentStory || !user_data.phone_number || !currentStory._id) return;
        if (user_data.phone_number === currentStory.phone_number) return;

        let viewersList: string[] = [];
        try {
            viewersList = JSON.parse(currentStory.viewers || '[]');
        } catch (e) {
            viewersList = [];
        }

        if (!viewersList.includes(user_data.phone_number)) {
            viewersList.push(user_data.phone_number);
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
                viewer_phone: user_data.phone_number
            });
        }
    }, [currentIndex, currentStory?._id, currentStory?.phone_number, user_data.phone_number, realm]);

    const [showViewersSheet, setShowViewersSheet] = useState<boolean>(false);

    const translateY = useRef(new Animated.Value(0)).current;

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return gestureState.dy > 15 && gestureState.dy > Math.abs(gestureState.dx);
            },
            onPanResponderGrant: () => {
                setIsPaused(true);
            },
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy > 0) {
                    translateY.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 120 || gestureState.vy > 0.5) {
                    Animated.timing(translateY, {
                        toValue: Dimensions.get('window').height,
                        duration: 150,
                        useNativeDriver: true,
                    }).start(() => {
                        navigation.goBack();
                    });
                } else {
                    Animated.spring(translateY, {
                        toValue: 0,
                        useNativeDriver: true,
                        bounciness: 5,
                    }).start(() => {
                        setIsPaused(false);
                    });
                }
            },
            onPanResponderTerminate: () => {
                Animated.spring(translateY, {
                    toValue: 0,
                    useNativeDriver: true,
                }).start(() => {
                    setIsPaused(false);
                });
            }
        })
    ).current;

    let currentViewers: string[] = [];
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
                title={strings.views ? `${strings.views} (${currentViewers.length})` : `Status Viewers (${currentViewers.length})`}
            >
                <ScrollView style={{ width: '100%', maxHeight: 380, paddingVertical: 8 }}>
                    {currentViewers.length === 0 ? (
                        <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 30 }}>
                            <IconApp pack="FI" name="eye-off" size={36} color={theme.gray} />
                            <YambiText text="No views yet" style={{ marginTop: 10, color: theme.gray, fontSize: 14 }} />
                        </View>
                    ) : (
                        currentViewers.map((viewerPhone, idx) => {
                            const viewerContact = contactsList.find((c: any) => c.phoneNumber === viewerPhone || c.phone_number === viewerPhone);
                            const viewerName = viewerContact ? (viewerContact.displayName || viewerPhone) : viewerPhone;

                            return (
                                <View
                                    key={viewerPhone + idx}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        paddingVertical: 10,
                                        borderBottomWidth: idx === currentViewers.length - 1 ? 0 : 1,
                                        borderBottomColor: theme.border + '30'
                                    }}>
                                    <Image
                                        source={require('./../../assets/profile_black.jpg')}
                                        style={{ width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: theme.border }}
                                    />
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <YambiText text={viewerName} bold style={{ fontSize: 14, color: theme.text }} />
                                        <YambiText text={viewerPhone} style={{ fontSize: 12, color: theme.gray, marginTop: 1 }} />
                                    </View>
                                    <IconApp pack="MC" name="check-all" size={18} color={theme.primary_high_color || theme.high_color} />
                                </View>
                            );
                        })
                    )}
                </ScrollView>
            </BottomSheet>
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
    }
});

export default UserStories;