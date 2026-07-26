import React, { useState, useEffect, useCallback } from 'react';
import { View, ActivityIndicator, RefreshControl } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import axios from 'axios';
import { useRealm, useQuery } from '@realm/react';
import { FlashList } from '@shopify/flash-list';
import { useAppSelector } from '../../../../store/app/hooks';
import { BusinessItemsSale, UserBusinessArticles, ItemPrices } from '../../../../store/database/Models';
import { TItem, TItemPrices, TSale } from '../../../../types/types';
import { remote_host } from '../../../../../GlobalVariables';
import { YambiText } from '../../../../components/app/Text';
import SalesListItem from './lists/SalesListItem';

type RootStackParamList = {
    AdminSales: { business_id: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'AdminSales'>;

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

function realmSaleFromApi(raw: Record<string, unknown>): TSale {
    return {
        _id: String(raw._id),
        item_id: String(raw.item_id ?? ""),
        business_id: String(raw.business_id ?? ""),
        sales_point_id: String(raw.sales_point_id ?? ""),
        sale_operator: String(raw.sale_operator ?? ""),
        number: pi(raw.number, 1),
        description: String(raw.description ?? ""),
        cost_price: String(raw.cost_price ?? ""),
        selling_price: String(raw.selling_price ?? ""),
        delivery_price: String(raw.delivery_price ?? ""),
        delivery_address: String(raw.delivery_address ?? ""),
        delivery_time: String(raw.delivery_time ?? ""),
        delivery_status: pi(raw.delivery_status, 0),
        discount_price: String(raw.discount_price ?? ""),
        type_sale: pi(raw.type_sale, 0),
        buyer_name: String(raw.buyer_name ?? ""),
        buyer_phone: String(raw.buyer_phone ?? ""),
        uploaded: pi(raw.uploaded, 1),
        currency: pi(raw.currency, 0),
        country: String(raw.country ?? ""),
        agent_paid: String(raw.agent_paid ?? ""),
        sale_active: pi(raw.sale_active, 1),
        createdAt: String(raw.createdAt ?? ""),
        updatedAt: String(raw.updatedAt ?? ""),
    };
}

const AdminSales = ({ route }: Props) => {
    const { business_id } = route.params;
    const theme = useAppSelector(state => state.app_theme.colors);
    const realm = useRealm();
    
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Query active sales locally
    const sales = useQuery(
        BusinessItemsSale,
        rawSales => rawSales.filtered('business_id == $0', business_id).sorted('createdAt', true),
        [business_id]
    );

    const fetchData = useCallback(async () => {
        try {
            const res = await axios.post(`${remote_host}/yambi/API/get_admin_data`, {
                flag: 8,
                business_id,
            });

            if (res.data?.success === '1') {
                const payloadSales = (res.data.sales ?? []) as Record<string, unknown>[];
                const payloadItems = (res.data.items ?? []) as Record<string, unknown>[];
                const payloadPrices = (res.data.item_prices ?? []) as Record<string, unknown>[];

                realm.write(() => {
                    // Items and prices first so SalesList can resolve item details locally
                    for (const raw of payloadItems) {
                        if (!raw._id) continue;
                        realm.create('UserBusinessArticles', realmItemFromApi(raw), Realm.UpdateMode.Modified);
                    }
                    for (const pr of payloadPrices) {
                        if (!pr._id) continue;
                        realm.create('ItemPrices', realmPriceFromApi(pr), Realm.UpdateMode.Modified);
                    }
                    // Then the sales
                    for (const sale of payloadSales) {
                        if (!sale._id) continue;
                        realm.create('BusinessItemsSale', realmSaleFromApi(sale), Realm.UpdateMode.Modified);
                    }
                });
            }
        } catch (error) {
            console.error('Fetch Admin Sales error:', error);
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

    const renderItem = useCallback(({ item, index }: { item: TSale; index: number }) => {
        return (
            <SalesListItem
                item={item}
                index={index}
            />
        );
    }, []);

    if (loading && sales.length === 0) {
        return (
            <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator color={theme.high_color} size="large" />
                <YambiText size="small" color="gray" text="Loading business sales..." style={{ marginTop: 8 }} />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: theme.background }}>
            <FlashList
                data={sales as never}
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
                        <YambiText size="normal" color="gray" text="No sales found for this business." />
                    </View>
                }
            />
        </View>
    );
};

export default AdminSales;
