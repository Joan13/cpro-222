import { View, ScrollView, TextInput, Image, Pressable, KeyboardAvoidingView, Platform, Dimensions, ActivityIndicator, Text, FlatList } from "react-native";
import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from "../../store/app/hooks";
import { strings } from "../../lang/lang";
import { YambiText, TextNormalYambiGray } from "../../components/app/Text";
import ModalApp from "../../components/app/ModalApp";
import { setShowModalApp } from "../../store/reducers/appSlice";
import { remote_host } from "../../../GlobalVariables";
import axios from "axios";
import { NavProps, TStory } from "../../types/types";
import { useQuery, useRealm } from "@realm/react";
import { UserContacts } from "../../store/database/Models";
import { IconApp } from "../../components/app/IconApp";
import { FlashList } from "@shopify/flash-list";
import ImagePicker from '../../utils/imagePicker';
import NewStoryImagesList from "../../components/lists/stories/NewStoryImagesList";
import BottomSheet from "../../components/app/BottomSheet";
import ButtonNormal from "../../components/app/ButtonNormal";
import { MediaGallery } from "../../components/lists/gallery/MediaGallery";

const BACKGROUND_COLORS = [
    '#1D2A44', // Navy
    '#000000', // Black
    '#FFFFFF', // White
    '#4A5568', // Slate Gray
    '#E53E3E', // Red
    '#DD6B20', // Orange
    '#D69E2E', // Yellow
    '#38A169', // Green
    '#319795', // Teal
    '#3182CE', // Blue
    '#805AD5', // Purple
    '#D53F8C', // Pink
    '#742A2A', // Dark Red
    '#22543D', // Dark Green
    '#2B6CB0'  // Royal Blue
];

const FOREGROUND_COLORS = [
    '#FFFFFF', // White
    '#000000', // Black
    '#E2E8F0', // Light Gray
    '#CBD5E0', // Soft Silver Gray
    '#A0AEC0', // Medium Light Gray
    '#4A5568', // Slate Gray
    '#FEB2B2', // Light Red / Soft Coral
    '#FBD38D', // Light Warm Gold
    '#FAF089', // Bright Light Yellow
    '#9AE6B4', // Light Mint / Pastel Green
    '#48BB78', // Soft Green
    '#81E6D9', // Light Aqua / Teal
    '#63B3ED', // Light Sky Blue
    '#90CDF4', // Soft Pastel Blue
    '#D6BCFA', // Light Lavender / Purple
    '#FBB6CE', // Light Soft Pink
];

const isLightHex = (hex: string) => {
    const lightList = [
        '#FFFFFF', '#E2E8F0', '#CBD5E0', '#FEB2B2', '#FBD38D',
        '#FAF089', '#9AE6B4', '#81E6D9', '#63B3ED', '#90CDF4',
        '#D6BCFA', '#FBB6CE', '#D69E2E'
    ];
    return lightList.includes(hex.toUpperCase());
};

const NewStory = ({ navigation, route }: NavProps) => {
    const theme = useAppSelector(state => state.app_theme);
    const user_data = useAppSelector(state => state.user_data);
    const [showInternetError, setShowInternetError] = useState<boolean>(false);

    const initialFlag = route.params?.flag ?? 0;
    const [storyType, setStoryType] = useState<number>(initialFlag); // 0 = text, 1 = photo

    const [photos, setPhotos] = useState([]);
    const [captions, setCaptions] = useState<{ [key: number]: string }>({});
    const [loadingUploadAll, setLoadingUploadAll] = useState<boolean>(false);
    const [textStatus, setTextStatus] = useState<string>("");
    const [loadingTextStatus, setLoadingTextStatus] = useState<boolean>(false);

    // Styling properties for text stories
    const [bgColor, setBgColor] = useState<string>('#1D2A44');
    const [fgColor, setFgColor] = useState<string>('#FFFFFF');
    const [showBgColorSheet, setShowBgColorSheet] = useState<boolean>(false);
    const [showTextColorSheet, setShowTextColorSheet] = useState<boolean>(false);
    const [fontWeight, setFontWeight] = useState<'normal' | 'bold' | '900'>('bold');
    const [fontStyle, setFontStyle] = useState<'normal' | 'italic'>('normal');
    const [textAlign, setTextAlign] = useState<'center' | 'left' | 'right'>('center');

    const dispatch = useAppDispatch();
    const realm = useRealm();

    const contacts = useQuery(
        UserContacts, ccs => {
            return ccs.filtered('phone_number != $0 && user_active != $1', user_data.phone_number, 0);
        }, []).map(cc => cc.phone_number);

    const { width } = Dimensions.get('window');

    const pick_profile = () => {
        ImagePicker.openPicker({
            width: 800,
            height: 800,
            cropping: true,
            quality: 0.7,
            mediaType: "photo",
            multiple: true
        }).then(images => {
            setPhotos(images as never);
            setStoryType(1);
        }).catch(() => { });
    };

    const handleSelectGalleryPhotos = (selectedAssets: any[]) => {
        const formatted = selectedAssets.map(asset => ({
            path: asset.uri,
            width: asset.width,
            height: asset.height,
            mime: 'image/jpeg',
        }));
        setPhotos(formatted as never);
        setStoryType(1);
    };

    useEffect(() => {
        if (photos.length !== 0) {
            navigation.setOptions({
                headerShown: false,
                statusBarHidden: true,
                statusBarStyle: theme.statusbar,
                statusBarColor: theme.colors.button_background_color
            });
        } else {
            navigation.setOptions({
                headerShown: true,
                title: strings.add_status || "Add status"
            });
        }
    }, [photos, storyType, theme]);

    const deleteStatus = (item: any, isPublished = false) => {
        const itemIndex = photos.findIndex((element: any) => element.path === item.path);
        const pp = photos.filter((element: any) => element.path !== item.path);
        setPhotos(pp);

        if (itemIndex !== -1) {
            setCaptions(prev => {
                const next = { ...prev };
                delete next[itemIndex];
                return next;
            });
        }

        if (pp.length === 0) {
            navigation.setOptions({
                headerShown: true,
                statusBarHidden: false,
                statusBarStyle: theme.statusbar,
                statusBarColor: theme.colors.button_background_color,
                title: strings.add_status || "Add status"
            });
            if (isPublished) {
                navigation.goBack();
            }
        }
    };

    const handleUploadAllPhotos = async () => {
        if (photos.length === 0 || loadingUploadAll) return;
        setLoadingUploadAll(true);

        try {
            const uploadPromises = photos.map((item: any, idx: number) => {
                const filename = Date.now() + '-' + Math.round(Math.random() * 1E9) + '-' + idx;
                const base_url = remote_host + "/yambi/API/upload_status_photo";
                const formData = new FormData();
                formData.append('assemble', user_data.phone_number);
                formData.append('caption', (captions[idx] || '').trim());
                formData.append('privacy', "0");
                formData.append('reposts', "[]");
                formData.append('only_with', JSON.stringify(contacts));
                formData.append('image', {
                    type: 'image/jpg',
                    uri: item.path,
                    name: filename + 'status.jpg'
                } as any);

                return axios.post(base_url, formData, {
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'multipart/form-data'
                    }
                });
            });

            const responses = await Promise.all(uploadPromises);

            realm.write(() => {
                responses.forEach(res => {
                    if (res.data && res.data.message === "1" && res.data.story) {
                        try {
                            realm.create('Stories', res.data.story, true);
                        } catch (e) { }
                    }
                });
            });

            setLoadingUploadAll(false);
            setPhotos([]);
            setCaptions({});
            navigation.goBack();
        } catch (error) {
            console.error("Error uploading all status photos:", error);
            setLoadingUploadAll(false);
            setShowInternetError(true);
            dispatch(setShowModalApp(true));
        }
    };

    const publishTextStatus = () => {
        if (!textStatus.trim() || loadingTextStatus) return;

        setLoadingTextStatus(true);
        const stylesObj = {
            backgroundColor: bgColor,
            foregroundColor: fgColor,
            fontWeight,
            fontStyle,
            textAlign
        };

        const formData = new FormData();
        formData.append('assemble', user_data.phone_number);
        formData.append('caption', textStatus.trim());
        formData.append('text', textStatus.trim());
        formData.append('styles', JSON.stringify(stylesObj));
        formData.append('privacy', "0");
        formData.append('reposts', "[]");
        formData.append('only_with', JSON.stringify(contacts));

        axios.post(remote_host + "/yambi/API/upload_status_photo", formData, {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'multipart/form-data'
            }
        })
            .then(response => {
                setLoadingTextStatus(false);
                if (response.data.message === "1" && response.data.story) {
                    const story: TStory = response.data.story;
                    realm.write(() => {
                        try {
                            realm.create('Stories', story, true);
                        } catch (e) { }
                    });
                    navigation.goBack();
                } else {
                    setShowInternetError(true);
                    dispatch(setShowModalApp(true));
                }
            })
            .catch(() => {
                setLoadingTextStatus(false);
                setShowInternetError(true);
                dispatch(setShowModalApp(true));
            });
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: photos.length === 0 ? theme.colors.background : "#000000" }}
            behavior={photos.length === 0 && Platform.OS === 'ios' ? 'padding' : undefined}
        >
            {showInternetError ? (
                <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowInternetError(false); }} singleButton title={strings.error}>
                    <TextNormalYambiGray text={strings.connection_failed} />
                </ModalApp>
            ) : null}

            {photos.length === 0 ? (
                <View style={{ flex: 1, paddingTop: 0 }}>
                    {/* <View style={{
                        flexDirection: 'row',
                        backgroundColor: theme.colors.card,
                        borderRadius: 14,
                        padding: 4,
                        marginHorizontal: 12,
                        marginBottom: 8,
                        borderWidth: 1,
                        borderColor: theme.colors.border
                    }}>
                        <ButtonNormal
                            normal={storyType === 0}
                            ghost={storyType !== 0}
                            title={strings.text || "Text"}
                            onPress={() => setStoryType(0)}
                            iconName="edit-3"
                            iconPack="FI"
                            lowercase
                            textColor={storyType === 0 ? theme.colors.button_foreground_color : theme.colors.gray}
                            styles={{ flex: 1, borderRadius: 10 }}
                        />
                        <ButtonNormal
                            normal={storyType === 1}
                            ghost={storyType !== 1}
                            title={strings.gallery || "Gallery"}
                            onPress={() => {
                                setStoryType(1);
                            }}
                            iconName="camera"
                            iconPack="FI"
                            lowercase
                            textColor={storyType === 1 ? theme.colors.button_foreground_color : theme.colors.gray}
                            styles={{ flex: 1, borderRadius: 10 }}
                        />
                    </View> */}

                    {storyType === 0 ? (
                        /* Text Story Board */
                        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 12 }} keyboardShouldPersistTaps="handled">
                            <View style={{ flex: 1 }}>
                                {/* Live Preview Card */}
                                <View style={{
                                    width: '100%',
                                    minHeight: 220,
                                    backgroundColor: bgColor,
                                    borderRadius: 20,
                                    padding: 20,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginBottom: 20,
                                    borderWidth: 1,
                                    borderColor: theme.colors.border,
                                    elevation: 3
                                }}>
                                    <TextInput
                                        placeholder={strings.whats_on_your_mind || "What's on your mind?"}
                                        placeholderTextColor={fgColor + '80'}
                                        multiline
                                        value={textStatus}
                                        onChangeText={setTextStatus}
                                        style={{
                                            width: '100%',
                                            color: fgColor,
                                            fontSize: 22,
                                            fontWeight: fontWeight as any,
                                            fontStyle: fontStyle,
                                            textAlign: textAlign,
                                            padding: 0
                                        }}
                                    />
                                </View>

                                {/* Color Selection Buttons */}
                                <YambiText
                                    text={strings.colors || "Colors"}
                                    style={{ color: theme.colors.text, fontSize: 14, fontWeight: 'bold', marginBottom: 10 }}
                                />
                                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 18 }}>
                                    {/* Background Color Trigger Button */}
                                    <Pressable
                                        onPress={() => setShowBgColorSheet(true)}
                                        style={{
                                            flex: 1,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            backgroundColor: theme.colors.card,
                                            padding: 12,
                                            borderRadius: 14,
                                            borderWidth: 1,
                                            borderColor: theme.colors.border,
                                        }}>
                                        <View style={{
                                            width: 28,
                                            height: 28,
                                            borderRadius: 14,
                                            backgroundColor: bgColor,
                                            marginRight: 10,
                                            borderWidth: bgColor === '#FFFFFF' ? 1 : 0,
                                            borderColor: '#CBD5E0',
                                        }} />
                                        <View style={{ flex: 1 }}>
                                            <YambiText
                                                text={strings.background_color || "Background Color"}
                                                bold
                                                size="small"
                                                style={{ color: theme.colors.text }}
                                            />
                                        </View>
                                        <IconApp pack="FI" name="chevron-down" size={16} color={theme.colors.gray} />
                                    </Pressable>

                                    {/* Text Color Trigger Button */}
                                    <Pressable
                                        onPress={() => setShowTextColorSheet(true)}
                                        style={{
                                            flex: 1,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            backgroundColor: theme.colors.card,
                                            padding: 12,
                                            borderRadius: 14,
                                            borderWidth: 1,
                                            borderColor: theme.colors.border,
                                        }}>
                                        <View style={{
                                            width: 28,
                                            height: 28,
                                            borderRadius: 14,
                                            backgroundColor: fgColor,
                                            marginRight: 10,
                                            borderWidth: fgColor === '#FFFFFF' ? 1 : 0,
                                            borderColor: '#CBD5E0',
                                        }} />
                                        <View style={{ flex: 1 }}>
                                            <YambiText
                                                text={strings.text_color || "Text Color"}
                                                bold
                                                size="small"
                                                style={{ color: theme.colors.text }}
                                            />
                                        </View>
                                        <IconApp pack="FI" name="chevron-down" size={16} color={theme.colors.gray} />
                                    </Pressable>
                                </View>

                                {/* Background Color Bottom Sheet */}
                                <BottomSheet
                                    visible={showBgColorSheet}
                                    onClose={() => setShowBgColorSheet(false)}
                                    title={strings.select_background_color || "Select Background Color"}
                                >
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', paddingVertical: 12 }}>
                                        {BACKGROUND_COLORS.map((c, i) => (
                                            <Pressable
                                                key={i}
                                                onPress={() => {
                                                    setBgColor(c);
                                                }}
                                                onTouchEnd={() => {
                                                    setBgColor(c);
                                                }}
                                                style={{
                                                    width: 44,
                                                    height: 44,
                                                    borderRadius: 22,
                                                    backgroundColor: c,
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    borderWidth: isLightHex(c) ? 1 : 0,
                                                    borderColor: '#CBD5E0',
                                                    transform: [{ scale: bgColor === c ? 1.15 : 1 }]
                                                }}>
                                                {bgColor === c && (
                                                    <IconApp pack="FI" name="check" size={20} color={isLightHex(c) ? '#000000' : '#FFFFFF'} />
                                                )}
                                            </Pressable>
                                        ))}
                                    </View>
                                </BottomSheet>

                                {/* Text Color Bottom Sheet */}
                                <BottomSheet
                                    visible={showTextColorSheet}
                                    onClose={() => setShowTextColorSheet(false)}
                                    title={strings.select_text_color || "Select Text Color"}
                                >
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', paddingVertical: 12 }}>
                                        {FOREGROUND_COLORS.map((c, i) => (
                                            <Pressable
                                                key={i}
                                                onPress={() => {
                                                    setFgColor(c);
                                                }}
                                                onTouchEnd={() => {
                                                    setFgColor(c);
                                                }}
                                                style={{
                                                    width: 44,
                                                    height: 44,
                                                    borderRadius: 22,
                                                    backgroundColor: c,
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    borderWidth: isLightHex(c) ? 1 : 0,
                                                    borderColor: '#CBD5E0',
                                                    transform: [{ scale: fgColor === c ? 1.15 : 1 }]
                                                }}>
                                                {fgColor === c && (
                                                    <IconApp pack="FI" name="check" size={20} color={isLightHex(c) ? '#000000' : '#FFFFFF'} />
                                                )}
                                            </Pressable>
                                        ))}
                                    </View>
                                </BottomSheet>

                                {/* Font Weight & Style Controls */}
                                <YambiText
                                    text={strings.text_style_alignment || "Text Style & Alignment"}
                                    style={{ color: theme.colors.text, marginBottom: 10 }}
                                />
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                                    {/* Weight option */}
                                    <View style={{ flexDirection: 'row', backgroundColor: theme.colors.card, borderRadius: 12, padding: 3, borderWidth: 1, borderColor: theme.colors.border }}>
                                        {(['normal', 'bold', '900'] as const).map(w => (
                                            <Pressable
                                                key={w}
                                                onPress={() => setFontWeight(w)}
                                                style={{
                                                    paddingHorizontal: 12,
                                                    paddingVertical: 6,
                                                    borderRadius: 9,
                                                    backgroundColor: fontWeight === w ? (theme.colors.button_background_color || theme.colors.high_color) : 'transparent'
                                                }}>
                                                <Text style={{
                                                    color: fontWeight === w ? theme.colors.button_foreground_color : theme.colors.text,
                                                    fontWeight: w as any,
                                                    fontSize: 13
                                                }}>
                                                    {w === 'normal' ? (strings.regular || 'Regular') : w === 'bold' ? (strings.bold || 'Bold') : (strings.heavy || 'Heavy')}
                                                </Text>
                                            </Pressable>
                                        ))}
                                    </View>

                                    {/* Alignment option */}
                                    <View style={{ flexDirection: 'row', backgroundColor: theme.colors.card, borderRadius: 12, padding: 3, borderWidth: 1, borderColor: theme.colors.border }}>
                                        {(['left', 'center', 'right'] as const).map(align => (
                                            <Pressable
                                                key={align}
                                                onPress={() => setTextAlign(align)}
                                                style={{
                                                    paddingHorizontal: 10,
                                                    paddingVertical: 6,
                                                    borderRadius: 9,
                                                    backgroundColor: textAlign === align ? (theme.colors.button_background_color || theme.colors.high_color) : 'transparent'
                                                }}>
                                                <IconApp
                                                    pack="FI"
                                                    name={align === 'left' ? 'align-left' : align === 'center' ? 'align-center' : 'align-right'}
                                                    size={16}
                                                    color={textAlign === align ? theme.colors.button_foreground_color : theme.colors.text}
                                                />
                                            </Pressable>
                                        ))}
                                    </View>
                                </View>

                                {/* Submit Button */}
                                {textStatus.trim().length > 0 && (
                                    <ButtonNormal
                                        normal
                                        title={strings.publish_status || "Publish Status"}
                                        onPress={publishTextStatus}
                                        loading={loadingTextStatus}
                                        iconName="send"
                                        iconPack="FI"
                                        styles={{ marginBottom: 30 }}
                                    />
                                )}
                            </View>
                        </ScrollView>
                    ) : (
                        /* Native In-App Photo Gallery */
                        <View style={{ flex: 1, position: 'relative' }}>
                            <MediaGallery
                                multiple
                                showSelectAll={false}
                                enableEditing={true}
                                onConfirm={handleSelectGalleryPhotos}
                            />
                        </View>
                    )}
                </View>
            ) : (
                /* Photo Editor View */
                <FlatList
                    style={{ flex: 1, width: '100%', height: '100%', backgroundColor: '#000000' }}
                    data={photos}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item, index) => item.path || index.toString()}
                    keyboardShouldPersistTaps="handled"
                    renderItem={({ item, index }: { item: any, index: number }) => (
                        <NewStoryImagesList
                            item={item}
                            index={index}
                            totalCount={photos.length}
                            caption={captions[index] || ""}
                            onChangeCaption={(text) => setCaptions(prev => ({ ...prev, [index]: text }))}
                            onSendAll={handleUploadAllPhotos}
                            loading={loadingUploadAll}
                            onGoBack={() => setPhotos([])}
                            onDeleteStatus={(isPublished?: boolean) => deleteStatus(item, isPublished)}
                            onReadyStatus={() => { }}
                        />
                    )}
                />
            )}
        </KeyboardAvoidingView>
    );
};

export default NewStory;