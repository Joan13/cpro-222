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
import { callManager } from '../../services/call/CallManager';

// const audioRecorderPlayer = new AudioRecorderPlayer();

const HeaderRightInbox = ({ navigation, user }: { navigation: any, user: string }) => {
  // const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const border_color = useAppSelector(state => state.app_theme.colors.border);
  const user_data = useAppSelector(state => state.user_data);
  // const { user } = route.params;
  const contacts = useAppSelector(state => state.app.raw_contacts);
  const app_theme = useAppSelector(state => state.app_theme);
  const app_description = useAppSelector(state => state.persisted_app.app_description);
  const message_selected = useAppSelector(state => state.app.message_selected);
  const recordingAudio = useAppSelector(state => state.app.recordingAudio);
  const playingRecorded = useAppSelector(state => state.app.playingRecorded);
  const call_active = useAppSelector(state => state.app.call_active);
  const [showDeleteMessage, setShowDeleteMessage] = useState<boolean>(false);
  const message = useObject(UsersMessages, message_selected || "");
  const userrr = useObject(UserContacts, user || "");
  const this_chat = useObject(UserChats, user || "");
  const realm = useRealm();

  const selectedTokens = message_selected ? message_selected.split(',').filter(Boolean) : [];
  const selectedCount = selectedTokens.length;

  const canDeleteForEveryone = () => {
    if (selectedTokens.length === 0) return false;
    return selectedTokens.every(token => {
      const msgObj = realm.objectForPrimaryKey<UsersMessages>('UsersMessages', token);
      return msgObj && msgObj.isValid() && msgObj.deleted === 0 && msgObj.sender === user_data.phone_number;
    });
  };

  const copyToClipboard = () => {
    if (message === null || !message.isValid()) return;
    Clipboard.setString(message.main_text_message);
    dispatch(setMessageSelected(""));
  };

  const messages_undeleted = useQuery(
    UsersMessages, msgs => {
      return msgs.filtered('(receiver == $0 && sender == $1 && deleted == $2) || (sender == $3 && receiver == $4 && deleted == $5)', user, user_data.phone_number, 0, user, user_data.phone_number, 0)
    }, []);

  const forwardMessage = () => {
    navigation.navigate("ForwardMessage", { message_id: message_selected });
  }

  const EditMessage = () => {
    navigation.navigate("MessageInfo", { message_id: message_selected, flag: 1 });
  }

  const CanEditMessage = () => {
    if (selectedCount !== 1 || message === null || !message.isValid()) return false;
    if (message.message_read <= 2 && message.message_type === 0 && message.deleted === 0) {
      return true;
    }

    return false;
  }

  const seeMessageInfo = () => {
    navigation.navigate("MessageInfo", { message_id: message_selected, flag: 0 });
  }

  const DeleteMessage = (flag: number) => {
    const msgsToUpdate: TMessage[] = [];
    selectedTokens.forEach(token => {
      const msgObj = realm.objectForPrimaryKey<UsersMessages>('UsersMessages', token);
      if (msgObj && msgObj.isValid()) {
        const msg: TMessage = {
          sender: msgObj.sender,
          receiver: msgObj.receiver,
          main_text_message: msgObj.main_text_message,
          caption: msgObj.caption,
          message_type: msgObj.message_type,
          reactions: msgObj.reactions,
          response_to: msgObj.response_to,
          message_read: flag === 0 ? 0 : msgObj.message_read,
          message_effect: msgObj.message_effect,
          read_once: msgObj.read_once,
          flag: msgObj.flag,
          token: msgObj.token,
          deleted: flag === 0 ? 1 : 2,
          platform: msgObj.platform,
          createdAt: msgObj.createdAt,
          receivedAt: msgObj.receivedAt,
          readAt: msgObj.readAt,
          playedAt: msgObj.playedAt,
          cc: msgObj.cc,
          alignment: msgObj.alignment
        };
        msgsToUpdate.push(msg);
      }
    });

    if (msgsToUpdate.length > 0) {
      realm.write(() => {
        msgsToUpdate.forEach(msg => {
          try {
            realm.create('UsersMessages', msg, true);
          } catch (error) { }
        });
      });

      msgsToUpdate.forEach(msg => {
        if (flag === 0) {
          SocketApp.emit('newMessage', msg);
        }
      });
    }

    if (flag === 1 && messages_undeleted.length !== 0) {
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

    setShowDeleteMessage(false);
    dispatch(setShowModalApp(false));
    dispatch(setMessageSelected(""));
  }

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      // minHeight: 44,
      paddingRight: 8,
    }}>

      {showDeleteMessage && selectedCount > 0 ?
        <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowDeleteMessage(false) }} singleButton title={strings.delete_message} textCancel={strings.cancel}>
          <TextNormalYambiGray text={strings.delete_message_text} />

          {canDeleteForEveryone() ?
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
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
          }}>

          {/* <Pressable
            disabled={call_active}
            onPress={() => {
              if (call_active) return;
              const contact = contacts.find((c) => c.phoneNumber === user);
              const name = contact ? contact.displayName : user;
              callManager.startCall(user, 'audio', name, userrr?.user_profile || '');
              navigation.navigate('AudioCallScreen');
            }}
            style={{
              height: 36,
              width: 36,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 18,
              opacity: call_active ? 0.35 : 1,
            }}>
            <IconApp pack='MC' name="phone" size={20} color={app_theme.colors.header_foreground_color} />
          </Pressable>

          <Pressable
            disabled={call_active}
            onPress={() => {
              if (call_active) return;
              const contact = contacts.find((c) => c.phoneNumber === user);
              const name = contact ? contact.displayName : user;
              callManager.startCall(user, 'video', name, userrr?.user_profile || '');
              navigation.navigate('VideoCallScreen');
            }}
            style={{
              height: 36,
              width: 36,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 18,
              opacity: call_active ? 0.35 : 1,
            }}>
            <IconApp pack='MC' name="video" size={20} color={app_theme.colors.header_foreground_color} />
          </Pressable> */}

          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {!userrr ?
              <DropdownMenu.Root>
                <DropdownMenu.Trigger>
                  <Pressable
                    style={{
                      height: 36,
                      width: 36,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 18,
                    }}>
                    <IconApp pack='MC' name="dots-vertical" size={20} color={app_theme.colors.header_foreground_color} />
                  </Pressable>
                </DropdownMenu.Trigger>

                <DropdownMenu.Content>
                  <DropdownMenu.Item key={'1'} onSelect={() => Linking.openURL("tel:" + user)}>
                    <DropdownMenu.ItemTitle>{strings.add_to_contacts}</DropdownMenu.ItemTitle>
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Root> : null}
          </View>
        </Animated.View>
        :
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}>
          <View style={{ flex: 1 }}></View>

          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}>
            {selectedCount === 1 ? (
              <Pressable
                onPress={() => {
                  dispatch(setResponseTo(selectedTokens[0]));
                  dispatch(setMessageSelected(""));
                }}
                style={{
                  height: 36,
                  width: 36,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 18,
                  backgroundColor: app_theme.colors.border + "50",
                }}>
                <Entypo name="reply" size={18} color={app_theme.colors.header_foreground_color} />
              </Pressable>
            ) : null}

            {selectedCount === 1 && message !== null && message.deleted === 0 ?
              message.message_type === 0 ?
                <Pressable
                  onPress={copyToClipboard}
                  style={{
                    height: 36,
                    width: 36,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 18,
                    backgroundColor: app_theme.colors.border + "50",
                  }}>
                  <IconApp pack='MC' name="content-copy" size={18} color={app_theme.colors.header_foreground_color} />
                </Pressable> : null : null}

            {selectedCount === 1 && message !== null && message.deleted === 0 ?
              <Pressable
                onPress={seeMessageInfo}
                style={{
                  height: 36,
                  width: 36,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 18,
                  backgroundColor: app_theme.colors.border + "50",
                }}>
                <IconApp pack='FI' name="info" size={18} color={app_theme.colors.header_foreground_color} />
              </Pressable> : null}

            <Pressable
              onPress={forwardMessage}
              style={{
                height: 36,
                width: 36,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 18,
                backgroundColor: app_theme.colors.border + "50",
                marginRight: 8,
              }}>
              <IconApp pack='ET' name="forward" size={18} color={app_theme.colors.header_foreground_color} />
            </Pressable>

            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                <IconApp pack='MC' name="dots-vertical" size={20} color={app_theme.colors.header_foreground_color} />
              </DropdownMenu.Trigger>

              <DropdownMenu.Content>
                {CanEditMessage() ?
                  <DropdownMenu.Item key={'2'} onSelect={EditMessage}>
                    <DropdownMenu.ItemTitle>{strings.edit}</DropdownMenu.ItemTitle>
                  </DropdownMenu.Item> : null}

                <DropdownMenu.Item key={'3'} onSelect={() => { dispatch(setShowModalApp(true)); setShowDeleteMessage(true); }}>
                  <DropdownMenu.ItemTitle>{strings.delete}</DropdownMenu.ItemTitle>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </View>
        </Animated.View>}

    </View>
  )
}

export default memo(HeaderRightInbox);