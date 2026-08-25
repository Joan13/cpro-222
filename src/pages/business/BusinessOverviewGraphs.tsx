import { Pressable, ScrollView, View, Animated } from 'react-native';
import { useEffect, useState, useRef, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/app/hooks';
import { setShowModalApp } from '../../store/reducers/appSlice';
import { strings } from '../../lang/lang';
import { IconApp } from '../../components/app/IconApp';
import { NavProps } from '../../types/types';
import { useObject, useQuery, useRealm } from '@realm/react';
import { BusinessItemsSale, BusinessUsers, UserBusinessArticles, UserBusinesses, UserSellsPoints, Expenses, Reservations } from '../../store/database/Models';
import { getSalePaymentDetails } from '../../utils/paymentHelpers';
import { TextNormalYambi, TextNormalYambiHighColor, TextSmallYambi, TextBigYambi, TextNormalYambiGray, TextSmallYambiGray, YambiText } from '../../components/app/Text';
import { global_currencies, renderCurrency, renderDateTime } from '../../../GlobalVariables';
import ModalApp from '../../components/app/ModalApp';
import BottomSheet from '../../components/app/BottomSheet';
import ButtonNormal from '../../components/app/ButtonNormal';
import DateRangePicker from "../../components/app/DateRangePicker";
import moment from "moment";
import SalesCharts from './SalesCharts';

const BusinessOverviewGraphs = ({ navigation, route }: NavProps) => {
    const params = route.params as {
        business_id?: string;
        sales_point_id?: string;
        item_id?: string;
        date_start?: string;
        date_end?: string;
        user_filter?: string;
        currency_filter?: string;
        category_filter?: number;
    } || {};

    const business_id = params.business_id || "";
    const sales_point_id = params.sales_point_id || "";
    const item_id = params.item_id || "";

    const business = useObject(UserBusinesses, business_id);
    const sales_point = useObject(UserSellsPoints, sales_point_id);
    const item = useObject(UserBusinessArticles, item_id);

    const app_theme = useAppSelector(state => state.app_theme);
    const app_language = useAppSelector(state => state.persisted_app.langApp);
    const user_data = useAppSelector(state => state.user_data);
    const dispatch = useAppDispatch();
    const realm = useRealm();

    const [date_start, setDate_start] = useState<string>(params.date_start || "");
    const [date_end, setDate_end] = useState<string>(params.date_end || "");
    const [user_filter, setUser_filter] = useState<string>(params.user_filter || "");
    const [currency_filter, setCurrency_filter] = useState<string>(params.currency_filter || "");
    const [category_filter, setCategory_filter] = useState<number>(params.category_filter || 0);
    const [show_filters_sheet, setShow_filters_sheet] = useState<boolean>(false);
    const [show_all_sellers, setShow_all_sellers] = useState<boolean>(false);
    const [show_all_currencies, setShow_all_currencies] = useState<boolean>(false);

    const uuser = useQuery(
        BusinessUsers, bss => {
            return bss.filtered('user == $0 && business_id == $1', user_data.phone_number, business_id !== "" ? business_id : sales_point?.business_id || "");
        }, [business_id, sales_point]);

    const oo = uuser.find(element => element.user === user_data.phone_number);

    const LLg = () => {
        if (app_language === "sw_drc") {
            return "fr";
        } else {
            return app_language;
        }
    };

    const bs = useQuery(
        BusinessItemsSale, bss => {
            return bss.filtered('business_id == $0 || sales_point_id == $1 || item_id == $2', business_id, sales_point_id, item_id)
                .sorted('createdAt', true);
        }, [business_id, sales_point_id, item_id]);

    const reservations = useQuery(
        Reservations, res => {
            return res.filtered(
                'business_id == $0 || sales_point_id == $1',
                business_id !== '' ? business_id : (sales_point?.business_id || ''),
                sales_point_id
            ).sorted('createdAt', true);
        }, [business_id, sales_point_id, sales_point]);

    const concerned_business_id = business_id !== "" ? business_id : (business?._id || sales_point?.business_id || "");

    const expenses = useQuery(
        Expenses, exp => {
            return exp.filtered(
                'business_id == $0 && expense_active == $1',
                concerned_business_id,
                1
            ).sorted('createdAt', true);
        }, [business_id, business, sales_point]);

    const uniqueSellers = Array.from(new Set(bs.map(sale => sale.sale_operator)));

    // Get available currencies
    const availableCurrencies = useMemo(() => {
        const present = global_currencies.filter((cu: number) => bs.some(s => s.currency === cu));
        return present.length > 0 ? present : global_currencies;
    }, [bs]);

    const conditionShowSales = () => {
        if (oo !== null && oo !== undefined) {
            if (oo.user_active === 1 && oo.level === 3 && oo.sales_point_id === sales_point_id) {
                return true;
            }
        }
        return false;
    };

    const filtered_sales = bs.filter(sale => {
        let dateMatch = true;
        let userMatch = true;
        let currencyMatch = true;
        let statusMatch = true;

        if (date_start !== "" && date_end !== "") {
            const saleDate = moment(sale.createdAt).format("YYYY-MM-DD");
            dateMatch = saleDate >= date_start && saleDate <= date_end;
        }

        userMatch = sale.sale_operator.includes(user_filter);
        currencyMatch = sale.currency.toString().includes(currency_filter.toString());
        const { isPaid } = getSalePaymentDetails(sale, realm);
        const isCredit = !isPaid;
        const categoryMatch = category_filter === 0 ? true : isCredit;
        statusMatch = sale.sale_active === 1 && categoryMatch;

        return dateMatch && userMatch && currencyMatch && statusMatch;
    }).sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime() || 0;
        const timeB = new Date(b.createdAt).getTime() || 0;
        return timeB - timeA;
    });

    const activeFiltersCount = [
        date_start !== "" && date_end !== "",
        user_filter !== "" && !conditionShowSales(),
        currency_filter !== "",
        category_filter === 1,
    ].filter(Boolean).length;

    useEffect(() => {
        const pageTitle = business?.business_name
            || sales_point?.sells_point_name
            || item?.item_name
            || strings.business_overview;
        navigation.setOptions({
            title: `${pageTitle} — ${strings.overview}`,
            headerRight: () => (
                <ButtonNormal
                    onPress={() => setShow_filters_sheet(true)}
                    title={activeFiltersCount > 0 ? "(" + activeFiltersCount.toString() + ") " + strings.filter : strings.filter}
                    styles={{ paddingHorizontal: 15 }}
                />
            ),
        });
    }, [business, sales_point, item, app_theme, activeFiltersCount, navigation]);

    const getCurrencyRevenueSummary = useMemo(() => {
        const isDateFiltered = date_start !== "" && date_end !== "";
        let currentStart = "";
        let currentEnd = "";
        let prevStart = "";
        let prevEnd = "";

        if (isDateFiltered) {
            currentStart = date_start;
            currentEnd = date_end;
            const durationDays = Math.max(1, moment(date_end).diff(moment(date_start), 'days') + 1);
            prevEnd = moment(date_start).subtract(1, 'days').format('YYYY-MM-DD');
            prevStart = moment(date_start).subtract(durationDays, 'days').format('YYYY-MM-DD');
        }

        const summaryMap: {
            [key: number]: {
                currency: number;
                currencyCode: string;
                symbol: string;
                currentRevenue: number;
                currentCost: number;
                currentProfit: number;
                paidAmount: number;
                debtAmount: number;
                expenseAmount: number;
                expenseCount: number;
                reservationCount: number;
                reservationTotal: number;
                reservationDeposit: number;
                reservationRemaining: number;
                prevRevenue: number;
                prevExpenseAmount: number;
                salesCount: number;
                itemsSold: number;
                target?: number;
            };
        } = {};

        const ensureCurrencyEntry = (cu: number) => {
            if (!summaryMap[cu]) {
                const code = renderCurrency(cu, false);
                let symbol = code;
                if (cu === 1) symbol = "FC";
                else if (cu === 2) symbol = "$";
                else if (cu === 3) symbol = "€";
                else if (cu === 4) symbol = "FCFA";
                else if (cu === 5) symbol = "FBU";
                else if (cu === 6) symbol = "FRW";

                summaryMap[cu] = {
                    currency: cu,
                    currencyCode: code,
                    symbol: symbol,
                    currentRevenue: 0,
                    currentCost: 0,
                    currentProfit: 0,
                    paidAmount: 0,
                    debtAmount: 0,
                    expenseAmount: 0,
                    expenseCount: 0,
                    reservationCount: 0,
                    reservationTotal: 0,
                    reservationDeposit: 0,
                    reservationRemaining: 0,
                    prevRevenue: 0,
                    prevExpenseAmount: 0,
                    salesCount: 0,
                    itemsSold: 0,
                    target: (business as any)?.[`revenue_target_${cu}`] || (sales_point as any)?.[`revenue_target_${cu}`],
                };
            }
        };

        bs.forEach(sale => {
            if (sale.sale_active !== 1) return;
            const cu = sale.currency;

            if (user_filter !== "" && !sale.sale_operator.includes(user_filter)) return;
            if (currency_filter !== "" && sale.currency.toString() !== currency_filter.toString()) return;

            const saleDate = moment(sale.createdAt).format("YYYY-MM-DD");
            const sellingPrice = parseFloat(sale.selling_price) || 0;
            const costPrice = parseFloat(sale.cost_price) || 0;
            const qty = sale.number || 1;
            const itemSellingTotal = sellingPrice * qty;
            const itemCostTotal = costPrice * qty;
            const itemProfit = itemSellingTotal - itemCostTotal;

            const { paidAmount, remainingAmount } = getSalePaymentDetails(sale, realm);

            if (!isDateFiltered) {
                ensureCurrencyEntry(cu);
                summaryMap[cu].currentRevenue += itemSellingTotal;
                summaryMap[cu].currentCost += itemCostTotal;
                summaryMap[cu].currentProfit += itemProfit;
                summaryMap[cu].paidAmount += paidAmount;
                if (remainingAmount > 0) {
                    summaryMap[cu].debtAmount += remainingAmount;
                }
                summaryMap[cu].salesCount += 1;
                summaryMap[cu].itemsSold += qty;
            } else {
                if (saleDate >= currentStart && saleDate <= currentEnd) {
                    ensureCurrencyEntry(cu);
                    summaryMap[cu].currentRevenue += itemSellingTotal;
                    summaryMap[cu].currentCost += itemCostTotal;
                    summaryMap[cu].currentProfit += itemProfit;
                    summaryMap[cu].paidAmount += paidAmount;
                    if (remainingAmount > 0) {
                        summaryMap[cu].debtAmount += remainingAmount;
                    }
                    summaryMap[cu].salesCount += 1;
                    summaryMap[cu].itemsSold += qty;
                } else if (saleDate >= prevStart && saleDate <= prevEnd) {
                    ensureCurrencyEntry(cu);
                    summaryMap[cu].prevRevenue += itemSellingTotal;
                }
            }
        });

        expenses.forEach(exp => {
            if (exp.expense_active !== 1) return;
            if (concerned_business_id !== "" && exp.business_id !== concerned_business_id) return;
            const cu = exp.currency;

            if (currency_filter !== "" && exp.currency.toString() !== currency_filter.toString()) return;

            const expDate = moment(exp.createdAt).format("YYYY-MM-DD");
            const amount = (parseFloat(exp.amount) || 0) * (exp.quantity || 1);

            if (!isDateFiltered) {
                ensureCurrencyEntry(cu);
                summaryMap[cu].expenseAmount += amount;
                summaryMap[cu].expenseCount += 1;
            } else {
                if (expDate >= currentStart && expDate <= currentEnd) {
                    ensureCurrencyEntry(cu);
                    summaryMap[cu].expenseAmount += amount;
                    summaryMap[cu].expenseCount += 1;
                } else if (expDate >= prevStart && expDate <= prevEnd) {
                    ensureCurrencyEntry(cu);
                    summaryMap[cu].prevExpenseAmount += amount;
                }
            }
        });

        reservations.forEach(res => {
            if (res.status !== 1 && res.status !== 2) return;
            if (concerned_business_id !== "" && res.business_id !== concerned_business_id) return;
            const cu = res.currency;

            if (currency_filter !== "" && res.currency.toString() !== currency_filter.toString()) return;

            const resDate = moment(res.createdAt).format("YYYY-MM-DD");
            const total = parseFloat(res.total_amount) || 0;
            const deposit = parseFloat(res.deposit_amount) || 0;
            const remaining = parseFloat(res.remaining_amount) || 0;

            if (!isDateFiltered) {
                ensureCurrencyEntry(cu);
                summaryMap[cu].reservationCount += 1;
                summaryMap[cu].reservationTotal += total;
                summaryMap[cu].reservationDeposit += deposit;
                summaryMap[cu].reservationRemaining += remaining;
            } else {
                if (resDate >= currentStart && resDate <= currentEnd) {
                    ensureCurrencyEntry(cu);
                    summaryMap[cu].reservationCount += 1;
                    summaryMap[cu].reservationTotal += total;
                    summaryMap[cu].reservationDeposit += deposit;
                    summaryMap[cu].reservationRemaining += remaining;
                }
            }
        });

        if (Object.keys(summaryMap).length === 0) {
            const defaultCu = (sales_point as any)?.currency || (business as any)?.currency || 2;
            ensureCurrencyEntry(defaultCu);
        }

        return Object.values(summaryMap);
    }, [bs, expenses, reservations, date_start, date_end, user_filter, currency_filter, business, sales_point, realm, concerned_business_id]);

    const formatCurrencyValue = (currencyID: number, amount: number, symbol: string, decimals: boolean = true) => {
        const hasFraction = amount % 1 !== 0;
        const formattedNum = amount.toLocaleString(undefined, {
            minimumFractionDigits: decimals && hasFraction ? 2 : 0,
            maximumFractionDigits: 2,
        });
        if (currencyID === 2) {
            return `$${formattedNum}`;
        } else if (currencyID === 3) {
            return `€${formattedNum}`;
        } else {
            return `${formattedNum} ${symbol}`;
        }
    };

    return (
        <ScrollView style={{ flex: 1, backgroundColor: app_theme.colors.background }}>
            <View style={{ padding: 15 }}>
                {/* Bottom Sheet Filters Modal */}
                <BottomSheet
                    visible={show_filters_sheet}
                    onClose={() => setShow_filters_sheet(false)}
                >
                    <View style={{ paddingBottom: 20, paddingHorizontal: 20 }}>
                        {/* Clear selection link if active filters exist */}
                        {activeFiltersCount > 0 && (
                            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 10 }}>
                                <Pressable
                                    onPress={() => {
                                        setDate_start("");
                                        setDate_end("");
                                        setUser_filter("");
                                        setCurrency_filter("");
                                        setCategory_filter(0);
                                    }}
                                    style={{ paddingHorizontal: 10, paddingVertical: 4 }}>
                                    <TextSmallYambi text={strings.clear_selection || "Clear"} styles={{ color: app_theme.colors.error }} />
                                </Pressable>
                            </View>
                        )}

                        {/* 1. Date Filter Calendar directly in bottom sheet */}
                        <View style={{
                            backgroundColor: app_theme.colors.border + '30',
                            borderRadius: 16,
                            padding: 10,
                            marginBottom: 16,
                            borderWidth: 1,
                            borderColor: app_theme.colors.border,
                        }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingHorizontal: 4 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <IconApp pack="FI" name="calendar" size={18} color={app_theme.colors.high_color} />
                                    <TextSmallYambiGray text={strings.filter_by_date} styles={{ marginLeft: 8 }} />
                                </View>
                                <TextNormalYambiHighColor text={
                                    date_start !== "" && date_end !== ""
                                        ? `${renderDateTime(date_start, 3, true)} - ${renderDateTime(date_end, 3, true)}`
                                        : strings.all
                                } />
                            </View>

                            <DateRangePicker
                                initialStartDate={date_start !== "" ? date_start : undefined}
                                initialEndDate={date_end !== "" ? date_end : undefined}
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

                        {/* 2. Seller Filter */}
                        {!conditionShowSales() && (
                            <View style={{
                                backgroundColor: app_theme.colors.border + '30',
                                borderRadius: 16,
                                padding: 14,
                                marginBottom: 16,
                                borderWidth: 1,
                                borderColor: app_theme.colors.border,
                            }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                                    <IconApp pack="FI" name="user" size={18} color={app_theme.colors.high_color} />
                                    <TextSmallYambiGray text={strings.filter_by_seller} styles={{ marginLeft: 8 }} />
                                </View>

                                <View style={{ gap: 6 }}>
                                    {/* "All" Option */}
                                    <Pressable
                                        onPress={() => setUser_filter("")}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            paddingVertical: 10,
                                            paddingHorizontal: 12,
                                            borderRadius: 10,
                                            backgroundColor: user_filter === "" ? app_theme.colors.high_color + "20" : 'transparent',
                                            borderWidth: 1,
                                            borderColor: user_filter === "" ? app_theme.colors.high_color : 'transparent',
                                        }}>
                                        <TextNormalYambi text={strings.all} bold={user_filter === ""} styles={{ color: user_filter === "" ? app_theme.colors.high_color : app_theme.colors.text }} />
                                        {user_filter === "" && (
                                            <IconApp pack="IO" name="checkmark-circle" size={18} color={app_theme.colors.high_color} />
                                        )}
                                    </Pressable>

                                    {/* List Sellers */}
                                    {(show_all_sellers ? uniqueSellers : uniqueSellers.slice(0, 3)).map((seller, index) => {
                                        const isSelected = user_filter === seller;
                                        return (
                                            <Pressable
                                                key={index}
                                                onPress={() => setUser_filter(seller)}
                                                style={{
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    paddingVertical: 10,
                                                    paddingHorizontal: 12,
                                                    borderRadius: 10,
                                                    backgroundColor: isSelected ? app_theme.colors.high_color + "20" : 'transparent',
                                                    borderWidth: 1,
                                                    borderColor: isSelected ? app_theme.colors.high_color : 'transparent',
                                                }}>
                                                <TextNormalYambi text={seller} bold={isSelected} styles={{ color: isSelected ? app_theme.colors.high_color : app_theme.colors.text }} />
                                                {isSelected && (
                                                    <IconApp pack="IO" name="checkmark-circle" size={18} color={app_theme.colors.high_color} />
                                                )}
                                            </Pressable>
                                        );
                                    })}

                                    {/* "Show all" toggle button if > 3 sellers */}
                                    {uniqueSellers.length > 3 && (
                                        <Pressable
                                            onPress={() => setShow_all_sellers(!show_all_sellers)}
                                            style={{
                                                paddingVertical: 8,
                                                alignItems: 'center',
                                                marginTop: 2,
                                            }}>
                                            <TextSmallYambi text={show_all_sellers ? (strings as any).see_less : `${(strings as any).view_all} (${uniqueSellers.length})`} styles={{ color: app_theme.colors.high_color }} />
                                        </Pressable>
                                    )}
                                </View>
                            </View>
                        )}

                        {/* 3. Currency Filter */}
                        <View style={{
                            backgroundColor: app_theme.colors.border + '30',
                            borderRadius: 16,
                            padding: 14,
                            marginBottom: 16,
                            borderWidth: 1,
                            borderColor: app_theme.colors.border,
                        }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                                <IconApp pack="FI" name="dollar-sign" size={18} color={app_theme.colors.high_color} />
                                <TextSmallYambiGray text={strings.filter_by_currency} styles={{ marginLeft: 8 }} />
                            </View>

                            <View style={{ gap: 6 }}>
                                {/* "All" Option */}
                                <Pressable
                                    onPress={() => setCurrency_filter("")}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        paddingVertical: 10,
                                        paddingHorizontal: 12,
                                        borderRadius: 10,
                                        backgroundColor: currency_filter === "" ? app_theme.colors.high_color + "20" : 'transparent',
                                        borderWidth: 1,
                                        borderColor: currency_filter === "" ? app_theme.colors.high_color : 'transparent',
                                    }}>
                                    <TextNormalYambi text={strings.all} bold={currency_filter === ""} styles={{ color: currency_filter === "" ? app_theme.colors.high_color : app_theme.colors.text }} />
                                    {currency_filter === "" && (
                                        <IconApp pack="IO" name="checkmark-circle" size={18} color={app_theme.colors.high_color} />
                                    )}
                                </Pressable>

                                {/* List Currencies */}
                                {(show_all_currencies ? availableCurrencies : availableCurrencies.slice(0, 3)).map((cu: number) => {
                                    const isSelected = currency_filter === cu.toString();
                                    const salesInCurrency = filtered_sales.filter(s => s.currency === cu);
                                    return (
                                        <Pressable
                                            key={cu}
                                            onPress={() => setCurrency_filter(cu.toString())}
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                paddingVertical: 10,
                                                paddingHorizontal: 12,
                                                borderRadius: 10,
                                                backgroundColor: isSelected ? app_theme.colors.high_color + "20" : 'transparent',
                                                borderWidth: 1,
                                                borderColor: isSelected ? app_theme.colors.high_color : 'transparent',
                                            }}>
                                            <TextNormalYambi text={renderCurrency(cu, true)} bold={isSelected} styles={{ color: isSelected ? app_theme.colors.high_color : app_theme.colors.text }} />
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <TextSmallYambiGray text={`${salesInCurrency.length} ${strings.sales}`} styles={{ marginRight: 8 }} />
                                                {isSelected && (
                                                    <IconApp pack="IO" name="checkmark-circle" size={18} color={app_theme.colors.high_color} />
                                                )}
                                            </View>
                                        </Pressable>
                                    );
                                })}

                                {/* "Show all" toggle button if > 3 currencies */}
                                {availableCurrencies.length > 3 && (
                                    <Pressable
                                        onPress={() => setShow_all_currencies(!show_all_currencies)}
                                        style={{
                                            paddingVertical: 8,
                                            alignItems: 'center',
                                            marginTop: 2,
                                        }}>
                                        <TextSmallYambi text={show_all_currencies ? (strings as any).see_less : `${(strings as any).view_all} (${availableCurrencies.length})`} styles={{ color: app_theme.colors.high_color }} />
                                    </Pressable>
                                )}
                            </View>
                        </View>

                        {/* 4. Categories Filter Down at bottom */}
                        <View style={{
                            backgroundColor: app_theme.colors.border + '30',
                            padding: 15,
                            borderRadius: 14,
                            borderWidth: 1,
                            borderColor: app_theme.colors.border,
                            marginBottom: 20,
                        }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                <View style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 10,
                                    backgroundColor: app_theme.colors.high_color + '20',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginRight: 12,
                                }}>
                                    <IconApp pack="FI" name="layers" size={18} color={app_theme.colors.high_color} />
                                </View>
                                <TextSmallYambiGray text={strings.filter_by_category} />
                            </View>
                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <Pressable
                                    onPress={() => setCategory_filter(0)}
                                    style={{
                                        flex: 1,
                                        alignItems: 'center',
                                        paddingVertical: 12,
                                        borderRadius: 12,
                                        backgroundColor: category_filter === 0 ? app_theme.colors.high_color + '20' : app_theme.colors.background,
                                        borderWidth: 1,
                                        borderColor: category_filter === 0 ? app_theme.colors.high_color : app_theme.colors.border,
                                    }}>
                                    <TextNormalYambi text={strings.completed_sales} bold={category_filter === 0} styles={{ color: category_filter === 0 ? app_theme.colors.high_color : app_theme.colors.text }} />
                                </Pressable>
                                <Pressable
                                    onPress={() => setCategory_filter(1)}
                                    style={{
                                        flex: 1,
                                        alignItems: 'center',
                                        paddingVertical: 12,
                                        borderRadius: 12,
                                        backgroundColor: category_filter === 1 ? app_theme.colors.high_color + '20' : app_theme.colors.background,
                                        borderWidth: 1,
                                        borderColor: category_filter === 1 ? app_theme.colors.high_color : app_theme.colors.border,
                                    }}>
                                    <TextNormalYambi text={strings.on_credit} bold={category_filter === 1} styles={{ color: category_filter === 1 ? app_theme.colors.high_color : app_theme.colors.text }} />
                                </Pressable>
                            </View>
                        </View>

                        {/* Validate filter button */}
                        <ButtonNormal
                            normal
                            title={(strings as any).validate_filter}
                            onPress={() => setShow_filters_sheet(false)}
                        />
                    </View>
                </BottomSheet>

                {/* ── Revenue & Financial Performance Cards (Full, Uncollapsed, Full Option Names) ── */}
                <TextNormalYambi text={(strings as any).revenue_breakdown} bold styles={{ fontSize: 20, marginBottom: 15, color: app_theme.colors.text }} />

                {getCurrencyRevenueSummary.map((item) => {
                    const isDateFiltered = date_start !== "" && date_end !== "";
                    const hasTarget = item.target && item.target > 0;
                    let percentStr = "";
                    let isNegative = false;
                    let progressRatio = 0;
                    const diffAmount = item.currentRevenue - item.prevRevenue;
                    const marginPct = item.currentRevenue > 0 ? (item.currentProfit / item.currentRevenue) * 100 : 0;
                    const aov = item.salesCount > 0 ? item.currentRevenue / item.salesCount : 0;
                    const netCash = (item.paidAmount + item.reservationDeposit) - item.expenseAmount;

                    if (hasTarget) {
                        const rawPct = Math.min(Math.round((item.currentRevenue / item.target!) * 100), 100);
                        percentStr = `${rawPct}%`;
                        progressRatio = rawPct / 100;
                    } else if (isDateFiltered) {
                        if (item.prevRevenue > 0) {
                            const pct = Math.round((diffAmount / item.prevRevenue) * 100);
                            percentStr = pct >= 0 ? `+${pct}%` : `${pct}%`;
                            isNegative = pct < 0;
                            progressRatio = Math.min(item.currentRevenue / Math.max(item.prevRevenue, item.currentRevenue, 1), 1);
                        } else if (item.currentRevenue > 0) {
                            percentStr = "+100%";
                            progressRatio = 1;
                        } else {
                            percentStr = "0%";
                            progressRatio = 0;
                        }
                    } else {
                        percentStr = strings.all;
                        progressRatio = item.currentRevenue > 0 ? 1 : 0;
                    }

                    const badgeBg = isNegative
                        ? app_theme.colors.error + "20"
                        : app_theme.colors.high_color + "25";
                    const badgeTextColor = isNegative
                        ? app_theme.colors.error
                        : app_theme.colors.high_color;

                    return (
                        <View
                            key={item.currency}
                            style={{
                                backgroundColor: app_theme.colors.high_color + "12",
                                borderRadius: 20,
                                padding: 18,
                                marginBottom: 20,
                                borderWidth: 1,
                                borderColor: app_theme.colors.high_color + "30",
                            }}>
                            {/* Banner Header for Currency */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1 }}>
                                    <View style={{
                                        height: 36,
                                        width: 36,
                                        borderRadius: 10,
                                        backgroundColor: app_theme.colors.high_color + "25",
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginRight: 10,
                                    }}>
                                        <IconApp pack="FI" name="dollar-sign" size={20} color={app_theme.colors.high_color} />
                                    </View>
                                    <View>
                                        <YambiText text={`${item.currencyCode} (${item.symbol})`} bold style={{ fontSize: 18, color: app_theme.colors.text }} />
                                        <YambiText text={(strings as any).currency_total_revenue} size="small" color="gray" />
                                    </View>
                                </View>

                                <View style={{ alignItems: 'flex-end' }}>
                                    <YambiText
                                        text={formatCurrencyValue(item.currency, item.currentRevenue, item.symbol)}
                                        bold
                                        style={{ fontSize: 22, color: app_theme.colors.high_color }}
                                    />
                                    <View style={{
                                        backgroundColor: badgeBg,
                                        paddingHorizontal: 10,
                                        paddingVertical: 3,
                                        borderRadius: 12,
                                        marginTop: 4,
                                    }}>
                                        <YambiText
                                            text={percentStr}
                                            bold
                                            size="small"
                                            style={{ color: badgeTextColor, fontSize: 12 }}
                                        />
                                    </View>
                                </View>
                            </View>

                            {/* Progress Bar */}
                            <View style={{
                                height: 8,
                                width: '100%',
                                backgroundColor: app_theme.colors.high_color + "20",
                                borderRadius: 4,
                                overflow: 'hidden',
                                marginBottom: 16,
                            }}>
                                <View style={{
                                    height: '100%',
                                    width: `${Math.max(progressRatio * 100, 3)}%`,
                                    backgroundColor: isNegative ? app_theme.colors.error : app_theme.colors.high_color,
                                    borderRadius: 4,
                                }} />
                            </View>

                            {/* Spacious Option Cards Stack (Taking full width, explicit names) */}
                            <View style={{ gap: 12 }}>
                                {/* Option 1: Gross Profit & Profit Margin */}
                                <View style={{
                                    backgroundColor: app_theme.colors.background,
                                    borderRadius: 14,
                                    padding: 14,
                                    borderWidth: 1,
                                    borderColor: app_theme.colors.border,
                                }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <IconApp pack="FI" name="trending-up" size={18} color={item.currentProfit >= 0 ? app_theme.colors.high_color : app_theme.colors.error} />
                                            <TextNormalYambi text={strings.total_profit} bold styles={{ marginLeft: 8 }} />
                                        </View>
                                        <YambiText
                                            bold
                                            text={formatCurrencyValue(item.currency, item.currentProfit, item.symbol)}
                                            style={{ fontSize: 16, color: item.currentProfit >= 0 ? app_theme.colors.high_color : app_theme.colors.error }}
                                        />
                                    </View>
                                    <TextSmallYambiGray text={`${(strings as any).profit_margin}: ${marginPct.toFixed(1)}%`} />
                                </View>

                                {/* Option 2: Cost of Goods Sold */}
                                <View style={{
                                    backgroundColor: app_theme.colors.background,
                                    borderRadius: 14,
                                    padding: 14,
                                    borderWidth: 1,
                                    borderColor: app_theme.colors.border,
                                }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <IconApp pack="FI" name="tag" size={18} color={app_theme.colors.gray} />
                                            <TextNormalYambi text={strings.total_cost_price} bold styles={{ marginLeft: 8 }} />
                                        </View>
                                        <YambiText bold text={formatCurrencyValue(item.currency, item.currentCost, item.symbol)} style={{ fontSize: 16, color: app_theme.colors.text }} />
                                    </View>
                                </View>

                                {/* Option 3: Average Order Value */}
                                <View style={{
                                    backgroundColor: app_theme.colors.background,
                                    borderRadius: 14,
                                    padding: 14,
                                    borderWidth: 1,
                                    borderColor: app_theme.colors.border,
                                }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <IconApp pack="FI" name="credit-card" size={18} color={app_theme.colors.gray} />
                                            <TextNormalYambi text={(strings as any).average_order_value} bold styles={{ marginLeft: 8 }} />
                                        </View>
                                        <YambiText bold text={formatCurrencyValue(item.currency, aov, item.symbol)} style={{ fontSize: 16, color: app_theme.colors.text }} />
                                    </View>
                                </View>

                                {/* Option 4: Completed Transactions & Units Sold */}
                                <View style={{
                                    backgroundColor: app_theme.colors.background,
                                    borderRadius: 14,
                                    padding: 14,
                                    borderWidth: 1,
                                    borderColor: app_theme.colors.border,
                                }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <IconApp pack="FI" name="shopping-bag" size={18} color="#6366F1" />
                                            <TextNormalYambi text={strings.completed_sales} bold styles={{ marginLeft: 8 }} />
                                        </View>
                                        <YambiText bold text={item.salesCount.toString()} style={{ fontSize: 16, color: '#6366F1' }} />
                                    </View>
                                    <TextSmallYambiGray text={`${strings.items}: ${item.itemsSold} ${strings.sold}`} />
                                </View>

                                {/* Option 5: Cash Received & Customer Debts */}
                                <View style={{
                                    backgroundColor: app_theme.colors.background,
                                    borderRadius: 14,
                                    padding: 14,
                                    borderWidth: 1,
                                    borderColor: app_theme.colors.border,
                                }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: item.debtAmount > 0 ? 6 : 0 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <IconApp pack="FI" name="check-circle" size={18} color={app_theme.colors.high_color} />
                                            <TextNormalYambi text={(strings as any).cash_received} bold styles={{ marginLeft: 8 }} />
                                        </View>
                                        <YambiText bold text={formatCurrencyValue(item.currency, item.paidAmount, item.symbol)} style={{ fontSize: 16, color: app_theme.colors.high_color }} />
                                    </View>
                                    {item.debtAmount > 0 && (
                                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6, borderTopWidth: 1, borderTopColor: app_theme.colors.border }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <IconApp pack="FI" name="alert-circle" size={16} color={app_theme.colors.error} />
                                                <TextNormalYambi text={(strings as any).outstanding_debts} styles={{ marginLeft: 8 }} />
                                            </View>
                                            <YambiText bold text={formatCurrencyValue(item.currency, item.debtAmount, item.symbol)} style={{ fontSize: 14, color: app_theme.colors.error }} />
                                        </View>
                                    )}
                                </View>

                                {/* Option 6: Total Business Expenses */}
                                <View style={{
                                    backgroundColor: app_theme.colors.background,
                                    borderRadius: 14,
                                    padding: 14,
                                    borderWidth: 1,
                                    borderColor: app_theme.colors.border,
                                }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <IconApp pack="FI" name="arrow-down-right" size={18} color={app_theme.colors.error} />
                                            <TextNormalYambi text={strings.expenses} bold styles={{ marginLeft: 8 }} />
                                        </View>
                                        <YambiText bold text={`-${formatCurrencyValue(item.currency, item.expenseAmount, item.symbol)}`} style={{ fontSize: 16, color: app_theme.colors.error }} />
                                    </View>
                                    <TextSmallYambiGray text={`${(strings as any).expense_entries}: ${item.expenseCount}`} />
                                </View>

                                {/* Option 7: Net Cash Flow */}
                                <View style={{
                                    backgroundColor: netCash >= 0 ? app_theme.colors.high_color + '16' : app_theme.colors.error + '16',
                                    borderRadius: 14,
                                    padding: 14,
                                    borderWidth: 1,
                                    borderColor: netCash >= 0 ? app_theme.colors.high_color + '40' : app_theme.colors.error + '40',
                                }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <IconApp pack="IO" name="wallet-outline" size={18} color={netCash >= 0 ? app_theme.colors.high_color : app_theme.colors.error} />
                                            <TextNormalYambi text={(strings as any).net_cash} bold styles={{ marginLeft: 8, color: netCash >= 0 ? app_theme.colors.high_color : app_theme.colors.error }} />
                                        </View>
                                        <YambiText bold text={formatCurrencyValue(item.currency, netCash, item.symbol)} style={{ fontSize: 18, color: netCash >= 0 ? app_theme.colors.high_color : app_theme.colors.error }} />
                                    </View>
                                    <TextSmallYambiGray text={(strings as any).net_cash_formula} />
                                </View>

                                {/* Option 8: Customer Reservations & Advance Deposits */}
                                {item.reservationCount > 0 && (
                                    <View style={{
                                        backgroundColor: app_theme.colors.background,
                                        borderRadius: 14,
                                        padding: 14,
                                        borderWidth: 1,
                                        borderColor: app_theme.colors.border,
                                    }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <IconApp pack="FI" name="calendar" size={18} color="#8B5CF6" />
                                                <TextNormalYambi text={(strings as any).customer_reservations} bold styles={{ marginLeft: 8 }} />
                                            </View>
                                            <YambiText bold text={`${item.reservationCount}`} style={{ fontSize: 16, color: "#8B5CF6" }} />
                                        </View>
                                        <View style={{ gap: 4, marginTop: 4 }}>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                                <TextSmallYambiGray text={(strings as any).total_reserved_amount} />
                                                <TextSmallYambi bold text={formatCurrencyValue(item.currency, item.reservationTotal, item.symbol)} />
                                            </View>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                                <TextSmallYambiGray text={(strings as any).deposit_collected} />
                                                <TextSmallYambi bold text={formatCurrencyValue(item.currency, item.reservationDeposit, item.symbol)} styles={{ color: app_theme.colors.high_color }} />
                                            </View>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                                <TextSmallYambiGray text={(strings as any).balance_remaining} />
                                                <TextSmallYambi bold text={formatCurrencyValue(item.currency, item.reservationRemaining, item.symbol)} styles={{ color: '#F59E0B' }} />
                                            </View>
                                        </View>
                                    </View>
                                )}

                                {/* Option 9: Period Comparison & Revenue Difference */}
                                {isDateFiltered && (
                                    <View style={{
                                        backgroundColor: app_theme.colors.background,
                                        borderRadius: 14,
                                        padding: 14,
                                        borderWidth: 1,
                                        borderColor: app_theme.colors.border,
                                    }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <TextSmallYambiGray text={`${strings.prev_period} ${strings.sales}`} />
                                            <TextNormalYambi text={formatCurrencyValue(item.currency, item.prevRevenue, item.symbol)} bold />
                                        </View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6, borderTopWidth: 1, borderTopColor: app_theme.colors.border }}>
                                            <TextSmallYambiGray text={(strings as any).revenue_variance} />
                                            <YambiText
                                                bold
                                                text={`${diffAmount >= 0 ? '+' : ''}${formatCurrencyValue(item.currency, diffAmount, item.symbol)}`}
                                                style={{ fontSize: 15, color: diffAmount >= 0 ? app_theme.colors.high_color : app_theme.colors.error }}
                                            />
                                        </View>
                                    </View>
                                )}
                            </View>
                        </View>
                    );
                })}

                {/* ── Graphs Component ── */}
                <View style={{ marginTop: 15, marginBottom: 30 }}>
                    <SalesCharts
                        sales={Array.from(filtered_sales as any)}
                        startDate={date_start !== "" ? date_start : undefined}
                        endDate={date_end !== "" ? date_end : undefined}
                        businessId={concerned_business_id !== "" ? concerned_business_id : undefined}
                    />
                </View>
            </View>
        </ScrollView>
    );
};

export default BusinessOverviewGraphs;
