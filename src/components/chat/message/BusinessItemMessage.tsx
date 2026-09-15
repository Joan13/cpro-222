import React, { useEffect, useState } from 'react';
import { View, Pressable, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import { TMessage, TCartItem, TItem, TBusiness, TSellsPoint } from '../../../types/types';
import { useAppSelector } from '../../../store/app/hooks';
import { Image as ExpoImage } from 'expo-image';
import axios from 'axios';
import { YambiText } from '../../app/Text';
import { media_url, remote_host, renderCurrency, copyToClipboard } from '../../../../GlobalVariables';
import * as RootNavigation from '../../../services/Navigation_ref';
import { strings } from '../../../lang/lang';
import { IconApp } from '../../app/IconApp';

// Global cache for checked business items to avoid redundant HTTP requests
const itemCacheMap = new Map<string, TCartItem | null>();

const BusinessItemMessage = ({ message }: { message: TMessage }) => {
    const app_theme = useAppSelector(state => state.app_theme);
    const itemId = message.response_to;

    const cachedCart = itemId ? itemCacheMap.get(itemId) : undefined;
    const [loading, setLoading] = useState<boolean>(!cachedCart && !!itemId);
    const [cartItem, setCartItem] = useState<TCartItem | null>(cachedCart || null);

    const fetchItemDetails = async () => {
        if (!itemId) {
            setLoading(false);
            return;
        }

        if (itemCacheMap.has(itemId)) {
            const cached = itemCacheMap.get(itemId);
            setCartItem(cached || null);
            setLoading(false);
            return;
        }

        try {
            const res = await axios.post(remote_host + '/yambi/API/get_item', {
                item_id: itemId,
            });

            if (
                res.data?.success === '1' &&
                res.data.data?.item &&
                res.data.data?.business &&
                res.data.data?.prices
            ) {
                const d = res.data.data;
                const sales = Array.isArray(d.sales_points) ? d.sales_points : [];
                const fetchedCartItem: TCartItem = {
                    item: d.item as TItem,
                    business: d.business as TBusiness,
                    prices: d.prices,
                    sales_points: sales as TSellsPoint[],
                };
                setCartItem(fetchedCartItem);
                itemCacheMap.set(itemId, fetchedCartItem);
            } else {
                itemCacheMap.set(itemId, null);
            }
        } catch {
            itemCacheMap.set(itemId, null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItemDetails();
    }, [itemId]);

    const isUnavailable = !loading && (
        !cartItem ||
        !cartItem.item ||
        Number(cartItem.item.item_active) !== 1 ||
        Number(cartItem.item.marketplace_visibility) !== 1
    );

    const handlePressItem = () => {
        if (isUnavailable) return;
        Haptics.selectionAsync();
        if (cartItem) {
            RootNavigation.navigate('BusinessItem', cartItem);
        } else if (itemId) {
            RootNavigation.navigate('BusinessItem', { item_id: itemId });
        }
    };

    const handleLongPress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (message.main_text_message) {
            copyToClipboard(message.main_text_message);
        }
    };

    const imageUrl = React.useMemo(() => {
        if (!cartItem?.item?.images) return null;
        try {
            const parsed = JSON.parse(cartItem.item.images);
            const firstImg = Array.isArray(parsed) ? parsed[0] : parsed;
            if (firstImg && typeof firstImg === 'string') {
                return `${media_url}/items_images/${firstImg}`;
            }
        } catch {
            if (typeof cartItem.item.images === 'string' && cartItem.item.images.trim()) {
                return `${media_url}/items_images/${cartItem.item.images.trim()}`;
            }
        }
        return null;
    }, [cartItem?.item?.images]);

    const hasDiscount = (cartItem?.item?.discount_percentage || 0) > 0;
    const discountedPrice = React.useMemo(() => {
        if (!cartItem?.prices?.retail_selling_price) return null;
        const base = parseFloat(cartItem.prices.retail_selling_price || '0');
        const pct = cartItem.item.discount_percentage || 0;
        const discounted = pct > 0 ? base - (base * pct) / 100 : base;
        return discounted.toFixed(2);
    }, [cartItem?.prices?.retail_selling_price, cartItem?.item?.discount_percentage]);

    return (
        <View style={{ width: '100%', marginVertical: 4 }}>
            <Pressable
                onPress={isUnavailable ? undefined : handlePressItem}
                onLongPress={handleLongPress}
                disabled={isUnavailable}
                style={{
                    backgroundColor: app_theme.colors.card,
                    borderRadius: 10,
                    overflow: 'hidden',
                    borderWidth: 1,
                    borderColor: app_theme.colors.border,
                    opacity: isUnavailable ? 0.75 : 1,
                }}>
                {/* Header Item Card */}
                <View style={{ padding: 10, flexDirection: 'row', alignItems: 'center' }}>
                    {loading ? (
                        <View style={{ padding: 10, alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                            <ActivityIndicator size="small" color={app_theme.colors.high_color} />
                        </View>
                    ) : isUnavailable ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingVertical: 4 }}>
                            <View style={{
                                width: 44,
                                height: 44,
                                borderRadius: 8,
                                backgroundColor: app_theme.colors.border + '60',
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginRight: 10
                            }}>
                                <IconApp pack="FI" name="slash" size={20} color={app_theme.colors.gray} />
                            </View>
                            <View style={{ flex: 1 }}>
                                {cartItem?.item?.item_name ? (
                                    <YambiText
                                        text={cartItem.item.item_name}
                                        size="small"
                                        color="gray"
                                        bold
                                        numberLines={1}
                                    />
                                ) : null}
                                <YambiText
                                    text={strings.item_unavailable || "Article indisponible"}
                                    size="small"
                                    color="gray"
                                    style={{
                                        fontStyle: 'italic',
                                        marginTop: cartItem?.item?.item_name ? 2 : 0,
                                    }}
                                />
                            </View>
                        </View>
                    ) : cartItem?.item ? (
                        <>
                            {imageUrl ? (
                                <ExpoImage
                                    source={imageUrl}
                                    style={{ width: 52, height: 52, borderRadius: 8, backgroundColor: app_theme.colors.border }}
                                    contentFit="cover"
                                />
                            ) : (
                                <View style={{
                                    width: 52,
                                    height: 52,
                                    borderRadius: 8,
                                    backgroundColor: app_theme.colors.border + '60',
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }}>
                                    <IconApp pack="FI" name="package" size={24} color={app_theme.colors.gray} />
                                </View>
                            )}

                            <View style={{ flex: 1, marginLeft: 10 }}>
                                <YambiText
                                    text={cartItem.item.item_name}
                                    size="small"
                                    color="default"
                                    bold
                                    numberLines={1}
                                />
                                {cartItem.prices ? (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                                        <YambiText
                                            text={`${renderCurrency(cartItem.prices.currency, false)}${discountedPrice || cartItem.prices.retail_selling_price}`}
                                            size="small"
                                            color="high"
                                            bold
                                        />
                                        {hasDiscount && (
                                            <YambiText
                                                lineThrough
                                                size="xsmall"
                                                color="gray"
                                                style={{ marginLeft: 6 }}
                                                text={`${renderCurrency(cartItem.prices.currency, false)}${cartItem.prices.retail_selling_price}`}
                                            />
                                        )}
                                    </View>
                                ) : null}
                                {cartItem.business?.business_name ? (
                                    <YambiText
                                        text={cartItem.business.business_name}
                                        size="xsmall"
                                        color="gray"
                                        numberLines={1}
                                        style={{ marginTop: 2 }}
                                    />
                                ) : null}
                            </View>

                            <IconApp pack="FI" name="chevron-right" size={16} color={app_theme.colors.gray} styles={{ marginLeft: 4 }} />
                        </>
                    ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4 }}>
                            <IconApp pack="FI" name="package" size={20} color={app_theme.colors.gray} styles={{ marginRight: 8 }} />
                            <YambiText
                                text={strings.item || 'Item'}
                                size="small"
                                color="gray"
                            />
                        </View>
                    )}
                </View>

                {/* Bottom Main Text Message */}
                {message.main_text_message ? (
                    <View style={{
                        paddingHorizontal: 10,
                        paddingVertical: 8,
                        borderTopWidth: 1,
                        borderTopColor: app_theme.colors.border,
                        backgroundColor: app_theme.colors.background + '30',
                    }}>
                        <YambiText
                            text={message.main_text_message.trim()}
                            color="default"
                            size="normal"
                        />
                    </View>
                ) : null}
            </Pressable>
        </View>
    );
};

export default BusinessItemMessage;
