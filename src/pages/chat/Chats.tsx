import { View, Image } from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { useQuery } from '@realm/react';
import { UserChats } from '../../store/database/Models';
import { useAppDispatch, useAppSelector } from '../../store/app/hooks';
import { NavProps, TChat, TChats } from '../../types/types';
// import Animated from 'react-native-reanimated';
// import { SocketApp } from '../../../App';
import { useFocusEffect } from '@react-navigation/native';
import * as RootNavigation from './../../services/Navigation_ref';
import RenderChats from '../../components/lists/messages/ChatsList';
import { FlashList } from '@shopify/flash-list';
import { TextSmallYambiGray } from '../../components/app/Text';
import { strings } from '../../lang/lang';
import ButtonNormal from '../../components/app/ButtonNormal';
import { setMessageSelected, setTitle } from '../../store/reducers/appSlice';

const Chats = ({ navigation, route }: NavProps) => {
    const app_theme = useAppSelector(state => state.app_theme);
    const search_yambi = useAppSelector(state => state.app.search_yambi);
    const search_yambi_text = useAppSelector(state => state.app.search_yambi_text);
    const show_favorite_chats = useAppSelector(state => state.app.show_favorite_chats);
    // const contacts = useAppSelector(state => state.contacts);
    // const current_user= useAppSelector(state => state.current_user);
    // const app_description = useAppSelector(state => state.persisted_app.app_description);
    // const user_data = useAppSelector(state => state.user_data);
    // const rootNavigation = useAppSelector(state => state.app.rootNavigation);
    // const [cuu, setcu] = useState("ok");
    const [chats, setChats] = useState<TChats>([]);
    const dispatch = useAppDispatch();
    // const realm = useRealm();

    useFocusEffect(
        useCallback(() => {
            dispatch(setTitle(strings.chats));
        }, [navigation])
    );

    const goNewChat = () => {
        RootNavigation.navigate('NewChat');
        // console.log(navigation)
    }

    const vvv = useQuery(UserChats);

    const chts = useQuery(
        UserChats,
        chts => chts.sorted([['flag', true], ['createdAt', true]]),
        []
    );

    const pinnedChats = useQuery(UserChats, chts =>
        chts.filtered('flag == 2 && deleted == 0'));

    const otherChats = useQuery(UserChats, chts =>
        chts.filtered('flag != 2 && deleted == 0').sorted('createdAt', true)
    );

    const favoriteChats = useQuery(UserChats, chts =>
        chts.filtered('flag == 1 && deleted == 0').sorted('createdAt', true)
    );

    const GoInbox = useCallback((user: string) => {
        // const cu: TUser = {
        //     user_id: 0,
        //     user_names: user,
        //     phone_number: user,
        //     gender: '0',
        //     birth_date: "",
        //     country: "",
        //     user_profile: "",
        //     profession: "",
        //     bio: "",
        //     user_email: "",
        //     user_address: "",
        //     notification_token: "",
        //     status_information: "",
        //     user_password: "",
        //     account_privacy: "",
        //     account_valid: "",
        //     createdAt: "",
        //     updatedAt: ""
        // }
        // // setcu(user);
        // dispatch(setCurrentUser(cu));
        dispatch(setMessageSelected(""));
        RootNavigation.navigate("Inbox", { user: user });
    }, []);

    // const renderItem = ({ item }: { item: TChat }) => {
    //     return (<Item item={item} />)
    // }

    // const SearchItem = (search: string) => {
    //     dispatch(setSearchYambiText(search));
    //     let filtered_items = chats.filter(item => {
    //         return item._.toLowerCase().includes(search.toLowerCase().toString())
    //         // || item.code.toLowerCase().includes(search.toLowerCase().toString());
    //     });

    //     setIIItems(filtered_items as never);
    // }

    // const SortConversations = () => {


    //     const cc = chts.sort((a, b) => {
    //       // Priorité à l'épinglage
    //       if (a.flag===2 && b.flag!==2) return -1;
    //       if (a.flag!==2 && b.flag===2) return 1;

    //       // Si les deux sont épinglés ou non épinglés → trier par date
    //       return new Date(b.createdAt) - new Date(a.createdAt);
    //     });

    //     setChats(cc);
    //   };

    const SortConversations = () => {
        if (show_favorite_chats && favoriteChats.length !== 0) {
            setChats([...favoriteChats]);
        } else {
            // console.log(otherChats)
            setChats([...pinnedChats, ...otherChats]);
        }
    }

    useEffect(() => {
        SortConversations();
    }, [show_favorite_chats, vvv]);

    const FooterChats = () => {
        return (
            <View style={{
                borderColor: app_theme.colors.border,
                borderTopWidth: 1,
                paddingHorizontal: 30
            }}>
                {/* <TextSmallYambiGray text={strings.hold_on_chat_for_options} bold styles={{ marginVertical: 15, textAlign: 'center' }} /> */}
                <TextSmallYambiGray text={strings.personal_chats_listed} styles={{ textAlign: 'center', marginVertical: 15 }} />
            </View>
        )
    }

    return (
        <View style={{
            flex: 1,
            backgroundColor: app_theme.colors.background,
            borderColor: app_theme.colors.border,
            borderTopWidth: 1
        }}>
            {chats.length === 0 ?
                <View
                    style={{
                        justifyContent: 'center',
                        alignItems: 'center',
                        flex: 1
                    }}>
                    <Image
                        source={require("./../../assets/chat.png")}
                        style={{
                            width: 100,
                            height: 100
                        }} />

                    <TextSmallYambiGray text={strings.no_chats_word} styles={{
                        margin: 40,
                        marginTop: 20,
                        marginBottom: 20,
                        color: app_theme.colors.gray,
                        textAlign: 'center'
                    }} />

                    <ButtonNormal
                        title={strings.new_chat}
                        loadEnabled={false}
                        onPress={goNewChat}
                        styles={{ paddingHorizontal: 20 }} normal={true}
                    />
                </View>
                :
                <FlashList
                    data={chats as never}
                    estimatedItemSize={70}
                    renderItem={({ item, index }: { item: TChat, index: number }) => (
                        <RenderChats item={item} GoInbox={GoInbox} />
                    )}
                    contentContainerStyle={{
                        backgroundColor: app_theme.colors.background
                    }}
                    ListFooterComponent={<FooterChats />}
                />}
        </View>
    )
}

export default Chats;

