import { useState, useEffect } from 'react';
import { View, Pressable, Text, ScrollView, TextInput } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import FontAwesome from 'react-native-vector-icons/FontAwesome';
// import Feather from 'react-native-vector-icons/Feather';
// import * as Animatable from 'react-native-animatable';
// import * as Localization from 'react-native-localization';
import { strings } from '../../lang/lang';
// import changeNavigationBarColor from 'react-native-navigation-bar-color';
// import { PermissionsAndroid } from 'react-native';
// import Contacts from 'react-native-contacts';
// import { connect, useDispatch, useSelector } from 'react-redux';
// import Realm, { BSON } from 'realm';
// import { useNavigation } from '@react-navigation/native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useAppDispatch, useAppSelector } from '../../store/app/hooks';
// import ButtonNormal from '../../components/app/ButtonNormal';
import StatusBarYambi from '../app/StatusBar';
import { NavProps, TMessage } from '../../types/types';
// import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
// import Entypo from 'react-native-vector-icons/Entypo'/;
// import countries from '../../assets/countries_en';
// import ContactsList from '../../components/lists/ContactsList';
import { setMessageInbox, setMessageSelected, setPhoneNumbersList, setResponseTo } from '../../store/reducers/appSlice';
// import { FlashList } from '@shopify/flash-list';
import { TextNormalYambi, TextNormalYambiGray } from '../app/Text';
// import { IconApp } from '../../components/app/IconApp';
import { useObject, useQuery, useRealm } from '@realm/react';
import { UserChats, UsersMessages } from '../../store/database/Models';
// import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PlayActionSound, SocketApp } from '../../../GlobalVariables';
import moment from 'moment';
import AppActivityIndicator from '../app/AppActivityIndicator';
import { SafeAreaView } from 'react-native-safe-area-context';
// import { SocketApp } from '../../../App';

// const navigation = NativeStackScreenProps<RootStackParamList>();

const MessageInfo = ({ route, navigation }: NavProps) => {

    const { message_id } = route.params;
    const { flag } = route.params;

    const app_theme = useAppSelector(state => state.app_theme);
    const user_data = useAppSelector(state => state.user_data);
    const contacts = useAppSelector(state => state.app.raw_contacts);
    const dispatch = useAppDispatch();
    const phone_numbers_list = useAppSelector(state => state.app.phone_numbers_list);
    // const message_selected = useAppSelector(state => state.app.message_selected);
    const app_description = useAppSelector(state => state.persisted_app.app_description);
    const [loading, setLoading] = useState<boolean>(false);
    const [edited_message, setEdited_message] = useState<string>("");
    const realm = useRealm();
    const message = useObject(UsersMessages, message_id);

    const chats = useQuery(UserChats);

    const FirstAction = () => {
        // console.log(message)
        setEdited_message(message.main_text_message);
    }

    const ShowUserName = (user_names: string, phone_number: string) => {

        const contact = contacts.find((cc) => cc.phoneNumber === phone_number);
        // console.log(contact)
        if (contact !== undefined) {
            // console.log(contact)
            return contact.displayName;
        } else {
            return user_names;
        }

        // return "OK"
    }

    useEffect(() => {

        if (flag === 1) {
            navigation.setOptions({ title: strings.edit_message });
        } else {
            navigation.setOptions({ title: strings.message_info });
        }

        FirstAction();

    }, []);

    const EditTheMessage = () => {
        if (message) {
            if (message.main_text_message.trim() !== edited_message.trim()) {
                // setLoading(true);
                // for (let i in phone_numbers_list) {
                // PlayActionSound(2);
                // const time = moment(new Date()).format();
                // const token = randomString(30) + renderDateUpToMilliseconds();

                // let message_read = 0;

                // if (!tokenn) {
                //   tokenn = token;
                // }

                // if (message.message_type === 1) {
                //   message_read = 5;
                // }

                const msg: TMessage = {
                    sender: message.sender,
                    receiver: message.receiver,
                    main_text_message: edited_message,
                    caption: message.caption,
                    message_type: message.message_type,
                    reactions: message.reactions,
                    response_to: message.response_to,
                    message_read: 0,
                    message_effect: message.message_effect,
                    read_once: message.read_once,
                    flag: 1,
                    token: message.token,
                    deleted: message.deleted,
                    platform: message.platform,
                    createdAt: message.createdAt,
                    receivedAt: message.receivedAt,
                    readAt: message.readAt,
                    playedAt: message.playedAt,
                    cc: message.cc,//moment(time).format('DD/MM/YYYY'),
                    alignment: message.alignment//moment().format()
                }

                // const this_chat = chats.find(cc => cc._id === message.receiver);
                // const chat = {
                //     _id: this_chat !== undefined ? this_chat._id : message.receiver,
                //     phone_number: this_chat !== undefined ? this_chat.phone_number : message.receiver,
                //     type_chat: this_chat !== undefined ? this_chat.type_chat : 0,
                //     last_message: this_chat !== undefined ? this_chat.flag : token,
                //     user: user_data.phone_number,
                //     flag: this_chat !== undefined ? this_chat.flag : 0,
                //     chat_read: this_chat !== undefined ? this_chat.chat_read : 1,
                //     deleted: this_chat !== undefined ? this_chat.deleted : 0,
                //     chat_effect: this_chat !== undefined ? this_chat.chat_effect : 0,
                //     createdAt: this_chat !== undefined ? this_chat.chat_effect : time,
                //     updatedAt: this_chat !== undefined ? this_chat.chat_effect : time
                // }

                realm.write(() => {
                    try {
                        realm.create('UsersMessages', msg, true);
                        // } catch (error) { }

                        // try {
                        // realm.create('UserChats', chat, true);
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

                // if (message.message_type === 0) {
                SocketApp.emit('newMessage', msg);
                // }

                // console.log(message)
                // }
                // }

                // setTimeout(() => {
                //     dispatch(setMessageInbox(""));
                //     // dispatch(setMessageInbox(""));
                //     // dispatch(addDraft({ message_inbox: "", user: current_user }));
                //     dispatch(setResponseTo(""));

                //     dispatch(setPhoneNumbersList(""));

                    dispatch(setMessageSelected(""));

                //     navigation.navigate("Home");

                // }, phone_numbers_list.length <= 5 ? 800 : 1300);
            }
        }
    }


    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: app_theme.colors.background, borderColor: app_theme.colors.border, borderTopWidth: 1 }}>

            <StatusBarYambi />

            <View style={{ margin: 15, flex: 1 }}>
                <ScrollView keyboardShouldPersistTaps='handled'>
                    <TextNormalYambi text={message.message_type === 1 ? strings.voice_note : message.message_type === 2 ? strings.picture : message?.main_text_message} />

                    {flag === 0 ?
                        <View style={{
                            borderColor: app_theme.colors.border,
                            borderTopWidth: 1,
                            marginTop: 15,
                            paddingTop: 10
                        }}>
                            <View style={{ marginVertical: 5 }}>
                                <TextNormalYambiGray text={strings.from} />
                                <TextNormalYambi text={message.sender === user_data.phone_number ? message.sender + " (You)" : message.sender} />
                            </View>

                            <View style={{ marginVertical: 5 }}>
                                <TextNormalYambiGray text={strings.to} />
                                <TextNormalYambi text={message.receiver === user_data.phone_number ? message.receiver + " (You)" : ShowUserName(message.receiver, message.receiver)} />
                            </View>

                            <View style={{ marginVertical: 5 }}>
                                <TextNormalYambiGray text={strings.message_type} />
                                <TextNormalYambi text={message.message_type === 0 ? strings.plain_text_message : message.message_type === 1 ? strings.voice_note : strings.picture} />
                            </View>

                            {message.caption !== "" ?
                                <View style={{ marginVertical: 5 }}>
                                    <TextNormalYambiGray text={strings.caption} />
                                    <TextNormalYambi text={message.caption} />
                                </View> : null}

                            <View style={{ marginVertical: 5 }}>
                                <TextNormalYambiGray text={strings.platform} />
                                <TextNormalYambi text={message.platform} />
                            </View>

                            <View style={{ marginVertical: 5 }}>
                                <TextNormalYambiGray text={strings.sent} />
                                <TextNormalYambi text={moment(message.createdAt).format('LT')} />
                            </View>

                            <View style={{ marginVertical: 5 }}>
                                <TextNormalYambiGray text={strings.received} />
                                <TextNormalYambi text={message.receivedAt === "" ? "-" : moment(message.receivedAt).format('LT')} />
                            </View>

                            <View style={{ marginVertical: 5 }}>
                                <TextNormalYambiGray text={strings.seen} />
                                <TextNormalYambi text={message.readAt === "" ? "-" : moment(message.readAt).format('LT')} />
                            </View>

                            {message.message_type === 1 ?
                                <View style={{ marginVertical: 5 }}>
                                    <TextNormalYambiGray text={strings.played} />
                                    <TextNormalYambi text={message.playedAt === "" ? "-" : moment(message.playedAt).format('LT')} />
                                </View> : null}
                        </View> : null}

                </ScrollView>
            </View>


            {flag === 1 ?
                <View style={{
                    borderColor: app_theme.colors.border,
                    borderTopWidth: 1,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    // backgroundColor: 'green',
                    // paddingVertical: 10,
                    marginHorizontal: 15
                }}>
                    <TextInput
                        multiline={true}

                        style={{ flex: 1, minHeight: 50, fontSize: app_description.general_font_size, maxHeight: 250, color: app_theme.colors.text, backgroundColor: app_theme.colors.background }}
                        placeholder={strings.message}
                        // value={draft !== null ? draft.draft : null}
                        value={edited_message}
                        onChangeText={(text) => setEdited_message(text)}
                        placeholderTextColor={app_theme.colors.gray}
                    />

                    <Animated.View entering={FadeIn} exiting={FadeOut}>
                        <Pressable
                            onPress={EditTheMessage}
                            style={{
                                height: 35, paddingHorizontal: 25, justifyContent: 'center', alignItems: 'center',
                                backgroundColor: message.main_text_message.trim() !== edited_message.trim() ? app_theme.colors.design_tip2 : app_theme.colors.gray,
                                borderRadius: 5, borderColor: app_theme.colors.border, borderWidth: 1
                            }}>
                            {!loading ?
                                <Text style={{ color: app_theme.colors.text_design2 }}>{strings.send}</Text> :
                                <AppActivityIndicator color={app_theme.colors.text_design2} />}
                        </Pressable>
                    </Animated.View>
                </View> : null}
        </SafeAreaView>
    );

}

export default MessageInfo;
