import { TMessageInboxUser, TItemPrices } from './types.d';
import { NavigationProp } from "@react-navigation/native";
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RefObject, useRef } from "react";

export type TStore = {
    contacts: TUser[],
    raw_contacts: TContact[],
    title: string,
    contacts_number: number,
    home_tab: number,
    message_input_tab: number,
    emojis_tab: number,
    message_inbox: string,
    search_contact_enabled: boolean,
    message_selected: string,
    modal_app: boolean,
    loading_connect: boolean,
    connected: boolean,
    response_to: string,
    recordingAudio: boolean,
    playingRecorded: boolean,
    playingAudio: boolean,
    response_to_text: string,
    response_to_token: string,
    text_contact_search: string,
    messages_chat: TChats[],
    raw_messages: TMessages[],
    messages_group: TMessagesGroup[],
    messages_users: TMessages[],
    presaved_messages_users: TMessages[],
    chats: TChats[],
    group_chat: TGroupChats[],
    groups: TGroup[],
    loading_button: boolean,
    loading: boolean,
    loading_header: boolean,
    playing_voice_note: boolean,
    voice_note_being_played: string,
    type_contact: number,
    contacts_selected: TUsers[],
    date_messages: string,
    sender_message: string,
    receiver_message: string,
    can_check_messages: boolean,
    can_check_messages_status: boolean,
    can_send_presaved_messages: boolean,
    can_set_messages_read: boolean,
    notifications_home_tab1: number,
    notifications_home_tab2: number,
    notifications_home_tab3: number,
    notifications_home_tab4: number,
    visible_images_view: boolean,
    scroll_to_end: boolean,
    rootNavigation?: any,
    messageInputRef: refType,
    selection: {
        start: number,
        end: number
    },
    inputEmoji: string,
    show_custom_keyboard: boolean,
    business_opened: boolean,
    chat_opened: boolean,
    app_opened: boolean,
    expenses_opened: boolean,
    chats_badge: string[],
    search_yambi_text: string,
    search_yambi: boolean,
    current_user: string,
    business_items_filter: string,
    text_business_search: string,
    phone_numbers_list: string[],
    chats_selected: string[],
    messages_selected: string[],
    users_connected: string[],
    show_favorite_chats: boolean,
    category: string,
    // message_photo_view: TMessage
}

type colorVariant = "background" | "primary" | "border" | "gray" | "high_color" | "text" | "design_tip_1" | "design_tip_2" | "text_design_1" | "text_design_2";

export type TSelection = {
    start: number,
    end: number
}

export type TEmoji = {
    code: string,
    emoji: string,
    name: string,
    category: string,
    subcategory: string,
    skintones: string
}

export type TDraft = {
    message_inbox: string,
    user: string,
    phone_number: string
}

export type TDrafts = TDraft[];

export type TPersistedStore = {
    raw_contacts: TContact[],
    langApp: string,
    theme_set: boolean,
    business_badge: TBusinessBadge[],
    business_subscriptions: TBusinessSubscription[],
    cart: TCartItem[],
    app_description: TAppDescription
}

export type TReaction = {
    phone_number: string,
    reaction: string
}

export type TReactions = TReaction[];

export type TUser = {
    user_id: string,
    user_names: string,
    phone_number: string,
    gender: number,
    birth_date: string,
    country: string,
    user_profile: string,
    profession: string,
    bio: string,
    user_email: string,
    user_address: string,
    status_information: string,
    user_password: string,
    account_privacy: number,
    user_level: number,
    user_active: number,
    user_verified: number,
    user_verified_at: string,
    notification_token: string,
    createdAt: string,
    updatedAt: string
}

export type TUsers = TUser[];

export type TMessagesGroup = {
    message_id: number,
    sender: number,
    receiver: number,
    gender: number,
    main_text_message: string,
    response_to: string,
    response_to_text: string,
    response_to_token: string,
    people_read: number[],
    message_effects: string,
    deleted: string,
    token: string,
    createdAt: string,
    updatedAt: string
}

export type TGroupChats = {
    group_id: number,
    chat_status: string,
    chat_type: string,
    last_message: string,
    count_messages: string,
    createdAt: string,
    updatedAt: string
}

export type TGroup = {
    group_id: number,
    group_name: string,
    group_status: string,
    group_valid: string,
    group_type: string,
    group_description: string,
    group_objectives: string,
    group_warning: string,
    group_restrictions: string,
    group_members: TUser[],
    createdAt: string,
    updatedAt: string
}

export type TTheme = {
    name: string,
    dark: boolean,
    statusbar: string,
    statusbar_tip1: string,
    statusbar_tip2: string,
    colors: {
        primary: string,
        background: string,
        success: string,
        error: string,
        card: string,
        text: string,
        border: string,
        like_border: string,
        other: string,
        notification: string,
        gray: string,
        high_color: string,
        high_color2: string,
        high_color3: string,
        chat_sent: string,
        chat_received: string,
        design_tip1: string,
        design_tip2: string,
        text_design1: string,
        text_design2: string,
        home_badge_background_color: string,
        home_badge_color: string,
        badge_background_color: string,
        badge_color: string,
        bottom_navigation_background: string,
        bottom_navigation_text: string,
        bottom_navigation_active: string,
        bottom_navigation_inactive: string,
        modal_background: string
    },
}

export type TCurrency = {
    code: string,
    name: string,
    symbol: string
}

export type TLanguageCountry = {
    code: string,
    name: string
}

export type TCountry = {
    name: string,
    code: string,
    capital: string,
    region: string,
    currency: TCurrency,
    language: TLanguageCountry,
    flag: string,
    dialling_code: string,
    isoCode: string
}

export type TContact = {
    displayName: string,
    phoneNumber: string
}

export type TMessages = TMessage[];

export type TChats = TChat[];

export type TGrouppedMessage = {
    title: string,
    data: TMessage
}

export type TMessage = {
    sender: string,
    receiver: string,
    main_text_message: string,
    caption: string,
    message_type: number,
    response_to: string,
    message_read: number,
    message_effect: number,
    reactions: string,
    flag: number,
    read_once: number,
    token: string,
    deleted: number,
    platform: string,
    createdAt: string,
    receivedAt: string,
    playedAt: string,
    readAt: string,
    cc: string,
    alignment: string
}

export type TChat = {
    _id: string,
    phone_number: string,
    user: string,
    type_chat: number,
    last_message: string,
    flag: number,
    chat_read: number,
    deleted: number,
    chat_effect: number,
    createdAt: string,
    updatedAt: string,
}

export type TAppDescription = {
    home_title_font_size: number,
    home_title_font_weight: string,
    title_font_size: number,
    title_font_weight: string,
    general_font_weight: string,
    general_font_size: number,
    big_general_font_weight: string,
    big_general_font_size: number,
    small_general_font_weight: string,
    small_general_font_size: number,
    sent_messages_font_weight: string,
    sent_messages_font_size: number,
    received_messages_font_weight: string,
    received_messages_font_size: number,
    inbox_spacing: number,
    inbox_title_size: number,
    inbox_title_font_weight: string,
    inbox_sender_image_size: number,
    inbox_receiver_image_size: number,
    inbox_sender_image_radius: number,
    inbox_receiver_image_radius: number,
    inbox_appearance_style: number,
    chat_appearance_style: number,
    show_sender_image: boolean,
    show_receiver_image: boolean,
    header_icons_size: number,
    input_chat_icons_size: number,
    bottom_navigator_icons_size: number,
    bottom_navigator_icons_style: number,
    chat_image_size: number,
    chat_image_radius: number,
    inbox_image_size: number,
    inbox_image_radius: number,
    home_user_image_size: number,
    home_user_image_radius: number,
    home_user_image_position: string,
    screen_padding: number,
    home_navigation_style: number,
    bottom_navigation_labels: boolean,
    after_sale: number,
    type_sale_board: number,
    close_sale_board_after_operation: number,
    require_password_business: boolean,
    require_password_chat: boolean,
    require_password_inbox: boolean,
    require_password_app: boolean,
    require_password_expenses: boolean,
    password_business: string,
    password_chat: string,
    password_inbox: string,
    password_app: string,
    password_expenses: string,
    enable_expense_reminder_notifications: boolean,
    tab_visible_chats: boolean,
    tab_visible_marketplace: boolean,
    tab_visible_business: boolean,
    tab_visible_expenses: boolean,
    tab_visible_admin: boolean,
    tab_visible_noticeboard: boolean,
}

export type TBusinessBadge = {
    business_id: string,
    sales_point_id: string,
    item_id: string,
    sale_id: string,
    seller: string
}

export type TSellsPoint = {
    _id: string,
    business_id: string,
    phone_number: string,
    sells_point_name: string,
    slogan: string,
    description_service: string,
    category: number,
    keywords?: string,
    tva: string,
    logo: string,
    phones: string,
    emails: string,
    background: string,
    country: string,
    sells_point_active: number,
    sells_point_address: string,
    sells_point_visible: number,
    website: string,
    other_links: string,
    yambi: string,
    notifications: number,
    createdAt: string,
    updatedAt: string
}

export type TStory = {
    _id: string,
    phone_number: string,
    type_story: number,
    main_text: string,
    caption: string,
    mentions: string,
    comments: string,
    reactions: string,
    viewers: string,
    only_with: string,
    excluded: string,
    reposts: string,
    story_privacy: number,
    createdAt: string,
    updatedAt: string,
    expiresAt: string
}

export type TBusiness = {
    _id: string,
    phone_number: string,
    business_name: string,
    slogan: string,
    description_service: string,
    category: number,
    keywords: string,
    currency: number,
    national_number: string,
    national_id: string,
    tax_number: string,
    country: string,
    state: string,
    city: string,
    logo: string,
    phones: string,
    emails: string,
    background: string,
    business_active: number,
    business_address: string,
    business_visible: number,
    website: string,
    other_links: string,
    yambi: string,
    valid_until: string,
    createdAt: string,
    updatedAt: string
}

export type TCompany = {
    _id: string,
    company_name: string,
    company_name_abb: string,
    category: number,
    company_type: number,
    description_service: string,
    country: string,
    slogan: string,
    logo: string,
    background: string,
    phones: string,
    emails: string,
    company_address: string,
    national_number: string,
    national_id: string,
    tax_number: string,
    keywords: string,
    bio: string,
    status_information: string,
    subscription_active: number,
    valid_until: string,
    links: string,
    company_active: number,
    certified: number,
    createdAt: string,
    updatedAt: string
}

export type TTimetableEntry = {
    _id: string;
    date_news: string;
    morning?: string;
    morning_time?: string;
    morning_time_end?: string;
    afternoon?: string;
    afternoon_time?: string;
    afternoon_time_end?: string;
    evening?: string;
    evening_time?: string;
    evening_time_end?: string;
    tags?: string;
    createdAt: string;
    updatedAt: string;
}

export type TNews = {
    _id: string;
    company_id: string;
    phone_number?: string;
    title: string;
    description?: string;
    content: string;
    tags?: string;
    image?: string;
    images?: string;
    news_type?: number; // 1 for normal news, 2 for timetable
    timetable_id?: string;
    start_date?: string;
    end_date?: string;
    date_news?: string;
    morning?: string;
    morning_time?: string;
    morning_time_end?: string;
    afternoon?: string;
    afternoon_time?: string;
    afternoon_time_end?: string;
    evening?: string;
    evening_time?: string;
    evening_time_end?: string;
    entries?: TTimetableEntry[]; // Array of entries for timetable groups
    createdAt: string;
    updatedAt: string;
}

export type TCompanyUser = {
    _id: string,
    company_id: string,
    phone_number: string,
    user_name: string,
    service_name: string,
    service_name_abb: string,
    level: number,
    role: string,
    tags: string,
    user_active: number,
    is_admin?: number,
    createdAt: string,
    updatedAt: string
}

export type TItem = {
    _id: string,
    business_id: string,
    phone_number: string,
    item_name: string,
    slogan: string,
    item_type: number,
    category: string,
    subcategory: string,
    manufacture_date: string,
    expiry_date: string,
    supplier: string,
    other_information: string,
    alert_low_stock: number,
    wholesale_content_number: number,
    items_number_stock: number,
    items_number_warehouse: number,
    description_item: string,
    keywords: string,
    images: string,
    background: string,
    item_active: number,
    uploaded: number,
    createdAt: string,
    updatedAt: string,
    colors: string,
    discount_percentage: number,
    discount_start_date: string,
    discount_end_date: string,
    marketplace_visibility: number,
    weights: string,
    sizes: string,
    flag: number,
    is_best_seller: number,
    visibility_rank: number,
    is_featured: number
}

export type TItemPrices = {
    _id: string,
    item_id: string,
    phone_number: string,
    wholesale_cost_price: string,
    wholesale_selling_price: string,
    retail_selling_price: string,
    uploaded: number,
    currency: number
}

export type TSale = {
    _id: string,
    item_id: string,
    business_id: string,
    sales_point_id: string,
    sale_operator: string,
    number: number,
    description: string,
    cost_price: string,
    selling_price: string,
    delivery_price: string,
    delivery_address: string,
    delivery_time: string,
    delivery_status: number,
    discount_price: string,
    type_sale: number,
    buyer_name: string,
    buyer_phone: string,
    uploaded: number,
    sale_active: number,
    country: string,
    agent_paid: string,
    currency: number,
    createdAt: string,
    updatedAt: string
}

export type TExpense = {
    _id: string,
    title: string,
    business_id: string,
    sales_point_id: string,
    phone_number: string,
    amount: string,
    currency: number,
    description: string,
    category: number,
    payment_type: number,
    debt: number,
    expense_active: number,
    wallet: number,
    uploaded: number,
    createdAt: string,
    updatedAt: string
}

export type TAppData = {
    _id: string,
    app_version_code: string,
    app_version_name: string,
    can_show_ads: number,
    can_show_personalized_ads: number,
    type_main_ads: number,
    createdAt: string,
    updatedAt: string
}

export type TMarketing = {
    _id: string,
    business_id: string,
    sales_point_id: string,
    item_id: string,
    pub_title: string,
    pub_description: string,
    visibility_level: number,
    image: string,
    valid_until: string,
    pub_active: number,
    extra_link: string,
    cretedAt: string,
    updatedAt: string
}

export type TReaction = {
    business_id: string,
    sales_point_id: string,
    item_id: string,
    reaction_type: number
    comment_text: string
}

export type TBusinessUser = {
    _id: string,
    business_id: string,
    sales_point_id: string,
    user_name: string,
    phone_number: string,
    user: string,
    level: number,
    user_active: number,
    createdAt: string,
    updatedAt: string
}

export type TBusinessSubscription = {
    _id: string,
    phone_number: string,
    business_id: string,
    amount: number,
    currency: string,
    subscription_start_date: string,
    subscription_end_date: string,
    subscription_type: number,
    subscription_plan: number,
    stripe_payment_intent_id: string,
    stripe_subscription_id: string,
    stripe_customer_id: string,
    payment_phone_number: string,
    payment_type: number,
    payment_status: number,
    serdi_session_id: string,
    serdi_transaction_token: string,
    serdi_transaction_status: number,
    plan_name?: string,
    is_active?: boolean,
    is_expired?: boolean,
    createdAt: string,
    updatedAt: string
}

export type TCartItem = {
    business: TBusiness,
    item: TItem,
    sales_points: TSellsPoint[],
    prices: TItemPrices
}

/** Server + Realm inventory movement row (list + detail) */
export type TInventoryMovement = {
    _id: string;
    phone_number: string;
    business_id: string;
    item_id: string;
    item_name?: string;
    movement_type: number;
    quantity?: number;
    quantity_stock: number;
    quantity_warehouse: number;
    description: string;
    createdAt: string;
    updatedAt: string;
};

export type RootStackParamList = {
    Home: undefined;
    Inbox: { user: string };
    SplashStartYambi: undefined;
    Signup: undefined;
    Themes: undefined;
    NewGroup: undefined;
    NewChat: undefined;
    SettingsYambi: undefined;
    Languages: undefined;
    PictureMessage: { user: string };
    ViewFullInboxImage: { message: string };
    NewBusiness: undefined;
    AboutYambi: undefined;
    Business: { business_id: string };
    /** Deep link: https://app.yambi.net/business/:business_id */
    BusinessModern: { business_id: string };
    BusinessViewModern: { business: TBusiness };
    NewBusinessItem: { business_id: string; can_upload_images?: boolean };
    /** flag omitted + sales_point_id omitted ⇒ public catalog (e.g. https://app.yambi.net/business/:business_id) */
    BusinessItems: { business_id: string, flag?: number, sales_point_id?: string, can_upload_images?: boolean, max_articles?: number, hide_inventory_profit_overview?: boolean, from_deep_link?: boolean, from_business_item?: boolean };
    /** Full cart row from marketplace, or `{ item_id }` from https://app.yambi.net/item/:item_id. `from_business_inventory` when opened from BusinessItems catalog. */
    BusinessItem: (TCartItem | { item_id: string }) & { from_business_inventory?: boolean } & { from_marketplace?: boolean };
    EditProfile: { user: TUser };
    SalesPoint: { sales_point_id: string };
    ViewPhoto: { source?: string; images?: string[]; initialIndex?: number; title?: string };
    EditBusinessItem: { item_id: string, business_id: string, can_upload_images?: boolean };
    RenewStock: { item_id: string; business_id: string };
    NewBusinessUser: { sales_point_id: string, business_id: string };
    EditBusinessUser: { sales_point_id: string, business_id: string, user: TBusinessUser };
    NewSalesPoint: { business_id: string };
    BusinessSales: { business_id: string; sales_point_id: string; item_id: string };
    ItemSales: { business_id: string; sales_point_id: string; item_id: string };
    SalesPointSales: { sales_point_id: string };
    Sale: { item_id: string, sales_point_id: string };
    EditBusiness: { business: TBusiness };
    EditSalesPoint: { sales_point: TSellsPoint };
    UserBusinessUsers: { business_id: string };
    BusinessSubscribers: { business_id: string };
    ContactUs: { flag: number };
    Customize: undefined;
    CustomizeBusiness: undefined;
    CustomizeExpenses: undefined;
    MessageUs: undefined;
    MyAccount: undefined;
    Companies: { fromNoticeBoard?: boolean; fromPlusButton?: boolean };
    Company: { company_id: string; company?: TCompany };
    NewCompany: undefined;
    NewCompanyUser: { company_id: string };
    EditCompany: { company: TCompany };
    EditCompanyUser: { company_user: TCompanyUser };
    CompanyUser: { company_user: TCompanyUser; company?: TCompany | null };
    AddNews: undefined;
    EditNews: { news: TNews };
    ForwardMessage: { message_id: string };
    MessageInfo: { message_id: string, flag: number };
    UserProfileInfo: { user: TUser };
    AllMessages: { messages: TMessages };
    NewStory: { flag: number };
    UserStories: { phone_number: string };
    Stories: undefined;
    UpdateYambi: undefined;
    MakeDonation: undefined;
    Timetables: undefined;
    AddBusinessSubscription: { business_id: string; subscription_plan?: number; use_stripe?: boolean };
    SelectPaymentType: { business_id: string; subscription_plan: number; duration_months: number; amount: number };
    BusinessSubscriptionPlans: { business_id: string };
    SubscriptionHistory: { business_id: string };
    ShareBusiness: {
        share_kind: 'business' | 'item';
        business_id: string;
        business_name?: string;
        item_id?: string;
        item_name?: string;
    };
    BusinessInventoryMovementHistory: { business_id: string };
    InventoryMovement: { movement: TInventoryMovement };
    AddItemSale: { item: TItem, prices: TItemPrices, sales_point_id: string, business_id: string };
    Cart: undefined;
    CategoryItems: { category: string };
    SearchMarketplace: undefined;
    Calculator: undefined;
    AddExpense: { category_id?: number };
    EditExpense: { expense_id: string };
    Expense: { expense_id: string };
    CategoryExpenses: { category_id: number; category_name?: string };
    PostNews: { company: TCompany, flag: number };
    News: { flag?: number, company_id?: string };
    Post: { post?: TNews; id?: string };
    PostReactions: { post: TNews };
};

type NavProps = NativeStackScreenProps<RootStackParamList, 'Home', 'Inbox', 'SplashStartYambi', 'Signup', 'Themes', 'NewGroup', 'NewChat', 'SettingsYambi', 'Languages', 'PictureMessage', 'ViewFullInboxImage', 'NewBusiness', 'AboutYambi', 'NewBusinessItem', 'BusinessItems', 'EditBusinessItem', 'RenewStock', 'NewSalesPoint', 'EditBusiness', 'EditSalesPoint', 'BusinessSales', 'SalesPointSales', 'NewBusinessUser', 'Sale', 'BusinessItem', 'BusinessModern', 'EditSalesPoint', 'CustomizeBusiness', 'MessageUs', 'UserBusinessUsers', 'BusinessSubscribers', 'EditBusinessUser', 'ItemSales', 'EditProfile', 'ViewPhoto', 'ContactUs', 'MyAccount', 'Companies', 'Company', 'NewCompany', 'NewCompanyUser', 'EditCompany', 'EditCompanyUser', 'CompanyUser', 'ForwardMessage', 'MessageInfo', 'UserProfileInfo', 'AllMessages', 'NewStory', 'Stories', 'UserStories', 'UpdateYambi', 'AddItemSale', 'Cart', 'CategoryItems', 'SearchMarketplace', 'Calculator', 'PostNews', 'EditNews', 'News', 'Post', 'PostReactions', 'BusinessInventoryMovementHistory', 'InventoryMovement', 'ShareBusiness'>;

