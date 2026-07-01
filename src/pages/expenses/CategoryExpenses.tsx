import { View, ScrollView, Pressable, Animated } from "react-native";
import { useAppSelector } from "../../store/app/hooks";
import { strings } from "../../lang/lang";
import { IconApp } from "../../components/app/IconApp";
import { YambiText } from "../../components/app/Text";
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
import DateRangePicker from "../../components/app/DateRangePicker";
import { formatAmount } from "../../util/formatAmount";
import RNPrint from 'react-native-print';
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

    // Calculate active filters count
    const activeFiltersCount = [
        date_start !== "" && date_end !== "",
        currency_filter !== "",
        debt_filter !== -1,
        payment_type_filter !== -1,
    ].filter(Boolean).length;

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

                                            await RNPrint.print({ html });
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
                            backgroundColor: theme.design_tip2,
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
                        <IconApp pack="FI" name="plus" size={18} color={theme.text_design2} styles={{ marginRight: 10 }} />
                        <YambiText
                            text={strings.add_expense || "Add Expense"}
                            size="normal"
                            color="design"
                            style={{ fontWeight: '600' }}
                        />
                    </Pressable> */}

                    {/* Filters Toggle */}
                    <Pressable
                        onPress={() => setShow_filters(!show_filters)}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: theme.border,
                            padding: 12,
                            borderRadius: 10,
                            marginBottom: 12,
                        }}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <IconApp pack="FI" name="filter" size={18} color={theme.high_color} />
                            <YambiText text={strings.filter || "Filter"} size="normal" color="default" style={{ marginLeft: 10, fontWeight: '600' }} />
                            {activeFiltersCount > 0 && (
                                <View style={{
                                    backgroundColor: theme.high_color,
                                    borderRadius: 10,
                                    paddingHorizontal: 8,
                                    paddingVertical: 2,
                                    marginLeft: 10,
                                }}>
                                    <YambiText text={activeFiltersCount.toString()} size="xsmall" color="white" style={{ fontSize: 12 }} />
                                </View>
                            )}
                        </View>
                        <IconApp pack="FI" name={show_filters ? "chevron-up" : "chevron-down"} size={20} color={theme.text} />
                    </Pressable>

                    {/* Filters */}
                    <Animated.View style={{
                        maxHeight: filtersHeight.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 600],
                        }),
                        opacity: filtersHeight,
                        overflow: 'hidden',
                        marginBottom: 15,
                    }}>
                        <View>
                            {/* Date Filter */}
                            <Pressable
                                onPress={() => {
                                    dispatch(setShowModalApp(true));
                                    setDate_selection_modal(true);
                                }}
                                style={{
                                    backgroundColor: theme.background,
                                    padding: 12,
                                    borderRadius: 10,
                                    marginBottom: 8,
                                    borderWidth: 1,
                                    borderColor: theme.border,
                                }}
                            >
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <View style={{ flex: 1 }}>
                                        <YambiText text={strings.filter_by_date || "Filter by date"} size="small" color="gray" style={{ marginBottom: 5 }} />
                                        <YambiText
                                            text={
                                                date_start !== "" && date_end !== ""
                                                    ? `${renderDateTime(date_start, 3, true)} - ${renderDateTime(date_end, 3, true)}`
                                                    : strings.all || "All"
                                            }
                                            size="normal"
                                            color="high"
                                        />
                                    </View>
                                    {date_start !== "" && date_end !== "" && (
                                        <Pressable
                                            onPress={(e) => {
                                                e.stopPropagation();
                                                setDate_start("");
                                                setDate_end("");
                                            }}
                                            style={{ padding: 5 }}
                                        >
                                            <IconApp pack="FI" name="x" size={18} color={theme.gray} />
                                        </Pressable>
                                    )}
                                </View>
                            </Pressable>

                            {/* Currency Filter */}
                            <Pressable
                                onPress={() => {
                                    dispatch(setShowModalApp(true));
                                    setShow_currency_filter(true);
                                }}
                                style={{
                                    backgroundColor: theme.background,
                                    padding: 12,
                                    borderRadius: 10,
                                    marginBottom: 8,
                                    borderWidth: 1,
                                    borderColor: theme.border,
                                }}
                            >
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <View style={{ flex: 1 }}>
                                        <YambiText text={strings.filter_by_currency || "Filter by currency"} size="small" color="gray" style={{ marginBottom: 5 }} />
                                        <YambiText
                                            text={
                                                currency_filter !== ""
                                                    ? renderCurrency(parseInt(currency_filter), true)
                                                    : strings.all || "All"
                                            }
                                            size="normal"
                                            color="high"
                                        />
                                    </View>
                                    {currency_filter !== "" && (
                                        <Pressable
                                            onPress={(e) => {
                                                e.stopPropagation();
                                                setCurrency_filter("");
                                            }}
                                            style={{ padding: 5 }}
                                        >
                                            <IconApp pack="FI" name="x" size={18} color={theme.gray} />
                                        </Pressable>
                                    )}
                                </View>
                            </Pressable>

                            {/* Debt Filter */}
                            <Pressable
                                onPress={() => {
                                    dispatch(setShowModalApp(true));
                                    setShow_debt_filter(true);
                                }}
                                style={{
                                    backgroundColor: theme.background,
                                    padding: 12,
                                    borderRadius: 10,
                                    marginBottom: 8,
                                    borderWidth: 1,
                                    borderColor: theme.border,
                                }}
                            >
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <View style={{ flex: 1 }}>
                                        <YambiText text={(strings as any).filter_by_debt || "Filter by debt"} size="small" color="gray" style={{ marginBottom: 5 }} />
                                        <YambiText
                                            text={
                                                debt_filter === -1
                                                    ? strings.all || "All"
                                                    : debt_filter === 1
                                                        ? strings.debt || "Debt"
                                                        : strings.no_debt || "No Debt"
                                            }
                                            size="normal"
                                            color="high"
                                        />
                                    </View>
                                    {debt_filter !== -1 && (
                                        <Pressable
                                            onPress={(e) => {
                                                e.stopPropagation();
                                                setDebt_filter(-1);
                                            }}
                                            style={{ padding: 5 }}
                                        >
                                            <IconApp pack="FI" name="x" size={18} color={theme.gray} />
                                        </Pressable>
                                    )}
                                </View>
                            </Pressable>

                            {/* Payment Type Filter */}
                            <Pressable
                                onPress={() => {
                                    dispatch(setShowModalApp(true));
                                    setShow_payment_type_filter(true);
                                }}
                                style={{
                                    backgroundColor: theme.background,
                                    padding: 12,
                                    borderRadius: 10,
                                    borderWidth: 1,
                                    borderColor: theme.border,
                                }}
                            >
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <View style={{ flex: 1 }}>
                                        <YambiText text={(strings as any).filter_by_payment_type || "Filter by payment type"} size="small" color="gray" style={{ marginBottom: 5 }} />
                                        <YambiText
                                            text={
                                                payment_type_filter === -1
                                                    ? strings.all || "All"
                                                    : payment_type_filter === 0
                                                        ? (strings as any).not_paid || "Not Paid"
                                                        : payment_type_filter === 1
                                                            ? strings.cash || "Cash"
                                                            : payment_type_filter === 2
                                                                ? strings.card || "Card"
                                                                : strings.bank || "Bank"
                                            }
                                            size="normal"
                                            color="high"
                                        />
                                    </View>
                                    {payment_type_filter !== -1 && (
                                        <Pressable
                                            onPress={(e) => {
                                                e.stopPropagation();
                                                setPayment_type_filter(-1);
                                            }}
                                            style={{ padding: 5 }}
                                        >
                                            <IconApp pack="FI" name="x" size={18} color={theme.gray} />
                                        </Pressable>
                                    )}
                                </View>
                            </Pressable>
                        </View>
                    </Animated.View>

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
                            backgroundColor: theme.design_tip1,
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

            {/* Date Range Modal */}
            {date_selection_modal && (
                <ModalApp
                    onCancel={() => {
                        dispatch(setShowModalApp(false));
                        setDate_selection_modal(false);
                        setDate_end("");
                        setDate_start("");
                    }}
                    onClose={() => {
                        dispatch(setShowModalApp(false));
                        setDate_selection_modal(false);
                    }}
                    singleButton={false}
                    paddings={false}
                    textAction={strings.confirm || "Confirm"}
                    onAction={() => {
                        dispatch(setShowModalApp(false));
                        setDate_selection_modal(false);
                    }}
                    title={strings.choose_date_range || "Choose a date range"}
                >
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
                        clearBtnTitle={strings.clear_selection || "Clear selection"}
                    />
                </ModalApp>
            )}

            {/* Currency Filter Modal */}
            {show_currency_filter && (
                <ModalApp
                    onClose={() => {
                        dispatch(setShowModalApp(false));
                        setShow_currency_filter(false);
                    }}
                    singleButton
                    title={strings.currency || "Currency"}
                >
                    <View style={{ width: '100%' }}>
                        <Pressable
                            onPress={() => {
                                setCurrency_filter("");
                                dispatch(setShowModalApp(false));
                                setShow_currency_filter(false);
                            }}
                            style={{
                                backgroundColor: theme.background,
                                flex: 1,
                                flexDirection: 'row',
                                borderRadius: 8,
                                paddingHorizontal: 15,
                                height: 50,
                                alignItems: 'center',
                                borderBottomWidth: 1,
                                borderColor: theme.border,
                                marginBottom: 8
                            }}
                        >
                            <YambiText text={strings.all || "All"} size="normal" color="default" style={{ flex: 1, fontStyle: 'italic' }} />
                        </Pressable>
                        <LegendList
                            data={global_currencies as never}
                            showsVerticalScrollIndicator={true}
                            renderItem={({ item, index }: { item: number, index: number }) => (
                                <Pressable
                                    onPress={() => {
                                        setCurrency_filter(item.toString());
                                        dispatch(setShowModalApp(false));
                                        setShow_currency_filter(false);
                                    }}
                                    style={{
                                        backgroundColor: theme.background,
                                        flex: 1,
                                        flexDirection: 'row',
                                        borderRadius: 8,
                                        paddingHorizontal: 15,
                                        height: 50,
                                        alignItems: 'center',
                                        borderBottomWidth: 1,
                                        borderColor: theme.border
                                    }}
                                >
                                    <YambiText text={(index + 1) + "."} size="normal" color="default" style={{ width: 35 }} />
                                    <YambiText text={renderCurrency(item, true)} size="normal" color="default" style={{ flex: 1 }} />
                                </Pressable>
                            )}
                        />
                    </View>
                </ModalApp>
            )}

            {/* Debt Filter Modal */}
            {show_debt_filter && (
                <ModalApp
                    onClose={() => {
                        dispatch(setShowModalApp(false));
                        setShow_debt_filter(false);
                    }}
                    singleButton
                    title={strings.debt || "Debt"}
                >
                    <View style={{ width: '100%' }}>
                        <Pressable
                            onPress={() => {
                                setDebt_filter(-1);
                                dispatch(setShowModalApp(false));
                                setShow_debt_filter(false);
                            }}
                            style={{
                                backgroundColor: theme.background,
                                flex: 1,
                                flexDirection: 'row',
                                borderRadius: 8,
                                paddingHorizontal: 15,
                                height: 50,
                                alignItems: 'center',
                                borderBottomWidth: 1,
                                borderColor: theme.border,
                                marginBottom: 8
                            }}
                        >
                            <YambiText text={strings.all || "All"} size="normal" color="default" style={{ flex: 1 }} />
                        </Pressable>
                        <Pressable
                            onPress={() => {
                                setDebt_filter(1);
                                dispatch(setShowModalApp(false));
                                setShow_debt_filter(false);
                            }}
                            style={{
                                backgroundColor: theme.background,
                                flex: 1,
                                flexDirection: 'row',
                                borderRadius: 8,
                                paddingHorizontal: 15,
                                height: 50,
                                alignItems: 'center',
                                borderBottomWidth: 1,
                                borderColor: theme.border,
                                marginBottom: 8
                            }}
                        >
                            <YambiText text={strings.debt || "Debt"} size="normal" color="default" style={{ flex: 1 }} />
                        </Pressable>
                        <Pressable
                            onPress={() => {
                                setDebt_filter(0);
                                dispatch(setShowModalApp(false));
                                setShow_debt_filter(false);
                            }}
                            style={{
                                backgroundColor: theme.background,
                                flex: 1,
                                flexDirection: 'row',
                                borderRadius: 8,
                                paddingHorizontal: 15,
                                height: 50,
                                alignItems: 'center',
                                borderBottomWidth: 1,
                                borderColor: theme.border
                            }}
                        >
                            <YambiText text={(strings as any).no_debt || "No Debt"} size="normal" color="default" style={{ flex: 1 }} />
                        </Pressable>
                    </View>
                </ModalApp>
            )}

            {/* Payment Type Filter Modal */}
            {show_payment_type_filter && (
                <ModalApp
                    onClose={() => {
                        dispatch(setShowModalApp(false));
                        setShow_payment_type_filter(false);
                    }}
                    singleButton
                    title={strings.payment_type || "Payment Type"}
                >
                    <View style={{ width: '100%' }}>
                        <Pressable
                            onPress={() => {
                                setPayment_type_filter(-1);
                                dispatch(setShowModalApp(false));
                                setShow_payment_type_filter(false);
                            }}
                            style={{
                                backgroundColor: theme.background,
                                flex: 1,
                                flexDirection: 'row',
                                borderRadius: 8,
                                paddingHorizontal: 15,
                                height: 50,
                                alignItems: 'center',
                                borderBottomWidth: 1,
                                borderColor: theme.border,
                                marginBottom: 8
                            }}
                        >
                            <YambiText text={strings.all || "All"} size="normal" color="default" style={{ flex: 1 }} />
                        </Pressable>
                        <Pressable
                            onPress={() => {
                                setPayment_type_filter(0);
                                dispatch(setShowModalApp(false));
                                setShow_payment_type_filter(false);
                            }}
                            style={{
                                backgroundColor: theme.background,
                                flex: 1,
                                flexDirection: 'row',
                                borderRadius: 8,
                                paddingHorizontal: 15,
                                height: 50,
                                alignItems: 'center',
                                borderBottomWidth: 1,
                                borderColor: theme.border,
                                marginBottom: 8
                            }}
                        >
                            <YambiText text={(strings as any).not_paid || "Not Paid"} size="normal" color="default" style={{ flex: 1 }} />
                        </Pressable>
                        <Pressable
                            onPress={() => {
                                setPayment_type_filter(1);
                                dispatch(setShowModalApp(false));
                                setShow_payment_type_filter(false);
                            }}
                            style={{
                                backgroundColor: theme.background,
                                flex: 1,
                                flexDirection: 'row',
                                borderRadius: 8,
                                paddingHorizontal: 15,
                                height: 50,
                                alignItems: 'center',
                                borderBottomWidth: 1,
                                borderColor: theme.border,
                                marginBottom: 8
                            }}
                        >
                            <YambiText text={strings.cash || "Cash"} size="normal" color="default" style={{ flex: 1 }} />
                        </Pressable>
                        <Pressable
                            onPress={() => {
                                setPayment_type_filter(2);
                                dispatch(setShowModalApp(false));
                                setShow_payment_type_filter(false);
                            }}
                            style={{
                                backgroundColor: theme.background,
                                flex: 1,
                                flexDirection: 'row',
                                borderRadius: 8,
                                paddingHorizontal: 15,
                                height: 50,
                                alignItems: 'center',
                                borderBottomWidth: 1,
                                borderColor: theme.border,
                                marginBottom: 8
                            }}
                        >
                            <YambiText text={strings.card || "Card"} size="normal" color="default" style={{ flex: 1 }} />
                        </Pressable>
                        <Pressable
                            onPress={() => {
                                setPayment_type_filter(3);
                                dispatch(setShowModalApp(false));
                                setShow_payment_type_filter(false);
                            }}
                            style={{
                                backgroundColor: theme.background,
                                flex: 1,
                                flexDirection: 'row',
                                borderRadius: 8,
                                paddingHorizontal: 15,
                                height: 50,
                                alignItems: 'center',
                                borderBottomWidth: 1,
                                borderColor: theme.border
                            }}
                        >
                            <YambiText text={strings.bank || "Bank"} size="normal" color="default" style={{ flex: 1 }} />
                        </Pressable>
                    </View>
                </ModalApp>
            )}
        </View>
    );
};

export default CategoryExpenses;
