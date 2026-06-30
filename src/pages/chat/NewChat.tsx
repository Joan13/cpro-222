import { useState, useEffect, useCallback } from 'react';
import { View, TextInput, Pressable } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Feather from 'react-native-vector-icons/Feather';
// import * as Animatable from 'react-native-animatable';
// import * as Localization from 'react-native-localization';
import { strings } from '../../lang/lang';
// import changeNavigationBarColor from 'react-native-navigation-bar-color';
// import { PermissionsAndroid } from 'react-native';
// import { connect, useDispatch, useSelector } from 'react-redux';
// import Realm, { BSON } from 'realm';
// import { useNavigation } from '@react-navigation/native';
import Animated, { SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { useAppDispatch, useAppSelector } from '../../store/app/hooks';
// import ButtonNormal from '../../components/app/ButtonNormal';
import StatusBarYambi from '../../components/app/StatusBar';
import { NavProps, TUser } from '../../types/types';
// import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
// import Entypo from 'react-native-vector-icons/Entypo'/;
// import countries from '../../assets/countries_en';
import ContactsList from '../../components/lists/contacts/ContactsList';
import { setTextContactSearch } from '../../store/reducers/appSlice';
import { FlashList } from '@shopify/flash-list';
import { YambiText } from '../../components/app/Text';
import { IconApp } from '../../components/app/IconApp';
import { useQuery } from '@realm/react';
import { UserContacts } from '../../store/database/Models';
// import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SocketApp } from '../../../GlobalVariables';
import { SafeAreaView } from 'react-native-safe-area-context';
// import { SocketApp } from '../../../App';

// const navigation = NativeStackScreenProps<RootStackParamList>();

const NewChat = ({ route, navigation }: NavProps) => {

    const app_theme = useAppSelector(state => state.app_theme);
    const user_data = useAppSelector(state => state.user_data);
    const dispatch = useAppDispatch();
    const raw_contacts = useAppSelector(state => state.persisted_app.raw_contacts);
    const search_contact_enabled = useAppSelector(state => state.app.search_contact_enabled);
    const text_contact_search = useAppSelector(state => state.app.text_contact_search);

    const contacts = useQuery(
        UserContacts, ccs => {
            return ccs.filtered('phone_number != $0 && user_active != $1', user_data.phone_number, 0)
                .sorted('user_names', false);
        }, []);

    const [IIItems, setIIItems] = useState([]);

    const update_user = () => {
        // console.log(raw_contacts)
        SocketApp.emit('update_contacts', raw_contacts);

        // SocketApp.on('server', () => {

        // });
    }

    // console.log(raw_contacts);

    useEffect(() => {
        // changeNavigationColors(app_theme.colors.background);
        // set_base_theme();
        // CreateTables();

        // if (Platform.OS === 'android') {
        //     PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_CONTACTS, {
        //         title: 'Yambi contacts',
        //         message: 'Yambi wants to access your contacts in order to run properly',
        //     }).then((i) => {
        //         // loadContacts();
        //         console.log(i)
        //     });
        // } else {
        //     // loadContacts();
        // }

        // console.log(raw_contacts);

        // console.log(navigation)

        const iii = contacts.filter(item => item.user_active !== 0);
        // const iii =  contacts.sort((a, b) =>
        //     a.name.localeCompare(b.name)
        //   );
        setIIItems(iii as never);

        // console.log(contacts.length)

        // update_user();
    }, [contacts]);



    // const SearchCountry = (search: String) => {
    //     let cc = countries.filter(item => item.name.includes(search.toString()));
    //     setCcc(cc);
    // }

    const selectCon = useCallback((item: TUser) => {
        // dispatch(setCurrentUser(item));
        navigation.navigate("Inbox", { user: item.phone_number });
    }, []);

    // const renderItem = useCallback(({ item }: { item: TUser }) => {
    //     console.log('Show items');
    //     return (<ContactsList
    //         item={item}
    //         app_theme={app_theme}
    //         dispatch={dispatch}
    //         navigation={navigation}
    //         type_contact={type_contact}
    //     />)
    // }, []);

    const SearchItem = (search: string) => {
        dispatch(setTextContactSearch(search));
        let filtered_items = contacts.filter(item => {
            return item.user_active !== 0 && item.user_names.toLowerCase().includes(search.toLowerCase().toString())
                || item.user_active !== 0 && item.phone_number.toLowerCase().includes(search.toLowerCase().toString());
        });

        setIIItems(filtered_items as never);
    }

    // const renderItem = memo(Ii);

    const setSSearch = (text: string) => {
        dispatch(setTextContactSearch(text));
    };

    // useEffect(()=> {
    //     console.log(contacts);
    // },[]);

    const AddComponent = () => {
        return (
            <View style={{ marginHorizontal: 0, borderColor: app_theme.colors.border, borderTopWidth: 0 }}>
                {/* <Pressable onPress={() => navigation.navigate("NewGroup")} style={{ flexDirection: 'row', justifyContent: 'flex-start', height: 60, alignItems: 'center' }}>
                    <View style={{
                        width: 35,
                        height: 35,
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderColor: app_theme.colors.border,
                        borderWidth: 1,
                        borderRadius: 30
                    }}>
                        <FontAwesome6 name="people-group" color={app_theme.colors.text} size={16} />
                    </View>
                    <View style={{
                        borderBottomWidth: 0,
                        borderColor: app_theme.colors.border,
                        flex: 1,
                        marginLeft: 10,
                        height: 60,
                        justifyContent: 'center'
                    }}>
                        <YambiText text={strings.new_group} size="normal" color="default" />
                    </View>
                </Pressable> */}

                {/* <View style={{
                    flexDirection: 'row', justifyContent: 'center', alignItems: 'center'
                }}>
                    <Pressable style={{ flexDirection: 'row', justifyContent: 'flex-start', height: 60, alignItems: 'center', flex: 1 }}>
                        <View style={{
                            width: 35,
                            height: 35,
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderColor: app_theme.colors.border,
                            borderWidth: 1,
                            borderRadius: 30,
                        }}>
                            <IconApp name="list-ul" pack="FA6" size={16} color={app_theme.colors.text} />
                        </View>
                        <View style={{
                            borderBottomWidth: 0,
                            borderColor: app_theme.colors.border,
                            flex: 1,
                            marginLeft: 10,
                            height: 60,
                            justifyContent: 'center'
                        }}>
                            <YambiText text={strings.new_blog} size="normal" color="default" />
                        </View>
                    </Pressable>

                    <Pressable style={{ flexDirection: 'row', justifyContent: 'flex-start', height: 60, alignItems: 'center', flex: 1 }}>
                        <View style={{
                            width: 35,
                            height: 35,
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderColor: app_theme.colors.border,
                            borderWidth: 1,
                            borderRadius: 30
                        }}>
                            <IconApp name="news" pack="ET" size={16} color={app_theme.colors.text} />
                        </View>
                        <View style={{
                            borderBottomWidth: 0,
                            borderColor: app_theme.colors.border,
                            flex: 1,
                            marginLeft: 10,
                            height: 60,
                            justifyContent: 'center'
                        }}>
                            <YambiText text={strings.new_article} size="normal" color="default" />
                        </View>
                    </Pressable>
                </View> */}

                {contacts.length > 0 ?
                    <YambiText text={strings.contacts_on_yambi} size="small" color="gray" style={{ marginVertical: 8 }} />
                    : null}

            </View>
        )
    }

    return (
        <View style={{ flex: 1, backgroundColor: app_theme.colors.background, borderColor: app_theme.colors.border, borderTopWidth: 1 }}>

            <StatusBarYambi />

            {/* <AddComponent /> */}

            <View style={{
                backgroundColor: app_theme.colors.background,
                flex: 1
            }}>
                {search_contact_enabled ?
                    <Animated.View
                        entering={SlideInUp}
                        exiting={SlideOutUp}
                        style={{ marginBottom: 0, marginHorizontal: 15, borderBottomWidth: 1, paddingVertical: 0, borderColor: app_theme.colors.border, flexDirection: 'row', alignItems: 'center', backgroundColor: app_theme.colors.background }}>
                        <Feather name="search" size={16} style={{ marginRight: 10, color: app_theme.colors.gray }} />
                        <TextInput
                            onChangeText={SearchItem}
                            value={text_contact_search}
                            placeholder={strings.search}
                            placeholderTextColor={app_theme.colors.gray}
                            style={{ flex: 1, paddingVertical: 0, height: 40, borderWidth: 0, borderColor: app_theme.colors.background, backgroundColor: app_theme.colors.background, color: app_theme.colors.text }}
                        />
                        {text_contact_search !== "" ?
                            <Pressable
                                onPress={() => {
                                    dispatch(setTextContactSearch(""));
                                    setIIItems(contacts as never);
                                }}
                                style={{
                                    height: 30,
                                    width: 30,
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }}>
                                <Feather name="x" size={16} style={{ color: app_theme.colors.text }} />
                            </Pressable> : null}
                    </Animated.View> : null}
                {/* renderItem={({ item, index }: { item: TMessage, index: number }) => ( */}
                <FlashList
                    estimatedItemSize={200}
                    data={IIItems as never}
                    ListHeaderComponent={<AddComponent />}
                    keyboardShouldPersistTaps="handled"
                    renderItem={({ item, index }: { item: TUser, index: number }) => (
                        <ContactsList
                            item={item}
                            index={index}
                            type={0}
                            selectContact={selectCon}
                        />)}
                    contentContainerStyle={{
                        backgroundColor: app_theme.colors.background,
                        paddingHorizontal: 15,
                        paddingBottom: 50
                    }}
                />
            </View>
        </View>
    );

}

export default NewChat;
