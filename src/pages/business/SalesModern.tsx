import { Pressable, ScrollView, View, Animated } from 'react-native';
import { useEffect, useState, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/app/hooks';
import { setShowModalApp } from '../../store/reducers/appSlice';
import { strings } from '../../lang/lang';
import { IconApp } from '../../components/app/IconApp';
import { NavProps } from '../../types/types';
import { useObject, useQuery } from '@realm/react';
import { BusinessItemsSale, BusinessUsers, UserBusinessArticles, UserBusinesses, UserSellsPoints } from '../../store/database/Models';
import { TextNormalYambi, TextNormalYambiError, TextNormalYambiHighColor, TextNormalYambiSuccess, TextSmallYambi, TextSmallYambiError, TextSmallYambiGray, TextBigYambi, TextNormalYambiGray } from '../../components/app/Text';
import { global_currencies, renderCurrency, renderDateTime } from '../../../GlobalVariables';
import ModalApp from '../../components/app/ModalApp';
import DateRangePicker from "rn-select-date-range";
import moment from "moment";
import { setRemoveBusinessBadge, setRemoveSalesPointBadge } from '../../store/reducers/persistedAppSlice';
import { LegendList } from '@legendapp/list';
import SalesList from '../../components/lists/business/SalesList';
import { TItem, TItemPrices, TSale } from '../../types/types';
import SalesCharts from './SalesCharts';
import RNPrint from 'react-native-print';

const SalesModern = ({ navigation, route }: NavProps) => {
    const { business_id, sales_point_id, item_id } = route.params;

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
    const [show_currency_filter, setShow_currency_filter] = useState<boolean>(false);
    const [show_print_options, setShow_print_options] = useState<boolean>(false);
    const [currency_filter, setCurrency_filter] = useState<string>("");
    const [sale_active_filter] = useState<number>(1);
    const [category_filter, setCategory_filter] = useState<number>(0);
    const [show_filters, setShow_filters] = useState<boolean>(false);
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

    // Get unique sellers
    const uniqueSellers = Array.from(new Set(bs.map(sale => sale.sale_operator)));

    const conditionShowSales = () => {
        if (oo !== null && oo !== undefined) {
            if (oo.user_active === 1 && oo.level === 3 && oo.sales_point_id === sales_point_id) {
                return true;
            }
        }
        return false;
    };

    // Filter sales based on all criteria
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
        const categoryMatch = category_filter === 0 ? true : sale.type_sale === category_filter;
        statusMatch = sale.sale_active === sale_active_filter && categoryMatch;

        return dateMatch && userMatch && currencyMatch && statusMatch;
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

    const stats = getStats();

    const activeFiltersCount = [
        date_start !== "" && date_end !== "",
        user_filter !== "" && !conditionShowSales(),
        currency_filter !== "",
        category_filter === 1,
    ].filter(Boolean).length;

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
        <View style={{ flex: 1, backgroundColor: app_theme.colors.background, borderColor:app_theme.colors.border, borderTopWidth:1 }}>
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
                    <ScrollView style={{ maxHeight: 400.  }}>
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

            <LegendList
                style={{ flex: 1 }}
                data={filtered_sales as never}
                keyExtractor={(item: TSale) => item._id}
                estimatedItemSize={140}
                ListHeaderComponent={() => (
                <View style={{ padding: 15 }}>
                    {/* Summary Cards */}
                    <TextNormalYambi text={strings.business_overview} bold styles={{ marginBottom: 15, fontSize: 18 }} />

                    <View style={{ flexDirection: 'row', marginBottom: 15 }}>
                        <View style={{
                            flex: 1,
                            backgroundColor: app_theme.colors.border,
                            borderRadius: 12,
                            padding: 15,
                            marginRight: 8,
                            borderWidth: 1,
                            borderColor: app_theme.colors.border,
                        }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                <IconApp pack="FI" name="shopping-bag" size={16} color="#10B981" />
                                <TextSmallYambiGray text={strings.total_sales} styles={{ marginLeft: 5 }} />
                            </View>
                            <TextBigYambi text={stats.total_sales_count.toString()} bold styles={{ fontSize: 28, color: app_theme.colors.high_color }} />
                            <TextSmallYambiGray text={strings.completed_sales} styles={{ marginTop: 2 }} />
                        </View>

                        <View style={{
                            flex: 1,
                            backgroundColor: app_theme.colors.border,
                            borderRadius: 12,
                            padding: 15,
                            marginLeft: 8,
                            borderWidth: 1,
                            borderColor: app_theme.colors.border,
                        }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                <IconApp pack="FI" name="package" size={16} color="#F59E0B" />
                                <TextSmallYambiGray text={strings.items} styles={{ marginLeft: 5 }} />
                            </View>
                            <TextBigYambi text={stats.total_items_sold.toString()} bold styles={{ fontSize: 28, color: app_theme.colors.high_color }} />
                            <TextSmallYambiGray text={strings.sold} styles={{ marginTop: 2 }} />
                        </View>
                    </View>

                    <SalesCharts
                        sales={Array.from(filtered_sales as any)}
                        startDate={date_start !== "" ? date_start : undefined}
                        endDate={date_end !== "" ? date_end : undefined}
                        businessId={business_id !== "" ? business_id : undefined}
                    />

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
                            outputRange: [0, 400],
                        }),
                        opacity: filtersHeight,
                        overflow: 'hidden',
                    }}>
                        <View style={{ marginBottom: 15 }}>
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
                                        <TextNormalYambiHighColor text={
                                            date_start !== "" && date_end !== ""
                                                ? `${renderDateTime(date_start, 3, true)} - ${renderDateTime(date_end, 3, true)}`
                                                : strings.all
                                        } />
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

                            {/* Seller Filter - only show if not a level 3 operator */}
                            {!conditionShowSales() && (
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
                                            <TextNormalYambiHighColor text={user_filter !== "" ? user_filter : strings.all} />
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
                            )}

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
                                    marginBottom: 10,
                                }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <View style={{ flex: 1 }}>
                                        <TextSmallYambiGray text={strings.filter_by_currency} styles={{ marginBottom: 5 }} />
                                        <TextNormalYambiHighColor text={
                                            currency_filter !== ""
                                                ? renderCurrency(parseInt(currency_filter), true)
                                                : strings.all
                                        } />
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

                            {/* Payment Type Filter (Completed vs On Credit) */}
                            <View style={{
                                backgroundColor: app_theme.colors.background,
                                padding: 15,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: app_theme.colors.border,
                            }}>
                                <TextSmallYambiGray text={strings.filter_by_category} styles={{ marginBottom: 10 }} />
                                <View style={{ flexDirection: 'row' }}>
                                    <Pressable
                                        onPress={() => setCategory_filter(0)}
                                        style={{
                                            flex: 1,
                                            alignItems: 'center',
                                            paddingVertical: 10,
                                            borderRadius: 10,
                                            marginRight: 10,
                                            backgroundColor: category_filter === 0 ? app_theme.colors.high_color + '20' : app_theme.colors.border,
                                            borderWidth: 1,
                                            borderColor: category_filter === 0 ? app_theme.colors.high_color : app_theme.colors.border,
                                        }}>
                                        <TextNormalYambi text={strings.completed_sales} styles={{ color: category_filter === 0 ? app_theme.colors.high_color : app_theme.colors.text }} />
                                    </Pressable>
                                    <Pressable
                                        onPress={() => setCategory_filter(1)}
                                        style={{
                                            flex: 1,
                                            alignItems: 'center',
                                            paddingVertical: 10,
                                            borderRadius: 10,
                                            marginLeft: 10,
                                            backgroundColor: category_filter === 1 ? app_theme.colors.high_color + '20' : app_theme.colors.border,
                                            borderWidth: 1,
                                            borderColor: category_filter === 1 ? app_theme.colors.high_color : app_theme.colors.border,
                                        }}>
                                        <TextNormalYambi text={strings.on_credit} styles={{ color: category_filter === 1 ? app_theme.colors.high_color : app_theme.colors.text }} />
                                    </Pressable>
                                </View>
                            </View>
                        </View>
                    </Animated.View>

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

                    {/* Currency Statistics */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15, marginTop: 10 }}>
                        <TextNormalYambi text={`${strings.stats} (${filtered_sales.length})`} bold styles={{ fontSize: 18 }} />
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

                    {Object.entries(stats.currency_stats).map(([currency, data]) => {
                        const salesInCurrency = filtered_sales.filter(s => s.currency === parseInt(currency));
                        
                        if (!conditionShowGlobal(salesInCurrency)) {
                            return null;
                        }

                        const profit = data.selling - data.cost;
                        const profitPercentage = data.selling > 0 ? (profit / data.selling) * 100 : 0;

                        return (
                            <View key={currency} style={{
                                backgroundColor: app_theme.colors.border,
                                borderRadius: 12,
                                padding: 15,
                                marginBottom: 15,
                                borderWidth: 1,
                                borderColor: app_theme.colors.border,
                            }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                                    <IconApp pack="FI" name="dollar-sign" size={18} color={app_theme.colors.high_color} />
                                    <TextNormalYambiHighColor text={renderCurrency(parseInt(currency), true)} bold styles={{ marginLeft: 8 }} />
                                </View>

                                <View style={{ marginBottom: 10 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                                        <TextSmallYambiGray text={strings.total_cost_price} />
                                        <TextNormalYambi text={`${data.cost.toFixed(2)} ${renderCurrency(parseInt(currency), false)}`} bold />
                                    </View>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                                        <TextSmallYambiGray text={strings.total_selling_price} />
                                        <TextNormalYambi text={`${data.selling.toFixed(2)} ${renderCurrency(parseInt(currency), false)}`} bold />
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
                                                <TextNormalYambiSuccess text={`${profit.toFixed(2)} ${renderCurrency(parseInt(currency), false)}`} bold />
                                                <View style={{
                                                    backgroundColor: app_theme.colors.success + "20",
                                                    paddingHorizontal: 8,
                                                    paddingVertical: 2,
                                                    borderRadius: 10,
                                                    marginTop: 5,
                                                }}>
                                                    <TextSmallYambiGray text={`+${profitPercentage.toFixed(2)}%`} styles={{ color: app_theme.colors.success }} />
                                                </View>
                                            </>
                                        ) : (
                                            <>
                                                <TextNormalYambiError text={`${profit.toFixed(2)} ${renderCurrency(parseInt(currency), false)}`} bold />
                                                <View style={{
                                                    backgroundColor: app_theme.colors.error + "20",
                                                    paddingHorizontal: 8,
                                                    paddingVertical: 2,
                                                    borderRadius: 10,
                                                    marginTop: 5,
                                                }}>
                                                    <TextSmallYambiError text={`${profitPercentage.toFixed(2)}%`} />
                                                </View>
                                            </>
                                        )}
                                    </View>
                                </View>

                                <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center' }}>
                                    <IconApp pack="FI" name="package" size={14} color={app_theme.colors.gray} />
                                    <TextSmallYambiGray text={`${data.items} ${strings.items.toLowerCase()} • ${data.sales} ${strings.sales.toLowerCase()}`} styles={{ marginLeft: 5 }} />
                                </View>
                            </View>
                        );
                    })}

                    {Object.keys(stats.currency_stats).length === 0 && (
                        <View style={{
                            alignItems: 'center',
                            padding: 40,
                        }}>
                            <IconApp pack="FI" name="inbox" size={48} color={app_theme.colors.gray} />
                            <TextNormalYambiGray text={strings.no_sales_available} styles={{ marginTop: 15, textAlign: 'center' }} />
                        </View>
                    )}

                    {/* Detailed sales: column headers; rows follow in LegendList */}
                    {filtered_sales.length > 0 && (
                        <>
                            <TextNormalYambi text={strings.detailed_sales} bold styles={{ marginBottom: 15, fontSize: 18, marginTop: 10 }} />

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
