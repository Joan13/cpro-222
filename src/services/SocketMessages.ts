// import { useQuery, useRealm } from "@realm/react";
// import { useAppDispatch, useAppSelector } from "../store/app/hooks";
// import { SocketApp } from "../../App";
// import { setContacts } from "../store/reducers/contactsSlice";
// import { TChat } from "../types/types";
// import moment from "moment";
// import { UserChats, UsersMessages } from "../store/database/Models";
// import realmReference from "./RealmReference";

// // const SocketMessages = () => {
//     const realmInstance = realmReference.ref?.current;
//     const chattt = useQuery(UserChats);
    
//     export const NewMessagesInsert = (msgs) => {
//         realmInstance.write(() => {
//             msgs.forEach((msg) => {
//                 let chat: TChat = {
//                     _id: msg.sender,
//                     phone_number: msg.sender,
//                     user: msg.receiver,
//                     type_chat: 0,
//                     last_message: msg.token,
//                     flag: 0,
//                     chat_read: 0,
//                     deleted: 0,
//                     chat_effect: 0,
//                     createdAt: msg.createdAt,
//                     updatedAt: msg.updatedAt,
//                 }

//                 const chatt = chattt.find(item => item._id === msg.sender);

//                 if (chattt !== undefined) {
//                     chat = {
//                         _id: chatt._id,
//                         phone_number: chatt.phone_number,
//                         user: chatt.user,
//                         type_chat: chatt.type_chat,
//                         last_message: msg.token,
//                         flag: chatt.flag,
//                         chat_read: 0,
//                         deleted: 0,
//                         chat_effect: chatt.chat_effect,
//                         createdAt: chatt.createdAt,
//                         updatedAt: moment().format(),
//                     }
//                 }

//                 // msg.cc = moment(msg.createdAt).format('DD/MM/YYYY');
//                 msg.alignment = msg.createdAt;//moment().format();


//                 try {
//                     realmInstance.create('UsersMessages', msg);
//                     // } catch (error) { }

//                     // try {
//                     realmInstance.create('UserChats', chat, true);
//                 } catch (error) { }

//                 // dispatch(setAddChatBadge(msg.sender));
//             });

//             // if (msgs[i].message_read === 2) {
//             // if (!chats_badge.includes(msgs[i].sender)) {
//             //     console.log("Can pass 3")

//             // }
//             // }
//         })

//         SocketApp.emit("messagesReceived", msgs);
//     }
//     // const dispatch = useAppDispatch();
//     // const realm = useRealm();
//     // const user_data = useAppSelector((state) => state.user_data);
//     // const current_user = useAppSelector((state) => state.current_user);

//     // const messagesRead = useQuery(
//     //     UsersMessages,
//     //     (msgs) => {
//     //         return msgs.filtered(
//     //             "receiver == $0 && message_read == $1",
//     //             user_data.phone_number,
//     //             2
//     //         );
//     //     },
//     //     []
//     // );

//     // const messagesQueue = useQuery(
//     //     UsersMessages,
//     //     (msgs) => {
//     //         return msgs.filtered(
//     //             "sender == $0 && message_read == $1",
//     //             user_data.phone_number,
//     //             0
//     //         );
//     //     },
//     //     []
//     // );

//     // SocketApp.on("update_contacts", (contacts) => {
//     //     if (contacts.length !== 0) {
//     //         dispatch(setContacts(contacts));
//     //     }
//     // });

//     //   SocketApp.on("newMessages", (messages) => {
//     //     for (let i in messages) {
//     //       const chat: TChat = {
//     //         _id: messages[i].sender,
//     //         phone_number: messages[i].sender,
//     //         type_chat: 0,
//     //         last_message: messages[i].token,
//     //         flag: 0,
//     //         chat_read: 0,
//     //         deleted: 0,
//     //         chat_effect: 0,
//     //         createdAt: messages[i].createdAt,
//     //         updatedAt: messages[i].updatedAt,
//     //       };

//     //       realm.write(() => {
//     //         try {
//     //           realm.create("UsersMessages", messages[i]);
//     //           realm.create("UserChats", chat, true);
//     //         } catch (error) {}
//     //       });
//     //       // console.log(contacts);
//     //       SocketApp.emit("messageReceived", messages[i]);
//     //     }

//     //     realm.write(() => {
//     //       try {
//     //         realm.create("UsersMessages", messages[messages.length - 1], true);
//     //       } catch (error) {}
//     //     });
//     //   });

//     // Update multiple messages
//     // SocketApp.on("messagesUpdates", (messages) => {
//     //     for (let i in messages) {
//     //         const msg = {
//     //             sender: messages[i].sender,
//     //             receiver: messages[i].receiver,
//     //             main_text_message: messages[i].main_text_message,
//     //             message_type: messages[i].type,
//     //             response_to: messages[i].response_to,
//     //             message_read: messages[i].message_read,
//     //             message_effect: messages[i].message_effect,
//     //             token: messages[i].token,
//     //             deleted: messages[i].deleted,
//     //             receivedAt: messages[i].receivedAt,
//     //             readAt: "",
//     //         };

//     //         realm.write(() => {
//     //             try {
//     //                 realm.create("UsersMessages", msg, true);
//     //             } catch (error) { }
//     //         });
//     //     }
//     // });

//     // Update single message
//     // SocketApp.on("messageUpdate" + user_data.phone_number, (message) => {
//     //     const msg = {
//     //         sender: message.sender,
//     //         receiver: message.receiver,
//     //         main_text_message: message.main_text_message,
//     //         message_type: message.type,
//     //         response_to: message.response_to,
//     //         message_read: message.message_read,
//     //         message_effect: message.message_effect,
//     //         token: message.token,
//     //         deleted: message.deleted,
//     //         receivedAt: message.receivedAt,
//     //         readAt: "",
//     //     };
//     //     realm.write(() => {
//     //         try {
//     //             realm.create("UsersMessages", msg, true);
//     //         } catch (error) {
//     //             console.log(error);
//     //         }
//     //     });
//     // });

//     // Validates if a single message has just been sent
//     // SocketApp.on("messageSent" + user_data.phone_number, (message) => {
//     //     const msg = {
//     //         sender: message.sender,
//     //         receiver: message.receiver,
//     //         main_text_message: message.main_text_message,
//     //         message_type: message.type,
//     //         response_to: message.response_to,
//     //         message_read: 1,
//     //         message_effect: message.message_effect,
//     //         token: message.token,
//     //         deleted: 0,
//     //         // createdAt: message.,
//     //         receivedAt: "",
//     //         readAt: "",
//     //         // cc: moment(messa.createdAt).format('DD/MM/YYYY')
//     //     };

//     //     realm.write(() => {
//     //         try {
//     //             realm.create("UsersMessages", msg, true);
//     //         } catch (error) { }
//     //     });
//     // });

//     // Receive a new message
//     // SocketApp.on("newMessage" + user_data.phone_number, (msg) => {
//     //     const chat: TChat = {
//     //         _id: msg.sender,
//     //         phone_number: msg.sender,
//     //         type_chat: 0,
//     //         last_message: msg.token,
//     //         flag: 0,
//     //         chat_read: 1,
//     //         deleted: 0,
//     //         chat_effect: 0,
//     //         createdAt: msg.createdAt,
//     //         updatedAt: msg.updatedAt,
//     //     };

//     //     // msg.cc = moment(msg.createdAt).format('DD/MM/YYYY');
//     //     msg.alignment = moment().format();

//     //     realm.write(() => {
//     //         try {
//     //             realm.create("UsersMessages", msg);
//     //             realm.create("UserChats", chat, true);
//     //         } catch (error) { }
//     //     });

//     //     SocketApp.emit("messageReceived", msg);
//     // });

//     // for (let i in messagesRead) {
//     //     SocketApp.emit("messageRead", messagesRead[i]);
//     // }

//     // for (let i in messagesQueue) {
//     //     SocketApp.emit("newMessage", messagesQueue[i]);
//     // }

//     // SocketApp.emit("assemble", user_data.phone_number);

//     // SocketApp.on("youConnected", () => {
//     //     for (let i in messagesRead) {
//     //         SocketApp.emit("messageRead", messagesRead[i]);
//     //     }

//     //     for (let i in messagesQueue) {
//     //         SocketApp.emit("newMessage", messagesQueue[i]);
//     //     }

//     //     SocketApp.emit("assemble", user_data.phone_number);
//     // });

//     console.log("ok from Socket Activity");
// // };

// // export default SocketMessages;
