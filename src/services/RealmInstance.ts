import Realm from 'realm';
import axios from 'axios';
import moment from 'moment';
import { Platform } from 'react-native';
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
  Stories,
  GroupMessages,
  YambiGroups,
  Expenses,
  CompanyUsers,
} from '../store/database/Models';
import { remote_host, randomString, renderDateUpToMilliseconds } from '../../GlobalVariables';
import { TChat, TMessage } from '../types/types';

// Singleton Realm instance shared across all background/notification handlers.
// This avoids opening/closing multiple instances which conflicts with the
// main app's RealmProvider and causes crashes.
let _realmInstance: Realm | null = null;

const realmConfig = {
  schema: [
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
  ],
  schemaVersion: 18,
};

export const openRealmInstance = async () => {
  if (_realmInstance && !_realmInstance.isClosed) {
    return _realmInstance;
  }
  _realmInstance = await Realm.open(realmConfig);
  return _realmInstance;
};

// Safe write helper: avoids "already in a write transaction" errors
// when the main app's RealmProvider is also performing a write
export const safeRealmWrite = (realm: Realm, callback: () => void) => {
  if (realm.isInTransaction) {
    callback();
  } else {
    realm.write(callback);
  }
};

export const insertBackgroundMessage = async (msg: any) => {
  try {
    const realm = await openRealmInstance();
    safeRealmWrite(realm, () => {
      let chat: TChat = {
        _id: msg.sender,
        phone_number: msg.sender,
        user: msg.receiver,
        type_chat: 0,
        last_message: msg.token,
        flag: 0,
        chat_read: 0,
        deleted: 0,
        chat_effect: 0,
        createdAt: msg.createdAt,
        updatedAt: msg.updatedAt,
      };

      const existingChat = realm.objectForPrimaryKey<TChat>('UserChats', msg.sender);
      if (existingChat) {
        // Copy values from managed object to plain object immediately
        chat = {
          _id: existingChat._id,
          phone_number: existingChat.phone_number,
          user: existingChat.user,
          type_chat: existingChat.type_chat,
          last_message: msg.token,
          flag: existingChat.flag,
          chat_read: 0,
          deleted: 0,
          chat_effect: existingChat.chat_effect,
          createdAt: msg.createdAt,
          updatedAt: moment().format(),
        };
      }

      msg.alignment = moment().utc().toISOString();
      msg.message_read = 2; // Marked as delivered locally

      try {
        realm.create('UsersMessages', msg, Realm.UpdateMode.Modified);
        realm.create('UserChats', chat, Realm.UpdateMode.Modified);
      } catch (error) {
        console.error("Error creating background message/chat in Realm:", error);
      }
    });

    // Notify backend message is delivered
    axios.post(`${remote_host}/yambi/API/set_message_received`, { token: msg.token })
      .then((res) => {
        console.log("Background message receipt updated on backend:", res.data);
      })
      .catch((err) => {
        console.error("Failed to notify backend of background message receipt:", err);
      });

  } catch (error) {
    console.error("Error in insertBackgroundMessage:", error);
  }
};

export const handleQuickReply = async (inboxUser: string, replyText: string, receivedMessageToken: string) => {
  try {
    const realm = await openRealmInstance();
    const users = realm.objects<UserData>('UserData');
    const currentUser = users[0];
    if (!currentUser || !currentUser.phone_number) {
      console.log("No current user found for quick reply");
      return;
    }

    const currentUserPhone = currentUser.phone_number;
    const time = moment(new Date()).format();
    const token = randomString(30) + renderDateUpToMilliseconds();

    // 1. Mark the received message as read locally
    safeRealmWrite(realm, () => {
      const receivedMsg = realm.objectForPrimaryKey<UsersMessages>('UsersMessages', receivedMessageToken);
      if (receivedMsg && receivedMsg.message_read < 3) {
        receivedMsg.message_read = 3;
        receivedMsg.readAt = time;
      }
    });

    // 2. Create the new reply message object
    const msg: TMessage = {
      sender: currentUserPhone,
      receiver: inboxUser,
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

    // 3. Create reply chat locally
    safeRealmWrite(realm, () => {
      let chat: TChat = {
        _id: inboxUser,
        phone_number: inboxUser,
        user: currentUserPhone,
        type_chat: 0,
        last_message: token,
        flag: 0,
        chat_read: 0,
        deleted: 0,
        chat_effect: 0,
        createdAt: time,
        updatedAt: time,
      };

      const existingChat = realm.objectForPrimaryKey<TChat>('UserChats', inboxUser);
      if (existingChat) {
        // Copy values from managed object to plain object immediately
        chat = {
          _id: existingChat._id,
          phone_number: existingChat.phone_number,
          user: existingChat.user,
          type_chat: existingChat.type_chat,
          last_message: token,
          flag: existingChat.flag,
          chat_read: 0,
          deleted: 0,
          chat_effect: existingChat.chat_effect,
          createdAt: time,
          updatedAt: moment().format(),
        };
      }

      try {
        realm.create('UsersMessages', msg, Realm.UpdateMode.Modified);
        realm.create('UserChats', chat, Realm.UpdateMode.Modified);
      } catch (error) {
        console.error("Error creating quick reply message in Realm:", error);
      }
    });

    // 4. Send the new message via REST API
    axios.post(`${remote_host}/yambi/API/send_message`, { msg })
      .then(async (res) => {
        console.log("Quick reply sent to backend successfully:", res.data);
        try {
          const realm = await openRealmInstance();
          safeRealmWrite(realm, () => {
            const localMsg = realm.objectForPrimaryKey<UsersMessages>('UsersMessages', token);
            if (localMsg && localMsg.message_read === 0) {
              localMsg.message_read = 1;
            }
          });
        } catch (err) {
          console.error("Failed to update message status to sent in local Realm:", err);
        }
      })
      .catch((err) => {
        console.error("Failed to send quick reply message:", err);
      });

    // 5. Update the received message's read status on server (since replying implies read)
    axios.post(`${remote_host}/yambi/API/set_message_read`, { token: receivedMessageToken })
      .then((res) => {
        console.log("Received message marked as read on backend via quick reply:", res.data);
      })
      .catch((err) => {
        console.error("Failed to mark received message as read on backend:", err);
      });

  } catch (error) {
    console.error("Error handling quick reply:", error);
  }
};

export const handleMarkAsReadAction = async (receivedMessageToken: string) => {
  try {
    const realm = await openRealmInstance();
    const time = moment(new Date()).format();

    // Update local message status
    safeRealmWrite(realm, () => {
      const receivedMsg = realm.objectForPrimaryKey<UsersMessages>('UsersMessages', receivedMessageToken);
      if (receivedMsg && receivedMsg.message_read < 3) {
        receivedMsg.message_read = 3;
        receivedMsg.readAt = time;
      }
    });

    // Send HTTP POST to update read status on server
    axios.post(`${remote_host}/yambi/API/set_message_read`, { token: receivedMessageToken })
      .then((res) => {
        console.log("Mark as read updated on backend:", res.data);
      })
      .catch((err) => {
        console.error("Failed to update mark as read on backend:", err);
      });
  } catch (error) {
    console.error("Error in handleMarkAsReadAction:", error);
  }
};
