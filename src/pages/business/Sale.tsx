import { ActivityIndicator, FlatList, Button, Text, Pressable, View, Alert, Image, ScrollView } from "react-native";
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from "@react-navigation/native";
import { useCallback, useEffect, useState } from 'react';
import { NavProps, TBusiness, TSale, TSellsPoint } from "../../types/types";
import { strings } from "../../lang/lang";
import ButtonNormal from "../../components/app/ButtonNormal";
import { IconApp } from "../../components/app/IconApp";
import { useAppDispatch, useAppSelector } from "../../store/app/hooks";
import * as RootNavigation from './../../services/Navigation_ref';
import { useObject, useQuery, useRealm } from "@realm/react";
import { BusinessItemsSale, UserBusinesses, UserSellsPoints, Payments, BusinessUsers } from "../../store/database/Models";
import { getSalePaymentDetails } from "../../utils/paymentHelpers";
import { setShowModalApp } from "../../store/reducers/appSlice";
import { YambiText } from "../../components/app/Text";
import ModalApp from "../../components/app/ModalApp";
import { FlashList } from "@shopify/flash-list";
import SalePaymentItem from "../../components/lists/business/SalePaymentItem";
import BusinessesList from "../../components/lists/business/BusinessesList";
import { renderCurrency, renderDateTime, SocketApp } from "../../../GlobalVariables";
import RNPrint from 'react-native-print';
import QRCode from 'qrcode';
import moment from "moment";

const Sale = ({ navigation, route }: NavProps) => {

    const app_theme = useAppSelector(state => state.app_theme);
    const loading_app = useAppSelector(state => state.app.loading);
    const user_data = useAppSelector(state => state.user_data);
    const dispatch = useAppDispatch();
    const realm = useRealm();

    const { item } = route.params;
    const { sale } = route.params;
    const business = useObject(UserBusinesses, item.business_id);
    const sala = useObject(BusinessItemsSale, sale._id);

    if (sala === null) return;
    const sales_point = useObject(UserSellsPoints, sale.sales_point_id);
    const { prices } = route.params;

    if (business === null || sales_point === null) return;

    const tva_rate = (parseInt(sales_point?.tva) || 16) / 100;
    const totalPrice = parseFloat(sale.selling_price) * sale.number;
    const tht = totalPrice / (1 + (tva_rate)); // HT = TTC / (1 + (TVA / 100))
    const tva = totalPrice - tht;

    const salePayments = useQuery(Payments, payments => {
        return payments.filtered('sale_id == $0', sale._id).sorted('createdAt', false);
    }, [sale._id]);
    const paymentDetails = getSalePaymentDetails(sale, realm);

    const businessUsers = useQuery(BusinessUsers, users => {
        return users.filtered('business_id == $0', item.business_id);
    }, [item.business_id]);

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

    const renderPaymentMethodLabel = (method: number) => {
        switch (method) {
            case 1: return (strings as any).paid_cash || "Paid Cash";
            case 2: return (strings as any).paid_mobile_money || "Paid by Mobile Money";
            case 3: return (strings as any).paid_card || "Paid by Card";
            default: return (strings as any).paid_cash || "Paid Cash";
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
        const publicUrl = `https://app.yambi.net/business/${business._id}`;
        const qrSvg = generateQrSvg(publicUrl);
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
                                <div class="item-name">${item.item_name.toUpperCase()}</div>
                                <div class="item-details">
                                    <span>${sale.number} x ${formatAmount(parseFloat(sale.selling_price))} ${renderCurrency(sale.currency, false)}</span>
                                    <span>${formatAmount(totalPrice)} ${renderCurrency(sale.currency, false)}</span>
                                </div>
                            </div>
                        </div>

                        <div class="summary">
                            <div class="summary-row">
                                <span>${strings.subtotal} (HT):</span>
                                <span>${formatAmount(tht)} ${renderCurrency(sale.currency, false)}</span>
                            </div>
                            <div class="summary-row">
                                <span>TVA (${(tva_rate * 100).toFixed(0)}%):</span>
                                <span>${formatAmount(tva)} ${renderCurrency(sale.currency, false)}</span>
                            </div>
                            <div class="summary-row total">
                                <span>${(strings as any).total_amount || "Total Amount"}:</span>
                                <span>${formatAmount(totalPrice)} ${renderCurrency(sale.currency, false)}</span>
                            </div>
                        </div>

                        ${salePayments.length > 0 ? `
                        <div class="section-title">${(strings as any).payments || "Payments"}</div>
                        <div class="item-list">
                            ${salePayments.filter((p: any) => p.payment_status !== 4 && !(paymentDetails.isPaid && p.payment_status !== 2)).map((pmt: any) => {
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
                                <span>${formatAmount(paymentDetails.paidAmount)} ${(strings as any).of || "of"} ${formatAmount(totalPrice)} ${renderCurrency(sale.currency, false)} ${(strings as any).paid || "paid"}</span>
                            </div>
                            ${paymentDetails.remainingAmount > 0 ? `
                            <div class="summary-row">
                                <span>${(strings as any).remaining_balance || "Remaining Balance"}:</span>
                                <span>${formatAmount(paymentDetails.remainingAmount)} ${renderCurrency(sale.currency, false)}</span>
                            </div>
                            ` : ''}
                        </div>
                        ` : ''}

                        <div class="info-section">
                            <div class="info-row">
                                <span class="info-label">${strings.Date}:</span>
                                <span>${renderDateTime(sale.createdAt, 2, false)}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">${strings.seller}:</span>
                                <span>
                                    ${getOperatorName(sale.sale_operator) ? `${getOperatorName(sale.sale_operator)}<br/><small>${sale.sale_operator}</small>` : sale.sale_operator}
                                </span>
                            </div>
                            ${sale.buyer_name ? `
                            <div class="info-row">
                                <span class="info-label">${strings.buyer}:</span>
                                <span>${sale.buyer_name}${sale.buyer_phone ? ' (' + sale.buyer_phone + ')' : ''}</span>
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

    useEffect(() => {
        navigation.setOptions({ title: strings.sale_id + " " + sale._id });
    }, [sale]);

    const navigateToPayments = () => {
        navigation.navigate('EditSalePayments', { sale: sale, item: item, prices: prices });
    }

    return (
        <View style={{
            flex: 1,
            backgroundColor: app_theme.colors.background,
        }}>
            <ScrollView style={{ width: '100%' }} showsVerticalScrollIndicator={false}>
                {/* Business Info Header Card */}
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
                        backgroundColor: app_theme.colors.background,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: 12,
                        borderWidth: 1,
                        borderColor: app_theme.colors.border
                    }}>
                        <Feather name="briefcase" size={22} color={app_theme.colors.high_color} />
                    </View>
                    <YambiText style={{ marginBottom: 6, textAlign: 'center' }} bold size="big" text={business.business_name} />
                    {business.national_number ? <YambiText style={{ marginVertical: 2, textAlign: 'center' }} size="small" text={business.national_number} /> : null}
                    {business.national_id ? <YambiText style={{ marginVertical: 2, textAlign: 'center' }} size="small" text={business.national_id} /> : null}
                    {business.business_address ? <YambiText style={{ marginVertical: 2, textAlign: 'center', fontSize: 12 }} size="small" color="gray" text={business.business_address} /> : null}
                    <YambiText style={{ marginVertical: 2, textAlign: 'center', fontSize: 12 }} size="small" color="gray" text={business.phones} />
                </View>

                {/* Invoice Items Card */}
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
                        <YambiText bold text={(strings as any).invoice_details || "Invoice Details"} />
                        <Feather name="file-text" size={16} color={app_theme.colors.text} />
                    </View>

                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                            <YambiText bold text={item.item_name.toUpperCase()} />
                            <YambiText style={{ marginTop: 4 }} size="small" color="gray" text={`${sale.number} x ${formatAmount(parseFloat(sale.selling_price))} ${renderCurrency(prices.currency, false)}`} />
                        </View>
                        <YambiText bold size="big" text={`${formatAmount(totalPrice)} ${renderCurrency(prices.currency, false)}`} />
                    </View>
                </View>

                {/* Subtotals & Total Card */}
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
                        <YambiText text={`${strings.subtotal} (HT)`} size="small" color="gray" />
                        <YambiText bold text={`${formatAmount(tht)} ${renderCurrency(sale.currency, false)}`} />
                    </View>
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        paddingVertical: 6,
                    }}>
                        <YambiText text={`TVA (${(tva_rate * 100).toFixed(0)}%)`} size="small" color="gray" />
                        <YambiText bold text={`${formatAmount(tva)} ${renderCurrency(sale.currency, false)}`} />
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
                        <YambiText bold text={(strings as any).total_amount || "Total Amount"} />
                        <YambiText bold text={`${formatAmount(totalPrice)} ${renderCurrency(sale.currency, false)}`} size="big" color="high" />
                    </View>
                </View>

                {/* Payment History Card */}
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
                            flexWrap: 'wrap'
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

                {/* Metadata & Operator Card */}
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
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Feather name="calendar" size={14} color={app_theme.colors.gray} style={{ marginRight: 6 }} />
                            <YambiText text={strings.Date} size="small" color="gray" />
                        </View>
                        <YambiText bold text={renderDateTime(sale.createdAt, 2, false)} size="small" />
                    </View>
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        paddingVertical: 6,
                        alignItems: 'center',
                    }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Feather name="user" size={14} color={app_theme.colors.gray} style={{ marginRight: 6 }} />
                            <YambiText text={strings.sale_operator} size="small" color="gray" />
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            {getOperatorName(sale.sale_operator) ? (
                                <>
                                    <YambiText text={getOperatorName(sale.sale_operator)} size="small" bold />
                                    <Pressable onPress={() => handlePhonePress(sale.sale_operator)}>
                                        <YambiText
                                            text={sale.sale_operator}
                                            size="small"
                                            color="high"
                                            style={{ textDecorationLine: 'underline', marginTop: 2 }}
                                        />
                                    </Pressable>
                                </>
                            ) : (
                                <Pressable onPress={() => handlePhonePress(sale.sale_operator)}>
                                    <YambiText
                                        text={sale.sale_operator}
                                        size="small"
                                        color="high"
                                        bold
                                        style={{ textDecorationLine: 'underline' }}
                                    />
                                </Pressable>
                            )}
                        </View>
                    </View>
                    {sale.buyer_name && (
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            paddingVertical: 6,
                            borderTopWidth: 1,
                            borderColor: app_theme.colors.background,
                            marginTop: 8,
                            paddingTop: 8,
                        }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Feather name="user-check" size={14} color={app_theme.colors.gray} style={{ marginRight: 6 }} />
                                <YambiText text={strings.buyer} size="small" color="gray" />
                            </View>
                            <YambiText bold text={sale.buyer_name} size="small" />
                        </View>
                    )}
                    {sale.buyer_phone && (
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            paddingVertical: 6,
                        }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Feather name="phone" size={14} color={app_theme.colors.gray} style={{ marginRight: 6 }} />
                                <YambiText text={strings.phone_number} size="small" color="gray" />
                            </View>
                            <YambiText bold text={sale.buyer_phone} size="small" />
                        </View>
                    )}
                </View>

                {/* Footer Karibu */}
                <View style={{
                    alignItems: 'center',
                    paddingVertical: 25,
                }}>
                    <YambiText text={strings.karibu} bold style={{
                        color: app_theme.colors.text,
                        fontSize: 28,
                        fontWeight: '900',
                    }} />
                    <YambiText text={strings.thank_you_business} size="small" color="gray" style={{ marginTop: 5 }} />
                </View>
            </ScrollView>

            <View style={{
                padding: 15,
                marginBottom: 30,
                backgroundColor: app_theme.colors.background,
                borderTopWidth: 1,
                borderColor: app_theme.colors.border,
            }}>
                {!paymentDetails.isPaid ?
                    <ButtonNormal title={(strings as any).pay_invoice || "Pay Invoice"} loadEnabled={true} onPress={navigateToPayments} styles={{}} normal={true} />
                    :
                    <ButtonNormal title={strings.print} loadEnabled={true} onPress={PrintInvoice} styles={{ marginBottom: 15 }} normal={true} />
                }
            </View>
        </View>
    );
}

export default Sale;
