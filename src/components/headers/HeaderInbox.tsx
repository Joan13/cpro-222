import { View, Text, Image, Pressable, Platform, BackHandler } from 'react-native';
import { memo, useEffect, useMemo, useState } from 'react';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useAppDispatch, useAppSelector } from '../../store/app/hooks';
import { strings } from '../../lang/lang';
import { setCurrentUser, setMessageSelected, setPlayingRecorded, setRecordingAudio, setResponseTo } from '../../store/reducers/appSlice';
import * as RootNavigation from './../../services/Navigation_ref';
import { IconApp } from '../app/IconApp';
import { NavProps, TUser } from '../../types/types';
import { useObject, useRealm } from '@realm/react';
import { UserContacts, UsersMessages } from '../../store/database/Models';
import { renderDateTime, SocketApp, media_url, remote_host, formatPhoneInternational } from '../../../GlobalVariables';
import Clipboard from '@react-native-clipboard/clipboard';
import { Image as ExpoImage } from 'expo-image';
import axios from 'axios';

// const audioRecorderPlayer = new AudioRecorderPlayer();

const HeaderInbox = ({ navigation, user }: { navigation: any, user: string }) => {
  // const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const border_color = useAppSelector(state => state.app_theme.colors.border);
  // const { user } = route.params;
  const contacts = useAppSelector(state => state.app.raw_contacts);
  const app_theme = useAppSelector(state => state.app_theme);
  const app_description = useAppSelector(state => state.persisted_app.app_description);
  const message_selected = useAppSelector(state => state.app.message_selected);
  const recordingAudio = useAppSelector(state => state.app.recordingAudio);
  const playingRecorded = useAppSelector(state => state.app.playingRecorded);
  const user_data = useAppSelector(state => state.user_data);
  const message = useObject(UsersMessages, message_selected || "");
  const userrr = useObject(UserContacts, user || "");
  const [last_activity_status, setLast_activity_status] = useState<string>("");
  const realm = useRealm();

  // console.log(user, 'user')

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

  if (user === user_data.phone_number) {
    userr = user_data;
  } else if (userrr !== null) {
    userr = userrr;
  }

  useEffect(() => {
    if (user && user !== user_data.phone_number && (!userrr || !userrr.user_profile)) {
      axios.post(remote_host + '/yambi/API/fetch_user_data', { user })
        .then(response => {
          if (response.data && response.data.success === "1" && response.data.assemble) {
            const contact = contacts.find(element => element.phoneNumber === response.data.assemble._id);
            const user_assemble_data = {
              user_id: response.data.assemble._id,
              user_names: contact !== undefined ? contact.displayName : response.data.assemble.user_names,
              phone_number: response.data.assemble.phone_number,
              gender: typeof response.data.assemble.gender === 'string' ? parseInt(response.data.assemble.gender) : response.data.assemble.gender,
              birth_date: response.data.assemble.birth_date,
              country: response.data.assemble.country,
              user_profile: response.data.assemble.user_profile || "",
              profession: response.data.assemble.profession,
              bio: response.data.assemble.bio,
              user_email: response.data.assemble.user_email,
              user_address: response.data.assemble.user_address,
              status_information: response.data.assemble.status_information,
              user_password: response.data.assemble.user_password,
              account_privacy: typeof response.data.assemble.account_privacy === 'string' ? parseInt(response.data.assemble.account_privacy) : response.data.assemble.account_privacy,
              user_level: response.data.assemble.user_level || 0,
              user_active: response.data.assemble.user_active || 1,
              user_verified: response.data.assemble.user_verified || 0,
              user_verified_at: response.data.assemble.user_verified_at || "",
              notification_token: response.data.assemble.notification_token,
              createdAt: response.data.assemble.createdAt,
              updatedAt: response.data.assemble.updatedAt,
            };

            realm.write(() => {
              try {
                realm.create('UserContacts', user_assemble_data, true);
              } catch (error) { }
            });
          }
        })
        .catch(() => { });
    }
  }, [user, user_data.phone_number, contacts, userrr]);

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
    if (message_selected !== "") {
      dispatch(setMessageSelected(""));
    } else if (recordingAudio || playingRecorded) {
    } else {
      dispatch(setCurrentUser(""));
      navigation.goBack();
      dispatch(setMessageSelected(""));
      dispatch(setResponseTo(""));
    }
  }

  const copyToClipboard = () => {

    if (message === null) return;

    Clipboard.setString(message.main_text_message);
    dispatch(setMessageSelected(""));
  };

  useEffect(() => {
    const backAction = () => {
      if (message_selected !== "") {
        dispatch(setMessageSelected(""));
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, [message_selected, dispatch]);

  const ViewPhoto = () => {
    if (userr.user_profile && userr.user_profile !== "") {
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
      flex: 1,
      // marginRight: 50,
      // width: 250,
      // height: 60,
      // paddingTop: 50,
      // backgroundColor: app_theme.colors.header_background_color,
      // backgroundColor:'green'
    }}>

      <Pressable onPress={() => {
        if (message_selected !== "") {
          dispatch(setMessageSelected(""));
        } else {
          navigation.goBack();
          dispatch(setMessageSelected(""));
          dispatch(setResponseTo(""));
        }
      }} style={{
        height: 44,
        width: 44,
        // paddingLeft: 15,
        // paddingRight: 10,
        alignItems: 'center',
        justifyContent: 'center',
        // marginHorizontal: 5,
        // backgroundColor: 'gray'
      }}>
        <IconApp pack='FI' name={Platform.OS === 'android' ? "arrow-left" : "chevron-left"} size={24} color={app_theme.colors.header_foreground_color} />
      </Pressable>

      {message_selected === "" ?
        <Animated.View entering={FadeIn} exiting={FadeOut} style={{
          flexDirection: 'row',
          flex: 1
        }}>
          <Pressable
            onPress={ViewPhoto}>
            {!userr.user_profile ? <Image
              source={require('./../../assets/profile_black.jpg')}
              style={{ width: 40, height: 40, marginRight: 10, borderRadius: 50, borderWidth: 1, borderColor: border_color }}
            />
              :
              <ExpoImage
                style={{
                  height: 45,
                  width: 45,
                  borderRadius: 50,
                  marginRight: 10
                }}
                contentFit="cover"
                source={{ uri: media_url + "/profile_pictures/" + userr.user_profile }} />}
          </Pressable>

          <Pressable onPress={GoUserProfileInfo}
            style={{
              flex: 1,
              marginRight: 2,
              justifyContent: 'center'
            }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text numberOfLines={1}
                style={{
                  fontSize: app_description.inbox_title_size,
                  fontWeight: app_description.inbox_title_font_weight as any,
                  color: app_theme.colors.header_foreground_color
                }}>{ShowUserName(userr.phone_number)}
              </Text>

              {userr.user_verified === 1 ? <IconApp name="verified" pack="MT" size={18} color={app_theme.colors.primary_high_color} styles={{ marginLeft: 3, marginTop: 2 }} /> : null}
            </View>

            {last_activity_status !== "" ?
              <Text style={{
                fontSize: app_description.small_general_font_size,
                fontWeight: app_description.small_general_font_weight as any,
                color: app_theme.colors.primary_high_color
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
          <ActivityIndicator size={20} color={app_theme.colors.header_foreground_color} />
        </View> */}

            {/* <Pressable style={{
              height: 30,
              width: 30,
              alignItems: 'center',
              justifyContent: 'center',
              marginHorizontal: 5
            }}>
              <Feather name="search" size={20} color={app_theme.colors.header_foreground_color} />
            </Pressable>

            <Pressable style={{
              height: 30,
              width: 30,
              alignItems: 'flex-end',
              justifyContent: 'center',
              marginLeft: 5
            }}>
              <Feather name="camera" size={20} color={app_theme.colors.header_foreground_color} />
            </Pressable> */}
          </View>
        </Animated.View>
        :
        <Animated.View entering={FadeIn} exiting={FadeOut} style={{
          flexDirection: 'row',
          flex: 1
        }}>
          {/* <Pressable onPress={() => navigation.navigate('Themes' as never)}>
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
      </Pressable> */}
          {/* <View style={{
        flex: 1,
        marginRight: 2
      }}>
        <Text numberOfLines={1}
          style={{
            fontSize: app_description.inbox_title_size,
            fontWeight: app_description.inbox_title_font_weight as any,
            color: app_theme.colors.header_foreground_color
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
            {/* <Pressable
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
              <Entypo name="reply" size={20} color={app_theme.colors.header_foreground_color} />
            </Pressable> */}

            {/* <Pressable
              onPress={() => dispatch(setResponseTo(message_selected))}
              style={{
                height: 30,
                width: 30,
                alignItems: 'center',
                justifyContent: 'center',
                marginHorizontal: 5
              }}>
              <MaterialCommunityIcons name="delete-outline" size={20} color={app_theme.colors.header_foreground_color} />
            </Pressable> */}

            {/* <Pressable style={{
              height: 30,
              width: 30,
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: 5
            }}>
              <Entypo name="forward" size={20} color={app_theme.colors.header_foreground_color} />
            </Pressable> */}
            {/* {message !== null ?
              message.message_type === 0 ?
                <Pressable
                  onPress={copyToClipboard}
                  style={{
                    height: 30,
                    width: 30,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginHorizontal: 5
                  }}>
                  <MaterialCommunityIcons name="content-copy" size={20} color={app_theme.colors.header_foreground_color} />
                </Pressable> : null : null} */}
          </View>
        </Animated.View>}

    </View>
  )
}

export default memo(HeaderInbox);