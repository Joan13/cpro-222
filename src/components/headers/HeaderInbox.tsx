import { View, Text, TouchableOpacity, Platform, ActivityIndicator, BackHandler, Image, Pressable, StatusBar } from 'react-native';
import { memo, useEffect, useMemo, useState } from 'react';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../store/app/hooks';
import { strings } from '../../lang/lang';
import Feather from 'react-native-vector-icons/Feather';
import { setCurrentUser, setMessageSelected, setPlayingRecorded, setRecordingAudio, setResponseTo } from '../../store/reducers/appSlice';
import Entypo from 'react-native-vector-icons/Entypo';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import * as RootNavigation from './../../services/Navigation_ref';
import { IconApp } from '../app/IconApp';
import { NavProps, TUser } from '../../types/types';
import { useObject } from '@realm/react';
import { UserContacts, UsersMessages } from '../../store/database/Models';
import FastImage from 'react-native-fast-image';
import { remote_host_server, renderDateTime, SocketApp, media_url, formatPhoneInternational } from '../../../GlobalVariables';
import Clipboard from '@react-native-clipboard/clipboard';

// const audioRecorderPlayer = new AudioRecorderPlayer();

const HeaderInbox = ({ navigation, route }: NavProps) => {
  // const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const border_color = useAppSelector(state => state.app_theme.colors.border);
  const { user } = route.params;
  const contacts = useAppSelector(state => state.app.raw_contacts);
  const app_theme = useAppSelector(state => state.app_theme);
  const app_description = useAppSelector(state => state.persisted_app.app_description);
  const message_selected = useAppSelector(state => state.app.message_selected);
  const recordingAudio = useAppSelector(state => state.app.recordingAudio);
  const playingRecorded = useAppSelector(state => state.app.playingRecorded);
  const user_data = useAppSelector(state => state.user_data);
  const message = useObject(UsersMessages, message_selected);
  const userrr = useObject(UserContacts, user);
  const [last_activity_status, setLast_activity_status] = useState<string>("");

  // console.log(contacts)

  let userr: TUser = {
    user_id: user,
    user_names: user,
    phone_number: user,
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

  useEffect(() => {
    // Emit once when the component mounts
    SocketApp.emit("isThisUserConnected", { phone1: user, phone2: user_data.phone_number });

    // Define the handler
    const handleUserLastActivity = (activity) => {

      if (activity === "1") {
        setLast_activity_status(strings.online);
      } else {
        setLast_activity_status(strings.seen + " " + renderDateTime(activity, 1, false).toLowerCase());
      }

      // console.log(activity); // This should only print once per event
    };

    // Attach the listener
    // SocketApp.on("userLastActivity", handleUserLastActivity);
    SocketApp.on("userLastActivity" + user, handleUserLastActivity);

    // Cleanup function: removes the listener when component unmounts
    return () => {
      // SocketApp.off("userLastActivity", handleUserLastActivity);
      SocketApp.off("userLastActivity" + user, handleUserLastActivity);
    };
  }, [user]); // Only reruns if `user` changes

  const goBack = () => {
    dispatch(setCurrentUser(""));
    if (recordingAudio || playingRecorded) {
    } else if (message_selected !== "") {
      dispatch(setMessageSelected(""));
    } else {
      // RootNavigation.goBack();
      RootNavigation.navigate("Home");
      dispatch(setMessageSelected(""));
      dispatch(setResponseTo(""));
    }
  }

  const copyToClipboard = () => {

    if (message === null) return;

    Clipboard.setString(message.main_text_message);
    dispatch(setMessageSelected(""));
  };

  // const stopBeforeQuit = async () => {
  //   // if (openPlaySurface) {
  //   //   setOpenPlaySurface(false);
  //   // }

  //   await audioRecorderPlayer.stopRecorder();
  //   audioRecorderPlayer.removeRecordBackListener();

  //   dispatch(setRecordingAudio(false));

  //   // if (playingRecorded) {
  //   //   setPlayingRecorded(false);
  //   // }
  // }

  useEffect(() => {

    // console.log(route);

    // const backAction = () => {

    //   stopBeforeQuit();

    //   return true;
    // };

    // const backHandler = BackHandler.addEventListener(
    //   'hardwareBackPress',
    //   backAction,
    // );

    // return () => backHandler.remove();
  }, []);

  const ViewPhoto = () => {
    if (userr.user_profile !== "") {
      RootNavigation.navigate("ViewPhoto", { source: media_url + "/profile_pictures/" + userr.user_profile })
    } else {
      RootNavigation.navigate("ViewPhoto", { source: "" })
    }
  }

  const ShowUserName = (phone_number: string) => {

    const contact = contacts.find((cc) => cc.phoneNumber === phone_number);
    // console.log(contact)
    if (contact !== undefined) {
      // console.log(contact)
      return contact.displayName;
    } else {
      return formatPhoneInternational({ phone_number, country: "" } as TUser);
    }

    // return "OK"
  }

  const GoUserProfileInfo = () => {
    navigation.navigate('UserProfileInfo', { user: userr });
  }

  return (
    <View style={{
      flexDirection: 'row',
      // borderBottomWidth: 1,
      // borderColor: app_theme.colors.border,
      alignItems: 'center',
      // flex:1,
      // height: 60,
      // paddingTop: 50,
      // backgroundColor: app_theme.colors.design_tip1,
      // backgroundColor:'green'
    }}>

      {/* <TouchableOpacity onPress={goBack} style={{
        height: 50,
        // width: 35,
        paddingLeft: 15,
        paddingRight: 10,
        // alignItems: 'center',
        justifyContent: 'center',
        // marginHorizontal: 5,
        // backgroundColor: 'gray'
      }}>
        <IconApp pack='FI' name={Platform.OS === 'android' ? "arrow-left" : "chevron-left"} size={22} color={app_theme.colors.text_design1} />
      </TouchableOpacity> */}

      {message_selected === "" ?
        <Animated.View entering={FadeIn} exiting={FadeOut} style={{
          flexDirection: 'row',
          flex: 1
        }}>
          <Pressable onPress={ViewPhoto}>
            {userr.user_profile === "" ? <Image
              source={require('./../../assets/profile_black.jpg')}
              style={{ width: 40, height: 40, marginRight: 10, borderRadius: 50, borderWidth: 1, borderColor: border_color }}
            />
              :
              <FastImage
                style={{
                  height: 40,
                  width: 40,
                  borderRadius: 50,
                  marginRight: 10
                }}
                resizeMode={FastImage.resizeMode.cover}
                source={{
                  priority: FastImage.priority.high,
                  cache: 'immutable',
                  uri: media_url + "/profile_pictures/" + userr.user_profile
                }} />}
          </Pressable>

          <Pressable onPress={GoUserProfileInfo}
            style={{
              flex: 1,
              // backgroundColor:'green',
              marginRight: 2,
              justifyContent: 'center'
            }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text numberOfLines={1}
                style={{
                  fontSize: app_description.inbox_title_size,
                  fontWeight: app_description.inbox_title_font_weight as any,
                  color: app_theme.colors.text_design1
                }}>{ShowUserName(userr.phone_number)}
              </Text>

              {userr.user_verified === 1 ? <IconApp name="verified" pack="MT" size={18} color={app_theme.colors.high_color} styles={{ marginLeft: 5 }} /> : null}
            </View>

            {last_activity_status !== "" ?
              <Text style={{
                fontSize: app_description.small_general_font_size,
                fontWeight: app_description.small_general_font_weight as any,
                color: app_theme.colors.high_color
              }}>{last_activity_status.toLowerCase()}</Text> : null}

          </Pressable>

          <View style={{
            // flex:1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 15
          }}>
            {/* <View style={{
          width: 30,
          alignItems: 'center',
          justifyContent: 'center',
          marginHorizontal: 5
        }}>
          <ActivityIndicator size={20} color={app_theme.colors.text_design1} />
        </View> */}

            {/* <TouchableOpacity style={{
              height: 30,
              width: 30,
              alignItems: 'center',
              justifyContent: 'center',
              marginHorizontal: 5
            }}>
              <Feather name="search" size={20} color={app_theme.colors.text_design1} />
            </TouchableOpacity>

            <TouchableOpacity style={{
              height: 30,
              width: 30,
              alignItems: 'flex-end',
              justifyContent: 'center',
              marginLeft: 5
            }}>
              <Feather name="camera" size={20} color={app_theme.colors.text_design1} />
            </TouchableOpacity> */}
          </View>
        </Animated.View>
        :
        <Animated.View entering={FadeIn} exiting={FadeOut} style={{
          flexDirection: 'row',
          flex: 1
        }}>
          {/* <TouchableOpacity onPress={() => navigation.navigate('Themes' as never)}>
        <Animated.View
          sharedTransitionTag='viewImageInbox'
          style={{
            justifyContent: 'center',
            alignContent: 'center',
            alignItems: 'center',
            marginRight: 10
          }}>
          <Animated.Image
            sharedTransitionTag='imageInbox'
            source={require('./../../assets/profile_blackkk.jpg')}
            style={{ width: 40, height: 40, borderRadius: 50, borderWidth: 1, borderColor: border_color }}
          />
        </Animated.View>
      </TouchableOpacity> */}
          {/* <View style={{
        flex: 1,
        marginRight: 2
      }}>
        <Text numberOfLines={1}
          style={{
            fontSize: app_description.inbox_title_size,
            fontWeight: app_description.inbox_title_font_weight as any,
            color: app_theme.colors.text_design1
          }}>{current_user.user_names}</Text>
        <Text style={{
          fontSize: app_description.small_general_font_size,
          fontWeight: app_description.small_general_font_weight as any,
          color: app_theme.colors.high_color
        }}>{strings.online}</Text>
      </View> */}

          <View style={{ flex: 1 }}></View>

          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            // marginRight: 15
          }}>
            {/* <TouchableOpacity
              onPress={() => {
                dispatch(setResponseTo(message_selected));
                dispatch(setMessageSelected(""));
              }}
              style={{
                height: 30,
                width: 30,
                alignItems: 'center',
                justifyContent: 'center',
                marginHorizontal: 5
              }}>
              <Entypo name="reply" size={20} color={app_theme.colors.text_design1} />
            </TouchableOpacity> */}

            {/* <TouchableOpacity
              onPress={() => dispatch(setResponseTo(message_selected))}
              style={{
                height: 30,
                width: 30,
                alignItems: 'center',
                justifyContent: 'center',
                marginHorizontal: 5
              }}>
              <MaterialCommunityIcons name="delete-outline" size={20} color={app_theme.colors.text_design1} />
            </TouchableOpacity> */}

            {/* <TouchableOpacity style={{
              height: 30,
              width: 30,
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: 5
            }}>
              <Entypo name="forward" size={20} color={app_theme.colors.text_design1} />
            </TouchableOpacity> */}
            {/* {message !== null ?
              message.message_type === 0 ?
                <TouchableOpacity
                  onPress={copyToClipboard}
                  style={{
                    height: 30,
                    width: 30,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginHorizontal: 5
                  }}>
                  <MaterialCommunityIcons name="content-copy" size={20} color={app_theme.colors.text_design1} />
                </TouchableOpacity> : null : null} */}
          </View>
        </Animated.View>}

    </View>
  )
}

export default memo(HeaderInbox);