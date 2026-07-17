import { View, ScrollView, Pressable, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, TBusiness } from '../../types/types';
import { useAppSelector } from '../../store/app/hooks';
import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { remote_host, media_url, getDateFormat, copyToClipboard } from '../../../GlobalVariables';
import { YambiText } from '../../components/app/Text';
import { IconApp } from '../../components/app/IconApp';
import * as RootNavigation from '../../services/Navigation_ref';
import { Image as ExpoImage } from 'expo-image';
import { strings } from '../../lang/lang';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminBusiness'>;

interface AdminBusinessStats {
    users_count: number;
    items_count: number;
    sales_count: number;
    sells_points_count: number;
    subscribers_count: number;
}

const AdminBusinessScreen = ({ route }: Props) => {
    const { business } = route.params;
    const theme = useAppSelector(state => state.app_theme);
    const lang = useAppSelector(state => state.persisted_app.langApp);

    const [stats, setStats] = useState<AdminBusinessStats>({
        users_count: 0,
        items_count: 0,
        sales_count: 0,
        sells_points_count: 0,
        subscribers_count: 0,
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [sellsPoints, setSellsPoints] = useState<any[]>([]);
    const [businessInfo, setBusinessInfo] = useState<TBusiness>(business);

    const fetchData = useCallback(async () => {
        try {
            const res = await axios.post(remote_host + '/yambi/API/get_admin_data', {
                flag: 5, // business detail stats
                business_id: business._id,
            });

            if (res.data?.success === '1') {
                const d = res.data;
                setStats({
                    users_count: d.users_count ?? 0,
                    items_count: d.items_count ?? 0,
                    sales_count: d.sales_count ?? 0,
                    sells_points_count: d.sells_points_count ?? 0,
                    subscribers_count: d.subscribers_count ?? 0,
                });
                if (d.sells_points) setSellsPoints(d.sells_points);
                if (d.business) setBusinessInfo(d.business);
            }
        } catch {
            // Silently fail — still show page with nav-param data
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [business._id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, [fetchData]);

    const isExpired = (() => {
        if (!businessInfo.valid_until || businessInfo.valid_until === '') return false;
        if (businessInfo.business_name === 'Mwanga Business') return false;
        try {
            return new Date(businessInfo.valid_until) < new Date();
        } catch {
            return false;
        }
    })();

    const StatBadge = ({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) => (
        <View style={{
            flex: 1,
            alignItems: 'center',
            paddingVertical: 12,
            paddingHorizontal: 6,
            backgroundColor: color + '15',
            borderRadius: 12,
            marginHorizontal: 4,
            borderWidth: 1,
            borderColor: color + '30',
        }}>
            <IconApp pack="FI" name={icon} size={18} color={color} />
            <YambiText bold text={value.toString()} style={{ fontSize: 22, marginTop: 6, color }} />
            <YambiText size="small" color="gray" text={label} style={{ textAlign: 'center' }} />
        </View>
    );

    const ActionCard = ({
        icon,
        title,
        subtitle,
        onPress,
        iconPack = 'FI',
        color,
        badge,
    }: {
        icon: string;
        title: string;
        subtitle?: string;
        onPress: () => void;
        iconPack?: string;
        color?: string;
        badge?: number;
    }) => (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: pressed ? theme.colors.border : theme.colors.background,
                borderRadius: 14,
                padding: 16,
                marginBottom: 10,
                borderWidth: 1,
                borderColor: theme.colors.border,
                opacity: pressed ? 0.85 : 1,
            })}
        >
            <View style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: (color || theme.colors.high_color) + '20',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 14,
            }}>
                <IconApp pack={iconPack} name={icon} size={22} color={color || theme.colors.high_color} />
            </View>
            <View style={{ flex: 1 }}>
                <YambiText bold text={title} />
                {subtitle ? <YambiText size="small" color="gray" text={subtitle} style={{ marginTop: 2 }} /> : null}
            </View>
            {badge !== undefined && badge > 0 ? (
                <View style={{
                    backgroundColor: theme.colors.high_color,
                    borderRadius: 12,
                    minWidth: 24,
                    height: 24,
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: 6,
                    marginRight: 8,
                }}>
                    <YambiText bold color="white" text={badge.toString()} style={{ fontSize: 12 }} />
                </View>
            ) : null}
            <IconApp pack="FI" name="chevron-right" size={18} color={theme.colors.gray} />
        </Pressable>
    );

    const SectionTitle = ({ title }: { title: string }) => (
        <YambiText
            bold
            text={title}
            style={{ fontSize: 16, marginBottom: 10, marginTop: 18, color: theme.colors.text }}
        />
    );

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: theme.colors.background }}
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor={theme.colors.high_color}
                    colors={[theme.colors.high_color]}
                />
            }
        >
            {/* Business Header */}
            <View style={{
                backgroundColor: theme.colors.border + '30',
                borderRadius: 20,
                padding: 20,
                marginBottom: 20,
                borderWidth: 1,
                borderColor: theme.colors.border,
            }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                    {/* Logo */}
                    <Pressable
                        onPress={() => {
                            if (businessInfo.logo) {
                                RootNavigation.navigate('ViewPhoto', {
                                    source: media_url + '/business_logos/' + businessInfo.logo,
                                });
                            }
                        }}
                        style={{
                            width: 72,
                            height: 72,
                            borderRadius: 36,
                            borderWidth: 2,
                            borderColor: theme.colors.high_color,
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginRight: 14,
                            overflow: 'hidden',
                        }}
                    >
                        {businessInfo.logo && businessInfo.logo !== '' ? (
                            <ExpoImage
                                style={{ width: 68, height: 68, borderRadius: 34 }}
                                contentFit="cover"
                                source={media_url + '/business_logos/' + businessInfo.logo}
                            />
                        ) : (
                            <IconApp pack="MT" name="business-center" size={32} color={theme.colors.high_color} />
                        )}
                    </Pressable>

                    {/* Business Info */}
                    <View style={{ flex: 1 }}>
                        <YambiText size="big" bold text={businessInfo.business_name} style={{ marginBottom: 3 }} />
                        <Pressable onLongPress={() => copyToClipboard(businessInfo._id)}>
                            <YambiText size="small" color="gray" text={`ID: ${businessInfo._id}`} />
                        </Pressable>
                        {businessInfo.phone_number ? (
                            <Pressable onPress={() => copyToClipboard(businessInfo.phone_number)}>
                                <YambiText size="small" color="gray" text={`📞 ${businessInfo.phone_number}`} style={{ marginTop: 3 }} />
                            </Pressable>
                        ) : null}

                        {/* Status Badge */}
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginTop: 6,
                            backgroundColor: (isExpired ? theme.colors.error : theme.colors.success) + '20',
                            borderRadius: 8,
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            alignSelf: 'flex-start',
                        }}>
                            <IconApp
                                pack="FI"
                                name={isExpired ? 'alert-circle' : 'check-circle'}
                                size={12}
                                color={isExpired ? theme.colors.error : theme.colors.success}
                            />
                            <YambiText
                                size="small"
                                text={isExpired ? strings.expired_subscription : strings.active_subscription}
                                style={{ marginLeft: 4, color: isExpired ? theme.colors.error : theme.colors.success, fontSize: 11 }}
                            />
                        </View>
                    </View>
                </View>

                {/* Description */}
                {businessInfo.description_service ? (
                    <View style={{
                        backgroundColor: theme.colors.border + '40',
                        borderRadius: 10,
                        padding: 12,
                        marginTop: 4,
                    }}>
                        <YambiText size="small" color="gray" text={businessInfo.description_service} />
                    </View>
                ) : null}

                {/* Valid Until */}
                {businessInfo.valid_until ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                        <IconApp pack="FI" name="calendar" size={14} color={theme.colors.gray} />
                        <YambiText
                            size="small"
                            color="gray"
                            text={`${strings.valid_until || 'Valid until'}: ${getDateFormat(businessInfo.valid_until, lang)}`}
                            style={{ marginLeft: 6 }}
                        />
                    </View>
                ) : null}

                {businessInfo.createdAt ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                        <IconApp pack="FI" name="clock" size={14} color={theme.colors.gray} />
                        <YambiText
                            size="small"
                            color="gray"
                            text={`${'Created'}: ${getDateFormat(businessInfo.createdAt, lang)}`}
                            style={{ marginLeft: 6 }}
                        />
                    </View>
                ) : null}
            </View>

            {/* Stats Row */}
            {loading ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                    <ActivityIndicator color={theme.colors.high_color} size="large" />
                    <YambiText size="small" color="gray" text="Loading business data..." style={{ marginTop: 8 }} />
                </View>
            ) : (
                <>
                    <View style={{ flexDirection: 'row', marginBottom: 16 }}>
                        <StatBadge label={strings.users} value={stats.users_count} icon="users" color={theme.colors.high_color} />
                        <StatBadge label={strings.items} value={stats.items_count} icon="box" color="#F59E0B" />
                        <StatBadge label={strings.sales} value={stats.sales_count} icon="trending-up" color="#10B981" />
                        <StatBadge label={strings.sells_points} value={stats.sells_points_count} icon="box" color="#8B5CF6" />
                    </View>

                    {/* Admin Actions */}
                    <SectionTitle title={`🛠 ${strings.edit} & ${strings.information || 'Information'}`} />

                    <ActionCard
                        icon="edit"
                        title={strings.edit_business}
                        subtitle="Edit name, description, contact, logo"
                        color={theme.colors.high_color}
                        onPress={() => RootNavigation.navigate('EditBusiness', { business: businessInfo })}
                    />

                    <ActionCard
                        icon="credit-card"
                        title={strings.subscription_history}
                        subtitle="View all subscription payments"
                        color="#8B5CF6"
                        onPress={() => RootNavigation.navigate('SubscriptionHistory', { business_id: business._id })}
                    />

                    <ActionCard
                        icon="refresh-cw"
                        title={strings.add_subscription}
                        subtitle="Renew or upgrade business subscription"
                        color="#EC4899"
                        onPress={() => RootNavigation.navigate('AddBusinessSubscription', { business_id: business._id })}
                    />

                    {/* Navigation */}
                    <SectionTitle title={`📦 ${strings.inventory} & ${strings.items}`} />

                    <ActionCard
                        icon="package"
                        title={strings.inventory}
                        subtitle={`${stats.items_count} ${strings.items}`}
                        badge={stats.items_count}
                        color="#F59E0B"
                        onPress={() =>
                            RootNavigation.navigate('BusinessItems', {
                                business_id: business._id,
                                sales_point_id: '',
                                flag: 2,
                                can_upload_images: true,
                            })
                        }
                    />

                    <ActionCard
                        icon="plus"
                        title={strings.add_item}
                        subtitle="Add a new product to this business"
                        color="#8B5CF6"
                        onPress={() =>
                            RootNavigation.navigate('NewBusinessItem', {
                                business_id: business._id,
                                can_upload_images: true,
                            })
                        }
                    />

                    <ActionCard
                        icon="list"
                        title={strings.view_inventory_movement_history}
                        subtitle="Stock in/out movement log"
                        color={theme.colors.high_color}
                        onPress={() =>
                            RootNavigation.navigate('BusinessInventoryMovementHistory', { business_id: business._id })
                        }
                    />

                    <SectionTitle title={`💰 ${strings.sales} & ${strings.expenses || 'Expenses'}`} />

                    <ActionCard
                        icon="trending-up"
                        title={strings.sales}
                        subtitle={`${stats.sales_count} ${strings.completed_sales}`}
                        badge={stats.sales_count}
                        color="#10B981"
                        onPress={() =>
                            RootNavigation.navigate('BusinessSales', {
                                business_id: business._id,
                                sales_point_id: '',
                                item_id: '',
                            })
                        }
                    />

                    <ActionCard
                        icon="dollar-sign"
                        title={strings.view_expenses}
                        subtitle="Business-level expenses"
                        color={theme.colors.high_color}
                        onPress={() =>
                            RootNavigation.navigate('GetExpenses', { flag: 1, business_id: business._id })
                        }
                    />

                    <ActionCard
                        icon="bookmark"
                        title={(strings as any).view_reservations || 'Reservations'}
                        subtitle="View and manage reservations"
                        color="#EC4899"
                        onPress={() =>
                            RootNavigation.navigate('Reservations', { business_id: business._id })
                        }
                    />

                    <SectionTitle title={`👥 ${strings.users} & ${strings.sells_points}`} />

                    <ActionCard
                        icon="users"
                        title={strings.users}
                        subtitle={`${stats.users_count} ${stats.users_count === 1 ? strings.user : strings.users}`}
                        badge={stats.users_count}
                        color={theme.colors.high_color3 || '#3B82F6'}
                        onPress={() =>
                            RootNavigation.navigate('UserBusinessUsers', { business_id: business._id })
                        }
                    />

                    <ActionCard
                        icon="user-plus"
                        title={strings.add_user || 'Add New User'}
                        subtitle="Add a staff member to this business"
                        color="#3B82F6"
                        onPress={() =>
                            RootNavigation.navigate('NewBusinessUser', { business_id: business._id, sales_point_id: '' })
                        }
                    />

                    <ActionCard
                        icon="store"
                        title={strings.sells_points}
                        subtitle={`${stats.sells_points_count} ${strings.sells_points?.toLowerCase()}`}
                        badge={stats.sells_points_count}
                        color="#EC4899"
                        iconPack="MT"
                        onPress={() =>
                            RootNavigation.navigate('NewSalesPoint', { business_id: business._id })
                        }
                    />

                    {/* Sells Points List */}
                    {sellsPoints.length > 0 ? (
                        <View style={{
                            backgroundColor: theme.colors.border + '30',
                            borderRadius: 14,
                            padding: 14,
                            marginBottom: 10,
                            borderWidth: 1,
                            borderColor: theme.colors.border,
                        }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                                <IconApp pack="MT" name="store" size={16} color="#EC4899" />
                                <YambiText bold text={strings.sells_points} style={{ marginLeft: 8 }} />
                                <YambiText color="high" bold text={` (${sellsPoints.length})`} />
                            </View>
                            {sellsPoints.map((pos: any) => (
                                <Pressable
                                    key={pos._id}
                                    onPress={() =>
                                        RootNavigation.navigate('BusinessSales', {
                                            business_id: business._id,
                                            sales_point_id: pos._id,
                                            item_id: '',
                                        })
                                    }
                                    style={({ pressed }) => ({
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        paddingVertical: 10,
                                        paddingHorizontal: 4,
                                        borderBottomWidth: 1,
                                        borderBottomColor: theme.colors.border,
                                        opacity: pressed ? 0.7 : 1,
                                    })}
                                >
                                    <View style={{ flex: 1 }}>
                                        <YambiText bold text={pos.sells_point_name} />
                                        {pos.sells_point_address ? (
                                            <YambiText size="small" color="gray" text={pos.sells_point_address} />
                                        ) : null}
                                    </View>
                                    <IconApp pack="FI" name="chevron-right" size={16} color={theme.colors.gray} />
                                </Pressable>
                            ))}
                        </View>
                    ) : null}

                    <ActionCard
                        icon="heart"
                        title={strings.followers || 'Subscribers'}
                        subtitle={`${stats.subscribers_count} ${stats.subscribers_count === 1 ? strings.follower : strings.followers}`}
                        badge={stats.subscribers_count}
                        color="#F43F5E"
                        onPress={() =>
                            RootNavigation.navigate('BusinessSubscribers', { business_id: business._id })
                        }
                    />

                    {/* Danger Zone */}
                    <SectionTitle title="⚠️ Admin Actions" />
                    <Pressable
                        onPress={() => {
                            Alert.alert(
                                'Admin: View as Owner',
                                `Navigate as the business owner (${businessInfo.phone_number}) to see all sections from their perspective.`,
                                [{ text: strings.cancel, style: 'cancel' }]
                            );
                        }}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: theme.colors.error + '15',
                            borderRadius: 14,
                            padding: 16,
                            marginBottom: 10,
                            borderWidth: 1,
                            borderColor: theme.colors.error + '40',
                        }}
                    >
                        <IconApp pack="FI" name="eye" size={20} color={theme.colors.error} styles={{ marginRight: 12 }} />
                        <View style={{ flex: 1 }}>
                            <YambiText bold text="Business Owner" style={{ color: theme.colors.error }} />
                            <YambiText size="small" color="gray" text={businessInfo.phone_number || 'N/A'} />
                        </View>
                    </Pressable>
                </>
            )}
        </ScrollView>
    );
};

export default AdminBusinessScreen;
