import { registerRootComponent } from 'expo';
import messaging, { type FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import Yambi, { displayNotification } from './App';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/es/integration/react';
import store, { persistor } from './src/store/app/store';
import { TouchableOpacity, Platform } from 'react-native';
import Realm from 'realm';
import {
  BusinessItemsSale,
  BusinessUsers,
  ItemPrices,
  UserBusinesses,
  UserChats,
  UserContacts,
  UserData,
  UserMessagesDrafts,
  UserBusinessArticles,
  InventoryMovementTracking,
  UserSellsPoints,
  UsersMessages,
  YambiUsers,
  YambiBusinesses,
  GroupMessages,
  YambiGroups,
  Stories,
  Expenses,
  CompanyUsers,
} from './src/store/database/Models';
import { RealmProvider } from '@realm/react';
import { insertBackgroundMessage, openRealmInstance, safeRealmWrite } from './src/services/RealmInstance';
import * as Notifications from 'expo-notifications';
import axios from 'axios';
import moment from 'moment';
import { remote_host, randomString, renderDateUpToMilliseconds } from './GlobalVariables';

const RootYambi = () => {
  return (
    // <StripeProvider
    //   publishableKey={
    //     process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
    //     'pk_test_51SrGAj2RLwYBisX0l8W2qkTsCavgTEt8OPW5hPUhTz7IK7Hb1srfLAxvz5qMMD2lrh22XixEuqdYBIxlfHTdsLu400YA2fMQWA'
    //   }
    //   merchantIdentifier="merchant.com.yambi"
    // >
    <RealmProvider
      schema={[
        UserData,
        UsersMessages,
        UserChats,
        UserBusinesses,
        UserSellsPoints,
        UserContacts,
        UserMessagesDrafts,
        UserBusinessArticles,
        InventoryMovementTracking,
        BusinessItemsSale,
        ItemPrices,
        BusinessUsers,
        YambiUsers,
        YambiBusinesses,
        Stories,
        GroupMessages,
        YambiGroups,
        Expenses,
        CompanyUsers,
      ]}
      schemaVersion={19}
    >
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <Yambi />
        </PersistGate>
      </Provider>
    </RealmProvider>
    // </StripeProvider>
  );
};

registerRootComponent(RootYambi);

const backgroundMessageHandler = async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
  displayNotification(remoteMessage);

  try {
    const rawData = remoteMessage?.data?.message;
    if (typeof rawData === 'string') {
      const parsed = JSON.parse(rawData);
      const message = parsed.data;
      if (message && message.token) {
        await insertBackgroundMessage(message);
      }
    }
  } catch (err) {
    console.error("Error in backgroundMessageHandler:", err);
  }
};

messaging().onMessage(backgroundMessageHandler);
messaging().setBackgroundMessageHandler(backgroundMessageHandler);

// Helper: update local Realm to mark chat and messages as read
const markLocalChatAsRead = async (senderPhone: string) => {
  try {
    const realm = await openRealmInstance();
    const time = moment(new Date()).format();

    safeRealmWrite(realm, () => {
      // Mark the chat as read (removes unread badge in chat list)
      const chat = realm.objectForPrimaryKey('UserChats', senderPhone);
      if (chat) {
        (chat as any).chat_read = 1;
      }

      // Mark all unread messages from this sender as read
      const unreadMessages = realm
        .objects('UsersMessages')
        .filtered('sender == $0 AND message_read < 3', senderPhone);
      // Copy to array first to avoid iterating a live collection while modifying
      const msgsToUpdate = [...unreadMessages];
      for (const msg of msgsToUpdate) {
        (msg as any).message_read = 3;
        (msg as any).readAt = time;
      }
    });
    // Do NOT close the realm - it is shared with the main app
  } catch (error) {
    console.error("Error updating local Realm for mark as read:", error);
  }
};

// Helper: save the reply message and update last_message in local Realm chat
const saveLocalReplyMessage = async (inboxUser: string, currentUserPhone: string, replyMsg: any) => {
  try {
    const realm = await openRealmInstance();
    safeRealmWrite(realm, () => {
      // Create message locally
      realm.create('UsersMessages', replyMsg, Realm.UpdateMode.Modified);

      // Update/Create chat locally - copy data from existing chat first
      let chatData = {
        _id: inboxUser,
        phone_number: inboxUser,
        user: currentUserPhone,
        type_chat: 0,
        last_message: replyMsg.token,
        flag: 0,
        chat_read: 1,
        deleted: 0,
        chat_effect: 0,
        createdAt: replyMsg.createdAt,
        updatedAt: replyMsg.createdAt,
      };

      const existingChat: any = realm.objectForPrimaryKey('UserChats', inboxUser);
      if (existingChat) {
        // Copy values from managed object to plain object immediately
        chatData = {
          _id: existingChat._id,
          phone_number: existingChat.phone_number,
          user: existingChat.user,
          type_chat: existingChat.type_chat,
          last_message: replyMsg.token,
          flag: existingChat.flag,
          chat_read: 1,
          deleted: existingChat.deleted,
          chat_effect: existingChat.chat_effect,
          createdAt: existingChat.createdAt,
          updatedAt: moment().format(),
        };
      }
      realm.create('UserChats', chatData, Realm.UpdateMode.Modified);
    });
    // Do NOT close the realm - it is shared with the main app
  } catch (error) {
    console.error("Error saving local reply message to Realm:", error);
  }
};

// Top-level notification response listener for Reply and Mark as Read actions.
// This runs at the entry point level so it fires immediately without waiting
// for the React tree to mount. Uses REST API directly for reliability.
Notifications.addNotificationResponseReceivedListener(async (response) => {
  const actionIdentifier = response.actionIdentifier;
  const notificationData = response.notification.request.content.data;

  if (actionIdentifier === 'reply') {
    const replyText = (response as any).userText;
    const msgStr = notificationData?.message;
    if (replyText && typeof msgStr === 'string') {
      try {
        const parsed = JSON.parse(msgStr);
        const originalMsg = parsed.data;
        if (originalMsg) {
          const token = randomString(30) + renderDateUpToMilliseconds();
          const time = moment(new Date()).format();

          const msg = {
            sender: originalMsg.receiver,
            receiver: originalMsg.sender,
            main_text_message: replyText,
            caption: '',
            message_type: 0,
            reactions: '[]',
            response_to: '',
            message_read: 0,
            message_effect: 0,
            read_once: 0,
            flag: 0,
            token: token,
            deleted: 0,
            platform: Platform.OS,
            createdAt: time,
            receivedAt: '',
            readAt: '',
            playedAt: '',
            cc: moment(time).format('DD/MM/YYYY'),
            alignment: moment().utc().toISOString(),
          };

          // Save reply message locally FIRST so that delivered status updates
          // (messageUpdate socket events) can find the message in Realm
          await saveLocalReplyMessage(originalMsg.sender, originalMsg.receiver, { ...msg, message_read: 1 });

          // Update local Realm: mark chat + messages as read
          await markLocalChatAsRead(originalMsg.sender);

          // Send reply and mark ALL messages from sender as read on server
          await Promise.all([
            axios.post(`${remote_host}/yambi/API/send_message`, { msg }),
            axios.post(`${remote_host}/yambi/API/set_all_messages_read`, {
              sender: originalMsg.sender,
              receiver: originalMsg.receiver,
            }),
          ]);
          console.log("Quick reply sent and all messages marked as read via REST");

          // Dismiss the notification after replying
          Notifications.dismissNotificationAsync(`chat_${originalMsg.sender}`).catch(() => { });
        }
      } catch (error) {
        console.error("Error handling quick reply action:", error);
      }
    }
    return;
  }

  if (actionIdentifier === 'mark_as_read') {
    const msgStr = notificationData?.message;
    if (typeof msgStr === 'string') {
      try {
        const parsed = JSON.parse(msgStr);
        const originalMsg = parsed.data;
        if (originalMsg) {
          // Mark ALL messages from this sender as read on backend
          await axios.post(`${remote_host}/yambi/API/set_all_messages_read`, {
            sender: originalMsg.sender,
            receiver: originalMsg.receiver,
          });
          console.log("All messages marked as read via REST");

          // Update local Realm: mark chat + messages as read
          await markLocalChatAsRead(originalMsg.sender);

          // Dismiss the notification after marking as read
          Notifications.dismissNotificationAsync(`chat_${originalMsg.sender}`).catch(() => { });
        }
      } catch (error) {
        console.error("Error handling mark_as_read action:", error);
      }
    }
    return;
  }
});
