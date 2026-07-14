import React from 'react';
import { View, Pressable } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useAppSelector } from '../../../store/app/hooks';
import { YambiText } from '../../app/Text';
import { renderCurrency, renderDateTime } from '../../../../GlobalVariables';
import { strings } from '../../../lang/lang';

export interface ISalePaymentItem {
    pmt: any;
    agentName?: string;
    onPhonePress: (phone: string) => void;
    onPress: () => void;
    isLast?: boolean;
}

const SalePaymentItem: React.FC<ISalePaymentItem> = ({ pmt, agentName, onPhonePress, onPress, isLast }) => {
    const app_theme = useAppSelector(state => state.app_theme);
    const isPaid = pmt.payment_status === 2;
    
    const renderPaymentMethodLabel = (method: number) => {
        switch (method) {
            case 1: return (strings as any).paid_cash || "Paid Cash";
            case 2: return (strings as any).paid_mobile_money || "Paid by Mobile Money";
            case 3: return (strings as any).paid_card || "Paid by Card";
            default: return (strings as any).paid_cash || "Paid Cash";
        }
    };

    const formatAmountStr = (num: number) => {
        return num % 1 === 0 ? num.toString() : num.toFixed(2);
    };

    const statusColor = pmt.payment_status === 4 ? app_theme.colors.gray : isPaid ? '#4CAF50' : '#FF9800';
    const methodLabel = pmt.payment_status === 4
        ? ((strings as any).payment_cancelled || "Payment cancelled")
        : isPaid 
        ? renderPaymentMethodLabel(pmt.payment_method)
        : ((strings as any).payment_pending || "Payment pending");
 
    return (
        <Pressable 
            onPress={onPress}
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderBottomWidth: isLast ? 0 : 1,
                borderColor: app_theme.colors.background,
                backgroundColor: isPaid ? 'transparent' : app_theme.colors.background + '20'
            }}
        >
            <View style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: pmt.payment_status === 4 ? app_theme.colors.background : isPaid ? '#E8F5E9' : '#FFF3E0',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12,
            }}>
                <Feather
                    name={pmt.payment_status === 4 ? "slash" : isPaid ? "check" : "clock"}
                    size={18}
                    color={statusColor}
                />
            </View>
            <View style={{ flex: 1 }}>
                <YambiText bold text={`${formatAmountStr(parseFloat(pmt.amount))} ${renderCurrency(pmt.currency, false)}`} size="small" />
                <YambiText text={`${methodLabel} · ${renderDateTime(pmt.createdAt, 2, false)}`} size="small" color="gray" style={{ marginTop: 2 }} />
                {agentName ? (
                    <View style={{ marginTop: 2 }}>
                        <YambiText text={agentName} size="small" color="gray" />
                        <Pressable onPress={() => onPhonePress(pmt.agent_paid)}>
                            <YambiText
                                text={pmt.agent_paid}
                                size="small"
                                color="high"
                                style={{ textDecorationLine: 'underline', marginTop: 2 }}
                            />
                        </Pressable>
                    </View>
                ) : pmt.agent_paid ? (
                    <Pressable onPress={() => onPhonePress(pmt.agent_paid)}>
                        <YambiText
                            text={pmt.agent_paid}
                            size="small"
                            color="high"
                            style={{ textDecorationLine: 'underline', marginTop: 2 }}
                        />
                    </Pressable>
                ) : null}
            </View>
        </Pressable>
    );
};

export default SalePaymentItem;
