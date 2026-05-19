import { TouchableOpacity, Text, View, Image, Pressable } from "react-native";
import { TChat, TStory, TUser } from "../../../types/types";
import Animated from "react-native-reanimated";
// import MessageText from "./ReturnMessage";
import { useAppDispatch, useAppSelector } from "../../../store/app/hooks";
import { memo, useState } from "react";
import { useObject, useQuery, useRealm } from "@realm/react";
import { UserChats, UserContacts, UsersMessages } from "../../../store/database/Models";
import { TextBigYambi, TextNormalYambi, TextSmallYambiGray, TextSmallYambiHighColor } from "../../app/Text";
import { strings } from "../../../lang/lang";
import { IconApp } from "../../app/IconApp";
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { remote_host_server, renderDateTime, media_url } from "../../../../GlobalVariables";
import FastImage from "react-native-fast-image";
import * as RootNavigation from '../../../services/Navigation_ref';

const UserStories = ({ item, index, GoStory }: { item: TStory, index: number, GoStory }) => {

    const app_theme = useAppSelector(state => state.app_theme);
    const app_description = useAppSelector(state => state.persisted_app.app_description);
    const contacts = useAppSelector(state => state.app.raw_contacts);
    const user_data = useAppSelector(state => state.user_data);
    const dispatch = useAppDispatch();
 
    const ShowUserName = (user_names: string, phone_number: string) => {
        const contact = contacts.find((cc) => cc.phoneNumber === phone_number);
        if (contact !== undefined) {
            return contact.displayName;
        } else {
            return user_names;
        }
    }

    return (
        <TouchableOpacity
            onPress={() => GoStory(item.phone_number)}
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent:'center',
                marginVertical: 15,
            }}>
                <TextBigYambi text="bgdgweyf gqewiy u"/>
            {/* <Pressable style={{
                borderColor: app_theme.colors.high_color,
                borderWidth: 2,
                borderRadius: 50,
                padding: 2
            }}>
                {item.user.user_profile === "" ? <Image
                    source={require('./../../assets/profile_black.jpg')}
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
                            uri: media_url + "/profile_pictures/" + item.user.user_profile
                        }} />}
                        <View style={{
                                backgroundColor: app_theme.colors.badge_background_color,
                                height: 20,
                                minWidth: 20,
                                paddingHorizontal: 3,
                                borderRadius: 15,
                                justifyContent: 'center',
                                alignItems: 'center',
                                position:'absolute'
                            }}>
                                <Text style={{
                                    fontSize: 16,
                                    color: app_theme.colors.badge_color
                                }}>{item.stories.length}</Text>
                            </View>
            </Pressable>
            <View style={{
                flex: 1,
                marginLeft: 15
            }}>
                <View>
                    <View style={{ marginBottom: 3, flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                        <TextNormalYambi text={ShowUserName(item.user.user_names, item.user.phone_number)} numberLines={1} />
                        {item.user.user_verified === 1 ? <IconApp name="verified" pack="MT" size={15} color={app_theme.colors.high_color} styles={{ marginLeft: 5 }} /> : null}
                    </View>
                    <TextSmallYambiGray text={renderDateTime(item.lastDate, 1, false)} styles={{ marginBottom: 3 }} />
                </View>
            </View> */}
        </TouchableOpacity>
    )
};

export default memo(UserStories);