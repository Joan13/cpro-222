import {  View, Image, RefreshControl, ScrollView, Pressable, Text } from "react-native";
import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { NavProps, TBusiness, TBusinessSubscription, TBusinessUser, TItem, TItemPrices, TSale, TSellsPoint } from "../../types/types";
import { strings } from "../../lang/lang";
import ButtonNormal from "../../components/app/ButtonNormal";
import { IconApp } from "../../components/app/IconApp";
import { useAppDispatch, useAppSelector } from "../../store/app/hooks";
import * as RootNavigation from './../../services/Navigation_ref';
import { useQuery, useRealm } from "@realm/react";
import { BusinessUsers, UserBusinesses, Payments } from "../../store/database/Models";
import { setBusinessOpened, setShowModalApp, setLoadingHeader } from "../../store/reducers/appSlice";
import { setBusinessSubscriptions } from "../../store/reducers/persistedAppSlice";
import { TextNormalYambi, TextNormalYambiGray, TextSmallYambiGray } from "../../components/app/Text";
import ModalApp from "../../components/app/ModalApp";
import Animated, { FadeInUp, BounceIn } from "react-native-reanimated";
import { remote_host } from "../../../GlobalVariables";
import axios from "axios";
import BusinessesListModern from "../../components/lists/business/BusinessesListModern";
// import { FlashList } from "@shopify/flash-list"

const Businesses = ({}: NavProps) => {

    const app_theme = useAppSelector(state => state.app_theme);
    const theme = app_theme.colors;
    const user_data = useAppSelector(state => state.user_data);
    const [showInfo, setShowInfo] = useState<boolean>(false);
    const app_description = useAppSelector(state => state.persisted_app.app_description);
    const business_opened = useAppSelector(state => state.app.business_opened);
    const [showEnterCurrentPassword, setShowEnterCurrentPassword] = useState<boolean>(false);
    const [showSuccessPasswordEntered, setShowSuccessPasswordEntered] = useState<boolean>(false);
    const [showWrongPassword, setShowWrongPassword] = useState<boolean>(false);
    const [passwordInput, setPasswordInput] = useState<string>("");
    const isUnlocking = useRef<boolean>(false);
    const title = useAppSelector(state => state.app.title);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [loading, setLoading] = useState(false);
    const [currentBusinessIndex, setCurrentBusinessIndex] = useState(0);
    const dispatch = useAppDispatch();
    const realm = useRealm();

    const itemss = [];
    const itemssPrices = [];
    const saless = [];
    const paymentss = [];

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        RefreshData();
    }, []);


    const RefreshData = async () => {
        if (!loading) {
            // console.log(user_data.phone_number)
            setLoading(true);
            dispatch(setLoadingHeader(true));

            await axios.post(remote_host + '/yambi/API/check_data', {
                o_items: itemss,
                o_prices: itemssPrices,
                o_sales: saless,
                o_payments: paymentss,
                phone_number: user_data.phone_number
            })
                .then(json => {

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
                        } catch {

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

                        const payments = json.data.payments || [];
                        try {
                            realm.write(() => {
                                for (let i in payments) {
                                    const payment = {
                                        _id: payments[i]._id,
                                        sale_id: payments[i].sale_id,
                                        reservation_id: payments[i].reservation_id,
                                        item_id: payments[i].item_id,
                                        sales_point_id: payments[i].sales_point_id,
                                        amount: payments[i].amount,
                                        currency: parseInt(payments[i].currency),
                                        payment_method: parseInt(payments[i].payment_method),
                                        payment_status: parseInt(payments[i].payment_status),
                                        payment_details: typeof payments[i].payment_details === 'string' ? payments[i].payment_details : JSON.stringify(payments[i].payment_details),
                                        agent_paid: payments[i].agent_paid,
                                        uploaded: 1,
                                        createdAt: payments[i].createdAt,
                                        updatedAt: payments[i].updatedAt
                                    };
                                    try {
                                        realm.create('Payments', payment, true);
                                    } catch (error) { }
                                }
                            });
                        } catch (error) { }

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

                    setRefreshing(false);
                    setLoading(false);
                    dispatch(setLoadingHeader(false));
                })
                .catch(() => {
                    // console.log(error)
                    dispatch(setShowModalApp(true));
                    setLoading(false);
                    setRefreshing(false);
                    dispatch(setLoadingHeader(false));
                });
        }
    }

    const businesses = useQuery(UserBusinesses);
    const businessUsers = useQuery(BusinessUsers);

    const activeBusinesses = useMemo(() => {
        const activeMemberships = new Set(
            businessUsers
                .filter((bu) => bu.user === user_data.phone_number && bu.user_active === 1)
                .map((bu) => bu.business_id)
        );

        return businesses.filter(
            (business) => business.business_active === 1 && activeMemberships.has(business._id)
        );
    }, [businessUsers, businesses, user_data.phone_number]);

    // const navigation = useNavigation();

    useEffect(() => {
        // console.log(businesses.length);
        // console.log(navigation)
        if (title === strings.business) {
            RequestBusinessPassword();
        }
    }, [title]);

    useEffect(() => {
        if (activeBusinesses.length === 0 && currentBusinessIndex !== 0) {
            setCurrentBusinessIndex(0);
            return;
        }

        if (currentBusinessIndex >= activeBusinesses.length) {
            setCurrentBusinessIndex(Math.max(activeBusinesses.length - 1, 0));
        }
    }, [activeBusinesses.length, currentBusinessIndex]);

    const RequestBusinessPassword = () => {
        if (app_description.require_password_business && app_description.password_business && app_description.password_business.length === 6) {
            if (!business_opened) {
                setShowEnterCurrentPassword(true);
            }
        }
    }

    const NewBusiness = () => {
        RootNavigation.navigate("NewBusiness");
    }

    // const EditWorkspace = () => {
    //     dispatch(setShowModalApp(true));
    //     setShowInfo(true);
    // }

    // const SelUser = (user: TBusinessUser) => {
    //     // console.log(user);
    // }

    // const renderItemSellsPoints = ({ item }: { item: TSellsPoint }) => (
    //     <Pressable
    //         onPress={() => {
    //             // dispatch(setBusiness(item));
    //             navigation.navigate("Workspace" as never);
    //         }}
    //         style={{
    //             flexDirection: 'row',
    //             alignItems: 'center',
    //             borderTopWidth: 1,
    //             borderColor: theme.border,
    //             // height: 70,
    //             flex: 1
    //         }}>
    //         <IconApp pack="MT" name="business-center" size={30} color={theme.gray} />
    //         <View style={{
    //             flex: 1,
    //             paddingHorizontal: 10
    //         }}>
    //             <Text style={{
    //                 color: theme.text,
    //                 fontSize: 18,
    //                 fontWeight: 'bold'
    //             }}>{item.sells_point_name}</Text>
    //             <Text style={{
    //                 color: theme.gray,
    //                 fontSize: 12
    //             }}>{item.description_service}</Text>
    //         </View>
    //         <Pressable
    //             onPress={EditWorkspace}
    //             style={{
    //                 width: 50,
    //                 height: 50,
    //                 justifyContent: 'center',
    //                 alignItems: 'flex-end',
    //             }}>
    //             <Feather name="edit" size={15} color={theme.text} />
    //         </Pressable>
    //     </Pressable>
    // );

    // const renderItem = useCallback(({ item }: { item: IBusiness }) => {
    //     return (<Item item={item} />)
    // }, []);

    const SETCP = (cpp: string) => {
        setPasswordInput(cpp);
        setShowSuccessPasswordEntered(false);
        setShowWrongPassword(false);

        if (cpp.length === 6) {
            if (cpp === app_description.password_business) {
                // Correct password
                isUnlocking.current = true;
                setShowSuccessPasswordEntered(true);
                setTimeout(() => {
                    setShowEnterCurrentPassword(false);
                    setPasswordInput("");
                    dispatch(setBusinessOpened(true));
                    isUnlocking.current = false;
                }, 500);
            } else {
                // Wrong password — show error briefly, then auto-clear
                setShowWrongPassword(true);
                setTimeout(() => {
                    setPasswordInput("");
                    setShowWrongPassword(false);
                }, 800);
            }
        }
    }

    const handleKeyPress = (key: string) => {
        // Block input during unlock animation or wrong-password clear
        if (isUnlocking.current || showWrongPassword) return;

        if (key === 'backspace') {
            if (passwordInput.length > 0) {
                SETCP(passwordInput.slice(0, -1));
            }
        } else {
            if (passwordInput.length < 6) {
                SETCP(passwordInput + key);
            }
        }
    }

    // Reset password input when modal closes
    useEffect(() => {
        if (!showEnterCurrentPassword) {
            setPasswordInput("");
        }
    }, [showEnterCurrentPassword]);

    return (
        <View style={{
            flex: 1,
            justifyContent: 'center',
            backgroundColor: theme.background,
            borderColor: theme.border,
            borderTopWidth: 1
        }}>
            {showInfo ?
                <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowInfo(false) }} singleButton title={strings.error}>
                    <TextNormalYambiGray text={strings.impossible_edit} />
                </ModalApp> : null}

            {showEnterCurrentPassword ?
                <Animated.View 
                    entering={FadeInUp.delay(100)}
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        paddingHorizontal: 30,
                    }}>
                    {/* Icon Container */}
                    <Animated.View 
                        entering={BounceIn.delay(200)}
                        style={{
                            width: 80,
                            height: 80,
                            borderRadius: 40,
                            backgroundColor: theme.high_color + '15',
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginBottom: 30,
                        }}>
                        <IconApp name="lock" pack='FI' size={40} color={theme.high_color} />
                    </Animated.View>

                    {/* Title */}
                    <TextNormalYambi 
                        bold 
                        text={strings.enter_password} 
                        styles={{ 
                            textAlign: 'center', 
                            fontSize: 22,
                            marginBottom: 10 
                        }} 
                    />
                    <TextNormalYambiGray 
                        text={strings.current_business_tab_password || "Enter your 6-digit password"} 
                        styles={{ 
                            textAlign: 'center', 
                            marginBottom: 40 
                        }} 
                    />

                    {/* Success Indicator */}
                    {showSuccessPasswordEntered && (
                        <Animated.View 
                            entering={BounceIn}
                            style={{ 
                                marginBottom: 20,
                                alignItems: 'center'
                            }}>
                            <IconApp name="check-circle" pack='FA' size={32} color={theme.success} />
                        </Animated.View>
                    )}

                    {/* Wrong Password Indicator */}
                    {showWrongPassword && (
                        <Animated.View 
                            entering={BounceIn}
                            style={{ 
                                marginBottom: 20,
                                alignItems: 'center'
                            }}>
                            <IconApp name="x-circle" pack='FI' size={32} color={theme.error} />
                        </Animated.View>
                    )}

                    {/* Modern OTP Input */}
                    <View style={{
                        width: '100%',
                        marginBottom: 20,
                    }}>
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            marginBottom: 20,
                        }}>
                            {[0, 1, 2, 3, 4, 5].map((index) => (
                                <Animated.View
                                    key={index}
                                    entering={FadeInUp.delay(300 + index * 50)}
                                    style={{
                                        width: 50,
                                        height: 60,
                                        borderRadius: 12,
                                        borderWidth: 2,
                                        borderColor: showWrongPassword
                                            ? theme.error
                                            : passwordInput.length === index 
                                                ? theme.high_color 
                                                : passwordInput.length > index 
                                                    ? theme.success 
                                                    : theme.border,
                                        backgroundColor: passwordInput.length > index 
                                            ? theme.success + '10' 
                                            : theme.background,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                    }}>
                                    {passwordInput[index] && (
                                        <Animated.View entering={BounceIn}>
                                            <IconApp 
                                                name="circle" 
                                                pack='FA' 
                                                size={12} 
                                                color={passwordInput.length > index ? theme.success : theme.high_color} 
                                            />
                                        </Animated.View>
                                    )}
                                </Animated.View>
                            ))}
                        </View>
                    </View>

                    {/* Helper Text */}
                    <TextSmallYambiGray 
                        text={passwordInput.length > 0 ? `${passwordInput.length}/6` : ""} 
                        styles={{ 
                            textAlign: 'center',
                            marginTop: 10,
                            marginBottom: 20,
                        }} 
                    />

                    {/* Custom Numeric Keypad */}
                    <Animated.View 
                        entering={FadeInUp.delay(500)}
                        style={{
                            width: '100%',
                            maxWidth: 300,
                            alignSelf: 'center',
                        }}
                    >
                        {[
                            ['1', '2', '3'],
                            ['4', '5', '6'],
                            ['7', '8', '9'],
                            ['', '0', 'backspace'],
                        ].map((row, rowIndex) => (
                            <View 
                                key={rowIndex}
                                style={{
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    marginBottom: 12,
                                }}
                            >
                                {row.map((key, keyIndex) => (
                                    <View key={keyIndex} style={{ width: 80, height: 56, alignItems: 'center', justifyContent: 'center' }}>
                                        {key === '' ? (
                                            <View style={{ width: 80, height: 56 }} />
                                        ) : (
                                            <Pressable
                                                onPress={() => handleKeyPress(key)}
                                                style={({ pressed }) => ({
                                                    width: 72,
                                                    height: 52,
                                                    borderRadius: 26,
                                                    backgroundColor: pressed 
                                                        ? theme.high_color + '30'
                                                        : key === 'backspace'
                                                            ? 'transparent'
                                                            : theme.border + '80',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    transform: [{ scale: pressed ? 0.92 : 1 }],
                                                })}
                                            >
                                                {key === 'backspace' ? (
                                                    <IconApp 
                                                        name="delete" 
                                                        pack='FI' 
                                                        size={24} 
                                                        color={theme.text} 
                                                    />
                                                ) : (
                                                    <TextNormalYambi 
                                                        text={key} 
                                                        styles={{
                                                            fontSize: 24,
                                                            fontWeight: '500',
                                                        }} 
                                                    />
                                                )}
                                            </Pressable>
                                        )}
                                    </View>
                                ))}
                            </View>
                        ))}
                    </Animated.View>
                </Animated.View>
                :
                activeBusinesses.length === 0 ?
                    <ScrollView
                        contentContainerStyle={{
                            flexGrow: 1,
                            justifyContent: 'center',
                            alignItems: 'center',
                            paddingHorizontal: 24,
                            paddingVertical: 40,
                            backgroundColor: theme.background
                        }}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                tintColor={theme.gray}
                                colors={[theme.high_color]}
                                progressBackgroundColor={theme.background}
                            />
                        }>
                        {/* Layered Visual Illustration */}
                        <View style={{
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginBottom: 28,
                            position: 'relative',
                            width: 200,
                            height: 200,
                        }}>
                            {/* Outermost Dashed Ring */}
                            <View style={{
                                position: 'absolute',
                                width: 190,
                                height: 190,
                                borderRadius: 95,
                                borderWidth: 1.5,
                                borderColor: theme.border,
                                borderStyle: 'dashed',
                                opacity: 0.5,
                            }} />
                            
                            {/* Middle Soft Glow Circle */}
                            <View style={{
                                position: 'absolute',
                                width: 146,
                                height: 146,
                                borderRadius: 73,
                                backgroundColor: theme.high_color,
                                opacity: 0.05,
                            }} />

                            {/* Central Card Circle Badge */}
                            <View style={{
                                width: 106,
                                height: 106,
                                borderRadius: 53,
                                backgroundColor: theme.card,
                                justifyContent: 'center',
                                alignItems: 'center',
                                borderWidth: 1,
                                borderColor: theme.border,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.06,
                                shadowRadius: 8,
                                elevation: 3,
                            }}>
                                <Image
                                    source={require("./../../assets/budget.png")}
                                    style={{
                                        width: 56,
                                        height: 56,
                                        resizeMode: 'contain'
                                    }}
                                />
                            </View>

                            {/* Floating Decorative Briefcase Badge */}
                            <View style={{
                                position: 'absolute',
                                bottom: 40,
                                right: 40,
                                width: 32,
                                height: 32,
                                borderRadius: 16,
                                backgroundColor: theme.high_color,
                                justifyContent: 'center',
                                alignItems: 'center',
                                borderWidth: 2,
                                borderColor: theme.card,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.1,
                                shadowRadius: 3,
                                elevation: 2,
                            }}>
                                <IconApp pack="FI" name="briefcase" size={14} color="#FFF" />
                            </View>
                        </View>

                        <TextNormalYambi
                            text={strings.business || "Business"}
                            bold
                            styles={{
                                textAlign: 'center',
                                marginBottom: 12,
                                fontSize: 24,
                                fontWeight: '800',
                                color: theme.text
                            }}
                        />

                        <TextSmallYambiGray
                            text={strings.no_workspace}
                            styles={{
                                paddingHorizontal: 20,
                                textAlign: 'center',
                                lineHeight: 22,
                                marginBottom: 32,
                                color: theme.gray,
                                fontSize: 14,
                            }}
                        />

                        <ButtonNormal
                            title={strings.new_business}
                            loadEnabled={false}
                            onPress={NewBusiness}
                            iconPack="FI"
                            iconName="plus"
                            iconSize={16}
                            styles={{
                                paddingHorizontal: 30,
                                height: 48,
                                borderRadius: 24,
                                width: '80%',
                                maxWidth: 280,
                                shadowColor: theme.high_color,
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.15,
                                shadowRadius: 8,
                                elevation: 4
                            }}
                            normal={true}
                        />

                        {/* Business Benefits Card */}
                        <View style={{
                            width: '100%',
                            backgroundColor: theme.card,
                            borderRadius: 20,
                            borderWidth: 1,
                            borderColor: theme.border,
                            padding: 20,
                            marginTop: 24,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.05,
                            shadowRadius: 10,
                        }}>
                            {/* Title Row */}
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginBottom: 16
                            }}>
                                <View style={{
                                    width: 30,
                                    height: 30,
                                    borderRadius: 15,
                                    backgroundColor: (theme.high_color || '#1E68FF') + '15',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginRight: 10
                                }}>
                                    <IconApp pack="FI" name="trending-up" size={15} color={theme.high_color || '#1E68FF'} />
                                </View>
                                <Text style={{
                                    fontSize: 16,
                                    fontWeight: '700',
                                    color: theme.text,
                                }}>
                                    {strings.business_grow_title}
                                </Text>
                            </View>

                            {/* List of Benefits */}
                            {(() => {
                                const hexToRGBA = (hex: string, alpha: number) => {
                                    if (!hex || !hex.startsWith('#')) return `rgba(0,0,0,${alpha})`;
                                    try {
                                        const r = parseInt(hex.slice(1, 3), 16);
                                        const g = parseInt(hex.slice(3, 5), 16);
                                        const b = parseInt(hex.slice(5, 7), 16);
                                        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
                                    } catch (e) {
                                        return `rgba(0,0,0,${alpha})`;
                                    }
                                };

                                const benefits = [
                                    {
                                        title: strings.business_benefit_inventory_title,
                                        description: strings.business_benefit_inventory_desc,
                                        icon: "package",
                                        color: theme.high_color || '#1E68FF'
                                    },
                                    {
                                        title: strings.business_benefit_sales_title,
                                        description: strings.business_benefit_sales_desc,
                                        icon: "activity",
                                        color: theme.success || '#10B981'
                                    },
                                    {
                                        title: strings.business_benefit_daily_title,
                                        description: strings.business_benefit_daily_desc,
                                        icon: "calendar",
                                        color: '#F59E0B'
                                    },
                                    {
                                        title: strings.business_benefit_cash_credit_title,
                                        description: strings.business_benefit_cash_credit_desc,
                                        icon: "credit-card",
                                        color: '#8B5CF6'
                                    },
                                    {
                                        title: strings.business_benefit_reservations_title,
                                        description: strings.business_benefit_reservations_desc,
                                        icon: "clock",
                                        color: '#EC4899'
                                    },
                                    {
                                        title: strings.business_benefit_expenses_title,
                                        description: strings.business_benefit_expenses_desc,
                                        icon: "trending-down",
                                        color: '#EF4444'
                                    }
                                ];

                                return benefits.map((item, index) => {
                                    const isLast = index === benefits.length - 1;
                                    return (
                                        <View 
                                            key={index}
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                paddingVertical: 14,
                                                borderBottomWidth: isLast ? 0 : 1,
                                                borderBottomColor: theme.border,
                                            }}
                                        >
                                            {/* Icon badge */}
                                            <View style={{
                                                width: 42,
                                                height: 42,
                                                borderRadius: 21,
                                                backgroundColor: hexToRGBA(item.color, app_theme.dark ? 0.15 : 0.08),
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                marginRight: 14
                                            }}>
                                                <IconApp pack="FI" name={item.icon} size={18} color={item.color} />
                                            </View>

                                            {/* Texts */}
                                            <View style={{ flex: 1 }}>
                                                <Text style={{
                                                    fontSize: 16,
                                                    fontWeight: '600',
                                                    color: theme.text,
                                                    marginBottom: 4
                                                }}>
                                                    {item.title}
                                                </Text>
                                                <Text style={{
                                                    fontSize: 14,
                                                    color: theme.gray,
                                                    lineHeight: 18
                                                }}>
                                                    {item.description}
                                                </Text>
                                            </View>
                                        </View>
                                    );
                                });
                            })()}
                        </View>
                    </ScrollView>
                    :
                    <BusinessesListModern
                        businesses={activeBusinesses as unknown as TBusiness[]}
                        currentBusinessIndex={currentBusinessIndex}
                        onBusinessSwitch={(index) => setCurrentBusinessIndex(index)}
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                    />
            }
        </View>
    )
}

export default Businesses;



{/* <FlashList
                    data={business_users as never}
                    estimatedItemSize={height}
                    renderItem={({ item, index }: { item: TBusinessUser, index: number }) => (<BusinessUsersList index={index} item={item} type={0} selectContact={SelUser} business_users={business_users as never} />)}
                    contentContainerStyle={{ paddingHorizontal: 15 }} /> */}