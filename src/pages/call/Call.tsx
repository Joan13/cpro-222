import React, { useLayoutEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    Alert,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useObject, useRealm } from '@realm/react';
import { useAppDispatch, useAppSelector } from '../../store/app/hooks';
import { CallHistory, UserContacts } from '../../store/database/Models';
import { IconApp } from '../../components/app/IconApp';
import { strings } from '../../lang/lang';
import { media_url, formatPhoneInternational, copyToClipboard } from '../../../GlobalVariables';
import { callManager } from '../../services/call/CallManager';
import { YambiText } from '../../components/app/Text';
import { setMessageSelected, setShowModalApp } from '../../store/reducers/appSlice';
import ModalApp from '../../components/app/ModalApp';
import moment from 'moment';

export const CallDetailScreen: React.FC<{ navigation: any; route: any }> = ({
    navigation,
    route,
}) => {
    const theme = useAppSelector((state) => state.app_theme);
    const myUser = useAppSelector((state) => state.user_data);
    const contacts = useAppSelector((state) => state.app.raw_contacts);
    const langApp = useAppSelector((state) => state.persisted_app.langApp);
    const dispatch = useAppDispatch();
    const realm = useRealm();

    const { callId } = route.params || {};
    const callLog = useObject(CallHistory, callId || '');

    const handleDelete = useCallback(() => {
        dispatch(setShowModalApp(true));
    }, [dispatch]);

    useLayoutEffect(() => {
        navigation.setOptions({
            title: strings.call_details || 'Call Details',
            headerRight: () => (
                <Pressable onPress={handleDelete} style={{ padding: 8 }}>
                    <IconApp pack="MC" name="trash-can-outline" size={22} color={theme.colors.error || '#FF3B30'} />
                </Pressable>
            ),
        });
    }, [navigation, theme, handleDelete]);

    if (!callLog) {
        return (
            <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
                <YambiText text={strings.call_log_not_found || 'Call log not found'} size="normal" color="gray" />
            </View>
        );
    }

    const peerPhone = callLog.callerId === myUser.phone_number ? callLog.calleeId : callLog.callerId;
    const realmContact = useObject(UserContacts, peerPhone || '');
    const contact = contacts.find((c: any) => c.phoneNumber === peerPhone);

    const displayName = contact
        ? contact.displayName
        : realmContact?.user_names ||
        (callLog.callerId === myUser.phone_number ? callLog.calleeName : callLog.callerName) ||
        formatPhoneInternational({ phone_number: peerPhone } as any);

    const avatar =
        realmContact?.user_profile ||
        (contact && ((contact as any).imageProfileUrl || (contact as any).avatar)) ||
        (callLog.callerId === myUser.phone_number ? callLog.calleeAvatar : callLog.callerAvatar) ||
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

    const isOutgoing = callLog.direction === 'outgoing' || callLog.callerId === myUser.phone_number;
    const isMissed =
        callLog.direction === 'missed' ||
        callLog.status === 'MISSED' ||
        callLog.status === 'REJECTED' ||
        (callLog.durationSeconds === 0 && !isOutgoing);

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
        const hours = Math.floor(secs / 3600);
        const mins = Math.floor((secs % 3600) / 60);
        const remainingSecs = secs % 60;
        if (hours > 0) {
            return `${hours}h ${mins}m ${remainingSecs}s`;
        }
        if (mins > 0) {
            return `${mins}m ${remainingSecs}s`;
        }
        return `${remainingSecs}s`;
    };

    const formattedDate = moment(callLog.timestamp || callLog.createdAt)
        .locale(langApp || 'en')
        .format('dddd, DD MMMM YYYY');
    const formattedTime = moment(callLog.timestamp || callLog.createdAt).format('HH:mm:ss');

    const handleStartAudioCall = () => {
        callManager.startCall(peerPhone, 'audio', displayName, avatar);
        navigation.navigate('AudioCallScreen');
    };

    const handleStartVideoCall = () => {
        callManager.startCall(peerPhone, 'video', displayName, avatar);
        navigation.navigate('VideoCallScreen');
    };

    const handleGoInbox = () => {
        dispatch(setMessageSelected(''));
        navigation.navigate('Inbox', { user: peerPhone });
    };

    return (
        <View style={[styles.screenContainer, { backgroundColor: theme.colors.background, borderTopWidth: 1, borderTopColor: theme.colors.border }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Contact Hero Section */}
                <View style={[styles.heroCard, { backgroundColor: theme.colors.card || theme.colors.border + '20' }]}>
                    <View style={styles.avatarWrapper}>
                        <ExpoImage
                            source={
                                fullAvatarUri
                                    ? { uri: fullAvatarUri }
                                    : require('../../assets/profile_black.jpg')
                            }
                            style={styles.heroAvatar}
                            contentFit="cover"
                        />
                    </View>

                    <View style={styles.heroNameRow}>
                        <Text style={[styles.heroName, { color: theme.colors.text }]} numberOfLines={1}>
                            {displayName}
                        </Text>
                        {isVerified && (
                            <IconApp
                                pack="MT"
                                name="verified"
                                size={20}
                                color={theme.colors.high_color}
                                styles={{ marginLeft: 6 }}
                            />
                        )}
                    </View>

                    <Pressable onPress={() => copyToClipboard(peerPhone)}>
                        <Text style={[styles.heroPhone, { color: theme.colors.gray }]}>
                            {formatPhoneInternational({ phone_number: peerPhone } as any)}
                        </Text>
                    </Pressable>
                </View>

                {/* Quick Actions Row */}
                <View style={styles.quickActionsRow}>
                    <Pressable onPress={handleGoInbox} style={styles.quickActionItem}>
                        <View style={[styles.quickActionIcon, { backgroundColor: theme.colors.high_color + '20' }]}>
                            <IconApp pack="MC" name="message-text" size={20} color={theme.colors.high_color} />
                        </View>
                        <YambiText text={strings.message || 'Message'} size="small" color="high" />
                    </Pressable>

                    <Pressable onPress={handleStartAudioCall} style={styles.quickActionItem}>
                        <View style={[styles.quickActionIcon, { backgroundColor: theme.colors.high_color + '20' }]}>
                            <IconApp pack="MC" name="phone" size={20} color={theme.colors.high_color} />
                        </View>
                        <YambiText text={strings.audio || 'Audio'} size="small" color="high" />
                    </Pressable>

                    <Pressable onPress={handleStartVideoCall} style={styles.quickActionItem}>
                        <View style={[styles.quickActionIcon, { backgroundColor: theme.colors.high_color + '20' }]}>
                            <IconApp pack="MC" name="video" size={20} color={theme.colors.high_color} />
                        </View>
                        <YambiText text={strings.video || 'Video'} size="small" color="high" />
                    </Pressable>
                </View>

                {/* Information Details Card */}
                <View style={[styles.infoCard, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                    <Text style={[styles.cardHeaderTitle, { color: theme.colors.text }]}>
                        {strings.call_summary || 'Call Summary'}
                    </Text>

                    {/* Type */}
                    <View style={styles.infoRow}>
                        <View style={styles.infoRowLeft}>
                            <IconApp
                                pack="MC"
                                name={callLog.type === 'video' ? 'video-outline' : 'phone-outline'}
                                size={20}
                                color={theme.colors.high_color}
                            />
                            <Text style={[styles.infoLabel, { color: theme.colors.gray }]}>{strings.call_type || 'Call Type'}</Text>
                        </View>
                        <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                            {callLog.type === 'video' ? (strings.video_call || 'Video Call') : (strings.audio_call || 'Audio Call')}
                        </Text>
                    </View>

                    {/* Direction */}
                    <View style={styles.infoRow}>
                        <View style={styles.infoRowLeft}>
                            <IconApp pack="MC" name={iconName} size={20} color={iconColor} />
                            <Text style={[styles.infoLabel, { color: theme.colors.gray }]}>{strings.direction || 'Direction'}</Text>
                        </View>
                        <Text style={[styles.infoValue, { color: iconColor }]}>
                            {isOutgoing ? (strings.outgoing_call || 'Outgoing Call') : isMissed ? (strings.missed_call || 'Missed Call') : (strings.incoming_call || 'Incoming Call')}
                        </Text>
                    </View>

                    {/* Duration */}
                    <View style={styles.infoRow}>
                        <View style={styles.infoRowLeft}>
                            <IconApp pack="MC" name="clock-outline" size={20} color={theme.colors.high_color} />
                            <Text style={[styles.infoLabel, { color: theme.colors.gray }]}>{strings.duration || 'Duration'}</Text>
                        </View>
                        <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                            {formatDuration(callLog.durationSeconds)}
                        </Text>
                    </View>

                    {/* Date */}
                    <View style={styles.infoRow}>
                        <View style={styles.infoRowLeft}>
                            <IconApp pack="MC" name="calendar-month-outline" size={20} color={theme.colors.high_color} />
                            <Text style={[styles.infoLabel, { color: theme.colors.gray }]}>{strings.date || 'Date'}</Text>
                        </View>
                        <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                            {formattedDate}
                        </Text>
                    </View>

                    {/* Time */}
                    <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                        <View style={styles.infoRowLeft}>
                            <IconApp pack="MC" name="timer-sand-complete" size={20} color={theme.colors.high_color} />
                            <Text style={[styles.infoLabel, { color: theme.colors.gray }]}>{strings.time || 'Time'}</Text>
                        </View>
                        <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                            {formattedTime}
                        </Text>
                    </View>
                </View>
            </ScrollView>

            <ModalApp
                title={strings.delete_log || 'Delete Log'}
                singleButton={false}
                textAction={strings.delete || 'Delete'}
                textCancel={strings.cancel || 'Cancel'}
                onAction={() => {
                    try {
                        realm.write(() => {
                            if (callLog) {
                                realm.delete(callLog);
                            }
                        });
                        dispatch(setShowModalApp(false));
                        if (navigation.canGoBack()) {
                            navigation.goBack();
                        }
                    } catch (e) {
                        console.error('Error deleting call log:', e);
                    }
                }}
                onClose={() => dispatch(setShowModalApp(false))}
            >
                <YambiText
                    text={strings.delete_log_confirm || 'Remove this call entry from history?'}
                    size="normal"
                    color="default"
                    style={{ textAlign: 'center', marginVertical: 10 }}
                />
            </ModalApp>
        </View>
    );
};

const styles = StyleSheet.create({
    screenContainer: {
        flex: 1,
    },
    centerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        borderBottomWidth: 1,
    },
    headerBtn: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    scrollContent: {
        padding: 20,
    },
    heroCard: {
        alignItems: 'center',
        padding: 24,
        borderRadius: 20,
        marginBottom: 20,
    },
    avatarWrapper: {
        marginBottom: 12,
    },
    heroAvatar: {
        width: 90,
        height: 90,
        borderRadius: 45,
    },
    heroNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    heroName: {
        fontSize: 22,
        fontWeight: '700',
    },
    heroPhone: {
        fontSize: 14,
    },
    quickActionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
    },
    quickActionItem: {
        alignItems: 'center',
    },
    quickActionIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    infoCard: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
        marginBottom: 50
    },
    cardHeaderTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 0.5,
        borderColor: '#E5E5EA30',
    },
    infoRowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoLabel: {
        fontSize: 14,
        marginLeft: 10,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '600',
    },
});

export default CallDetailScreen;
