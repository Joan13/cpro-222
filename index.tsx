import { registerRootComponent } from 'expo';
import messaging, { type FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import Yambi, { displayNotification } from './App';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/es/integration/react';
import store, { persistor } from './src/store/app/store';
import { TouchableOpacity } from 'react-native';
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
// import { StripeProvider } from '@stripe/stripe-react-native';

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
        schemaVersion={18}
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
};

messaging().onMessage(backgroundMessageHandler);
messaging().setBackgroundMessageHandler(backgroundMessageHandler);
