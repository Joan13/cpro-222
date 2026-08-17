import React, { useEffect, useState } from 'react';
import {
    View,
    Pressable,
    FlatList,
    TextInput,
    Image,
    Platform,
    ActivityIndicator
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Contacts from 'expo-contacts';
import { NavProps, TChat, TMessage } from '../../types/types';
import { useAppDispatch, useAppSelector } from '../../store/app/hooks';
import { useRealm, useQuery } from '@realm/react';
import { UserContacts } from '../../store/database/Models';
import moment from 'moment';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { YambiText } from '../app/Text';
import { media_url, randomString, renderDateUpToMilliseconds, SocketApp } from '../../../GlobalVariables';
import { setResponseTo } from '../../store/reducers/appSlice';
import { strings } from '../../lang/lang';
import { Image as ExpoImage } from 'expo-image';

interface CombinedContact {
    id: string;
    displayName: string;
    phoneNumber: string;
    user_profile?: string;
    isOnYambi?: boolean;
}

const SendContact = ({ navigation, route }: NavProps) => {
    const { user } = route.params;
    const dispatch = useAppDispatch();
    const user_data = useAppSelector(state => state.user_data);
    const app_theme = useAppSelector(state => state.app_theme);
    const raw_contacts = useAppSelector(state => state.persisted_app.raw_contacts || state.app.raw_contacts || []);
    const response_to = useAppSelector(state => state.app.response_to);
    const realm = useRealm();

    const realmContacts = useQuery(UserContacts);

    const [contactList, setContactList] = useState<CombinedContact[]>([]);
    const [selectedContacts, setSelectedContacts] = useState<CombinedContact[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState<boolean>(true);

    const fetchAllContacts = async () => {
        setLoading(true);
        const map = new Map<string, CombinedContact>();

        // 1. Add Realm Yambi contacts
        realmContacts.forEach((c: any) => {
            const phone = c.phone_number || c._id;
            if (phone && phone !== user_data.phone_number) {
                map.set(phone, {
                    id: phone,
                    displayName: c.user_names || phone,
                    phoneNumber: phone,
                    user_profile: c.user_profile || '',
                    isOnYambi: true
                });
            }
        });

        // 2. Add Redux raw contacts (phonebook)
        raw_contacts.forEach((c: any) => {
            const phone = c.phoneNumber || c.phone_number;
            if (phone && phone !== user_data.phone_number) {
                if (map.has(phone)) {
                    const existing = map.get(phone)!;
                    if (!existing.displayName || existing.displayName === phone) {
                        existing.displayName = c.displayName || c.name || phone;
                    }
                } else {
                    map.set(phone, {
                        id: phone,
                        displayName: c.displayName || c.name || phone,
                        phoneNumber: phone,
                        user_profile: '',
                        isOnYambi: false
                    });
                }
            }
        });

        // 3. Fetch device contacts via expo-contacts to ensure non-Yambi contacts are listed
        try {
            const { status } = await Contacts.requestPermissionsAsync();
            if (status === 'granted') {
                const { data } = await Contacts.getContactsAsync({
                    fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
                });

                if (data && data.length > 0) {
                    data.forEach(contact => {
                        if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
                            contact.phoneNumbers.forEach(p => {
                                const rawPhone = p.number || '';
                                if (rawPhone && rawPhone !== user_data.phone_number) {
                                    const cleaned = rawPhone.replace(/\s+/g, '');
                                    if (!map.has(cleaned) && !map.has(rawPhone)) {
                                        map.set(cleaned, {
                                            id: contact.id || cleaned,
                                            displayName: contact.name || p.label || cleaned,
                                            phoneNumber: rawPhone,
                                            user_profile: '',
                                            isOnYambi: false
                                        });
                                    }
                                }
                            });
                        }
                    });
                }
            }
        } catch (e) {
            console.log('Error loading expo contacts:', e);
        }

        const list = Array.from(map.values()).sort((a, b) => a.displayName.localeCompare(b.displayName));
        setContactList(list);
        setLoading(false);
    };

    useEffect(() => {
        fetchAllContacts();
    }, [realmContacts, raw_contacts]);

    const toggleSelectContact = (contact: CombinedContact) => {
        Haptics.selectionAsync();
        const exists = selectedContacts.some(c => c.phoneNumber === contact.phoneNumber);
        if (exists) {
            setSelectedContacts(prev => prev.filter(c => c.phoneNumber !== contact.phoneNumber));
        } else {
            setSelectedContacts(prev => [...prev, contact]);
        }
    };

    const sendSelectedContacts = () => {
        if (selectedContacts.length === 0) return;
        Haptics.selectionAsync();

        const time = moment(new Date()).format();

        selectedContacts.forEach(contact => {
            const token = randomString(30) + renderDateUpToMilliseconds();

            const msg: TMessage = {
                sender: user_data.phone_number,
                receiver: user,
                main_text_message: contact.phoneNumber,
                caption: contact.displayName,
                message_type: 4, // Contact
                reactions: '[]',
                response_to: response_to,
                message_read: 0,
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

            const chat: TChat = {
                _id: user,
                phone_number: user,
                type_chat: 0,
                last_message: token,
                user: user_data.phone_number,
                flag: 0,
                chat_read: 0,
                deleted: 0,
                chat_effect: 0,
                createdAt: time,
                updatedAt: time,
            };

            realm.write(() => {
                try {
                    realm.create('UsersMessages', msg);
                    realm.create('UserChats', chat, true);
                } catch (error) { }
            });

            SocketApp.emit('newMessage', msg);
        });

        dispatch(setResponseTo(""));
        navigation.goBack();
    };

    const filteredContacts = contactList.filter(c =>
        c.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phoneNumber.includes(searchQuery)
    );

    return (
        <View style={{ flex: 1, backgroundColor: app_theme.colors.background }}>
            {/* Search Input */}
            <View style={{
                paddingHorizontal: 15,
                paddingVertical: 10,
                backgroundColor: app_theme.colors.card,
                borderBottomWidth: 1,
                borderColor: app_theme.colors.border
            }}>
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: app_theme.colors.background,
                    borderRadius: 8,
                    paddingHorizontal: 10,
                    height: 40
                }}>
                    <Ionicons name="search" size={18} color={app_theme.colors.gray} style={{ marginRight: 8 }} />
                    <TextInput
                        placeholder={strings.search || "Search contacts..."}
                        placeholderTextColor={app_theme.colors.gray}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        style={{ flex: 1, color: app_theme.colors.text, fontSize: 14 }}
                    />
                    {searchQuery !== '' && (
                        <Pressable onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={18} color={app_theme.colors.gray} />
                        </Pressable>
                    )}
                </View>
            </View>

            {/* Contacts List */}
            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={app_theme.colors.high_color} />
                    <YambiText text={strings.loading || "Loading contacts..."} size="small" color="gray" style={{ marginTop: 10 }} />
                </View>
            ) : (
                <FlatList
                    data={filteredContacts}
                    keyExtractor={(item, index) => item.phoneNumber + index}
                    contentContainerStyle={{ paddingVertical: 8 }}
                    renderItem={({ item }) => {
                        const isSelected = selectedContacts.some(c => c.phoneNumber === item.phoneNumber);
                        return (
                            <Pressable
                                onPress={() => toggleSelectContact(item)}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    paddingHorizontal: 16,
                                    paddingVertical: 10,
                                    backgroundColor: isSelected ? app_theme.colors.card : 'transparent'
                                }}
                            >
                                {item.user_profile ? (
                                    <ExpoImage
                                        source={`${media_url}/profile_pictures/${item.user_profile}`}
                                        style={{ width: 44, height: 44, borderRadius: 22 }}
                                    />
                                ) : (
                                    <Image
                                        source={require('../../assets/profile_black.jpg')}
                                        style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: app_theme.colors.border }}
                                    />
                                )}
                                <View style={{ flex: 1, marginLeft: 12, marginRight: 8 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <YambiText text={item.displayName} size="normal" color="default" bold={isSelected} numberLines={1} />
                                        {item.isOnYambi && (
                                            <Ionicons name="checkmark-circle" size={14} color={app_theme.colors.high_color} style={{ marginLeft: 4 }} />
                                        )}
                                    </View>
                                    <YambiText text={item.phoneNumber} size="small" color="gray" style={{ marginTop: 2 }} />
                                </View>
                                <Ionicons
                                    name={isSelected ? "checkbox" : "square-outline"}
                                    size={22}
                                    color={isSelected ? app_theme.colors.high_color : app_theme.colors.gray}
                                />
                            </Pressable>
                        );
                    }}
                />
            )}

            {/* Bottom Actions Bar */}
            {selectedContacts.length > 0 && (
                <View style={{
                    padding: 12,
                    backgroundColor: app_theme.colors.card,
                    borderTopWidth: 1,
                    borderColor: app_theme.colors.border,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: Platform.OS === 'ios' ? 20 : 0
                }}>
                    <YambiText
                        text={`${selectedContacts.length} ${(strings as any).contacts_selected || 'contact(s) selected'}`}
                        size="normal"
                        color="default"
                    />
                    <Pressable
                        onPress={sendSelectedContacts}
                        style={{
                            height: 44,
                            paddingHorizontal: 18,
                            borderRadius: 22,
                            backgroundColor: app_theme.colors.button_background_color,
                            justifyContent: 'center',
                            alignItems: 'center',
                            flexDirection: 'row'
                        }}
                    >
                        <YambiText text={`${strings.send || 'Send'} (${selectedContacts.length})`} size="normal" color="white" bold />
                        <Ionicons name="send" size={16} color={app_theme.colors.button_foreground_color} style={{ marginLeft: 6 }} />
                    </Pressable>
                </View>
            )}
        </View>
    );
};

export default SendContact;
