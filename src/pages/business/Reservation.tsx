import React, { useLayoutEffect, useState, useCallback } from 'react';
import { View, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useAppSelector, useAppDispatch } from '../../store/app/hooks';
import { useRealm, useQuery, useObject } from '@realm/react';
import { Reservations as ReservationsModel, Payments, BusinessItemsSale, UserBusinessArticles, BusinessUsers, UserBusinesses, UserSellsPoints } from '../../store/database/Models';
import RNPrint from 'react-native-print';
import QRCode from 'qrcode';
import { NavProps } from '../../types/types';
import { strings } from '../../lang/lang';
import { renderCurrency, renderDateTime, SocketApp } from '../../../GlobalVariables';
import { setShowModalApp } from '../../store/reducers/appSlice';
import ModalApp from '../../components/app/ModalApp';
import ButtonNormal from '../../components/app/ButtonNormal';
import {
    TextNormalYambi, TextSmallYambiGray, TextNormalYambiHighColor,
    TextNormalYambiSuccess, TextNormalYambiError, TextSmallYambi,
    YambiText, TextBigYambi, TextNormalYambiGray,
} from '../../components/app/Text';
import { IconApp } from '../../components/app/IconApp';
import SalePaymentItem from '../../components/lists/business/SalePaymentItem';
import moment from 'moment';

const statusColor = (status: number, theme: any): string => {
    switch (status) {
        case 1: return '#F59E0B';
        case 2: return '#6366F1';
        case 3: return '#10B981';
        case 4: return theme.colors.error;
        case 5: return theme.colors.gray;
        default: return theme.colors.gray;
    }
};

const statusLabel = (status: number): string => {
    const map: Record<number, string> = {
        1: (strings as any).reservation_status_1 || 'Pending',
        2: (strings as any).reservation_status_2 || 'Confirmed',
        3: (strings as any).reservation_status_3 || 'Completed',
        4: (strings as any).reservation_status_4 || 'Cancelled',
        5: (strings as any).reservation_status_5 || 'Expired',
    };
    return map[status] || 'Unknown';
};

const generateId = () => {
    const hex = () => Math.floor(Math.random() * 16).toString(16);
    return Array.from({ length: 24 }, hex).join('');
};

const ReservationDetail = ({ navigation, route }: NavProps) => {
    const { reservationId } = route.params;
    const app_theme = useAppSelector(state => state.app_theme);
    const user_data = useAppSelector(state => state.user_data);
    const dispatch = useAppDispatch();
    const realm = useRealm();

    // Modals
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
    const [showAddInstallment, setShowAddInstallment] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

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

    // Installment form
    const [installmentAmount, setInstallmentAmount] = useState('');
    const [installmentMethod, setInstallmentMethod] = useState<1 | 2 | 3>(1);

    const reservation = realm.objectForPrimaryKey<any>('Reservations', reservationId);

    const payments = useQuery(Payments, p =>
        p.filtered('reservation_id == $0', reservationId).sorted('createdAt', true),
        [reservationId]
    );

    // Query business users
    const businessUsers = useQuery(BusinessUsers, users => {
        return users.filtered('business_id == $0', reservation?.business_id || '');
    }, [reservation?.business_id]);

    const getOperatorName = useCallback((phone: string) => {
        if (!phone) return "";
        const found = businessUsers.find(u => u.user === phone || u.phone_number === phone);
        return found?.user_name || "";
    }, [businessUsers]);

    const handlePhonePress = useCallback((phone: string) => {
        if (!phone) return;
        if (phone === user_data.phone_number) {
            navigation.navigate('SettingsYambi' as never);
        } else {
            navigation.navigate('Inbox', { user: phone } as never);
        }
    }, [user_data.phone_number, navigation]);

    const article = useObject(UserBusinessArticles, reservation?.item_id || '');
    const business = useObject(UserBusinesses, reservation?.business_id || '');
    const sales_point = useObject(UserSellsPoints, reservation?.sales_point_id || '');

    // Header delete button
    useLayoutEffect(() => {
        if (!reservation || reservation.status === 3 || reservation.status === 4) {
            navigation.setOptions({ headerRight: undefined });
            return;
        }
        navigation.setOptions({
            title: (strings as any).reservation_detail || 'Reservation',
            headerRight: () => (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Pressable
                        onPress={() => {
                            navigation.navigate('EditReservation' as never, { reservationId: reservation._id } as never);
                        }}
                        style={{ paddingHorizontal: 8, paddingVertical: 8 }}
                    >
                        <Feather name="edit-2" size={20} color={app_theme.colors.text_design1 || app_theme.colors.text} />
                    </Pressable>
                    <Pressable
                        onPress={() => {
                            setShowDeleteConfirm(true);
                            dispatch(setShowModalApp(true));
                        }}
                        style={{ paddingHorizontal: 8, paddingVertical: 8 }}
                    >
                        <Feather name="trash-2" size={20} color={app_theme.colors.text_design1 || app_theme.colors.text} />
                    </Pressable>
                </View>
            ),
        });
    }, [navigation, reservation, app_theme]);

    if (!reservation) {
        return (
            <View style={{ flex: 1, backgroundColor: app_theme.colors.background, justifyContent: 'center', alignItems: 'center' }}>
                <TextNormalYambiGray text={(strings as any).reservation_not_found} />
            </View>
        );
    }

    const cur = renderCurrency(reservation.currency, false);
    const total = parseFloat(reservation.total_amount) || 0;
    const deposit = parseFloat(reservation.deposit_amount) || 0;
    const remaining = parseFloat(reservation.remaining_amount) || 0;
    const sColor = statusColor(reservation.status, app_theme);
    const isActive = reservation.status !== 3 && reservation.status !== 4 && reservation.status !== 5;

    // ── Delete ──────────────────────────────────────────────────────────────
    const handleDelete = () => {
        try {
            const deletedReservationObj = {
                _id: reservation._id,
                business_id: reservation.business_id,
                sales_point_id: reservation.sales_point_id,
                item_id: reservation.item_id,
                customer_id: reservation.customer_id,
                customer_name: reservation.customer_name,
                customer_phone: reservation.customer_phone,
                quantity: reservation.quantity,
                total_amount: reservation.total_amount,
                deposit_amount: reservation.deposit_amount,
                remaining_amount: reservation.remaining_amount,
                currency: reservation.currency,
                status: 4, // Cancelled / deleted status
                sale_id: reservation.sale_id,
                createdAt: reservation.createdAt,
                updatedAt: moment().toISOString(),
            };
            realm.write(() => {
                realm.delete(reservation);
            });
            SocketApp.emit("reservationsChanged", JSON.stringify({ phone_number: user_data.phone_number, items: [deletedReservationObj] }));
            dispatch(setShowModalApp(false));
            navigation.goBack();
        } catch (e) {
            console.error(e);
        }
    };

    // ── Mark as Completed (becomes a sale) ──────────────────────────────────
    const handleComplete = () => {
        try {
            const now = moment().toISOString();
            let newPayment: any = null;
            realm.write(() => {
                reservation.status = 3;
                reservation.updatedAt = now;

                // Create a payment for remaining amount if still unpaid
                if (remaining > 0) {
                    const paymentId = generateId();
                    newPayment = realm.create('Payments', {
                        _id: paymentId,
                        sale_id: reservation.sale_id || '',
                        reservation_id: reservationId,
                        item_id: reservation.item_id,
                        sales_point_id: reservation.sales_point_id,
                        phone_number: user_data.phone_number,
                        agent_paid: user_data.phone_number,
                        amount: remaining.toString(),
                        currency: reservation.currency,
                        payment_status: 2,
                        payment_method: 1,
                        payment_details: JSON.stringify({ completed_reservation: true }),
                        uploaded: 0,
                        createdAt: now,
                        updatedAt: now,
                    });
                    // Update remaining amount
                    reservation.remaining_amount = '0';
                    reservation.deposit_amount = total.toString();
                }
            });

            SocketApp.emit("newReservations", JSON.stringify({ phone_number: user_data.phone_number, items: [reservation] }));
            if (newPayment) {
                SocketApp.emit("newPayments", JSON.stringify({ phone_number: user_data.phone_number, items: [newPayment] }));
            }
            setSuccessMsg((strings as any).reservation_completed);
            setShowCompleteConfirm(false);
            setShowSuccess(true);
            dispatch(setShowModalApp(true));
        } catch (e) {
            console.error(e);
        }
    };

    // ── Add Installment ─────────────────────────────────────────────────────
    const handleAddInstallment = () => {
        const amount = parseFloat(installmentAmount);
        if (!amount || amount <= 0 || amount > remaining) {
            triggerAlert(strings.error, (strings as any).invalid_amount);
            return;
        }
        try {
            const now = moment().toISOString();
            const newRemaining = Math.max(0, remaining - amount);
            const newDeposit = deposit + amount;

            let newPayment: any = null;
            realm.write(() => {
                // Payment record
                const paymentId = generateId();
                newPayment = realm.create('Payments', {
                    _id: paymentId,
                    sale_id: reservation.sale_id || '',
                    reservation_id: reservationId,
                    item_id: reservation.item_id,
                    sales_point_id: reservation.sales_point_id,
                    phone_number: user_data.phone_number,
                    agent_paid: user_data.phone_number,
                    amount: amount.toString(),
                    currency: reservation.currency,
                    payment_status: 2,
                    payment_method: installmentMethod,
                    payment_details: JSON.stringify({ installment: true }),
                    uploaded: 0,
                    createdAt: now,
                    updatedAt: now,
                });
                reservation.deposit_amount = newDeposit.toString();
                reservation.remaining_amount = newRemaining.toString();
                reservation.updatedAt = now;
                // Auto-complete if fully paid
                if (newRemaining <= 0) {
                    reservation.status = 3;
                }
            });

            SocketApp.emit("newReservations", JSON.stringify({ phone_number: user_data.phone_number, items: [reservation] }));
            if (newPayment) {
                SocketApp.emit("newPayments", JSON.stringify({ phone_number: user_data.phone_number, items: [newPayment] }));
            }
            setInstallmentAmount('');
            setInstallmentMethod(1);
            setShowAddInstallment(false);
            dispatch(setShowModalApp(false));
        } catch (e) {
            console.error(e);
        }
    };

    const generateQrSvg = (value: string) => {
        try {
            const qr = QRCode.create(value, { errorCorrectionLevel: 'M' });
            const size = qr.modules.size;
            const data = qr.modules.data;
            let path = '';
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    if (data[r * size + c]) {
                        path += `M${c},${r}h1v1h-1z `;
                    }
                }
            }
            return `
                <svg viewBox="0 0 ${size} ${size}" width="120" height="120" xmlns="http://www.w3.org/2000/svg" style="display: block; margin: 0 auto;">
                    <rect width="${size}" height="${size}" fill="#ffffff" />
                    <path d="${path}" fill="#111111" shape-rendering="crispEdges" />
                </svg>
            `;
        } catch (e) {
            console.error('Error generating QR SVG', e);
            return '';
        }
    };

    const PrintInvoice = async () => {
        if (!reservation || !business) return;
        const publicUrl = `https://app.yambi.net/business/${business._id}`;
        const qrSvg = generateQrSvg(publicUrl);

        const formatAmount = (num: number) => {
            return num % 1 === 0 ? num.toString() : num.toFixed(2);
        };

        const renderPaymentMethodLabel = (method: number) => {
            switch (method) {
                case 1: return (strings as any).paid_cash || "Paid Cash";
                case 2: return (strings as any).paid_mobile_money || "Paid by Mobile Money";
                case 3: return (strings as any).paid_card || "Paid by Card";
                default: return (strings as any).paid_cash || "Paid Cash";
            }
        };

        const tva_rate = sales_point ? (parseInt(sales_point.tva) || 16) / 100 : 0.16;
        const tht = total / (1 + tva_rate);
        const tva = total - tht;

        await RNPrint.print({
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body { 
                            font-family: 'Courier New', Courier, monospace; 
                            width: 100%;
                            max-width: 280px;
                            margin: 0 auto;
                            background: white;
                            color: #000;
                            padding: 5px;
                        }
                        .receipt-container { 
                            width: 100%;
                            background: white;
                        }
                        .header { 
                            text-align: center;
                            border-bottom: 1px dashed #000;
                            padding-bottom: 10px;
                            margin-bottom: 12px;
                        }
                        .header h1 { 
                            font-size: 16px;
                            font-weight: bold;
                            margin-bottom: 4px;
                            text-transform: uppercase;
                        }
                        .header-info { 
                            font-size: 11px;
                            line-height: 1.4;
                        }
                        .section-title {
                            font-size: 12px;
                            font-weight: bold;
                            margin: 10px 0 6px 0;
                            text-transform: uppercase;
                            border-bottom: 1px solid #000;
                            padding-bottom: 3px;
                        }
                        .item-list {
                            margin: 10px 0;
                            border-bottom: 1px dashed #000;
                            padding-bottom: 8px;
                        }
                        .item-row {
                            margin-bottom: 8px;
                        }
                        .item-name {
                            font-size: 12px;
                            font-weight: bold;
                            text-transform: uppercase;
                            word-wrap: break-word;
                        }
                        .item-details {
                            display: flex;
                            justify-content: space-between;
                            font-size: 11px;
                            margin-top: 2px;
                        }
                        .summary {
                            margin-top: 10px;
                            border-bottom: 1px dashed #000;
                            padding-bottom: 8px;
                        }
                        .summary-row {
                            display: flex;
                            justify-content: space-between;
                            padding: 4px 0;
                            font-size: 11px;
                        }
                        .summary-row.total {
                            font-size: 13px;
                            font-weight: bold;
                            border-top: 1px dashed #000;
                            margin-top: 4px;
                            padding-top: 6px;
                        }
                        .info-section {
                            margin: 12px 0;
                            font-size: 11px;
                            line-height: 1.5;
                        }
                        .info-row {
                            display: flex;
                            justify-content: space-between;
                            padding: 2px 0;
                        }
                        .info-label { 
                            font-weight: bold;
                        }
                        .footer {
                            text-align: center;
                            margin-top: 15px;
                            padding-top: 10px;
                            border-top: 1px dashed #000;
                        }
                        .footer h2 {
                            font-size: 18px;
                            font-weight: bold;
                            margin-bottom: 4px;
                        }
                        .footer p {
                            font-size: 11px;
                        }
                    </style>
                </head>
                <body>
                    <div class="receipt-container">
                        <div class="header">
                            <h1>${business.business_name}</h1>
                            <div class="header-info">
                                ${business.national_number ? `<div>${business.national_number}</div>` : ''}
                                ${business.national_id ? `<div>${business.national_id}</div>` : ''}
                                ${business.business_address ? `<div>${business.business_address}</div>` : ''}
                                <div>${business.phones}${business.emails ? ' | ' + business.emails : ''}</div>
                            </div>
                        </div>

                        <div class="section-title">${strings.invoice_details}</div>
                        <div class="item-list">
                            <div class="item-row">
                                <div class="item-name">${(article?.item_name || 'ITEM').toUpperCase()}</div>
                                <div class="item-details">
                                    <span>${reservation.quantity} x ${formatAmount(total / reservation.quantity)} ${cur}</span>
                                    <span>${formatAmount(total)} ${cur}</span>
                                </div>
                            </div>
                        </div>

                        <div class="summary">
                            <div class="summary-row">
                                <span>${strings.subtotal} (HT):</span>
                                <span>${formatAmount(tht)} ${cur}</span>
                            </div>
                            <div class="summary-row">
                                <span>TVA (${(tva_rate * 100).toFixed(0)}%):</span>
                                <span>${formatAmount(tva)} ${cur}</span>
                            </div>
                            <div class="summary-row total">
                                <span>${(strings as any).total_amount || "Total Amount"}:</span>
                                <span>${formatAmount(total)} ${cur}</span>
                            </div>
                        </div>

                        ${payments.length > 0 ? `
                        <div class="section-title">${(strings as any).payments || "Payments"}</div>
                        <div class="item-list">
                            ${Array.from(payments).filter((p: any) => p.payment_status !== 4).map((pmt: any) => {
                                const methodLabel = pmt.payment_status === 2
                                    ? renderPaymentMethodLabel(pmt.payment_method)
                                    : ((strings as any).payment_pending || "Payment pending");
                                const agentName = getOperatorName(pmt.agent_paid);
                                return `
                                <div class="summary-row">
                                    <span>
                                        ${methodLabel} - ${renderDateTime(pmt.createdAt, 2, false)}<br/>
                                        ${agentName ? `<small>${agentName}<br/>${pmt.agent_paid}</small>` : pmt.agent_paid ? `<small>${pmt.agent_paid}</small>` : ''}
                                    </span>
                                    <span>${formatAmount(parseFloat(pmt.amount))} ${renderCurrency(pmt.currency, false)}</span>
                                </div>
                                `;
                            }).join('')}
                            <div class="summary-row" style="border-top: 1px solid #000; margin-top: 4px; padding-top: 4px; font-weight: bold;">
                                <span>${(strings as any).amount_paid || "Amount Paid"}:</span>
                                <span>${formatAmount(deposit)} ${(strings as any).of || "of"} ${formatAmount(total)} ${cur} ${(strings as any).paid || "paid"}</span>
                            </div>
                            ${remaining > 0 ? `
                            <div class="summary-row">
                                <span>${(strings as any).remaining_balance || "Remaining Balance"}:</span>
                                <span>${formatAmount(remaining)} ${cur}</span>
                            </div>
                            ` : ''}
                        </div>
                        ` : ''}

                        <div class="info-section">
                            <div class="info-row">
                                <span class="info-label">${strings.Date}:</span>
                                <span>${renderDateTime(reservation.createdAt, 2, false)}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">${(strings as any).reservation_id || "Reservation ID"}:</span>
                                <span>${reservation._id}</span>
                            </div>
                            ${reservation.customer_name ? `
                            <div class="info-row">
                                <span class="info-label">${strings.buyer}:</span>
                                <span>${reservation.customer_name}${reservation.customer_phone ? ' (' + reservation.customer_phone + ')' : ''}</span>
                            </div>
                            ` : ''}
                        </div>

                        <div class="footer">
                            ${qrSvg ? `
                            <div style="text-align: center; margin-bottom: 12px; margin-top: 5px;">
                                ${qrSvg}
                            </div>
                            ` : ''}
                            <h2>KARIBU!</h2>
                            <p>${strings.thank_you_business}</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        });
    };



    return (
        <ScrollView style={{ flex: 1, backgroundColor: app_theme.colors.background }}>
            {/* ── Delete confirmation modal ── */}
            {showDeleteConfirm && (
                <ModalApp
                    title={strings.delete}
                    singleButton={false}
                    textAction={strings.delete}
                    onAction={handleDelete}
                    onCancel={() => { setShowDeleteConfirm(false); dispatch(setShowModalApp(false)); }}
                    onClose={() => { setShowDeleteConfirm(false); dispatch(setShowModalApp(false)); }}
                >
                    <YambiText color="gray" text={(strings as any).confirm_delete_reservation} />
                </ModalApp>
            )}

            {/* ── Complete confirmation modal ── */}
            {showCompleteConfirm && (
                <ModalApp
                    title={(strings as any).mark_completed}
                    singleButton={false}
                    textAction={strings.confirm}
                    onAction={handleComplete}
                    onCancel={() => { setShowCompleteConfirm(false); dispatch(setShowModalApp(false)); }}
                    onClose={() => { setShowCompleteConfirm(false); dispatch(setShowModalApp(false)); }}
                >
                    <YambiText color="gray" text={`${(strings as any).remaining_reserved}: ${remaining.toFixed(2)} ${cur}`} />
                </ModalApp>
            )}

            {/* ── Add installment modal ── */}
            {showAddInstallment && (
                <ModalApp
                    title={(strings as any).add_installment}
                    singleButton={false}
                    textAction={strings.confirm}
                    onAction={handleAddInstallment}
                    onCancel={() => { setShowAddInstallment(false); dispatch(setShowModalApp(false)); }}
                    onClose={() => { setShowAddInstallment(false); dispatch(setShowModalApp(false)); }}
                >
                    <View style={{ paddingHorizontal: 5 }}>
                        <TextSmallYambiGray text={`${(strings as any).remaining_reserved}: ${remaining.toFixed(2)} ${cur}`} styles={{ marginBottom: 12 }} />
                        <TextInput
                            value={installmentAmount}
                            onChangeText={setInstallmentAmount}
                            keyboardType="decimal-pad"
                            placeholder={`${strings.amount} (max ${remaining.toFixed(2)})`}
                            placeholderTextColor={app_theme.colors.gray}
                            style={{
                                borderWidth: 1,
                                borderColor: app_theme.colors.border,
                                borderRadius: 10,
                                padding: 12,
                                color: app_theme.colors.text,
                                marginBottom: 14,
                                fontSize: 16,
                            }}
                        />
                        <TextSmallYambiGray text={(strings as any).payment_method} styles={{ marginBottom: 8 }} />
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            {([
                                { id: 1, label: strings.cash || 'Cash', icon: 'dollar-sign' },
                                { id: 2, label: strings.mobile_money || 'Mobile Money', icon: 'smartphone' },
                                { id: 3, label: strings.card || 'Card', icon: 'credit-card' },
                            ] as const).map(m => (
                                <Pressable
                                    key={m.id}
                                    onPress={() => setInstallmentMethod(m.id as 1 | 2 | 3)}
                                    style={{
                                        flex: 1,
                                        alignItems: 'center',
                                        paddingVertical: 10,
                                        borderRadius: 10,
                                        borderWidth: 1.5,
                                        borderColor: installmentMethod === m.id ? app_theme.colors.high_color : app_theme.colors.border,
                                        backgroundColor: installmentMethod === m.id ? app_theme.colors.high_color + '18' : 'transparent',
                                    }}
                                >
                                    <IconApp pack="FI" name={m.icon} size={16} color={installmentMethod === m.id ? app_theme.colors.high_color : app_theme.colors.gray} />
                                    <TextSmallYambi text={m.label} styles={{ marginTop: 4, fontSize: 11, color: installmentMethod === m.id ? app_theme.colors.high_color : app_theme.colors.gray }} />
                                </Pressable>
                            ))}
                        </View>
                    </View>
                </ModalApp>
            )}

            {/* ── Success modal ── */}
            {showSuccess && (
                <ModalApp
                    title={strings.success || 'Success'}
                    singleButton
                    onClose={() => { setShowSuccess(false); dispatch(setShowModalApp(false)); }}
                >
                    <YambiText color="gray" text={successMsg} />
                </ModalApp>
            )}

            <View style={{ flex: 1, backgroundColor: app_theme.colors.background, marginBottom: 50 }}>
                {/* ── Status & Info header card ── */}
                <View style={{
                    backgroundColor: app_theme.colors.border,
                    padding: 20,
                    margin: 15,
                    borderRadius: 16,
                    elevation: 2,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 3,
                    alignItems: 'center',
                }}>
                    <View style={{
                        width: 50,
                        height: 50,
                        borderRadius: 25,
                        backgroundColor: sColor + '20',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: 12,
                        borderWidth: 1,
                        borderColor: sColor + '40',
                    }}>
                        <Feather name="bookmark" size={22} color={sColor} />
                    </View>
                    <YambiText style={{ marginBottom: 6, textAlign: 'center' }} bold size="big" text={statusLabel(reservation.status).toUpperCase()} color={reservation.status === 3 ? "success" : reservation.status === 4 ? "error" : "high"} />
                    <YambiText style={{ marginVertical: 2, textAlign: 'center', fontSize: 12 }} size="small" color="gray" text={`${strings.Date || 'Date'}: ${renderDateTime(reservation.createdAt, 1, true)}`} />
                </View>

                {/* ── Reservation Details Card ── */}
                <View style={{
                    backgroundColor: app_theme.colors.border,
                    margin: 15,
                    marginTop: 0,
                    borderRadius: 16,
                    padding: 16,
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
                        marginBottom: 12
                    }}>
                        <YambiText bold text={(strings as any).reservation_detail} />
                        <Feather name="file-text" size={16} color={app_theme.colors.text} />
                    </View>

                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                            <YambiText bold text={article?.item_name ? article.item_name.toUpperCase() : "ITEM"} />
                            <YambiText style={{ marginTop: 4 }} size="small" color="gray" text={`${reservation.quantity} x ${(total / reservation.quantity).toFixed(2)} ${cur}`} />
                        </View>
                        <YambiText bold size="big" text={`${total.toFixed(2)} ${cur}`} />
                    </View>
                </View>

                {/* ── Amounts Summary Card ── */}
                <View style={{
                    backgroundColor: app_theme.colors.border,
                    margin: 15,
                    marginTop: 0,
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
                        paddingVertical: 6,
                    }}>
                        <YambiText text={(strings as any).total_reserved} size="small" color="gray" />
                        <YambiText bold text={`${total.toFixed(2)} ${cur}`} />
                    </View>
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        paddingVertical: 6,
                    }}>
                        <YambiText text={(strings as any).deposit_paid} size="small" color="gray" />
                        <YambiText bold text={`${deposit.toFixed(2)} ${cur}`} color="success" />
                    </View>
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingVertical: 10,
                        borderTopWidth: 1,
                        borderColor: app_theme.colors.background,
                        marginTop: 10,
                    }}>
                        <YambiText bold text={(strings as any).remaining_balance} />
                        <YambiText bold text={`${remaining.toFixed(2)} ${cur}`} size="big" color={remaining > 0 ? "high" : "success"} />
                    </View>
                </View>

                {/* ── Client Details Card ── */}
                {(reservation.customer_name !== '' || reservation.customer_phone !== '') && (
                    <View style={{
                        backgroundColor: app_theme.colors.border,
                        margin: 15,
                        marginTop: 0,
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
                            marginBottom: 12
                        }}>
                            <YambiText bold text={(strings as any).client_details} />
                            <Feather name="user" size={16} color={app_theme.colors.text} />
                        </View>

                        {reservation.customer_name !== '' && (
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
                                <YambiText text={(strings as any).client_name} size="small" color="gray" />
                                <YambiText bold text={reservation.customer_name} />
                            </View>
                        )}
                        {reservation.customer_phone !== '' && (
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
                                <YambiText text={(strings as any).client_phone} size="small" color="gray" />
                                <Pressable onPress={() => handlePhonePress(reservation.customer_phone)}>
                                    <YambiText bold text={reservation.customer_phone} color="high" style={{ textDecorationLine: 'underline' }} />
                                </Pressable>
                            </View>
                        )}
                    </View>
                )}

                {/* ── Payment History Card ── */}
                {payments.length > 0 && (
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
                            flexWrap: 'wrap'
                        }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Feather name="clock" size={16} color={app_theme.colors.text} style={{ marginRight: 8 }} />
                                <YambiText bold text={(strings as any).payment_history} />
                            </View>
                            <YambiText bold text={`${deposit.toFixed(2)} ${(strings as any).of} ${total.toFixed(2)} ${cur} ${(strings as any).paid}`} size="small" color={remaining === 0 ? "success" : "high"} />
                        </View>

                        {Array.from(payments as any).map((pmt: any, idx: number) => {
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
                        })}
                    </View>
                )}

                {/* ── Action buttons ── */}
                {isActive && (
                    <View style={{ margin: 15, marginTop: 0, gap: 12 }}>
                        {remaining > 0 && (
                            <ButtonNormal
                                title={(strings as any).add_installment || "Add Installment"}
                                loadEnabled={true}
                                onPress={() => { setShowAddInstallment(true); dispatch(setShowModalApp(true)); }}
                                normal={true}
                            />
                        )}
                        <ButtonNormal
                            title={(strings as any).mark_completed || "Mark as Completed"}
                            loadEnabled={true}
                            onPress={() => { setShowCompleteConfirm(true); dispatch(setShowModalApp(true)); }}
                            outline={true}
                        />
                    </View>
                )}

                {/* Print Invoice button when completed/fully paid */}
                {!isActive && reservation && reservation.status === 3 && (
                    <View style={{ margin: 15, marginTop: 0 }}>
                        <ButtonNormal
                            title={strings.print || "Print"}
                            loadEnabled={true}
                            onPress={PrintInvoice}
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

export default ReservationDetail;
