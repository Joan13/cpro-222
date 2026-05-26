import { Text, View, Image, Pressable, Dimensions, Platform, KeyboardAvoidingView, StatusBar as sb, TextInput } from "react-native";
import { useAppDispatch, useAppSelector } from "../../../store/app/hooks";
import { memo, useEffect, useState } from 'react';
import Animated from "react-native-reanimated";
import FastImage from "react-native-fast-image";
import { StatusBar } from 'expo-status-bar';
import { IconApp } from "../../app/IconApp";
import Pinchable from 'react-native-pinchable';
import { strings } from "../../../lang/lang";
import axios from "axios";
import { remote_host } from "../../../../GlobalVariables";
import ModalApp from "../../app/ModalApp";
import { setShowModalApp } from "../../../store/reducers/appSlice";
import { TextNormalYambiGray } from "../../app/Text";
import { useQuery, useRealm } from "@realm/react";
import AppActivityIndicator from "../../app/AppActivityIndicator";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UserContacts } from "../../../store/database/Models";
import { TStory } from "../../../types/types";

const NewStoryImagesList = ({ item, index, onReadyStatus, onGoBack, onDeleteStatus }: { item, onReadyStatus, onGoBack, onDeleteStatus, index: number }) => {
    const app_theme = useAppSelector(state => state.app_theme);
    // const article = useObject(UserBusinessArticles, item.item_id);
    // const prices = useObject(ItemPrices, "G" + article._id);
    const [height, setHeight] = useState(0);
    const [width, setWidth] = useState(0);
    const user_data = useAppSelector(state => state.user_data);
    const language = useAppSelector(state => state.persisted_app.langApp);
    const app_description = useAppSelector(state => state.persisted_app.app_description);
    const [loading_photo, setLoading_photo] = useState<boolean>(false);
    const [showInternetError, setShowInternetError] = useState<boolean>(false);
    const [privacy, setPrivacy] = useState<string>("0");
    const [caption, setCaption] = useState<string>("");
    const dispatch = useAppDispatch();
    const realm = useRealm();

    const insets = useSafeAreaInsets();
    const screenHeight = Dimensions.get('window').height - insets.top;

    const screenWidth = Dimensions.get('window').width;
    // const screenHeight = Dimensions.get('window').height;

    const maxWidth = screenWidth - 32;  // marge de 16px de chaque côté
    const maxHeight = screenHeight * 0.6;

    const contacts = useQuery(
        UserContacts, ccs => {
            return ccs.filtered('phone_number != $0 && user_active != $1', user_data.phone_number, 0)
        }, []).map(cc => cc.phone_number);

    // const contacts = useQuery({
    //     type: UserContacts,
    //     query: (collection) => collection.filtered("favorite == true"),
    //     deps: [], // ← obligatoire si ta fonction dépend de variables extérieures
    //   });

    // console.log(item)
    // let height=0;

    const UploadStatus = () => {

        setLoading_photo(true);

        const filename = Date.now() + '-' + Math.round(Math.random() * 1E9);

        let base_url = remote_host + "/yambi/API/upload_status_photo";
        let formData = new FormData();
        formData.append('assemble', user_data.phone_number);
        formData.append('caption', caption);
        formData.append('privacy', privacy);
        formData.append('reposts', "[]");
        formData.append('only_with', JSON.stringify(contacts));
        formData.append('image', { type: 'image/jpg', uri: item.path, name: filename + 'status.jpg' } as any);

        axios.post(base_url, formData, {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'multipart/form-data'
            }
        })
            .then(response => {
                setLoading_photo(false);

                setCaption("");

                if (response.data.message === "1") {
                    const story: TStory = {
                        _id: response.data.story._id,
                        phone_number: response.data.story.phone_number,
                        type_story: response.data.story.type_story,
                        main_text: response.data.story.main_text,
                        comments: response.data.story.comments,
                        mentions: response.data.story.mentions,
                        caption: response.data.story.caption,
                        reactions: response.data.story.reactions,
                        only_with: response.data.story.only_with,
                        excluded: response.data.story.excluded,
                        reposts: response.data.story.reposts,
                        viewers: response.data.story.viewers,
                        story_privacy: response.data.story.story_privacy,
                        createdAt: response.data.story.createdAt,
                        updatedAt: response.data.story.updatedAt,
                        expiresAt: response.data.story.expiresAt
                    }

                    realm.write(() => {
                        try {
                            realm.create('Stories', story, true);
                        } catch (error) { }
                    });

                    // console.log(response.data.story);

                    onDeleteStatus();
                }



                // console.log(response.data)

            })
            .catch((error) => {
                // Alert.alert(strings.error, strings.connection_failed);
                console.log(error)
                setShowInternetError(true);
                dispatch(setShowModalApp(true));
                setLoading_photo(false);

            });
    };

    Image.getSize(
        item.path,
        (originalWidth, originalHeight) => {
            const scaleFactor = screenWidth / originalWidth;
            // const hh = originalHeight * scaleFactor;

            const widthRatio = maxWidth / originalWidth;
            const heightRatio = maxHeight / originalHeight;
            const scale = Math.min(widthRatio, heightRatio, 1); // ne jamais agrandir au-delà de 100%

            const ww = originalWidth * scale;
            const hh = originalHeight * scale;

            setHeight(hh);
            setWidth(ww);
            //   setDimensions({ width: maxWidth, height });
            //   setLoading(false);
        },
        (error) => {
            console.error('Failed to get image size:', error);
            //   setLoading(false);
        }
    );

    return (
        <View style={{
            // flex: 1,
            width: screenWidth,
            justifyContent: 'center',
            alignItems: 'center',
            // position:'absolute',
            // top:0,
            // bottom:0,
            // height:150,
            // width:150 
            // backgroundColor: 'green',
            // marginTop: (((screenHeight - height) / 2) - sb.currentHeight) > 0 ? ((screenHeight - height) / 2) - sb.currentHeight : 0
            // height: screenHeight - sb.currentHeight
            height: screenHeight
        }}>

            <StatusBar
                translucent={Platform.OS === 'android' ? false : true}
                backgroundColor={"#000000"}
            />

            {showInternetError ?
                <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowInternetError(false) }} singleButton title={strings.error}>
                    <TextNormalYambiGray text={strings.connection_failed} />
                </ModalApp> : null}

            <Pinchable>
                <FastImage
                    style={{
                        width: screenWidth,
                        // height: height,
                        flex: 1
                    }}
                    resizeMode={FastImage.resizeMode.contain}
                    source={{
                        cache: 'immutable',
                        uri: item.path
                    }} />
            </Pinchable>

            {/* <View style={{

            }}>
            <Pressable style={{
                position:'absolute',
                bottom: 50
            }} onPress={scrollToIndex}>
                    <IconApp name="delete-outline" pack="MC" size={25} color={"#FFFFFF"} />
                </Pressable>
            </View> */}

            <View style={{
                position: 'absolute',
                bottom: 0,
                width: screenWidth,
                height: 50,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <TextInput
                    placeholder={strings.add_caption}
                    multiline={true}
                    placeholderTextColor={"white"}
                    value={caption}
                    onChangeText={(text) => setCaption(text)}
                    style={{
                        color: 'white',
                        flex: 1,
                        backgroundColor: 'transparent'
                    }}
                />

                <Pressable style={{
                    justifyContent: 'center',
                    height: 40,
                    paddingHorizontal: 10,
                    borderRadius: 30,
                    backgroundColor: app_theme.colors.design_tip2
                }} onPress={UploadStatus}>
                    {loading_photo ?
                        <AppActivityIndicator color={app_theme.colors.text_design2} /> :
                        <View style={{
                            justifyContent: 'center',
                            alignItems: 'center',
                            flexDirection: 'row',
                            height: 35
                        }}>
                            <Text style={{
                                color: app_theme.colors.text_design2,
                                fontSize: app_description.general_font_size
                            }}>{strings.send_photo}</Text>
                            <IconApp name="chevron-right" pack="FI" size={15} color={app_theme.colors.text_design2} />
                        </View>}
                </Pressable>
            </View>

            <View style={{
                height: 50,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                // backgroundColor:'yellow',
                top: 0,
                position: 'absolute',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: screenWidth,
                paddingHorizontal: 20
            }}>
                <Pressable onPress={onGoBack}>
                    <IconApp name="chevron-left" pack="FI" size={25} color={"#FFFFFF"} />
                </Pressable>

                <Text style={{ color: 'white' }}>{index + 1}</Text>

                <Pressable onPress={onDeleteStatus}>
                    <IconApp name="delete-outline" pack="MC" size={25} color={"#FFFFFF"} />
                </Pressable>
            </View>
        </View>
    );
}

export default memo(NewStoryImagesList);

