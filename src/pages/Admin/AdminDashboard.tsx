import { View, Pressable, Text, ScrollView } from 'react-native';
import { strings } from '../../lang/lang';
import { useAppSelector } from '../../store/app/hooks';
import StatusBarYambi from '../../components/app/StatusBar';
import { YambiBusinesses as YBusinesses } from "../../store/database/Models";
import Users from './Users';
import YambiBusinesses from './Businesses';
import { useState } from 'react';
import { useQuery } from '@realm/react';
import { YambiUsers } from '../../store/database/Models';
import Marketing from './Marketing';
import AppData from './AppData';
import { IconApp } from '../../components/app/IconApp';
import Companies from '../companies/Companies';

const AdminDashboard = () => {

     const theme = useAppSelector(state => state.app_theme);
     // const dispatch = useAppDispatch();
     // const user_data = useAppSelector(state => state.user_data);
     const app_description = useAppSelector(state => state.persisted_app.app_description);
     // const [profile, setProfile] = useState<string>();
     const [admin_tab, setAdmin_tab] = useState<number>(1);

     const contacts = useQuery(YambiUsers);
     const businesses = useQuery(YBusinesses);

     return (
          <View style={{ backgroundColor: theme.colors.background, flex: 1, borderColor: theme.colors.border, borderTopWidth: 1 }}>

               <StatusBarYambi />

               <View>
               <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={{
                         backgroundColor: theme.colors.background,
                         borderBottomWidth: 1,
                         borderBottomColor: theme.colors.border,
                         // height: 50,
                    }}
                    contentContainerStyle={{
                         paddingHorizontal: 8,
                         paddingVertical: 8,
                         alignItems: 'center',
                         height: 50,
                    }}>
                    <Pressable
                         onPress={() => setAdmin_tab(1)}
                         style={{
                              paddingHorizontal: 20,
                              marginHorizontal: 4,
                              borderRadius: 12,
                              backgroundColor: admin_tab === 1 ? theme.colors.high_color + "20" : theme.colors.border,
                              borderWidth: 1.5,
                              borderColor: admin_tab === 1 ? theme.colors.high_color : 'transparent',
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'center',
                              shadowColor: admin_tab === 1 ? theme.colors.high_color : 'transparent',
                              shadowOpacity: 0.1,
                              shadowRadius: 4,
                              elevation: admin_tab === 1 ? 2 : 0,
                              height: 34,
                         }}
                    >
                         <IconApp 
                              pack="FI" 
                              name="database" 
                              color={admin_tab === 1 ? theme.colors.high_color : theme.colors.gray} 
                              size={18} 
                              styles={{ marginRight: 8 }} 
                         />
                         <Text numberOfLines={1} style={{
                              color: admin_tab === 1 ? theme.colors.high_color : theme.colors.text,
                              fontSize: app_description.general_font_size,
                              fontWeight: admin_tab === 1 ? '600' : '400',
                         }}>{strings.app_data}</Text>
                    </Pressable>

                    <Pressable
                         onPress={() => setAdmin_tab(2)}
                         style={{
                              paddingHorizontal: 20,
                              marginHorizontal: 4,
                              borderRadius: 12,
                              backgroundColor: admin_tab === 2 ? theme.colors.high_color + "20" : theme.colors.border,
                              borderWidth: 1.5,
                              borderColor: admin_tab === 2 ? theme.colors.high_color : 'transparent',
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'center',
                              shadowColor: admin_tab === 2 ? theme.colors.high_color : 'transparent',
                              shadowOpacity: 0.1,
                              shadowRadius: 4,
                              elevation: admin_tab === 2 ? 2 : 0,
                              height: 34,
                         }}
                    >
                         <IconApp 
                              pack="FI" 
                              name="users" 
                              color={admin_tab === 2 ? theme.colors.high_color : theme.colors.gray} 
                              size={18} 
                              styles={{ marginRight: 8 }} 
                         />
                         <Text numberOfLines={1} style={{
                              color: admin_tab === 2 ? theme.colors.high_color : theme.colors.text,
                              fontSize: app_description.general_font_size,
                              fontWeight: admin_tab === 2 ? '600' : '400',
                         }}>{strings.users}</Text>
                         {contacts.length > 0 && (
                              <View style={{
                                   backgroundColor: admin_tab === 2 ? theme.colors.high_color : theme.colors.gray,
                                   borderRadius: 10,
                                   paddingHorizontal: 6,
                                   paddingVertical: 2,
                                   marginLeft: 6,
                              }}>
                                   <Text style={{
                                        color: '#FFFFFF',
                                        fontSize: 11,
                                        fontWeight: '600',
                                   }}>{contacts.length}</Text>
                              </View>
                         )}
                    </Pressable>

                    <Pressable
                         onPress={() => setAdmin_tab(3)}
                         style={{
                              paddingHorizontal: 20,
                              marginHorizontal: 4,
                              borderRadius: 12,
                              backgroundColor: admin_tab === 3 ? theme.colors.high_color + "20" : theme.colors.border,
                              borderWidth: 1.5,
                              borderColor: admin_tab === 3 ? theme.colors.high_color : 'transparent',
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'center',
                              shadowColor: admin_tab === 3 ? theme.colors.high_color : 'transparent',
                              shadowOpacity: 0.1,
                              shadowRadius: 4,
                              elevation: admin_tab === 3 ? 2 : 0,
                              height: 34,
                         }}
                    >
                         <IconApp 
                              pack="FI" 
                              name="briefcase" 
                              color={admin_tab === 3 ? theme.colors.high_color : theme.colors.gray} 
                              size={18} 
                              styles={{ marginRight: 8 }} 
                         />
                         <Text numberOfLines={1} style={{
                              color: admin_tab === 3 ? theme.colors.high_color : theme.colors.text,
                              fontSize: app_description.general_font_size,
                              fontWeight: admin_tab === 3 ? '600' : '400',
                         }}>{strings.businesses}</Text>
                         {businesses.length > 0 && (
                              <View style={{
                                   backgroundColor: admin_tab === 3 ? theme.colors.high_color : theme.colors.gray,
                                   borderRadius: 10,
                                   paddingHorizontal: 6,
                                   paddingVertical: 2,
                                   marginLeft: 6,
                              }}>
                                   <Text style={{
                                        color: '#FFFFFF',
                                        fontSize: 11,
                                        fontWeight: '600',
                                   }}>{businesses.length}</Text>
                              </View>
                         )}
                    </Pressable>

                    <Pressable
                         onPress={() => setAdmin_tab(4)}
                         style={{
                              paddingHorizontal: 20,
                              marginHorizontal: 4,
                              borderRadius: 12,
                              backgroundColor: admin_tab === 4 ? theme.colors.high_color + "20" : theme.colors.border,
                              borderWidth: 1.5,
                              borderColor: admin_tab === 4 ? theme.colors.high_color : 'transparent',
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'center',
                              shadowColor: admin_tab === 4 ? theme.colors.high_color : 'transparent',
                              shadowOpacity: 0.1,
                              shadowRadius: 4,
                              elevation: admin_tab === 4 ? 2 : 0,
                              height: 34,
                         }}
                    >
                         <IconApp 
                              pack="FI" 
                              name="trending-up" 
                              color={admin_tab === 4 ? theme.colors.high_color : theme.colors.gray} 
                              size={18} 
                              styles={{ marginRight: 8 }} 
                         />
                         <Text numberOfLines={1} style={{
                              color: admin_tab === 4 ? theme.colors.high_color : theme.colors.text,
                              fontSize: app_description.general_font_size,
                              fontWeight: admin_tab === 4 ? '600' : '400',
                         }}>{strings.marketing}</Text>
                    </Pressable>

                    <Pressable
                         onPress={() => setAdmin_tab(5)}
                         style={{
                              paddingHorizontal: 20,
                              marginHorizontal: 4,
                              borderRadius: 12,
                              backgroundColor: admin_tab === 5 ? theme.colors.high_color + "20" : theme.colors.border,
                              borderWidth: 1.5,
                              borderColor: admin_tab === 5 ? theme.colors.high_color : 'transparent',
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'center',
                              shadowColor: admin_tab === 5 ? theme.colors.high_color : 'transparent',
                              shadowOpacity: 0.1,
                              shadowRadius: 4,
                              elevation: admin_tab === 5 ? 2 : 0,
                              height: 34,
                         }}
                    >
                         <IconApp 
                              pack="FA" 
                              name="building" 
                              color={admin_tab === 5 ? theme.colors.high_color : theme.colors.gray} 
                              size={18} 
                              styles={{ marginRight: 8 }} 
                         />
                         <Text numberOfLines={1} style={{
                              color: admin_tab === 5 ? theme.colors.high_color : theme.colors.text,
                              fontSize: app_description.general_font_size,
                              fontWeight: admin_tab === 5 ? '600' : '400',
                         }}>{strings.companies}</Text>
                    </Pressable>
               </ScrollView>
               </View>

               {admin_tab === 1 &&
                    <AppData />}

               {admin_tab === 2 &&
                    <Users />}

               {admin_tab === 3 &&
                    <YambiBusinesses />}

               {admin_tab === 4 &&
                    <Marketing />}

               {admin_tab === 5 &&
                    <Companies />}
          </View>
     )
}

export default AdminDashboard;

