import {  Pressable, View, Image, Dimensions } from "react-native";
import { TStory } from "../../../types/types";
// import MessageText from "./ReturnMessage";
import { useAppDispatch, useAppSelector } from "../../../store/app/hooks";
import { memo, useEffect, useState } from "react";
import { TextNormalYambi, TextNormalYambiHighColor, TextSmallYambi, TextSmallYambiGray } from "../../app/Text";
import * as RootNavigation from '../../../services/Navigation_ref';
import { Image as ExpoImage } from 'expo-image';
import { remote_host_server, renderDateTime, media_url } from "../../../../GlobalVariables";
import { IconApp } from "../../app/IconApp";
import { useObject } from "@realm/react";
import Pinchable from 'react-native-pinchable';
import { UserContacts } from "../../../store/database/Models";
import { strings } from "../../../lang/lang";



const StoryMainItem = ({ item, index }: { item: TStory, index: number }) => {

    const app_theme = useAppSelector(state => state.app_theme);
    const app_description = useAppSelector(state => state.persisted_app.app_description);
    const contacts = useAppSelector(state => state.app.raw_contacts);
    const user_data = useAppSelector(state => state.user_data);
    const [imageHeight, setImageHeight] = useState(200);
    const dispatch = useAppDispatch();
    const screenWidth = Dimensions.get('window').width - 78;

    const ShowUserName = (user_names: string, phone_number: string) => {
        const contact = contacts.find((cc) => cc.phoneNumber === phone_number);
        if (contact !== undefined) {
            return contact.displayName;
        } else {
            return user_names;
        }
    }

    useEffect(() => {
        // Récupère les dimensions de l'image distante
        Image.getSize(
            media_url + "/photo_status/" + item.main_text,
            (width, height) => {
                const ratio = height / width;
                const calculatedHeight = screenWidth * ratio;
                setImageHeight(calculatedHeight);
            },
            (error) => {
                // console.error('Erreur lors de la récupération des dimensions de l’image:', error);
            }
        );
    }, [item]);

    const ViewPhoto = () => {
        if (item.main_text !== "") {
            RootNavigation.navigate("ViewPhoto", { source: media_url + "/photo_status/" + item.main_text });
        } else {
            RootNavigation.navigate("ViewPhoto", { source: "" })
        }
    }

    const user = item.phone_number === user_data.phone_number ? user_data : useObject(UserContacts, item.phone_number);

    return (
        <Pressable
            style={{
                marginBottom: 10,
                flexDirection: 'row',
                marginTop: index !== 0 ? 5 : 10,
            }}>

            <View style={{
                width: 38,
                marginRight: 5,
                // justifyContent: 'center',
                alignItems: 'center'
            }}>

                {index === 0 ?
                    <Pressable style={{
                        borderColor: app_theme.colors.high_color,
                        borderWidth: 2,
                        borderRadius: 50,
                        padding: 2,
                        // height: 38
                    }}>
                        {user.user_profile === "" ? <Image
                            source={require('./../../../assets/profile_black.jpg')}
                            style={{ width: 25, height: 25, borderRadius: 50, borderWidth: 1, borderColor: app_theme.colors.border }}
                        />
                            :
                            <ExpoImage
                                style={{
                                    height: 25,
                                    width: 25,
                                    borderRadius: 50
                                }}
                                contentFit="cover"
                                source={media_url + "/profile_pictures/" + user.user_profile} />}
                    </Pressable> : null}

                <View style={{
                    // backgroundColor: app_theme.colors.border,
                    width: 3,
                    // height: '95%',
                    marginTop: 10,
                    borderRadius: 5
                }}></View>
                <IconApp name="circle" pack="MT" size={8} color={index !== 0 ? app_theme.colors.text : 'transparent'} styles={{ position: 'absolute', top: 5 }} />
            </View>
            <View style={{
                flex: 1,
                // borderBottomWidth:1
            }}>
                {/* {index !== 0 ? */}

                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TextNormalYambi text={ShowUserName(user.user_names, user.phone_number)} numberLines={1} />
                    {user.user_verified === 1 ? <IconApp name="verified" pack="MT" size={15} color={app_theme.colors.high_color} styles={{ marginLeft: 5 }} /> : null}
                </View>
                <View style={{
                    flexDirection: 'row', alignItems: 'center', marginBottom: item.caption === "" ? 5 : 0
                }}>
                    <TextSmallYambiGray text={renderDateTime(item.createdAt, 1, false)} styles={{ flex: 1 }} numberLines={1} />
                    <TextNormalYambiHighColor text={strings.repost} />
                </View>
                {/* </> : null} */}
                {item.caption !== "" ?
                    <TextNormalYambi text={item.caption} styles={{ marginVertical: 5 }} /> : null}

                <Pressable onPress={ViewPhoto}>
                    <Pinchable>
                        <ExpoImage
                            style={{
                                height: imageHeight,
                                borderRadius: 5
                            }}
                            contentFit="cover"
                            source={media_url + "/photo_status/" + item.main_text} />
                    </Pinchable>
                </Pressable>

                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 8,
                }}>
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                        <IconApp name="bubbles" pack="SLI" size={16} color={app_theme.colors.gray} />
                        <TextSmallYambiGray text="15" styles={{ marginLeft: 3 }} />
                    </View>

                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                        <IconApp name="heart-outline" pack="IO" size={16} color={app_theme.colors.gray} />
                        <TextSmallYambiGray text="96" styles={{ marginLeft: 3 }} />
                    </View>

                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                        <IconApp name="retweet" pack="AD" size={16} color={app_theme.colors.gray} />
                        <TextSmallYambiGray text="8" styles={{ marginLeft: 3 }} />
                    </View>

                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                        <IconApp name="eye" pack="FI" size={16} color={app_theme.colors.gray} />
                        <TextSmallYambiGray text="15" styles={{ marginLeft: 3 }} />
                    </View>

                    {/* <View style={{
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                        <IconApp name="comment-discussion" pack="OC" size={16} color={app_theme.colors.gray} />
                        <TextSmallYambiGray text="15" styles={{ marginLeft: 3 }} />
                    </View> */}
                </View>
            </View>
        </Pressable>
    )
};

export default memo(StoryMainItem);