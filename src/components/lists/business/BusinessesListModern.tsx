import { Pressable, View, Platform, ScrollView, Animated, RefreshControl, Alert } from "react-native";
import { TBusiness, TBusinessSubscription, TSellsPoint } from "../../../types/types";
import { useAppDispatch, useAppSelector } from "../../../store/app/hooks";
import { useState, useEffect, useRef, useMemo } from 'react';
import { YambiText } from "../../app/Text";
import { IconApp } from "../../app/IconApp";
import { useQuery } from "@realm/react";
import { BusinessItemsSale, BusinessUsers, UserBusinessArticles, UserSellsPoints } from "../../../store/database/Models";
import { copyToClipboard, getDateFormat, getHourFormat, remote_host_server, renderCurrency, remote_host, media_url } from "../../../../GlobalVariables";
import { strings } from "../../../lang/lang";
import * as RootNavigation from './../../../services/Navigation_ref';
import ModalApp from "../../app/ModalApp";
import { setShowModalApp } from "../../../store/reducers/appSlice";
import { Image as ExpoImage } from 'expo-image';
import * as DropdownMenu from 'zeego/dropdown-menu';
import axios from "axios";
import SalesCharts from "../../../pages/business/SalesCharts";

const ClockDisplay = ({ lang }: { lang: any }) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <>
            <YambiText size="big" bold color="gray" text={getDateFormat(currentTime.toISOString(), lang)} style={{ marginBottom: 8 }} />
            <YambiText size="big" bold color="high" text={getHourFormat(currentTime.toISOString(), lang, 1)} style={{ fontSize: 36 }} />
        </>
    );
};

interface BusinessesListModernProps {
    businesses: TBusiness[];
    currentBusinessIndex: number;
    onBusinessSwitch: (index: number) => void;
    isAdmin?: boolean;
    refreshing?: boolean;
    onRefresh?: () => void;
}

const BusinessesListModern = ({ businesses, currentBusinessIndex, onBusinessSwitch, isAdmin = false, refreshing = false, onRefresh }: BusinessesListModernProps) => {
    const app_theme = useAppSelector(state => state.app_theme);
    const user_data = useAppSelector(state => state.user_data);
    const [showUserError, setShowUserError] = useState(false);
    const [showSwitchBusiness, setShowSwitchBusiness] = useState(false);
    const [showPOSSelector, setShowPOSSelector] = useState(false);
    const [showPOSList, setShowPOSList] = useState(false);
    const [showBusinessInfo, setShowBusinessInfo] = useState(false);
    const [showLowStock, setShowLowStock] = useState(false);
    const [showOutOfStock, setShowOutOfStock] = useState(false);
    const businessInfoHeight = useRef(new Animated.Value(0)).current;
    const lang = useAppSelector(state => state.persisted_app.langApp);
    const dispatch = useAppDispatch();
    const [isFollowing, setIsFollowing] = useState<boolean>(false);
    const [subscriberCount, setSubscriberCount] = useState<number>(0);
    const persistedSubscriptions = useAppSelector(state => state.persisted_app.business_subscriptions || []);

    const item = businesses[currentBusinessIndex];
    const recentSalesStartDate = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() - 6);
        d.setHours(0, 0, 0, 0);
        return d;
    }, [item?._id]);

    const recentSalesEndDate = useMemo(() => {
        const d = new Date();
        d.setHours(23, 59, 59, 999);
        return d;
    }, [item?._id]);

    // Helper function to check if business is expired
    // "Mwanga Business" always remains active
    const isBusinessExpired = (business: TBusiness) => {
        if (!business) return false;
        
        // "Mwanga Business" always remains active
        if (business.business_name === "Mwanga Business") {
            return false;
        }
        
        // Check if valid_until date has passed
        if (!business.valid_until || business.valid_until === "") {
            return false;
        }
        
        try {
            const validUntilDate = new Date(business.valid_until);
            const now = new Date();
            return validUntilDate < now;
        } catch (error) {
            console.error("Error parsing valid_until date:", error);
            return false;
        }
    };

    const businessExpired = isBusinessExpired(item);

    // Helper function to calculate remaining days until expiration
    const getRemainingDays = (business: TBusiness): number | null => {
        if (!business) return null;
        
        // "Mwanga Business" always remains active
        if (business.business_name === "Mwanga Business") {
            return null;
        }
        
        // Check if valid_until date exists
        if (!business.valid_until || business.valid_until === "") {
            return null;
        }
        
        try {
            const validUntilDate = new Date(business.valid_until);
            const now = new Date();
            const diffTime = validUntilDate.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays;
        } catch (error) {
            console.error("Error parsing valid_until date:", error);
            return null;
        }
    };

    // Check if warning should be shown (5 days or less remaining, but not expired)
    const shouldShowWarning = (): boolean => {
        const remainingDays = getRemainingDays(item);
        if (remainingDays === null) return false;
        // Show warning only if subscription is active and has 5 days or less remaining
        return remainingDays >= 0 && remainingDays <= 5;
    };

    const remainingDays = getRemainingDays(item);

    const sells_points = useQuery(
        UserSellsPoints, sells_points => {
            return sells_points.filtered('business_id == $0', item._id)
        }, [item._id]);

    const bs = useQuery(
        BusinessItemsSale, ss => {
            return ss.filtered('sale_active == $0 && business_id == $1', 1, item._id);
        }, [item._id]);

    const bu = useQuery(
        BusinessUsers, ss => {
            return ss.filtered('business_id == $0 && user_active != $1', item._id, 2);
        }, [item._id]);

    const bitems = useQuery(
        UserBusinessArticles, ss => {
            return ss.filtered('item_active == $0 && business_id == $1', 1, item._id);
        }, [item._id]);

    const lowStockItems = useMemo(() => {
        try {
            const arr = Array.from(bitems as any);
            return arr
                .filter((i: any) => {
                    const qty = Number(i.items_number_stock ?? 0);
                    const threshold = Number(i.alert_low_stock ?? 0);
                    // Consider "low stock" as below/at the threshold but still > 0 (out-of-stock is handled in inventory).
                    return qty > 0 && threshold > 0 && qty <= threshold;
                })
                .sort((a: any, b: any) => Number(a.items_number_stock) - Number(b.items_number_stock));
        } catch {
            return [];
        }
    }, [bitems]);

    const outOfStockItems = useMemo(() => {
        try {
            const arr = Array.from(bitems as any);
            return arr
                .filter((i: any) => Number(i.items_number_stock ?? 0) <= 0)
                .sort((a: any, b: any) => (a.item_name || "").localeCompare(b.item_name || ""));
        } catch {
            return [];
        }
    }, [bitems]);



    // Animate business info expand/collapse
    useEffect(() => {
        Animated.timing(businessInfoHeight, {
            toValue: showBusinessInfo ? 1 : 0,
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, [showBusinessInfo]);

    // Check follow status and get subscriber count when component mounts or business changes
    useEffect(() => {
        if (item?._id && user_data?.phone_number) {
            checkFollowStatus();
            fetchSubscriberCount();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [item?._id, user_data?.phone_number]);

    // Reset expanded low-stock state when switching businesses.
    useEffect(() => {
        setShowLowStock(false);
    }, [item?._id]);

    const checkFollowStatus = async () => {
        try {
            const res = await axios.post(remote_host + "/yambi/API/check_subscription", {
                business_id: item._id,
                phone_number: user_data.phone_number
            });

            if (res.data.success === "1") {
                setIsFollowing(res.data.is_following || false);
            }
        } catch { }
    };

    const fetchSubscriberCount = async () => {
        try {
            const res = await axios.post(remote_host + "/yambi/API/get_subscriptions", {
                business_id: item._id
            });

            if (res.data.success === "1") {
                setSubscriberCount(res.data.count || 0);
            }
        } catch { }
    };

    const handleFollow = async () => {
        try {
            const res = await axios.post(remote_host + "/yambi/API/add_subscription", {
                business_id: item._id,
                phone_number: user_data.phone_number
            });

            if (res.data.success === "1") {
                setIsFollowing(res.data.subscription_active === 1);
                // Refresh subscriber count
                fetchSubscriberCount();
            }
        } catch { }
    };

    const PLAN_MAX_ARTICLES: Record<number, number> = {
        0: 15,
        1: 150,
        2: 400,
        3: 3000,
    };
    const PLAN_MAX_POINTS_OF_SALE: Record<number, number> = {
        0: 1,
        1: 2,
        2: 5,
        3: 10,
    };

    const activeSuccessfulLocalSubscription = useMemo(() => {
        const now = new Date();
        return (persistedSubscriptions as TBusinessSubscription[])
            .filter((sub) => {
                if (sub.business_id !== item?._id) return false;
                if (Number(sub.payment_status ?? 0) !== 1) return false;
                if (!sub.subscription_end_date) return false;
                const endDate = new Date(sub.subscription_end_date);
                if (Number.isNaN(endDate.getTime())) return false;
                return endDate >= now;
            })
            .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())[0];
    }, [persistedSubscriptions, item?._id]);

    const maxArticlesAllowed = useMemo(() => {
        const plan = Number(activeSuccessfulLocalSubscription?.subscription_plan ?? 0);
        return PLAN_MAX_ARTICLES[plan] ?? PLAN_MAX_ARTICLES[0];
    }, [activeSuccessfulLocalSubscription]);
    const maxPointsAllowed = useMemo(() => {
        const plan = Number(activeSuccessfulLocalSubscription?.subscription_plan ?? 0);
        return PLAN_MAX_POINTS_OF_SALE[plan] ?? PLAN_MAX_POINTS_OF_SALE[0];
    }, [activeSuccessfulLocalSubscription]);
    const accessibleSalesPointIds = useMemo(() => {
        return Array.from(sells_points as any)
            .slice(0, maxPointsAllowed)
            .map((pos: any) => pos._id);
    }, [sells_points, maxPointsAllowed]);

    // Business-level image access is always allowed from this screen.
    const canUploadImages = true;

    const uuser = useQuery(
        BusinessUsers, bss => {
            return bss.filtered('user == $0 && business_id == $1 && user_active == $2', user_data.phone_number, item._id, 1)
        }, [item._id]);

    const oo = uuser.find(element => element.user === user_data.phone_number);

    const conditionGoUsers = () => {
        // Admin has full access
        if (isAdmin) return true;
        
        if (oo !== undefined) {
            if ((oo.user_active === 1 && oo.level === 1) || (oo.user_active === 1 && oo.level === 2)) {
                return true;
            } else {
                dispatch(setShowModalApp(true));
                setShowUserError(true);
            }
        }
        else {
            dispatch(setShowModalApp(true));
            setShowUserError(true);
        }
        return false;
    }

    const GoSalesPoint = (pos: TSellsPoint) => {
        // Admin has full access
        if (isAdmin) {
            RootNavigation.navigate("BusinessSales", { business_id: "", sales_point_id: pos._id, item_id: "" });
            return;
        }
        
        if (oo !== null && oo !== undefined) {
            if (oo.user_active === 1 && oo.level === 1 || (oo.user_active === 1 && oo.sales_point_id === pos._id && oo.level === 2) || (oo.user_active === 1 && oo.sales_point_id === pos._id && oo.level === 3)) {
                RootNavigation.navigate("BusinessSales", { business_id: "", sales_point_id: pos._id, item_id: "" });
            } else {
                dispatch(setShowModalApp(true));
                setShowUserError(true);
            }
        }
    }

    const conditionEditBusiness = () => {
        // Admin has full access
        if (isAdmin) return true;
        
        if (oo !== undefined) {
            if ((oo.user_active === 1 && oo.level === 1)) {
                return true;
            } else {
                dispatch(setShowModalApp(true));
                setShowUserError(true);
            }
        } else {
            dispatch(setShowModalApp(true));
            setShowUserError(true);
        }
        return false;
    }

    const handleAddItemPress = () => {
        if (!conditionGoUsers()) {
            return;
        }

        const maxArticles = maxArticlesAllowed;
        const currentCount = bitems.length;

        if (currentCount >= maxArticles) {
            Alert.alert(
                strings.error,
                strings.max_items_reached,
                [
                    {
                        text: strings.cancel,
                        style: 'cancel'
                    },
                    {
                        text: strings.view_plans,
                        onPress: () => {
                            RootNavigation.navigate("AddBusinessSubscription", { business_id: item._id });
                        }
                    }
                ]
            );
            return;
        }

        RootNavigation.navigate("NewBusinessItem", {
            business_id: item._id,
            can_upload_images: canUploadImages
        });
    };

    const ViewPhoto = () => {
        if (item.logo !== "") {
            RootNavigation.navigate("ViewPhoto", { source: media_url + "/business_logos/" + item.logo });
        } else {
            RootNavigation.navigate("ViewPhoto", { source: "" });
        }
    }

    const MenuCard = ({ icon, title, onPress, iconPack = "FI", prominent = false, color }: { icon: string, title: string, onPress: () => void, iconPack?: string, prominent?: boolean, color?: string }) => (
        <Pressable
            onPress={onPress}
            style={{
                flex: 1,
                backgroundColor: prominent ? app_theme.colors.badge_background_color : app_theme.colors.border,
                // backgroundColor: prominent ? app_theme.colors.badge_background_color : color+"30",
                borderRadius: 16,
                padding: 20,
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 100,
                margin: 5,
                // borderWidth: 1,
                // borderColor: prominent ? app_theme.colors.high_color : (color || app_theme.colors.border),
            }}>
            <IconApp pack={iconPack} name={icon} size={28} color={prominent ? app_theme.colors.badge_color : (color || app_theme.colors.high_color)} />
            <YambiText
                text={title}
                bold
                color={prominent ? "badge" : "default"}
                style={{ marginTop: 10, textAlign: 'center' }}
            />
        </Pressable>
    );

    // Skip user relationship check for admin users
    if (!isAdmin && !oo) return null;

    return (
        <ScrollView 
            style={{ flex: 1 }}
            refreshControl={
                onRefresh ? (
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={app_theme.colors.high_color}
                        colors={[app_theme.colors.high_color]}
                    />
                ) : undefined
            }
        >
            {showUserError ?
                <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowUserError(false) }} singleButton title={strings.error}>
                    <YambiText color="gray" text={strings.business_level_error} />
                </ModalApp> : null}

            {showSwitchBusiness ?
                <ModalApp
                    onClose={() => { dispatch(setShowModalApp(false)); setShowSwitchBusiness(false) }}
                    singleButton
                    title={strings.switch_business}>
                    <ScrollView style={{ maxHeight: 400 }}>
                        {businesses.map((business, index) => (
                            <Pressable
                                key={business._id}
                                onPress={() => {
                                    onBusinessSwitch(index);
                                    dispatch(setShowModalApp(false));
                                    setShowSwitchBusiness(false);
                                }}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    paddingVertical: 15,
                                    paddingHorizontal: 10,
                                    backgroundColor: index === currentBusinessIndex ? app_theme.colors.high_color + "20" : 'transparent',
                                    borderRadius: 8,
                                    marginVertical: 5,
                                }}>
                                <View style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 20,
                                    borderWidth: 1,
                                    borderColor: app_theme.colors.border,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginRight: 15,
                                }}>
                                    {business.logo === "" ?
                                        <IconApp pack="MT" name="business-center" size={20} color={app_theme.colors.text} />
                                        :
                                        <ExpoImage
                                            style={{ width: 40, height: 40, borderRadius: 20 }}
                                            contentFit="cover"
                                            source={media_url + "/business_logos/" + business.logo} />}
                                </View>
                                <View style={{ flex: 1 }}>
                                    <YambiText text={business.business_name} bold />
                                    <YambiText size="small" color="gray" text={business._id} />
                                </View>
                                {index === currentBusinessIndex ?
                                    <IconApp pack="FA" name="check-circle" size={20} color={app_theme.colors.high_color} /> : null}
                            </Pressable>
                        ))}
                    </ScrollView>
                </ModalApp> : null}

            {showPOSSelector ?
                <ModalApp paddings={false}
                    onClose={() => { dispatch(setShowModalApp(false)); setShowPOSSelector(false) }}
                    singleButton
                    title={strings.select_pos_to_sell}>
                    <ScrollView style={{ maxHeight: 400, paddingHorizontal: 15 }}>
                        {sells_points.length === 0 ?
                            <View style={{ padding: 20, alignItems: 'center' }}>
                                <YambiText color="gray" text={strings.no_workspace} style={{ textAlign: 'center' }} />
                            </View>
                            :
                            sells_points.map((pos) => {
                                const isLocked = !accessibleSalesPointIds.includes(pos._id);
                                return (
                                <Pressable
                                    key={pos._id}
                                    disabled={isLocked}
                                    onPress={() => {
                                        if (isLocked) {
                                            RootNavigation.navigate("AddBusinessSubscription", { business_id: item._id });
                                            return;
                                        }
                                        dispatch(setShowModalApp(false));
                                        setShowPOSSelector(false);
                                        RootNavigation.navigate("BusinessItems", { business_id: pos.business_id, sales_point_id: pos._id, flag: 0 });
                                    }}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        paddingVertical: 15,
                                        paddingHorizontal: 10,
                                        borderRadius: 8,
                                        marginVertical: 5,
                                        backgroundColor: app_theme.colors.border,
                                        opacity: isLocked ? 0.65 : 1,
                                    }}>
                                    <IconApp pack="MT" name="store" size={24} color={app_theme.colors.high_color} styles={{ marginRight: 15 }} />
                                    <View style={{ flex: 1 }}>
                                        <YambiText text={pos.sells_point_name} bold />
                                        <YambiText size="small" color="gray" text={isLocked ? strings.pos_limit_requires_subscription : pos.sells_point_address} />
                                    </View>
                                    {isLocked
                                        ? <IconApp pack="FI" name="lock" size={18} color={app_theme.colors.error} />
                                        : <IconApp pack="FI" name="chevron-right" size={20} color={app_theme.colors.text} />}
                                </Pressable>
                                );
                            })}
                    </ScrollView>
                </ModalApp> : null}

            {showPOSList ?
                <ModalApp paddings={false}
                    onClose={() => { dispatch(setShowModalApp(false)); setShowPOSList(false) }}
                    singleButton
                    title={strings.sells_points}>
                    <ScrollView style={{ maxHeight: 400, paddingHorizontal: 15 }}>
                        {sells_points.length === 0 ?
                            <View style={{ padding: 20, alignItems: 'center' }}>
                                <YambiText color="gray" text={strings.no_workspace} style={{ textAlign: 'center' }} />
                            </View>
                            :
                            sells_points.map((pos) => {
                                const canAccessPOS = isAdmin || (oo !== null && oo !== undefined && (
                                    oo.user_active === 1 && oo.level === 1 ||
                                    (oo.user_active === 1 && oo.sales_point_id === pos._id && oo.level === 2) ||
                                    (oo.user_active === 1 && oo.sales_point_id === pos._id && oo.level === 3)
                                ));

                                if (!canAccessPOS) return null;
                                const isLocked = !accessibleSalesPointIds.includes(pos._id);
                                return (
                                    <Pressable
                                        key={pos._id}
                                        disabled={isLocked}
                                        onPress={() => {
                                            if (isLocked) {
                                                RootNavigation.navigate("AddBusinessSubscription", { business_id: item._id });
                                                return;
                                            }
                                            dispatch(setShowModalApp(false));
                                            setShowPOSList(false);
                                            GoSalesPoint(pos);
                                        }}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            paddingVertical: 15,
                                            paddingHorizontal: 10,
                                            borderRadius: 8,
                                            marginVertical: 5,
                                            backgroundColor: app_theme.colors.border,
                                            opacity: isLocked ? 0.65 : 1,
                                        }}>
                                        <IconApp pack="MT" name="store" size={24} color={app_theme.colors.high_color} styles={{ marginRight: 15 }} />
                                        <View style={{ flex: 1 }}>
                                            <YambiText text={pos.sells_point_name} bold />
                                            <YambiText size="small" color="gray" text={isLocked ? strings.pos_limit_requires_subscription : pos.sells_point_address} />
                                        </View>
                                        {isLocked
                                            ? <IconApp pack="FI" name="lock" size={18} color={app_theme.colors.error} />
                                            : <IconApp pack="FI" name="chevron-right" size={20} color={app_theme.colors.text} />}
                                    </Pressable>
                                );
                            })}
                    </ScrollView>
                </ModalApp> : null}

            <View style={{ padding: 15 }}>
                {/* Header Section */}
                {businesses.length > 1 ?
                    <View style={{ marginBottom: 20 }}>
                        <Pressable
                            onPress={() => {
                                dispatch(setShowModalApp(true));
                                setShowSwitchBusiness(true);
                            }}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: app_theme.colors.border,
                                paddingHorizontal: 12,
                                paddingVertical: 8,
                                borderRadius: 20,
                                alignSelf: 'flex-start',
                            }}>
                            <IconApp pack="FI" name="grid" size={16} color={app_theme.colors.high_color} />
                            <YambiText size="small" color="high" text={strings.switch_business} style={{ marginLeft: 8 }} />
                        </Pressable>
                    </View> : null}

                {/* Business Card */}
                <View style={{
                    borderRadius: 20,
                    marginBottom: 25,
                    position: 'relative',
                }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 }}>
                        {/* Business Logo and Info */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 }}>
                            <Pressable onPress={ViewPhoto} style={{
                                width: 80,
                                height: 80,
                                borderRadius: 40,
                                borderWidth: 2,
                                borderColor: app_theme.colors.high_color,
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginRight: 15,
                            }}>
                                {item.logo === "" ?
                                    <IconApp pack="MT" name="business-center" size={35} color={app_theme.colors.high_color} />
                                    :
                                    <ExpoImage
                                        style={{ width: 76, height: 76, borderRadius: 38 }}
                                        contentFit="cover"
                                        source={media_url + "/business_logos/" + item.logo} />}
                            </Pressable>

                            <View style={{ flex: 1 }}>
                                <YambiText size="big" text={item.business_name} bold style={{ marginBottom: 5 }} />
                                <Pressable onLongPress={() => copyToClipboard(item._id)}>
                                    <YambiText size="small" color="gray" text={strings.id + ": " + item._id} />
                                </Pressable>
                                
                                {/* Subscription Warning Message */}
                                {shouldShowWarning() && (
                                    <View style={{
                                        backgroundColor: app_theme.colors.high_color2 + '20',
                                        borderRadius: 8,
                                        padding: 12,
                                        marginTop: 10,
                                        borderWidth: 1,
                                        borderColor: app_theme.colors.high_color2,
                                    }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 }}>
                                            <IconApp pack="FA" name="warning" size={16} color={app_theme.colors.high_color2} styles={{ marginRight: 8, marginTop: 2 }} />
                                            <View style={{ flex: 1 }}>
                                                {remainingDays !== null && (
                                                    <YambiText
                                                        size="small"
                                                        color="high2"
                                                        text={strings.subscription_warning_message.replace('{days}', remainingDays.toString())}
                                                    />
                                                )}
                                            </View>
                                        </View>
                                        <Pressable
                                            onPress={() => {
                                                if (conditionEditBusiness()) {
                                                    RootNavigation.navigate("AddBusinessSubscription", { business_id: item._id });
                                                }
                                            }}
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                paddingHorizontal: 12,
                                                paddingVertical: 8,
                                                borderRadius: 6,
                                                backgroundColor: app_theme.colors.high_color2,
                                            }}>
                                            <IconApp pack="FI" name="refresh-cw" size={14} color="#FFFFFF" styles={{ marginRight: 6 }} />
                                            <YambiText
                                                bold
                                                color="white"
                                                text={strings.renew_my_subscription}
                                                style={{ fontSize: 12 }}
                                            />
                                        </Pressable>
                                    </View>
                                )}
                                
                                {/* Subscriber Count */}
                                {subscriberCount > 0 && (
                                    <Pressable
                                        onPress={() => {
                                            RootNavigation.navigate("BusinessSubscribers", { business_id: item._id });
                                        }}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            marginTop: 8,
                                            paddingVertical: 6,
                                            paddingHorizontal: 10,
                                            backgroundColor: app_theme.colors.high_color + '15',
                                            borderRadius: 12,
                                            alignSelf: 'flex-start',
                                        }}>
                                        <IconApp pack="FI" name="users" size={14} color={app_theme.colors.high_color} styles={{ marginRight: 6 }} />
                                        <YambiText
                                            color="high"
                                            text={subscriberCount.toString()}
                                             size="small"
                                            style={{ marginRight: 4 }}
                                        />
                                        <YambiText size="small" color="gray" text={subscriberCount < 2 ? strings.follower.toLowerCase() : strings.followers.toLowerCase()} />
                                        <IconApp pack="FI" name="chevron-right" size={12} color={app_theme.colors.gray} styles={{ marginLeft: 4 }} />
                                    </Pressable>
                                )}
                                
                                {!businessExpired ?
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
                                        <IconApp pack="FA" name="check-circle" size={14} color={app_theme.colors.success} />
                                        <YambiText size="small" color="high" text={strings.active_subscription} style={{ marginLeft: 5 }} />
                                    </View>
                                    :
                                    <View style={{ marginTop: 5 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                            <IconApp pack="FA" name="warning" size={14} color={app_theme.colors.error} />
                                            <YambiText size="small" color="error" text={strings.expired_subscription} style={{ marginLeft: 5 }} />
                                        </View>
                                        <Pressable
                                            onPress={() => {
                                                if (conditionEditBusiness()) {
                                                    RootNavigation.navigate("AddBusinessSubscription", { business_id: item._id });
                                                }
                                            }}
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                paddingHorizontal: 12,
                                                paddingVertical: 8,
                                                borderRadius: 8,
                                                borderWidth: 1,
                                                borderColor: app_theme.colors.high_color,
                                                backgroundColor: 'transparent',
                                                alignSelf: 'flex-start',
                                            }}>
                                            <IconApp pack="FI" name="refresh-cw" size={14} color={app_theme.colors.high_color} />
                                            <YambiText size="small" color="high" text={strings.renew_my_subscription} style={{ marginLeft: 6 }} />
                                        </Pressable>
                                    </View>}
                            </View>
                        </View>

                        {/* 3-Dot Menu */}
                        <View style={{  marginTop: 5 }}>
                            <DropdownMenu.Root>
                                <DropdownMenu.Trigger>
                                        <Pressable
                                            style={{
                                                width: 30,
                                                height: 30,
                                                borderRadius: 12,
                                                alignItems: "center",
                                                justifyContent: "center",
                                                backgroundColor: app_theme.colors.border + "80",
                                                borderWidth: 1,
                                                borderColor: app_theme.colors.border,
                                            }}
                                        ><IconApp pack="FI" name="more-vertical" size={20} color={app_theme.colors.text} /></Pressable>
                                </DropdownMenu.Trigger>
                                <DropdownMenu.Content>
                                    <DropdownMenu.Item
                                        key="edit"
                                        onSelect={() => {
                                            if (conditionEditBusiness()) {
                                                RootNavigation.navigate("EditBusiness", { business: item });
                                            }
                                        }}>
                                        <DropdownMenu.ItemTitle>{strings.edit_business}</DropdownMenu.ItemTitle>
                                        <DropdownMenu.ItemIcon ios={{ name: 'pencil' }} />
                                    </DropdownMenu.Item>
                                    <DropdownMenu.Item
                                        key="add_pos"
                                        onSelect={() => {
                                            if (conditionEditBusiness()) {
                                                RootNavigation.navigate("NewSalesPoint", { business_id: item._id });
                                            }
                                        }}>
                                        <DropdownMenu.ItemTitle>{strings.add_new_sales_point}</DropdownMenu.ItemTitle>
                                        <DropdownMenu.ItemIcon ios={{ name: 'plus' }} />
                                    </DropdownMenu.Item>
                                    <DropdownMenu.Item
                                        key="add_subscription"
                                        onSelect={() => {
                                            if (conditionEditBusiness()) {
                                                RootNavigation.navigate("BusinessSubscriptionPlans", { business_id: item._id });
                                            }
                                        }}>
                                        <DropdownMenu.ItemTitle>{strings.add_subscription}</DropdownMenu.ItemTitle>
                                        <DropdownMenu.ItemIcon ios={{ name: 'creditcard' }} />
                                    </DropdownMenu.Item>
                                    <DropdownMenu.Item
                                        key="subscription_history"
                                        onSelect={() => {
                                            if (conditionEditBusiness()) {
                                                RootNavigation.navigate("SubscriptionHistory", { business_id: item._id });
                                            }
                                        }}>
                                        <DropdownMenu.ItemTitle>{strings.subscription_history}</DropdownMenu.ItemTitle>
                                        <DropdownMenu.ItemIcon ios={{ name: 'clock' }} />
                                    </DropdownMenu.Item>
                                    <DropdownMenu.Separator />
                                    <DropdownMenu.Item
                                        key="share_business"
                                        onSelect={() => {
                                            RootNavigation.navigate("ShareBusiness", {
                                                share_kind: 'business',
                                                business_id: item._id,
                                                business_name: item.business_name,
                                            });
                                        }}>
                                        <DropdownMenu.ItemTitle>{strings.share}</DropdownMenu.ItemTitle>
                                        <DropdownMenu.ItemIcon ios={{ name: 'qrcode' }} />
                                    </DropdownMenu.Item>
                                    {businessExpired ?
                                        <DropdownMenu.Item
                                            key="renew"
                                            onSelect={() => {
                                                if (conditionEditBusiness()) {
                                                    RootNavigation.navigate("AddBusinessSubscription", { business_id: item._id });
                                                }
                                            }}>
                                            <DropdownMenu.ItemTitle>{strings.renew_my_subscription}</DropdownMenu.ItemTitle>
                                            <DropdownMenu.ItemIcon ios={{ name: 'arrow.clockwise' }} />
                                        </DropdownMenu.Item> : null}
                                    <DropdownMenu.Item
                                        key="follow"
                                        onSelect={handleFollow}>
                                        <DropdownMenu.ItemTitle>{isFollowing ? strings.unfollow_business : strings.follow_business}</DropdownMenu.ItemTitle>
                                        <DropdownMenu.ItemIcon ios={{ name: isFollowing ? 'heart.slash' : 'heart' }} />
                                    </DropdownMenu.Item>
                                </DropdownMenu.Content>
                            </DropdownMenu.Root>
                        </View>
                    </View>

                    {/* Stats Row */}
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-around',
                        // marginTop: 5,
                        paddingTop: 15,
                        borderTopWidth: 1,
                        borderTopColor: app_theme.colors.border,
                    }}>
                        {bitems.length > 0 ?
                            <View style={{ alignItems: 'center' }}>
                                <YambiText color="high" text={bitems.length.toString()} bold />
                                <YambiText size="small" color="gray" text={strings.items} />
                            </View> : null}
                        {sells_points.length > 0 ?
                            <View style={{ alignItems: 'center' }}>
                                <YambiText color="high" text={sells_points.length.toString()} bold />
                                <YambiText size="small" color="gray" text={strings.sells_points} />
                            </View> : null}
                        {bs.length > 0 ?
                            <View style={{ alignItems: 'center' }}>
                                <YambiText color="high" text={bs.length.toString()} bold />
                                <YambiText size="small" color="gray" text={strings.sales} />
                            </View> : null}
                        {bu.length > 0 ?
                            <View style={{ alignItems: 'center' }}>
                                <YambiText color="high" text={bu.length.toString()} bold />
                                <YambiText size="small" color="gray" text={strings.users} />
                            </View> : null}
                        {/* {subscriberCount > 0 ?
                            <Pressable 
                                style={{ alignItems: 'center' }}
                                onPress={() => {
                                    RootNavigation.navigate("BusinessSubscribers", { business_id: item._id });
                                }}>
                                <YambiText color="high" text={subscriberCount.toString()} bold />
                                <YambiText size="small" color="gray" text={strings.followers} />
                            </Pressable> : null} */}
                    </View>

                    <Pressable
                        onPress={() => setShowBusinessInfo(!showBusinessInfo)}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            paddingHorizontal: 12,
                            paddingVertical: 10,
                            borderRadius: 5,
                            marginTop: 15,
                            backgroundColor: app_theme.colors.border
                        }}>
                        <IconApp pack="FI" name={showBusinessInfo ? "chevron-up" : "info"} size={16} color={app_theme.colors.high_color} />
                        <YambiText size="small" color="high" text={showBusinessInfo ? strings.hide : strings.business_info} style={{ marginLeft: 8 }} />
                    </Pressable>

                    <Animated.View style={{
                        maxHeight: businessInfoHeight.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 500],
                        }),
                        opacity: businessInfoHeight,
                        overflow: 'hidden',
                    }}>
                        <View style={{
                            paddingTop: 15,
                            borderTopWidth: 0,
                            borderTopColor: app_theme.colors.border,
                        }}>
                            {item.description_service && item.description_service.trim() !== '' ?
                                <View style={{ marginBottom: 12 }}>
                                    <YambiText size="small" color="gray" text={strings.description} style={{ marginBottom: 5 }} />
                                    <YambiText text={item.description_service} style={{ lineHeight: 20 }} />
                                </View> : null}
                            {item.phone_number && item.phone_number.trim() !== '' ?
                                <View style={{ marginBottom: 12 }}>
                                    <YambiText size="small" color="gray" text={strings.phone} style={{ marginBottom: 5 }} />
                                    <Pressable onPress={() => copyToClipboard(item.phone_number)}>
                                        <YambiText text={item.phone_number} />
                                    </Pressable>
                                </View> : null}
                            {item.emails && item.emails.trim() !== '' ?
                                <View style={{ marginBottom: 12 }}>
                                    <YambiText size="small" color="gray" text={strings.emails} style={{ marginBottom: 5 }} />
                                    <Pressable onPress={() => copyToClipboard(item.emails)}>
                                        <YambiText text={item.emails} />
                                    </Pressable>
                                </View> : null}
                            {item.tax_number && item.tax_number.trim() !== '' ?
                                <View style={{ marginBottom: 12 }}>
                                    <YambiText size="small" color="gray" text={strings.tax_number} style={{ marginBottom: 5 }} />
                                    <Pressable onPress={() => copyToClipboard(item.tax_number)}>
                                        <YambiText text={item.tax_number} />
                                    </Pressable>
                                </View> : null}
                            {item.business_address && item.business_address.trim() !== '' ?
                                <View style={{ marginBottom: 12 }}>
                                    <YambiText size="small" color="gray" text={strings.address} style={{ marginBottom: 5 }} />
                                    <YambiText text={item.business_address} />
                                </View> : null}

                            <Pressable
                                onPress={() => {
                                    if (conditionEditBusiness()) {
                                        RootNavigation.navigate("EditBusiness", { business: item });
                                    }
                                }}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    paddingHorizontal: 12,
                                    paddingVertical: 10,
                                    borderRadius: 12,
                                    marginTop: 10,
                                    borderWidth: 1,
                                    borderColor: app_theme.colors.high_color,
                                }}>
                                <IconApp pack="FI" name="edit" size={16} color={app_theme.colors.high_color} />
                                <YambiText size="small" color="high" text={strings.add_business_information} style={{ marginLeft: 8 }} />
                            </Pressable>
                        </View>
                    </Animated.View>
                </View>

                {/* Out of Stock Alert */}
                {outOfStockItems.length > 0 ? (
                    <View
                        style={{
                            backgroundColor: app_theme.colors.error + '10',
                            borderRadius: 12,
                            padding: 15,
                            marginBottom: 18,
                            borderWidth: 1,
                            borderColor: app_theme.colors.error + '40',
                        }}
                    >
                        <Pressable
                            onPress={() => {
                                if (outOfStockItems.length > 3) setShowOutOfStock(!showOutOfStock);
                            }}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                <IconApp pack="FI" name="alert-circle" size={16} color={app_theme.colors.error} />
                                <YambiText
                                    size="small"
                                    color="error"
                                    text={`${strings.out_of_stock} (${outOfStockItems.length})`}
                                    style={{ marginLeft: 8, flex: 1 }}
                                />
                            </View>
                            {outOfStockItems.length > 3 ? (
                                <IconApp
                                    pack="FI"
                                    name={showOutOfStock ? "chevron-up" : "chevron-down"}
                                    size={16}
                                    color={app_theme.colors.gray}
                                />
                            ) : null}
                        </Pressable>

                        <View style={{ marginTop: 12 }}>
                            {(showOutOfStock ? outOfStockItems : outOfStockItems.slice(0, 3)).map((i: any, idx: number) => (
                                <View
                                    key={i._id || idx}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        paddingVertical: 8,
                                        borderBottomWidth: idx === (showOutOfStock ? outOfStockItems : outOfStockItems.slice(0, 3)).length - 1 ? 0 : 1,
                                        borderBottomColor: app_theme.colors.border,
                                    }}
                                >
                                    <View style={{ flex: 1, marginRight: 10 }}>
                                        <YambiText color="gray" text={i.item_name} />
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 0 }}>
                                        <Pressable
                                            onPress={() =>
                                                RootNavigation.navigate("RenewStock", {
                                                    item_id: String(i._id),
                                                    business_id: item._id,
                                                })
                                            }
                                            style={({ pressed }) => ({ marginRight: 8, opacity: pressed ? 0.65 : 1 })}
                                        >
                                            <YambiText size="small" color="high" text={strings.restock} style={{ textDecorationLine: 'underline' }} />
                                        </Pressable>
                                        <YambiText
                                            size="small"
                                            color="error"
                                            text={`${Number(i.items_number_stock)}`}
                                            style={{ marginRight: 6 }}
                                        />
                                        <YambiText size="small" color="gray" text={strings.in_store.toLowerCase()} />
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                ) : null}

                {/* Low Stock Alert */}
                {lowStockItems.length > 0 ? (
                    <View
                        style={{
                            backgroundColor: app_theme.colors.error + '10',
                            borderRadius: 12,
                            padding: 15,
                            marginBottom: 18,
                            borderWidth: 1,
                            borderColor: app_theme.colors.error + '40',
                        }}
                    >
                        <Pressable
                            onPress={() => {
                                if (lowStockItems.length > 3) setShowLowStock(!showLowStock);
                            }}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                <IconApp pack="FI" name="alert-circle" size={16} color={app_theme.colors.error} />
                                <YambiText
                                    size="small"
                                    color="error"
                                    text={`${strings.low_stock_alert} (${lowStockItems.length})`}
                                    style={{ marginLeft: 8, flex: 1 }}
                                />
                            </View>
                            {lowStockItems.length > 3 ? (
                                <IconApp
                                    pack="FI"
                                    name={showLowStock ? "chevron-up" : "chevron-down"}
                                    size={16}
                                    color={app_theme.colors.gray}
                                />
                            ) : null}
                        </Pressable>

                        <View style={{ marginTop: 12 }}>
                            {(showLowStock ? lowStockItems : lowStockItems.slice(0, 3)).map((i: any, idx: number) => (
                                <View
                                    key={i._id || idx}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        paddingVertical: 8,
                                        borderBottomWidth: idx === (showLowStock ? lowStockItems : lowStockItems.slice(0, 3)).length - 1 ? 0 : 1,
                                        borderBottomColor: app_theme.colors.border,
                                    }}
                                >
                                    <View style={{ flex: 1, marginRight: 10 }}>
                                        <YambiText color="gray" text={i.item_name} />
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 0 }}>
                                        <Pressable
                                            onPress={() =>
                                                RootNavigation.navigate("RenewStock", {
                                                    item_id: String(i._id),
                                                    business_id: item._id,
                                                })
                                            }
                                            style={({ pressed }) => ({ marginRight: 8, opacity: pressed ? 0.65 : 1 })}
                                        >
                                            <YambiText size="small" color="high" text={strings.restock} style={{ textDecorationLine: 'underline' }} />
                                        </Pressable>
                                        <YambiText
                                            size="small"
                                            color="error"
                                            text={`${Number(i.items_number_stock)}`}
                                            style={{ marginRight: 6 }}
                                        />
                                        <YambiText size="small" color="gray" text={strings.in_store.toLowerCase()} />
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                ) : null}

                {/* Quick Actions Title */}
                {/* <YambiText text={strings.quick_actions} bold style={{ marginBottom: 15, fontSize: 18 }} /> */}

                {/* Main Menu - Row 1 */}
                <View style={{ flexDirection: 'row', marginBottom: 10 }}>
                    <MenuCard
                        icon="plus"
                        title={strings.add_item}
                        color="#8B5CF6"
                        onPress={handleAddItemPress}
                    />
                    <MenuCard
                        icon="store"
                        title={strings.sells_points}
                        iconPack="MT"
                        // color="#EC4899"
                        color={app_theme.colors.high_color2}
                        onPress={() => {
                            dispatch(setShowModalApp(true));
                            setShowPOSList(true);
                        }}
                    />
                    <MenuCard
                        icon="users"
                        title={strings.users}
                        // color="#3B82F6"
                        color={app_theme.colors.high_color3}
                        onPress={() => {
                            if (conditionGoUsers()) {
                                RootNavigation.navigate("UserBusinessUsers", { business_id: item._id });
                            }
                        }}
                    />
                </View>

                {/* Main Menu - Row 2 */}
                <View style={{ flexDirection: 'row', marginBottom: 25 }}>
                    <MenuCard
                        icon="package"
                        title={strings.inventory}
                        // color="#F59E0B"
                        color={app_theme.colors.high_color}
                        onPress={() => {
                            if (conditionGoUsers()) {
                                const maxArticles = maxArticlesAllowed;

                                RootNavigation.navigate("BusinessItems", {
                                    business_id: item._id,
                                    sales_point_id: "",
                                    flag: 2,
                                    can_upload_images: canUploadImages,
                                    max_articles: maxArticles
                                });
                            }
                        }}
                    />
                    <MenuCard
                        icon="trending-up"
                        title={strings.sales}
                        // color="#10B981"
                        color={app_theme.colors.success}
                        onPress={() => RootNavigation.navigate("BusinessSales", { business_id: item._id, sales_point_id: "", item_id: "" })}
                    />
                    <MenuCard
                        icon="shopping-cart"
                        title={strings.sell}
                        prominent={true}
                        onPress={() => {
                            dispatch(setShowModalApp(true));
                            setShowPOSSelector(true);
                        }}
                    />
                </View>

                {/* Analytics Cards */}
                <YambiText text={strings.business_overview} bold style={{ marginBottom: 15, fontSize: 18 }} />

                {/* Live Date and Time */}
                <View style={{
                    backgroundColor: app_theme.colors.border,
                    borderRadius: 12,
                    padding: 20,
                    marginBottom: 15,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: app_theme.colors.border,
                }}>
                    <ClockDisplay lang={lang} />
                </View>

                {/* Quick Stats Row */}
                <View style={{ flexDirection: 'row', marginBottom: 15 }}>
                    <View style={{
                        flex: 1,
                        backgroundColor: app_theme.colors.border,
                        borderRadius: 12,
                        padding: 15,
                        marginRight: 8,
                        borderWidth: 1,
                        borderColor: app_theme.colors.border,
                    }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                            <IconApp pack="FI" name="dollar-sign" size={16} color="#10B981" />
                            <YambiText size="small" color="gray" text={strings.total_sales} style={{ marginLeft: 5 }} />
                        </View>
                        <YambiText color="high" text={bs.length.toString()} bold style={{ fontSize: 24 }} />
                        <YambiText size="small" color="gray" text={strings.completed_sales} style={{ marginTop: 2 }} />
                    </View>

                    <View style={{
                        flex: 1,
                        backgroundColor: app_theme.colors.border,
                        borderRadius: 12,
                        padding: 15,
                        marginLeft: 8,
                        borderWidth: 1,
                        borderColor: app_theme.colors.border,
                    }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                            <IconApp pack="FI" name="box" size={16} color="#F59E0B" />
                            <YambiText size="small" color="gray" text={strings.inventory} style={{ marginLeft: 5 }} />
                        </View>
                        <YambiText color="high" text={bitems.length.toString()} bold style={{ fontSize: 24 }} />
                        <YambiText size="small" color="gray" text={strings.items} style={{ marginTop: 2 }} />
                    </View>
                </View>

                <Pressable
                    onPress={() => {
                        if (isAdmin) {
                            RootNavigation.navigate("GetExpenses", { flag: 1, business_id: item._id });
                            return;
                        }
                        if (oo !== undefined && oo.user_active === 1) {
                            if (oo.level === 1) {
                                RootNavigation.navigate("GetExpenses", { flag: 1, business_id: item._id });
                            } else if (oo.level === 2) {
                                if (oo.sales_point_id && oo.sales_point_id !== "") {
                                    RootNavigation.navigate("GetExpenses", { flag: 2, sales_point_id: oo.sales_point_id });
                                } else {
                                    dispatch(setShowModalApp(true));
                                    setShowUserError(true);
                                }
                            } else {
                                dispatch(setShowModalApp(true));
                                setShowUserError(true);
                            }
                        } else {
                            dispatch(setShowModalApp(true));
                            setShowUserError(true);
                        }
                    }}
                    style={{
                        backgroundColor: app_theme.colors.border,
                        borderRadius: 12,
                        padding: 15,
                        marginBottom: 15,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        borderWidth: 1,
                        borderColor: app_theme.colors.border,
                    }}
                >
                    <View style={{ flexDirection: "row", alignItems: "center", flex: 1, marginRight: 12 }}>
                        <IconApp pack="FI" name="dollar-sign" size={20} color={app_theme.colors.high_color} styles={{ marginRight: 12 }} />
                        <YambiText
                            text={strings.view_expenses}
                            bold
                            style={{ flex: 1 }}
                            numberLines={2}
                        />
                    </View>
                    <IconApp pack="FI" name="chevron-right" size={20} color={app_theme.colors.text} />
                </Pressable>

                <Pressable
                    onPress={() => {
                        if (isAdmin) {
                            RootNavigation.navigate("Reservations", { business_id: item._id });
                            return;
                        }
                        if (oo !== undefined && oo.user_active === 1) {
                            if (oo.level === 1) {
                                RootNavigation.navigate("Reservations", { business_id: item._id });
                            } else if (oo.level === 2 || oo.level === 3) {
                                if (oo.sales_point_id && oo.sales_point_id !== "") {
                                    RootNavigation.navigate("Reservations", { sales_point_id: oo.sales_point_id });
                                } else {
                                    dispatch(setShowModalApp(true));
                                    setShowUserError(true);
                                }
                            } else {
                                dispatch(setShowModalApp(true));
                                setShowUserError(true);
                            }
                        } else {
                            dispatch(setShowModalApp(true));
                            setShowUserError(true);
                        }
                    }}
                    style={{
                        backgroundColor: app_theme.colors.border,
                        borderRadius: 12,
                        padding: 15,
                        marginBottom: 15,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        borderWidth: 1,
                        borderColor: app_theme.colors.border,
                    }}
                >
                    <View style={{ flexDirection: "row", alignItems: "center", flex: 1, marginRight: 12 }}>
                        <IconApp pack="FI" name="bookmark" size={20} color={app_theme.colors.high_color} styles={{ marginRight: 12 }} />
                        <YambiText
                            text={(strings as any).view_reservations || "View Reservations"}
                            bold
                            style={{ flex: 1 }}
                            numberLines={2}
                        />
                    </View>
                    <IconApp pack="FI" name="chevron-right" size={20} color={app_theme.colors.text} />
                </Pressable>


                <Pressable
                    onPress={() => {
                        if (conditionGoUsers()) {
                            RootNavigation.navigate("BusinessInventoryMovementHistory", { business_id: item._id });
                        }
                    }}
                    style={{
                        backgroundColor: app_theme.colors.border,
                        borderRadius: 12,
                        padding: 15,
                        marginBottom: 15,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        borderWidth: 1,
                        borderColor: app_theme.colors.border,
                    }}
                >
                    <View style={{ flexDirection: "row", alignItems: "center", flex: 1, marginRight: 12 }}>
                        <IconApp pack="FI" name="list" size={20} color={app_theme.colors.high_color} styles={{ marginRight: 12 }} />
                        <YambiText
                            text={strings.view_inventory_movement_history}
                            bold
                            style={{ flex: 1 }}
                            numberLines={2}
                        />
                    </View>
                    <IconApp pack="FI" name="chevron-right" size={20} color={app_theme.colors.text} />
                </Pressable>

                <SalesCharts
                    sales={Array.from(bs as any)}
                    startDate={recentSalesStartDate}
                    endDate={recentSalesEndDate}
                    businessId={item._id}
                />

                {/* Points of Sale Card */}
                {sells_points.length > 0 ?
                    <View style={{
                        backgroundColor: app_theme.colors.border,
                        borderRadius: 12,
                        padding: 15,
                        marginBottom: 15,
                        borderWidth: 1,
                        borderColor: app_theme.colors.border,
                    }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <IconApp pack="MT" name="store" size={18} color="#EC4899" />
                                <YambiText text={strings.sells_points} bold style={{ marginLeft: 8 }} />
                            </View>
                            <YambiText color="high" text={sells_points.length.toString()} bold />
                        </View>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                            {sells_points.map((pos) => (
                                <View
                                    key={pos._id}
                                    style={{
                                        paddingHorizontal: 10,
                                        paddingVertical: 6,
                                        borderRadius: 8,
                                        marginRight: 8,
                                        marginBottom: 8,
                                        borderWidth: 1,
                                        borderColor: app_theme.colors.border,
                                        backgroundColor: app_theme.colors.background
                                    }}>
                                    <YambiText size="small" text={pos.sells_point_name} />
                                </View>
                            ))}
                        </View>
                    </View> : null}

                {/* Team Card */}
                {bu.length > 0 ?
                    <Pressable
                        onPress={() => {
                            if (conditionGoUsers()) {
                                RootNavigation.navigate("UserBusinessUsers", { business_id: item._id });
                            }
                        }}
                        style={{
                            backgroundColor: app_theme.colors.border,
                            borderRadius: 12,
                            padding: 15,
                            marginBottom: 20,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderWidth: 1,
                            borderColor: app_theme.colors.border,
                        }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <IconApp pack="FI" name="users" size={18} color="#3B82F6" />
                            <View style={{ marginLeft: 10 }}>
                                <YambiText text={strings.users} bold />
                                <YambiText size="small" color="gray" text={`${bu.length} ${bu.length === 1 ? strings.user.toLowerCase() : strings.users.toLowerCase()}`} />
                            </View>
                        </View>
                        <IconApp pack="FI" name="chevron-right" size={20} color={app_theme.colors.text} />
                    </Pressable> : null}
            </View>
        </ScrollView>
    );
}

export default BusinessesListModern;
