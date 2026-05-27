import { View, TextInput, Animated, Pressable, ActivityIndicator, Platform, RefreshControl, BackHandler } from "react-native";
import { useEffect, useState, useRef, useMemo, useLayoutEffect } from 'react';
import { NavProps, TBusiness, TBusinessSubscription, TItem, TItemPrices, TSale, TSellsPoint } from "../../types/types";
import { strings } from "../../lang/lang";
import { IconApp } from "../../components/app/IconApp";
import { useAppDispatch, useAppSelector } from "../../store/app/hooks";
import { useObject, useQuery, useRealm } from "@realm/react";
import { UserBusinessArticles, ItemPrices, UserSellsPoints, BusinessUsers, UserBusinesses } from "../../store/database/Models";
import { PieChart } from "react-native-gifted-charts";
import { setBusinessItemsFilter, setShowModalApp } from "../../store/reducers/appSlice";
import { YambiText } from "../../components/app/Text";
import ModalApp from "../../components/app/ModalApp";
import { FlashList } from "@shopify/flash-list";
import BusinessItemsList from "../../components/lists/business/BusinessItemsList";
import { randomString, renderDateUpToMilliseconds, SocketApp, copyToClipboard, remote_host, media_url, renderCurrency } from "../../../GlobalVariables";
import moment from "moment";
import SwitchApp from "../../components/app/SwitchApp";
import ButtonNormal from "../../components/app/ButtonNormal";
import { Image as ExpoImage } from 'expo-image';
import axios from "axios";
import Realm from "realm";
import AppActivityIndicator from "../../components/app/AppActivityIndicator";
import * as DropdownMenu from "zeego/dropdown-menu";
import RNRestart from "react-native-restart";

const pi = (v: unknown, d = 0) => parseInt(String(v ?? d), 10);

function realmBusinessFromApi(bb: Record<string, unknown>): TBusiness {
    return {
        _id: String(bb._id),
        phone_number: String(bb.phone_number ?? ""),
        business_name: String(bb.business_name ?? ""),
        slogan: String(bb.slogan ?? ""),
        description_service: String(bb.description_service ?? ""),
        category: pi(bb.category, 0),
        keywords: String(bb.keywords ?? ""),
        currency: pi(bb.currency, 0),
        logo: String(bb.logo ?? ""),
        national_number: String(bb.national_number ?? ""),
        national_id: String(bb.national_id ?? ""),
        tax_number: String(bb.tax_number ?? ""),
        country: String(bb.country ?? ""),
        state: String(bb.state ?? ""),
        city: String(bb.city ?? ""),
        phones: String(bb.phones ?? ""),
        emails: String(bb.emails ?? ""),
        background: String(bb.background ?? ""),
        business_active: pi(bb.business_active, 0),
        business_address: String(bb.business_address ?? ""),
        business_visible: pi(bb.business_visible, 0),
        website: String(bb.website ?? ""),
        other_links: String(bb.other_links ?? ""),
        yambi: String(bb.yambi ?? ""),
        valid_until: String(bb.valid_until ?? ""),
        createdAt: String(bb.createdAt ?? ""),
        updatedAt: String(bb.updatedAt ?? ""),
    };
}

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
        wholesale_content_number: pi(raw.wholesale_content_number, 1),
        items_number_stock: pi(raw.items_number_stock, 0),
        items_number_warehouse: pi(raw.items_number_warehouse, 0),
        description_item: String(raw.description_item ?? ""),
        keywords: String(raw.keywords ?? ""),
        images: String(raw.images ?? ""),
        background: String(raw.background ?? ""),
        supplier: String(raw.supplier ?? ""),
        other_information: String(raw.other_information ?? ""),
        alert_low_stock: pi(raw.alert_low_stock, 0),
        item_active: pi(raw.item_active, 0),
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

function writeCatalogPayloadToRealm(
    realm: Realm,
    bb: Record<string, unknown>,
    payloadItems: Record<string, unknown>[],
    payloadPrices: Record<string, unknown>[],
) {
    realm.write(() => {
        realm.create("Businesses", realmBusinessFromApi(bb), true);
        for (const raw of payloadItems) {
            if (!raw._id) continue;
            realm.create("UserBusinessArticles", realmItemFromApi(raw), true);
        }
        for (const pr of payloadPrices) {
            if (!pr._id) continue;
            realm.create("ItemPrices", realmPriceFromApi(pr), true);
        }
    });
}

const BusinessItemss = ({ navigation, route }: NavProps) => {

    const { business_id } = route.params;
    const routeFlag = route.params.flag;
    const routeSalesPointId = route.params.sales_point_id;
    const from_deep_link_catalog =
        route.params.from_deep_link === true ||
        (routeFlag === undefined &&
            routeSalesPointId === undefined &&
            !!business_id);

    const flag = from_deep_link_catalog ? 3 : routeFlag ?? 0;
    const sales_point_id = routeSalesPointId ?? "";
    const { can_upload_images, hide_inventory_profit_overview: routeHideProfit } = route.params;
    const from_business_item = route.params.from_business_item === true;
    const hide_inventory_profit_overview = routeHideProfit === true || from_deep_link_catalog;

    const theme = useAppSelector(state => state.app_theme.colors);
    const loading_app = useAppSelector(state => state.app.loading);
    const business_items_filter = useAppSelector(state => state.app.business_items_filter);
    const app_description = useAppSelector(state => state.persisted_app.app_description);
    const [showSaleFrame, setShowSaleFrame] = useState(false);
    const user_data = useAppSelector(state => state.user_data);
    const [showInfo, setShowInfo] = useState<boolean>(false);
    const [itemToSell, setItemToSell] = useState<TItem>({} as TItem);
    const [ItemPrices, setItemPrices] = useState<TItemPrices>({} as TItemPrices);
    const [itemToSellPrice, setItemToSellPrice] = useState("");
    const [numberItemToSell, setNumberItemToSell] = useState("");
    const [showUserError, setShowUserError] = useState(false);
    const [wholesale, setWholesale] = useState(false);
    const [IIItems, setIIItems] = useState<TItem>();
    const [searched_text, setSearched_text] = useState<string>("");
    const [type_sale, setType_sale] = useState<number>(0);
    const [buyer_name, setBuyer_name] = useState<string>("");
    const [buyer_phone, setBuyer_phone] = useState<string>("");
    const [showSaleSuccess, setShowSaleSuccess] = useState<boolean>(false);
    const [showBusinessInactiveSellError, setShowBusinessInactiveSellError] = useState<boolean>(false);
    const [isFollowing, setIsFollowing] = useState<boolean>(false);
    const [followStatusLoading, setFollowStatusLoading] = useState<boolean>(true);
    const [followStatusAvailable, setFollowStatusAvailable] = useState<boolean>(false);
    const [showBusinessInfo, setShowBusinessInfo] = useState<boolean>(false);
    const [showLowStockAlert, setShowLowStockAlert] = useState<boolean>(false);
    const [showOutOfStock, setShowOutOfStock] = useState<boolean>(false);
    const [subscriberCount, setSubscriberCount] = useState<number>(0);
    const [subscriberCountLoading, setSubscriberCountLoading] = useState<boolean>(true);
    const [showUnfollowConfirm, setShowUnfollowConfirm] = useState<boolean>(false);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [accessibleItemIds, setAccessibleItemIds] = useState<string[]>([]);
    const [catalogReady, setCatalogReady] = useState(!from_deep_link_catalog);
    const [catalogError, setCatalogError] = useState(false);
    const businessInfoHeight = useRef(new Animated.Value(0)).current;

    const realm = useRealm();
    const persistedSubscriptions = useAppSelector(state => state.persisted_app.business_subscriptions || []);

    const items = useQuery(
        UserBusinessArticles, items => {
            return items.filtered('business_id == $0', business_id);
        }, []);

    const uuser = useQuery(
        BusinessUsers, bss => {
            return bss.filtered('user == $0 && business_id == $1', user_data.phone_number, business_id)
        }, []);

    const business = useObject(UserBusinesses, business_id);
    const sales_point = useObject(UserSellsPoints, sales_point_id);

    const oo = uuser.find(element => element.user === user_data.phone_number);

    const sales_points = useQuery(
        UserSellsPoints, bss => {
            return bss.filtered('business_id == $0', business_id)
        }, []);

    const dispatch = useAppDispatch();

    const refreshBusinessCatalogFromServer = async () => {
        if (!business_id) return;
        try {
            const res = await axios.post(remote_host + "/yambi/API/get_business", {
                business_id,
                include_catalog: true,
            });
            if (res.data?.success !== "1" || !res.data.business) {
                if (from_deep_link_catalog) setCatalogError(true);
                return;
            }
            const bb = res.data.business as Record<string, unknown>;
            const payloadItems = (res.data.items ?? []) as Record<string, unknown>[];
            const payloadPrices = (res.data.item_prices ?? []) as Record<string, unknown>[];
            writeCatalogPayloadToRealm(realm, bb, payloadItems, payloadPrices);
            if (from_deep_link_catalog) setCatalogError(false);
        } catch {
            if (from_deep_link_catalog) setCatalogError(true);
        }
    };

    useEffect(() => {
        if (!from_deep_link_catalog || !business_id) {
            return;
        }
        let cancelled = false;
        setCatalogReady(false);
        setCatalogError(false);
        axios
            .post(remote_host + "/yambi/API/get_business", {
                business_id,
                include_catalog: true,
            })
            .then(res => {
                if (cancelled) return;
                if (res.data?.success !== "1" || !res.data.business) {
                    setCatalogError(true);
                    setCatalogReady(true);
                    return;
                }
                const bb = res.data.business as Record<string, unknown>;
                const payloadItems = (res.data.items ?? []) as Record<string, unknown>[];
                const payloadPrices = (res.data.item_prices ?? []) as Record<string, unknown>[];
                try {
                    writeCatalogPayloadToRealm(realm, bb, payloadItems, payloadPrices);
                } catch {
                    setCatalogError(true);
                }
                setCatalogReady(true);
            })
            .catch(() => {
                if (!cancelled) {
                    setCatalogError(true);
                    setCatalogReady(true);
                }
            });
        return () => {
            cancelled = true;
        };
    }, [from_deep_link_catalog, business_id, realm]);

    /** After opening “View items” from BusinessItem: refresh catalog from server without blocking the screen (deep link keeps full-screen load). */
    useEffect(() => {
        if (!from_business_item || from_deep_link_catalog || !business_id) {
            return;
        }
        let cancelled = false;
        axios
            .post(remote_host + "/yambi/API/get_business", {
                business_id,
                include_catalog: true,
            })
            .then(res => {
                if (cancelled) return;
                if (res.data?.success !== "1" || !res.data.business) {
                    return;
                }
                const bb = res.data.business as Record<string, unknown>;
                const payloadItems = (res.data.items ?? []) as Record<string, unknown>[];
                const payloadPrices = (res.data.item_prices ?? []) as Record<string, unknown>[];
                try {
                    writeCatalogPayloadToRealm(realm, bb, payloadItems, payloadPrices);
                } catch {
                    /* keep showing cached Realm data */
                }
            })
            .catch(() => { });
        return () => {
            cancelled = true;
        };
    }, [from_business_item, from_deep_link_catalog, business_id, realm]);

    useEffect(() => {
        if (!from_deep_link_catalog) {
            return;
        }
        const sub = BackHandler.addEventListener("hardwareBackPress", () => {
            RNRestart.restart();
            return true;
        });
        return () => sub.remove();
    }, [from_deep_link_catalog]);

    useLayoutEffect(() => {
        if (!from_deep_link_catalog) {
            return;
        }
        const headerLeft = () => (
            <Pressable
                onPress={() => RNRestart.restart()}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={{ marginLeft: Platform.OS === "ios" ? 8 : 4 }}>
                <IconApp
                    pack="FI"
                    name={Platform.OS === "android" ? "arrow-left" : "chevron-left"}
                    size={22}
                    color={theme.text_design1}
                />
            </Pressable>
        );
        if (catalogError) {
            navigation.setOptions({
                title: strings.business_not_found_title,
                headerLeft,
            });
            return;
        }
        navigation.setOptions({ headerLeft });
    }, [from_deep_link_catalog, catalogError, navigation, theme.text_design1]);

    const PLAN_MAX_ARTICLES: Record<number, number> = {
        0: 15,    // Free
        1: 150,   // Basic
        2: 400,   // Premium X
        3: 3000,  // Ultimate
    };

    const activeSuccessfulLocalSubscription = useMemo(() => {
        const now = new Date();
        return persistedSubscriptions
            .filter((sub: TBusinessSubscription) => {
                if (sub.business_id !== business_id) return false;
                if (Number(sub.payment_status ?? 0) !== 1) return false;
                const endDate = sub.subscription_end_date ? new Date(sub.subscription_end_date) : null;
                if (!endDate || Number.isNaN(endDate.getTime())) return false;
                return endDate >= now;
            })
            .sort((a: TBusinessSubscription, b: TBusinessSubscription) => {
                const ad = new Date(a.createdAt || 0).getTime();
                const bd = new Date(b.createdAt || 0).getTime();
                return bd - ad;
            })[0];
    }, [persistedSubscriptions, business_id]);

    const maxArticlesAllowed = useMemo(() => {
        if (flag === 3) {
            return Number.MAX_SAFE_INTEGER;
        }
        const plan = Number(activeSuccessfulLocalSubscription?.subscription_plan ?? 0);
        return PLAN_MAX_ARTICLES[plan] ?? PLAN_MAX_ARTICLES[0];
    }, [activeSuccessfulLocalSubscription, flag]);

    const sortItemsByFilter = (list: TItem[]) => {
        if (business_items_filter === "0") {
            return [...list].sort((a, b) => a.items_number_stock - b.items_number_stock);
        }
        if (business_items_filter === "1") {
            return [...list].sort((a, b) => b.items_number_stock - a.items_number_stock);
        }
        return [...list];
    };

    useEffect(() => {
        const activeItems = items.filter(item => item.item_active === 1) as unknown as TItem[];
        const sortedItems = sortItemsByFilter(activeItems);

        const unlockedIds = sortedItems.slice(0, maxArticlesAllowed).map(i => i._id);
        setAccessibleItemIds(unlockedIds);

        if (searched_text.trim() !== "") {
            const filtered = sortedItems.filter(item =>
                item.item_name.toLowerCase().includes(searched_text.toLowerCase())
            );
            setIIItems(filtered as never);
        } else {
            setIIItems(sortedItems as never);
        }
        // setOo(uuser.find(element => element.user === user_data.phone_number));


        // if (flag) {
        //     console.log(flag)
        if (flag === 2) {
            navigation.setOptions({ title: strings.inventory });
        } else if (flag === 3) {
            // View inventory from BusinessItem - use business name as title
            if (business) {
                navigation.setOptions({ title: business.business_name });
            } else {
                navigation.setOptions({ title: strings.inventory });
            }
        } else if (flag === 0) {
            navigation.setOptions({ title: strings.add_new_sale });
        } else if (flag === 1) {
            navigation.setOptions({ title: strings.sales_by_item });
        } else {

        }
        // }

    }, [items, uuser, business_items_filter, maxArticlesAllowed, searched_text, business, navigation, flag]);

    // Animate business info expand/collapse
    useEffect(() => {
        Animated.timing(businessInfoHeight, {
            toValue: showBusinessInfo ? 1 : 0,
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, [showBusinessInfo]);

    // Followers count is public, so fetch it for any view.
    useEffect(() => {
        if (business_id) {
            fetchSubscriberCount();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [business_id]);

    // Follow status only matters in public/marketplace views (flag === 3).
    useEffect(() => {
        if (flag === 3 && business_id && user_data?.phone_number) {
            setFollowStatusLoading(true);
            setFollowStatusAvailable(false);
            checkFollowStatus();
        } else {
            setFollowStatusLoading(false);
            setFollowStatusAvailable(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [business_id, flag, user_data?.phone_number]);

    // Reset expanded out-of-stock state when switching businesses / inventory contexts.
    useEffect(() => {
        setShowLowStockAlert(false);
        setShowOutOfStock(false);
    }, [business_id, flag]);

    const checkFollowStatus = async () => {
        try {
            const res = await axios.post(remote_host + "/yambi/API/check_subscription", {
                business_id: business_id,
                phone_number: user_data.phone_number
            });

            if (res.data.success === "1") {
                setIsFollowing(res.data.is_following || false);
                setFollowStatusAvailable(true);
            } else {
                setFollowStatusAvailable(false);
            }
        } catch {
            setFollowStatusAvailable(false);
        } finally {
            setFollowStatusLoading(false);
        }
    };

    const fetchSubscriberCount = async () => {
        try {
            setSubscriberCountLoading(true);
            const res = await axios.post(remote_host + "/yambi/API/get_subscriptions", {
                business_id: business_id
            });

            if (res.data.success === "1") {
                // API returns either `count` or full `subscriptions` list depending on version.
                const count =
                    typeof res.data.count === "number"
                        ? res.data.count
                        : Array.isArray(res.data.subscriptions)
                          ? res.data.subscriptions.length
                          : 0;
                setSubscriberCount(count);
            }
        } catch { 
            // keep previous value
        } finally {
            setSubscriberCountLoading(false);
        }
    };

    const onPullToRefresh = async () => {
        setRefreshing(true);
        try {
            await Promise.all([
                refreshBusinessCatalogFromServer(),
                fetchSubscriberCount(),
                flag === 3 && user_data?.phone_number ? checkFollowStatus() : Promise.resolve(),
            ]);
        } finally {
            setRefreshing(false);
        }
    };

    const accessibleActiveItems = useMemo(
        () => (items.filter((i) => i.item_active === 1 && accessibleItemIds.includes(i._id)) as unknown as TItem[]),
        [items, accessibleItemIds]
    );

    const activeItemsCount = useMemo(() => accessibleActiveItems.length, [accessibleActiveItems]);

    type InventoryCurrencyRow = {
        currency: number;
        totalCost: number;
        totalRevenue: number;
        grossProfit: number;
        marginPct: number;
        articleCount: number;
    };

    const inventoryProfitByCurrency = useMemo((): InventoryCurrencyRow[] => {
        const buckets: Record<number, { totalCost: number; totalRevenue: number; articleCount: number }> = {};

        for (const item of accessibleActiveItems) {
            const p = realm.objectForPrimaryKey("ItemPrices", "G" + item._id) as ItemPrices | null;
            if (!p) continue;

            const w = Math.max(1, Number(item.wholesale_content_number) || 1);
            const stock = Number(item.items_number_stock ?? 0);
            if (stock <= 0) continue;

            const cur = typeof p.currency === "number" ? p.currency : 1;
            if (!buckets[cur]) {
                buckets[cur] = { totalCost: 0, totalRevenue: 0, articleCount: 0 };
            }

            const wholesaleCostRaw = parseFloat(String(p.wholesale_cost_price ?? "0"));
            const unitPurchasePrice = (Number.isFinite(wholesaleCostRaw) ? wholesaleCostRaw : 0) / w;

            const retailRaw = parseFloat(String(p.retail_selling_price ?? "0"));
            const retailUnit = Number.isFinite(retailRaw) ? retailRaw : 0;

            const totalRetailValue = retailUnit * stock;
            const totalPurchaseCost = unitPurchasePrice * stock;

            buckets[cur].totalCost += totalPurchaseCost;
            buckets[cur].totalRevenue += totalRetailValue;
            buckets[cur].articleCount += 1;
        }

        return Object.keys(buckets)
            .map((k) => parseInt(k, 10))
            .sort((a, b) => a - b)
            .map((currency) => {
                const { totalCost, totalRevenue, articleCount } = buckets[currency];
                const grossProfit = totalRevenue - totalCost;
                const marginPct = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
                return { currency, totalCost, totalRevenue, grossProfit, marginPct, articleCount };
            });
    }, [accessibleActiveItems, realm]);

    // const NewBusiness = () => {
    //     RootNavigation.navigate("NewBusiness");
    // }

    // const EditWorkspace = () => {
    //     dispatch(setShowModalApp(true));
    //     setShowInfo(true);
    // }

    // const renderItem = useCallback(({ item }: { item: IBusiness }) => {
    //     return (<Item item={item} />)
    // }, []);

    const SelectItem = (item: TItem, prices: ItemPrices, flag: number) => {
        if (flag === 0) {
            if (oo !== null && oo !== undefined && oo.user_active === 1) {
                if (oo.level === 1 || oo.sales_point_id === sales_point_id) {
                    if (app_description.type_sale_board === 0) {
                        setItemToSell(item);
                        setItemPrices(prices);
                        setItemToSellPrice(prices.retail_selling_price);
                        dispatch(setShowModalApp(true));
                        setShowSaleFrame(true);
                    } else {
                        navigation.navigate("AddItemSale", { item: item, prices: prices, business_id: item.business_id, sales_point_id: sales_point_id });
                    }
                } else {
                    dispatch(setShowModalApp(true));
                    setShowUserError(true);
                }
            } else {
                dispatch(setShowModalApp(true));
                setShowUserError(true);
            }
        }

        if (flag === 1) {
            if (oo !== null && oo !== undefined && oo.user_active === 1) {
                if (oo.level === 1 || (oo.sales_point_id === sales_point_id && oo.level < 3)) {
                    navigation.navigate("ItemSales", { business_id: "", sales_point_id: "", item_id: item._id });
                }
            }
        }

        const openBusinessItemWithInlinePayload = () => {
            if (!business || !sales_points) {
                return;
            }
            navigation.navigate("BusinessItem", {
                business: business as unknown as TBusiness,
                sales_points: Array.from(sales_points) as TSellsPoint[],
                item: item,
                prices: prices as unknown as TItemPrices,
                from_business_inventory: true,
            });
        };

        if (flag === 2) {
            openBusinessItemWithInlinePayload();
        }

        if (flag === 3 && from_business_item) {
            openBusinessItemWithInlinePayload();
        } else if (flag === 3 && !from_business_item) {
            navigation.navigate("BusinessItem", { item_id: item._id, from_business_inventory: true });
        }
    }

    const CancelSale = () => {
        setNumberItemToSell("");
        setItemToSellPrice("");
        setWholesale(false);
        dispatch(setShowModalApp(false));
        setShowSaleFrame(false)
    }

    const ConfirmSale = () => {
        if (!business) {
            return;
        }

        if (business.business_active === 1) {
            if (numberItemToSell !== "" && sales_point_id !== "") {

                if (!error_number()) {
                    // console.log("Error")
                } else {

                    const sale: TSale = {
                        _id: renderDateUpToMilliseconds() + randomString(5),
                        item_id: itemToSell._id,
                        business_id: itemToSell.business_id,
                        number: parseInt(numberItemToSell),
                        sale_operator: user_data.phone_number,
                        sales_point_id: sales_point_id,
                        cost_price: wholesale ? ItemPrices.wholesale_cost_price.toString() : (parseFloat(ItemPrices.wholesale_cost_price) / itemToSell.wholesale_content_number).toString(),
                        selling_price: wholesale ? ItemPrices.wholesale_selling_price : ItemPrices.retail_selling_price,
                        delivery_price: "",
                        delivery_address: "",
                        delivery_time: "",
                        discount_price: "",
                        delivery_status: 0,
                        type_sale: type_sale,
                        buyer_name: buyer_name,
                        buyer_phone: buyer_phone,
                        currency: ItemPrices.currency,
                        description: "",
                        agent_paid: type_sale === 0 ? user_data.phone_number : "",
                        uploaded: 0,
                        sale_active: 1,
                        country: sales_point?.country || business.country || "",
                        createdAt: moment(new Date()).format(),
                        updatedAt: ""
                    }

                    const item: TItem = {
                        _id: itemToSell._id,
                        business_id: itemToSell.business_id,
                        phone_number: itemToSell.phone_number,
                        item_name: itemToSell.item_name,
                        slogan: itemToSell.slogan,
                        item_type: itemToSell.item_type,
                        category: itemToSell.category,
                        subcategory: itemToSell.subcategory,
                        manufacture_date: itemToSell.manufacture_date,
                        expiry_date: itemToSell.expiry_date,
                        wholesale_content_number: itemToSell.wholesale_content_number,
                        items_number_stock: !wholesale ? itemToSell.items_number_stock - parseInt(numberItemToSell) : itemToSell.items_number_stock - parseInt(numberItemToSell) * itemToSell.wholesale_content_number,
                        items_number_warehouse: itemToSell.items_number_warehouse,
                        description_item: itemToSell.description_item,
                        keywords: itemToSell.keywords,
                        images: itemToSell.images,
                        background: itemToSell.background,
                        item_active: itemToSell.item_active,
                        supplier: itemToSell.supplier,
                        other_information: itemToSell.other_information,
                        alert_low_stock: itemToSell.alert_low_stock,
                        uploaded: 0,
                        createdAt: itemToSell.createdAt,
                        updatedAt: itemToSell.updatedAt,
                        colors: itemToSell.colors,
                        discount_percentage: itemToSell.discount_percentage,
                        discount_start_date: itemToSell.discount_start_date,
                        discount_end_date: itemToSell.discount_end_date,
                        marketplace_visibility: itemToSell.marketplace_visibility,
                        weights: itemToSell.weights,
                        sizes: itemToSell.sizes,
                        flag: itemToSell.flag,
                        is_best_seller: itemToSell.is_best_seller,
                        visibility_rank: itemToSell.visibility_rank,
                        is_featured: itemToSell.is_featured
                    }

                    realm.write(() => {
                        try {
                            realm.create('BusinessItemsSale', sale);
                        } catch (error) { }

                        try {
                            realm.create('UserBusinessArticles', item, true);
                        } catch (error) { }

                        SocketApp.emit("newItems", JSON.stringify({ phone_number: user_data.phone_number, items: [item] }));

                        SocketApp.emit("newSales", JSON.stringify({ phone_number: user_data.phone_number, items: [sale] }));
                    });

                    setNumberItemToSell("");
                    setItemToSellPrice("");
                    setWholesale(false);

                    // console.log(app_description.close_sale_board_after_operation)

                    if (app_description.close_sale_board_after_operation === 0) {
                        dispatch(setShowModalApp(false));
                        setShowSaleFrame(false);
                        // setShowSaleSuccess(true);
                    }

                    if (app_description.after_sale === 0) {
                        navigation.navigate('Sale', { sale: sale, item: itemToSell, prices: ItemPrices })
                    }

                    setTimeout(() => {
                        dispatch(setShowModalApp(true));
                        setShowSaleSuccess(true);
                    }, 100);
                }
            }
        } else {
            // In public views we don't expose subscription status messaging.
            if (flag !== 3) {
                dispatch(setShowModalApp(true));
                setShowBusinessInactiveSellError(true);
            }
        }
    }

    const Detail = () => {
        if (!wholesale) {
            setItemToSellPrice(ItemPrices.wholesale_selling_price);
        } else {
            setItemToSellPrice(ItemPrices.retail_selling_price);
        }
        setWholesale(!wholesale);
    }

    const error_number = () => {

        if (wholesale) {
            if ((parseInt(numberItemToSell) * itemToSell.wholesale_content_number) > itemToSell.items_number_stock) {
                return false;
            }
        } else {
            if (parseInt(numberItemToSell) > itemToSell.items_number_stock) {
                return false;
            }
        }

        return true;
    }

    const SearchItem = (search: string) => {
        setSearched_text(search);
    }

    const SetCash = () => {
        // if (type_sale === 0) {
        //     setType_sale(1);
        // } else {
        //     setType_sale(0);
        // }
        dispatch(setShowModalApp(false));
        setShowSaleFrame(false);

        navigation.navigate("AddItemSale", { item: itemToSell, prices: ItemPrices, business_id: business_id, sales_point_id: sales_point_id });
    }

    const renderBusinessHeader = () => {
        // Only show header when coming from marketplace (flag === 3) and search is empty
        if (flag !== 3 || searched_text !== "" || !business) {
            return null;
        }

        const handleFollow = async () => {
            try {
                const res = await axios.post(remote_host + "/yambi/API/add_subscription", {
                    business_id: business_id,
                    phone_number: user_data.phone_number
                });

                if (res.data.success === "1") {
                    setIsFollowing(res.data.subscription_active === 1);
                    // Refresh subscriber count after follow/unfollow
                    fetchSubscriberCount();
                }
            } catch (error) {
                console.error("Error toggling follow status:", error);
            }
        };

        const requestUnfollow = () => {
            dispatch(setShowModalApp(true));
            setShowUnfollowConfirm(true);
        };

        const confirmUnfollow = async () => {
            dispatch(setShowModalApp(false));
            setShowUnfollowConfirm(false);
            await handleFollow();
        };

        const phoneParts = business.phones ? business.phones.split(',').map(s => s.trim()).filter(Boolean) : [];
        const emailParts = business.emails ? business.emails.split(',').map(s => s.trim()).filter(Boolean) : [];

        return (
            <View style={{
                backgroundColor: theme.background,
                paddingHorizontal: 15,
                paddingTop: 15,
                paddingBottom: 20,
            }}>
                {showUnfollowConfirm && (
                    <ModalApp
                        title={strings.unfollow_business}
                        singleButton={false}
                        textAction={strings.continue}
                        textCancel={strings.close}
                        onClose={() => {
                            dispatch(setShowModalApp(false));
                            setShowUnfollowConfirm(false);
                        }}
                        onAction={confirmUnfollow}
                    >
                        <View style={{ alignItems: 'center', paddingVertical: 10 }}>
                            <IconApp pack="FI" name="info" color={theme.gray} size={48} />
                            <YambiText color="gray"
                                text={"Are you sure you want to unsubscribe from this business? You may miss some important updates from the business."}
                                style={{ marginTop: 15, textAlign: 'center' }}
                            />
                        </View>
                    </ModalApp>
                )}
                {/* Business Card */}
                <View style={{
                    backgroundColor: theme.border + '60',
                    borderRadius: 20,
                    padding: 15,
                    paddingBottom: 0,
                    borderWidth: 1,
                    borderColor: theme.border,
                }}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 15 }}>
                        {/* Business Logo */}
                        <Pressable
                            onPress={() => {
                                if (business.logo && business.logo !== "") {
                                    navigation.navigate("ViewPhoto", {
                                        source: media_url + "/business_logos/" + business.logo,
                                    });
                                } else {
                                    navigation.navigate("ViewPhoto", { source: "" });
                                }
                            }}
                            style={({ pressed }) => ({
                                width: 80,
                                height: 80,
                                borderRadius: 40,
                                borderWidth: 2,
                                borderColor: theme.high_color,
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginRight: 15,
                                backgroundColor: theme.background,
                                opacity: pressed ? 0.85 : 1,
                            })}
                        >
                            {business.logo && business.logo !== "" ? (
                                <ExpoImage
                                    style={{ width: 76, height: 76, borderRadius: 38 }}
                                    contentFit="cover"
                                    source={media_url + "/business_logos/" + business.logo}
                                />
                            ) : (
                                <IconApp pack="MT" name="business-center" size={35} color={theme.high_color} />
                            )}
                        </Pressable>

                        {/* Business Name and ID */}
                        <View style={{ flex: 1 }}>
                            <YambiText size="big" text={business.business_name} bold style={{ marginBottom: 5 }} />
                            <Pressable onLongPress={() => copyToClipboard(business._id)}>
                                <YambiText size="small" color="gray" text={strings.id + ": " + business._id} />
                            </Pressable>
                            
                            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8, justifyContent: "space-between" }}>
                            {/* Followers + menu */}
                            {subscriberCount>0?
                            
                            <Pressable
                                onPress={() => navigation.navigate("BusinessSubscribers", { business_id: business_id })}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    paddingVertical: 6,
                                    paddingHorizontal: 10,
                                    backgroundColor: theme.high_color + '15',
                                    borderRadius: 12,
                                    alignSelf: 'flex-start'
                                }}>
                                {/* <IconApp pack="FI" name="users" size={14} color={theme.high_color} styles={{ marginRight: 6 }} /> */}
                                {subscriberCountLoading ? (
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <View style={{ width: 18, height: 18, marginRight: 6 }}>
                                            <AppActivityIndicator size={14} styles={{ height: 18 }} />
                                        </View>
                                        <YambiText size="small" color="gray" text={strings.loading} numberLines={1} style={{ fontSize: 11 }} />
                                    </View>
                                ) : (
                                    <>
                                        <YambiText color="high"
                                            text={subscriberCount.toString()}
                                            bold size="small"
                                            style={{ marginRight: 4 }}
                                        />
                                        <YambiText size="small" color="gray" text={subscriberCount < 2 ? strings.follower.toLowerCase() : strings.followers.toLowerCase()} numberLines={1} />
                                    </>
                                )}
                                <IconApp pack="FI" name="chevron-right" size={12} color={theme.gray} styles={{ marginLeft: 4 }} />
                            </Pressable>:null}

                                <DropdownMenu.Root>
                                    <DropdownMenu.Trigger>
                                        <Pressable
                                            style={{
                                                width: 30,
                                                height: 30,
                                                borderRadius: 12,
                                                alignItems: "center",
                                                justifyContent: "center",
                                                backgroundColor: theme.border + "60",
                                                borderWidth: 1,
                                                borderColor: theme.border,
                                            }}
                                        >
                                            <IconApp pack="FI" name="more-vertical" size={18} color={theme.text} />
                                        </Pressable>
                                    </DropdownMenu.Trigger>
                                    <DropdownMenu.Content>
                                        {!followStatusLoading && followStatusAvailable ? (
                                            <DropdownMenu.Item
                                                key={"follow_unfollow"}
                                                onSelect={() => {
                                                    if (isFollowing) requestUnfollow();
                                                    else handleFollow();
                                                }}
                                            >
                                                <DropdownMenu.ItemTitle>
                                                    {isFollowing ? strings.unfollow_business : strings.follow_business}
                                                </DropdownMenu.ItemTitle>
                                            </DropdownMenu.Item>
                                        ) : null}
                                        <DropdownMenu.Item
                                            key={"business_info"}
                                            onSelect={() => setShowBusinessInfo(true)}
                                        >
                                            <DropdownMenu.ItemTitle>{strings.business_info}</DropdownMenu.ItemTitle>
                                        </DropdownMenu.Item>
                                    </DropdownMenu.Content>
                                </DropdownMenu.Root>
                            </View>
                        </View>
                    </View>

                    {/* Additional Information (Expandable) */}
                    <Animated.View style={{
                        maxHeight: businessInfoHeight.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 1000],
                        }),
                        opacity: businessInfoHeight,
                        overflow: 'hidden',
                    }}>
                        <View style={{
                            marginBottom: 15,
                            paddingTop: 15,
                            borderTopWidth: 1,
                            borderTopColor: theme.border,
                        }}>
                            {/* Description */}
                            {business.description_service && (
                                <View style={{ marginBottom: 12 }}>
                                    <YambiText size="small" color="gray" text={strings.description} style={{ marginBottom: 5 }} />
                                    <YambiText color="gray" text={business.description_service} style={{ lineHeight: 20 }} />
                                </View>
                            )}

                            {/* Address */}
                            {business.business_address && (
                                <View style={{ marginBottom: 12 }}>
                                    <YambiText size="small" color="gray" text={strings.address} style={{ marginBottom: 5 }} />
                                    <YambiText color="gray" text={business.business_address} style={{ lineHeight: 20 }} />
                                    {(business.city || business.state || business.country) && (
                                        <YambiText color="gray" 
                                            text={[business.city, business.state, business.country].filter(Boolean).join(', ')} 
                                            style={{ marginTop: 4, lineHeight: 20 }} 
                                        />
                                    )}
                                </View>
                            )}

                            {/* Phones */}
                            {phoneParts.length > 0 && (
                                <View style={{ marginBottom: 12 }}>
                                    <YambiText size="small" color="gray" text={strings.phones} style={{ marginBottom: 5 }} />
                                    {phoneParts.map((phone, idx) => (
                                        <YambiText color="gray" key={idx} text={phone} style={{ marginTop: 4 }} />
                                    ))}
                                </View>
                            )}

                            {/* Emails */}
                            {emailParts.length > 0 && (
                                <View style={{ marginBottom: 12 }}>
                                    <YambiText size="small" color="gray" text={strings.emails} style={{ marginBottom: 5 }} />
                                    {emailParts.map((email, idx) => (
                                        <YambiText color="gray" key={idx} text={email} style={{ marginTop: 4 }} />
                                    ))}
                                </View>
                            )}

                            {/* Additional Details */}
                            {(business.national_id || business.tax_number || business.website) && (
                                <View style={{ marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.border }}>
                                    {business.national_id && (
                                        <View style={{ marginBottom: 8 }}>
                                            <YambiText size="small" color="gray" text={strings.national_id} style={{ marginBottom: 4 }} />
                                            <YambiText color="gray" text={business.national_id} />
                                        </View>
                                    )}
                                    {business.tax_number && (
                                        <View style={{ marginBottom: 8 }}>
                                            <YambiText size="small" color="gray" text={strings.tax_number} style={{ marginBottom: 4 }} />
                                            <YambiText color="gray" text={business.tax_number} />
                                        </View>
                                    )}
                                    {business.website && (
                                        <View>
                                            <YambiText size="small" color="gray" text={strings.site_web} style={{ marginBottom: 4 }} />
                                            <YambiText color="gray" text={business.website} />
                                        </View>
                                    )}
                                </View>
                            )}
                        </View>
                    </Animated.View>

                    {/* Buttons Row */}
                    <View style={{  flex:1 }}>
                        {/* Ghost Button for More Info */}
                        {showBusinessInfo ? <View style={{ flex: 1, marginRight: 5, marginBottom:10 }}>
                            <ButtonNormal
                                title={showBusinessInfo ? strings.hide : strings.business_info}
                                loadEnabled={false}
                                outline={true}
                                onPress={() => setShowBusinessInfo(!showBusinessInfo)}
                                styles={{ height: 40, flex:1 }}
                            />
                        </View>:null}

                        {/* Follow Button (unfollow lives in menu once followed) */}
                        
                            {!followStatusLoading && followStatusAvailable && !isFollowing ? (<View style={{ flex: 1, marginBottom: 15 }}>
                                <ButtonNormal
                                    title={strings.follow_business}
                                    loadEnabled={false}
                                    normal={true}
                                    onPress={handleFollow}
                                    styles={{ height: 40 }}
                                /></View>
                            ) : null}
                        
                    </View>
                </View>
            </View>
        );
    }

    const renderOutOfStockHeader = () => {
        // Only show in inventory contexts.
        if (!(flag === 2 || flag === 3) || searched_text !== "") return null;

        const outOfStockItems = accessibleActiveItems
            .filter(item => Number(item.items_number_stock) <= 0)
            .sort((a, b) => (a.item_name || "").localeCompare(b.item_name || ""));

        if (outOfStockItems.length === 0) return null;

        const previewCount = 5;
        const itemsToShow = showOutOfStock ? outOfStockItems : outOfStockItems.slice(0, previewCount);

        return (
            <View style={{
                backgroundColor: theme.error + '10',
                borderRadius: 12,
                padding: 15,
                marginBottom: 15,
                borderWidth: 1,
                borderColor: theme.error + '40',
            }}>
                <Pressable
                    onPress={() => setShowOutOfStock(!showOutOfStock)}
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <IconApp pack="FI" name="alert-circle" size={16} color={theme.error} />
                        <YambiText size="small" color="error"
                            text={`${strings.out_of_stock} (${outOfStockItems.length})`}
                            style={{ marginLeft: 8, flex: 1 }}
                        />
                    </View>
                    <IconApp
                        pack="FI"
                        name={showOutOfStock ? "chevron-up" : "chevron-down"}
                        size={16}
                        color={theme.gray}
                    />
                </Pressable>

                <View style={{ marginTop: 12 }}>
                    {itemsToShow.map((i, idx) => (
                        <View
                            key={i._id || idx}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                paddingVertical: 8,
                                borderBottomWidth: idx === itemsToShow.length - 1 ? 0 : 1,
                                borderBottomColor: theme.border,
                            }}
                        >
                            <View style={{ flex: 1, marginRight: 10 }}>
                                <YambiText color="gray" text={i.item_name} style={{ flex: 1 }} />
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <YambiText size="small" color="error"
                                    text={`${Number(i.items_number_stock).toString()} `}
                                    style={{ marginRight: 4 }}
                                />
                                <YambiText size="small" color="gray" text={strings.in_store.toLowerCase()} />
                            </View>
                        </View>
                    ))}
                </View>
            </View>
        );
    };

    const renderLowStockAlertHeader = () => {
        // Only show in inventory contexts.
        if (!(flag === 2 || flag === 3) || searched_text !== "") return null;

        const lowStockItems = accessibleActiveItems
            .filter(item => {
                const qty = Number(item.items_number_stock ?? 0);
                const threshold = Number(item.alert_low_stock ?? 0);
                return qty > 0 && threshold > 0 && qty <= threshold;
            })
            .sort((a, b) => Number(a.items_number_stock) - Number(b.items_number_stock));

        if (lowStockItems.length === 0) return null;

        const previewCount = 5;
        const itemsToShow = showLowStockAlert ? lowStockItems : lowStockItems.slice(0, previewCount);

        return (
            <View style={{
                backgroundColor: theme.error + '10',
                borderRadius: 12,
                padding: 15,
                marginVertical: 15,
                borderWidth: 1,
                marginHorizontal: 15,
                borderColor: theme.error + '40',
            }}>
                <Pressable
                    onPress={() => setShowLowStockAlert(!showLowStockAlert)}
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <IconApp pack="FI" name="alert-circle" size={16} color={theme.error} />
                        <YambiText size="small" color="error"
                            text={`${strings.low_stock_alert} (${lowStockItems.length})`}
                            style={{ marginLeft: 8, flex: 1 }}
                        />
                    </View>
                    <IconApp
                        pack="FI"
                        name={showLowStockAlert ? "chevron-up" : "chevron-down"}
                        size={16}
                        color={theme.gray}
                    />
                </Pressable>

                <View style={{ marginTop: 12 }}>
                    {itemsToShow.map((i, idx) => (
                        <View
                            key={i._id || idx}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                paddingVertical: 8,
                                borderBottomWidth: idx === itemsToShow.length - 1 ? 0 : 1,
                                borderBottomColor: theme.border,
                            }}
                        >
                            <View style={{ flex: 1, marginRight: 10 }}>
                                <YambiText color="gray" text={i.item_name} style={{ flex: 1 }} />
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 0 }}>
                                <Pressable
                                    onPress={() =>
                                        navigation.navigate("RenewStock", {
                                            item_id: String(i._id),
                                            business_id,
                                        })
                                    }
                                    style={({ pressed }) => ({ marginRight: 8, opacity: pressed ? 0.65 : 1 })}
                                >
                                    <YambiText size="small" color="high" text={strings.restock} />
                                </Pressable>
                                <YambiText size="small" color="error"
                                    text={`${Number(i.items_number_stock)} `}
                                    style={{ marginRight: 4 }}
                                />
                                <YambiText size="small" color="gray" text={strings.in_store.toLowerCase()} />
                            </View>
                        </View>
                    ))}
                </View>
            </View>
        );
    };

    const renderInventoryProfitChartHeader = () => {
        if (!(flag === 2 || flag === 3) || searched_text !== "") {
            return null;
        }
        if (hide_inventory_profit_overview) {
            return null;
        }
        if (activeItemsCount < 1) {
            return null;
        }

        const fmtMoney = (n: number, currency: number) =>
            `${renderCurrency(currency, false)} ${Math.round(n).toLocaleString()}`;

        const anyValued = inventoryProfitByCurrency.some(
            (r) => r.totalRevenue > 0 || r.totalCost > 0,
        );

        return (
            <View style={{ marginBottom: 15 }}>
                <View style={{ marginHorizontal: 15, marginVertical: 15 }}>
                    <YambiText bold text={strings.inventory_profit_insights} />
                </View>

                {!anyValued ? (
                    <View style={{ marginHorizontal: 15 }}>
                        <YambiText color="gray"
                            text={strings.inventory_profit_chart_hint}
                            style={{ lineHeight: 20 }}
                        />
                    </View>
                ) : (
                    inventoryProfitByCurrency.map((row) => {
                        const { currency, totalCost, totalRevenue, grossProfit, marginPct, articleCount } = row;
                        const hasValued = totalRevenue > 0 || totalCost > 0;
                        if (!hasValued) {
                            return null;
                        }

                        const showDonut = totalRevenue > 0 && grossProfit >= 0;
                        const pieData = showDonut
                            ? [
                                  {
                                      value: Math.max(0, totalCost),
                                      color: theme.high_color2,
                                      text: strings.inventory_stock_at_cost,
                                  },
                                  {
                                      value: Math.max(0, grossProfit),
                                      color: theme.high_color,
                                      text: strings.inventory_gross_profit,
                                  },
                              ]
                            : [];

                        return (
                            <View
                                key={currency}
                                style={{
                                    backgroundColor: theme.border,
                                    borderRadius: 12,
                                    padding: 15,
                                    marginHorizontal: 15,
                                    marginBottom: 15,
                                    borderWidth: 1,
                                    borderColor: theme.border,
                                }}
                            >
                                <YambiText color="high"
                                    bold
                                    text={renderCurrency(currency, true)}
                                    style={{ marginBottom: 4 }}
                                />
                                <YambiText size="small" color="gray"
                                    text={`${strings.articles} (${articleCount})`}
                                    style={{ marginBottom: 12 }}
                                />

                                {!showDonut ? (
                                    <View>
                                        <YambiText size="small" color="error"
                                            text={strings.inventory_margin_negative_hint}
                                            style={{ marginBottom: 12, lineHeight: 20 }}
                                        />
                                        <YambiText color="gray"
                                            text={strings.inventory_potential_revenue}
                                            style={{ marginBottom: 4 }}
                                        />
                                        <YambiText color="high"
                                            text={fmtMoney(totalRevenue, currency)}
                                            style={{ marginBottom: 10 }}
                                        />
                                        <YambiText color="gray"
                                            text={strings.inventory_stock_at_cost}
                                            style={{ marginBottom: 4 }}
                                        />
                                        <YambiText text={fmtMoney(totalCost, currency)} style={{ marginBottom: 10 }} />
                                        <YambiText color="gray" text={strings.inventory_gross_profit} style={{ marginBottom: 4 }} />
                                        <YambiText text={fmtMoney(grossProfit, currency)} />
                                    </View>
                                ) : (
                                    <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap" }}>
                                        <View style={{ alignItems: "center", marginRight: 12, marginBottom: 8 }}>
                                            <PieChart
                                                data={pieData}
                                                donut
                                                radius={72}
                                                innerRadius={44}
                                                innerCircleColor={theme.background}
                                                showText={false}
                                                centerLabelComponent={() => (
                                                    <View style={{ alignItems: "center", justifyContent: "center" }}>
                                                        <YambiText color="high"
                                                            bold
                                                            text={`${marginPct.toFixed(1)}%`}
                                                            style={{ fontSize: 16 }}
                                                        />
                                                        <YambiText size="small" color="gray"
                                                            text={strings.inventory_overall_margin}
                                                            style={{ marginTop: 2 }}
                                                        />
                                                    </View>
                                                )}
                                            />
                                        </View>
                                        <View style={{ flex: 1, minWidth: 160 }}>
                                            <YambiText color="gray"
                                                text={strings.inventory_potential_revenue}
                                                style={{ marginBottom: 4 }}
                                            />
                                            <YambiText color="high"
                                                text={fmtMoney(totalRevenue, currency)}
                                                style={{ marginBottom: 10 }}
                                            />
                                            <YambiText color="gray"
                                                text={strings.inventory_stock_at_cost}
                                                style={{ marginBottom: 4 }}
                                            />
                                            <YambiText text={fmtMoney(totalCost, currency)} style={{ marginBottom: 10 }} />
                                            <YambiText color="gray"
                                                text={strings.inventory_gross_profit}
                                                style={{ marginBottom: 4 }}
                                            />
                                            <YambiText color="high" text={fmtMoney(grossProfit, currency)} />
                                        </View>
                                    </View>
                                )}
                            </View>
                        );
                    })
                )}
            </View>
        );
    };

    if (from_deep_link_catalog && !catalogReady) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.background }}>
                <ActivityIndicator size="large" color={theme.high_color} />
                <YambiText color="gray" text={strings.loading_content} style={{ marginTop: 16 }} />
            </View>
        );
    }

    if (from_deep_link_catalog && catalogError) {
        return (
            <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 24, backgroundColor: theme.background }}>
                <YambiText color="gray" text={strings.business_not_found} style={{ textAlign: "center", marginBottom: 20 }} />
                <Pressable onPress={() => RNRestart.restart()} style={{ alignSelf: "center", paddingVertical: 12 }}>
                    <YambiText color="high" text={strings.home} />
                </Pressable>
            </View>
        );
    }

    if (business === null) {
        return null;
    }

    return (
        <View style={{
            flex: 1,
            justifyContent: 'center',
            backgroundColor: theme.background,
            borderColor: theme.border,
            borderTopWidth: 1,
            paddingTop: 0
        }}>

            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: theme.border,
                marginHorizontal: 15,
                marginTop: 10,
                marginBottom: 10,
                borderRadius: 12,
                paddingHorizontal: 15,
                // paddingVertical: 8,
            }}>
                <IconApp pack="FI" name="search" color={theme.gray} size={18} />
                <TextInput
                    placeholderTextColor={theme.gray}
                    style={{
                        color: theme.text,
                        paddingLeft: 12,
                        paddingRight: 12,
                        height: 40,
                        flex: 1,
                        fontSize: 15
                    }}
                    value={searched_text}
                    placeholder={strings.search_item}
                    onChangeText={SearchItem}
                />
                {searched_text !== "" && (
                    <Pressable
                        onPress={() => SearchItem("")}
                        style={{
                            height: 32,
                            width: 32,
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginRight: 8
                        }}>
                        <IconApp pack="FI" name="x" size={18} color={theme.gray} />
                    </Pressable>
                )}

                {flag !== 1 && (
                    <Pressable
                        onPress={() => business_items_filter === "1" || business_items_filter === "" ? dispatch(setBusinessItemsFilter("0")) : dispatch(setBusinessItemsFilter("1"))}
                        style={{
                            borderColor: theme.border,
                            borderLeftWidth: 1,
                            paddingLeft: 12,
                            height: 32,
                            justifyContent: 'center',
                            alignItems: 'center',
                            flexDirection: 'row'
                        }}>
                        <IconApp pack="FI" name={business_items_filter === "0" ? "arrow-down" : "arrow-up"} size={18} color={theme.high_color} />
                        <YambiText color="high" text={strings.filter} style={{ marginLeft: 6 }} />
                    </Pressable>
                )}
            </View>

            {showUserError && (
                <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowUserError(false) }} singleButton title={strings.error}>
                    <View style={{ alignItems: 'center', paddingVertical: 10 }}>
                        <IconApp pack="FI" name="alert-circle" color={theme.error} size={48} />
                        <YambiText color="gray" text={strings.user_add_sale_error} style={{ marginTop: 15, textAlign: 'center' }} />
                    </View>
                </ModalApp>
            )}

            {showSaleSuccess && (
                <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowSaleSuccess(false) }} singleButton title={strings.success}>
                    <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                        <IconApp pack="FA" name="check-circle" color={theme.success} size={60} />
                        {/* <YambiText text={strings.success} bold style={{ marginTop: 15, fontSize: 16 }} /> */}
                    </View>
                </ModalApp>)}

            {showBusinessInactiveSellError && (
                <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowBusinessInactiveSellError(false) }} singleButton title={strings.error}>
                    <View style={{ paddingVertical: 10 }}>
                        <View style={{
                            backgroundColor: theme.error + '15',
                            padding: 15,
                            borderRadius: 12,
                            marginBottom: 20,
                            flexDirection: 'row',
                            alignItems: 'flex-start',
                        }}>
                            <IconApp pack="FI" name="alert-circle" color={theme.error} size={20} />
                            <YambiText color="gray" text={strings.active_subscription_to_sell} style={{ marginLeft: 10, flex: 1 }} />
                        </View>

                        <ButtonNormal title={strings.renew_my_subscription} loadEnabled={false} normal={true} onPress={() => {
                            if (oo && oo.user_active === 1 && oo.level) {
                                dispatch(setShowModalApp(false));
                                setShowBusinessInactiveSellError(false);
                                navigation.navigate("ContactUs", { flag: 1 });
                            }
                        }} styles={{}} />
                    </View>
                </ModalApp>
            )}

            {showSaleFrame ?
                <ModalApp onCancel={CancelSale} onAction={ConfirmSale} onClose={CancelSale} singleButton={false} textAction={strings.confirm} title={strings.new_sale_operation}>
                    <View style={{
                        width: '100%',
                    }}>
                        {/* Item Header */}
                        <View style={{
                            backgroundColor: theme.border,
                            borderRadius: 12,
                            padding: 15,
                            marginBottom: 15,
                            flexDirection: 'row',
                            alignItems: 'center',
                        }}>
                            <View style={{ flex: 1 }}>
                                <YambiText text={itemToSell.item_name} bold style={{ marginBottom: 8 }} />
                                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <View style={{
                                        backgroundColor: theme.background,
                                        paddingHorizontal: 8,
                                        paddingVertical: 4,
                                        borderRadius: 8,
                                        marginRight: 8,
                                        marginBottom: 4,
                                    }}>
                                        <YambiText size="small" color="high" text={itemToSell.items_number_stock.toString() + " " + strings.in_store.toLowerCase()} />
                                    </View>
                                    {itemToSell.items_number_warehouse > 0 && (
                                        <View style={{
                                            backgroundColor: theme.background,
                                            paddingHorizontal: 8,
                                            paddingVertical: 4,
                                            borderRadius: 8,
                                            marginBottom: 4,
                                        }}>
                                            <YambiText size="small" color="high" text={itemToSell.items_number_warehouse.toString() + " " + strings.in_warehouse.toLowerCase()} />
                                        </View>
                                    )}
                                </View>
                            </View>

                            <Pressable
                                onPress={SetCash}
                                style={{
                                    height: 36,
                                    width: 36,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    backgroundColor: theme.background,
                                    borderRadius: 8,
                                }}>
                                <IconApp color={theme.high_color} name="maximize-2" size={18} pack="FI" />
                            </Pressable>
                        </View>

                        {/* Price Section */}
                        <View style={{ marginBottom: 15 }}>
                            <View style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 10
                            }}>
                                <YambiText size="small" color="gray" text={strings.price} />

                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Pressable
                                        onPress={SetCash}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            marginRight: 15,
                                            backgroundColor: !type_sale ? theme.high_color + '20' : 'transparent',
                                            paddingHorizontal: 10,
                                            paddingVertical: 6,
                                            borderRadius: 8,
                                        }}>
                                        <SwitchApp value={!type_sale} small onPress={SetCash} />
                                        <YambiText text={strings.cash} style={{ marginLeft: 6 }} />
                                    </Pressable>

                                    <Pressable
                                        onPress={Detail}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            backgroundColor: !wholesale ? theme.high_color + '20' : 'transparent',
                                            paddingHorizontal: 10,
                                            paddingVertical: 6,
                                            borderRadius: 8,
                                        }}>
                                        <SwitchApp value={!wholesale} small onPress={Detail} />
                                        <YambiText text={strings.detail} style={{ marginLeft: 6 }} />
                                    </Pressable>
                                </View>
                            </View>
                            <TextInput
                                placeholderTextColor={theme.gray}
                                maxLength={20}
                                keyboardType="numeric"
                                style={{
                                    color: theme.text,
                                    backgroundColor: theme.border,
                                    paddingHorizontal: 15,
                                    paddingVertical: 12,
                                    minHeight: 48,
                                    borderRadius: 12,
                                    fontSize: 16,
                                }}
                                value={itemToSellPrice}
                                onChangeText={text => setItemToSellPrice(text)}
                            />
                        </View>

                        {/* Quantity Section */}
                        <View>
                            <View style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 10
                            }}>
                                {error_number() ?
                                    <YambiText size="small" color="gray" text={strings.quantity} /> :
                                    <View style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        backgroundColor: theme.error + '20',
                                        paddingHorizontal: 8,
                                        paddingVertical: 4,
                                        borderRadius: 8,
                                    }}>
                                        <IconApp pack="FI" name="alert-circle" size={14} color={theme.error} />
                                        <YambiText size="small" color="error" text={strings.quantity_unavailable} style={{ marginLeft: 5 }} />
                                    </View>
                                }
                            </View>
                            <TextInput
                                placeholderTextColor={theme.gray}
                                maxLength={20}
                                keyboardType="numeric"
                                style={{
                                    color: theme.text,
                                    backgroundColor: theme.border,
                                    paddingHorizontal: 15,
                                    paddingVertical: 12,
                                    minHeight: 48,
                                    borderRadius: 12,
                                    fontSize: 16,
                                    borderWidth: error_number() ? 0 : 2,
                                    borderColor: error_number() ? 'transparent' : theme.error,
                                }}
                                value={numberItemToSell}
                                onChangeText={text => setNumberItemToSell(text)}
                            />
                        </View>
                    </View>
                </ModalApp> : null}

            <View style={{
                borderBottomWidth: 1,
                borderColor: theme.border,
            }} />

            <FlashList
                data={IIItems as never}
                keyboardShouldPersistTaps="handled"
                estimatedItemSize={500}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onPullToRefresh}
                        tintColor={theme.high_color}
                        colors={[theme.high_color]}
                    />
                }
                ListHeaderComponent={() => (
                    <View>
                        {renderBusinessHeader()}
                        {renderLowStockAlertHeader()}
                        {renderInventoryProfitChartHeader()}
                        {renderOutOfStockHeader()}
                    </View>
                )}
                renderItem={({ item, index }: { item: TItem, index: number }) => (
                    <BusinessItemsList
                        index={index}
                        item={item}
                        business_id={business_id}
                        onSelectItem={SelectItem}
                        flag={flag}
                        can_upload_images={can_upload_images}
                        locked={!accessibleItemIds.includes(item._id)}
                    />
                )}
            />
        </View>
    )
}

export default BusinessItemss;
