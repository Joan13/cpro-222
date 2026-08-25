import { Pressable, ScrollView, View, Animated, Modal, TouchableWithoutFeedback } from 'react-native';
import { useEffect, useState, useRef, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/app/hooks';
import { setShowModalApp } from '../../store/reducers/appSlice';
import { strings } from '../../lang/lang';
import { IconApp } from '../../components/app/IconApp';
import { NavProps } from '../../types/types';
import { useObject, useQuery, useRealm } from '@realm/react';
import { BusinessItemsSale, BusinessUsers, UserBusinessArticles, UserBusinesses, UserSellsPoints, Payments, Expenses, Reservations } from '../../store/database/Models';
import { getSalePaymentDetails } from '../../utils/paymentHelpers';
import { TextNormalYambi, TextNormalYambiError, TextNormalYambiHighColor, TextNormalYambiSuccess, TextSmallYambi, TextSmallYambiError, TextSmallYambiGray, TextBigYambi, TextNormalYambiGray, YambiText } from '../../components/app/Text';
import { global_currencies, renderCurrency, renderDateTime } from '../../../GlobalVariables';
import ModalApp from '../../components/app/ModalApp';
import BottomSheet from '../../components/app/BottomSheet';
import ButtonNormal from '../../components/app/ButtonNormal';
import DateRangePicker from "../../components/app/DateRangePicker";
import moment from "moment";
import { setRemoveBusinessBadge, setRemoveSalesPointBadge } from '../../store/reducers/persistedAppSlice';
import { LegendList } from '@legendapp/list';
import SalesList from '../../components/lists/business/SalesList';
import { TItem, TItemPrices, TSale } from '../../types/types';
import RNPrint from 'react-native-print';

const SalesModern = ({ navigation, route }: NavProps) => {
    const { business_id, sales_point_id, item_id } = route.params;

    const business = useObject(UserBusinesses, business_id);
    const sales_point = useObject(UserSellsPoints, sales_point_id);
    const item = useObject(UserBusinessArticles, item_id);

    const app_theme = useAppSelector(state => state.app_theme);
    const app_language = useAppSelector(state => state.persisted_app.langApp);
    const user_data = useAppSelector(state => state.user_data);
    const isAdmin = user_data?.user_level === 2;
    const dispatch = useAppDispatch();
    const realm = useRealm();

    const [date_start, setDate_start] = useState<string>("");
    const [date_end, setDate_end] = useState<string>("");
    const [user_filter, setUser_filter] = useState<string>("");
    const [date_selection_modal, setDate_selection_modal] = useState<boolean>(false);
    const [show_users_filter, setShow_users_filter] = useState<boolean>(false);
    const [show_currency_filter, setShow_currency_filter] = useState<boolean>(false);
    const [show_print_options, setShow_print_options] = useState<boolean>(false);
    const [currency_filter, setCurrency_filter] = useState<string>("");
    const [sale_active_filter] = useState<number>(1);
    const [category_filter, setCategory_filter] = useState<number>(0);
    const [show_filters, setShow_filters] = useState<boolean>(false);
    const [show_filters_sheet, setShow_filters_sheet] = useState<boolean>(false);
    const [show_all_sellers, setShow_all_sellers] = useState<boolean>(false);
    const [show_all_currencies, setShow_all_currencies] = useState<boolean>(false);
    const [showUserError, setShowUserError] = useState<boolean>(false);
    const filtersHeight = useRef(new Animated.Value(0)).current;

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
    }

    const bs = useQuery(
        BusinessItemsSale, bss => {
            return bss.filtered('business_id == $0 || sales_point_id == $1 || item_id == $2', business_id, sales_point_id, item_id)
                .sorted('createdAt', true)
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


    // Get unique sellers
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

    // Filter sales based on all criteria (sorted newest to oldest)
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
        // category_filter: 0 = all (cash + credit), 1 = credit only
        const { isPaid } = getSalePaymentDetails(sale, realm);
        const isCredit = !isPaid;
        const categoryMatch = category_filter === 0 ? true : isCredit;
        statusMatch = sale.sale_active === sale_active_filter && categoryMatch;

        return dateMatch && userMatch && currencyMatch && statusMatch;
    }).sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime() || 0;
        const timeB = new Date(b.createdAt).getTime() || 0;
        return timeB - timeA;
    });

    // Animate filters expand/collapse
    useEffect(() => {
        Animated.timing(filtersHeight, {
            toValue: show_filters ? 1 : 0,
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, [show_filters]);

    useEffect(() => {
        if (conditionShowSales() && oo) {
            setUser_filter(oo.user);
        }

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
    }, [business, sales_point, item, oo]);

    // Calculate statistics
    const getStats = () => {
        let total_sales_count = 0;
        let total_items_sold = 0;
        const currency_stats: { [key: number]: { cost: number, selling: number, items: number, sales: number } } = {};

        filtered_sales.forEach(sale => {
            if (sale.sale_active === 1) {
                total_sales_count++;
                total_items_sold += sale.number;

                if (!currency_stats[sale.currency]) {
                    currency_stats[sale.currency] = { cost: 0, selling: 0, items: 0, sales: 0 };
                }

                currency_stats[sale.currency].cost += (parseFloat(sale.cost_price) || 0) * sale.number;
                currency_stats[sale.currency].selling += (parseFloat(sale.selling_price) || 0) * sale.number;
                currency_stats[sale.currency].items += sale.number;
                currency_stats[sale.currency].sales++;
            }
        });

        return { total_sales_count, total_items_sold, currency_stats };
    };

    // Calculate extended per-currency stats (debts, reservations, expenses, net cash)
    // Respects all active filters (date, user, currency, category)
    const getExtendedStats = () => {
        const per_currency: {
            [key: number]: {
                // Sales
                totalSelling: number;
                totalCost: number;
                paidAmount: number;
                // Debts (on-credit sales with remaining balance)
                debtAmount: number;
                debtCount: number;
                // Reservations
                reservationCount: number;
                reservationTotal: number;
                reservationDeposit: number;
                reservationRemaining: number;
                // Expenses
                expenseAmount: number;
                expenseCount: number;
                // Net
                netCash: number;
            }
        } = {};

        const ensureCurrency = (cu: number) => {
            if (!per_currency[cu]) {
                per_currency[cu] = {
                    totalSelling: 0, totalCost: 0, paidAmount: 0,
                    debtAmount: 0, debtCount: 0,
                    reservationCount: 0, reservationTotal: 0, reservationDeposit: 0, reservationRemaining: 0,
                    expenseAmount: 0, expenseCount: 0,
                    netCash: 0,
                };
            }
        };

        // Sales — use filtered_sales so date, user, currency & category filters all apply
        filtered_sales.forEach(sale => {
            const cu = sale.currency;
            ensureCurrency(cu);
            const { paidAmount, remainingAmount } = getSalePaymentDetails(sale, realm);
            per_currency[cu].totalSelling += (parseFloat(sale.selling_price) || 0) * sale.number;
            per_currency[cu].totalCost += (parseFloat(sale.cost_price) || 0) * sale.number;
            per_currency[cu].paidAmount += paidAmount;
            if (remainingAmount > 0) {
                per_currency[cu].debtAmount += remainingAmount;
                per_currency[cu].debtCount++;
            }
        });

        // Reservations — apply date range and currency filters when active
        reservations
            .filter(r => {
                if (r.status !== 1 && r.status !== 2) return false;
                if (currency_filter !== "" && r.currency !== parseInt(currency_filter)) return false;
                if (date_start !== "" && date_end !== "") {
                    const d = moment(r.createdAt).format("YYYY-MM-DD");
                    if (d < date_start || d > date_end) return false;
                }
                return true;
            })
            .forEach(res => {
                const cu = res.currency;
                ensureCurrency(cu);
                per_currency[cu].reservationCount++;
                per_currency[cu].reservationTotal += parseFloat(res.total_amount) || 0;
                per_currency[cu].reservationDeposit += parseFloat(res.deposit_amount) || 0;
                per_currency[cu].reservationRemaining += parseFloat(res.remaining_amount) || 0;
            });

        // Expenses — filter by business_id == concerned_business_id
        expenses
            .filter(exp => {
                if (concerned_business_id !== "" && exp.business_id !== concerned_business_id) return false;
                if (currency_filter !== "" && exp.currency !== parseInt(currency_filter)) return false;
                if (date_start !== "" && date_end !== "") {
                    const d = moment(exp.createdAt).format("YYYY-MM-DD");
                    if (d < date_start || d > date_end) return false;
                }
                return true;
            })
            .forEach(exp => {
                const cu = exp.currency;
                ensureCurrency(cu);
                per_currency[cu].expenseAmount += (parseFloat(exp.amount) || 0) * (exp.quantity || 1);
                per_currency[cu].expenseCount++;
            });

        // Net cash per currency
        Object.keys(per_currency).forEach(k => {
            const cu = parseInt(k);
            per_currency[cu].netCash =
                (per_currency[cu].paidAmount + per_currency[cu].reservationDeposit)
                - per_currency[cu].expenseAmount;
        });

        return per_currency;
    };



    const stats = getStats();
    const extendedStats = getExtendedStats();

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
                // Takes ALL sales
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
                // Takes ALL expenses
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


    const activeFiltersCount = [
        date_start !== "" && date_end !== "",
        user_filter !== "" && !conditionShowSales(),
        currency_filter !== "",
        category_filter === 1,
    ].filter(Boolean).length;

    useEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <ButtonNormal
                    onPress={() => setShow_filters_sheet(true)}
                    title={activeFiltersCount > 0 ? "(" + activeFiltersCount.toString() + ") " + strings.filter : strings.filter}
                    styles={{ paddingHorizontal: 15 }}
                />
            ),
        });
    }, [navigation, activeFiltersCount, app_theme]);

    const conditionShowGlobal = (salesInCurrency: any[]) => {
        if (oo !== null && oo !== undefined) {
            if ((oo.user_active === 1 && oo.level === 1) || (oo.user_active === 1 && oo.level === 2 && oo.sales_point_id === sales_point_id)) {
                if (salesInCurrency.length > 0 && sale_active_filter !== 0) {
                    return true;
                }
            }
            return false;
        }

        if (salesInCurrency.length > 0 && sale_active_filter !== 0) {
            return true;
        }

        return false;
    };

    const longPress = (sale: TSale, article: TItem, prices: TItemPrices) => {
        navigation.navigate('Sale', { sale: sale, item: article, prices: prices });
    };

    const printSalesReport = async (
        mode: "overview_sales" | "overview_only"
    ) => {
        const includeOverview = mode === "overview_sales" || mode === "overview_only";
        const includeSales = mode === "overview_sales";

        const title = business?.business_name || sales_point?.sells_point_name || strings.sales;

        const currencyOverviewRows = Object.entries(stats.currency_stats)
            .map(([currency, data]) => `
                <tr>
                    <td>${renderCurrency(parseInt(currency), true)}</td>
                    <td style="text-align:right;">${data.sales}</td>
                    <td style="text-align:right;">${data.items}</td>
                    <td style="text-align:right;">${data.selling.toFixed(2)}</td>
                    <td style="text-align:right;">${(data.selling - data.cost).toFixed(2)}</td>
                </tr>
            `)
            .join("");

        const salesRows = filtered_sales.map(sale => `
            <tr>
                <td>${moment(sale.createdAt).format("YYYY-MM-DD HH:mm")}</td>
                <td>${sale.sale_operator}</td>
                <td style="text-align:right;">${sale.number}</td>
                <td style="text-align:right;">${parseFloat(sale.selling_price || "0").toFixed(2)}</td>
                <td>${renderCurrency(sale.currency, true)}</td>
            </tr>
        `).join("");

        const html = `
            <html>
            <head>
                <meta charset="utf-8" />
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; color: #111; }
                    h1 { margin: 0 0 6px 0; font-size: 22px; }
                    .muted { color: #666; font-size: 12px; margin-bottom: 18px; }
                    .section { margin-top: 20px; }
                    .section h2 { margin: 0 0 10px 0; font-size: 16px; border-bottom: 1px solid #ddd; padding-bottom: 6px; }
                    .grid { display: flex; gap: 10px; flex-wrap: wrap; }
                    .card { border: 1px solid #ddd; border-radius: 6px; padding: 10px; min-width: 180px; }
                    .label { font-size: 12px; color: #666; }
                    .value { font-size: 18px; font-weight: bold; margin-top: 4px; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { border-bottom: 1px solid #eee; padding: 8px; font-size: 12px; text-align: left; }
                    th { background: #f7f7f7; }
                </style>
            </head>
            <body>
                <h1>${title}</h1>
                <div class="muted">${strings.sales} • ${moment().format("YYYY-MM-DD HH:mm")}</div>

                ${includeOverview ? `
                <div class="section">
                    <h2>${strings.overview}</h2>
                    <div class="grid">
                        <div class="card">
                            <div class="label">${strings.total_sales}</div>
                            <div class="value">${stats.total_sales_count}</div>
                        </div>
                        <div class="card">
                            <div class="label">${strings.items}</div>
                            <div class="value">${stats.total_items_sold}</div>
                        </div>
                    </div>
                    <div style="margin-top:12px;">
                        <table>
                            <thead>
                                <tr>
                                    <th>${strings.currency_small}</th>
                                    <th style="text-align:right;">${strings.sales}</th>
                                    <th style="text-align:right;">${strings.items}</th>
                                    <th style="text-align:right;">${strings.total_selling_price}</th>
                                    <th style="text-align:right;">${strings.total_profit}</th>
                                </tr>
                            </thead>
                            <tbody>${currencyOverviewRows || `<tr><td colspan="5">${strings.no_sales}</td></tr>`}</tbody>
                        </table>
                    </div>
                </div>` : ""}

                ${includeSales ? `
                <div class="section">
                    <h2>${strings.detailed_sales}</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>${strings.Date}</th>
                                <th>${strings.seller}</th>
                                <th style="text-align:right;">${strings.quantity_small}</th>
                                <th style="text-align:right;">${strings.price}</th>
                                <th>${strings.currency_small}</th>
                            </tr>
                        </thead>
                        <tbody>${salesRows || `<tr><td colspan="5">${strings.no_sales}</td></tr>`}</tbody>
                    </table>
                </div>` : ""}
            </body>
            </html>
        `;

        await RNPrint.print({ html });
    };

    return (
        <View style={{ flex: 1, backgroundColor: app_theme.colors.background, borderColor: app_theme.colors.border, borderTopWidth: 1 }}>
            {/* Modals */}
            {show_users_filter && !conditionShowSales() && (
                <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShow_users_filter(false); }} paddings={false} singleButton title={strings.filter_by_seller}>
                    <ScrollView style={{ maxHeight: 400 }}>
                        <Pressable
                            onPress={() => {
                                setUser_filter("");
                                dispatch(setShowModalApp(false));
                                setShow_users_filter(false);
                            }}
                            style={{
                                paddingVertical: 15,
                                paddingHorizontal: 15,
                                borderBottomWidth: 1,
                                borderColor: app_theme.colors.border,
                            }}>
                            <TextNormalYambiHighColor text={strings.all} />
                        </Pressable>
                        {uniqueSellers.map((seller, index) => (
                            <Pressable
                                key={index}
                                onPress={() => {
                                    setUser_filter(seller);
                                    dispatch(setShowModalApp(false));
                                    setShow_users_filter(false);
                                }}
                                style={{
                                    paddingVertical: 15,
                                    paddingHorizontal: 15,
                                    borderBottomWidth: 1,
                                    borderColor: app_theme.colors.border,
                                }}>
                                <TextNormalYambi text={seller} />
                            </Pressable>
                        ))}
                    </ScrollView>
                </ModalApp>
            )}

            {show_currency_filter && (
                <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShow_currency_filter(false); }} paddings={false} singleButton title={strings.filter_by_currency}>
                    <ScrollView style={{ maxHeight: 400. }}>
                        <Pressable
                            onPress={() => {
                                setCurrency_filter("");
                                dispatch(setShowModalApp(false));
                                setShow_currency_filter(false);
                            }}
                            style={{
                                paddingVertical: 15,
                                paddingHorizontal: 15,
                                borderBottomWidth: 1,
                                borderColor: app_theme.colors.border,
                            }}>
                            <TextNormalYambiHighColor text={strings.all} />
                        </Pressable>
                        {global_currencies.map((cu: number) => {
                            const salesInCurrency = filtered_sales.filter(s => s.currency === cu);
                            if (salesInCurrency.length > 0) {
                                return (
                                    <Pressable
                                        key={cu}
                                        onPress={() => {
                                            setCurrency_filter(cu.toString());
                                            dispatch(setShowModalApp(false));
                                            setShow_currency_filter(false);
                                        }}
                                        style={{
                                            paddingVertical: 15,
                                            paddingHorizontal: 15,
                                            borderBottomWidth: 1,
                                            borderColor: app_theme.colors.border,
                                            flexDirection: 'row',
                                            justifyContent: 'space-between',
                                        }}>
                                        <TextNormalYambi text={renderCurrency(cu, true)} />
                                        <TextNormalYambiHighColor text={salesInCurrency.length.toString()} />
                                    </Pressable>
                                );
                            }
                            return null;
                        })}
                    </ScrollView>
                </ModalApp>
            )}

            {date_selection_modal && (
                <ModalApp
                    onCancel={() => { dispatch(setShowModalApp(false)); setDate_selection_modal(false); setDate_end(""); setDate_start(""); }}
                    onClose={() => { dispatch(setShowModalApp(false)); setDate_selection_modal(false); }}
                    paddings={false}
                    singleButton={false}
                    textAction={strings.confirm}
                    onAction={() => { dispatch(setShowModalApp(false)); setDate_selection_modal(false); }}
                    title={strings.choose_date_range}>
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
                </ModalApp>
            )}

            {showUserError && (
                <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowUserError(false) }} singleButton title={strings.error}>
                    <YambiText color="gray" text={strings.business_level_error || "Access Denied: You do not have permission to view these expenses."} />
                </ModalApp>
            )}

            {show_print_options && (
                <ModalApp
                    onClose={() => { dispatch(setShowModalApp(false)); setShow_print_options(false); }}
                    singleButton
                    paddings={false}
                    title={strings.print}
                >
                    <View style={{ paddingVertical: 5 }}>
                        {[
                            { key: "overview_sales", label: strings.print_option_overview_sales },
                            { key: "overview_only", label: strings.print_option_overview_only },
                        ].map(option => (
                            <Pressable
                                key={option.key}
                                onPress={async () => {
                                    dispatch(setShowModalApp(false));
                                    setShow_print_options(false);
                                    await printSalesReport(option.key as any);
                                }}
                                style={{
                                    paddingVertical: 14,
                                    paddingHorizontal: 15,
                                    borderBottomWidth: 1,
                                    borderColor: app_theme.colors.border,
                                }}
                            >
                                <TextNormalYambi text={option.label} />
                            </Pressable>
                        ))}
                    </View>
                </ModalApp>
            )}

            {/* Bottom Sheet Filters Modal */}
            <BottomSheet
                visible={show_filters_sheet}
                onClose={() => setShow_filters_sheet(false)}
            // title={strings.filter}
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
                        backgroundColor: app_theme.colors.border + '50',
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

            <LegendList
                style={{ flex: 1 }}
                data={filtered_sales as never}
                keyExtractor={(item: TSale) => item._id}
                contentContainerStyle={{ paddingBottom: 30 }}
                estimatedItemSize={140}
                ListHeaderComponent={() => (
                    <View style={{ padding: 15 }}>
                        {/* ── Revenue Summary Block Grouped by Currency ── */}
                        <View style={{
                            backgroundColor: app_theme.colors.high_color + "14",
                            borderRadius: 18,
                            padding: 15,
                            marginBottom: 16,
                            borderWidth: 1,
                            borderColor: app_theme.colors.high_color + "25",
                        }}>
                            {/* Block Header */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1 }}>
                                    <View style={{
                                        height: 28,
                                        width: 28,
                                        borderRadius: 8,
                                        backgroundColor: app_theme.colors.high_color + "25",
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginRight: 8,
                                    }}>
                                        <IconApp pack="FI" name="pie-chart" size={15} color={app_theme.colors.high_color} />
                                    </View>
                                    <YambiText text={(strings as any).revenue || "Revenue"} bold style={{ fontSize: 16, color: app_theme.colors.text }} />
                                </View>

                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>
                                    <View style={{ flexShrink: 1 }}>
                                        {date_start !== "" && date_end !== "" ? (
                                            <YambiText size="small" color="gray" text={`${date_start} → ${date_end}`} style={{ fontSize: 11 }} />
                                        ) : (
                                            <YambiText size="small" color="gray" text={(strings as any).all_time || strings.all} style={{ fontSize: 11 }} />
                                        )}
                                    </View>

                                    <Pressable
                                        onPress={() => navigation.navigate("BusinessOverviewGraphs", {
                                            business_id,
                                            sales_point_id,
                                            item_id,
                                            date_start,
                                            date_end,
                                            user_filter,
                                            currency_filter,
                                            category_filter,
                                        })}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            backgroundColor: app_theme.colors.high_color + "25",
                                            paddingHorizontal: 9,
                                            paddingVertical: 5,
                                            borderRadius: 10,
                                        }}>
                                        <IconApp pack="FI" name="bar-chart-2" size={14} color={app_theme.colors.high_color} />
                                        <YambiText text={(strings as any).more || "Plus"} bold style={{ marginLeft: 5, fontSize: 12, color: app_theme.colors.high_color }} />
                                        <IconApp pack="FI" name="chevron-right" size={14} color={app_theme.colors.high_color} />
                                    </Pressable>
                                </View>
                            </View>

                            {/* Currency Cards */}
                            {getCurrencyRevenueSummary.map((item, idx) => {
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
                                    percentStr = (strings as any).all || "All";
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
                                            marginTop: idx > 0 ? 14 : 0,
                                            paddingTop: idx > 0 ? 14 : 0,
                                            borderTopWidth: idx > 0 ? 1 : 0,
                                            borderTopColor: app_theme.colors.high_color + "20",
                                        }}>
                                        {/* Currency Header: Code + Main Amount + Badge */}
                                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, flexShrink: 1, marginRight: 8 }}>
                                                <YambiText text={`${item.currencyCode}: `} bold style={{ fontSize: 15, color: app_theme.colors.text }} />
                                                <YambiText
                                                    text={formatCurrencyValue(item.currency, item.currentRevenue, item.symbol)}
                                                    bold
                                                    style={{ fontSize: 17, color: app_theme.colors.high_color }}
                                                />
                                            </View>

                                            {/* Percentage Badge */}
                                            <View style={{
                                                backgroundColor: badgeBg,
                                                paddingHorizontal: 9,
                                                paddingVertical: 3,
                                                borderRadius: 12,
                                                flexShrink: 0,
                                            }}>
                                                <YambiText
                                                    text={percentStr}
                                                    bold
                                                    size="small"
                                                    style={{ color: badgeTextColor, fontSize: 11 }}
                                                />
                                            </View>
                                        </View>

                                        {/* Progress Bar */}
                                        <View style={{
                                            height: 5,
                                            width: '100%',
                                            backgroundColor: app_theme.colors.high_color + "20",
                                            borderRadius: 3,
                                            overflow: 'hidden',
                                            marginBottom: 8,
                                        }}>
                                            <View style={{
                                                height: '100%',
                                                width: `${Math.max(progressRatio * 100, 3)}%`,
                                                backgroundColor: isNegative ? app_theme.colors.error : app_theme.colors.high_color,
                                                borderRadius: 3,
                                            }} />
                                        </View>

                                        {/* Precision Details Card Grid */}
                                        <View style={{
                                            backgroundColor: app_theme.colors.background + "90",
                                            borderRadius: 12,
                                            padding: 10,
                                            borderWidth: 1,
                                            borderColor: app_theme.colors.high_color + "20",
                                            gap: 6,
                                        }}>
                                            {/* Metric Row 1: Profit & Average Order Value */}
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1 }}>
                                                    <IconApp pack="FI" name="trending-up" size={12} color={item.currentProfit >= 0 ? app_theme.colors.high_color : app_theme.colors.error} />
                                                    <YambiText size="small" color="gray" text={` ${strings.total_profit}: `} style={{ fontSize: 11 }} />
                                                    <YambiText
                                                        size="small"
                                                        bold
                                                        text={`${formatCurrencyValue(item.currency, item.currentProfit, item.symbol)} (${marginPct.toFixed(1)}%)`}
                                                        style={{ fontSize: 11, color: item.currentProfit >= 0 ? app_theme.colors.high_color : app_theme.colors.error }}
                                                    />
                                                </View>

                                                <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1 }}>
                                                    <IconApp pack="FI" name="credit-card" size={12} color={app_theme.colors.gray} />
                                                    <YambiText size="small" color="gray" text={` ${(strings as any).avg_short || 'Moy.'}: `} style={{ fontSize: 11 }} />
                                                    <YambiText size="small" bold text={formatCurrencyValue(item.currency, aov, item.symbol)} style={{ fontSize: 11, color: app_theme.colors.text }} />
                                                </View>
                                            </View>

                                            {/* Metric Row 2: Transactions, Items & Cash vs Credit */}
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1 }}>
                                                    <IconApp pack="FI" name="shopping-bag" size={12} color={app_theme.colors.gray} />
                                                    <YambiText
                                                        size="small"
                                                        color="gray"
                                                        text={` ${item.salesCount} ${strings.sales} (${item.itemsSold} ${strings.items})`}
                                                        style={{ fontSize: 11 }}
                                                    />
                                                </View>

                                                <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1 }}>
                                                    <YambiText size="small" color="gray" text={`${strings.cash}: `} style={{ fontSize: 11 }} />
                                                    <YambiText size="small" bold text={formatCurrencyValue(item.currency, item.paidAmount, item.symbol)} style={{ fontSize: 11, color: app_theme.colors.text }} />
                                                    {item.debtAmount > 0 && (
                                                        <YambiText size="small" color="error" text={` • ${(strings as any).credit || 'Credit'}: ${formatCurrencyValue(item.currency, item.debtAmount, item.symbol)}`} style={{ fontSize: 11 }} />
                                                    )}
                                                </View>
                                            </View>

                                            {/* Metric Row 3: Expenses & Net Cash Flow */}
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1 }}>
                                                    <IconApp pack="FI" name="arrow-down-right" size={12} color={app_theme.colors.error} />
                                                    <YambiText size="small" color="gray" text={` ${strings.expenses}: `} style={{ fontSize: 11 }} />
                                                    <YambiText
                                                        size="small"
                                                        bold
                                                        text={`-${formatCurrencyValue(item.currency, item.expenseAmount, item.symbol)} (${item.expenseCount})`}
                                                        style={{ fontSize: 11, color: item.expenseAmount > 0 ? app_theme.colors.error : app_theme.colors.gray }}
                                                    />
                                                </View>

                                                <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1 }}>
                                                    <IconApp pack="IO" name="wallet-outline" size={12} color={app_theme.colors.high_color} />
                                                    <YambiText size="small" color="gray" text={` ${(strings as any).net_cash}: `} style={{ fontSize: 11 }} />
                                                    <YambiText
                                                        size="small"
                                                        bold
                                                        text={formatCurrencyValue(item.currency, netCash, item.symbol)}
                                                        style={{ fontSize: 11, color: netCash >= 0 ? app_theme.colors.high_color : app_theme.colors.error }}
                                                    />
                                                </View>
                                            </View>

                                            {/* Metric Row 4: Reservations (if present) */}
                                            {item.reservationCount > 0 && (
                                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1 }}>
                                                        <IconApp pack="FI" name="calendar" size={12} color={app_theme.colors.high_color} />
                                                        <YambiText size="small" color="gray" text={` ${(strings as any).reservations_short || 'Rés.'}: `} style={{ fontSize: 11 }} />
                                                        <YambiText
                                                            size="small"
                                                            bold
                                                            text={`${item.reservationCount} (${formatCurrencyValue(item.currency, item.reservationTotal, item.symbol)})`}
                                                            style={{ fontSize: 11, color: app_theme.colors.text }}
                                                        />
                                                    </View>

                                                    <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1 }}>
                                                        <YambiText size="small" color="gray" text={`Dep.: `} style={{ fontSize: 11 }} />
                                                        <YambiText
                                                            size="small"
                                                            bold
                                                            text={formatCurrencyValue(item.currency, item.reservationDeposit, item.symbol)}
                                                            style={{ fontSize: 11, color: app_theme.colors.high_color }}
                                                        />
                                                    </View>
                                                </View>
                                            )}

                                            {/* Metric Row 5: Period Comparison & Diff or All Time Summary */}
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4, borderTopWidth: 1, borderTopColor: app_theme.colors.border + "40", flexWrap: 'wrap', gap: 4 }}>
                                                {isDateFiltered ? (
                                                    <>
                                                        <YambiText
                                                            size="small"
                                                            color="gray"
                                                            text={`${strings.prev_period}: ${formatCurrencyValue(item.currency, item.prevRevenue, item.symbol)}`}
                                                            style={{ fontSize: 10 }}
                                                        />
                                                        <YambiText
                                                            size="small"
                                                            bold
                                                            text={`${(strings as any).difference_short || 'Diff.'}: ${diffAmount >= 0 ? '+' : ''}${formatCurrencyValue(item.currency, diffAmount, item.symbol)}`}
                                                            style={{ fontSize: 10, color: diffAmount >= 0 ? app_theme.colors.high_color : app_theme.colors.error }}
                                                        />
                                                    </>
                                                ) : (
                                                    <>
                                                        <YambiText
                                                            size="small"
                                                            color="gray"
                                                            text={`${(strings as any).all_time} ${strings.total_selling_price}`}
                                                            style={{ fontSize: 10 }}
                                                        />
                                                        <YambiText
                                                            size="small"
                                                            bold
                                                            text={formatCurrencyValue(item.currency, item.currentRevenue, item.symbol)}
                                                            style={{ fontSize: 10, color: app_theme.colors.high_color }}
                                                        />
                                                    </>
                                                )}
                                            </View>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>

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
                                }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <IconApp pack="FI" name="list" size={18} color={app_theme.colors.high_color} />
                                    <TextNormalYambi text={strings.view_sales_by_item} bold styles={{ marginLeft: 10 }} />
                                </View>
                                <IconApp pack="FI" name="chevron-right" size={20} color={app_theme.colors.text} />
                            </Pressable>
                        )}

                        {sales_point_id !== "" && sales_point_id !== undefined && (
                            <Pressable
                                onPress={() => {
                                    if (isAdmin) {
                                        navigation.navigate("GetExpenses", { flag: 2, sales_point_id: sales_point_id });
                                        return;
                                    }
                                    if (oo !== undefined && oo.user_active === 1) {
                                        if (oo.level === 1) {
                                            navigation.navigate("GetExpenses", { flag: 2, sales_point_id: sales_point_id });
                                        } else if (oo.level === 2) {
                                            if (oo.sales_point_id === sales_point_id) {
                                                navigation.navigate("GetExpenses", { flag: 2, sales_point_id: sales_point_id });
                                            } else {
                                                dispatch(setShowModalApp(true));
                                                setShowUserError(true);
                                            }
                                        } else {
                                            dispatch(setShowModalApp(true));
                                            setShowUserError(true);
                                        }
                                    } else {
                                        dispatch(setShowModalApp(true));
                                        setShowUserError(true);
                                    }
                                }}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    backgroundColor: app_theme.colors.border,
                                    padding: 15,
                                    borderRadius: 12,
                                    marginBottom: 15,
                                }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <IconApp pack="FI" name="dollar-sign" size={18} color={app_theme.colors.high_color} />
                                    <TextNormalYambi text={strings.view_pos_expenses || "View POS Expenses"} bold styles={{ marginLeft: 10 }} />
                                </View>
                                <IconApp pack="FI" name="chevron-right" size={20} color={app_theme.colors.text} />
                            </Pressable>
                        )}

                        {/* Detailed sales: column headers; rows follow in LegendList */}
                        {filtered_sales.length > 0 && (
                            <>
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15, marginTop: 10 }}>
                                    <TextNormalYambi text={strings.detailed_sales} bold styles={{ fontSize: 18 }} />
                                    <Pressable
                                        onPress={() => {
                                            dispatch(setShowModalApp(true));
                                            setShow_print_options(true);
                                        }}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            paddingHorizontal: 12,
                                            paddingVertical: 8,
                                            borderRadius: 8,
                                            backgroundColor: app_theme.colors.border,
                                            borderWidth: 1,
                                            borderColor: app_theme.colors.border,
                                        }}
                                    >
                                        <IconApp pack="FI" name="printer" size={16} color={app_theme.colors.high_color} />
                                        <TextSmallYambi text={strings.print} styles={{ marginLeft: 6, color: app_theme.colors.high_color }} />
                                    </Pressable>
                                </View>

                                <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: app_theme.colors.border,
                                    paddingHorizontal: 15,
                                    paddingVertical: 12,
                                    borderRadius: 8,
                                    marginBottom: 10,
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
                            </>
                        )}
                    </View>
                )}
                renderItem={({ item, index }: { item: TSale, index: number }) => (
                    <SalesList index={index} item={item} onLongPress={longPress} />
                )}
                ListFooterComponent={<View style={{ height: 24 }} />}
            />
        </View>
    );
}

export default SalesModern;
