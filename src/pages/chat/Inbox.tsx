import { View, useWindowDimensions } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
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
    dispatch(setCurrentUser(user));
    Notifications.dismissNotificationAsync(`chat_${user}`).catch((err) => console.log('Failed to dismiss notification:', err));
  }, [user]);

  useEffect(() => {
    if (cc !== null && cc.chat_read === 0) {
      realm.write(() => {
        try {
          cc.chat_read = 1;
        } catch (error) { }
      });
    }
  }, [cc?.chat_read]);

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
          backgroundColor: theme.colors.header_background_color
        }}
      >
        {/* LEFT */}
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', minWidth: 0 }}>
          <HeaderInbox navigation={navigation as any} user={user} />
        </View>

        {/* RIGHT */}
        <View style={{ flexShrink: 0, flexDirection: 'row', alignItems: 'center', marginLeft: 50 }}>
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

        <ExpoImage
          source={require('./../../assets/bitmap11.png')}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100%',
            backgroundColor: theme.dark ? 'black' : '#e3e3e3',
          }}
          contentFit="cover"
        />

        <View style={{
          flex: 1,
          flexDirection: 'column',
          backgroundColor: 'transparent',
        }}>
          <Messages user={user} highlightMessageToken={route.params?.highlight_message_token} />
          <FooterChat user={user} />
        </View>
      </View>
    </View>
  )
}

export default Inbox;
