import React, { memo } from "react";
import { View, Pressable, StyleSheet, Image } from "react-native";
import { useAppSelector } from "../../../store/app/hooks";
import { useObject } from "@realm/react";
import { UserContacts, YambiGroups, UsersMessages, GroupMessages } from "../../../store/database/Models";
import { YambiText } from "../../app/Text";
import { IconApp } from "../../app/IconApp";
import { formatPhoneInternational, media_url, renderDateTime } from "../../../../GlobalVariables";
import { Image as ExpoImage } from 'expo-image';
import { strings } from "../../../lang/lang";
import { normalizeText } from "../../../pages/chat/Search";

interface SearchChatItemProps {
    item: any;
    type: 'chat' | 'message' | 'contact';
    onPress: () => void;
    searchKeyword?: string;
}

const SearchChatItem: React.FC<SearchChatItemProps> = ({ item, type, onPress, searchKeyword }) => {
    const theme = useAppSelector(state => state.app_theme);
    const contacts = useAppSelector(state => state.app.raw_contacts);
    const user_data = useAppSelector(state => state.user_data);

    // Resolve contact or group details based on the item type
    const isGroup = type === 'chat' ? item.type_chat === 2 : (type === 'contact' ? false : item.receiver.startsWith("G"));
    const targetId = type === 'chat' 
        ? item._id 
        : (type === 'contact' 
            ? item.user_id 
            : (isGroup ? item.receiver : (item.sender === user_data.phone_number ? item.receiver : item.sender)));

    const localContactInfo = useObject(UserContacts, targetId);
    const contactInfo = type === 'contact' ? item : localContactInfo;
    const groupInfo = type === 'chat' || type === 'message' ? useObject(YambiGroups, targetId) : null;

    const lastMsgToken = (type === 'chat' && item?.last_message) ? item.last_message : "";
    const lastDirectMsg = useObject(UsersMessages, lastMsgToken);
    const lastGroupMsg = useObject(GroupMessages, lastMsgToken);
    const lastMsgObj = isGroup ? lastGroupMsg : lastDirectMsg;

    const chatLastMessageText = lastMsgObj ? (lastMsgObj.main_text_message || lastMsgObj.caption || "") : "";

    const displayName = isGroup
        ? (groupInfo?.user_names || strings.group_chat)
        : (() => {
            const phoneVal = type === 'contact' ? item.phone_number : targetId;
            const systemContact = contacts?.find(c => c.phoneNumber === phoneVal);
            if (systemContact) return systemContact.displayName;
            if (contactInfo?.user_names && contactInfo.user_names !== phoneVal) return contactInfo.user_names;
            return formatPhoneInternational({ phone_number: phoneVal, country: contactInfo?.country || "" } as any);
        })();

    const profilePic = isGroup ? groupInfo?.group_profile : contactInfo?.user_profile;
    const profilePicUrl = profilePic
        ? `${media_url}/profile_pictures/${profilePic}`
        : null;

    // Helper to highlight matching text in search results with normalized matching
    const renderHighlightedText = (text: string, keyword: string | undefined, maxLines: number = 2) => {
        if (!text) return null;
        if (!keyword) return <YambiText text={text} size="normal" color="gray" numberLines={maxLines} />;

        const normKeyword = normalizeText(keyword);
        if (!normKeyword) return <YambiText text={text} size="normal" color="gray" numberLines={maxLines} />;

        const index = text.toLowerCase().indexOf(keyword.toLowerCase().trim());
        if (index !== -1) {
            const before = text.substring(0, index);
            const match = text.substring(index, index + keyword.trim().length);
            const after = text.substring(index + keyword.trim().length);

            return (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
                    {before ? <YambiText text={before} size="normal" color="gray" numberLines={maxLines} style={{ padding: 0, margin: 0 }} /> : null}
                    <YambiText text={match} size="normal" color="high" bold numberLines={maxLines} style={{ padding: 0, margin: 0 }} />
                    {after ? <YambiText text={after} size="normal" color="gray" numberLines={maxLines} style={{ padding: 0, margin: 0 }} /> : null}
                </View>
            );
        }

        return <YambiText text={text} size="normal" color="gray" numberLines={maxLines} />;
    };

    const subtitleText = type === 'chat'
        ? chatLastMessageText
        : (type === 'contact'
            ? (item.status_information || item.bio || formatPhoneInternational({ phone_number: item.phone_number, country: item.country || "" } as any))
            : item.main_text_message);

    const timeStamp = type === 'chat' ? item.updatedAt : (type === 'contact' ? null : item.createdAt);

    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                styles.container,
                {
                    backgroundColor: theme.colors.background,
                    borderBottomColor: "transparent"
                }
            ]}
        >
            {/* Avatar / Profile picture (hidden in message search block) */}
            {type !== 'message' && (
                <View style={styles.avatarContainer}>
                    {profilePic ? (
                        <ExpoImage
                            source={{ uri: profilePicUrl }}
                            style={styles.avatar}
                            contentFit="cover"
                        />
                    ) : (
                        <Image
                            source={require('../../../assets/profile_black.jpg')}
                            style={{
                                width: 48,
                                height: 48,
                                borderRadius: 24,
                                borderWidth: 1,
                                borderColor: theme.colors.border
                            }}
                        />
                    )}
                </View>
            )}

            {/* Content info */}
            <View style={styles.textContainer}>
                <View style={styles.headerRow}>
                    <YambiText
                        bold={type !== 'message'}
                        text={displayName}
                        size="normal"
                        color={type === 'message' ? "gray" : "default"}
                        style={{ flex: 1 }}
                        numberLines={1}
                    />
                    {timeStamp ? (
                        <YambiText
                            text={renderDateTime(timeStamp, 0, true, true)}
                            size="small"
                            color="gray"
                        />
                    ) : null}
                </View>

                <View style={styles.bodyRow}>
                    <View style={{ flex: 1 }}>
                        {renderHighlightedText(subtitleText, searchKeyword, type === 'chat' ? 1 : 2)}
                    </View>
                    {isGroup && type === 'message' && (
                        <View style={[styles.badge, { backgroundColor: theme.colors.border }]}>
                            <YambiText text={strings.group} size="small" color="gray" />
                        </View>
                    )}
                </View>
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        // paddingHorizontal: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    avatarContainer: {
        marginRight: 12,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    avatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    bodyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    badge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginLeft: 8,
    }
});

export default memo(SearchChatItem);
