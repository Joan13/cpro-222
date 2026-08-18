import React, { useState, useEffect } from 'react';
import { View, Pressable, Text, ScrollView, TextInput, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useObject, useRealm } from '@realm/react';
import moment from 'moment';

import { strings } from '../../lang/lang';
import { useAppDispatch, useAppSelector } from '../../store/app/hooks';
import StatusBarYambi from '../app/StatusBar';
import { NavProps, TMessage } from '../../types/types';
import { setMessageSelected } from '../../store/reducers/appSlice';
import { TextNormalYambi, TextNormalYambiGray, TextSmallYambi, TextSmallYambiGray, YambiText } from '../app/Text';
import { UsersMessages } from '../../store/database/Models';
import { SocketApp } from '../../../GlobalVariables';
import AppActivityIndicator from '../app/AppActivityIndicator';

const MessageInfo = ({ route, navigation }: NavProps) => {
    const { message_id, flag } = route.params;

    const app_theme = useAppSelector(state => state.app_theme);
    const user_data = useAppSelector(state => state.user_data);
    const contacts = useAppSelector(state => state.app.raw_contacts);
    const dispatch = useAppDispatch();
    const app_description = useAppSelector(state => state.persisted_app.app_description);

    const [loading, setLoading] = useState<boolean>(false);
    const [edited_message, setEdited_message] = useState<string>("");

    const realm = useRealm();
    const message = useObject(UsersMessages, message_id);

    const ShowUserName = (user_names: string, phone_number: string) => {
        const contact = contacts.find((cc) => cc.phoneNumber === phone_number);
        if (contact !== undefined) {
            return contact.displayName;
        } else {
            return user_names;
        }
    };

    useEffect(() => {
        if (flag === 1) {
            navigation.setOptions({ title: strings.edit_message });
        } else {
            navigation.setOptions({ title: strings.message_info });
        }

        if (message) {
            setEdited_message(message.main_text_message || "");
        }
    }, [flag, message]);

    const EditTheMessage = () => {
        if (message) {
            if (message.main_text_message.trim() !== edited_message.trim()) {
                setLoading(true);
                const msg: TMessage = {
                    sender: message.sender,
                    receiver: message.receiver,
                    main_text_message: edited_message,
                    caption: message.caption,
                    message_type: message.message_type,
                    reactions: message.reactions,
                    response_to: message.response_to,
                    message_read: 0,
                    message_effect: message.message_effect,
                    read_once: message.read_once,
                    flag: 1,
                    token: message.token,
                    deleted: message.deleted,
                    platform: message.platform,
                    createdAt: message.createdAt,
                    receivedAt: message.receivedAt,
                    readAt: message.readAt,
                    playedAt: message.playedAt,
                    cc: message.cc,
                    alignment: message.alignment
                };

                realm.write(() => {
                    try {
                        realm.create('UsersMessages', msg, true);
                    } catch (error) {
                        console.error('Error updating message in Realm', error);
                    }
                });

                SocketApp.emit('newMessage', msg);
                dispatch(setMessageSelected(""));
                setLoading(false);
                navigation.goBack();
            }
        }
    };

    if (!message) {
        return (
            <View style={[styles.container, { backgroundColor: app_theme.colors.background }]}>
                <StatusBarYambi />
                <View style={styles.centerContainer}>
                    <TextNormalYambiGray text={strings.no_sales_available || 'Message not found'} />
                </View>
            </View>
        );
    }

    const isSender = message.sender === user_data.phone_number;
    const youSuffix = ` (${strings.you || 'You'})`;

    const senderText = isSender
        ? message.sender + youSuffix
        : message.sender;

    const isReceiverMe = message.receiver === user_data.phone_number;
    const receiverText = isReceiverMe
        ? message.receiver + youSuffix
        : ShowUserName(message.receiver, message.receiver);

    const getMessageTypeString = () => {
        if (message.message_type === 1) return strings.voice_note;
        if (message.message_type === 2) return strings.picture;
        return strings.plain_text_message;
    };

    const getMessageTypeIcon = () => {
        if (message.message_type === 1) return 'microphone';
        if (message.message_type === 2) return 'image';
        return 'message';
    };

    return (
        <View style={[styles.container, { backgroundColor: app_theme.colors.background, borderTopWidth: 1, borderColor: app_theme.colors.border }]}>
            <StatusBarYambi />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Modern Message Preview Bubble Card */}
                <View style={[
                    styles.previewCard,
                    {
                        backgroundColor: isSender ? app_theme.colors.chat_sent || (app_theme.colors.button_background_color + '18') : app_theme.colors.chat_received || app_theme.colors.card,
                        borderColor: app_theme.colors.border,
                    }
                ]}>
                    <View style={styles.previewHeader}>
                        <View style={styles.typeBadge}>
                            <FontAwesome6
                                name={getMessageTypeIcon()}
                                size={14}
                                color={app_theme.colors.high_color}
                                style={{ marginRight: 6 }}
                            />
                            <TextSmallYambi bold text={getMessageTypeString()} />
                        </View>
                        <TextSmallYambiGray text={moment(message.createdAt).format('LT')} />
                    </View>

                    <View style={styles.previewBody}>
                        <YambiText
                            text={message.message_type === 1 ? strings.voice_note : message.message_type === 2 ? strings.picture : message.main_text_message}
                            bold={message.message_type !== 0}
                            size="normal"
                        />

                        {message.caption ? (
                            <View style={[styles.captionBox, { backgroundColor: app_theme.colors.border + '40' }]}>
                                <TextSmallYambiGray text={strings.caption} bold />
                                <TextNormalYambi text={message.caption} />
                            </View>
                        ) : null}
                    </View>
                </View>

                {flag === 0 ? (
                    <Animated.View entering={FadeIn}>
                        {/* Participants Card */}
                        <View style={[styles.card, { backgroundColor: app_theme.colors.card || app_theme.colors.background, borderColor: app_theme.colors.border }]}>
                            <YambiText text="Participants" bold size="normal" style={styles.cardTitle} />

                            <View style={styles.participantRow}>
                                <View style={[styles.avatarIcon, { backgroundColor: app_theme.colors.high_color + '20' }]}>
                                    <FontAwesome6 name="paper-plane" size={14} color={app_theme.colors.high_color} />
                                </View>
                                <View style={styles.participantInfo}>
                                    <TextSmallYambiGray text={strings.from} />
                                    <TextNormalYambi bold text={senderText} />
                                </View>
                            </View>

                            <View style={[styles.divider, { backgroundColor: app_theme.colors.border }]} />

                            <View style={styles.participantRow}>
                                <View style={[styles.avatarIcon, { backgroundColor: app_theme.colors.high_color2 + '20' }]}>
                                    <FontAwesome6 name="user-check" size={14} color={app_theme.colors.high_color2} />
                                </View>
                                <View style={styles.participantInfo}>
                                    <TextSmallYambiGray text={strings.to} />
                                    <TextNormalYambi bold text={receiverText} />
                                </View>
                            </View>
                        </View>

                        {/* Status & Delivery Timeline Card */}
                        <View style={[styles.card, { backgroundColor: app_theme.colors.card || app_theme.colors.background, borderColor: app_theme.colors.border }]}>
                            <YambiText text="Delivery Timeline" bold size="normal" style={styles.cardTitle} />

                            <View style={styles.timelineItem}>
                                <View style={[styles.statusIcon, { backgroundColor: app_theme.colors.success + '20' }]}>
                                    <FontAwesome6 name="check" size={13} color={app_theme.colors.success} />
                                </View>
                                <View style={styles.timelineContent}>
                                    <TextNormalYambi text={strings.sent} bold />
                                    <TextSmallYambiGray text={moment(message.createdAt).format('LLL')} />
                                </View>
                            </View>

                            <View style={styles.timelineItem}>
                                <View style={[
                                    styles.statusIcon,
                                    { backgroundColor: message.receivedAt ? app_theme.colors.success + '20' : app_theme.colors.gray + '20' }
                                ]}>
                                    <FontAwesome6
                                        name="check-double"
                                        size={13}
                                        color={message.receivedAt ? app_theme.colors.success : app_theme.colors.gray}
                                    />
                                </View>
                                <View style={styles.timelineContent}>
                                    <TextNormalYambi text={strings.received} bold />
                                    <TextSmallYambiGray text={message.receivedAt ? moment(message.receivedAt).format('LLL') : '-'} />
                                </View>
                            </View>

                            <View style={styles.timelineItem}>
                                <View style={[
                                    styles.statusIcon,
                                    { backgroundColor: message.readAt ? app_theme.colors.high_color + '20' : app_theme.colors.gray + '20' }
                                ]}>
                                    <FontAwesome6
                                        name="eye"
                                        size={13}
                                        color={message.readAt ? app_theme.colors.high_color : app_theme.colors.gray}
                                    />
                                </View>
                                <View style={styles.timelineContent}>
                                    <TextNormalYambi text={strings.seen} bold />
                                    <TextSmallYambiGray text={message.readAt ? moment(message.readAt).format('LLL') : '-'} />
                                </View>
                            </View>

                            {message.message_type === 1 ? (
                                <View style={styles.timelineItem}>
                                    <View style={[
                                        styles.statusIcon,
                                        { backgroundColor: message.playedAt ? app_theme.colors.high_color2 + '20' : app_theme.colors.gray + '20' }
                                    ]}>
                                        <FontAwesome6
                                            name="circle-play"
                                            size={13}
                                            color={message.playedAt ? app_theme.colors.high_color2 : app_theme.colors.gray}
                                        />
                                    </View>
                                    <View style={styles.timelineContent}>
                                        <TextNormalYambi text={strings.played} bold />
                                        <TextSmallYambiGray text={message.playedAt ? moment(message.playedAt).format('LLL') : '-'} />
                                    </View>
                                </View>
                            ) : null}
                        </View>

                        {/* Technical Metadata Card */}
                        <View style={[styles.card, { backgroundColor: app_theme.colors.card || app_theme.colors.background, borderColor: app_theme.colors.border }]}>
                            <View style={styles.metaRow}>
                                <TextSmallYambiGray text={strings.platform} />
                                <View style={[styles.chip, { backgroundColor: app_theme.colors.border + '60' }]}>
                                    <MaterialIcons name="devices" size={14} color={app_theme.colors.text} style={{ marginRight: 4 }} />
                                    <TextSmallYambi bold text={message.platform || 'Mobile'} />
                                </View>
                            </View>
                        </View>
                    </Animated.View>
                ) : null}
            </ScrollView>

            {/* Edit Message Footer Bar when flag === 1 */}
            {flag === 1 ? (
                <View style={[
                    styles.editFooter,
                    {
                        borderColor: app_theme.colors.border,
                        backgroundColor: app_theme.colors.background
                    }
                ]}>
                    <TextInput
                        multiline
                        style={[
                            styles.textInput,
                            {
                                fontSize: app_description.general_font_size,
                                color: app_theme.colors.text,
                                backgroundColor: app_theme.colors.border + '20',
                                borderColor: app_theme.colors.border
                            }
                        ]}
                        placeholder={strings.message}
                        value={edited_message}
                        onChangeText={(text) => setEdited_message(text)}
                        placeholderTextColor={app_theme.colors.gray}
                    />

                    <Animated.View entering={FadeIn} exiting={FadeOut}>
                        <Pressable
                            onPress={EditTheMessage}
                            disabled={loading || message.main_text_message.trim() === edited_message.trim()}
                            style={({ pressed }) => [
                                styles.sendButton,
                                {
                                    backgroundColor: message.main_text_message.trim() !== edited_message.trim()
                                        ? app_theme.colors.button_background_color
                                        : app_theme.colors.gray,
                                    opacity: pressed ? 0.8 : 1.0
                                }
                            ]}>
                            {!loading ? (
                                <View style={styles.sendButtonContent}>
                                    <FontAwesome6 name="paper-plane" size={14} color={app_theme.colors.button_foreground_color} style={{ marginRight: 6 }} />
                                    <Text style={{ color: app_theme.colors.button_foreground_color, fontWeight: '600' }}>{strings.send}</Text>
                                </View>
                            ) : (
                                <AppActivityIndicator color={app_theme.colors.button_foreground_color} />
                            )}
                        </Pressable>
                    </Animated.View>
                </View>
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 32,
    },
    previewCard: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
        marginBottom: 16,
    },
    previewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    previewBody: {
        marginTop: 4,
    },
    captionBox: {
        marginTop: 10,
        padding: 10,
        borderRadius: 8,
    },
    card: {
        borderRadius: 14,
        borderWidth: 1,
        padding: 16,
        marginBottom: 16,
    },
    cardTitle: {
        marginBottom: 14,
    },
    participantRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
    },
    avatarIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    participantInfo: {
        flex: 1,
    },
    divider: {
        height: 1,
        marginVertical: 10,
        opacity: 0.5,
    },
    timelineItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    statusIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    timelineContent: {
        flex: 1,
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    editFooter: {
        borderTopWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    textInput: {
        flex: 1,
        minHeight: 44,
        maxHeight: 120,
        borderRadius: 22,
        borderWidth: 1,
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 10,
        marginRight: 10,
    },
    sendButton: {
        height: 44,
        paddingHorizontal: 18,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});

export default MessageInfo;
