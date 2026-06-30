import React, { useState, useCallback, useEffect, useRef } from "react";
import { View, TextInput, Pressable, InteractionManager } from "react-native";
import { useAppSelector, useAppDispatch } from "../../../store/app/hooks";
import MarketplaceItem from "../../../components/lists/marketplace/MarketplaceItem.tsx";
import { YambiText } from "../../../components/app/Text";
import { strings } from "../../../lang/lang";
import { MasonryFlashList } from "../../../components/lists/MasonryFlashList";
import { NavProps, TCartItem } from "../../../types/types";
import { IconApp } from "../../../components/app/IconApp";
import axios from "axios";
import { remote_host } from "../../../../GlobalVariables";
import { setShowModalApp } from "../../../store/reducers/appSlice";
import AppActivityIndicator from "../../../components/app/AppActivityIndicator";
import { SafeAreaView } from "react-native-safe-area-context";

const SearchMarketplace = ({ navigation, route }: NavProps) => {
    const app_theme = useAppSelector(state => state.app_theme);
    const dispatch = useAppDispatch();
    const [items, setItems] = useState<TCartItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const inputRef = useRef<TextInput>(null);

    const searchItems = useCallback(async (query: string) => {
        if (!query || query.trim() === "") {
            setItems([]);
            return;
        }

        setLoading(true);
        try {
            const res = await axios.post(remote_host + "/yambi/API/get_marketplace_data", {
                phone_number: "",
                searchQuery: query.trim()
            });

            if (res.data.success === "1") {
                const newItems: TCartItem[] = res.data.data || [];
                setItems(newItems);
            } else {
                dispatch(setShowModalApp(true));
            }
        } catch (e) {
            dispatch(setShowModalApp(true));
        } finally {
            setLoading(false);
        }
    }, [dispatch]);

    // Defer text input focus to run after the navigation animation transitions complete
    useEffect(() => {
        const task = InteractionManager.runAfterInteractions(() => {
            inputRef.current?.focus();
        });
        return () => task.cancel();
    }, []);

    // Debounce search - search after user stops typing for 500ms
    useEffect(() => {
        if (!searchQuery.trim()) {
            setItems([]);
            return;
        }

        const timeoutId = setTimeout(() => {
            searchItems(searchQuery);
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchQuery, searchItems]);

    const handleClearSearch = () => {
        setSearchQuery("");
        setItems([]);
    };

    const handleGoBack = () => {
        navigation.goBack();
    };

    const renderItem = useCallback(({ item, index }) => (
        <View style={{ flex: 1, marginRight: index % 2 === 0 ? 5 : 0 }}>
            <MarketplaceItem item={item} index={index} />
        </View>
    ), []);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: app_theme.colors.background }}>
            {/* Search Bar */}
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: app_theme.colors.border,
                marginHorizontal: 15,
                marginTop: 8,
                marginBottom: 10,
                borderRadius: 12,
                paddingHorizontal: 5,
                // paddingVertical: 8,
            }}>
                {/* Back Button */}
                <Pressable
                    onPress={handleGoBack}
                    style={{
                        height: 32,
                        width: 32,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 8
                    }}>
                    <IconApp pack="FI" name="arrow-left" color={app_theme.colors.text} size={18} />
                </Pressable>

                <View style={{ height: 32, width: 20, justifyContent: 'center', alignItems: 'center' }}>
                {loading ? <AppActivityIndicator /> : null}
                </View>

                {/* Text Input */}
                <TextInput
                    ref={inputRef}
                    placeholderTextColor={app_theme.colors.gray}
                    style={{
                        color: app_theme.colors.text,
                        paddingLeft: 10,
                        paddingRight: 12,
                        height: 40,
                        flex: 1,
                        fontSize: 15
                    }}
                    value={searchQuery}
                    placeholder={strings.search_marketplace}
                    onChangeText={setSearchQuery}
                />

                {/* X Button */}
                {searchQuery !== "" && (
                    <Pressable
                        onPress={handleClearSearch}
                        style={{
                            height: 32,
                            width: 32,
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginLeft: 8
                        }}>
                        <IconApp pack="FI" name="x" color={app_theme.colors.gray} size={18} />
                    </Pressable>
                )}
            </View>

            {/* Loading Indicator */}
            {/* {loading && (
                <View style={{ marginBottom: 20 }}>
                    <AppActivityIndicator showLabel />
                </View>
            )} */}

            {/* Results List */}
            {items.length > 0 ? (
                 <MasonryFlashList
                     data={items}
                     keyboardShouldPersistTaps="handled"
                     numColumns={2}
                    estimatedItemSize={400}
                    keyExtractor={(item, idx) => item.item._id + "_" + idx}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingBottom: 24, paddingHorizontal: 10 }}
                />
            ) : searchQuery.trim() !== "" ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <YambiText size="small" color="gray" text={strings.no_items_available} />
                </View>
            ) : null}
        </SafeAreaView>
    );
}

export default SearchMarketplace;
