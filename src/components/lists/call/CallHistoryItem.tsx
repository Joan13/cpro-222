import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useObject } from '@realm/react';
import { useAppSelector } from '../../../store/app/hooks';
import { CallHistory, UserContacts } from '../../../store/database/Models';
import { IconApp } from '../../app/IconApp';
import { media_url, formatPhoneInternational } from '../../../../GlobalVariables';
import { strings } from '../../../lang/lang';
import moment from 'moment';

interface CallHistoryItemProps {
    item: CallHistory;
    myPhone: string;
    onPressItem: (item: CallHistory) => void;
    onAudioCall: (phone: string, name: string, avatar: string) => void;
    onVideoCall: (phone: string, name: string, avatar: string) => void;
    onDeleteLog: (id: string) => void;
}

export const CallHistoryItem: React.FC<CallHistoryItemProps> = ({
    item,
    myPhone,
    onPressItem,
    onAudioCall,
    onVideoCall,
    onDeleteLog,
}) => {
    const theme = useAppSelector((state) => state.app_theme);
    const contacts = useAppSelector((state) => state.app.raw_contacts);

    const peerPhone = item.callerId === myPhone ? item.calleeId : item.callerId;
    const realmContact = useObject(UserContacts, peerPhone || '');
    const contact = contacts.find((c: any) => c.phoneNumber === peerPhone);

    const displayName = contact
        ? contact.displayName
        : realmContact?.user_names ||
        (item.callerId === myPhone ? item.calleeName : item.callerName) ||
        formatPhoneInternational({ phone_number: peerPhone } as any);

    const avatar =
        realmContact?.user_profile ||
        (contact && ((contact as any).imageProfileUrl || (contact as any).avatar)) ||
        (item.callerId === myPhone ? item.calleeAvatar : item.callerAvatar) ||
        '';

    const fullAvatarUri = avatar
        ? avatar.startsWith('http')
            ? avatar
            : `${media_url}/profile_pictures/${avatar}`
        : null;

    const isVerified = Boolean(
        realmContact?.user_verified === 1 ||
        (contact && ((contact as any).user_verified === 1 || (contact as any).isVerified))
    );

    const isOutgoing = item.direction === 'outgoing' || item.callerId === myPhone;
    const isMissed =
        item.direction === 'missed' ||
        item.status === 'MISSED' ||
        item.status === 'REJECTED' ||
        (item.durationSeconds === 0 && !isOutgoing);

    const iconName = isOutgoing ? 'arrow-up-right' : 'arrow-down-left';
    const iconColor = isMissed
        ? theme.colors.error || '#FF3B30'
        : isOutgoing
            ? (theme.colors as any).success_color || theme.colors.success || theme.colors.primary || '#34C759'
            : theme.colors.high_color || '#007AFF';

    const formatDuration = (secs: number) => {
        if (secs <= 0) {
            if (isMissed) return strings.missed || 'Missed';
            return strings.no_answer || 'No answer';
        }
        const mins = Math.floor(secs / 60);
        const remainingSecs = secs % 60;
        if (mins > 0) {
            return `${mins}m ${remainingSecs}s`;
        }
        return `${remainingSecs}s`;
    };

    const formattedTime = moment(item.timestamp || item.createdAt).calendar(null, {
        sameDay: '[Today], HH:mm',
        lastDay: '[Yesterday], HH:mm',
        lastWeek: 'ddd, HH:mm',
        sameElse: 'DD MMM, HH:mm',
    });

    return (
        <Pressable
            onLongPress={() => onDeleteLog(item._id)}
            onPress={() => onPressItem(item)}
            style={({ pressed }) => [
                styles.logCard,
                {
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                    //   opacity: pressed ? 0.75 : 1,
                },
            ]}
        >
            {/* Profile Picture */}
            <View style={styles.avatarContainer}>
                <ExpoImage
                    source={
                        fullAvatarUri
                            ? { uri: fullAvatarUri }
                            : require('../../../assets/profile_black.jpg')
                    }
                    style={styles.avatar}
                    contentFit="cover"
                />
            </View>

            {/* Center Details */}
            <View style={styles.detailsContainer}>
                <View style={styles.nameRow}>
                    <Text
                        style={[styles.displayName, { color: theme.colors.text }]}
                        numberOfLines={1}
                    >
                        {displayName}
                    </Text>
                    {isVerified && (
                        <IconApp
                            pack="MT"
                            name="verified"
                            size={16}
                            color={theme.colors.high_color}
                            styles={{ marginLeft: 4 }}
                        />
                    )}
                </View>

                <View style={styles.subInfoRow}>
                    <IconApp
                        pack="MC"
                        name={iconName}
                        size={16}
                        color={iconColor}
                        styles={{ marginRight: 4 }}
                    />
                    <Text style={[styles.subText, { color: isMissed ? (theme.colors.error || '#FF3B30') : theme.colors.gray }]}>
                        {formatDuration(item.durationSeconds)} • {formattedTime}
                    </Text>
                </View>
            </View>

            {/* Right Action Buttons */}
            <View style={styles.actionsRow}>
                <Pressable
                    onPress={() => onAudioCall(peerPhone, displayName, avatar)}
                    style={[styles.actionBtn, { backgroundColor: theme.colors.high_color + '15' }]}
                >
                    <IconApp pack="MC" name="phone" size={18} color={theme.colors.high_color} />
                </Pressable>

                <Pressable
                    onPress={() => onVideoCall(peerPhone, displayName, avatar)}
                    style={[styles.actionBtn, { backgroundColor: theme.colors.high_color + '15', marginLeft: 8 }]}
                >
                    <IconApp pack="MC" name="video" size={18} color={theme.colors.high_color} />
                </Pressable>
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    logCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        // borderBottomWidth: 0.5,
    },
    avatarContainer: {
        marginRight: 14,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    detailsContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    displayName: {
        fontSize: 16,
        fontWeight: '600',
        maxWidth: '80%',
    },
    subInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    subText: {
        fontSize: 13,
    },
    actionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 10,
    },
    actionBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default CallHistoryItem;
