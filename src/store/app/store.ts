import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import appReducer from '../reducers/appSlice';
import userSlice from '../reducers/userSlice';
import themeSlice from '../reducers/themeSlice';
import persistedAppSlice from '../reducers/persistedAppSlice';
// import currentUserSlice from '../reducers/currentUserSlice';
import contactsSlice from '../reducers/contactsSlice';
import chatsSlice from '../reducers/chatsSlice';
// import draftSlice from '../reducers/draftSlice';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: [
    'app_theme',
    'user_data',
    'persisted_app',
    // 'contacts',
    // 'chats',
    // 'drafts'
  ]
};

const rootReducers = combineReducers({
  app: appReducer,
  user_data: userSlice,
  app_theme: themeSlice,
  persisted_app: persistedAppSlice,
  // current_user: currentUserSlice,
  contacts: contactsSlice,
  // drafts: draftSlice,
  chats: chatsSlice
});

const persistedReducer = persistReducer(persistConfig, rootReducers);

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER]
      },
    })
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;

export const persistor = persistStore(store);
export default store;
