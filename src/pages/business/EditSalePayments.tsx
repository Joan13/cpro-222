import { View, ScrollView, TextInput, Alert, Pressable, Text } from "react-native";
import Feather from 'react-native-vector-icons/Feather';
import { useCallback, useState } from 'react';
import { NavProps } from "../../types/types";
import { strings } from "../../lang/lang";
import ButtonNormal from "../../components/app/ButtonNormal";
import { useAppDispatch, useAppSelector } from "../../store/app/hooks";
import { useQuery, useRealm } from "@realm/react";
import { Payments, BusinessUsers } from "../../store/database/Models";
import { getSalePaymentDetails, createPaymentObject } from "../../utils/paymentHelpers";
import { YambiText } from "../../components/app/Text";
import { renderCurrency, renderDateTime, SocketApp } from "../../../GlobalVariables";
import ModalApp from "../../components/app/ModalApp";
import { setShowModalApp } from "../../store/reducers/appSlice";
import { FlashList } from "@shopify/flash-list";
import SalePaymentItem from "../../components/lists/business/SalePaymentItem";

const EditSalePayments = ({ navigation, route }: NavProps) => {

    const app_theme = useAppSelector(state => state.app_theme);
    const user_data = useAppSelector(state => state.user_data);
    const realm = useRealm();
    const dispatch = useAppDispatch();
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmActionType, setConfirmActionType] = useState<'full' | 'partial' | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const { sale, item, prices } = route.params;

    const salePayments = useQuery(Payments, payments => {
        return payments.filtered('sale_id == $0', sale._id).sorted('createdAt', false);
    }, [sale._id]);

    const totalPrice = parseFloat(sale.selling_price) * sale.number + (parseFloat(sale.delivery_price) || 0) - (parseFloat(sale.discount_price) || 0);
    const paymentDetails = getSalePaymentDetails(sale, realm);

    const businessUsers = useQuery(BusinessUsers, users => {
        return users.filtered('business_id == $0', sale.business_id);
    }, [sale.business_id]);

    const getOperatorName = useCallback((phone: string) => {
        if (!phone) return "";
        const found = businessUsers.find(u => u.user === phone || u.phone_number === phone);
        if (found && found.user_name) {
            return found.user_name;
        }
        return "";
    }, [businessUsers]);

    const handlePhonePress = useCallback((phone: string) => {
        if (!phone) return;
        if (phone === user_data.phone_number) {
            navigation.navigate('SettingsYambi' as never);
        } else {
            navigation.navigate('Inbox', { user: phone } as never);
        }
    }, [user_data.phone_number, navigation]);

    const formatAmount = (num: number) => {
        return num % 1 === 0 ? num.toString() : num.toFixed(2);
    };

    const [paymentAmount, setPaymentAmount] = useState(formatAmount(paymentDetails.remainingAmount));
    const [selectedMethod, setSelectedMethod] = useState(1); // 1=Cash, 2=Mobile Money, 3=Card

    const paymentMethods = [
        { id: 1, label: (strings as any).cash || "Cash", icon: "dollar-sign" },
        { id: 2, label: (strings as any).mobile_money || "Mobile Money", icon: "smartphone" },
        { id: 3, label: (strings as any).card || "Card", icon: "credit-card" },
    ];

    const renderPaymentMethodLabel = (method: number) => {
        switch (method) {
            case 1: return (strings as any).paid_cash || "Paid Cash";
            case 2: return (strings as any).paid_mobile_money || "Paid by Mobile Money";
            case 3: return (strings as any).paid_card || "Paid by Card";
            default: return (strings as any).paid_cash || "Paid Cash";
        }
    };

    const addPayment = (isFullPayment: boolean) => {
        const currentDetails = getSalePaymentDetails(sale, realm);
        const amount = isFullPayment
            ? currentDetails.remainingAmount
            : parseFloat(paymentAmount);

        if (isNaN(amount) || amount <= 0) {
            Alert.alert("", (strings as any).enter_payment_amount || "Enter payment amount");
            return;
        }

        if (Math.round(amount * 100) > Math.round(currentDetails.remainingAmount * 100)) {
            setErrorMsg((strings as any).amount_exceeds_balance || "Amount exceeds remaining balance");
            setShowErrorModal(true);
            dispatch(setShowModalApp(true));
            return;
        }

        setConfirmActionType(isFullPayment ? 'full' : 'partial');
        setShowConfirmModal(true);
        dispatch(setShowModalApp(true));
    };

    const executeAddPayment = (isFullPayment: boolean) => {
        const currentDetails = getSalePaymentDetails(sale, realm);
        const amount = isFullPayment
            ? currentDetails.remainingAmount
            : parseFloat(paymentAmount);

        const payment = createPaymentObject(
            sale,
            amount.toString(),
            selectedMethod,
            2, // Success
            user_data.phone_number
        );

        realm.write(() => {
            try {
                realm.create('Payments', payment);
            } catch (error) { console.log(error); }
        });

        SocketApp.emit("newPayments", JSON.stringify({ phone_number: user_data.phone_number, items: [payment] }));

        // Update the amount field with the new remaining balance
        const updatedDetails = getSalePaymentDetails(sale, realm);
        setPaymentAmount(formatAmount(updatedDetails.remainingAmount));

        setShowSuccessModal(true);
        dispatch(setShowModalApp(true));
    };

    const getStatusBadge = () => {
        if (paymentDetails.isPaid) {
            return {
                text: (strings as any).fully_paid || "FULLY PAID",
                bg: '#E8F5E9',
                color: '#2E7D32',
                yambiColor: 'success' as const
            };
        } else if (paymentDetails.paidAmount > 0) {
            return {
                text: (strings as any).partially_paid || "PARTIAL",
                bg: '#FFF3E0',
                color: '#E65100',
                yambiColor: 'high' as const
            };
        } else {
            return {
                text: (strings as any).unpaid || "UNPAID",
                bg: '#FFEBEE',
                color: '#C62828',
                yambiColor: 'error' as const
            };
        }
    };

    const badge = getStatusBadge();

    return (
        <View style={{
            flex: 1,
            backgroundColor: app_theme.colors.background,
        }}>
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                {/* Invoice Summary Card */}
                <View style={{
                    backgroundColor: app_theme.colors.border,
                    margin: 15,
                    padding: 18,
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
                        marginBottom: 16,
                        borderBottomWidth: 1,
                        borderColor: app_theme.colors.background,
                        paddingBottom: 12
                    }}>
                        <YambiText bold text={item.item_name.toUpperCase()} />
                        <View style={{
                            backgroundColor: badge.bg,
                            paddingHorizontal: 12,
                            paddingVertical: 5,
                            borderRadius: 20
                        }}>
                            <YambiText bold text={badge.text} size="small" color={badge.yambiColor} style={{ fontSize: 10, letterSpacing: 0.5 }} />
                        </View>
                    </View>

                    <View>
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            paddingVertical: 6,
                        }}>
                            <YambiText text={(strings as any).total_amount || "Total Amount"} size="small" color="gray" />
                            <YambiText bold text={`${formatAmount(totalPrice)} ${renderCurrency(sale.currency, false)}`} />
                        </View>
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            paddingVertical: 6,
                        }}>
                            <YambiText text={(strings as any).amount_paid || "Amount Paid"} size="small" color="gray" />
                            <YambiText bold text={`${formatAmount(paymentDetails.paidAmount)} ${renderCurrency(sale.currency, false)}`} color="success" />
                        </View>
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            paddingVertical: 10,
                            borderTopWidth: 1,
                            borderColor: app_theme.colors.background,
                            marginTop: 10,
                        }}>
                            <YambiText bold text={(strings as any).remaining_balance || "Remaining Balance"} />
                            <YambiText bold text={`${formatAmount(paymentDetails.remainingAmount)} ${renderCurrency(sale.currency, false)}`} size="big" color={paymentDetails.isPaid ? "success" : "high"} />
                        </View>
                    </View>
                </View>

                {/* Payment History */}
                {salePayments.length > 0 && (
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
                            flexWrap: 'wrap',
                        }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Feather name="clock" size={16} color={app_theme.colors.text} style={{ marginRight: 8 }} />
                                <YambiText bold text={(strings as any).payment_history || "Payment History"} />
                            </View>
                            <YambiText bold text={`${formatAmount(paymentDetails.paidAmount)} ${(strings as any).of || "of"} ${formatAmount(totalPrice)} ${renderCurrency(sale.currency, false)} ${(strings as any).paid || "paid"}`} size="small" color={paymentDetails.isPaid ? "success" : "high"} />
                        </View>

                        <FlashList
                            data={salePayments.filter((p: any) => p.payment_status === 4 || !(paymentDetails.isPaid && p.payment_status !== 2))}
                            estimatedItemSize={75}
                            scrollEnabled={false}
                            keyExtractor={(item: any) => item._id.toString()}
                            renderItem={({ item, index }) => {
                                const filtered = salePayments.filter((p: any) => p.payment_status === 4 || !(paymentDetails.isPaid && p.payment_status !== 2));
                                return (
                                    <SalePaymentItem
                                        pmt={item}
                                        agentName={getOperatorName(item.agent_paid)}
                                        onPhonePress={handlePhonePress}
                                        onPress={() => navigation.navigate('SalePayment', { paymentId: item._id, sale })}
                                        isLast={index === filtered.length - 1}
                                    />
                                );
                            }}
                        />
                    </View>
                )}

                {/* Add Payment Section or Fully Paid Banner */}
                {paymentDetails.isPaid ? (
                    <View style={{
                        backgroundColor: '#E8F5E9',
                        margin: 15,
                        marginTop: 0,
                        padding: 24,
                        borderRadius: 16,
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: '#C8E6C9'
                    }}>
                        <Feather name="check-circle" size={48} color="#4CAF50" />
                        <YambiText bold text={(strings as any).invoice_fully_paid || "Invoice fully paid"} color="success" style={{ marginTop: 12 }} />
                        <YambiText text={(strings as any).sale_settled_full || "This sale has been settled in full. No further payments are required."} size="small" color="gray" style={{ marginTop: 4, textAlign: 'center', fontSize: 12 }} />
                    </View>
                ) : (
                    <View>
                        {/* Option 1: Full Payment Card */}
                        <View style={{
                            backgroundColor: app_theme.colors.border,
                            margin: 15,
                            marginTop: 0,
                            borderRadius: 16,
                            padding: 16,
                            elevation: 1,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.05,
                            shadowRadius: 2,
                        }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                <Feather name="check-square" size={18} color={app_theme.colors.text} style={{ marginRight: 8 }} />
                                <YambiText bold text={(strings as any).full_payment || "Full Payment"} />
                            </View>
                            <YambiText style={{ marginBottom: 16 }} text={`${strings.mark_invoice_as_paid} (${formatAmount(paymentDetails.remainingAmount)} ${renderCurrency(sale.currency, false)})`} size="small" color="gray" />
                            <ButtonNormal
                                title={strings.mark_invoice_as_paid}
                                loadEnabled={true}
                                onPress={() => addPayment(true)}
                                normal={true}
                            />
                        </View>

                        {/* Option 2: Partial Payment Card */}
                        <View style={{
                            backgroundColor: app_theme.colors.border,
                            margin: 15,
                            marginTop: 0,
                            borderRadius: 16,
                            padding: 16,
                            elevation: 1,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.05,
                            shadowRadius: 2,
                        }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                <Feather name="layers" size={18} color={app_theme.colors.text} style={{ marginRight: 8 }} />
                                <YambiText bold text={(strings as any).partial_payment || "Partial Payment"} />
                            </View>
                            <YambiText style={{ marginBottom: 16 }} text={(strings as any).record_installment_payment || "Record a customer installment payment"} size="small" color="gray" />

                            {/* Payment Method Selector */}
                            <YambiText bold text={(strings as any).payment_method || "Payment Method"} size="small" />
                            <View style={{
                                flexDirection: 'row',
                                marginTop: 10,
                                marginBottom: 18,
                            }}>
                                {paymentMethods.map(method => (
                                    <Pressable
                                        key={method.id}
                                        onPress={() => setSelectedMethod(method.id)}
                                        style={{
                                            flex: 1,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            paddingVertical: 12,
                                            paddingHorizontal: 4,
                                            marginHorizontal: 4,
                                            borderRadius: 10,
                                            borderWidth: 2,
                                            borderColor: selectedMethod === method.id ? app_theme.colors.high_color : app_theme.colors.background,
                                            backgroundColor: selectedMethod === method.id ? app_theme.colors.background : 'transparent',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        <Feather name={method.icon} size={15} color={selectedMethod === method.id ? app_theme.colors.high_color : app_theme.colors.text} />
                                        <View style={{ flex: 1, marginLeft: 6 }}>
                                            <YambiText text={method.label} numberLines={1} size="small" bold={selectedMethod === method.id} style={{ fontSize: 11 }} />
                                        </View>
                                    </Pressable>
                                ))}
                            </View>

                            {/* Amount Input */}
                            <YambiText bold text={(strings as any).payment_amount || "Payment Amount"} size="small" />
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                borderWidth: 2,
                                borderColor: isInputFocused ? app_theme.colors.high_color : app_theme.colors.background,
                                borderRadius: 10,
                                marginTop: 8,
                                backgroundColor: app_theme.colors.background,
                                overflow: 'hidden',
                            }}>
                                <View style={{
                                    backgroundColor: app_theme.colors.border,
                                    paddingHorizontal: 15,
                                    height: 50,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    borderRightWidth: 1,
                                    borderColor: app_theme.colors.background,
                                }}>
                                    <YambiText bold text={renderCurrency(sale.currency, false)} />
                                </View>
                                <TextInput
                                    style={{
                                        flex: 1,
                                        paddingHorizontal: 15,
                                        height: 50,
                                        fontSize: 18,
                                        fontWeight: 'bold',
                                        color: app_theme.colors.text,
                                    }}
                                    value={paymentAmount}
                                    onChangeText={setPaymentAmount}
                                    keyboardType="decimal-pad"
                                    onFocus={() => setIsInputFocused(true)}
                                    onBlur={() => setIsInputFocused(false)}
                                    placeholder={(strings as any).enter_payment_amount || "Enter payment amount"}
                                    placeholderTextColor={app_theme.colors.gray}
                                />
                            </View>

                            {/* Action Button */}
                            <View style={{ marginTop: 20 }}>
                                <ButtonNormal
                                    title={(strings as any).partial_payment || "Partial Payment"}
                                    loadEnabled={true}
                                    onPress={() => addPayment(false)}
                                    styles={{}}
                                    outline={true}
                                />
                            </View>
                        </View>
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
            {showErrorModal && (
                <ModalApp
                    onClose={() => {
                        dispatch(setShowModalApp(false));
                        setShowErrorModal(false);
                    }}
                    singleButton
                    title={strings.error || "Error"}
                >
                    <View style={{ paddingVertical: 10, alignItems: 'center' }}>
                        <YambiText text={errorMsg} style={{ textAlign: 'center' }} />
                    </View>
                </ModalApp>
            )}
            {showConfirmModal && (
                <ModalApp
                    onClose={() => {
                        dispatch(setShowModalApp(false));
                        setShowConfirmModal(false);
                        setConfirmActionType(null);
                    }}
                    onAction={() => {
                        dispatch(setShowModalApp(false));
                        setShowConfirmModal(false);
                        if (confirmActionType === 'full') {
                            executeAddPayment(true);
                        } else if (confirmActionType === 'partial') {
                            executeAddPayment(false);
                        }
                        setConfirmActionType(null);
                    }}
                    singleButton={false}
                    title={strings.confirm || "Confirm"}
                    textAction={strings.yes || "Yes"}
                    textCancel={strings.no || "No"}
                >
                    <View style={{ paddingVertical: 10, alignItems: 'center' }}>
                        <YambiText
                            text={
                                confirmActionType === 'full'
                                    ? strings.confirm_mark_paid || "Are you sure you want to mark this bill as fully paid?"
                                    : strings.confirm_add_installment || "Are you sure you want to record this installment payment?"
                            }
                            style={{ textAlign: 'center' }}
                        />
                    </View>
                </ModalApp>
            )}
            {showSuccessModal && (
                <ModalApp
                    onClose={() => {
                        dispatch(setShowModalApp(false));
                        setShowSuccessModal(false);
                    }}
                    singleButton
                    title={strings.success || "Success"}
                >
                    <View style={{ paddingVertical: 10, alignItems: 'center' }}>
                        <YambiText
                            text={(strings as any).payment_added || "Payment added successfully"}
                            style={{ textAlign: 'center' }}
                        />
                    </View>
                </ModalApp>
            )}
        </View>
    );
};

export default EditSalePayments;
