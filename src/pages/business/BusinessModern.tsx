import { TouchableOpacity, ScrollView, View, Animated, Platform } from 'react-native';
import { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/app/hooks';
import { setShowModalApp } from '../../store/reducers/appSlice';
import { strings } from '../../lang/lang';
import { IconApp } from '../../components/app/IconApp';
import { NavProps, TBusiness } from '../../types/types';
import { useObject, useQuery, useRealm } from '@realm/react';
import { BusinessItemsSale, BusinessUsers, UserBusinessArticles, UserBusinesses } from '../../store/database/Models';
import { TextNormalYambi, TextNormalYambiError, TextNormalYambiHighColor, TextNormalYambiSuccess, TextSmallYambi, TextSmallYambiError, TextSmallYambiGray, TextSmallYambiSuccess, TextBigYambi, TextNormalYambiGray } from '../../components/app/Text';
import { global_currencies, renderCurrency, renderDateTime } from '../../../GlobalVariables';
import ModalApp from '../../components/app/ModalApp';
import DateRangePicker from "rn-select-date-range";
import moment from "moment";
import axios from 'axios';
import { remote_host } from '../../../GlobalVariables';

const BusinessModern = ({ navigation, route }: NavProps) => {
    const { business_id } = route.params;

    const app_theme = useAppSelector(state => state.app_theme);
    const app_language = useAppSelector(state => state.persisted_app.langApp);
    const dispatch = useAppDispatch();
    const realm = useRealm();

    const [needsDeepLinkHeader, setNeedsDeepLinkHeader] = useState(false);
    const [businessMissingRemote, setBusinessMissingRemote] = useState(false);

    const [date_start, setDate_start] = useState<string>("");
    const [date_end, setDate_end] = useState<string>("");
    const [user_filter, setUser_filter] = useState<string>("");
    const [date_selection_modal, setDate_selection_modal] = useState<boolean>(false);
    const [show_users_filter, setShow_users_filter] = useState<boolean>(false);
    const [show_currency_filter, setShow_currency_filter] = useState<boolean>(false);
    const [currency_filter, setCurrency_filter] = useState<string>("");
    const [sale_active_filter, setSale_active_filter] = useState<number>(1);
    const [category_filter, setCategory_filter] = useState<number>(0);
    const [show_filters, setShow_filters] = useState<boolean>(false);
    const filtersHeight = useRef(new Animated.Value(0)).current;

    const LLg = () => {
        if (app_language === "sw_drc") {
            return "fr";
        } else {
            return app_language;
        }
    }

    const bs = useQuery(
        BusinessItemsSale, bss => {
            return bss.filtered('business_id == $0', business_id)
        }, []);

    const bus = useQuery(
        BusinessUsers, bss => {
            return bss.filtered('business_id == $0 && user_active != $1', business_id, 2)
        }, []);

    const valid_items = useQuery(
        UserBusinessArticles, bi => {
            return bi.filtered('business_id == $0 && item_active=$1', business_id, 1)
        }, []);

    const business = useObject(UserBusinesses, business_id);

    useEffect(() => {
        setBusinessMissingRemote(false);
        setNeedsDeepLinkHeader(false);
    }, [business_id]);

    useEffect(() => {
        if (business) {
            return;
        }
        setNeedsDeepLinkHeader(true);
        let cancelled = false;
        axios
            .post(remote_host + "/yambi/API/get_business", { business_id })
            .then(res => {
                if (cancelled) return;
                if (res.data?.success === "1" && res.data.business) {
                    const bb = res.data.business;
                    const new_business: TBusiness = {
                        _id: bb._id,
                        phone_number: bb.phone_number ?? "",
                        business_name: bb.business_name ?? "",
                        slogan: bb.slogan ?? "",
                        description_service: bb.description_service ?? "",
                        category: parseInt(String(bb.category ?? 0), 10),
                        keywords: bb.keywords ?? "",
                        currency: parseInt(String(bb.currency ?? 0), 10),
                        logo: bb.logo ?? "",
                        national_number: bb.national_number ?? "",
                        national_id: bb.national_id ?? "",
                        tax_number: bb.tax_number ?? "",
                        country: bb.country ?? "",
                        state: bb.state ?? "",
                        city: bb.city ?? "",
                        phones: bb.phones ?? "",
                        emails: bb.emails ?? "",
                        background: bb.background ?? "",
                        business_active: parseInt(String(bb.business_active ?? 0), 10),
                        business_address: bb.business_address ?? "",
                        business_visible: parseInt(String(bb.business_visible ?? 0), 10),
                        website: bb.website ?? "",
                        other_links: bb.other_links ?? "",
                        yambi: bb.yambi ?? "",
                        valid_until: bb.valid_until ?? "",
                        createdAt: bb.createdAt ?? "",
                        updatedAt: bb.updatedAt ?? "",
                    };
                    try {
                        realm.write(() => {
                            realm.create("Businesses", new_business, true);
                        });
                    } catch {
                        setBusinessMissingRemote(true);
                    }
                } else {
                    setBusinessMissingRemote(true);
                }
            })
            .catch(() => {
                if (!cancelled) setBusinessMissingRemote(true);
            });
        return () => {
            cancelled = true;
        };
    }, [business_id, business, realm]);

    useLayoutEffect(() => {
        const headerLeft = needsDeepLinkHeader
            ? () => (
                <TouchableOpacity
                    onPress={() => navigation.navigate("Home" as never)}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    style={{ marginLeft: Platform.OS === "ios" ? 8 : 4 }}>
                    <IconApp
                        pack="FI"
                        name={Platform.OS === "android" ? "arrow-left" : "chevron-left"}
                        size={22}
                        color={app_theme.colors.text_design1}
                    />
                </TouchableOpacity>
            )
            : undefined;

        navigation.setOptions({
            title: business?.business_name ?? strings.business,
            headerLeft,
        });
    }, [business, navigation, needsDeepLinkHeader, app_theme.colors.text_design1]);

    // Helper function to check if business is expired
    // "Mwanga Business" always remains active
    const isBusinessExpired = () => {
        if (!business) return false;
        
        // "Mwanga Business" always remains active
        if (business.business_name === "Mwanga Business") {
            return false;
        }
        
        // Check if valid_until date has passed
        if (!business.valid_until || business.valid_until === "") {
            return false;
        }
        
        try {
            const validUntilDate = new Date(business.valid_until);
            const now = new Date();
            return validUntilDate < now;
        } catch (error) {
            console.error("Error parsing valid_until date:", error);
            return false;
        }
    };

    const businessExpired = isBusinessExpired();

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
        statusMatch = sale.sale_active === sale_active_filter && sale.type_sale === category_filter;

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

                currency_stats[sale.currency].cost += (parseInt(sale.cost_price) || 0) * sale.number;
                currency_stats[sale.currency].selling += (parseInt(sale.selling_price) || 0) * sale.number;
                currency_stats[sale.currency].items += sale.number;
                currency_stats[sale.currency].sales++;
            }
        });

        return { total_sales_count, total_items_sold, currency_stats };
    };

    const stats = getStats();

    // Get weekly sales data for chart
    const getWeeklySalesData = () => {
        const today = new Date();
        const weekData = [0, 0, 0, 0, 0, 0, 0];

        filtered_sales.forEach((sale) => {
            if (sale.sale_active === 1) {
                const saleDate = new Date(sale.createdAt);
                const daysDiff = Math.floor((today.getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24));

                if (daysDiff >= 0 && daysDiff < 7) {
                    const dayOfWeek = saleDate.getDay();
                    const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                    weekData[adjustedDay]++;
                }
            }
        });

        return weekData;
    };

    const weeklySalesData = getWeeklySalesData();
    const maxSales = Math.max(...weeklySalesData, 1);

    const activeFiltersCount = [
        date_start !== "" && date_end !== "",
        user_filter !== "",
        currency_filter !== "",
    ].filter(Boolean).length;

    if (!business && !businessMissingRemote) {
        return (
            <View style={{
                flex: 1,
                backgroundColor: app_theme.colors.background,
                justifyContent: "center",
                alignItems: "center",
            }}>
                <TextNormalYambiGray text={strings.loading} />
            </View>
        );
    }

    if (!business && businessMissingRemote) {
        return (
            <View style={{
                flex: 1,
                backgroundColor: app_theme.colors.background,
                justifyContent: "center",
                alignItems: "center",
                paddingHorizontal: 32,
            }}>
                <IconApp pack="FI" name="briefcase" size={56} color={app_theme.colors.gray} />
                <TextNormalYambiGray text={strings.business_not_found} styles={{ textAlign: "center", marginTop: 16 }} />
                <TouchableOpacity
                    onPress={() =>
                        needsDeepLinkHeader ? navigation.navigate("Home" as never) : navigation.goBack()}
                    activeOpacity={0.7}
                    style={{ marginTop: 20, paddingVertical: 12, paddingHorizontal: 20 }}>
                    <TextNormalYambiHighColor text={strings.back} />
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: app_theme.colors.background }}>
            {/* Modals */}
            {show_users_filter && (
                <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShow_users_filter(false); }} singleButton title={strings.filter_by_seller}>
                    <ScrollView style={{ maxHeight: 400 }}>
                        <TouchableOpacity
                            onPress={() => {
                                setUser_filter("");
                                dispatch(setShowModalApp(false));
                                setShow_users_filter(false);
                            }}
                            style={{
                                paddingVertical: 15,
                                borderBottomWidth: 1,
                                borderColor: app_theme.colors.border,
                            }}>
                            <TextNormalYambiHighColor text={strings.all} />
                        </TouchableOpacity>
                        {bus.map((user, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => {
                                    setUser_filter(user.phone_number);
                                    dispatch(setShowModalApp(false));
                                    setShow_users_filter(false);
                                }}
                                style={{
                                    paddingVertical: 15,
                                    borderBottomWidth: 1,
                                    borderColor: app_theme.colors.border,
                                }}>
                                <TextNormalYambi text={user.phone_number} />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </ModalApp>
            )}

            {show_currency_filter && (
                <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShow_currency_filter(false); }} singleButton title={strings.filter_by_currency}>
                    <ScrollView style={{ maxHeight: 400 }}>
                        <TouchableOpacity
                            onPress={() => {
                                setCurrency_filter("");
                                dispatch(setShowModalApp(false));
                                setShow_currency_filter(false);
                            }}
                            style={{
                                paddingVertical: 15,
                                borderBottomWidth: 1,
                                borderColor: app_theme.colors.border,
                            }}>
                            <TextNormalYambiHighColor text={strings.all} />
                        </TouchableOpacity>
                        {global_currencies.map((cu: number) => {
                            const salesInCurrency = filtered_sales.filter(s => s.currency === cu);
                            if (salesInCurrency.length > 0) {
                                return (
                                    <TouchableOpacity
                                        key={cu}
                                        onPress={() => {
                                            setCurrency_filter(cu.toString());
                                            dispatch(setShowModalApp(false));
                                            setShow_currency_filter(false);
                                        }}
                                        style={{
                                            paddingVertical: 15,
                                            borderBottomWidth: 1,
                                            borderColor: app_theme.colors.border,
                                            flexDirection: 'row',
                                            justifyContent: 'space-between',
                                        }}>
                                        <TextNormalYambi text={renderCurrency(cu, true)} />
                                        <TextNormalYambiHighColor text={salesInCurrency.length.toString()} />
                                    </TouchableOpacity>
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

            <ScrollView style={{ flex: 1 }}>
                <View style={{ padding: 15 }}>
                    {/* Subscription Expiration Warning */}
                    {businessExpired && (
                        <View style={{
                            backgroundColor: app_theme.colors.error + "20",
                            borderRadius: 12,
                            padding: 16,
                            marginBottom: 15,
                            borderWidth: 2,
                            borderColor: app_theme.colors.error,
                            alignItems: 'center',
                        }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                                <IconApp pack="FI" name="alert-circle" size={24} color={app_theme.colors.error} />
                                <TextNormalYambi 
                                    text={(strings as any).subscription_expired || "Subscription Expired"} 
                                    bold 
                                    styles={{ marginLeft: 10, color: app_theme.colors.error }} 
                                />
                            </View>
                            <TextNormalYambiGray 
                                text={(strings as any).subscription_expired_message || "Your business subscription has expired. Please renew to continue adding new sales."} 
                                styles={{ textAlign: 'center', marginBottom: 15, lineHeight: 20 }} 
                            />
                            <TouchableOpacity
                                onPress={() => navigation.navigate("AddBusinessSubscription", { business_id: business_id })}
                                style={{
                                    backgroundColor: app_theme.colors.error,
                                    borderRadius: 8,
                                    paddingHorizontal: 24,
                                    paddingVertical: 12,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                }}
                            >
                                <IconApp pack="FI" name="refresh-cw" size={18} color={app_theme.colors.background} />
                                <TextNormalYambi 
                                    text={strings.renew_my_subscription || "Renew my subscription"} 
                                    bold 
                                    styles={{ marginLeft: 8, color: app_theme.colors.background }} 
                                />
                            </TouchableOpacity>
                        </View>
                    )}

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

                    {/* Weekly Sales Chart */}
                    <View style={{
                        backgroundColor: app_theme.colors.border,
                        borderRadius: 12,
                        padding: 15,
                        marginBottom: 15,
                        borderWidth: 1,
                        borderColor: app_theme.colors.border,
                    }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                            <IconApp pack="FI" name="trending-up" size={18} color="#3B82F6" />
                            <TextNormalYambi text={strings.weekly_sales} bold styles={{ marginLeft: 8 }} />
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 100 }}>
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                                const salesCount = weeklySalesData[index];
                                const barHeight = maxSales > 0 ? (salesCount / maxSales) * 80 + 20 : 20;
                                return (
                                    <View key={day} style={{ flex: 1, alignItems: 'center' }}>
                                        <TextSmallYambiGray text={salesCount.toString()} styles={{ fontSize: 10, marginBottom: 3 }} />
                                        <View style={{
                                            width: '70%',
                                            height: barHeight,
                                            backgroundColor: '#3B82F6',
                                            borderRadius: 4,
                                            marginBottom: 5,
                                        }} />
                                        <TextSmallYambiGray text={day.substring(0, 1)} styles={{ fontSize: 10 }} />
                                    </View>
                                );
                            })}
                        </View>
                    </View>

                    {/* Filters Toggle */}
                    <TouchableOpacity
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
                    </TouchableOpacity>

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
                            <TouchableOpacity
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
                                        <TouchableOpacity
                                            onPress={(e) => {
                                                e.stopPropagation();
                                                setDate_start("");
                                                setDate_end("");
                                            }}
                                            style={{ padding: 5 }}>
                                            <IconApp pack="FI" name="x" size={18} color={app_theme.colors.gray} />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </TouchableOpacity>

                            {/* Seller Filter */}
                            <TouchableOpacity
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
                                        <TouchableOpacity
                                            onPress={(e) => {
                                                e.stopPropagation();
                                                setUser_filter("");
                                            }}
                                            style={{ padding: 5 }}>
                                            <IconApp pack="FI" name="x" size={18} color={app_theme.colors.gray} />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </TouchableOpacity>

                            {/* Currency Filter */}
                            <TouchableOpacity
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
                                        <TextNormalYambiHighColor text={
                                            currency_filter !== ""
                                                ? renderCurrency(parseInt(currency_filter), true)
                                                : strings.all
                                        } />
                                    </View>
                                    {currency_filter !== "" && (
                                        <TouchableOpacity
                                            onPress={(e) => {
                                                e.stopPropagation();
                                                setCurrency_filter("");
                                            }}
                                            style={{ padding: 5 }}>
                                            <IconApp pack="FI" name="x" size={18} color={app_theme.colors.gray} />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>

                    {/* Currency Statistics */}
                    <TextNormalYambi text={strings.stats} bold styles={{ marginBottom: 15, fontSize: 18, marginTop: 10 }} />

                    {Object.entries(stats.currency_stats).map(([currency, data]) => {
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
                                        <TextNormalYambi text={`${data.cost} ${renderCurrency(parseInt(currency), false)}`} bold />
                                    </View>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                                        <TextSmallYambiGray text={strings.total_selling_price} />
                                        <TextNormalYambi text={`${data.selling} ${renderCurrency(parseInt(currency), false)}`} bold />
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
                                                <TextNormalYambiSuccess text={`${profit} ${renderCurrency(parseInt(currency), false)}`} bold />
                                                <View style={{
                                                    backgroundColor: app_theme.colors.success + "20",
                                                    paddingHorizontal: 8,
                                                    paddingVertical: 2,
                                                    borderRadius: 10,
                                                    marginTop: 5,
                                                }}>
                                                    <TextSmallYambiSuccess text={`+${profitPercentage.toFixed(2)}%`} />
                                                </View>
                                            </>
                                        ) : (
                                            <>
                                                <TextNormalYambiError text={`${profit} ${renderCurrency(parseInt(currency), false)}`} bold />
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
                </View>
            </ScrollView>
        </View>
    );
}

export default BusinessModern;
