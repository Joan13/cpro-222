import {  ScrollView, View, Pressable } from 'react-native';
import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/app/hooks';
import { setShowModalApp } from '../../store/reducers/appSlice';
import { strings } from '../../lang/lang';
import { IconApp } from '../../components/app/IconApp';
import { NavProps, TBusinessUser, TItem, TItemPrices, TSale } from '../../types/types';
import { useObject, useQuery } from '@realm/react';
import { BusinessItemsSale, BusinessUsers, UserBusinessArticles, UserBusinesses, UserSellsPoints } from '../../store/database/Models';
import { FlashList } from '@shopify/flash-list';
import SalesList from '../../components/lists/business/SalesList';
import { TextNormalYambi, TextNormalYambiError, TextNormalYambiHighColor, TextNormalYambiHighColor2, TextNormalYambiHighColor3, TextNormalYambiSuccess, TextSmallYambi, TextSmallYambiError, TextSmallYambiGray, TextSmallYambiHighColor, TextSmallYambiHighColor2, TextSmallYambiSuccess } from '../../components/app/Text';
import { global_currencies, renderBusinessUserLevel, renderCurrency, renderDateTime } from '../../../GlobalVariables';
import ModalApp from '../../components/app/ModalApp';
import ButtonNormal from '../../components/app/ButtonNormal';
import DateRangePicker from "rn-select-date-range";
import moment from "moment";
import { BusinessUserFilterView } from '../../components/lists/business/BusinessUserFilter';
import { setRemoveBusinessBadge, setRemoveSalesPointBadge } from '../../store/reducers/persistedAppSlice';

const Sales = ({ navigation, route }: NavProps) => {

    const { business_id } = route.params;
    const { sales_point_id } = route.params;
    const { item_id } = route.params;

    const business = useObject(UserBusinesses, business_id);
    const sales_point = useObject(UserSellsPoints, sales_point_id);
    const item = useObject(UserBusinessArticles, item_id);

    const app_theme = useAppSelector(state => state.app_theme);
    const app_language = useAppSelector(state => state.persisted_app.langApp);
    const user_data = useAppSelector(state => state.user_data);
    const dispatch = useAppDispatch();
    const [date_start, setDate_start] = useState<string>("");
    const [date_end, setDate_end] = useState<string>("");
    const [user_filter, setUser_filter] = useState<string>("");
    const [date_selection_modal, setDate_selection_modal] = useState<boolean>(false);
    const [show_users_filter, setShow_users_filter] = useState<boolean>(false);
    const [filtered_sales, setFiltered_sales] = useState([]);
    const [show_category_filter, setShow_category_filter] = useState<boolean>(false);
    const [category_filter, setCategory_filter] = useState<number>(0);
    const [show_currency_filter, setShow_currency_filter] = useState<boolean>(false);
    const [currency_filter, setCurrency_filter] = useState<string>("");
    const [sale_active_filter, setSale_active_filter] = useState<number>(1);
    const [businessss, setBusinessss] = useState<string>("");
    const [bus, setBus] = useState([]);

    const uuser = useQuery(
        BusinessUsers, bss => {
            return bss.filtered('user == $0 && business_id == $1', user_data.phone_number, business_id !== "" ? business_id : sales_point.business_id);
        }, []);

    const oo = uuser.find(element => element.user === user_data.phone_number);
    // console.log(oo);

    const LLg = () => {
        if (app_language === "sw_drc") {
            return "fr";
        } else {
            return app_language;
        }
    }

    const show_date_filters = () => {
        if (date_start === "" || date_end === "") {
            return strings.all;
        }

        return renderDateTime(date_start, 3, true) + " - " + renderDateTime(date_end, 3, true);
    }

    const show_category_filters = () => {
        if (sale_active_filter === 1 && category_filter === 0) {
            return strings.completed_sales;
        }

        if (sale_active_filter === 0 && category_filter === 0) {
            return strings.deleted_sales;
        }

        if (category_filter === 1) {
            return strings.on_credit;
        }

        return "";
    }

    const show_currency_filters = () => {
        if (currency_filter === "") {
            return strings.all;
        }

        return renderCurrency(parseInt(currency_filter), true);
    }

    const show_users_filters = () => {
        if (user_filter === "") {
            return strings.all;
        }

        return user_filter;
    }

    const bs = useQuery(
        BusinessItemsSale, bss => {
            return bss.filtered('business_id == $0 || sales_point_id== $1 || item_id == $2', business_id, sales_point_id, item_id)
                .sorted('createdAt', true)
        }, []);

    // const bus = useQuery(
    //     BusinessUsers, bss => {
    //         return bss.filtered('business_id == $0', business_id)
    //     }, []);

    const valid_items = useQuery(
        UserBusinessArticles, bi => {
            return bi.filtered('business_id == $0 && item_active=$1', business_id, 1)
        }, []);

    const conditionShowGlobal = (SS: string) => {
        if (oo !== null && oo !== undefined) {
            if ((oo.user_active === 1 && oo.level === 1) || (oo.user_active === 1 && oo.level === 2 && oo.sales_point_id === sales_point_id)) {
                if (SS.length > 0 && sale_active_filter !== 0) {
                    return true;
                }
            }
            else {
                return false;
            }
        }

        if (SS.length > 0 && sale_active_filter !== 0) {
            return true;
        }

        return false;
    }

    const conditionShowSales = () => {
        if (oo !== null && oo !== undefined) {
            if (oo.user_active === 1 && oo.level === 3 && oo.sales_point_id === sales_point_id) {
                return true;
            }
        }

        return false;
    }

    const setSS = () => {
        let fs = bs.filter(salee => {
            // category_filter: 0 = all sales (both cash and credit), 1 = only credit sales
            const categoryMatch = category_filter === 0 ? true : salee.type_sale === category_filter;

            if (date_end !== "" && date_start !== "") {
                return moment(salee.createdAt).format("YYYY-MM-DD") >= date_start 
                    && moment(salee.createdAt).format("YYYY-MM-DD") <= date_end 
                    && salee.sale_operator.includes(user_filter) 
                    && salee.currency.toString().includes(currency_filter.toString()) 
                    && salee.sale_active === sale_active_filter 
                    && categoryMatch;
            }
            else {
                return salee.sale_operator.includes(user_filter) 
                    && salee.currency.toString().includes(currency_filter.toString()) 
                    && salee.sale_active === sale_active_filter 
                    && categoryMatch;
            }
        });

        setFiltered_sales(fs);
    }

    useEffect(() => {

        if (conditionShowSales()) {
            setUser_filter(oo.user);
        }
        // let fs = [];

        // if(filtered_sales.length ===0){
        // setFiltered_sales(bs as never);
        // } 

        // setTimeout(()=>{
        setSS();
        // }, 300);

        if (business !== null) {
            navigation.setOptions({ title: business.business_name });
            dispatch(setRemoveBusinessBadge(business_id));
        }

        if (sales_point !== null) {
            navigation.setOptions({ title: sales_point.sells_point_name });
            dispatch(setRemoveSalesPointBadge(sales_point_id));
        }

        if (item !== null) {
            navigation.setOptions({ title: item.item_name });
        }

        let okoo = [];
        for (let i in bs) {
            if (!okoo.includes(bs[i].sale_operator)) {
                okoo.push(bs[i].sale_operator);
            }
        }

        setBus(okoo);

    }, [date_start, date_end, user_filter, category_filter, sale_active_filter, currency_filter, business_id, sales_point_id, bs, item_id]);

    const actionUsersFilter = (phone_number: string) => {
        setUser_filter(phone_number);
        setShow_users_filter(false);
    }

    const SalesListHeader = ({ sales }) => {
        return (
            <View
                style={{
                    borderColor: app_theme.colors.high_color,
                }}>
                <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between'
                }}>
                    <Pressable
                        onPress={() => {
                            setDate_selection_modal(true);
                            dispatch(setShowModalApp(true));
                        }}
                        style={{
                            margin: 12,
                            borderColor: app_theme.colors.border,
                            borderWidth: 1,
                            paddingRight: 12,
                            paddingLeft: 14,
                            backgroundColor: app_theme.colors.background,
                            borderRadius: 12,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.08,
                            shadowRadius: 3,
                            elevation: 3,
                            paddingVertical: 12,
                            flex: 1,
                            marginRight: 5,
                            marginBottom: 0
                        }}>
                        <TextNormalYambi text={strings.filter_by_date} />
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center'
                        }}>
                            <TextSmallYambiHighColor styles={{ flex: 1 }} numberLines={1} text={show_date_filters()} />
                            <Pressable
                                style={{
                                    height: 20,
                                    width: 25,
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }}
                                onPress={() => {
                                    setDate_end("");
                                    setDate_start("");
                                }}>
                                {date_start !== "" && date_end !== "" ? <IconApp pack="FI" name="x" size={15} color={app_theme.colors.gray} /> : null}
                            </Pressable>
                        </View>
                    </Pressable>

                    <Pressable
                        onPress={() => {
                            if (!conditionShowSales()) {
                                setShow_users_filter(true);
                                dispatch(setShowModalApp(true));
                            }
                        }}
                        style={{
                            margin: 12,
                            borderColor: app_theme.colors.border,
                            borderWidth: 1,
                            paddingRight: 12,
                            paddingLeft: 14,
                            backgroundColor: app_theme.colors.background,
                            borderRadius: 12,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.08,
                            shadowRadius: 3,
                            elevation: 3,
                            paddingVertical: 12,
                            flex: 1,
                            marginLeft: 5,
                            marginBottom: 0
                        }}>
                        <TextNormalYambi text={strings.filter_by_seller} />
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center'
                        }}>
                            <TextSmallYambiHighColor styles={{ flex: 1 }} numberLines={1} text={show_users_filters()} />
                            <Pressable
                                style={{
                                    height: 20,
                                    width: 25,
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }}
                                onPress={() => {
                                    if (!conditionShowSales()) {
                                        setUser_filter("");
                                    }
                                }}>
                                {user_filter !== "" ? <IconApp pack="FI" name="x" size={15} color={app_theme.colors.gray} /> : null}
                            </Pressable>
                        </View>
                    </Pressable>
                </View>

                <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginBottom: 5
                }}>
                    <Pressable
                        onPress={() => {
                            setShow_category_filter(true);
                            dispatch(setShowModalApp(true));
                        }}
                        style={{
                            margin: 12,
                            borderColor: app_theme.colors.border,
                            borderWidth: 1,
                            paddingRight: 12,
                            paddingLeft: 14,
                            backgroundColor: app_theme.colors.background,
                            borderRadius: 12,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.08,
                            shadowRadius: 3,
                            elevation: 3,
                            paddingVertical: 12,
                            flex: 1,
                            marginRight: 5,
                            marginBottom: 0
                        }}>
                        <TextNormalYambi text={strings.filter_by_category} />
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center'
                        }}>
                            <TextSmallYambiHighColor styles={{ flex: 1 }} numberLines={1} text={show_category_filters()} />
                        </View>
                    </Pressable>

                    <Pressable
                        onPress={() => {
                            setShow_currency_filter(true);
                            dispatch(setShowModalApp(true));
                        }}
                        style={{
                            margin: 12,
                            borderColor: app_theme.colors.border,
                            borderWidth: 1,
                            paddingRight: 12,
                            paddingLeft: 14,
                            backgroundColor: app_theme.colors.background,
                            borderRadius: 12,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.08,
                            shadowRadius: 3,
                            elevation: 3,
                            paddingVertical: 12,
                            flex: 1,
                            marginLeft: 5,
                            marginBottom: 0
                        }}>
                        <TextNormalYambi text={strings.filter_by_currency} />
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center'
                        }}>
                            <TextSmallYambiHighColor styles={{ flex: 1 }} numberLines={1} text={show_currency_filters()} />
                            <Pressable
                                style={{
                                    height: 20,
                                    width: 25,
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }}
                                onPress={() => {
                                    setCurrency_filter("");
                                }}>
                                {currency_filter !== "" ? <IconApp pack="FI" name="x" size={15} color={app_theme.colors.gray} /> : null}
                            </Pressable>
                        </View>
                    </Pressable>
                </View>
                {global_currencies.map((currency: number, index: number) => {

                    let CP: string = "0";
                    let SP: string = "0";
                    let NS: string = "0";

                    const SS = sales.filter(sale => sale.currency === currency);

                    for (let i in SS) {
                        if (SS[i].cost_price && SS[i].currency === currency && SS[i].sale_active === 1) {
                            CP = (parseFloat(CP) + (parseFloat(SS[i].cost_price) * SS[i].number)).toString();
                        }

                        if (SS[i].selling_price && SS[i].currency === currency && SS[i].sale_active === 1) {
                            SP = (parseFloat(SP) + (parseFloat(SS[i].selling_price) * SS[i].number)).toString();
                        }

                        if (SS[i].number && SS[i].currency === currency && SS[i].sale_active === 1) {
                            NS = (parseInt(NS) + (SS[i].number)).toString();
                        }
                    }

                    let pp = (parseFloat(SP) - (parseFloat(CP)));
                    let pp2 = pp / parseFloat(SP);
                    let profit = pp2 ? pp2 * 100 : 0;

                    if (conditionShowGlobal(SS)) {
                        return (
                            <View key={currency} style={{
                                margin: 12,
                                borderColor: app_theme.colors.border,
                                borderWidth: 1,
                                paddingHorizontal: 16,
                                paddingVertical: 16,
                                backgroundColor: app_theme.colors.border,
                                borderRadius: 16,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.1,
                                shadowRadius: 4,
                                elevation: 4,
                                marginVertical: 8
                            }}>
                                <TextNormalYambiHighColor2 bold numberLines={1} text={renderCurrency(currency, true)} styles={{ marginTop: 20, marginBottom: 0, borderBottomWidth: 0, borderColor: app_theme.colors.high_color2, paddingBottom: 15 }} />
                                <View style={{
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    marginVertical: 10
                                }}>
                                    <View style={{
                                        flex: 1
                                    }}>
                                        <TextNormalYambi text={strings.total_cost_price_sales} />
                                        <TextSmallYambiGray text={NS==="1"?NS+" "+strings.item.toLowerCase():NS + " " + strings.items.toLowerCase()} />
                                    </View>
                                    <TextNormalYambi bold text={parseFloat(CP).toFixed(2) + " " + renderCurrency(currency, false)} styles={{ marginRight: 5 }} />
                                </View>

                                <View style={{
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    marginVertical: 10,
                                    flex: 1
                                }}>
                                    <View style={{
                                        flex: 1
                                    }}>
                                        <TextNormalYambi text={strings.total_selling_price_sales} />
                                        <TextSmallYambiGray text={NS==="1"?NS+" "+strings.item.toLowerCase():NS + " " + strings.items.toLowerCase() + " (" + strings.tva + " " + strings.included.toLowerCase() + ")"} />
                                    </View>
                                    <View style={{
                                        alignItems: 'flex-end'
                                    }}>
                                        <TextNormalYambi bold text={parseFloat(SP).toFixed(2) + " " + renderCurrency(currency, false)} styles={{ marginRight: 5 }} />
                                        <View style={{
                                            backgroundColor: profit > 0 ? app_theme.colors.high_color2 + "40" : app_theme.colors.error + "40",
                                            borderColor: profit > 0 ? app_theme.colors.high_color2 : app_theme.colors.error,
                                            paddingHorizontal: 10,
                                            borderRadius: 15,
                                            paddingVertical: 2
                                        }}>
                                            {profit > 0 ?
                                                <TextSmallYambiHighColor2 text={"+" + (profit.toFixed(2) + " %")} />
                                                :
                                                <TextSmallYambiError text={(profit.toFixed(2) + " %")} />}
                                        </View>
                                    </View>
                                </View>

                                <View style={{
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    marginVertical: 10,
                                    borderTopWidth: 1,
                                    borderColor: profit > 0 ? app_theme.colors.high_color2 : app_theme.colors.error,
                                    paddingTop: 10,
                                    flex: 1
                                }}>
                                    <View style={{
                                        flex: 1
                                    }}>
                                        <TextNormalYambi text={strings.total_profit_sales} />
                                    </View>
                                    {/* <TextNormalYambi numberLines={1} text={strings.total_profit_sales} /> */}
                                    <View style={{
                                        alignItems: 'flex-end',
                                        // backgroundColor:'green'
                                    }}>

                                        <View style={{
                                            backgroundColor: profit > 0 ? app_theme.colors.high_color2 + "40" : app_theme.colors.error + "40",
                                            borderColor: profit > 0 ? app_theme.colors.high_color2 : app_theme.colors.error,
                                            // borderWidth: 1,
                                            paddingHorizontal: 10,
                                            borderRadius: 15,
                                            paddingVertical: 2
                                        }}>
                                            {profit > 0 ? <TextNormalYambiHighColor2 bold text={pp.toFixed(2) + " " + renderCurrency(currency, false)} styles={{ marginRight: 5 }} />
                                                : <TextNormalYambiError bold text={pp.toFixed(2) + " " + renderCurrency(currency, false)} styles={{ marginRight: 5 }} />}
                                        </View>
                                    </View>
                                </View>

                                {/* <View style={{
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    marginVertical: 10,
                                    borderTopWidth: 1,
                                    borderColor: profit > 0 ? app_theme.colors.success : app_theme.colors.error,
                                    paddingTop: 10,
                                    flex: 1
                                }}>
                                    <TextNormalYambi numberLines={1} text={strings.total_profit_sales} />
                                    {profit > 0 ? <TextNormalYambiSuccess bold text={pp.toFixed(2) + " " + renderCurrency(currency, false)} styles={{ marginRight: 5 }} />
                                        : <TextNormalYambiError bold text={pp.toFixed(2) + " " + renderCurrency(currency, false)} styles={{ marginRight: 5 }} />}
                                </View> */}
                            </View>
                        )
                    }
                })}

                <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginVertical: 15,
                    marginHorizontal: 15,
                }}>
                    <TextNormalYambi text={strings.detailed_sales + " (" + filtered_sales.length + ")"} styles={{ flex: 1 }} bold />
                    {business !== null ?
                        <Pressable onPress={() => navigation.navigate("BusinessItems", { business_id: business_id, flag: 1, sales_point_id: sales_point_id })} style={{
                            flexDirection: 'row',
                            alignItems: 'center'
                        }}>
                            <TextNormalYambiHighColor text={strings.view_sales_by_item} />
                            <IconApp pack='FI' name='chevron-right' size={20} color={app_theme.colors.high_color} />
                        </Pressable> : null}
                </View>

                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: app_theme.colors.border,
                    paddingHorizontal: 15,
                    marginTop: 5
                    // flex:1
                }}>
                    <View style={{
                        flex: 6
                    }}>
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            // paddingLeft: 15
                        }}>
                            <TextSmallYambi bold text={strings.item_name} numberLines={1} />
                        </View>
                    </View>

                    <View style={{
                        borderLeftWidth: 1,
                        borderRightWidth: 1,
                        borderColor: app_theme.colors.border,
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: 50
                    }}>
                        <TextSmallYambi bold text={strings.quantity_small} />
                    </View>

                    <View style={{
                        borderRightWidth: 1,
                        borderColor: app_theme.colors.border,
                        flex: 2,
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: 50
                    }}>
                        <TextSmallYambi bold text={strings.price} />
                        <TextSmallYambiGray text={strings.unit_price} styles={{ textAlign: 'center' }} />
                    </View>

                    <View style={{
                        borderLeftWidth: 0,
                        borderColor: app_theme.colors.border,
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: 40
                    }}>
                        <TextSmallYambi bold text={strings.currency_small} styles={{ textAlign: 'center' }} />
                    </View>
                </View>
            </View>
        )
    }

    const longPress = (sale: TSale, article: TItem, prices: TItemPrices) => {
        navigation.navigate('Sale', { sale: sale, item: article, prices: prices })
    }

    return (
        <View style={{
            flex: 1,
            backgroundColor: app_theme.colors.background,
            borderColor: app_theme.colors.border,
            borderTopWidth: 1
        }}>

            {show_users_filter ?
                <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShow_users_filter(false); }} singleButton title={strings.contact_select}>
                    <View style={{
                        width: '100%',
                        height: 300,
                        marginTop: -15
                    }}>
                        <FlashList
                            data={bus}
                            estimatedItemSize={50}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item, index }: { item: string, index: number }) =>
                                (<BusinessUserFilterView onAction={actionUsersFilter} phone_number={item} />)}
                        />
                    </View>
                </ModalApp> : null}

            {show_category_filter ?
                <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShow_category_filter(false); }} singleButton title={strings.select_category}>
                    <View style={{
                        width: '100%',
                        height: 184,
                        marginTop: -15
                    }}>
                        {/* <Pressable onPress={()=> {
                        setCategory_filter("");
                        setSale_active_filter(1);
                        dispatch(setShowModalApp(false)); 
                        setShow_category_filter(false);
                       }} style={{
                        height: 50,
                        justifyContent: 'center',
                        borderBottomWidth: 1,
                        borderColor: app_theme.colors.border
                       }}>
                        <TextNormalYambi text={strings.all} />
                        </Pressable>  */}

                        <Pressable onPress={() => {
                            setSale_active_filter(1);
                            setCategory_filter(0);
                            // setCategory_filter2(3);
                            dispatch(setShowModalApp(false));
                            setShow_category_filter(false);
                        }} style={{
                            height: 50,
                            justifyContent: 'center',
                            borderBottomWidth: 1,
                            borderColor: app_theme.colors.border
                        }}>
                            <TextNormalYambi text={strings.completed_sales} />
                        </Pressable>

                        <Pressable onPress={() => {
                            setSale_active_filter(0);
                            setCategory_filter(0);
                            // setCategory_filter2(3);
                            dispatch(setShowModalApp(false));
                            setShow_category_filter(false);
                        }} style={{
                            height: 50,
                            justifyContent: 'center',
                            borderBottomWidth: 1,
                            borderColor: app_theme.colors.border
                        }}>
                            <TextNormalYambi text={strings.deleted_sales} />
                        </Pressable>

                        <Pressable onPress={() => {
                            setCategory_filter(1);
                            // setCategory_filter2(1);
                            setSale_active_filter(1);
                            dispatch(setShowModalApp(false));
                            setShow_category_filter(false);
                        }} style={{
                            height: 50,
                            justifyContent: 'center',
                            borderBottomWidth: 1,
                            borderColor: app_theme.colors.border
                        }}>
                            <TextNormalYambi text={strings.on_credit} />
                        </Pressable>
                    </View>
                </ModalApp> : null}

            {show_currency_filter ?
                <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShow_currency_filter(false); }} singleButton title={strings.select_currency}>
                    <ScrollView style={{
                        width: '100%',
                        height: 200,
                        marginTop: -15
                    }}>
                        {global_currencies.map((cu: number, index) => {

                            let nbr = filtered_sales.filter(sal => sal.currency === cu);
                            if (nbr.length > 0) {
                                return (
                                    <Pressable onPress={() => {
                                        setCurrency_filter(cu.toString());
                                        dispatch(setShowModalApp(false));
                                        setShow_currency_filter(false);
                                    }} style={{
                                        height: 50,
                                        justifyContent: 'center',
                                        borderBottomWidth: 1,
                                        borderColor: app_theme.colors.border
                                    }}>
                                        <View style={{
                                            flexDirection: 'row',
                                            justifyContent: 'space-between'
                                        }}>
                                            <TextNormalYambi text={renderCurrency(cu, true)} numberLines={1} styles={{ flex: 3 }} />
                                            <TextNormalYambiHighColor text={nbr.length.toString()} styles={{ marginLeft: 0, flex: 1, textAlign: 'right' }} />
                                        </View>
                                    </Pressable>
                                )
                            }
                        })}
                    </ScrollView>
                </ModalApp> : null}

            {date_selection_modal ?
                <ModalApp
                    onCancel={() => { dispatch(setShowModalApp(false)); setDate_selection_modal(false), setDate_end(""), setDate_start("") }} onClose={() => { dispatch(setShowModalApp(false)); setDate_selection_modal(false) }} singleButton={false}
                    textAction={strings.confirm}
                    onAction={() => { dispatch(setShowModalApp(false)); setDate_selection_modal(false) }}
                    title={strings.choose_date_range}>
                    <View style={{
                        width: '100%'
                    }}>
                        <DateRangePicker
                            onSelectDateRange={(range) => {
                                setDate_start(range.firstDate.toString());
                                setDate_end(range.secondDate.toString());
                            }}
                            onClear={() => {
                                setDate_start("");
                                setDate_end("");
                            }}
                            ln={LLg()}
                            blockSingleDateSelection={false}
                            responseFormat="YYYY-MM-DD"
                            selectedDateContainerStyle={{
                                height: 35,
                                width: 35,
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: app_theme.colors.badge_background_color,
                                borderRadius: 35,
                                marginHorizontal: 5,
                            }}
                            selectedDateStyle={{
                                color: app_theme.colors.badge_color
                            }}
                            confirmBtnTitle=""
                            clearBtnTitle={strings.clear_selection}
                        />
                    </View>
                </ModalApp> : null}

            {bs.length > 0 ?
                <FlashList
                    data={filtered_sales as never}
                    // stickyHeaderIndices={[0]}
                    ListHeaderComponent={() => <SalesListHeader sales={filtered_sales} />}
                    estimatedItemSize={500}
                    renderItem={({ item, index }: { item: TSale, index: number }) => (<SalesList index={index} item={item} onLongPress={longPress} />)}
                />
                :
                <View style={{
                    justifyContent: 'center',
                    alignItems: 'center',
                    flex: 1,
                    marginHorizontal: 50
                }}>
                    <TextSmallYambiGray text={strings.no_sales_available} styles={{ textAlign: 'center' }} />
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        marginTop: 15
                    }}>
                        <ButtonNormal title={strings.add_item} loadEnabled={false} onPress={() => navigation.navigate("NewBusinessItem", { business_id: business_id })} styles={{ paddingHorizontal: 10 }} normal={true} />
                    </View>
                </View>}
        </View>
    )
}

export default Sales;

