import { Text, View, Image, Pressable, StyleSheet } from "react-native";
import { useAppSelector } from "../../../store/app/hooks";
import { memo, useState } from "react";
import { YambiText } from "../../app/Text";
import { strings } from "../../../lang/lang";
import { IconApp } from "../../app/IconApp";
import { renderDateTime, media_url } from "../../../../GlobalVariables";
import { Image as ExpoImage } from 'expo-image';
import BottomSheet from "../../app/BottomSheet";
import ViewersItem from "./ViewersItem";
import { isPhotoStory, parseStoryStyles } from "../../../utils/storyUtils";

export interface StoriesListProps {
    item: any;
    index: number;
    GoStory: () => void;
    horizontal?: boolean;
    variant?: 'card' | 'horizontal';
}

const StoriesList = ({
    item,
    index,
    GoStory,
    horizontal = false,
    variant = 'card',
}: StoriesListProps) => {

    const app_theme = useAppSelector(state => state.app_theme);
    const contacts = useAppSelector(state => state.app.raw_contacts);
    const user_data = useAppSelector(state => state.user_data);
    const [showViewersSheet, setShowViewersSheet] = useState(false);

    const ShowUserName = (user_names: string, phone_number: string) => {
        const contact = contacts.find((cc: any) => cc.phoneNumber === phone_number || cc.phone_number === phone_number);
        if (contact !== undefined && contact.displayName) {
            return contact.displayName;
        } else {
            return user_names || phone_number;
        }
    };

    // Check if any status in item.stories is unseen by current user
    const hasUnseenStory = Array.isArray(item.stories) && item.stories.some((st: any) => {
        let viewersList: any[] = [];
        try {
            viewersList = JSON.parse(st.viewers || '[]');
        } catch (e) {
            viewersList = [];
        }
        return !viewersList.some((v: any) =>
            typeof v === 'string' ? v === user_data.phone_number : (v.phone_number === user_data.phone_number || v.phone === user_data.phone_number)
        );
    });

    // Last story of the user (photo or text)
    const lastStory = Array.isArray(item.stories) && item.stories.length > 0
        ? item.stories[item.stories.length - 1]
        : null;

    const isPhotoStatus = isPhotoStory(lastStory);
    const storyStyles = parseStoryStyles(lastStory);

    const statusBgColor = storyStyles.backgroundColor || app_theme.colors.high_color || '#1D2A44';
    const statusFgColor = storyStyles.foregroundColor || '#FFFFFF';
    const statusFontWeight = storyStyles.fontWeight || 'bold';
    const statusFontStyle = storyStyles.fontStyle || 'normal';
    const statusTextAlign = storyStyles.textAlign || 'center';

    // Collect all unique viewers for item.stories
    const viewersList: any[] = [];
    const viewersMap: { [key: string]: boolean } = {};

    if (Array.isArray(item.stories)) {
        item.stories.forEach((st: any) => {
            try {
                const parsed = JSON.parse(st.viewers || '[]');
                if (Array.isArray(parsed)) {
                    parsed.forEach((v: any) => {
                        const phone = typeof v === 'string' ? v : (v.phone_number || v.phone);
                        if (phone && !viewersMap[phone]) {
                            viewersMap[phone] = true;
                            viewersList.push(v);
                        }
                    });
                }
            } catch (e) { }
        });
    }

    if (horizontal || variant === 'horizontal') {
        const isMyUser = item.user?.phone_number === user_data.phone_number || item.user?.phoneNumber === user_data.phone_number;
        const isRingActive = hasUnseenStory || isMyUser;

        return (
            <Pressable
                onPress={GoStory}
                style={styles.horizontalContainer}
            >
                <View
                    style={[
                        styles.horizontalAvatarRing,
                        {
                            borderColor: isRingActive
                                ? app_theme.colors.high_color
                                : (app_theme.colors.border || 'rgba(150, 150, 150, 0.3)'),
                            borderWidth: isRingActive ? 2.5 : 1.5,
                        }
                    ]}
                >
                    {lastStory ? (
                        isPhotoStatus ? (
                            <ExpoImage
                                style={styles.horizontalAvatarImg}
                                contentFit="cover"
                                source={{ uri: media_url + "/photo_status/" + lastStory.main_text }}
                            />
                        ) : (
                            <View
                                style={[
                                    styles.horizontalAvatarImg,
                                    {
                                        backgroundColor: statusBgColor,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        padding: 3,
                                        overflow: 'hidden',
                                    }
                                ]}
                            >
                                <Text
                                    numberOfLines={2}
                                    style={{
                                        color: statusFgColor,
                                        fontWeight: statusFontWeight,
                                        fontStyle: statusFontStyle,
                                        fontSize: 11,
                                        textAlign: 'center',
                                    }}
                                >
                                    {lastStory?.caption || lastStory?.main_text || ''}
                                </Text>
                            </View>
                        )
                    ) : item.user?.user_profile === "" || !item.user?.user_profile ? (
                        <Image
                            source={require('./../../../assets/profile_black.jpg')}
                            style={styles.horizontalAvatarImg}
                        />
                    ) : (
                        <ExpoImage
                            style={styles.horizontalAvatarImg}
                            contentFit="cover"
                            source={{ uri: media_url + "/profile_pictures/" + item.user.user_profile }}
                        />
                    )}
                </View>

                <YambiText
                    text={ShowUserName(item.user?.user_names || '', item.user?.phone_number || '')}
                    size="xsmall"
                    style={{
                        marginTop: 4,
                        textAlign: 'center',
                        fontSize: 11,
                        color: app_theme.colors.text,
                    }}
                    numberLines={1}
                />
            </Pressable>
        );
    }

    return (
        <Pressable
            onPress={GoStory}
            style={styles.cardContainer}
        >
            {/* Card Background Content (Photo or Text Status) */}
            {isPhotoStatus ? (
                <View style={StyleSheet.absoluteFillObject}>
                    <ExpoImage
                        source={{ uri: media_url + "/photo_status/" + lastStory.main_text }}
                        style={StyleSheet.absoluteFillObject}
                        contentFit="cover"
                    />
                    {/* Dark gradient overlay for text legibility */}
                    <View style={styles.darkOverlay} />
                    {lastStory.caption ? (
                        <View style={styles.captionContainer}>
                            <Text numberOfLines={2} style={styles.captionText}>
                                {lastStory.caption}
                            </Text>
                        </View>
                    ) : null}
                </View>
            ) : (
                <View style={[styles.textContainer, { backgroundColor: statusBgColor }]}>
                    <Text
                        numberOfLines={4}
                        style={[
                            styles.textStatusTitle,
                            {
                                color: statusFgColor,
                                fontWeight: statusFontWeight,
                                fontStyle: statusFontStyle,
                                textAlign: statusTextAlign,
                            }
                        ]}
                    >
                        {lastStory?.caption || lastStory?.main_text || ''}
                    </Text>
                    <View style={styles.darkOverlay} />
                </View>
            )}

            {/* Top Right Publisher Profile Avatar */}
            <View
                style={[
                    styles.avatarRing,
                    {
                        borderColor: hasUnseenStory
                            ? app_theme.colors.high_color
                            : 'rgba(255, 255, 255, 0.7)',
                        borderWidth: hasUnseenStory ? 2.5 : 1.5,
                    }
                ]}
            >
                {item.user.user_profile === "" || !item.user.user_profile ? (
                    <Image
                        source={require('./../../../assets/profile_black.jpg')}
                        style={styles.avatarImg}
                    />
                ) : (
                    <ExpoImage
                        style={styles.avatarImg}
                        contentFit="cover"
                        source={media_url + "/profile_pictures/" + item.user.user_profile}
                    />
                )}
            </View>

            {/* Bottom Publisher Name */}
            <View style={styles.bottomInfoRow}>
                <YambiText
                    text={ShowUserName(item.user.user_names, item.user.phone_number)}
                    bold
                    size="small"
                    color="#FFFFFF"
                    style={{ color: '#FFFFFF' }}
                    numberLines={1}
                />
            </View>

            {/* Viewers BottomSheet */}
            <BottomSheet
                visible={showViewersSheet}
                onClose={() => setShowViewersSheet(false)}
            >
                <View style={{ width: '100%', paddingBottom: 20, paddingHorizontal: 20 }}>
                    {viewersList.length === 0 ? (
                        <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 30 }}>
                            <IconApp pack="FI" name="eye-off" size={36} color={app_theme.colors.gray} />
                            <YambiText text={strings.no_views_yet} style={{ marginTop: 10, color: app_theme.colors.gray, fontSize: 14 }} />
                        </View>
                    ) : (
                        viewersList.map((viewerItem, idx) => {
                            const viewerPhone = typeof viewerItem === 'string' ? viewerItem : (viewerItem.phone_number || viewerItem.phone);
                            const viewTime = typeof viewerItem === 'object' ? (viewerItem.time || viewerItem.timestamp || viewerItem.createdAt) : undefined;

                            const viewerContact = contacts.find((c: any) => c.phoneNumber === viewerPhone || c.phone_number === viewerPhone);
                            const viewerName = viewerContact ? (viewerContact.displayName || viewerPhone) : viewerPhone;

                            return (
                                <ViewersItem
                                    key={viewerPhone + idx}
                                    viewerPhone={viewerPhone}
                                    viewerName={viewerName}
                                    viewTime={viewTime}
                                    isLast={idx === viewersList.length - 1}
                                />
                            );
                        })
                    )}
                </View>
            </BottomSheet>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        flex: 1,
        height: 210,
        margin: 6,
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#1D2A44',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    darkOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.25)',
    },
    captionContainer: {
        position: 'absolute',
        bottom: 32,
        left: 10,
        right: 10,
    },
    captionText: {
        color: '#FFFFFF',
        fontSize: 11,
        opacity: 0.9,
    },
    textContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
    },
    textStatusTitle: {
        fontSize: 14,
        marginHorizontal: 8,
    },
    avatarRing: {
        position: 'absolute',
        top: 8,
        right: 8,
        borderRadius: 22,
        padding: 1.5,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        zIndex: 10,
    },
    avatarImg: {
        width: 34,
        height: 34,
        borderRadius: 17,
    },
    bottomInfoRow: {
        position: 'absolute',
        bottom: 10,
        left: 10,
        right: 10,
        zIndex: 10,
    },
    horizontalContainer: {
        alignItems: 'center',
        marginRight: 16,
        width: 88,
    },
    horizontalAvatarRing: {
        width: 80,
        height: 80,
        borderRadius: 40,
        padding: 2,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    horizontalAvatarImg: {
        width: 70,
        height: 70,
        borderRadius: 35,
    },
});

export default memo(StoriesList);