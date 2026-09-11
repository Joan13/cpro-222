import { View, ScrollView, Pressable, TextInput, Animated, RefreshControl } from "react-native";
import { useState, useRef, useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from "../../store/app/hooks";
import { strings } from "../../lang/lang";
import { IconApp } from "../../components/app/IconApp";
import { YambiText, TextNormalYambi, TextNormalYambiGray, TextSmallYambi, TextSmallYambiGray, TextNormalYambiHighColor } from "../../components/app/Text";
import { NavProps, TExpense } from "../../types/types";
import { useQuery, useRealm } from "@realm/react";
import { Expenses, BusinessUsers, UserSellsPoints } from "../../store/database/Models";
import { LegendList } from '@legendapp/list';
import ExpenseItem from "../../components/lists/expenses/ExpenseItem";
import ExpensesCategoriesItem from "../../components/lists/expenses/ExpensesCategoriesItem";
import { setTitle, setShowModalApp, setExpensesOpened } from "../../store/reducers/appSlice";
import { useEffect } from "react";
import moment from "moment";
import { global_currencies, renderCurrency, renderDateTime, SocketApp, remote_host } from "../../../GlobalVariables";
import axios from "axios";
import ModalApp from "../../components/app/ModalApp";
import BottomSheet from "../../components/app/BottomSheet";
import ButtonNormal from "../../components/app/ButtonNormal";
import DateRangePicker from "../../components/app/DateRangePicker";
import { formatAmount } from "../../util/formatAmount";
import * as Print from 'expo-print';
import Reanimated, { FadeInUp, BounceIn } from "react-native-reanimated";

const GetExpenses = ({ navigation, route }: NavProps) => {
    const theme = useAppSelector(state => state.app_theme.colors);
    const app_theme = useAppSelector(state => state.app_theme);
    const app_language = useAppSelector(state => state.persisted_app.langApp);
    const app_description = useAppSelector(state => state.persisted_app.app_description);
    const expenses_opened = useAppSelector(state => state.app.expenses_opened);
    const title = useAppSelector(state => state.app.title);
    const dispatch = useAppDispatch();

    // Context filter parameters
    const { flag = 0, business_id = "", sales_point_id = "" } = route?.params || {};

    // Filter states
    const [date_start, setDate_start] = useState<string>("");
    const [date_end, setDate_end] = useState<string>("");
    const [category_filter, setCategory_filter] = useState<number>(-1); // -1 = all
    const [currency_filter, setCurrency_filter] = useState<string>("");
    const [debt_filter, setDebt_filter] = useState<number>(-1); // -1 = all, 0 = no debt, 1 = debt
    const [payment_type_filter, setPayment_type_filter] = useState<number>(-1); // -1 = all, 0 = undefined, 1 = cash, 2 = card, 3 = bank
    const [show_filters, setShow_filters] = useState<boolean>(false);
    const [show_filters_sheet, setShow_filters_sheet] = useState<boolean>(false);
    const [show_all_categories, setShow_all_categories] = useState<boolean>(false);
    const [show_all_currencies, setShow_all_currencies] = useState<boolean>(false);
    const [date_selection_modal, setDate_selection_modal] = useState<boolean>(false);
    const [show_category_filter, setShow_category_filter] = useState<boolean>(false);
    const [show_currency_filter, setShow_currency_filter] = useState<boolean>(false);
    const [show_debt_filter, setShow_debt_filter] = useState<boolean>(false);
    const [show_payment_type_filter, setShow_payment_type_filter] = useState<boolean>(false);
    const [showEnterCurrentPassword, setShowEnterCurrentPassword] = useState<boolean>(false);
    const [showSuccessPasswordEntered, setShowSuccessPasswordEntered] = useState<boolean>(false);
    const [passwordInput, setPasswordInput] = useState<string>("");
    const passwordInputRef = useRef<TextInput>(null);
    const filtersHeight = useRef(new Animated.Value(0)).current;
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const realm = useRealm();
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

    const LLg = () => {
        if (app_language === "sw_drc") {
            return "fr";
        } else {
            return app_language;
        }
    };

    const allExpenses = useQuery(
        Expenses, expenses => {
            let query = expenses.filtered('expense_active == $0', 1);
            if (flag === 1) {
                query = query.filtered('business_id == $0', business_id);
            } else if (flag === 2) {
                query = query.filtered('sales_point_id == $0', sales_point_id);
            } else {
                query = query.filtered('phone_number == $0', user_data.phone_number);
            }
            return query.sorted('createdAt', true);
        }, [flag, business_id, sales_point_id, user_data.phone_number]);

    // Filter expenses based on all criteria
    const filteredExpenses = allExpenses.filter(expense => {
        let dateMatch = true;
        let categoryMatch = true;
        let currencyMatch = true;
        let debtMatch = true;
        let paymentTypeMatch = true;

        // Date filter
        if (date_start !== "" && date_end !== "") {
            const expenseDate = moment(expense.createdAt).format("YYYY-MM-DD");
            dateMatch = expenseDate >= date_start && expenseDate <= date_end;
        }

        // Category filter
        if (category_filter !== -1) {
            categoryMatch = expense.category === category_filter;
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

        return dateMatch && categoryMatch && currencyMatch && debtMatch && paymentTypeMatch;
    });

    const expenses = filteredExpenses;

    useEffect(() => {
        if (title === strings.expenses || title === strings.business_expenses || title === strings.pos_expenses) {
            RequestExpensesPassword();
        }
    }, [title]);

    const RequestExpensesPassword = () => {
        if (app_description.require_password_expenses) {
            if (!expenses_opened) {
                setShowEnterCurrentPassword(true);
            }
        }
    }

    const SETCP = (cpp: string) => {
        setPasswordInput(cpp);
        setShowSuccessPasswordEntered(false);

        if (cpp.length === 6 && cpp === app_description.password_expenses) {
            setShowSuccessPasswordEntered(true);
            setTimeout(() => {
                setShowEnterCurrentPassword(false);
                setPasswordInput("");
                dispatch(setExpensesOpened(true));
            }, 500);
        }
    }

    // Focus input when password modal opens
    useEffect(() => {
        if (showEnterCurrentPassword) {
            setTimeout(() => {
                passwordInputRef.current?.focus();
            }, 100);
        } else {
            setPasswordInput("");
        }
    }, [showEnterCurrentPassword]);

    // Animate filters expand/collapse
    useEffect(() => {
        Animated.timing(filtersHeight, {
            toValue: show_filters ? 1 : 0,
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, [show_filters]);

    // Calculate active filters count
    const activeFiltersCount = [
        date_start !== "" && date_end !== "",
        category_filter !== -1,
        currency_filter !== "",
        debt_filter !== -1,
        payment_type_filter !== -1,
    ].filter(Boolean).length;



    // Calculate filtered total
    const filteredTotal = filteredExpenses.reduce((sum, exp) => sum + (parseFloat(exp.amount || "0") * (exp.quantity || 1)), 0);

    // Print expenses function
    const PrintExpenses = async () => {
        if (filteredExpenses.length === 0) {
            return;
        }

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

        const expenses_categories = strings.expenses_categories || [];
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
                    <h1>${strings.expenses || "Expenses"}</h1>
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
                                    <th>${strings.category || "Category"}</th>
                                    <th>${strings.payment_type || "Payment"}</th>
                                    <th>${strings.date || "Date"}</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${exps.map(exp => {
            const category = expenses_categories.find(c => c.id === exp.category);
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
                                            <td>${category?.name || ""}</td>
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
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);

        try {
            // Sync local expenses that haven't been uploaded
            const localExpenses = realm.objects('Expenses').filtered('uploaded == $0', 0);
            if (localExpenses.length > 0) {
                const expensesToSync = Array.from(localExpenses).map(expense => ({
                    _id: expense._id,
                    title: expense.title,
                    business_id: expense.business_id,
                    sales_point_id: expense.sales_point_id,
                    phone_number: expense.phone_number,
                    amount: expense.amount,
                    currency: expense.currency,
                    description: expense.description,
                    category: expense.category,
                    payment_type: expense.payment_type,
                    debt: expense.debt,
                    expense_active: expense.expense_active,
                    wallet: expense.wallet,
                    uploaded: expense.uploaded,
                    createdAt: expense.createdAt,
                    updatedAt: expense.updatedAt
                }));

                // Emit to server for sync
                SocketApp.emit("newExpenses", JSON.stringify({ phone_number: user_data.phone_number, items: expensesToSync }));
            }

            // Fetch expenses from server
            const response = await axios.post(remote_host + '/yambi/API/get_expenses', {
                phone_number: user_data.phone_number,
                flag: flag,
                business_id: business_id,
                sales_point_id: sales_point_id
            });

            if (response.data.success === "1" && response.data.data) {
                const serverExpenses = response.data.data;

                // Insert/update expenses in Realm database
                realm.write(() => {
                    for (let i in serverExpenses) {
                        const expense = serverExpenses[i];
                        const expenseData = {
                            _id: expense._id,
                            title: expense.title || "",
                            business_id: expense.business_id || "",
                            sales_point_id: expense.sales_point_id || "",
                            phone_number: expense.phone_number || user_data.phone_number,
                            amount: expense.amount || "0",
                            currency: parseInt(expense.currency) || 1,
                            description: expense.description || "",
                            category: parseInt(expense.category) || 0,
                            payment_type: parseInt(expense.payment_type) || 1,
                            debt: parseInt(expense.debt) || 0,
                            expense_active: parseInt(expense.expense_active) || 1,
                            wallet: parseInt(expense.wallet) || 1,
                            uploaded: 1, // Mark as uploaded since it came from server
                            createdAt: expense.createdAt || moment(new Date()).format(),
                            updatedAt: expense.updatedAt || moment(new Date()).format()
                        };

                        try {
                            realm.create('Expenses', expenseData, true); // true = update if exists
                        } catch (error) {
                            console.log("Error creating expense in Realm: " + error);
                        }
                    }
                });
            }
        } catch {
        } finally {
            setRefreshing(false);
        }
    }, [realm, user_data.phone_number, flag, business_id, sales_point_id]);

    const expenses_categories = strings.expenses_categories || [];

    const SelectExpense = (expense: any) => {
        navigation.navigate('Expense', { expense_id: expense._id });
    }

    // Keep getCategoryIcon and getCategoryColor for use in filter modals
    const getCategoryIcon = (categoryId: number) => {
        const icons: { [key: number]: string } = {
            1: "home",
            2: "shopping-bag",
            3: "truck",
            4: "heart",
            5: "book",
            6: "user",
            7: "coffee",
            8: "shopping-cart",
            9: "briefcase",
            10: "credit-card",
            11: "shield",
            12: "heart",
            13: "gift"
        };
        return icons[categoryId] || "dollar-sign";
    };

    const getCategoryColor = (categoryId: number) => {
        const colors: { [key: number]: string } = {
            1: "#4A90E2", // Blue for Housing
            2: "#50C878", // Green for Food
            3: "#FF6B6B", // Red for Transportation
            4: "#FF8C42", // Orange for Health
            5: "#9B59B6", // Purple for Education
            6: "#E91E63", // Pink for Personal
            7: "#00BCD4", // Cyan for Leisure
            8: "#FFC107", // Amber for Shopping
            9: "#607D8B", // Blue Grey for Work
            10: "#795548", // Brown for Finance
            11: "#3F51B5", // Indigo for Insurance
            12: "#FF9800", // Deep Orange for Pets
            13: "#4CAF50"  // Green for Donations
        };
        return colors[categoryId] || theme.high_color;
    };

    // Show password modal if required and not opened
    if (app_description.require_password_expenses && !expenses_opened && showEnterCurrentPassword) {
        return (
            <View style={{
                flex: 1,
                justifyContent: 'center',
                backgroundColor: theme.background,
                borderColor: theme.border,
                borderTopWidth: 1
            }}>
                <Reanimated.View
                    entering={FadeInUp.delay(100)}
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        paddingHorizontal: 30,
                    }}>
                    {/* Icon Container */}
                    <Reanimated.View
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
                    </Reanimated.View>

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
                        text={strings.current_expenses_tab_password}
                        styles={{
                            textAlign: 'center',
                            marginBottom: 40
                        }}
                    />

                    {/* Success Indicator */}
                    {showSuccessPasswordEntered && (
                        <Reanimated.View
                            entering={BounceIn}
                            style={{
                                marginBottom: 20,
                                alignItems: 'center'
                            }}>
                            <IconApp name="check-circle" pack='FA' size={32} color={theme.success} />
                        </Reanimated.View>
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
                                <Reanimated.View
                                    key={index}
                                    entering={FadeInUp.delay(300 + index * 50)}
                                    style={{
                                        width: 50,
                                        height: 60,
                                        borderRadius: 12,
                                        borderWidth: 2,
                                        borderColor: passwordInput.length === index
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
                                        <Reanimated.View entering={BounceIn}>
                                            <IconApp
                                                name="circle"
                                                pack='FA'
                                                size={12}
                                                color={passwordInput.length > index ? theme.success : theme.high_color}
                                            />
                                        </Reanimated.View>
                                    )}
                                </Reanimated.View>
                            ))}
                        </View>

                        {/* Hidden TextInput for actual input */}
                        <TextInput
                            ref={passwordInputRef}
                            style={{
                                position: 'absolute',
                                width: '100%',
                                height: 60,
                                opacity: 0,
                            }}
                            value={passwordInput}
                            onChangeText={SETCP}
                            keyboardType="number-pad"
                            maxLength={6}
                            secureTextEntry={false}
                            autoFocus
                        />
                    </View>

                    {/* Helper Text */}
                    {passwordInput.length > 0 && (
                        <TextNormalYambiGray
                            text={`${passwordInput.length}/6`}
                            styles={{
                                textAlign: 'center',
                                marginTop: 10
                            }}
                        />
                    )}
                </Reanimated.View>
            </View>
        );
    }

    return (
        <View style={{
            backgroundColor: theme.background,
            flex: 1,
            borderColor: theme.border,
            borderTopWidth: 1
        }}>
            <ScrollView
                style={{ flex: 1 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={theme.high_color}
                    />
                }
            >
                <View style={{ paddingHorizontal: 12, paddingTop: 12, paddingBottom: 50 }}>
                    {/* Engaging Header Text - Only show if no expenses */}
                    {expenses.length === 0 && (
                        <View style={{
                            backgroundColor: theme.background,
                            borderRadius: 14,
                            padding: 15,
                            marginBottom: 15,
                            borderWidth: 1,
                            borderColor: theme.border,
                        }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                                <IconApp pack="FI" name="trending-up" size={22} color={theme.high_color} styles={{ marginRight: 10 }} />
                                <YambiText
                                    text={strings.track_your_expenses || "Track Your Daily Expenses"}
                                    size="big"
                                    color="high"
                                    style={{ fontSize: 20, fontWeight: '700', flex: 1 }}
                                />
                            </View>
                            <YambiText
                                text={strings.expenses_description || "Start entering your daily expenses to track your routine and manage your wallet effectively. Stay on top of your spending habits and make better financial decisions."}
                                size="normal"
                                color="gray"
                                style={{ lineHeight: 20, marginTop: 6 }}
                            />
                        </View>
                    )}

                    {/* Expenses Overview Header - Show if there are expenses */}
                    {allExpenses.length > 0 && (
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
                                    backgroundColor: theme.high_color + "20",
                                    borderRadius: 50,
                                    width: 50,
                                    height: 50,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginRight: 12
                                }}>
                                    <IconApp pack="FI" name="dollar-sign" size={26} color={theme.high_color} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <YambiText
                                            text={strings.expenses || "Expenses"}
                                            size="normal"
                                            color="default"
                                            style={{ fontSize: 16, fontWeight: '700', marginBottom: 3 }}
                                            bold
                                        />
                                        <Pressable
                                            onPress={PrintExpenses}
                                            style={{
                                                height: 30,
                                                width: 30,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <IconApp pack="FI" name="printer" size={18} color={theme.high_color} />
                                        </Pressable>
                                    </View>
                                    <YambiText
                                        text={`${filteredExpenses.length} ${strings.expenses || 'expenses'}`}
                                        size="small"
                                        color="gray"
                                    />
                                </View>
                            </View>
                            {(() => {
                                // Calculate currency statistics
                                const currency_stats: { [key: number]: { amount: number, count: number } } = {};

                                filteredExpenses.forEach(expense => {
                                    const currency = expense.currency;
                                    if (!currency_stats[currency]) {
                                        currency_stats[currency] = { amount: 0, count: 0 };
                                    }
                                    currency_stats[currency].amount += parseFloat(expense.amount || "0") * (expense.quantity || 1);
                                    currency_stats[currency].count++;
                                });

                                return Object.keys(currency_stats).length > 0 ? (
                                    <View style={{ marginTop: 12 }}>
                                        {Object.entries(currency_stats).map(([currency, data]) => (
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
                                ) : null;
                            })()}
                        </View>
                    )}

                    {/* Filters Section - Only show if there are expenses */}
                    {allExpenses.length > 0 && (
                        <View style={{ marginBottom: 0 }}>
                            {/* Filters Toggle - Impressive Design */}
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
                        </View>
                    )}

                    {/* Recent Expenses - Show before categories */}
                    {expenses.length > 0 && (
                        <View style={{ marginBottom: 15 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <YambiText
                                    text={strings.recent_expenses || "Recent Expenses"}
                                    size="normal"
                                    color="default"
                                    bold
                                    style={{ fontSize: 16, fontWeight: '700' }}
                                />
                                <YambiText text={`${expenses.length} ${strings.total || 'total'}`} size="small" color="gray" />
                            </View>

                            <LegendList
                                data={expenses.slice(0, 10) as never}
                                keyExtractor={(item: TExpense) => item._id}
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
                    )}

                    {/* Expense Categories */}
                    <View style={{ marginBottom: 15 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <YambiText
                                text={strings.expense_categories || "Expense Categories"}
                                size="normal"
                                color="default"
                                bold
                                style={{ fontSize: 16, fontWeight: '700' }}
                            />
                            {/* <Pressable
                                onPress={() => navigation.navigate('AddExpense', { business_id, sales_point_id })}
                                style={{
                                    backgroundColor: theme.button_background_color,
                                    paddingHorizontal: 12,
                                    paddingVertical: 6,
                                    borderRadius: 8,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                }}
                            >
                                <IconApp pack="FI" name="plus" size={14} color={theme.button_foreground_color} styles={{ marginRight: 6 }} />
                                <YambiText text={strings.add_expense} style={{ fontSize: 14 }} color="design"  />
                            </Pressable> */}
                        </View>

                        <LegendList
                            data={expenses_categories as never}
                            keyExtractor={(item: any) => item.id.toString()}
                            showsVerticalScrollIndicator={false}
                            extraData={app_theme.name}
                            renderItem={({ item }: { item: any }) => (
                                <ExpensesCategoriesItem
                                    item={item}
                                    expenses={expenses}
                                    navigation={navigation}
                                    flag={flag}
                                    business_id={business_id}
                                    sales_point_id={sales_point_id}
                                />
                            )}
                            scrollEnabled={false}
                        />
                    </View>

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
                                    setCategory_filter(-1);
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

                    {/* 2. Category Filter */}
                    <View style={{
                        backgroundColor: theme.border + '30',
                        borderRadius: 16,
                        padding: 14,
                        marginBottom: 16,
                        borderWidth: 1,
                        borderColor: theme.border,
                    }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                            <IconApp pack="FI" name="tag" size={18} color={theme.high_color} />
                            <TextSmallYambiGray text={strings.category || "Category"} styles={{ marginLeft: 8 }} />
                        </View>

                        <View style={{ gap: 6 }}>
                            {/* "All" Option */}
                            <Pressable
                                onPress={() => setCategory_filter(-1)}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    paddingVertical: 10,
                                    paddingHorizontal: 12,
                                    borderRadius: 10,
                                    backgroundColor: category_filter === -1 ? theme.high_color + "20" : 'transparent',
                                    borderWidth: 1,
                                    borderColor: category_filter === -1 ? theme.high_color : 'transparent',
                                }}>
                                <TextNormalYambi text={strings.all || "All"} bold={category_filter === -1} styles={{ color: category_filter === -1 ? theme.high_color : theme.text }} />
                                {category_filter === -1 && (
                                    <IconApp pack="IO" name="checkmark-circle" size={18} color={theme.high_color} />
                                )}
                            </Pressable>

                            {/* List Categories */}
                            {(show_all_categories ? expenses_categories : expenses_categories.slice(0, 4)).map((catItem: any) => {
                                const isSelected = category_filter === catItem.id;
                                const categoryColor = getCategoryColor(catItem.id);
                                const categoryIcon = getCategoryIcon(catItem.id);
                                return (
                                    <Pressable
                                        key={catItem.id}
                                        onPress={() => setCategory_filter(catItem.id)}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            paddingVertical: 8,
                                            paddingHorizontal: 12,
                                            borderRadius: 10,
                                            backgroundColor: isSelected ? theme.high_color + "20" : 'transparent',
                                            borderWidth: 1,
                                            borderColor: isSelected ? theme.high_color : 'transparent',
                                        }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <View style={{
                                                backgroundColor: categoryColor + "20",
                                                borderRadius: 6,
                                                width: 28,
                                                height: 28,
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                marginRight: 10
                                            }}>
                                                <IconApp pack="FI" name={categoryIcon} size={14} color={categoryColor} />
                                            </View>
                                            <TextNormalYambi text={catItem.name} bold={isSelected} styles={{ color: isSelected ? theme.high_color : theme.text }} />
                                        </View>
                                        {isSelected && (
                                            <IconApp pack="IO" name="checkmark-circle" size={18} color={theme.high_color} />
                                        )}
                                    </Pressable>
                                );
                            })}

                            {/* "Show all" toggle button if categories > 4 */}
                            {expenses_categories.length > 4 && (
                                <Pressable
                                    onPress={() => setShow_all_categories(!show_all_categories)}
                                    style={{
                                        paddingVertical: 8,
                                        alignItems: 'center',
                                        marginTop: 2,
                                    }}>
                                    <TextSmallYambi text={show_all_categories ? (strings as any).see_less || "See less" : `${(strings as any).view_all || "View all"} (${expenses_categories.length})`} styles={{ color: theme.high_color }} />
                                </Pressable>
                            )}
                        </View>
                    </View>

                    {/* 3. Currency Filter */}
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

                    {/* 4. Debt Filter */}
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

                    {/* 5. Payment Type Filter */}
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

export default GetExpenses;
