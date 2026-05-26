import { View, Pressable, Linking } from 'react-native';
import { memo, useState } from 'react';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useAppDispatch, useAppSelector } from '../../store/app/hooks';
import { strings } from '../../lang/lang';
import { setCurrentUser, setMessageSelected, setPlayingRecorded, setRecordingAudio, setResponseTo, setShowModalApp } from '../../store/reducers/appSlice';
import Entypo from 'react-native-vector-icons/Entypo';
import { IconApp } from '../app/IconApp';
import { NavProps, TMessage, TUser } from '../../types/types';
import { useObject, useQuery, useRealm } from '@realm/react';
import { UserChats, UserContacts, UsersMessages } from '../../store/database/Models';
import { SocketApp } from '../../../GlobalVariables';
import Clipboard from '@react-native-clipboard/clipboard';
import * as DropdownMenu from 'zeego/dropdown-menu'
import ModalApp from '../app/ModalApp';
import { TextNormalYambiGray, TextNormalYambiHighColor } from '../app/Text';
import moment from 'moment';

// const audioRecorderPlayer = new AudioRecorderPlayer();

const HeaderRightInbox = ({ navigation, route }: NavProps) => {
  // const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const border_color = useAppSelector(state => state.app_theme.colors.border);
  const user_data = useAppSelector(state => state.user_data);
  const { user } = route.params;
  const contacts = useAppSelector(state => state.app.raw_contacts);
  const app_theme = useAppSelector(state => state.app_theme);
  const app_description = useAppSelector(state => state.persisted_app.app_description);
  const message_selected = useAppSelector(state => state.app.message_selected);
  const recordingAudio = useAppSelector(state => state.app.recordingAudio);
  const playingRecorded = useAppSelector(state => state.app.playingRecorded);
  const [showDeleteMessage, setShowDeleteMessage] = useState<boolean>(false);
  const message = useObject(UsersMessages, message_selected);
  const userrr = useObject(UserContacts, user);
  const chats = useQuery(UserChats);
  const realm = useRealm();

  const copyToClipboard = () => {
    if(message===null)return;
    Clipboard.setString(message.main_text_message);
    dispatch(setMessageSelected(""));
  };

  const messages_undeleted = useQuery(
    UsersMessages, msgs => {
      return msgs.filtered('(receiver == $0 && sender == $1 && deleted == $2) || (sender == $3 && receiver == $4 && deleted == $5)', user, user_data.phone_number, 0, user, user_data.phone_number, 0)
    }, []);

  // console.log(messages_undeleted[messages_undeleted.length-1])

  const forwardMessage = () => {
    // dispatch(setMessageSelected(""));
    navigation.navigate("ForwardMessage", { message_id: message_selected });
  }

  const EditMessage = () => {
    navigation.navigate("MessageInfo", { message_id: message_selected, flag: 1 });
  }

  const CanEditMessage = () => {
    if(message===null)return;
    if (message.message_read <= 2 && message.message_type === 0 && message.deleted === 0) {
      return true;
    }

    return false;
  }

  const seeMessageInfo = () => {
    navigation.navigate("MessageInfo", { message_id: message_selected, flag: 0 });
  }

  const DeleteMessage = (flag: number) => {
    if (message) {

      const msg: TMessage = {
        sender: message.sender,
        receiver: message.receiver,
        main_text_message: message.main_text_message,
        caption: message.caption,
        message_type: message.message_type,
        reactions: message.reactions,
        response_to: message.response_to,
        message_read: 0,
        message_effect: message.message_effect,
        read_once: message.read_once,
        flag: message.flag,
        token: message.token,
        deleted: flag === 0 ? 1 : 2,
        platform: message.platform,
        createdAt: message.createdAt,
        receivedAt: message.receivedAt,
        readAt: message.readAt,
        playedAt: message.playedAt,
        cc: message.cc,//moment(time).format('DD/MM/YYYY'),
        alignment: message.alignment//moment().format()
      }

      // console.log(msg)

      realm.write(() => {
        try {
          realm.create('UsersMessages', msg, true);
        } catch (error) { }
      });

      SocketApp.emit('newMessage', msg);

      if (flag === 1) {
        // console.log(messages_undeleted)
        const this_chat = chats.find(cc => cc._id === message.receiver);
        if (messages_undeleted.length !== 0) {
          const last_message = messages_undeleted[messages_undeleted.length - 1];
          if (last_message !== undefined) {
            const time = moment(new Date()).format();
            const chat = {
              _id: last_message.receiver,
              phone_number: last_message.receiver,
              type_chat: this_chat !== undefined ? this_chat.type_chat : 0,
              last_message: last_message.token,
              user: user_data.phone_number,
              flag: this_chat !== undefined ? this_chat.flag : 0,
              chat_read: 1,
              deleted: 0,
              chat_effect: this_chat !== undefined ? this_chat.chat_effect : 0,
              createdAt: this_chat !== undefined ? this_chat.createdAt : time,
              updatedAt: this_chat !== undefined ? this_chat.updatedAt : time
            }

            realm.write(() => {
              try {
                realm.create('UserChats', chat, true);
              } catch (error) { }
            });
          }
        }
      }

      // SocketApp.emit('newMessage', msg);
    }

    setShowDeleteMessage(false);
    dispatch(setShowModalApp(false));
    dispatch(setMessageSelected(""));
  }

  return (
    <View style={{
      // flexDirection: 'row',
      // borderBottomWidth: 1,
      // borderColor: app_theme.colors.border,
      // alignItems: 'center',
      // flex:1,
      // width: 10,
      // paddingTop: 50,
      // backgroundColor: app_theme.colors.design_tip1,
      // backgroundColor:'green'
    }}>

      {/* <Pressable
              onPress={forwardMessage}
              style={{
                height: 30,
                width: 30,
                alignItems: 'flex-end',
                justifyContent: 'center',
                // marginLeft: 15
              }}>
              <IconApp pack='MC' name="dots-vertical" size={20} color={app_theme.colors.text_design1} />
            </Pressable> */}

      {showDeleteMessage && message ?
        <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowDeleteMessage(false) }} singleButton title={strings.delete_message} textCancel={strings.cancel}>
          <TextNormalYambiGray text={strings.delete_message_text} />

          {message.deleted === 0 && message.sender === user_data.phone_number ?
            <Pressable
              style={{
                height: 40,
                marginVertical: 10,
                justifyContent: "center",
                borderColor: app_theme.colors.border
              }}
              onPress={() => DeleteMessage(0)}>
              <TextNormalYambiHighColor text={strings.delete_for_everyone} />
            </Pressable> : null}

          <Pressable
            style={{
              height: 40,
              marginVertical: 10,
              justifyContent: "center",
              borderColor: app_theme.colors.border
            }}
            onPress={() => DeleteMessage(1)}>
            <TextNormalYambiHighColor styles={{ alignItems: 'flex-end' }} text={strings.delete_for_me} />
          </Pressable>
        </ModalApp>
        : null}

      {message_selected === "" ?
        <Animated.View entering={FadeIn} exiting={FadeOut} style={{
          flexDirection: 'row',
          flex: 1
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            // marginRight: 15
          }}>
            {/* <View style={{
          width: 30,
          alignItems: 'center',
          justifyContent: 'center',
          marginHorizontal: 5
        }}>
          <ActivityIndicator size={20} color={app_theme.colors.text_design1} />
        </View> */}

            {/* <Pressable style={{
              height: 30,
              width: 30,
              alignItems: 'center',
              justifyContent: 'center',
              marginHorizontal: 5
            }}>
              <Feather name="search" size={20} color={app_theme.colors.text_design1} />
            </Pressable>

            <Pressable style={{
              height: 30,
              width: 30,
              alignItems: 'flex-end',
              justifyContent: 'center',
              marginLeft: 5
            }}>
              <Feather name="camera" size={20} color={app_theme.colors.text_design1} />
            </Pressable> */}

            {!userrr ?
              <DropdownMenu.Root>
                <DropdownMenu.Trigger>
                  <IconApp pack='MC' name="dots-vertical" size={20} color={app_theme.colors.text_design1} />
                </DropdownMenu.Trigger>

                <DropdownMenu.Content>
                  {/* <DropdownMenu.Label placeholder={"title"}>Title</DropdownMenu.Label> */}

                  <DropdownMenu.Item key={'1'} onSelect={() => Linking.openURL("tel:" + user)}>
                    <DropdownMenu.ItemTitle>{strings.add_to_contacts}</DropdownMenu.ItemTitle>
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Root> : null}
          </View>
        </Animated.View>
        :
        <Animated.View entering={FadeIn} exiting={FadeOut} style={{
          flexDirection: 'row',
          flex: 1
        }}>
          {/* <Pressable onPress={() => navigation.navigate('Themes' as never)}>
        <Animated.View
          sharedTransitionTag='viewImageInbox'
          style={{
            justifyContent: 'center',
            alignContent: 'center',
            alignItems: 'center',
            marginRight: 10
          }}>
          <Animated.Image
            sharedTransitionTag='imageInbox'
            source={require('./../../assets/profile_blackkk.jpg')}
            style={{ width: 40, height: 40, borderRadius: 50, borderWidth: 1, borderColor: border_color }}
          />
        </Animated.View>
      </Pressable> */}
          {/* <View style={{
        flex: 1,
        marginRight: 2
      }}>
        <Text numberOfLines={1}
          style={{
            fontSize: app_description.inbox_title_size,
            fontWeight: app_description.inbox_title_font_weight as any,
            color: app_theme.colors.text_design1
          }}>{current_user.user_names}</Text>
        <Text style={{
          fontSize: app_description.small_general_font_size,
          fontWeight: app_description.small_general_font_weight as any,
          color: app_theme.colors.high_color
        }}>{strings.online}</Text>
      </View> */}

          <View style={{ flex: 1 }}></View>

          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}>
            <Pressable
              onPress={() => {
                dispatch(setResponseTo(message_selected));
                dispatch(setMessageSelected(""));
              }}
              style={{
                height: 36,
                width: 36,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 18,
                backgroundColor: app_theme.colors.border+"50",
              }}>
              <Entypo name="reply" size={18} color={app_theme.colors.text_design1} />
            </Pressable>

            {/* <Pressable
              onPress={() => dispatch(setResponseTo(message_selected))}
              style={{
                height: 30,
                width: 30,
                alignItems: 'center',
                justifyContent: 'center',
                marginHorizontal: 5
              }}>
              <MaterialCommunityIcons name="delete-outline" size={20} color={app_theme.colors.text_design1} />
            </Pressable> */}

            {/* <Pressable style={{
              height: 30,
              width: 30,
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: 5
            }}>
              <Entypo name="forward" size={20} color={app_theme.colors.text_design1} />
            </Pressable> */}
            {message !== null ?
              message.message_type === 0 ?
                <Pressable
                  onPress={copyToClipboard}
                  style={{
                    height: 36,
                    width: 36,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 18,
                    backgroundColor: app_theme.colors.border+"50",
                  }}>
                  <IconApp pack='MC' name="content-copy" size={18} color={app_theme.colors.text_design1} />
                </Pressable> : null : null}

            <Pressable
              onPress={seeMessageInfo}
              style={{
                height: 36,
                width: 36,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 18,
                backgroundColor: app_theme.colors.border+"50",
              }}>
              <IconApp pack='FI' name="info" size={18} color={app_theme.colors.text_design1} />
            </Pressable>

            <Pressable
              onPress={forwardMessage}
              style={{
                height: 36,
                width: 36,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 18,
                backgroundColor: app_theme.colors.border+"50",
                marginRight: 8,
              }}>
              <IconApp pack='ET' name="forward" size={18} color={app_theme.colors.text_design1} />
            </Pressable>

            {/* <Pressable
              onPress={forwardMessage}
              style={{
                height: 30,
                width: 30,
                alignItems: 'flex-end',
                justifyContent: 'center',
                // marginLeft: 15
              }}>
              <IconApp pack='MC' name="dots-vertical" size={20} color={app_theme.colors.text_design1} />
            </Pressable> */}

            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                <IconApp pack='MC' name="dots-vertical" size={20} color={app_theme.colors.text_design1} />
              </DropdownMenu.Trigger>

              <DropdownMenu.Content>
                {/* <DropdownMenu.Label placeholder={"title"}>Title</DropdownMenu.Label> */}

                {CanEditMessage() ?
                  <DropdownMenu.Item key={'2'} onSelect={EditMessage}>
                    <DropdownMenu.ItemTitle>{strings.edit}</DropdownMenu.ItemTitle>
                  </DropdownMenu.Item> : null}

                <DropdownMenu.Item key={'3'} onSelect={() => { dispatch(setShowModalApp(true)); setShowDeleteMessage(true); }}>
                  <DropdownMenu.ItemTitle>{strings.delete}</DropdownMenu.ItemTitle>
                </DropdownMenu.Item>

                {/* <DropdownMenu.Item key={'4'} onSelect={() => Linking.openURL("tel:" + user)}>
                  <DropdownMenu.ItemTitle>{strings.pin}</DropdownMenu.ItemTitle>
                </DropdownMenu.Item> */}
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </View>
        </Animated.View>}

    </View>
  )
}

export default memo(HeaderRightInbox);