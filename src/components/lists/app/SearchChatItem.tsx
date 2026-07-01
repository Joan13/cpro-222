import React, { memo } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { useAppSelector } from "../../../store/app/hooks";
import { useObject } from "@realm/react";
import { UserContacts, YambiGroups, UsersMessages } from "../../../store/database/Models";
import { YambiText } from "../../app/Text";
import { IconApp } from "../../app/IconApp";
import { formatPhoneInternational, media_url, renderDateTime } from "../../../../GlobalVariables";
import { Image as ExpoImage } from 'expo-image';

interface SearchChatItemProps {
    item: any;
    type: 'chat' | 'message';
    onPress: () => void;
    searchKeyword?: string;
}

const SearchChatItem: React.FC<SearchChatItemProps> = ({ item, type, onPress, searchKeyword }) => {
    const theme = useAppSelector(state => state.app_theme);
    const contacts = useAppSelector(state => state.app.raw_contacts);
    const user_data = useAppSelector(state => state.user_data);

    // Resolve contact or group details based on the item type
    const isGroup = type === 'chat' ? item.type_chat === 2 : item.receiver.startsWith("G");
    const targetId = type === 'chat' ? item._id : (isGroup ? item.receiver : (item.sender === user_data.phone_number ? item.receiver : item.sender));

    const contactInfo = useObject(UserContacts, targetId);
    const groupInfo = useObject(YambiGroups, targetId);

    const displayName = isGroup 
        ? (groupInfo?.user_names || "Group Chat") 
        : (() => {
            const systemContact = contacts?.find(c => c.phoneNumber === targetId);
            if (systemContact) return systemContact.displayName;
            if (contactInfo?.user_names && contactInfo.user_names !== targetId) return contactInfo.user_names;
            return formatPhoneInternational({ phone_number: targetId });
        })();

    const profilePic = isGroup ? groupInfo?.group_profile : contactInfo?.user_profile;
    const profilePicUrl = profilePic 
        ? `${media_url}/profile_pictures/${profilePic}` 
        : null;

    // Helper to highlight matching text in search results
    const renderHighlightedText = (text: string, keyword: string | undefined) => {
        if (!keyword || !text) return <YambiText text={text} size="normal" color="gray" numberLines={2} />;
        const index = text.toLowerCase().indexOf(keyword.toLowerCase());
        if (index === -1) return <YambiText text={text} size="normal" color="gray" numberLines={2} />;

        const before = text.substring(0, index);
        const match = text.substring(index, index + keyword.length);
        const after = text.substring(index + keyword.length);

        return (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
                {before ? <YambiText text={before} size="normal" color="gray" style={{ padding: 0, margin: 0 }} /> : null}
                <YambiText text={match} size="normal" color="high" bold style={{ padding: 0, margin: 0 }} />
                {after ? <YambiText text={after} size="normal" color="gray" style={{ padding: 0, margin: 0 }} /> : null}
            </View>
        );
    };

    const subtitleText = type === 'chat' 
        ? item.last_message_text || "No messages" 
        : item.main_text_message;

    const timeStamp = type === 'chat' ? item.updatedAt : item.createdAt;

    return (
        <Pressable 
            onPress={onPress}
            style={({ pressed }) => [
                styles.container,
                { 
                    backgroundColor: pressed ? theme.colors.border : 'transparent',
                    borderBottomColor: theme.colors.border 
                }
            ]}
        >
            {/* Avatar / Profile picture */}
            <View style={styles.avatarContainer}>
                {profilePicUrl ? (
                    <ExpoImage 
                        source={{ uri: profilePicUrl }}
                        style={styles.avatar}
                        contentFit="cover"
                    />
                ) : (
                    <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.border }]}>
                        <IconApp 
                            pack="FI" 
                            name={isGroup ? "users" : "user"} 
                            size={20} 
                            color={theme.colors.gray} 
                        />
                    </View>
                )}
            </View>

            {/* Content info */}
            <View style={styles.textContainer}>
                <View style={styles.headerRow}>
                    <YambiText bold text={displayName} size="normal" color="default" style={{ flex: 1 }} numberLines={1} />
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
                        {renderHighlightedText(subtitleText, searchKeyword)}
                    </View>
                    {isGroup && type === 'message' && (
                        <View style={[styles.badge, { backgroundColor: theme.colors.border }]}>
                            <YambiText text="Group" size="small" color="gray" />
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
        paddingHorizontal: 16,
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
