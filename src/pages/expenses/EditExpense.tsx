import { Pressable, View, ScrollView, TextInput } from "react-native";
import { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from "../../store/app/hooks";
import { strings } from "../../lang/lang";
import ButtonNormal from "../../components/app/ButtonNormal";
import { IconApp } from "../../components/app/IconApp";
import { YambiText } from "../../components/app/Text";
import ModalApp from "../../components/app/ModalApp";
import BottomSheet from "../../components/app/BottomSheet";
import SwitchApp from "../../components/app/SwitchApp";
import { LegendList } from '@legendapp/list';
import { setLoadingButton, setShowModalApp } from "../../store/reducers/appSlice";
import { renderCurrency, SocketApp, global_currencies } from "../../../GlobalVariables";
import { NavProps } from "../../types/types";
import { useRealm, useQuery, useObject } from "@realm/react";
import { Expenses, UserBusinesses, UserSellsPoints, BusinessUsers } from "../../store/database/Models";
import moment from "moment";

const EditExpense = ({ route, navigation }: NavProps) => {
    const { expense_id } = route.params;

    const theme = useAppSelector(state => state.app_theme.colors);
    const user_data = useAppSelector(state => state.user_data);
    const dispatch = useAppDispatch();
    const realm = useRealm();

    const expense = useObject(Expenses, expense_id);

    if (expense === null) return null;

    const isAdmin = user_data?.user_level === 2;

    const userBusinessAccess = useQuery(
        BusinessUsers, users => {
            return users.filtered('user == $0 && user_active == $1', user_data.phone_number, 1);
        }, [user_data.phone_number]);

    const isOwner = useMemo(() => {
        if (isAdmin) return true;
        if (!expense) return false;

        // Creator
        if (expense.phone_number === user_data.phone_number) return true;

        // Business owner level 1
        if (expense.business_id) {
            const membership = userBusinessAccess.find(access => access.business_id === expense.business_id);
            if (membership && membership.level === 1) return true;
        }
        return false;
    }, [userBusinessAccess, expense, user_data, isAdmin]);

    if (!isOwner) {
        return (
            <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                <IconApp pack="FI" name="shield" size={60} color={theme.error} styles={{ marginBottom: 15 }} />
                <YambiText text={strings.access_denied} size="big" color="error" style={{ fontWeight: '700', marginBottom: 10 }} />
                <YambiText text={strings.business_level_error || "You do not have permission to edit or delete this expense."} size="normal" color="gray" style={{ textAlign: 'center' }} />
            </View>
        );
    }

    const [title, setTitle] = useState<string>(expense.title);
    const [amount, setAmount] = useState<string>(expense.amount);
    const [quantity, setQuantity] = useState<string>((expense.quantity || 1).toString());
    const [currency, setCurrency] = useState<number>(expense.currency);
    const [category, setCategory] = useState<number>(expense.category);
    const [description, setDescription] = useState<string>(expense.description);
    // If expense has debt, payment_type should be 0, otherwise use expense.payment_type (or default to 1 if 0)
    const [payment_type, setPayment_type] = useState<number>(expense.debt === 1 ? 0 : (expense.payment_type === 0 ? 1 : expense.payment_type));
    const [debt, setDebt] = useState<number>(expense.debt);
    const [wallet, setWallet] = useState<number>(expense.wallet);
    const [business_id, setBusiness_id] = useState<string>(expense.business_id);
    const [sales_point_id, setSales_point_id] = useState<string>(expense.sales_point_id);
    const [showError, setShowError] = useState<boolean>(false);
    const [showCurrencies, setShowCurrencies] = useState<boolean>(false);
    const [showCategories, setShowCategories] = useState<boolean>(false);
    const [showWallets, setShowWallets] = useState<boolean>(false);
    const [showBusinesses, setShowBusinesses] = useState<boolean>(false);
    const [showSalesPoints, setShowSalesPoints] = useState<boolean>(false);

    // Check if user owns businesses
    const userBusinesses = useQuery(
        UserBusinesses, businesses => {
            return businesses.filtered('phone_number == $0 && business_active == $1', user_data.phone_number, 1);
        }, []);

    // Get all sales points for user's businesses
    const allSalesPoints = useQuery(
        UserSellsPoints, points => {
            return points.filtered('phone_number == $0 && sells_point_active == $1', user_data.phone_number, 1);
        }, []);

    // Get sales points for selected business (or all if no business selected)
    const salesPoints = business_id
        ? allSalesPoints.filtered('business_id == $0', business_id)
        : allSalesPoints;

    const expenses_categories = strings.expenses_categories || [];
    const wallets = Array.from({ length: 10 }, (_, i) => i + 1);

    const UpdateExpense = () => {
        const qtyNum = parseInt(quantity || "1");
        if (title === "" || amount === "" || category === 0 || parseFloat(amount) <= 0 || qtyNum <= 0) {
            dispatch(setShowModalApp(true));
            setShowError(true);
            return;
        }

        dispatch(setLoadingButton(true));

        const updatedExpense = {
            _id: expense._id,
            title: title || "",
            business_id: business_id || "",
            sales_point_id: sales_point_id || "",
            phone_number: expense.phone_number || "",
            amount: amount || "",
            quantity: qtyNum,
            currency: currency || 1,
            description: description || "",
            category: category || 0,
            payment_type: payment_type || 1,
            debt: debt || 0,
            expense_active: expense.expense_active || 1,
            wallet: wallet || 1,
            uploaded: 0, // Reset to 0 after modification
            createdAt: expense.createdAt,
            updatedAt: moment(new Date()).format()
        };

        try {
            realm.write(() => {
                try {
                    realm.create('Expenses', updatedExpense, true);
                } catch (error) {
                    console.log(error);
                }
            });

            // Emit to server for sync
            SocketApp.emit("expensesChanged", JSON.stringify({ phone_number: user_data.phone_number, items: [updatedExpense] }));

            setTimeout(() => {
                dispatch(setLoadingButton(false));
                navigation.goBack();
            }, 300);
        } catch (error) {
            console.log(error);
            dispatch(setLoadingButton(false));
        }
    };

    const DeleteExpense = () => {
        dispatch(setLoadingButton(true));

        const deletedExpense = {
            ...expense,
            expense_active: 0,
            uploaded: 0,
            updatedAt: moment(new Date()).format()
        };

        try {
            realm.write(() => {
                try {
                    realm.create('Expenses', deletedExpense, true);
                } catch (error) {
                    console.log(error);
                }
            });

            // Emit to server for sync
            SocketApp.emit("expensesChanged", JSON.stringify({ phone_number: user_data.phone_number, items: [deletedExpense] }));

            setTimeout(() => {
                dispatch(setLoadingButton(false));
                navigation.goBack();
            }, 300);
        } catch (error) {
            console.log(error);
            dispatch(setLoadingButton(false));
        }
    };

    const RenderCurrency = ({ item, index, selectCurrency }: { item: number, index: number, selectCurrency: (currency: number) => void }) => {
        const pressCurrency = () => {
            selectCurrency(item);
            setShowCurrencies(false);
        };

        return (
            <Pressable
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
                onPress={pressCurrency}
            >
                <YambiText text={(index + 1) + "."} size="normal" color="default" style={{ width: 35 }} />
                <YambiText text={renderCurrency(item, true)} size="normal" color="default" style={{ flex: 1 }} />
            </Pressable>
        );
    };

    const RenderCategory = ({ item, index, selectCategory }: { item: any, index: number, selectCategory: (category: number) => void }) => {
        const pressCategory = () => {
            selectCategory(item.id);
            setShowCategories(false);
        };

        return (
            <Pressable
                style={{
                    backgroundColor: theme.background,
                    flex: 1,
                    flexDirection: 'row',
                    borderRadius: 8,
                    paddingHorizontal: 15,
                    paddingVertical: 12,
                    alignItems: 'center',
                    borderBottomWidth: 1,
                    borderColor: theme.border
                }}
                onPress={pressCategory}
            >
                <View style={{ flex: 1 }}>
                    <YambiText text={item.name} size="normal" color="default" style={{ marginBottom: 4 }} />
                    <YambiText text={item.items} size="small" color="gray" />
                </View>
            </Pressable>
        );
    };

    const RenderWallet = ({ item, index, selectWallet }: { item: number, index: number, selectWallet: (wallet: number) => void }) => {
        const pressWallet = () => {
            selectWallet(item);
            setShowWallets(false);
        };

        return (
            <Pressable
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
                onPress={pressWallet}
            >
                <YambiText text={strings.wallet + " " + item} size="normal" color="default" style={{ flex: 1 }} />
                {item === 1 && <YambiText text={"(" + strings.primary + ")"} size="small" color="gray" />}
            </Pressable>
        );
    };

    const RenderBusiness = ({ item, index, selectBusiness }: { item: any, index: number, selectBusiness: (business_id: string) => void }) => {
        const pressBusiness = () => {
            selectBusiness(item._id);
            // Clear sales point if business changes
            setSales_point_id("");
            setShowBusinesses(false);
        };

        return (
            <Pressable
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
                onPress={pressBusiness}
            >
                <YambiText text={item.business_name} size="normal" color="default" style={{ flex: 1 }} />
            </Pressable>
        );
    };

    const RenderSalesPoint = ({ item, index, selectSalesPoint }: { item: any, index: number, selectSalesPoint: (sales_point_id: string, business_id: string) => void }) => {
        const pressSalesPoint = () => {
            // Automatically set business_id when sales point is selected
            selectSalesPoint(item._id, item.business_id);
            setShowSalesPoints(false);
        };

        // Get business name for display
        const business = userBusinesses.find(b => b._id === item.business_id);

        return (
            <Pressable
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
                onPress={pressSalesPoint}
            >
                <View style={{ flex: 1 }}>
                    <YambiText text={item.sells_point_name} size="normal" color="default" style={{ marginBottom: 2 }} />
                    {business && (
                        <YambiText text={business.business_name} size="xsmall" color="gray" style={{ fontSize: 11 }} />
                    )}
                </View>
            </Pressable>
        );
    };

    return (
        <View style={{
            borderColor: theme.border,
            borderTopWidth: 1,
            backgroundColor: theme.background,
            flex: 1
        }}>
            <ScrollView style={{
                paddingHorizontal: 15
            }} keyboardShouldPersistTaps='handled'>

                <View style={{ marginTop: 15 }}>

                    {showError ?
                        <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowError(false) }} singleButton title={strings.error}>
                            <YambiText text={strings.fields_error_validation || "Please fill in all required fields"} size="normal" color="gray" />
                        </ModalApp> : null}

                    {showCurrencies ? (
                        <BottomSheet
                            visible={showCurrencies}
                            onClose={() => setShowCurrencies(false)}
                        >
                            <View style={{ paddingBottom: 10, paddingHorizontal: 20 }}>
                                {(global_currencies as number[]).map((curr, index) => {
                                    const isSelected = currency === curr;
                                    return (
                                        <Pressable
                                            key={curr}
                                            onPress={() => {
                                                setCurrency(curr);
                                                setShowCurrencies(false);
                                            }}
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                paddingVertical: 14,
                                                paddingHorizontal: 14,
                                                borderRadius: 12,
                                                marginVertical: 3,
                                                backgroundColor: isSelected ? theme.high_color + "18" : 'transparent',
                                                borderWidth: 1,
                                                borderColor: isSelected ? theme.high_color + "50" : 'transparent',
                                            }}
                                        >
                                            <YambiText text={`${index + 1}.`} style={{ width: 30 }} color="gray" />
                                            <YambiText
                                                text={renderCurrency(curr, true)}
                                                bold={isSelected}
                                                style={{ flex: 1, fontSize: 15, color: isSelected ? theme.high_color : theme.text }}
                                            />
                                            {isSelected && (
                                                <IconApp pack="IO" name="checkmark-circle" size={22} color={theme.high_color} />
                                            )}
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </BottomSheet>
                    ) : null}

                    {showCategories ? (
                        <BottomSheet
                            visible={showCategories}
                            onClose={() => setShowCategories(false)}
                        >
                            <View style={{ paddingBottom: 10, paddingHorizontal: 20 }}>
                                {(expenses_categories as any[]).map((cat) => {
                                    const isSelected = category === cat.id;
                                    return (
                                        <Pressable
                                            key={cat.id}
                                            onPress={() => {
                                                setCategory(cat.id);
                                                setShowCategories(false);
                                            }}
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                paddingVertical: 14,
                                                paddingHorizontal: 14,
                                                borderRadius: 12,
                                                marginVertical: 3,
                                                backgroundColor: isSelected ? theme.high_color + "18" : 'transparent',
                                                borderWidth: 1,
                                                borderColor: isSelected ? theme.high_color + "50" : 'transparent',
                                            }}
                                        >
                                            <View style={{ flex: 1 }}>
                                                <YambiText
                                                    text={cat.name}
                                                    bold={isSelected}
                                                    style={{ fontSize: 15, color: isSelected ? theme.high_color : theme.text, marginBottom: 2 }}
                                                />
                                                <YambiText text={cat.items} size="small" color="gray" />
                                            </View>
                                            {isSelected && (
                                                <IconApp pack="IO" name="checkmark-circle" size={22} color={theme.high_color} />
                                            )}
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </BottomSheet>
                    ) : null}

                    {showWallets ? (
                        <BottomSheet
                            visible={showWallets}
                            onClose={() => setShowWallets(false)}
                        >
                            <View style={{ paddingBottom: 10, paddingHorizontal: 20 }}>
                                {wallets.map((w) => {
                                    const isSelected = wallet === w;
                                    return (
                                        <Pressable
                                            key={w}
                                            onPress={() => {
                                                setWallet(w);
                                                setShowWallets(false);
                                            }}
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                paddingVertical: 14,
                                                paddingHorizontal: 14,
                                                borderRadius: 12,
                                                marginVertical: 3,
                                                backgroundColor: isSelected ? theme.high_color + "18" : 'transparent',
                                                borderWidth: 1,
                                                borderColor: isSelected ? theme.high_color + "50" : 'transparent',
                                            }}
                                        >
                                            <YambiText
                                                text={strings.wallet + " " + w + (w === 1 ? " (" + strings.primary + ")" : "")}
                                                bold={isSelected}
                                                style={{ flex: 1, fontSize: 15, color: isSelected ? theme.high_color : theme.text }}
                                            />
                                            {isSelected && (
                                                <IconApp pack="IO" name="checkmark-circle" size={22} color={theme.high_color} />
                                            )}
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </BottomSheet>
                    ) : null}

                    {showBusinesses ? (
                        <BottomSheet
                            visible={showBusinesses}
                            onClose={() => setShowBusinesses(false)}
                        >
                            <View style={{ paddingBottom: 10, paddingHorizontal: 20 }}>
                                <Pressable
                                    onPress={() => {
                                        setBusiness_id("");
                                        setSales_point_id("");
                                        setShowBusinesses(false);
                                    }}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        paddingVertical: 14,
                                        paddingHorizontal: 14,
                                        borderRadius: 12,
                                        marginVertical: 3,
                                        backgroundColor: !business_id ? theme.high_color + "18" : 'transparent',
                                        borderWidth: 1,
                                        borderColor: !business_id ? theme.high_color + "50" : 'transparent',
                                    }}
                                >
                                    <YambiText
                                        text={strings.none || "None"}
                                        bold={!business_id}
                                        style={{ flex: 1, fontSize: 15, fontStyle: 'italic', color: !business_id ? theme.high_color : theme.text }}
                                    />
                                    {!business_id && (
                                        <IconApp pack="IO" name="checkmark-circle" size={22} color={theme.high_color} />
                                    )}
                                </Pressable>
                                {userBusinesses.map((b: any) => {
                                    const isSelected = business_id === b._id;
                                    return (
                                        <Pressable
                                            key={b._id}
                                            onPress={() => {
                                                setBusiness_id(b._id);
                                                setSales_point_id("");
                                                setShowBusinesses(false);
                                            }}
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                paddingVertical: 14,
                                                paddingHorizontal: 14,
                                                borderRadius: 12,
                                                marginVertical: 3,
                                                backgroundColor: isSelected ? theme.high_color + "18" : 'transparent',
                                                borderWidth: 1,
                                                borderColor: isSelected ? theme.high_color + "50" : 'transparent',
                                            }}
                                        >
                                            <YambiText
                                                text={b.business_name}
                                                bold={isSelected}
                                                style={{ flex: 1, fontSize: 15, color: isSelected ? theme.high_color : theme.text }}
                                            />
                                            {isSelected && (
                                                <IconApp pack="IO" name="checkmark-circle" size={22} color={theme.high_color} />
                                            )}
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </BottomSheet>
                    ) : null}

                    {showSalesPoints ? (
                        <BottomSheet
                            visible={showSalesPoints}
                            onClose={() => setShowSalesPoints(false)}
                        >
                            <View style={{ paddingBottom: 10, paddingHorizontal: 20 }}>
                                <Pressable
                                    onPress={() => {
                                        setSales_point_id("");
                                        setShowSalesPoints(false);
                                    }}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        paddingVertical: 14,
                                        paddingHorizontal: 14,
                                        borderRadius: 12,
                                        marginVertical: 3,
                                        backgroundColor: !sales_point_id ? theme.high_color + "18" : 'transparent',
                                        borderWidth: 1,
                                        borderColor: !sales_point_id ? theme.high_color + "50" : 'transparent',
                                    }}
                                >
                                    <YambiText
                                        text={strings.none || "None"}
                                        bold={!sales_point_id}
                                        style={{ flex: 1, fontSize: 15, fontStyle: 'italic', color: !sales_point_id ? theme.high_color : theme.text }}
                                    />
                                    {!sales_point_id && (
                                        <IconApp pack="IO" name="checkmark-circle" size={22} color={theme.high_color} />
                                    )}
                                </Pressable>
                                {allSalesPoints.map((sp: any) => {
                                    const isSelected = sales_point_id === sp._id;
                                    const business = userBusinesses.find((b: any) => b._id === sp.business_id);
                                    return (
                                        <Pressable
                                            key={sp._id}
                                            onPress={() => {
                                                setSales_point_id(sp._id);
                                                setBusiness_id(sp.business_id);
                                                setShowSalesPoints(false);
                                            }}
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                paddingVertical: 14,
                                                paddingHorizontal: 14,
                                                borderRadius: 12,
                                                marginVertical: 3,
                                                backgroundColor: isSelected ? theme.high_color + "18" : 'transparent',
                                                borderWidth: 1,
                                                borderColor: isSelected ? theme.high_color + "50" : 'transparent',
                                            }}
                                        >
                                            <View style={{ flex: 1 }}>
                                                <YambiText
                                                    text={sp.sells_point_name}
                                                    bold={isSelected}
                                                    style={{ fontSize: 15, color: isSelected ? theme.high_color : theme.text, marginBottom: 2 }}
                                                />
                                                {business && (
                                                    <YambiText text={business.business_name} size="xsmall" color="gray" style={{ fontSize: 11 }} />
                                                )}
                                            </View>
                                            {isSelected && (
                                                <IconApp pack="IO" name="checkmark-circle" size={22} color={theme.high_color} />
                                            )}
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </BottomSheet>
                    ) : null}

                    {/* Title - Required */}
                    <View style={{ backgroundColor: theme.background, marginBottom: 15 }}>
                        <YambiText text={strings.title + " *"} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 5 }} />
                        <TextInput
                            placeholderTextColor="gray"
                            maxLength={100}
                            style={{ color: theme.text, backgroundColor: theme.border, paddingLeft: 15, height: 45, borderRadius: 5 }}
                            value={title}
                            onChangeText={text => setTitle(text)}
                            placeholder={strings.enter_expense_title || "Enter expense title"}
                        />
                    </View>

                    {/* Amount - Required */}
                    <View style={{ backgroundColor: theme.background, marginBottom: 15 }}>
                        <YambiText text={strings.amount + " *"} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 5 }} />
                        <TextInput
                            placeholderTextColor="gray"
                            maxLength={20}
                            keyboardType="numeric"
                            style={{ color: theme.text, backgroundColor: theme.border, paddingLeft: 15, height: 45, borderRadius: 5 }}
                            value={amount}
                            onChangeText={text => setAmount(text.replace(/[^0-9.]/g, ''))}
                            placeholder="0.00"
                        />
                    </View>

                    {/* Quantity - Required */}
                    <View style={{ backgroundColor: theme.background, marginBottom: 15 }}>
                        <YambiText text={((strings as any).quantity || "Quantity") + " *"} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 5 }} />
                        <TextInput
                            placeholderTextColor="gray"
                            maxLength={10}
                            keyboardType="numeric"
                            style={{ color: theme.text, backgroundColor: theme.border, paddingLeft: 15, height: 45, borderRadius: 5 }}
                            value={quantity}
                            onChangeText={text => setQuantity(text.replace(/[^0-9]/g, ''))}
                            placeholder="1"
                        />
                    </View>

                    {/* Currency - Required */}
                    <View style={{ backgroundColor: theme.background, marginBottom: 15 }}>
                        <Pressable onPress={() => setShowCurrencies(true)}>
                            <YambiText text={strings.currency + " *"} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 5 }} />
                            <View style={{
                                backgroundColor: theme.border,
                                paddingLeft: 15,
                                height: 45,
                                borderRadius: 5,
                                justifyContent: 'center'
                            }}>
                                <YambiText text={renderCurrency(currency, true)} size="normal" color="high" style={{ marginLeft: 2 }} />
                            </View>
                        </Pressable>
                    </View>

                    {/* Category - Required */}
                    <View style={{ backgroundColor: theme.background, marginBottom: 15 }}>
                        <Pressable onPress={() => setShowCategories(true)}>
                            <YambiText text={strings.category + " *"} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 5 }} />
                            <View style={{
                                backgroundColor: theme.border,
                                paddingLeft: 15,
                                height: 45,
                                borderRadius: 5,
                                justifyContent: 'center'
                            }}>
                                <YambiText
                                    text={category > 0 ? expenses_categories.find(c => c.id === category)?.name || strings.select_category : strings.select_category}
                                    size="normal"
                                    color="high"
                                    style={{ marginLeft: 2 }}
                                />
                            </View>
                        </Pressable>
                    </View>

                    {/* Wallet */}
                    <View style={{ backgroundColor: theme.background, marginBottom: 15 }}>
                        <Pressable onPress={() => setShowWallets(true)}>
                            <YambiText text={strings.wallet} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 5 }} />
                            <View style={{
                                backgroundColor: theme.border,
                                paddingLeft: 15,
                                height: 45,
                                borderRadius: 5,
                                justifyContent: 'center'
                            }}>
                                <YambiText
                                    text={strings.wallet + " " + wallet + (wallet === 1 ? " (" + strings.primary + ")" : "")}
                                    size="normal"
                                    color="high"
                                    style={{ marginLeft: 2 }}
                                />
                            </View>
                        </Pressable>
                    </View>

                    {/* Business (if user owns businesses) */}
                    {userBusinesses.length > 0 && (
                        <>
                            <View style={{ backgroundColor: theme.background, marginBottom: 15 }}>
                                <Pressable onPress={() => setShowBusinesses(true)}>
                                    <YambiText text={strings.business} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 5 }} />
                                    <View style={{
                                        backgroundColor: theme.border,
                                        paddingLeft: 15,
                                        height: 45,
                                        borderRadius: 5,
                                        justifyContent: 'center'
                                    }}>
                                        <YambiText
                                            text={business_id ? userBusinesses.find(b => b._id === business_id)?.business_name || strings.select_business : strings.select_business}
                                            size="normal"
                                            color="high"
                                            style={{ marginLeft: 2 }}
                                        />
                                    </View>
                                </Pressable>
                            </View>

                            {/* Sales Point (show all user's sales points) */}
                            {allSalesPoints.length > 0 && (
                                <View style={{ backgroundColor: theme.background, marginBottom: 15 }}>
                                    <Pressable onPress={() => setShowSalesPoints(true)}>
                                        <YambiText text={strings.sales_point} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 5 }} />
                                        <View style={{
                                            backgroundColor: theme.border,
                                            paddingLeft: 15,
                                            height: 45,
                                            borderRadius: 5,
                                            justifyContent: 'center'
                                        }}>
                                            <YambiText
                                                text={
                                                    sales_point_id
                                                        ? (() => {
                                                            const sp = allSalesPoints.find(s => s._id === sales_point_id);
                                                            return sp ? sp.sells_point_name : strings.select_sales_point;
                                                        })()
                                                        : strings.select_sales_point
                                                }
                                                size="normal"
                                                color="high"
                                                style={{ marginLeft: 2 }}
                                            />
                                        </View>
                                    </Pressable>
                                </View>
                            )}
                        </>
                    )}

                    {/* Description */}
                    <View style={{ backgroundColor: theme.background, marginBottom: 15 }}>
                        <YambiText text={strings.description} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 5 }} />
                        <TextInput
                            placeholderTextColor="gray"
                            multiline={true}
                            numberOfLines={4}
                            maxLength={500}
                            style={{
                                color: theme.text,
                                backgroundColor: theme.border,
                                paddingLeft: 15,
                                paddingTop: 10,
                                minHeight: 100,
                                borderRadius: 5,
                                textAlignVertical: 'top'
                            }}
                            value={description}
                            onChangeText={text => setDescription(text)}
                            placeholder={strings.enter_description || "Enter description (optional)"}
                        />
                    </View>

                    {/* Payment Type & Debt */}
                    <View style={{
                        backgroundColor: theme.background,
                        borderRadius: 12,
                        padding: 15,
                        marginBottom: 20,
                        borderWidth: 1,
                        borderColor: theme.border,
                    }}>
                        <YambiText text={strings.payment_type || "Payment Type"} size="small" color="gray" style={{ marginBottom: 12, fontWeight: '600' }} />
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15 }}>
                            <Pressable
                                onPress={() => !(debt === 1) && setPayment_type(1)}
                                disabled={debt === 1}
                                style={{
                                    flex: 1,
                                    minWidth: '30%',
                                    backgroundColor: payment_type === 1 ? theme.button_background_color : theme.gray,
                                    paddingVertical: 12,
                                    borderRadius: 8,
                                    marginRight: 8,
                                    marginBottom: 8,
                                    alignItems: 'center',
                                    opacity: debt === 1 ? 0.5 : 1
                                }}
                            >
                                <YambiText
                                    text={strings.cash || "Cash"}
                                    style={{ color: payment_type === 1 ? theme.button_foreground_color : theme.text, fontSize: 14 }}
                                    color="design"
                                />
                            </Pressable>
                            <Pressable
                                onPress={() => !(debt === 1) && setPayment_type(2)}
                                disabled={debt === 1}
                                style={{
                                    flex: 1,
                                    minWidth: '30%',
                                    backgroundColor: payment_type === 2 ? theme.button_background_color : theme.gray,
                                    paddingVertical: 12,
                                    borderRadius: 8,
                                    marginRight: 8,
                                    marginBottom: 8,
                                    alignItems: 'center',
                                    opacity: debt === 1 ? 0.5 : 1
                                }}
                            >
                                <YambiText
                                    text={strings.card || "Card"}
                                    style={{ color: payment_type === 2 ? theme.button_foreground_color : theme.text, fontSize: 14 }}
                                    color="design"
                                />
                            </Pressable>
                            <Pressable
                                onPress={() => !(debt === 1) && setPayment_type(3)}
                                disabled={debt === 1}
                                style={{
                                    flex: 1,
                                    minWidth: '30%',
                                    backgroundColor: payment_type === 3 ? theme.button_background_color : theme.gray,
                                    paddingVertical: 12,
                                    marginBottom: 8,
                                    borderRadius: 8,
                                    alignItems: 'center',
                                    opacity: debt === 1 ? 0.5 : 1
                                }}
                            >
                                <YambiText
                                    text={strings.bank || "Bank"}
                                    style={{ color: payment_type === 3 ? theme.button_foreground_color : theme.text, fontSize: 14 }}
                                    numberLines={1} color="design"
                                />
                            </Pressable>
                        </View>

                        {/* Debt Toggle */}
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingTop: 12,
                            borderTopWidth: 1,
                            borderTopColor: theme.border
                        }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                <IconApp pack="FI" name="alert-circle" size={16} color={debt === 1 ? theme.gray : theme.gray} styles={{ marginRight: 8 }} />
                                <YambiText text={strings.debt || "Debt"} size="normal" color="default" style={{ fontSize: 14 }} />
                            </View>
                            <SwitchApp
                                value={debt === 1}
                                onPress={() => {
                                    const newDebt = debt === 1 ? 0 : 1;
                                    setDebt(newDebt);
                                    // If debt is checked, set payment_type to 0, otherwise set to 1 (Cash)
                                    setPayment_type(newDebt === 1 ? 0 : 1);
                                }}
                            />
                        </View>
                    </View>

                    <ButtonNormal
                        title={strings.save || "Save"}
                        loadEnabled={true}
                        onPress={UpdateExpense}
                        styles={{ paddingHorizontal: 20, marginVertical: 10, marginBottom: 50 }}
                        normal={true}
                    />

                    {/* <ButtonNormal
                        title={strings.delete || "Delete"}
                        loadEnabled={true}
                        onPress={DeleteExpense}
                        styles={{ paddingHorizontal: 20, marginBottom: 20, backgroundColor: theme.border }}
                        normal={true}
                    /> */}

                </View>
            </ScrollView>
        </View>
    );
};

export default EditExpense;
