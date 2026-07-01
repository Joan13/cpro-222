import { ScrollView, View, Pressable, Animated } from 'react-native';
import { useEffect, useState, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/app/hooks';
import { setShowModalApp } from '../../store/reducers/appSlice';
import { strings } from '../../lang/lang';
import { IconApp } from '../../components/app/IconApp';
import { NavProps, TBusinessUser, TItem, TItemPrices, TSale } from '../../types/types';
import { useObject, useQuery } from '@realm/react';
import { BusinessItemsSale, BusinessUsers, UserBusinessArticles, UserBusinesses, UserSellsPoints } from '../../store/database/Models';
import { FlashList } from '@shopify/flash-list';
import SalesList from '../../components/lists/business/SalesList';
import { TextNormalYambi, TextNormalYambiError, TextNormalYambiHighColor, TextNormalYambiHighColor2, TextNormalYambiSuccess, TextSmallYambi, TextSmallYambiError, TextSmallYambiGray, TextSmallYambiHighColor, TextSmallYambiHighColor2, TextSmallYambiSuccess } from '../../components/app/Text';
import { global_currencies, renderBusinessUserLevel, renderCurrency, renderDateTime } from '../../../GlobalVariables';
import ModalApp from '../../components/app/ModalApp';
import ButtonNormal from '../../components/app/ButtonNormal';
import DateRangePicker from "../../components/app/DateRangePicker";
import moment from "moment";
import { BusinessUserFilterView } from '../../components/lists/business/BusinessUserFilter';

const ItemSales = ({ navigation, route }: NavProps) => {

    const { business_id } = route.params;
    const { sales_point_id } = route.params;
    const { item_id } = route.params;

    const app_theme = useAppSelector(state => state.app_theme);
    const user_data = useAppSelector(state => state.user_data);
    const app_language = useAppSelector(state => state.persisted_app.langApp);
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
    const [bus, setBus] = useState([]);
    const [show_filters, setShow_filters] = useState<boolean>(false);
    const filtersHeight = useRef(new Animated.Value(0)).current;

    const business = useObject(UserBusinesses, business_id);
    const sales_point = useObject(UserSellsPoints, sales_point_id);
    const item = useObject(UserBusinessArticles, item_id);

    if (item === null) return;

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
        // if (category_filter === 0&&sale_active_filter===1) {
        //     return strings.all;
        // } 

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

    const uuser = useQuery(
        BusinessUsers, bss => {
            return bss.filtered('user == $0 && business_id == $1', user_data.phone_number, item.business_id)
        }, []);

    const oo = uuser.find(element => element.user === user_data.phone_number);
    // console.log(oo);

    const conditionShowGlobal = (SS: string) => {
        if (oo !== null && oo !== undefined) {
            if ((oo.user_active === 1 && oo.level === 1) || (oo.user_active === 1 && oo.level === 2 && oo.sales_point_id === sales_point_id)) {
                if (SS.length > 0 && sale_active_filter !== 0) {
                    return true;
                }
            }
        }

        if (SS.length > 0 && sale_active_filter !== 0) {
            return true;
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

    // Animate filters expand/collapse
    useEffect(() => {
        Animated.timing(filtersHeight, {
            toValue: show_filters ? 1 : 0,
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, [show_filters]);

    useEffect(() => {
        setSS();

        if (business !== null) {
            navigation.setOptions({ title: business.business_name });
        }

        if (sales_point !== null) {
            navigation.setOptions({ title: sales_point.sells_point_name });
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

    const activeFiltersCount = [
        date_start !== "" && date_end !== "",
        user_filter !== "",
        currency_filter !== "",
    ].filter(Boolean).length;

    const SalesListHeader = ({ sales }) => {
        return (
            <View style={{ paddingHorizontal: 0 }}>
                {/* Filters Toggle */}
                <Pressable
                    onPress={() => setShow_filters(!show_filters)}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: app_theme.colors.border,
                        padding: 15,
                        borderRadius: 12,
                        marginBottom: 15,
                        marginTop: 15,
                        marginHorizontal: 15
                    }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <IconApp pack="FI" name="filter" size={18} color={app_theme.colors.high_color} />
                        <TextNormalYambi text={strings.filter} bold styles={{ marginLeft: 10 }} />
                        {activeFiltersCount > 0 && (
                            <View style={{
                                backgroundColor: app_theme.colors.high_color,
                                borderRadius: 10,
                                paddingHorizontal: 8,
                                paddingVertical: 2,
                                marginLeft: 10,
                            }}>
                                <TextSmallYambi text={activeFiltersCount.toString()} styles={{ color: app_theme.colors.badge_color, fontSize: 12 }} />
                            </View>
                        )}
                    </View>
                    <IconApp pack="FI" name={show_filters ? "chevron-up" : "chevron-down"} size={20} color={app_theme.colors.text} />
                </Pressable>

                {/* Filters */}
                <Animated.View style={{
                    maxHeight: filtersHeight.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 600],
                    }),
                    opacity: filtersHeight,
                    overflow: 'hidden',
                }}>
                    <View style={{ marginBottom: 15,
                        marginHorizontal:15
                     }}>
                        {/* Date Filter */}
                        <Pressable
                            onPress={() => {
                                dispatch(setShowModalApp(true));
                                setDate_selection_modal(true);
                            }}
                            style={{
                                backgroundColor: app_theme.colors.background,
                                padding: 15,
                                borderRadius: 12,
                                marginBottom: 10,
                                borderWidth: 1,
                                borderColor: app_theme.colors.border,
                            }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <View style={{ flex: 1 }}>
                                    <TextSmallYambiGray text={strings.filter_by_date} styles={{ marginBottom: 5 }} />
                                    <TextNormalYambiHighColor text={show_date_filters()} />
                                </View>
                                {date_start !== "" && date_end !== "" && (
                                    <Pressable
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            setDate_start("");
                                            setDate_end("");
                                        }}
                                        style={{ padding: 5 }}>
                                        <IconApp pack="FI" name="x" size={18} color={app_theme.colors.gray} />
                                    </Pressable>
                                )}
                            </View>
                        </Pressable>

                        {/* Seller Filter */}
                        <Pressable
                            onPress={() => {
                                dispatch(setShowModalApp(true));
                                setShow_users_filter(true);
                            }}
                            style={{
                                backgroundColor: app_theme.colors.background,
                                padding: 15,
                                borderRadius: 12,
                                marginBottom: 10,
                                borderWidth: 1,
                                borderColor: app_theme.colors.border,
                            }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <View style={{ flex: 1 }}>
                                    <TextSmallYambiGray text={strings.filter_by_seller} styles={{ marginBottom: 5 }} />
                                    <TextNormalYambiHighColor text={show_users_filters()} />
                                </View>
                                {user_filter !== "" && (
                                    <Pressable
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            setUser_filter("");
                                        }}
                                        style={{ padding: 5 }}>
                                        <IconApp pack="FI" name="x" size={18} color={app_theme.colors.gray} />
                                    </Pressable>
                                )}
                            </View>
                        </Pressable>

                        {/* Category Filter */}
                        <Pressable
                            onPress={() => {
                                dispatch(setShowModalApp(true));
                                setShow_category_filter(true);
                            }}
                            style={{
                                backgroundColor: app_theme.colors.background,
                                padding: 15,
                                borderRadius: 12,
                                marginBottom: 10,
                                borderWidth: 1,
                                borderColor: app_theme.colors.border,
                            }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <View style={{ flex: 1 }}>
                                    <TextSmallYambiGray text={strings.filter_by_category} styles={{ marginBottom: 5 }} />
                                    <TextNormalYambiHighColor text={show_category_filters()} />
                                </View>
                            </View>
                        </Pressable>

                        {/* Currency Filter */}
                        <Pressable
                            onPress={() => {
                                dispatch(setShowModalApp(true));
                                setShow_currency_filter(true);
                            }}
                            style={{
                                backgroundColor: app_theme.colors.background,
                                padding: 15,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: app_theme.colors.border,
                            }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <View style={{ flex: 1 }}>
                                    <TextSmallYambiGray text={strings.filter_by_currency} styles={{ marginBottom: 5 }} />
                                    <TextNormalYambiHighColor text={show_currency_filters()} />
                                </View>
                                {currency_filter !== "" && (
                                    <Pressable
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            setCurrency_filter("");
                                        }}
                                        style={{ padding: 5 }}>
                                        <IconApp pack="FI" name="x" size={18} color={app_theme.colors.gray} />
                                    </Pressable>
                                )}
                            </View>
                        </Pressable>
                    </View>
                </Animated.View>
                {global_currencies.map((currency: number, index: number) => {

                    let CP: string = "0";
                    let SP: string = "0";
                    let NS: string = "0";

                    const SS = sales.filter(sale => sale.currency === currency);

                    const tva_rate = sales_point?.tva || 16;

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
                                paddingHorizontal: 15,
                                backgroundColor: app_theme.colors.border,
                                borderRadius: 12,
                                marginVertical: 7,
                                paddingVertical: 15
                            }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                                    <IconApp pack="FI" name="dollar-sign" size={18} color={app_theme.colors.high_color} />
                                    <TextNormalYambiHighColor text={renderCurrency(currency, true)} bold styles={{ marginLeft: 8 }} />
                                </View>

                                <View style={{ marginBottom: 10 }}>
                                    <View style={{
                                        flexDirection: 'row',
                                        justifyContent: 'space-between',
                                        marginBottom: 5
                                    }}>
                                        <TextSmallYambiGray text={strings.total_cost_price} />
                                        <TextNormalYambi bold text={parseFloat(CP).toFixed(2) + " " + renderCurrency(currency, false)} />
                                    </View>
                                    <View style={{
                                        flexDirection: 'row',
                                        justifyContent: 'space-between',
                                        marginBottom: 5
                                    }}>
                                        <TextSmallYambiGray text={strings.total_selling_price} />
                                        <TextNormalYambi bold text={parseFloat(SP).toFixed(2) + " " + renderCurrency(currency, false)} />
                                    </View>
                                </View>

                                <View style={{
                                    borderTopWidth: 1,
                                    borderColor: profit > 0 ? app_theme.colors.success : app_theme.colors.error,
                                    paddingTop: 10,
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}>
                                    <TextNormalYambi text={strings.total_profit} />
                                    <View style={{ alignItems: 'flex-end' }}>
                                        {profit > 0 ? (
                                            <>
                                                <TextNormalYambiSuccess text={pp.toFixed(2) + " " + renderCurrency(currency, false)} bold />
                                                <View style={{
                                                    backgroundColor: app_theme.colors.success + "20",
                                                    paddingHorizontal: 8,
                                                    paddingVertical: 2,
                                                    borderRadius: 10,
                                                    marginTop: 5,
                                                }}>
                                                    <TextSmallYambiGray text={"+" + profit.toFixed(2) + "%"} styles={{ color: app_theme.colors.success }} />
                                                </View>
                                            </>
                                        ) : (
                                            <>
                                                <TextNormalYambiError text={pp.toFixed(2) + " " + renderCurrency(currency, false)} bold />
                                                <View style={{
                                                    backgroundColor: app_theme.colors.error + "20",
                                                    paddingHorizontal: 8,
                                                    paddingVertical: 2,
                                                    borderRadius: 10,
                                                    marginTop: 5,
                                                }}>
                                                    <TextSmallYambiError text={profit.toFixed(2) + "%"} />
                                                </View>
                                            </>
                                        )}
                                    </View>
                                </View>

                                <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center' }}>
                                    <IconApp pack="FI" name="package" size={14} color={app_theme.colors.gray} />
                                    <TextSmallYambiGray text={`${NS} ${strings.items.toLowerCase()} • ${strings.tva}: ${tva_rate}%`} styles={{ marginLeft: 5 }} />
                                </View>
                            </View>
                        )
                    }
                })}

                {/* View Sales by Item Link */}
                {business !== null && (
                    <Pressable
                        onPress={() => navigation.navigate("BusinessItems", { business_id: business_id, flag: 1, sales_point_id: sales_point_id })}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: app_theme.colors.border,
                            padding: 15,
                            borderRadius: 12,
                            marginBottom: 15,
                            marginHorizontal: 15,
                        }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <IconApp pack="FI" name="list" size={18} color={app_theme.colors.high_color} />
                            <TextNormalYambi text={strings.view_sales_by_item} bold styles={{ marginLeft: 10 }} />
                        </View>
                        <IconApp pack="FI" name="chevron-right" size={20} color={app_theme.colors.text} />
                    </Pressable>
                )}

                <View style={{ marginHorizontal: 15, marginBottom: 10 }}>
                    <TextNormalYambi text={strings.detailed_sales} bold styles={{ fontSize: 18 }} />
                </View>

                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: app_theme.colors.border,
                    paddingHorizontal: 15,
                    paddingVertical: 12,
                    borderRadius: 8,
                    marginHorizontal: 12,
                    marginTop: 10,
                    marginBottom: 5
                }}>
                    <View style={{ flex: 6 }}>
                        <TextSmallYambi bold text={strings.item_name} numberLines={1} />
                    </View>
                    <View style={{ flex: 1, alignItems: 'center' }}>
                        <TextSmallYambi bold text={strings.quantity_small} />
                    </View>
                    <View style={{ flex: 2, alignItems: 'center' }}>
                        <TextSmallYambi bold text={strings.price} />
                        <TextSmallYambiGray text={strings.unit_price} styles={{ fontSize: 10 }} />
                    </View>
                    <View style={{ flex: 1, alignItems: 'center' }}>
                        <TextSmallYambi bold text={strings.currency_small} />
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
                null}
        </View>
    )
}

export default ItemSales;

