import React, { useState, useEffect, useCallback } from 'react';
import { View, ActivityIndicator, RefreshControl } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import axios from 'axios';
import { useRealm, useQuery } from '@realm/react';
import { FlashList } from '@shopify/flash-list';
import { useAppSelector } from '../../../../store/app/hooks';
import { UserBusinessArticles, ItemPrices } from '../../../../store/database/Models';
import { TItem, TItemPrices } from '../../../../types/types';
import { remote_host } from '../../../../../GlobalVariables';
import { YambiText } from '../../../../components/app/Text';
import InventoryList from './lists/InventoryList';

type RootStackParamList = {
    AdminInventory: { business_id: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'AdminInventory'>;

const pi = (v: unknown, d = 0) => parseInt(String(v ?? d), 10);

function realmItemFromApi(raw: Record<string, unknown>): TItem {
    return {
        _id: String(raw._id),
        business_id: String(raw.business_id ?? ""),
        phone_number: String(raw.phone_number ?? ""),
        item_name: String(raw.item_name ?? ""),
        slogan: String(raw.slogan ?? ""),
        item_type: pi(raw.item_type, 0),
        category: String(raw.category ?? ""),
        subcategory: String(raw.subcategory ?? ""),
        manufacture_date: String(raw.manufacture_date ?? ""),
        expiry_date: String(raw.expiry_date ?? ""),
        wholesale_content_number: pi(raw.wholesale_content_number, 0),
        items_number_stock: pi(raw.items_number_stock, 0),
        items_number_warehouse: pi(raw.items_number_warehouse, 0),
        description_item: String(raw.description_item ?? ""),
        keywords: String(raw.keywords ?? ""),
        images: String(raw.images ?? ""),
        background: String(raw.background ?? ""),
        item_active: pi(raw.item_active, 1),
        supplier: String(raw.supplier ?? ""),
        other_information: String(raw.other_information ?? ""),
        alert_low_stock: pi(raw.alert_low_stock, 0),
        uploaded: pi(raw.uploaded, 1),
        createdAt: String(raw.createdAt ?? ""),
        updatedAt: String(raw.updatedAt ?? ""),
        colors: String(raw.colors ?? ""),
        discount_percentage: pi(raw.discount_percentage, 0),
        discount_start_date: String(raw.discount_start_date ?? ""),
        discount_end_date: String(raw.discount_end_date ?? ""),
        marketplace_visibility: pi(raw.marketplace_visibility, 0),
        weights: String(raw.weights ?? ""),
        sizes: String(raw.sizes ?? ""),
        flag: pi(raw.flag, 0),
        is_best_seller: pi(raw.is_best_seller, 0),
        visibility_rank: pi(raw.visibility_rank, 0),
        is_featured: pi(raw.is_featured, 0),
    };
}

function realmPriceFromApi(raw: Record<string, unknown>): TItemPrices {
    return {
        _id: String(raw._id),
        item_id: String(raw.item_id ?? ""),
        phone_number: String(raw.phone_number ?? ""),
        wholesale_cost_price: String(raw.wholesale_cost_price ?? ""),
        wholesale_selling_price: String(raw.wholesale_selling_price ?? ""),
        retail_selling_price: String(raw.retail_selling_price ?? ""),
        uploaded: pi(raw.uploaded, 1),
        currency: pi(raw.currency, 0),
    };
}

const AdminInventory = ({ route }: Props) => {
    const { business_id } = route.params;
    const theme = useAppSelector(state => state.app_theme.colors);
    const realm = useRealm();
    
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Query active items locally sorted by name
    const items = useQuery(
        UserBusinessArticles,
        rawItems => rawItems.filtered('business_id == $0 && item_active == 1', business_id).sorted('item_name', false),
        [business_id]
    );

    const fetchData = useCallback(async () => {
        try {
            const res = await axios.post(`${remote_host}/yambi/API/get_admin_data`, {
                flag: 6,
                business_id,
            });

            if (res.data?.success === '1') {
                const payloadItems = (res.data.items ?? []) as Record<string, unknown>[];
                const payloadPrices = (res.data.item_prices ?? []) as Record<string, unknown>[];

                realm.write(() => {
                    for (const raw of payloadItems) {
                        if (!raw._id) continue;
                        realm.create('UserBusinessArticles', realmItemFromApi(raw), Realm.UpdateMode.Modified);
                    }
                    for (const pr of payloadPrices) {
                        if (!pr._id) continue;
                        realm.create('ItemPrices', realmPriceFromApi(pr), Realm.UpdateMode.Modified);
                    }
                });
            }
        } catch (error) {
            console.error('Fetch Admin Inventory error:', error);
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

    const renderItem = useCallback(({ item, index }: { item: TItem; index: number }) => {
        return (
            <InventoryList
                item={item}
                index={index}
                business_id={business_id}
            />
        );
    }, [business_id]);

    if (loading && items.length === 0) {
        return (
            <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator color={theme.high_color} size="large" />
                <YambiText size="small" color="gray" text="Loading business catalog..." style={{ marginTop: 8 }} />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: theme.background }}>
            <FlashList
                data={items as never}
                renderItem={renderItem}
                estimatedItemSize={100}
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
                        <YambiText size="normal" color="gray" text="No items found in this inventory." />
                    </View>
                }
            />
        </View>
    );
};

export default AdminInventory;
