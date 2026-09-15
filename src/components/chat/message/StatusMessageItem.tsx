import React, { memo, useCallback, useMemo } from 'react';
import { View, Pressable } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useRealm } from '@realm/react';
import { Stories } from '../../../store/database/Models';
import { TMessage } from '../../../types/types';
import { useAppSelector } from '../../../store/app/hooks';
import { isPhotoStory } from '../../../utils/storyUtils';
import { isStoryExpired } from '../../../utils/storyCleanup';
import { media_url } from '../../../../GlobalVariables';
import { YambiText } from '../../app/Text';
import { IconApp } from '../../app/IconApp';
import { strings } from '../../../lang/lang';
import * as RootNavigation from '../../../services/Navigation_ref';

interface StatusMessageProps {
    message: TMessage;
    user: string;
}

const StatusMessageItem = ({ message, user }: StatusMessageProps) => {
    const realm = useRealm();
    const app_theme = useAppSelector(state => state.app_theme);
    const user_data = useAppSelector(state => state.user_data);
    const app_description = useAppSelector(state => state.persisted_app.app_description);
    const contacts = useAppSelector(state => state.app.raw_contacts);
    const lang = useAppSelector(state => state.persisted_app.langApp);

    const ShowUserName = useCallback((user_names: string, phone_number: string) => {
        const contact = contacts?.find((cc: any) => cc.phoneNumber === phone_number);
        if (contact !== undefined) {
            return contact.displayName;
        } else {
            return user_names;
        }
    }, [contacts]);

    const storyId = message.response_to || '';

    const story = useMemo(() => {
        if (!storyId) return null;
        try {
            return realm.objectForPrimaryKey<Stories>('Stories', storyId);
        } catch (e) {
            return null;
        }
    }, [realm, storyId]);

    // Check if the story is still active and valid in Realm
    const isStillOnStatus = useMemo(() => {
        if (!story || !story.isValid()) return false;
        return !isStoryExpired(story);
    }, [story]);

    // Check if this status was a photo story
    const isPhoto = useMemo(() => {
        if (story && story.isValid()) {
            return isPhotoStory(story);
        }
        if (message.message_effect === 1) {
            return true;
        }
        if (message.caption) {
            const trimmed = message.caption.trim();
            const lower = trimmed.toLowerCase();
            if (lower === 'photo' || lower === (strings as any).picture?.toLowerCase()) {
                return true;
            }
            if (/\.(jpg|jpeg|png|webp|gif)$/i.test(trimmed) || trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('file:/')) {
                return true;
            }
        }
        return false;
    }, [story, message.message_effect, message.caption]);

    const showPhotoThumbnail = isPhoto && isStillOnStatus && !!story?.main_text;

    // Header label: e.g. "You • Status" or "John • Status"
    const headerTitle = useMemo(() => {
        const name = message.receiver === user_data.phone_number
            ? strings.you
            : ShowUserName(user, user);
        return `${name} • ${(strings as any).status || 'Status'}`;
    }, [message.receiver, user_data.phone_number, ShowUserName, user]);

    // Story image URL if photo is still active
    const photoUri = useMemo(() => {
        if (!story || !story.isValid() || !story.main_text) return '';
        const raw = story.main_text.trim();
        if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('file:/')) {
            return raw;
        }
        return `${media_url}/photo_status/${raw}`;
    }, [story]);

    // Determine status text / caption
    const statusText = useMemo(() => {
        if (story && story.isValid()) {
            if (isPhoto) {
                return story.caption || '';
            }
            return story.caption || story.main_text || '';
        }
        // Fallback when story is not in Realm (or expired)
        if (isPhoto) {
            if (message.caption && !/\.(jpg|jpeg|png|webp|gif)$/i.test(message.caption.trim()) && message.caption.trim().toLowerCase() !== 'photo') {
                return message.caption;
            }
            return '';
        }
        return message.caption || '';
    }, [story, isPhoto, message.caption]);

    const handlePressStatus = () => {
        if (isStillOnStatus && story && story.isValid()) {
            const targetPhone = (story.phone_number && story.phone_number.trim() !== '')
                ? story.phone_number
                : (message.receiver === user_data.phone_number ? user_data.phone_number : (message.receiver || user));
            RootNavigation.navigate('UserStories', {
                phone_number: targetPhone,
                story_id: story._id,
            });
        }
    };

    return (
        <View style={{ flex: 1 }}>
            <Pressable
                onPress={handlePressStatus}
                style={{
                    borderLeftColor: app_theme.colors.high_color,
                    borderLeftWidth: 4,
                    borderRadius: 8,
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                    backgroundColor: app_theme.colors.border + '80',
                    marginTop: 4,
                    marginBottom: 6,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <View style={{ flex: 1, marginRight: showPhotoThumbnail ? 10 : 0 }}>
                    <YambiText
                        size="small"
                        color="#f59f00"
                        text={headerTitle}
                        style={{
                            fontWeight: app_description.small_general_font_weight as any,
                        }}
                    />

                    {isPhoto ? (
                        showPhotoThumbnail ? (
                            statusText ? (
                                <YambiText
                                    size="small"
                                    color="default"
                                    numberLines={2}
                                    text={statusText}
                                    style={{
                                        fontWeight: app_description.small_general_font_weight as any,
                                        marginTop: 2,
                                    }}
                                />
                            ) : (
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                                    <IconApp pack="FI" name="image" size={13} color={app_theme.colors.high_color} styles={{ marginRight: 5 }} />
                                    <YambiText
                                        size="small"
                                        color="default"
                                        text={strings.picture || 'Photo'}
                                        style={{ fontWeight: app_description.small_general_font_weight as any }}
                                    />
                                </View>
                            )
                        ) : (
                            // Photo is no longer on status: only show the word "Photo"
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                                <IconApp pack="FI" name="image" size={14} color={app_theme.colors.high_color} styles={{ marginRight: 6 }} />
                                <YambiText
                                    size="small"
                                    color="default"
                                    text={strings.picture || 'Photo'}
                                    style={{ fontWeight: app_description.small_general_font_weight as any }}
                                />
                            </View>
                        )
                    ) : (
                        // Simple text status: display text normally
                        <YambiText
                            size="small"
                            color="default"
                            numberLines={3}
                            text={statusText || (strings as any).status || 'Status'}
                            style={{
                                fontWeight: app_description.small_general_font_weight as any,
                                marginTop: 2,
                            }}
                        />
                    )}
                </View>

                {showPhotoThumbnail ? (
                    <ExpoImage
                        style={{
                            width: 48,
                            height: 48,
                            borderRadius: 6,
                            backgroundColor: '#00000015',
                        }}
                        contentFit="cover"
                        source={{ uri: photoUri }}
                    />
                ) : null}
            </Pressable>

            {/* Reply text message */}
            <YambiText
                formatYambiText={true}
                text={message.main_text_message.trim()}
                color={message.sender === user_data.phone_number ? app_theme.colors.chat_sent_foreground : app_theme.colors.chat_received_foreground}
                linkColor={app_theme.colors.high_color}
                style={{
                    flex: 1,
                    marginRight: message.main_text_message.length < 35 ? (message.sender === user_data.phone_number ? (lang === 'en' ? 85 : 75) : (lang === 'en' ? 60 : 50)) : 10,
                    marginBottom: message.main_text_message.length < 35 ? -12 : 0,
                    fontWeight: message.receiver === user_data.phone_number ? app_description.received_messages_font_weight : (app_description.sent_messages_font_weight as any),
                    fontSize: message.receiver === user_data.phone_number ? app_description.received_messages_font_size : app_description.sent_messages_font_size,
                    marginTop: 2,
                }}
            />
        </View>
    );
};

export default memo(StatusMessageItem);
