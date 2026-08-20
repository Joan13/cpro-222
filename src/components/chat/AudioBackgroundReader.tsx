import React, { useMemo } from 'react';
import { View, Pressable } from 'react-native';
import { useAppSelector } from '../../store/app/hooks';
import { useRealm } from '@realm/react';
import { UsersMessages } from '../../store/database/Models';
import { IconApp } from '../app/IconApp';
import { TextSmallYambiGray, YambiText } from '../app/Text';
import { strings } from '../../lang/lang';
import * as RootNavigation from '../../services/Navigation_ref';
import { useAudioPlayer } from '../../services/AudioPlayerContext';

const formatSeconds = (sec: number) => {
    const totalSec = Math.floor(sec || 0);
    const minutes = Math.floor(totalSec / 60);
    const seconds = totalSec % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

const AudioBackgroundReader = () => {
    const app_theme = useAppSelector(state => state.app_theme);
    const user_data = useAppSelector(state => state.user_data);
    const contacts = useAppSelector(state => state.persisted_app.raw_contacts || state.app.raw_contacts || []);
    const realm = useRealm();

    const {
        activeAudioToken,
        activeAudioUri,
        isPlaying,
        currentTime,
        duration,
        progressPercent,
        playAudio,
        pauseAudio,
        closeAudio,
    } = useAudioPlayer();

    // Query message details corresponding to activeAudioToken or activeAudioUri
    const message = useMemo(() => {
        if (!activeAudioToken && !activeAudioUri) return null;
        try {
            if (activeAudioToken) {
                const msgs = realm.objects(UsersMessages).filtered('token == $0', activeAudioToken);
                if (msgs.length > 0) return msgs[0];
            }
            if (activeAudioUri) {
                const msgs = realm.objects(UsersMessages).filtered('main_text_message == $0', activeAudioUri);
                if (msgs.length > 0) return msgs[0];
            }
            return null;
        } catch (e) {
            return null;
        }
    }, [activeAudioToken, activeAudioUri, realm]);

    // Format sender display name with contact list matching
    const senderName = useMemo(() => {
        if (!message) return '';
        if (message.sender === user_data.phone_number) {
            return `(${strings.you || "You"})`;
        }

        const p2 = (message.sender || '').replace(/\D/g, '');
        if (!p2) return message.sender;

        const matchedContact = contacts.find((c: any) => {
            const numbersToCheck: string[] = [];
            if (c.phoneNumber) numbersToCheck.push(c.phoneNumber);
            if (c.phone_number) numbersToCheck.push(c.phone_number);
            if (c.number) numbersToCheck.push(c.number);
            if (Array.isArray(c.phoneNumbers)) {
                c.phoneNumbers.forEach((pn: any) => {
                    if (pn?.number) numbersToCheck.push(pn.number);
                });
            }

            return numbersToCheck.some(num => {
                const p1 = (num || '').replace(/\D/g, '');
                return p1.length > 5 && (p1.endsWith(p2) || p2.endsWith(p1));
            });
        });

        if (matchedContact) {
            return matchedContact.displayName || (matchedContact as any).name || message.sender;
        }

        return message.sender;
    }, [message, user_data.phone_number, contacts]);

    const handlePlayPause = () => {
        if (!activeAudioUri && !activeAudioToken) return;
        if (isPlaying) {
            pauseAudio();
        } else {
            playAudio(activeAudioToken || activeAudioUri, activeAudioUri);
        }
    };

    const handleClose = () => {
        closeAudio();
    };

    const handleNavigateToChat = () => {
        if (!message) return;
        const targetUser = message.sender === user_data.phone_number ? message.receiver : message.sender;
        RootNavigation.navigate("Inbox", { user: targetUser });
    };

    if (!activeAudioUri || !message) {
        return null;
    }

    const audioLength = formatSeconds(duration);

    return (
        <View style={{ position: 'relative', width: '100%', zIndex: 100 }}>
            <Pressable
                onPress={handleNavigateToChat}
                style={{
                    height: 50,
                    backgroundColor: app_theme.colors.card,
                    borderBottomWidth: 1,
                    borderBottomColor: app_theme.colors.border,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 16,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.06,
                    shadowRadius: 4,
                    elevation: 3,
                }}
            >
                {/* Left: Icon, Sender Name, Audio Message Length */}
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
                    <View
                        style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: app_theme.colors.high_color + '15',
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginRight: 10,
                        }}
                    >
                        <IconApp pack="MC" name="microphone" size={16} color={app_theme.colors.high_color} />
                    </View>

                    <View style={{ flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <YambiText
                                text={senderName}
                                size="normal"
                                color="default"
                                bold
                                numberLines={1}
                                style={{ marginRight: 6 }}
                            />
                            {isPlaying && (
                                <View
                                    style={{
                                        width: 6,
                                        height: 6,
                                        borderRadius: 3,
                                        backgroundColor: '#10B981',
                                    }}
                                />
                            )}
                        </View>
                        <TextSmallYambiGray
                            text={audioLength}
                            styles={{ fontSize: 11, marginTop: 1 }}
                        />
                    </View>
                </View>

                {/* Right: Play/Pause & Close Buttons */}
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Pressable
                        onPress={handlePlayPause}
                        hitSlop={8}
                        style={{
                            width: 34,
                            height: 34,
                            borderRadius: 17,
                            backgroundColor: app_theme.colors.high_color + '20',
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginRight: 8,
                        }}
                    >
                        <IconApp
                            pack="FI"
                            name={isPlaying ? "pause" : "play"}
                            size={16}
                            color={app_theme.colors.high_color}
                        />
                    </Pressable>

                    <Pressable
                        onPress={handleClose}
                        hitSlop={8}
                        style={{
                            width: 34,
                            height: 34,
                            borderRadius: 17,
                            backgroundColor: app_theme.colors.border + '60',
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        <IconApp
                            pack="FI"
                            name="x"
                            size={16}
                            color={app_theme.colors.gray}
                        />
                    </Pressable>
                </View>
            </Pressable>

            {/* Bottom Progress Bar */}
            <View
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    height: 2.5,
                    backgroundColor: app_theme.colors.high_color,
                    width: `${progressPercent}%`,
                }}
            />
        </View>
    );
};

export default AudioBackgroundReader;
