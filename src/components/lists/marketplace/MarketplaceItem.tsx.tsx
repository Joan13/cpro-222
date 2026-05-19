import { TouchableOpacity, View, Pressable } from "react-native";
import { TCartItem } from "../../../types/types";
import { useAppDispatch, useAppSelector } from "../../../store/app/hooks";
import { memo } from "react";
import { IconApp } from "../../app/IconApp";
import FastImage from "react-native-fast-image";
import { remote_host_server, renderCurrency, media_url } from "../../../../GlobalVariables";
import { strings } from "../../../lang/lang";
import { YambiText } from "../../app/Text";
import { setAddRemoveCartItem } from "../../../store/reducers/persistedAppSlice";
import * as RootNavigation from './../../../services/Navigation_ref';

const MarketplaceItem = ({ item, index }: { item: TCartItem, index: number }) => {
    const app_theme = useAppSelector(state => state.app_theme);
    const cart = useAppSelector(state => state.persisted_app.cart);
    const dispatch = useAppDispatch();

    const show_category = (category: string) => {
        if (!category) return null;
        const idx = (strings as any).items_categories?.[category];
        if (!idx) return null;
        return <YambiText color="high" size="small" text={idx.name} />
    };

    const show_subcategory = (category: string, subcategory: string) => {
        if (!category || !subcategory) return null;
        const idx = (strings as any).items_categories?.[category];
        if (!idx || idx.subcategories?.[subcategory] === undefined) return null;
        return <YambiText color="high" size="small" text={idx.subcategories[subcategory]} />
    };

    const AddRemoveCartItem = () => {
        dispatch(setAddRemoveCartItem(item));
    };

    const exists_in_cart = () => !!cart.find(c => c.item._id === item.item._id);

    const price_after_discount = () => {
        const base = parseFloat(item.prices.retail_selling_price || "0");
        const pct = item.item.discount_percentage || 0;
        const discounted = pct > 0 ? base - (base * pct) / 100 : base;
        return discounted.toFixed(2);
    };

    const GoItem = () => {
        RootNavigation.navigate("BusinessItem", item);
    };

    const renderColors = () => {
        try {
            if (!item.item.colors || item.item.colors === "[]") return null;
            const cols: string[] = JSON.parse(item.item.colors);
            if (!Array.isArray(cols) || cols.length === 0) return null;
            return (
                <View style={{ flexDirection: 'row', marginTop: 6 }}>
                    {cols.slice(0, 4).map((c, i) => (
                        <View key={i} style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: c, marginRight: 6, borderWidth: 1, borderColor: app_theme.colors.border }} />
                    ))}
                    {cols.length > 4 && <YambiText size="xsmall" color="gray" text={`+${cols.length - 4}`} />}
                </View>
            );
        } catch { return null; }
    };

    const renderSizes = () => {
        try {
            if (!item.item.sizes || item.item.sizes === "[]") return null;
            const sizes: string[] = JSON.parse(item.item.sizes);
            if (!Array.isArray(sizes) || sizes.length === 0) return null;
            return (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 }}>
                    {sizes.slice(0, 3).map((s, i) => (
                        <View key={i} style={{ paddingHorizontal: 6, height: 18, borderRadius: 6, borderWidth: 1, borderColor: app_theme.colors.border, marginRight: 6, alignItems: 'center', justifyContent: 'center' }}>
                            <YambiText size="xsmall" color="gray" text={s} />
                        </View>
                    ))}
                    {sizes.length > 3 && <YambiText size="xsmall" color="gray" text={`+${sizes.length - 3}`} />}
                </View>
            );
        } catch { return null; }
    };

    const hasDiscount = (item.item.discount_percentage || 0) > 0;

    return (
        <Pressable onPress={GoItem} style={{
            marginBottom: 5,
            padding: 7,
            backgroundColor: app_theme.colors.background,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: app_theme.colors.border,
        }}>
            {/* Image + discount badge  */}
            <View>
                {(() => {
                    try {
                        if (item.item.images && item.item.images !== "" && item.item.images !== "[]") {
                            const imgs = JSON.parse(item.item.images);
                            if (Array.isArray(imgs) && imgs.length > 0) {
                                return (
                                    <FastImage
                                        style={{ width: '100%', aspectRatio: 1, borderRadius: 5 }}
                                        source={{
                                            priority: FastImage.priority.high,
                                            cache: 'immutable',
                                            uri: media_url + "/items_images/" + imgs[0]
                                        }}
                                    />
                                );
                            }
                        }
                    } catch { }
                    return (
                        <View style={{ width: '100%', aspectRatio: 1, borderRadius: 8, backgroundColor: app_theme.colors.border, alignItems: 'center', justifyContent: 'center' }}>
                            <YambiText color="gray" text={strings.no_image} />
                        </View>
                    );
                })()}

                {hasDiscount && (
                    <View style={{ position: 'absolute', top: 8, left: 8, backgroundColor: app_theme.colors.error, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }}>
                        <YambiText size="xsmall" color="white" bold text={`-${item.item.discount_percentage}%`} />
                    </View>
                )}
            </View>

            {/* Title */}
            <YambiText bold text={item.item.item_name} style={{ marginTop: 8 }} />

            {/* Category chips */}
            <View style={{ flexDirection: 'column', marginTop: 4 }}>
                {show_category(item.item.category)}
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <IconApp pack="FI" name="chevron-right" color={app_theme.colors.text} size={12} />
                    {show_subcategory(item.item.category, item.item.subcategory)}
                </View>
            </View>

            {/* Price */}
            <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 6 }}>
                <YambiText size="small" text={renderCurrency(item.prices.currency, false)} />
                <View style={{ width: 4 }} />
                <YambiText bold text={price_after_discount()} />
                {hasDiscount && (
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', marginLeft: 8 }}>
                        <YambiText lineThrough size="small" color="gray" text={`${renderCurrency(item.prices.currency, false)}${item.prices.retail_selling_price}`} />
                    </View>
                )}
            </View>

            {/* Attributes preview */}
            {renderColors()}
            {renderSizes()}

            {/* Cart button */}
            <TouchableOpacity
                onPress={AddRemoveCartItem}
                style={{
                    marginTop: 10,
                    backgroundColor: app_theme.colors.badge_background_color,
                    borderRadius: 5,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 5,
                    height: 35
                }}>
                <IconApp pack="FI" name="shopping-cart" color={app_theme.colors.badge_color} size={17} />
                <YambiText style={{ marginLeft: 8 }} color="badge" size="small" text={exists_in_cart() ? strings.remove_from_cart : strings.add_to_cart} />
            </TouchableOpacity>
        </Pressable>
    )
};

export default memo(MarketplaceItem);