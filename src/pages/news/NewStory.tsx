import { View, ScrollView, TextInput, Image, Text, Pressable, KeyboardAvoidingView, Platform, Dimensions, ActivityIndicator } from "react-native";
import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from "../../store/app/hooks";
import { strings } from "../../lang/lang";
import { TextNormalYambiGray } from "../../components/app/Text";
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

const COLOR_PALETTE = [
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

const NewStory = ({ navigation, route }: NavProps) => {
    const theme = useAppSelector(state => state.app_theme);
    const user_data = useAppSelector(state => state.user_data);
    const [showInternetError, setShowInternetError] = useState<boolean>(false);
    
    const initialFlag = route.params?.flag ?? 0;
    const [storyType, setStoryType] = useState<number>(initialFlag); // 0 = text, 1 = photo

    const [photos, setPhotos] = useState([]);
    const [textStatus, setTextStatus] = useState<string>("");
    const [loadingTextStatus, setLoadingTextStatus] = useState<boolean>(false);

    // Styling properties for text stories
    const [bgColor, setBgColor] = useState<string>('#1D2A44');
    const [fgColor, setFgColor] = useState<string>('#FFFFFF');
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
                title: storyType === 0 ? (strings.create_status || "Create Status") : (strings.pick_photo_for_status || "Select Photo")
            });
        }
    }, [photos, storyType, theme]);

    const deleteStatus = (item: any) => {
        const pp = photos.filter((element: any) => element.path !== item.path);
        setPhotos(pp);

        if (pp.length === 0) {
            navigation.setOptions({
                headerShown: true,
                statusBarHidden: false,
                statusBarStyle: theme.statusbar,
                statusBarColor: theme.colors.button_background_color
            });
            navigation.goBack();
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
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            {showInternetError ? (
                <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowInternetError(false); }} singleButton title={strings.error}>
                    <TextNormalYambiGray text={strings.connection_failed} />
                </ModalApp>
            ) : null}

            {photos.length === 0 ? (
                <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16 }} keyboardShouldPersistTaps="handled">
                    {/* Story Type Selector Tabs */}
                    <View style={{
                        flexDirection: 'row',
                        backgroundColor: theme.colors.card,
                        borderRadius: 14,
                        padding: 4,
                        marginBottom: 16,
                        borderWidth: 1,
                        borderColor: theme.colors.border
                    }}>
                        <Pressable
                            onPress={() => setStoryType(0)}
                            style={{
                                flex: 1,
                                paddingVertical: 10,
                                borderRadius: 10,
                                backgroundColor: storyType === 0 ? (theme.colors.button_background_color || theme.colors.high_color) : 'transparent',
                                alignItems: 'center',
                                flexDirection: 'row',
                                justifyContent: 'center'
                            }}>
                            <IconApp pack="FI" name="edit-3" size={16} color={storyType === 0 ? theme.colors.button_foreground_color : theme.colors.gray} />
                            <Text style={{
                                color: storyType === 0 ? theme.colors.button_foreground_color : theme.colors.gray,
                                fontWeight: 'bold',
                                fontSize: 14,
                                marginLeft: 8
                            }}>
                                {strings.create_status || "Text Story"}
                            </Text>
                        </Pressable>

                        <Pressable
                            onPress={() => {
                                setStoryType(1);
                                pick_profile();
                            }}
                            style={{
                                flex: 1,
                                paddingVertical: 10,
                                borderRadius: 10,
                                backgroundColor: storyType === 1 ? (theme.colors.button_background_color || theme.colors.high_color) : 'transparent',
                                alignItems: 'center',
                                flexDirection: 'row',
                                justifyContent: 'center'
                            }}>
                            <IconApp pack="FI" name="camera" size={16} color={storyType === 1 ? theme.colors.button_foreground_color : theme.colors.gray} />
                            <Text style={{
                                color: storyType === 1 ? theme.colors.button_foreground_color : theme.colors.gray,
                                fontWeight: 'bold',
                                fontSize: 14,
                                marginLeft: 8
                            }}>
                                {strings.send_photo || "Photo Story"}
                            </Text>
                        </Pressable>
                    </View>

                    {storyType === 0 ? (
                        /* Text Story Board */
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

                            {/* Background Colors Section */}
                            <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: 'bold', marginBottom: 10 }}>
                                Background Color
                            </Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                                {COLOR_PALETTE.map((c, i) => (
                                    <Pressable
                                        key={i}
                                        onPress={() => setBgColor(c)}
                                        style={{
                                            width: 38,
                                            height: 38,
                                            borderRadius: 19,
                                            backgroundColor: c,
                                            marginRight: 10,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            borderWidth: c === '#FFFFFF' ? 1 : 0,
                                            borderColor: '#CBD5E0',
                                            transform: [{ scale: bgColor === c ? 1.15 : 1 }]
                                        }}>
                                        {bgColor === c && (
                                            <IconApp pack="FI" name="check" size={18} color={c === '#FFFFFF' || c === '#D69E2E' ? '#000000' : '#FFFFFF'} />
                                        )}
                                    </Pressable>
                                ))}
                            </ScrollView>

                            {/* Foreground / Text Colors Section */}
                            <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: 'bold', marginBottom: 10 }}>
                                Text Color
                            </Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                                {COLOR_PALETTE.map((c, i) => (
                                    <Pressable
                                        key={i}
                                        onPress={() => setFgColor(c)}
                                        style={{
                                            width: 38,
                                            height: 38,
                                            borderRadius: 19,
                                            backgroundColor: c,
                                            marginRight: 10,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            borderWidth: c === '#FFFFFF' ? 1 : 0,
                                            borderColor: '#CBD5E0',
                                            transform: [{ scale: fgColor === c ? 1.15 : 1 }]
                                        }}>
                                        {fgColor === c && (
                                            <IconApp pack="FI" name="check" size={18} color={c === '#FFFFFF' || c === '#D69E2E' ? '#000000' : '#FFFFFF'} />
                                        )}
                                    </Pressable>
                                ))}
                            </ScrollView>

                            {/* Font Weight & Style Controls */}
                            <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: 'bold', marginBottom: 10 }}>
                                Text Style & Alignment
                            </Text>
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
                                                {w === 'normal' ? 'Regular' : w === 'bold' ? 'Bold' : 'Heavy'}
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
                                <Pressable
                                    onPress={publishTextStatus}
                                    disabled={loadingTextStatus}
                                    style={{
                                        height: 48,
                                        borderRadius: 24,
                                        backgroundColor: theme.colors.button_background_color,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        flexDirection: 'row',
                                        marginBottom: 30
                                    }}>
                                    {loadingTextStatus ? (
                                        <ActivityIndicator color={theme.colors.button_foreground_color} size="small" />
                                    ) : (
                                        <>
                                            <Text style={{ color: theme.colors.button_foreground_color, fontSize: 15, fontWeight: 'bold', marginRight: 8 }}>
                                                {strings.publish_status || "Publish Status"}
                                            </Text>
                                            <IconApp pack="FI" name="send" size={16} color={theme.colors.button_foreground_color} />
                                        </>
                                    )}
                                </Pressable>
                            )}
                        </View>
                    ) : (
                        /* Photo Story Picker Prompt */
                        <View style={{
                            backgroundColor: theme.colors.card,
                            borderRadius: 20,
                            padding: 30,
                            alignItems: 'center',
                            borderWidth: 1,
                            borderColor: theme.colors.border,
                            marginTop: 20
                        }}>
                            <Pressable
                                onPress={pick_profile}
                                style={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: 40,
                                    backgroundColor: theme.colors.high_color + '15',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginBottom: 16
                                }}>
                                <IconApp name="camera-plus" pack="MC" size={42} color={theme.colors.high_color} />
                            </Pressable>

                            <Text style={{ color: theme.colors.high_color, fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 }}>
                                {strings.pick_photo_for_status || "Pick Photo for Status"}
                            </Text>

                            <Pressable
                                onPress={pick_profile}
                                style={{
                                    marginTop: 10,
                                    paddingHorizontal: 24,
                                    paddingVertical: 12,
                                    borderRadius: 24,
                                    backgroundColor: theme.colors.button_background_color
                                }}>
                                <Text style={{ color: theme.colors.button_foreground_color, fontWeight: 'bold', fontSize: 14 }}>
                                    Open Gallery
                                </Text>
                            </Pressable>
                        </View>
                    )}
                </ScrollView>
            ) : (
                /* Photo Editor View */
                <FlashList
                    estimatedItemSize={width}
                    data={photos}
                    pagingEnabled
                    keyboardShouldPersistTaps="handled"
                    renderItem={({ item, index }: { item: any, index: number }) => (
                        <NewStoryImagesList
                            item={item}
                            index={index}
                            onGoBack={() => navigation.goBack()}
                            onDeleteStatus={() => deleteStatus(item)}
                            onReadyStatus={() => { }}
                        />
                    )}
                    contentContainerStyle={{
                        backgroundColor: '#000000'
                    }}
                />
            )}
        </KeyboardAvoidingView>
    );
};

export default NewStory;