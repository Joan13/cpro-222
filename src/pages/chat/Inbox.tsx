import { View, useWindowDimensions } from 'react-native'
import { useEffect } from 'react'
import HeaderChat from '../../components/headers/HeaderInbox';
import Messages from '../../components/chat/Messages';
import FooterChat from '../../components/chat/FooterInbox';
import { useAppDispatch, useAppSelector } from '../../store/app/hooks';
import { NavProps, TChat } from '../../types/types';
import { useObject, useQuery, useRealm } from '@realm/react';
import { UserChats } from '../../store/database/Models';
import StatusBarYambi from '../../components/app/StatusBar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Canvas, Blur, Image, useImage } from "@shopify/react-native-skia";
import { setCurrentUser } from '../../store/reducers/appSlice';
import { SocketApp } from '../../../GlobalVariables';
import HeaderInbox from '../../components/headers/HeaderInbox';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HeaderRightInbox from '../../components/headers/HeaderRightInbox';
import * as Notifications from 'expo-notifications';

const Inbox = ({ navigation, route }: NavProps) => {

  const dispatch = useAppDispatch();
  const user_data = useAppSelector(state => state.user_data);
  const { user } = route.params;
  const theme = useAppSelector(state => state.app_theme);
  const chats_badge = useAppSelector(state => state.app.chats_badge);
  const realm = useRealm();
  const image = useImage(require("./../../assets/bitmap11.png"));
  const width = useWindowDimensions().width;
  const height = useWindowDimensions().height;
  const insets = useSafeAreaInsets();
  // if (!image) {
  //   return null;
  // }

  // const cc = useQuery(
  //   UserChats, chts => {
  //     return chts.filtered('phone_number == $0 || _id == $1', user, user)
  //   }, []);

  const cc = useObject(UserChats, user);

  // if(cc.length !== 0) {
  //   const chat = {
  //     _id: cc[0]._id,
  //     phone_number: cc[0].phone_number,
  //     chat_read: 1,
  //   }
  // }

  useEffect(() => {
    // }

    dispatch(setCurrentUser(user));
    Notifications.dismissNotificationAsync(`chat_${user}`).catch((err) => console.log('Failed to dismiss notification:', err));
    // console.log(user);

    // SocketApp.on('newMessage'+user_data.phone_number, msg=>{
    //   console.log("Received message");
    // })

    if (cc !== null) {

      // console.log("Update chat called");


      // if(chats_badge.includes(cc._id)){
      //     dispatch(setRemoveChatBadge(cc._id));
      // }

      const chat: TChat = {
        _id: cc._id,
        phone_number: cc.phone_number,
        user: cc.user,
        type_chat: cc.type_chat,
        last_message: cc.last_message,
        flag: cc.flag,
        chat_read: 1,
        deleted: cc.deleted,
        chat_effect: cc.chat_effect,
        createdAt: cc.createdAt,
        updatedAt: cc.updatedAt,
      }

      if (cc.chat_read === 0) {
        realm.write(() => {
          try {
            realm.create('UserChats', chat, true);
          } catch (error) { }
        });
      }
    }

    // return () => {
    //   dispatch(setCurrentUser({
    //     user_id: 0,
    //     user_names: "",
    //     phone_number: "",
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
    //   }))
    // }
  }, [cc]);

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          paddingTop: insets.top,
          height: insets.top + 56,
          flexDirection: 'row',
          alignItems: 'center',
          width: '100%',
          // paddingHorizontal: 12,
          paddingRight: 12,
          backgroundColor: theme.colors.design_tip1
        }}
      >
        {/* LEFT */}
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', minWidth: 0 }}>
          <HeaderInbox navigation={navigation as any} user={user} />
        </View>

        {/* RIGHT */}
        <View style={{ flexShrink: 0, flexDirection: 'row', alignItems: 'center' }}>
          <HeaderRightInbox navigation={navigation as any} user={user} />
        </View>
      </View>

      <View
        style={{
          flex: 1,
        }}>
        <StatusBarYambi />
        {/* <HeaderChat user={user} /> */}
        {/* <ImageBackground
        source={require('./../../assets/bitmap22.png')}
        style={{
          flex: 1
        }}>
      </ImageBackground> */}

        <Canvas
          style={{
            flex: 1,
            backgroundColor: theme.dark ? 'black' : '#e3e3e3',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}>
          <Image
            x={0}
            y={0}
            width={width}
            height={height}
            image={image}
            fit="cover">
            <Blur blur={0} />
          </Image>
        </Canvas>

        <View style={{
          flex: 1,
          flexDirection: 'column',
          backgroundColor: 'transparent',
        }}>
          <Messages user={user} />
          <FooterChat user={user} />
        </View>
      </View>
    </View>
  )
}

export default Inbox;
