import { Text, View, Pressable, Dimensions, Platform, KeyboardAvoidingView, TextInput, Keyboard } from "react-native";
import { useAppDispatch, useAppSelector } from "../../../store/app/hooks";
import { memo, useState, useEffect } from 'react';
import { Image as ExpoImage } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { IconApp } from "../../app/IconApp";
import Pinchable from 'react-native-pinchable';
import { strings } from "../../../lang/lang";
import ModalApp from "../../app/ModalApp";
import { setShowModalApp } from "../../../store/reducers/appSlice";
import { TextNormalYambiGray } from "../../app/Text";
import AppActivityIndicator from "../../app/AppActivityIndicator";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface NewStoryImagesListProps {
    item: any;
    index: number;
    totalCount?: number;
    caption: string;
    onChangeCaption: (text: string) => void;
    onSendAll: () => void;
    loading?: boolean;
    onReadyStatus?: () => void;
    onGoBack: () => void;
    onDeleteStatus: (isPublished?: boolean) => void;
}

const NewStoryImagesList = ({
    item,
    index,
    totalCount = 1,
    caption,
    onChangeCaption,
    onSendAll,
    loading = false,
    onReadyStatus,
    onGoBack,
    onDeleteStatus
}: NewStoryImagesListProps) => {
    const app_theme = useAppSelector(state => state.app_theme);
    const [showInternetError, setShowInternetError] = useState<boolean>(false);
    const [isKeyboardVisible, setIsKeyboardVisible] = useState<boolean>(false);

    const dispatch = useAppDispatch();
    const insets = useSafeAreaInsets();
    const { width: screenWidth } = Dimensions.get('window');

    useEffect(() => {
        const showSub = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            () => setIsKeyboardVisible(true)
        );
        const hideSub = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => setIsKeyboardVisible(false)
        );
        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    const bottomPadding = isKeyboardVisible ? 10 : Math.max(insets.bottom + 6, 12);

    return (
        <View style={{
            width: screenWidth,
            flex: 1,
            height: '100%',
            backgroundColor: '#000000',
            position: 'relative'
        }}>
            <StatusBar style="light" translucent backgroundColor="transparent" />

            {showInternetError && (
                <ModalApp
                    onClose={() => { dispatch(setShowModalApp(false)); setShowInternetError(false); }}
                    singleButton
                    title={strings.error}
                >
                    <TextNormalYambiGray text={strings.connection_failed} />
                </ModalApp>
            )}

            {/* Photo Canvas */}
            <View style={{ flex: 1, width: screenWidth, height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                <Pinchable style={{ flex: 1, width: screenWidth, height: '100%' }}>
                    <ExpoImage
                        style={{ flex: 1, width: screenWidth, height: '100%' }}
                        contentFit="contain"
                        source={item.path}
                    />
                </Pinchable>
            </View>

            {/* Top Bar Header Overlay */}
            <View style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                paddingTop: Math.max(insets.top + 8, 16),
                paddingHorizontal: 16,
                paddingBottom: 20,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                zIndex: 10
            }}>
                <Pressable
                    onPress={onGoBack}
                    hitSlop={10}
                    style={({ pressed }) => ({
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: pressed ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.5)',
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: 'rgba(255, 255, 255, 0.15)',
                    })}
                >
                    <IconApp name="x" pack="FI" size={22} color="#FFFFFF" />
                </Pressable>

                <View style={{
                    paddingHorizontal: 14,
                    paddingVertical: 6,
                    borderRadius: 16,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.15)',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6
                }}>
                    <IconApp name="image" pack="FI" size={14} color="rgba(255, 255, 255, 0.85)" />
                    <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>
                        {totalCount > 1 ? `${index + 1} / ${totalCount}` : (strings.my_status || 'My Status')}
                    </Text>
                </View>

                <Pressable
                    onPress={() => onDeleteStatus(false)}
                    hitSlop={10}
                    style={({ pressed }) => ({
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: pressed ? 'rgba(239, 68, 68, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: 'rgba(255, 255, 255, 0.15)',
                    })}
                >
                    <IconApp name="trash-2" pack="FI" size={18} color="#FFFFFF" />
                </Pressable>
            </View>

            {/* Bottom Caption & Post Action Controls */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    zIndex: 10
                }}
            >
                <View style={{
                    paddingHorizontal: 16,
                    paddingTop: 12,
                    paddingBottom: bottomPadding,
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    gap: 10,
                }}>
                    {/* Status Destination Pill */}
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: 'rgba(255, 255, 255, 0.12)',
                            paddingHorizontal: 12,
                            paddingVertical: 5,
                            borderRadius: 14,
                            gap: 6,
                            borderWidth: 1,
                            borderColor: 'rgba(255, 255, 255, 0.15)'
                        }}>
                            <IconApp name="lock" pack="FI" size={12} color="rgba(255, 255, 255, 0.85)" />
                            <Text style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 12, fontWeight: '500' }}>
                                {strings.my_status || "Status"} ({strings.contacts || "Contacts"})
                            </Text>
                        </View>
                    </View>

                    {/* Caption Box & Send Action */}
                    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
                        <View style={{
                            flex: 1,
                            minHeight: 48,
                            maxHeight: 110,
                            backgroundColor: 'rgba(30, 30, 32, 0.88)',
                            borderRadius: 24,
                            paddingHorizontal: 16,
                            paddingVertical: Platform.OS === 'ios' ? 12 : 6,
                            flexDirection: 'row',
                            alignItems: 'center',
                            borderWidth: 1,
                            borderColor: 'rgba(255, 255, 255, 0.18)',
                        }}>
                            <IconApp name="edit-3" pack="FI" size={18} color="rgba(255, 255, 255, 0.5)" styles={{ marginRight: 8 }} />
                            <TextInput
                                placeholder={strings.add_caption || "Add a caption..."}
                                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                                multiline
                                value={caption}
                                onChangeText={onChangeCaption}
                                style={{
                                    flex: 1,
                                    color: '#FFFFFF',
                                    fontSize: 15,
                                    lineHeight: 20,
                                    padding: 0,
                                    maxHeight: 90,
                                }}
                            />
                        </View>

                        <Pressable
                            onPress={onSendAll}
                            disabled={loading}
                            style={({ pressed }) => ({
                                width: 48,
                                height: 48,
                                borderRadius: 24,
                                backgroundColor: pressed
                                    ? (app_theme.colors.button_background_color || '#25D366') + 'CC'
                                    : (app_theme.colors.button_background_color || '#25D366'),
                                justifyContent: 'center',
                                alignItems: 'center',
                                elevation: 4,
                                shadowColor: '#000000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.3,
                                shadowRadius: 4,
                            })}
                        >
                            {loading ? (
                                <AppActivityIndicator color={app_theme.colors.button_foreground_color || '#FFFFFF'} />
                            ) : (
                                <IconApp
                                    name="send"
                                    pack="FI"
                                    size={20}
                                    color={app_theme.colors.button_foreground_color || '#FFFFFF'}
                                    styles={{ marginLeft: 2 }}
                                />
                            )}
                        </Pressable>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

export default memo(NewStoryImagesList);
