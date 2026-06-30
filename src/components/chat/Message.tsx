import { View, Text, Image } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store/app/hooks';
import React, { useState, memo } from 'react';
import { useObject, useRealm } from '@realm/react';
import { UsersMessages } from '../../store/database/Models';
import {  TMessage } from '../../types/types';
import Animated, { BounceIn, FadeInUp } from 'react-native-reanimated';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
// import { SocketApp } from '../../../App';
import _ from 'lodash';
import moment from 'moment';
import { strings } from '../../lang/lang';


const Message = ({ item, index, messages, user }: { item: TMessage, index: number, messages, user:string }) => {

    // const sel = createSelector(state=>state.app.message_selected, state=>state.app);

    const app_theme = useAppSelector(state => state.app_theme);
    // const current_user = useAppSelector(state => state.current_user);
    const user_data = useAppSelector(state => state.user_data);
    const app_description = useAppSelector(state => state.persisted_app.app_description);
    // const message_selected = useAppSelector(state=>state.app.message_selected);
    const [first, setFirst] = useState("");
    const dispatch = useAppDispatch();
    const realm = useRealm();

    // const messages = useQuery(
    //     UsersMessages, msgs => {
    //         return msgs.filtered('(receiver == $0 && sender == $1) || (sender == $2 && receiver==$3)', current_user.phone_number, user_data.phone_number, current_user.phone_number, user_data.phone_number)
    //             .sorted('alignment', true);
    //     }, []);

    // console.log("Message rendered")

    const message = useObject(UsersMessages, item.response_to);

    let can_show_image_left: boolean = true;
    let can_show_image_right: boolean = true;
    let radius_right: boolean = true;
    let radius_left: boolean = true;
    let radius_top_right: boolean = true;
    let radius_top_left: boolean = true;
    let radius_bottom_right: boolean = true;
    let radius_bottom_left: boolean = true;
    let spacing_left: boolean = true;
    let spacing_right: boolean = true;

    // if(date != item.cc) {
    //     date = item.cc;
    // } else {
    //     date = "";
    // }

    if (messages[index + 1]) {
        if (messages[index + 1].sender === item.sender) {
            can_show_image_left = false;
            radius_left = false;
            spacing_left = false;
            radius_top_left = false;
            // radius_bottom_left=false;
        }

        if (messages[index + 1].receiver === item.receiver) {
            can_show_image_right = false;
            radius_right = false;
            spacing_right = false;
            radius_top_right = false;
            // radius_bottom_right=false;
        }
    }

    if (messages[index + 1]) {
        if (messages[index + 1].sender === item.sender) {
            // radius_bottom_left = false;
            can_show_image_right = false;
        }

        if (messages[index + 1].receiver === item.receiver) {
            // radius_bottom_right = false;
            can_show_image_left = false;
        }
    }

    const IconMessageRead = (icon: number) => {
        if (icon === 3 || icon === 4) {
            return <Animated.View entering={BounceIn.delay(50).springify().damping(10)}>
                <MaterialCommunityIcons name="checkbox-multiple-marked-circle" size={17}
                    color={app_theme.colors.high_color}
                    style={{ marginLeft: 10 }} />
            </Animated.View>
        } if (icon === 2) {
            return <Animated.View entering={BounceIn.delay(50).springify().damping(10)}>
                <MaterialCommunityIcons name="checkbox-multiple-marked-circle-outline" size={17}
                    color={app_theme.colors.gray}
                    style={{ marginLeft: 10 }} />
            </Animated.View>
        } if (icon === 1) {
            return <Animated.View entering={BounceIn.delay(50).springify().damping(10)}>
                <MaterialCommunityIcons name="check" size={15}
                    color={app_theme.colors.gray}
                    style={{ marginLeft: 10 }} />
            </Animated.View>
        } else {
            return <Animated.View entering={BounceIn.delay(50).springify().damping(10)}>
                <MaterialIcons name="schedule" size={15}
                    color={app_theme.colors.gray}
                    style={{ marginLeft: 10 }} />
            </Animated.View>
        }
    }

    // useEffect(()=>{
    //     console.log(message_selected);
    // },[]);

    // console.log(item.alignment);

    const show_day = () => {
        if (messages[index + 1]) {
            if (messages[index + 1].cc !== "") {
                if (messages[index + 1].cc != item.cc) {
                    // console.log(messages[index + 1].cc + " " + item.cc);
                    return true;
                }
            }
            // else {
            //     if (messages[index - 1].cc != item.cc) {
            //     console.log(messages[index - 1].cc)
            //     return true;
            // }

            // }
        } else {
            //     if (messages[index - 1]) {
            //     if (messages[index - 1].cc !== "") {
            //         if (messages[index - 1].cc != item.cc) {
            //             console.log(messages[index - 1].cc + " " + item.cc);
            //             return true;
            //         }
            //     } else {
            //         return false;
            //     }
            // } else {
            //     return false;
            // }
            return false;
        }

        // if (messages[index - 1]) {
        //     if (messages[index - 1].cc !== "") {
        //         if (messages[index - 1].cc != item.cc) {
        //             console.log(messages[index - 1].cc + " " + item.cc);
        //             return true;
        //         }
        //     } else {
        //         return false;
        //     }
        // } else {
        //     return false;
        // }

        

        return false;
    }

    console.log('Message' + item.token)

    return (
        <Animated.View 
        style={{
            flex:1,
            // backgroundColor: message_selected === item.token ? app_theme.colors.border : 'transparent',
        }}
        entering={FadeInUp}>
            {/* {show_day() ?
                <View style={{
                    alignItems: 'center',
                    marginTop: 35,
                }}>
                    <View style={{
                        borderColor: app_theme.colors.gray,
                        borderBottomWidth: 1,
                        width: '100%'
                    }}></View>
                    <Text style={{
                        paddingVertical: 3,
                        marginVertical: 10,
                        textAlign: 'center',
                        width: '50%',
                        marginTop: -14,
                        backgroundColor: app_theme.colors.background,
                        color: app_theme.colors.text
                    }}>{displayDate(item.cc)}</Text>
                </View> : null} */}
                {/* <Text>{message_selected}</Text> */}
                <View style={{
                    flex: 1,
                    flexDirection: 'row',
                    justifyContent: item.sender === user_data.phone_number ? 'flex-end' : 'flex-start',
                    
                }}>
                    {can_show_image_left ?
                        <View
                            style={{
                                paddingLeft: 10,
                                flexDirection: 'row',
                            }}>

                            {item.receiver === user_data.phone_number ?
                                <Image
                                    style={{
                                        width: app_description.inbox_receiver_image_size,
                                        height: app_description.inbox_receiver_image_size,
                                        borderRadius: app_description.inbox_receiver_image_radius,
                                        marginRight: 2,
                                        display: app_description.inbox_appearance_style === 1 ? 'flex' : 'none'
                                    }}
                                    source={require("./../../../assets/profile_black.jpg")} />
                                : null}

                            {item.receiver === user_data.phone_number ?
                                <View style={{
                                    backgroundColor: app_theme.colors.chat_received,
                                    // borderColor: app_theme.colors.border,
                                    // borderWidth:1,

                                    width: 20,
                                    height: 10,
                                    borderRadius: 1,
                                    // borderLeftWidth:0,
                                    // borderTopWidth:1,
                                    borderBottomLeftRadius: 20,
                                    // marginRight: app_description.show_receiver_image ? 0 : app_description.inbox_receiver_image_size+12,
                                    marginRight: -15
                                }}></View> : null}
                        </View>
                        : null}

                    <View style={{
                        // flexDirection:'row',
                        paddingHorizontal: item.response_to === "" ? 10 : 0,
                        paddingVertical: 5,
                        maxWidth: '85%',
                        // flex:1,
                        borderRadius: 12,
                        // elevation:3,
                        // borderWidth:1,
                        // borderColor: app_theme.colors.border,
                        // borderTopRightRadius: radius_right ? 12:5,
                        // borderBottomRightRadius: radius_right ? 12:5,
                        // borderTopLeftRadius: radius_left ? 12:5,
                        // borderBottomLeftRadius: radius_left ? 12:5,
                        // backgroundColor:'red',
                        // borderTopLeftRadius: item.receiver === user_data.phone_number?0:12,
                        // borderTopRightRadius: item.sender === user_data.phone_number?0:12,
                        marginLeft: can_show_image_left ? 0 : app_description.inbox_appearance_style === 0 ? 15 : app_description.inbox_receiver_image_size + 17,
                        marginRight: can_show_image_right ? 0 : app_description.inbox_appearance_style === 0 ? 15 : app_description.inbox_sender_image_size + 17,
                        backgroundColor: item.receiver === user_data.phone_number ? app_theme.colors.chat_received : app_theme.colors.chat_sent,
                    }}>
                        {item.response_to !== "" ?
                            message !== null ?
                                <View>
                                    <View style={{
                                        borderLeftColor: '#006E51',
                                        borderLeftWidth: 6,
                                        borderRadius: 6,
                                        paddingHorizontal: 10,
                                        backgroundColor: app_theme.colors.border,
                                        paddingVertical: 8,
                                        marginHorizontal: 7,
                                        marginBottom: 5,
                                        marginTop: 4
                                    }}>
                                        <Text style={{
                                            color: '#f59f00',
                                            fontSize: app_description.small_general_font_size,
                                            fontWeight: app_description.small_general_font_weight as any
                                        }}>{message.sender === user ? user : strings.you}</Text>
                                        <Text numberOfLines={5} style={{
                                            color: app_theme.colors.text,
                                            fontSize: app_description.small_general_font_size,
                                            fontWeight: app_description.small_general_font_weight as any
                                        }}>{message.main_text_message}</Text>
                                    </View>
                                </View>
                                : null : null}
                        <View style={{
                            marginHorizontal: item.response_to === "" ? 0 : 10
                        }}>
                            <Text style={{
                                // marginRight:40,
                                color: app_theme.colors.text,
                                // maxWidth: '50%',
                                flex: 1,
                                marginRight: item.main_text_message.length < 35 ? item.sender === user_data.phone_number ? 65 : 45 : 10,
                                marginBottom: item.main_text_message.length < 35 ? -12 : 0,
                                fontWeight: item.receiver === user_data.phone_number ? app_description.received_messages_font_weight : app_description.sent_messages_font_weight as any,
                                fontSize: item.receiver === user_data.phone_number ? app_description.received_messages_font_size : app_description.sent_messages_font_size,

                            }}>{item.main_text_message.trim()}</Text>
                            <View style={{
                                flexDirection: 'row',
                                alignSelf: 'flex-end',
                                alignItems: 'baseline'
                            }}>
                                <Text style={{
                                    marginTop: 0,
                                    color: app_theme.colors.gray,
                                    fontWeight: item.receiver === user_data.phone_number ? app_description.received_messages_font_weight : app_description.sent_messages_font_weight as any,
                                    fontSize: app_description.small_general_font_size,

                                }}>{moment(item.createdAt).format('HH:mm')}</Text>

                                {item.sender === user_data.phone_number ? IconMessageRead(item.message_read) : null}
                            </View>
                        </View>
                    </View>

                    {can_show_image_right ?
                        <View
                            style={{
                                paddingRight: 10,
                                flexDirection: 'row'
                            }}>
                            {item.sender === user_data.phone_number ?
                                <View style={{
                                    backgroundColor: app_theme.colors.chat_sent,
                                    // borderColor: app_theme.colors.border,
                                    // borderWidth:1,
                                    width: 20,
                                    height: 10,
                                    borderRadius: 1,
                                    // borderLeftWidth:0,
                                    // borderTopWidth:1,
                                    borderBottomRightRadius: 15,
                                    marginLeft: -15
                                }}></View> : null}

                            {item.sender === user_data.phone_number ?
                                <Image
                                    style={{
                                        width: app_description.inbox_sender_image_size,
                                        height: app_description.inbox_sender_image_size,
                                        borderRadius: app_description.inbox_sender_image_size,
                                        marginLeft: 2,
                                        display: app_description.inbox_appearance_style === 1 ? 'flex' : 'none'
                                    }}
                                    source={require("./../../../assets/profile_black.jpg")} /> : null}
                        </View>
                        : null}
                </View>
        </Animated.View>
    )
};

export default memo(Message);
