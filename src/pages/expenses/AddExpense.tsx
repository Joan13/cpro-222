import { Pressable, View, ScrollView, TextInput } from "react-native";
import { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from "../../store/app/hooks";
import { strings } from "../../lang/lang";
import ButtonNormal from "../../components/app/ButtonNormal";
import { IconApp } from "../../components/app/IconApp";
import { YambiText } from "../../components/app/Text";
import ModalApp from "../../components/app/ModalApp";
import SwitchApp from "../../components/app/SwitchApp";
import { LegendList } from '@legendapp/list';
import { setLoadingButton, setShowModalApp } from "../../store/reducers/appSlice";
import { randomString, renderCurrency, renderDateUpToMilliseconds, SocketApp, global_currencies } from "../../../GlobalVariables";
import { NavProps } from "../../types/types";
import { useRealm, useQuery } from "@realm/react";
import { BusinessUsers, Expenses, UserBusinesses, UserSellsPoints } from "../../store/database/Models";
import moment from "moment";

const AddExpense = ({ route, navigation }: NavProps) => {
    const { category_id } = route.params || {};

    const theme = useAppSelector(state => state.app_theme.colors);
    const user_data = useAppSelector(state => state.user_data);
    const persistedSubscriptions = useAppSelector(state => state.persisted_app.business_subscriptions || []);
    const [title, setTitle] = useState<string>("");
    const [amount, setAmount] = useState<string>("");
    const [currency, setCurrency] = useState<number>(1);
    const [category, setCategory] = useState<number>(category_id || 0);
    const [description, setDescription] = useState<string>("");
    const [payment_type, setPayment_type] = useState<number>(1); // 1 = cash, 2 = card, 3 = bank (0 = not paid when debt is checked)
    const [debt, setDebt] = useState<number>(0);
    const [wallet, setWallet] = useState<number>(1);
    const [business_id, setBusiness_id] = useState<string>("");
    const [sales_point_id, setSales_point_id] = useState<string>("");
    const [showError, setShowError] = useState<boolean>(false);
    const [showCurrencies, setShowCurrencies] = useState<boolean>(false);
    const [showCategories, setShowCategories] = useState<boolean>(false);
    const [showWallets, setShowWallets] = useState<boolean>(false);
    const [showBusinesses, setShowBusinesses] = useState<boolean>(false);
    const [showSalesPoints, setShowSalesPoints] = useState<boolean>(false);
    const dispatch = useAppDispatch();
    const realm = useRealm();

    const isAdmin = user_data?.user_level === 2;
    const PLAN_MAX_POINTS_OF_SALE: Record<number, number> = {
        0: 1,
        1: 2,
        2: 5,
        3: 10,
    };

    // Get active businesses (visibility handled by access level below)
    const allBusinesses = useQuery(
        UserBusinesses, businesses => {
            return businesses.filtered('business_active == $0', 1);
        }, []);

    // Get all active sales points (visibility handled by access level below)
    const allSalesPoints = useQuery(
        UserSellsPoints, points => {
            return points.filtered('sells_point_active == $0', 1);
        }, []);

    // Current user's access rules per business/POS
    const userBusinessAccess = useQuery(
        BusinessUsers, users => {
            return users.filtered('user == $0 && user_active == $1', user_data.phone_number, 1);
        }, []);

    // Business expense is allowed only for levels 1 and 2
    const accessibleBusinesses = useMemo<any[]>(() => {
        if (isAdmin) return Array.from(allBusinesses as any);

        const businessIds = new Set<string>();
        Array.from(userBusinessAccess as any).forEach((access: any) => {
            if (access.level === 1 || access.level === 2) {
                businessIds.add(access.business_id);
            }
        });

        return Array.from(allBusinesses as any).filter((business: any) => businessIds.has(business._id));
    }, [allBusinesses, userBusinessAccess, isAdmin]);

    const maxAllowedPointsByBusiness = useMemo(() => {
        const now = new Date();
        const result = new Map<string, number>();

        Array.from(allBusinesses as any).forEach((business: any) => {
            const activeSuccessfulLocalSubscription = (persistedSubscriptions as any[])
                .filter((sub: any) => {
                    if (sub.business_id !== business._id) return false;
                    if (Number(sub.payment_status ?? 0) !== 1) return false;
                    if (!sub.subscription_end_date) return false;
                    const endDate = new Date(sub.subscription_end_date);
                    if (Number.isNaN(endDate.getTime())) return false;
                    return endDate >= now;
                })
                .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())[0];

            const plan = Number(activeSuccessfulLocalSubscription?.subscription_plan ?? 0);
            result.set(business._id, PLAN_MAX_POINTS_OF_SALE[plan] ?? PLAN_MAX_POINTS_OF_SALE[0]);
        });

        return result;
    }, [allBusinesses, persistedSubscriptions]);

    const planAllowedSalesPointIds = useMemo(() => {
        const ids = new Set<string>();
        const pointsByBusiness = new Map<string, any[]>();

        Array.from(allSalesPoints as any).forEach((point: any) => {
            if (!pointsByBusiness.has(point.business_id)) {
                pointsByBusiness.set(point.business_id, []);
            }
            pointsByBusiness.get(point.business_id)?.push(point);
        });

        pointsByBusiness.forEach((points, currentBusinessId) => {
            const maxPoints = maxAllowedPointsByBusiness.get(currentBusinessId) ?? PLAN_MAX_POINTS_OF_SALE[0];
            points.slice(0, maxPoints).forEach((point: any) => ids.add(point._id));
        });

        return ids;
    }, [allSalesPoints, maxAllowedPointsByBusiness]);

    // POS access:
    // - Level 1: all POS of that business
    // - Level 2/3: only assigned sales point
    const accessibleSalesPoints = useMemo<any[]>(() => {
        const allPoints = Array.from(allSalesPoints as any);
        if (isAdmin) return allPoints;

        const pointIds = new Set<string>();
        Array.from(userBusinessAccess as any).forEach((access: any) => {
            if (access.level === 1) {
                allPoints
                    .filter((point: any) => point.business_id === access.business_id && planAllowedSalesPointIds.has(point._id))
                    .forEach((point: any) => pointIds.add(point._id));
            } else if ((access.level === 2 || access.level === 3) && access.sales_point_id && planAllowedSalesPointIds.has(access.sales_point_id)) {
                pointIds.add(access.sales_point_id);
            }
        });

        return allPoints.filter((point: any) => pointIds.has(point._id));
    }, [allSalesPoints, userBusinessAccess, isAdmin, planAllowedSalesPointIds]);

    // If a business is selected, only show its POS among accessible ones.
    const salesPoints = useMemo<any[]>(() => {
        if (!business_id) return accessibleSalesPoints;
        return accessibleSalesPoints.filter((point: any) => point.business_id === business_id);
    }, [accessibleSalesPoints, business_id]);

    const expenses_categories = strings.expenses_categories || [];
    const wallets = Array.from({ length: 10 }, (_, i) => i + 1);

    useEffect(() => {
        if (category_id) {
            setCategory(category_id);
        }
    }, [category_id]);

    useEffect(() => {
        if (sales_point_id && !accessibleSalesPoints.some((point: any) => point._id === sales_point_id)) {
            setSales_point_id("");
        }
    }, [accessibleSalesPoints, sales_point_id]);

    const AddExpenseItem = () => {
        if (title === "" || amount === "" || category === 0 || parseFloat(amount) <= 0) {
            dispatch(setShowModalApp(true));
            setShowError(true);
            return;
        }

        dispatch(setLoadingButton(true));

        // Generate ObjectId-compatible ID (24 hex characters)
        const expenseId = renderDateUpToMilliseconds() + randomString(12).toLowerCase();
        const expenseId24 = expenseId.substring(0, 24).padEnd(24, '0');

        const expense = {
            _id: expenseId24,
            title: title,
            business_id: business_id,
            sales_point_id: sales_point_id,
            phone_number: user_data.phone_number,
            amount: amount,
            currency: currency,
            description: description,
            category: category,
            payment_type: payment_type,
            debt: debt,
            expense_active: 1,
            wallet: wallet,
            uploaded: 0,
            createdAt: moment(new Date()).format(),
            updatedAt: moment(new Date()).format()
        };

        try {
            realm.write(() => {
                try {
                    realm.create('Expenses', expense, true);
                } catch (error) {
                    console.log(error);
                }
            });

            // Emit to server for sync
            SocketApp.emit("newExpenses", JSON.stringify({ phone_number: user_data.phone_number, items: [expense] }));

            setTimeout(() => {
                setTitle("");
                setAmount("");
                setDescription("");
                setCategory(0);
                setBusiness_id("");
                setSales_point_id("");
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
        const business = allBusinesses.find(b => b._id === item.business_id);

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
                                <ScrollView
                                    style={{ maxHeight: 320 }}
                                    showsVerticalScrollIndicator={true}
                                    nestedScrollEnabled={true}
                                >
                                    {accessibleBusinesses.map((item, index) => (
                                        <RenderBusiness
                                            key={item._id}
                                            selectBusiness={(item) => { setBusiness_id(item); setSales_point_id(""); }}
                                            item={item}
                                            index={index}
                                        />
                                    ))}
                                </ScrollView>
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
                                <ScrollView
                                    style={{ maxHeight: 320 }}
                                    showsVerticalScrollIndicator={true}
                                    nestedScrollEnabled={true}
                                >
                                    {salesPoints.map((item, index) => (
                                        <RenderSalesPoint
                                            key={item._id}
                                            selectSalesPoint={(sales_point_id, business_id) => { setSales_point_id(sales_point_id); setBusiness_id(business_id); }}
                                            item={item}
                                            index={index}
                                        />
                                    ))}
                                </ScrollView>
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
                    {(accessibleBusinesses.length > 0 || accessibleSalesPoints.length > 0) && (
                        <>
                            {accessibleBusinesses.length > 0 && (
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
                                                text={business_id ? accessibleBusinesses.find((b: any) => b._id === business_id)?.business_name || strings.select_business : strings.select_business}
                                                size="normal"
                                                color="high"
                                                style={{ marginLeft: 2 }}
                                            />
                                        </View>
                                    </Pressable>
                                </View>
                            )}

                            {/* Sales Point (show accessible points based on user level) */}
                            {accessibleSalesPoints.length > 0 && (
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
                                                            const sp = accessibleSalesPoints.find((s: any) => s._id === sales_point_id);
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
                                    style={{ color: payment_type === 1 ? theme.text_design2 : theme.text, fontSize: 14 }} color="design"
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
                                    style={{ color: payment_type === 2 ? theme.text_design2 : theme.text, fontSize: 14 }} color="design"
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
                                    marginBottom: 8,
                                    borderRadius: 8,
                                    alignItems: 'center',
                                    opacity: debt === 1 ? 0.5 : 1
                                }}
                            >
                                <YambiText
                                    text={strings.bank || "Bank"}
                                    style={{ color: payment_type === 3 ? theme.text_design2 : theme.text, fontSize: 14 }} color="design"
                                    numberLines={1}
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
                        onPress={AddExpenseItem}
                        styles={{ paddingHorizontal: 20, marginVertical: 20 }}
                        normal={true}
                    />

                </View>
            </ScrollView>
        </View>
    );
};

export default AddExpense;
