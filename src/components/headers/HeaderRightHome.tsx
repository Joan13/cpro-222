import { View, Pressable, Text } from "react-native"
import { useAppSelector } from "../../store/app/hooks";
import Animated, { FadeIn } from "react-native-reanimated";
import { useDispatch } from "react-redux";
import { remote_host, media_url } from "../../../GlobalVariables";
import { IconApp } from "../app/IconApp";
import { strings } from "../../lang/lang";
import { useEffect, useState } from "react";
import ModalApp from "../app/ModalApp";
import { YambiText } from "../app/Text";
import { setShowFavoriteChats, setShowModalApp } from "../../store/reducers/appSlice";
import { setBusinessSubscriptions } from "../../store/reducers/persistedAppSlice";
import axios from "axios";
import { useQuery, useRealm } from "@realm/react";
import { TBusiness, TBusinessSubscription, TBusinessUser, TItem, TItemPrices, TSale, TSellsPoint } from "../../types/types";
import * as RootNavigation from './../../services/Navigation_ref';
import { UserChats } from "../../store/database/Models";
import AppActivityIndicator from "../app/AppActivityIndicator";

const HeaderRightHome = () => {
    const theme = useAppSelector(state => state.app_theme);
    const app_description = useAppSelector(state => state.persisted_app.app_description);
    const user_data = useAppSelector(state => state.user_data);
    const title = useAppSelector(state => state.app.title);
    const show_favorite_chats = useAppSelector(state => state.app.show_favorite_chats);
    const cart = useAppSelector(state => state.persisted_app.cart);
    const loading_header = useAppSelector(state=>state.app.loading_header);
    const [loading, setLoading] = useState(false);
    const [showInternetError, setShowInternetError] = useState(false);
    const dispatch = useDispatch();
    const realm = useRealm();

    const itemss = [];
    const itemssPrices = [];
    const saless = [];

    const chats = useQuery(
        UserChats, chts => {
            return chts.filtered('flag==1');
        }, []);

    // console.log(chats)
    // const businesses = useQuery(UserBusinesses);

    // const buss = useQuery(BusinessUsers);


    // const itemssPrices = useQuery(
    //     ItemPrices, items => {
    //         return items.filtered('uploaded == $0', 0)
    //     }, []);

    // const saless = useQuery(
    //     BusinessItemsSale, items => {
    //         return items.filtered('uploaded == $0', 0)
    //     }, []);

    useEffect(() => {
        RefreshData();
    }, []);

    const RefreshData = async () => {
        if (!loading) {
            // console.log(user_data.phone_number)
            setLoading(true);

            await axios.post(remote_host + '/yambi/API/check_data', {
                o_items: itemss,
                o_prices: itemssPrices,
                o_sales: saless,
                phone_number: user_data.phone_number
            })
                .then(json => {

                    // const items = json.data.items;
                    // const items_active = items.filter(item => item.item_name.includes('riz'));
                    // console.log(items_active.length);

                    if (json.data.success === '1') {
                        const businessSubscriptions = (json.data.business_subscriptions || []).map((sub: any): TBusinessSubscription => ({
                            _id: sub._id,
                            phone_number: sub.phone_number || "",
                            business_id: sub.business_id || "",
                            amount: Number(sub.amount ?? 0),
                            currency: sub.currency || "usd",
                            subscription_start_date: sub.subscription_start_date || "",
                            subscription_end_date: sub.subscription_end_date || "",
                            subscription_type: Number(sub.subscription_type ?? 1),
                            subscription_plan: Number(sub.subscription_plan ?? 0),
                            stripe_payment_intent_id: sub.stripe_payment_intent_id || "",
                            stripe_subscription_id: sub.stripe_subscription_id || "",
                            stripe_customer_id: sub.stripe_customer_id || "",
                            payment_phone_number: sub.payment_phone_number || "",
                            payment_type: Number(sub.payment_type ?? 0),
                            payment_status: Number(sub.payment_status ?? 0),
                            serdi_session_id: sub.serdi_session_id || "",
                            serdi_transaction_token: sub.serdi_transaction_token || "",
                            serdi_transaction_status: Number(sub.serdi_transaction_status ?? 0),
                            createdAt: sub.createdAt || "",
                            updatedAt: sub.updatedAt || ""
                        }));
                        dispatch(setBusinessSubscriptions(businessSubscriptions));

                        const business_users = json.data.users;

                        try {
                            realm.write(() => {
                                for (let i in business_users) {
                                    const business_user: TBusinessUser = {
                                        _id: business_users[i]._id,
                                        business_id: business_users[i].business_id,
                                        user_name: business_users[i].user_name ? business_users[i].user_name : "",
                                        phone_number: business_users[i].phone_number,
                                        sales_point_id: business_users[i].sales_point_id,
                                        user: business_users[i].user,
                                        level: parseInt(business_users[i].level),
                                        user_active: parseInt(business_users[i].user_active),
                                        createdAt: business_users[i].createdAt,
                                        updatedAt: business_users[i].updatedAt
                                    }
                                    try {
                                        realm.create('BusinessUsers', business_user, true);
                                    } catch (error) { console.log(error) }
                                }
                            });
                        } catch (error) {

                        }

                        const items = json.data.items;
                        // console.log(items);
                        try {
                            realm.write(() => {
                                for (let i in items) {
                                    // console.log(items[i].item_active)
                                    const item: TItem = {
                                        _id: items[i]._id,
                                        business_id: items[i].business_id,
                                        phone_number: items[i].phone_number,
                                        item_name: items[i].item_name,
                                        slogan: items[i].slogan,
                                        item_type: parseInt(items[i].item_type),
                                        category: items[i].category,
                                        subcategory: items[i].subcategory,
                                        manufacture_date: items[i].manufacture_date,
                                        expiry_date: items[i].expiry_date,
                                        wholesale_content_number: parseInt(items[i].wholesale_content_number),
                                        items_number_stock: parseInt(items[i].items_number_stock),
                                        items_number_warehouse: parseInt(items[i].items_number_warehouse),
                                        description_item: items[i].description_item,
                                        keywords: items[i].keywords,
                                        images: items[i].images,
                                        background: items[i].background,
                                        item_active: parseInt(items[i].item_active),
                                        supplier: items[i].supplier,
                                        other_information: items[i].other_information,
                                        alert_low_stock: items[i].alert_low_stock,
                                        uploaded: 1,
                                        createdAt: items[i].createdAt,
                                        updatedAt: items[i].updatedAt,
                                        colors: items[i].colors,
                                        discount_percentage: items[i].discount_percentage,
                                        discount_start_date: items[i].discount_start_date,
                                        discount_end_date: items[i].discount_end_date,
                                        marketplace_visibility: items[i].marketplace_visibility,
                                        weights: items[i].weights,
                                        sizes: items[i].sizes,
                                        flag: items[i].flag,
                                        is_best_seller: items[i].is_best_seller,
                                        visibility_rank: items[i].visibility_rank,
                                        is_featured: items[i].is_featured
                                    }
                                    try {
                                        realm.create('UserBusinessArticles', item, true);
                                    } catch (error) { }
                                }
                            });
                        } catch (error) { }

                        const prices = json.data.prices;

                        try {
                            realm.write(() => {
                                for (let i in prices) {
                                    const price: TItemPrices = {
                                        _id: prices[i]._id,
                                        item_id: prices[i].item_id,
                                        phone_number: prices[i].phone_number,
                                        wholesale_cost_price: prices[i].wholesale_cost_price,
                                        wholesale_selling_price: prices[i].wholesale_selling_price,
                                        retail_selling_price: prices[i].retail_selling_price,
                                        uploaded: 1,
                                        currency: parseInt(prices[i].currency)
                                    }

                                    try {
                                        realm.create('ItemPrices', price, true);
                                    } catch (error) { }
                                }
                            });
                        } catch (error) {

                        }


                        const sales = json.data.sales;
                        for (let i in sales) {
                            const sale: TSale = {
                                _id: sales[i]._id,
                                item_id: sales[i].item_id,
                                business_id: sales[i].business_id,
                                number: parseInt(sales[i].number),
                                sale_operator: sales[i].sale_operator,
                                sales_point_id: sales[i].sales_point_id,
                                cost_price: sales[i].cost_price,
                                selling_price: sales[i].selling_price,
                                delivery_price: sales[i].delivery_price,
                                delivery_address: sales[i].delivery_address,
                                delivery_time: sales[i].delivery_time,
                                delivery_status: parseInt(sales[i].delivery_status),
                                discount_price: sales[i].discount_time,
                                type_sale: sales[i].type_sale,
                                buyer_name: sales[i].buyer_name,
                                buyer_phone: sales[i].buyer_phone,
                                currency: sales[i].currency,
                                country: sales[i].country,
                                description: sales[i].description,
                                agent_paid: sales[i].agent_paid,
                                uploaded: 1,
                                sale_active: parseInt(sales[i].sale_active),
                                createdAt: sales[i].createdAt,
                                updatedAt: sales[i].updatedAt
                            }

                            realm.write(() => {
                                try {
                                    realm.create('BusinessItemsSale', sale, true);
                                } catch (error) { }
                            });
                        }

                        const bb = json.data.businesses;

                        try {
                            realm.write(() => {
                                for (let i in bb) {
                                    // console.log(bb.length + 1)
                                    const new_business: TBusiness = {
                                        _id: bb[i]._id,
                                        phone_number: bb[i].phone_number,
                                        business_name: bb[i].business_name,
                                        slogan: bb[i].slogan,
                                        description_service: bb[i].description_service,
                                        category: parseInt(bb[i].category),
                                        keywords: bb[i].keywords,
                                        currency: parseInt(bb[i].currency),
                                        logo: bb[i].logo,
                                        national_number: bb[i].national_number,
                                        national_id: bb[i].national_id,
                                        tax_number: bb[i].tax_number,
                                        country: bb[i].country,
                                        state: bb[i].state,
                                        city: bb[i].city,
                                        phones: bb[i].phones,
                                        emails: bb[i].emails,
                                        background: bb[i].background,
                                        business_active: parseInt(bb[i].business_active),
                                        business_address: bb[i].business_address,
                                        business_visible: parseInt(bb[i].business_visible),
                                        website: bb[i].website,
                                        other_links: bb[i].other_links,
                                        yambi: bb[i].yambi,
                                        valid_until: bb[i].valid_until,
                                        createdAt: bb[i].createdAt,
                                        updatedAt: bb[i].updatedAt
                                    }

                                    if (parseInt(bb[i].business_active) !== 2) {
                                        try {
                                            realm.create('Businesses', new_business, true);
                                        } catch (error) { }
                                    }
                                }
                            });
                        } catch (e) { }


                        const sp = json.data.sells_points;

                        try {
                            realm.write(() => {
                                for (let i in sp) {
                                    const new_sells_point: TSellsPoint = {
                                        _id: sp[i]._id,
                                        business_id: sp[i].business_id,
                                        sells_point_name: sp[i].sells_point_name,
                                        phone_number: sp[i].phone_number,
                                        slogan: sp[i].slogan,
                                        description_service: sp[i].description_service,
                                        category: parseInt(sp[i].category),
                                        tva: sp[i].tva,
                                        logo: sp[i].logo,
                                        country: sp[i].country,
                                        phones: sp[i].phones,
                                        emails: sp[i].emails,
                                        background: sp[i].background,
                                        sells_point_active: parseInt(sp[i].sells_point_active),
                                        sells_point_address: sp[i].sells_point_address,
                                        sells_point_visible: parseInt(sp[i].sells_point_visible),
                                        website: sp[i].website,
                                        notifications: 0,
                                        other_links: sp[i].other_links,
                                        yambi: sp[i].yambi,
                                        createdAt: sp[i].createdAt,
                                        updatedAt: sp[i].updatedAt
                                    }

                                    if (parseInt(sp[i].sells_point_active) !== 2) {

                                        try {
                                            realm.create('SellsPoints', new_sells_point, true);
                                        } catch (error) { }

                                    }
                                }
                            });
                        } catch (error) {

                        }

                        const assemble = json.data.yambi_users;
                        // console.log(assemble.length);
                        try {
                            realm.write(() => {
                                for (let i in assemble) {
                                    const user_assemble_data = {
                                        user_id: assemble[i]._id,
                                        user_names: assemble[i].user_names,
                                        phone_number: assemble[i].phone_number,
                                        gender: typeof assemble[i].gender === 'string' ? parseInt(assemble[i].gender) : assemble[i].gender,
                                        birth_date: assemble[i].birth_date,
                                        country: assemble[i].country,
                                        user_profile: assemble[i].user_profile,
                                        profession: assemble[i].profession,
                                        bio: assemble[i].bio,
                                        user_email: assemble[i].user_email,
                                        user_address: assemble[i].user_address,
                                        status_information: assemble[i].status_information,
                                        user_password: assemble[i].user_password,
                                        account_privacy: typeof assemble[i].account_privacy === 'string' ? parseInt(assemble[i].account_privacy) : assemble[i].account_privacy,
                                        user_level: assemble[i].user_level || 0,
                                        user_active: assemble[i].user_active || 1,
                                        user_verified: assemble[i].user_verified || 0,
                                        user_verified_at: assemble[i].user_verified_at || "",
                                        notification_token: assemble[i].notification_token,
                                        createdAt: assemble[i].createdAt,
                                        updatedAt: assemble[i].updatedAt,
                                    }

                                    // console.log(assemble[i])


                                    try {
                                        realm.create('YambiUsers', user_assemble_data, true);
                                    } catch (error) { }

                                }
                            });
                        } catch (error) {

                        }

                        const yb = json.data.yambi_businesses;

                        try {
                            realm.write(() => {
                                for (let i in yb) {
                                    const y_business: TBusiness = {
                                        _id: yb[i]._id,
                                        phone_number: yb[i].phone_number,
                                        business_name: yb[i].business_name,
                                        slogan: yb[i].slogan,
                                        description_service: yb[i].description_service,
                                        category: parseInt(yb[i].category),
                                        keywords: yb[i].keywords,
                                        currency: parseInt(yb[i].currency),
                                        logo: yb[i].logo,
                                        national_number: yb[i].national_number,
                                        national_id: yb[i].national_id,
                                        tax_number: yb[i].tax_number,
                                        country: yb[i].country,
                                        state: yb[i].state,
                                        city: yb[i].city,
                                        phones: yb[i].phones,
                                        emails: yb[i].emails,
                                        background: yb[i].background,
                                        business_active: parseInt(yb[i].business_active),
                                        business_address: yb[i].business_address,
                                        business_visible: parseInt(yb[i].business_visible),
                                        website: yb[i].website,
                                        other_links: yb[i].other_links,
                                        yambi: yb[i].yambi,
                                        valid_until: yb[i].valid_until,
                                        createdAt: yb[i].createdAt,
                                        updatedAt: yb[i].updatedAt
                                    }

                                    // if (parseInt(yb[i].business_active) !== 2) {
                                    try {
                                        realm.create('YambiBusinesses', y_business, true);
                                    } catch (error) { }
                                    // }
                                }
                            })
                        } catch (error) {

                        }
                    }


                    setLoading(false);
                })
                .catch(() => {
                    // console.log(error)
                    dispatch(setShowModalApp(true));
                    setShowInternetError(true);
                    setLoading(false);
                });
        }
    }

    const GoCart = () => {
        RootNavigation.navigate("Cart");
    }

    const GoSearchMarketplace = () => {
        RootNavigation.navigate("SearchMarketplace");
    }

    return (
        <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            height: 60
        }}>
            {/* <View style={{
                width: 30,
                alignItems: 'center',
                justifyContent: 'center',
                marginHorizontal: 5
            }}>
                <ActivityIndicator size={20} color={theme.colors.text_design1} />
            </View> */}
            {showInternetError ?
                <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowInternetError(false) }} singleButton title={strings.error}>
                    <YambiText text={strings.connection_failed} size="normal" color="gray" />
                </ModalApp> : null}

            {/* {title === strings.chats ?
                <View style={{
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <Pressable style={{
                        height: 30,
                        width: 30,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginHorizontal: 15,
                        marginRight: 0
                    }}>
                        <IconApp pack="FI" name="search" size={20} color={theme.colors.text_design1} />
                    </Pressable>
                </View> : null} */}


            <View style={{
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center'
            }}>

{loading_header&&(
                        <Animated.View entering={FadeIn}>
                        <Pressable onPress={RefreshData} style={{
                            height: 30,
                            width: 30,
                            // backgroundColor: 'red',
                            alignItems: 'center',//app_description.home_user_image_position === 'left' ? 'center' : 'flex-end',
                            justifyContent: 'center',
                            // marginRight: 20,
                            marginLeft: 15,
                        }}>
                                <AppActivityIndicator size={20} showLabel={false} />
                        </Pressable>
                    </Animated.View>
                    )}

                {title === strings.business || title === strings.expenses ?
                    <Animated.View entering={FadeIn}>
                        <Pressable
                            onPress={() => { RootNavigation.navigate("Calculator") }}
                            style={{
                                height: 30,
                                width: 30,
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginHorizontal: 15,
                                marginRight: 0
                            }}>
                            <IconApp pack="IO" name="calculator" size={20} color={theme.colors.text_design1} />
                        </Pressable>
                    </Animated.View> : null}

                {title === strings.business ?
                    <>
                        <Animated.View entering={FadeIn}>
                            <Pressable
                                onPress={() => { RootNavigation.navigate(title === strings.business ? "NewBusiness" : "AddNews") }}
                                style={{
                                    height: 30,
                                    width: 30,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginHorizontal: 15,
                                    marginRight: 0
                                }}>
                                <IconApp pack="FI" name="plus" size={20} color={theme.colors.text_design1} />
                            </Pressable>
                        </Animated.View>
                    </> : null}

                {title === strings.marketplace ?
                    <Animated.View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }} entering={FadeIn}>

                        <Pressable onPress={GoSearchMarketplace} style={{
                            height: 30,
                            width: 30,
                            flexDirection: 'row',
                            // backgroundColor: 'red',
                            alignItems: 'center',//app_description.home_user_image_position === 'left' ? 'center' : 'flex-end',
                            justifyContent: 'center',
                            // marginRight: 20,
                            marginLeft: 15,
                        }}>
                            <IconApp pack="FI" name="search" size={20} color={theme.colors.text_design1} />
                        </Pressable>

                        <Pressable onPress={GoCart} style={{
                            height: 30,
                            width: 30,
                            flexDirection: 'row',
                            // backgroundColor: 'red',
                            alignItems: 'center',//app_description.home_user_image_position === 'left' ? 'center' : 'flex-end',
                            justifyContent: 'center',
                            // marginRight: 20,
                            marginLeft: 15,
                        }}>
                            <IconApp pack="FI" name="shopping-cart" size={20} color={theme.colors.text_design1} />

                            {cart && cart.length !== 0 ?
                                <View style={{
                                    backgroundColor: theme.colors.badge_background_color,
                                    minWidth: 15,
                                    height: 15,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    borderRadius: 20,
                                    marginTop: -25,
                                    marginLeft: -5
                                }}>
                                    <Text style={{
                                        color: theme.colors.badge_color,
                                        fontSize: 12
                                    }}>
                                        {cart ? cart.length : ""}
                                    </Text>
                                </View> : null}
                        </Pressable>
                    </Animated.View> : null}

            </View>

            {title === strings.chats && chats.length !== 0 ?
                <Animated.View entering={FadeIn}>
                    <Pressable
                        onPress={() => { dispatch(setShowFavoriteChats(!show_favorite_chats)) }}
                        style={{
                            height: 30,
                            width: 30,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginHorizontal: 15,
                            marginRight: 0
                        }}>
                        <IconApp pack="AD" name={show_favorite_chats ? "star" : "staro"} size={20} color={theme.colors.text_design1} />
                    </Pressable>
                </Animated.View>
                : null}


            {app_description.home_user_image_position === 'right' ?
                <Pressable onPress={() => RootNavigation.navigate('SettingsYambi')}>
                    {/* {user_data.user_profile !== "" ?
                        <Animated.View
                            style={{
                                justifyContent: 'center',
                                alignContent: 'center',
                                alignItems: 'center'
                            }}>
                            <FastImage
                                style={{
                                    width: app_description.home_user_image_size,
                                    height: app_description.home_user_image_size,
                                    borderRadius: 50,
                                    borderColor: theme.colors.border,
                                    borderWidth: 1
                                }}
                                resizeMode={FastImage.resizeMode.contain}
                                source={{
                                    priority: FastImage.priority.high,
                                    cache: 'immutable',
                                    uri: media_url + "/profile_pictures/" + user_data.user_profile
                                }} />
                        </Animated.View>
                        : */}

                    <Animated.View style={{ marginLeft: 20, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 50 }} sharedTransitionTag="homeViewAnimated">
                        {user_data.user_profile === "" ?
                            <Animated.Image
                                sharedTransitionTag='homeImageAnimated'
                                source={require('./../../assets/profile_black.jpg')}
                                style={{
                                    width: app_description.home_user_image_size,
                                    height: app_description.home_user_image_size,
                                    borderRadius: 50
                                }}
                            />
                            :
                            <Animated.Image
                                sharedTransitionTag='homeImageAnimated'
                                source={{ uri: media_url + "/profile_pictures/" + user_data.user_profile }}
                                style={{
                                    width: app_description.home_user_image_size,
                                    height: app_description.home_user_image_size,
                                    borderRadius: 50
                                }}
                            />}
                    </Animated.View>
                </Pressable>
                : null}
        </View>
    )
}

export default HeaderRightHome;
{/* <FastImage
                                  style={{
                                    height: app_description.home_user_image_size,
                                    width: app_description.home_user_image_size,
                                    borderRadius: 50,
                                    marginRight: 10
                                  }}
                                  resizeMode={FastImage.resizeMode.cover}
                                  source={{
                                    priority: FastImage.priority.high,
                                    cache: 'immutable',
                                    uri: media_url + "/picture_messages/" + user_data.user_profile
                                  }} /> */}