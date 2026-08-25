import { ActivityIndicator, FlatList, SafeAreaView, Text, Pressable, ScrollView, View, Alert, Image, TextInput, Animated } from "react-native";
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from "@react-navigation/native";
import { useCallback, useEffect, useState, useRef } from 'react';
import { NavProps, TBusiness, TItem, TItemPrices, TSale, TSellsPoint } from "../../types/types";
import { strings } from "../../lang/lang";
import ButtonNormal from "../../components/app/ButtonNormal";
import { IconApp } from "../../components/app/IconApp";
import { useAppDispatch, useAppSelector } from "../../store/app/hooks";
import * as RootNavigation from '../../services/Navigation_ref';
import { useObject, useQuery, useRealm } from "@realm/react";
import { UserBusinessArticles, ItemPrices, UserBusinesses, UserSellsPoints, Payments, Reservations } from "../../store/database/Models";
import { createPaymentObject } from "../../utils/paymentHelpers";
import { setShowModalApp } from "../../store/reducers/appSlice";
import { YambiText } from "../../components/app/Text";
import ModalApp from "../../components/app/ModalApp";
import { FlashList } from "@shopify/flash-list";
import BusinessesList from "../../components/lists/business/BusinessesList";
import BusinessItemsList from "../../components/lists/business/BusinessItemsList";
import { randomString, renderDateUpToMilliseconds, SocketApp } from "../../../GlobalVariables";
import moment from "moment";
// import { SocketApp } from "../../../App";
import SwitchApp from "../../components/app/SwitchApp";

const AddItemSale = ({ navigation, route }: NavProps) => {

    const { business_id } = route.params;
    const { sales_point_id } = route.params;
    const itemToSell = route.params.item;
    const ItemPrices = route.params.prices;

    const theme = useAppSelector(state => state.app_theme.colors);
    const loading_app = useAppSelector(state => state.app.loading);
    const app_description = useAppSelector(state => state.persisted_app.app_description);
    const [showSaleFrame, setShowSaleFrame] = useState(false);
    const user_data = useAppSelector(state => state.user_data);
    const [showInfo, setShowInfo] = useState<boolean>(false);
    const [itemToSellPrice, setItemToSellPrice] = useState("");
    const [numberItemToSell, setNumberItemToSell] = useState("");
    const [wholesale, setWholesale] = useState(false);
    const [IIItems, setIIItems] = useState<TItem>();
    const [searched_text, setSearched_text] = useState<string>("");
    const [type_sale, setType_sale] = useState<number>(0);
    const [buyer_name, setBuyer_name] = useState<string>("");
    const [buyer_phone, setBuyer_phone] = useState<string>("");
    const [showSaleSuccess, setShowSaleSuccess] = useState<boolean>(false);
    const [isReservation, setIsReservation] = useState<boolean>(false);
    const [depositAmount, setDepositAmount] = useState<string>("");
    const [isSaleCompleted, setIsSaleCompleted] = useState<boolean>(false);
    const saleFadeAnim = useRef(new Animated.Value(1)).current;
    const saleSuccessAnim = useRef(new Animated.Value(0)).current;
    // const businesses = useAppSelector(state => state.businesses);
    // const businesses = [];
    // const items = [];

    const realm = useRealm();
    const sales_point = useObject(UserSellsPoints, sales_point_id);

    if (sales_point === null) return;

    // const items = useQuery(
    //     UserBusinessArticles, items => {
    //         return items.filtered('business_id == $0', business_id);
    //     }, []);

    // const itemsss = useQuery(BusinessItems);

    // console.log(itemsss)

    // setIIItems(items);

    // const business_sells_points = useQuery(
    //     UserBusinesses, sells_points => {
    //         return sells_points.filtered('phone_number == $0', user_data.phone_number)
    //     }, []);

    const dispatch = useAppDispatch();

    useEffect(() => {
        // const iii = items.filter(item => item.item_active === 1);
        // setIIItems(iii as never);

        setItemToSellPrice(ItemPrices.retail_selling_price);
        navigation.setOptions({ title: itemToSell.item_name });

    }, [itemToSell]);

    // const NewBusiness = () => {
    //     RootNavigation.navigate("NewBusiness");
    // }

    const EditWorkspace = () => {
        dispatch(setShowModalApp(true));
        setShowInfo(true);
    }

    // const renderItem = useCallback(({ item }: { item: IBusiness }) => {
    //     return (<Item item={item} />)
    // }, []);

    // const SelectItem = (item: TItem, prices: ItemPrices) => {
    //     setItemToSell(item);
    //     setItemPrices(prices);
    //     setItemToSellPrice(prices.retail_selling_price);
    //     dispatch(setShowModalApp(true));
    //     setShowSaleFrame(true);
    // }

    // const CancelSale = () => {
    //     setNumberItemToSell("");
    //     setItemToSellPrice("");
    //     setWholesale(false);
    //     dispatch(setShowModalApp(false));
    //     setShowSaleFrame(false)
    // }

    const ConfirmSale = () => {

        if (numberItemToSell !== "") {
            if (!error_number()) {
                // console.log("Error")
            } else {
                if (isReservation) {
                    const reservationId = renderDateUpToMilliseconds() + randomString(5);
                    const sellingPrice = itemToSellPrice.trim() !== "" ? itemToSellPrice.trim() : (wholesale ? ItemPrices.wholesale_selling_price : ItemPrices.retail_selling_price);
                    const qty = parseInt(numberItemToSell);
                    const totalAmt = (qty * parseFloat(sellingPrice)).toString();
                    const depAmt = depositAmount.trim() !== "" ? parseFloat(depositAmount.trim()) : 0;
                    const remAmt = Math.max(0, parseFloat(totalAmt) - depAmt).toString();

                    const reservation = {
                        _id: reservationId,
                        business_id: itemToSell.business_id,
                        sales_point_id: sales_point_id,
                        item_id: itemToSell._id,
                        customer_id: "",
                        customer_name: buyer_name,
                        customer_phone: buyer_phone,
                        quantity: qty,
                        total_amount: totalAmt,
                        deposit_amount: depAmt.toString(),
                        remaining_amount: remAmt,
                        currency: ItemPrices.currency,
                        status: 1, // 1 = Pending
                        sale_id: "",
                        uploaded: 0,
                        createdAt: moment(new Date()).format(),
                        updatedAt: ""
                    };

                    realm.write(() => {
                        try {
                            realm.create('Reservations', reservation);
                        } catch (error) { }

                        let payment;
                        if (depAmt > 0) {
                            payment = {
                                _id: renderDateUpToMilliseconds() + randomString(5),
                                sale_id: "",
                                reservation_id: reservationId,
                                item_id: itemToSell._id,
                                sales_point_id: sales_point_id,
                                amount: depAmt.toString(),
                                currency: ItemPrices.currency,
                                payment_method: 1, // Default Cash for deposit
                                payment_status: 2, // Success
                                payment_details: "{}",
                                agent_paid: user_data.phone_number,
                                uploaded: 0,
                                createdAt: moment(new Date()).format(),
                                updatedAt: moment(new Date()).format()
                            };
                            try {
                                realm.create('Payments', payment);
                            } catch (error) { }
                        }

                        SocketApp.emit("newReservations", JSON.stringify({ phone_number: user_data.phone_number, items: [reservation] }));
                        if (payment) {
                            SocketApp.emit("newPayments", JSON.stringify({ phone_number: user_data.phone_number, items: [payment] }));
                        }
                    });

                    setIsSaleCompleted(true);
                    saleFadeAnim.setValue(1);
                    saleSuccessAnim.setValue(0);

                    Animated.parallel([
                        Animated.timing(saleFadeAnim, {
                            toValue: 0,
                            duration: 200,
                            useNativeDriver: true,
                        }),
                        Animated.timing(saleSuccessAnim, {
                            toValue: 1,
                            duration: 300,
                            useNativeDriver: true,
                        }),
                    ]).start();

                    setTimeout(() => {
                        setNumberItemToSell("");
                        setBuyer_name("");
                        setBuyer_phone("");
                        setDepositAmount("");
                        setWholesale(false);
                        setIsReservation(false);

                        dispatch(setShowModalApp(false));
                        setShowSaleFrame(false);

                        setIsSaleCompleted(false);
                        saleFadeAnim.setValue(1);
                        saleSuccessAnim.setValue(0);
                    }, 3000);

                    return;
                }

                const sale: TSale = {
                    _id: renderDateUpToMilliseconds() + randomString(5),
                    item_id: itemToSell._id,
                    business_id: itemToSell.business_id,
                    number: parseInt(numberItemToSell),
                    sale_operator: user_data.phone_number,
                    sales_point_id: sales_point_id,
                    cost_price: wholesale ? ItemPrices.wholesale_cost_price.toString() : (parseInt(ItemPrices.wholesale_cost_price) / itemToSell.wholesale_content_number).toString(),
                    selling_price: itemToSellPrice.trim() !== "" ? itemToSellPrice.trim() : (wholesale ? ItemPrices.wholesale_selling_price : ItemPrices.retail_selling_price),
                    delivery_price: "",
                    delivery_address: "",
                    delivery_time: "",
                    delivery_status: 0,
                    discount_price: "",
                    type_sale: type_sale,
                    buyer_name: buyer_name,
                    buyer_phone: buyer_phone,
                    currency: ItemPrices.currency,
                    description: "",
                    agent_paid: type_sale === 0 ? user_data.phone_number : "",
                    uploaded: 0,
                    sale_active: 1,
                    country: sales_point.country,
                    createdAt: moment(new Date()).format(),
                    updatedAt: ""
                }

                const item: TItem = {
                    _id: itemToSell._id,
                    business_id: itemToSell.business_id,
                    phone_number: itemToSell.phone_number,
                    item_name: itemToSell.item_name,
                    slogan: itemToSell.slogan,
                    item_type: itemToSell.item_type,
                    category: itemToSell.category,
                    subcategory: itemToSell.subcategory,
                    manufacture_date: itemToSell.manufacture_date,
                    expiry_date: itemToSell.expiry_date,
                    wholesale_content_number: itemToSell.wholesale_content_number,
                    items_number_stock: !wholesale ? itemToSell.items_number_stock - parseInt(numberItemToSell) : itemToSell.items_number_stock - parseInt(numberItemToSell) * itemToSell.wholesale_content_number,
                    items_number_warehouse: itemToSell.items_number_warehouse,
                    description_item: itemToSell.description_item,
                    keywords: itemToSell.keywords,
                    images: itemToSell.images,
                    background: itemToSell.background,
                    item_active: itemToSell.item_active,
                    supplier: itemToSell.supplier,
                    other_information: itemToSell.other_information,
                    alert_low_stock: itemToSell.alert_low_stock,
                    uploaded: 0,
                    createdAt: itemToSell.createdAt,
                    updatedAt: itemToSell.updatedAt,
                    colors: itemToSell.colors,
                    discount_percentage: itemToSell.discount_percentage,
                    discount_start_date: itemToSell.discount_start_date,
                    discount_end_date: itemToSell.discount_end_date,
                    marketplace_visibility: itemToSell.marketplace_visibility,
                    weights: itemToSell.weights,
                    sizes: itemToSell.sizes,
                    flag: itemToSell.flag,
                    is_best_seller: itemToSell.is_best_seller,
                    visibility_rank: itemToSell.visibility_rank,
                    is_featured: itemToSell.is_featured
                }

                realm.write(() => {
                    try {
                        realm.create('BusinessItemsSale', sale);
                    } catch (error) { }

                    const totalPrice = (sale.number * parseFloat(sale.selling_price) + (parseFloat(sale.delivery_price) || 0) - (parseFloat(sale.discount_price) || 0)).toString();
                    const depAmt = depositAmount.trim() !== "" ? parseFloat(depositAmount.trim()) : 0;

                    let payment;
                    if (type_sale === 0) {
                        payment = createPaymentObject(
                            sale,
                            totalPrice,
                            1,
                            2,
                            user_data.phone_number
                        );
                    } else {
                        if (depAmt > 0) {
                            payment = createPaymentObject(
                                sale,
                                depAmt.toString(),
                                1,
                                2,
                                user_data.phone_number
                            );
                        } else {
                            payment = createPaymentObject(
                                sale,
                                totalPrice,
                                1,
                                1,
                                ""
                            );
                        }
                    }

                    try {
                        realm.create('Payments', payment);
                    } catch (error) { }

                    try {
                        realm.create('UserBusinessArticles', item, true);
                    } catch (error) { }

                    SocketApp.emit("newItems", JSON.stringify({ phone_number: user_data.phone_number, items: [item] }));

                    SocketApp.emit("newSales", JSON.stringify({ phone_number: user_data.phone_number, items: [sale] }));

                    SocketApp.emit("newPayments", JSON.stringify({ phone_number: user_data.phone_number, items: [payment] }));
                });

                setIsSaleCompleted(true);
                saleFadeAnim.setValue(1);
                saleSuccessAnim.setValue(0);

                Animated.parallel([
                    Animated.timing(saleFadeAnim, {
                        toValue: 0,
                        duration: 200,
                        useNativeDriver: true,
                    }),
                    Animated.timing(saleSuccessAnim, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                ]).start();

                setTimeout(() => {
                    setNumberItemToSell("");
                    setBuyer_name("");
                    setBuyer_phone("");
                    setDepositAmount("");
                    setWholesale(false);

                    if (app_description.close_sale_board_after_operation === 0) {
                        dispatch(setShowModalApp(false));
                        setShowSaleFrame(false);
                    }

                    if (app_description.after_sale === 0) {
                        navigation.navigate('Sale', { sale: sale, item: itemToSell, prices: ItemPrices });
                    }

                    setIsSaleCompleted(false);
                    saleFadeAnim.setValue(1);
                    saleSuccessAnim.setValue(0);
                }, 3000);
            }
        }
    }

    const Detail = () => {
        if (!wholesale) {
            setItemToSellPrice(ItemPrices.wholesale_selling_price);
        } else {
            setItemToSellPrice(ItemPrices.retail_selling_price);
        }
        setWholesale(!wholesale)
    }

    const error_number = () => {

        if (wholesale) {
            if ((parseInt(numberItemToSell) * itemToSell.wholesale_content_number) > itemToSell.items_number_stock) {
                return false;
            }
        } else {
            if (parseInt(numberItemToSell) > itemToSell.items_number_stock) {
                return false;
            }
        }

        return true;
    }

    // const SearchItem = (search: string) => {
    //     setSearched_text(search);
    //     let filtered_items = items.filter(item => {
    //         return item.item_name.toLowerCase().includes(search.toLowerCase().toString())
    //         // || item.code.toLowerCase().includes(search.toLowerCase().toString());
    //     });

    //     setIIItems(filtered_items as never);
    // }

    return (
        <View style={{
            flex: 1,
            backgroundColor: theme.background,
        }}>
            {showSaleSuccess ? (
                <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowSaleSuccess(false) }} singleButton title={strings.success}>
                    <View style={{ justifyContent: 'center', alignItems: 'center', paddingVertical: 20 }}>
                        <View style={{
                            width: 80,
                            height: 80,
                            borderRadius: 40,
                            backgroundColor: theme.success + '20',
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginBottom: 16,
                        }}>
                            <IconApp pack="FI" name="check" color={theme.success} size={40} />
                        </View>
                    </View>
                </ModalApp>
            ) : null}

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 50 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* ── Item Hero Header (NewBusiness style) ── */}
                <View style={{
                    alignItems: 'center',
                    marginVertical: 20,
                }}>
                    <View style={{
                        width: 60,
                        height: 60,
                        borderRadius: 30,
                        backgroundColor: theme.high_color + "15",
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: 12
                    }}>
                        <IconApp pack="FI" name="shopping-bag" size={28} color={theme.high_color} />
                    </View>
                    <YambiText
                        text={itemToSell.item_name}
                        bold
                        size="big"
                        style={{ fontSize: 22, textAlign: 'center', marginBottom: 8 }}
                    />
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
                        <View style={{
                            backgroundColor: itemToSell.items_number_stock > 0 ? theme.success + '20' : theme.error + '20',
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 12,
                            flexDirection: 'row',
                            alignItems: 'center',
                        }}>
                            <IconApp pack="FI" name="package" size={14} color={itemToSell.items_number_stock > 0 ? theme.success : theme.error} />
                            <YambiText
                                text={itemToSell.items_number_stock.toString() + " " + strings.in_store.toLowerCase()}
                                size="small"
                                color={itemToSell.items_number_stock > 0 ? "success" : "error"}
                                bold
                                style={{ marginLeft: 6, fontSize: 12 }}
                            />
                        </View>
                        {itemToSell.items_number_warehouse > 0 && (
                            <View style={{
                                backgroundColor: theme.high_color + '20',
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                borderRadius: 12,
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}>
                                <IconApp pack="FI" name="home" size={14} color={theme.high_color} />
                                <YambiText
                                    text={itemToSell.items_number_warehouse.toString() + " " + strings.in_warehouse.toLowerCase()}
                                    size="small"
                                    color="high"
                                    bold
                                    style={{ marginLeft: 6, fontSize: 12 }}
                                />
                            </View>
                        )}
                    </View>
                </View>

                {/* ── CARD 1: Sale Mode Selection (NewBusiness Card Style) ── */}
                <View style={{
                    backgroundColor: theme.border + "15",
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 16,
                    borderWidth: 1,
                    borderColor: theme.border,
                }}>
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: 16,
                        borderBottomWidth: 1,
                        borderColor: theme.border,
                        paddingBottom: 12
                    }}>
                        <View style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            backgroundColor: theme.high_color + "20",
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginRight: 10,
                        }}>
                            <IconApp pack="FI" name="grid" size={18} color={theme.high_color} />
                        </View>
                        <YambiText bold text={(strings as any).type_sale || "Sale Type"} style={{ fontSize: 16 }} />
                    </View>

                    <View style={{
                        flexDirection: 'row',
                        gap: 10,
                        flexWrap: 'wrap',
                    }}>
                        <Pressable
                            disabled={isReservation}
                            onPress={() => setType_sale(type_sale === 0 ? 1 : 0)}
                            style={{
                                flex: 1,
                                minWidth: 130,
                                flexDirection: 'row',
                                alignItems: 'center',
                                padding: 12,
                                backgroundColor: isReservation ? theme.border : (type_sale === 0 ? theme.high_color + '15' : theme.background),
                                borderRadius: 12,
                                borderWidth: 2,
                                borderColor: isReservation ? 'transparent' : (type_sale === 0 ? theme.high_color : theme.border),
                                opacity: isReservation ? 0.4 : 1,
                            }}>
                            <View style={{
                                width: 20,
                                height: 20,
                                borderRadius: 10,
                                borderWidth: 2,
                                borderColor: isReservation ? theme.gray : (type_sale === 0 ? theme.high_color : theme.gray),
                                backgroundColor: isReservation ? 'transparent' : (type_sale === 0 ? theme.high_color : 'transparent'),
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginRight: 8,
                            }}>
                                {!isReservation && type_sale === 0 && <IconApp pack="FI" name="check" size={12} color={theme.background} />}
                            </View>
                            <YambiText text={strings.cash} size="normal" color={isReservation ? "gray" : "default"} bold={!isReservation && type_sale === 0} />
                        </Pressable>

                        <Pressable
                            onPress={Detail}
                            style={{
                                flex: 1,
                                minWidth: 130,
                                flexDirection: 'row',
                                alignItems: 'center',
                                padding: 12,
                                backgroundColor: !wholesale ? theme.high_color + '15' : theme.background,
                                borderRadius: 12,
                                borderWidth: 2,
                                borderColor: !wholesale ? theme.high_color : theme.border,
                            }}>
                            <View style={{
                                width: 20,
                                height: 20,
                                borderRadius: 10,
                                borderWidth: 2,
                                borderColor: !wholesale ? theme.high_color : theme.gray,
                                backgroundColor: !wholesale ? theme.high_color : 'transparent',
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginRight: 8,
                            }}>
                                {!wholesale && <IconApp pack="FI" name="check" size={12} color={theme.background} />}
                            </View>
                            <YambiText text={strings.detail} size="normal" color="default" bold={!wholesale} />
                        </Pressable>

                        <Pressable
                            onPress={() => setIsReservation(!isReservation)}
                            style={{
                                flex: 1,
                                minWidth: 130,
                                flexDirection: 'row',
                                alignItems: 'center',
                                padding: 12,
                                backgroundColor: isReservation ? theme.high_color + '15' : theme.background,
                                borderRadius: 12,
                                borderWidth: 2,
                                borderColor: isReservation ? theme.high_color : theme.border,
                            }}>
                            <View style={{
                                width: 20,
                                height: 20,
                                borderRadius: 10,
                                borderWidth: 2,
                                borderColor: isReservation ? theme.high_color : theme.gray,
                                backgroundColor: isReservation ? theme.high_color : 'transparent',
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginRight: 8,
                            }}>
                                {isReservation && <IconApp pack="FI" name="check" size={12} color={theme.background} />}
                            </View>
                            <YambiText text={(strings as any).make_reservation || "Make reservation"} size="normal" color="default" bold={isReservation} />
                        </Pressable>
                    </View>
                </View>

                {/* ── CARD 2: Price & Quantity (NewBusiness Card Style) ── */}
                <View style={{
                    backgroundColor: theme.border + "15",
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 16,
                    borderWidth: 1,
                    borderColor: theme.border,
                }}>
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: 16,
                        borderBottomWidth: 1,
                        borderColor: theme.border,
                        paddingBottom: 12
                    }}>
                        <View style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            backgroundColor: theme.high_color + "20",
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginRight: 10,
                        }}>
                            <IconApp pack="FI" name="dollar-sign" size={18} color={theme.high_color} />
                        </View>
                        <YambiText bold text={strings.price || "Price & Quantity"} style={{ fontSize: 16 }} />
                    </View>

                    {/* Price Input */}
                    <View style={{ marginBottom: 16 }}>
                        <YambiText text={strings.price} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 8 }} />
                        <View style={{
                            backgroundColor: theme.background,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: theme.border,
                        }}>
                            <TextInput
                                placeholderTextColor="gray"
                                placeholder="0.00"
                                maxLength={20}
                                keyboardType="numeric"
                                style={{
                                    color: theme.text,
                                    paddingHorizontal: 16,
                                    paddingVertical: 14,
                                    fontSize: 16,
                                    fontWeight: '600',
                                }}
                                value={itemToSellPrice}
                                onChangeText={text => setItemToSellPrice(text)}
                            />
                        </View>
                    </View>

                    {/* Quantity Input */}
                    <View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            {error_number() ?
                                <YambiText text={strings.quantity} size="small" color="gray" style={{ marginLeft: 2 }} /> :
                                <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: theme.error + '15',
                                    paddingHorizontal: 10,
                                    paddingVertical: 4,
                                    borderRadius: 8,
                                }}>
                                    <IconApp pack="FI" name="alert-circle" size={12} color={theme.error} />
                                    <YambiText text={strings.quantity_unavailable} size="small" color="error" style={{ marginLeft: 4, fontSize: 11 }} />
                                </View>
                            }
                        </View>
                        <View style={{
                            backgroundColor: theme.background,
                            borderRadius: 12,
                            borderWidth: error_number() ? 1 : 2,
                            borderColor: error_number() ? theme.border : theme.error,
                        }}>
                            <TextInput
                                placeholderTextColor="gray"
                                placeholder="0"
                                maxLength={20}
                                keyboardType="numeric"
                                style={{
                                    color: theme.text,
                                    paddingHorizontal: 16,
                                    paddingVertical: 14,
                                    fontSize: 16,
                                    fontWeight: '600',
                                }}
                                value={numberItemToSell}
                                onChangeText={text => setNumberItemToSell(text)}
                            />
                        </View>
                    </View>
                </View>

                {/* ── CARD 3: Buyer & Payment Info (NewBusiness Card Style) ── */}
                <View style={{
                    backgroundColor: theme.border + "15",
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 20,
                    borderWidth: 1,
                    borderColor: theme.border,
                }}>
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: 16,
                        borderBottomWidth: 1,
                        borderColor: theme.border,
                        paddingBottom: 12
                    }}>
                        <View style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            backgroundColor: theme.high_color + "20",
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginRight: 10,
                        }}>
                            <IconApp pack="FI" name="user" size={18} color={theme.high_color} />
                        </View>
                        <YambiText bold text={isReservation ? (strings.buyer_name || "Client Details") : (type_sale === 0 ? strings.buyer_name : strings.debtor_name)} style={{ fontSize: 16 }} />
                    </View>

                    {/* Buyer/Debtor Name */}
                    <View style={{ marginBottom: 16 }}>
                        <YambiText text={isReservation ? (strings.buyer_name || "Client name") : (type_sale === 0 ? strings.buyer_name : strings.debtor_name)} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 8 }} />
                        <View style={{
                            backgroundColor: theme.background,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: theme.border,
                        }}>
                            <TextInput
                                placeholderTextColor="gray"
                                placeholder={isReservation ? (strings.buyer_name || "Client name") : (type_sale === 0 ? strings.buyer_name : strings.debtor_name)}
                                maxLength={50}
                                style={{
                                    color: theme.text,
                                    paddingHorizontal: 16,
                                    paddingVertical: 14,
                                    fontSize: 15,
                                }}
                                value={buyer_name}
                                onChangeText={text => setBuyer_name(text)}
                            />
                        </View>
                    </View>

                    {/* Buyer/Debtor Phone */}
                    <View style={{ marginBottom: (isReservation || type_sale === 1) ? 16 : 0 }}>
                        <YambiText text={isReservation ? (strings.buyer_phone || "Client phone") : (type_sale === 0 ? strings.buyer_phone : strings.debtor_phone)} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 8 }} />
                        <View style={{
                            backgroundColor: theme.background,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: theme.border,
                        }}>
                            <TextInput
                                placeholderTextColor="gray"
                                placeholder="+243..."
                                maxLength={20}
                                keyboardType="phone-pad"
                                style={{
                                    color: theme.text,
                                    paddingHorizontal: 16,
                                    paddingVertical: 14,
                                    fontSize: 15,
                                }}
                                value={buyer_phone}
                                onChangeText={text => setBuyer_phone(text)}
                            />
                        </View>
                    </View>

                    {/* Paid/Deposit Amount (For reservation mode OR credit sale / debt) */}
                    {(isReservation || type_sale === 1) && (
                        <View style={{ marginBottom: 0 }}>
                            <YambiText text={(strings as any).deposit_amount || "Paid/Deposit amount"} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 8 }} />
                            <View style={{
                                backgroundColor: theme.background,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: theme.border,
                            }}>
                                <TextInput
                                    placeholderTextColor="gray"
                                    placeholder="0.00"
                                    maxLength={20}
                                    keyboardType="numeric"
                                    style={{
                                        color: theme.text,
                                        paddingHorizontal: 16,
                                        paddingVertical: 14,
                                        fontSize: 16,
                                        fontWeight: '600',
                                    }}
                                    value={depositAmount}
                                    onChangeText={text => setDepositAmount(text)}
                                />
                            </View>
                        </View>
                    )}
                </View>

                {/* Action Area: Sell Button & Animated Success Message Cross-fade */}
                <View style={{ marginTop: 8, marginBottom: 40, minHeight: 48, justifyContent: 'center', position: 'relative' }}>
                    <Animated.View
                        pointerEvents={isSaleCompleted ? 'none' : 'auto'}
                        style={{
                            opacity: saleFadeAnim,
                            transform: [{
                                scale: saleFadeAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0.95, 1]
                                })
                            }]
                        }}
                    >
                        <ButtonNormal
                            title={strings.proceed}
                            onPress={ConfirmSale}
                            disabled={!numberItemToSell || !error_number()}
                            loadEnabled={true}
                            normal={true}
                        />
                    </Animated.View>

                    {isSaleCompleted && (
                        <Animated.View
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                opacity: saleSuccessAnim,
                                transform: [{
                                    scale: saleSuccessAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0.85, 1]
                                    })
                                }],
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: theme.success + '20',
                                borderRadius: 24,
                                borderWidth: 1,
                                borderColor: theme.success + '60',
                                paddingVertical: 12,
                            }}
                        >
                            <IconApp pack="IO" name="checkmark-circle" size={24} color={theme.success} />
                            <YambiText
                                text={isReservation ? ((strings as any).reservation_added_successfully || "Reservation added successfully") : (strings.sale_completed || "The sale has been completed")}
                                bold
                                style={{ marginLeft: 10, color: theme.success, fontSize: 15 }}
                            />
                        </Animated.View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

export default AddItemSale;
