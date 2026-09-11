import React, { memo } from 'react';
import { View, Image, StyleSheet, StyleProp, ViewStyle, Pressable } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useAppSelector } from '../../../store/app/hooks';
import { useObject } from '@realm/react';
import { UserContacts } from '../../../store/database/Models';
import { strings } from '../../../lang/lang';
import { TextSmallYambiGray, YambiText } from '../../app/Text';
import { IconApp } from '../../app/IconApp';
import { media_url, renderDateTime } from '../../../../GlobalVariables';
import * as RootNavigation from '../../../services/Navigation_ref';

export interface ViewersItemProps {
    viewerPhone: string;
    viewerName?: string;
    viewTime?: string | Date;
    avatar?: any;
    isLast?: boolean;
    containerStyle?: StyleProp<ViewStyle>;
}

const ViewersItem: React.FC<ViewersItemProps> = ({
    viewerPhone,
    viewerName,
    viewTime,
    avatar,
    isLast = false,
    containerStyle,
}) => {
    const theme = useAppSelector(state => state.app_theme.colors);
    const user_data = useAppSelector(state => state.user_data);
    const contactsList = useAppSelector(state => state.app.raw_contacts);

    const viewerUser = useObject(UserContacts, viewerPhone);

    const displayName = viewerName || (() => {
        if (viewerPhone === user_data.phone_number) return strings.my_status || "My status";
        const contact = contactsList.find((c: any) => c.phoneNumber === viewerPhone || c.phone_number === viewerPhone);
        if (contact?.displayName) return contact.displayName;
        if (viewerUser?.user_names) return viewerUser.user_names;
        return viewerPhone;
    })();

    const profilePic = avatar || (viewerPhone === user_data.phone_number ? user_data.user_profile : viewerUser?.user_profile) || "";

    const formattedTime = viewTime ? renderDateTime(String(viewTime), 1, false) : '';

    const handlePressMessage = () => {
        if (viewerPhone) {
            RootNavigation.navigate("Inbox", { user: viewerPhone });
        }
    };

    const renderAvatar = () => {
        if (profilePic && typeof profilePic === 'string' && profilePic.trim() !== "") {
            const uri = profilePic.startsWith('http') ? profilePic : `${media_url}/profile_pictures/${profilePic}`;
            return (
                <ExpoImage
                    source={{ uri }}
                    style={[styles.avatar, { borderColor: theme.border }]}
                    contentFit="cover"
                />
            );
        } else if (avatar && typeof avatar !== 'string') {
            return (
                <Image
                    source={avatar}
                    style={[styles.avatar, { borderColor: theme.border }]}
                />
            );
        } else {
            return (
                <Image
                    source={require('../../../assets/profile_black.jpg')}
                    style={[styles.avatar, { borderColor: theme.border }]}
                />
            );
        }
    };

    return (
        <View
            style={[
                styles.container,
                {
                    borderBottomWidth: isLast ? 0 : 1,
                    borderBottomColor: theme.border + '30',
                },
                containerStyle,
            ]}
        >
            {renderAvatar()}
            <View style={styles.infoContainer}>
                <YambiText text={displayName} bold style={{ fontSize: 14, color: theme.text }} />
                {formattedTime !== '' && (
                    <TextSmallYambiGray
                        text={formattedTime}
                        styles={{ marginTop: 2 }}
                    />
                )}
            </View>
            <Pressable
                onPress={handlePressMessage}
                hitSlop={10}
                style={styles.messageBtn}
            >
                <IconApp
                    pack="MC"
                    name="message-text-outline"
                    size={22}
                    color={theme.high_color}
                />
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        width: '100%',
    },
    avatar: {
        width: 38,
        height: 38,
        borderRadius: 19,
        borderWidth: 1,
    },
    infoContainer: {
        flex: 1,
        marginLeft: 12,
    },
    messageBtn: {
        padding: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default memo(ViewersItem);
