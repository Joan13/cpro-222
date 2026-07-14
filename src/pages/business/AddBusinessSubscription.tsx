import React, { useMemo, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { strings } from '../../lang/lang';
import { useAppSelector, useAppDispatch } from '../../store/app/hooks';
import StatusBarYambi from '../../components/app/StatusBar';
import { YambiText } from '../../components/app/Text';
import { remote_host } from '../../../GlobalVariables';
import { IconApp } from '../../components/app/IconApp';
import { NavProps } from '../../types/types';
import axios from 'axios';
import ModalApp from '../../components/app/ModalApp';
import { setShowModalApp } from '../../store/reducers/appSlice';

// Plan definitions matching backend (monthly unit price - USD)
const PLAN_PRICES: { [key: number]: number } = {
    1: 3.99,   // Basic - USD
    2: 9.99,   // Premium X - USD
    3: 19.99   // Ultimate - USD
};

const PLAN_NAMES: { [key: number]: string } = {
    1: 'Basic',
    2: 'Premium X',
    3: 'Ultimate'
};

/** One-time: 1 month full; 6 months pay 5 (1 free); 12 months pay 9 (3 free)
 *  NOTE: Basic plan (1) has NO bonus months — pays full price for all durations. */
type OneTimeDurationKey = 1 | 6 | 12;

const DURATION_OPTIONS: OneTimeDurationKey[] = [1, 6, 12];

const getBillableMonths = (planKey: number, durationKey: OneTimeDurationKey): number => {
    // Basic plan has no bonus months
    if (planKey === 1) return durationKey;
    if (durationKey === 6) return 5;
    if (durationKey === 12) return 10;
    return 1;
};

const getOneTimeAmount = (planKey: number, durationKey: OneTimeDurationKey): number => {
    const monthly = PLAN_PRICES[planKey] || PLAN_PRICES[1];
    return monthly * getBillableMonths(planKey, durationKey);
};

const AddBusinessSubscription = ({ navigation, route }: NavProps) => {
    const theme = useAppSelector(state => state.app_theme);
    const user_data = useAppSelector(state => state.user_data);
    const dispatch = useAppDispatch();
    const { initPaymentSheet, presentPaymentSheet } = useStripe();

    const business_id = route.params?.business_id;
    const subscription_plan = route.params?.subscription_plan || 1;
    const use_stripe = route.params?.use_stripe || false;
    const [durationMonths, setDurationMonths] = useState<OneTimeDurationKey>(subscription_plan === 1 ? 6 : 1);
    const amount = useMemo(
        () => getOneTimeAmount(subscription_plan, durationMonths),
        [subscription_plan, durationMonths]
    );
    const [loading, setLoading] = useState<boolean>(false);
    const [initializing, setInitializing] = useState<boolean>(false);
    const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
    const [showErrorModal, setShowErrorModal] = useState<boolean>(false);
    const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>('');

    const isDurationDisabled = (d: OneTimeDurationKey) => {
        // Keep visible, but temporarily disabled for Basic plan.
        return subscription_plan === 1 && d === 1;
    };

    const subscriptionDetailsInfo = useMemo(() => {
        if (durationMonths === 1) {
            return ((strings as any).one_time_subscription_details_1m as string)?.replace('{amount}', amount.toFixed(2)) ?? '';
        }
        if (subscription_plan === 1) {
            if (durationMonths === 6) {
                return ((strings as any).one_time_subscription_details_6m_basic as string)?.replace('{amount}', amount.toFixed(2)) ?? '';
            }
            return ((strings as any).one_time_subscription_details_12m_basic as string)?.replace('{amount}', amount.toFixed(2)) ?? '';
        }
        if (durationMonths === 6) {
            return ((strings as any).one_time_subscription_details_6m as string)?.replace('{amount}', amount.toFixed(2)) ?? '';
        }
        return ((strings as any).one_time_subscription_details_12m as string)?.replace('{amount}', amount.toFixed(2)) ?? '';
    }, [durationMonths, amount, subscription_plan]);

    const confirmModalDurationInfo = useMemo(() => {
        if (durationMonths === 1) {
            return ((strings as any).confirm_one_time_info_1m as string)?.replace('{amount}', amount.toFixed(2)) ?? '';
        }
        if (subscription_plan === 1) {
            if (durationMonths === 6) {
                return ((strings as any).confirm_one_time_info_6m_basic as string)?.replace('{amount}', amount.toFixed(2)) ?? '';
            }
            return ((strings as any).confirm_one_time_info_12m_basic as string)?.replace('{amount}', amount.toFixed(2)) ?? '';
        }
        if (durationMonths === 6) {
            return ((strings as any).confirm_one_time_info_6m as string)?.replace('{amount}', amount.toFixed(2)) ?? '';
        }
        return ((strings as any).confirm_one_time_info_12m as string)?.replace('{amount}', amount.toFixed(2)) ?? '';
    }, [durationMonths, amount, subscription_plan]);

    // Auto-trigger Stripe flow when coming back from SelectPaymentType with card option
    React.useEffect(() => {
        if (use_stripe) {
            setShowConfirmModal(true);
            dispatch(setShowModalApp(true));
        }
    }, [use_stripe]);

    const initializePaymentSheet = async () => {
        try {
            setInitializing(true);
            setErrorMessage('');

            if (!user_data?.phone_number) {
                throw new Error("User phone number is required");
            }

            if (!business_id) {
                throw new Error("Business ID is required");
            }

            const response = await axios.post(remote_host + '/yambi/API/add_business_subscription', {
                phone_number: user_data.phone_number,
                business_id: business_id,
                amount: amount,
                currency: 'usd',
                payment_type: 0,
                subscription_plan: subscription_plan,
                subscription_duration_months: durationMonths,
            }, {
                timeout: 30000,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                }
            });

            if (response.data && response.data.success === "1" && response.data.client_secret) {
                // For subscriptions, use setupIntentClientSecret if available, otherwise paymentIntentClientSecret
                const { error } = await initPaymentSheet({
                    merchantDisplayName: 'Yambi',
                    paymentIntentClientSecret: response.data.client_secret,
                    setupIntentClientSecret: response.data.setup_intent_client_secret || undefined,
                    defaultBillingDetails: {
                        name: user_data.user_names,
                        email: user_data.user_email || undefined,
                        phone: user_data.phone_number,
                    },
                });

                if (error) {
                    throw new Error(error.message || strings.connection_failed);
                }

                // Store Stripe IDs for later use
                return {
                    client_secret: response.data.client_secret,
                    stripe_subscription_id: response.data.stripe_subscription_id || null,
                    stripe_customer_id: response.data.stripe_customer_id || null
                };
            } else {
                throw new Error(response.data?.message || strings.connection_failed);
            }
        } catch (error: any) {
            if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
                setErrorMessage(strings.connection_failed || "Request timed out. Please check your internet connection and try again.");
            } else if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
                setErrorMessage(strings.connection_failed || "Network error. Please check your internet connection and try again.");
            } else if (error.response) {
                setErrorMessage(error.response.data?.message || error.response.statusText || strings.connection_failed);
            } else if (error.request) {
                setErrorMessage(strings.connection_failed || "No response from server. Please check your internet connection.");
            } else {
                setErrorMessage(error.message || strings.connection_failed);
            }

            throw error;
        } finally {
            setInitializing(false);
        }
    };

    const handleSubscribeClick = () => {
        // Navigate to payment method selection
        navigation.navigate('SelectPaymentType', {
            business_id,
            subscription_plan,
            duration_months: durationMonths,
            amount: amount
        });
    };

    const handleConfirmSubscribe = async () => {
        // Only used when coming back from SelectPaymentType with use_stripe flag
        if (!use_stripe) {
            return;
        }

        setShowConfirmModal(false);
        dispatch(setShowModalApp(false));

        try {
            setLoading(true);
            setErrorMessage('');

            const paymentData = await initializePaymentSheet();

            const { error } = await presentPaymentSheet();

            if (error) {
                // Check if user canceled (don't show error for cancellation)
                const errorType = error.type || error.code;
                if (errorType === 'Canceled' || error.message?.toLowerCase().includes('cancel')) {
                    return;
                }

                // Handle Stripe payment errors with user-friendly messages
                let userFriendlyMessage = strings.connection_failed || "Payment failed. Please try again.";

                if (error.code === 'Failed' || error.message?.includes('declined')) {
                    userFriendlyMessage = "Your card was declined. Please check your card details or use a different payment method.";
                } else if (error.message?.includes('insufficient') || error.message?.includes('funds')) {
                    userFriendlyMessage = "Your card has insufficient funds. Please use a different payment method.";
                } else if (error.message?.includes('expired')) {
                    userFriendlyMessage = "Your card has expired. Please use a different payment method.";
                } else if (error.message?.includes('incorrect') || error.message?.includes('invalid')) {
                    userFriendlyMessage = "Your card details are incorrect. Please check and try again.";
                } else {
                    // Use backend error message if available, otherwise generic message
                    userFriendlyMessage = error.message || userFriendlyMessage;
                }

                setErrorMessage(userFriendlyMessage);
                setShowErrorModal(true);
                dispatch(setShowModalApp(true));
            } else {
                // Payment succeeded - save subscription to database
                try {
                    const saveResponse = await axios.post(remote_host + '/yambi/API/save_business_subscription', {
                        phone_number: user_data.phone_number,
                        business_id: business_id,
                        amount: amount,
                        currency: 'usd',
                        payment_type: 0,
                        subscription_plan: subscription_plan,
                        subscription_duration_months: durationMonths,
                        stripe_payment_intent_id: 'N/A',
                        stripe_subscription_id: paymentData?.stripe_subscription_id || null,
                        stripe_customer_id: paymentData?.stripe_customer_id || null
                    }, {
                        timeout: 15000,
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    });

                    if (saveResponse.data.success === "1") {
                        setShowSuccessModal(true);
                        dispatch(setShowModalApp(true));
                    } else {
                        setErrorMessage(saveResponse.data.message || strings.subscription_failed_to_save);
                        setShowErrorModal(true);
                        dispatch(setShowModalApp(true));
                    }
                } catch (error: any) {
                    setErrorMessage(strings.subscription_failed_to_save || "Payment succeeded but failed to save subscription. Please contact support.");
                    setShowErrorModal(true);
                    dispatch(setShowModalApp(true));
                }
            }
        } catch (error: any) {
            // Use backend error message if available (already user-friendly)
            if (!errorMessage) {
                if (error.response?.data?.message) {
                    setErrorMessage(error.response.data.message);
                } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
                    setErrorMessage(strings.connection_failed || "Request timed out. Please check your internet connection and try again.");
                } else if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
                    setErrorMessage(strings.connection_failed || "Network error. Please check your internet connection and try again.");
                } else if (error.response) {
                    setErrorMessage(error.response.data?.message || strings.connection_failed || "Payment failed. Please try again.");
                } else if (error.request) {
                    setErrorMessage(strings.connection_failed || "No response from server. Please check your internet connection.");
                } else {
                    setErrorMessage(strings.connection_failed || "Payment failed. Please try again.");
                }
            }

            setShowErrorModal(true);
            dispatch(setShowModalApp(true));
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[{ backgroundColor: theme.colors.background, flex: 1, borderColor: theme.colors.border, borderTopWidth: 1 }, StyleSheet.absoluteFill]}>
            {showSuccessModal ? (
                <ModalApp
                    onClose={() => {
                        dispatch(setShowModalApp(false));
                        setShowSuccessModal(false);
                        navigation.goBack();
                    }}
                    singleButton
                    title={strings.success || "Success"}
                >
                    <YambiText text={strings.subscription_successful || "Your business subscription has been activated successfully!"} size="normal" color="gray" />
                </ModalApp>
            ) : null}

            {showConfirmModal ? (
                <ModalApp
                    onClose={() => {
                        dispatch(setShowModalApp(false));
                        setShowConfirmModal(false);
                    }}
                    title={strings.confirm_subscription || "Confirm Subscription"}
                    onAction={handleConfirmSubscribe}
                    textAction={strings.confirm || "Confirm"}
                    textCancel={strings.cancel || "Cancel"}
                    singleButton={false}
                >
                    <View style={{ alignItems: 'center', marginBottom: 16 }}>
                        <View style={{
                            width: 60,
                            height: 60,
                            borderRadius: 30,
                            backgroundColor: theme.colors.high_color + '20',
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginBottom: 12,
                        }}>
                            <IconApp pack="OC" name="check-circle-fill" size={30} color={theme.colors.high_color} />
                        </View>
                        <YambiText
                            text={strings.subscription_summary || "Subscription Summary"}
                            size="normal"
                            color="default"
                            bold
                            style={{ marginBottom: 8, textAlign: 'center' }}
                        />
                    </View>
                    <View style={{
                        backgroundColor: theme.colors.border + '40',
                        borderRadius: 12,
                        padding: 16,
                        marginBottom: 12,
                    }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                            <YambiText text={(strings as any).subscription_period_label || "Period"} size="normal" color="gray" />
                            <YambiText
                                text={
                                    durationMonths === 1
                                        ? ((strings as any).subscription_duration_1_month || "")
                                        : durationMonths === 6
                                            ? `${(strings as any).subscription_duration_6_months || ""}${subscription_plan !== 1 && (strings as any).subscription_one_month_free_badge ? ` · ${(strings as any).subscription_one_month_free_badge}` : ""}`
                                            : `${(strings as any).subscription_duration_12_months || ""}${subscription_plan !== 1 && (strings as any).subscription_two_months_free_badge ? ` · ${(strings as any).subscription_two_months_free_badge}` : ""}`
                                }
                                size="normal"
                                color="default"
                                bold
                            />
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                            <YambiText text={strings.amount || "Amount"} size="normal" color="gray" />
                            <YambiText text={`$${amount.toFixed(2)}`} size="normal" color="default" bold />
                        </View>
                        <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: theme.colors.border }}>
                            <YambiText
                                text={confirmModalDurationInfo}
                                size="small"
                                color="gray"
                                style={{ fontSize: 11, lineHeight: 16 }}
                            />
                        </View>
                    </View>
                    <YambiText
                        text={strings.confirm_subscription_message || "Are you sure you want to proceed with this subscription?"}
                        size="normal"
                        color="gray"
                        style={{ textAlign: 'center', marginTop: 8 }}
                    />
                </ModalApp>
            ) : null}

            {showErrorModal ? (
                <ModalApp
                    onClose={() => {
                        dispatch(setShowModalApp(false));
                        setShowErrorModal(false);
                    }}
                    singleButton
                    title={strings.error}
                >
                    <YambiText text={errorMessage || strings.connection_failed} size="normal" color="gray" />
                </ModalApp>
            ) : null}

            <View style={{ flex: 1 }}>
                <StatusBarYambi />

                <ScrollView
                    keyboardShouldPersistTaps='handled'
                    style={{ flex: 1, backgroundColor: 'transparent' }}
                    contentContainerStyle={{ paddingBottom: 30 }}
                >
                    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
                        {/* Header Section */}
                        <View style={{
                            backgroundColor: theme.colors.border,
                            marginHorizontal: 20,
                            marginTop: 20,
                            marginBottom: 15,
                            borderRadius: 16,
                            padding: 24,
                            alignItems: 'center',
                        }}>
                            <View style={{
                                width: 80,
                                height: 80,
                                borderRadius: 40,
                                backgroundColor: theme.colors.high_color + '20',
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginBottom: 16,
                            }}>
                                <IconApp pack="OC" name="check-circle-fill" size={40} color={theme.colors.high_color} />
                            </View>

                            <YambiText
                                text={strings.subscribe_to_plan}
                                size="big"
                                color="default"
                                bold
                                style={{ marginBottom: 8, textAlign: 'center' }}
                            />

                            <YambiText
                                text={`${PLAN_NAMES[subscription_plan] || 'Plan'} — $${amount.toFixed(2)}`}
                                size="normal"
                                color="gray"
                                style={{ textAlign: 'center', lineHeight: 22, marginBottom: 8 }}
                            />

                            <YambiText
                                text={strings.subscribe_description}
                                size="normal"
                                color="gray"
                                style={{ textAlign: 'center', lineHeight: 22 }}
                            />

                            <YambiText
                                text={(strings as any).one_time_payment_intro || ""}
                                size="small"
                                color="gray"
                                style={{ textAlign: 'center', lineHeight: 20, marginTop: 10 }}
                            />
                        </View>

                        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
                            <YambiText
                                text={(strings as any).subscription_period_title || "Choose period"}
                                size="normal"
                                color="default"
                                bold
                                style={{ marginBottom: 12 }}
                            />

                            <View style={{ gap: 12 }}>
                                {DURATION_OPTIONS.map((d) => (
                                    (() => {
                                        const disabled = isDurationDisabled(d);
                                        return (
                                            <Pressable
                                                key={d}
                                                style={{
                                                    backgroundColor: durationMonths === d ? theme.colors.high_color + '20' : theme.colors.border,
                                                    borderRadius: 12,
                                                    padding: 16,
                                                    borderWidth: 2,
                                                    borderColor: durationMonths === d ? theme.colors.high_color : theme.colors.border,
                                                    opacity: disabled ? 0.45 : 1,
                                                }}
                                                disabled={disabled}
                                                onPress={() => {
                                                    if (!disabled) {
                                                        setDurationMonths(d);
                                                    }
                                                }}
                                            >
                                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                                                        <IconApp
                                                            pack="FI"
                                                            name="calendar"
                                                            size={18}
                                                            color={durationMonths === d ? theme.colors.high_color : theme.colors.gray}
                                                        />
                                                        <YambiText
                                                            text={
                                                                d === 1
                                                                    ? ((strings as any).subscription_duration_1_month || "")
                                                                    : d === 6
                                                                        ? ((strings as any).subscription_duration_6_months || "")
                                                                        : ((strings as any).subscription_duration_12_months || "")
                                                            }
                                                            size="normal"
                                                            color={durationMonths === d ? "high" : "default"}
                                                            bold
                                                            style={{ marginLeft: 8 }}
                                                        />
                                                    </View>
                                                    {d === 6 && subscription_plan !== 1 ? (
                                                        <View style={{
                                                            backgroundColor: theme.colors.high_color + '30',
                                                            paddingHorizontal: 8,
                                                            paddingVertical: 4,
                                                            borderRadius: 8,
                                                        }}>
                                                            <YambiText
                                                                text={(strings as any).subscription_one_month_free_badge || ""}
                                                                size="small"
                                                                color="high"
                                                                style={{ fontSize: 11 }}
                                                            />
                                                        </View>
                                                    ) : d === 12 && subscription_plan !== 1 ? (
                                                        <View style={{
                                                            backgroundColor: theme.colors.high_color + '30',
                                                            paddingHorizontal: 8,
                                                            paddingVertical: 4,
                                                            borderRadius: 8,
                                                        }}>
                                                            <YambiText
                                                                text={(strings as any).subscription_two_months_free_badge || ""}
                                                                size="small"
                                                                color="high"
                                                                style={{ fontSize: 11 }}
                                                            />
                                                        </View>
                                                    ) : null}
                                                </View>
                                                <YambiText
                                                    text={
                                                        d === 1
                                                            ? ((strings as any).subscription_duration_1_subtext || "")
                                                            : subscription_plan === 1
                                                                ? (d === 6
                                                                    ? ((strings as any).subscription_duration_6_subtext_basic || "")
                                                                    : ((strings as any).subscription_duration_12_subtext_basic || ""))
                                                                : (d === 6
                                                                    ? ((strings as any).subscription_duration_6_subtext || "")
                                                                    : ((strings as any).subscription_duration_12_subtext || ""))
                                                    }
                                                    size="small"
                                                    color="gray"
                                                    style={{ fontSize: 11, marginLeft: 26 }}
                                                />
                                                <YambiText
                                                    text={`$${getOneTimeAmount(subscription_plan, d).toFixed(2)}`}
                                                    size="normal"
                                                    color={durationMonths === d ? "high" : "default"}
                                                    bold
                                                    style={{ marginLeft: 26, marginTop: 6 }}
                                                />
                                            </Pressable>
                                        );
                                    })()
                                ))}
                            </View>
                        </View>

                        {/* Subscription Details */}
                        <View style={{
                            backgroundColor: theme.colors.border + '40',
                            marginHorizontal: 20,
                            marginBottom: 20,
                            borderRadius: 12,
                            padding: 16,
                        }}>
                            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
                                <IconApp pack="FI" name="info" size={16} color={theme.colors.high_color} styles={{ marginRight: 8, marginTop: 2 }} />
                                <View style={{ flex: 1 }}>
                                    <YambiText
                                        text={subscriptionDetailsInfo}
                                        size="small"
                                        color="gray"
                                        style={{ lineHeight: 18 }}
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Price Display */}
                        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
                            <View style={{
                                backgroundColor: theme.colors.border,
                                borderRadius: 12,
                                padding: 20,
                                alignItems: 'center',
                            }}>
                                <YambiText
                                    text={(strings as any).one_time_total_label || "One-time total"}
                                    size="small"
                                    color="gray"
                                    style={{ marginBottom: 8 }}
                                />
                                <YambiText
                                    text={`$${amount.toFixed(2)}`}
                                    size="big"
                                    color="default"
                                    bold
                                    style={{ marginBottom: 4 }}
                                />
                                <YambiText
                                    text={
                                        durationMonths === 1
                                            ? `${(strings as any).subscription_duration_1_month || ""} · ${(strings as any).one_time_no_renewal || ""}`
                                            : durationMonths === 6
                                                ? `${(strings as any).subscription_duration_6_months || ""} · ${(strings as any).one_time_no_renewal || ""}`
                                                : `${(strings as any).subscription_duration_12_months || ""} · ${(strings as any).one_time_no_renewal || ""}`
                                    }
                                    size="small"
                                    color="gray"
                                    style={{ textAlign: 'center' }}
                                />
                            </View>
                        </View>

                        {/* Subscribe Button */}
                        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
                            <Pressable
                                style={{
                                    backgroundColor: theme.colors.badge_background_color,
                                    borderRadius: 12,
                                    padding: 18,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexDirection: 'row',
                                    opacity: (loading || initializing) ? 0.6 : 1,
                                }}
                                onPress={handleSubscribeClick}
                                disabled={loading || initializing}
                            >
                                {loading || initializing ? (
                                    <>
                                        <ActivityIndicator color={theme.colors.badge_color} size="small" style={{ marginRight: 10 }} />
                                        <YambiText
                                            text={strings.processing || "Processing..."}
                                            color="badge"
                                            style={{ marginRight: 0 }}
                                        />
                                    </>
                                ) : (
                                    <>
                                        <IconApp pack="FI" name="arrow-right" size={18} color={theme.colors.badge_color} styles={{ marginRight: 8 }} />
                                        <YambiText
                                            text={(strings as any).continue || "Continue"}
                                            bold
                                            color="badge"
                                            style={{ marginRight: 0 }}
                                        />
                                    </>
                                )}
                            </Pressable>
                        </View>
                    </View>
                </ScrollView>
            </View>
        </View>
    );
};

export default AddBusinessSubscription;
