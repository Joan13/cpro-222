import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../app/store';
import { TBusinessBadge, TContact, TSelection, TStore, TUser } from '../../types/types';
import { strings } from '../../lang/lang';
import { NavigationProp } from '@react-navigation/native';
import { useRef } from 'react';

const initialState: TStore = {
    contacts: [],
    raw_contacts: [],
    title: strings.chats,
    contacts_number: 0,
    home_tab: 0,
    message_input_tab: 0,
    emojis_tab: 0,
    message_inbox: '',
    search_contact_enabled: false,
    modal_app: false,
    loading_connect: false,
    connected: false,
    recordingAudio: false,
    playingRecorded: false,
    playingAudio: false,
    response_to: '',
    text_contact_search: '',
    playing_voice_note: false,
    voice_note_being_played: "",
    response_to_text: '',
    response_to_token: '',
    messages_chat: [],
    raw_messages: [],
    messages_group: [],
    messages_users: [],
    presaved_messages_users: [],
    type_contact: 0,
    contacts_selected: [],
    chats: [],
    group_chat: [],
    groups: [],
    loading_button: false,
    loading: false,
    loading_header: false,
    date_messages: '',
    sender_message: '',
    receiver_message: '',
    can_check_messages: true,
    can_check_messages_status: true,
    can_send_presaved_messages: true,
    can_set_messages_read: true,
    notifications_home_tab1: 0,
    notifications_home_tab2: 0,
    notifications_home_tab3: 0,
    notifications_home_tab4: 0,
    visible_images_view: true,
    scroll_to_end: false,
    message_selected: "",
    messageInputRef: null,
    selection: { start: 0, end: 0 },
    inputEmoji: "",
    show_custom_keyboard: false,
    business_opened: false,
    chat_opened: false,
    app_opened: false,
    expenses_opened: false,
    chats_badge: [],
    search_yambi_text: "",
    search_yambi: false,
    current_user: "",
    business_items_filter: "",
    text_business_search: "",
    phone_numbers_list: [],
    messages_selected: [],
    chats_selected: [],
    users_connected: [],
    show_favorite_chats: false,
    category:""
}

export const appSlice = createSlice({
    name: 'app',
    initialState,
    reducers: {
        setRootNavigation: (state, action: PayloadAction) => {
            state.rootNavigation = action.payload;
        },
        setMessageSelected: (state, action: PayloadAction<string>) => {
            if (state.message_selected === action.payload) {
                state.message_selected = "";
            } else {
                state.message_selected = action.payload;
            }
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },
        setLoadingHeader: (state, action: PayloadAction<boolean>) => {
            state.loading_header = action.payload;
        },
        setShowFavoriteChats: (state, action: PayloadAction<boolean>) => {
            state.show_favorite_chats = action.payload;
        },
        setTextBusinessSearch: (state, action: PayloadAction<string>) => {
            state.text_business_search = action.payload;
        },
        setShowCustomKeyboard: (state, action: PayloadAction<boolean>) => {
            state.show_custom_keyboard = action.payload;
        },
        setPlayingVoiceNote: (state, action: PayloadAction<boolean>) => {
            state.playing_voice_note = action.payload;
        },
        setRecordingAudio: (state, action: PayloadAction<boolean>) => {
            state.recordingAudio = action.payload;
        },
        setPlayingRecorded: (state, action: PayloadAction<boolean>) => {
            state.playingRecorded = action.payload;
        },
        setLoadingButton: (state, action: PayloadAction<boolean>) => {
            state.loading_button = action.payload;
        },
        setShowModalApp: (state, action: PayloadAction<boolean>) => {
            state.modal_app = action.payload;
        },
        setTitle: (state, action: PayloadAction<string>) => {
            state.title = action.payload;
        },
        setSearchContactEnabled: (state, action: PayloadAction<boolean>) => {
            state.search_contact_enabled = action.payload;
        },
        setCurrentUser: (state, action: PayloadAction<string>) => {
            state.current_user = action.payload;
        },
        setSearchYambiEnabled: (state, action: PayloadAction<boolean>) => {
            state.search_yambi = action.payload;
        },
        setSearchYambiText: (state, action: PayloadAction<string>) => {
            state.search_yambi_text = action.payload;
        },
        setRawContacts: (state, action: PayloadAction<TContact[]>) => {
            action.payload.map((item, index) => (
                state.raw_contacts[index] = item
            ))
        },
        setContactsSelected: (state, action: PayloadAction<TUser>) => {
            // state.contacts_selected = [...state.contacts_selected, action.payload]
            // state.contacts_selected = state.contacts_selected.push(action.payload);
        },
        setType_contact: (state, action: PayloadAction<number>) => {
            state.type_contact = action.payload;
        },
        setMessageInbox: (state, action: PayloadAction<string>) => {
            state.message_inbox = action.payload;
        },
        setResponseTo: (state, action: PayloadAction<string>) => {
            state.response_to = action.payload;
        },
        setTitleApp: (state, action: PayloadAction<string>) => {
            state.title = action.payload;
        },
        setTextContactSearch: (state, action: PayloadAction<string>) => {
            state.text_contact_search = action.payload;
        },
        setSelection: (state, action: PayloadAction<TSelection>) => {
            state.selection = action.payload;
        },
        setEmoji: (state, action: PayloadAction<string>) => {
            state.inputEmoji = action.payload;
        },
        setBusinessOpened: (state, action: PayloadAction<boolean>) => {
            state.business_opened = action.payload;
        },
        setExpensesOpened: (state, action: PayloadAction<boolean>) => {
            state.expenses_opened = action.payload;
        },
        setVoiceNoteBeingPlayed: (state, action: PayloadAction<string>) => {
            state.voice_note_being_played = action.payload;
        },
        setPhoneNumbersList: (state, action: PayloadAction<string>) => {

            const list = state.phone_numbers_list.filter(item => item === action.payload);

            if (action.payload === "") {
                state.phone_numbers_list = [];
            } else {
                if (list.length === 0) {
                    state.phone_numbers_list.push(action.payload);
                } else {
                    const llist2 = state.phone_numbers_list.filter(item => item !== action.payload);
                    state.phone_numbers_list = llist2;
                }
            }
        },
        // setBusinessBadge: (state, action: PayloadAction<TBusinessBadge[]>) => {
        //     state.business_badge = action.payload;
        // },
        // setAddBusinessBadge: (state, action: PayloadAction<TBusinessBadge>) => {
        //     state.business_badge.push(action.payload);
        // },
        // setRemoveBusinessBadge: (state, action: PayloadAction<string>) => {
        //     state.business_badge = state.business_badge.filter(el => el.business_id !== action.payload);
        // },
        // setRemoveSalesPointBadge: (state, action: PayloadAction<string>) => {
        //     state.business_badge = state.business_badge.filter(el => el.sales_point_id !== action.payload);
        // },
        // setRemoveChatBadge: (state, action: PayloadAction<string>) => {
        //     state.chats_badge = state.chats_badge.filter(el => el !== action.payload);
        // },
        // setAddChatBadge: (state, action: PayloadAction<string>) => {
        //     if (!state.chats_badge.includes(action.payload)) {
        //         state.chats_badge.push(action.payload);
        //     }
        // },
        setBusinessItemsFilter: (state, action: PayloadAction<string>) => {
            state.business_items_filter = action.payload;
        },
        setCategory: (state, action: PayloadAction<string>) => {
            state.category = action.payload;
        },
        setUserConnected: (state, action: PayloadAction<string>) => {
            const user_connected = state.users_connected.find(element => element === action.payload);

            if (user_connected === undefined) {
                state.users_connected.push(action.payload);
            }
        },
        // setCategory: (state, action: PayloadAction<string>) => {
        //     state.category = action.payload;
        // },
    }
})

export const {
    setShowFavoriteChats,
    setLoading,
    setLoadingHeader,
    setLoadingButton,
    setShowModalApp,
    setRawContacts,
    setMessageInbox,
    setResponseTo,
    setTitle,
    setRootNavigation,
    setMessageSelected,
    setType_contact,
    setContactsSelected,
    setTextContactSearch,
    setSearchContactEnabled,
    setRecordingAudio,
    setPlayingRecorded,
    setSelection,
    setEmoji,
    setShowCustomKeyboard,
    setBusinessOpened,
    setExpensesOpened,
    setPlayingVoiceNote,
    setVoiceNoteBeingPlayed,
    setPhoneNumbersList,
    // setAddChatBadge,
    // setRemoveChatBadge,
    setSearchYambiEnabled,
    setCurrentUser,
    setBusinessItemsFilter,
    setTextBusinessSearch,
    setCategory,
    setSearchYambiText } = appSlice.actions;

// Other code such as selectors can use the imported `RootState` type
export const selectApp = (state: RootState) => state.app;

export default appSlice.reducer;
