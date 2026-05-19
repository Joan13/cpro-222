import React from 'react';
import { View } from 'react-native';
import { useAppSelector } from '../../../store/app/hooks';
import { strings } from '../../../lang/lang';
import { YambiText } from '../../app/Text';
import moment from 'moment';

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

interface SubscriptionHistoryItemProps {
    item: SubscriptionItem;
    index: number;
}

const SubscriptionHistoryItem = ({ item }: SubscriptionHistoryItemProps) => {
    const theme = useAppSelector(state => state.app_theme.colors);
    const paymentStatus = parseInt(String(item.payment_status ?? 1), 10);
    const isPaymentSuccess = paymentStatus === 1;
    const isPaymentPending = paymentStatus === 0;
    const isPaymentFailed = paymentStatus === 2;
    const isActiveSubscription = !!item.is_active && isPaymentSuccess;
    const isOutdatedSubscription = isPaymentSuccess && !!item.is_expired && !isActiveSubscription;

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        try {
            return moment(dateString).format('MMM DD, YYYY');
        } catch (error) {
            return dateString;
        }
    };

    const formatDateTime = (dateString: string) => {
        if (!dateString) return '';
        try {
            return moment(dateString).format('MMM DD, YYYY HH:mm');
        } catch (error) {
            return dateString;
        }
    };

    return (
        <View
            style={{
                backgroundColor: theme.border + '40',
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                marginHorizontal: 20,
                borderWidth: isActiveSubscription ? 2 : 1,
                borderColor: isActiveSubscription
                    ? theme.high_color 
                    : theme.border,
            }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                        <YambiText
                            text={item.plan_name}
                            size="big"
                            color="default"
                            bold
                        />
                        {isActiveSubscription && (
                            <View style={{
                                backgroundColor: theme.success,
                                borderRadius: 12,
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                marginLeft: 10,
                            }}>
                                <YambiText
                                    text={strings.active}
                                    size="small"
                                    color="badge"
                                    style={{ color: '#FFFFFF' }}
                                />
                            </View>
                        )}
                        {isPaymentPending && (
                            <View style={{
                                backgroundColor: theme.high_color2,
                                borderRadius: 12,
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                marginLeft: 10,
                            }}>
                                <YambiText
                                    text={strings.processing_payment || "Pending"}
                                    size="small"
                                    color="badge"
                                    style={{ color: '#FFFFFF' }}
                                />
                            </View>
                        )}
                        {isPaymentFailed && (
                            <View style={{
                                backgroundColor: theme.error,
                                borderRadius: 12,
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                marginLeft: 10,
                            }}>
                                <YambiText
                                    text={strings.failed || "Failed"}
                                    size="small"
                                    color="badge"
                                    style={{ color: '#FFFFFF' }}
                                />
                            </View>
                        )}
                        {isOutdatedSubscription && (
                            <View style={{
                                backgroundColor: theme.high_color2,
                                borderRadius: 12,
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                marginLeft: 10,
                            }}>
                                <YambiText
                                    text={strings.outdated || "Outdated"}
                                    size="small"
                                    color="badge"
                                    style={{ color: '#FFFFFF' }}
                                />
                            </View>
                        )}
                        {item.is_expired && !isActiveSubscription && !isPaymentSuccess && (
                            <View style={{
                                backgroundColor: theme.error,
                                borderRadius: 12,
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                marginLeft: 10,
                            }}>
                                <YambiText
                                    text={strings.expired_subscription}
                                    size="small"
                                    color="badge"
                                    style={{ color: '#FFFFFF' }}
                                />
                            </View>
                        )}
                    </View>
                    <YambiText
                        text={`${item.subscription_type === 1 ? strings.monthly : strings.one_time}`}
                        size="small"
                        color="gray"
                    />
                </View>
                {item.amount > 0 && (
                    <View style={{ alignItems: 'flex-end' }}>
                        <YambiText
                            text={`$${item.amount.toFixed(2)}`}
                            size="normal"
                            color="high"
                            bold
                        />
                        <YambiText
                            text={item.currency.toUpperCase()}
                            size="small"
                            color="gray"
                        />
                    </View>
                )}
            </View>

            <View style={{
                borderTopWidth: 1,
                borderTopColor: theme.border,
                paddingTop: 12,
                marginTop: 12,
            }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <YambiText
                        text={(strings as any).start_date || "Start Date"}
                        size="small"
                        color="gray"
                    />
                    <YambiText
                        text={formatDate(item.subscription_start_date)}
                        size="small"
                        color="default"
                    />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <YambiText
                        text={(strings as any).end_date || "End Date"}
                        size="small"
                        color="gray"
                    />
                    <YambiText
                        text={formatDate(item.subscription_end_date)}
                        size="small"
                        color="default"
                    />
                </View>
                {item.createdAt && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <YambiText
                            text={strings.created_at || "Created At"}
                            size="small"
                            color="gray"
                        />
                        <YambiText
                            text={formatDateTime(item.createdAt)}
                            size="small"
                            color="gray"
                        />
                    </View>
                )}
            </View>
        </View>
    );
};

export default SubscriptionHistoryItem;
