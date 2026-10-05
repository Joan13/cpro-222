import React from 'react';
import { View, Image, StyleSheet, Pressable } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useObject } from '@realm/react';
import { useAppSelector } from '../../../store/app/hooks';
import { CallHistory, UserContacts } from '../../../store/database/Models';
import { IconApp } from '../../app/IconApp';
import { media_url, formatPhoneInternational, renderDateTime } from '../../../../GlobalVariables';
import { strings } from '../../../lang/lang';
import { YambiText } from '../../app/Text';
import * as RootNavigation from '../../../services/Navigation_ref';

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
    const call_active = useAppSelector((state) => state.app.call_active);

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
    const isRejected = item.direction === 'rejected' || item.status === 'REJECTED';
    const isMissed =
        (item.direction === 'missed' ||
        item.status === 'MISSED' ||
        (item.durationSeconds === 0 && !isOutgoing)) && !isRejected;

    const isVideo = item.type === 'video';

    const iconName = isOutgoing ? 'arrow-up-right' : 'arrow-down-left';
    const iconColor = isMissed
        ? theme.colors.error || '#FF3B30'
        : isRejected
            ? (theme.colors as any).error || '#FF3B30'
            : isOutgoing
                ? (theme.colors as any).success_color || theme.colors.success || theme.colors.primary || '#34C759'
                : theme.colors.high_color || '#007AFF';

    const formatDuration = (secs: number) => {
        if (secs <= 0) {
            if (isRejected) return strings.call_rejected || 'Declined';
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

    const rawDate = item.timestamp
        ? item.timestamp
        : (item.createdAt || new Date().toISOString());
    const formattedTime = renderDateTime(rawDate, 1, true);

    const handleViewPhoto = () => {
        if (fullAvatarUri) {
            RootNavigation.navigate("ViewPhoto", { source: fullAvatarUri });
        } else {
            RootNavigation.navigate("ViewPhoto", { source: "" });
        }
    };

    return (
        <Pressable
            onLongPress={() => onDeleteLog(item._id)}
            onPress={() => onPressItem(item)}
            style={({ pressed }) => [
                styles.logCard,
                {
                    backgroundColor: pressed ? theme.colors.high_color + '15' : theme.colors.background,
                },
            ]}
        >
            {/* Profile Picture */}
            <Pressable onPress={handleViewPhoto}>
                {!fullAvatarUri ? (
                    <Image
                        source={require('../../../assets/profile_black.jpg')}
                        style={[styles.avatar, { borderColor: theme.colors.border }]}
                    />
                ) : (
                    <ExpoImage
                        source={{ uri: fullAvatarUri }}
                        style={[styles.avatar, { borderColor: theme.colors.border }]}
                        contentFit="cover"
                    />
                )}
            </Pressable>

            {/* Center Details */}
            <View style={styles.detailsContainer}>
                <View style={styles.nameRow}>
                    <YambiText
                        text={displayName}
                        size="normal"
                        bold
                        numberLines={1}
                        color="default"
                        style={{ maxWidth: '80%' }}
                    />
                    {isVerified && (
                        <IconApp
                            pack="MT"
                            name="verified"
                            size={15}
                            color={(theme.colors as any).certified_badge || theme.colors.high_color}
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
                    <YambiText
                        text={`${formatDuration(item.durationSeconds)} • ${formattedTime}`}
                        size="small"
                        color={isMissed ? "error" : "gray"}
                        numberLines={1}
                    />
                </View>
            </View>

            {/* Right Action Button: Only video call icon for video, only audio call icon for audio */}
            <View style={styles.actionsRow}>
                {isVideo ? (
                    <Pressable
                        disabled={call_active}
                        onPress={() => onVideoCall(peerPhone, displayName, avatar)}
                        style={[
                            styles.actionBtn,
                            {
                                backgroundColor: theme.colors.high_color + '15',
                                opacity: call_active ? 0.35 : 1,
                            },
                        ]}
                    >
                        <IconApp pack="MC" name="video" size={18} color={theme.colors.high_color} />
                    </Pressable>
                ) : (
                    <Pressable
                        disabled={call_active}
                        onPress={() => onAudioCall(peerPhone, displayName, avatar)}
                        style={[
                            styles.actionBtn,
                            {
                                backgroundColor: theme.colors.high_color + '15',
                                opacity: call_active ? 0.35 : 1,
                            },
                        ]}
                    >
                        <IconApp pack="MC" name="phone" size={18} color={theme.colors.high_color} />
                    </Pressable>
                )}
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    logCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 15,
        width: '100%',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 50,
        borderWidth: 1,
    },
    detailsContainer: {
        flex: 1,
        marginLeft: 10,
        justifyContent: 'center',
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    subInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
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
