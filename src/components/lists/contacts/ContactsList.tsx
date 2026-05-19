import { TouchableOpacity, View, Image, Pressable, Text } from "react-native";
import { TUser } from "../../../types/types";
import { useAppSelector } from "../../../store/app/hooks";
import { memo, useEffect } from 'react';
import { YambiText } from "../../app/Text";
import Feather from 'react-native-vector-icons/Feather';
import FastImage from "react-native-fast-image";
import { formatPhoneInternational, remote_host_server, media_url } from "../../../../GlobalVariables";
import * as RootNavigation from '../../../services/Navigation_ref';
import { strings } from "../../../lang/lang";
import { IconApp } from "../../app/IconApp";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { UserContacts } from "../../../store/database/Models";
import { useQuery, useRealm } from "@realm/react";

const Item = ({ item, index, selectContact, type, isAdmin }: { item: TUser, index: number, selectContact, type: number, isAdmin?: boolean }) => {

    if (item === undefined || item === null) return;
    const app_theme = useAppSelector(state => state.app_theme);
    const contacts = useAppSelector(state => state.app.raw_contacts);
    const phone_numbers_list = useAppSelector(state => state.app.phone_numbers_list);
    const realm = useRealm();
    // const dispatch = useAppDispatch();

    // const cc = useQuery(UserContacts, item.ph);
    // Type 0 : NewChat
    // Type 1 : NewGroup
    // Type 2 : Contact selected

    // console.log(item)

    const RemoveContact = () => {
        const contact = contacts.find(element => element.phoneNumber === item.phone_number);

        if (contact === undefined) {
            realm.write(() => {
                try {
                    realm.delete(item);
                } catch (error) {

                }
            });
        }
    }

    const contact_selected = () => {
        const contact = phone_numbers_list.find(cc => cc === item.phone_number);

        if (contact) {
            return true;
        }

        return;
    }

    const show_information = () => {
        if (item.status_information !== "") {
            if (type === 0) {
                return true;
            }

            return false;
        }

        return false;
    }

    const show_type = () => {
        if (type === 2) {
            return 2;
        }

        if (type === 0 || type === 3) {
            return 0;
        }

        return 0;
    }

    const ShowUserName = (user_names: string, phone_number: string) => {
        const contact = contacts.find((cc) => cc.phoneNumber === phone_number);
        if (contact !== undefined) {
            return contact.displayName;
        } else {
            return user_names;
        }
    }

    const ViewPhoto = () => {
        if (item.user_profile !== "") {
            RootNavigation.navigate("ViewPhoto", { source: media_url + "/profile_pictures/" + item.user_profile })
        } else {
            RootNavigation.navigate("ViewPhoto", { source: "" })
        }
    }

    useEffect(() => {
        RemoveContact();
    }, [contacts]);

    // console.log('item displayed');
    if (show_type() === 2) {
        return (
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    marginVertical: 12,
                    width: 65
                }}>
                <View style={{
                    alignItems: 'center'
                }}>
                    <Image
                        // sharedTransitionTag={`${item.phone_number}-image`}
                        style={{
                            width: 45,
                            height: 45,
                            borderRadius: 60
                        }}
                        source={require("./../../../assets/profile_black.jpg")} />

                    <YambiText
                        text={item.user_names}
                        size="small"
                        color="default"
                        numberLines={2}
                        style={{
                            textAlign: 'center'
                        }}
                    // text={ShowUserName(item.user_names, item.phone_number)} 
                    />
                </View>
                <TouchableOpacity
                    onPress={() => selectContact(item)}
                    style={{
                        width: 20,
                        height: 20,
                        backgroundColor: app_theme.colors.background,
                        marginLeft: -15,
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderRadius: 5,
                        borderWidth: 1,
                        borderColor: app_theme.colors.border
                    }}>
                    <Feather
                        color={app_theme.colors.text}
                        name="x"
                        size={13} />
                </TouchableOpacity>
            </View>
        )
    }

    if (show_type() === 0) {
        return (
            <Pressable
                onPress={() => {
                    selectContact(item);
                }}
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginVertical: 15,
                }}>
                <Pressable style={{
                    flexDirection: 'row',
                    alignItems: 'baseline',
                }} onPress={ViewPhoto}>
                    {item.user_profile === "" ? <Image
                        source={require('./../../../assets/profile_black.jpg')}
                        style={{ width: 45, height: 45, borderRadius: 50, borderWidth: 1, borderColor: app_theme.colors.border }}
                    />
                        :
                        <FastImage
                            style={{
                                height: 45,
                                width: 45,
                                borderRadius: 50
                            }}
                            resizeMode={FastImage.resizeMode.cover}
                            source={{
                                priority: FastImage.priority.high,
                                cache: 'immutable',
                                uri: media_url + "/profile_pictures/" + item.user_profile
                            }} />}

{/* <Text style={{ color: 'red' }}>{media_url + "/profile_pictures/" + item.user_profile}</Text> */}

                    {contact_selected() ?
                        <Animated.View
                            entering={FadeIn}
                            exiting={FadeOut}
                            style={{
                                marginTop: 20,
                                marginLeft: 23,
                                borderWidth: 2,
                                borderRadius: 30,
                                borderColor: app_theme.colors.background,
                                height: 25,
                                width: 25,
                                justifyContent: 'center',
                                alignItems: 'center',
                                backgroundColor: app_theme.colors.success,
                                position: "absolute"
                            }}>
                            <View style={{
                                backgroundColor: 'white',
                                borderRadius: 50,
                                height: 16,
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}>
                                <IconApp name="check-circle" pack="FA" size={20} color={app_theme.colors.success} styles={{ marginTop: -2 }} />
                            </View>
                        </Animated.View> : null}
                </Pressable>

                <View style={{ flex: 1, marginLeft: 15 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <YambiText 
                            text={item.user_names}
                            size="normal"
                            color="default"
                            numberLines={1}
                            bold={true}
                        />
                        {item.user_verified === 1 ?
                            <IconApp name="verified" pack="MT" size={15} color={app_theme.colors.high_color} styles={{ marginLeft: 5 }} /> : null}
                    </View>
                    <YambiText text={formatPhoneInternational(item)} size="small" color="gray" numberLines={1} />
                    {show_information() ?
                        <YambiText text={item.status_information} size="small" color="default" numberLines={3} /> : null}
                    {isAdmin ?
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginTop: 0
                        }}>
                            <YambiText text={strings.admin} size="normal" color="high" numberLines={3} />

                            <Pressable style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginLeft: 20
                            }}
                                onPress={() => RootNavigation.navigate("EditProfile", { user: item })}>
                                <IconApp name="edit" pack="FI" size={16} color={app_theme.colors.high_color} />
                                <YambiText text={strings.edit} size="normal" color="high" numberLines={3} style={{ marginLeft: 5 }} />
                            </Pressable>
                        </View> : null}
                </View>
            </Pressable>
        )
    }

    if (show_type() === 0) {
        return (
            <TouchableOpacity
                onPress={() => {
                    selectContact(item);
                }}
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginVertical: 15,
                }}>
                <Pressable onPress={ViewPhoto}>
                    {item.user_profile === "" ? <Image
                        source={require('./../../../assets/profile_black.jpg')}
                        style={{ width: 45, height: 45, borderRadius: 50, borderWidth: 1, borderColor: app_theme.colors.border }}
                    />
                        :
                        <FastImage
                            style={{
                                height: 45,
                                width: 45,
                                borderRadius: 50
                            }}
                            resizeMode={FastImage.resizeMode.cover}
                            source={{
                                priority: FastImage.priority.high,
                                cache: 'immutable',
                                uri: media_url + "/profile_pictures/" + item.user_profile
                            }} />}
                </Pressable>
                <View style={{
                    flex: 1,
                    marginLeft: 15
                }}>
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center'
                    }}>
                        <YambiText 
                            text={item.user_names}
                            size="normal"
                            color="default"
                            numberLines={1}
                            bold={true}
                        />
                        {item.user_verified === 1 ?
                            <IconApp name="verified" pack="MT" size={15} color={app_theme.colors.high_color} styles={{ marginLeft: 5 }} /> : null}
                    </View>
                    <YambiText text={formatPhoneInternational(item)} size="small" color="gray" numberLines={1} />
                    {show_information() ?
                        <YambiText text={item.status_information} size="small" color="default" numberLines={3} /> : null}
                    {isAdmin ?
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginTop: 0
                        }}>
                            <YambiText text={strings.admin} size="normal" color="high" numberLines={3} />

                            <Pressable style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginLeft: 20
                            }}
                                onPress={() => RootNavigation.navigate("EditProfile", { user: item })}>
                                <IconApp name="edit" pack="FI" size={16} color={app_theme.colors.high_color} />
                                <YambiText text={strings.edit} size="normal" color="high" numberLines={3} style={{ marginLeft: 5 }} />
                            </Pressable>
                        </View> : null}
                </View>
            </TouchableOpacity>
        )
    }
};

export default memo(Item);

