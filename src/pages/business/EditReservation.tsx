import React, { useLayoutEffect, useState, useCallback } from 'react';
import { View, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useAppSelector, useAppDispatch } from '../../store/app/hooks';
import { useRealm, useQuery } from '@realm/react';
import { Reservations as ReservationsModel, Payments, BusinessUsers } from '../../store/database/Models';
import { NavProps } from '../../types/types';
import { strings } from '../../lang/lang';
import { renderCurrency, renderDateTime, SocketApp } from '../../../GlobalVariables';
import { setShowModalApp } from '../../store/reducers/appSlice';
import ModalApp from '../../components/app/ModalApp';
import ButtonNormal from '../../components/app/ButtonNormal';
import {
    TextNormalYambi, TextSmallYambiGray, TextSmallYambi, YambiText, TextNormalYambiGray
} from '../../components/app/Text';
import { IconApp } from '../../components/app/IconApp';
import SalePaymentItem from '../../components/lists/business/SalePaymentItem';
import moment from 'moment';

const EditReservation = ({ navigation, route }: NavProps) => {
    const { reservationId } = route.params;
    const app_theme = useAppSelector(state => state.app_theme);
    const user_data = useAppSelector(state => state.user_data);
    const dispatch = useAppDispatch();
    const realm = useRealm();

    // Query Reservation
    const reservation = realm.objectForPrimaryKey<any>('Reservations', reservationId);

    // Payments (include all payments, even cancelled ones, so they show in history)
    const payments = useQuery(Payments, p =>
        p.filtered('reservation_id == $0', reservationId).sorted('createdAt', true),
        [reservationId]
    );

    const activePaymentsCount = Array.from(payments).filter((p: any) => p.payment_status !== 4).length;
    const hasInstallments = activePaymentsCount > 0;

    // Query business users
    const businessUsers = useQuery(BusinessUsers, users => {
        return users.filtered('business_id == $0', reservation?.business_id || '');
    }, [reservation?.business_id]);

    const getOperatorName = useCallback((phone: string) => {
        if (!phone) return "";
        const found = businessUsers.find(u => u.user === phone || u.phone_number === phone);
        return found?.user_name || "";
    }, [businessUsers]);

    // State for details
    const [customerName, setCustomerName] = useState(reservation?.customer_name || '');
    const [customerPhone, setCustomerPhone] = useState(reservation?.customer_phone || '');
    const [quantity, setQuantity] = useState(reservation?.quantity?.toString() || '1');
    const [totalAmount, setTotalAmount] = useState(reservation?.total_amount || '0');

    const isChanged = customerName !== (reservation?.customer_name || '') ||
        customerPhone !== (reservation?.customer_phone || '') ||
        quantity !== (reservation?.quantity?.toString() || '1') ||
        totalAmount !== (reservation?.total_amount || '0');

    const handlePhonePress = useCallback((phone: string) => {
        if (!phone) return;
        if (phone === user_data.phone_number) {
            navigation.navigate('SettingsYambi' as never);
        } else {
            navigation.navigate('Inbox', { user: phone } as never);
        }
    }, [user_data.phone_number, navigation]);

    // Alert state using ModalApp
    const [alertTitle, setAlertTitle] = useState('');
    const [alertMsg, setAlertMsg] = useState('');
    const [showAlertModal, setShowAlertModal] = useState(false);

    const triggerAlert = (title: string, message: string) => {
        setAlertTitle(title);
        setAlertMsg(message);
        setShowAlertModal(true);
        dispatch(setShowModalApp(true));
    };

    useLayoutEffect(() => {
        navigation.setOptions({
            title: strings.edit || "Edit Reservation",
            headerRight: undefined,
        });
    }, [navigation]);

    if (!reservation) {
        return (
            <View style={{ flex: 1, backgroundColor: app_theme.colors.background, justifyContent: 'center', alignItems: 'center' }}>
                <TextNormalYambiGray text="Reservation not found" />
            </View>
        );
    }

    const cur = renderCurrency(reservation.currency, false);

    // ── Save Details ────────────────────────────────────────────────────────
    const handleSave = () => {
        const qty = parseInt(quantity) || 1;
        const total = parseFloat(totalAmount) || 0;

        if (total <= 0) {
            triggerAlert(strings.error, strings.invalid_number_error || 'Invalid amount');
            return;
        }

        // Sum current active deposits
        const totalDeposit = Array.from(payments).reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0);

        if (totalDeposit > total) {
            triggerAlert(
                strings.error,
                `Total amount cannot be less than total deposit paid (${totalDeposit.toFixed(2)} ${cur})`
            );
            return;
        }

        const remaining = Math.max(0, total - totalDeposit);

        try {
            realm.write(() => {
                reservation.customer_name = customerName;
                reservation.customer_phone = customerPhone;
                reservation.quantity = qty;
                reservation.total_amount = total.toString();
                reservation.deposit_amount = totalDeposit.toString();
                reservation.remaining_amount = remaining.toString();
                reservation.updatedAt = moment().toISOString();

                // Adjust status if needed
                if (remaining <= 0) {
                    reservation.status = 3; // Completed
                } else if (reservation.status === 3) {
                    reservation.status = totalDeposit > 0 ? 2 : 1; // Confirmed or Pending
                }
            });

            SocketApp.emit("newReservations", JSON.stringify({ phone_number: user_data.phone_number, items: [reservation] }));
            navigation.goBack();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <ScrollView style={{ flex: 1, backgroundColor: app_theme.colors.background }} showsVerticalScrollIndicator={false}>
            <View style={{ paddingVertical: 10, marginBottom: 40 }}>
                {/* ── Reservation Details Form Card ── */}
                <View style={{
                    backgroundColor: app_theme.colors.border,
                    margin: 15,
                    padding: 16,
                    borderRadius: 16,
                    elevation: 2,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 3,
                }}>
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderBottomWidth: 1,
                        borderColor: app_theme.colors.background,
                        paddingBottom: 10,
                        marginBottom: 16
                    }}>
                        <YambiText bold text="Client & Order Details" />
                        <Feather name="user" size={16} color={app_theme.colors.text} />
                    </View>

                    <View style={{ marginBottom: 14 }}>
                        <YambiText bold text={(strings as any).client_name || 'Client Name'} size="small" />
                        <TextInput
                            value={customerName}
                            onChangeText={setCustomerName}
                            style={{
                                borderWidth: 2,
                                borderColor: app_theme.colors.background,
                                borderRadius: 10,
                                paddingHorizontal: 15,
                                height: 50,
                                fontSize: 15,
                                color: app_theme.colors.text,
                                backgroundColor: app_theme.colors.background,
                                marginTop: 8,
                            }}
                            placeholder="John Doe"
                            placeholderTextColor={app_theme.colors.gray}
                        />
                    </View>

                    <View style={{ marginBottom: 14 }}>
                        <YambiText bold text={(strings as any).client_phone || 'Client Phone'} size="small" />
                        <TextInput
                            value={customerPhone}
                            onChangeText={setCustomerPhone}
                            keyboardType="phone-pad"
                            style={{
                                borderWidth: 2,
                                borderColor: app_theme.colors.background,
                                borderRadius: 10,
                                paddingHorizontal: 15,
                                height: 50,
                                fontSize: 15,
                                color: app_theme.colors.text,
                                backgroundColor: app_theme.colors.background,
                                marginTop: 8,
                            }}
                            placeholder="+1234567890"
                            placeholderTextColor={app_theme.colors.gray}
                        />
                    </View>

                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <View style={{ flex: 1 }}>
                            <YambiText bold text={strings.quantity} size="small" />
                            <TextInput
                                value={quantity}
                                onChangeText={setQuantity}
                                keyboardType="numeric"
                                editable={!hasInstallments}
                                style={{
                                    borderWidth: 2,
                                    borderColor: app_theme.colors.background,
                                    borderRadius: 10,
                                    paddingHorizontal: 15,
                                    height: 50,
                                    fontSize: 15,
                                    color: app_theme.colors.text,
                                    backgroundColor: app_theme.colors.background,
                                    marginTop: 8,
                                    opacity: hasInstallments ? 0.65 : 1,
                                }}
                            />
                        </View>

                        <View style={{ flex: 2 }}>
                            <YambiText bold text={`${(strings as any).total_reserved || 'Total Amount'} (${cur})`} size="small" />
                            <TextInput
                                value={totalAmount}
                                onChangeText={setTotalAmount}
                                keyboardType="decimal-pad"
                                editable={!hasInstallments}
                                style={{
                                    borderWidth: 2,
                                    borderColor: app_theme.colors.background,
                                    borderRadius: 10,
                                    paddingHorizontal: 15,
                                    height: 50,
                                    fontSize: 15,
                                    color: app_theme.colors.text,
                                    backgroundColor: app_theme.colors.background,
                                    marginTop: 8,
                                    opacity: hasInstallments ? 0.65 : 1,
                                }}
                            />
                        </View>
                    </View>
                </View>

                {/* ── Installments List Card ── */}
                <View style={{
                    backgroundColor: app_theme.colors.border,
                    margin: 15,
                    marginTop: 0,
                    borderRadius: 16,
                    overflow: 'hidden',
                    elevation: 2,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 3,
                }}>
                    <View style={{
                        padding: 16,
                        borderBottomWidth: 1,
                        borderColor: app_theme.colors.background,
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Feather name="credit-card" size={16} color={app_theme.colors.text} style={{ marginRight: 8 }} />
                            <YambiText bold text={(strings as any).installments || 'Installments'} />
                        </View>
                    </View>

                    {payments.length === 0 ? (
                        <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                            <YambiText text="No payments registered" color="gray" />
                        </View>
                    ) : (
                        Array.from(payments).map((pmt: any, idx: number) => {
                            const agent = getOperatorName(pmt.agent_paid);
                            return (
                                <SalePaymentItem
                                    key={pmt._id}
                                    pmt={pmt}
                                    agentName={agent}
                                    onPhonePress={handlePhonePress}
                                    onPress={() => navigation.navigate('SalePayment' as never, { paymentId: pmt._id } as never)}
                                    isLast={idx === payments.length - 1}
                                />
                            );
                        })
                    )}
                </View>

                {/* Save button using ButtonNormal */}
                {isChanged && (
                    <View style={{ marginHorizontal: 15, marginTop: 10, marginBottom: 20 }}>
                        <ButtonNormal
                            title={strings.save || "Save"}
                            loadEnabled={true}
                            onPress={handleSave}
                            normal={true}
                        />
                    </View>
                )}
            </View>

            {/* Alert Modal using ModalApp */}
            {showAlertModal && (
                <ModalApp
                    title={alertTitle}
                    singleButton
                    onClose={() => {
                        setShowAlertModal(false);
                        dispatch(setShowModalApp(false));
                    }}
                >
                    <YambiText color="gray" text={alertMsg} />
                </ModalApp>
            )}
        </ScrollView>
    );
};

export default EditReservation;
