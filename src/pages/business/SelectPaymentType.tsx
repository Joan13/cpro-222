import React, { useState } from 'react';
import {
    View,
    ScrollView,
    Pressable,
    StyleSheet,
    Image,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import { strings } from '../../lang/lang';
import { useAppSelector, useAppDispatch } from '../../store/app/hooks';
import StatusBarYambi from '../../components/app/StatusBar';
import { YambiText } from '../../components/app/Text';
import { IconApp } from '../../components/app/IconApp';
import { NavProps } from '../../types/types';
import ModalApp from '../../components/app/ModalApp';
import { setShowModalApp } from '../../store/reducers/appSlice';
import { remote_host } from '../../../GlobalVariables';

// --- Types ---

type MobileProviderId = 'airtel' | 'mpesa' | 'orange' | 'afrimoney';

/** Maps our provider ID to the SerdiPay telecom code */
const TELECOM_CODES: Record<MobileProviderId, string> = {
    airtel: 'AM',
    mpesa: 'MP',
    orange: 'OM',
    afrimoney: 'AF',
};

const mobileMoneyProviders: Array<{
    id: MobileProviderId;
    nameKey: string;
    logo: ReturnType<typeof require>;
}> = [
        {
            id: 'airtel',
            nameKey: 'payment_provider_airtel_money',
            logo: require('../../assets/airtel.png'),
        },
        {
            id: 'mpesa',
            nameKey: 'payment_provider_vodacom_mpesa',
            logo: require('../../assets/mpesa.png'),
        },
        {
            id: 'orange',
            nameKey: 'payment_provider_orange_money',
            logo: require('../../assets/orange.png'),
        },
        {
            id: 'afrimoney',
            nameKey: 'payment_provider_afrimoney',
            logo: require('../../assets/afrimoney.png'),
        },
    ];

// --- Component ---

const SelectPaymentType = ({ navigation, route }: NavProps) => {
    const theme = useAppSelector(state => state.app_theme);
    const user_data = useAppSelector(state => state.user_data);
    const dispatch = useAppDispatch();

    // Single typed alias – avoids repeated `(strings as any)` casts throughout the JSX
    const s = strings as any;

    const { business_id, subscription_plan, duration_months, amount } = route.params || {};

    // Modal & provider selection
    const [selectedProvider, setSelectedProvider] = useState<MobileProviderId | null>(null);
    const [showPhoneModal, setShowPhoneModal] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');

    // Loading / result states
    const [loading, setLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [showInitiatedModal, setShowInitiatedModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // --- Handlers ---

    const openProviderModal = (provider: MobileProviderId) => {
        setSelectedProvider(provider);
        setPhoneNumber('');
        setShowPhoneModal(true);
        dispatch(setShowModalApp(true));
    };

    const closeProviderModal = () => {
        setShowPhoneModal(false);
        dispatch(setShowModalApp(false));
        setPhoneNumber('');
        setSelectedProvider(null);
    };

    const handleBankCardClick = () => {
        // Navigate back to AddBusinessSubscription, triggering the Stripe flow
        navigation.navigate('AddBusinessSubscription', {
            business_id,
            subscription_plan,
            use_stripe: true,
        });
    };

    const handleConfirmMobilePayment = async () => {
        if (!phoneNumber.trim()) return;
        if (!selectedProvider) return;

        setShowPhoneModal(false);
        dispatch(setShowModalApp(false));
        setLoading(true);

        try {
            const response = await axios.post(
                remote_host + '/yambi/API/add_business_subscription_momo',
                {
                    phone_number: user_data.phone_number,
                    business_id,
                    amount,
                    currency: 'usd',
                    subscription_plan,
                    subscription_duration_months: duration_months,
                    payment_phone_number: phoneNumber.trim(),
                    telecom: TELECOM_CODES[selectedProvider],
                },
                {
                    timeout: 60000, // 60 s – mobile money can be slow
                    headers: { 'Content-Type': 'application/json' },
                }
            );

            if (response.data?.success === '1') {
                // pending = true  → USSD push sent, waiting for user to confirm on phone
                // pending = false → payment completed immediately (rare)
                if (response.data.pending !== false) {
                    setShowInitiatedModal(true);
                } else {
                    setShowSuccessModal(true);
                }
                dispatch(setShowModalApp(true));
            } else {
                setErrorMessage(
                    response.data?.message || s.mobile_money_payment_failed
                );
                setShowErrorModal(true);
                dispatch(setShowModalApp(true));
            }
        } catch (err: any) {
            let msg: string = s.mobile_money_payment_failed;

            if (err.response?.data?.message) {
                msg = err.response.data.message;
            } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
                msg = s.connection_failed;
            } else if (err.message?.includes('Network Error') || err.code === 'ERR_NETWORK') {
                msg = s.connection_failed;
            }

            setErrorMessage(msg);
            setShowErrorModal(true);
            dispatch(setShowModalApp(true));
        } finally {
            setLoading(false);
            setSelectedProvider(null);
        }
    };

    const handleSuccessClose = () => {
        setShowSuccessModal(false);
        setShowInitiatedModal(false);
        dispatch(setShowModalApp(false));
        // Navigate back to the business screen (pop twice: SelectPaymentType + AddBusinessSubscription)
        navigation.popToTop?.() || navigation.goBack();
    };

    const handleErrorClose = () => {
        setShowErrorModal(false);
        dispatch(setShowModalApp(false));
    };

    // --- Provider label helper ---
    const providerLabel = (id: MobileProviderId) =>
        s[mobileMoneyProviders.find(p => p.id === id)?.nameKey ?? ''];

    // --- Render ---
    return (
        <View
            style={{ flex: 1, backgroundColor: theme.colors.background, borderColor: theme.colors.border, borderTopWidth: 1 }}
        >
            {/* ── Phone-number modal (mobile money) ── */}
            {showPhoneModal && selectedProvider && (
                <ModalApp
                    onClose={closeProviderModal}
                    title={s.enter_phone_number}
                    onAction={handleConfirmMobilePayment}
                    textAction={s.confirm_payment}
                    textCancel={s.cancel}
                    singleButton={false}
                >
                    <View style={{ paddingVertical: 10 }}>
                        <YambiText
                            text={`${s.payment_provider}: ${providerLabel(selectedProvider)}`}
                            size="normal"
                            color="gray"
                            style={{ marginBottom: 12, textAlign: 'center' }}
                        />
                        <YambiText
                            text={s.enter_mobile_money_number}
                            size="small"
                            color="gray"
                            style={{ marginBottom: 16, textAlign: 'center' }}
                        />
                        <TextInput
                            style={{
                                backgroundColor: theme.colors.border,
                                borderRadius: 8,
                                padding: 12,
                                color: theme.colors.text,
                                fontSize: 16,
                                textAlign: 'center',
                            }}
                            placeholder={s.phone_number}
                            placeholderTextColor={theme.colors.gray}
                            value={phoneNumber}
                            onChangeText={setPhoneNumber}
                            keyboardType="phone-pad"
                            maxLength={15}
                        />
                        <YambiText
                            text={`${s.total_amount}: $${amount?.toFixed(2) ?? '0.00'}`}
                            size="normal"
                            color="high"
                            bold
                            style={{ marginTop: 16, textAlign: 'center' }}
                        />
                    </View>
                </ModalApp>
            )}

            {/* ── Payment-initiated modal ── */}
            {showInitiatedModal && (
                <ModalApp
                    onClose={handleSuccessClose}
                    title={s.mobile_money}
                    onAction={handleSuccessClose}
                    textAction={s.ok}
                    singleButton
                >
                    <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                        <IconApp pack="FI" name="clock" size={40} color={theme.colors.high_color} styles={{ marginBottom: 12 }} />
                        <YambiText
                            text={s.mobile_money_payment_initiated}
                            size="normal"
                            color="default"
                            style={{ textAlign: 'center', lineHeight: 22 }}
                        />
                    </View>
                </ModalApp>
            )}

            {/* ── Success modal ── */}
            {showSuccessModal && (
                <ModalApp
                    onClose={handleSuccessClose}
                    title={s.success}
                    onAction={handleSuccessClose}
                    textAction={s.ok}
                    singleButton
                >
                    <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                        <IconApp pack="FI" name="check-circle" size={40} color={theme.colors.high_color} styles={{ marginBottom: 12 }} />
                        <YambiText
                            text={s.mobile_money_payment_success}
                            size="normal"
                            color="default"
                            style={{ textAlign: 'center', lineHeight: 22 }}
                        />
                    </View>
                </ModalApp>
            )}

            {/* ── Error modal ── */}
            {showErrorModal && (
                <ModalApp
                    onClose={handleErrorClose}
                    title={s.error}
                    onAction={handleErrorClose}
                    textAction={s.ok}
                    singleButton
                >
                    <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                        <IconApp pack="FI" name="alert-circle" size={40} color="red" styles={{ marginBottom: 12 }} />
                        <YambiText
                            text={errorMessage}
                            size="normal"
                            color="default"
                            style={{ textAlign: 'center', lineHeight: 22 }}
                        />
                    </View>
                </ModalApp>
            )}

            {/* ── Main content ── */}
            <View style={{ flex: 1 }}>
                <StatusBarYambi />

                {loading && (
                    <View
                        style={{
                            ...StyleSheet.absoluteFillObject,
                            backgroundColor: theme.colors.background + 'CC',
                            justifyContent: 'center',
                            alignItems: 'center',
                            zIndex: 100,
                        }}
                    >
                        <ActivityIndicator size="large" color={theme.colors.high_color} />
                        <YambiText
                            text={s.processing_payment}
                            size="normal"
                            color="gray"
                            style={{ marginTop: 12 }}
                        />
                    </View>
                )}

                <ScrollView
                    style={{ flex: 1, backgroundColor: 'transparent' }}
                    contentContainerStyle={{ paddingBottom: 30 }}
                >
                    <View style={{ flex: 1, backgroundColor: theme.colors.background, paddingHorizontal: 20 }}>

                        {/* ── Header card ── */}
                        <View
                            style={{
                                backgroundColor: theme.colors.border,
                                marginTop: 20,
                                marginBottom: 20,
                                borderRadius: 16,
                                padding: 24,
                                alignItems: 'center',
                            }}
                        >
                            <View
                                style={{
                                    width: 70,
                                    height: 70,
                                    borderRadius: 35,
                                    backgroundColor: theme.colors.high_color + '20',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginBottom: 16,
                                }}
                            >
                                <IconApp pack="FI" name="credit-card" size={35} color={theme.colors.high_color} />
                            </View>

                            <YambiText
                                text={s.select_payment_method}
                                size="big"
                                color="default"
                                bold
                                style={{ marginBottom: 8, textAlign: 'center' }}
                            />

                            <YambiText
                                text={`${s.total_amount}: $${amount?.toFixed(2) ?? '0.00'}`}
                                size="normal"
                                color="gray"
                                style={{ textAlign: 'center', marginBottom: 4 }}
                            />

                            <YambiText
                                text={`${s.subscription_duration_months_label}: ${duration_months} ${s.months}`}
                                size="small"
                                color="gray"
                                style={{ textAlign: 'center' }}
                            />
                        </View>

                        {/* ── Mobile Money section ── */}
                        <View style={{ marginBottom: 24 }}>
                            <YambiText
                                text={s.mobile_money}
                                size="normal"
                                color="default"
                                bold
                                style={{ marginBottom: 12 }}
                            />

                            <View style={{ gap: 12 }}>
                                {mobileMoneyProviders.map((provider) => (
                                    <Pressable
                                        key={provider.id}
                                        style={{
                                            backgroundColor: theme.colors.border,
                                            borderRadius: 12,
                                            padding: 16,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            borderWidth: 2,
                                            borderColor:
                                                selectedProvider === provider.id
                                                    ? theme.colors.high_color
                                                    : 'transparent',
                                        }}
                                        onPress={() => openProviderModal(provider.id)}
                                        disabled={loading}
                                    >
                                        <Image
                                            source={provider.logo}
                                            style={{ width: 40, height: 40, marginRight: 12, borderRadius: 8 }}
                                            resizeMode="contain"
                                        />
                                        <YambiText
                                            text={s[provider.nameKey]}
                                            size="normal"
                                            color="default"
                                            bold={selectedProvider === provider.id}
                                        />
                                        <View style={{ flex: 1 }} />
                                        <IconApp
                                            pack="FI"
                                            name="chevron-right"
                                            size={18}
                                            color={theme.colors.gray}
                                        />
                                    </Pressable>
                                ))}
                            </View>
                        </View>

                        {/* ── Bank Card section ── */}
                        {/* <View style={{ marginBottom: 24 }}>
                            <YambiText
                                text={s.bank_card}
                                size="normal"
                                color="default"
                                bold
                                style={{ marginBottom: 12 }}
                            />

                            <Pressable
                                style={{
                                    backgroundColor: theme.colors.badge_background_color,
                                    borderRadius:    12,
                                    padding:         18,
                                    flexDirection:   'row',
                                    alignItems:      'center',
                                    justifyContent:  'center',
                                }}
                                onPress={handleBankCardClick}
                                disabled={loading}
                            >
                                <IconApp
                                    pack="FI"
                                    name="credit-card"
                                    size={20}
                                    color={theme.colors.badge_color}
                                    styles={{ marginRight: 10 }}
                                />
                                <YambiText
                                    text={s.pay_with_card}
                                    size="normal"
                                    color="badge"
                                    bold
                                />
                            </Pressable>
                        </View> */}

                        {/* ── Info box ── */}
                        <View
                            style={{
                                backgroundColor: theme.colors.border + '40',
                                borderRadius: 12,
                                padding: 16,
                                marginBottom: 20,
                            }}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                                <IconApp
                                    pack="FI"
                                    name="info"
                                    size={16}
                                    color={theme.colors.high_color}
                                    styles={{ marginRight: 8, marginTop: 2 }}
                                />
                                <View style={{ flex: 1 }}>
                                    <YambiText
                                        text={s.payment_method_info}
                                        size="small"
                                        color="gray"
                                        style={{ lineHeight: 18 }}
                                    />
                                </View>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </View>
        </View>
    );
};

export default SelectPaymentType;
