import React, { useCallback, useState, useLayoutEffect } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useAppSelector, useAppDispatch } from '../../store/app/hooks';
import { useObject, useQuery, useRealm } from '@realm/react';
import { BusinessUsers, Payments, BusinessItemsSale, UserBusinesses, UserSellsPoints, UserBusinessArticles, Reservations } from '../../store/database/Models';
import { YambiText } from '../../components/app/Text';
import { NavProps } from '../../types/types';
import { renderCurrency, renderDateTime, SocketApp } from '../../../GlobalVariables';
import { strings } from '../../lang/lang';
import { setShowModalApp } from '../../store/reducers/appSlice';
import ButtonNormal from '../../components/app/ButtonNormal';
import ModalApp from '../../components/app/ModalApp';

const SalePayment = ({ navigation, route }: NavProps) => {
    const { paymentId, sale } = route.params;
    const app_theme = useAppSelector(state => state.app_theme);
    const user_data = useAppSelector(state => state.user_data);
    const realm = useRealm();
    const dispatch = useAppDispatch();
 
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
    const [showDeleteSuccessModal, setShowDeleteSuccessModal] = useState(false);

    // Query this specific payment
    const payment = realm.objectForPrimaryKey<any>('Payments', paymentId);

    // Set header delete button dynamically
    useLayoutEffect(() => {
        if (payment && payment.payment_status !== 4) {
            navigation.setOptions({
                headerRight: () => (
                    <Pressable
                        onPress={() => {
                            setShowDeleteConfirmModal(true);
                            dispatch(setShowModalApp(true));
                        }}
                        style={{ paddingHorizontal: 12, paddingVertical: 8 }}
                    >
                        <Feather name="trash-2" size={22} color={app_theme.colors.text_design1 || app_theme.colors.text} />
                    </Pressable>
                ),
            });
        } else {
            navigation.setOptions({
                headerRight: undefined,
            });
        }
    }, [navigation, payment, payment?.payment_status, app_theme.colors.text_design1, app_theme.colors.text]);

    // Resolve sale object from DB using payment.sale_id as fallback
    const saleObject = useObject(BusinessItemsSale, payment?.sale_id || '');
    const resolvedSale = sale || saleObject;

    // Resolve reservation object
    const reservation = useObject(Reservations, payment?.reservation_id || '');

    const businessId = resolvedSale?.business_id || reservation?.business_id || '';
    const salesPointId = resolvedSale?.sales_point_id || reservation?.sales_point_id || '';
    const itemId = resolvedSale?.item_id || reservation?.item_id || '';

    // Query business users to translate agent paid
    const businessUsers = useQuery(BusinessUsers, users => {
        return users.filtered('business_id == $0', businessId);
    }, [businessId]);

    // Resolve business, sales point, and item
    const business = useObject(UserBusinesses, businessId);
    const salesPoint = useObject(UserSellsPoints, salesPointId);
    const itemObject = useObject(UserBusinessArticles, itemId);

    const getOperatorName = useCallback((phone: string) => {
        if (!phone) return "";
        const found = businessUsers.find(u => u.user === phone || u.phone_number === phone);
        if (found && found.user_name) {
            return found.user_name;
        }
        return found ? found.user_name : "";
    }, [businessUsers]);

    const handlePhonePress = useCallback((phone: string) => {
        if (!phone) return;
        if (phone === user_data.phone_number) {
            navigation.navigate('SettingsYambi' as never);
        } else {
            navigation.navigate('Inbox', { user: phone } as never);
        }
    }, [user_data.phone_number, navigation]);

    if (!payment) {
        return (
            <View style={{ flex: 1, backgroundColor: app_theme.colors.background, justifyContent: 'center', alignItems: 'center' }}>
                <YambiText text={(strings as any).payment_details_not_found || "Payment details not found"} color="gray" />
            </View>
        );
    }

    const isPaid = payment.payment_status === 2;
    const statusColor = payment.payment_status === 4 ? app_theme.colors.gray : isPaid ? '#4CAF50' : '#FF9800';
 
    const renderPaymentMethodLabel = (method: number) => {
        switch (method) {
            case 1: return (strings as any).paid_cash || "Paid Cash";
            case 2: return (strings as any).paid_mobile_money || "Paid by Mobile Money";
            case 3: return (strings as any).paid_card || "Paid by Card";
            default: return (strings as any).paid_cash || "Paid Cash";
        }
    };
 
    const methodLabel = payment.payment_status === 4
        ? ((strings as any).payment_cancelled || "Payment cancelled")
        : isPaid
        ? renderPaymentMethodLabel(payment.payment_method)
        : ((strings as any).payment_pending || "Payment pending");
 
    const agentName = getOperatorName(payment.agent_paid);
 
    const formatAmountStr = (num: number) => {
        return num % 1 === 0 ? num.toString() : num.toFixed(2);
    };

    let deletedByPhone = "";
    try {
        const details = JSON.parse(payment.payment_details || "{}");
        deletedByPhone = details.deleted_by || "";
    } catch (e) {}

    const deletedByName = getOperatorName(deletedByPhone);

    const handleDeletePayment = () => {
        realm.write(() => {
            payment.payment_status = 4; // Cancelled
            try {
                const details = JSON.parse(payment.payment_details || "{}");
                details.deleted_by = user_data.phone_number;
                payment.payment_details = JSON.stringify(details);
            } catch (e) {
                payment.payment_details = JSON.stringify({ deleted_by: user_data.phone_number });
            }

            // If this is a reservation installment, update the reservation's deposit/remaining/status
            if (payment.reservation_id) {
                const resObj = realm.objectForPrimaryKey<any>('Reservations', payment.reservation_id);
                if (resObj) {
                    const amt = parseFloat(payment.amount) || 0;
                    const currentDeposit = parseFloat(resObj.deposit_amount) || 0;
                    const currentTotal = parseFloat(resObj.total_amount) || 0;
                    const newDeposit = Math.max(0, currentDeposit - amt);
                    const newRemaining = Math.max(0, currentTotal - newDeposit);

                    resObj.deposit_amount = newDeposit.toString();
                    resObj.remaining_amount = newRemaining.toString();
                    resObj.updatedAt = new Date().toISOString();

                    // Adjust status
                    if (newRemaining <= 0) {
                        resObj.status = 3; // Completed
                    } else if (resObj.status === 3) {
                        resObj.status = newDeposit > 0 ? 2 : 1; // Confirmed or Pending
                    }
                }
            }
        });

        SocketApp.emit("newPayments", JSON.stringify({ phone_number: user_data.phone_number, items: [payment] }));

        if (payment.reservation_id) {
            const resObj = realm.objectForPrimaryKey<any>('Reservations', payment.reservation_id);
            if (resObj) {
                SocketApp.emit("newReservations", JSON.stringify({ phone_number: user_data.phone_number, items: [resObj] }));
            }
        }

        setShowDeleteSuccessModal(true);
        dispatch(setShowModalApp(true));
    };

    return (
        <View style={{ flex: 1, backgroundColor: app_theme.colors.background }}>

            <ScrollView contentContainerStyle={{ padding: 16 }}>
                {/* Status Card */}
                <View style={{
                    backgroundColor: app_theme.colors.border,
                    borderRadius: 16,
                    padding: 24,
                    alignItems: 'center',
                    marginBottom: 16,
                }}>
                    <View style={{
                        width: 56,
                        height: 56,
                        borderRadius: 28,
                        backgroundColor: payment.payment_status === 4 ? app_theme.colors.background : isPaid ? '#E8F5E9' : '#FFF3E0',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: 16,
                    }}>
                        <Feather name={payment.payment_status === 4 ? "slash" : isPaid ? "check" : "clock"} size={28} color={statusColor} />
                    </View>
                    <YambiText
                        text={`${formatAmountStr(parseFloat(payment.amount))} ${renderCurrency(payment.currency, false)}`}
                        size="big"
                        bold
                        style={{ fontSize: 24, marginBottom: 8 }}
                    />
                    <YambiText
                        text={
                            payment.payment_status === 4
                                ? (strings.cancelled || "Cancelled")
                                : isPaid
                                ? (strings.success || "Success")
                                : ((strings as any).payment_pending || "Pending")
                        }
                        size="small"
                        bold
                        color={
                            payment.payment_status === 4
                                ? "gray"
                                : isPaid
                                ? "success"
                                : "high"
                        }
                    />
                </View>

                {/* Details list */}
                <View style={{
                    backgroundColor: app_theme.colors.border,
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 50
                }}>
                    {/* Business Name */}
                    {business?.business_name && (
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            paddingVertical: 12,
                            borderBottomWidth: 1,
                            borderColor: app_theme.colors.background,
                            alignItems: 'flex-start',
                        }}>
                            <YambiText text={strings.business || "Business"} color="gray" size="small" style={{ marginRight: 16 }} />
                            <YambiText text={business.business_name} bold size="small" style={{ flex: 1, textAlign: 'right' }} />
                        </View>
                    )}

                    {/* Sales Point Name */}
                    {salesPoint?.sells_point_name && (
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            paddingVertical: 12,
                            borderBottomWidth: 1,
                            borderColor: app_theme.colors.background,
                            alignItems: 'flex-start',
                        }}>
                            <YambiText text={strings.sales_point || "Point of sale"} color="gray" size="small" style={{ marginRight: 16 }} />
                            <YambiText text={salesPoint.sells_point_name} bold size="small" style={{ flex: 1, textAlign: 'right' }} />
                        </View>
                    )}

                    {/* Point of Sale Address */}
                    {salesPoint?.sells_point_address ? (
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            paddingVertical: 12,
                            borderBottomWidth: 1,
                            borderColor: app_theme.colors.background,
                            alignItems: 'flex-start',
                        }}>
                            <YambiText text={strings.address || "Address"} color="gray" size="small" style={{ marginRight: 16 }} />
                            <YambiText text={salesPoint.sells_point_address} bold size="small" style={{ flex: 1, textAlign: 'right' }} />
                        </View>
                    ) : null}

                    {/* Item Name */}
                    {itemObject?.item_name && (
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            paddingVertical: 12,
                            borderBottomWidth: 1,
                            borderColor: app_theme.colors.background,
                            alignItems: 'flex-start',
                        }}>
                            <YambiText text={strings.item || "Item"} color="gray" size="small" style={{ marginRight: 16 }} />
                            <YambiText text={itemObject.item_name} bold size="small" style={{ flex: 1, textAlign: 'right' }} />
                        </View>
                    )}

                    {/* Payment Method */}
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        paddingVertical: 12,
                        borderBottomWidth: 1,
                        borderColor: app_theme.colors.background,
                        alignItems: 'flex-start',
                    }}>
                        <YambiText text={(strings as any).payment_method || "Payment Method"} color="gray" size="small" style={{ marginRight: 16 }} />
                        <YambiText text={methodLabel} bold size="small" style={{ flex: 1, textAlign: 'right' }} />
                    </View>

                    {/* Date / Time */}
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        paddingVertical: 12,
                        borderBottomWidth: 1,
                        borderColor: app_theme.colors.background,
                        alignItems: 'flex-start',
                    }}>
                        <YambiText text={strings.Date || "Date"} color="gray" size="small" style={{ marginRight: 16 }} />
                        <YambiText text={renderDateTime(payment.createdAt, 2, false)} bold size="small" style={{ flex: 1, textAlign: 'right' }} />
                    </View>

                    {/* Reference / ID */}
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        paddingVertical: 12,
                        borderBottomWidth: (payment.agent_paid || (payment.payment_status === 4 && deletedByPhone)) ? 1 : 0,
                        borderColor: app_theme.colors.background,
                        alignItems: 'flex-start',
                    }}>
                        <YambiText text={(strings as any).payment_id || "Payment ID"} color="gray" size="small" style={{ marginRight: 16 }} />
                        <YambiText text={payment._id.toString()} bold size="small" style={{ flex: 1, textAlign: 'right' }} />
                    </View>

                    {/* Collector Agent */}
                    {payment.agent_paid && (
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            paddingVertical: 12,
                            borderBottomWidth: (payment.payment_status === 4 && deletedByPhone) ? 1 : 0,
                            borderColor: app_theme.colors.background,
                            alignItems: 'flex-start',
                        }}>
                            <YambiText text={(strings as any).collector || "Collector"} color="gray" size="small" style={{ marginRight: 16 }} />
                            <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                {agentName ? (
                                    <>
                                        <YambiText text={agentName} size="small" bold style={{ textAlign: 'right' }} />
                                        <Pressable onPress={() => handlePhonePress(payment.agent_paid)}>
                                            <YambiText
                                                text={payment.agent_paid}
                                                size="small"
                                                color="high"
                                                style={{ textDecorationLine: 'underline', marginTop: 2, textAlign: 'right' }}
                                            />
                                        </Pressable>
                                    </>
                                ) : (
                                    <Pressable onPress={() => handlePhonePress(payment.agent_paid)}>
                                        <YambiText
                                            text={payment.agent_paid}
                                            size="small"
                                            color="high"
                                            bold
                                            style={{ textDecorationLine: 'underline', textAlign: 'right' }}
                                        />
                                    </Pressable>
                                )}
                            </View>
                        </View>
                    )}

                    {/* Cancelled by Agent */}
                    {payment.payment_status === 4 && deletedByPhone ? (
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            paddingVertical: 12,
                            alignItems: 'flex-start',
                        }}>
                            <YambiText text={(strings as any).deleted_by || "Cancelled by"} color="gray" size="small" style={{ marginRight: 16 }} />
                            <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                {deletedByName ? (
                                    <>
                                        <YambiText text={deletedByName} size="small" bold style={{ textAlign: 'right' }} />
                                        <Pressable onPress={() => handlePhonePress(deletedByPhone)}>
                                            <YambiText
                                                text={deletedByPhone}
                                                size="small"
                                                color="high"
                                                style={{ textDecorationLine: 'underline', marginTop: 2, textAlign: 'right' }}
                                            />
                                        </Pressable>
                                    </>
                                ) : (
                                    <Pressable onPress={() => handlePhonePress(deletedByPhone)}>
                                        <YambiText
                                            text={deletedByPhone}
                                            size="small"
                                            color="high"
                                            bold
                                            style={{ textDecorationLine: 'underline', textAlign: 'right' }}
                                        />
                                    </Pressable>
                                )}
                            </View>
                        </View>
                    ) : null}
                </View>
            </ScrollView>

            {showDeleteConfirmModal && (
                <ModalApp
                    onClose={() => {
                        dispatch(setShowModalApp(false));
                        setShowDeleteConfirmModal(false);
                    }}
                    onAction={handleDeletePayment}
                    singleButton={false}
                    title={strings.confirm || "Confirm"}
                    textAction={strings.yes || "Yes"}
                    textCancel={strings.no || "No"}
                >
                    <View style={{ paddingVertical: 10, alignItems: 'center' }}>
                        <YambiText
                            text={(strings as any).delete_payment_confirmation || "Are you sure you want to cancel this payment? This action cannot be undone."}
                            style={{ textAlign: 'center' }}
                        />
                    </View>
                </ModalApp>
            )}

            {showDeleteSuccessModal && (
                <ModalApp
                    onClose={() => {
                        dispatch(setShowModalApp(false));
                        setShowDeleteSuccessModal(false);
                    }}
                    singleButton
                    title={strings.success || "Success"}
                >
                    <View style={{ paddingVertical: 10, alignItems: 'center' }}>
                        <YambiText
                            text={(strings as any).payment_deleted_successfully || "Payment cancelled successfully"}
                            style={{ textAlign: 'center' }}
                        />
                    </View>
                </ModalApp>
            )}
        </View>
    );
};

export default SalePayment;
