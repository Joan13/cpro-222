import { ScrollView, View, Linking, Platform, BackHandler, Pressable } from "react-native";
import { NavProps, RootStackParamList, TSellsPoint, TItem, TCartItem, TBusiness } from "../../types/types";
import { useAppSelector, useAppDispatch } from "../../store/app/hooks";
import { useEffect, useState, useMemo, useCallback, useLayoutEffect, useRef } from "react";
import { YambiText } from "../../components/app/Text";
import { IconApp } from "../../components/app/IconApp";
import { Image as ExpoImage } from 'expo-image';
import { remote_host, renderCurrency, media_url } from "../../../GlobalVariables";
import { strings } from "../../lang/lang";
import axios from "axios";
import { setAddRemoveCartItem } from "../../store/reducers/persistedAppSlice";
import RNRestart from "react-native-restart";
import * as DropdownMenu from 'zeego/dropdown-menu';

/** Deep-link item load: server-only via GetItem.mjs (business + enriched sales point addresses). */
async function fetchCartItemFromServerForDeepLink(itemId: string, phoneNumber: string): Promise<TCartItem | null> {
    try {
        const res = await axios.post(remote_host + "/yambi/API/get_item", {
            item_id: itemId,
            // phone_number: phoneNumber || "",
        });
        if (
            res.data?.success === "1" &&
            res.data.data?.item &&
            res.data.data?.business &&
            res.data.data?.prices
        ) {
            const d = res.data.data;
            const sales = Array.isArray(d.sales_points) ? d.sales_points : [];
            return {
                item: d.item as TItem,
                business: d.business as TBusiness,
                prices: d.prices,
                sales_points: sales as TSellsPoint[],
            };
        }
    } catch {
        return null;
    }
    return null;
}

function cartParamsFromRoute(params: RootStackParamList['BusinessItem']): {
    inline: TCartItem | null;
    linkItemId: string | undefined;
    fromBusinessInventory: boolean;
} {
    const p = params as { from_business_inventory?: boolean };
    const fromBusinessInventory = p.from_business_inventory === true;
    const row = params as TCartItem;
    if (row.item && row.prices && row.business) {
        const sales_points = Array.isArray(row.sales_points) ? row.sales_points : [];
        return {
            inline: { item: row.item, business: row.business, prices: row.prices, sales_points },
            linkItemId: undefined,
            fromBusinessInventory,
        };
    }
    const onlyId = params as { item_id: string };
    if (typeof onlyId.item_id === "string" && onlyId.item_id.trim() !== "") {
        return { inline: null, linkItemId: onlyId.item_id, fromBusinessInventory };
    }
    return { inline: null, linkItemId: undefined, fromBusinessInventory };
}

type BusinessItemInnerProps = {
    navigation: NavProps["navigation"];
    cartItem: TCartItem;
    fromBusinessInventory: boolean;
};

const BusinessItemInner = ({ navigation, cartItem, fromBusinessInventory }: BusinessItemInnerProps) => {

    const business = cartItem.business;
    const sales_points: TSellsPoint[] = cartItem.sales_points;
    const item: TItem = cartItem.item;
    const prices = cartItem.prices;

    const theme = useAppSelector(state => state.app_theme.colors);
    const user_data = useAppSelector(state => state.user_data);
    const cart = useAppSelector(state => state.persisted_app.cart);
    const tab_visible_marketplace = useAppSelector(state => state.persisted_app.app_description.tab_visible_marketplace);
    const dispatch = useAppDispatch();

    const [phoneStatus, setPhoneStatus] = useState<Record<string, 'checking' | 'exists' | 'not_exists'>>({});

    useLayoutEffect(() => {

        if(item.marketplace_visibility!==1)
            return

        navigation.setOptions({
            title: item.item_name,
            headerRight: () => (
                <View style={{ marginRight: Platform.OS === 'ios' ? 4 : 8 }}>
                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger>
                            <Pressable
                                hitSlop={12}
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 12,
                                    alignItems: 'flex-end',
                                    justifyContent: 'center'
                                }}>
                                <IconApp pack="FI" name="more-vertical" size={20} color={theme.text} />
                            </Pressable>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Content>
                            <DropdownMenu.Item
                                key="share_item"
                                onSelect={() => {
                                    navigation.navigate('ShareBusiness', {
                                        share_kind: 'item',
                                        business_id: business._id,
                                        business_name: business.business_name,
                                        item_id: item._id,
                                        item_name: item.item_name,
                                    });
                                }}>
                                <DropdownMenu.ItemTitle>{strings.share_item}</DropdownMenu.ItemTitle>
                                <DropdownMenu.ItemIcon ios={{ name: 'qrcode' }} />
                            </DropdownMenu.Item>
                            {/* {fromBusinessInventory ? (
                                <DropdownMenu.Item
                                    key="share_business"
                                    onSelect={() => {
                                        navigation.navigate('ShareBusiness', {
                                            share_kind: 'business',
                                            business_id: business._id,
                                            business_name: business.business_name,
                                        });
                                    }}>
                                    <DropdownMenu.ItemTitle>{strings.share_business}</DropdownMenu.ItemTitle>
                                    <DropdownMenu.ItemIcon ios={{ name: 'building.2' }} />
                                </DropdownMenu.Item>
                            ) : null} */}
                        </DropdownMenu.Content>
                    </DropdownMenu.Root>
                </View>
            ),
        });
    }, [
        navigation,
        item.item_name,
        item._id,
        business._id,
        business.business_name,
        fromBusinessInventory,
        theme.border,
        theme.text,
    ]);

    const hasDiscount = (item.discount_percentage || 0) > 0;
    const discountedPrice = useMemo(() => {
        const base = parseFloat(prices.retail_selling_price || "0");
        const pct = item.discount_percentage || 0;
        const discounted = pct > 0 ? base - (base * pct) / 100 : base;
        return discounted.toFixed(2);
    }, [prices.retail_selling_price, item.discount_percentage]);

    const isInCart = useMemo(() => {
        return cart ? !!cart.find(c => c.item._id === item._id) : false;
    }, [cart, item._id]);

    const handleAddToCart = () => {
        const row: TCartItem = {
            business: business,
            item: item,
            sales_points: sales_points,
            prices: prices
        };
        dispatch(setAddRemoveCartItem(row));
    };

    const checkPhoneNumberExists = async (number: string): Promise<boolean> => {
        try {
            const res = await axios.post(remote_host + '/yambi/API/check_phone_number', { phone_number: number });
            const d = res.data;
            return d?.success === '1';
        } catch {
            return false;
        }
    };

    useEffect(() => {
        let cancelled = false;
        const run = async () => {
            const toVerify: string[] = [];
            for (const sp of (sales_points || [])) {
                const parts = (sp.phones || '').split(',').map(s => s.trim()).filter(Boolean);
                for (const raw of parts) {
                    const phone = raw.trim();
                    if (phone && !toVerify.includes(phone)) toVerify.push(phone);
                }
            }
            
            if (toVerify.length === 0) return;
            if (cancelled) return;
            setPhoneStatus(prev => {
                const next = { ...prev } as Record<string, 'checking' | 'exists' | 'not_exists'>;
                toVerify.forEach(n => { if (!next[n]) next[n] = 'checking'; });
                return next;
            });
            await Promise.all(
                toVerify.map(async n => {
                    const ok = await checkPhoneNumberExists(n);
                    if (!cancelled) {
                        setPhoneStatus(prev => ({ ...prev, [n]: ok ? 'exists' : 'not_exists' }));
                    }
                })
            );
        };
        run();
        return () => { cancelled = true; };
    }, [sales_points]);

    const imageView = useMemo(() => {
        try {
            if (item.images && item.images !== "" && item.images !== "[]") {
                const imgs = JSON.parse(item.images);
                if (Array.isArray(imgs) && imgs.length > 0) {
                    return (
                        <ExpoImage
                            style={{ width: '100%', aspectRatio: 1, borderRadius: 16 }}
                            source={media_url + "/items_images/" + imgs[0]}
                            contentFit="cover"
                        />
                    );
                }
            }
        } catch { }
        return null;
    }, [item.images]);

    const openItemPhotos = useCallback(() => {
        try {
            if (!item.images || item.images === "" || item.images === "[]") return;
            const imgs: string[] = JSON.parse(item.images);
            if (!Array.isArray(imgs) || imgs.length === 0) return;
            const urls = imgs.map((filename) => media_url + "/items_images/" + filename);
            if (urls.length === 1) {
                navigation.navigate("ViewPhoto", { source: urls[0] });
            } else {
                navigation.navigate("ViewPhoto", { images: urls, initialIndex: 0 });
            }
        } catch { /* ignore */ }
    }, [item.images, navigation]);

    const show_category = (category: string) => {
        if (!category) return null;
        const idx = (strings as any).items_categories?.[category];
        if (!idx) return null;
        return <YambiText color="high" text={idx.name} />
    };

    const show_subcategory = (category: string, subcategory: string) => {
        if (!category || !subcategory) return null;
        const idx = (strings as any).items_categories?.[category];
        if (!idx || idx.subcategories?.[subcategory] === undefined) return null;
        return <YambiText color="high" text={idx.subcategories[subcategory]} />
    };

    const renderColors = () => {
        try {
            if (!item.colors || item.colors === "[]") return null;
            const cols: string[] = JSON.parse(item.colors);
            if (!Array.isArray(cols) || cols.length === 0) return null;
            return (
                <View style={{ flexDirection: 'row', marginTop: 12, flexWrap: 'wrap' }}>
                    {cols.map((c, i) => (
                        <View 
                            key={i} 
                            style={{ 
                                width: 32, 
                                height: 32, 
                                borderRadius: 16, 
                                backgroundColor: c, 
                                marginRight: 10, 
                                marginBottom: 10, 
                                borderWidth: 2, 
                                borderColor: theme.border,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.1,
                                shadowRadius: 3,
                                elevation: 3,
                            }} 
                        />
                    ))}
                </View>
            );
        } catch { return null; }
    };

    const renderSizes = () => {
        try {
            if (!item.sizes || item.sizes === "[]") return null;
            const sizes: string[] = JSON.parse(item.sizes);
            if (!Array.isArray(sizes) || sizes.length === 0) return null;
            return (
                <View style={{ flexDirection: 'row', marginTop: 12, flexWrap: 'wrap' }}>
                    {sizes.map((s, i) => (
                        <View 
                            key={i} 
                            style={{ 
                                paddingHorizontal: 14, 
                                height: 32, 
                                borderRadius: 16, 
                                borderWidth: 1.5, 
                                borderColor: theme.border, 
                                marginRight: 10, 
                                marginBottom: 10, 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                backgroundColor: theme.background,
                            }}
                        >
                            <YambiText size="small" color="gray" text={s} />
                        </View>
                    ))}
                </View>
            );
        } catch { return null; }
    };

    const openEmail = async (email: string) => {
        try {
            const url = `mailto:${email}`;
            await Linking.openURL(url);
        } catch { }
    };

    const salesPointHasChecking = (sp: TSellsPoint) => {
        const parts = (sp.phones || '').split(',').map(s => s.trim()).filter(Boolean);
        for (const raw of parts) {
            const phone = raw.trim();
            if (phone && phoneStatus[phone] === 'checking') return true;
        }
        return false;
    };

    const SectionCard = ({ children, style }: { children: React.ReactNode, style?: any }) => (
        <View style={{
            backgroundColor: theme.border + '40',
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: theme.border,
            ...style
        }}>
            {children}
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border }}>
            <ScrollView 
                keyboardShouldPersistTaps="handled" 
                contentContainerStyle={{ padding: 16 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Image Section — only when the item has at least one image */}
                {imageView ? (
                    <View style={{ marginBottom: 20, position: 'relative' }}>
                        <Pressable
                            onPress={openItemPhotos}
                            style={{ borderRadius: 16, overflow: 'hidden' }}
                            accessibilityRole="imagebutton"
                            accessibilityLabel="View photo">
                            {imageView}
                        </Pressable>
                        {hasDiscount && (
                            <View style={{ 
                                position: 'absolute', 
                                top: 16, 
                                left: 16, 
                                backgroundColor: theme.error, 
                                borderRadius: 12, 
                                paddingHorizontal: 12, 
                                paddingVertical: 8,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.25,
                                shadowRadius: 4,
                                elevation: 5,
                            }}>
                                <YambiText size="small" color="white" bold text={`-${item.discount_percentage}%`} />
                            </View>
                        )}
                    </View>
                ) : null}

                {/* Title & Price Section */}
                <SectionCard style={{ marginBottom: 16 }}>
                    <YambiText bold size="big" text={item.item_name} style={{ marginBottom: 12 }} />
                    
                    {/* Price Row */}
                    <View style={{
                        flexDirection: 'row', 
                        alignItems: 'center', 
                        marginTop: 8,
                        paddingTop: 16,
                        borderTopWidth: 1,
                        borderTopColor: theme.border,
                    }}>
                        <View style={{ flexDirection: 'row', alignItems: 'baseline', flex: 1 }}>
                            <YambiText size="small" text={renderCurrency(prices.currency, false)} />
                            <View style={{ width: 6 }} />
                            <YambiText bold size="big" text={discountedPrice} style={{ fontSize: 28 }} />
                            {hasDiscount && (
                                <YambiText 
                                    lineThrough 
                                    size="small" 
                                    color="gray" 
                                    style={{ marginLeft: 12 }} 
                                    text={`${renderCurrency(prices.currency, false)}${prices.retail_selling_price}`} 
                                />
                            )}
                        </View>
                        {hasDiscount && (
                            <View style={{
                                backgroundColor: theme.error + '20',
                                paddingHorizontal: 10,
                                paddingVertical: 6,
                                borderRadius: 8,
                            }}>
                                <YambiText size="xsmall" color="error" bold text={strings.discount || 'Discount'} />
                            </View>
                        )}
                    </View>

                    {/* Add to Cart — only when Marketplace tab is enabled in Customize */}
                    {tab_visible_marketplace ? (
                        <Pressable
                            onPress={handleAddToCart}
                            style={{
                                marginTop: 16,
                                backgroundColor: isInCart ? theme.error + '20' : theme.badge_background_color,
                                borderRadius: 12,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                paddingVertical: 14,
                                borderWidth: 1.5,
                                borderColor: isInCart ? theme.error : theme.badge_background_color,
                            }}
                        >
                            <IconApp 
                                pack="FI" 
                                name={isInCart ? "x" : "shopping-cart"} 
                                color={isInCart ? theme.error : theme.badge_color} 
                                size={18} 
                            />
                            <YambiText 
                                style={{ marginLeft: 8 }} 
                                color={isInCart ? "error" : "badge"} 
                                size="small" 
                                bold
                                text={isInCart ? strings.remove_from_cart : strings.add_to_cart} 
                            />
                        </Pressable>
                    ) : null}
                </SectionCard>

                {/* Category Section */}
                {(item.category || item.subcategory) && (
                    <SectionCard>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                            <IconApp pack="FI" name="tag" size={18} color={theme.high_color} />
                            <YambiText size="small" bold text={strings.category} style={{ marginLeft: 8 }} />
                        </View>
                        <View style={{ marginTop: 8 }}>
                            {show_category(item.category)}
                            {show_subcategory(item.category, item.subcategory) && (
                                <View style={{ marginTop: 4 }}>
                                    {show_subcategory(item.category, item.subcategory)}
                                </View>
                            )}
                        </View>
                    </SectionCard>
                )}

                {/* Description Section */}
                {item.description_item && (
                    <SectionCard>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                            <IconApp pack="FI" name="align-left" size={18} color={theme.high_color} />
                            <YambiText size="small" bold text={strings.description || 'Description'} style={{ marginLeft: 8 }} />
                        </View>
                        <YambiText color="gray" text={item.description_item} style={{ marginTop: 8, lineHeight: 22 }} />
                    </SectionCard>
                )}

                {/* Colors Section */}
                {item.colors && item.colors !== "[]" && (
                    <SectionCard>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                            <IconApp pack="FI" name="layers" size={18} color={theme.high_color} />
                            <YambiText bold size="small" text={strings.colors} style={{ marginLeft: 8 }} />
                        </View>
                        {renderColors()}
                    </SectionCard>
                )}

                {/* Sizes Section */}
                {item.sizes && item.sizes !== "[]" && (
                    <SectionCard>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                            <IconApp pack="FI" name="square" size={18} color={theme.high_color} />
                            <YambiText bold size="small" text={strings.sizes} style={{ marginLeft: 8 }} />
                        </View>
                        {renderSizes()}
                    </SectionCard>
                )}

                {/* View Business Inventory Section */}
                <SectionCard>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                        <IconApp pack="FI" name="package" size={18} color={theme.high_color} />
                        <YambiText bold text={business.business_name} style={{ marginLeft: 8 }} />
                    </View>
                    <Pressable
                        onPress={() => navigation.navigate('BusinessItems', { business_id: business._id, flag: 3, sales_point_id: "", hide_inventory_profit_overview: true, from_business_item: true })}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingVertical: 4,
                        }}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                            <YambiText size="small" text={strings.view_items} />
                        </View>
                        <IconApp pack="FI" name="chevron-right" size={18} color={theme.gray} />
                    </Pressable>
                </SectionCard>

                {/* Sales Points Section */}
                {sales_points && sales_points.length > 0 && (
                    <SectionCard>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                            <IconApp pack="FI" name="map-pin" size={18} color={theme.high_color} />
                            <YambiText bold text={strings.sells_points} style={{ marginLeft: 8 }} />
                        </View>
                        <View>
                            {sales_points.map((sp, i) => {
                                const phoneParts = (sp.phones || '').split(',').map(s => s.trim()).filter(Boolean);
                                const emailParts = (sp.emails || '').split(',').map(s => s.trim()).filter(Boolean);
                                const hasChecking = salesPointHasChecking(sp);
                                
                                return (
                                    <View 
                                        key={sp._id || i} 
                                        style={{ 
                                            paddingVertical: 16, 
                                            borderBottomWidth: i === sales_points.length - 1 ? 0 : 1, 
                                            borderBottomColor: theme.border,
                                        }}
                                    >
                                        {sp.sells_point_name && (
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                                <IconApp pack="FI" name="shopping-bag" size={16} color={theme.high_color} />
                                                <YambiText bold size="small" text={sp.sells_point_name} style={{ marginLeft: 8 }} />
                                            </View>
                                        )}
                                        
                                        {sp.sells_point_address && (
                                            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, marginTop: 4 }}>
                                                <IconApp pack="FI" name="map-pin" size={14} color={theme.gray} styles={{ marginTop: 2 }} />
                                                <YambiText color="gray" size="small" text={sp.sells_point_address} style={{ marginLeft: 8, flex: 1 }} />
                                            </View>
                                        )}

                                        {/* Phones */}
                                        {phoneParts.length > 0 && (
                                            <View style={{ marginTop: 12 }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                                    <IconApp pack="FI" name="phone" size={14} color={theme.gray} />
                                                    <YambiText color="gray" size="small" text={strings.phones} style={{ marginLeft: 6 }} />
                                                </View>
                                                {hasChecking && (
                                                    <View style={{ marginBottom: 8 }}>
                                                        <YambiText color="gray" size="xsmall" text={strings.verifying_phone_number} />
                                                    </View>
                                                )}
                                                <View>
                                                    {phoneParts.map((raw, idx) => {
                                                        const phoneKey = raw.trim();
                                                        const status = phoneStatus[phoneKey];
                                                        const isCurrentUser = phoneKey === user_data.phone_number;
                                                        
                                                        if (phoneKey && status === 'exists' && !isCurrentUser) {
                                                            return (
                                                                <Pressable
                                                                    key={`${raw}-${idx}`}
                                                                    onPress={() => navigation.navigate('Inbox', { user: phoneKey })}
                                                                    style={{
                                                                        flexDirection: 'row',
                                                                        alignItems: 'center',
                                                                        alignSelf: 'flex-start',
                                                                        paddingHorizontal: 14,
                                                                        paddingVertical: 10,
                                                                        borderRadius: 12,
                                                                        backgroundColor: theme.high_color + '15',
                                                                        borderWidth: 1.5,
                                                                        borderColor: theme.high_color,
                                                                        marginBottom: 8,
                                                                    }}
                                                                >
                                                                    <IconApp pack="FI" name="message-circle" size={16} color={theme.high_color} />
                                                                    <YambiText size="small" color="high" text={strings.chat_with_the_seller} style={{ marginLeft: 8 }} />
                                                                </Pressable>
                                                            );
                                                        }
                                                        return (
                                                            <View key={`${raw}-${idx}`} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                                                                <IconApp pack="FI" name="phone" size={14} color={theme.gray} />
                                                                <YambiText size="small" color="gray" text={raw} style={{ marginLeft: 8 }} />
                                                            </View>
                                                        );
                                                    })}
                                                </View>
                                            </View>
                                        )}

                                        {/* Emails */}
                                        {emailParts.length > 0 && (
                                            <View style={{ marginTop: 12 }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                                    <IconApp pack="FI" name="mail" size={14} color={theme.gray} />
                                                    <YambiText color="gray" size="small" text={strings.emails} style={{ marginLeft: 6 }} />
                                                </View>
                                                <View>
                                                    {emailParts.map((em, ei) => (
                                                        <Pressable 
                                                            key={`${em}-${ei}`} 
                                                            onPress={() => openEmail(em)}
                                                            style={{
                                                                flexDirection: 'row',
                                                                alignItems: 'center',
                                                                marginBottom: 6,
                                                            }}
                                                        >
                                                            <IconApp pack="FI" name="mail" size={14} color={theme.high_color} />
                                                            <YambiText size="small" color="high" text={em} style={{ marginLeft: 8 }} />
                                                        </Pressable>
                                                    ))}
                                                </View>
                                            </View>
                                        )}
                                    </View>
                                );
                            })}
                        </View>
                    </SectionCard>
                )}
            </ScrollView>
        </View>
    )
}

const BusinessItem = ({ navigation, route }: NavProps) => {
    const theme = useAppSelector(state => state.app_theme.colors);
    const user_data = useAppSelector(state => state.user_data);
    const params = route.params as RootStackParamList['BusinessItem'];
    const { inline, linkItemId, fromBusinessInventory } = cartParamsFromRoute(params);
    const fromDeepLink = !!linkItemId?.trim() && !inline;
    const [fetchedCart, setFetchedCart] = useState<TCartItem | null>(null);
    const [loadingItem, setLoadingItem] = useState(false);
    const [loadFailed, setLoadFailed] = useState(false);  
    /** Inline navigation: merge latest business + sales points (addresses completed server-side). */
    const [inlineDetailRefresh, setInlineDetailRefresh] = useState<TCartItem | null>(null);
    const inlineRef = useRef<TCartItem | null>(null);

    const cartFromInline = inline ? inlineDetailRefresh ?? inline : null;
    const cart = cartFromInline ?? fetchedCart;

    useEffect(() => {
        if (!fromDeepLink) {
            return;
        }
        const sub = BackHandler.addEventListener("hardwareBackPress", () => {
            RNRestart.restart();
            return true;
        });
        return () => sub.remove();
    }, [fromDeepLink]);

    useLayoutEffect(() => {
        if (!fromDeepLink) {
            navigation.setOptions({ headerLeft: undefined });
            return;
        }
        const headerLeft = () => (
            <Pressable
                onPress={() => RNRestart.restart()}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={{ marginLeft: Platform.OS === 'ios' ? 8 : 4 }}>
                <IconApp
                    pack="FI"
                    name={Platform.OS === 'android' ? 'arrow-left' : 'chevron-left'}
                    size={22}
                    color={theme.text_design1}
                />
            </Pressable>
        );
        const loadingDeepLink =
            loadingItem ||
            (!inline && !!linkItemId?.trim() && !cart && !loadFailed);
        if (loadingDeepLink) {
            navigation.setOptions({ headerLeft });
            return;
        }
        if (!cart || loadFailed) {
            navigation.setOptions({
                title: strings.item_not_found_title,
                headerLeft,
            });
            return;
        }
        navigation.setOptions({ headerLeft });
    }, [
        fromDeepLink,
        navigation,
        theme.text_design1,
        loadingItem,
        cart,
        loadFailed,
        inline,
        linkItemId,
    ]);

    inlineRef.current = inline;

    useEffect(() => {
        setInlineDetailRefresh(null);
    }, [inline?.business._id, inline?.item._id]);

    /**
     * Cart / marketplace / navigation with full row: refresh business + POS on mount and when the row changes.
     * get_item when possible (item + prices + business + points); else get_business with sales_points.
     */
    useEffect(() => {
        // console.log(inline)
        if (!inline?.business?._id || !inline?.item?._id) {
            return undefined;
        }

        

        const businessId = inline.business._id;
        const itemId = inline.item._id;
        const phone = user_data?.phone_number || "";
        let cancelled = false;

        // console.log(itemId)

        const run = async () => {
            const fromItemApi = await fetchCartItemFromServerForDeepLink(itemId, phone);
            if (cancelled) { 
                return;
            }
            const latest = inlineRef.current;
            if (
                !latest?.business?._id ||
                latest.business._id !== businessId ||
                latest.item._id !== itemId
            ) {
                return;
            }

            if (fromItemApi) {
                setInlineDetailRefresh({
                    ...latest,
                    item: fromItemApi.item,
                    business: fromItemApi.business,
                    prices: fromItemApi.prices,
                    sales_points: fromItemApi.sales_points,
                });
                return;
            }

            try {
                const res = await axios.post(remote_host + "/yambi/API/get_business", {
                    business_id: businessId,
                    include_sales_points: true,
                });
                if (cancelled || res.data?.success !== "1" || !res.data.business) {
                    return;
                }
                const latest2 = inlineRef.current;
                if (
                    !latest2?.business?._id ||
                    latest2.business._id !== businessId ||
                    latest2.item._id !== itemId
                ) {
                    return;
                }
                const b = res.data.business as TBusiness;
                const sps = Array.isArray(res.data.sales_points)
                    ? (res.data.sales_points as TSellsPoint[])
                    : [];
                setInlineDetailRefresh({
                    ...latest2,
                    business: b,
                    sales_points: sps,
                });
            } catch {
                /* keep route params */
            }
        };

        void run();
        return () => {
            cancelled = true;
        };
    }, [inline?.business._id, inline?.item._id, user_data?.phone_number]);

    useEffect(() => {
        if (inline) {
            setFetchedCart(null);
            setLoadFailed(false);
            setLoadingItem(false);
            return;
        }
        const id = linkItemId?.trim();
        if (!id) {
            setFetchedCart(null);
            setLoadFailed(true);
            setLoadingItem(false);
            return;
        }
        let cancelled = false;
        setLoadingItem(true);
        setLoadFailed(false);
        fetchCartItemFromServerForDeepLink(id, user_data?.phone_number || "").then((c) => {
            if (cancelled) return;
            if (c) setFetchedCart(c);
            else setLoadFailed(true);
        }).finally(() => {
            if (!cancelled) setLoadingItem(false);
        });
        return () => {
            cancelled = true;
        };
    }, [inline, linkItemId, user_data?.phone_number]);

    if (loadingItem || (!inline && linkItemId?.trim() && !cart && !loadFailed)) {
        return (
            <View style={{
                flex: 1,
                backgroundColor: theme.background,
                justifyContent: "center",
                alignItems: "center",
            }}>
                <YambiText text={strings.loading || "Loading..."} size="normal" color="gray" />
            </View>
        );
    }

    if (!cart || loadFailed) {
        const isMissingItem = loadFailed || (!inline && !!linkItemId?.trim());
        return (
            <View style={{
                flex: 1,
                backgroundColor: theme.background,
                justifyContent: "center",
                alignItems: "center",
                paddingHorizontal: 32,
            }}>
                <IconApp pack="FI" name="package" size={56} color={theme.gray} />
                <YambiText
                    text={isMissingItem ? strings.item_not_found : (strings.no_items_available || strings.error)}
                    size="normal"
                    color="gray"
                    style={{ textAlign: "center", marginTop: 16 }}
                />
                <Pressable
                    onPress={() => (fromDeepLink ? RNRestart.restart() : navigation.goBack())}
                    style={{ marginTop: 20, paddingVertical: 12, paddingHorizontal: 20 }}>
                    <YambiText text={strings.back} size="small" color="high" />
                </Pressable>
            </View>
        );
    }

    return (
        <BusinessItemInner
            navigation={navigation}
            cartItem={cart}
            fromBusinessInventory={fromBusinessInventory}
        />
    );
};

export default BusinessItem;
