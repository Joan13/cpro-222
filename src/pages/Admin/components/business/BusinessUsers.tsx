import React, { useState, useEffect, useCallback } from 'react';
import { View, ActivityIndicator, RefreshControl } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import axios from 'axios';
import { useRealm, useQuery } from '@realm/react';
import { FlashList } from '@shopify/flash-list';
import { useAppSelector } from '../../../../store/app/hooks';
import { BusinessUsers as BusinessUsersModel } from '../../../../store/database/Models';
import { TBusinessUser } from '../../../../types/types';
import { remote_host } from '../../../../../GlobalVariables';
import { YambiText } from '../../../../components/app/Text';
import BusinessUsersList from '../../../../components/lists/business/BusinessUsers';

type RootStackParamList = {
    AdminBusinessUsers: { business_id: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'AdminBusinessUsers'>;

const pi = (v: unknown, d = 0) => parseInt(String(v ?? d), 10);

function realmBusinessUserFromApi(raw: Record<string, unknown>): TBusinessUser {
    return {
        _id: String(raw._id),
        business_id: String(raw.business_id ?? ""),
        sales_point_id: String(raw.sales_point_id ?? ""),
        user_name: String(raw.user_name ?? ""),
        phone_number: String(raw.phone_number ?? ""),
        user: String(raw.user ?? ""),
        level: pi(raw.level, 1),
        user_active: pi(raw.user_active, 1),
        createdAt: String(raw.createdAt ?? ""),
        updatedAt: String(raw.updatedAt ?? ""),
    };
}

const AdminBusinessUsers = ({ route }: Props) => {
    const { business_id } = route.params;
    const theme = useAppSelector(state => state.app_theme.colors);
    const realm = useRealm();
    
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Query business users locally
    const businessUsers = useQuery(
        BusinessUsersModel,
        rawUsers => rawUsers.filtered('business_id == $0 && user_active != 2', business_id).sorted('level', false),
        [business_id]
    );

    const fetchData = useCallback(async () => {
        try {
            const res = await axios.post(`${remote_host}/yambi/API/get_admin_data`, {
                flag: 7,
                business_id,
            });

            if (res.data?.success === '1') {
                const payloadUsers = (res.data.data ?? []) as Record<string, unknown>[];

                realm.write(() => {
                    for (const raw of payloadUsers) {
                        if (!raw._id) continue;
                        realm.create('BusinessUsers', realmBusinessUserFromApi(raw), Realm.UpdateMode.Modified);
                    }
                });
            }
        } catch (error) {
            console.error('Fetch Admin Business Users error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [business_id, realm]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, [fetchData]);

    const renderItem = useCallback(({ item, index }: { item: TBusinessUser; index: number }) => {
        return (
            <BusinessUsersList
                item={item}
                index={index}
                show_level={true}
                selectContact={() => {}}
            />
        );
    }, []);

    if (loading && businessUsers.length === 0) {
        return (
            <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator color={theme.high_color} size="large" />
                <YambiText size="small" color="gray" text="Loading business users..." style={{ marginTop: 8 }} />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: theme.background }}>
            <FlashList
                data={businessUsers as never}
                renderItem={renderItem}
                estimatedItemSize={80}
                contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={theme.high_color}
                        colors={[theme.high_color]}
                    />
                }
                ListEmptyComponent={
                    <View style={{ padding: 40, alignItems: 'center' }}>
                        <YambiText size="normal" color="gray" text="No users found for this business." />
                    </View>
                }
            />
        </View>
    );
};

export default AdminBusinessUsers;
