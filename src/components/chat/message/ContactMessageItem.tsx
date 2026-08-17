import React, { useEffect, useState } from 'react';
import { View, Pressable, Image, ActivityIndicator, Linking } from 'react-native';
import * as Haptics from 'expo-haptics';
import { TMessage } from '../../../types/types';
import { useAppSelector } from '../../../store/app/hooks';
import { Image as ExpoImage } from 'expo-image';
import axios from 'axios';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { YambiText } from '../../app/Text';
import { formatPhoneInternational, media_url, remote_host } from '../../../../GlobalVariables';
import * as RootNavigation from '../../../services/Navigation_ref';
import { strings } from '../../../lang/lang';

const ContactMessageItem = ({ message }: { message: TMessage }) => {
    const app_theme = useAppSelector(state => state.app_theme);
    const raw_contacts = useAppSelector(state => state.persisted_app.raw_contacts || state.app.raw_contacts || []);

    const [checking, setChecking] = useState<boolean>(true);
    const [isYambiUser, setIsYambiUser] = useState<boolean>(false);
    const [userProfile, setUserProfile] = useState<string>('');
    const [yambiName, setYambiName] = useState<string>('');

    const contactPhone = message.main_text_message;
    const contactName = message.caption || contactPhone;

    // Check if contact is in receiver's phonebook
    const isInPhonebook = raw_contacts.some((c: any) => {
        const p1 = (c.phoneNumber || c.phone_number || '').replace(/\D/g, '');
        const p2 = (contactPhone || '').replace(/\D/g, '');
        return p1.length > 5 && p2.length > 5 && (p1.endsWith(p2) || p2.endsWith(p1));
    });

    const checkYambiUser = async () => {
        if (!contactPhone) {
            setChecking(false);
            return;
        }

        try {
            const response = await axios.post(remote_host + '/yambi/API/check_phone_number', {
                phone_number: contactPhone
            });

            const data = response.data;
            if (data?.success === '1' || data?.message === '1' || data?.user || data?.data) {
                setIsYambiUser(true);
                const u = data.user || data.data || data.assemble || {};
                if (u.user_profile) setUserProfile(u.user_profile);
                if (u.user_names) setYambiName(u.user_names);
            } else {
                setIsYambiUser(false);
            }
        } catch (e) {
            setIsYambiUser(false);
        } finally {
            setChecking(false);
        }
    };

    useEffect(() => {
        checkYambiUser();
    }, [contactPhone]);

    const handleMessagePress = () => {
        Haptics.selectionAsync();
        RootNavigation.navigate("Inbox", { user: contactPhone });
    };

    const handleAddContactPress = () => {
        Haptics.selectionAsync();
        Linking.openURL(`tel:${contactPhone}`).catch(() => { });
    };

    return (
        <View style={{
            backgroundColor: app_theme.colors.card,
            padding: 12,
            borderRadius: 7,
            marginVertical: 4,
            borderWidth: 1,
            borderColor: app_theme.colors.border,
            width: 235
        }}>
            {/* Contact Details Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {userProfile ? (
                    <ExpoImage
                        source={`${media_url}/profile_pictures/${userProfile}`}
                        style={{ width: 46, height: 46, borderRadius: 23 }}
                    />
                ) : (
                    <Image
                        source={require('../../../assets/profile_black.jpg')}
                        style={{ width: 46, height: 46, borderRadius: 23, borderWidth: 1, borderColor: app_theme.colors.border }}
                    />
                )}
                <View style={{ flex: 1, marginLeft: 10 }}>
                    <YambiText text={yambiName || contactName} size="normal" color="default" bold numberLines={1} />
                    <YambiText text={formatPhoneInternational({ phone_number: contactPhone } as any) || contactPhone} size="small" color="gray" numberLines={1} style={{ marginTop: 2 }} />
                </View>
            </View>

            {/* Yambi Status Badge / Spinner */}
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 8,
                paddingTop: 8,
                borderTopWidth: 1,
                borderColor: app_theme.colors.border
            }}>
                {checking ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <ActivityIndicator size="small" color={app_theme.colors.high_color} style={{ marginRight: 6 }} />
                        <YambiText text={(strings as any).checking_phone_number || "Checking phone number"} size="small" color="gray" />
                    </View>
                ) : isYambiUser ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="checkmark-circle" size={16} color={app_theme.colors.success || '#4CAF50'} style={{ marginRight: 4 }} />
                        <YambiText text={(strings as any).available_on_yambi || "Available on Yambi"} size="small" color="high" bold />
                    </View>
                ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <MaterialIcons name="person-off" size={16} color={app_theme.colors.gray} style={{ marginRight: 4 }} />
                        <YambiText text={(strings as any).not_on_yambi || "Not on Yambi"} size="small" color="gray" />
                    </View>
                )}
            </View>

            {/* Action Buttons: Message & Add Contact */}
            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-around',
                alignItems: 'center',
                marginTop: 10,
                paddingTop: 8,
                borderTopWidth: 1,
                borderColor: app_theme.colors.border
            }}>
                {/* Message Option (if user is available on Yambi) */}
                {isYambiUser && (
                    <Pressable
                        onPress={handleMessagePress}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingVertical: 4,
                            paddingHorizontal: 8
                        }}
                    >
                        <Ionicons name="chatbubble-ellipses-outline" size={16} color={app_theme.colors.high_color} style={{ marginRight: 4 }} />
                        <YambiText text={strings.message || "Message"} size="small" color="high" bold />
                    </Pressable>
                )}

                {/* Add Contact Option (if not in receiver's phonebook) */}
                {!isInPhonebook && (
                    <Pressable
                        onPress={handleAddContactPress}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingVertical: 4,
                            paddingHorizontal: 8
                        }}
                    >
                        <Ionicons name="person-add-outline" size={16} color={app_theme.colors.high_color} style={{ marginRight: 4 }} />
                        <YambiText text={strings.add_contact || "Add contact"} size="small" color="high" bold />
                    </Pressable>
                )}
            </View>
        </View>
    );
};

export default ContactMessageItem;
