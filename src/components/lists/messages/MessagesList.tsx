import { View, Text, Image, Vibration, Pressable } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../../store/app/hooks';
import React, { memo, useEffect, useState } from 'react';
import { useObject } from '@realm/react';
import { UsersMessages } from '../../../store/database/Models';
import { TMessage } from '../../../types/types';
import _ from 'lodash';
import moment from 'moment';
import { strings } from '../../../lang/lang';
import VoiceMessageItem from '../../chat/message/VoiceMessageItem';
import PictureMessageItem from '../../chat/message/PictureMessageItem';
import { displayDate } from '../../../../GlobalVariables';
import { TextSmallYambiGray, TextSmallYambiHighColor } from '../../app/Text';
import { IconApp } from '../../app/IconApp';
import Animated, { FadeIn, FadeInDown, FadeInUp, Layout, useAnimatedStyle, useSharedValue, withTiming, withSpring, runOnJS } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { setResponseTo } from '../../../store/reducers/appSlice';

const MessagesList = ({ item, index, selectMessage, messages, user, scrollToMessage }: { item: TMessage, index: number, selectMessage, messages, user: string, scrollToMessage?: (token: string) => void }) => {

    const app_theme = useAppSelector(state => state.app_theme);
    const contacts = useAppSelector(state => state.app.raw_contacts);
    const user_data = useAppSelector(state => state.user_data);
    const app_description = useAppSelector(state => state.persisted_app.app_description);
    const language_yambi = useAppSelector(state => state.persisted_app.langApp);
    const lang = useAppSelector(state => state.persisted_app.langApp);
    const message_selected = useAppSelector(state => state.app.message_selected);
    const [showShadow, setShowShadow] = useState<boolean>(false);
    const [opacity, setOpacity] = useState<number>(0);
    const shadowOpacity = useSharedValue(0);
    const dispatch = useAppDispatch();
    const translateX = useSharedValue(0);
    const hasTriggeredHaptic = useSharedValue(false);

    // const [can_show_image_left, setCan_show_image_left] = useState<boolean>(false);
    // const [can_show_image_right, setCan_show_image_right] = useState<boolean>(false);

    // const messages = useQuery(
    //     UsersMessages, msgs => {
    //         return msgs.filtered('(receiver == $0 && sender == $1) || (sender == $2 && receiver==$3)', current_user.phone_number, user_data.phone_number, current_user.phone_number, user_data.phone_number)
    //             .sorted('alignment', true);
    //     }, []);

    const ShowUserName = (user_names: string, phone_number: string) => {
        const contact = contacts.find((cc) => cc.phoneNumber === phone_number);
        if (contact !== undefined) {
            return contact.displayName;
        } else {
            return user_names;
        }
    }

    // console.log("Message rendered" + item.main_text_message)

    const message = useObject(UsersMessages, item.response_to);

    let can_show_image_left: boolean = true;
    let can_show_image_right: boolean = true;
    // let radius_right: boolean = true;
    // let radius_left: boolean = true;
    // let radius_top_right: boolean = true;
    // let radius_top_left: boolean = true;
    // let radius_bottom_right: boolean = true;
    // let radius_bottom_left: boolean = true;
    // let spacing_left: boolean = true;
    // let spacing_right: boolean = true;

    // if(date != item.cc) {
    //     date = item.cc;
    // } else {
    //     date = "";
    // }

    // if (messages[index + 1]) {
    //     if (messages[index + 1].sender === item.sender) {
    //         can_show_image_left = false;
    //         radius_left = false;
    //         spacing_left = false;
    //         radius_top_left = false;
    //         // radius_bottom_left=false;
    //     }

    //     if (messages[index + 1].receiver === item.receiver) {
    //         can_show_image_right = false;
    //         radius_right = false;
    //         spacing_right = false;
    //         radius_top_right = false;
    //         // radius_bottom_right=false;
    //     }
    // }

    // useEffect(()=>{
    if (messages[index + 1]) {
        if (messages[index + 1].sender === item.sender) {
            // radius_bottom_left = false;
            can_show_image_right = false;
            // setCan_show_image_right(false);
        }

        if (messages[index + 1].receiver === item.receiver) {
            // radius_bottom_right = false;
            can_show_image_left = false;
            // setCan_show_image_left(false);
        }
    }
    // }, [can_show_image_left, can_show_image_right]);

    const IconMessageRead = (icon: number) => {
        if (icon === 3 || icon === 4) {
            return <IconApp pack="MC" name="check-all" size={16}
                color={app_theme.colors.high_color}
                styles={{ marginLeft: 6 }} />
        }

        if (icon === 2) {
            return <IconApp pack="MC" name="check-all" size={16}
                color={app_theme.colors.gray}
                styles={{ marginLeft: 6 }} />
        }

        if (icon === 1) {
            return <IconApp pack="MC" name="check" size={14}
                color={app_theme.colors.gray}
                styles={{ marginLeft: 6 }} />
        }

        else {
            return <IconApp pack="MC" name="clock-outline" size={14}
                color={app_theme.colors.gray}
                styles={{ marginLeft: 6 }} />
        }
    }

    // const opacityTransition = useAnimatedStyle(() => (
    //     withTiming(opacity +1.5, { duration: 100 })
    // ))

    const handleSwipeToReply = () => {
        Vibration.vibrate(25);
        dispatch(setResponseTo(item.token));
    };

    const handleHapticFeedback = () => {
        Vibration.vibrate(10);
    };

    const panGesture = Gesture.Pan()
        .activeOffsetX(10) // Only activate after 10px horizontal movement to the right
        .failOffsetY([-15, 15]) // Fail if vertical movement is too much (prevents interference with scrolling)
        .onBegin(() => {
            // Reset translateX when gesture begins
            translateX.value = 0;
            hasTriggeredHaptic.value = false;
        })
        .onUpdate((event) => {
            // Only allow right swipes (positive translationX)
            if (event.translationX > 0) {
                // Limit the maximum swipe distance for smooth feel
                const maxSwipe = 100;
                translateX.value = Math.min(event.translationX, maxSwipe);
                
                // Trigger haptic feedback when reaching the end of sliding track (95px threshold)
                if (translateX.value >= 95 && !hasTriggeredHaptic.value) {
                    hasTriggeredHaptic.value = true;
                    runOnJS(handleHapticFeedback)();
                }
            }
        })
        .onEnd((event) => {
            // If swiped right more than 50px, trigger reply
            if (event.translationX > 50) {
                runOnJS(handleSwipeToReply)();
            }
            // Always spring back to original position smoothly
            translateX.value = withSpring(0, {
                damping: 20,
                stiffness: 90,
            });
        });

    const swipeAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: translateX.value }],
        };
    });

    useEffect(() => {

        const timeout = setTimeout(() => {
            setShowShadow(true);
        }, 500);

        // const timeout = setTimeout(()=> {
        //     shadowOpacity.value = withTiming(0.3,{duration:300});
        // }, 300+index*100);

        return () => clearTimeout(timeout);

        // setTimeout(() => {
        //     setShowShadow(true);
        // }, 500);
        // console.log(message_selected);
    }, []);

    // const animatedStyle=useAnimatedStyle(()=>({
    //     elevation:4,
    //     shadowColor: '#000',
    //     shadowOffset: {width:0,height:2},
    //     shadowOpacity: shadowOpacity.value,
    //     shadowRadius: 4
    // }))

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

    if (item.deleted !== 2) {
        // Only animate first 30 messages for smooth performance
        const shouldAnimate = index < 30;
        
        return (
            <Animated.View
                entering={shouldAnimate ? FadeIn.duration(300).delay(index * 30) : undefined}
            >
                {show_day() ?
                    <View style={{
                        justifyContent: 'center',
                        flexDirection: 'row',
                        marginVertical: 8,
                    }}>
                        <View style={{
                            paddingVertical: 5,
                            paddingHorizontal: 16,
                            borderRadius: 16,
                            backgroundColor: app_theme.colors.background,
                            borderWidth: 1,
                            borderColor: app_theme.colors.border,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.1,
                            shadowRadius: 2,
                            elevation: 2,
                        }}>
                            <TextSmallYambiHighColor 
                                text={displayDate(item.cc, lang)} 
                                styles={{
                                    textAlign: 'center',
                                    fontSize: 11,
                                    fontWeight: '600',
                                }} 
                            />
                        </View>
                    </View> : null}
                <Pressable
                    onLongPress={() => {
                        Vibration.vibrate(25);
                        selectMessage(item.token);
                    }}
                    onPress={() => {
                        if (message_selected === item.token) {
                            selectMessage("");
                        }
                    }}

                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        // marginVertical: 2,
                        paddingVertical: 4,
                        // paddingHorizontal: 2,
                        backgroundColor: message_selected === item.token ? app_theme.colors.high_color + "30" : 'transparent',
                        borderRadius: 12,
                    }}>
                    <GestureDetector gesture={panGesture}>
                        <Animated.View style={[
                            {
                                flex: 1,
                                flexDirection: 'row',
                                justifyContent: item.sender === user_data.phone_number ? 'flex-end' : 'flex-start',
                            },
                            swipeAnimatedStyle
                        ]}>
                        {can_show_image_left ?
                            <View
                                style={{
                                    paddingLeft: 5,
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
                                        display: app_description.inbox_appearance_style === 0 ? 'flex' : 'none',
                                        // marginRight: app_description.show_receiver_image ? 0 : app_description.inbox_receiver_image_size+12,
                                        marginRight: -15
                                    }}></View> : null}
                            </View>
                            : null}

                        <View style={{
                            paddingHorizontal: item.response_to === "" ? 12 : 0,
                            paddingVertical: 4,
                            width: item.message_type === 1 || item.message_type === 2 ? 260 : 'auto',
                            maxWidth: item.message_type === 1 ? 260 : '85%',
                            borderRadius: 10,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: showShadow ? 0.08 : 0,
                            shadowRadius: showShadow ? 3 : 0,
                            elevation: showShadow ? 2 : 0,
                            marginLeft: can_show_image_left ? 0 : app_description.inbox_appearance_style === 0 ? 10 : app_description.inbox_receiver_image_size + 7,
                            marginRight: can_show_image_right ? 0 : app_description.inbox_appearance_style === 0 ? 10 : app_description.inbox_sender_image_size + 7,
                            backgroundColor: item.receiver === user_data.phone_number ? app_theme.colors.chat_received : app_theme.colors.chat_sent
                        }}>
                            {item.response_to !== "" ?
                                message !== null ?
                                    <View>
                                        <Pressable
                                            onPress={() => {
                                                if (scrollToMessage && item.response_to) {
                                                    scrollToMessage(item.response_to);
                                                }
                                            }}
                                            style={{
                                                borderLeftColor: app_theme.colors.high_color,
                                                borderLeftWidth: 4,
                                                borderRadius: 8,
                                                paddingHorizontal: 10,
                                                backgroundColor: app_theme.colors.border + '80',
                                                paddingVertical: 8,
                                                marginHorizontal: 10,
                                                marginBottom: 6,
                                                marginTop: 6
                                            }}
                                        >
                                            <Text style={{
                                                color: '#f59f00',
                                                fontSize: app_description.small_general_font_size,
                                                fontWeight: app_description.small_general_font_weight as any
                                            }}>{message.sender === user ? ShowUserName(user, user) : strings.you}</Text>
                                            <Text numberOfLines={5} style={{
                                                color: app_theme.colors.text,
                                                fontSize: app_description.small_general_font_size,
                                                fontWeight: app_description.small_general_font_weight as any
                                            }}>{message.message_type === 2 ? strings.picture : message.message_type === 1 ? strings.voice_note : message.main_text_message}</Text>
                                        </Pressable>
                                    </View>
                                    : null : null}
                            <View style={{
                                marginHorizontal: item.response_to === "" ? 0 : 10
                            }}>
                                {item.deleted === 1 ?
                                    <Text style={{
                                        color: app_theme.colors.gray,
                                        flex: 1,
                                        marginRight: item.main_text_message.length < 35 ? item.sender === user_data.phone_number ? lang === "en" ? 100 : 90 : lang === "en" ? 80 : 55 : 10,
                                        marginBottom: item.caption === "" ? item.main_text_message.length < 35 ? -12 : 0 : 0,
                                        fontWeight: item.receiver === user_data.phone_number ? app_description.received_messages_font_weight : app_description.sent_messages_font_weight as any,
                                        fontSize: item.receiver === user_data.phone_number ? app_description.received_messages_font_size : app_description.sent_messages_font_size,
                                    }}>
                                        <IconApp pack="FI" name="minus-circle" size={17} color={app_theme.colors.gray} />
                                        {"  " + strings.message_deleted}
                                    </Text>
                                    :
                                    <>
                                        {item.flag !== 0 ?
                                            <View style={{

                                                flexDirection: 'row'
                                            }}>
                                                {item.flag === 1 ?
                                                    <TextSmallYambiHighColor text={strings.edited} styles={{
                                                        paddingBottom: 5,
                                                        marginBottom: 5,
                                                        borderBottomWidth: 1,
                                                        borderColor: app_theme.colors.border,
                                                        flex: 1
                                                    }} />
                                                    : null}

                                                {item.flag === 2 && item.receiver === user_data.phone_number ?
                                                    <TextSmallYambiHighColor text={strings.forwarded} styles={{
                                                        paddingBottom: 5,
                                                        marginBottom: 5,
                                                        borderBottomWidth: 1,
                                                        borderColor: app_theme.colors.border,
                                                        flex: 1
                                                    }} />
                                                    : null}
                                            </View>
                                            : null}

                                        {item.message_type === 0 ? <Text style={{
                                            color: app_theme.colors.text,
                                            flex: 1,
                                            marginRight: item.main_text_message.length < 35 ? item.sender === user_data.phone_number ? lang === "en" ? 85 : 75 : lang === "en" ? 60 : 50 : 10,
                                            marginBottom: item.caption === "" ? item.main_text_message.length < 35 ? -12 : 0 : 0,
                                            fontWeight: item.receiver === user_data.phone_number ? app_description.received_messages_font_weight : app_description.sent_messages_font_weight as any,
                                            fontSize: item.receiver === user_data.phone_number ? app_description.received_messages_font_size : app_description.sent_messages_font_size

                                        }}>{item.main_text_message.trim()}</Text> : null}
                                        {/* <Text>{item.alignment}</Text> */}

                                        {/* <Text>{item.sender} {item.receiver}</Text> */}

                                        {item.message_type === 1 ? <VoiceMessageItem message={item} /> : null}

                                        {item.message_type === 2 ? <PictureMessageItem message={item} /> : null}

                                        {item.caption !== "" ?
                                            <Text style={{
                                                // marginRight:40,
                                                color: item.message_type === 0 ? app_theme.colors.gray : app_theme.colors.text,
                                                // maxWidth: '50%',
                                                flex: 1,
                                                marginRight: item.main_text_message.length < 35 ? item.sender === user_data.phone_number ? lang === "en" ? 90 : 65 : lang === "en" ? 70 : 45 : 10,
                                                marginBottom: item.main_text_message.length < 35 ? -12 : 0,
                                                marginTop: item.message_type === 0 ? 10 : 0,
                                                paddingTop: 10,
                                                borderColor: app_theme.colors.border,
                                                borderTopWidth: item.message_type === 0 ? 1 : 0,
                                                fontWeight: item.receiver === user_data.phone_number ? app_description.received_messages_font_weight : app_description.sent_messages_font_weight as any,
                                                fontSize: item.receiver === user_data.phone_number ? app_description.received_messages_font_size : app_description.sent_messages_font_size,

                                            }}>{item.caption.trim()}</Text> : null}
                                    </>}

                                <View style={{
                                    flexDirection: 'row',
                                    alignSelf: 'flex-end',
                                    alignItems: 'center',
                                    // paddingLeft: 10,
                                    // backgroundColor: 'yellow'
                                }}>
                                    <Text style={{
                                        marginTop: 0,
                                        marginLeft: 10,
                                        color: app_theme.colors.gray,
                                        fontWeight: item.receiver === user_data.phone_number ? app_description.received_messages_font_weight : app_description.sent_messages_font_weight as any,
                                        fontSize: app_description.small_general_font_size,
                                        // marginLeft: item.main_text_message.length < 35 ? item.sender === user_data.phone_number ? 65 : 45 : 10,

                                    }}>{moment(item.createdAt).format('LT')}</Text>

                                    <View style={{
                                        flexDirection: 'row',
                                        alignItems: 'center'
                                    }}>
                                        {item.sender === user_data.phone_number ? IconMessageRead(item.message_read) : null}

                                        {/* <IconApp pack="FA" name="check-circle" size={15} color={app_theme.colors.high_color} styles={{marginLeft: 10}} /> */}
                                    </View>
                                </View>
                            </View>
                        </View>

                        {can_show_image_right ?
                            <View
                                style={{
                                    paddingRight: 5
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
                                        display: app_description.inbox_appearance_style === 0 ? 'flex' : 'none',
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
                        </Animated.View>
                    </GestureDetector>
                </Pressable>
                {/* </SwipableItem> */}
            </Animated.View>
        )
    } else {
        return null;

    }
};

export default memo(MessagesList);