import { Text, View, Image, Pressable, ScrollView } from "react-native";
import { useAppDispatch, useAppSelector } from "../../../store/app/hooks";
import { memo, useState } from "react";
import { YambiText } from "../../app/Text";
import { strings } from "../../../lang/lang";
import { IconApp } from "../../app/IconApp";
import { renderDateTime, media_url } from "../../../../GlobalVariables";
import { Image as ExpoImage } from 'expo-image';
import BottomSheet from "../../app/BottomSheet";

const StoriesList = ({ item, index, GoStory }: { item: any, index: number, GoStory: () => void }) => {

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
        let viewersList: string[] = [];
        try {
            viewersList = JSON.parse(st.viewers || '[]');
        } catch (e) {
            viewersList = [];
        }
        return !viewersList.includes(user_data.phone_number);
    });

    // Collect all unique viewers for item.stories
    const viewersList: string[] = [];
    const viewersMap: { [key: string]: boolean } = {};

    if (Array.isArray(item.stories)) {
        item.stories.forEach((st: any) => {
            try {
                const parsed = JSON.parse(st.viewers || '[]');
                if (Array.isArray(parsed)) {
                    parsed.forEach((phone: string) => {
                        if (phone && !viewersMap[phone]) {
                            viewersMap[phone] = true;
                            viewersList.push(phone);
                        }
                    });
                }
            } catch (e) { }
        });
    }

    const totalViewers = viewersList.length;

    return (
        <Pressable
            onPress={GoStory}
            style={{
                marginVertical: 6,
                backgroundColor: app_theme.colors.card || app_theme.colors.background,
                paddingVertical: 12,
                paddingHorizontal: 14,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: app_theme.colors.border + '40',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 3,
                elevation: 1.5
            }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {/* Avatar with unread status ring */}
                <View style={{
                    borderColor: hasUnseenStory ? (app_theme.colors.primary_high_color || app_theme.colors.high_color) : (app_theme.colors.gray + '50'),
                    borderWidth: hasUnseenStory ? 2.5 : 1.5,
                    borderRadius: 50,
                    padding: 2,
                    height: 52,
                    width: 52,
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    {item.user.user_profile === "" ? (
                        <Image
                            source={require('./../../../assets/profile_black.jpg')}
                            style={{ width: 44, height: 44, borderRadius: 50, borderWidth: 1, borderColor: app_theme.colors.border }}
                        />
                    ) : (
                        <ExpoImage
                            style={{ height: 44, width: 44, borderRadius: 50 }}
                            contentFit="cover"
                            source={media_url + "/profile_pictures/" + item.user.user_profile}
                        />
                    )}

                    {/* Status count badge */}
                    <View style={{
                        backgroundColor: app_theme.colors.primary_high_color || app_theme.colors.high_color,
                        height: 18,
                        minWidth: 18,
                        paddingHorizontal: 4,
                        borderRadius: 10,
                        justifyContent: 'center',
                        alignItems: 'center',
                        position: 'absolute',
                        top: -2,
                        right: -2
                    }}>
                        <YambiText text={String(item.stories ? item.stories.length : 1)} size="xsmall" style={{ fontSize: 10, fontWeight: 'bold', color: app_theme.colors.primary_high_color_foreground || '#FFFFFF' }} />
                    </View>
                </View>

                {/* User details */}
                <View style={{ flex: 1, marginLeft: 14 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <YambiText text={ShowUserName(item.user.user_names, item.user.phone_number)} numberLines={1} bold style={{ fontSize: 16, color: app_theme.colors.text }} />
                        {item.user.user_verified === 1 ? (
                            <IconApp name="verified" pack="MT" size={15} color={app_theme.colors.primary_high_color || app_theme.colors.high_color} styles={{ marginLeft: 5 }} />
                        ) : null}
                    </View>
                    <YambiText text={renderDateTime(item.lastDate, 1, false)} style={{ fontSize: 13, color: app_theme.colors.gray, marginTop: 2 }} />
                </View>

                {/* Viewers action button */}
                <Pressable
                    onPress={(e) => {
                        e.stopPropagation();
                        setShowViewersSheet(true);
                    }}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: (app_theme.colors.primary_high_color || app_theme.colors.high_color) + '18',
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 20,
                        marginLeft: 8
                    }}>
                    <IconApp pack="FI" name="eye" size={16} color={app_theme.colors.primary_high_color || app_theme.colors.high_color} />
                    <YambiText
                        text={String(totalViewers)}
                        style={{
                            fontSize: 12,
                            fontWeight: 'bold',
                            color: app_theme.colors.primary_high_color || app_theme.colors.high_color,
                            marginLeft: 5
                        }}
                    />
                </Pressable>
            </View>

            {/* Viewers BottomSheet */}
            <BottomSheet
                visible={showViewersSheet}
                onClose={() => setShowViewersSheet(false)}
                title={strings.views ? `${strings.views} (${totalViewers})` : `Status Viewers (${totalViewers})`}
            >
                <ScrollView style={{ width: '100%', maxHeight: 380, paddingVertical: 8 }}>
                    {viewersList.length === 0 ? (
                        <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 30 }}>
                            <IconApp pack="FI" name="eye-off" size={36} color={app_theme.colors.gray} />
                            <YambiText text="No views yet" style={{ marginTop: 10, color: app_theme.colors.gray, fontSize: 14 }} />
                        </View>
                    ) : (
                        viewersList.map((viewerPhone, idx) => {
                            const viewerContact = contacts.find((c: any) => c.phoneNumber === viewerPhone || c.phone_number === viewerPhone);
                            const viewerName = viewerContact ? (viewerContact.displayName || viewerPhone) : viewerPhone;

                            return (
                                <View
                                    key={viewerPhone + idx}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        paddingVertical: 10,
                                        borderBottomWidth: idx === viewersList.length - 1 ? 0 : 1,
                                        borderBottomColor: app_theme.colors.border + '30'
                                    }}>
                                    <Image
                                        source={require('./../../../assets/profile_black.jpg')}
                                        style={{ width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: app_theme.colors.border }}
                                    />
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <YambiText text={viewerName} bold style={{ fontSize: 14, color: app_theme.colors.text }} />
                                        <YambiText text={viewerPhone} style={{ fontSize: 12, color: app_theme.colors.gray, marginTop: 1 }} />
                                    </View>
                                    <IconApp pack="MC" name="check-all" size={18} color={app_theme.colors.primary_high_color || app_theme.colors.high_color} />
                                </View>
                            );
                        })
                    )}
                </ScrollView>
            </BottomSheet>
        </Pressable>
    );
};

export default memo(StoriesList);