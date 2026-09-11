import { View, ScrollView, Pressable, Animated } from "react-native";
import { useAppSelector } from "../../store/app/hooks";
import { strings } from "../../lang/lang";
import { IconApp } from "../../components/app/IconApp";
import { YambiText, TextNormalYambi, TextNormalYambiGray, TextSmallYambi, TextSmallYambiGray, TextNormalYambiHighColor } from "../../components/app/Text";
import { NavProps } from "../../types/types";
import { useQuery } from "@realm/react";
import { Expenses, BusinessUsers, UserSellsPoints } from "../../store/database/Models";
import { LegendList } from '@legendapp/list';
import ExpenseItem from "../../components/lists/expenses/ExpenseItem";
import { setShowModalApp } from "../../store/reducers/appSlice";
import { useEffect, useState, useRef, useMemo } from "react";
import { useAppDispatch } from "../../store/app/hooks";
import { global_currencies, renderCurrency, renderDateTime } from "../../../GlobalVariables";
import ModalApp from "../../components/app/ModalApp";
import BottomSheet from "../../components/app/BottomSheet";
import ButtonNormal from "../../components/app/ButtonNormal";
import DateRangePicker from "../../components/app/DateRangePicker";
import { formatAmount } from "../../util/formatAmount";
import * as Print from 'expo-print';
import moment from "moment";

const CategoryExpenses = ({ navigation, route }: NavProps) => {
    const { category_id, flag = 0, business_id = "", sales_point_id = "" } = route.params;
    const theme = useAppSelector(state => state.app_theme.colors);
    const app_theme = useAppSelector(state => state.app_theme);
    const app_language = useAppSelector(state => state.persisted_app.langApp);
    const user_data = useAppSelector(state => state.user_data);

    const isAdmin = user_data?.user_level === 2;

    const sellsPointQuery = useQuery(
        UserSellsPoints, points => {
            return points.filtered('_id == $0', sales_point_id || 'impossible_id_that_never_matches');
        }, [sales_point_id]);
    const salesPointBusinessId = sellsPointQuery.length > 0 ? sellsPointQuery[0].business_id : "";

    const userBusinessAccess = useQuery(
        BusinessUsers, users => {
            return users.filtered('user == $0 && user_active == $1', user_data.phone_number, 1);
        }, [user_data.phone_number]);

    const membership = useMemo(() => {
        if (isAdmin) return null;
        if (flag === 1 && business_id) {
            return userBusinessAccess.find(access => access.business_id === business_id);
        } else if (flag === 2 && sales_point_id) {
            const posAccess = userBusinessAccess.find(access => access.sales_point_id === sales_point_id);
            if (posAccess) return posAccess;
            if (salesPointBusinessId) {
                return userBusinessAccess.find(access => access.business_id === salesPointBusinessId && access.level === 1);
            }
        }
        return null;
    }, [userBusinessAccess, flag, business_id, sales_point_id, salesPointBusinessId, isAdmin]);

    const hasAccess = useMemo(() => {
        if (isAdmin) return true;
        if (flag === 0) return true; // personal expenses are always allowed

        if (!membership) return false;

        if (flag === 1) {
            return membership.level === 1;
        } else if (flag === 2) {
            if (membership.level === 1) return true;
            if (membership.level === 2 && membership.sales_point_id === sales_point_id) return true;
            return false;
        }
        return false;
    }, [membership, flag, sales_point_id, isAdmin]);

    if (!hasAccess) {
        return (
            <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                <IconApp pack="FI" name="shield" size={60} color={theme.error} styles={{ marginBottom: 15 }} />
                <YambiText text={strings.access_denied} size="big" color="error" style={{ fontWeight: '700', marginBottom: 10 }} />
                <YambiText text={strings.business_level_error || "You do not have permission to view these expenses."} size="normal" color="gray" style={{ textAlign: 'center' }} />
            </View>
        );
    }
    const dispatch = useAppDispatch();
    const expenses_categories = strings.expenses_categories || [];
    const category = expenses_categories.find(c => c.id === category_id);

    // Filter states
    const [date_start, setDate_start] = useState<string>("");
    const [date_end, setDate_end] = useState<string>("");
    const [currency_filter, setCurrency_filter] = useState<string>("");
    const [debt_filter, setDebt_filter] = useState<number>(-1); // -1 = all, 0 = no debt, 1 = debt
    const [payment_type_filter, setPayment_type_filter] = useState<number>(-1); // -1 = all, 0 = undefined, 1 = cash, 2 = card, 3 = bank
    const [show_filters, setShow_filters] = useState<boolean>(false);
    const [show_filters_sheet, setShow_filters_sheet] = useState<boolean>(false);
    const [show_all_currencies, setShow_all_currencies] = useState<boolean>(false);
    const [date_selection_modal, setDate_selection_modal] = useState<boolean>(false);
    const [show_currency_filter, setShow_currency_filter] = useState<boolean>(false);
    const [show_debt_filter, setShow_debt_filter] = useState<boolean>(false);
    const [show_payment_type_filter, setShow_payment_type_filter] = useState<boolean>(false);
    const filtersHeight = useRef(new Animated.Value(0)).current;

    const LLg = () => {
        if (app_language === "sw_drc") {
            return "fr";
        } else {
            return app_language;
        }
    };

    // Get all expenses for the category
    const allCategoryExpenses = useQuery(
        Expenses, expenses => {
            let query = expenses.filtered('category == $0 && expense_active == $1', category_id, 1);
            if (flag === 1) {
                query = query.filtered('business_id == $0', business_id);
            } else if (flag === 2) {
                query = query.filtered('sales_point_id == $0', sales_point_id);
            } else {
                query = query.filtered('phone_number == $0', user_data.phone_number);
            }
            return query.sorted('createdAt', true);
        }, [category_id, flag, business_id, sales_point_id, user_data.phone_number]);

    // Filter expenses based on all criteria
    const filteredExpenses = allCategoryExpenses.filter(expense => {
        let dateMatch = true;
        let currencyMatch = true;
        let debtMatch = true;
        let paymentTypeMatch = true;

        // Date filter
        if (date_start !== "" && date_end !== "") {
            const expenseDate = moment(expense.createdAt).format("YYYY-MM-DD");
            dateMatch = expenseDate >= date_start && expenseDate <= date_end;
        }

        // Currency filter
        if (currency_filter !== "") {
            currencyMatch = expense.currency.toString() === currency_filter;
        }

        // Debt filter
        if (debt_filter !== -1) {
            debtMatch = expense.debt === debt_filter;
        }

        // Payment type filter
        if (payment_type_filter !== -1) {
            paymentTypeMatch = expense.payment_type === payment_type_filter;
        }

        return dateMatch && currencyMatch && debtMatch && paymentTypeMatch;
    });

    // Removed setTitle to avoid changing app title when viewing category expenses

    const activeFiltersCount = [
        date_start !== "" && date_end !== "",
        currency_filter !== "",
        debt_filter !== -1,
        payment_type_filter !== -1,
    ].filter(Boolean).length;



    // Animate filters expand/collapse
    useEffect(() => {
        Animated.timing(filtersHeight, {
            toValue: show_filters ? 1 : 0,
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, [show_filters]);

    const SelectExpense = (expense: any) => {
        navigation.navigate('Expense', { expense_id: expense._id });
    };

    const getCategoryIcon = (categoryId: number) => {
        const icons: { [key: number]: string } = {
            1: "home", 2: "shopping-bag", 3: "truck", 4: "heart", 5: "book",
            6: "user", 7: "coffee", 8: "shopping-cart", 9: "briefcase",
            10: "credit-card", 11: "shield", 12: "heart", 13: "gift"
        };
        return icons[categoryId] || "dollar-sign";
    };

    const getCategoryColor = (categoryId: number) => {
        const colors: { [key: number]: string } = {
            1: "#4A90E2", 2: "#50C878", 3: "#FF6B6B", 4: "#FF8C42", 5: "#9B59B6",
            6: "#E91E63", 7: "#00BCD4", 8: "#FFC107", 9: "#607D8B",
            10: "#795548", 11: "#3F51B5", 12: "#FF9800", 13: "#4CAF50"
        };
        return colors[categoryId] || theme.high_color;
    };

    const categoryColor = category_id ? getCategoryColor(category_id) : theme.high_color;
    const categoryIcon = category_id ? getCategoryIcon(category_id) : "dollar-sign";

    // Calculate currency statistics
    const getCurrencyStats = () => {
        const currency_stats: { [key: number]: { amount: number, count: number } } = {};

        filteredExpenses.forEach(expense => {
            const currency = expense.currency;
            if (!currency_stats[currency]) {
                currency_stats[currency] = { amount: 0, count: 0 };
            }
            currency_stats[currency].amount += parseFloat(expense.amount || "0") * (expense.quantity || 1);
            currency_stats[currency].count++;
        });

        return currency_stats;
    };

    const currencyStats = getCurrencyStats();

    return (
        <View style={{
            backgroundColor: theme.background,
            flex: 1,
            borderColor: theme.border,
            borderTopWidth: 1
        }}>
            <ScrollView style={{ flex: 1 }}>
                <View style={{ paddingHorizontal: 12, paddingTop: 12, paddingBottom: 55 }}>
                    {/* Category Header Card */}
                    <View style={{
                        backgroundColor: theme.background,
                        borderRadius: 14,
                        padding: 15,
                        marginBottom: 15,
                        borderWidth: 1,
                        borderColor: theme.border,
                    }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                            <View style={{
                                backgroundColor: categoryColor + "20",
                                borderRadius: 50,
                                width: 50,
                                height: 50,
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginRight: 12
                            }}>
                                <IconApp pack="FI" name={categoryIcon} size={26} color={categoryColor} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <YambiText
                                        text={category?.name || strings.expenses || "Expenses"}
                                        size="normal"
                                        color="default"
                                        style={{ fontSize: 16, fontWeight: '700', marginBottom: 3 }}
                                        bold
                                    />
                                    <Pressable
                                        onPress={async () => {
                                            // Group expenses by currency
                                            const expensesByCurrency: { [key: number]: any[] } = {};
                                            filteredExpenses.forEach(exp => {
                                                if (!expensesByCurrency[exp.currency]) {
                                                    expensesByCurrency[exp.currency] = [];
                                                }
                                                expensesByCurrency[exp.currency].push(exp);
                                            });

                                            // Calculate totals by currency
                                            const totalsByCurrency: { [key: number]: number } = {};
                                            Object.entries(expensesByCurrency).forEach(([currency, exps]) => {
                                                totalsByCurrency[parseInt(currency)] = exps.reduce((sum, exp) => sum + (parseFloat(exp.amount || "0") * (exp.quantity || 1)), 0);
                                            });

                                            const dateRangeText = date_start !== "" && date_end !== ""
                                                ? `${renderDateTime(date_start, 3, true)} - ${renderDateTime(date_end, 3, true)}`
                                                : strings.all || "All";

                                            const html = `
                                                <!DOCTYPE html>
                                                <html>
                                                <head>
                                                    <meta charset="UTF-8">
                                                    <style>
                                                        * { margin: 0; padding: 0; box-sizing: border-box; }
                                                        body { 
                                                            font-family: 'Courier New', monospace; 
                                                            padding: 20px;
                                                            max-width: 800px;
                                                            margin: 0 auto;
                                                            background: white;
                                                        }
                                                        .header { 
                                                            text-align: center;
                                                            border-bottom: 2px dashed #333;
                                                            padding-bottom: 20px;
                                                            margin-bottom: 25px;
                                                        }
                                                        .header h1 { 
                                                            font-size: 28px;
                                                            margin-bottom: 10px;
                                                            text-transform: uppercase;
                                                        }
                                                        .info-section {
                                                            margin: 20px 0;
                                                            padding: 15px;
                                                            background: #f8f8f8;
                                                            border-radius: 5px;
                                                        }
                                                        .info-row {
                                                            display: flex;
                                                            justify-content: space-between;
                                                            padding: 5px 0;
                                                            font-size: 13px;
                                                        }
                                                        table { 
                                                            width: 100%;
                                                            border-collapse: collapse;
                                                            margin: 15px 0;
                                                        }
                                                        th, td { 
                                                            padding: 10px;
                                                            text-align: left;
                                                            border-bottom: 1px solid #ddd;
                                                            font-size: 12px;
                                                        }
                                                        th { 
                                                            background-color: #f8f8f8;
                                                            font-weight: bold;
                                                            text-transform: uppercase;
                                                        }
                                                        .text-right { text-align: right; }
                                                        .currency-section {
                                                            margin: 30px 0;
                                                            border-top: 2px solid #333;
                                                            padding-top: 20px;
                                                        }
                                                        .currency-title {
                                                            font-size: 18px;
                                                            font-weight: bold;
                                                            margin-bottom: 15px;
                                                        }
                                                        .summary {
                                                            margin-top: 20px;
                                                            border-top: 2px solid #333;
                                                            padding-top: 15px;
                                                        }
                                                        .summary-row {
                                                            display: flex;
                                                            justify-content: space-between;
                                                            padding: 8px 0;
                                                            font-size: 14px;
                                                        }
                                                        .summary-row.total {
                                                            font-size: 18px;
                                                            font-weight: bold;
                                                            border-top: 2px solid #333;
                                                            margin-top: 10px;
                                                            padding-top: 15px;
                                                        }
                                                    </style>
                                                </head>
                                                <body>
                                                    <div class="header">
                                                        <h1>${category?.name || strings.expenses || "Expenses"}</h1>
                                                        <div class="info-section">
                                                            <div class="info-row">
                                                                <span><strong>${strings.filter_by_date || "Date Range"}:</strong></span>
                                                                <span>${dateRangeText}</span>
                                                            </div>
                                                            <div class="info-row">
                                                                <span><strong>${strings.total || "Total Expenses"}:</strong></span>
                                                                <span>${filteredExpenses.length}</span>
                                                            </div>
                                                            <div class="info-row">
                                                                <span><strong>${strings.print || "Print Date"}:</strong></span>
                                                                <span>${moment().format('YYYY-MM-DD HH:mm')}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    ${Object.entries(expensesByCurrency).map(([currency, exps]) => `
                                                        <div class="currency-section">
                                                            <div class="currency-title">${renderCurrency(parseInt(currency), true)}</div>
                                                            <table>
                                                                <thead>
                                                                    <tr>
                                                                        <th>${strings.title || "Title"}</th>
                                                                        <th class="text-right">${strings.amount || "Amount"}</th>
                                                                        <th>${strings.payment_type || "Payment"}</th>
                                                                        <th>${strings.date || "Date"}</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    ${exps.map(exp => {
                                                const paymentType = exp.payment_type === 0
                                                    ? (strings as any).not_paid || "Not Paid"
                                                    : exp.payment_type === 1
                                                        ? strings.cash || "Cash"
                                                        : exp.payment_type === 2
                                                            ? strings.card || "Card"
                                                            : strings.bank_transfer || "Bank Transfer";
                                                return `
                                                                            <tr>
                                                                                <td>${exp.title || ""}</td>
                                                                                <td class="text-right">
                                                                                    ${formatAmount((parseFloat(exp.amount || "0") * (exp.quantity || 1)).toString())} ${renderCurrency(exp.currency, false)}
                                                                                    ${(exp.quantity || 1) > 1 ? `<br/><small style="color: gray; font-size: 10px;">${formatAmount(exp.amount)} x ${exp.quantity}</small>` : ''}
                                                                                </td>
                                                                                <td>${paymentType}</td>
                                                                                <td>${renderDateTime(exp.createdAt, 0, false, false)}</td>
                                                                            </tr>
                                                                        `;
                                            }).join('')}
                                                                </tbody>
                                                            </table>
                                                            <div class="summary">
                                                                <div class="summary-row total">
                                                                    <span>${strings.total || "Total"}:</span>
                                                                    <span>${formatAmount(totalsByCurrency[parseInt(currency)])} ${renderCurrency(parseInt(currency), false)}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    `).join('')}
                                                </body>
                                                </html>
                                            `;

                                            await Print.printAsync({ html });
                                        }}
                                        style={{
                                            height: 30,
                                            width: 30,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <IconApp pack="FI" name="printer" size={18} color={categoryColor} />
                                    </Pressable>
                                </View>
                                <YambiText
                                    text={`${filteredExpenses.length} ${strings.expenses || 'expenses'}`}
                                    size="small"
                                    color="gray"
                                />
                            </View>
                        </View>
                        {Object.keys(currencyStats).length > 0 && (
                            <View style={{ marginTop: 12 }}>
                                {Object.entries(currencyStats).map(([currency, data]) => (
                                    <View key={currency} style={{
                                        backgroundColor: theme.background,
                                        borderRadius: 10,
                                        padding: 12,
                                        borderWidth: 1,
                                        borderColor: theme.border,
                                        marginBottom: 8
                                    }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <IconApp pack="FI" name="dollar-sign" size={14} color={theme.high_color} styles={{ marginRight: 6 }} />
                                                <YambiText
                                                    text={renderCurrency(parseInt(currency), true)}
                                                    size="normal"
                                                    color="default"
                                                    style={{ fontWeight: '600', fontSize: 14 }}
                                                />
                                            </View>
                                            <View style={{ alignItems: 'flex-end' }}>
                                                <YambiText
                                                    text={formatAmount(data.amount)}
                                                    size="normal"
                                                    color="high"
                                                    style={{ fontWeight: '700', fontSize: 16 }}
                                                />
                                                <YambiText
                                                    text={`${data.count} ${data.count === 1 ? strings.expense || 'expense' : strings.expenses || 'expenses'}`}
                                                    size="xsmall"
                                                    color="gray"
                                                    style={{ marginTop: 2 }}
                                                />
                                            </View>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Add Expense Button */}
                    {/* <Pressable
                        onPress={() => navigation.navigate('AddExpense', { category_id, business_id, sales_point_id })}
                        style={{
                            backgroundColor: theme.button_background_color,
                            borderRadius: 12,
                            padding: 15,
                            marginBottom: 20,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderWidth: 1,
                            borderColor: theme.border,
                        }}
                    >
                        <IconApp pack="FI" name="plus" size={18} color={theme.button_foreground_color} styles={{ marginRight: 10 }} />
                        <YambiText
                            text={strings.add_expense || "Add Expense"}
                            size="normal"
                            color="design"
                            style={{ fontWeight: '600' }}
                        />
                    </Pressable> */}

                    {/* Filters Toggle */}
                    <Pressable
                        onPress={() => setShow_filters_sheet(true)}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: theme.background,
                            padding: 14,
                            borderRadius: 14,
                            marginBottom: 12,
                            borderWidth: 1,
                            borderColor: activeFiltersCount > 0 ? theme.high_color : theme.border,
                        }}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                            <View style={{
                                backgroundColor: activeFiltersCount > 0 ? theme.high_color : theme.border,
                                borderRadius: 10,
                                width: 40,
                                height: 40,
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginRight: 10,
                            }}>
                                <IconApp pack="FI" name="filter" size={18} color={activeFiltersCount > 0 ? theme.badge_color : theme.text} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <YambiText 
                                    text={strings.filter || "Filter"} 
                                    size="normal" 
                                    color="high" 
                                    style={{ fontWeight: '700', fontSize: 16, marginBottom: 2 }} 
                                />
                                {activeFiltersCount > 0 ? (
                                    <YambiText 
                                        text={`${activeFiltersCount} ${activeFiltersCount === 1 ? ((strings as any).filter_active || 'filter active') : ((strings as any).filters_active || 'filters active')}`} 
                                        size="small" 
                                        color="gray" 
                                    />
                                ) : (
                                    <YambiText 
                                        text={(strings as any).tap_to_filter || "Tap to filter expenses"} 
                                        size="small" 
                                        color="gray" 
                                    />
                                )}
                            </View>
                            {activeFiltersCount > 0 && (
                                <View style={{
                                    backgroundColor: theme.high_color,
                                    borderRadius: 20,
                                    paddingHorizontal: 12,
                                    paddingVertical: 6,
                                    marginRight: 10,
                                }}>
                                    <YambiText text={activeFiltersCount.toString()} size="normal" color="white" style={{ fontWeight: '700', fontSize: 14 }} />
                                </View>
                            )}
                            <IconApp 
                                pack="FI" 
                                name="chevron-right" 
                                size={22} 
                                color={theme.high_color} 
                            />
                        </View>
                    </Pressable>

                    {/* Expenses List */}
                    {filteredExpenses.length > 0 ? (
                        <View>
                            <YambiText
                                text={strings.recent_expenses || "Recent Expenses"}
                                size="normal"
                                color="default"
                                bold
                                style={{ fontSize: 16, fontWeight: '700', marginBottom: 12 }}
                            />
                            <LegendList
                                data={filteredExpenses as never}
                                showsVerticalScrollIndicator={false}
                                renderItem={({ item, index }: { item: any, index: number }) => (
                                    <ExpenseItem
                                        item={item}
                                        index={index}
                                        onPress={() => SelectExpense(item)}
                                    />
                                )}
                                scrollEnabled={false}
                            />
                        </View>
                    ) : (
                        <View style={{
                            backgroundColor: theme.header_background_color,
                            borderRadius: 16,
                            padding: 30,
                            alignItems: 'center',
                            borderWidth: 1,
                            borderColor: theme.border,
                        }}>
                            <IconApp pack="FI" name="inbox" size={48} color={theme.gray} styles={{ marginBottom: 15 }} />
                            <YambiText
                                text={strings.no_expenses || "No expenses in this category yet"}
                                size="normal"
                                color="gray"
                                style={{ textAlign: 'center', marginBottom: 10 }}
                            />
                            <YambiText
                                text={strings.add_first_expense || "Tap the button above to add your first expense"}
                                size="small"
                                color="gray"
                                style={{ textAlign: 'center' }}
                            />
                        </View>
                    )}
                </View>
            </ScrollView>

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
                                    setCurrency_filter("");
                                    setDebt_filter(-1);
                                    setPayment_type_filter(-1);
                                }}
                                style={{ paddingHorizontal: 10, paddingVertical: 4 }}>
                                <TextSmallYambi text={strings.clear_selection || "Clear"} styles={{ color: theme.error }} />
                            </Pressable>
                        </View>
                    )}

                    {/* 1. Date Filter Calendar directly in bottom sheet */}
                    <View style={{
                        backgroundColor: theme.border + '30',
                        borderRadius: 16,
                        padding: 10,
                        marginBottom: 16,
                        borderWidth: 1,
                        borderColor: theme.border,
                    }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingHorizontal: 4 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <IconApp pack="FI" name="calendar" size={18} color={theme.high_color} />
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

                    {/* 2. Currency Filter */}
                    <View style={{
                        backgroundColor: theme.border + '30',
                        borderRadius: 16,
                        padding: 14,
                        marginBottom: 16,
                        borderWidth: 1,
                        borderColor: theme.border,
                    }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                            <IconApp pack="FI" name="dollar-sign" size={18} color={theme.high_color} />
                            <TextSmallYambiGray text={strings.currency || "Currency"} styles={{ marginLeft: 8 }} />
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
                                    backgroundColor: currency_filter === "" ? theme.high_color + "20" : 'transparent',
                                    borderWidth: 1,
                                    borderColor: currency_filter === "" ? theme.high_color : 'transparent',
                                }}>
                                <TextNormalYambi text={strings.all || "All"} bold={currency_filter === ""} styles={{ color: currency_filter === "" ? theme.high_color : theme.text }} />
                                {currency_filter === "" && (
                                    <IconApp pack="IO" name="checkmark-circle" size={18} color={theme.high_color} />
                                )}
                            </Pressable>

                            {/* List Currencies */}
                            {(show_all_currencies ? global_currencies : global_currencies.slice(0, 4)).map((cu: number) => {
                                const isSelected = currency_filter === cu.toString();
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
                                            backgroundColor: isSelected ? theme.high_color + "20" : 'transparent',
                                            borderWidth: 1,
                                            borderColor: isSelected ? theme.high_color : 'transparent',
                                        }}>
                                        <TextNormalYambi text={renderCurrency(cu, true)} bold={isSelected} styles={{ color: isSelected ? theme.high_color : theme.text }} />
                                        {isSelected && (
                                            <IconApp pack="IO" name="checkmark-circle" size={18} color={theme.high_color} />
                                        )}
                                    </Pressable>
                                );
                            })}

                            {/* "Show all" toggle if currencies > 4 */}
                            {global_currencies.length > 4 && (
                                <Pressable
                                    onPress={() => setShow_all_currencies(!show_all_currencies)}
                                    style={{
                                        paddingVertical: 8,
                                        alignItems: 'center',
                                        marginTop: 2,
                                    }}>
                                    <TextSmallYambi text={show_all_currencies ? (strings as any).see_less || "See less" : `${(strings as any).view_all || "View all"} (${global_currencies.length})`} styles={{ color: theme.high_color }} />
                                </Pressable>
                            )}
                        </View>
                    </View>

                    {/* 3. Debt Filter */}
                    <View style={{
                        backgroundColor: theme.border + '30',
                        borderRadius: 16,
                        padding: 14,
                        marginBottom: 16,
                        borderWidth: 1,
                        borderColor: theme.border,
                    }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                            <IconApp pack="FI" name="alert-circle" size={18} color={theme.high_color} />
                            <TextSmallYambiGray text={strings.debt || "Debt"} styles={{ marginLeft: 8 }} />
                        </View>

                        <View style={{ gap: 6 }}>
                            {[
                                { value: -1, label: strings.all || "All" },
                                { value: 1, label: strings.debt || "Debt" },
                                { value: 0, label: (strings as any).no_debt || "No Debt" },
                            ].map(opt => {
                                const isSelected = debt_filter === opt.value;
                                return (
                                    <Pressable
                                        key={opt.value}
                                        onPress={() => setDebt_filter(opt.value)}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            paddingVertical: 10,
                                            paddingHorizontal: 12,
                                            borderRadius: 10,
                                            backgroundColor: isSelected ? theme.high_color + "20" : 'transparent',
                                            borderWidth: 1,
                                            borderColor: isSelected ? theme.high_color : 'transparent',
                                        }}>
                                        <TextNormalYambi text={opt.label} bold={isSelected} styles={{ color: isSelected ? theme.high_color : theme.text }} />
                                        {isSelected && (
                                            <IconApp pack="IO" name="checkmark-circle" size={18} color={theme.high_color} />
                                        )}
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>

                    {/* 4. Payment Type Filter */}
                    <View style={{
                        backgroundColor: theme.border + '30',
                        borderRadius: 16,
                        padding: 14,
                        marginBottom: 16,
                        borderWidth: 1,
                        borderColor: theme.border,
                    }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                            <IconApp pack="FI" name="credit-card" size={18} color={theme.high_color} />
                            <TextSmallYambiGray text={strings.payment_type || "Payment Type"} styles={{ marginLeft: 8 }} />
                        </View>

                        <View style={{ gap: 6 }}>
                            {[
                                { value: -1, label: strings.all || "All" },
                                { value: 1, label: strings.cash || "Cash" },
                                { value: 2, label: strings.card || "Card" },
                                { value: 3, label: strings.bank || "Bank" },
                                { value: 0, label: (strings as any).not_paid || "Not Paid" },
                            ].map(opt => {
                                const isSelected = payment_type_filter === opt.value;
                                return (
                                    <Pressable
                                        key={opt.value}
                                        onPress={() => setPayment_type_filter(opt.value)}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            paddingVertical: 10,
                                            paddingHorizontal: 12,
                                            borderRadius: 10,
                                            backgroundColor: isSelected ? theme.high_color + "20" : 'transparent',
                                            borderWidth: 1,
                                            borderColor: isSelected ? theme.high_color : 'transparent',
                                        }}>
                                        <TextNormalYambi text={opt.label} bold={isSelected} styles={{ color: isSelected ? theme.high_color : theme.text }} />
                                        {isSelected && (
                                            <IconApp pack="IO" name="checkmark-circle" size={18} color={theme.high_color} />
                                        )}
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>
                </View>
            </BottomSheet>
        </View>
    );
};

export default CategoryExpenses;
