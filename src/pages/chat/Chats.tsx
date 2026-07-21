import { View, Image, ScrollView, Pressable, ActivityIndicator, Alert, Text } from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { useQuery, useRealm } from '@realm/react';
import { UserChats } from '../../store/database/Models';
import { useAppDispatch, useAppSelector } from '../../store/app/hooks';
import { NavProps, TChat, TChats } from '../../types/types';
import { useFocusEffect } from '@react-navigation/native';
import * as RootNavigation from './../../services/Navigation_ref';
import RenderChats from '../../components/lists/messages/ChatsList';
import { FlashList } from '@shopify/flash-list';
import { TextSmallYambiGray, YambiText } from '../../components/app/Text';
import { strings } from '../../lang/lang';
import ButtonNormal from '../../components/app/ButtonNormal';
import { setMessageSelected, setTitle } from '../../store/reducers/appSlice';
import { IconApp } from '../../components/app/IconApp';
import ImagePicker from '../../utils/imagePicker';
import axios from 'axios';
import { remote_host } from '../../../GlobalVariables';
import { updateUser, updateUserProfile } from '../../store/reducers/userSlice';

interface IChecklistItem {
    title: string;
    description: string;
    isCompleted: boolean;
    onPress?: () => void;
    iconName: string;
    iconPack: string;
    isLoading?: boolean;
    theme: any;
    actionLabel: string;
    isLast?: boolean;
}

const ChecklistItem: React.FC<IChecklistItem> = ({
    title,
    description,
    isCompleted,
    onPress,
    iconName,
    iconPack,
    isLoading = false,
    theme,
    actionLabel,
    isLast = false
}) => {
    const hexToRGBA = (hex: string, alpha: number) => {
        if (!hex || !hex.startsWith('#')) return `rgba(0,0,0,${alpha})`;
        try {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        } catch (e) {
            return `rgba(0,0,0,${alpha})`;
        }
    };

    const activeColor = theme.colors.high_color || '#1E68FF';

    return (
        <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 18,
            borderBottomWidth: isLast ? 0 : 1,
            borderBottomColor: theme.colors.border,
        }}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', marginRight: 16 }}>
                {/* Status and Icon Wrapper */}
                <View style={{
                    width: 46,
                    height: 46,
                    borderRadius: 23,
                    backgroundColor: isCompleted
                        ? (theme.dark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)')
                        : hexToRGBA(activeColor, theme.dark ? 0.15 : 0.08),
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 16,
                }}>
                    {isCompleted ? (
                        <IconApp pack="FI" name="check" size={20} color="#10B981" />
                    ) : (
                        <IconApp pack={iconPack} name={iconName} size={20} color={activeColor} />
                    )}
                </View>

                {/* Details */}
                <View style={{ flex: 1 }}>
                    <Text style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: isCompleted ? theme.colors.gray : theme.colors.text,
                        marginBottom: 4
                    }}>
                        {title}
                    </Text>
                    <Text style={{
                        fontSize: 14,
                        color: theme.colors.gray,
                        lineHeight: 18
                    }} numberOfLines={2}>
                        {description}
                    </Text>
                </View>
            </View>

            {/* Action Trigger */}
            {!isCompleted && (
                <Pressable
                    onPress={onPress}
                    disabled={isLoading}
                    style={({ pressed }) => ({
                        backgroundColor: pressed ? hexToRGBA(activeColor, 0.85) : activeColor,
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 20,
                        minWidth: 76,
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: activeColor,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.15,
                        shadowRadius: 4,
                        elevation: 2
                    })}
                >
                    {isLoading ? (
                        <ActivityIndicator size={12} color="#FFF" />
                    ) : (
                        <Text style={{
                            color: '#FFF',
                            fontSize: 12,
                            fontWeight: '700'
                        }}>
                            {actionLabel}
                        </Text>
                    )}
                </Pressable>
            )}
        </View>
    );
};

const Chats = ({ navigation, route }: NavProps) => {
    const app_theme = useAppSelector(state => state.app_theme);
    const search_yambi = useAppSelector(state => state.app.search_yambi);
    const search_yambi_text = useAppSelector(state => state.app.search_yambi_text);
    const show_favorite_chats = useAppSelector(state => state.app.show_favorite_chats);
    const user_data = useAppSelector(state => state.user_data);
    const [chats, setChats] = useState<TChats>([]);
    const [loadingProfile, setLoadingProfile] = useState<boolean>(false);
    const dispatch = useAppDispatch();
    const realm = useRealm();

    useFocusEffect(
        useCallback(() => {
            dispatch(setTitle(strings.chats));
        }, [navigation])
    );

    const goNewChat = () => {
        RootNavigation.navigate('NewChat');
    }

    const uploadProfilePicture = (imageUri: string) => {
        setLoadingProfile(true);

        const filename = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const base_url = remote_host + "/yambi/API/upload_profile_picture";

        let formData = new FormData();
        formData.append('assemble', user_data.phone_number);
        formData.append('user_profile', user_data.user_profile || "");
        formData.append('image', { type: 'image/jpg', uri: imageUri, name: filename + 'profile.jpg' } as any);

        axios.post(base_url, formData, {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'multipart/form-data'
            }
        })
            .then(response => {
                setLoadingProfile(false);
                if (response.data.message === "1" && response.data.assemble === user_data.phone_number) {
                    dispatch(updateUserProfile(response.data.user_profile));

                    const user_assemble_data = {
                        user_id: user_data.user_id,
                        user_names: user_data.user_names,
                        phone_number: user_data.phone_number,
                        gender: typeof user_data.gender === 'string' ? parseInt(user_data.gender) : user_data.gender,
                        birth_date: user_data.birth_date,
                        country: user_data.country,
                        user_profile: response.data.user_profile,
                        profession: user_data.profession,
                        bio: user_data.bio,
                        user_email: user_data.user_email,
                        user_address: user_data.user_address,
                        status_information: user_data.status_information,
                        user_password: user_data.user_password,
                        account_privacy: typeof user_data.account_privacy === 'string' ? parseInt(user_data.account_privacy) : user_data.account_privacy,
                        user_level: user_data.user_level || 0,
                        user_active: user_data.user_active || 1,
                        user_verified: user_data.user_verified || 0,
                        user_verified_at: user_data.user_verified_at || "",
                        notification_token: user_data.notification_token,
                        createdAt: user_data.createdAt,
                        updatedAt: user_data.updatedAt,
                    };

                    realm.write(() => {
                        try {
                            realm.create('UserData', user_assemble_data, true);
                        } catch (error) {
                            console.log("Realm error saving user profile: ", error);
                        }
                    });
                } else {
                    Alert.alert(strings.error, strings.invalid_photo || "Error uploading picture");
                }
            })
            .catch(() => {
                setLoadingProfile(false);
                Alert.alert(strings.error, strings.connection_failed);
            });
    };

    const pickAndUploadProfilePicture = () => {
        if (loadingProfile) return;

        ImagePicker.openPicker({
            width: 500,
            height: 500,
            cropping: true,
            quality: 0.5,
            noData: true,
            mediaType: "photo",
        }).then(image => {
            uploadProfilePicture(image.path);
        }).catch(() => {
            // Cancelled or errored picker
        });
    };

    const vvv = useQuery(UserChats);

    const pinnedChats = useQuery(UserChats, chts =>
        chts.filtered('flag == 2 && deleted == 0'));

    const otherChats = useQuery(UserChats, chts =>
        chts.filtered('flag != 2 && deleted == 0').sorted('createdAt', true)
    );

    const favoriteChats = useQuery(UserChats, chts =>
        chts.filtered('flag == 1 && deleted == 0').sorted('createdAt', true)
    );

    const GoInbox = useCallback((user: string) => {
        dispatch(setMessageSelected(""));
        RootNavigation.navigate("Inbox", { user: user });
    }, []);

    const SortConversations = () => {
        if (show_favorite_chats && favoriteChats.length !== 0) {
            setChats([...favoriteChats]);
        } else {
            setChats([...pinnedChats, ...otherChats]);
        }
    }

    useEffect(() => {
        SortConversations();
    }, [show_favorite_chats, vvv]);

    const FooterChats = () => {
        return (
            <View style={{
                borderColor: app_theme.colors.border,
                borderTopWidth: 1,
                paddingHorizontal: 30
            }}>
                <TextSmallYambiGray text={strings.personal_chats_listed} styles={{ textAlign: 'center', marginVertical: 15 }} />
            </View>
        )
    }

    // Checking profile completion properties
    const isPictureMissing = !user_data.user_profile || user_data.user_profile === "";
    const isStatusMissing = !user_data.status_information || user_data.status_information === "";
    const isBioMissing = !user_data.bio || user_data.bio === "";
    const showProfileWidget = isPictureMissing || isStatusMissing || isBioMissing;

    return (
        <View style={{
            flex: 1,
            backgroundColor: app_theme.colors.background,
            borderColor: app_theme.colors.border,
            borderTopWidth: 1
        }}>
            {chats.length === 0 ?
                <ScrollView
                    contentContainerStyle={{
                        flexGrow: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        paddingHorizontal: 24,
                        paddingVertical: 32,
                        backgroundColor: app_theme.colors.background
                    }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Layered Visual Illustration */}
                    <View style={{
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: 28,
                        position: 'relative',
                        width: 200,
                        height: 200,
                    }}>
                        {/* Outermost Dashed Ring */}
                        <View style={{
                            position: 'absolute',
                            width: 190,
                            height: 190,
                            borderRadius: 95,
                            borderWidth: 1.5,
                            borderColor: app_theme.colors.border,
                            borderStyle: 'dashed',
                            opacity: 0.5,
                        }} />

                        {/* Middle Soft Glow Circle */}
                        <View style={{
                            position: 'absolute',
                            width: 146,
                            height: 146,
                            borderRadius: 73,
                            backgroundColor: app_theme.colors.high_color,
                            opacity: app_theme.dark ? 0.08 : 0.05,
                        }} />

                        {/* Central Card Circle Badge */}
                        <View style={{
                            width: 106,
                            height: 106,
                            borderRadius: 53,
                            backgroundColor: app_theme.colors.card,
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderWidth: 1,
                            borderColor: app_theme.colors.border,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.06,
                            shadowRadius: 8,
                            elevation: 3,
                        }}>
                            <Image
                                source={require("./../../assets/chat.png")}
                                style={{
                                    width: 56,
                                    height: 56,
                                    resizeMode: 'contain'
                                }}
                            />
                        </View>

                        {/* Floating Decorative Message Bubble Badge */}
                        <View style={{
                            position: 'absolute',
                            bottom: 40,
                            right: 40,
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: app_theme.colors.high_color,
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderWidth: 2,
                            borderColor: app_theme.colors.card,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 3,
                            elevation: 2,
                        }}>
                            <IconApp pack="FI" name="message-circle" size={14} color="#FFF" />
                        </View>
                    </View>

                    <YambiText
                        text={strings.chats || "Chats"}
                        bold
                        size="big"
                        style={{
                            textAlign: 'center',
                            marginBottom: 8,
                            fontSize: 24,
                            fontWeight: '800',
                            color: app_theme.colors.text
                        }}
                    />

                    <TextSmallYambiGray
                        text={isPictureMissing
                            ? (strings.no_chats_word + "\n\n💡 " + strings.empty_profile_tip)
                            : strings.no_chats_word
                        }
                        styles={{
                            paddingHorizontal: 20,
                            textAlign: 'center',
                            lineHeight: 22,
                            marginBottom: 28,
                            color: app_theme.colors.gray,
                            fontSize: 14,
                        }}
                    />

                    <ButtonNormal
                        title={strings.new_chat}
                        loadEnabled={false}
                        onPress={goNewChat}
                        iconPack="FI"
                        iconName="message-square"
                        iconSize={16}
                        styles={{
                            paddingHorizontal: 30,
                            height: 48,
                            borderRadius: 24,
                            marginBottom: 32,
                            width: '80%',
                            maxWidth: 280,
                            shadowColor: app_theme.colors.high_color,
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.15,
                            shadowRadius: 8,
                            elevation: 4
                        }}
                        normal={true}
                    />

                    {/* Profile Completion Checklist */}
                    {showProfileWidget && (() => {
                        const totalSteps = 3;
                        const completedSteps =
                            (!isPictureMissing ? 1 : 0) +
                            (!isStatusMissing ? 1 : 0) +
                            (!isBioMissing ? 1 : 0);
                        const completionPercentage = Math.round((completedSteps / totalSteps) * 100);
                        const activeColor = app_theme.colors.high_color || '#1E68FF';

                        const hexToRGBA = (hex: string, alpha: number) => {
                            if (!hex || !hex.startsWith('#')) return `rgba(0,0,0,${alpha})`;
                            try {
                                const r = parseInt(hex.slice(1, 3), 16);
                                const g = parseInt(hex.slice(3, 5), 16);
                                const b = parseInt(hex.slice(5, 7), 16);
                                return `rgba(${r}, ${g}, ${b}, ${alpha})`;
                            } catch (e) {
                                return `rgba(0,0,0,${alpha})`;
                            }
                        };

                        return (
                            <View style={{
                                width: '100%',
                                backgroundColor: app_theme.colors.card,
                                borderRadius: 20,
                                borderWidth: 1,
                                borderColor: app_theme.colors.border,
                                padding: 20,
                                marginTop: 12,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.05,
                                shadowRadius: 10,
                                // elevation: 3
                            }}>
                                {/* Checklist Header with Title & Percentage Pill */}
                                <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginBottom: 14
                                }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
                                        <View style={{
                                            width: 30,
                                            height: 30,
                                            borderRadius: 15,
                                            backgroundColor: hexToRGBA(activeColor, 0.1),
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            marginRight: 10
                                        }}>
                                            <IconApp pack="FI" name="user-check" size={15} color={activeColor} />
                                        </View>
                                        <Text style={{
                                            fontSize: 15,
                                            fontWeight: '700',
                                            color: app_theme.colors.text,
                                            flexShrink: 1
                                        }}>
                                            {strings.complete_profile || "Complete Your Profile"}
                                        </Text>
                                    </View>

                                    <View style={{
                                        backgroundColor: hexToRGBA(activeColor, 0.12),
                                        paddingHorizontal: 10,
                                        paddingVertical: 4,
                                        borderRadius: 12,
                                        flexShrink: 0
                                    }}>
                                        <Text style={{
                                            fontSize: 11,
                                            fontWeight: '700',
                                            color: activeColor
                                        }}>
                                            {completionPercentage}% DONE
                                        </Text>
                                    </View>
                                </View>

                                {/* Progress Bar */}
                                <View style={{
                                    height: 6,
                                    backgroundColor: app_theme.dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                                    borderRadius: 3,
                                    marginBottom: 16,
                                    overflow: 'hidden'
                                }}>
                                    <View style={{
                                        height: '100%',
                                        width: `${completionPercentage}%`,
                                        backgroundColor: activeColor,
                                        borderRadius: 3
                                    }} />
                                </View>

                                <Text style={{
                                    fontSize: 12,
                                    color: app_theme.colors.gray,
                                    lineHeight: 17,
                                    marginBottom: 10
                                }}>
                                    {strings.empty_profile_improve}
                                </Text>

                                <ChecklistItem
                                    title={strings.choose_picture || "Profile Picture"}
                                    description={strings.uploading_picture || "Add a photo to your profile"}
                                    isCompleted={!isPictureMissing}
                                    onPress={pickAndUploadProfilePicture}
                                    iconName="camera"
                                    iconPack="FI"
                                    isLoading={loadingProfile}
                                    theme={app_theme}
                                    actionLabel={strings.edit || "Add"}
                                />

                                <ChecklistItem
                                    title={strings.status || "Status"}
                                    description={strings.edit_profile_title || "Set a short status message"}
                                    isCompleted={!isStatusMissing}
                                    onPress={() => RootNavigation.navigate('EditProfile', { user: user_data })}
                                    iconName="message-square"
                                    iconPack="FI"
                                    theme={app_theme}
                                    actionLabel={strings.edit || "Add"}
                                />

                                <ChecklistItem
                                    title={strings.bio || "Bio"}
                                    description={strings.basic_information || "Write a brief description"}
                                    isCompleted={!isBioMissing}
                                    onPress={() => RootNavigation.navigate('EditProfile', { user: user_data })}
                                    iconName="align-left"
                                    iconPack="FI"
                                    theme={app_theme}
                                    actionLabel={strings.edit || "Add"}
                                    isLast={true}
                                />
                            </View>
                        );
                    })()}
                </ScrollView>
                :
                <FlashList
                    data={chats as never}
                    estimatedItemSize={70}
                    renderItem={({ item, index }: { item: TChat, index: number }) => (
                        <RenderChats item={item} GoInbox={GoInbox} />
                    )}
                    contentContainerStyle={{
                        backgroundColor: app_theme.colors.background
                    }}
                    ListFooterComponent={<FooterChats />}
                />}
        </View>
    )
}

export default Chats;

