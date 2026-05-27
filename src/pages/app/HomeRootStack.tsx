import { Text, Pressable, StyleSheet, View, BackHandler } from 'react-native';
import StatusBarYambi from '../../components/app/StatusBar';
import { useAppDispatch, useAppSelector } from '../../store/app/hooks';
// import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Chats from '../chat/Chats';
import { setTitle } from '../../store/reducers/appSlice';
import { strings } from '../../lang/lang';
import { IconApp } from '../../components/app/IconApp';
import Businesses from '../business/Businesses';
import { NavProps } from '../../types/types';
import { useQuery } from '@realm/react';
import { UserChats, CompanyUsers } from '../../store/database/Models';
import AdminDashboard from '../Admin/AdminDashboard';
import Marketplace from '../marketplace/Marketplace';
import ExpensesPage from '../expenses/Expenses';
import NoticeBoard from '../notice_board/NoticeBoard';


const Tab = createBottomTabNavigator();

const HomeRootStack = ({ navigation, route }: NavProps) => {
    const app_theme = useAppSelector(state => state.app_theme);
    const user_data = useAppSelector(state => state.user_data);
    const app_description = useAppSelector(state => state.persisted_app.app_description);
    const business_badge = useAppSelector(state => state.persisted_app.business_badge);
    const expenses_opened = useAppSelector(state => state.app.expenses_opened);
    const title = useAppSelector(state => state.app.title);
    const dispatch = useAppDispatch();
    const chatss = useQuery(
        UserChats, chts => {
            return chts.filtered('chat_read == $0', 0);
        }, []);

    const companyUsers = useQuery(
        CompanyUsers, cu => {
            return cu.filtered('phone_number == $0 && user_active == $1', user_data.phone_number, 1);
        }, [user_data.phone_number]);

    // Check if user is admin in any company
    const isAdminInAnyCompany = companyUsers.some((cu: any) => cu.is_admin === 1);

    const GoNew = () => {
        if (title === strings.chats) {
            navigation.navigate('NewChat');
        } else if (title === strings.expenses) {
            navigation.navigate('AddExpense', {})
        } else if (title === strings.notice_board) {
            navigation.navigate('Companies', { fromPlusButton: true });
        } else { }
    }



    // console.log(chatss.length)

    // const okok=()=>{
    //     if (language_yambi !== '') {
    //         changeLanguage(language_yambi);
    //         console.log(strings.chats);
    //     } 
    //     // else {
    //     //     console.log("Vide");
    //     // }
    // }

    // useEffect(() => {
    //     // dispatch(setTitle(strings.chats));
    //     // okok();

    //     // console.log(chats_badge);

    //     setLanguage(language_yambi);

    // }, [language, business_badge]);

    const showFloatingAction = () => {
        if (title === strings.chats || title === strings.status) {
            return true;
        }
        
        if (title === strings.notice_board) {
            // Only show plus button if user is admin in any company
            return isAdminInAnyCompany;
        }
        
        if (title === strings.expenses) {
            // Only show plus button if password is not required, or if password is required and expenses is opened
            if (!app_description.require_password_expenses || expenses_opened) {
                return true;
            }
        }

        return false;
    }

    // useEffect(() => {

    //     const onBackPress = () => {
    //         // console.log("Back pressed "+Tab.Screen);

    //         navigation.setOptions({ title: strings.chats });

    //         return false;
    //     }

    //     // console.log("Navigation changed");
    //     // navigation.setOptions({ title: strings.chats });

    //     BackHandler.addEventListener('hardwareBackPress', onBackPress);

    //     return()=>BackHandler.removeEventListener('hardwareBackPress', onBackPress);

    // }, [Tab.Navigator.displayName]);

    return (
        <View style={[{ backgroundColor: app_theme.colors.border, flex: 1 }, StyleSheet.absoluteFill]}>

            <StatusBarYambi />

            {/* <HeaderHome /> */}

            {/* <NavigationContainer independent={true}> */}
            <Tab.Navigator
                id={undefined}
                initialRouteName={strings.chats}
                screenOptions={({ route }) => ({
                    tabBarShowLabel: app_description.bottom_navigation_labels,
                    tabBarActiveTintColor: app_theme.colors.bottom_navigation_active,
                    tabBarInactiveTintColor: app_theme.colors.bottom_navigation_inactive,
                    tabBarStyle: {
                        backgroundColor: app_theme.colors.bottom_navigation_background,
                        elevation: 0,
                        borderTopWidth: 1,
                        borderColor: app_theme.colors.border,
                        // height: 60

                        // position: 'absolute',
                        // borderTopLeftRadius: 20,
                        // borderTopRightRadius: 20
                        // borderRadius: 20,
                        // marginBottom: 7,
                        // marginHorizontal: 8,
                        // paddingVertical: 3
                    },
                    tabBarBadgeStyle: { color: app_theme.colors.home_badge_color, backgroundColor: app_theme.colors.home_badge_background_color },
                    tabBarHideOnKeyboard: true,
                    // tabBarLabelStyle: ({ focused }: { focused: boolean }) => ({
                    //     fontWeight: focused ? 'bold' : 'normal',
                    //     // marginBottom: 3,
                    //     // marginTop: -5,
                    //     // fontSize: 12
                    // }),
                    // tabBarBackground: () => (
                    //     <View style={{flex:1}}>
                    //         <BlurView
                    //         intensity={90}
                    //         style={{
                    //             flex:1,
                    //             // ...StyleSheet.absoluteFillObject,
                    //             overflow: 'hidden',
                    //             backgroundColor: 'transparent'
                    //         }}
                    //     />
                    //     </View>
                    // )

                })}>
                {app_description.tab_visible_chats && (
                    <Tab.Screen name={strings.chats}
                        listeners={{ tabPress: e => { dispatch(setTitle(strings.chats)); } }}
                        options={{
                            tabBarLabel: strings.chats,
                            headerShown: false, tabBarBadge: chatss.length === 0 ? undefined : chatss.length,
                            tabBarIcon: ({ color, size }) => (<IconApp pack='SLI' name="bubbles" size={size} color={color} />)
                        }} component={Chats} />
                )}

                {app_description.tab_visible_marketplace && (
                    <Tab.Screen name={strings.marketplace}
                        listeners={{ tabPress: e => { dispatch(setTitle(strings.marketplace)); } }}
                        options={{
                            tabBarLabel: strings.marketplace,
                            headerShown: false,
                            // tabBarBadge: chatss.length === 0 ? 56 : chatss.length,
                            tabBarIcon: ({ color, size }) => (<IconApp pack='SLI' name="layers" size={size} color={color} />)
                        }} component={Marketplace} />
                )}

                {/* <Tab.Screen name={strings.news}
                    listeners={{ tabPress: e => { dispatch(setTitle(strings.news)); } }}
                    options={{
                        tabBarLabel: strings.news,
                        headerShown: false,
                        // tabBarBadge: chatss.length === 0 ? 56 : chatss.length,
                        tabBarIcon: ({ color, size }) => (<IconApp pack='SLI' name="layers" size={size} color={color} />)
                    }} component={StoriesComponent} /> */}

                {/* <Tab.Screen name={strings.status}
                        listeners={{ tabPress: e => { dispatch(setTitle(strings.status)); Vibration.vibrate(10);} }}
                        options={{
                            // tabBarLabel: strings.status,
                            headerShown: false, tabBarBadge: 49,
                            tabBarIcon: ({ color, size }) => (<IconApp pack='FA' name="home" size={size} color={color} />)
                        }} component={SplashYambiStart} /> */}

                {app_description.tab_visible_business && (
                    <Tab.Screen name={strings.business}
                        listeners={{ tabPress: e => { dispatch(setTitle(strings.business)); } }}
                        options={{
                            tabBarLabel: strings.business,
                            headerShown: false, tabBarBadge: business_badge ? business_badge.length === 0 ? undefined : business_badge.length : undefined,
                            tabBarIcon: ({ color, size }) => (<IconApp pack='IO' name="bag-handle-outline" size={size} color={color} />)
                        }} component={Businesses} />
                )}

                {app_description.tab_visible_expenses && (
                    <Tab.Screen name={strings.expenses}
                        listeners={{ tabPress: e => { dispatch(setTitle(strings.expenses)); } }}
                        options={{
                            tabBarLabel: strings.expenses,
                            headerShown: false,
                            tabBarIcon: ({ color, size }) => (<IconApp pack='FI' name="dollar-sign" size={size} color={color} />)
                        }} component={ExpensesPage} />
                )}

                {app_description.tab_visible_noticeboard && (
               <Tab.Screen name={strings.notice_board}
                    listeners={{ tabPress: e => { dispatch(setTitle(strings.notice_board)); } }}
                    options={{
                        tabBarLabel: strings.notice_board,
                        headerShown: false,
                        // tabBarBadge: business_badge ? business_badge.length === 0 ? null : business_badge.length : null,
                        tabBarIcon: ({ color, size }) => (<IconApp pack='MC' name="developer-board" size={size} color={color} />)
                    }} component={NoticeBoard} />
                )}

                {user_data.user_level !== 0 && app_description.tab_visible_admin ?
                    <Tab.Screen name={strings.admin}
                        listeners={{ tabPress: e => { dispatch(setTitle(strings.admin)); } }}
                        options={{
                            tabBarLabel: strings.admin,
                            headerShown: false,
                            tabBarIcon: ({ color, size }) => (<IconApp pack='SLI' name="settings" size={size} color={color} />)
                        }} component={AdminDashboard} /> : null}

                {/* <Tab.Screen name={strings.groups}
                        listeners={{ tabPress: e => { dispatch(setTitle(strings.groups)); Vibration.vibrate(10);} }}
                        options={{
                            tabBarLabel: strings.groups,
                            headerShown: false, tabBarBadge: 898,
                            tabBarIcon: ({ color, size }) => (<IconApp pack='FA6' name="people-group" size={size} color={color} />)
                        }} component={Signup} /> */}

                {/* <Tab.Screen name={strings.admin}
                        listeners={{ tabPress: e => { dispatch(setTitle(strings.admin)); Vibration.vibrate(10);} }}
                        options={{
                            tabBarLabel: strings.admin,
                            headerShown: false,
                            tabBarIcon: ({ color, size }) => (<IconApp pack='FA6' name="user-circle" size={size} color={color} />)
                        }} component={SettingsYambi} /> */}
            </Tab.Navigator>
            {/* </NavigationContainer> */}

            {showFloatingAction() ?
                <Pressable
                    onPress={GoNew}
                    style={{
                        position: 'absolute',
                        bottom: 80,
                        right: 15,
                        borderWidth: 1,
                        borderColor: app_theme.colors.border,
                        backgroundColor: app_theme.colors.design_tip2,
                        height: 50,
                        width: 50,
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderRadius: 50,
                        elevation: 0
                    }}>
                    {title === strings.chats||title===strings.expenses||title===strings.notice_board ?
                        <IconApp name="plus" pack="FI" size={18} color={app_theme.colors.text_design2} /> : null}

                    {title === strings.status ?
                        <IconApp name="camera" pack="FI" size={18} color={app_theme.colors.text_design2} /> : null}
                </Pressable> : null}

            {title === strings.news ?
                <View>
                    {/* <Pressable
                        onPress={goNewChat}
                        style={{
                            position: 'absolute',
                            bottom: 180,
                            right: 21,
                            borderWidth: 1,
                            borderColor: app_theme.colors.border,
                            backgroundColor: app_theme.colors.design_tip1,
                            height: 46,
                            width: 46,
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderRadius: 50,
                            elevation: 0
                        }}>
                        <Text style={{
                            fontSize: 20,
                            fontWeight: "900",
                            color: app_theme.colors.text_design1
                        }}>A</Text>
                    </Pressable> */}

                    <Pressable
                        onPress={() => navigation.navigate('NewStory', { flag: 1 })}
                        style={{
                            position: 'absolute',
                            bottom: 80,
                            right: 15,
                            borderWidth: 1,
                            borderColor: app_theme.colors.border,
                            backgroundColor: app_theme.colors.design_tip2,
                            height: 50,
                            width: 50,
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderRadius: 50,
                            elevation: 0
                        }}>
                        {title === strings.news ?
                            <IconApp name="camera-plus" pack="MC" size={18} color={app_theme.colors.text_design2} /> : null}
                    </Pressable>
                </View> : null}
        </View>
    )
}

export default HomeRootStack;