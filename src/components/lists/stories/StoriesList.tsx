import {  Text, View, Image, Pressable } from "react-native";
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
import { Image as ExpoImage } from 'expo-image';
import * as RootNavigation from '../../../services/Navigation_ref';
import { FlashList } from "@shopify/flash-list";
import StoryMainItem from "./StoryMainItem";

const StoriesList = ({ item, index, GoStory }: { item: any, index: number, GoStory }) => {

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
        <Pressable
        onPress={GoStory}
        style={{
            marginVertical: 15,
        }}>
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    // justifyContent: 'center',
                    // marginVertical: 15,
                    // backgroundColor:'gray'
                }}>
                <View style={{
                    borderColor: app_theme.colors.high_color,
                    borderWidth: 2,
                    borderRadius: 50,
                    padding: 2,
                    height: 48
                }}>
                    {item.user.user_profile === "" ? <Image
                        source={require('./../../../assets/profile_black.jpg')}
                        style={{ width: 40, height: 40, borderRadius: 50, borderWidth: 1, borderColor: app_theme.colors.border }}
                    />
                        :
                        <ExpoImage
                            style={{
                                height: 40,
                                width: 40,
                                borderRadius: 50
                            }}
                            contentFit="cover"
                            source={media_url + "/profile_pictures/" + item.user.user_profile} />}
                    <View style={{
                        backgroundColor: app_theme.colors.badge_background_color,
                        height: 20,
                        minWidth: 20,
                        paddingHorizontal: 3,
                        borderRadius: 15,
                        justifyContent: 'center',
                        alignItems: 'center',
                        position: 'absolute',
                        top: -5
                    }}>
                        <Text style={{
                            fontSize: 16,
                            color: app_theme.colors.badge_color
                        }}>{item.stories.length}</Text>
                    </View>
                </View>
                <View style={{
                    flex: 1,
                    marginLeft: 15
                }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TextNormalYambi text={ShowUserName(item.user.user_names, item.user.phone_number)} numberLines={1} />
                        {item.user.user_verified === 1 ? <IconApp name="verified" pack="MT" size={15} color={app_theme.colors.high_color} styles={{ marginLeft: 5 }} /> : null}
                    </View>
                    <TextSmallYambiGray text={renderDateTime(item.lastDate, 1, false)} />
                </View>
            </View>
            {/* <FlashList
                data={item.stories as never}
                estimatedItemSize={500}
                onViewableItemsChanged={({ viewableItems }) => {
                    // console.log('Items visibles:', viewableItems);
                }}
                renderItem={({ item, index }: { item: TStory, index: number }) => (
                    <StoryMainItem
                        index={index}
                        item={item} />)}
                contentContainerStyle={{
                    // paddingHorizontal: 15
                }}
            /> */}
        </Pressable>
    )
};

export default memo(StoriesList);