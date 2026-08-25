import { View, ScrollView, TextInput, Pressable } from "react-native";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../../store/app/hooks";
import { strings } from "../../lang/lang";
import ButtonNormal from "../../components/app/ButtonNormal";
import { IconApp } from "../../components/app/IconApp";
import { YambiText } from "../../components/app/Text";
import ModalApp from "../../components/app/ModalApp";
import BottomSheet from "../../components/app/BottomSheet";
import { setLoadingButton, setShowModalApp } from "../../store/reducers/appSlice";
import { global_currencies, randomString, renderCurrency, renderDateUpToMilliseconds, SocketApp } from "../../../GlobalVariables";
import { NavProps, TBusinessSubscription, TItem, TItemPrices } from "../../types/types";
import { useQuery, useRealm } from "@realm/react";
import moment from "moment";
import DateTimePicker from "@react-native-community/datetimepicker";
import { UserBusinessArticles } from "../../store/database/Models";

const COLORS_LIST = [
    "#F08080", "#CD5C5C", "#DC143C", "#8B0000", "#FF0000",
    "#E0F7FA", "#87CEEB", "#4682B4", "#1E88E5", "#0D47A1", "#0000FF",
    "#90EE90", "#32CD32", "#2E7D32", "#004D40", "#556B2F", "#008000",
    "#FFF59D", "#FFD700", "#DAA520", "#B8860B",
    "#FFA07A", "#FF7F50", "#D2B48C", "#8B4513",
    "#FFB6C1", "#E1BEE7", "#9370DB", "#4A148C",
    "#FFFFFF", "#E0E0E0", "#757575", "#212121", "#808080", "#000000"
];

const getColorName = (color: string): string => {
    const map: Record<string, string> = {
        "#F08080": strings.light_coral || "Light Coral",
        "#CD5C5C": strings.indian_red || "Indian Red",
        "#DC143C": strings.crimson || "Crimson",
        "#8B0000": strings.dark_red || "Dark Red",
        "#FF0000": strings.red,
        "#E0F7FA": strings.ice_blue || "Ice Blue",
        "#87CEEB": strings.sky_blue || "Sky Blue",
        "#4682B4": strings.steel_blue || "Steel Blue",
        "#1E88E5": strings.royal_blue || "Royal Blue",
        "#0D47A1": strings.navy_blue || "Navy Blue",
        "#0000FF": strings.blue,
        "#90EE90": strings.light_green || "Light Green",
        "#32CD32": strings.lime_green || "Lime Green",
        "#2E7D32": strings.forest_green || "Forest Green",
        "#004D40": strings.dark_teal || "Dark Teal",
        "#556B2F": strings.olive_green || "Olive Green",
        "#008000": strings.green,
        "#FFF59D": strings.soft_yellow || "Soft Yellow",
        "#FFD700": strings.gold || "Gold",
        "#DAA520": strings.goldenrod || "Goldenrod",
        "#B8860B": strings.dark_goldenrod || "Dark Goldenrod",
        "#FFA07A": strings.light_salmon || "Light Salmon",
        "#FF7F50": strings.coral_orange || "Coral Orange",
        "#D2B48C": strings.tan_beige || "Tan / Beige",
        "#8B4513": strings.saddle_brown || "Saddle Brown",
        "#FFB6C1": strings.soft_pink || "Soft Pink",
        "#E1BEE7": strings.soft_lavender || "Soft Lavender",
        "#9370DB": strings.medium_purple || "Medium Purple",
        "#4A148C": strings.deep_violet || "Deep Violet",
        "#FFFFFF": strings.white,
        "#E0E0E0": strings.light_gray || "Light Gray / Silver",
        "#757575": strings.medium_gray || "Medium Gray",
        "#212121": strings.dark_gray || "Dark Gray / Charcoal",
        "#808080": strings.gray,
        "#000000": strings.black,
    };
    return map[color] ?? color;
};

const GENERAL_SIZES = {
    clothing: ["2T", "3T", "4T", "5T", "XS", "S", "M", "L", "XL", "XXL", "XXXL"],
    pants: ["28", "30", "32", "34", "36", "38", "40"],
    shoes: ["30", "32", "35", "37", "38", "40", "42", "43", "44", "45", "46", "47"],
    hats: ["S/M", "M/L", "L/XL", "One Size"],
    gloves: ["S", "M", "L", "XL"],
};

const safeJsonStringArray = (raw: string): string[] => {
    if (!raw) return [];
    try {
        const x = typeof raw === 'string' ? JSON.parse(raw) : raw;
        return Array.isArray(x) ? x.filter((v): v is string => typeof v === "string") : [];
    } catch {
        return [];
    }
};

const NewBusinessItem = ({ route, navigation }: NavProps) => {
    const { business_id } = route.params;

    const theme = useAppSelector((state) => state.app_theme.colors);
    const user_data = useAppSelector((state) => state.user_data);
    const [currency, setCurrency] = useState<number>(1);
    const [name, setName] = useState<string>("");
    const [itemDescription, setItemDescription] = useState<string>("");
    const [wholesale_cost_price, setWholesale_cost_price] = useState<string>("");
    const [retail_selling_price, setRetail_selling_price] = useState<string>("");
    const [wholesale_selling_price, setWholesale_selling_price] = useState<string>("");
    const [wholesale_content_number, setWholesale_content_number] = useState<string>("");
    const [wholesale_number_stock, setWholesale_number_stock] = useState<string>("");
    const [wholesale_number_warehouse, setWholesale_number_warehouse] = useState<string>("0");
    const [wholesale_and_retail, setWholesale_and_retail] = useState<boolean>(true);
    const [showError, setShowError] = useState<boolean>(false);
    const [validationErrorMsg, setValidationErrorMsg] = useState<string>("");
    const [showCurrencies, setShowCurrencies] = useState<boolean>(false);
    const [showInternetError, setShowInternetError] = useState<boolean>(false);
    const [showPlanLimitModal, setShowPlanLimitModal] = useState<boolean>(false);
    const [wholesale_quantity, setWholesale_quantity] = useState<boolean>(false);

    // Discount states
    const [discountPercentage, setDiscountPercentage] = useState<number>(0);
    const [discountStartDate, setDiscountStartDate] = useState<string>("");
    const [discountEndDate, setDiscountEndDate] = useState<string>("");
    const [showDiscountModal, setShowDiscountModal] = useState<boolean>(false);
    const [showDiscountStartDatePicker, setShowDiscountStartDatePicker] = useState<boolean>(false);
    const [showDiscountEndDatePicker, setShowDiscountEndDatePicker] = useState<boolean>(false);
    const [discountStartDateObj, setDiscountStartDateObj] = useState<Date>(new Date());
    const [discountEndDateObj, setDiscountEndDateObj] = useState<Date>(new Date());

    const dispatch = useAppDispatch();
    const realm = useRealm();

    const items_categories = strings.items_categories;
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [selectedSubCategory, setSelectedSubCategory] = useState<string>("");
    const [showColorsModal, setShowColorsModal] = useState(false);
    const [showSizesModal, setShowSizesModal] = useState(false);
    const [selectedColors, setSelectedColors] = useState("[]");
    const [selectedSizes, setSelectedSizes] = useState("[]");

    const [manufactureDate, setManufactureDate] = useState<string>("");
    const [expiryDate, setExpiryDate] = useState<string>("");
    const [showManufactureDatePicker, setShowManufactureDatePicker] = useState(false);
    const [showExpiryDatePicker, setShowExpiryDatePicker] = useState(false);
    const [manufactureDateObj, setManufactureDateObj] = useState<Date>(new Date());
    const [expiryDateObj, setExpiryDateObj] = useState<Date>(new Date());
    const persistedSubscriptions = useAppSelector((state) => state.persisted_app.business_subscriptions || []);

    const businessItems = useQuery(
        UserBusinessArticles,
        (items) => items.filtered('business_id == $0 && item_active == $1', business_id, 1),
        [business_id]
    );
    const usedItems = businessItems.length;

    const formatMonthYear = (date: Date | string): string => {
        const d = typeof date === "string" ? new Date(date) : date;
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        return `${year}-${month}`;
    };

    const createDateFromMonthYear = (monthYear: string): Date => {
        if (!monthYear) return new Date();
        const [year, month] = monthYear.split("-").map(Number);
        return new Date(year, month - 1, 1);
    };

    const normalizeToFirstOfMonth = (date: Date): Date => {
        return new Date(date.getFullYear(), date.getMonth(), 1);
    };

    const PLAN_MAX_ARTICLES: Record<number, number> = {
        0: 15,
        1: 150,
        2: 400,
        3: 3000,
    };

    const activeSuccessfulLocalSubscription = useMemo(() => {
        const now = new Date();
        return (persistedSubscriptions as TBusinessSubscription[])
            .filter((sub) => {
                if (sub.business_id !== business_id) return false;
                if (Number(sub.payment_status ?? 0) !== 1) return false;
                if (!sub.subscription_end_date) return false;
                const endDate = new Date(sub.subscription_end_date);
                if (Number.isNaN(endDate.getTime())) return false;
                return endDate >= now;
            })
            .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())[0];
    }, [persistedSubscriptions, business_id]);

    const maxArticles = useMemo(() => {
        const plan = Number(activeSuccessfulLocalSubscription?.subscription_plan ?? 0);
        return PLAN_MAX_ARTICLES[plan] ?? PLAN_MAX_ARTICLES[0];
    }, [activeSuccessfulLocalSubscription]);

    useEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <View
                    style={{
                        backgroundColor: theme.border,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 8,
                        marginRight: 2,
                    }}
                >
                    <YambiText
                        size="small"
                        color={usedItems >= maxArticles ? "error" : "high"}
                        text={`${usedItems}/${maxArticles}`}
                        bold
                    />
                </View>
            ),
        });
    }, [navigation, theme.border, usedItems, maxArticles]);

    const activeColorsList = useMemo(() => safeJsonStringArray(selectedColors), [selectedColors]);
    const activeSizesList = useMemo(() => safeJsonStringArray(selectedSizes), [selectedSizes]);

    const toggleColorItem = useCallback((color: string) => {
        setSelectedColors((prev) => {
            const active = safeJsonStringArray(prev);
            const next = active.includes(color) ? active.filter((c) => c !== color) : [...active, color];
            return JSON.stringify(next);
        });
    }, []);

    const toggleSizeItem = useCallback((size: string) => {
        setSelectedSizes((prev) => {
            const active = safeJsonStringArray(prev);
            const next = active.includes(size) ? active.filter((s) => s !== size) : [...active, size];
            return JSON.stringify(next);
        });
    }, []);

    const show_category = (catId: string) => {
        if (!catId) return null;
        const index = strings.items_categories[catId as keyof typeof strings.items_categories] as { name: string } | undefined;
        if (!index) return null;
        return <YambiText color="high" text={index.name} bold />;
    };

    const show_subcategory = (catId: string, subKey: string) => {
        if (!catId || !subKey) return null;
        const index = strings.items_categories[catId as keyof typeof strings.items_categories] as
            | { subcategories: Record<string, string> }
            | undefined;
        if (!index || !index.subcategories[subKey]) return null;
        return <YambiText color="high" text={index.subcategories[subKey]} bold />;
    };

    const AddItem = () => {
        if (usedItems >= maxArticles) {
            dispatch(setShowModalApp(true));
            setShowPlanLimitModal(true);
            return;
        }

        if (
            name === "" ||
            wholesale_cost_price === "" ||
            wholesale_selling_price === "" ||
            wholesale_number_stock === "" ||
            wholesale_number_warehouse === "" ||
            wholesale_content_number === "" ||
            wholesale_content_number === "0"
        ) {
            setValidationErrorMsg(strings.fields_error_validation);
            dispatch(setShowModalApp(true));
            setShowError(true);
        } else if (
            !/^\d+([.,]\d+)?$/.test(wholesale_cost_price) ||
            !/^\d+([.,]\d+)?$/.test(wholesale_selling_price) ||
            (retail_selling_price !== "" && !/^\d+([.,]\d+)?$/.test(retail_selling_price)) ||
            !/^\d+$/.test(wholesale_content_number) ||
            !/^\d+$/.test(wholesale_number_stock) ||
            !/^\d+$/.test(wholesale_number_warehouse)
        ) {
            setValidationErrorMsg(strings.invalid_number_error);
            dispatch(setShowModalApp(true));
            setShowError(true);
        } else {
            dispatch(setLoadingButton(true));

            if (!wholesale_and_retail) {
                if (wholesale_content_number === "") {
                    setWholesale_content_number("1");
                }
                setRetail_selling_price(wholesale_selling_price);
            }

            const itemID = renderDateUpToMilliseconds() + randomString(5);

            const item: TItem = {
                _id: itemID,
                business_id: business_id,
                phone_number: user_data.phone_number,
                item_name: name,
                slogan: "",
                item_type: 1,
                category: selectedCategory,
                subcategory: selectedSubCategory,
                manufacture_date: manufactureDate ? createDateFromMonthYear(manufactureDate).toISOString() : "",
                expiry_date: expiryDate ? createDateFromMonthYear(expiryDate).toISOString() : "",
                wholesale_content_number: parseInt(wholesale_content_number, 10),
                items_number_stock: !wholesale_quantity
                    ? parseInt(wholesale_number_stock, 10) * parseInt(wholesale_content_number, 10)
                    : parseInt(wholesale_number_stock, 10),
                items_number_warehouse: !wholesale_quantity
                    ? parseInt(wholesale_number_warehouse, 10) * parseInt(wholesale_content_number, 10)
                    : parseInt(wholesale_number_warehouse, 10),
                description_item: itemDescription,
                keywords: "",
                images: "",
                background: "",
                supplier: "",
                other_information: "",
                alert_low_stock: !wholesale_quantity
                    ? 0.25 * (parseInt(wholesale_number_stock, 10) * parseInt(wholesale_content_number, 10))
                    : 0.25 * parseInt(wholesale_number_stock, 10),
                item_active: 1,
                uploaded: 0,
                createdAt: moment(new Date()).format(),
                updatedAt: moment(new Date()).format(),
                colors: selectedColors,
                discount_percentage: discountPercentage,
                discount_start_date: discountStartDate ? moment(discountStartDate).format() : "",
                discount_end_date: discountEndDate ? moment(discountEndDate).format() : "",
                marketplace_visibility: 0,
                weights: "[]",
                sizes: selectedSizes,
                flag: 0,
                is_best_seller: 0,
                visibility_rank: 0,
                is_featured: 0,
            };

            const prices: TItemPrices = {
                _id: "G" + itemID,
                item_id: itemID,
                phone_number: user_data.phone_number,
                wholesale_cost_price: wholesale_cost_price,
                wholesale_selling_price: wholesale_selling_price,
                retail_selling_price: wholesale_and_retail ? retail_selling_price : wholesale_selling_price,
                uploaded: 0,
                currency: currency,
            };

            try {
                realm.write(() => {
                    try {
                        realm.create("UserBusinessArticles", item, true);
                    } catch (error) {
                        console.log(error);
                    }

                    try {
                        realm.create("ItemPrices", prices, true);
                    } catch (error) {
                        console.log(error);
                    }
                });

                SocketApp.emit("newItems", JSON.stringify({ phone_number: user_data.phone_number, items: [item] }));
                SocketApp.emit("newItemPrices", JSON.stringify({ phone_number: user_data.phone_number, items: [prices] }));
            } catch (error) {
                console.log(error);
            }

            setTimeout(() => {
                setName("");
                setItemDescription("");
                setSelectedCategory("");
                setSelectedSubCategory("");
                setSelectedColors("[]");
                setSelectedSizes("[]");
                setManufactureDate("");
                setExpiryDate("");
                setWholesale_cost_price("");
                setWholesale_selling_price("");
                setWholesale_content_number("");
                setWholesale_number_warehouse("0");
                setWholesale_number_stock("");
                setRetail_selling_price("");
                setDiscountPercentage(0);
                setDiscountStartDate("");
                setDiscountEndDate("");

                dispatch(setLoadingButton(false));
            }, 300);
        }
    };

    const GrosDetail = () => {
        setWholesale_and_retail(!wholesale_and_retail);
        setWholesale_content_number("1");
    };

    return (
        <View style={{ borderColor: theme.border, borderTopWidth: 1, backgroundColor: theme.background, flex: 1 }}>
            <ScrollView style={{ paddingHorizontal: 16 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

                {/* ── Modals for Errors ── */}
                {showError && (
                    <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowError(false); }} singleButton title={strings.error}>
                        <YambiText color="gray" text={validationErrorMsg || strings.fields_error_validation} />
                    </ModalApp>
                )}
                {showInternetError && (
                    <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowInternetError(false); }} singleButton title={strings.error}>
                        <YambiText color="gray" text={strings.connection_failed} />
                    </ModalApp>
                )}
                {showPlanLimitModal && (
                    <ModalApp
                        onClose={() => { dispatch(setShowModalApp(false)); setShowPlanLimitModal(false); }}
                        singleButton={false}
                        textAction={strings.add_subscription}
                        textCancel={strings.close}
                        onAction={() => {
                            dispatch(setShowModalApp(false));
                            setShowPlanLimitModal(false);
                            navigation.navigate("AddBusinessSubscription", { business_id });
                        }}
                        title={strings.error}
                    >
                        <YambiText color="gray" text={strings.max_items_reached} />
                    </ModalApp>
                )}

                <View style={{ marginTop: 16, paddingBottom: 50 }}>

                    {/* ── CARD 1: Settings & Currency ── */}
                    <View style={{ backgroundColor: theme.border + "15", borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: theme.border }}>
                        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
                            <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: theme.high_color + "20", justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
                                <IconApp pack="FI" name="settings" size={18} color={theme.high_color} />
                            </View>
                            <YambiText bold text={strings.settings} style={{ fontSize: 16 }} />
                        </View>

                        {/* Gros/Detail toggle */}
                        <View style={{ marginBottom: 14 }}>
                            <YambiText size="small" color="gray" text={strings.include} style={{ marginBottom: 8 }} />
                            <Pressable
                                onPress={GrosDetail}
                                style={{
                                    flexDirection: "row", alignItems: "center",
                                    backgroundColor: theme.background, borderRadius: 12, padding: 14,
                                    borderWidth: 1, borderColor: theme.border,
                                }}>
                                <IconApp color={theme.high_color} name={!wholesale_and_retail ? "ellipse-outline" : "checkmark-circle"} size={20} pack="IO" />
                                <YambiText text={strings.gros + " " + strings.and + " " + strings.detail} color="high" numberLines={1} style={{ marginLeft: 10, flex: 1, fontWeight: '600' }} />
                            </Pressable>
                        </View>

                        {/* Currency selector Pressable */}
                        <View>
                            <YambiText size="small" color="gray" text={strings.currency} style={{ marginBottom: 8 }} />
                            <Pressable
                                onPress={() => setShowCurrencies(true)}
                                style={{
                                    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                                    backgroundColor: theme.background, borderRadius: 12, padding: 14,
                                    borderWidth: 1, borderColor: theme.border,
                                }}>
                                <YambiText color="high" text={renderCurrency(currency, true)} numberLines={1} style={{ fontWeight: '600' }} />
                                <IconApp pack="FI" name="chevron-down" size={16} color={theme.gray} />
                            </Pressable>
                        </View>
                    </View>

                    {/* ── CARD 2: Item Information ── */}
                    <View style={{ backgroundColor: theme.border + "15", borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: theme.border }}>
                        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
                            <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: theme.high_color + "20", justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
                                <IconApp pack="FI" name="tag" size={18} color={theme.high_color} />
                            </View>
                            <YambiText bold text={strings.item_name} style={{ fontSize: 16 }} />
                        </View>

                        {/* Name */}
                        <View style={{ marginBottom: 14 }}>
                            <YambiText size="small" color="gray" text={strings.item_name} style={{ marginBottom: 8 }} />
                            <TextInput
                                placeholderTextColor={theme.gray}
                                maxLength={30}
                                style={{
                                    color: theme.text, backgroundColor: theme.background,
                                    borderColor: theme.border, borderWidth: 1,
                                    paddingHorizontal: 16, height: 46, borderRadius: 12, fontSize: 15,
                                }}
                                placeholder={strings.item_name}
                                value={name}
                                onChangeText={(text) => setName(text)}
                            />
                        </View>

                        {/* Description */}
                        <View>
                            <YambiText size="small" color="gray" text={strings.item_description} style={{ marginBottom: 8 }} />
                            <TextInput
                                placeholderTextColor={theme.gray}
                                maxLength={500}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                                style={{
                                    color: theme.text, backgroundColor: theme.background,
                                    borderColor: theme.border, borderWidth: 1,
                                    paddingHorizontal: 16, paddingVertical: 12,
                                    minHeight: 100, borderRadius: 12, fontSize: 15,
                                }}
                                placeholder={strings.item_description}
                                value={itemDescription}
                                onChangeText={(text) => setItemDescription(text)}
                            />
                        </View>
                    </View>

                    {/* ── CARD 3: Classification (Category, Colors, Sizes) ── */}
                    <View style={{ backgroundColor: theme.border + "15", borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: theme.border }}>
                        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
                            <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: theme.high_color + "20", justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
                                <IconApp pack="FI" name="grid" size={18} color={theme.high_color} />
                            </View>
                            <YambiText bold text={strings.item_category} style={{ fontSize: 16 }} />
                        </View>

                        {/* Category picker Pressable */}
                        <Pressable
                            onPress={() => setShowCategoryModal(true)}
                            style={{
                                flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                                backgroundColor: theme.background, borderRadius: 12, padding: 14,
                                borderWidth: 1, borderColor: theme.border, marginBottom: 12,
                            }}>
                            <View style={{ flex: 1 }}>
                                <YambiText size="small" color="gray" text={strings.item_category} style={{ marginBottom: 4 }} />
                                {show_category(selectedCategory) || <YambiText text={strings.select} color="gray" />}
                                {show_subcategory(selectedCategory, selectedSubCategory)}
                            </View>
                            <IconApp pack="FI" name="chevron-right" size={16} color={theme.gray} />
                        </Pressable>

                        {/* Colors + Sizes in a row */}
                        <View style={{ flexDirection: "row" }}>
                            <Pressable
                                onPress={() => setShowColorsModal(true)}
                                style={{ flex: 1, marginRight: 6, backgroundColor: theme.background, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: theme.border }}>
                                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                                    <YambiText size="small" color="high" text={strings.colors} bold />
                                    <IconApp pack="FI" name="chevron-right" size={14} color={theme.gray} />
                                </View>
                                <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                                    {activeColorsList.length > 0 ? (
                                        activeColorsList.map((color: string, index: number) => (
                                            <View key={index} style={{ marginRight: 4, borderRadius: 5, backgroundColor: color, height: 22, width: 22, borderWidth: 1, borderColor: theme.border, marginVertical: 2 }} />
                                        ))
                                    ) : (
                                        <YambiText size="small" color="gray" text={strings.select} />
                                    )}
                                </View>
                            </Pressable>

                            <Pressable
                                onPress={() => setShowSizesModal(true)}
                                style={{ flex: 1, marginLeft: 6, backgroundColor: theme.background, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: theme.border }}>
                                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                                    <YambiText size="small" color="high" text={strings.sizes} bold />
                                    <IconApp pack="FI" name="chevron-right" size={14} color={theme.gray} />
                                </View>
                                <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                                    {activeSizesList.length > 0 ? (
                                        activeSizesList.map((size: string, index: number) => (
                                            <View key={index} style={{ marginRight: 4, borderRadius: 5, backgroundColor: theme.background, height: 22, borderColor: theme.border, borderWidth: 1, alignItems: "center", paddingHorizontal: 8, justifyContent: "center", marginVertical: 2 }}>
                                                <YambiText size="small" text={size} />
                                            </View>
                                        ))
                                    ) : (
                                        <YambiText size="small" color="gray" text={strings.select} />
                                    )}
                                </View>
                            </Pressable>
                        </View>
                    </View>

                    {/* ── CARD 4: Dates & Expiry ── */}
                    <View style={{ backgroundColor: theme.border + "15", borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: theme.border }}>
                        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
                            <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: theme.high_color + "20", justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
                                <IconApp pack="FI" name="calendar" size={18} color={theme.high_color} />
                            </View>
                            <YambiText bold text={strings.manufacture_date} style={{ fontSize: 16 }} />
                        </View>
                        <View style={{ flexDirection: "row" }}>
                            <View style={{ flex: 1, marginRight: 8 }}>
                                <YambiText size="small" color="gray" text={strings.manufacture_date} style={{ marginBottom: 8 }} />
                                <Pressable
                                    onPress={() => setShowManufactureDatePicker(true)}
                                    style={{
                                        backgroundColor: theme.background, borderRadius: 12, height: 46,
                                        justifyContent: "center", paddingHorizontal: 12,
                                        borderWidth: 1, borderColor: showManufactureDatePicker ? theme.high_color : theme.border,
                                    }}>
                                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                                        <YambiText text={manufactureDate ? formatMonthYear(manufactureDateObj) : strings.select} />
                                        <IconApp pack="FI" name="calendar" size={16} color={manufactureDate ? theme.high_color : theme.gray} />
                                    </View>
                                </Pressable>
                                {showManufactureDatePicker && (
                                    <DateTimePicker
                                        value={manufactureDateObj}
                                        mode="date"
                                        display="default"
                                        onChange={(_event, selectedDate) => {
                                            setShowManufactureDatePicker(false);
                                            if (selectedDate) {
                                                const normalizedDate = normalizeToFirstOfMonth(selectedDate);
                                                setManufactureDateObj(normalizedDate);
                                                setManufactureDate(formatMonthYear(normalizedDate));
                                            }
                                        }}
                                    />
                                )}
                            </View>
                            <View style={{ flex: 1, marginLeft: 8 }}>
                                <YambiText size="small" color="gray" text={strings.expiry_date} style={{ marginBottom: 8 }} />
                                <Pressable
                                    onPress={() => setShowExpiryDatePicker(true)}
                                    style={{
                                        backgroundColor: theme.background, borderRadius: 12, height: 46,
                                        justifyContent: "center", paddingHorizontal: 12,
                                        borderWidth: 1, borderColor: showExpiryDatePicker ? theme.high_color : theme.border,
                                    }}>
                                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                                        <YambiText text={expiryDate ? formatMonthYear(expiryDateObj) : strings.select} />
                                        <IconApp pack="FI" name="calendar" size={16} color={expiryDate ? theme.high_color : theme.gray} />
                                    </View>
                                </Pressable>
                                {showExpiryDatePicker && (
                                    <DateTimePicker
                                        value={expiryDateObj}
                                        mode="date"
                                        display="default"
                                        onChange={(_event, selectedDate) => {
                                            setShowExpiryDatePicker(false);
                                            if (selectedDate) {
                                                const normalizedDate = normalizeToFirstOfMonth(selectedDate);
                                                setExpiryDateObj(normalizedDate);
                                                setExpiryDate(formatMonthYear(normalizedDate));
                                            }
                                        }}
                                    />
                                )}
                            </View>
                        </View>
                    </View>

                    {/* ── CARD 5: Pricing & Discount ── */}
                    <View style={{ backgroundColor: theme.border + "15", borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: theme.border }}>
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                                <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: theme.high_color + "20", justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
                                    <IconApp pack="FI" name="dollar-sign" size={18} color={theme.high_color} />
                                </View>
                                <YambiText bold text={strings.gros} style={{ fontSize: 16 }} />
                            </View>
                            {/* Discount selector button */}
                            <Pressable
                                onPress={() => setShowDiscountModal(true)}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: discountPercentage > 0 ? theme.high_color + "20" : theme.background,
                                    paddingHorizontal: 12,
                                    paddingVertical: 6,
                                    borderRadius: 10,
                                    borderWidth: 1,
                                    borderColor: discountPercentage > 0 ? theme.high_color : theme.border,
                                }}
                            >
                                <IconApp pack="FI" name="percent" size={14} color={theme.high_color} styles={{ marginRight: 6 }} />
                                <YambiText
                                    text={discountPercentage > 0 ? `${discountPercentage}% ${strings.discount}` : strings.discount}
                                    bold={discountPercentage > 0}
                                    color="high"
                                    size="small"
                                />
                            </Pressable>
                        </View>

                        <View style={{ flexDirection: "row" }}>
                            <View style={{ flex: 1, marginRight: 8 }}>
                                <YambiText size="small" color="gray" text={wholesale_and_retail ? strings.cost_price + " (" + strings.gros + ")" : strings.cost_price} style={{ marginBottom: 8 }} numberLines={2} />
                                <TextInput
                                    placeholderTextColor={theme.gray}
                                    maxLength={20}
                                    keyboardType="numeric"
                                    style={{ color: theme.text, backgroundColor: theme.background, borderColor: theme.border, borderWidth: 1, paddingHorizontal: 16, minHeight: 46, borderRadius: 12, fontSize: 15 }}
                                    value={wholesale_cost_price}
                                    onChangeText={(text) => setWholesale_cost_price(text)}
                                />
                            </View>
                            <View style={{ flex: 1, marginLeft: 8 }}>
                                <YambiText size="small" color="gray" text={wholesale_and_retail ? strings.selling_price + " (" + strings.gros + ")" : strings.selling_price} style={{ marginBottom: 8 }} numberLines={2} />
                                <TextInput
                                    placeholderTextColor={theme.gray}
                                    maxLength={20}
                                    keyboardType="numeric"
                                    style={{ color: theme.text, backgroundColor: theme.background, borderColor: theme.border, borderWidth: 1, paddingHorizontal: 16, minHeight: 46, borderRadius: 12, fontSize: 15 }}
                                    value={wholesale_selling_price}
                                    onChangeText={(text) => setWholesale_selling_price(text)}
                                />
                            </View>
                        </View>

                        {wholesale_and_retail && (
                            <View style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderColor: theme.border }}>
                                <YambiText bold text={strings.detail} style={{ marginBottom: 12 }} />
                                <View style={{ flexDirection: "row" }}>
                                    <View style={{ flex: 1, marginRight: 8 }}>
                                        <YambiText size="small" color="gray" text={strings.selling_price + " (" + strings.detail + ")"} style={{ marginBottom: 8 }} />
                                        <TextInput
                                            placeholderTextColor={theme.gray}
                                            maxLength={20}
                                            keyboardType="numeric"
                                            style={{ color: theme.text, backgroundColor: theme.background, borderColor: theme.border, borderWidth: 1, paddingHorizontal: 16, minHeight: 46, borderRadius: 12, fontSize: 15 }}
                                            value={retail_selling_price}
                                            onChangeText={(text) => setRetail_selling_price(text)}
                                        />
                                    </View>
                                    {retail_selling_price !== "" && wholesale_content_number !== "" && wholesale_cost_price !== "" && (
                                        <View style={{ flex: 1, marginLeft: 8 }}>
                                            <YambiText size="small" color="gray" text={strings.cost_price + " (" + strings.detail + ")"} style={{ marginBottom: 8 }} />
                                            <TextInput
                                                maxLength={20}
                                                editable={false}
                                                keyboardType="numeric"
                                                style={{ color: theme.text, backgroundColor: theme.background, borderColor: theme.border, borderWidth: 1, paddingHorizontal: 16, minHeight: 46, borderRadius: 12, fontSize: 15 }}
                                                value={
                                                    parseInt(wholesale_content_number, 10) > 0 && parseInt(wholesale_cost_price, 10) > 0
                                                        ? (parseInt(wholesale_cost_price, 10) / parseInt(wholesale_content_number, 10)).toString()
                                                        : ""
                                                }
                                            />
                                        </View>
                                    )}
                                </View>
                            </View>
                        )}
                    </View>

                    {/* ── CARD 6: Quantity & Inventory ── */}
                    <View style={{ backgroundColor: theme.border + "15", borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: theme.border }}>
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                                <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: theme.high_color + "20", justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
                                    <IconApp pack="FI" name="package" size={18} color={theme.high_color} />
                                </View>
                                <YambiText bold text={strings.quantity} style={{ fontSize: 16 }} />
                            </View>
                            {wholesale_and_retail && (
                                <Pressable
                                    onPress={() => setWholesale_quantity(!wholesale_quantity)}
                                    style={{ flexDirection: "row", alignItems: "center" }}>
                                    <IconApp pack="IO" name="checkmark-circle" size={16} color={theme.high_color} />
                                    <YambiText color="high" text={wholesale_quantity ? strings.wholesale_quantity : strings.retail_quantity} style={{ marginLeft: 6 }} />
                                </Pressable>
                            )}
                        </View>

                        <View style={{ flexDirection: "row" }}>
                            <View style={{ flex: 1, marginRight: 6 }}>
                                <YambiText size="small" color="gray" text={strings.wholesale_content_number} style={{ marginBottom: 8 }} numberLines={2} />
                                <TextInput
                                    placeholderTextColor={theme.gray}
                                    maxLength={20}
                                    editable={wholesale_and_retail}
                                    keyboardType="numeric"
                                    style={{ color: theme.text, backgroundColor: theme.background, borderColor: theme.border, borderWidth: 1, paddingHorizontal: 16, minHeight: 46, borderRadius: 12, fontSize: 15 }}
                                    value={wholesale_content_number}
                                    onChangeText={(text) => setWholesale_content_number(text)}
                                />
                            </View>
                            <View style={{ flex: 1, marginHorizontal: 6 }}>
                                <YambiText size="small" color="gray" text={strings.items_number + " " + strings.in_store} style={{ marginBottom: 8 }} numberLines={2} />
                                <TextInput
                                    placeholderTextColor={theme.gray}
                                    maxLength={20}
                                    keyboardType="numeric"
                                    style={{ color: theme.text, backgroundColor: theme.background, borderColor: theme.border, borderWidth: 1, paddingHorizontal: 16, minHeight: 46, borderRadius: 12, fontSize: 15 }}
                                    value={wholesale_number_stock}
                                    onChangeText={(text) => setWholesale_number_stock(text)}
                                />
                            </View>
                            <View style={{ flex: 1, marginLeft: 6 }}>
                                <YambiText size="small" color="gray" text={strings.items_number + " " + strings.in_warehouse} style={{ marginBottom: 8 }} numberLines={2} />
                                <TextInput
                                    placeholderTextColor={theme.gray}
                                    maxLength={20}
                                    keyboardType="numeric"
                                    style={{ color: theme.text, backgroundColor: theme.background, borderColor: theme.border, borderWidth: 1, paddingHorizontal: 16, minHeight: 46, borderRadius: 12, fontSize: 15 }}
                                    value={wholesale_number_warehouse}
                                    onChangeText={(text) => setWholesale_number_warehouse(text)}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Submit Button */}
                    <ButtonNormal
                        title={strings.save}
                        loadEnabled={true}
                        onPress={AddItem}
                        styles={{ paddingHorizontal: 20, marginTop: 8, height: 48, borderRadius: 24 }}
                        normal={true}
                    />
                </View>

                {/* ── BOTTOM SHEETS FOR SELECTORS ── */}

                {/* Category BottomSheet */}
                {showCategoryModal ? (
                    <BottomSheet
                        visible={showCategoryModal}
                        onClose={() => setShowCategoryModal(false)}
                    >
                        <View style={{ paddingBottom: 10, paddingHorizontal: 20 }}>
                            {Object.values(items_categories).map((cat: any) => (
                                <View key={cat.id} style={{ marginBottom: 12 }}>
                                    <View style={{
                                        paddingVertical: 8,
                                        paddingHorizontal: 12,
                                        backgroundColor: theme.high_color + "15",
                                        borderRadius: 8,
                                        marginBottom: 6,
                                    }}>
                                        <YambiText text={cat.name.toUpperCase()} bold color="high" />
                                    </View>
                                    {cat.subcategories && (
                                        <View style={{ paddingLeft: 8 }}>
                                            {Object.entries(cat.subcategories).map(([subKey, subValue]) => {
                                                const isSelected = selectedSubCategory === subKey;
                                                return (
                                                    <Pressable
                                                        key={subKey}
                                                        onPress={() => {
                                                            setSelectedCategory(cat.id);
                                                            setSelectedSubCategory(subKey);
                                                        }}
                                                        style={{
                                                            flexDirection: 'row',
                                                            alignItems: 'center',
                                                            paddingVertical: 12,
                                                            paddingHorizontal: 12,
                                                            marginVertical: 2,
                                                            backgroundColor: isSelected ? theme.high_color + "20" : 'transparent',
                                                            borderRadius: 10,
                                                            borderWidth: 1,
                                                            borderColor: isSelected ? theme.high_color + "60" : 'transparent',
                                                        }}
                                                    >
                                                        <YambiText
                                                            text={subValue + ""}
                                                            bold={isSelected}
                                                            style={{ flex: 1, color: isSelected ? theme.high_color : theme.text }}
                                                        />
                                                        {isSelected ? (
                                                            <IconApp pack="IO" name="checkmark-circle" size={20} color={theme.high_color} />
                                                        ) : null}
                                                    </Pressable>
                                                );
                                            })}
                                        </View>
                                    )}
                                </View>
                            ))}
                        </View>
                    </BottomSheet>
                ) : null}

                {/* Colors BottomSheet */}
                {showColorsModal ? (
                    <BottomSheet
                        visible={showColorsModal}
                        onClose={() => setShowColorsModal(false)}
                    >
                        <View style={{ paddingBottom: 20, paddingHorizontal: 20 }}>
                            <YambiText bold text={strings.choose_colors} style={{ fontSize: 16, marginBottom: 12 }} />
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                                {COLORS_LIST.map((color) => {
                                    const isSelected = activeColorsList.includes(color);
                                    return (
                                        <Pressable
                                            key={color}
                                            onPress={() => toggleColorItem(color)}
                                            style={{
                                                flexDirection: "row",
                                                alignItems: "center",
                                                paddingVertical: 10,
                                                paddingHorizontal: 14,
                                                borderRadius: 12,
                                                backgroundColor: isSelected ? theme.high_color + "20" : theme.border + "15",
                                                borderWidth: 1.5,
                                                borderColor: isSelected ? theme.high_color : theme.border,
                                            }}
                                        >
                                            <View
                                                style={{
                                                    width: 18,
                                                    height: 18,
                                                    borderRadius: 9,
                                                    backgroundColor: color,
                                                    marginRight: 10,
                                                    borderWidth: 1,
                                                    borderColor: "gray",
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                }}
                                            />
                                            <YambiText text={getColorName(color)} size="small" bold={isSelected} style={{ color: isSelected ? theme.high_color : theme.text, marginRight: isSelected ? 4 : 0 }} />
                                            {isSelected ? (
                                                <IconApp pack="IO" name="checkmark-circle" size={16} color={theme.high_color} />
                                            ) : null}
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </View>
                    </BottomSheet>
                ) : null}

                {/* Sizes BottomSheet */}
                {showSizesModal ? (
                    <BottomSheet
                        visible={showSizesModal}
                        onClose={() => setShowSizesModal(false)}
                    >
                        <View style={{ paddingBottom: 20, paddingHorizontal: 20 }}>
                            <YambiText bold text={strings.choose_sizes} style={{ fontSize: 16, marginBottom: 12 }} />
                            {Object.entries(GENERAL_SIZES).map(([catKey, sizes]) => (
                                <View key={catKey} style={{ marginBottom: 16 }}>
                                    <YambiText
                                        text={(strings[catKey as keyof typeof strings] as string) || catKey}
                                        bold
                                        style={{ fontSize: 15, marginBottom: 8 }}
                                    />
                                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                                        {sizes.map((size: string) => {
                                            const isSelected = activeSizesList.includes(size);
                                            return (
                                                <Pressable
                                                    key={size}
                                                    onPress={() => toggleSizeItem(size)}
                                                    style={{
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                        paddingVertical: 8,
                                                        paddingHorizontal: 14,
                                                        borderRadius: 10,
                                                        borderWidth: 1.5,
                                                        borderColor: isSelected ? theme.high_color : theme.border,
                                                        backgroundColor: isSelected ? theme.high_color + "25" : theme.border + "15",
                                                    }}
                                                >
                                                    <YambiText text={size} bold={isSelected} style={{ color: isSelected ? theme.high_color : theme.text, marginRight: isSelected ? 4 : 0 }} />
                                                    {isSelected ? (
                                                        <IconApp pack="IO" name="checkmark-circle" size={14} color={theme.high_color} />
                                                    ) : null}
                                                </Pressable>
                                            );
                                        })}
                                    </View>
                                </View>
                            ))}
                        </View>
                    </BottomSheet>
                ) : null}

                {/* Currencies BottomSheet */}
                {showCurrencies ? (
                    <BottomSheet
                        visible={showCurrencies}
                        onClose={() => setShowCurrencies(false)}
                    >
                        <View style={{ paddingBottom: 10, paddingHorizontal: 20 }}>
                            {(global_currencies as number[]).map((curr, index) => {
                                const isSelected = currency === curr;
                                return (
                                    <Pressable
                                        key={curr}
                                        onPress={() => {
                                            setCurrency(curr);
                                        }}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            paddingVertical: 14,
                                            paddingHorizontal: 14,
                                            borderRadius: 12,
                                            marginVertical: 3,
                                            backgroundColor: isSelected ? theme.high_color + "18" : 'transparent',
                                            borderWidth: 1,
                                            borderColor: isSelected ? theme.high_color + "50" : 'transparent',
                                        }}
                                    >
                                        <YambiText text={`${index + 1}.`} style={{ width: 30 }} color="gray" />
                                        <YambiText
                                            text={renderCurrency(curr, true)}
                                            bold={isSelected}
                                            style={{ flex: 1, fontSize: 15, color: isSelected ? theme.high_color : theme.text }}
                                        />
                                        {isSelected ? (
                                            <IconApp pack="IO" name="checkmark-circle" size={22} color={theme.high_color} />
                                        ) : null}
                                    </Pressable>
                                );
                            })}
                        </View>
                    </BottomSheet>
                ) : null}

                {/* Discount BottomSheet with Start and End Dates */}
                {showDiscountModal ? (
                    <BottomSheet
                        visible={showDiscountModal}
                        onClose={() => setShowDiscountModal(false)}
                    >
                        <View style={{ paddingBottom: 20, paddingHorizontal: 20 }}>
                            <YambiText bold text={strings.discount} style={{ fontSize: 16, marginBottom: 14 }} />

                            <YambiText size="small" color="gray" text={strings.discount_percentage} style={{ marginBottom: 6 }} />
                            <TextInput
                                placeholder={strings.discount_percentage}
                                placeholderTextColor={theme.gray}
                                keyboardType="numeric"
                                style={{
                                    backgroundColor: theme.background,
                                    color: theme.text,
                                    borderRadius: 12,
                                    paddingHorizontal: 14,
                                    height: 46,
                                    borderWidth: 1,
                                    borderColor: theme.border,
                                    marginBottom: 16,
                                    fontSize: 15,
                                }}
                                value={discountPercentage > 0 ? discountPercentage.toString() : ""}
                                onChangeText={(val) => setDiscountPercentage(parseInt(val) || 0)}
                            />

                            <YambiText size="small" color="gray" text={strings.select} style={{ marginBottom: 6 }} />
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                                {[5, 10, 15, 20, 25, 30, 50].map((pct) => {
                                    const isSel = discountPercentage === pct;
                                    return (
                                        <Pressable
                                            key={pct}
                                            onPress={() => setDiscountPercentage(pct)}
                                            style={{
                                                paddingVertical: 8,
                                                paddingHorizontal: 16,
                                                borderRadius: 10,
                                                borderWidth: 1.5,
                                                borderColor: isSel ? theme.high_color : theme.border,
                                                backgroundColor: isSel ? theme.high_color + "25" : theme.border + "15",
                                            }}
                                        >
                                            <YambiText text={`${pct}%`} bold={isSel} style={{ color: isSel ? theme.high_color : theme.text }} />
                                        </Pressable>
                                    );
                                })}
                            </View>

                            {/* Discount Validity Dates */}
                            <YambiText bold text={strings.valid_until || "Discount Validity Dates"} style={{ fontSize: 14, marginBottom: 10 }} />
                            <View style={{ flexDirection: "row", marginBottom: 16, gap: 10 }}>
                                <View style={{ flex: 1 }}>
                                    <YambiText size="small" color="gray" text={strings.start_date_time || "Start Date"} style={{ marginBottom: 6 }} />
                                    <Pressable
                                        onPress={() => setShowDiscountStartDatePicker(true)}
                                        style={{
                                            backgroundColor: theme.background, borderRadius: 12, height: 46,
                                            justifyContent: "center", paddingHorizontal: 12,
                                            borderWidth: 1, borderColor: showDiscountStartDatePicker ? theme.high_color : theme.border,
                                        }}>
                                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                                            <YambiText text={discountStartDate ? moment(discountStartDate).format('YYYY-MM-DD') : strings.select} size="small" />
                                            <IconApp pack="FI" name="calendar" size={16} color={discountStartDate ? theme.high_color : theme.gray} />
                                        </View>
                                    </Pressable>
                                    {showDiscountStartDatePicker && (
                                        <DateTimePicker
                                            value={discountStartDateObj}
                                            mode="date"
                                            display="default"
                                            onChange={(_event, selectedDate) => {
                                                setShowDiscountStartDatePicker(false);
                                                if (selectedDate) {
                                                    setDiscountStartDateObj(selectedDate);
                                                    setDiscountStartDate(selectedDate.toISOString());
                                                }
                                            }}
                                        />
                                    )}
                                </View>
                                <View style={{ flex: 1 }}>
                                    <YambiText size="small" color="gray" text={strings.end_date_time || "End Date"} style={{ marginBottom: 6 }} />
                                    <Pressable
                                        onPress={() => setShowDiscountEndDatePicker(true)}
                                        style={{
                                            backgroundColor: theme.background, borderRadius: 12, height: 46,
                                            justifyContent: "center", paddingHorizontal: 12,
                                            borderWidth: 1, borderColor: showDiscountEndDatePicker ? theme.high_color : theme.border,
                                        }}>
                                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                                            <YambiText text={discountEndDate ? moment(discountEndDate).format('YYYY-MM-DD') : strings.select} size="small" />
                                            <IconApp pack="FI" name="calendar" size={16} color={discountEndDate ? theme.high_color : theme.gray} />
                                        </View>
                                    </Pressable>
                                    {showDiscountEndDatePicker && (
                                        <DateTimePicker
                                            value={discountEndDateObj}
                                            mode="date"
                                            display="default"
                                            onChange={(_event, selectedDate) => {
                                                setShowDiscountEndDatePicker(false);
                                                if (selectedDate) {
                                                    setDiscountEndDateObj(selectedDate);
                                                    setDiscountEndDate(selectedDate.toISOString());
                                                }
                                            }}
                                        />
                                    )}
                                </View>
                            </View>

                            <ButtonNormal
                                title={strings.validate}
                                onPress={() => setShowDiscountModal(false)}
                                styles={{ height: 48, borderRadius: 24, marginTop: 6 }}
                                normal={true}
                            />
                        </View>
                    </BottomSheet>
                ) : null}

            </ScrollView>
        </View>
    );
};

export default NewBusinessItem;
