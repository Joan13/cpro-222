import { View, Text, TouchableOpacity, useWindowDimensions, Platform, Vibration, TextInput } from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';
import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../store/app/hooks';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import { strings } from '../../lang/lang';
import FastImage from 'react-native-fast-image';
import { NavProps, TChat, TMessage } from '../../types/types';
import moment from 'moment';
import { useRealm } from '@realm/react';
import { setResponseTo } from '../../store/reducers/appSlice';
import { TextNormalYambi } from '../app/Text';
import { randomString, renderDateUpToMilliseconds } from '../../../GlobalVariables';

const SendPictureMessage = ({ navigation, route }: NavProps) => {

    const { user } = route.params;
    // const navigation = useNavigation();
    const dispatch = useAppDispatch();
    const border_color = useAppSelector(state => state.app_theme.colors.border);
    // const current_user = useAppSelector(state => state.current_user);
    const user_data = useAppSelector(state => state.user_data);
    const app_theme = useAppSelector(state => state.app_theme);
    const message_inbox = useAppSelector(state => state.app.message_inbox);
    const response_to = useAppSelector(state => state.app.response_to);
    const app_description = useAppSelector(state => state.persisted_app.app_description);
    const [profile, setProfile] = useState<string>("");
    const [caption, setCaption] = useState("");
    const [loading_profile, setLoading_profile] = useState<boolean>(false);

    const width = useWindowDimensions().width;
    const realm = useRealm();

    // console.log(user)

    const sendMessage = () => {
        if (profile !== "") {
            //   playActionSound(2);
            Vibration.vibrate(10);
            const time = moment(new Date()).format();
            const token = randomString(30) + renderDateUpToMilliseconds();

            const msg: TMessage = {
                sender: user_data.phone_number,
                receiver: user,
                main_text_message: profile,
                caption: caption,
                message_type: 2,
                reactions: '[]',
                response_to: response_to,
                message_read: 5,
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
            }

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
            }

            realm.write(() => {
                try {
                    realm.create('UsersMessages', msg);
                    realm.create('UserChats', chat, true);
                } catch (error) {
                    //   console.log(error)
                }
            });


            //   dispatch(setMessageInbox(""));
            dispatch(setResponseTo(""));

            navigation.goBack();
        }
    }

    const pick_picture = () => {

        ImagePicker.openPicker({
            //    width: 500,
            //    height: 500,
            cropping: true,
            quality: 0.3,
            noData: true,
            mediaType: "photo",
        }).then(image => {

            setProfile(image.path);
            // console.log(image.path);
        })
            .catch((e) => { });
    }

    useEffect(() => {

        // console.log(current_user)
        pick_picture();

    }, []);

    return (
        <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: app_theme.colors.background,
            padding: 10
        }}>
            <View style={{
                flex: 1
            }}>
                {profile !== "" ?
                    <FastImage
                        style={{
                            flex: 1,
                            width: width,
                        }}
                        resizeMode={FastImage.resizeMode.contain}
                        source={{
                            priority: FastImage.priority.high,
                            //  cache: 'immutable',
                            uri: profile
                        }} /> : null}
            </View>

            {profile !== "" ?
                <TextInput
                    // onSelectionChange={handleSelectionChange}
                    // selection={selection}
                    multiline={true}
                    // ref={inputRef}
                    // onFocus={handleFocus}

                    onBlur={() => {
                        // this.props.dispatch({ type: 'SET_SCROLL_TO_END', payload: true });
                    }}

                    style={{ paddingLeft: 10, paddingTop: 0, height: 50, fontSize: app_description.general_font_size, maxHeight: 50, color: app_theme.colors.text, backgroundColor: app_theme.colors.background, paddingBottom: 2, borderColor: app_theme.colors.border, borderTopWidth: 1, width: '100%' }}
                    placeholder={strings.add_caption}
                    // value={draft !== null ? draft.draft : null}
                    value={caption}
                    onChangeText={(text) => setCaption(text)}
                    placeholderTextColor={app_theme.colors.gray}
                /> : null}

            <View style={{
                flexDirection: 'row',
                backgroundColor: app_theme.colors.border,
                marginTop: 10,
                borderRadius: 50
            }}>
                <View style={{
                    flex: 1,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    height: 60
                }}>
                    <TouchableOpacity
                        onPress={pick_picture}
                        style={{ height: 40, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: app_theme.colors.border, borderRadius: 50, borderColor: app_theme.colors.border, borderWidth: 1, paddingHorizontal: 15 }}>
                        <TextNormalYambi text={profile !== "" ? strings.change_picture : strings.picture_select} styles={{ marginRight: 5 }} />
                        <FontAwesome6 name="edit" size={17} color={app_theme.colors.text} />
                    </TouchableOpacity>

                    {profile !== "" ?
                        <TouchableOpacity
                            onPress={sendMessage}
                            style={{ height: 50, width: 50, justifyContent: 'center', alignItems: 'center', backgroundColor: app_theme.colors.design_tip2, borderRadius: 50, borderColor: app_theme.colors.border, borderWidth: 1, marginRight: 6 }}>
                            <Ionicons name="send" size={18} color={app_theme.colors.text_design2} />
                        </TouchableOpacity> : null}
                </View>
            </View>
        </View>
    )
}

export default SendPictureMessage;

