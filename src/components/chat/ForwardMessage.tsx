import { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { View, TextInput, Pressable, Text, Platform } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Feather from 'react-native-vector-icons/Feather';
// import * as Animatable from 'react-native-animatable';
// import * as Localization from 'react-native-localization';
import { strings } from '../../lang/lang';
// import changeNavigationBarColor from 'react-native-navigation-bar-color';
// import { PermissionsAndroid } from 'react-native';
// import { connect, useDispatch, useSelector } from 'react-redux';
// import Realm, { BSON } from 'realm';
// import { useNavigation } from '@react-navigation/native';
import Animated, { FadeIn, FadeOut, SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { useAppDispatch, useAppSelector } from '../../store/app/hooks';
// import ButtonNormal from '../../components/app/ButtonNormal';
import StatusBarYambi from '../../components/app/StatusBar';
import { NavProps, TChat, TMessage, TUser } from '../../types/types';
// import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
// import Entypo from 'react-native-vector-icons/Entypo'/;
// import countries from '../../assets/countries_en';
import ContactsList from '../lists/contacts/ContactsList';
import { setMessageInbox, setMessageSelected, setPhoneNumbersList, setResponseTo, setTextContactSearch } from '../../store/reducers/appSlice';
import { FlashList } from '@shopify/flash-list';
import { TextNormalYambi, TextSmallYambiGray } from '../../components/app/Text';
import { IconApp } from '../../components/app/IconApp';
import { useObject, useQuery, useRealm } from '@realm/react';
import { UserChats, UserContacts, UsersMessages } from '../../store/database/Models';
// import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PlayActionSound, randomString, renderDateUpToMilliseconds, SocketApp } from '../../../GlobalVariables';
import moment from 'moment';
import AppActivityIndicator from '../app/AppActivityIndicator';
// import { SocketApp } from '../../../App';

// const navigation = NativeStackScreenProps<RootStackParamList>();

const ForwardMessage = ({ route, navigation }: NavProps) => {

    const app_theme = useAppSelector(state => state.app_theme);
    const user_data = useAppSelector(state => state.user_data);
    const dispatch = useAppDispatch();
    const raw_contacts = useAppSelector(state => state.app.raw_contacts);
    const search_contact_enabled = useAppSelector(state => state.app.search_contact_enabled);
    const text_contact_search = useAppSelector(state => state.app.text_contact_search);
    const phone_numbers_list = useAppSelector(state => state.app.phone_numbers_list);
    const message_selected = useAppSelector(state => state.app.message_selected);
    const app_description = useAppSelector(state => state.persisted_app.app_description);
    const [loading, setLoading] = useState<boolean>(false);

    const realm = useRealm();

    const userChatsDesc = useQuery(
        UserChats,
        chts => chts.filtered('deleted == 0').sorted('updatedAt', true),
        []
    );

    const contacts = useQuery(
        UserContacts,
        ccs => ccs.filtered('phone_number != $0 && user_active != $1', user_data.phone_number, 0),
        [user_data.phone_number]
    );

    const allForwardItems = useMemo(() => {
        const list: TUser[] = [];
        const addedPhones = new Set<string>();

        // Helper to convert live Realm contact object to plain JS object
        const toPlainUser = (c: any): TUser => ({
            user_id: c.user_id || c.phone_number || "",
            user_names: c.user_names || c.phone_number || "",
            phone_number: c.phone_number || "",
            gender: c.gender || 0,
            birth_date: c.birth_date || "",
            country: c.country || "",
            user_profile: c.user_profile || "",
            profession: c.profession || "",
            bio: c.bio || "",
            user_email: c.user_email || "",
            user_address: c.user_address || "",
            status_information: c.status_information || "",
            user_password: c.user_password || "",
            account_privacy: c.account_privacy || 0,
            user_level: c.user_level || 0,
            user_active: c.user_active ?? 1,
            user_verified: c.user_verified || 0,
            user_verified_at: c.user_verified_at || "",
            notification_token: c.notification_token || "",
            createdAt: c.createdAt || "",
            updatedAt: c.updatedAt || "",
        });

        // 1. Add all chats sorted by updatedAt DESC
        userChatsDesc.forEach(chat => {
            if (!chat || !chat.isValid()) return;
            const phone = chat.phone_number || chat._id;
            if (!phone || addedPhones.has(phone)) return;

            const existingContact = contacts.find(c => c && c.isValid() && (c.phone_number === phone || c.user_id === phone));
            if (existingContact && existingContact.isValid()) {
                list.push(toPlainUser(existingContact));
            } else {
                list.push({
                    user_id: chat._id,
                    user_names: phone,
                    phone_number: phone,
                    gender: 0,
                    birth_date: "",
                    country: "",
                    user_profile: "",
                    profession: "",
                    bio: "",
                    user_email: "",
                    user_address: "",
                    status_information: "",
                    user_password: "",
                    account_privacy: 0,
                    user_level: 0,
                    user_active: 1,
                    user_verified: 0,
                    user_verified_at: "",
                    notification_token: "",
                    createdAt: chat.createdAt,
                    updatedAt: chat.updatedAt,
                });
            }
            addedPhones.add(phone);
        });

        // 2. Add remaining contacts not in active chats
        contacts.forEach(contact => {
            if (contact && contact.isValid() && !addedPhones.has(contact.phone_number)) {
                list.push(toPlainUser(contact));
                addedPhones.add(contact.phone_number);
            }
        });

        return list;
    }, [userChatsDesc, contacts]);

    const [IIItems, setIIItems] = useState<TUser[]>([]);

    useEffect(() => {
        if (!text_contact_search) {
            setIIItems(allForwardItems);
        } else {
            SearchItem(text_contact_search);
        }
    }, [allForwardItems]);

    const rawMsgId = route.params?.message_id || message_selected || "";
    const selectedTokens = useMemo(() => rawMsgId ? rawMsgId.split(',').filter(Boolean) : [], [rawMsgId]);
    const messagesToForward = useMemo(() => {
        return selectedTokens
            .map(token => {
                const msgObj = realm.objectForPrimaryKey<UsersMessages>('UsersMessages', token);
                if (!msgObj || !msgObj.isValid()) return null;
                return {
                    token: msgObj.token,
                    sender: msgObj.sender,
                    receiver: msgObj.receiver,
                    main_text_message: msgObj.main_text_message || "",
                    caption: msgObj.caption || "",
                    message_type: msgObj.message_type,
                    message_effect: msgObj.message_effect || 0,
                    read_once: msgObj.read_once || 0,
                    deleted: msgObj.deleted || 0,
                    reactions: msgObj.reactions || "[]",
                    flag: msgObj.flag || 0,
                    createdAt: msgObj.createdAt,
                };
            })
            .filter((m): m is NonNullable<typeof m> => m !== null);
    }, [selectedTokens, realm]);

    const selectCon = useCallback((item: TUser) => {
        if (messagesToForward.some(m => m.receiver === item.phone_number)) {
            return;
        }
        dispatch(setPhoneNumbersList(item.phone_number));
    }, [messagesToForward, dispatch]);

    const ForwardTheMessage = () => {
        if (messagesToForward.length > 0 && phone_numbers_list.length > 0) {
            setLoading(true);
            const newMsgs: TMessage[] = [];
            const newChats: any[] = [];

            for (let mIdx = 0; mIdx < messagesToForward.length; mIdx++) {
                const message = messagesToForward[mIdx];
                for (let i = 0; i < phone_numbers_list.length; i++) {
                    const recipientPhone = phone_numbers_list[i];
                    PlayActionSound(2);
                    const time = moment(new Date()).format();
                    const token = randomString(30) + renderDateUpToMilliseconds();

                    const msg: TMessage = {
                        sender: user_data.phone_number,
                        receiver: recipientPhone,
                        main_text_message: message.main_text_message,
                        caption: message.caption,
                        message_type: message.message_type,
                        reactions: '[]',
                        response_to: "",
                        message_read: 0,
                        message_effect: message.message_effect,
                        read_once: message.read_once,
                        flag: 2,
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

                    const this_chat = userChatsDesc.find(cc => cc.isValid() && (cc._id === recipientPhone || cc.phone_number === recipientPhone));
                    const chat = {
                        _id: recipientPhone,
                        phone_number: recipientPhone,
                        type_chat: (this_chat && this_chat.isValid()) ? this_chat.type_chat : 0,
                        last_message: token,
                        user: user_data.phone_number,
                        flag: (this_chat && this_chat.isValid()) ? this_chat.flag : 0,
                        chat_read: (this_chat && this_chat.isValid()) ? this_chat.chat_read : 1,
                        deleted: 0,
                        chat_effect: (this_chat && this_chat.isValid()) ? this_chat.chat_effect : 0,
                        createdAt: time,
                        updatedAt: time
                    };

                    newMsgs.push(msg);
                    newChats.push(chat);
                }
            }

            realm.write(() => {
                try {
                    newMsgs.forEach(msg => realm.create('UsersMessages', msg));
                    newChats.forEach(chat => realm.create('UserChats', chat, true));
                } catch (error) {
                    console.error("Error creating forwarded messages in Realm:", error);
                }
            });

            newMsgs.forEach(msg => {
                if (msg.message_type === 0) {
                    SocketApp.emit('newMessage', msg);
                }
            });

            setTimeout(() => {
                dispatch(setMessageInbox(""));
                dispatch(setResponseTo(""));
                dispatch(setPhoneNumbersList(""));
                dispatch(setMessageSelected(""));
                navigation.navigate("Home");
            }, phone_numbers_list.length <= 5 ? 800 : 1300);
        }
    };

    const SearchItem = (search: string) => {
        dispatch(setTextContactSearch(search));
        if (!search.trim()) {
            setIIItems(allForwardItems);
            return;
        }
        let filtered_items = allForwardItems.filter(item => {
            return (
                (item.user_names && item.user_names.toLowerCase().includes(search.toLowerCase())) ||
                (item.phone_number && item.phone_number.toLowerCase().includes(search.toLowerCase()))
            );
        });
        setIIItems(filtered_items);
    };

    // const renderItem = memo(Ii);

    // const setSSearch = (text: string) => {
    //     dispatch(setTextContactSearch(text));
    // };

    // useEffect(()=> {
    //     console.log(contacts);
    // },[]);

    const Add_component = () => {
        return (
            <View style={{ marginHorizontal: 15, borderColor: app_theme.colors.border, borderTopWidth: 0 }}>
                <Pressable onPress={() => navigation.navigate("NewGroup")} style={{ flexDirection: 'row', justifyContent: 'flex-start', height: 60, alignItems: 'center' }}>
                    <View style={{
                        width: 35,
                        height: 35,
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderColor: app_theme.colors.border,
                        borderWidth: 1,
                        borderRadius: 30
                    }}>
                        <FontAwesome6 name="people-group" color={app_theme.colors.text} size={16} />
                    </View>
                    <View style={{
                        borderBottomWidth: 0,
                        borderColor: app_theme.colors.border,
                        flex: 1,
                        marginLeft: 10,
                        height: 60,
                        justifyContent: 'center'
                    }}>
                        <TextNormalYambi text={strings.new_group} />
                    </View>
                </Pressable>

                <View style={{
                    flexDirection: 'row', justifyContent: 'center', alignItems: 'center'
                }}>
                    <Pressable style={{ flexDirection: 'row', justifyContent: 'flex-start', height: 60, alignItems: 'center', flex: 1 }}>
                        <View style={{
                            width: 35,
                            height: 35,
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderColor: app_theme.colors.border,
                            borderWidth: 1,
                            borderRadius: 30,
                        }}>
                            <IconApp name="list-ul" pack="FA6" size={16} color={app_theme.colors.text} />
                        </View>
                        <View style={{
                            borderBottomWidth: 0,
                            borderColor: app_theme.colors.border,
                            flex: 1,
                            marginLeft: 10,
                            height: 60,
                            justifyContent: 'center'
                        }}>
                            <TextNormalYambi text={strings.new_blog} />
                        </View>
                    </Pressable>

                    <Pressable style={{ flexDirection: 'row', justifyContent: 'flex-start', height: 60, alignItems: 'center', flex: 1 }}>
                        <View style={{
                            width: 35,
                            height: 35,
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderColor: app_theme.colors.border,
                            borderWidth: 1,
                            borderRadius: 30
                        }}>
                            <IconApp name="news" pack="ET" size={16} color={app_theme.colors.text} />
                        </View>
                        <View style={{
                            borderBottomWidth: 0,
                            borderColor: app_theme.colors.border,
                            flex: 1,
                            marginLeft: 10,
                            height: 60,
                            justifyContent: 'center'
                        }}>
                            <TextNormalYambi text={strings.new_article} />
                        </View>
                    </Pressable>
                </View>

                {contacts.length > 0 ?
                    <TextSmallYambiGray text={strings.contacts_on_yambi} styles={{ marginVertical: 8 }} />
                    : null}

            </View>
        )
    }

    return (
        <View style={{ flex: 1, backgroundColor: app_theme.colors.background, borderColor: app_theme.colors.border, borderTopWidth: 1 }}>

            <StatusBarYambi />

            <View style={{
                backgroundColor: app_theme.colors.background,
                flex: 1
            }}>
                {search_contact_enabled ?
                    <Animated.View
                        entering={SlideInUp}
                        exiting={SlideOutUp}
                        style={{ marginBottom: 0, marginHorizontal: 15, borderBottomWidth: 1, paddingVertical: 0, borderColor: app_theme.colors.border, flexDirection: 'row', alignItems: 'center', backgroundColor: app_theme.colors.background }}>
                        <Feather name="search" size={16} style={{ marginRight: 10, color: app_theme.colors.gray }} />
                        <TextInput
                            onChangeText={SearchItem}
                            value={text_contact_search}
                            placeholder={strings.search}
                            placeholderTextColor={app_theme.colors.gray}
                            style={{ flex: 1, paddingVertical: 0, height: 40, borderWidth: 0, borderColor: app_theme.colors.background, backgroundColor: app_theme.colors.background, color: app_theme.colors.text }}
                        />
                        {text_contact_search !== "" ?
                            <Pressable
                                onPress={() => {
                                    dispatch(setTextContactSearch(""));
                                    setIIItems(contacts as never);
                                }}
                                style={{
                                    height: 30,
                                    width: 30,
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }}>
                                <Feather name="x" size={16} style={{ color: app_theme.colors.text }} />
                            </Pressable> : null}
                    </Animated.View> : null}
                {/* renderItem={({ item, index }: { item: TMessage, index: number }) => ( */}
                <FlashList
                    estimatedItemSize={200}
                    data={IIItems as never}
                    keyboardShouldPersistTaps="handled"
                    renderItem={({ item, index }: { item: TUser, index: number }) => (
                        <ContactsList
                            item={item}
                            index={index}
                            type={0}
                            selectContact={selectCon}
                        />)}
                    contentContainerStyle={{
                        backgroundColor: app_theme.colors.background,
                        paddingHorizontal: 15,
                        paddingBottom: 50
                    }}
                />
            </View>

            {phone_numbers_list.length > 0 ?
                <Animated.View style={{
                    borderColor: app_theme.colors.border,
                    borderTopWidth: 1,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingVertical: 10,
                    marginHorizontal: 15,
                    marginBottom: 50
                }} entering={FadeIn} exiting={FadeOut}>
                    <View>
                        <TextNormalYambi text={phone_numbers_list.length <= 1 ? phone_numbers_list.length + " " + strings.contact_selected.toLowerCase() : phone_numbers_list.length + " " + strings.contacts_selected.toLowerCase()} />
                        <TextSmallYambiGray text={strings.from_your_contacts} />
                    </View>
                    <Pressable
                        onPress={ForwardTheMessage}
                        style={{ height: 35, paddingHorizontal: 25, justifyContent: 'center', alignItems: 'center', backgroundColor: app_theme.colors.button_background_color, borderRadius: 5, borderColor: app_theme.colors.border, borderWidth: 1 }}>
                        {!loading ?
                            <Text style={{
                                color: app_theme.colors.button_foreground_color,
                                fontSize: app_description.general_font_size
                            }}>{strings.send}</Text> :
                            <AppActivityIndicator color={app_theme.colors.button_foreground_color} />}
                    </Pressable>
                </Animated.View> : null}
        </View>
    );

}

export default ForwardMessage;
