// import { useState, useEffect, useRef } from 'react';
// import { View, Button } from 'react-native';
// import notifee, { AndroidImportance, AndroidVisibility, EventType } from '@notifee/react-native';
// import { NavProps } from '../../types/types';

// const Notiff = ({ navigation }: NavProps) => {

//     async function createChannel() {
//         await notifee.requestPermission();
//         await notifee.createChannel({
//             id: 'defaultio12345',
//             name: 'Default Channel',
//             importance: AndroidImportance.HIGH, // Ensures the notification appears immediately
//             visibility: AndroidVisibility.PUBLIC,
//         });
//     }

//     useEffect(() => {
        
//         const unsubscribe = notifee.onForegroundEvent(async ({ type, detail }) => {
//             if (type === EventType.PRESS && detail.pressAction?.id === 'default') {
//                 // Retrieve custom data from notification
//                 const { customKey, screen } = detail.notification.data;

//                 console.log('Custom Key:', customKey); // "customValue"
//                 console.log('Navigate to screen:', screen); // e.g., "MessageScreen"

//                 // Navigate to the specified screen, if using React Navigation
//                 if (screen) {
//                     navigation.navigate(screen); // Adjust to your navigation structure
//                 }
//             }
//         });

//         // const unsubscribee = notifee.onBackgroundEvent(async ({ type, detail }) => {
//         //     if (type === EventType.PRESS && detail.pressAction?.id === 'default') {
//         //         // Retrieve custom data from notification
//         //         const { customKey, screen } = detail.notification.data;

//         //         console.log('Custom Key:', customKey); // "customValue"
//         //         console.log('Navigate to screen:', screen); // e.g., "MessageScreen"

//         //         // Navigate to the specified screen, if using React Navigation
//         //         if (screen) {
//         //             navigation.navigate(screen); // Adjust to your navigation structure
//         //         }
//         //     }
//         // });

//         createChannel();

//         // Clean up the listener
//         return () => unsubscribe();
//     }, [navigation]);

//     async function onDisplayNotification() {
//         // Request permissions (required for iOS)
//         await notifee.requestPermission()

//         // Create a channel (required for Android)
//         // const channelId = await notifee.createChannel({
//         //     id: 'default',
//         //     name: 'YYambi',
//         //     importance: AndroidImportance.DEFAULT,
//         //     // visibility: AndroidVisibility.PUBLIC,
//         //     // badge: true,
//         // });

//         // Display a notification
//         await notifee.displayNotification({
//             title: 'Notification Title',
//             body: 'Main body content of the notification',
//             android: {
//                 // channelId,
//                 channelId: 'defaultio12345',
//                 importance: AndroidImportance.HIGH,
//                 visibility: AndroidVisibility.PUBLIC,
//                 // badge: true,
//                 // smallIcon: 'name-of-a-small-icon', // optional, defaults to 'ic_launcher'.
//                 // pressAction is needed if you want the notification to open the app when pressed
//                 pressAction: {
//                     id: 'default',
//                 },
//                 actions: [
//                     {
//                       pressAction: {
//                         id: 'mark-as-read',
//                       },
//                       title: 'Mark as read',
//                     },
//                     {
//                         pressAction: {
//                           id: 'mark-as-read',
//                         },
//                         title: 'Allow chat',
//                       },
//                       {
//                         pressAction: {
//                           id: 'mark-as-read',
//                         },
//                         title: 'Receive',
//                       },
//                   ],
//             },
//             data: {
//                 customKey: { "customKey": "ok" }, // Custom data to pass on press
//                 screen: 'Signup', // Example screen to navigate to
//             },
//         });
//     }

//     return (
//         <View style={{
//             justifyContent: 'center',
//             alignItems: 'center',
//             flex: 1
//         }}>
//             <Button title="Display Notification" onPress={() => onDisplayNotification()} />
//         </View>
//     );
// }

// export default Notiff;

import React, { useEffect } from 'react';
import { Button, View, Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { type NotificationBehavior } from 'expo-notifications';

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

export default function Notiff() {
  useEffect(() => {
    // Request notification permissions
    const requestPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'You need to enable notifications in your settings.');
      }
    };

    requestPermissions();

    // Listener for received notifications
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // Cleanup the listener
    return () => notificationListener.remove();
  }, []);

  // Function to schedule a local notification
  const scheduleNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Hello!',
        body: 'This is a local notification.',
        data: { someData: 'goes here' }, // Optional additional data
      },
      trigger: null, // Notification will appear after 5 seconds
    });
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Button title="Schedule Notification" onPress={scheduleNotification} />
    </View>
  );
}

