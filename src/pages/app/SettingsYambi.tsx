import { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet, Pressable, RefreshControl } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { strings } from '../../lang/lang';
import { useAppDispatch, useAppSelector } from '../../store/app/hooks';
import StatusBarYambi from '../../components/app/StatusBar';
import ImagePicker from 'react-native-image-crop-picker';
import { updateUserProfile, updateUser } from '../../store/reducers/userSlice';
import axios from 'axios';
import { YambiText } from '../../components/app/Text';
import { formatPhoneInternational, remote_host, remote_host_server, media_url } from '../../../GlobalVariables';
import { IconApp } from '../../components/app/IconApp';
import { NavProps } from '../../types/types';
import packagee from "./../../../package.json";
import { useRealm } from '@realm/react';
import { setShowModalApp } from '../../store/reducers/appSlice';
import ModalApp from '../../components/app/ModalApp';
import { SafeAreaView } from 'react-native-safe-area-context';
import HeaderSettings from '../../components/headers/HeaderSettings';

const SettingsYambi = ({ navigation, route }: NavProps) => {

     const theme = useAppSelector(state => state.app_theme);
     const dispatch = useAppDispatch();
     const user_data = useAppSelector(state => state.user_data);
     const app_description = useAppSelector(state => state.persisted_app.app_description);
     const raw_contacts = useAppSelector(state => state.persisted_app.raw_contacts);
     const [profile, setProfile] = useState<string>("");
     const [loading_profile, setLoading_profile] = useState<boolean>(false);
     const [showInternetError, setShowInternetError] = useState<boolean>(false);
     const [refreshing, setRefreshing] = useState<boolean>(false);
     const [showAdditionalInfo, setShowAdditionalInfo] = useState<boolean>(false);
     const realm = useRealm();

     // Animation values for additional info section
     const additionalInfoHeight = useSharedValue(0);
     const additionalInfoOpacity = useSharedValue(0);
     const chevronRotation = useSharedValue(0);

     // console.log(media_url + "/profile_pictures/" + user_data.user_profile);

     const upload_profile_picture = () => {

          setLoading_profile(true);

          const filename = Date.now() + '-' + Math.round(Math.random() * 1E9);

          let base_url = remote_host + "/yambi/API/upload_profile_picture";
          let formData = new FormData();
          formData.append('assemble', user_data.phone_number);
          formData.append('user_profile', user_data.user_profile);
          formData.append('image', { type: 'image/jpg', uri: profile, name: filename + 'profile.jpg' } as any);

          axios.post(base_url, formData, {
               headers: {
                    Accept: 'application/json',
                    'Content-Type': 'multipart/form-data'
               }
          })
               .then(response => {
                    setLoading_profile(false);

                    if (response.data.message === "1" && response.data.assemble === user_data.phone_number) {
                         dispatch(updateUserProfile(response.data.user_profile));

                         const user_assemble_data = {
                              user_id: user_data.user_id,
                              user_names: user_data.user_names,
                              phone_number: user_data.phone_number,
                              gender: typeof user_data.gender === 'string' ? parseInt(user_data.gender) : user_data.gender,
                              birth_date: user_data.birth_date,
                              country: user_data.country,
                              user_profile: response.data.user_profile,
                              profession: user_data.profession,
                              bio: user_data.bio,
                              user_email: user_data.user_email,
                              user_address: user_data.user_address,
                              status_information: user_data.status_information,
                              user_password: user_data.user_password,
                              account_privacy: typeof user_data.account_privacy === 'string' ? parseInt(user_data.account_privacy) : user_data.account_privacy,
                              user_level: user_data.user_level || 0,
                              user_active: user_data.user_active || 1,
                              user_verified: user_data.user_verified || 0,
                              user_verified_at: user_data.user_verified_at || "",
                              notification_token: user_data.notification_token,
                              createdAt: user_data.createdAt,
                              updatedAt: user_data.updatedAt,
                         }

                         realm.write(() => {
                              try {
                                   realm.create('UserData', user_assemble_data, true);
                              } catch (error) { }
                         });
                    }

                    setProfile("");

                    // console.log(response.data)

               })
               .catch((error) => {
                    // Alert.alert(strings.error, strings.connection_failed);
                    // console.log(error)
                    setShowInternetError(true);
                    dispatch(setShowModalApp(true));
                    setLoading_profile(false);

               });
     };

     const pick_profile = () => {

          if (profile === "") {
               ImagePicker.openPicker({
                    width: 500,
                    height: 500,
                    cropping: true,
                    quality: 0.5,
                    noData: true,
                    mediaType: "photo",
               }).then(image => {

                    setProfile(image.path);
               })
                    .catch((e) => { });
          } else {
               upload_profile_picture();
          }
     }

     const ViewPhoto = () => {
          if (user_data.user_profile !== "") {
               navigation.navigate("ViewPhoto", { source: media_url + "/profile_pictures/" + user_data.user_profile })
          } else {
               navigation.navigate("ViewPhoto", { source: "" })
          }
     }

     const fetchUserData = useCallback(async () => {
          setRefreshing(true);
          try {
               const response = await axios.post(remote_host + '/yambi/API/fetch_user_data', {
                    user: user_data.phone_number
               });

               if (response.data.success === "1") {
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

                    // Update Redux state
                    dispatch(updateUser(user_assemble_data));

                    // Update Realm database
                    realm.write(() => {
                         try {
                              realm.create('UserData', user_assemble_data, true);
                         } catch (error) { }
                    });
               }
          } catch (error) {
               // Silent fail - don't show error on pull to refresh
          } finally {
               setRefreshing(false);
          }
     }, [user_data.phone_number, raw_contacts, dispatch, realm]);

     const onRefresh = useCallback(() => {
          fetchUserData();
     }, [fetchUserData]);

     // Check if there's additional information to show
     const hasAdditionalInfo = (user_data.bio && user_data.bio !== "") ||
          (user_data.profession && user_data.profession !== "") ||
          (user_data.user_address && user_data.user_address !== "") ||
          (user_data.status_information && user_data.status_information !== "");

     // Animate additional info section
     useEffect(() => {
          if (showAdditionalInfo) {
               additionalInfoHeight.value = withTiming(1, { duration: 300 });
               additionalInfoOpacity.value = withTiming(1, { duration: 300 });
               chevronRotation.value = withTiming(180, { duration: 300 });
          } else {
               additionalInfoHeight.value = withTiming(0, { duration: 300 });
               additionalInfoOpacity.value = withTiming(0, { duration: 300 });
               chevronRotation.value = withTiming(0, { duration: 300 });
          }
     }, [showAdditionalInfo]);

     // Animated styles
     const additionalInfoAnimatedStyle = useAnimatedStyle(() => {
          return {
               maxHeight: additionalInfoHeight.value === 1 ? 500 : 0,
               opacity: additionalInfoOpacity.value,
               overflow: 'hidden',
          };
     });

     const chevronAnimatedStyle = useAnimatedStyle(() => {
          return {
               transform: [{ rotate: `${chevronRotation.value}deg` }],
          };
     });

     return (
          <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
               {/* <SafeAreaView style={[{  }, StyleSheet.absoluteFill]}> */}
               <HeaderSettings navigation={navigation} />

               {showInternetError ?
                    <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowInternetError(false) }} singleButton title={strings.error}>
                         <YambiText text={strings.connection_failed} size="normal" color="gray" />
                    </ModalApp> : null}

               <View style={{ flex: 1, borderColor: theme.colors.border, borderTopWidth: 1 }}>



                    <StatusBarYambi />

                    <ScrollView
                         style={{ flex: 1, backgroundColor: 'transparent' }}
                         refreshControl={
                              <RefreshControl
                                   refreshing={refreshing}
                                   onRefresh={onRefresh}
                                   tintColor={theme.colors.high_color}
                                   colors={[theme.colors.high_color]}
                              />
                         }
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
                                   paddingBottom: 0,
                              }}>
                                   {/* Main Profile Info - Image alongside details */}
                                   <View style={{
                                        flexDirection: 'row',
                                        alignItems: 'flex-start',
                                   }}>
                                        {/* Profile Image with Upload Button */}
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
                                                            // borderWidth: 2,
                                                            // borderColor: theme.colors.high_color,
                                                            borderRadius: 40,
                                                            overflow: 'hidden',
                                                       }}>
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

                                             <Pressable onPress={pick_profile} style={{
                                                  position: 'absolute',
                                                  bottom: -4,
                                                  right: -4,
                                                  height: 32,
                                                  width: 32,
                                                  borderRadius: 16,
                                                  backgroundColor: theme.colors.high_color,
                                                  borderWidth: 2,
                                                  borderColor: theme.colors.border,
                                                  alignItems: 'center',
                                                  justifyContent: 'center',
                                             }}>
                                                  {loading_profile ?
                                                       <ActivityIndicator color={theme.colors.background} size={14} /> :
                                                       profile === "" ?
                                                            <IconApp pack='FI' name="camera" size={14} color={theme.colors.background} />
                                                            :
                                                            <IconApp pack='FI' name="check" size={14} color={theme.colors.background} />
                                                  }
                                             </Pressable>
                                        </View>

                                        {/* User Basic Info */}
                                        <View style={{ flex: 1, justifyContent: 'flex-start' }}>
                                             <View style={{
                                                  flexDirection: 'row',
                                                  alignItems: 'center',
                                                  marginBottom: 6,
                                                  flexWrap: 'wrap'
                                             }}>
                                                  <IconApp pack='FI' name="user" size={14} color={theme.colors.gray} styles={{ marginRight: 6 }} />
                                                  <Text style={{
                                                       color: theme.colors.text,
                                                       fontSize: 18,
                                                       fontWeight: 'bold',
                                                       // flex: 1,
                                                  }} numberOfLines={2}>{user_data.user_names}</Text>

                                                  {user_data.user_verified === 1 && (
                                                       <IconApp pack='MT' name="verified" size={16} color={theme.colors.high_color} styles={{ marginLeft: 6 }} />
                                                  )}
                                             </View>

                                             {/* Email if available */}
                                             {user_data.user_email && user_data.user_email !== "" && (
                                                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                                       <IconApp pack='FI' name="mail" size={12} color={theme.colors.gray} />
                                                       <YambiText text={user_data.user_email} size="small" color="default" numberLines={1} style={{ marginLeft: 5, fontSize: 12 }} />
                                                  </View>
                                             )}

                                             {/* Phone Number */}
                                             <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                                  <IconApp pack='FI' name="phone" size={12} color={theme.colors.gray} />
                                                  <YambiText text={formatPhoneInternational(user_data)} size="small" color="default" style={{ marginLeft: 5, fontSize: 12 }} />
                                             </View>

                                             {/* Account Privacy Badge with Chevron */}
                                             <View style={{
                                                  flexDirection: 'row',
                                                  alignItems: 'center',
                                                  alignSelf: 'flex-start',
                                             }}>
                                                  <View style={{
                                                       backgroundColor: user_data.account_privacy === 1 ? theme.colors.error + '20' : theme.colors.success + '20',
                                                       paddingHorizontal: 10,
                                                       paddingVertical: 3,
                                                       borderRadius: 10,
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
                                                  {hasAdditionalInfo && (
                                                       <Pressable
                                                            onPress={() => setShowAdditionalInfo(!showAdditionalInfo)}
                                                            style={{
                                                                 marginLeft: 8,
                                                                 padding: 4,
                                                            }}
                                                       >
                                                            <Animated.View style={chevronAnimatedStyle}>
                                                                 <IconApp pack='FI' name="chevron-down" size={16} color={theme.colors.gray} />
                                                            </Animated.View>
                                                       </Pressable>
                                                  )}
                                             </View>
                                        </View>
                                   </View>

                                   {/* Additional Information Section */}
                                   {hasAdditionalInfo && (
                                        <Animated.View style={[{
                                             marginTop: 15,
                                             paddingTop: 15,
                                             borderTopWidth: 1,
                                             borderColor: theme.colors.background,
                                        }, additionalInfoAnimatedStyle]}>
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

                                             {/* Status/Bio */}
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
                                                  <View style={{ marginBottom: 20 }}>
                                                       <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
                                                            <IconApp pack='FI' name="edit-3" size={12} color={theme.colors.high_color} />
                                                            <YambiText text={strings.bio || "Bio"} size="small" color="gray" style={{ marginLeft: 5, fontSize: 11 }} />
                                                       </View>
                                                       <YambiText text={user_data.bio} size="small" color="default" style={{ marginLeft: 17, fontSize: 13 }} />
                                                  </View>
                                             )}
                                        </Animated.View>
                                   )}
                              </View>

                              {/* Settings Cards */}
                              <View style={{ paddingHorizontal: 20 }}>
                                   {/* <TextNormalYambi text={strings.settings} bold styles={{ marginBottom: 15, fontSize: 18 }} /> */}

                                   {/* Languages Card */}
                                   <Pressable
                                        style={{
                                             backgroundColor: theme.colors.background,
                                             borderRadius: 12,
                                             borderWidth: 1,
                                             borderColor: theme.colors.border,
                                             marginBottom: 12,
                                        }}
                                        onPress={() => navigation.navigate("Languages" as never)}
                                   >
                                        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
                                             <View style={{
                                                  width: 40,
                                                  height: 40,
                                                  borderRadius: 20,
                                                  backgroundColor: theme.colors.border,
                                                  justifyContent: 'center',
                                                  alignItems: 'center',
                                                  marginRight: 15,
                                             }}>
                                                  <IconApp name="language-outline" pack='IO' size={20} color={theme.colors.high_color} />
                                             </View>
                                             <View style={{ flex: 1 }}>
                                                  <YambiText text={strings.language_change} size="normal" color="default" style={{ marginBottom: 2 }} />
                                                  <YambiText text={strings.change_language_settings_text} size="small" color="gray" />
                                             </View>
                                             <IconApp pack='FI' name="chevron-right" size={20} color={theme.colors.gray} />
                                        </View>
                                   </Pressable>

                                   {/* Themes Card */}
                                   <Pressable
                                        style={{
                                             backgroundColor: theme.colors.background,
                                             borderRadius: 12,
                                             borderWidth: 1,
                                             borderColor: theme.colors.border,
                                             marginBottom: 12,
                                        }}
                                        onPress={() => navigation.navigate('Themes' as never)}
                                   >
                                        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
                                             <View style={{
                                                  width: 40,
                                                  height: 40,
                                                  borderRadius: 20,
                                                  backgroundColor: theme.colors.border,
                                                  justifyContent: 'center',
                                                  alignItems: 'center',
                                                  marginRight: 15,
                                             }}>
                                                  <IconApp pack='FI' name="sun" size={20} color={theme.colors.high_color} />
                                             </View>
                                             <View style={{ flex: 1 }}>
                                                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                                                       <YambiText text={strings.themes} size="normal" color="default" style={{ flex: 1 }} />
                                                       <View style={{
                                                            backgroundColor: theme.colors.high_color + '20',
                                                            paddingHorizontal: 8,
                                                            paddingVertical: 2,
                                                            borderRadius: 8,
                                                       }}>
                                                            <YambiText text={theme.name} size="small" color="high" style={{ fontSize: 11 }} />
                                                       </View>
                                                  </View>
                                                  <YambiText text={strings.themes_settings_text} size="small" color="gray" />
                                             </View>
                                             <IconApp pack='FI' name="chevron-right" size={20} color={theme.colors.gray} styles={{ marginLeft: 10 }} />
                                        </View>
                                   </Pressable>

                                   {/* Customize Card */}
                                   <Pressable
                                        style={{
                                             backgroundColor: theme.colors.background,
                                             borderRadius: 12,
                                             borderWidth: 1,
                                             borderColor: theme.colors.border,
                                             marginBottom: 12,
                                        }}
                                        onPress={() => navigation.navigate('Customize')}
                                   >
                                        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
                                             <View style={{
                                                  width: 40,
                                                  height: 40,
                                                  borderRadius: 20,
                                                  backgroundColor: theme.colors.border,
                                                  justifyContent: 'center',
                                                  alignItems: 'center',
                                                  marginRight: 15,
                                             }}>
                                                  <IconApp pack='FI' name="edit" size={20} color={theme.colors.high_color} />
                                             </View>
                                             <View style={{ flex: 1 }}>
                                                  <YambiText text={strings.customize || "Customize"} size="normal" color="default" style={{ marginBottom: 2 }} />
                                                  <YambiText text={strings.customize_settings_text} size="small" color="gray" />
                                             </View>
                                             <IconApp pack='FI' name="chevron-right" size={20} color={theme.colors.gray} />
                                        </View>
                                   </Pressable>

                                   {/* Message Us Card */}
                                   <Pressable
                                        style={{
                                             backgroundColor: theme.colors.background,
                                             borderRadius: 12,
                                             borderWidth: 1,
                                             borderColor: theme.colors.border,
                                             marginBottom: 12,
                                        }}
                                        onPress={() => navigation.navigate("MessageUs")}
                                   >
                                        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
                                             <View style={{
                                                  width: 40,
                                                  height: 40,
                                                  borderRadius: 20,
                                                  backgroundColor: theme.colors.border,
                                                  justifyContent: 'center',
                                                  alignItems: 'center',
                                                  marginRight: 15,
                                             }}>
                                                  <IconApp pack="FI" name="message-square" size={20} color={theme.colors.high_color} />
                                             </View>
                                             <View style={{ flex: 1 }}>
                                                  <YambiText text={strings.message_us} size="normal" color="default" style={{ marginBottom: 2 }} />
                                                  <YambiText text={strings.message_us_settings_text} size="small" color="gray" />
                                             </View>
                                             <IconApp pack='FI' name="chevron-right" size={20} color={theme.colors.gray} />
                                        </View>
                                   </Pressable>

                                   {/* My Account Card */}
                                   <Pressable
                                        style={{
                                             backgroundColor: theme.colors.background,
                                             borderRadius: 12,
                                             borderWidth: 1,
                                             borderColor: theme.colors.border,
                                             marginBottom: 12,
                                        }}
                                        onPress={() => navigation.navigate("MyAccount")}
                                   >
                                        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
                                             <View style={{
                                                  width: 40,
                                                  height: 40,
                                                  borderRadius: 20,
                                                  backgroundColor: theme.colors.border,
                                                  justifyContent: 'center',
                                                  alignItems: 'center',
                                                  marginRight: 15,
                                             }}>
                                                  <IconApp pack="FI" name="user" size={20} color={theme.colors.high_color} />
                                             </View>
                                             <View style={{ flex: 1 }}>
                                                  <YambiText text={strings.my_account} size="normal" color="default" style={{ marginBottom: 2 }} />
                                                  <YambiText text={strings.my_account_text} size="small" color="gray" />
                                             </View>
                                             <IconApp pack='FI' name="chevron-right" size={20} color={theme.colors.gray} />
                                        </View>
                                   </Pressable>

                                   {/* Support the Project Card */}
                                   {/* <Pressable
                         style={{
                              backgroundColor: theme.colors.background,
                              borderRadius: 12,
                              borderWidth: 1,
                              borderColor: theme.colors.border,
                              marginBottom: 12,
                         }}
                         onPress={() => navigation.navigate("MakeDonation")}
                    >
                         <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
                              <View style={{
                                   width: 40,
                                   height: 40,
                                   borderRadius: 20,
                                   backgroundColor: theme.colors.border,
                                   justifyContent: 'center',
                                   alignItems: 'center',
                                   marginRight: 15,
                              }}>
                                   <IconApp pack='FI' name="heart" size={20} color={theme.colors.high_color} />
                              </View>
                              <View style={{ flex: 1 }}>
                                   <YambiText text={strings.support_the_project || strings.make_donation} size="normal" color="default" style={{ marginBottom: 2 }} />
                                   <YambiText text={strings.support_project_settings_text || strings.make_donation_subtext} size="small" color="gray" />
                              </View>
                              <IconApp pack='FI' name="chevron-right" size={20} color={theme.colors.gray} />
                         </View>
                    </Pressable> */}

                                   {/* About Card */}
                                   <Pressable
                                        style={{
                                             backgroundColor: theme.colors.background,
                                             borderRadius: 12,
                                             borderWidth: 1,
                                             borderColor: theme.colors.border,
                                             marginBottom: 20,
                                        }}
                                        onPress={() => navigation.navigate("AboutYambi")}
                                   >
                                        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
                                             <View style={{
                                                  width: 40,
                                                  height: 40,
                                                  borderRadius: 20,
                                                  backgroundColor: theme.colors.border,
                                                  justifyContent: 'center',
                                                  alignItems: 'center',
                                                  marginRight: 15,
                                             }}>
                                                  <IconApp pack='FI' name="info" size={20} color={theme.colors.high_color} />
                                             </View>
                                             <View style={{ flex: 1 }}>
                                                  <YambiText text={strings.about_yambi} size="normal" color="default" style={{ marginBottom: 2 }} />
                                                  <YambiText text={strings.version + " " + packagee.version} size="small" color="gray" />
                                             </View>
                                             <IconApp pack='FI' name="chevron-right" size={20} color={theme.colors.gray} />
                                        </View>
                                   </Pressable>
                              </View>
                         </View>

                         <View style={{
                              alignItems: 'center',
                              paddingVertical: 30,
                              paddingHorizontal: 20,
                              marginBottom: 30
                         }}>
                              <YambiText
                                   text={strings.footer}
                                   size="small"
                                   color="gray"
                                   style={{
                                        textAlign: 'center',
                                        fontSize: 12,
                                   }}
                              />
                         </View>
                    </ScrollView>
               </View>
               {/* </SafeAreaView> */}
          </View>
     )
}
// }

export default SettingsYambi;

