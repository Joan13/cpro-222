import React, { useEffect, useState, useCallback, forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { View, FlatList, Dimensions, ScrollView } from "react-native";
import axios from "axios";
import { remote_host } from "../../../../GlobalVariables";
import MarketplaceItem from "../../../components/lists/marketplace/MarketplaceItem.tsx";
import { useAppSelector } from "../../../store/app/hooks";
import AppActivityIndicator from "../../../components/app/AppActivityIndicator";
import { YambiText, TextNormalYambiGray } from "../../../components/app/Text";
import { strings } from "../../../lang/lang";
import { TCartItem } from "../../../types/types";
import ModalApp from "../../../components/app/ModalApp";
import { useDispatch } from "react-redux";
import { setShowModalApp, setCategory } from "../../../store/reducers/appSlice";
import SubcategoryItem, { TSubcategory } from "../../../components/lists/marketplace/SubcategoryItem";
import EN from "../../../lang/locales/en.json";
import { MasonryFlashList } from "../../../components/lists/MasonryFlashList";

const ITEM_WIDTH = (Dimensions.get("window").width - 35) / 2;

export type CategoryItemsRef = {
    refresh: () => void;
};

const CategoryItems = forwardRef<CategoryItemsRef>((_props, ref) => {
    const app_theme = useAppSelector(state => state.app_theme);
    const [items, setItems] = useState<TCartItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [lastId, setLastId] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [showInternetError, setShowInternetError] = useState(false);
    const category = useAppSelector(state => state.app.category);
    const user_data = useAppSelector(state => state.user_data);
    const dispatch = useDispatch();

    // Use refs to prevent infinite loops - these don't trigger re-renders
    const fetchingRef = useRef(false);
    const categoryRef = useRef<string>("");

    const fetchItems = useCallback(async (loadMore = false) => {
        // Prevent concurrent fetches using ref
        if (fetchingRef.current) return;
        if (!hasMore && loadMore) return;
        if (!category) return; // Don't fetch if no category is selected

        fetchingRef.current = true;
        if (loadMore) setLoadingMore(true);
        else setLoading(true);

        try {
            const res = await axios.post(remote_host + "/yambi/API/get_marketplace_data", {
                phone_number: user_data?.phone_number || "",
                category: category,
                last_id: loadMore ? lastId : null
            });

            if (res.data.success === "1") {
                const newItems: TCartItem[] = res.data.data || [];
                if (loadMore) {
                    setItems(prev => [...prev, ...newItems]);
                } else {
                    setItems(newItems);
                    setLastId(null); // Reset lastId when starting fresh
                }
                if (newItems.length > 0 && newItems[newItems.length - 1]?.item?._id) {
                    setLastId(newItems[newItems.length - 1].item._id);
                }
                setHasMore(newItems.length === 100);
                setShowInternetError(false); // Clear error on success
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
            fetchingRef.current = false;
        }
    }, [category, lastId, hasMore, user_data, dispatch]);

    useImperativeHandle(ref, () => ({
        refresh: () => fetchItems(false)
    }), [fetchItems]);

    // Get subcategories for the current category from items_categories in locale files
    const subcategories: TSubcategory[] = useMemo(() => {
        if (!category) return [];

        // Get items_categories from locale files
        const enRoot: any = (EN as any)?.items_categories || {};
        const locRoot: any = (strings as any)?.items_categories || {};

        // Check if category is a base category (exists in items_categories)
        const categoryData = locRoot[category] || enRoot[category];
        if (!categoryData || !categoryData.subcategories) {
            // If category is not a base category, it might be a subcategory
            // Find the parent category that contains this subcategory
            for (const [catKey, catData] of Object.entries(enRoot)) {
                const cat = catData as any;
                if (cat.subcategories && cat.subcategories[category]) {
                    // Found parent category, use its subcategories
                    const parentData = locRoot[catKey] || enRoot[catKey];
                    if (parentData && parentData.subcategories) {
                        const subs = parentData.subcategories;
                        return Object.entries(subs).map(([id, name]) => ({
                            id,
                            name: name as string
                        }));
                    }
                }
            }
            return [];
        }

        // Category is a base category, return its subcategories
        const subs = categoryData.subcategories;
        return Object.entries(subs).map(([id, name]) => ({
            id,
            name: name as string
        }));
    }, [category, strings.getLanguage()]);

    // Fetch items when component mounts and when category changes
    useEffect(() => {
        // Only fetch if category changed (not on every render)
        if (category && category !== categoryRef.current) {
            categoryRef.current = category;
            setItems([]);
            setLastId(null);
            setHasMore(true);
            fetchingRef.current = false; // Reset fetch lock when category changes
            // Call fetchItems directly without including it in dependencies
            fetchItems(false);
        } else if (category && !categoryRef.current) {
            // Initial mount with category
            categoryRef.current = category;
            setItems([]);
            setLastId(null);
            setHasMore(true);
            fetchingRef.current = false;
            fetchItems(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [category]); // Only depend on category to prevent infinite loops

    // Handle subcategory click
    const handleSubcategoryPress = useCallback((subcategoryId: string) => {
        // Update category state with subcategory to filter items
        dispatch(setCategory(subcategoryId));
    }, [dispatch]);

    const renderItem = ({ item, index }) => (
        <View style={{ flex:1, marginRight: index % 2 === 0 ? 5 : 0 }}>
            <MarketplaceItem
                item={item}
                index={index}
            />
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: app_theme.colors.background, borderTopWidth: 0, borderColor: app_theme.colors.border }}>
            {showInternetError ? (
                <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowInternetError(false); }} singleButton title={strings.error}>
                    <TextNormalYambiGray text={strings.connection_failed} />
                </ModalApp>
            ) : null}

            {/* Subcategories section */}
            {category && subcategories.length > 0 && (
                <View style={{
                    borderBottomWidth: 1,
                    borderColor: app_theme.colors.border,
                    marginTop: 8,
                    // elevation: 2,
                }}>
                    
                    {/* <YambiText 
                        size="small" 
                        color="high" 
                        bold 
                        text={strings.subcategory || strings.sub_category || "Subcategories"} 
                        style={{ marginBottom: 8, marginLeft: 4 }}
                    /> */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 4 }}
                    >
                        {subcategories.map((sub, index) => (
                            <SubcategoryItem
                                key={sub.id}
                                item={sub}
                                index={index}
                                onPress={() => handleSubcategoryPress(sub.id)}
                            />
                        ))}
                    </ScrollView>
                    
                </View>
            )}

            {/* <View style={{
                flexDirection: 'row',
                justifyContent: "space-between",
                height: 35,
                alignItems: 'center',
                backgroundColor: app_theme.colors.high_color + "20",
                paddingHorizontal: 15,
                marginTop: 10,
                borderRadius: 8,
                marginHorizontal: 12
            }}>
                <YambiText size="small" color="high" bold text={strings.just_for_you} />
            </View> */}

            {items.length > 0 ? (
                 <MasonryFlashList
                     data={items}
                     ListHeaderComponent={<View style={{height:8}} />}
                     numColumns={2}
                     estimatedItemSize={400}
                    keyExtractor={(item, idx) => item.item._id + "_" + idx}
                    renderItem={renderItem}
                    onEndReached={() => fetchItems(true)}
                    onEndReachedThreshold={0.5}
                    contentContainerStyle={{ paddingBottom: 24, paddingHorizontal: 10 }}
                />
            ) :
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <YambiText size="small" color="gray" text={strings.no_items_available} />
                </View>}

            {loading || loadingMore ? <View style={{ marginBottom: 20, borderTopWidth: 1, borderColor: app_theme.colors.border, paddingTop: 20 }}>
                <AppActivityIndicator showLabel />
            </View> : null}
        </View>
    );
});

export default CategoryItems;
