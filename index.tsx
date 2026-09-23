import { registerRootComponent } from 'expo';
import messaging, { type FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import Yambi, { displayNotification, getConnectedUser } from './App';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/es/integration/react';
import store, { persistor } from './src/store/app/store';
import { TouchableOpacity, Platform } from 'react-native';
import Realm from 'realm';
import { RealmProvider } from '@realm/react';
import { insertBackgroundMessage, openRealmInstance, safeRealmWrite, realmConfig } from './src/services/RealmInstance';
import * as Notifications from 'expo-notifications';
import axios from 'axios';
import moment from 'moment';
import { remote_host, randomString, renderDateUpToMilliseconds } from './GlobalVariables';
import { setCallsBadge } from './src/store/reducers/persistedAppSlice';
import { callManager } from './src/services/call/CallManager';
import { callSoundManager } from './src/services/call/CallSoundManager';
import { navigateWithRetry } from './src/services/Navigation_ref';

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
      schema={realmConfig.schema}
      schemaVersion={realmConfig.schemaVersion}
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
  const user = await getConnectedUser();

  // Only handle notifications and database synchronization if a user is connected
  if (!user || user.user_id === "0" || !user.phone_number) {
    return;
  }

  await displayNotification(remoteMessage);

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

  try {
    if (remoteMessage?.data?.type === 'MISSED_CALL') {
      const callData = remoteMessage.data;
      const callId = callData.callId;
      if (callId) {
        const realm = await openRealmInstance();
        const historyId = `hist_${callId}`;
        const existing = realm.objectForPrimaryKey('CallHistory', historyId);
        if (!existing) {
          await safeRealmWrite(realm, () => {
            realm.create(
              'CallHistory',
              {
                _id: historyId,
                callId: String(callId),
                callerId: String(callData.callerId || callData.callerPhone || ''),
                calleeId: String(user.phone_number),
                callerName: String(callData.callerName || callData.callerId || ''),
                callerAvatar: String(callData.callerAvatar || ''),
                calleeName: '',
                calleeAvatar: '',
                type: String(callData.callType || 'audio'),
                direction: 'missed',
                status: 'MISSED',
                durationSeconds: 0,
                createdAt: String(callData.createdAt || new Date().toISOString()),
                timestamp: Date.now(),
              },
              Realm.UpdateMode.Modified
            );
          });
          const currentBadge = store.getState().persisted_app?.calls_badge || 0;
          store.dispatch(setCallsBadge(currentBadge + 1));
        }
      }
    }
  } catch (err) {
    console.error("Error inserting missed call in backgroundMessageHandler:", err);
  }
};

messaging().onMessage(backgroundMessageHandler);
messaging().setBackgroundMessageHandler(backgroundMessageHandler);

// Helper: update local Realm to mark chat and messages as read
const markLocalChatAsRead = async (senderPhone: string) => {
  try {
    const realm = await openRealmInstance();
    const time = moment(new Date()).format();

    await safeRealmWrite(realm, () => {
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
    await safeRealmWrite(realm, () => {
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
  const notificationId = response.notification.request.identifier;

  if (actionIdentifier === 'decline_call') {
    if (notificationId) {
      Notifications.dismissNotificationAsync(notificationId).catch(() => { });
    }
    Notifications.dismissAllNotificationsAsync().catch(() => { });
    callSoundManager.stopRingtone();
    if (notificationData) {
      callManager.handleIncomingInviteFromNotification(notificationData);
    }
    callManager.rejectCall(notificationData);
    const callId = notificationData?.callId;
    const callerId = notificationData?.callerId || notificationData?.callerPhone || notificationData?.callerPhoneNumber || notificationData?.user;
    const calleeId = notificationData?.calleeId || notificationData?.calleePhone || notificationData?.calleePhoneNumber;
    if (callId) {
      axios.post(`${remote_host}/yambi/API/reject_call`, {
        callId,
        callerId,
        calleeId,
      }).catch((err) => console.error('[index.tsx] Error in reject_call REST:', err));
    }
    return;
  }

  const isCallInvite = notificationData?.type === 'CALL_INVITE' || notificationData?.screen === 'AudioCallScreen' || notificationData?.screen === 'VideoCallScreen';

  if (actionIdentifier === 'accept_call' || (isCallInvite && (actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER || !actionIdentifier))) {
    if (notificationId) {
      Notifications.dismissNotificationAsync(notificationId).catch(() => { });
    }
    callSoundManager.stopRingtone();

    if (notificationData) {
      callManager.handleIncomingInviteFromNotification(notificationData);
    }

    const callType = notificationData?.callType || notificationData?.type || 'audio';
    const targetScreen = callType === 'video' ? 'VideoCallScreen' : 'AudioCallScreen';
    navigateWithRetry(targetScreen as any, {});

    if (actionIdentifier === 'accept_call') {
      callManager.acceptCall().catch((err) => {
        console.error('[index.tsx] Error accepting call from notification:', err);
      });
    }
    return;
  }

  if (notificationData?.type === 'MISSED_CALL' || notificationData?.screen === 'CallHistory') {
    if (notificationId) {
      Notifications.dismissNotificationAsync(notificationId).catch(() => { });
    }
    navigateWithRetry('CallHistory' as any, {});
    return;
  }

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


// Tu travailles sur l'application mobile **Yambi**, une application React Native basée sur **Expo Prebuild** (PAS Expo Go et PAS une architecture EAS obligatoire).

// ## Contexte

// Yambi possède déjà une implémentation fonctionnelle des appels audio/vidéo.

// La partie appel existante fonctionne déjà et ne doit PAS être réécrite inutilement.

// Il existe déjà notamment :

// * la logique d'appel audio/vidéo ;
// * le signaling existant ;
// * la connexion Socket.IO ;
// * la logique WebRTC/P2P existante ;
// * l'écran d'appel React Native ;
// * les boutons audio/vidéo ;
// * la logique d'acceptation/refus/fin d'appel ;
// * l'envoi actuel d'une notification lorsqu'un utilisateur reçoit un appel.

// ### PROBLÈME ACTUEL

// Le principal problème est la **réception d'un appel entrant lorsque l'application Yambi n'est pas active**.

// Actuellement, nous envoyons essentiellement une notification classique.

// Ce comportement n'est pas suffisant pour une application d'appel professionnelle.

// Nous voulons une expérience proche de WhatsApp/Telegram/Messenger :

// * Yambi ouvert → appel entrant immédiatement visible ;
// * Yambi en arrière-plan → appel entrant correctement affiché ;
// * téléphone verrouillé → appel entrant correctement affiché ;
// * application Yambi complètement fermée → l'appel doit toujours pouvoir être signalé correctement ;
// * l'utilisateur doit pouvoir accepter/refuser l'appel depuis l'interface d'appel du système lorsque cela est possible ;
// * après acceptation, Yambi doit ouvrir/reprendre son écran d'appel React Native et utiliser l'implémentation WebRTC existante.

// ---

// # OBJECTIF PRINCIPAL

// Améliorer UNIQUEMENT la couche de réception des appels entrants afin d'obtenir une implémentation native et professionnelle sur :

// * iOS
// * Android

// sans casser l'implémentation d'appel existante.

// L'objectif n'est PAS de créer un nouveau système WebRTC.

// L'objectif est de créer la couche native permettant à Yambi de recevoir correctement un appel même lorsque l'application n'est pas au premier plan.

// ---

// # ÉTAPE 1 — AUDIT OBLIGATOIRE

// Avant de modifier le code, inspecte complètement le projet.

// Identifie :

// 1. comment un appel est actuellement initié ;
// 2. comment le serveur informe le destinataire d'un appel ;
// 3. comment Socket.IO est utilisé pour le signaling ;
// 4. comment la notification actuelle est envoyée ;
// 5. comment l'application réagit lorsqu'elle reçoit cette notification ;
// 6. où se trouve l'écran d'appel ;
// 7. comment sont gérés :

//    * answer
//    * reject
//    * end
//    * mute
//    * speaker
//    * camera
//    * microphone
// 8. comment WebRTC est initialisé ;
// 9. comment les `offer`, `answer` et `ICE candidates` sont échangés ;
// 10. comment fonctionne actuellement le comportement lorsque l'application est :

//     * ouverte ;
//     * en arrière-plan ;
//     * complètement fermée.

// NE SUPPRIME PAS le système actuel avant d'avoir compris son fonctionnement.

// Produis d'abord une courte analyse de l'architecture actuelle et indique quels fichiers devront réellement être modifiés/créés.

// ---

// # ÉTAPE 2 — ARCHITECTURE À METTRE EN PLACE

// Nous voulons séparer clairement :

// ### A. Signaling backend

// Le serveur Yambi continue à gérer le signaling.

// Il doit continuer à gérer les événements nécessaires à l'appel, par exemple :

// ```text
// incoming-call
// call-accepted
// call-rejected
// call-ended
// offer
// answer
// ice-candidate
// ```

// Ne remplace PAS Socket.IO par un autre système de signaling.

// ### B. Push d'appel

// La notification d'appel doit être traitée comme un **événement d'appel VoIP**, et non comme une simple notification marketing/informationnelle.

// ### C. Couche native

// Créer une couche native dédiée à l'intégration avec le système d'exploitation.

// Cette couche doit être accessible depuis React Native via un **Expo Module natif** ou une architecture native équivalente compatible avec Expo Prebuild.

// Le module doit avoir une API TypeScript claire.

// Exemple conceptuel :

// ```ts
// initializeCallModule();

// reportIncomingCall({
//   callId,
//   callerId,
//   callerName,
//   callerAvatar,
//   callType: 'audio' | 'video',
// });

// answerCall(callId);

// rejectCall(callId);

// endCall(callId);

// setMuted(callId, muted);

// setSpeaker(callId, enabled);
// ```

// L'API exacte doit être adaptée au projet existant.

// ---

// # ÉTAPE 3 — iOS

// Pour iOS, implémenter une vraie intégration native basée sur :

// * PushKit / VoIP Push ;
// * CallKit ;
// * Expo Module natif Swift.

// Le flux attendu est conceptuellement :

// ```text
// Serveur Yambi
//       ↓
// APNs VoIP Push
//       ↓
// PushKit
//       ↓
// Native Yambi Call Manager
//       ↓
// CallKit
//       ↓
// Interface d'appel iOS
//       ↓
// Utilisateur accepte
//       ↓
// React Native
//       ↓
// CallScreen existant
//       ↓
// WebRTC existant
// ```

// Lorsque le téléphone reçoit un appel Yambi, l'application ne doit PAS dépendre du fait que le JavaScript React Native soit déjà actif pour afficher l'appel entrant.

// Le traitement initial doit être natif.

// Utiliser `CXProvider` / `CXCallUpdate` / `CXProviderDelegate` ou les API CallKit appropriées.

// Configurer correctement :

// * `CXProviderConfiguration`
// * nom de l'application
// * support audio
// * support vidéo lorsque nécessaire
// * UUID unique par appel
// * actions Answer
// * actions End
// * éventuellement Hold/Mute selon les besoins de l'implémentation existante.

// ### IMPORTANT

// Ne crée pas simplement une notification locale qui ouvre React Native.

// Utilise le mécanisme VoIP approprié à iOS.

// Respecte également les exigences actuelles d'Apple concernant les VoIP pushes et CallKit.

// Ne détourne pas PushKit pour des notifications qui ne sont pas des appels.

// ---

// # ÉTAPE 4 — Android

// Sur Android, implémenter une véritable réception d'appel entrant adaptée aux versions Android modernes.

// Utiliser selon ce qui est approprié :

// * Firebase Cloud Messaging ;
// * notification d'appel haute priorité ;
// * full-screen intent lorsque nécessaire et autorisé ;
// * `ConnectionService` / Android Telecom lorsque pertinent ;
// * service natif pour maintenir le traitement de l'appel lorsque nécessaire ;
// * Expo Module / Kotlin pour exposer les fonctionnalités à React Native.

// Le comportement attendu :

// ```text
// Serveur Yambi
//       ↓
// FCM
//       ↓
// FirebaseMessagingService
//       ↓
// Native Yambi Call Manager
//       ↓
// Android Call UI / Telecom
//       ↓
// Utilisateur accepte
//       ↓
// React Native
//       ↓
// CallScreen
//       ↓
// WebRTC
// ```

// La solution doit fonctionner correctement avec :

// * application ouverte ;
// * application en arrière-plan ;
// * téléphone verrouillé ;
// * application non active.

// Respecter les restrictions modernes d'Android concernant les notifications plein écran, les services foreground et les permissions.

// Ne demande pas des permissions inutiles.

// ---

// # ÉTAPE 5 — NE PAS REFAIRE WEBRTC

// C'est extrêmement important.

// L'implémentation WebRTC existante doit être conservée.

// Ne remplace pas :

// ```text
// existing WebRTC
// ```

// par une nouvelle solution simplement parce que nous créons le module natif.

// Le module natif sert principalement à :

// * recevoir l'appel ;
// * réveiller/activer la couche d'appel ;
// * afficher l'interface système ;
// * accepter ;
// * refuser ;
// * terminer ;
// * communiquer les événements à React Native.

// Après acceptation :

// ```text
// Native Call Module
//         ↓
// React Native
//         ↓
// CallScreen existant
//         ↓
// WebRTC existant
// ```

// ---

// # ÉTAPE 6 — SYNCHRONISATION DES ÉTATS

// Il faut gérer correctement les différents états d'un appel.

// Exemple :

// ```text
// RINGING
// ANSWERED
// REJECTED
// ENDED
// MISSED
// CANCELLED
// ```

// Le serveur doit rester la source de vérité pour l'état logique de l'appel lorsque cela est nécessaire.

// Évite les situations où :

// * l'appel continue à sonner alors que l'appelant a raccroché ;
// * deux écrans d'appel apparaissent ;
// * l'appel est accepté deux fois ;
// * l'utilisateur reçoit plusieurs appels pour le même `callId` ;
// * un ancien appel réapparaît après ouverture de l'application ;
// * CallKit pense que l'appel existe alors que le serveur l'a terminé.

// Utilise un identifiant unique d'appel, par exemple :

// ```text
// callId
// ```

// et, côté iOS, un UUID CallKit correspondant.

// ---

// # ÉTAPE 7 — APPLICATION COMPLÈTEMENT FERMÉE

// C'est une exigence majeure.

// Tester explicitement les scénarios :

// ### Test 1

// ```text
// Yambi ouverte
// ↓
// appel entrant
// ```

// ### Test 2

// ```text
// Yambi en arrière-plan
// ↓
// appel entrant
// ```

// ### Test 3

// ```text
// Téléphone verrouillé
// ↓
// appel entrant
// ```

// ### Test 4

// ```text
// Yambi retirée du premier plan / processus non actif
// ↓
// appel entrant
// ```

// ### Test 5

// ```text
// appel entrant
// ↓
// refuser
// ```

// ### Test 6

// ```text
// appel entrant
// ↓
// accepter
// ↓
// CallScreen
// ↓
// WebRTC
// ```

// ### Test 7

// ```text
// appel entrant
// ↓
// appelant raccroche avant réponse
// ```

// ### Test 8

// ```text
// appel entrant
// ↓
// timeout
// ```

// ### Test 9

// ```text
// appel entrant
// ↓
// utilisateur ouvre Yambi manuellement
// ```

// ### Test 10

// ```text
// deux appels entrants successifs
// ```

// ---

// # ÉTAPE 8 — DEEP LINK / NAVIGATION

// Après une acceptation depuis l'interface système, React Native doit savoir exactement quel appel ouvrir.

// Par exemple :

// ```ts
// {
//   callId: '...',
//   callerId: '...',
//   callType: 'audio'
// }
// ```

// Le module natif doit pouvoir transmettre l'information à React Native même si React Native n'était pas initialisé au moment où l'appel est arrivé.

// Il faut donc prévoir un mécanisme de :

// ```text
// pendingCall
// ```

// ou équivalent.

// Exemple :

// ```text
// Call reçu
// ↓
// Native
// ↓
// CallKit
// ↓
// Utilisateur accepte
// ↓
// React Native démarre
// ↓
// React Native récupère pendingCall
// ↓
// navigation vers CallScreen
// ```

// Cela est particulièrement important pour le cold start.

// ---

// # ÉTAPE 9 — EXPO PREBUILD

// Le projet utilise :

// ```text
// Expo Prebuild
// ```

// et non Expo Go.

// Ne proposer aucune solution qui nécessite Expo Go.

// Le module doit être compatible avec le workflow natif généré par :

// ```bash
// npx expo prebuild
// ```

// et les builds natifs classiques.

// Si des modifications doivent être persistantes après un nouveau `expo prebuild`, utiliser les mécanismes appropriés d'Expo/config plugins plutôt que de demander de modifier manuellement `ios/` ou `android/` d'une façon qui serait écrasée lors du prochain prebuild.

// Créer si nécessaire :

// ```text
// app.plugin.js
// ```

// ou le config plugin approprié.

// ---

// # ÉTAPE 10 — NE PAS CASSER L'EXISTANT

// Avant toute modification :

// * identifier les fichiers concernés ;
// * comprendre les dépendances ;
// * réutiliser les fonctions existantes ;
// * conserver les événements Socket.IO existants lorsque possible ;
// * conserver le CallScreen existant ;
// * conserver WebRTC ;
// * conserver la logique d'appel sortant.

// Ne fais pas une réécriture complète du système.

// Le changement doit principalement concerner :

// ```text
// Incoming Call
// +
// Native OS Integration
// +
// Push handling
// ```

// ---

// # ÉTAPE 11 — TYPESCRIPT API

// Créer une API propre pour le module.

// Par exemple :

// ```ts
// type CallType = 'audio' | 'video';

// interface IncomingCall {
//   callId: string;
//   callerId: string;
//   callerName: string;
//   callerAvatar?: string;
//   callType: CallType;
// }

// interface CallEvent {
//   callId: string;
//   type: CallType;
// }
// ```

// Et des événements :

// ```text
// incomingCall
// callAnswered
// callRejected
// callEnded
// callMuted
// callUnmuted
// callSpeakerChanged
// ```

// Adapte évidemment les noms à l'architecture existante.

// ---

// # ÉTAPE 12 — GESTION DES PERMISSIONS

// Gérer correctement les permissions nécessaires :

// iOS :

// * microphone ;
// * caméra ;
// * notifications si nécessaire ;
// * VoIP Push / CallKit selon les mécanismes utilisés.

// Android :

// * microphone ;
// * caméra ;
// * notifications ;
// * permissions nécessaires aux notifications d'appel / full-screen selon la version Android ;
// * autres permissions uniquement si réellement nécessaires.

// Ne demande pas toutes les permissions au lancement de l'application.

// Demande les permissions au moment où elles deviennent pertinentes.

// ---

// # ÉTAPE 13 — SÉCURITÉ

// Le payload du push ne doit pas contenir inutilement des informations sensibles.

// Utiliser par exemple :

// ```json
// {
//   "type": "incoming_call",
//   "callId": "...",
//   "callerId": "...",
//   "callType": "video"
// }
// ```

// Les informations complémentaires peuvent être récupérées depuis le serveur si nécessaire.

// Valider également côté serveur que :

// ```text
// caller → callee
// ```

// est bien un appel autorisé.

// Ne jamais considérer un push comme une preuve suffisante de l'identité de l'appelant.

// ---

// # ÉTAPE 14 — LOGGING / DEBUG

// Ajouter des logs facilement identifiables.

// Par exemple :

// ```text
// [YAMBI_CALL] Incoming push
// [YAMBI_CALL] Reporting incoming CallKit call
// [YAMBI_CALL] Android incoming call
// [YAMBI_CALL] Answer requested
// [YAMBI_CALL] Reject requested
// [YAMBI_CALL] React Native initialized
// [YAMBI_CALL] Pending call restored
// [YAMBI_CALL] Call ended
// ```

// Les logs doivent permettre de diagnostiquer facilement les problèmes de cold start.

// ---

// # ÉTAPE 15 — DOCUMENTATION

// À la fin, documente :

// 1. les fichiers créés ;
// 2. les fichiers modifiés ;
// 3. l'architecture ;
// 4. le fonctionnement iOS ;
// 5. le fonctionnement Android ;
// 6. le fonctionnement lorsque l'application est fermée ;
// 7. les permissions ;
// 8. les configurations Apple nécessaires ;
// 9. les configurations Firebase/APNs nécessaires ;
// 10. comment compiler ;
// 11. comment tester sur appareil réel ;
// 12. les limitations connues.

// ---

// # CONTRAINTE IMPORTANTE : APPAREILS RÉELS

// Ne considère PAS que le système fonctionne simplement parce qu'il fonctionne dans :

// * Expo Go ;
// * simulator iOS ;
// * Android emulator.

// Les appels entrants doivent être testés sur de vrais appareils.

// Pour iOS, vérifier particulièrement :

// * application active ;
// * background ;
// * téléphone verrouillé ;
// * cold start ;
// * appel accepté depuis CallKit.

// Pour Android, tester plusieurs versions Android et plusieurs constructeurs lorsque possible.

// ---

// # CRITÈRE DE RÉUSSITE

// Le résultat final doit permettre ce scénario :

// ```text
// UTILISATEUR A
//      │
//      │ appelle B
//      ▼
// Serveur Yambi
//      │
//      ├──────── Socket.IO / signaling
//      │
//      └──────── Push d'appel
//                     │
//                     ▼
//               TÉLÉPHONE B
//                     │
//              Application fermée
//                     │
//                     ▼
//              Native Call Layer
//                     │
//               ┌─────┴─────┐
//               │           │
//              iOS       Android
//            CallKit    Call UI/Telecom
//               │           │
//               └─────┬─────┘
//                     │
//                  Accepter
//                     │
//                     ▼
//              React Native
//                     │
//                     ▼
//             CallScreen Yambi
//                     │
//                     ▼
//              WebRTC existant
//                     │
//                     ▼
//                APPEL ACTIF
// ```

// L'expérience doit être suffisamment robuste pour être utilisée comme une vraie fonctionnalité d'appel d'une application de production.

// ## Règle finale

// **Ne commence pas directement à coder.**

// Commence par :

// 1. auditer le système actuel ;
// 2. identifier précisément le mécanisme actuel de notification d'appel ;
// 3. identifier les fichiers concernés ;
// 4. proposer l'architecture minimale nécessaire ;
// 5. expliquer les changements ;
// 6. puis seulement implémenter.

// Ne réécris pas ce qui fonctionne déjà.
// Ne remplace pas WebRTC.
// Ne remplace pas Socket.IO.
// Ne recrée pas le CallScreen si celui-ci fonctionne déjà.

// Le travail principal concerne la **réception d'appel native, le cold start, PushKit/CallKit sur iOS, FCM + mécanismes d'appel Android, et le pont entre la couche native et React Native**.


// Ne modifie pas encore le code. Fais un plan d'implementation correcte avant.