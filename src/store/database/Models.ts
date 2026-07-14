import Realm, { ObjectSchema } from 'realm';

export class UsersMessages extends Realm.Object<UsersMessages> {
    alignment!: string;
    sender!: string;
    receiver!: string;
    main_text_message!: string;
    caption!: string;
    message_type!: number;
    response_to!: string;
    message_read!: number;
    message_effect!: number;
    reactions!: string;
    flag!: number;
    token!: string;
    read_once!: number;
    platform!: string;
    deleted!: number;
    createdAt!: string;
    receivedAt!: string;
    playedAt!: string;
    readAt!: string;
    cc!: string;

    static schema: ObjectSchema = {
        name: 'UsersMessages',
        properties: {
            alignment: 'string',
            sender: 'string',
            receiver: 'string',
            main_text_message: 'string',
            caption: 'string',
            message_type: 'int',
            response_to: 'string',
            message_read: 'int',
            reactions: 'string',
            flag: 'int',
            read_once: 'int',
            platform: 'string',
            message_effect: 'int',
            token: { type: 'string', indexed: true },
            deleted: 'int',
            createdAt: 'string',
            receivedAt: 'string',
            playedAt: 'string',
            readAt: 'string',
            cc: 'string',
        },
        primaryKey: 'token',
    };
}

export class GroupMessages extends Realm.Object<GroupMessages> {
    alignment!: string;
    sender!: string;
    receiver!: string;
    main_text_message!: string;
    caption!: string;
    message_type!: number;
    response_to!: string;
    message_read!: string;
    message_effect!: number;
    reactions!: string;
    flag!: number;
    token!: string;
    read_once!: number;
    platform!: string;
    deleted!: number;
    createdAt!: string;
    receivedAt!: string;
    playedAt!: string;
    readAt!: string;
    cc!: string;

    static schema: ObjectSchema = {
        name: 'GroupMessages',
        properties: {
            alignment: 'string',
            sender: 'string',
            receiver: 'string',
            main_text_message: 'string',
            caption: 'string',
            message_type: 'int',
            response_to: 'string',
            message_read: 'string',
            reactions: 'string',
            flag: 'int',
            read_once: 'int',
            platform: 'string',
            message_effect: 'int',
            token: { type: 'string', indexed: true },
            deleted: 'int',
            createdAt: 'string',
            receivedAt: 'string',
            playedAt: 'string',
            readAt: 'string',
            cc: 'string',
        },
        primaryKey: 'token',
    };
}

export class UserChats extends Realm.Object<UserChats> {
    _id!: string;
    phone_number!: string;
    user!: string;
    type_chat!: number;
    last_message!: string;
    flag!: number;
    chat_read!: number;
    deleted!: number;
    chat_effect!: number;
    createdAt!: string;
    updatedAt!: string;

    static schema: ObjectSchema = {
        name: 'UserChats',
        properties: {
            _id: 'string',
            phone_number: 'string',
            user: 'string',
            type_chat: 'int',
            last_message: 'string',
            flag: 'int',
            chat_read: 'int',
            deleted: 'int',
            chat_effect: 'int',
            createdAt: 'string',
            updatedAt: 'string',
        },
        primaryKey: '_id',
    };
}

export class UserBusinesses extends Realm.Object<UserBusinesses> {
    _id!: string;
    phone_number!: string;
    business_name!: string;
    slogan!: string;
    description_service!: string;
    category!: number;
    keywords!: string;
    logo!: string;
    phones!: string;
    emails!: string;
    national_number!: string;
    national_id!: string;
    tax_number!: string;
    country!: string;
    state!: string;
    city!: string;
    currency!: number;
    background!: string;
    business_active!: number;
    business_address!: string;
    business_visible!: number;
    website!: string;
    other_links!: string;
    yambi!: string;
    valid_until!: string;
    createdAt!: string;
    updatedAt!: string;

    static schema: ObjectSchema = {
        name: 'Businesses',
        properties: {
            _id: 'string',
            phone_number: 'string',
            business_name: 'string',
            slogan: 'string',
            description_service: 'string',
            national_number: 'string',
            national_id: 'string',
            tax_number: 'string',
            country: 'string',
            state: 'string',
            city: 'string',
            category: 'int',
            currency: 'int',
            keywords: 'string',
            logo: 'string',
            phones: 'string',
            emails: 'string',
            background: 'string',
            business_active: 'int',
            business_address: 'string',
            business_visible: 'int',
            website: 'string',
            other_links: 'string',
            yambi: 'string',
            valid_until: 'string',
            createdAt: 'string',
            updatedAt: 'string'
        },
        primaryKey: '_id',
    };
}

export class YambiBusinesses extends Realm.Object<YambiBusinesses> {
    _id!: string;
    phone_number!: string;
    business_name!: string;
    slogan!: string;
    description_service!: string;
    category!: number;
    keywords!: string;
    logo!: string;
    phones!: string;
    emails!: string;
    national_number!: string;
    national_id!: string;
    tax_number!: string;
    country!: string;
    state!: string;
    city!: string;
    currency!: number;
    background!: string;
    business_active!: number;
    business_address!: string;
    business_visible!: number;
    website!: string;
    other_links!: string;
    yambi!: string;
    valid_until!: string;
    createdAt!: string;
    updatedAt!: string;

    static schema: ObjectSchema = {
        name: 'YambiBusinesses',
        properties: {
            _id: 'string',
            phone_number: 'string',
            business_name: 'string',
            slogan: 'string',
            description_service: 'string',
            national_number: 'string',
            national_id: 'string',
            tax_number: 'string',
            country: 'string',
            state: 'string',
            city: 'string',
            category: 'int',
            currency: 'int',
            keywords: 'string',
            logo: 'string',
            phones: 'string',
            emails: 'string',
            background: 'string',
            business_active: 'int',
            business_address: 'string',
            business_visible: 'int',
            website: 'string',
            other_links: 'string',
            yambi: 'string',
            valid_until: 'string',
            createdAt: 'string',
            updatedAt: 'string'
        },
        primaryKey: '_id',
    };
}

export class UserSellsPoints extends Realm.Object<UserSellsPoints> {
    _id!: string;
    phone_number!: string;
    sells_point_name!: string;
    business_id!: string;
    slogan!: string;
    description_service!: string;
    category!: number;
    tva!: string;
    logo!: string;
    phones!: string;
    emails!: string;
    background!: string;
    country!: string;
    sells_point_active!: number;
    sells_point_address!: string;
    sells_point_visible!: number;
    notifications!: number;
    website!: string;
    other_links!: string;
    yambi!: string;
    createdAt!: string;
    updatedAt!: string;

    static schema: ObjectSchema = {
        name: 'SellsPoints',
        properties: {
            _id: 'string',
            phone_number: 'string',
            business_id: 'string',
            sells_point_name: 'string',
            slogan: 'string',
            description_service: 'string',
            notifications: 'int',
            category: 'int',
            tva: 'string',
            logo: 'string',
            phones: 'string',
            emails: 'string',
            background: 'string',
            country: 'string',
            sells_point_active: 'int',
            sells_point_address: 'string',
            sells_point_visible: 'int',
            website: 'string',
            other_links: 'string',
            yambi: 'string',
            createdAt: 'string',
            updatedAt: 'string'
        },
        primaryKey: '_id',
    };
}

export class YambiUsers extends Realm.Object<YambiUsers> {
    user_id!: string;
    user_names!: string;
    phone_number!: string;
    gender!: number;
    birth_date!: string;
    country!: string;
    user_profile!: string;
    profession!: string;
    bio!: string;
    user_email!: string;
    user_address!: string;
    status_information!: string;
    user_password!: string;
    user_level!: number;
    user_active!: number;
    user_verified!: number;
    user_verified_at!: string;
    account_privacy!: number;
    notification_token!: string;
    createdAt!: string;
    updatedAt!: string;

    static schema: ObjectSchema = {
        name: 'YambiUsers',
        properties: {
            user_id: 'string',
            user_names: 'string',
            phone_number: 'string',
            gender: 'int',
            birth_date: 'string',
            country: 'string',
            user_profile: 'string',
            profession: 'string',
            bio: 'string',
            user_email: 'string',
            user_address: 'string',
            status_information: 'string',
            user_password: 'string',
            user_level: 'int',
            user_active: 'int',
            user_verified: 'int',
            user_verified_at: 'string',
            account_privacy: 'int',
            notification_token: 'string',
            createdAt: 'string',
            updatedAt: 'string',
        },
        primaryKey: 'user_id',
    };
}

export class YambiGroups extends Realm.Object<YambiGroups> {
    _id!: string;
    user_names!: string;
    description!: string;
    group_type!: string;
    group_profile!: string;
    background!: string;
    user_email!: string;
    group_address!: string;
    status_information!: string;
    phone_number!: string;
    certified!: number;
    account_privacy!: string;
    account_valid!: string;
    notification_token!: string;
    createdAt!: string;
    updatedAt!: string;

    static schema: ObjectSchema = {
        name: 'YambiGroups',
        properties: {
            _id: 'string',
            user_names: 'string',
            description: 'string',
            group_type: 'string',
            group_profile: 'string',
            background: 'string',
            user_email: 'string',
            group_address: 'string',
            status_information: 'string',
            phone_number: 'string',
            certified: 'int',
            account_privacy: 'string',
            account_valid: 'string',
            notification_token: 'string',
            createdAt: 'string',
            updatedAt: 'string'
        },
        primaryKey: '_id',
    };
}

export class Stories extends Realm.Object<Stories> {
    _id!: string;
    phone_number!: string;
    type_story!: number;
    main_text!: string;
    caption!: string;
    mentions!: string;
    comments!: string;
    reactions!: string;
    viewers!: string;
    only_with!: string;
    excluded!: string;
    reposts!: string;
    story_privacy!: number;
    createdAt!: string;
    updatedAt!: string;
    expiresAt!: string;

    static schema: ObjectSchema = {
        name: 'Stories',
        properties: {
            _id: 'string',
            phone_number: 'string',
            type_story: 'int',
            main_text: 'string',
            comments: 'string',
            mentions: 'string',
            caption: 'string',
            reactions: 'string',
            viewers: 'string',
            only_with: 'string',
            excluded: 'string',
            reposts: 'string',
            story_privacy: 'int',
            createdAt: 'string',
            updatedAt: 'string',
            expiresAt: 'string'
        },
        primaryKey: '_id',
    };
}

export class UserData extends Realm.Object<UserData> {
    user_id!: string;
    user_names!: string;
    phone_number!: string;
    gender!: number;
    birth_date!: string;
    country!: string;
    user_profile!: string;
    profession!: string;
    bio!: string;
    user_email!: string;
    user_address!: string;
    status_information!: string;
    user_password!: string;
    account_privacy!: number;
    user_level!: number;
    user_active!: number;
    user_verified!: number;
    user_verified_at!: string;
    notification_token!: string;
    createdAt!: string;
    updatedAt!: string;

    static schema: ObjectSchema = {
        name: 'UserData',
        properties: {
            user_id: 'string',
            user_names: 'string',
            phone_number: 'string',
            gender: 'int',
            birth_date: 'string',
            country: 'string',
            user_profile: 'string',
            profession: 'string',
            bio: 'string',
            user_email: 'string',
            user_address: 'string',
            status_information: 'string',
            user_password: 'string',
            account_privacy: 'int',
            user_level: 'int',
            user_active: 'int',
            user_verified: 'int',
            user_verified_at: 'string',
            notification_token: 'string',
            createdAt: 'string',
            updatedAt: 'string',
        },
        primaryKey: 'user_id',
    };
}

export class UserContacts extends Realm.Object<UserContacts> {
    user_id!: string;
    user_names!: string;
    phone_number!: string;
    gender!: number;
    birth_date!: string;
    country!: string;
    user_profile!: string;
    profession!: string;
    bio!: string;
    user_email!: string;
    user_address!: string;
    status_information!: string;
    user_password!: string;
    account_privacy!: number;
    user_level!: number;
    user_active!: number;
    user_verified!: number;
    user_verified_at!: string;
    notification_token!: string;
    createdAt!: string;
    updatedAt!: string;

    static schema: ObjectSchema = {
        name: 'UserContacts',
        properties: {
            user_id: 'string',
            user_names: 'string',
            phone_number: 'string',
            gender: 'int',
            birth_date: 'string',
            country: 'string',
            user_profile: 'string',
            profession: 'string',
            bio: 'string',
            user_email: 'string',
            user_address: 'string',
            status_information: 'string',
            user_password: 'string',
            account_privacy: 'int',
            user_level: 'int',
            user_active: 'int',
            user_verified: 'int',
            user_verified_at: 'string',
            notification_token: 'string',
            createdAt: 'string',
            updatedAt: 'string',
        },
        primaryKey: 'user_id',
    };
}

export class BusinessItemsSale extends Realm.Object<BusinessItemsSale> {
    _id!: string;
    item_id!: string;
    business_id!: string;
    sales_point_id!: string;
    sale_operator!: string;
    number!: number;
    cost_price!: string;
    selling_price!: string;
    delivery_price!: string;
    delivery_address!: string;
    delivery_time!: string;
    delivery_status!: number;
    discount_price!: string;
    type_sale!: number;
    buyer_name!: string;
    buyer_phone!: string;
    uploaded!: number;
    currency!: number;
    country!: string;
    sale_active!: number;
    createdAt!: string;
    updatedAt!: string;

    static schema: ObjectSchema = {
        name: 'BusinessItemsSale',
        properties: {
            _id: 'string',
            item_id: 'string',
            business_id: 'string',
            sales_point_id: 'string',
            sale_operator: 'string',
            number: 'int',
            cost_price: 'string',
            selling_price: 'string',
            delivery_price: 'string',
            delivery_address: 'string',
            delivery_time: 'string',
            discount_price: 'string',
            uploaded: 'int',
            type_sale: 'int',
            buyer_name: 'string',
            buyer_phone: 'string',
            sale_active: 'int',
            currency: 'int',
            country: 'string',
            createdAt: 'string',
            updatedAt: 'string'
        },
        primaryKey: '_id',
    };
}

export class ItemPrices extends Realm.Object<ItemPrices> {
    _id!: string;
    item_id!: string;
    phone_number!: string;
    wholesale_cost_price!: string;
    wholesale_selling_price!: string;
    retail_selling_price!: string;
    uploaded!: number;
    currency!: number;

    static schema: ObjectSchema = {
        name: 'ItemPrices',
        properties: {
            _id: 'string',
            item_id: 'string',
            phone_number: 'string',
            wholesale_cost_price: 'string',
            wholesale_selling_price: 'string',
            retail_selling_price: 'string',
            uploaded: 'int',
            currency: 'int',
        },
        primaryKey: '_id',
    };
}

export class BusinessUsers extends Realm.Object<BusinessUsers> {
    _id!: string;
    business_id!: string;
    sales_point_id!: string;
    user_name!: string;
    phone_number!: string;
    user!: string;
    level!: number;
    user_active!: number;
    createdAt!: string;
    updatedAt!: string;

    static schema: ObjectSchema = {
        name: 'BusinessUsers',
        properties: {
            _id: { type: 'string', indexed: true },
            business_id: 'string',
            sales_point_id: 'string',
            user_name: 'string',
            phone_number: 'string',
            user: { type: 'string', indexed: true },
            level: 'int',
            user_active: 'int',
            createdAt: 'string',
            updatedAt: 'string'
        },
        primaryKey: '_id',
    };
}

export class UserMessagesDrafts extends Realm.Object<UserMessagesDrafts> {
    phone_number!: string;
    user!: string;
    message_inbox!: string;

    static schema: ObjectSchema = {
        name: 'UserMessagesDrafts',
        properties: {
            phone_number: 'string',
            user: 'string',
            message_inbox: 'string',
        },
        primaryKey: 'phone_number',
    };
}

export class UserBusinessArticles extends Realm.Object<UserBusinessArticles> {
    _id!: string;
    business_id!: string;
    phone_number!: string;
    item_name!: string;
    slogan!: string;
    item_type!: number;
    category!: string;
    subcategory!: string;
    manufacture_date!: string;
    expiry_date!: string;
    wholesale_content_number!: number;
    items_number_stock!: number;
    items_number_warehouse!: number;
    description_item!: string;
    keywords!: string;
    images!: string;
    background!: string;
    item_active!: number;
    supplier!: string;
    other_information!: string;
    alert_low_stock!: number;
    uploaded!: number;
    createdAt!: string;
    updatedAt!: string;
    colors!: string;
    discount_percentage!: number;
    discount_start_date!: string;
    discount_end_date!: string;
    marketplace_visibility!: number;
    weights!: string;
    sizes!: string;
    flag!: number;
    is_best_seller!: number;
    visibility_rank!: number;
    is_featured!: number;

    static schema: ObjectSchema = {
        name: 'UserBusinessArticles',
        properties: {
            _id: 'string',
            business_id: 'string',
            phone_number: 'string',
            item_name: 'string',
            slogan: 'string',
            item_type: 'int',
            category: 'string',
            subcategory: 'string',
            manufacture_date: 'string',
            expiry_date: 'string',
            wholesale_content_number: 'int',
            items_number_stock: 'int',
            items_number_warehouse: 'int',
            description_item: 'string',
            keywords: 'string',
            images: 'string',
            background: 'string',
            item_active: 'int',
            supplier: 'string',
            other_information: 'string',
            alert_low_stock: 'int',
            uploaded: 'int',
            createdAt: 'string',
            updatedAt: 'string',
            colors: 'string',
            discount_percentage: 'int',
            discount_start_date: 'string',
            discount_end_date: 'string',
            marketplace_visibility: 'int',
            weights: 'string',
            sizes: 'string',
            flag: 'int',
            is_best_seller: 'int',
            visibility_rank: 'int',
            is_featured: 'int',
        },
        primaryKey: '_id',
    };
}

export class InventoryMovementTracking extends Realm.Object<InventoryMovementTracking> {
    _id!: string;
    phone_number!: string;
    business_id!: string;
    item_id!: string;
    movement_type!: number;
    /** Retail (single-item) units involved in this movement */
    quantity?: number;
    quantity_stock!: number;
    quantity_warehouse!: number;
    description!: string;
    createdAt!: string;
    updatedAt!: string;

    static schema: ObjectSchema = {
        name: 'InventoryMovementTracking',
        properties: {
            _id: 'string',
            phone_number: 'string',
            business_id: 'string',
            item_id: { type: 'string', indexed: true },
            movement_type: 'int',
            quantity: { type: 'int', optional: true },
            quantity_stock: 'int',
            quantity_warehouse: 'int',
            description: 'string',
            createdAt: 'string',
            updatedAt: 'string',
        },
        primaryKey: '_id',
    };
}

export class Expenses extends Realm.Object<Expenses> {
    _id!: string; // ObjectId-compatible string (24 hex characters for MongoDB compatibility)
    title!: string;
    business_id!: string;
    sales_point_id!: string;
    phone_number!: string;
    amount!: string;
    quantity!: number;
    currency!: number;
    description!: string;
    category!: number;
    payment_type!: number;
    debt!: number;
    expense_active!: number;
    wallet!: number;
    uploaded!: number;
    createdAt!: string;
    updatedAt!: string;

    static schema: ObjectSchema = {
        name: 'Expenses',
        properties: {
            _id: { type: 'string', indexed: true },
            title: 'string',
            business_id: 'string',
            sales_point_id: 'string',
            phone_number: 'string',
            amount: 'string',
            quantity: { type: 'int', default: 1 },
            currency: 'int',
            description: 'string',
            category: 'int',
            payment_type: 'int',
            debt: 'int',
            expense_active: 'int',
            wallet: 'int',
            uploaded: 'int',
            createdAt: 'string',
            updatedAt: 'string'
        },
        primaryKey: '_id',
    };
}

export class CompanyUsers extends Realm.Object<CompanyUsers> {
    _id!: string;
    company_id!: string;
    phone_number!: string;
    user_name!: string;
    service_name!: string;
    service_name_abb!: string;
    level!: number;
    role!: string;
    tags!: string;
    user_active!: number;
    is_admin!: number;
    createdAt!: string;
    updatedAt!: string;

    static schema: ObjectSchema = {
        name: 'CompanyUsers',
        properties: {
            _id: { type: 'string', indexed: true },
            company_id: { type: 'string', indexed: true },
            phone_number: { type: 'string', indexed: true },
            user_name: 'string',
            service_name: 'string',
            service_name_abb: 'string',
            level: 'int',
            role: 'string',
            tags: 'string',
            user_active: 'int',
            is_admin: 'int',
            createdAt: 'string',
            updatedAt: 'string'
        },
        primaryKey: '_id',
    };
}

export class Reservations extends Realm.Object<Reservations> {
    _id!: string;
    business_id!: string;
    sales_point_id!: string;
    item_id!: string;
    customer_id!: string;
    customer_name!: string;
    customer_phone!: string;
    quantity!: number;
    total_amount!: string;
    deposit_amount!: string;
    remaining_amount!: string;
    currency!: number;
    status!: number;
    sale_id!: string;
    uploaded!: number;
    createdAt!: string;
    updatedAt!: string;

    static schema: ObjectSchema = {
        name: 'Reservations',
        properties: {
            _id: {
                type: 'string',
                indexed: true
            },
            business_id: 'string',
            sales_point_id: 'string',
            item_id: 'string',
            customer_id: {
                type: 'string',
                default: ''
            },
            customer_name: {
                type: 'string',
                default: ''
            },
            customer_phone: {
                type: 'string',
                default: ''
            },
            quantity: {
                type: 'int',
                default: 1
            },
            total_amount: 'string',
            deposit_amount: {
                type: 'string',
                default: '0'
            },
            remaining_amount: {
                type: 'string',
                default: '0'
            },
            currency: {
                type: 'int',
                default: 1
            },
            status: {
                type: 'int',
                default: 1
            },
            /*
                1 = Pending
                2 = Confirmed
                3 = Completed
                4 = Cancelled
                5 = Expired
            */
            sale_id: {
                type: 'string',
                default: ''
            },
            uploaded: {
                type: 'int',
                default: 0
            },
            createdAt: 'string',
            updatedAt: 'string'
        },
        primaryKey: '_id',
    };
}


export class Payments extends Realm.Object<Payments> {
    _id!: string;
    sale_id!: string;
    reservation_id!: string;
    item_id!: string;
    sales_point_id!: string;
    amount!: string;
    currency!: number;
    payment_method!: number;
    payment_status!: number;
    payment_details!: string;
    agent_paid!: string;
    uploaded!: number;
    createdAt!: string;
    updatedAt!: string;

    static schema: ObjectSchema = {
        name: 'Payments',
        properties: {
            _id: {
                type: 'string',
                indexed: true
            },
            sale_id: {
                type: 'string',
                default: ''
            },
            reservation_id: {
                type: 'string',
                default: ''
            },
            item_id: 'string',
            sales_point_id: 'string',
            amount: 'string',
            currency: {
                type: 'int',
                default: 1
            },
            payment_method: {
                type: 'int',
                default: 1
            },
            // 1 = Cash
            // 2 = Mobile Money
            // 3 = Card
            payment_status: {
                type: 'int',
                default: 1
            },
            // 1 = Pending
            // 2 = Success
            // 3 = Failed
            // 4 = Cancelled
            payment_details: {
                type: 'string',
                default: '{}'
            },
            agent_paid: {
                type: 'string',
                default: ''
            },
            uploaded: {
                type: 'int',
                default: 0
            },
            createdAt: 'string',
            updatedAt: 'string'
        },
        primaryKey: '_id',
    };
}
