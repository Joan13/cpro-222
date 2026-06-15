import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Linking, RefreshControl } from 'react-native';
import { strings } from '../../lang/lang';
import { useAppDispatch, useAppSelector } from '../../store/app/hooks';
import StatusBarYambi from '../../components/app/StatusBar';
import axios from 'axios';
import { YambiText } from '../../components/app/Text';
import { copyToClipboard, formatPhoneInternational, remote_host, remote_host_server, media_url } from '../../../GlobalVariables';
import { IconApp } from '../../components/app/IconApp';
import { NavProps, TChat, TUser } from '../../types/types';
import { useObject, useQuery, useRealm } from '@realm/react';
import { setMessageSelected, setShowModalApp } from '../../store/reducers/appSlice';
import ModalApp from '../../components/app/ModalApp';
import Animated from 'react-native-reanimated';
import SwitchApp from '../../components/app/SwitchApp';
import { UserChats, UserContacts, UsersMessages } from '../../store/database/Models';
import { SafeAreaView } from 'react-native-safe-area-context';

// import React, { useState } from 'react';
// import { View, Text, StyleSheet, Image, StatusBar, Pressable, SafeAreaView, Pressable } from 'react-native';
// import Animated, {
//      FadeIn,
//      FadeOut,
//      useSharedValue,
//      useAnimatedScrollHandler,
//      runOnJS,
// } from 'react-native-reanimated';
// import StatusBarYambi from '../../components/app/StatusBar';
// import { strings } from '../../lang/lang';
// import { TextNormalYambi, TextSmallYambiGray } from '../../components/app/Text';
// import { IconApp } from '../../components/app/IconApp';

// const HEADER_HEIGHT = 60;
// const IMAGE_HEIGHT = 150;
// const IMAGE_VISIBLE_THRESHOLD = IMAGE_HEIGHT * 0.5; // 30px

const UserProfileInfo = ({ navigation, route }: NavProps) => {

     const theme = useAppSelector(state => state.app_theme);
     const { user } = route.params;
     const dispatch = useAppDispatch();
     const moi = useAppSelector(state => state.user_data);
     const [user_data, setUser_data] = useState<TUser>(user);
     const [showInternetError, setShowInternetError] = useState<boolean>(false);
     const raw_contacts = useAppSelector(state => state.persisted_app.raw_contacts);
     const realm = useRealm();
     const [refreshing, setRefreshing] = useState<boolean>(false);

     const onRefresh = useCallback(() => {
          setRefreshing(true);
          FetchUserInfo();
     }, []);

     const chatt: TChat = {
          _id: user_data.phone_number,
          phone_number: user_data.phone_number,
          type_chat: 0,
          last_message: "",
          user: moi.phone_number,
          flag: 0,
          chat_read: 1,
          deleted: 0,
          chat_effect: 0,
          createdAt: "",
          updatedAt: "",
     }

     const userrr = useObject(UserContacts, user_data.phone_number);

     const messages = useQuery(
          UsersMessages, msgs => {
               return msgs.filtered('(receiver == $0 && sender == $1) || (sender == $2 && receiver==$3)', moi.phone_number, user_data.phone_number, moi.phone_number, user_data.phone_number)
                    .sorted('alignment', true);
          }, []);

     const chattt = useObject(UserChats, user_data.phone_number);
     const [chat, setChat] = useState<TChat>(chattt ? chattt : chatt);

     const formattedPhoneNumber = formatPhoneInternational(user_data);

     const FetchUserInfo = async () => {
          await axios.post(remote_host + '/yambi/API/fetch_user_data', {
               user: user_data.phone_number
          })
               .then(response => {

                    // console.log(response.data);

                    if (response.data.success === "1") {
                         //    realm.write(() => {
                         //        try {
                         //            realm.create('UserData', user_assemble_data, true);
                         //        } catch (error) { }
                         //    });

                         // console.log(response.data.assemble)
                         const contact = raw_contacts.find(element => element.phoneNumber === response.data.assemble._id);

                         const user_assemble_data = {
                              user_id: response.data.assemble._id,
                              user_names: contact !== undefined ? contact.displayName : response.data.assemble.user_names,
                              phone_number: response.data.assemble.phone_number,
                              gender: typeof response.data.assemble.gender === 'string' ? parseInt(response.data.assemble.gender) : response.data.assemble.gender,
                              birth_date: response.data.assemble.birth_date,
                              country: response.data.assemble.country,
                              user_profile: response.data.assemble.user_profile,
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
                         }

                         if (userrr) {
                              realm.write(() => {
                                   try {
                                        realm.create('UserContacts', user_assemble_data, true);
                                   } catch (error) { }
                              });
                         }
                         setUser_data(user_assemble_data);
                    }

                    setRefreshing(false);
               })
               .catch(() => {
                    setRefreshing(false);
                    setShowInternetError(true);
                    dispatch(setShowModalApp(true));
               });
     }

     useEffect(() => {
          FetchUserInfo();
     }, []);

     // useEffect(()=>{
     //      if(!chat){
     //           const chatt: TChat = {
     //                _id: user_data.phone_number,
     //                phone_number: user_data.phone_number,
     //                type_chat: 0,
     //                last_message: "",
     //                user: moi.phone_number,
     //                flag: 0,
     //                chat_read: 1,
     //                deleted: 0,
     //                chat_effect: 0,
     //                createdAt: "",
     //                updatedAt: "",
     //              }

     //              setChat(chatt);
     //      }else{
     //           setChat(chattt);
     //      }
     // },[chattt]);

     //      const { height: sHeight, width: sWidth } = Dimensions.get('screen');
     // type Props = {}

     // const ImageHeight = 280;

     // // const HeaderAnim1 = () => {
     //   const scrollY = useSharedValue(0)
     //   const handleScroll = useAnimatedScrollHandler((event) => {
     //     scrollY.value = event.contentOffset.y;
     //   })

     //   const scrollAnimatedStyles = useAnimatedStyle(() => {
     //     const translateY = interpolate(
     //       scrollY.value,
     //       [0, 320],
     //       [0, -ImageHeight],
     //       Extrapolation.CLAMP,
     //     )
     //     return { transform: [{ translateY }] };
     //   })
     //   const headerViewAnimatedStyles = useAnimatedStyle(() => {
     //     const backgroundColor = interpolateColor(
     //       scrollY.value,
     //       [0, 320],
     //       ['transparent', 'green'],
     //     )
     //     return { backgroundColor };
     //   })
     //   const titleAnimatedStyles = (fadeIn: boolean) => useAnimatedStyle(() => {
     //     const outputRange = fadeIn ? [0, 0, 1] : [1, 0, 0]
     //     const opacity = interpolate(
     //       scrollY.value,
     //       [0, 120, 320],
     //       outputRange,
     //     )
     //     return { opacity };
     //   })
     //   const animatedImageStyles = useAnimatedStyle(() => {
     //     const scale = interpolate(
     //       scrollY.value,
     //       [0, 320],
     //       [1.4, 1],
     //       { extrapolateRight: Extrapolation.CLAMP },
     //     )
     //     return { transform: [{ scale }] };
     //   })

     const SetFlag = (flag: number) => {
          const chattt: TChat = {
               _id: chat._id,
               phone_number: chat.phone_number,
               type_chat: chat.type_chat,
               last_message: chat.last_message,
               user: chat.user,
               flag: chat.flag === flag ? 0 : flag,
               chat_read: chat.chat_read,
               deleted: chat.deleted,
               chat_effect: chat.chat_effect,
               createdAt: chat.createdAt,
               updatedAt: chat.updatedAt,
          }

          realm.write(() => {
               try {
                    realm.create('UserChats', chattt, true);
               } catch (error) { }
          });
     }

     useEffect(() => {
          // setUser_data(user);
     }, []);

     const ViewPhoto = () => {
          if (user_data.user_profile !== "") {
               navigation.navigate("ViewPhoto", { source: media_url + "/profile_pictures/" + user_data.user_profile });
          } else {
               navigation.navigate("ViewPhoto", { source: "" });
          }
     }

     const GoInbox = () => {
          dispatch(setMessageSelected(""));
          navigation.navigate("Inbox", { user: user_data.phone_number });
     };

     return (
          <View style={{backgroundColor: theme.colors.background, flex: 1, borderColor: theme.colors.border, borderTopWidth: 1}}>

               {showInternetError ?
                    <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowInternetError(false); }} singleButton title={strings.error}>
                         <YambiText text={strings.connection_failed} size="normal" color="gray" />
                    </ModalApp> : null}

               <View style={{ flex: 1, marginBottom:  50}}>
                    <StatusBarYambi />

                    <Animated.ScrollView
                         style={{ flex: 1, backgroundColor: 'transparent' }}
                         refreshControl={
                              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                         }
                         contentContainerStyle={{ paddingBottom: 20 }}
                    >
                         <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
                              {/* Profile Header Card */}
                              <View style={{
                                   backgroundColor: theme.colors.border,
                                   marginHorizontal: 20,
                                   marginTop: 20,
                                   marginBottom: 15,
                                   borderRadius: 16,
                                   padding: 20,
                              }}>
                                   <View style={{
                                        flexDirection: 'row',
                                        alignItems: 'flex-start',
                                   }}>
                                        {/* Profile Image */}
                                        <View style={{
                                             position: 'relative',
                                             marginRight: 15,
                                        }}>
                                             <Pressable onPress={ViewPhoto}>
                                                  <Animated.View
                                                       sharedTransitionTag='homeViewAnimated'
                                                       style={{
                                                            width: 80,
                                                            height: 80,
                                                            borderWidth: 2,
                                                            borderColor: theme.colors.high_color,
                                                            borderRadius: 40,
                                                            overflow: 'hidden',
                                                       }}
                                                  >
                                                       {user_data.user_profile === "" ?
                                                            <Animated.Image
                                                                 sharedTransitionTag='homeImageAnimated'
                                                                 source={require("./../../assets/profile_black.jpg")}
                                                                 style={{ width: 80, height: 80, flex: 1 }}
                                                            />
                                                            :
                                                            <Animated.Image
                                                                 sharedTransitionTag='homeImageAnimated'
                                                                 src={media_url + "/profile_pictures/" + user_data.user_profile}
                                                                 style={{ width: 80, height: 80 }}
                                                            />
                                                       }
                                                  </Animated.View>
                                             </Pressable>
                                        </View>

                                        {/* User Basic Info */}
                                        <View style={{ flex: 1, justifyContent: 'center' }}>
                                             <View style={{
                                                  flexDirection: 'row',
                                                  alignItems: 'center',
                                                  marginBottom: 6,
                                                  flexWrap: 'wrap',
                                             }}>
                                                  <IconApp pack='FI' name="user" size={14} color={theme.colors.gray} styles={{ marginRight: 6 }} />
                                                  <Text
                                                       style={{
                                                            color: theme.colors.text,
                                                            fontSize: 18,
                                                            fontWeight: 'bold',
                                                       }}
                                                       numberOfLines={2}
                                                  >
                                                       {user_data.user_names}
                                                  </Text>

                                                  {user_data.user_verified === 1 && (
                                                       <IconApp pack='MT' name="verified" size={16} color={theme.colors.high_color} styles={{ marginLeft: 6 }} />
                                                  )}
                                             </View>

                                             {/* Phone Number */}
                                             {user_data.phone_number !== "" && (
                                                  <Pressable
                                                       onLongPress={() => copyToClipboard(user_data.phone_number)}
                                                       style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}
                                                  >
                                                       <IconApp pack='FI' name="phone" size={12} color={theme.colors.gray} />
                                                       <YambiText text={formattedPhoneNumber} size="small" color="default" style={{ marginLeft: 5, fontSize: 12 }} />
                                                  </Pressable>
                                             )}

                                             {/* Account Privacy Badge */}
                                             <View style={{
                                                  backgroundColor: user_data.account_privacy === 1 ? theme.colors.error + '20' : theme.colors.success + '20',
                                                  paddingHorizontal: 10,
                                                  paddingVertical: 3,
                                                  borderRadius: 10,
                                                  alignSelf: 'flex-start',
                                             }}>
                                                  <YambiText
                                                       text={user_data.account_privacy === 1 ? strings.private_account : strings.public_account}
                                                       size="small"
                                                       color={user_data.account_privacy === 1 ? "error" : "success"}
                                                       bold
                                                       style={{
                                                            fontSize: 10
                                                       }}
                                                  />
                                             </View>
                                        </View>
                                   </View>

                                   {/* Additional Information Section */}
                                   {((user_data.bio && user_data.bio !== "") ||
                                        (user_data.profession && user_data.profession !== "") ||
                                        (user_data.user_address && user_data.user_address !== "") ||
                                        (user_data.status_information && user_data.status_information !== "")) && (
                                             <View style={{
                                                  marginTop: 15,
                                                  paddingTop: 15,
                                                  borderTopWidth: 1,
                                                  borderColor: theme.colors.background,
                                             }}>
                                                  {/* Profession */}
                                                  {user_data.profession && user_data.profession !== "" && (
                                                       <View style={{ marginBottom: 8 }}>
                                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
                                                                 <IconApp pack='FI' name="briefcase" size={12} color={theme.colors.high_color} />
                                                                 <YambiText text={strings.profession || "Profession"} size="small" color="gray" style={{ marginLeft: 5, fontSize: 11 }} />
                                                            </View>
                                                            <YambiText text={user_data.profession} size="small" color="default" style={{ marginLeft: 17, fontSize: 13 }} />
                                                       </View>
                                                  )}

                                                  {/* Address */}
                                                  {user_data.user_address && user_data.user_address !== "" && (
                                                       <View style={{ marginBottom: 8 }}>
                                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
                                                                 <IconApp pack='FI' name="map-pin" size={12} color={theme.colors.high_color} />
                                                                 <YambiText text={strings.address || "Address"} size="small" color="gray" style={{ marginLeft: 5, fontSize: 11 }} />
                                                            </View>
                                                            <YambiText text={user_data.user_address} size="small" color="default" style={{ marginLeft: 17, fontSize: 13 }} />
                                                       </View>
                                                  )}

                                                  {/* Status */}
                                                  {user_data.status_information && user_data.status_information !== "" && (
                                                       <View style={{ marginBottom: 8 }}>
                                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
                                                                 <IconApp pack='FI' name="info" size={14} color={theme.colors.high_color} />
                                                                 <YambiText text={strings.status || "Status"} size="small" color="gray" style={{ marginLeft: 5, fontSize: 11 }} />
                                                            </View>
                                                            <YambiText text={user_data.status_information} size="small" color="default" style={{ marginLeft: 17, fontSize: 13 }} />
                                                       </View>
                                                  )}

                                                  {/* Bio */}
                                                  {user_data.bio && user_data.bio !== "" && (
                                                       <View>
                                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
                                                                 <IconApp pack='FI' name="edit-3" size={12} color={theme.colors.high_color} />
                                                                 <YambiText text={strings.bio || "Bio"} size="small" color="gray" style={{ marginLeft: 5, fontSize: 11 }} />
                                                            </View>
                                                            <YambiText text={user_data.bio} size="small" color="default" style={{ marginLeft: 17, fontSize: 13 }} />
                                                       </View>
                                                  )}
                                             </View>
                                        )}
                              </View>

                              {/* Quick Actions */}
                              <View style={{
                                   flexDirection: 'row',
                                   justifyContent: 'space-around',
                                   marginHorizontal: 20,
                                   marginBottom: 16,
                              }}>
                                   <Pressable
                                        onPress={GoInbox}
                                        style={{ alignItems: 'center' }}
                                   >
                                        <View style={{
                                             width: 40,
                                             height: 40,
                                             borderRadius: 20,
                                             backgroundColor: theme.colors.high_color + '20',
                                             justifyContent: 'center',
                                             alignItems: 'center',
                                             marginBottom: 6,
                                        }}>
                                             <IconApp pack="MC" name="message-text" size={20} color={theme.colors.high_color} />
                                        </View>
                                        <YambiText text={strings.message} size="small" color="high" />
                                   </Pressable>

                                   <Pressable
                                        onPress={() => copyToClipboard(user_data.phone_number)}
                                        style={{ alignItems: 'center' }}
                                   >
                                        <View style={{
                                             width: 40,
                                             height: 40,
                                             borderRadius: 20,
                                             backgroundColor: theme.colors.high_color + '20',
                                             justifyContent: 'center',
                                             alignItems: 'center',
                                             marginBottom: 6,
                                        }}>
                                             <IconApp pack="MC" name="content-copy" size={20} color={theme.colors.high_color} />
                                        </View>
                                        <YambiText text={strings.copy_number} size="small" color="high" />
                                   </Pressable>

                                   {!userrr && (
                                        <Pressable
                                             onPress={() => Linking.openURL("tel:" + user_data.phone_number)}
                                             style={{ alignItems: 'center' }}
                                        >
                                             <View style={{
                                                  width: 40,
                                                  height: 40,
                                                  borderRadius: 20,
                                                  backgroundColor: theme.colors.high_color + '20',
                                                  justifyContent: 'center',
                                                  alignItems: 'center',
                                                  marginBottom: 6,
                                             }}>
                                                  <IconApp pack='FA' name="user-plus" size={20} color={theme.colors.high_color} />
                                             </View>
                                             <YambiText text={strings.add} size="small" color="high" />
                                        </Pressable>
                                   )}
                              </View>

                              {/* Chat Settings Card */}
                              <View style={{ paddingHorizontal: 20 }}>
                                   <View style={{
                                        backgroundColor: theme.colors.background,
                                        borderRadius: 12,
                                        borderWidth: 1,
                                        borderColor: theme.colors.border,
                                        overflow: 'hidden',
                                   }}>
                                        {/* Notifications */}
                                        <View style={{
                                             flexDirection: 'row',
                                             alignItems: 'center',
                                             paddingVertical: 15,
                                             paddingHorizontal: 16,
                                             borderBottomWidth: 1,
                                             borderBottomColor: theme.colors.border,
                                        }}>
                                             <IconApp styles={{}} name="notifications" pack='IO' size={20} color={theme.colors.gray} />
                                             <View style={{ marginLeft: 16, flex: 1 }}>
                                                  <YambiText text={strings.notifications} size="normal" color="default" />
                                                  <YambiText text={strings.notifications_text} size="small" color="gray" />
                                             </View>
                                             <SwitchApp value={true} onPress={() => { }} />
                                        </View>

                                        {/* Media Visibility */}
                                        <View style={{
                                             flexDirection: 'row',
                                             alignItems: 'center',
                                             paddingVertical: 15,
                                             paddingHorizontal: 16,
                                             borderBottomWidth: 1,
                                             borderBottomColor: theme.colors.border,
                                        }}>
                                             <IconApp styles={{}} name="picture" pack='AD' size={20} color={theme.colors.gray} />
                                             <View style={{ marginLeft: 16, flex: 1 }}>
                                                  <YambiText text={strings.media_visibility} size="normal" color="default" />
                                                  <YambiText text={strings.media_visibility_text} size="small" color="gray" />
                                             </View>
                                             <SwitchApp value={false} disabled={true} onPress={() => { }} />
                                        </View>

                                        {/* Messages Counter */}
                                        <Pressable
                                             onPress={() => navigation.navigate("AllMessages", { messages: messages })}
                                             style={{
                                                  flexDirection: 'row',
                                                  alignItems: 'center',
                                                  paddingVertical: 15,
                                                  paddingHorizontal: 16,
                                                  borderBottomWidth: 1,
                                                  borderBottomColor: theme.colors.border,
                                             }}
                                        >
                                             <IconApp styles={{}} name="message-text" pack="MC" size={20} color={theme.colors.gray} />
                                             <View style={{ marginLeft: 16, flex: 1 }}>
                                                  <YambiText text={strings.message_counter} size="normal" color="default" />
                                             </View>
                                             <YambiText text={messages.length.toString()} size="normal" color="default" />
                                             <IconApp styles={{ marginLeft: 8 }} name="chevron-right" pack='FI' size={20} color={theme.colors.text} />
                                        </Pressable>

                                        {/* Pin Chat */}
                                        <View style={{
                                             flexDirection: 'row',
                                             alignItems: 'center',
                                             paddingVertical: 15,
                                             paddingHorizontal: 16,
                                             borderBottomWidth: 1,
                                             borderBottomColor: theme.colors.border,
                                        }}>
                                             <IconApp styles={{}} name="pin" pack='MC' size={20} color={theme.colors.gray} />
                                             <View style={{ marginLeft: 16, flex: 1 }}>
                                                  <YambiText text={chat.flag === 2 ? strings.unpin_chat : strings.pin_chat} size="normal" color="default" />
                                             </View>
                                             <SwitchApp disabled={messages.length === 0} value={chat.flag === 2} onPress={() => SetFlag(2)} />
                                        </View>

                                        {/* Favorites */}
                                        <View style={{
                                             flexDirection: 'row',
                                             alignItems: 'center',
                                             paddingVertical: 15,
                                             paddingHorizontal: 16,
                                        }}>
                                             <IconApp styles={{}} name="star" pack='FI' size={20} color={theme.colors.gray} />
                                             <View style={{ marginLeft: 16, flex: 1 }}>
                                                  <YambiText text={chat.flag === 1 ? strings.remove_from_favorites : strings.add_to_favorites} size="normal" color="default" />
                                             </View>
                                             <SwitchApp disabled={messages.length === 0} value={chat.flag === 1} onPress={() => SetFlag(1)} />
                                        </View>
                                   </View>
                              </View>
                         </View>

                         <View style={{ height: 20 }} />
                    </Animated.ScrollView>
               </View>
          </View>
     )
}

export default UserProfileInfo;

// import React from 'react';
// import { View, Text, StyleSheet, StatusBar } from 'react-native';
// import Animated, {
//   useSharedValue,
//   useAnimatedScrollHandler,
//   useAnimatedStyle,
//   withTiming,
// } from 'react-native-reanimated';
// import { ScrollView } from 'react-native-gesture-handler';

// const HEADER_HEIGHT = 70;

// export default function UserProfileInfo() {
//   const translateY = useSharedValue(0);
//   const lastScrollY = useSharedValue(0);

// //   const scrollHandler = useAnimatedScrollHandler({
// //     onScroll: (event) => {
// //       const currentY = event.contentOffset.y;
// //       const diff = currentY - lastScrollY.value;

// //       // Si on descend
// //       if (diff > 0 && currentY > HEADER_HEIGHT) {
// //         translateY.value = withTiming(-HEADER_HEIGHT, { duration: 200 });
// //       }
// //       // Si on monte
// //       else if (diff < 0) {
// //         translateY.value = withTiming(0, { duration: 200 });
// //       }

// //       lastScrollY.value = currentY;
// //     },
// //   });

// const scrollHandler = useAnimatedScrollHandler({
//      onScroll: (event) => {
//        const currentY = event.contentOffset.y;
//        const diff = currentY - lastScrollY.value;

//        const imageTriggerPoint = 30 + 150 - 90; // = 90

//        if (currentY > imageTriggerPoint) {
//          if (diff > 0) {
//            // On descend après la photo → cacher
//            translateY.value = withTiming(-HEADER_HEIGHT, { duration: 200 });
//          } else if (diff < 0) {
//            // On monte → réafficher
//            translateY.value = withTiming(0, { duration: 200 });
//          }
//        } else {
//          // Si on est encore au-dessus du seuil → toujours visible
//          translateY.value = withTiming(0, { duration: 200 });
//        }

//        lastScrollY.value = currentY;
//      },
//    });

//   const headerStyle = useAnimatedStyle(() => ({
//     transform: [{ translateY: translateY.value }],
//   }));

//   return (
//     <View style={{ flex: 1 }}>
//       <Animated.View style={[styles.header, headerStyle]}>
//         <Text style={styles.headerText}>Mon Header</Text>
//       </Animated.View>

//       <Animated.ScrollView
//         onScroll={scrollHandler}
//         scrollEventThrottle={16}
//         contentContainerStyle={{ paddingTop: HEADER_HEIGHT }}
//       >
//         {/* Contenu de ta page */}
//         {Array.from({ length: 30 }).map((_, i) => (
//           <View key={i} style={styles.item}>
//             <Text>Item {i + 1}</Text>
//           </View>
//         ))}
//       </Animated.ScrollView>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   header: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     height: HEADER_HEIGHT,
//     backgroundColor: '#2196F3',
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 10,
//     paddingTop: StatusBar.currentHeight || 20,
//   },
//   headerText: {
//     color: '#fff',
//     fontSize: 18,
//     fontWeight: 'bold',
//   },
//   item: {
//     height: 80,
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderBottomWidth: 1,
//     borderBottomColor: '#ccc',
//   },
// });

// import React from 'react';
// import { View, Text, StyleSheet, Image, StatusBar } from 'react-native';
// import Animated, {
//   useSharedValue,
//   useAnimatedScrollHandler,
//   useAnimatedStyle,
//   withTiming,
// } from 'react-native-reanimated';
// import { ScrollView } from 'react-native-gesture-handler';

// const HEADER_HEIGHT = 70;
// const IMAGE_HEIGHT = 150;
// const IMAGE_VISIBLE_THRESHOLD = IMAGE_HEIGHT * 0.2; // 30px visible = 20% → donc on cache si + scroll

// export default function UserProfileInfo() {
//   const translateY = useSharedValue(-HEADER_HEIGHT); // initial: caché
//   const lastScrollY = useSharedValue(0);
//   const opacity = useSharedValue(0);

//   const scrollHandler = useAnimatedScrollHandler({
//     onScroll: (event) => {
//       const currentY = event.contentOffset.y;
//       const diff = currentY - lastScrollY.value;

//       if (currentY > IMAGE_VISIBLE_THRESHOLD) {
//         // On est en dessous du seuil, donc on montre le header
//         translateY.value = withTiming(0, { duration: 500 });
//         opacity.value = withTiming(1, { duration: 500 });
//       } else {
//         // Si la photo est à 80% visible ou plus → on cache le header
//         translateY.value = withTiming(-HEADER_HEIGHT, { duration: 500 });
//         opacity.value = withTiming(0, { duration: 500 });
//       }

//       lastScrollY.value = currentY;
//     },
//   });

//   const headerStyle = useAnimatedStyle(() => ({
//     transform: [{ translateY: translateY.value }],
//     opacity: opacity.value,
//   }));

//   return (
//     <View style={{ flex: 1 }}>
//       {/* Header animé */}
//       <Animated.View style={[styles.header, headerStyle]}>
//         <Text style={styles.headerText}>Mon Header</Text>
//       </Animated.View>

//       {/* Scroll avec padding top pour pas passer sous le header */}
//       <Animated.ScrollView
//         onScroll={scrollHandler}
//         scrollEventThrottle={16}
//         contentContainerStyle={{ paddingTop: StatusBar.currentHeight || 20 }}
//       >
//         <View style={{ height: 30 }} />
//         <Image
//           source={{ uri: 'https://placekitten.com/600/300' }}
//           style={styles.image}
//           resizeMode="cover"
//         />
//         {Array.from({ length: 30 }).map((_, i) => (
//           <View key={i} style={styles.item}>
//             <Text>Item {i + 1}</Text>
//           </View>
//         ))}
//       </Animated.ScrollView>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   header: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     height: HEADER_HEIGHT,
//     backgroundColor: '#6200EE',
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 100,
//     paddingTop: StatusBar.currentHeight || 20,
//   },
//   headerText: {
//     color: '#fff',
//     fontSize: 18,
//     fontWeight: 'bold',
//   },
//   image: {
//     width: '100%',
//     height: 150,
//     marginBottom: 20,
//   },
//   item: {
//     height: 80,
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderBottomColor: '#ccc',
//     borderBottomWidth: 1,
//   },
// });

// export default function UserProfileInfo() {
//      const [showHeader, setShowHeader] = useState(false);
//      const lastScrollY = useSharedValue(0);

//      const handleShowHeader = () => setShowHeader(true);
//      const handleHideHeader = () => setShowHeader(false);

//      const scrollHandler = useAnimatedScrollHandler({
//           onScroll: (event) => {
//                const currentY = event.contentOffset.y;

//                if (currentY > IMAGE_VISIBLE_THRESHOLD && !showHeader) {
//                     runOnJS(handleShowHeader)();
//                } else if (currentY <= IMAGE_VISIBLE_THRESHOLD && showHeader) {
//                     runOnJS(handleHideHeader)();
//                }

//                lastScrollY.value = currentY;
//           },
//      });

//      return (
//           <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>

//                {/* Scroll content */}
//                <Animated.ScrollView
//                     onScroll={scrollHandler}
//                     scrollEventThrottle={16}
//                     contentContainerStyle={{ paddingTop: StatusBar.currentHeight || 20 }}
//                >

//                     <StatusBarYambi />

//                     {/* <Animated.ScrollView style={{ paddingHorizontal: 20 }}> */}
//                     <View>
//                          <View style={{ marginBottom: 10, marginTop: 20 }}>
//                               <View style={{ flex: 1, justifyContent: 'center', alignItems: "center" }}>

//                                    <View style={{
//                                         justifyContent: 'center', alignContent: 'center', alignItems: 'flex-end'
//                                    }}>
//                                         <Pressable onPress={ViewPhoto}>
//                                              <Animated.View
//                                                   sharedTransitionTag='homeViewAnimated'
//                                                   style={{ marginBottom: 20, width: 150, height: 150, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 100 }}>

//                                                   {user_data.user_profile === "" ?
//                                                        <Animated.Image
//                                                             sharedTransitionTag='homeImageAnimated'
//                                                             source={require("./../../assets/profile_black.jpg")} style={{ width: 150, height: 150, borderRadius: 100, flex: 1 }} />
//                                                        :
//                                                        <Animated.Image
//                                                             sharedTransitionTag='homeImageAnimated'
//                                                             src={media_url + "/profile_pictures/" + user_data.user_profile} style={{ width: 150, height: 150, borderRadius: 100 }} />}
//                                              </Animated.View>
//                                         </Pressable>
//                                    </View>

//                                    <View style={{
//                                         flexDirection: 'row',
//                                         alignItems: 'center'
//                                    }}>
//                                         <Text style={{ color: theme.colors.text, fontSize: 22, fontWeight: '900', textAlign: 'center' }}>{user_data.user_names}</Text>

//                                         {user_data.account_privacy === "2" || user_data.account_privacy === "3" ?
//                                              <IconApp pack='MT' name="verified" size={20} color={theme.colors.high_color} styles={{ marginLeft: 5 }} /> : null}
//                                    </View>

//                                    <TextNormalYambi text={user_data.phone_number} />
//                                    <TextSmallYambiGray
//                                         text={user_data.account_privacy === '1' ? strings.private_account.toUpperCase() : strings.public_account.toUpperCase()} />

//                                    {/* <View>
//                                                   <TextNormalYambi text={user_data.status_information}styles={{marginVertical:25}} />
//                                                   <TextNormalYambi text={user_data.bio} styles={{marginBottom:0}} />
//                                              </View> */}
//                               </View>
//                          </View>

//                          {/* <Text>{user_data.user_profile}</Text> */}

//                          <View style={{ marginTop: 10 }}>
//                               <Pressable style={{ flexDirection: 'row', paddingTop: 0, alignItems: 'center', borderColor: theme.colors.border, borderWidth: 1, borderBottomWidth: 0, borderTopEndRadius: 15, borderTopStartRadius: 15 }} onPress={() => navigation.navigate("Languages" as never)}>
//                                    <IconApp styles={{ marginLeft: 20 }} name="language-outline" pack='IO' size={20} color={theme.colors.gray} />
//                                    <View style={{ flexDirection: 'row', alignItems: 'center', borderColor: theme.colors.border, borderBottomWidth: 0, flex: 1, paddingVertical: 15, marginLeft: 20 }}>
//                                         <View>
//                                              <TextNormalYambi text={strings.language_change} />
//                                              <TextSmallYambiGray text={strings.change_language_settings_text} />
//                                         </View>
//                                    </View>
//                               </Pressable>

//                               <Pressable style={{ flexDirection: 'row', alignItems: 'center', borderColor: theme.colors.border, borderWidth: 1, borderBottomWidth: 0 }} onPress={() => navigation.navigate('Themes' as never)}>
//                                    <IconApp pack='FI' name="sun" size={20} color={theme.colors.gray} styles={{ marginRight: 20, marginLeft: 20 }} />
//                                    <View style={{ flex: 1, paddingVertical: 15 }}>
//                                         <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginBottom: 5, marginRight: 20 }}>
//                                              <TextNormalYambi text={strings.themes} styles={{ flex: 1 }} />
//                                              <TextSmallYambi text={">> " + theme.name} />
//                                         </View>
//                                         <TextSmallYambiGray text={strings.themes_settings_text} styles={{ marginRight: 40 }} />
//                                    </View>
//                               </Pressable>

//                               <Pressable style={{ flexDirection: 'row', alignItems: 'center', borderColor: theme.colors.border, borderWidth: 1, borderBottomWidth: 0 }} onPress={() => navigation.navigate('CustomizeBusiness')}>
//                                    <IconApp pack='FI' name="edit" size={20} color={theme.colors.gray} styles={{ marginRight: 20, marginLeft: 20 }} />
//                                    <View style={{ paddingVertical: 15, paddingRight: 20 }}>
//                                         <View style={{ flexDirection: 'row', alignItems: 'center', borderColor: theme.colors.border, borderBottomWidth: 0, flex: 1, marginRight: 20 }}>
//                                              <TextNormalYambi text={strings.customize_business_actions} />
//                                         </View>
//                                         <TextSmallYambiGray text={strings.customize_business_settings_text} styles={{ marginRight: 40 }} />
//                                    </View>

//                                    {/* <Feather name="chevron-right" size={20} color={theme.colors.primary} /> */}
//                               </Pressable>

//                               {/* <View style={{ flexDirection: 'row', marginTop: 20, marginBottom: 20 }}>
//                                         <Text style={{ color: theme.colors.text, fontWeight: 'bold' }}>{strings.routes}</Text>
//                                    </View> */}

//                               {/* <Pressable style={{ flexDirection: 'row', alignItems: 'center', borderColor: theme.colors.border, borderWidth: 1, borderBottomWidth: 0, paddingHorizontal: 20 }} onPress={() => navigation.navigate("UserFollowers" as never)}>
//                                         <Feather name="user-plus" size={20} color={theme.colors.gray} style={{ marginRight: 20 }} />
//                                         <View style={{ flexDirection: 'row', alignItems: 'center', borderColor: theme.colors.border, borderBottomWidth: 0, flex: 1, paddingVertical: 15 }}>
//                                              <TextNormalYambi text={strings.your_followers} />
//                                         </View>
//                                    </Pressable> */}

//                               <Pressable style={{ flexDirection: 'row', alignItems: 'center', borderColor: theme.colors.border, borderWidth: 1, borderBottomWidth: 0 }} onPress={() => navigation.navigate("MessageUs")}>
//                                    <IconApp pack="FI" name="message-square" size={20} color={theme.colors.gray} styles={{ marginRight: 20, marginLeft: 20 }} />
//                                    {/* <Text style={{ flex: 1, color: theme.colors.text }}>{strings.message_us}</Text> */}
//                                    <View style={{ borderColor: theme.colors.border, borderBottomWidth: 0, flex: 1, paddingVertical: 15 }}>
//                                         <TextNormalYambi text={strings.message_us} />
//                                         <TextSmallYambiGray text={strings.message_us_settings_text} styles={{ marginRight: 40 }} />
//                                    </View>

//                                    {/* <Feather name="chevron-right" size={20} color={theme.colors.primary} /> */}
//                               </Pressable>

//                               <Pressable style={{ flexDirection: 'row', alignItems: 'center', borderColor: theme.colors.border, borderWidth: 1, borderBottomWidth: 0 }} onPress={() => navigation.navigate("MyAccount")}>
//                                    <IconApp pack="FI" name="user" size={20} color={theme.colors.gray} styles={{ marginRight: 20, marginLeft: 20 }} />
//                                    {/* <Text style={{ flex: 1, color: theme.colors.text }}>{strings.message_us}</Text> */}
//                                    <View style={{ borderColor: theme.colors.border, borderBottomWidth: 0, flex: 1, paddingVertical: 15 }}>
//                                         <TextNormalYambi text={strings.my_account} />
//                                         <TextSmallYambiGray text={strings.my_account_text} styles={{ marginRight: 40 }} />
//                                    </View>

//                                    {/* <Feather name="chevron-right" size={20} color={theme.colors.primary} /> */}
//                               </Pressable>

//                               <Pressable style={{ flexDirection: 'row', alignItems: 'center', borderColor: theme.colors.border, borderWidth: 1, borderBottomEndRadius: 15, borderBottomStartRadius: 15 }}
//                                    // onPress={() => Alert.alert("Information Yambi", "Yambi application" + "\n" + "Anaconda Alpha" + "\n" + "Version 2.0.5")}
//                                    onPress={() => navigation.navigate("AboutYambi")}>
//                                    <IconApp pack='FI' name="archive" size={18} color={theme.colors.gray} styles={{ marginRight: 20, marginLeft: 20 }} />
//                                    <View style={{ borderColor: theme.colors.border, borderBottomWidth: 0, flex: 1, paddingVertical: 15 }}>
//                                         <TextNormalYambi text={strings.about_yambi} />
//                                         <TextSmallYambiGray text={strings.version + " " + packagee.version} />
//                                    </View>
//                               </Pressable>
//                          </View>
//                     </View>

//                     {/* <Text style={{ textAlign: 'center', color: 'gray', marginVertical: 30, fontSize: 13, paddingBottom: 20 }}>{strings.footer}</Text> */}
//                     {/* <View style={{height: 20}}></View> */}
//                     {/* </Animated.ScrollView> */}
//                     {/* </View> */}

//                     <View style={{ height: 30 }} />
//                     {/* <Image
//                          source={{ uri: 'https://placekitten.com/600/300' }}
//                          style={styles.image}
//                          resizeMode="cover"
//                     /> */}
//                     {Array.from({ length: 30 }).map((_, i) => (
//                          <Pressable key={i} style={styles.item}>
//                               <Text>Item {i + 1}</Text>
//                          </Pressable>
//                     ))}
//                </Animated.ScrollView>

//                {/* Header avec animation d'entrée/sortie */}
//                {showHeader && (
//                     <Animated.View
//                          entering={FadeIn.duration(300)}
//                          exiting={FadeOut.duration(300)}
//                          style={[styles.header, {backgroundColor: theme.colors.design_tip2}]}
//                     >
//                          <IconApp pack='FI' name={Platform.OS === 'android' ? "arrow-left" : "chevron-left"} size={18} color={theme.colors.text_design2} styles={{ marginRight: 20, marginLeft: 20 }} />
//                          <Text style={styles.headerText}>{user_data.user_names}</Text>
//                     </Animated.View>
//                )}
//           </SafeAreaView>
//      );
// }

// const styles = StyleSheet.create({
//      header: {
//           position: 'absolute',
//           top: 0,
//           left: 0,
//           right: 0,
//           height: HEADER_HEIGHT,
//           flexDirection: 'row',
//           // justifyContent: 'space-between',
//           alignItems: 'center',
//           zIndex: 100,
//           paddingTop: Platform.OS==='ios'?StatusBar.currentHeight || 20:0,
//      },
//      headerText: {
//           color: '#fff',
//           fontSize: 18,
//           fontWeight: 'bold',
//      },
//      image: {
//           width: '100%',
//           height: 150,
//           marginBottom: 20,
//      },
//      item: {
//           height: 80,
//           justifyContent: 'center',
//           alignItems: 'center',
//           borderBottomColor: '#ccc',
//           borderBottomWidth: 1,
//      },
// });

// export default UserProfileInfo;
