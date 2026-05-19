import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, RefreshControl, TouchableOpacity, StyleSheet } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store/app/hooks';
import { strings } from '../../lang/lang';
import { YambiText } from '../../components/app/Text';
import { IconApp } from '../../components/app/IconApp';
import StatusBarYambi from '../../components/app/StatusBar';
import { NavProps } from '../../types/types';
import { remote_host } from '../../../GlobalVariables';
import axios from 'axios';
import AppActivityIndicator from '../../components/app/AppActivityIndicator';
import ModalApp from '../../components/app/ModalApp';
import { setShowModalApp } from '../../store/reducers/appSlice';
import { setBusinessSubscriptionData } from '../../store/reducers/persistedAppSlice';
import { LegendList } from '@legendapp/list';
import SubscriptionHistoryItem from '../../components/lists/business/SubscriptionHistoryItem';
import { TBusinessSubscription } from '../../types/types';

interface SubscriptionItem {
    _id: string;
    subscription_plan: number;
    plan_name: string;
    amount: number;
    currency: string;
    subscription_start_date: string;
    subscription_end_date: string;
    subscription_type: number; // 1 = monthly, 0 = one-time
    is_active: boolean;
    is_expired: boolean;
    payment_status?: number;
    stripe_subscription_id?: string;
    stripe_customer_id?: string;
    createdAt: string;
    updatedAt: string;
}

const PLAN_NAMES: Record<number, string> = {
    0: strings.free,
    1: (strings as any).basic_plan || "Basic",
    2: (strings as any).premium_x_plan || "Premium X",
    3: (strings as any).ultimate_plan || "Ultimate",
};

const PLAN_LIMITS: Record<number, { max_points_of_sale: number; max_articles: number; images_allowed: boolean }> = {
    0: { max_points_of_sale: 1, max_articles: 15, images_allowed: false },
    1: { max_points_of_sale: 2, max_articles: 150, images_allowed: true },
    2: { max_points_of_sale: 5, max_articles: 400, images_allowed: true },
    3: { max_points_of_sale: 10, max_articles: 3000, images_allowed: true },
};

const SubscriptionHistory = ({ navigation, route }: NavProps) => {
    const { business_id } = route.params;
    const theme = useAppSelector(state => state.app_theme);
    const dispatch = useAppDispatch();
    
    const [loading, setLoading] = useState<boolean>(true);
    const persistedBusinessSubscriptions = useAppSelector(
        state => state.persisted_app.business_subscriptions || []
    );

    const localBusinessSubscriptions = useMemo(
        () => persistedBusinessSubscriptions.filter(sub => sub.business_id === business_id),
        [persistedBusinessSubscriptions, business_id]
    );

    const subscriptions: SubscriptionItem[] = useMemo(() => {
        const now = new Date();
        const baseSubscriptions = localBusinessSubscriptions.map((sub) => {
            const paymentStatus = Number(sub.payment_status ?? 0);
            const endDate = sub.subscription_end_date ? new Date(sub.subscription_end_date) : null;
            const isExpired = !!endDate && !Number.isNaN(endDate.getTime()) ? endDate < now : false;

            return {
                _id: sub._id,
                subscription_plan: Number(sub.subscription_plan ?? 0),
                plan_name: sub.plan_name || PLAN_NAMES[Number(sub.subscription_plan ?? 0)] || strings.free,
                amount: Number(sub.amount ?? 0),
                currency: sub.currency || "usd",
                subscription_start_date: sub.subscription_start_date || "",
                subscription_end_date: sub.subscription_end_date || "",
                subscription_type: Number(sub.subscription_type ?? 1),
                is_active: false,
                is_expired: isExpired,
                payment_status: paymentStatus,
                stripe_subscription_id: sub.stripe_subscription_id || "",
                stripe_customer_id: sub.stripe_customer_id || "",
                createdAt: sub.createdAt || "",
                updatedAt: sub.updatedAt || "",
            } as SubscriptionItem;
        });

        // Only the most recent successful and non-expired subscription is flagged active.
        const activeCandidate = [...baseSubscriptions]
            .filter((s) => Number(s.payment_status) === 1 && !s.is_expired)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

        return baseSubscriptions.map((s) => ({
            ...s,
            is_active: !!activeCandidate && s._id === activeCandidate._id
        }));
    }, [localBusinessSubscriptions]);

    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [showError, setShowError] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>('');

    const normalizePaymentStatus = (status: any): number => {
        const parsed = parseInt(String(status), 10);
        // Missing/invalid status is treated as failed.
        return Number.isNaN(parsed) ? 2 : parsed;
    };

    useEffect(() => {
        if (subscriptions.length === 0) {
            fetchSubscriptionHistory();
        } else {
            setLoading(false);
        }
    }, [business_id, subscriptions.length]);

    const fetchSubscriptionHistory = async (attempt: number = 1) => {
        try {
            setLoading(true);
            setErrorMessage('');
            const res = await axios.post(remote_host + "/yambi/API/get_business_subscription_history", {
                business_id: business_id
            });

            if (res.data.success === "1") {
                const refreshedSubscriptions: TBusinessSubscription[] = (res.data.subscriptions || []).map((sub: any) => ({
                    _id: sub._id,
                    phone_number: sub.phone_number || "",
                    business_id: sub.business_id || business_id,
                    amount: Number(sub.amount ?? 0),
                    currency: sub.currency || "usd",
                    subscription_start_date: sub.subscription_start_date || "",
                    subscription_end_date: sub.subscription_end_date || "",
                    subscription_type: Number(sub.subscription_type ?? 1),
                    subscription_plan: Number(sub.subscription_plan ?? 0),
                    stripe_payment_intent_id: sub.stripe_payment_intent_id || "",
                    stripe_subscription_id: sub.stripe_subscription_id || "",
                    stripe_customer_id: sub.stripe_customer_id || "",
                    payment_phone_number: sub.payment_phone_number || "",
                    payment_type: Number(sub.payment_type ?? 0),
                    payment_status: Number(sub.payment_status ?? 0),
                    serdi_session_id: sub.serdi_session_id || "",
                    serdi_transaction_token: sub.serdi_transaction_token || "",
                    serdi_transaction_status: Number(sub.serdi_transaction_status ?? 0),
                    plan_name: sub.plan_name,
                    is_active: !!sub.is_active,
                    is_expired: !!sub.is_expired,
                    createdAt: sub.createdAt || "",
                    updatedAt: sub.updatedAt || "",
                }));

                dispatch(setBusinessSubscriptionData({
                    business_id,
                    subscriptions: refreshedSubscriptions
                }));
                setShowError(false);
            } else {
                setErrorMessage(res.data.message || strings.connection_failed);
                setShowError(true);
                dispatch(setShowModalApp(true));
            }
        } catch (error: any) {
            console.error("Error fetching subscription history:", error);
            const statusCode = error?.response?.status;
            if (statusCode === 502 && attempt < 2) {
                // Retry once for transient gateway/proxy errors.
                setTimeout(() => {
                    fetchSubscriptionHistory(attempt + 1);
                }, 800);
                return;
            }
            setErrorMessage(error.response?.data?.message || strings.connection_failed);
            setShowError(true);
            dispatch(setShowModalApp(true));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchSubscriptionHistory();
    }, [business_id]);


    const localCurrentPlan = useMemo(() => {
        const activeLocalSubscription = subscriptions.find((sub) => {
            const status = normalizePaymentStatus(sub.payment_status);
            return !!sub.is_active && !sub.is_expired && status === 1;
        });

        if (activeLocalSubscription) {
            const localPlanId = Number(activeLocalSubscription.subscription_plan ?? 0);
            return {
                plan_name: activeLocalSubscription.plan_name,
                payment_status: activeLocalSubscription.payment_status,
                is_free: false,
                limits: PLAN_LIMITS[localPlanId] || PLAN_LIMITS[0],
            };
        }

        return {
            plan_name: strings.free,
            is_free: true,
            payment_status: 1,
            limits: {
                ...PLAN_LIMITS[0]
            },
        };
    }, [subscriptions]);

    // Current plan is derived from local data only.
    // Fallback is always Free when there is no active successful non-expired paid plan.
    const displayPlan = localCurrentPlan;

    const currentPlanPaymentStatus = normalizePaymentStatus(displayPlan?.payment_status);
    const isCurrentPlanSuccessful = !!displayPlan && currentPlanPaymentStatus === 1;

    return (
        <View style={[{ backgroundColor: theme.colors.background, flex: 1, borderColor: theme.colors.border, borderTopWidth: 1 }, StyleSheet.absoluteFill]}>
            {showError && (
                <ModalApp 
                    onClose={() => { 
                        dispatch(setShowModalApp(false)); 
                        setShowError(false);
                    }} 
                    singleButton 
                    title={strings.error}>
                    <YambiText text={errorMessage || strings.connection_failed} size="normal" color="gray" />
                </ModalApp>
            )}

            <View style={{ flex: 1 }}>
                <StatusBarYambi />

                <LegendList
                    style={{ flex: 1, backgroundColor: 'transparent' }}
                    data={subscriptions as never}
                    keyExtractor={(item: SubscriptionItem) => item._id}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={theme.colors.high_color}
                        />
                    }
                    ListHeaderComponent={
                        <View>
                            {/* Current Plan Section */}
                            {displayPlan && (
                                <View style={{
                                    backgroundColor: theme.colors.border + '40',
                                    marginHorizontal: 20,
                                    marginTop: 20,
                                    marginBottom: 15,
                                    borderRadius: 16,
                                    padding: 20,
                                }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                        <IconApp pack="FI" name="info" size={20} color={theme.colors.high_color} styles={{ marginRight: 10 }} />
                                        <YambiText
                                            text={(strings as any).current_plan || "Current Plan"}
                                            size="big"
                                            color="default"
                                            bold
                                        />
                                    </View>
                                    
                                    <View style={{
                                        backgroundColor: theme.colors.background,
                                        borderRadius: 12,
                                        padding: 16,
                                        marginTop: 10,
                                    }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                            <YambiText
                                                text={(strings as any).plan || "Plan"}
                                                size="normal"
                                                color="gray"
                                            />
                                            <View style={{ alignItems: 'flex-end' }}>
                                                <YambiText
                                                    text={displayPlan.plan_name}
                                                    size="normal"
                                                    color="default"
                                                    bold
                                                />
                                                <YambiText
                                                    text={
                                                        currentPlanPaymentStatus === 1
                                                            ? (strings.active || "Active")
                                                            : currentPlanPaymentStatus === 0
                                                                ? ((strings as any).processing_payment || "Pending payment")
                                                                : ((strings as any).mobile_money_payment_failed || "Payment failed")
                                                    }
                                                    size="small"
                                                    color={currentPlanPaymentStatus === 1 ? "high" : "error"}
                                                />
                                            </View>
                                        </View>
                                        
                                        {!displayPlan.is_free && isCurrentPlanSuccessful && (
                                            <View style={{ marginTop: 12 }}>
                                                <YambiText
                                                    text={(strings as any).plan_limits || "Plan Limits"}
                                                    size="small"
                                                    color="gray"
                                                    style={{ marginBottom: 8 }}
                                                />
                                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                                                    <View style={{
                                                        backgroundColor: theme.colors.border,
                                                        paddingHorizontal: 10,
                                                        paddingVertical: 6,
                                                        borderRadius: 8,
                                                    }}>
                                                        <YambiText
                                                            text={`${strings.max_points_of_sale.replace('{count}', displayPlan.limits.max_points_of_sale.toString()).replace('{plural}', displayPlan.limits.max_points_of_sale > 1 ? 's' : '')}`}
                                                            size="small"
                                                            color="default"
                                                        />
                                                    </View>
                                                    <View style={{
                                                        backgroundColor: theme.colors.border,
                                                        paddingHorizontal: 10,
                                                        paddingVertical: 6,
                                                        borderRadius: 8,
                                                    }}>
                                                        <YambiText
                                                            text={`${strings.max_articles.replace('{count}', displayPlan.limits.max_articles.toString()).replace('{plural}', displayPlan.limits.max_articles > 1 ? 's' : '')}`}
                                                            size="small"
                                                            color="default"
                                                        />
                                                    </View>
                                                    {displayPlan.limits.images_allowed ? (
                                                        <View style={{
                                                            backgroundColor: theme.colors.border,
                                                            paddingHorizontal: 10,
                                                            paddingVertical: 6,
                                                            borderRadius: 8,
                                                        }}>
                                                            <YambiText
                                                                text={strings.images_allowed}
                                                                size="small"
                                                                color="default"
                                                            />
                                                        </View>
                                                    ) : (
                                                        <View style={{
                                                            backgroundColor: theme.colors.border,
                                                            paddingHorizontal: 10,
                                                            paddingVertical: 6,
                                                            borderRadius: 8,
                                                        }}>
                                                            <YambiText
                                                                text={strings.no_images_allowed}
                                                                size="small"
                                                                color="gray"
                                                            />
                                                        </View>
                                                    )}
                                                </View>
                                            </View>
                                        )}
                                        {!displayPlan.is_free && !isCurrentPlanSuccessful && (
                                            <View style={{ marginTop: 12 }}>
                                                <YambiText
                                                    text={
                                                        currentPlanPaymentStatus === 0
                                                            ? ((strings as any).processing_payment || "Payment is pending. Paid plan features are locked until confirmation.")
                                                            : ((strings as any).mobile_money_payment_failed || "Payment failed. Paid plan features are locked.")
                                                    }
                                                    size="small"
                                                    color="error"
                                                />
                                            </View>
                                        )}
                                    </View>
                                </View>
                            )}

                            {/* Subscription History Section Header */}
                            <View style={{ paddingHorizontal: 20, marginBottom: 15 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <IconApp pack="FI" name="clock" size={20} color={theme.colors.high_color} styles={{ marginRight: 10 }} />
                                    <YambiText
                                        text={(strings as any).subscription_history || "Subscription History"}
                                        size="big"
                                        color="default"
                                        bold
                                    />
                                </View>
                            </View>
                        </View>
                    }
                    renderItem={({ item, index }: { item: SubscriptionItem, index: number }) => (
                        <SubscriptionHistoryItem item={item} index={index} />
                    )}
                    ListEmptyComponent={
                        loading ? (
                            <View style={{ paddingVertical: 50 }}>
                                <AppActivityIndicator />
                            </View>
                        ) : (
                            <View style={{
                                backgroundColor: theme.colors.border + '40',
                                borderRadius: 12,
                                padding: 30,
                                alignItems: 'center',
                                marginHorizontal: 20,
                            }}>
                                <IconApp pack="FI" name="inbox" size={40} color={theme.colors.gray} styles={{ marginBottom: 12 }} />
                                <YambiText
                                    text={(strings as any).no_subscription_history || "No subscription history found"}
                                    size="normal"
                                    color="gray"
                                    style={{ textAlign: 'center', marginBottom: 20 }}
                                />
                                <TouchableOpacity
                                    onPress={() => {
                                        navigation.navigate('BusinessSubscriptionPlans', { business_id: business_id });
                                    }}
                                    style={{
                                        backgroundColor: theme.colors.high_color,
                                        borderRadius: 8,
                                        paddingHorizontal: 20,
                                        paddingVertical: 12,
                                    }}>
                                    <YambiText
                                        text={(strings as any).add_subscription || "Add Subscription"}
                                        size="normal"
                                        color="badge"
                                        bold
                                    />
                                </TouchableOpacity>
                            </View>
                        )
                    }
                    contentContainerStyle={{
                        paddingBottom: 30
                    }}
                />
            </View>
        </View>
    );
};

export default SubscriptionHistory;
