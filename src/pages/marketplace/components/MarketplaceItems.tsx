import React, { useEffect, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import { View, FlatList, ActivityIndicator, Dimensions } from "react-native";
import axios from "axios";
import { remote_host } from "../../../../GlobalVariables";
import MarketplaceItem from "../../../components/lists/marketplace/MarketplaceItem.tsx";
import { useAppSelector } from "../../../store/app/hooks";
import AppActivityIndicator from "../../../components/app/AppActivityIndicator";
import { YambiText, TextNormalYambiGray } from "../../../components/app/Text";
import { strings } from "../../../lang/lang";
import * as RootNavigation from "./../../../services/Navigation_ref";
import { TCartItem } from "../../../types/types";
import ModalApp from "../../../components/app/ModalApp";
import { useDispatch } from "react-redux";
import { setShowModalApp } from "../../../store/reducers/appSlice";
import { MasonryFlashList } from "../../../components/lists/MasonryFlashList";

const ITEM_WIDTH = (Dimensions.get("window").width) / 2;

export type MarketplaceItemsRef = {
    refresh: () => void;
};

const MarketplaceItems = forwardRef<MarketplaceItemsRef>((props, ref) => {
    const app_theme = useAppSelector(state => state.app_theme);
    const [items, setItems] = useState<TCartItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [lastId, setLastId] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [showInternetError, setShowInternetError] = useState(false);
    const dispatch = useDispatch();

    const fetchItems = useCallback(async (loadMore = false) => {
        if (loading || loadingMore) return;
        if (!hasMore && loadMore) return;

        if (loadMore) setLoadingMore(true);
        else setLoading(true);

        try {
            const res = await axios.post(remote_host + "/yambi/API/get_marketplace_data", {
                phone_number: "",
                last_id: loadMore ? lastId : null
            });

            if (res.data.success === "1") {
                const newItems: TCartItem[] = res.data.data || [];
                if (loadMore) {
                    setItems(prev => [...prev, ...newItems]);
                } else {
                    setItems(newItems);
                }
                if (newItems.length > 0 && newItems[newItems.length - 1]?.item?._id) {
                    setLastId(newItems[newItems.length - 1].item._id);
                }
                setHasMore(newItems.length === 100);
            } else {
                dispatch(setShowModalApp(true));
                setShowInternetError(true);
            }
        } catch (e) {
            dispatch(setShowModalApp(true));
            setShowInternetError(true);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [lastId, loading, loadingMore, hasMore]);

    useImperativeHandle(ref, () => ({
        refresh: () => fetchItems(false)
    }), [fetchItems]);

    useEffect(() => {
        fetchItems(false);
    }, []);

    const renderItem = ({ item, index }) => (
        <View style={{
            flex: 1,
            // width: ITEM_WIDTH, 
            marginRight: index % 2 === 0 ? 5 : 0
        }}>
            <MarketplaceItem
                item={item}
                index={index}
            />
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: app_theme.colors.background }}>
            {showInternetError ? (
                <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowInternetError(false); }} singleButton title={strings.error}>
                    <TextNormalYambiGray text={strings.connection_failed} />
                </ModalApp>
            ) : null}

            <View style={{
                flexDirection: 'row',
                justifyContent: "space-between",
                height: 35,
                alignItems: 'center',
                backgroundColor: app_theme.colors.high_color + "20",
                paddingHorizontal: 15,
                marginTop: 10,
                borderRadius: 8,
                marginHorizontal: 12,
                marginBottom: 10
            }}>
                <YambiText size="small" color="high" bold text={strings.just_for_you} />
            </View>

            {items.length > 0 ? (
                <MasonryFlashList
                    data={items}
                    numColumns={2}
                    estimatedItemSize={400}
                    keyExtractor={(item, idx) => item.item._id + "_" + idx}
                    renderItem={renderItem}
                    onEndReached={() => fetchItems(true)}
                    onEndReachedThreshold={0.5}
                    contentContainerStyle={{ paddingBottom: 50, paddingHorizontal: 10 }}
                />) :
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <YambiText size="small" color="gray" text={strings.no_items_available} />
                </View>}

            {loading || loadingMore ? <View style={{ marginBottom: 20, borderTopWidth: 1, borderColor: app_theme.colors.border, paddingTop: 20 }}>
                <AppActivityIndicator showLabel />
            </View> : null}
        </View>
    );
});

export default MarketplaceItems;
