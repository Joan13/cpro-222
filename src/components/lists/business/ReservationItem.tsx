import React from 'react';
import { Pressable, View } from 'react-native';
import { useAppSelector } from '../../../store/app/hooks';
import { IconApp } from '../../app/IconApp';
import { TextNormalYambi, TextSmallYambiGray, TextNormalYambiHighColor, TextSmallYambi } from '../../app/Text';
import { renderCurrency, renderDateTime } from '../../../../GlobalVariables';
import { strings } from '../../../lang/lang';

interface ReservationItemProps {
    item: any;
    onPress: () => void;
    isLast?: boolean;
}

const statusColor = (status: number, theme: any): string => {
    switch (status) {
        case 1: return '#F59E0B';   // Pending — amber
        case 2: return '#6366F1';   // Confirmed — indigo
        case 3: return '#10B981';   // Completed — green
        case 4: return theme.colors.error;  // Cancelled
        case 5: return theme.colors.gray;   // Expired
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

const ReservationItem: React.FC<ReservationItemProps> = ({ item, onPress, isLast }) => {
    const app_theme = useAppSelector(state => state.app_theme);
    const color = statusColor(item.status, app_theme);
    const cur = renderCurrency(item.currency, false);
    const total = parseFloat(item.total_amount) || 0;
    const deposit = parseFloat(item.deposit_amount) || 0;
    const remaining = parseFloat(item.remaining_amount) || 0;

    return (
        <Pressable
            onPress={onPress}
            style={({pressed}) => ({
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: pressed ? app_theme.colors.border + 'AA' : app_theme.colors.background,
                paddingHorizontal: 15,
                paddingVertical: 14,
                borderBottomWidth: isLast ? 0 : 1,
                borderColor: app_theme.colors.border,
            })}
        >
            {/* Status dot / icon */}
            <View style={{
                width: 42,
                height: 42,
                borderRadius: 21,
                backgroundColor: color + '20',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 13,
                flexShrink: 0,
            }}>
                <IconApp pack="FI" name="bookmark" size={18} color={color} />
            </View>

            {/* Main info */}
            <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
                    {/* Status badge */}
                    <View style={{
                        backgroundColor: color + '20',
                        borderRadius: 8,
                        paddingHorizontal: 7,
                        paddingVertical: 2,
                        marginRight: 8,
                    }}>
                        <TextSmallYambi
                            text={statusLabel(item.status)}
                            styles={{ color, fontSize: 10 }}
                        />
                    </View>
                    <TextSmallYambiGray
                        text={renderDateTime(item.createdAt, 3, true)}
                        styles={{ fontSize: 11, flexShrink: 1 }}
                        numberLines={1}
                    />
                </View>

                {/* Customer */}
                {(item.customer_name || item.customer_phone) ? (
                    <TextNormalYambi
                        text={item.customer_name || item.customer_phone}
                        bold
                        styles={{ marginBottom: 3 }}
                        numberLines={1}
                    />
                ) : null}

                {/* Amounts row */}
                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TextSmallYambiGray text={`${(strings as any).total_reserved || 'Total'}: `} styles={{ fontSize: 11 }} />
                        <TextSmallYambi text={`${total.toFixed(2)} ${cur}`} styles={{ fontSize: 11 }} bold />
                    </View>
                    {deposit > 0 && (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <IconApp pack="FI" name="check-circle" size={10} color={app_theme.colors.success} />
                            <TextSmallYambiGray text={` ${deposit.toFixed(2)} ${cur}`} styles={{ fontSize: 11, color: app_theme.colors.success }} />
                        </View>
                    )}
                    {remaining > 0 && (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <IconApp pack="FI" name="clock" size={10} color="#F59E0B" />
                            <TextSmallYambiGray text={` ${remaining.toFixed(2)} ${cur}`} styles={{ fontSize: 11, color: '#F59E0B' }} />
                        </View>
                    )}
                </View>
            </View>

            <IconApp pack="FI" name="chevron-right" size={18} color={app_theme.colors.gray} />
        </Pressable>
    );
};

export default ReservationItem;
