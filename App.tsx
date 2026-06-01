/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable prettier/prettier */
import { useEffect, useMemo, useRef } from 'react';
import { useColorScheme, PermissionsAndroid, Platform, AppState } from 'react-native';
import KeyboardRootView from './src/components/layout/KeyboardRootView';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
// import AudioMessage from "./src/pages/app";
// import { navigationRef } from './src/pages/main/root_stack';
// import SQLite from 'react-native-sqlite-storage';
// import { Audio } from 'expo-av';
import * as NavigationBar from 'expo-navigation-bar';
import { setRootViewBackgroundColor } from '@pnthach95/react-native-root-view-background';
// import { changeLanguage, strings } from './src/lang/lang';
// import AudioMessage from './src/components/chat/messages_audio';
// import { io } from 'socket.io-client';
// import { remote_host_web_socket } from './src/services/remote_host';
// import { editMessageStatus, saveChat, saveMessageInbox } from './src/services/socket.functions';
// import moment from 'moment';
// import 'react-native-get-random-values'
// import { KeyboardRegistry } from 'react-native-keyboard-input';
// import YambiEmojis from './src/pages/includes/emojis';
// import Realm, { BSON } from 'realm';
import messaging from '@react-native-firebase/messaging';

// import { Chats_model, Chat_status, Chat_type, Groups, Group_members, Messages_groups, Messages_users, User } from './src/database/models';
import { KeyboardRegistry } from 'react-native-ui-lib/keyboard';
// import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAppDispatch, useAppSelector } from './src/store/app/hooks';
import { setTheme } from './src/store/reducers/themeSlice';
import { NavProps, RootStackParamList, TBusinessBadge, TChat, TContact, TItem, TItemPrices, TSale, TStory, TUser } from './src/types/types';

// import changeNavigationBarColor from 'react-native-navigation-bar-color';
import SplashYambiStart from './src/pages/splash/MainSplash';
import Signup from './src/pages/signup/Signup';
import Themes, { themes } from './src/pages/app/Themes';
import Contacts from 'react-native-contacts';
import { setRawContacts, setTitle } from './src/store/reducers/appSlice';
import HomeRootStack from './src/pages/app/HomeRootStack';
// import HeaderLeftHome from './src/components/headers/HeaderHome';
// import HeaderRightHome from './src/components/headers/HeaderRightHome';
import { changeLanguage, strings } from './src/lang/lang';
import NewChat from './src/pages/chat/NewChat';
import HeaderRightNewChat from './src/components/headers/HeaderRightNewChat';
import Inbox from './src/pages/chat/Inbox';
// import notifee, { AndroidImportance, AndroidVisibility, EventType } from '@notifee/react-native';
// import { setContacts } from './src/store/reducers/contactsSlice';
// import HeaderRightChat from './src/components/headers/HaderRightInbox';
// import HeaderTitleChat from './src/components/headers/HeaderTitleContact';
import HeaderChat from './src/components/headers/HeaderInbox';
import { useQuery, useRealm } from '@realm/react';
import * as RootNavigation from './src/services/Navigation_ref';
import { BusinessItemsSale, BusinessUsers, ItemPrices, UserBusinessArticles, UserBusinesses, UserChats, UserContacts, UsersMessages } from './src/store/database/Models';
// import SocketActivity from './src/services/socket';
import { navigationRef } from './src/services/Navigation_ref';
import RNBootSplash from 'react-native-bootsplash';
import moment from 'moment';
import SettingsYambi from './src/pages/app/SettingsYambi';
import Languages from './src/pages/app/Languages';
import AboutYambi from './src/pages/app/AboutYambi';
import MakeDonation from './src/pages/app/MakeDonation';
import AddBusinessSubscription from './src/pages/business/AddBusinessSubscription';
import BusinessSubscriptionPlans from './src/pages/business/BusinessSubscriptionPlans';
import SubscriptionHistory from './src/pages/business/SubscriptionHistory';
import ShareBusiness from './src/pages/business/ShareBusiness';
import BusinessInventoryMovementHistory from './src/pages/business/BusinessInventoryMovementHistory';
import InventoryMovement from './src/pages/business/InventoryMovement';
import NewGroup from './src/pages/app/NewGroup';
import { createPersistedFolders } from './src/util/AppFoldersCreator';
import SendPictureMessage from './src/components/chat/SendPictureMessage';
import ViewFullInboxImage from './src/components/chat/ViewFullInboxImage';
// import HeaderRightInbox from './src/components/headers/HaderRightInbox';
// import YambiEmojiKeyboard from './src/components/app/YambiEmojiKeyboard';
import NewBusinesses from './src/pages/business/NewBusiness';
import { remote_host, removeDuplicateNumbers, removeWhiteSpaces, SocketApp, isRemoteAppVersionNewer } from './GlobalVariables';
import HeaderHome from './src/components/headers/HeaderHome';
import HeaderSettings from './src/components/headers/HeaderSettings';
import Business from './src/pages/business/Business';
import BusinessViewModern from './src/pages/business/BusinessViewModern';
import BusinessModern from './src/pages/business/BusinessModern';
import Sales from './src/pages/business/Sales';
import BusinessItemss from './src/pages/business/BusinessItems';
import NewBusinessItem from './src/pages/business/NewBusinessItem';
import EditBusinessItem from './src/pages/business/EditBusinessItem';
import RenewStock from './src/pages/business/RenewStock';
import HeaderEditBusinessItem from './src/components/headers/HeaderEditItem';
import HeaderBusinessItems from './src/components/headers/HeaderBusinessItems';
import NewSalesPoint from './src/pages/business/NewSalesPoint';
import HeaderBusiness from './src/components/headers/HeaderBusiness';
import NewBusinessUser from './src/pages/business/NewBusinessUser';
import Sale from './src/pages/business/Sale';
import HeaderSale from './src/components/headers/HeaderSale';
import EditBusiness from './src/pages/business/EditBusiness';
import HeaderEditBusiness from './src/components/headers/HeaderEditBusiness';
import EditSalesPoint from './src/pages/business/EditSalesPoint';
import HeaderEditSalesPoint from './src/components/headers/HeaderEditSalesPoint';
import Customize from './src/pages/app/Customize';
import CustomizeBusiness from './src/pages/business/CustomizeBusiness';
import CustomizeExpenses from './src/pages/expenses/CustomizeExpenses';
import MessageUs from './src/pages/app/MessageUs';
import UserBusinessUsers from './src/pages/business/UserBusinessUsers';
import HeaderBusinessUsers from './src/components/headers/HeaderBusinessUsers';
import BusinessSubscribers from './src/pages/business/BusinessSubscribers';
import EditBusinessUser from './src/pages/business/EditBusinessUser';
import HeaderEditBusinessUser from './src/components/headers/HeaderEditBusinessUser';
import HeaderCompanyUser from './src/components/headers/HeaderCompanyUser';
import ItemSales from './src/pages/business/ItemSales';
import Calculator from './src/pages/app/Calculator';

import { updateUser } from './src/store/reducers/userSlice';
import axios from 'axios';
import "moment/locale/fr";
import EditProfile from './src/pages/app/EditProfile';
import packagee from './package.json';

import * as Notifications from 'expo-notifications';
import {
    SchedulableTriggerInputTypes,
    type NotificationBehavior,
} from 'expo-notifications';
import ViewPhoto from './src/pages/app/ViewPhoto';
import { setAddBusinessBadge, setDefaultMessageSettingsData, setLanguageApp, setRawContactsPersisted, setTabVisibleMarketplace } from './src/store/reducers/persistedAppSlice';
import ContactUs from './src/pages/app/ContactUs';
import HeaderRightInbox from './src/components/headers/HeaderRightInbox';
import HeaderInbox from './src/components/headers/HeaderInbox';
import HeaderRightHome from './src/components/headers/HeaderRightHome';
import MyAccount from './src/pages/app/MyAccount';
import NewCompany from './src/pages/companies/NewCompany';
import NewCompanyUser from './src/pages/companies/NewCompanyUser';
import EditCompany from './src/pages/companies/EditCompany';
import EditCompanyUser from './src/pages/companies/EditCompanyUser';
import Company from './src/pages/companies/Company';
import Companies from './src/pages/companies/Companies';
import AddNews from './src/pages/notice_board/AddNews';
import PostNews from './src/pages/companies/PostNews';
import EditNews from './src/pages/notice_board/EditNews';
import News from './src/pages/notice_board/News';
import Post from './src/pages/notice_board/Post';
import PostReactions from './src/pages/notice_board/PostReactions';
import CompanyUser from './src/pages/companies/CompanyUser';
import Timetables from './src/pages/notice_board/Timetables';
import ForwardMessage from './src/components/chat/ForwardMessage';
import MessageInfo from './src/components/chat/MessageInfo';
import UserProfileInfo from './src/pages/app/UserProfileInfo';
import AllMessages from './src/components/chat/AllMessages';
import NewStory from './src/pages/news/NewStory';
import Stories from './src/pages/news/Stories';
import UserStories from './src/pages/news/UserStories';
import useAudioPermission from './src/components/hooks/useAudioPermission';
import SalesModern from './src/pages/business/SalesModern';
import HeaderAddBusinessUser from './src/components/headers/HeaderAddBusinessUser';
import UpdateYambi from './src/pages/app/UpdateYambi';
import NewBusinessItemSale from './src/pages/business/AddItemSale';
import AddItemSale from './src/pages/business/AddItemSale';
import BusinessItem from './src/pages/business/BusinessItem';
import Cart from './src/pages/marketplace/components/Cart';
import CategoryItems from './src/pages/marketplace/components/CategoryItems';
import HeaderCategoryItems from './src/components/headers/HeaderCategoryItems';
import HeaderCart from './src/components/headers/HeaderCart';
import SearchMarketplace from './src/pages/marketplace/components/SearchMarketplace';
import AddExpense from './src/pages/expenses/AddExpense';
import EditExpense from './src/pages/expenses/EditExpense';
import Expense from './src/pages/expenses/Expense';
import CategoryExpenses from './src/pages/expenses/CategoryExpenses';
import HeaderRightExpense from './src/components/headers/HeaderRightExpense';
import HeaderRightExpenses from './src/components/headers/HeaderRightExpenses';
import SelectPaymentType from './src/pages/business/SelectPaymentType';
// import realmReference from './src/services/RealmReference';

// Configure how notifications are displayed when the app is in the foreground
Notifications.setNotificationHandler({
    handleNotification: async (): Promise<NotificationBehavior> => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export const displayNotification = async (notification: any) => {
    const data = notification?.data ?? {};
    const title =
        data.title ??
        notification?.notification?.title ??
        '';
    const rawBody = data.body ?? notification?.notification?.body ?? '';
    const body =
        rawBody === 'Audio'
            ? strings.voice_note
            : rawBody === 'photo'
                ? strings.picture
                : rawBody;

    if (!title && !body) {
        return;
    }

    await Notifications.scheduleNotificationAsync({
        content: {
            title: title || 'Yambi',
            body: body || '',
            data,
            categoryIdentifier: 'exampleCategory',
        },
        trigger: null,
    });
};

// import UserBusinessItems from './src/store/database/UserBusinessItems';
// import * as Contacts from 'expo-contacts';
// import themes from './src/pages/main/themes';
// import ProfileYambi from './src/pages/profile/profile';
// import HomeYambi from './src/pages/main/home';
// import ContactsUser from './src/pages/main/contacts';
// import NewChat from './src/pages/chat/new_chat';
// import InboxChat from './src/pages/chat/inbox_chat';
// import KeyboardInput from './src/pages/includes/keyboard';
// import SplashYambiStart from './src/pages/splash/main_splash';
// import NewGroup from './src/pages/chat/new_group';
// import OutgoingVideo from './src/pages/video_call/outgoing';
// import Languages from './src/pages/main/lang';
// import AudioMessage from './src/pages/chat/messages_audio';
// import RNBootSplash from "react-native-bootsplash";
// import Signin from './src/pages/profile/signin';

// (async()=>{
// const realm = await Realm.open({
//     // schema: [Messages_users, Messages_groups, Chats_model, Groups, Group_members, Cat]
//     schema: [UsersMessages],
//     schemaVersion: 1
// })
//     .then(() => {
//         console.log("Database opened");

//         // console.log(realm);
//     })
//     .catch((e) => {
//         console.log("Unable to open database : " + e);
//     });


// })();

// const chat_exists = useQuery(
//         UserChats, chts => {
//             return chts.filtered('chat_id == $0', "+786776");
//         }, []);

// SplashScreen.preventAutoHideAsync();

// function renderEmojis(text: string) {
//     // Regular expression to match emojis
//     const emojiRegex = /[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u203C-\u3299\u203C-\u3299\u2000-\u2BFF\u2000-\u2BFF\u2600-\u26FF\u2600-\u26FF\u2700-\u27BF\u2700-\u27BF\u{1F000}-\u{1F9FF}\u{1F000}-\u{1F9FF}\u{1F300}-\u{1F6FF}\u{1F300}-\u{1F6FF}\u{1F700}-\u{1F773}\u{1F780}-\u{1F7D4}\u{1F800}-\u{1F9CF}\u{1F980}-\u{1F9CF}\u{1F9E0}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F773}\u{1F780}-\u{1F7D8}\u{1F800}-\u{1F80B}\u{1F810}-\u{1F847}\u{1F850}-\u{1F859}\u{1F860}-\u{1F887}\u{1F890}-\u{1F8AD}\u{1F900}-\u{1F90B}\u{1F90D}-\u{1F971}\u{1F973}-\u{1F976}\u{1F97A}-\u{1F9A2}\u{1F9B0}-\u{1F9B9}\u{1F9C0}-\u{1F9C2}\u{1F9D0}-\u{1F9FF}\u{1FA60}-\u{1FA6D}\u{1FA70}-\u{1FA74}\u{1FA78}-\u{1FA7A}\u{1FA80}-\u{1FA86}\u{1FA90}-\u{1FAA8}\u{1FAB0}-\u{1FAB6}\u{1FAC0}-\u{1FAC2}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F773}\u{1F780}-\u{1F7D8}\u{1F800}-\u{1F80B}\u{1F810}-\u{1F847}\u{1F850}-\u{1F859}\u{1F860}-\u{1F887}\u{1F890}-\u{1F8AD}\u{1F900}-\u{1F90B}\u{1F90D}-\u{1F971}\u{1F973}-\u{1F976}\u{1F97A}-\u{1F9A2}\u{1F9B0}-\u{1F9B9}\u{1F9C0}-\u{1F9C2}\u{1F9D0}-\u{1F9FF}\u{1FA60}-\u{1FA6D}\u{1FA70}-\u{1FA74}\u{1FA78}-\u{1FA7A}\u{1FA80}-\u{1FA86}\u{1FA90}-\u{1FAA8}\u{1FAB0}-\u{1FAB6}\u{1FAC0}-\u{1FAC2}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F773}\u{1F780}-\u{1F7D8}\u{1F800}-\u{1F80B}\u{1F810}-\u{1F847}\u{1F850}-\u{1F859}\u{1F860}-\u{1F887}\u{1F890}-\u{1F8AD}\u{1F900}-\u{1F90B}\u{1F90D}-\u{1F971}\u{1F973}-\u{1F976}\u{1F97A}-\u{1F9A2}\u{1F9B0}-\u{1F9B9}\u{1F9C0}-\u{1F9C2}\u{1F9D0}-\u{1F9FF}\u{1FA60}-\u{1FA6D}\u{1FA70}-\u{1FA74}\u{1FA78}-\u{1FA7A}\u{1FA80}-\u{1FA86}\u{1FA90}-\u{1FAA8}\u{1FAB0}-\u{1FAB6}\u{1FAC0}-\u{1FAC2}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F773}\u{1F780}-\u{1F7D8}\u{1F800}-\u{1F80B}\u{1F810}-\u{1F847}\u{1F850}-\u{1F859}\u{1F860}-\u{1F887}\u{1F890}-\u{1F8AD}\u{1F900}-\u{1F90B}\u{1F90D}-\u{1F971}\u{1F973}-\u{1F976}\u{1F97A}-\u{1F9A2}\u{1F9B0}-\u{1F9B9}\u{1F9C0}-\u{1F9C2}\u{1F9D0}-\u{1F9FF}\u{1FA60}-\u{1FA6D}\u{1FA70}-\u{1FA74}\u{1FA78}-\u{1FA7A}\u{1FA80}-\u{1FA86}\u{1FA90}-\u{1FAA8}\u{1FAB0}-\u{1FAB6}\u{1FAC0}-\u{1FAC2}]/gu;

//     // Replace emojis with their emojicodes
//     return text.replace(emojiRegex, (match) => {
//         // Convert emoji character to hexadecimal code
//         const hexCode = match.codePointAt(0).toString(16).toUpperCase();
//         // Format hexadecimal code as emojicode
//         return `\\u{${hexCode}}`;
//     });
// }

// // Example usage
// const inputText = "Hello, 😀🌎!";
// const outputText = renderEmojis(inputText);
// console.log(outputText);


// function renderEmojiImages(text) {
//     // Map of emojis to image URLs
//     const emojiMap = {
//         "😀": "https://example.com/emoji_smile.png",
//         "😃": "https://example.com/emoji_smile_big.png",
//         // Add more emojis and their image URLs here
//     };

//     // Regular expression to match emojis
//     const emojiRegex = /[\uD800-\uDFFF].|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u203C-\u3299\u203C-\u3299\u2000-\u2BFF\u2000-\u2BFF\u2600-\u26FF\u2600-\u26FF\u2700-\u27BF\u2700-\u27BF\u{1F000}-\u{1F9FF}\u{1F000}-\u{1F9FF}\u{1F300}-\u{1F6FF}\u{1F300}-\u{1F6FF}\u{1F700}-\u{1F773}\u{1F780}-\u{1F7D4}\u{1F800}-\u{1F9CF}\u{1F980}-\u{1F9CF}\u{1F9E0}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F773}\u{1F780}-\u{1F7D8}\u{1F800}-\u{1F80B}\u{1F810}-\u{1F847}\u{1F850}-\u{1F859}\u{1F860}-\u{1F887}\u{1F890}-\u{1F8AD}\u{1F900}-\u{1F90B}\u{1F90D}-\u{1F971}\u{1F973}-\u{1F976}\u{1F97A}-\u{1F9A2}\u{1F9B0}-\u{1F9B9}\u{1F9C0}-\u{1F9C2}\u{1F9D0}-\u{1F9FF}\u{1FA60}-\u{1FA6D}\u{1FA70}-\u{1FA74}\u{1FA78}-\u{1FA7A}\u{1FA80}-\u{1FA86}\u{1FA90}-\u{1FAA8}\u{1FAB0}-\u{1FAB6}\u{1FAC0}-\u{1FAC2}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F773}\u{1F780}-\u{1F7D8}\u{1F800}-\u{1F80B}\u{1F810}-\u{1F847}\u{1F850}-\u{1F859}\u{1F860}-\u{1F887}\u{1F890}-\u{1F8AD}\u{1F900}-\u{1F90B}\u{1F90D}-\u{1F971}\u{1F973}-\u{1F976}\u{1F97A}-\u{1F9A2}\u{1F9B0}-\u{1F9B9}\u{1F9C0}-\u{1F9C2}\u{1F9D0}-\u{1F9FF}\u{1FA60}-\u{1FA6D}\u{1FA70}-\u{1FA74}\u{1FA78}-\u{1FA7A}\u{1FA80}-\u{1FA86}\u{1FA90}-\u{1FAA8}\u{1FAB0}-\u{1FAB6}\u{1FAC0}-\u{1FAC2}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F773}\u{1F780}-\u{1F7D8}\u{1F800}-\u{1F80B}\u{1F810}-\u{1F847}\u{1F850}-\u{1F859}\u{1F860}-\u{1F887}\u{1F890}-\u{1F8AD}\u{1F900}-\u{1F90B}\u{1F90D}-\u{1F971}\u{1F973}-\u{1F976}\u{1F97A}-\u{1F9A2}\u{1F9B0}-\u{1F9B9}\u{1F9C0}-\u{1F9C2}\u{1F9D0}-\u{1F9FF}\u{1FA60}-\u{1FA6D}\u{1FA70}-\u{1FA74}\u{1FA78}-\u{1FA7A}\u{1FA80}-\u{1FA86}\u{1FA90}-\u{1FAA8}\u{1FAB0}-\u{1FAB6}\u{1FAC0}-\u{1FAC2}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F773}\u{1F780}-\u{1F7D8}\u{1F800}-\u{1F80B}\u{1F810}-\u{1F847}\u{1F850}-\u{1F859}\u{1F860}-\u{1F887}\u{1F890}-\u{1F8AD}\u{1F900}-\u{1F90B}\u{1F90D}-\u{1F971}\u{1F973}-\u{1F976}\u{1F97A}-\u{1F9A2}\u{1F9B0}-\u{1F9B9}\u{1F9C0}-\u{1F9C2}\u{1F9D0}-\u{1F9FF}\u{1FA60}-\u{1FA6D}\u{1FA70}-\u{1FA74}\u{1FA78}-\u{1FA7A}\u{1FA80}-\u{1FA86}\u{1FA90}-\u{1FAA8}\u{1FAB0}-\u{1FAB6}\u{1FAC0}-\u{1FAC2}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F773}\u{1F780}-\u{1F7D8}\u{1F800}-\u{1F80B}\u{1F810}-\u{1F847}\u{1F850}-\u{1F859}\u{1F860}-\u{1F887}\u{1F890}-\u{1F8AD}\u{1F900}-\u{1F90B}\u{1F90D}-\u{1F971}\u{1F973}-\u{1F976}\u{1F97A}-\u{1F9A2}\u{1F9B0}-\u{1F9B9}\u{1F9C0}-\u{1F9C2}\u{1F9D0}-\u{1F9FF}\u{1FA60}-\u{1FA6D}\u{1FA70}-\u{1FA74}\u{1FA78}-\u{1FA7A}\u{1FA80}-\u{1FA86}\u{1FA90}-\u{1FAA8}\u{1FAB0}-\u{1FAB6}\u{1FAC0}-\u{1FAC2}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F773}\u{1F780}-\u{1F7D8}\u{1F800}-\u{1F80B}\u{1F810}-\u{1F847}\u{1F850}-\u{1F859}\u{1F860}-\u{1F887}\u{1F890}-\u{1F8AD}\u{1F900}-\u{1F90B}\u{1F90D}-\u{1F971}\u{1F973}-\u{1F976}\u{1F97A}-\u{1F9A2}\u{1F9B0}-\u{1F9B9}\u{1F9C0}-\u{1F9C2}\u{1F9D0}-\u{1F9FF}\u{1FA60}-\u{1FA6D}\u{1FA70}-\u{1FA74}\u{1FA78}-\u{1FA7A}\u{1FA80}-\u{1FA86}\u{1FA90}-\u{1FAA8}\u{1FAB0}-\u{1FAB6}\u{1FAC0}-\u{1FAC2}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F773}\u{1F780}-\u{1F7D8}\u{1F800}-\u{1F80B}\u{1F810}-\u{1F847}\u{1F850}-\u{1F859}\u{1F860}-\u{1F887}\u{1F890}-\u{1F8AD}\u{1F900}-\u{1F90B}\u{1F90D}-\u{1F971}\u{1F973}-\u{1F976}\u{1F97A}-\u{1F9A2}\u{1F9B0}-\u{1F9B9}\u{1F9C0}-\u{1F9C2}\u{1F9D0}-\u{1F9FF}\u{1FA60}-\u{1FA6D}\u{1FA70}-\u{1FA74}\u{1FA78}-\u{1FA7A}\u{1FA80}-\u{1FA86}\u{1FA90}-\u{1FAA8}\u{1FAB0}-\u{1FAB6}\u{1FAC0}-\u{1FAC2}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F773}\u{1F780}-\u{1F7D8}\u{1F800}-\u{1F80B}\u{1F810}-\u{1F847}\u{1F850}-\u{1F859}\u{1F860}-\u{1F887}\u{1F890}-\u{1F8AD}\u{1F900}-\u{1F90B}\u{1F90D}-\u{1F971}\u{1F973}-\u{1F976}\u{1F97A}-\u{1F9A2}\u{1F9B0}-\u{1F9B9}\u{1F9C0}-\u{1F9C2}\u{1F9D0}-\u{1F9FF}\u{1FA60}-\u{1FA6D}\u{1FA70}-\u{1FA74}\u{1FA78}-\u{1FA7A}\u{1FA80}-\u{1FA86}\u{1FA90}-\u{1FAA8}\u{1FAB0}-\u{1FAB6}\u{1FAC0}-\u{1FAC2}]/gu;

//     // Replace emojis with their corresponding images
//     return text.replace(emojiRegex, (match) => {
//         const imageUrl = emojiMap[match];
//         if (imageUrl) {
//             return `<img src="${imageUrl}" alt="${match}" />`;
//         } else {
//             return match; // Return the emoji as is if no image URL is found
//         }
//     });
// }

// // Example usage
// const inputText = "Hello, 😀🌎!";
// const outputText = renderEmojiImages(inputText);
// console.log(outputText);

// const changeNavigationColors = async (color: string) => {
//     try {
//         changeNavigationBarColor(color, false);
//     } catch (e) { console.log(e); }
// }

// export const SocketApp = io(remote_host_web_socket);
const Stack = createNativeStackNavigator<RootStackParamList>();

const Yambi = ({ navigation }: NavProps) => {

    const dispatch = useAppDispatch();
    const user_data = useAppSelector(state => state.user_data);
    // const current_user = useAppSelector(state => state.current_user);
    //   const current_user = useAppSelector(state => state.current_user);
    //   const messages_chat = useAppSelector(state => state.messages_chat);
    //   const messages_users = useAppSelector(state => state.messages_users);
    //   const presaved_messages_users = useAppSelector(state => state.presaved_messages_users);
    const app_theme = useAppSelector(state => state.app_theme);
    // const chats_badge = useAppSelector(state => state.app.chats_badge);
    //   const socket_chat = useAppSelector(state => state.socket_chat);
    const language_yambi = useAppSelector(state => state.persisted_app.langApp);
    const title = useAppSelector(state => state.app.title);
    const theme_set = useAppSelector(state => state.persisted_app.theme_set);
    const app_description = useAppSelector(state => state.persisted_app.app_description);
    // const [permissionResponse, requestPermission] = Audio.usePermissions();
    // const raw_contacts = useAppSelector(state => state.persisted_app.raw_contacts);
    const colorScheme = useColorScheme();
    const realm = useRealm();
    const { permissionResponse, ensureAudioPermission } = useAudioPermission();
    const lastLowStockReminderDateRef = useRef<string>("");
    const lastNoSalesReminderDateRef = useRef<string>("");
    const lastWeekendExpensesReminderDateRef = useRef<string>("");
    const contactNameByPhoneRef = useRef<Record<string, string>>({});

    useEffect(() => {
        const askPermission = async () => {
            // On attend que le hook soit prêt
            if (!permissionResponse) return;
            await ensureAudioPermission();
        };

        askPermission();
    }, [permissionResponse]); // ← déclenché seulement quand le hook est prêt

    useEffect(() => {
        dispatch(setTabVisibleMarketplace(true));
    }, []);

    const all_contacts = useQuery(
        UserContacts, ccs => {
            return ccs.filtered('phone_number != $0 && user_active != $1', user_data.phone_number, "0")
                .sorted('user_names', false);
        }, []);

    const messagesRead = useQuery(
        UsersMessages, msgs => {
            return msgs.filtered('receiver == $0 && message_read == $1', user_data.phone_number, 3)
        }, []);

    const messagesQueue = useQuery(
        UsersMessages, msgs => {
            return msgs.filtered('sender == $0 && message_read == $1', user_data.phone_number, 0)
        }, []);

    const messagesISent = useQuery(
        UsersMessages, msgs => {
            return msgs.filtered('sender == $0', user_data.phone_number)
        }, []);

    const messagesIReceived = useQuery(
        UsersMessages, msgs => {
            return msgs.filtered('receiver == $0', user_data.phone_number)
        }, []);

    const itemss = useQuery(
        UserBusinessArticles, items => {
            return items.filtered('uploaded == $0', 0)
        }, []);

    const itemssPrices = useQuery(
        ItemPrices, items => {
            return items.filtered('uploaded == $0', 0)
        }, []);

    const saless = useQuery(
        BusinessItemsSale, items => {
            return items.filtered('uploaded == $0', 0)
        }, []);

    const it = useQuery(
        UserBusinessArticles, items => {
            return items.filtered('phone_number == $0', user_data.phone_number)
        }, []);

    const businessArticles = useQuery(
        UserBusinessArticles, items => {
            return items.filtered('item_active == $0', 1);
        }, []);

    const businessesLocal = useQuery(UserBusinesses);
    const activeBusinessUsers = useQuery(
        BusinessUsers, users => {
            return users.filtered('user == $0 && user_active == $1', user_data.phone_number, 1);
        }, [user_data.phone_number]);

    const chattt = useQuery(UserChats);

    let SSS = [];

    const check_message_exists = (token: string, tag: number) => {
        let mm8 = tag === 0 ? messagesISent.filter(item => item.token === token) : messagesIReceived.filter(item => item.token === token);

        if (mm8.length > 0) {
            return true;
        }

        return false
    }

    // const RequestRecordPermission = async () => {
    //     try {
    //         // Vérifie si la permission n'est pas encore accordée
    //     if (permissionResponse?.status !== 'granted') {
    //         await requestPermission(); // on demande la permission ici
    //     }

    //     // Configuration iOS
    //     if (Platform.OS === 'ios') {
    //         await Audio.setAudioModeAsync({
    //             allowsRecordingIOS: true,
    //             playsInSilentModeIOS: true,
    //         });
    //     }

    //         if (Platform.OS === 'ios') {
    //             await Audio.setAudioModeAsync({
    //                 allowsRecordingIOS: true,
    //                 playsInSilentModeIOS: true,
    //             });
    //         }

    //     } catch (err) {
    //         console.error('Failed to start recording', err);
    //     }
    // }

    // const sendNotificationResponse = (data) => {
    //     const msg = JSON.parse(data);

    //     console.log(data)

    // const chatt = chattt.find(item => item._id === msg.sender+"p");

    // console.log(data);

    // let chat: TChat = {
    //     _id: msg.sender,
    //     phone_number: msg.sender,
    //     user: user_data.phone_number,
    //     type_chat: 0,
    //     last_message: msg.token,
    //     flag: 0,
    //     chat_read: 0,
    //     deleted: 0,
    //     chat_effect: 0,
    //     createdAt: moment().format(),
    //     updatedAt: moment().format(),
    // }

    // if(chatt !== undefined) {
    //     chat = {
    //         _id: chatt._id,
    //         phone_number: chatt.phone_number,
    //         user: chatt.user,
    //         type_chat: chatt.type_chat,
    //         last_message: msg.token,
    //         flag: chatt.flag,
    //         chat_read: 0,
    //         deleted: 0,
    //         chat_effect: chatt.chat_effect,
    //         createdAt: chatt.createdAt,
    //         updatedAt: moment().format(),
    //     }
    // }

    // const msgg: TMessage = {
    //     sender: msg.sender,
    //     receiver: msg.receiver,
    //     main_text_message: msg.main_text_message,
    //     message_type: msg.message_type,
    //     response_to: msg.response_to,
    //     message_read: 2,
    //     flag: msg.flag,
    //     message_effect: msg.message_effect,
    //     reactions: msg.reactions,
    //     token: msg.token,
    //     platform: msg.platform,
    //     deleted: 0,
    //     read_once: msg.read_once,
    //     alignment: msg.createdAt,
    //     createdAt: msg.createdAt,
    //     receivedAt: moment().format(),
    //     playedAt: msg.playedAt,
    //     readAt: msg.readAt,
    //     cc: msg.cc
    // }

    // // console.log(msg)

    // // msg.cc = moment(msg.createdAt).format('DD/MM/YYYY');
    // // msg.alignment = msg.createdAt;//moment().format();

    // realm.write(() => {
    //     try {
    //         realm.create('UsersMessages', msgg);
    //     // } catch (error) { }

    //     // try {
    //         realm.create('UserChats', chat, true);
    //     } catch (error) { }
    // });

    // SocketApp.emit("messageReceived", msgg);
    // }

    // for (let i in it) {

    //     const sss = useQuery(
    //         BusinessItemsSale, items => {
    //             return items.filtered('item_id == $0', it[i]._id)
    //         }, []);

    //     if (sss.length !== 0) {
    //         SSS.push({ sale_length: sss.length, item: it[i]._id });
    //     }
    // }

    // console.log(chats_badge)

    const itP = useQuery(
        ItemPrices, items => {
            return items.filtered('phone_number == $0', user_data.phone_number)
        }, []);

    const assemble = async () => {

        if (language_yambi !== '') {
            changeLanguage(language_yambi);
            dispatch(setLanguageApp(language_yambi));
        } else {
            const currentLang = strings.getLanguage();
            if (currentLang === "en" || currentLang === "fr" || currentLang === "sw_drc") {
                changeLanguage(currentLang);
                dispatch(setLanguageApp(currentLang));
            } else {
                changeLanguage("en");
                dispatch(setLanguageApp('en'));
            }
        }

        if (!theme_set) {
            if (colorScheme === 'light') {
                dispatch(setTheme(themes[0]));
            } else {
                dispatch(setTheme(themes[0]));
                // dispatch(setTheme(themes[3]));
            }
        }

        if (language_yambi === "fr" || language_yambi === "sw_drc") {
            moment.locale("fr");
        } else {
            moment.locale("en");
        }

        // await notifee.requestPermission();

        setRootViewBackgroundColor(app_theme.colors.background);
        // changeNavigationColors(app_theme.colors.background);
        NavigationBar.setBackgroundColorAsync(app_theme.colors.background);
        NavigationBar.setButtonStyleAsync(app_theme.dark ? "light" : "dark");

        // RequestRecordPermission();
    }

    // useEffect(() => {

    // }, []);

    // const loadContacts = () => {
    //     Contacts.getAll()
    //         .then(contacts => {
    //             const contacts_list: Array<TContact> = [];
    //             const namesByPhone: Record<string, string> = {};

    //             for (const contact of contacts) {
    //                 const phoneNumbers = contact?.phoneNumbers;
    //                 if (!Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
    //                     continue;
    //                 }

    //                 const displayName = (contact?.displayName ?? '').trim();
    //                 for (const phone of phoneNumbers) {
    //                     const rawNumber = phone?.number;
    //                     if (typeof rawNumber !== 'string' || !rawNumber.trim()) {
    //                         continue;
    //                     }

    //                     const normalizedNumber = removeWhiteSpaces(rawNumber);
    //                     if (!normalizedNumber) {
    //                         continue;
    //                     }

    //                     const contact_found: TContact = { displayName, phoneNumber: normalizedNumber };
    //                     contacts_list.push(contact_found);

    //                     if (displayName) {
    //                         namesByPhone[normalizedNumber] = displayName;
    //                     }
    //                 }
    //             }

    //             const all_contacts = removeDuplicateNumbers(contacts_list);
    //             contactNameByPhoneRef.current = namesByPhone;
    //             dispatch(setRawContacts(all_contacts));
    //             dispatch(setRawContactsPersisted(all_contacts));

    //             setTimeout(() => {
    //                 SocketApp.emit('update_contacts', all_contacts);
    //             }, 1000);
    //         })
    //         .catch(e => { });
    // }

    const normalizePhoneNumber = (phone: string) => {
        return phone.replace(/[^\d+]/g, '');
    };

    const buildDisplayName = (contact: any) => {
        return (
            contact?.displayName?.trim() ||
            [
                contact?.givenName,
                contact?.middleName,
                contact?.familyName,
            ]
                .filter(Boolean)
                .join(' ')
                .trim()
        );
    };

    const loadContacts = () => {
        Contacts.getAll()
            .then(contacts => {
                const contacts_list: Array<TContact> = [];
                const namesByPhone: Record<string, string> = {};

                for (const contact of contacts) {
                    const phoneNumbers = contact?.phoneNumbers;

                    if (!Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
                        continue;
                    }

                    const displayName = buildDisplayName(contact);

                    for (const phone of phoneNumbers) {
                        const rawNumber = phone?.number;

                        if (typeof rawNumber !== 'string' || !rawNumber.trim()) {
                            continue;
                        }

                        const normalizedNumber = normalizePhoneNumber(rawNumber);

                        if (!normalizedNumber) {
                            continue;
                        }

                        const contact_found: TContact = {
                            displayName,
                            phoneNumber: normalizedNumber,
                        };

                        contacts_list.push(contact_found);

                        if (displayName) {
                            namesByPhone[normalizedNumber] = displayName;
                        }
                    }
                }

                const all_contacts = removeDuplicateNumbers(contacts_list);

                contactNameByPhoneRef.current = namesByPhone;

                dispatch(setRawContacts(all_contacts));
                dispatch(setRawContactsPersisted(all_contacts));

                setTimeout(() => {
                    SocketApp.emit('update_contacts', all_contacts);
                }, 1000);
            })
            .catch(e => {
                console.log('LOAD CONTACTS ERROR', e);
            });
    };

    const Permissions_yambi = () => {
        // loadContacts();
        if (Platform.OS === 'android') {
            PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_CONTACTS, {
                title: 'Yambi contacts',
                message: 'Yambi wants to access your contacts to run properly',
                buttonPositive: 'Allow',
            })
                .then((res) => {
                    // console.log('Permission: ', res);

                    if (res === 'granted') {
                        loadContacts();
                    }
                })
                .catch((error) => {
                    // console.error('Permission error: ', error);
                });

            // PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.VIBRATE, {
            //     title: 'Vibrate',
            //     message: '',
            //     buttonPositive: 'Allow',
            // })https://www.mongodb.com/docs/atlas/device-sdks/sdk/react-native/model-data/data-types/collections/#limiting-query-results
            //     .then((res) => {
            //         // console.log('Permission: ', res);

            //         if (res === 'granted') {
            //             loadContacts();
            //         }
            //     })
            //     .catch((error) => {
            //         console.error('Permission error: ', error);
            //     });

            // PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, {
            //     title: 'Yambi Audio Record',
            //     message: 'Yambi wants to access your microphone to run properly',
            //     buttonPositive: 'Allow',
            // })
            //     .then((res) => {
            //         // console.log('Permission: ', res);

            //         // if (res === 'granted') {
            //         //     loadContacts();
            //         // }
            //     })
            //     .catch((error) => {
            //         console.error('Permission error: ', error);
            //     });

        } else {
            loadContacts();
        }

        // setTimeout(() => {
        //     async function createChannel() {
        //         await notifee.requestPermission();
        //         await notifee.createChannel({
        //             id: 'YambiNotificationId12345',
        //             name: 'YYambi',
        //             importance: AndroidImportance.HIGH,
        //             visibility: AndroidVisibility.PUBLIC
        //         });
        //     }
        // }, 5000);
    }

    const NewMessagesInsert = (msgs) => {
        realm.write(() => {
            msgs.forEach((msg) => {
                let chat: TChat = {
                    _id: msg.sender,
                    phone_number: msg.sender,
                    user: user_data.phone_number,
                    type_chat: 0,
                    last_message: msg.token,
                    flag: 0,
                    chat_read: 0,
                    deleted: 0,
                    chat_effect: 0,
                    createdAt: msg.createdAt,
                    updatedAt: msg.updatedAt,
                }

                const chatt = chattt.find(itemm => itemm._id === msg.sender);

                if (chatt !== undefined) {
                    chat = {
                        _id: chatt._id,
                        phone_number: chatt.phone_number,
                        user: chatt.user,
                        type_chat: chatt.type_chat,
                        last_message: msg.token,
                        flag: chatt.flag,
                        chat_read: 0,
                        deleted: 0,
                        chat_effect: chatt.chat_effect,
                        createdAt: msg.createdAt,
                        updatedAt: moment().format(),
                    }
                }

                // msg.cc = moment(msg.createdAt).format('DD/MM/YYYY');
                msg.alignment = moment().utc().toISOString();//moment().format();

                try {
                    // console.log(moment().format())
                    realm.create('UsersMessages', msg);
                    // } catch (error) { }

                    // try {
                    realm.create('UserChats', chat, true);
                } catch (error) { }

                // dispatch(setAddChatBadge(msg.sender));
            });

            // if (msgs[i].message_read === 2) {
            // if (!chats_badge.includes(msgs[i].sender)) {
            //     console.log("Can pass 3")

            // }
            // }
        })

        SocketApp.emit("messagesReceived", msgs);
    }

    const SocketIOTasks = async () => {
        // Example of an infinite loop task
        // const { delay } = taskDataArguments;
        // await new Promise( async (resolve) => {
        //     for (let i = 0; BackgroundService.isRunning(); i++) {
        //         console.log(i);
        //         await sleep(delay);
        //     }
        // });

        SocketApp.on('update_contacts', (contacts) => {
            // // console.log(raw_contacts)
            // if (contacts.length !== 0) {
            //     // dispatch(setContacts(contacts));
            //     realm.write(() => {
            //         for (let i in contacts) {
            //             const contact = raw_contacts.find(element => element.phoneNumber === contacts[i].phone_number);

            //             if(contact===null||contact===undefined){

            //             } else {
            //                 const cc = {
            //                     user_id: contacts[i].phone_number,
            //                     user_names: contacts[i].user_names,
            //                     phone_number: contacts[i].phone_number,
            //                     gender: contacts[i].gender + "",
            //                     birth_date: contacts[i].birth_date,
            //                     country: contacts[i].country,
            //                     user_profile: contacts[i].user_profile,
            //                     profession: contacts[i].profession,
            //                     bio: contacts[i].bio,
            //                     user_email: contacts[i].user_email,
            //                     user_address: contacts[i].user_address,
            //                     status_information: contacts[i].status_information,
            //                     user_password: contacts[i].user_password,
            //                     account_privacy: contacts[i].account_privacy + "",
            //                     account_valid: contacts[i].account_valid + "",
            //                     notification_token: contacts[i].notification_token,
            //                     createdAt: contacts[i].createdAt,
            //                     updatedAt: contacts[i].updatedAt
            //                 }

            //                     try {
            //                         realm.create('UserContacts', cc, true);
            //                     } catch (error) { };
            //             }
            //         }
            //     });
            // }

            // //             const filteredContacts = contacts.filter(contact => 
            // //                 !raw_contacts.includes(contact.phone_number)
            // //               );

            // // console.log(filteredContacts.length + " " +all_contacts.length + " " +raw_contacts.length);

            if (contacts.length !== 0) {
                for (let i in contacts) {
                    const contactFromServer = contacts[i];
                    const localContactName = contactNameByPhoneRef.current?.[contactFromServer.phone_number];
                    const contactToSave = localContactName
                        ? { ...contactFromServer, user_names: localContactName }
                        : contactFromServer;

                    realm.write(() => {
                        try {
                            realm.create('UserContacts', contactToSave, true);
                        } catch (error) { }
                    });
                }
            }
        });

        // SocketApp.on("send_assemble", () => {
        //     SocketApp.emit("assemble", user_data.phone_number);
        // });

        SocketApp.on('tellMeIfYouAreConnected' + user_data.phone_number, phone_number => {
            SocketApp.emit('yesImConnected', { phone2: user_data.phone_number, phone1: phone_number });
        });

        SocketApp.emit("assemble", user_data.phone_number);

        // SocketApp.on("room_message", () => {
        //     console.log('Room message');
        // });

        // SocketApp.on('newMessages', (messages) => {
        //     for (let i in messages) {
        //         const chat: TChat = {
        //             _id: messages[i].sender,
        //             phone_number: messages[i].sender,
        //             type_chat: 0,
        //             last_message: messages[i].token,
        //             flag: 0,
        //             chat_read: 0,
        //             deleted: 0,
        //             chat_effect: 0,
        //             createdAt: messages[i].createdAt,
        //             updatedAt: messages[i].updatedAt,
        //         }

        //         realm.write(() => {
        //             try {
        //                 realm.create('UsersMessages', messages[i]);
        //                 realm.create('UserChats', chat, true);
        //             } catch (error) { }
        //         });
        //         // console.log(contacts);
        //         SocketApp.emit("messageReceived", messages[i]);
        //     }

        //     realm.write(() => {
        //         try {
        //             realm.create('UsersMessages', messages[messages.length - 1], true);
        //         } catch (error) { }
        //     })
        // });

        const MessagesUpdatesInsert = (messages) => {
            if (messages.length > 0) {

                realm.write(() => {
                    messages.forEach((message) => {
                        if (check_message_exists(message.token, message.sender === user_data.phone_number ? 0 : 1)) {
                            const msg = {
                                sender: message.sender,
                                receiver: message.receiver,
                                main_text_message: message.main_text_message,
                                caption: message.caption,
                                message_type: message.message_type,
                                response_to: message.response_to,
                                message_read: message.message_read,
                                message_effect: message.message_effect,
                                reactions: message.reactions,
                                flag: message.flag,
                                read_once: message.read_once,
                                token: message.token,
                                deleted: message.deleted,
                                receivedAt: message.receivedAt,
                                // alignment: message.alignment, //|| moment().format(),
                                // createdAt: messages[i].createdAt,
                                playedAt: message.playedAt,
                                platform: message.platform,
                                readAt: '',
                            }

                            try {
                                realm.create('UsersMessages', msg, true);
                            } catch (error) { }
                        } else {
                            // setTimeout(() => {
                            //     SocketApp.emit("messagesReadWithoutResponse", [message]);
                            // }, 1000);

                            NewMessagesInsert(messages);
                        }
                    });
                });
            }
        }

        SocketApp.on('messagesUpdates' + user_data.phone_number, (messages) => {

            // console.log(check_message_exists(messages[0].sender, messages[0].receiver));

            // const mms = useQuery(UsersMessages, mm => { return mm.filtered('(sender == $0 && receiver == $1)', messages[0].sender, messages[0].receiver) }, []);

            // console.log(mms)

            // console.log("Updates" + messages.length)
            MessagesUpdatesInsert(messages);
        });

        SocketApp.on('messageUpdate' + user_data.phone_number, (message) => {
            MessagesUpdatesInsert([message]);
            // const msg = {
            //     sender: message.sender,
            //     receiver: message.receiver,
            //     main_text_message: message.main_text_message,
            //     caption: message.caption,
            //     message_type: message.message_type,
            //     response_to: message.response_to,
            //     message_read: message.message_read,
            //     message_effect: message.message_effect,
            //     reactions: message.reactions,
            //     flag: message.flag,
            //     read_once: message.read_once,
            //     token: message.token,
            //     deleted: message.deleted,
            //     receivedAt: message.receivedAt,
            //     // createdAt: message.createdAt,
            //     playedAt: message.playedAt,
            //     platform: message.platform,
            //     readAt: '',
            // }

            // if (check_message_exists(message.token, message.sender === user_data.phone_number ? 0 : 1)) {
            //     // console.log("Update required")
            //     realm.write(() => {
            //         try {
            //             realm.create('UsersMessages', msg, true);
            //             // console.log("Update/Create message called")
            //         } catch (error) { }
            //     });
            // } else {
            //     // console.log(message.main_text_message)
            //     // setTimeout(() => {
            //     //     SocketApp.emit("messagesReadWithoutResponse", [message]);
            //     // }, 1000);

            //     NewMessagesInsert([msg]);
            // }
        });

        SocketApp.on('messagesRead' + user_data.phone_number, (messages) => {
            if (messages.length > 0) {
                realm.write(() => {
                    messages.forEach((message) => {

                        if (check_message_exists(message.token, message.sender === user_data.phone_number ? 0 : 1)) {

                            // console.log("Update read required" + messages.length)

                            const msg = {
                                sender: message.sender,
                                receiver: message.receiver,
                                main_text_message: message.main_text_message,
                                caption: message.caption,
                                message_type: message.message_type,
                                response_to: message.response_to,
                                message_read: 4,
                                flag: message.flag,
                                message_effect: message.message_effect,
                                reactions: message.reactions,
                                token: message.token,
                                deleted: message.deleted,
                                read_once: message.read_once,
                                platform: message.platform,
                                receivedAt: message.receivedAt,
                                playedAt: message.playedAt,
                                readAt: message.readAt
                            }

                            // console.log(msg);

                            try {
                                realm.create('UsersMessages', msg, true);
                                // console.log("Update messages read called")
                            } catch (error) { }

                            if (message.sender === user_data.phone_number) {
                                SocketApp.emit("messagesReadWithoutResponse", [message]);
                            }
                        }
                    });
                });

                // setTimeout(() => {
                // SocketApp.emit("messagesReadWithoutResponse", messages);
                // }, 1000);
            }
        });

        SocketApp.on('messageSent' + user_data.phone_number, (message) => {
            const msg = {
                sender: message.sender,
                receiver: message.receiver,
                main_text_message: message.main_text_message,
                caption: message.caption,
                message_type: message.message_type,
                response_to: message.response_to,
                message_read: 1,
                flag: message.flag,
                message_effect: message.message_effect,
                reactions: message.reactions,
                token: message.token,
                platform: message.platform,
                deleted: message.deleted,
                read_once: message.read_once,
                createdAt: message.createdAt,
                receivedAt: '',
                playedAt: '',
                readAt: '',
                // cc: moment(messa.createdAt).format('DD/MM/YYYY')
            }

            realm.write(() => {
                try {
                    realm.create('UsersMessages', msg, true);
                    // console.log(msg)
                } catch (error) { }
            });
        });


        // Receive single message
        SocketApp.on('newMessage' + user_data.phone_number, (msg) => {
            NewMessagesInsert([msg]);
            // console.log("Received new message");

            // const chatt = chattt.find(item => item._id === msg.sender + "p");

            // // console.log(chatt);

            // let chat: TChat = {
            //     _id: msg.sender,
            //     phone_number: msg.sender,
            //     user: user_data.phone_number,
            //     type_chat: 0,
            //     last_message: msg.token,
            //     flag: 0,
            //     chat_read: 0,
            //     deleted: 0,
            //     chat_effect: 0,
            //     createdAt: moment().format(),
            //     updatedAt: moment().format(),
            // }

            // if (chatt !== undefined) {
            //     chat = {
            //         _id: chatt._id,
            //         phone_number: chatt.phone_number,
            //         user: chatt.user,
            //         type_chat: chatt.type_chat,
            //         last_message: msg.token,
            //         flag: chatt.flag,
            //         chat_read: 0,
            //         deleted: 0,
            //         chat_effect: chatt.chat_effect,
            //         createdAt: chatt.createdAt,
            //         updatedAt: moment().format(),
            //     }
            // }

            // const msgg: TMessage = {
            //     sender: msg.sender,
            //     receiver: msg.receiver,
            //     main_text_message: msg.main_text_message,
            //     caption: msg.caption,
            //     message_type: msg.message_type,
            //     response_to: msg.response_to,
            //     message_read: 2,
            //     flag: msg.flag,
            //     message_effect: msg.message_effect,
            //     reactions: msg.reactions,
            //     token: msg.token,
            //     platform: msg.platform,
            //     deleted: 0,
            //     read_once: msg.read_once,
            //     alignment: msg.createdAt,
            //     createdAt: msg.createdAt,
            //     receivedAt: moment().format(),
            //     playedAt: msg.playedAt,
            //     readAt: msg.readAt,
            //     cc: msg.cc
            // }

            // // console.log(msg)

            // // msg.cc = moment(msg.createdAt).format('DD/MM/YYYY');
            // // msg.alignment = msg.createdAt;//moment().format();

            // realm.write(() => {
            //     try {
            //         realm.create('UsersMessages', msgg);
            //         // } catch (error) { }

            //         // try {
            //         realm.create('UserChats', chat, true);
            //     } catch (error) { }
            // });

            // SocketApp.emit("messageReceived", msgg);
        });

        // Receive multiple messages
        SocketApp.on('newMessages' + user_data.phone_number, (msgs) => {
            // console.log(msgs);
            NewMessagesInsert(msgs);
        });



        SocketApp.on("salesChanged" + user_data.phone_number, sals => {

            const ssi = JSON.parse(sals);
            realm.write(() => {
                for (let i in ssi) {
                    const sal: TSale = {
                        _id: ssi[i]._id,
                        item_id: ssi[i].item_id,
                        business_id: ssi[i].business_id,
                        number: parseInt(ssi[i].number),
                        sale_operator: ssi[i].sale_operator,
                        sales_point_id: ssi[i].sales_point_id,
                        cost_price: ssi[i].cost_price,
                        selling_price: ssi[i].selling_price,
                        delivery_price: ssi[i].delivery_price,
                        delivery_address: ssi[i].delivery_address,
                        delivery_time: ssi[i].delivery_time,
                        delivery_status: parseInt(ssi[i].delivery_status),
                        discount_price: ssi[i].discount_price,
                        type_sale: parseInt(ssi[i].type_sale),
                        buyer_name: ssi[i].buyer_name,
                        buyer_phone: ssi[i].buyer_phone,
                        currency: ssi[i].currency,
                        country: ssi[i].country,
                        description: ssi[i].description,
                        agent_paid: ssi[i].agent_paid,
                        uploaded: 1,
                        sale_active: parseInt(ssi[i].sale_active),
                        createdAt: ssi[i].createdAt,
                        updatedAt: ssi[i].updatedAt
                    }


                    try {
                        realm.create('BusinessItemsSale', sal, true);
                    } catch (error) { }


                    SocketApp.emit('salesChanged', JSON.stringify({ phone_number: user_data.phone_number, item: sal._id }));

                    if (ssi[i].sale_operator !== user_data.phone_number) {
                        const new_badge: TBusinessBadge = {
                            business_id: ssi[i].business_id,
                            item_id: ssi[i].item_id,
                            sales_point_id: ssi[i].sales_point_id,
                            sale_id: ssi[i]._id,
                            seller: ssi[i].sale_operator
                        }

                        dispatch(setAddBusinessBadge(new_badge));
                    }
                }
            });
        })

        SocketApp.on("itemsChanged" + user_data.phone_number, (items) => {
            // console.log(items);

            // } else {
            // console.log("Items changed");
            // }


            try {
                realm.write(() => {
                    for (let i in items) {
                        // console.log(items[i])
                        // if(Number.isInteger(items[i].items_number_warehouse)) {
                        // console.log('yes');
                        const itemm: TItem = {
                            _id: items[i]._id,
                            business_id: items[i].business_id,
                            phone_number: items[i].phone_number,
                            item_name: items[i].item_name,
                            slogan: items[i].slogan,
                            item_type: parseInt(items[i].item_type),
                            category: items[i].category,
                            subcategory: items[i].subcategory,
                            manufacture_date: items.manufacture_date,
                            expiry_date: items.expiry_date,
                            wholesale_content_number: parseInt(items[i].wholesale_content_number),
                            items_number_stock: parseInt(items[i].items_number_stock),
                            items_number_warehouse: parseInt(items[i].items_number_warehouse),
                            description_item: items[i].description_item,
                            keywords: items[i].keywords,
                            images: items[i].images,
                            background: items[i].background,
                            supplier: items[i].supplier,
                            other_information: items[i].other_information,
                            alert_low_stock: items[i].alert_low_stock,
                            item_active: parseInt(items[i].item_active),
                            uploaded: 1,
                            createdAt: items[i].createdAt,
                            updatedAt: items[i].updatedAt,
                            colors: items[i].colors,
                            discount_percentage: items[i].discount_percentage,
                            discount_start_date: items[i].discount_start_date,
                            discount_end_date: items[i].discount_end_date,
                            marketplace_visibility: items[i].marketplace_visibility,
                            weights: items[i].weights,
                            sizes: items[i].sizes,
                            flag: items[i].flag,
                            is_best_seller: items[i].is_best_seller,
                            visibility_rank: items[i].visibility_rank,
                            is_featured: items[i].is_featured
                        }

                        try {
                            realm.create('UserBusinessArticles', itemm, true);
                        } catch (error) { //console.log(error + 'Ok')

                        }

                        SocketApp.emit('itemChanged', JSON.stringify({ phone_number: user_data.phone_number, item: itemm._id }))
                    }
                });
            } catch (error) {
                // console.log(error)
            }
        });

        SocketApp.on("pricesChanged" + user_data.phone_number, (prices) => {
            // console.log(items);

            // } else {
            //     console.log("No");
            // }

            try {
                realm.write(() => {
                    for (let i in prices) {
                        // console.log(prices[i])
                        // if(Number.isInteger(items[i].items_number_warehouse)) {
                        // console.log('yes');
                        const pricess: TItemPrices = {
                            _id: prices[i]._id,
                            item_id: prices[i].item_id,
                            phone_number: prices[i].phone_number,
                            wholesale_cost_price: prices[i].wholesale_cost_price,
                            wholesale_selling_price: prices[i].wholesale_selling_price,
                            retail_selling_price: prices[i].retail_selling_price,
                            uploaded: 1,
                            currency: parseInt(prices[i].currency)
                        }

                        try {
                            realm.create('ItemPrices', pricess, true);
                        } catch (error) { }

                        SocketApp.emit('pricesChanged', JSON.stringify({ phone_number: user_data.phone_number, item: prices[i]._id }));
                    }
                    // console.log(prices.length);
                });
            } catch (error) {
                // console.log(error)
            }
        });

        SocketApp.on("Stories", stories => {
            try {
                realm.write(() => {
                    for (let i in stories) {
                        const story: TStory = {
                            _id: stories[i]._id,
                            phone_number: stories[i].phone_number,
                            type_story: stories[i].type_story,
                            main_text: stories[i].main_text,
                            caption: stories[i].caption,
                            mentions: stories[i].mentions,
                            comments: stories[i].comments,
                            reactions: stories[i].reactions,
                            viewers: stories[i].viewers,
                            only_with: stories[i].only_with,
                            excluded: stories[i].excluded,
                            story_privacy: stories[i].story_privacy,
                            reposts: stories[i].reposts,
                            createdAt: stories[i].createdAt,
                            updatedAt: stories[i].updatedAt,
                            expiresAt: stories[i].expiresAt
                        }

                        try {
                            realm.create('Stories', story, true);
                        } catch (error) { }
                    }
                });
            } catch (error) {
                console.log(error)
            }
        });

        SocketApp.on("expensesChanged" + user_data.phone_number, (expenses) => {
            try {
                realm.write(() => {
                    for (let i in expenses) {
                        const expense = {
                            _id: expenses[i]._id,
                            title: expenses[i].title,
                            business_id: expenses[i].business_id,
                            sales_point_id: expenses[i].sales_point_id,
                            phone_number: expenses[i].phone_number,
                            amount: expenses[i].amount,
                            currency: parseInt(expenses[i].currency),
                            description: expenses[i].description,
                            category: parseInt(expenses[i].category),
                            payment_type: parseInt(expenses[i].payment_type),
                            debt: parseInt(expenses[i].debt),
                            expense_active: parseInt(expenses[i].expense_active),
                            wallet: parseInt(expenses[i].wallet),
                            uploaded: 1,
                            createdAt: expenses[i].createdAt,
                            updatedAt: expenses[i].updatedAt
                        }

                        try {
                            realm.create('Expenses', expense, true);
                        } catch (error) {
                            console.log(error);
                        }
                    }
                });
            } catch (error) {
                console.log(error);
            }
        });

        // SocketApp.on("addedToBusiness", bbus => {
        //     const business_userss = JSON.parse(bbus);
        //     // console.log(business_userss)
        //     for (let i in business_userss) {
        //         const business_user = {
        //             _id: business_userss[i]._id,
        //             business_id: business_userss[i].business_id,
        //             phone_number: business_userss[i].phone_number,
        //             sales_point_id: business_userss[i].sales_point_id,
        //             user: business_userss[i].user,
        //             level: business_userss[i].level,
        //             user_active: business_userss[i].user_active,
        //             createdAt: business_userss[i].createdAt,
        //             updatedAt: business_userss[i].updatedAt
        //         }

        //         realm.write(() => {
        //             try {
        //                 realm.create('BusinessUsers', business_user, true);
        //                 SocketApp.emit('addedBusinessUser', business_userss[i].user);
        //             } catch (error) { }
        //         });
        //     }
        // })

        // SocketApp.on('businessesAddedTo', bbs => {
        //     const bb = JSON.parse(bbs);
        //     // console.log(bb)
        //     for (let i in bb) {
        //         const new_business: TBusiness = {
        //             _id: bb[i]._id,
        //             phone_number: user_data.phone_number,
        //             business_name: bb[i].business_name,
        //             slogan: bb[i].slogan,
        //             description_service: bb[i].description_service,
        //             category: bb[i].category,
        //             keywords: bb[i].keywords,
        //             currency: bb[i].currency,
        //             logo: bb[i].logo,
        //             phones: bb[i].phones,
        //             emails: bb[i].emails,
        //             background: bb[i].background,
        //             national_number: bb[i].national_number,
        //             national_id: bb[i].national_id,
        //             business_active: bb[i].business_active,
        //             business_address: bb[i].business_address,
        //             business_visible: bb[i].business_visible,
        //             website: bb[i].website,
        //             other_links: bb[i].other_links,
        //             yambi: bb[i].yambi,
        //             valid_until: bb[i].valid_until,
        //             createdAt: bb[i].createdAt,
        //             updatedAt: bb[i].updatedAt
        //         }

        //         realm.write(() => {
        //             try {
        //                 realm.create('Businesses', new_business, true);
        //                 SocketApp.emit('businessAddedTo', bb[i]._id);
        //             } catch (error) { console.log(error) }
        //         });
        //     }
        // })

        // SocketApp.on('salesPointsAddedTo', spat => {
        //     const sales_points = JSON.parse(spat);
        //     for (let i in sales_points) {
        //         const new_sells_point: TSellsPoint = {
        //             _id: sales_points[i]._id,
        //             business_id: sales_points[i].business_id,
        //             sells_point_name: sales_points[i].sells_point_name,
        //             phone_number: user_data.phone_number,
        //             slogan: sales_points[i].slogan,
        //             description_service: sales_points[i].description_service,
        //             category: sales_points[i].category,
        //             keywords: sales_points[i].keywords,
        //             logo: sales_points[i].logo,
        //             phones: sales_points[i].phones,
        //             emails: sales_points[i].emails,
        //             background: sales_points[i].background,
        //             notifications: 0,
        //             sells_point_active: sales_points[i].sells_point_active,
        //             sells_point_address: sales_points[i].sells_point_address,
        //             sells_point_visible: sales_points[i].sells_point_visible,
        //             website: sales_points[i].website,
        //             other_links: sales_points[i].other_links,
        //             yambi: sales_points[i].yambi,
        //             createdAt: sales_points[i].createdAt,
        //             updatedAt: sales_points[i].updatedAt
        //         }

        //         realm.write(() => {
        //             try {
        //                 realm.create('SellsPoints', new_sells_point, true);
        //                 SocketApp.emit('salesPointAddedTo', new_sells_point._id);
        //             } catch (error) { console.log(error) }
        //         });
        //     }
        // })

        // setTimeout(() => {
        //     // console.log(raw_contacts);
        //     SocketApp.emit('update_contacts', raw_contacts);
        // }, 5000);

        // for (let i in messagesRead) {
        SocketApp.emit("messagesRead", messagesRead);
        // }

        for (let i in messagesQueue) {
            SocketApp.emit("newMessage", messagesQueue[i]);
        }

        SocketApp.on('youConnected', () => {
            // for (let i in messagesRead) {
            SocketApp.emit("messagesRead", messagesRead);
            // }

            SocketApp.emit("noticeMyContactsImConnected", { phone_number: user_data.phone_number, contacts: JSON.stringify(all_contacts) });

            for (let i in messagesQueue) {
                SocketApp.emit("newMessage", messagesQueue[i]);
            }

            SocketApp.emit("assemble", user_data.phone_number);

            SocketApp.emit("OnCheckStoriesUpdates", JSON.stringify({ phone_number: user_data.phone_number, contacts: all_contacts }));

            if (itemss.length > 0) {
                SocketApp.emit("newItems", JSON.stringify({ phone_number: user_data.phone_number, items: itemss }));
                // SocketApp.emit("newItems", JSON.stringify(itemss));
                // console.log("Sent 1");
            }

            if (saless.length > 0) {
                // SocketApp.emit("newSales", saless);
                SocketApp.emit("newSales", JSON.stringify({ phone_number: user_data.phone_number, items: saless }));
                // console.log("Sent 2");
            }

            if (itemssPrices.length > 0) {
                // SocketApp.emit("newItemPrices", itemssPrices);
                SocketApp.emit("newItemPrices", JSON.stringify({ phone_number: user_data.phone_number, items: itemssPrices }));

                // console.log("Sent 3");
            }

            // check_data();
        });
    };

    // const LaunchBackgroundServices = async () => {
    //     const options_background_task = {
    //         taskName: 'Yambi',
    //         taskTitle: 'Checking your activity...',
    //         taskDesc: 'You may have new messages, business notifications of any other important information',
    //         taskIcon: {
    //             name: 'ic_launcher',
    //             type: 'mipmap',
    //         },
    //         color: '#ff00ff',
    //         // linkingURI: 'yourSchemeHere://chat/jane', // See Deep Linking for more info
    //         // parameters: {
    //         //     delay: 1000,
    //         // },
    //         isForeground: true,
    //     };

    //     await BackgroundService.start(SocketIOTasks, options_background_task);
    //     await BackgroundService.updateNotification({ taskDesc: options_background_task.taskDesc }); // Only Android, iOS will ignore this call
    //     // iOS will also run everything here in the background until .stop() is called
    //     await BackgroundService.stop();
    // }

    useMemo(() => {

        SocketIOTasks();

    }, []);

    // const NotificationImportance=async()=>{
    //     if (Platform.OS === 'android') {
    //         await messaging().setNotificationChannel({
    //           channelId: 'default',
    //           name: 'Default',
    //           importance: messaging.AndroidImportance.HIGH,
    //         });
    //       }
    // }

    // const displayNotification = async (notification) => {
    // if (notification.data.type === 'default') {

    // await notifee.requestPermission();

    //   const soundsList = await NotificationSounds.getNotifications('notification');
    // console.log(soundsList);
    // const channelId = await notifee.createChannel({
    //     id: 'YambiNotificationId12345',
    //     name: 'YYambi',
    //     importance: AndroidImportance.HIGH,
    //     visibility: AndroidVisibility.PUBLIC
    // });

    // await notifee.displayNotification({
    //     title: 'Notification Title',
    //     body: 'Main body content of the notification',
    //     android: {
    //         // channelId,
    //         channelId: 'YambiNotificationId12345',
    //         importance: AndroidImportance.HIGH,
    //         visibility: AndroidVisibility.PUBLIC,
    //         // badge: true,
    //         smallIcon: 'ic_launcher', // optional, defaults to 'ic_launcher'.
    //         // pressAction is needed if you want the notification to open the app when pressed
    //         pressAction: {
    //             id: 'default',
    //         },
    //         actions: [
    //             {
    //                 pressAction: {
    //                     id: 'mark-as-read',
    //                 },
    //                 title: 'Mark as read',
    //             },
    //             {
    //                 pressAction: {
    //                     id: 'mark-as-read',
    //                 },
    //                 title: 'Allow chat',
    //             },
    //             {
    //                 pressAction: {
    //                     id: 'mark-as-read',
    //                 },
    //                 title: 'Receive',
    //             },
    //         ],
    //     },
    //     data: {
    //         customKey: { "customKey": "ok" }, // Custom data to pass on press
    //         screen: 'Signup', // Example screen to navigate to
    //     },
    // });
    // }

    //     await Notifications.scheduleNotificationAsync({
    //         content: {
    //             title: notification.data.title,
    //             body: notification.data.body,
    //             data: notification.data,
    //             categoryIdentifier: 'exampleCategory',
    //         },
    //         trigger: null, // Notification will appear after 5 seconds
    //     });
    // }

    // async function requestNotificationPermission() {
    //     const settings = await notifee.requestPermission();
    //     // if (settings.authorizationStatus === notifee.AuthorizationStatus.DENIED) {
    //     //   console.warn('Notification permissions are denied');
    //     // }

    //     console.log(settings)
    // }

    useEffect(() => {
        // setDefaultMessageSettingsData();
        // Listener for foreground notifications
        const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
            // console.log('Foreground notification:', notification);
            // Display notification details in the terminal

            // NewMessagesInsert([notification.request.content.data.message]);
        });

        // Listener for responses to notifications
        // const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
        //   console.log('Notification response:', response);
        //   // Handle notification response (e.g., log to the terminal or navigate)
        // });

        // Clean up the listeners when the component unmounts
        return () => {
            foregroundSubscription.remove();
            //   responseSubscription.remove();
        };
    }, []);

    useEffect(() => {
        // Handle app closed state
        const handleInitialNotification = async () => {
            const response = await Notifications.getLastNotificationResponseAsync();
            if (response) {
                const screen = response.notification.request.content.data?.screen;
                const rawUser = response.notification.request.content.data?.user;
                const inboxUser =
                    typeof rawUser === 'string'
                        ? rawUser
                        : rawUser &&
                            typeof rawUser === 'object' &&
                            typeof (rawUser as { phone_number?: string }).phone_number === 'string'
                            ? (rawUser as { phone_number: string }).phone_number
                            : '';

                if (screen === "AddExpense" && navigationRef.current) {
                    RootNavigation.navigate("AddExpense", {});
                } else if (screen && inboxUser) {
                    RootNavigation.navigate("Inbox", { user: inboxUser });
                }
            }
        };

        handleInitialNotification();

        // const foregroundSubscription = Notifications.addNotificationReceivedListener((notification) => {
        //     console.log("Notification received in foreground:", notification);
        //   });

        //   return foregroundSubscription.remove();

        // const handleNotif = () => {
        //     Notifications.addNotificationReceivedListener(notification => {
        //         console.log('Notification received:', notification);
        //     })
        // }

        // handleNotif();

    }, []);

    useEffect(() => {
        let cancelled = false;

        axios.post(remote_host + "/yambi/API/get_app_data")
            .then(res => {
                if (!cancelled && res.data?.success === "1") {
                    const appData = res.data?.app_data;
                    const remoteVersion: string | undefined = appData?.app_version_code;
                    const newerThanLocal =
                        !!remoteVersion &&
                        !!packagee.version &&
                        isRemoteAppVersionNewer(remoteVersion, packagee.version);

                    if (newerThanLocal) {
                        RootNavigation.navigate('UpdateYambi');
                    }
                }
            })
            .catch(() => { });

        return () => { cancelled = true; };
    }, [navigation]);

    useEffect(() => {
        // Check app version at startup (similar to AboutYambi.tsx)


        // requestNotificationPermission();

        // check_data();

        // SocketActivity();

        // const chat_exists = useObject(UserChats, "+250789023545");

        // setChat_id("+250789023545");
        // console.log(chats)

        // console.log(realm.cre)
        // DatabaseYambi();
        // setRootViewBackgroundColor("red");
        assemble();

        GetUserToken();
        // console.log(app_theme)

        // strings.setLanguageUpdateHook()
        // if(language_yambi)
        dispatch(setTitle(strings.chats));

        Permissions_yambi();

        createPersistedFolders();

        // messaging().onMessage(displayNotification);
        // messaging().setBackgroundMessageHandler(displayNotification);

        // messaging().onMessage(async remoteMessage => {

        //     console.log('Foreground message:', remoteMessage);
        //     displayNotification(remoteMessage);
        //     // Handle message here if needed
        // });

        // IMPORTANT START

        // Listen for messages when app is in background
        // messaging().setBackgroundMessageHandler(async (remoteMessage) => {

        //     console.log('Message handled in the background!', remoteMessage);
        //     displayNotification(remoteMessage);

        //     // SocketApp.emit("BackgroundCallReceived");

        //     // await notifee.displayNotification({
        //     //     title: remoteMessage.data.title,
        //     //     body: remoteMessage.data.body,
        //     //     android: {
        //     //       channelId: 'default',
        //     //       smallIcon: 'ic_launcher', // Ensure you have a small icon in your project
        //     //     },
        //     //   });
        // });

        //   const unsubscribe = notifee.onForegroundEvent(async ({ type, detail }) => {
        //     if (type === EventType.PRESS && detail.pressAction?.id === 'default') {
        //         // Retrieve custom data from notification
        //         const { customKey, screen } = detail.notification.data;

        //         console.log('Custom Key:', customKey); // "customValue"
        //         console.log('Navigate to screen:', screen); // e.g., "MessageScreen"

        //         // Navigate to the specified screen, if using React Navigation
        //         if (screen) {
        //             navigation.navigate(screen); // Adjust to your navigation structure
        //         }
        //     }
        // });

        //   // Listen for messages when app is in the foreground
        //   const unsubscribe = messaging().onMessage(async (remoteMessage) => {
        //     console.log('Foreground message received!', remoteMessage);
        //     displayNotification(remoteMessage);
        //   });

        //   // Handle notification open event (when notification is tapped)
        //   notifee.onForegroundEvent(({ type, detail }) => {
        //     if (type === EventType.PRESS && detail.pressAction?.id === 'mark-as-read') {
        //       const data = detail.notification.data;
        //       console.log('Notification tapped:', data);
        //       // Handle navigation or actions based on data
        //     }
        //   });

        //   return unsubscribe;

        // IMPORTANT ENDS






        // LaunchBackgroundServices();

        // console.log(user_data)

        // assemble_data(); !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!to be used

        // dispatch({ type: 'SET_MESSAGES_CHAT', payload: [{ ok: 'okok', pl: 'okok' }, { ok: 'okok', pl: 'okok' }] });
        // setTimeout(() => { console.log(messages_chat); }, 1500);

        // selectChatMessages();
        // dispatch({ type: 'SET_HOME_TAB', payload: 1 });
        // connectSocket();
        // setTimeout(() => {
        //   // this.findUserMessages(user_data[0].phone_number);
        //   collectNotReadMessages(user_data.phone_number);
        //   collectPresavedMessages(user_data.phone_number);
        // }, 1500);

        // setInterval(() => { sendPresavedMessages(); }, 2000);
        // setInterval(() => { findMessagesStatus(); }, 1200);

        // console.log(presaved_messages_users);

        // KeyboardRegistry.registerKeyboard('YambiEmojis', () => YambiEmojis);
        // KeyboardRegistry.registerKeyboard('YambiEmojisKeyboard', () => YambiEmojiKeyboard);
        // AppRegistry.registerHeadlessTask('ReactNativeFirebaseMessagingHeadlessTask', (m) => messaging().setBackgroundMessageHandler);


        // return () => {
        //     //   Realm.close(() => {
        //     //     console.log("Database closed");
        //     //   });
        //     // BackgroundService.stop();
        // };

        // global.notificationFunction = sendNotificationResponse;

        const requestPermissions = async () => {
            // const { status } = await Notifications.requestPermissionsAsync();
            // if (status !== 'granted') {
            //     // console.log('Permission Required', 'You need to enable notifications in your settings.');
            // }

            try {
                const { status } = await Notifications.getPermissionsAsync();
                if (status !== 'granted') {
                    const { status: newStatus } = await Notifications.requestPermissionsAsync();
                    if (newStatus !== 'granted') {
                        console.log('Notification permissions not granted');
                    }
                }
            } catch (error) {
                console.log(error);
            }
        };

        // useEffect(()=> {
        requestPermissions();
        // },[]);

        // Schedule daily expense reminder notification
        const scheduleDailyExpenseReminder = async () => {
            try {
                // Only schedule if notifications are enabled
                if (!app_description.enable_expense_reminder_notifications) {
                    // Cancel any existing notifications if disabled
                    const allNotifications = await Notifications.getAllScheduledNotificationsAsync();
                    for (const notification of allNotifications) {
                        if (notification.identifier === 'daily-expense-reminder') {
                            await Notifications.cancelScheduledNotificationAsync('daily-expense-reminder');
                        }
                    }
                    return;
                }

                // Cancel any existing expense reminder notifications
                const allNotifications = await Notifications.getAllScheduledNotificationsAsync();
                for (const notification of allNotifications) {
                    if (notification.identifier === 'daily-expense-reminder') {
                        await Notifications.cancelScheduledNotificationAsync('daily-expense-reminder');
                    }
                }

                // Get user name for personalized message
                const userName = user_data.user_names || "";

                // Create personalized body message
                let bodyMessage = strings.expense_reminder_body || "Remember to enter your daily expenses to keep track of your spending.";
                if (userName && strings.expense_reminder_body_with_name) {
                    bodyMessage = strings.expense_reminder_body_with_name.replace("{name}", userName);
                }

                // Schedule daily notification at 10 AM
                await Notifications.scheduleNotificationAsync({
                    identifier: 'daily-expense-reminder',
                    content: {
                        title: strings.expense_reminder_title || "Don't forget your expenses!",
                        body: bodyMessage,
                        data: {
                            screen: 'AddExpense'
                        },
                        sound: true,
                    },
                    trigger: {
                        type: SchedulableTriggerInputTypes.DAILY,
                        hour: 10,
                        minute: 0,
                    },
                });
            } catch (error) {
                console.log("Error scheduling expense reminder:", error);
            }
        };

        scheduleDailyExpenseReminder();

        // Listener for received notifications
        // console.log('Setting up notification received listener');
        // const subscription = Notifications.addNotificationReceivedListener(notification => {
        //     console.log('Notification received:', notification);
        // });

        const requestPermissionMessaging = async () => {
            const authStatus = await messaging().requestPermission();
            const enabled =
                authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                authStatus === messaging.AuthorizationStatus.PROVISIONAL;

            if (enabled) {
                // console.log('Authorization status:', authStatus);
            }
        };

        requestPermissionMessaging();

        // Listen for foreground notifications
        //   const unsubscribe = messaging().onMessage(async remoteMessage => {
        //     // console.log('Foreground notification received:', remoteMessage);
        //     Alert.alert('New Notification', remoteMessage.notification?.title || 'No Title');
        //   });

        //   const foregroundListener = Notifications.addNotificationReceivedListener((notification) => {
        //     console.log('Notification received in foreground:', notification);
        //   });

        const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
            const notificationData = response.notification.request.content.data;
            const screen = notificationData?.screen;

            // Handle expense reminder notification
            if (screen === "AddExpense" && navigationRef.current) {
                RootNavigation.navigate("AddExpense", {});
                return;
            }

            // Handle other notifications (messages, etc.)
            if (notificationData?.message) {
                try {
                    const raw = notificationData.message;
                    if (typeof raw !== 'string') {
                        return;
                    }
                    const user = notificationData.user || {};
                    const msg = JSON.parse(raw);
                    // const data = response.notification.request.content;

                    // console.log(response);
                    // console.log("User interacted with notification:", response);

                    // Parse the actions if they exist
                    // const actions = data.actions ? JSON.parse(data.actions) : [];

                    // if (response.actionIdentifier === 'reply') {
                    //   Alert.alert('Action Triggered', 'Reply action was triggered!');
                    // } else if (response.actionIdentifier === 'markAsRead') {
                    //   Alert.alert('Action Triggered', 'Mark as Read action was triggered!');
                    // } else {
                    //   console.log('Notification tapped without specific action');
                    // }

                    // console.log(notification_index);

                    // console.log('Parsed Actions:', actionIdentifier); // Optional: Debug parsed actions

                    const inboxUser =
                        typeof user === 'string'
                            ? user
                            : user &&
                                typeof user === 'object' &&
                                typeof (user as { phone_number?: string }).phone_number === 'string'
                                ? (user as { phone_number: string }).phone_number
                                : '';

                    if (screen && navigationRef.current && inboxUser) {
                        RootNavigation.navigate("Inbox", { user: inboxUser });
                    }
                } catch (error) {
                    console.log("Error parsing notification data:", error);
                }
            }

            Notifications.getLastNotificationResponseAsync().then((response) => {
                if (response?.notification) {
                    const screen = response.notification.request.content.data?.screen;
                    if (screen === "AddExpense" && navigationRef.current) {
                        RootNavigation.navigate("AddExpense", {});
                    } else if (screen && navigationRef.current) {
                        const rawUser = response.notification.request.content.data?.user;
                        const inboxUser =
                            typeof rawUser === 'string'
                                ? rawUser
                                : rawUser &&
                                    typeof rawUser === 'object' &&
                                    typeof (rawUser as { phone_number?: string }).phone_number === 'string'
                                    ? (rawUser as { phone_number: string }).phone_number
                                    : '';
                        if (inboxUser) {
                            RootNavigation.navigate("Inbox", { user: inboxUser });
                        }
                    }
                }
            });

            // RootNavigation.navigate("Signup");

        });

        //   return unsubscribe;

        // Cleanup the listener
        return () => {
            // subscription.remove();
            responseListener.remove();
            // foregroundListener.remove();
        };
    }, []);

    // Reschedule expense reminder when setting changes
    useEffect(() => {
        const scheduleDailyExpenseReminder = async () => {
            try {
                // Only schedule if notifications are enabled
                if (!app_description.enable_expense_reminder_notifications) {
                    // Cancel any existing notifications if disabled
                    const allNotifications = await Notifications.getAllScheduledNotificationsAsync();
                    for (const notification of allNotifications) {
                        if (notification.identifier === 'daily-expense-reminder') {
                            await Notifications.cancelScheduledNotificationAsync('daily-expense-reminder');
                        }
                    }
                    return;
                }

                // Cancel any existing expense reminder notifications
                const allNotifications = await Notifications.getAllScheduledNotificationsAsync();
                for (const notification of allNotifications) {
                    if (notification.identifier === 'daily-expense-reminder') {
                        await Notifications.cancelScheduledNotificationAsync('daily-expense-reminder');
                    }
                }

                // Get user name for personalized message
                const userName = user_data.user_names || "";

                // Create personalized body message
                let bodyMessage = strings.expense_reminder_body || "Remember to enter your daily expenses to keep track of your spending.";
                if (userName && strings.expense_reminder_body_with_name) {
                    bodyMessage = strings.expense_reminder_body_with_name.replace("{name}", userName);
                }

                // Schedule daily notification at 10 AM
                await Notifications.scheduleNotificationAsync({
                    identifier: 'daily-expense-reminder',
                    content: {
                        title: strings.expense_reminder_title || "Don't forget your expenses!",
                        body: bodyMessage,
                        data: {
                            screen: 'AddExpense'
                        },
                        sound: true,
                    },
                    trigger: {
                        type: SchedulableTriggerInputTypes.DAILY,
                        hour: 10,
                        minute: 0,
                    },
                });
            } catch (error) {
                console.log("Error scheduling expense reminder:", error);
            }
        };

        scheduleDailyExpenseReminder();
    }, [app_description.enable_expense_reminder_notifications, user_data.user_names]);

    // Daily low-stock reminder at 10:00 AM (sent once per day when low-stock items exist).
    useEffect(() => {
        const maybeSendLowStockReminder = async () => {
            try {
                const now = new Date();
                const todayKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;

                // We only send at/after 10:00 and never more than once per day.
                if (now.getHours() < 10 || lastLowStockReminderDateRef.current === todayKey) {
                    return;
                }

                const lowStockItems = Array.from(businessArticles as any).filter((item: any) => {
                    const quantity = Number(item.items_number_stock ?? 0);
                    const threshold = Number(item.alert_low_stock ?? 0);
                    return threshold > 0 && quantity > 0 && quantity <= threshold;
                });

                if (lowStockItems.length === 0) return;

                const businessNameById = new Map<string, string>();
                Array.from(businessesLocal as any).forEach((business: any) => {
                    businessNameById.set(business._id, business.business_name);
                });

                const grouped: Record<string, string[]> = {};
                lowStockItems.forEach((item: any) => {
                    if (!grouped[item.business_id]) grouped[item.business_id] = [];
                    grouped[item.business_id].push(item.item_name);
                });

                const businessLines = Object.keys(grouped).map((businessId) => {
                    const businessName = businessNameById.get(businessId) || businessId;
                    const itemNames = grouped[businessId];
                    const preview = itemNames.slice(0, 5).join(", ");
                    const remaining = itemNames.length - 5;
                    const remainingText = remaining > 0
                        ? ` (${strings.and_more_items.replace('{count}', remaining.toString())})`
                        : "";
                    return `${businessName}: ${preview}${remainingText}`;
                });

                const body = `${strings.low_stock_reminder_intro} ${businessLines.join(" | ")}`.slice(0, 500);

                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: strings.low_stock_reminder_title,
                        body,
                        data: {},
                        sound: true,
                    },
                    trigger: null,
                });

                lastLowStockReminderDateRef.current = todayKey;
            } catch (error) {
                console.log("Error sending low stock reminder:", error);
            }
        };

        const interval = setInterval(() => {
            maybeSendLowStockReminder();
        }, 60 * 1000);

        const appStateSubscription = AppState.addEventListener("change", (state) => {
            if (state === "active") {
                maybeSendLowStockReminder();
            }
        });

        maybeSendLowStockReminder();

        return () => {
            clearInterval(interval);
            appStateSubscription.remove();
        };
    }, [businessArticles, businessesLocal, language_yambi]);

    // Daily midday reminders:
    // - Weekdays: if user has active businesses and no sales recorded yet, remind to record sales.
    // - Weekends: remind to record expenses.
    useEffect(() => {
        const maybeSendMiddayReminders = async () => {
            try {
                const now = new Date();
                const todayKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;

                // Trigger at/after 12:00 PM only.
                if (now.getHours() < 12) return;

                const day = now.getDay(); // 0 = Sunday, 6 = Saturday
                const isWeekend = day === 0 || day === 6;

                if (isWeekend) {
                    if (lastWeekendExpensesReminderDateRef.current === todayKey) return;

                    await Notifications.scheduleNotificationAsync({
                        content: {
                            title: strings.weekend_expenses_reminder_title,
                            body: strings.weekend_expenses_reminder_body,
                            data: {},
                            sound: true,
                        },
                        trigger: null,
                    });

                    lastWeekendExpensesReminderDateRef.current = todayKey;
                    return;
                }

                if (lastNoSalesReminderDateRef.current === todayKey) return;

                const activeBusinessIds = Array.from(activeBusinessUsers as any)
                    .map((u: any) => u.business_id)
                    .filter((id: string) => !!id);

                if (activeBusinessIds.length === 0) return;

                const startOfToday = new Date();
                startOfToday.setHours(0, 0, 0, 0);
                const endOfToday = new Date();
                endOfToday.setHours(23, 59, 59, 999);

                const hasSaleToday = Array.from(saless as any).some((sale: any) => {
                    if (!activeBusinessIds.includes(sale.business_id)) return false;
                    if (sale.sale_active !== 1) return false;
                    const createdAt = new Date(sale.createdAt);
                    if (Number.isNaN(createdAt.getTime())) return false;
                    return createdAt >= startOfToday && createdAt <= endOfToday;
                });

                if (hasSaleToday) return;

                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: strings.no_sales_midday_reminder_title,
                        body: strings.no_sales_midday_reminder_body,
                        data: {},
                        sound: true,
                    },
                    trigger: null,
                });

                lastNoSalesReminderDateRef.current = todayKey;
            } catch (error) {
                console.log("Error sending midday reminders:", error);
            }
        };

        const interval = setInterval(() => {
            maybeSendMiddayReminders();
        }, 60 * 1000);

        const appStateSubscription = AppState.addEventListener("change", (state) => {
            if (state === "active") {
                maybeSendMiddayReminders();
            }
        });

        maybeSendMiddayReminders();

        return () => {
            clearInterval(interval);
            appStateSubscription.remove();
        };
    }, [activeBusinessUsers, saless, language_yambi]);

    // const animationApp =()=> {
    //     let value:string = '';
    //     if(Platform.OS === 'android') {
    //         value = 'fade_from_bottom';
    //     } else {
    //         value = 'ios';
    //     }

    //     return value;
    // }

    // const Update_user_data=()=>{
    //     axios.post(remote_host + '/yambi/API/signup', {
    //         names: names,
    //         phone_number: code + "" + phone_number,
    //         gender: gender ? 1 : 0,
    //         country: code_country,
    //         contacts: raw_contacts
    //         // headers: {
    //         //     Accept: 'application/json',
    //         //     'Content-Type': 'application/json',
    //         // },
    //         // body: JSON.stringify({
    //         //     names: names,
    //         //     phone_number: code + "" + phone_number,
    //         //     gender: gender,
    //         //     country: code_country,
    //         //     contacts: raw_contacts
    //         // }),
    //    })
    //         .then(response => {

    //                   realm.write(() => {
    //                        try {
    //                             realm.create('UserData', user_assemble_data, true);
    //                        } catch (error) { }
    //                   });

    //             //  setProfile("");

    //              // console.log(response.data)

    //         })
    //         .catch((error) => {
    //              // Alert.alert(strings.error, strings.connection_failed);
    //             //  console.log(error)
    //             //  setLoading_profile(false);

    //         });
    // }

    const GetUserToken = async () => {
        // Register the device with FCM

        // async function requestUserPermission() {
        const authStatus = await messaging().requestPermission();
        const enabled =
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
            // console.log('Authorization status:', authStatus);
        }
        //   }
        await messaging().registerDeviceForRemoteMessages();

        // Get the token
        const token = await messaging().getToken();

        // console.log(token);

        // if (token !== user_data.notification_token) {
        const user_assemble_data: TUser = {
            user_id: user_data.user_id,
            user_names: user_data.user_names,
            phone_number: user_data.phone_number,
            gender: user_data.gender || 0,
            birth_date: user_data.birth_date,
            country: user_data.country,
            user_profile: user_data.user_profile,
            profession: user_data.profession,
            bio: user_data.bio,
            user_email: user_data.user_email,
            user_address: user_data.user_address,
            status_information: user_data.status_information,
            user_password: user_data.user_password,
            account_privacy: user_data.account_privacy || 0,
            user_verified: user_data.user_verified || 0,
            user_verified_at: user_data.user_verified_at || "",
            user_level: user_data.user_level || 0,
            user_active: user_data.user_active || 1,
            notification_token: token,
            createdAt: user_data.createdAt,
            updatedAt: user_data.updatedAt
        }

        await axios.post(remote_host + '/yambi/API/update_user_data', {
            assemble: user_assemble_data
        })
            .then(response => {

                // console.log(response.data);

                if (response.data.success === "1") {
                    realm.write(() => {
                        try {
                            realm.create('UserData', user_assemble_data, true);
                        } catch (error) { }
                    });

                    dispatch(updateUser(user_assemble_data));
                }
            })
            .catch((error) => { });
        // }

    }

    // Deep linking configuration
    const linking: LinkingOptions<RootStackParamList> = {
        prefixes: ['yambi://', 'https://app.yambi.net'],
        config: {
            screens: {
                Post: 'post/:id',
                BusinessItem: 'item/:item_id',
                BusinessItems: 'business/:business_id'
            }
        }
    };

    return (
        <SafeAreaProvider style={{ flex: 1 }}>
            <KeyboardRootView>
                <NavigationContainer
                    linking={linking}
                    onReady={() => RNBootSplash.hide({ fade: true })}
                    ref={navigationRef}>
                    <Stack.Navigator
                        id="RootStack"
                        // {user_session_exists ? initialRouteName="home" : initialRouteName="signup"}
                        initialRouteName={user_data.user_id === "0" ? 'SplashStartYambi' : 'Home'}>
                        <Stack.Screen name="Signup" options={{
                            headerShown: false,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                        }} component={Signup} />
                        {/* <Stack.Screen name="Signin" options={{ headerShown: false, presentation: 'transparentModal' }} component={Signin} /> */}
                        {/* <Stack.Screen name="keyboard" options={{ headerShown: false }} component={KeyboardInput} /> */}
                        <Stack.Screen name="Themes" options={{
                            headerShadowVisible: false,
                            headerShown: true, headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1,
                            },
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: strings.select_theme
                        }} component={Themes} />

                        <Stack.Screen name="NewGroup" options={{
                            headerShadowVisible: false,
                            headerShown: true, headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1,
                            },
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: strings.new_group
                        }} component={NewGroup} />

                        <Stack.Screen name="Home" options={{
                            headerShadowVisible: false,
                            headerBackVisible: false,
                            // navigationBarColor: app_theme.colors.background,
                            // statusBarHidden:false,
                            headerTitleAlign: 'left',
                            // headerBackTitle: '',
                            headerBackButtonDisplayMode: 'minimal',
                            headerBackButtonMenuEnabled: false,
                            headerShown: false, headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1,
                            },
                            headerTitleStyle: {
                                fontSize: app_description.home_title_font_size,
                                fontWeight: app_description.home_title_font_weight as any,
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            // animation: 'fade',
                            // headerRight: () => (
                            //     <HeaderRightHome />
                            // ),
                            // headerLeft: () => (
                            //     <HeaderHome />
                            // ),
                            // title: ""
                        }} component={HomeRootStack} />

                        <Stack.Screen name="Inbox"
                            options={({ navigation, route }) => ({
                                headerShadowVisible: false,
                                headerBackVisible: true,
                                headerShown: false,
                                headerTransparent: false,
                                headerTitle: '',
                                headerStyle: {
                                    backgroundColor: app_theme.colors.design_tip1,
                                },
                                headerTintColor: app_theme.colors.text_design1,
                                headerTitleStyle: {
                                    fontSize: app_description.inbox_title_size,
                                    fontWeight: app_description.inbox_title_font_weight as any,
                                },
                                headerLeftContainerStyle: {
                                    flex: 1,
                                    // maxWidth: '82%',
                                },
                                headerRightContainerStyle: {
                                    flexShrink: 0,
                                    alignItems: 'flex-end',
                                },
                                animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                                // headerRight: (props) => (
                                //     <HeaderRightInbox {...props} navigation={navigation} route={route} />
                                // ),
                                // headerLeft: (props) => (
                                //     <HeaderInbox {...props} navigation={navigation} route={route} />
                                // ),
                                gestureEnabled: true,
                            })} component={Inbox} />

                        {/* <Stack.Screen name="profile" options={{ headerShown: false }} component={ProfileYambi} /> */}
                        {/* <Stack.Screen name="contacts" component={ContactsUser} options={{ headerShown: false }} /> */}
                        <Stack.Screen name="NewChat" component={NewChat} options={{
                            headerShadowVisible: false,
                            headerShown: true, headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: strings.contacts + "  (" + all_contacts.length + ")",
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            },
                            headerRight: () => (
                                <HeaderRightNewChat />
                            ),
                        }} />

                        <Stack.Screen name="Business" component={Business} options={({ navigation, route }) => ({
                            headerShadowVisible: false,
                            headerShown: true, headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1,
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: strings.business,
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            },
                            headerRight: (props) => (
                                <HeaderBusiness {...props} navigation={navigation} route={route} />
                            ),
                        })} />

                        <Stack.Screen name="BusinessViewModern" component={BusinessViewModern} options={({ navigation, route }) => ({
                            headerShadowVisible: false,
                            headerShown: true, headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1,
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: route.params?.business?.business_name || strings.business,
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            },
                        })} />

                        <Stack.Screen name="BusinessModern" component={BusinessModern} options={{
                            headerShadowVisible: false,
                            headerShown: true,
                            headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1,
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: strings.business,
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            },
                        }} />

                        <Stack.Screen name="NewBusinessItem" component={NewBusinessItem} options={{
                            headerShadowVisible: false,
                            headerShown: true, headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: strings.add_item,
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            },
                        }} />

                        <Stack.Screen name="NewSalesPoint" component={NewSalesPoint} options={{
                            headerShadowVisible: false,
                            headerShown: true, headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: strings.new_sales_point,
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            }
                        }} />

                        <Stack.Screen name="AddItemSale" component={AddItemSale} options={{
                            headerShadowVisible: false,
                            headerShown: true, headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            }
                        }} />

                        <Stack.Screen name="BusinessItem" component={BusinessItem} options={{
                            headerShadowVisible: false,
                            headerShown: true, headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            }
                        }} />

                        <Stack.Screen name="Cart" component={Cart} options={({ navigation, route }) => ({
                            headerShadowVisible: false,
                            headerShown: true, headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: strings.cart,
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            },
                            headerRight: (props) => (
                                <HeaderCart {...props} navigation={navigation} route={route} />
                            ),
                        })} />

                        <Stack.Screen name="SearchMarketplace" component={SearchMarketplace} options={({ navigation, route }) => ({
                            headerShadowVisible: false,
                            headerShown: false, headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: strings.search_marketplace,
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            }
                        })} />

                        <Stack.Screen name="BusinessItems" component={BusinessItemss} options={({ navigation, route }) => ({
                            headerShadowVisible: false,
                            headerShown: true, headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: strings.items,
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            },
                            headerRight: (props) => (
                                <HeaderBusinessItems {...props} navigation={navigation} route={route} />
                            ),
                        })} />

                        <Stack.Screen name="BusinessSales" component={SalesModern} options={{
                            headerShadowVisible: false,
                            headerShown: true, headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: strings.sales,
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            }
                        }} />

                        <Stack.Screen name="ItemSales" component={ItemSales} options={{
                            headerShadowVisible: false,
                            headerShown: true, headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: strings.sales,
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            }
                        }} />

                        <Stack.Screen name="SettingsYambi" component={SettingsYambi} options={({ navigation, route }) => ({
                            headerShadowVisible: false,
                            headerShown: false, headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            // animation: 'fade',
                            // animationDuration: 500,
                            // animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: strings.settings,
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            },
                            // headerRight: (props) => (
                            //     <HeaderSettings  {...props} navigation={navigation} route={route} />
                            // ),
                        })} />
                        <Stack.Screen name="Languages" component={Languages} options={{
                            headerShadowVisible: false,
                            headerShown: true, headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: strings.select_language,
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            },
                        }} />

                        <Stack.Screen name="AboutYambi" component={AboutYambi} options={{
                            headerShadowVisible: false,
                            headerShown: true, headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: strings.about_yambi,
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            },
                        }} />

                        <Stack.Screen name="MakeDonation" component={MakeDonation} options={{
                            headerShadowVisible: false,
                            headerShown: true, headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: strings.support_the_project || strings.make_donation,
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            },
                        }} />

                        <Stack.Screen name="AddBusinessSubscription" component={AddBusinessSubscription} options={{
                            headerShadowVisible: false,
                            headerShown: true, headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: strings.renew_subscription || "Renew Subscription",
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            },
                        }} />

                        <Stack.Screen name="BusinessSubscriptionPlans" component={BusinessSubscriptionPlans} options={{
                            headerShadowVisible: false,
                            headerShown: true, headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: (strings as any).subscription_plans || "Subscription Plans",
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            },
                        }} />

                        <Stack.Screen name="SelectPaymentType" component={SelectPaymentType} options={{
                            headerShadowVisible: false,
                            headerShown: true,
                            headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: (strings as any).select_payment_method || "Payment method",
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            },
                        }} />

                        <Stack.Screen name="SubscriptionHistory" component={SubscriptionHistory} options={{
                            headerShadowVisible: false,
                            headerShown: true, headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: (strings as any).subscription_history || "Subscription History",
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            },
                        }} />

                        <Stack.Screen name="ShareBusiness" component={ShareBusiness} options={({ route }) => ({
                            headerShadowVisible: false,
                            headerShown: true,
                            headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1,
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title:
                                route.params?.share_kind === 'item'
                                    ? route.params?.item_name || strings.share_item
                                    : route.params?.business_name || strings.share_business,
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            },
                        })} />

                        <Stack.Screen name="BusinessInventoryMovementHistory" component={BusinessInventoryMovementHistory} options={{
                            headerShadowVisible: false,
                            headerShown: true,
                            headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: strings.inventory_movement_history,
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            },
                        }} />

                        <Stack.Screen name="InventoryMovement" component={InventoryMovement} options={{
                            headerShadowVisible: false,
                            headerShown: true,
                            headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: strings.inventory_movement,
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            },
                        }} />

                        <Stack.Screen name="UpdateYambi" component={UpdateYambi} options={{
                            headerShadowVisible: false,
                            headerShown: true, headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: strings.update_yambi,
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            },
                        }} />

                        <Stack.Screen name="PictureMessage" component={SendPictureMessage} options={{
                            headerShadowVisible: false,
                            headerShown: true, headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: 'slide_from_bottom',
                            title: strings.select_picture,
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            },
                        }} />

                        <Stack.Screen name="EditProfile" component={EditProfile} options={{
                            headerShadowVisible: false,
                            headerShown: true, headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: strings.edit_profile,
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            },
                        }} />

                        <Stack.Screen name="ViewFullInboxImage" component={ViewFullInboxImage} options={{
                            headerShadowVisible: false,
                            headerShown: true, headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: strings.picture,
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            },
                        }} />

                        <Stack.Screen name="NewBusiness" component={NewBusinesses} options={{
                            headerShadowVisible: false,
                            headerShown: true, headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: strings.new_business,
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            },
                        }} />

                        <Stack.Screen name="NewBusinessUser" component={NewBusinessUser} options={{
                            headerShadowVisible: false,
                            headerShown: true, headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: strings.new_business_user,
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            },
                        }} />

                        <Stack.Screen name="EditBusinessItem" component={EditBusinessItem} options={({ navigation, route }) => ({
                            headerShadowVisible: false,
                            headerShown: true, headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: strings.edit_item,
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            },
                            headerRight: (props) => (
                                <HeaderEditBusinessItem {...props} navigation={navigation} route={route} />
                            ),
                        })} />

                        <Stack.Screen name="RenewStock" component={RenewStock} options={{
                            headerShadowVisible: false,
                            headerShown: true,
                            headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1,
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: strings.renew_stock,
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            },
                        }} />

                        <Stack.Screen name="EditBusiness" component={EditBusiness} options={({ navigation, route }) => ({
                            headerShadowVisible: false,
                            headerShown: true, headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: strings.edit_business,
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            },
                            headerRight: (props) => (
                                <HeaderEditBusiness {...props} navigation={navigation} route={route} />
                            ),
                        })} />

                        <Stack.Screen name="EditSalesPoint" component={EditSalesPoint} options={({ navigation, route }) => ({
                            headerShadowVisible: false,
                            headerShown: true, headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: strings.edit_sales_point,
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            },
                            headerRight: (props) => (
                                <HeaderEditSalesPoint {...props} navigation={navigation} route={route} />
                            ),
                        })} />

                        <Stack.Screen name="Sale" component={Sale} options={({ navigation, route }) => ({
                            headerShadowVisible: false,
                            headerShown: true, headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: strings.sale_operation,
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            },
                            headerRight: (props) => (
                                <HeaderSale {...props} navigation={navigation} route={route} />
                            ),
                        })} />

                        <Stack.Screen name="Customize" component={Customize} options={({ navigation, route }) => ({
                            headerShadowVisible: false,
                            headerShown: true, headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: strings.customize || "Customize",
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            },
                        })} />

                        <Stack.Screen name="CustomizeBusiness" component={CustomizeBusiness} options={({ navigation, route }) => ({
                            headerShadowVisible: false,
                            headerShown: true, headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: strings.customize_business_actions,
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            },
                            // headerRight: (props) => (
                            //     <HeaderSale {...props} navigation={navigation} route={route} />
                            // ),
                        })} />

                        <Stack.Screen name="CustomizeExpenses" component={CustomizeExpenses} options={({ navigation, route }) => ({
                            headerShadowVisible: false,
                            headerShown: true, headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: strings.customize_expenses || "Customize expenses",
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            },
                        })} />

                        <Stack.Screen name="UserBusinessUsers" component={UserBusinessUsers} options={({ navigation, route }) => ({
                            headerShadowVisible: false,
                            headerShown: true, headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: strings.users,
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            },
                            headerRight: (props) => (
                                <HeaderBusinessUsers {...props} navigation={navigation} route={route} />
                            ),
                        })} />

                        <Stack.Screen name="BusinessSubscribers" component={BusinessSubscribers} options={({ navigation, route }) => ({
                            headerShadowVisible: false,
                            headerShown: true, headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: strings.followers,
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            },
                        })} />

                        <Stack.Screen name="MessageUs" component={MessageUs} options={({ navigation, route }) => ({
                            headerShadowVisible: false,
                            headerShown: true, headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: strings.message_us,
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            },
                            // headerRight: (props) => (
                            //     <HeaderSale {...props} navigation={navigation} route={route} />
                            // ),
                        })} />

                        <Stack.Screen name="ViewPhoto" component={ViewPhoto} options={({ navigation, route }) => ({
                            headerShadowVisible: false,
                            headerShown: true, headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1
                            },
                            // presentation: 'modal',
                            gestureEnabled: true,
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: strings.picture,
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            },
                            // headerRight: (props) => (
                            //     <HeaderSale {...props} navigation={navigation} route={route} />
                            // ),
                        })} />

                        <Stack.Screen name="EditBusinessUser" component={EditBusinessUser} options={({ navigation, route }) => ({
                            headerShadowVisible: false,
                            headerShown: true, headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: strings.edit_user,
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            },
                            headerRight: (props) => (
                                <HeaderEditBusinessUser {...props} navigation={navigation} route={route} />
                            ),
                        })} />

                        <Stack.Screen name="ContactUs" component={ContactUs} options={({ navigation, route }) => ({
                            headerShadowVisible: false,
                            headerShown: true, headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: strings.contact_us,
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            }
                            // headerRight: (props) => (
                            //     <HeaderEditBusinessUser {...props} navigation={navigation} route={route} />
                            // ),
                        })} />

                        <Stack.Screen name="MyAccount" component={MyAccount} options={({ navigation, route }) => ({
                            headerShadowVisible: false,
                            headerShown: true, headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: strings.my_account,
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            }
                            // headerRight: (props) => (
                            //     <HeaderEditBusinessUser {...props} navigation={navigation} route={route} />
                            // ),
                        })} />

                        <Stack.Screen name="CategoryItems" component={CategoryItems} options={({ navigation, route }) => ({
                            headerShadowVisible: false,
                            headerShown: true, headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            },
                            headerRight: (props) => (
                                <HeaderCategoryItems {...props} navigation={navigation} route={route} />
                            ),
                        })} />

                        <Stack.Screen name="NewCompany" component={NewCompany} options={({ navigation, route }) => ({
                            headerShadowVisible: false,
                            headerShown: true, headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: strings.new_company,
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            }
                            // headerRight: (props) => (
                            //     <HeaderEditBusinessUser {...props} navigation={navigation} route={route} />
                            // ),
                        })} />

                        <Stack.Screen name="NewCompanyUser" component={NewCompanyUser} options={({ navigation, route }) => ({
                            headerShadowVisible: false,
                            headerShown: true, headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: strings.add_user,
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            }
                            // headerRight: (props) => (
                            //     <HeaderEditBusinessUser {...props} navigation={navigation} route={route} />
                            // ),
                        })} />

                        <Stack.Screen name="EditCompany" component={EditCompany} options={({ navigation, route }) => ({
                            headerShadowVisible: false,
                            headerShown: true, headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: strings.edit_company,
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            },
                        })} />

                        <Stack.Screen name="EditCompanyUser" component={EditCompanyUser} options={({ navigation, route }) => ({
                            headerShadowVisible: false,
                            headerShown: true, headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: strings.edit_company_user,
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            },
                        })} />

                        <Stack.Screen name="PostNews" component={PostNews} options={({ navigation, route }) => {
                            const flag = (route.params as any)?.flag || 1;
                            return {
                                headerShadowVisible: false,
                                headerShown: true, headerStyle: {
                                    backgroundColor: app_theme.colors.design_tip1
                                },
                                headerTintColor: app_theme.colors.text_design1,
                                animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                                title: flag === 1 ? ((strings as any).post_news || "Post News") : ((strings as any).add_timetable || "Add Timetable"),
                                headerTitleStyle: {
                                    fontSize: app_description.title_font_size,
                                    fontWeight: app_description.title_font_weight as any,
                                },
                            };
                        }} />

                        <Stack.Screen name="EditNews" component={EditNews} options={({ navigation, route }) => ({
                            headerShadowVisible: false,
                            headerShown: true, headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: (strings as any).edit_news || "Edit News",
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            },
                        })} />

                        <Stack.Screen name="News" component={News} options={({ navigation, route }) => {
                            const flag = (route.params as any)?.flag;
                            const title = flag === 1 ? strings.my_posts : (strings.news || "News");
                            return {
                                headerShadowVisible: false,
                                headerShown: true, headerStyle: {
                                    backgroundColor: app_theme.colors.design_tip1
                                },
                                headerTintColor: app_theme.colors.text_design1,
                                animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                                title: title,
                                headerTitleStyle: {
                                    fontSize: app_description.title_font_size,
                                    fontWeight: app_description.title_font_weight as any,
                                },
                            };
                        }} />

                        <Stack.Screen name="Post" component={Post} options={({ navigation, route }) => ({
                            headerShadowVisible: false,
                            headerShown: true, headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: (strings as any).news || "Post",
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            },
                        })} />

                        <Stack.Screen name="PostReactions" component={PostReactions} options={({ navigation, route }) => ({
                            headerShadowVisible: false,
                            headerShown: true, headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: (strings as any).reactions || strings.reactions || "Reactions",
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            },
                        })} />

                        <Stack.Screen name="CompanyUser" component={CompanyUser} options={({ navigation, route }) => ({
                            headerShadowVisible: false,
                            headerShown: true, headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: strings.user_details || strings.user_name,
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            },
                            headerRight: (props) => (
                                <HeaderCompanyUser {...props} navigation={navigation} route={route} />
                            ),
                        })} />

                        <Stack.Screen name="Companies" component={Companies} options={({ navigation, route }) => ({
                            headerShadowVisible: false,
                            headerShown: true, headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: strings.companies,
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            },
                        })} />

                        <Stack.Screen name="Company" component={Company} options={({ navigation, route }) => ({
                            headerShadowVisible: false,
                            headerShown: true, headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: strings.companies,
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            },
                        })} />

                        <Stack.Screen name="Timetables" component={Timetables} options={({ navigation, route }) => ({
                            headerShadowVisible: false,
                            headerShown: true, headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: strings.timetable || "Timetable",
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            },
                        })} />

                        <Stack.Screen name="ForwardMessage" component={ForwardMessage} options={({ navigation, route }) => ({
                            headerShadowVisible: false,
                            headerShown: true, headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: strings.forward_to + "...",
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            },
                            headerRight: (props) => (
                                <HeaderRightNewChat />
                            ),
                        })} />

                        <Stack.Screen name="MessageInfo" component={MessageInfo} options={({ navigation, route }) => ({
                            headerShadowVisible: false,
                            headerShown: true, headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: "",
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            }
                        })} />

                        <Stack.Screen name="UserProfileInfo" component={UserProfileInfo} options={({ navigation, route }) => ({
                            headerShadowVisible: false,
                            headerShown: true, headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: strings.user_information,
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            }
                        })} />

                        <Stack.Screen name="AllMessages" component={AllMessages} options={({ navigation, route }) => ({
                            headerShadowVisible: false,
                            headerShown: true, headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: strings.all_messages,
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            }
                        })} />

                        <Stack.Screen name="Stories" component={Stories} options={({ navigation, route }) => ({
                            headerShadowVisible: false,
                            headerShown: true, headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: strings.stories,
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            }
                        })} />

                        <Stack.Screen name="NewStory" component={NewStory} options={({ navigation, route }) => ({
                            headerShadowVisible: false,
                            headerShown: true,
                            headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: strings.new_story,
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            }
                        })} />

                        <Stack.Screen name="UserStories" component={UserStories} options={({ navigation, route }) => ({
                            headerShadowVisible: false,
                            headerShown: true,
                            headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            // title: strings.story,
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            }
                        })} />

                        <Stack.Screen name="Calculator" component={Calculator} options={{
                            headerShadowVisible: false,
                            headerShown: true,
                            headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: strings.calculator,
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            }
                        }} />

                        <Stack.Screen name="AddExpense" component={AddExpense} options={{
                            headerShadowVisible: false,
                            headerShown: true,
                            headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: strings.add_expense || "Add Expense",
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            }
                        }} />

                        <Stack.Screen name="Expense" component={Expense} options={({ navigation, route }) => ({
                            headerShadowVisible: false,
                            headerShown: true,
                            headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: strings.expense || "Expense",
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            },
                            headerRight: (props) => (
                                <HeaderRightExpense {...props} navigation={navigation} route={route} />
                            )
                        })} />

                        <Stack.Screen name="CategoryExpenses" component={CategoryExpenses} options={({ navigation, route }) => ({
                            headerShadowVisible: false,
                            headerShown: true,
                            headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: route.params?.category_name || strings.expense_categories || "Category Expenses",
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            },
                            headerRight: (props) => (
                                <HeaderRightExpenses {...props} navigation={navigation} route={route} />
                            )
                        })} />

                        <Stack.Screen name="EditExpense" component={EditExpense} options={({ navigation, route }) => ({
                            headerShadowVisible: false,
                            headerShown: true,
                            headerStyle: {
                                backgroundColor: app_theme.colors.design_tip1
                            },
                            headerTintColor: app_theme.colors.text_design1,
                            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
                            title: strings.edit_expense || "Edit Expense",
                            headerTitleStyle: {
                                fontSize: app_description.title_font_size,
                                fontWeight: app_description.title_font_weight as any,
                            },
                            headerRight: (props) => (
                                <HeaderRightExpense {...props} navigation={navigation} route={route} />
                            )
                        })} />

                        <Stack.Screen name="SplashStartYambi" options={{ headerShown: false }} component={SplashYambiStart} />
                    </Stack.Navigator>
                </NavigationContainer>
            </KeyboardRootView>
        </SafeAreaProvider>
    );
};

export default Yambi;
