import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../app/store';
import { TBusinessBadge, TBusinessSubscription, TCartItem, TContact, TPersistedStore } from '../../types/types';

const initialState: TPersistedStore = {
    raw_contacts: [],
    langApp: '',
    theme_set: false,
    business_badge: [],
    business_subscriptions: [],
    cart: [],
    app_description: {
        home_title_font_size: 22,
        home_title_font_weight: '900',
        title_font_size: 20,
        title_font_weight: 'normal',
        general_font_weight: '600',
        general_font_size: 16,
        big_general_font_weight: '900',
        big_general_font_size: 18,
        small_general_font_weight: '500',
        small_general_font_size: 14,
        sent_messages_font_weight: '400',
        sent_messages_font_size: 16,
        received_messages_font_weight: '400',
        received_messages_font_size: 16,
        inbox_spacing: 2,
        inbox_title_size: 18,
        inbox_title_font_weight: '900',
        inbox_sender_image_size: 20,
        inbox_receiver_image_size: 20,
        inbox_sender_image_radius: 20,
        inbox_receiver_image_radius: 20,
        inbox_appearance_style: 0,
        chat_appearance_style: 0,
        show_sender_image: false,
        show_receiver_image: false,
        header_icons_size: 20,
        input_chat_icons_size: 20,
        bottom_navigator_icons_size: 20,
        bottom_navigator_icons_style: 1,
        chat_image_size: 45,
        chat_image_radius: 45,
        inbox_image_size: 40,
        inbox_image_radius: 40,
        home_user_image_size: 40,
        home_user_image_radius: 40,
        home_user_image_position: 'right',
        screen_padding: 15,
        home_navigation_style: 0,
        bottom_navigation_labels: true,
        type_sale_board: 0,
        after_sale: 1,
        close_sale_board_after_operation: 0,
        require_password_business: false,
        require_password_chat: false,
        require_password_inbox: false,
        require_password_app: false,
        require_password_expenses: false,
        password_business: "",
        password_chat: "",
        password_inbox: "",
        password_app: "",
        password_expenses: "",
        tab_visible_chats: true,
        tab_visible_marketplace: false,
        tab_visible_business: true,
        tab_visible_expenses: true,
        tab_visible_admin: true,
        tab_visible_noticeboard: false,
        enable_expense_reminder_notifications: true,
    }
}

export const persistedAppSlice = createSlice({
    name: 'persistedApp',
    initialState,
    reducers: {
        // setFirstUse: (state, action: PayloadAction<boolean>) => {
        //     state.first_use = action.payload
        // },
        setThemeSet: (state, action: PayloadAction<boolean>) => {
            state.theme_set = action.payload;
        },
        setLanguageApp: (state, action: PayloadAction<string>) => {
            state.langApp = action.payload;
        },
        // setLoadingButton: (state, action: PayloadAction<boolean>) => {
        //     state.loading_button = action.payload;
        // },
        // setShowModalApp: (state, action: PayloadAction<boolean>) => {
        //     state.modal_app = action.payload;
        // },
        // setTitle: (state, action: PayloadAction<string>) => {
        //     state.title = action.payload;
        // },
        // setSearchContactEnabled: (state, action: PayloadAction<boolean>) => {
        //     state.search_contact_enabled = action.payload;
        // },
        // setRawContacts: (state, action: PayloadAction<TContact[]>) => {
        //     action.payload.map((item, index) => (
        //         state.raw_contacts[index] = item
        //     ))
        // },
        // updateContacts: (state, action: PayloadAction<TUser[]>) => {
        //     action.payload.map((item, index) => (
        //         state.contacts[index] = item
        //     ))
        // },
        setAfterSale: (state, action: PayloadAction<number>) => {
            state.app_description.after_sale = action.payload;
        },
        setTypeSaleBoard: (state, action: PayloadAction<number>) => {
            state.app_description.type_sale_board = action.payload;
        },
        setCloseSaleBoardAfterOperation: (state, action: PayloadAction<number>) => {
            state.app_description.close_sale_board_after_operation = action.payload;
        },
        setRequirePasswordBusiness: (state, action: PayloadAction<boolean>) => {
            state.app_description.require_password_business = action.payload;
        },
        setPasswordBusiness: (state, action: PayloadAction<string>) => {
            state.app_description.password_business = action.payload;
        },
        setRequirePasswordExpenses: (state, action: PayloadAction<boolean>) => {
            state.app_description.require_password_expenses = action.payload;
        },
        setPasswordExpenses: (state, action: PayloadAction<string>) => {
            state.app_description.password_expenses = action.payload;
        },
        setEnableExpenseReminderNotifications: (state, action: PayloadAction<boolean>) => {
            state.app_description.enable_expense_reminder_notifications = action.payload;
        },
        setTabVisibleChats: (state, action: PayloadAction<boolean>) => {
            state.app_description.tab_visible_chats = action.payload;
        },
        setTabVisibleMarketplace: (state, action: PayloadAction<boolean>) => {
            state.app_description.tab_visible_marketplace = action.payload;
        },
        setTabVisibleBusiness: (state, action: PayloadAction<boolean>) => {
            state.app_description.tab_visible_business = action.payload;
        },
        setTabVisibleExpenses: (state, action: PayloadAction<boolean>) => {
            state.app_description.tab_visible_expenses = action.payload;
        },
        setTabVisibleAdmin: (state, action: PayloadAction<boolean>) => {
            state.app_description.tab_visible_admin = action.payload;
        },
        setTabVisibleNoticeboard: (state, action: PayloadAction<boolean>) => {
            state.app_description.tab_visible_noticeboard = action.payload;
        },
        setBusinessBadge: (state, action: PayloadAction<TBusinessBadge[]>) => {
            state.business_badge = action.payload;
        },
        setBusinessSubscriptions: (state, action: PayloadAction<TBusinessSubscription[]>) => {
            // Always replace local persisted subscriptions with fresh server data.
            state.business_subscriptions = [];
            state.business_subscriptions = [...action.payload];
        },
        setBusinessSubscriptionData: (state, action: PayloadAction<{ business_id: string, subscriptions: TBusinessSubscription[] }>) => {
            const { business_id, subscriptions } = action.payload;
            const keptSubscriptions = (state.business_subscriptions || []).filter(sub => sub.business_id !== business_id);
            state.business_subscriptions = [...keptSubscriptions, ...subscriptions];
        },
        setAddBusinessBadge: (state, action: PayloadAction<TBusinessBadge>) => {
            if (state.business_badge) {
                state.business_badge.push(action.payload);
            } else {
                state.business_badge = [];
                state.business_badge.push(action.payload);
            }
        },
        setRemoveBusinessBadge: (state, action: PayloadAction<string>) => {
            if (state.business_badge) {
                state.business_badge = state.business_badge.filter(el => el.business_id !== action.payload);
            }
        },
        setRemoveSalesPointBadge: (state, action: PayloadAction<string>) => {
            if (state.business_badge) {
                state.business_badge = state.business_badge.filter(el => el.sales_point_id !== action.payload);
            }
        },
        setDefaultMessageSettingsData: (state) => {
            // if (state.app_description.inbox_appearance_style) {
            state.app_description.inbox_appearance_style = 0;
            // }
        },
        setRawContactsPersisted: (state, action: PayloadAction<TContact[]>) => {
            // action.payload.map((item, index) => {

            //     const contact = state.raw_contacts.find(element => element.phoneNumber === item.phoneNumber);

            //     if (contact === undefined) {
            //         return state.raw_contacts[index] = item;
            //     }
            // });
            state.raw_contacts = action.payload;
        },
        setAddRemoveCartItem: (state, action: PayloadAction<TCartItem>) => {
            if (!state.cart || state.cart === undefined) state.cart = [];

            const exist = state.cart.find(c => c.item._id === action.payload.item._id);

            if (exist === undefined) {
                state.cart.push(action.payload);
            } else {
                state.cart = state.cart.filter(c => c.item._id !== action.payload.item._id);
            }
        },
        setResetCart: (state) => {
            state.cart = []
        },
        resetPersistedApp: (state) => {
            state.raw_contacts = [];
            state.business_badge = [];
            state.business_subscriptions = [];
            state.cart = [];
            if (state.app_description) {
                state.app_description.require_password_business = false;
                state.app_description.require_password_chat = false;
                state.app_description.require_password_inbox = false;
                state.app_description.require_password_app = false;
                state.app_description.require_password_expenses = false;
                state.app_description.password_business = "";
                state.app_description.password_chat = "";
                state.app_description.password_inbox = "";
                state.app_description.password_app = "";
                state.app_description.password_expenses = "";
                state.app_description.enable_expense_reminder_notifications = true;
            }
        }
    }
})

export const {
    setThemeSet,
    setLanguageApp,
    setAfterSale,
    setTypeSaleBoard,
    setCloseSaleBoardAfterOperation,
    setRequirePasswordBusiness,
    setPasswordBusiness,
    setRequirePasswordExpenses,
    setPasswordExpenses,
    setEnableExpenseReminderNotifications,
    setTabVisibleChats,
    setTabVisibleMarketplace,
    setTabVisibleBusiness,
    setTabVisibleExpenses,
    setTabVisibleAdmin,
    setTabVisibleNoticeboard,
    setBusinessBadge,
    setBusinessSubscriptions,
    setBusinessSubscriptionData,
    setAddBusinessBadge,
    setRemoveBusinessBadge,
    setRemoveSalesPointBadge,
    setRawContactsPersisted,
    setAddRemoveCartItem,
    setResetCart,
    resetPersistedApp,
    setDefaultMessageSettingsData } = persistedAppSlice.actions;

// Other code such as selectors can use the imported `RootState` type
export const selectPersistedApp = (state: RootState) => state.persisted_app;

export default persistedAppSlice.reducer;
