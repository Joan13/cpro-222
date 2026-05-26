import { Pressable, View, ScrollView, TextInput } from "react-native";
import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from "../../store/app/hooks";
import { strings } from "../../lang/lang";
import ButtonNormal from "../../components/app/ButtonNormal";
import { IconApp } from "../../components/app/IconApp";
import { YambiText } from "../../components/app/Text";
import ModalApp from "../../components/app/ModalApp";
import SwitchApp from "../../components/app/SwitchApp";
import { LegendList } from '@legendapp/list';
import { setLoadingButton, setShowModalApp } from "../../store/reducers/appSlice";
import { renderCurrency, SocketApp, global_currencies } from "../../../GlobalVariables";
import { NavProps } from "../../types/types";
import { useRealm, useQuery, useObject } from "@realm/react";
import { Expenses, UserBusinesses, UserSellsPoints } from "../../store/database/Models";
import moment from "moment";

const EditExpense = ({ route, navigation }: NavProps) => {
    const { expense_id } = route.params;

    const theme = useAppSelector(state => state.app_theme.colors);
    const user_data = useAppSelector(state => state.user_data);
    const dispatch = useAppDispatch();
    const realm = useRealm();

    const expense = useObject(Expenses, expense_id);

    if (expense === null) return null;

    const [title, setTitle] = useState<string>(expense.title);
    const [amount, setAmount] = useState<string>(expense.amount);
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
        if (title === "" || amount === "" || category === 0 || parseFloat(amount) <= 0) {
            dispatch(setShowModalApp(true));
            setShowError(true);
            return;
        }

        dispatch(setLoadingButton(true));

        const updatedExpense = {
            _id: expense._id,
            title: title,
            business_id: business_id,
            sales_point_id: sales_point_id,
            phone_number: expense.phone_number,
            amount: amount,
            currency: currency,
            description: description,
            category: category,
            payment_type: payment_type,
            debt: debt,
            expense_active: expense.expense_active,
            wallet: wallet,
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
            dispatch(setShowModalApp(false));
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
            dispatch(setShowModalApp(false));
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
            dispatch(setShowModalApp(false));
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
            dispatch(setShowModalApp(false));
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
            dispatch(setShowModalApp(false));
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

                    {showCurrencies ?
                        <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowCurrencies(false) }} paddings={false} singleButton title={strings.currency}>
                            <LegendList
                                data={global_currencies as never}
                                showsVerticalScrollIndicator={true}
                                renderItem={({ item, index }: { item: number, index: number }) => (
                                    <RenderCurrency selectCurrency={(item) => setCurrency(item)} item={item} index={index} />
                                )}
                            />
                        </ModalApp> : null}

                    {showCategories ?
                        <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowCategories(false) }} paddings={false} singleButton title={strings.category || "Category"}>
                            <LegendList
                                data={expenses_categories as never}
                                showsVerticalScrollIndicator={true}
                                renderItem={({ item, index }: { item: any, index: number }) => (
                                    <RenderCategory selectCategory={(item) => setCategory(item)} item={item} index={index} />
                                )}
                            />
                        </ModalApp> : null}

                    {showWallets ?
                        <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowWallets(false) }} paddings={false} singleButton title={strings.wallet || "Wallet"}>
                            <LegendList
                                data={wallets as never}
                                showsVerticalScrollIndicator={true}
                                renderItem={({ item, index }: { item: number, index: number }) => (
                                    <RenderWallet selectWallet={(item) => setWallet(item)} item={item} index={index} />
                                )}
                            />
                        </ModalApp> : null}

                    {showBusinesses ?
                        <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowBusinesses(false) }} paddings={false} singleButton title={strings.business || "Business"}>
                            <View style={{ width: '100%' }}>
                                <Pressable
                                    onPress={() => {
                                        setBusiness_id("");
                                        setSales_point_id("");
                                        dispatch(setShowModalApp(false));
                                        setShowBusinesses(false);
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
                                    <YambiText text={strings.none || "None"} size="normal" color="default" style={{ flex: 1, fontStyle: 'italic' }} />
                                </Pressable>
                                <LegendList
                                    data={userBusinesses as never}
                                    showsVerticalScrollIndicator={true}
                                    renderItem={({ item, index }: { item: any, index: number }) => (
                                        <RenderBusiness selectBusiness={(item) => { setBusiness_id(item); setSales_point_id(""); }} item={item} index={index} />
                                    )}
                                />
                            </View>
                        </ModalApp> : null}

                    {showSalesPoints ?
                        <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowSalesPoints(false) }} paddings={false} singleButton title={strings.sales_point || "Sales Point"}>
                            <View style={{ width: '100%' }}>
                                <Pressable
                                    onPress={() => {
                                        setSales_point_id("");
                                        dispatch(setShowModalApp(false));
                                        setShowSalesPoints(false);
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
                                    <YambiText text={strings.none || "None"} size="normal" color="default" style={{ flex: 1, fontStyle: 'italic' }} />
                                </Pressable>
                                <LegendList
                                    data={allSalesPoints as never}
                                    showsVerticalScrollIndicator={true}
                                    renderItem={({ item, index }: { item: any, index: number }) => (
                                        <RenderSalesPoint selectSalesPoint={(sales_point_id, business_id) => { setSales_point_id(sales_point_id); setBusiness_id(business_id); }} item={item} index={index} />
                                    )}
                                />
                            </View>
                        </ModalApp> : null}

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

                    {/* Currency - Required */}
                    <View style={{ backgroundColor: theme.background, marginBottom: 15 }}>
                        <Pressable onPress={() => { dispatch(setShowModalApp(true)); setShowCurrencies(true) }}>
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
                        <Pressable onPress={() => { dispatch(setShowModalApp(true)); setShowCategories(true) }}>
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
                        <Pressable onPress={() => { dispatch(setShowModalApp(true)); setShowWallets(true) }}>
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
                                <Pressable onPress={() => { dispatch(setShowModalApp(true)); setShowBusinesses(true) }}>
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
                                    <Pressable onPress={() => { dispatch(setShowModalApp(true)); setShowSalesPoints(true) }}>
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
                                    backgroundColor: payment_type === 1 ? theme.design_tip2 : theme.gray,
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
                                    style={{ color: payment_type === 1 ? theme.text_design2 : theme.text, fontSize: 14 }}
                                     color="design"
                                />
                            </Pressable>
                            <Pressable
                                onPress={() => !(debt === 1) && setPayment_type(2)}
                                disabled={debt === 1}
                                style={{
                                    flex: 1,
                                    minWidth: '30%',
                                    backgroundColor: payment_type === 2 ? theme.design_tip2 : theme.gray,
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
                                    style={{ color: payment_type === 2 ? theme.text_design2 : theme.text, fontSize: 14 }}
                                     color="design"
                                />
                            </Pressable>
                            <Pressable
                                onPress={() => !(debt === 1) && setPayment_type(3)}
                                disabled={debt === 1}
                                style={{
                                    flex: 1,
                                    minWidth: '30%',
                                    backgroundColor: payment_type === 3 ? theme.design_tip2 : theme.gray,
                                    paddingVertical: 12,
                                    marginBottom:8,
                                    borderRadius: 8,
                                    alignItems: 'center',
                                    opacity: debt === 1 ? 0.5 : 1
                                }}
                            >
                                <YambiText
                                    text={strings.bank || "Bank"}
                                    style={{ color: payment_type === 3 ? theme.text_design2 : theme.text, fontSize: 14 }}
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
                        styles={{ paddingHorizontal: 20, marginVertical: 10 }}
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
