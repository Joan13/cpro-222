import React, { useEffect, useState, useRef } from 'react';
import { View, Pressable, useWindowDimensions, Platform, TextInput, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as MediaLibrary from 'expo-media-library';
import { useIsFocused } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../store/app/hooks';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { strings } from '../../lang/lang';
import { Image as ExpoImage } from 'expo-image';
import { NavProps, TChat, TMessage } from '../../types/types';
import { UserChats } from '../../store/database/Models';
import moment from 'moment';
import { useRealm } from '@realm/react';
import { setResponseTo } from '../../store/reducers/appSlice';
import { TextNormalYambi } from '../app/Text';
import { randomString, renderDateUpToMilliseconds } from '../../../GlobalVariables';
import { PhotoEditor } from '../lists/gallery/PhotoEditor';
import { ProcessedPhoto } from '../../types/gallery';

const SendPictureMessage = ({ navigation, route }: NavProps) => {
    const { user } = route.params;
    const dispatch = useAppDispatch();
    const user_data = useAppSelector(state => state.user_data);
    const app_theme = useAppSelector(state => state.app_theme);
    const response_to = useAppSelector(state => state.app.response_to);
    const app_description = useAppSelector(state => state.persisted_app.app_description);

    const [profiles, setProfiles] = useState<string[]>([]);
    const [activeIndex, setActiveIndex] = useState<number>(0);
    const [captions, setCaptions] = useState<{ [key: number]: string }>({});
    const [selectedAssets, setSelectedAssets] = useState<MediaLibrary.Asset[]>([]);
    const [showEditor, setShowEditor] = useState<boolean>(false);

    const isFocused = useIsFocused();
    const hasOpenedGalleryRef = useRef(false);
    const width = useWindowDimensions().width;
    const realm = useRealm();

    const sendMessage = () => {
        if (profiles.length > 0) {
            Haptics.selectionAsync();

            profiles.forEach((photoUri, idx) => {
                const time = moment(new Date()).add(idx, 'milliseconds').format();
                const token = randomString(30) + renderDateUpToMilliseconds() + idx;

                const msg: TMessage = {
                    sender: user_data.phone_number,
                    receiver: user,
                    main_text_message: photoUri,
                    caption: captions[idx] || '',
                    message_type: 2,
                    reactions: '[]',
                    response_to: response_to,
                    message_read: 5,
                    message_effect: 0,
                    read_once: 0,
                    flag: 0,
                    token: token,
                    deleted: 0,
                    platform: Platform.OS,
                    createdAt: time,
                    receivedAt: '',
                    readAt: '',
                    playedAt: '',
                    cc: moment(time).format('DD/MM/YYYY'),
                    alignment: moment().utc().toISOString()
                };

                const existingChat = realm.objectForPrimaryKey<UserChats>('UserChats', user);
                const chat: TChat = {
                    _id: user,
                    phone_number: user,
                    type_chat: existingChat ? existingChat.type_chat : 0,
                    last_message: token,
                    user: user_data.phone_number,
                    flag: existingChat ? existingChat.flag : 0,
                    favorite: existingChat ? (existingChat.favorite ?? 0) : 0,
                    pinned: existingChat ? (existingChat.pinned ?? 0) : 0,
                    chat_read: 0,
                    deleted: 0,
                    chat_effect: existingChat ? existingChat.chat_effect : 0,
                    createdAt: existingChat ? existingChat.createdAt : time,
                    updatedAt: time,
                };

                realm.write(() => {
                    try {
                        realm.create('UsersMessages', msg);
                        realm.create('UserChats', chat, true);
                    } catch (error) { }
                });
            });

            dispatch(setResponseTo(""));
            navigation.goBack();
        }
    };

    const openGallery = () => {
        (navigation as any).navigate('Gallery', {
            multiple: true,
            showSelectAll: false,
            onSelect: (newAssets: MediaLibrary.Asset[]) => {
                if (newAssets && newAssets.length > 0) {
                    setSelectedAssets(prev => {
                        const merged = [...prev, ...newAssets];
                        const unique = merged.filter((a, index, self) =>
                            index === self.findIndex((t) => t.id === a.id || t.uri === a.uri)
                        );
                        return unique;
                    });
                    setShowEditor(true);
                }
            }
        });
    };

    const editCurrentPhoto = () => {
        if (selectedAssets.length > 0) {
            setShowEditor(true);
        } else if (profiles.length > 0) {
            const assets: MediaLibrary.Asset[] = profiles.map((p, i) => ({
                id: `current_photo_${i}`,
                uri: p,
                filename: `photo_${i}.jpg`,
                mediaType: 'photo',
                width: 1080,
                height: 1080,
                creationTime: 0,
                modificationTime: 0
            } as MediaLibrary.Asset));
            setSelectedAssets(assets);
            setShowEditor(true);
        } else {
            openGallery();
        }
    };

    const handleEditorComplete = (processedPhotos: ProcessedPhoto[]) => {
        if (processedPhotos && processedPhotos.length > 0) {
            const uris = processedPhotos.map(p => p.uri);
            setProfiles(uris);
            setActiveIndex(0);
        }
        setShowEditor(false);
    };

    const removePhoto = (indexToRemove: number) => {
        const updatedProfiles = profiles.filter((_, i) => i !== indexToRemove);
        setProfiles(updatedProfiles);

        const updatedCaptions: { [key: number]: string } = {};
        let newIdx = 0;
        profiles.forEach((_, i) => {
            if (i !== indexToRemove) {
                if (captions[i]) {
                    updatedCaptions[newIdx] = captions[i];
                }
                newIdx++;
            }
        });
        setCaptions(updatedCaptions);

        if (activeIndex >= updatedProfiles.length) {
            setActiveIndex(Math.max(0, updatedProfiles.length - 1));
        }
    };

    useEffect(() => {
        if (isFocused) {
            if (!hasOpenedGalleryRef.current) {
                hasOpenedGalleryRef.current = true;
                openGallery();
            } else if (profiles.length === 0 && selectedAssets.length === 0 && !showEditor) {
                navigation.goBack();
            }
        }
    }, [isFocused, profiles.length, selectedAssets.length, showEditor]);

    const activePhoto = profiles[activeIndex] || profiles[0] || "";

    return (
        <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: app_theme.colors.background,
            padding: 10
        }}>
            <View style={{ flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' }}>
                {activePhoto !== "" ? (
                    <ExpoImage
                        style={{
                            flex: 1,
                            width: width,
                        }}
                        contentFit="contain"
                        source={{ uri: activePhoto }}
                    />
                ) : (
                    <Pressable
                        onPress={openGallery}
                        style={{
                            justifyContent: 'center',
                            alignItems: 'center',
                            padding: 20
                        }}
                    >
                        <MaterialIcons name="add-a-photo" size={56} color={app_theme.colors.gray} />
                        <TextNormalYambi
                            text={strings.picture_select || "Select Photo"}
                            styles={{ marginTop: 12, color: app_theme.colors.gray }}
                        />
                    </Pressable>
                )}
            </View>

            {/* Thumbnail Strip for Multiple Images */}
            {profiles.length > 1 && (
                <View style={{ height: 74, width: '100%', marginVertical: 6 }}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 8, alignItems: 'center' }}>
                        {profiles.map((uri, idx) => {
                            const isCurrent = idx === activeIndex;
                            return (
                                <Pressable
                                    key={idx}
                                    onPress={() => setActiveIndex(idx)}
                                    style={{
                                        marginHorizontal: 4,
                                        borderRadius: 8,
                                        borderWidth: isCurrent ? 2 : 1,
                                        borderColor: isCurrent ? app_theme.colors.high_color : app_theme.colors.border,
                                        overflow: 'hidden',
                                        position: 'relative'
                                    }}
                                >
                                    <ExpoImage source={{ uri }} style={{ width: 56, height: 56 }} contentFit="cover" />
                                    <Pressable
                                        onPress={() => removePhoto(idx)}
                                        style={{
                                            position: 'absolute',
                                            top: 2,
                                            right: 2,
                                            backgroundColor: 'rgba(0,0,0,0.6)',
                                            borderRadius: 10,
                                            padding: 2
                                        }}
                                    >
                                        <Ionicons name="close" size={12} color="white" />
                                    </Pressable>
                                </Pressable>
                            );
                        })}
                    </ScrollView>
                </View>
            )}

            {profiles.length > 0 ? (
                <TextInput
                    multiline={true}
                    style={{
                        paddingLeft: 10,
                        paddingTop: 8,
                        height: 50,
                        fontSize: app_description.general_font_size,
                        maxHeight: 80,
                        color: app_theme.colors.text,
                        backgroundColor: app_theme.colors.background,
                        paddingBottom: 8,
                        borderColor: app_theme.colors.border,
                        borderTopWidth: 1,
                        width: '100%'
                    }}
                    placeholder={strings.add_caption}
                    value={captions[activeIndex] || ""}
                    onChangeText={(text) => setCaptions(prev => ({ ...prev, [activeIndex]: text }))}
                    placeholderTextColor={app_theme.colors.gray}
                />
            ) : null}

            <View style={{
                flexDirection: 'row',
                backgroundColor: app_theme.colors.border,
                marginTop: 10,
                borderRadius: 50,
                marginBottom: 40,
                paddingHorizontal: 12,
                paddingVertical: 6
            }}>
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    height: 48
                }}>
                    <Pressable
                        onPress={openGallery}
                        style={{
                            height: 40,
                            flexDirection: 'row',
                            justifyContent: 'center',
                            alignItems: 'center',
                            backgroundColor: app_theme.colors.background,
                            borderRadius: 20,
                            borderColor: app_theme.colors.border,
                            borderWidth: 1,
                            paddingHorizontal: 14
                        }}
                    >
                        <TextNormalYambi
                            text={profiles.length > 0 ? ((strings as any).add || "Add") : (strings.picture_select || "Select Photo")}
                            styles={{ marginRight: 6 }}
                        />
                        <MaterialIcons name="photo-library" size={18} color={app_theme.colors.text} />
                    </Pressable>

                    {profiles.length > 0 ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Pressable
                                onPress={editCurrentPhoto}
                                style={{
                                    height: 40,
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    backgroundColor: app_theme.colors.background,
                                    borderRadius: 20,
                                    borderColor: app_theme.colors.border,
                                    borderWidth: 1,
                                    paddingHorizontal: 14,
                                    marginRight: 10
                                }}
                            >
                                <TextNormalYambi text={strings.edit || "Edit"} styles={{ marginRight: 4 }} />
                                <FontAwesome6 name="wand-magic-sparkles" size={14} color={app_theme.colors.high_color} />
                            </Pressable>

                            <Pressable
                                onPress={sendMessage}
                                style={{
                                    height: 44,
                                    paddingHorizontal: 16,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    backgroundColor: app_theme.colors.button_background_color,
                                    borderRadius: 22,
                                    elevation: 2,
                                    flexDirection: 'row'
                                }}
                            >
                                {profiles.length > 1 && (
                                    <TextNormalYambi
                                        text={`${profiles.length}`}
                                        styles={{ color: app_theme.colors.button_foreground_color, fontWeight: 'bold', marginRight: 4 }}
                                    />
                                )}
                                <Ionicons name="send" size={18} color={app_theme.colors.button_foreground_color} />
                            </Pressable>
                        </View>
                    ) : null}
                </View>
            </View>

            {showEditor && selectedAssets.length > 0 ? (
                <PhotoEditor
                    assets={selectedAssets}
                    visible={showEditor}
                    onClose={() => setShowEditor(false)}
                    onComplete={handleEditorComplete}
                />
            ) : null}
        </View>
    );
};

export default SendPictureMessage;
