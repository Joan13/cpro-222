import { View, ScrollView, TextInput, Pressable } from "react-native";
import { useState, useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../store/app/hooks";
import { strings } from "../../lang/lang";
import ButtonNormal from "../../components/app/ButtonNormal";
import { IconApp } from "../../components/app/IconApp";
import { YambiText } from "../../components/app/Text";
import ModalApp from "../../components/app/ModalApp";
import { FlashList } from "@shopify/flash-list";
import { setLoadingButton, setShowModalApp } from "../../store/reducers/appSlice";
import { global_currencies, randomString, renderCurrency, renderDateUpToMilliseconds, SocketApp } from "../../../GlobalVariables";
import { NavProps, TBusinessSubscription, TItem, TItemPrices } from "../../types/types";
import { useQuery, useRealm } from "@realm/react";
import moment from "moment";
import SwitchApp from "../../components/app/SwitchApp";
import DateTimePicker from "@react-native-community/datetimepicker";
import { UserBusinessArticles } from "../../store/database/Models";

const COLORS_LIST = [
    "red", "blue", "green", "maroon", "yellow", "black", "white", "purple", "pink", "orange", "gray", "chocolate",
];

const GENERAL_SIZES = {
    clothing: ["2T", "3T", "4T", "5T", "XS", "S", "M", "L", "XL", "XXL", "XXXL"],
    pants: ["28", "30", "32", "34", "36", "38", "40"],
    shoes: ["30", "32", "35", "37", "38", "40", "42", "43", "44", "45", "46", "47"],
    hats: ["S/M", "M/L", "L/XL", "One Size"],
    gloves: ["S", "M", "L", "XL"],
};

const NewBusinessItem = ({ route, navigation }: NavProps) => {
    const { business_id } = route.params;

    const theme = useAppSelector((state) => state.app_theme.colors);
    const app_description = useAppSelector((state) => state.persisted_app.app_description);
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
        0: 15,    // Free
        1: 150,   // Basic
        2: 400,   // Premium X
        3: 3000,  // Ultimate
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

    const safeJsonStringArray = (raw: string): string[] => {
        try {
            const x = JSON.parse(raw);
            return Array.isArray(x) ? x.filter((v): v is string => typeof v === "string") : [];
        } catch {
            return [];
        }
    };

    const show_category = (category: string) => {
        if (category === null || category === undefined || category === "") return;
        const index = strings.items_categories[category as keyof typeof strings.items_categories] as { name: string } | undefined;
        if (index === undefined) return;
        return <YambiText color="high" text={index.name} bold />;
    };

    const show_subcategory = (category: string, subcategory: string) => {
        if (category === null || category === undefined || category === "") return;
        const index = strings.items_categories[category as keyof typeof strings.items_categories] as
            | { subcategories: Record<string, string> }
            | undefined;
        if (index === undefined || index.subcategories[subcategory] === undefined) return;
        return <YambiText color="high" text={index.subcategories[subcategory]} bold />;
    };

    const CategoryModal = () => (
        <ModalApp
            paddings={false}
            onClose={() => {
                setShowCategoryModal(false);
                dispatch(setShowModalApp(false));
            }}
            singleButton
            title={strings.choose_category}>
            <ScrollView>
                {Object.values(items_categories).map((cat: { id: string; name: string; subcategories?: Record<string, string> }) => (
                    <View key={cat.id}>
                        <Pressable
                            style={{
                                paddingVertical: 10,
                                backgroundColor: selectedCategory === cat.id ? theme.high_color + "50" : theme.background,
                                borderRadius: 7,
                                paddingLeft: 10,
                            }}>
                            <YambiText text={cat.name.toUpperCase()} bold />
                        </Pressable>
                        {cat.subcategories && (
                            <View style={{ marginLeft: 15 }}>
                                {Object.entries(cat.subcategories).map(([subKey, subValue]) => (
                                    <Pressable
                                        key={subKey}
                                        onPress={() => {
                                            setSelectedCategory(cat.id);
                                            setSelectedSubCategory(subKey);
                                            setShowCategoryModal(false);
                                            dispatch(setShowModalApp(false));
                                        }}
                                        style={{
                                            paddingVertical: 8,
                                            marginVertical: 2,
                                            paddingLeft: 10,
                                            backgroundColor:
                                                selectedSubCategory === subKey ? theme.high_color + "50" : theme.background,
                                            borderRadius: 7,
                                        }}>
                                        <YambiText text={subValue + ""} />
                                    </Pressable>
                                ))}
                            </View>
                        )}
                    </View>
                ))}
            </ScrollView>
        </ModalApp>
    );

    const ColorsModal = () => {
        const [cc, setCc] = useState<string[]>([]);

        const setColor = (color: string) => {
            const ff = cc.find((e) => e === color);
            if (ff === undefined) {
                setCc((prev) => [...prev, color]);
            } else {
                setCc(cc.filter((e) => e !== color));
            }
        };

        useEffect(() => {
            if (selectedColors !== "" && selectedColors !== "[]") {
                try {
                    setCc(JSON.parse(selectedColors));
                } catch {
                    setCc([]);
                }
            }
        }, []);

        const find_color_inList = (color: string) => cc.find((e) => e === color) !== undefined;

        return (
            <ModalApp
                paddings={false}
                onClose={() => {
                    setShowColorsModal(false);
                    dispatch(setShowModalApp(false));
                }}
                singleButton={false}
                textAction={strings.add_colors}
                onAction={() => {
                    setSelectedColors(JSON.stringify(cc));
                    setShowColorsModal(false);
                    dispatch(setShowModalApp(false));
                }}
                title={strings.choose_colors}>
                <ScrollView style={{ width: "100%" }}>
                    {COLORS_LIST.map((color) => (
                        <Pressable
                            key={color}
                            onPress={() => setColor(color)}
                            style={{ flexDirection: "row", alignItems: "center", padding: 5, paddingHorizontal: 20 }}>
                            <View
                                style={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: 10,
                                    backgroundColor: find_color_inList(color) ? theme.high_color + "70" : theme.background,
                                    marginRight: 10,
                                    borderWidth: 1,
                                    borderColor: "gray",
                                }}
                            />
                            <View style={{ marginHorizontal: 6, borderRadius: 5, backgroundColor: color, height: 15, width: 25 }} />
                            <YambiText text={String((strings as unknown as Record<string, string>)[color] ?? color)} />
                        </Pressable>
                    ))}
                </ScrollView>
            </ModalApp>
        );
    };

    const SizesModal = () => {
        const [cc, setCc] = useState<string[]>([]);

        const setSizes = (size: string) => {
            const ff = cc.find((e) => e === size);
            if (ff === undefined) {
                setCc((prev) => [...prev, size]);
            } else {
                setCc(cc.filter((e) => e !== size));
            }
        };

        useEffect(() => {
            if (selectedSizes !== "" && selectedSizes !== "[]") {
                try {
                    setCc(JSON.parse(selectedSizes));
                } catch {
                    setCc([]);
                }
            }
        }, []);

        const find_size_inList = (size: string) => cc.find((e) => e === size) !== undefined;

        return (
            <ModalApp
                paddings={false}
                onClose={() => {
                    setShowSizesModal(false);
                    dispatch(setShowModalApp(false));
                }}
                singleButton={false}
                textAction={strings.sizes}
                onAction={() => {
                    setSelectedSizes(JSON.stringify(cc));
                    setShowSizesModal(false);
                    dispatch(setShowModalApp(false));
                }}
                title={strings.choose_sizes}>
                <ScrollView>
                    {Object.entries(GENERAL_SIZES).map(([category, sizes]) => (
                        <Pressable key={category} style={{ marginBottom: 15, paddingHorizontal: 20 }}>
                            <YambiText
                                text={(strings[category as keyof typeof strings] as string) || category}
                                bold
                                style={{ fontSize: 16, marginBottom: 8 }}
                            />
                            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                                {sizes.map((size: string) => (
                                    <Pressable
                                        key={size}
                                        onPress={() => setSizes(size)}
                                        style={{
                                            flexDirection: "row",
                                            alignItems: "center",
                                            paddingVertical: 6,
                                            paddingHorizontal: 10,
                                            margin: 4,
                                            borderRadius: 6,
                                            borderWidth: 1,
                                            borderColor: find_size_inList(size) ? theme.high_color : "gray",
                                            backgroundColor: find_size_inList(size) ? theme.high_color + "30" : theme.background,
                                        }}>
                                        <YambiText text={size} />
                                    </Pressable>
                                ))}
                            </View>
                        </Pressable>
                    ))}
                </ScrollView>
            </ModalApp>
        );
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
                discount_percentage: 0,
                discount_start_date: "",
                discount_end_date: "",
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

                dispatch(setLoadingButton(false));
            }, 300);
        }
    };

    const RenderCurrency = ({
        item,
        index,
        selectCurrency,
    }: {
        item: number;
        index: number;
        selectCurrency: (currency: number) => void;
    }) => {
        const pressCurrency = () => {
            selectCurrency(item);
            dispatch(setShowModalApp(false));
            setShowCurrencies(false);
        };

        return (
            <Pressable
                style={{
                    backgroundColor: theme.background,
                    flex: 1,
                    flexDirection: "row",
                    borderRadius: 8,
                    height: 50,
                    alignItems: "center",
                    borderBottomWidth: 1,
                    borderColor: theme.border,
                    paddingHorizontal: 15,
                }}
                onPress={pressCurrency}>
                <YambiText text={index + 1 + "."} style={{ width: 35 }} />
                <YambiText text={renderCurrency(item, true)} style={{ flex: 1 }} />
            </Pressable>
        );
    };

    const Currencies = () => {
        return (
            <View
                style={{
                    width: "100%",
                    height: 300,
                }}>
                <FlashList
                    data={global_currencies as never}
                    estimatedItemSize={50}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item, index }: { item: number; index: number }) => (
                        <RenderCurrency selectCurrency={() => setCurrency(index + 1)} item={item} index={index} />
                    )}
                />
            </View>
        );
    };

    const GrosDetail = () => {
        setWholesale_and_retail(!wholesale_and_retail);
        setWholesale_content_number("1");
    };

    return (
        <View style={{ borderColor: theme.border, borderTopWidth: 1, backgroundColor: theme.background, flex: 1 }}>
            <ScrollView style={{ paddingHorizontal: 5 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

                {/* ── Modals ── */}
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
                        textAction={(strings as any).add_subscription || "Add Subscription"}
                        textCancel={strings.close || "Close"}
                        onAction={() => {
                            dispatch(setShowModalApp(false));
                            setShowPlanLimitModal(false);
                            navigation.navigate("AddBusinessSubscription", { business_id });
                        }}
                        title={strings.error}
                    >
                        <YambiText color="gray" text={(strings as any).max_items_reached || "You have used all available item tokens for your current plan. Upgrade your subscription to add more items."} />
                    </ModalApp>
                )}
                {showCurrencies && (
                    <ModalApp paddings={false} onClose={() => { dispatch(setShowModalApp(false)); setShowCurrencies(false); }} singleButton title={strings.currency}>
                        <Currencies />
                    </ModalApp>
                )}

                <View style={{ marginTop: 16, paddingBottom: 50 }}>

                    {/* ── Settings Card ── */}
                    <View style={{ backgroundColor: theme.card, borderRadius: 20, padding: 16, marginBottom: 12 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
                            <IconApp pack="FI" name="settings" size={16} color={theme.high_color} />
                            <YambiText bold text={strings.settings} style={{ marginLeft: 8 }} />
                        </View>

                        {/* Gros/Detail toggle */}
                        <View style={{ marginBottom: 14 }}>
                            <YambiText size="small" color="gray" text={strings.include} style={{ marginBottom: 8 }} />
                            <Pressable
                                onPress={GrosDetail}
                                style={{
                                    flexDirection: "row", alignItems: "center",
                                    backgroundColor: theme.background, borderRadius: 12, padding: 12,
                                    borderWidth: 1, borderColor: theme.border,
                                }}>
                                <IconApp color={theme.high_color} name={!wholesale_and_retail ? "circle" : "check-circle"} size={20} pack={!wholesale_and_retail ? "FI" : "FA"} />
                                <YambiText text={strings.gros + " " + strings.and + " " + strings.detail} color="high" numberLines={1} style={{ marginLeft: 10, flex: 1 }} />
                            </Pressable>
                        </View>

                        {/* Currency selector */}
                        <View>
                            <YambiText size="small" color="gray" text={strings.currency} style={{ marginBottom: 8 }} />
                            <Pressable
                                onPress={() => { dispatch(setShowModalApp(true)); setShowCurrencies(true); }}
                                style={{
                                    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                                    backgroundColor: theme.background, borderRadius: 12, padding: 12,
                                    borderWidth: 1, borderColor: theme.border,
                                }}>
                                <YambiText color="high" text={renderCurrency(currency, true)} numberLines={1} />
                                <IconApp pack="FI" name="chevron-down" size={16} color={theme.gray} />
                            </Pressable>
                        </View>
                    </View>

                    {/* ── Item Info Card ── */}
                    <View style={{ backgroundColor: theme.card, borderRadius: 20, padding: 16, marginBottom: 12 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
                            <IconApp pack="FI" name="tag" size={16} color={theme.high_color} />
                            <YambiText bold text={strings.item_name} style={{ marginLeft: 8 }} />
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
                                value={itemDescription}
                                onChangeText={(text) => setItemDescription(text)}
                            />
                        </View>
                    </View>

                    {/* ── Dates Card ── */}
                    <View style={{ backgroundColor: theme.card, borderRadius: 20, padding: 16, marginBottom: 12 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
                            <IconApp pack="FI" name="calendar" size={16} color={theme.high_color} />
                            <YambiText bold text={strings.manufacture_date} style={{ marginLeft: 8 }} />
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

                    {/* ── Classification Card (Category / Colors / Sizes) ── */}
                    <View style={{ backgroundColor: theme.card, borderRadius: 20, padding: 16, marginBottom: 12 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
                            <IconApp pack="FI" name="grid" size={16} color={theme.high_color} />
                            <YambiText bold text={strings.item_category} style={{ marginLeft: 8 }} />
                        </View>

                        {/* Category picker */}
                        <Pressable
                            onPress={() => { setShowCategoryModal(true); dispatch(setShowModalApp(true)); }}
                            style={{
                                flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                                backgroundColor: theme.background, borderRadius: 12, padding: 14,
                                borderWidth: 1, borderColor: theme.border, marginBottom: 12,
                            }}>
                            <View style={{ flex: 1 }}>
                                <YambiText size="small" color="gray" text={strings.item_category} style={{ marginBottom: 2 }} />
                                {show_category(selectedCategory) || <YambiText text={strings.select} color="gray" />}
                                {show_subcategory(selectedCategory, selectedSubCategory)}
                            </View>
                            <IconApp pack="FI" name="chevron-right" size={16} color={theme.gray} />
                        </Pressable>

                        {/* Colors + Sizes in a row */}
                        <View style={{ flexDirection: "row" }}>
                            <Pressable
                                onPress={() => { setShowColorsModal(true); dispatch(setShowModalApp(true)); }}
                                style={{ flex: 1, marginRight: 6, backgroundColor: theme.background, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: theme.border }}>
                                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                                    <YambiText size="small" color="high" text={strings.colors} bold />
                                    <IconApp pack="FI" name="chevron-right" size={14} color={theme.gray} />
                                </View>
                                <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                                    {selectedColors && selectedColors !== "[]" ?
                                        safeJsonStringArray(selectedColors).map((color: string, index: number) => (
                                            <View key={index} style={{ marginRight: 4, borderRadius: 5, backgroundColor: color, height: 22, width: 22, borderWidth: 1, borderColor: theme.border, marginVertical: 2 }} />
                                        )) : <YambiText size="small" color="gray" text={strings.select} />}
                                </View>
                            </Pressable>

                            <Pressable
                                onPress={() => { setShowSizesModal(true); dispatch(setShowModalApp(true)); }}
                                style={{ flex: 1, marginLeft: 6, backgroundColor: theme.background, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: theme.border }}>
                                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                                    <YambiText size="small" color="high" text={strings.sizes} bold />
                                    <IconApp pack="FI" name="chevron-right" size={14} color={theme.gray} />
                                </View>
                                <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                                    {selectedSizes && selectedSizes !== "[]" ?
                                        safeJsonStringArray(selectedSizes).map((size: string, index: number) => (
                                            <View key={index} style={{ marginRight: 4, borderRadius: 5, backgroundColor: theme.background, height: 22, borderColor: theme.border, borderWidth: 1, alignItems: "center", paddingHorizontal: 8, justifyContent: "center", marginVertical: 2 }}>
                                                <YambiText size="small" text={size} />
                                            </View>
                                        )) : <YambiText size="small" color="gray" text={strings.select} />}
                                </View>
                            </Pressable>
                        </View>
                    </View>

                    {/* ── Prices Card ── */}
                    <View style={{ backgroundColor: theme.card, borderRadius: 20, padding: 16, marginBottom: 12 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
                            <IconApp pack="FI" name="dollar-sign" size={16} color={theme.high_color} />
                            <YambiText bold text={strings.gros} style={{ marginLeft: 8 }} />
                        </View>

                        <View style={{ flexDirection: "row" }}>
                            <View style={{ flex: 1, marginRight: 8 }}>
                                <YambiText size="small" color="gray" text={wholesale_and_retail ? strings.cost_price + " (" + strings.gros + ")" : strings.cost_price} style={{ marginBottom: 8 }} numberLines={2} />
                                <TextInput
                                    placeholderTextColor={theme.gray}
                                    maxLength={20}
                                    multiline
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

                    {/* ── Quantity Card ── */}
                    <View style={{ backgroundColor: theme.card, borderRadius: 20, padding: 16, marginBottom: 12 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                                <IconApp pack="FI" name="package" size={16} color={theme.high_color} />
                                <YambiText bold text={strings.quantity} style={{ marginLeft: 8 }} />
                            </View>
                            {wholesale_and_retail && (
                                <Pressable
                                    onPress={() => setWholesale_quantity(!wholesale_quantity)}
                                    style={{ flexDirection: "row", alignItems: "center" }}>
                                    <IconApp pack="FA" name="check-circle" size={15} color={theme.high_color} />
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

                    <ButtonNormal
                        title={strings.save}
                        loadEnabled={true}
                        onPress={AddItem}
                        styles={{ paddingHorizontal: 20, marginTop: 8 }}
                        normal={true}
                    />
                </View>

                {showCategoryModal && <CategoryModal />}
                {showColorsModal && <ColorsModal />}
                {showSizesModal && <SizesModal />}
            </ScrollView>
        </View>
    );
};

export default NewBusinessItem;
