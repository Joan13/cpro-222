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
import { SafeAreaView } from 'react-native-safe-area-context';
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

    const chats = useQuery(UserChats);

    const contacts = useQuery(
        UserContacts, ccs => {
            return ccs.filtered('phone_number != $0 && user_active != $1', user_data.phone_number, 0)
                .sorted('user_names', false);
        }, []);
    const [IIItems, setIIItems] = useState([]);

    const message = useObject(UsersMessages, message_selected);

    const update_user = () => {
        // console.log(raw_contacts)
        SocketApp.emit('update_contacts', raw_contacts);

        // SocketApp.on('server', () => {

        // });
    }
    // console.log(contacts);
    useEffect(() => {
        // changeNavigationColors(app_theme.colors.background);
        // set_base_theme();
        // CreateTables();

        // if (Platform.OS === 'android') {
        //     PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_CONTACTS, {
        //         title: 'Yambi contacts',
        //         message: 'Yambi wants to access your contacts in order to run properly',
        //     }).then((i) => {
        //         // loadContacts();
        //         console.log(i)
        //     });
        // } else {
        //     // loadContacts();
        // }

        // console.log(raw_contacts);

        // console.log(navigation)

        const iii = contacts.filter(item => item.user_active !== 0);
        setIIItems(iii as never);

        // update_user();
    }, [contacts]);



    // const SearchCountry = (search: String) => {
    //     let cc = countries.filter(item => item.name.includes(search.toString()));
    //     setCcc(cc);
    // }

    const selectCon = useCallback((item: TUser) => {
        // dispatch(setCurrentUser(item));
        // navigation.navigate("Inbox", { user: item.phone_number });

        if (item.phone_number === message.receiver) {
            return;
        }

        dispatch(setPhoneNumbersList(item.phone_number));
    }, []);

    // const renderItem = useCallback(({ item }: { item: TUser }) => {
    //     console.log('Show items');
    //     return (<ContactsList
    //         item={item}
    //         app_theme={app_theme}
    //         dispatch={dispatch}
    //         navigation={navigation}
    //         type_contact={type_contact}
    //     />)
    // }, []);

    const ForwardTheMessage = () => {
        if (message) {
            setLoading(true);
            for (let i in phone_numbers_list) {
                PlayActionSound(2);
                const time = moment(new Date()).format();
                const token = randomString(30) + renderDateUpToMilliseconds();

                // let message_read = 0;

                // if (!tokenn) {
                //   tokenn = token;
                // }

                // if (message.message_type === 1) {
                //   message_read = 5;
                // }

                const msg: TMessage = {
                    sender: user_data.phone_number,
                    receiver: phone_numbers_list[i],
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
                    alignment: moment().format()
                }

                const this_chat = chats.find(cc => cc._id === phone_numbers_list[i]);
                //   const chat = {
                //     _id: this_chat !== undefined ? this_chat._id : message.receiver,
                //     phone_number: this_chat !== undefined ? this_chat.phone_number : message.receiver,
                //     type_chat: this_chat !== undefined ? this_chat.type_chat : 0,
                //     last_message: this_chat !== undefined ? this_chat.token : token,
                //     user: user_data.phone_number,
                //     flag: this_chat !== undefined ? this_chat.flag : 0,
                //     chat_read: this_chat !== undefined ? this_chat.chat_read : 1,
                //     deleted: this_chat !== undefined ? this_chat.deleted : 0,
                //     chat_effect: this_chat !== undefined ? this_chat.chat_effect : 0,
                //     createdAt: this_chat !== undefined ? this_chat.createdAt : time,
                //     updatedAt: this_chat !== undefined ? this_chat.updatedAt : time
                //   }

                const chat = {
                    _id: phone_numbers_list[i],
                    phone_number: phone_numbers_list[i],
                    type_chat: this_chat !== undefined ? this_chat.type_chat : 0,
                    last_message: token,
                    user: user_data.phone_number,
                    flag: this_chat !== undefined ? this_chat.flag : 0,
                    chat_read: this_chat !== undefined ? this_chat.chat_read : 1,
                    deleted: 0,
                    chat_effect: this_chat !== undefined ? this_chat.chat_effect : 0,
                    createdAt: time,
                    updatedAt: time
                }

                realm.write(() => {
                    try {
                        realm.create('UsersMessages', msg);
                        // } catch (error) { }

                        // try {
                        realm.create('UserChats', chat, true);
                    } catch (error) { }
                });

                // realm.write(() => {
                //   try {
                //     realm.create('UserChats', chat, true);
                //   } catch (error) { }
                // });


                // dispatch(setMessageInbox(""));
                // // dispatch(setMessageInbox(""));

                // // dispatch(addDraft({ message_inbox: "", user: current_user }));
                // dispatch(setResponseTo(""));

                // dispatch(setPhoneNumbersList(""));

                // dispatch(setMessageSelected(""));

                // console.log("Message sent")

                if (message.message_type === 0) {
                    SocketApp.emit('newMessage', msg);
                }
            }
        }

        setTimeout(() => {
            dispatch(setMessageInbox(""));
            // dispatch(setMessageInbox(""));
            // dispatch(addDraft({ message_inbox: "", user: current_user }));
            dispatch(setResponseTo(""));

            dispatch(setPhoneNumbersList(""));

            dispatch(setMessageSelected(""));

            navigation.navigate("Home");

        }, phone_numbers_list.length <= 5 ? 800 : 1300);
    }

    const SearchItem = (search: string) => {
        dispatch(setTextContactSearch(search));
        let filtered_items = contacts.filter(item => {
            return item.user_active !== 0 && item.user_names.toLowerCase().includes(search.toLowerCase().toString())
                || item.user_active !== 0 && item.phone_number.toLowerCase().includes(search.toLowerCase().toString());
        });

        setIIItems(filtered_items as never);
    }

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
        <SafeAreaView style={{ flex: 1, backgroundColor: app_theme.colors.background, borderColor: app_theme.colors.border, borderTopWidth: 1 }}>

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
                        paddingHorizontal: 15
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
                    marginHorizontal: 15
                }} entering={FadeIn} exiting={FadeOut}>
                    <View>
                        <TextNormalYambi text={phone_numbers_list.length <= 1 ? phone_numbers_list.length + " " + strings.contact_selected.toLowerCase() : phone_numbers_list.length + " " + strings.contacts_selected.toLowerCase()} />
                        <TextSmallYambiGray text={strings.from_your_contacts} />
                    </View>
                    <Pressable
                        onPress={ForwardTheMessage}
                        style={{ height: 35, paddingHorizontal: 25, justifyContent: 'center', alignItems: 'center', backgroundColor: app_theme.colors.design_tip2, borderRadius: 5, borderColor: app_theme.colors.border, borderWidth: 1 }}>
                        {!loading ?
                            <Text style={{
                                color: app_theme.colors.text_design2,
                                fontSize: app_description.general_font_size
                            }}>{strings.send}</Text> :
                            <AppActivityIndicator color={app_theme.colors.text_design2} />}
                    </Pressable>
                </Animated.View> : null}
        </SafeAreaView>
    );

}

export default ForwardMessage;
