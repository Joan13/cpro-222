import { useEffect, useState } from 'react';
import { View, ScrollView, TextInput, Pressable } from 'react-native';
import { strings } from '../../lang/lang';
import { useAppDispatch, useAppSelector } from '../../store/app/hooks';
import StatusBarYambi from '../../components/app/StatusBar';
import ButtonNormal from '../../components/app/ButtonNormal';
import axios from 'axios';
import { setLoadingButton } from '../../store/reducers/appSlice';
import { YambiText } from '../../components/app/Text';
import { remote_host } from '../../../GlobalVariables';
import { useRealm } from '@realm/react';
import { NavProps } from '../../types/types';
import { updateUser } from '../../store/reducers/userSlice';
import { IconApp } from '../../components/app/IconApp';

const EditProfile = ({ route }: NavProps) => {

     const theme = useAppSelector(state => state.app_theme);
     const dispatch = useAppDispatch();
     const user_data = useAppSelector(state => state.user_data);
     const [name, setName] = useState<string>("");
     const [status_information, setStatus_information] = useState<string>("");
     const [bio, setBio] = useState<string>("");
     const [account_privacy, setAccount_privacy] = useState<number>(0);
     const [user_level, setUser_level] = useState<number>(1);
     const [user_verified, setUser_verified] = useState<number>(0);
     const [user_verified_at, setUser_verified_at] = useState<string>("");
     const realm = useRealm();

     const { user } = route.params;

     const UpdateData = () => {

          dispatch(setLoadingButton(true));

          let base_url = remote_host + "/yambi/API/update_profile";

          axios.post(base_url, {
               name: name.trim(),
               uuser: user,
               status_information: status_information,
               bio: bio.trim(),
               user_level: user_level,
               account_privacy: account_privacy,
               user_verified: user_verified,
               user_verified_at: user_verified_at
          })
               .then(response => {
                    if (response.data.message === "1") {

                         const assemble = response.data.assemble;

                         const user_assemble_data = {
                              user_id: assemble._id,
                              user_names: assemble.user_names,
                              phone_number: assemble.phone_number,
                              gender: assemble.gender || 0,
                              birth_date: assemble.birth_date,
                              country: assemble.country,
                              user_profile: assemble.user_profile,
                              profession: assemble.profession,
                              bio: assemble.bio,
                              user_email: assemble.user_email,
                              user_address: assemble.user_address,
                              status_information: assemble.status_information,
                              user_password: assemble.user_password,
                              account_privacy: assemble.account_privacy || 0,
                              user_level: assemble.user_level || 0,
                              user_active: assemble.user_active || 1,
                              user_verified: assemble.user_verified || 0,
                              user_verified_at: assemble.user_verified_at || "",
                              notification_token: assemble.notification_token,
                              createdAt: assemble.createdAt,
                              updatedAt: assemble.updatedAt,
                         }

                         if (response.data.assemble.phone_number === user_data.phone_number) {
                              realm.write(() => {
                                   try {
                                        realm.create('UserData', user_assemble_data, true);
                                   } catch (error) { }
                              });

                              dispatch(updateUser(user_assemble_data));
                         } else {
                              realm.write(() => {
                                   try {
                                        realm.create('YambiUsers', user_assemble_data, true);
                                   } catch (error) { }
                              });
                         }
                    }

                    dispatch(setLoadingButton(false));

               })
               .catch(() => {
                    dispatch(setLoadingButton(false));
               });
     };

     useEffect(() => {
          setName(user.user_names);
          setStatus_information(user.status_information);
          setUser_level(user.user_level || 0);
          setAccount_privacy(user.account_privacy || 0);
          setUser_verified(user.user_verified || 0);
          setUser_verified_at(user.user_verified_at || "");
          setBio(user.bio);
     }, []);

     return (
          <View style={{ backgroundColor: theme.colors.background, flex: 1, borderColor: theme.colors.border, borderTopWidth: 1 }}>

               <StatusBarYambi />

               <ScrollView 
                    keyboardShouldPersistTaps='handled' 
                    style={{ flex: 1, backgroundColor: 'transparent' }}
                    contentContainerStyle={{ paddingHorizontal: 15, paddingTop: 15, paddingBottom: 20 }}
               >
                    {/* Name Input Card */}
                    <View style={{
                         backgroundColor: theme.colors.border,
                         borderRadius: 16,
                         padding: 15,
                         marginBottom: 15
                    }}>
                         <View style={{
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: 12
                         }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                   <IconApp pack='FI' name="user" size={16} color={theme.colors.gray} styles={{ marginRight: 8 }} />
                                   <YambiText text={strings.name} size="normal" color="gray" style={{ marginLeft: 0 }} />
                              </View>
                              {name.length > 0 && (
                                   <YambiText 
                                        text={(50 - name.length).toString()} 
                                        size="normal"
                                        color="high"
                                        style={{ marginRight: 0 }} 
                                   />
                              )}
                         </View>
                         <TextInput
                              placeholderTextColor={theme.colors.gray}
                              maxLength={50}
                              style={{ 
                                   color: theme.colors.text, 
                                   backgroundColor: theme.colors.background, 
                                   paddingHorizontal: 15, 
                                   paddingVertical: 12,
                                   borderRadius: 12,
                                   fontSize: 16,
                                   borderWidth: 1,
                                   borderColor: theme.colors.border
                              }}
                              value={name}
                              onChangeText={text => setName(text)}
                         />
                    </View>

                    {/* Status Input Card */}
                    <View style={{
                         backgroundColor: theme.colors.border,
                         borderRadius: 16,
                         padding: 15,
                         marginBottom: 15
                    }}>
                         <View style={{
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: 12
                         }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                   <IconApp pack='FI' name="edit-3" size={16} color={theme.colors.gray} styles={{ marginRight: 8 }} />
                                   <YambiText text={strings.status} size="normal" color="gray" style={{ marginLeft: 0 }} />
                              </View>
                              {status_information.length > 0 && (
                                   <YambiText 
                                        text={(150 - status_information.length).toString()} 
                                        size="normal"
                                        color="high"
                                        style={{ marginRight: 0 }} 
                                   />
                              )}
                         </View>
                         <TextInput
                              placeholderTextColor={theme.colors.gray}
                              maxLength={150}
                              style={{ 
                                   color: theme.colors.text, 
                                   backgroundColor: theme.colors.background, 
                                   paddingHorizontal: 15, 
                                   paddingVertical: 12,
                                   borderRadius: 12,
                                   fontSize: 16,
                                   minHeight: 60,
                                   borderWidth: 1,
                                   borderColor: theme.colors.border
                              }}
                              value={status_information}
                              multiline
                              onChangeText={text => setStatus_information(text)}
                         />
                    </View>

                    {/* Bio Input Card */}
                    <View style={{
                         backgroundColor: theme.colors.border,
                         borderRadius: 16,
                         padding: 15,
                         marginBottom: 15
                    }}>
                         <View style={{
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: 12
                         }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                   <IconApp pack='FI' name="file-text" size={16} color={theme.colors.gray} styles={{ marginRight: 8 }} />
                                   <YambiText text={strings.bio} size="normal" color="gray" style={{ marginLeft: 0 }} />
                              </View>
                              {bio.length > 0 && (
                                   <YambiText 
                                        text={(800 - bio.length).toString()} 
                                        size="normal"
                                        color="high"
                                        style={{ marginRight: 0 }} 
                                   />
                              )}
                         </View>
                         <TextInput
                              placeholderTextColor={theme.colors.gray}
                              maxLength={800}
                              style={{ 
                                   color: theme.colors.text, 
                                   backgroundColor: theme.colors.background, 
                                   paddingHorizontal: 15, 
                                   paddingVertical: 12,
                                   borderRadius: 12,
                                   fontSize: 16,
                                   minHeight: 100,
                                   borderWidth: 1,
                                   borderColor: theme.colors.border
                              }}
                              value={bio}
                              multiline
                              onChangeText={text => setBio(text)}
                         />
                    </View>

                    {/* Admin Controls Card */}
                    {user_data.user_level === 1 && (
                         <View style={{
                              backgroundColor: theme.colors.border,
                              borderRadius: 16,
                              padding: 15,
                              marginBottom: 20
                         }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                                   <IconApp pack='FI' name="settings" size={18} color={theme.colors.high_color} styles={{ marginRight: 10 }} />
                                   <YambiText text={strings.Mark_as} size="normal" color="high" style={{ fontSize: 18 }} />
                              </View>

                              {/* User Level Options */}
                              <View style={{ marginBottom: 20 }}>
                                   <Pressable
                                        onPress={() => setUser_level(0)}
                                        style={{
                                             flexDirection: 'row',
                                             alignItems: 'center',
                                             paddingVertical: 12,
                                             paddingHorizontal: 15,
                                             borderRadius: 12,
                                             backgroundColor: user_level === 0 ? theme.colors.high_color + '20' : 'transparent',
                                             marginBottom: 8
                                        }}>
                                        <IconApp 
                                             pack='FA' 
                                             name={user_level === 0 ? "check-circle" : "circle"} 
                                             color={user_level === 0 ? theme.colors.high_color : theme.colors.gray} 
                                             size={18} 
                                        />
                                        <YambiText 
                                             text={strings.normal_account} 
                                             size="normal"
                                             color={user_level === 0 ? "high" : "default"}
                                             bold={user_level === 0}
                                             style={{ marginLeft: 12 }} 
                                        />
                                   </Pressable>

                                   <Pressable
                                        onPress={() => setUser_level(1)}
                                        style={{
                                             flexDirection: 'row',
                                             alignItems: 'center',
                                             paddingVertical: 12,
                                             paddingHorizontal: 15,
                                             borderRadius: 12,
                                             backgroundColor: user_level === 1 ? theme.colors.high_color + '20' : 'transparent',
                                             marginBottom: 8
                                        }}>
                                        <IconApp 
                                             pack='FA' 
                                             name={user_level === 1 ? "check-circle" : "circle"} 
                                             color={user_level === 1 ? theme.colors.high_color : theme.colors.gray} 
                                             size={18} 
                                        />
                                        <YambiText 
                                             text={strings.super_admin} 
                                             size="normal"
                                             color={user_level === 1 ? "high" : "default"}
                                             bold={user_level === 1}
                                             style={{ marginLeft: 12 }} 
                                        />
                                   </Pressable>

                                   <Pressable
                                        onPress={() => setUser_level(6)}
                                        style={{
                                             flexDirection: 'row',
                                             alignItems: 'center',
                                             paddingVertical: 12,
                                             paddingHorizontal: 15,
                                             borderRadius: 12,
                                             backgroundColor: user_level === 6 ? theme.colors.high_color + '20' : 'transparent',
                                             marginBottom: 8
                                        }}>
                                        <IconApp 
                                             pack='FA' 
                                             name={user_level === 6 ? "check-circle" : "circle"} 
                                             color={user_level === 6 ? theme.colors.high_color : theme.colors.gray} 
                                             size={18} 
                                        />
                                        <YambiText 
                                             text={strings.user_admin} 
                                             size="normal"
                                             color={user_level === 6 ? "high" : "default"}
                                             bold={user_level === 6}
                                             style={{ marginLeft: 12 }} 
                                        />
                                   </Pressable>

                                   <Pressable
                                        onPress={() => setUser_level(7)}
                                        style={{
                                             flexDirection: 'row',
                                             alignItems: 'center',
                                             paddingVertical: 12,
                                             paddingHorizontal: 15,
                                             borderRadius: 12,
                                             backgroundColor: user_level === 7 ? theme.colors.high_color + '20' : 'transparent',
                                             marginBottom: 8
                                        }}>
                                        <IconApp 
                                             pack='FA' 
                                             name={user_level === 7 ? "check-circle" : "circle"} 
                                             color={user_level === 7 ? theme.colors.high_color : theme.colors.gray} 
                                             size={18} 
                                        />
                                        <YambiText 
                                             text={strings.user_admin + " (" + strings.edit_information.toLowerCase() + ")"} 
                                             size="normal"
                                             color={user_level === 7 ? "high" : "default"}
                                             bold={user_level === 7}
                                             style={{ marginLeft: 12 }} 
                                        />
                                   </Pressable>

                                   <Pressable
                                        onPress={() => setUser_level(3)}
                                        style={{
                                             flexDirection: 'row',
                                             alignItems: 'center',
                                             paddingVertical: 12,
                                             paddingHorizontal: 15,
                                             borderRadius: 12,
                                             backgroundColor: user_level === 3 ? theme.colors.high_color + '20' : 'transparent',
                                             marginBottom: 8
                                        }}>
                                        <IconApp 
                                             pack='FA' 
                                             name={user_level === 3 ? "check-circle" : "circle"} 
                                             color={user_level === 3 ? theme.colors.high_color : theme.colors.gray} 
                                             size={18} 
                                        />
                                        <YambiText 
                                             text={strings.business_admin} 
                                             size="normal"
                                             color={user_level === 3 ? "high" : "default"}
                                             bold={user_level === 3}
                                             style={{ marginLeft: 12 }} 
                                        />
                                   </Pressable>

                                   <Pressable
                                        onPress={() => setUser_level(4)}
                                        style={{
                                             flexDirection: 'row',
                                             alignItems: 'center',
                                             paddingVertical: 12,
                                             paddingHorizontal: 15,
                                             borderRadius: 12,
                                             backgroundColor: user_level === 4 ? theme.colors.high_color + '20' : 'transparent',
                                             marginBottom: 8
                                        }}>
                                        <IconApp 
                                             pack='FA' 
                                             name={user_level === 4 ? "check-circle" : "circle"} 
                                             color={user_level === 4 ? theme.colors.high_color : theme.colors.gray} 
                                             size={18} 
                                        />
                                        <YambiText 
                                             text={strings.business_admin + " (" + strings.account_activation.toLowerCase() + ")"} 
                                             size="normal"
                                             color={user_level === 4 ? "high" : "default"}
                                             bold={user_level === 4}
                                             style={{ marginLeft: 12 }} 
                                        />
                                   </Pressable>

                                   <Pressable
                                        onPress={() => setUser_level(5)}
                                        style={{
                                             flexDirection: 'row',
                                             alignItems: 'center',
                                             paddingVertical: 12,
                                             paddingHorizontal: 15,
                                             borderRadius: 12,
                                             backgroundColor: user_level === 5 ? theme.colors.high_color + '20' : 'transparent',
                                             marginBottom: 8
                                        }}>
                                        <IconApp 
                                             pack='FA' 
                                             name={user_level === 5 ? "check-circle" : "circle"} 
                                             color={user_level === 5 ? theme.colors.high_color : theme.colors.gray} 
                                             size={18} 
                                        />
                                        <YambiText 
                                             text={strings.business_admin + " (" + strings.edit_information.toLowerCase() + ")"} 
                                             size="normal"
                                             color={user_level === 5 ? "high" : "default"}
                                             bold={user_level === 5}
                                             style={{ marginLeft: 12 }} 
                                        />
                                   </Pressable>
                              </View>

                              {/* Certification Toggle */}
                              <View style={{
                                   borderTopWidth: 1,
                                   borderTopColor: theme.colors.background,
                                   paddingTop: 20,
                                   marginTop: 10
                              }}>
                                   <Pressable
                                        onPress={() => {
                                             if (user_verified === 1) {
                                                  // Uncertify user
                                                  setUser_verified(0);
                                                  setUser_verified_at("");
                                             } else {
                                                  // Certify user
                                                  setUser_verified(1);
                                                  setUser_verified_at(new Date().toISOString());
                                             }
                                        }}
                                        style={{
                                             flexDirection: 'row',
                                             alignItems: 'center',
                                             paddingVertical: 12,
                                             paddingHorizontal: 15,
                                             borderRadius: 12,
                                             backgroundColor: user_verified === 1 ? theme.colors.high_color + '20' : 'transparent'
                                        }}>
                                        <IconApp 
                                             pack='MT' 
                                             name="verified" 
                                             color={user_verified === 1 ? theme.colors.high_color : theme.colors.gray} 
                                             size={20} 
                                        />
                                        <YambiText 
                                             text={strings.certified} 
                                             size="normal"
                                             color={user_verified === 1 ? "high" : "default"}
                                             bold={user_verified === 1}
                                             style={{ marginLeft: 12 }} 
                                        />
                                   </Pressable>
                              </View>
                         </View>
                    )}

                    {/* Update Button */}
                    <View style={{ marginTop: 10, marginBottom: 30 }}>
                         <ButtonNormal 
                              title={strings.update_info} 
                              loadEnabled={true} 
                              onPress={UpdateData} 
                              styles={{ paddingHorizontal: 20 }} 
                              normal={true} 
                         />
                    </View>

               </ScrollView>
          </View>
     )
}

export default EditProfile;

