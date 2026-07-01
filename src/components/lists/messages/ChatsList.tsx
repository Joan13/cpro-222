import { Text, View, Image, Pressable, Vibration } from "react-native";
import { TChat, TUser } from "../../../types/types";
import Animated from "react-native-reanimated";
// import MessageText from "./ReturnMessage";
import { useAppDispatch, useAppSelector } from "../../../store/app/hooks";
import { memo, useState, useEffect, useRef } from "react";
import { useObject, useQuery, useRealm } from "@realm/react";
import { UserChats, UserContacts, UsersMessages } from "../../../store/database/Models";
import { YambiText } from "../../app/Text";
import { strings } from "../../../lang/lang";
import { IconApp } from "../../app/IconApp";
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { remote_host_server, renderDateTime, media_url, formatPhoneInternational } from "../../../../GlobalVariables";
import { Image as ExpoImage } from 'expo-image';
import * as RootNavigation from '../../../services/Navigation_ref';
import * as DropdownMenu from 'zeego/dropdown-menu';
import * as ContextMenu from 'zeego/context-menu';
import moment from 'moment';

const RenderChats = ({ item, GoInbox }: { item: TChat, GoInbox }) => {

    const app_theme = useAppSelector(state => state.app_theme);
    const app_description = useAppSelector(state => state.persisted_app.app_description);
    const badge = useAppSelector(state => state.app.chats_badge);
    const contacts = useAppSelector(state => state.app.raw_contacts);
    const user_data = useAppSelector(state => state.user_data);
    const show_favorite_chats = useAppSelector(state => state.app.show_favorite_chats);
    const dispatch = useAppDispatch();
    const message = useObject(UsersMessages, item.last_message);
    const userrr = useObject(UserContacts, item._id);
    const chat = useObject(UserChats, item._id);
    const realm = useRealm();
    const [isLongPressed, setIsLongPressed] = useState(false);
    const menuCloseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    let userr: TUser = {
        user_id: item._id,
        user_names: item._id,
        phone_number: item._id,
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
        createdAt: "",
        updatedAt: ""
    }

    if (userrr !== null) {
        userr = userrr;
    }

    const ShowUser = (user: TUser) => {
        const contact = contacts.find((cc) => cc.phoneNumber === user.phone_number);
        if (contact !== undefined) {
            return contact.displayName;
        }
        if (user.user_names !== user.phone_number) {
            return user.user_names;
        }
        return formatPhoneInternational(user);
    };

    // console.log(chat);

    // const drafts = useAppSelector(state => state.drafts);

    // const draft = drafts.find(dd => dd.user.phone_number === item.phone_number);

    // console.log(item)
    // const unread = useQuery(
    //     UsersMessages, msgs => {
    //         return msgs.filtered('(receiver == $0 && sender == $1) && (message_read == $2 || message_read == $3) && deleted == $4', user_data.phone_number, item._id, 0, 1, 2, 0);
    //     }, []);

    // const timeColor = () => {
    //     if (message.sender !== user_data.phone_number && message.message_read === 2) {
    //         return true;
    //     }

    //     return false;
    // }

    const IconMessageRead = (icon: number) => {
        if (icon === 3 || icon === 4) {
            return <IconApp pack="MC" name="checkbox-multiple-marked-circle" size={17} color={app_theme.colors.high_color} styles={{ marginRight: 8, marginTop: 0 }} />
        }

        if (icon === 2) {
            return <IconApp pack="MC" name="checkbox-multiple-marked-circle" size={17} color={app_theme.colors.gray} styles={{ marginRight: 8, marginTop: 0 }} />
        }

        if (icon === 1) {
            return <IconApp pack="MC" name="check" size={15} color={app_theme.colors.gray} styles={{ marginRight: 8, marginTop: 0 }} />
        }

        else {
            return <IconApp pack="MC" name="progress-upload" size={15} color={app_theme.colors.gray} styles={{ marginRight: 8, marginTop: 0 }} />
        }
    }

    const isGroup = item.type_chat === 2;

    const unread = useQuery(
        UsersMessages, msgs => {
            if (isGroup) {
                return msgs.filtered(
                    'receiver == $0 && sender != $1 && message_read < $2 && deleted == $3',
                    item._id,
                    user_data.phone_number,
                    3,
                    0
                );
            } else {
                return msgs.filtered(
                    'receiver == $0 && sender == $1 && message_read < $2 && deleted == $3',
                    user_data.phone_number,
                    item._id,
                    3,
                    0
                );
            }
        }, [isGroup, item._id, user_data.phone_number]
    );

    // console.log(unread.length)

    // if (message.sender !== user_data.phone_number) {
    //     if (item.chat_read === 0) {
    //         if (!badge.includes(item._id)) {
    //             dispatch(setAddChatBadge(item._id));
    //         }
    //     }
    // }

    const render_last_message = () => {

        if (message === null) return;

        if (message.message_type === 0) {
            return (
                <View style={{
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    flex: 1,
                    marginTop: 3
                }}>
                    {message.sender === user_data.phone_number ? IconMessageRead(message.message_read) : null}
                    {message.deleted > 0 ? <IconApp pack="FI" name="minus-circle" size={14} color={app_theme.colors.gray} styles={{ marginRight: 5 }} /> : null}
                    <YambiText text={message.deleted === 0 ? message.main_text_message : strings.message_deleted} size="small" color="gray" numberLines={1} style={{ flex: 1, marginRight: 10 }} />
                </View>
            );
        } else if (message.message_type === 1) {
            return (
                <View style={{
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    flex: 1,
                    marginTop: 3
                }}>
                    {message.sender === user_data.phone_number ? IconMessageRead(message.message_read) : null}
                    {message.deleted > 0 ? <IconApp pack="FI" name="minus-circle" size={14} color={app_theme.colors.gray} styles={{ marginRight: 5 }} /> : <IconApp pack="FA" name="microphone" size={14} color={app_theme.colors.gray} styles={{ marginRight: 8 }} />}
                    <YambiText text={message.deleted !== 0 ? strings.message_deleted : strings.voice_note} size="small" color="gray" numberLines={1} style={{ flex: 1, marginRight: 10 }} />
                </View>
            );
        } else {
            return (
                <View style={{
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    flex: 1,
                    marginTop: 3
                }}>
                    {message.sender === user_data.phone_number ? IconMessageRead(message.message_read) : null}
                    {message.deleted > 0 ? <IconApp pack="FI" name="minus-circle" size={14} color={app_theme.colors.gray} styles={{ marginRight: 5 }} /> : <IconApp pack="FI" name="image" size={12} color={app_theme.colors.gray} styles={{ marginRight: 8 }} />}
                    <YambiText text={message.deleted !== 0 ? strings.message_deleted : strings.picture} size="small" color="gray" numberLines={1} style={{ flex: 1, marginRight: 5 }} />
                </View>
            );
        }
    }


    // const MessageText = ({token} :{token: string}) => {
    //     const message = useObject(UsersMessages, token);
    //     // const current_user = useAppSelector(state => state.current_user);
    //     // const user_data = useAppSelector(state => state.user_data);

    // console.log(item)


    //     // const messages = useQuery(
    //     //     UsersMessages, msgs => {
    //     //         return msgs.filtered('receiver == $0 || sender == $1', current_user.phone_number, current_user.phone_number)
    //     //             .sorted('createdAt', true);
    //     //     }, []);



    //     // useEffect(()=> {
    //     //     console.log(chat_exists);
    //     // },[]);
    //     console.log(message)

    //     return (
    //         <Text>{message?.main_text_message}</Text>
    //     )
    // };

    // console.log(item.phone_number)

    // const contact: TUser = contacts.filter(cc => cc.phone_number === item._id)[0];

    const ViewPhoto = () => {
        if (userr.user_profile !== "") {
            RootNavigation.navigate("ViewPhoto", { source: media_url + "/profile_pictures/" + userr.user_profile })
        } else {
            RootNavigation.navigate("ViewPhoto", { source: "" })
        }
    }

    const clearHighlight = () => {
        if (menuCloseTimeoutRef.current) {
            clearTimeout(menuCloseTimeoutRef.current);
            menuCloseTimeoutRef.current = null;
        }
        setIsLongPressed(false);
    };

    useEffect(() => {
        return () => {
            if (menuCloseTimeoutRef.current) {
                clearTimeout(menuCloseTimeoutRef.current);
            }
        };
    }, []);

    const handlePinChat = () => {
        if (chat) {
            const updatedChat: TChat = {
                _id: chat._id,
                phone_number: chat.phone_number,
                type_chat: chat.type_chat,
                last_message: chat.last_message,
                user: chat.user,
                flag: chat.flag === 2 ? 0 : 2, // Toggle pin (2 = pinned, 0 = unpinned)
                chat_read: chat.chat_read,
                deleted: chat.deleted,
                chat_effect: chat.chat_effect,
                createdAt: chat.createdAt,
                updatedAt: moment().format(),
            };

            realm.write(() => {
                try {
                    realm.create('UserChats', updatedChat, true);
                } catch (error) { }
            });
        }
    };

    const handleAddToFavorites = () => {
        if (chat) {
            const updatedChat: TChat = {
                _id: chat._id,
                phone_number: chat.phone_number,
                type_chat: chat.type_chat,
                last_message: chat.last_message,
                user: chat.user,
                flag: chat.flag === 1 ? 0 : 1, // Toggle favorite (1 = favorite, 0 = remove)
                chat_read: chat.chat_read,
                deleted: chat.deleted,
                chat_effect: chat.chat_effect,
                createdAt: chat.createdAt,
                updatedAt: moment().format(),
            };

            realm.write(() => {
                try {
                    realm.create('UserChats', updatedChat, true);
                } catch (error) { }
            });
        }
    };

    const handleDeleteChat = () => {
        if (chat) {
            const updatedChat: TChat = {
                _id: chat._id,
                phone_number: chat.phone_number,
                type_chat: chat.type_chat,
                last_message: chat.last_message,
                user: chat.user,
                flag: chat.flag,
                chat_read: chat.chat_read,
                deleted: 1, // Mark as deleted
                chat_effect: chat.chat_effect,
                createdAt: chat.createdAt,
                updatedAt: moment().format(),
            };

            realm.write(() => {
                try {
                    realm.create('UserChats', updatedChat, true);
                } catch (error) { }
            });
        }
    };

    const handleLongPress = () => {
        Vibration.vibrate(25);
        setIsLongPressed(true);
    };

    // if(show_favorite_chats)
    return (
        <ContextMenu.Root onOpenChange={(open) => {
            if (!open) {
                // Menu closed, clear highlight after a small delay
                if (menuCloseTimeoutRef.current) clearTimeout(menuCloseTimeoutRef.current);
                menuCloseTimeoutRef.current = setTimeout(clearHighlight, 100);
            }
        }}>
            <ContextMenu.Trigger>
                <Pressable
                    onPress={() => {
                        if (!isLongPressed) {
                            GoInbox(item.phone_number);
                        }
                    }}
                    onLongPress={handleLongPress}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 15,
                        paddingVertical: 15,
                        backgroundColor: isLongPressed ? app_theme.colors.high_color + "30" : 'transparent',
                        borderRadius: 12,
                        width: '100%',
                    }}>
            {/* <Text></Text> */}
            <Pressable onPress={ViewPhoto}>
                {userr.user_profile === "" ? <Image
                    source={require('./../../../assets/profile_black.jpg')}
                    style={{ width: 45, height: 45, borderRadius: 50, borderWidth: 1, borderColor: app_theme.colors.border }}
                />
                    :
                    <ExpoImage
                        style={{
                            height: 45,
                            width: 45,
                            borderRadius: 50
                        }}
                        contentFit="cover"
                        source={media_url + "/profile_pictures/" + userr.user_profile} />}
            </Pressable>
            <View style={{
                flex: 1,
                marginLeft: 15
            }}>
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: -2
                }}>
                    <View style={{ marginBottom: 2, flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                        <YambiText bold text={ShowUser(userr)} size="normal" color="default" numberLines={1} />
                        {userr.user_verified === 1 ? <IconApp name="verified" pack="MT" size={15} color={app_theme.colors.high_color} styles={{ marginLeft: 5 }} /> : null}
                    </View>
                    {message !== null ?
                        chat && chat.chat_read !== 0 ?
                        <YambiText text={renderDateTime(message.createdAt, 0, true, true)} size="small" color="gray" style={{ marginBottom: 3 }} /> :
                        <YambiText text={renderDateTime(message.createdAt, 0, true, true)} size="small" color="high" style={{ marginBottom: 3 }} />: null}
                </View>

                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center'
                }}>

                    {render_last_message()}

                    {item.flag !== 0 ?
                        <IconApp pack="MC" name={item.flag === 2 ? "pin" : "star"} size={15} color={app_theme.colors.gray} /> : null}

                    {chat && chat.chat_read === 0 ?
                        unread.length !== 0 ?
                            <View style={{
                                backgroundColor: app_theme.colors.badge_background_color,
                                height: 20,
                                minWidth: 20,
                                paddingHorizontal: 3,
                                borderRadius: 15,
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginLeft: 5
                            }}>
                                <Text style={{
                                    fontSize: 16,
                                    color: app_theme.colors.badge_color
                                }}>{unread.length}</Text>
                            </View> : <View style={{
                                height: 23,
                                width: 0
                            }}></View> : null}
                </View>
            </View>
            </Pressable>
            </ContextMenu.Trigger>
            <ContextMenu.Content>
                {/* Pin/Unpin Chat */}
                <ContextMenu.Item
                    key="pin"
                    onSelect={handlePinChat}>
                    <ContextMenu.ItemTitle>
                        {chat && chat.flag === 2 ? strings.unpin_chat : strings.pin_chat}
                    </ContextMenu.ItemTitle>
                    <ContextMenu.ItemIcon ios={{ name: chat && chat.flag === 2 ? 'pin.slash' : 'pin' }} />
                </ContextMenu.Item>

                {/* Add to Favorites/Remove from Favorites */}
                <ContextMenu.Item
                    key="favorite"
                    onSelect={handleAddToFavorites}>
                    <ContextMenu.ItemTitle>
                        {chat && chat.flag === 1 ? strings.remove_from_favorites : strings.add_to_favorites}
                    </ContextMenu.ItemTitle>
                    <ContextMenu.ItemIcon ios={{ name: chat && chat.flag === 1 ? 'star.fill' : 'star' }} />
                </ContextMenu.Item>

                {/* Delete Chat */}
                <ContextMenu.Item
                    key="delete"
                    onSelect={handleDeleteChat}>
                    <ContextMenu.ItemTitle>{strings.delete}</ContextMenu.ItemTitle>
                    <ContextMenu.ItemIcon ios={{ name: 'trash' }} />
                </ContextMenu.Item>
            </ContextMenu.Content>
        </ContextMenu.Root>
    )
};

export default memo(RenderChats);