import { View, Alert, ScrollView, TextInput, Pressable, ActivityIndicator, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from "../../store/app/hooks";
import { strings } from "../../lang/lang";
import ButtonNormal from "../../components/app/ButtonNormal";
import { IconApp } from "../../components/app/IconApp";
import { YambiText } from "../../components/app/Text";
import ModalApp from "../../components/app/ModalApp";
import { FlashList } from "@shopify/flash-list";
import { setLoadingButton, setShowModalApp } from "../../store/reducers/appSlice";
import { randomString, remote_host, remote_host_server, renderCategoryName, renderCurrency, renderDateUpToMilliseconds, SocketApp, global_currencies, media_url } from "../../../GlobalVariables";
import axios from "axios";
import { NavProps, TBusiness, TBusinessSubscription, TItem, TItemPrices } from "../../types/types";
import { useObject, useQuery, useRealm } from "@realm/react";
import moment from "moment";
import { UserBusinessArticles, ItemPrices, BusinessItemsSale } from "../../store/database/Models";
// import { SocketApp } from "../../../App";
import SwitchApp from "../../components/app/SwitchApp";
import DateTimePicker from '@react-native-community/datetimepicker';
import ImagePicker from '../../utils/imagePicker';
import { Image as ExpoImage } from 'expo-image';

const EditBusinessItem = ({ route, navigation }: NavProps) => {

    const { business_id } = route.params;
    const { item_id } = route.params;
    const canUploadImages = (route.params as any)?.can_upload_images !== false;
    const persistedSubscriptions = useAppSelector(state => state.persisted_app.business_subscriptions || []);

    const theme = useAppSelector(state => state.app_theme.colors);
    const loading_app = useAppSelector(state => state.app.loading);
    const user_data = useAppSelector(state => state.user_data);
    const app_description = useAppSelector(state => state.persisted_app.app_description);
    const [currency, setCurrency] = useState<number>(1);
    const [name, setName] = useState<string>("");
    const [itemDescription, setItemDescription] = useState<string>("");
    const [wholesale_cost_price, setWholesale_cost_price] = useState<string>("");
    const [retail_cost_price, setRetail_cost_price] = useState<string>("");
    const [retail_selling_price, setRetail_selling_price] = useState<string>("");
    const [wholesale_selling_price, setWholesale_selling_price] = useState<string>("");
    const [wholesale_content_number, setWholesale_content_number] = useState<string>("");
    const [wholesale_and_retail, setWholesale_and_retail] = useState<boolean>(true);
    const [showError, setShowError] = useState<boolean>(false);
    const [validationErrorMsg, setValidationErrorMsg] = useState<string>("");
    const [showCurrencies, setShowCurrencies] = useState<boolean>(false);
    const [showSizesModal, setShowSizesModal] = useState<boolean>(false);
    const [showInternetError, setShowInternetError] = useState<boolean>(false);
    const [wholesale_quantity, setWholesale_quantity] = useState(false);
    const [stockStoreInput, setStockStoreInput] = useState("0");
    const [stockWarehouseInput, setStockWarehouseInput] = useState("0");
    // const category = useAppSelector(state=>state.app.category);
    // const businesses = useAppSelector(state => state.businesses);
    const businesses = [];
    const dispatch = useAppDispatch();
    // const navigation = useNavigation();
    const realm = useRealm();

    const itemSales = useQuery(
        BusinessItemsSale,
        (collection) => collection.filtered("item_id == $0 && sale_active == $1", item_id, 1),
        [item_id]
    );
    const hasItemSales = itemSales.length > 0;

    const itemm = useObject(UserBusinessArticles, item_id);

    if (itemm === null) return;

    const prices = useObject(ItemPrices, "G" + itemm._id);

    if (prices === null) return;

    const currencies = global_currencies;

    // --- New Modal for Category/Subcategory Selection ---
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [selectedSubCategory, setSelectedSubCategory] = useState<string>("");

    // --- New Modal for Colors Selection ---
    const [showColorsModal, setShowColorsModal] = useState(false);
    const [selectedColors, setSelectedColors] = useState("[]");
    const [selectedSizes, setSelectedSizes] = useState("[]");
    const COLORS_LIST = [
        "red", "blue", "green", "maroon", "yellow", "black", "white", "purple", "pink", "orange", "gray", "chocolate"
    ];

    const GENERAL_SIZES = {
        clothing: ["2T", "3T", "4T", "5T", "XS", "S", "M", "L", "XL", "XXL", "XXXL"],
        pants: ["28", "30", "32", "34", "36", "38", "40"],
        shoes: ["30", "32", "35", "37", "38", "40", "42", "43", "44", "45", "46", "47"],
        hats: ["S/M", "M/L", "L/XL", "One Size"],
        gloves: ["S", "M", "L", "XL"],
        // accessories: ["Mini", "Small", "Medium", "Large", "XL", "One Size"],
        // generic: ["One Size Fits All", "Adjustable", "Custom"]
    };

    // --- Discount fields ---
    const [discountPercentage, setDiscountPercentage] = useState<number>(0);
    const [discountStartDate, setDiscountStartDate] = useState<string>("");
    const [discountEndDate, setDiscountEndDate] = useState<string>("");

    // --- Date fields ---
    const [manufactureDate, setManufactureDate] = useState<string>("");
    const [expiryDate, setExpiryDate] = useState<string>("");
    const [showManufactureDatePicker, setShowManufactureDatePicker] = useState(false);
    const [showExpiryDatePicker, setShowExpiryDatePicker] = useState(false);
    const [manufactureDateObj, setManufactureDateObj] = useState<Date>(new Date());
    const [expiryDateObj, setExpiryDateObj] = useState<Date>(new Date());

    // Helper function to format date to month-year only (sets day to 1)
    const formatMonthYear = (date: Date | string): string => {
        const d = typeof date === 'string' ? new Date(date) : date;
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    };

    // Helper function to create a date from month-year string (sets day to 1)
    const createDateFromMonthYear = (monthYear: string): Date => {
        if (!monthYear) return new Date();
        const [year, month] = monthYear.split('-').map(Number);
        return new Date(year, month - 1, 1); // month is 0-indexed, day is 1
    };

    // Helper function to normalize date to first day of month
    const normalizeToFirstOfMonth = (date: Date): Date => {
        return new Date(date.getFullYear(), date.getMonth(), 1);
    };

    // --- Suppliers field ---
    const [suppliers, setSuppliers] = useState<string>("");

    // --- Image upload fields ---
    const [itemImage, setItemImage] = useState<string>("");
    const [loading_image, setLoading_image] = useState<boolean>(false);
    // Track current images string to display immediately after update
    const [currentImages, setCurrentImages] = useState<string>("");
    // Ref to track if images were manually updated (to prevent useEffect from resetting)
    const imagesManuallyUpdatedRef = useRef<boolean>(false);

    // --- Extract categories/subcategories from locale ---
    const items_categories = strings.items_categories;
    const [marketplace_visibility, setMarketplace_visibility] = useState<number>(0);

    const planAllowsImages = useMemo(() => {
        const now = new Date();
        const activeSubscription = (persistedSubscriptions as TBusinessSubscription[])
            .filter((sub) => {
                if (sub.business_id !== business_id) return false;
                if (Number(sub.payment_status ?? 0) !== 1) return false;
                if (!sub.subscription_end_date) return false;
                const endDate = new Date(sub.subscription_end_date);
                if (Number.isNaN(endDate.getTime())) return false;
                return endDate >= now;
            })
            .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())[0];

        if (!activeSubscription) return false;
        const plan = Number(activeSubscription.subscription_plan ?? 0);
        // Free: no images. Basic + Premium X + Ultimate: images allowed.
        return plan >= 1;
    }, [persistedSubscriptions, business_id]);

    const effectiveCanUploadImages = canUploadImages && planAllowsImages;

    // --- Modal for Category/Subcategory ---
    const CategoryModal = () => (
        <ModalApp paddings={false} onClose={() => { setShowCategoryModal(false); dispatch(setShowModalApp(false)); }} singleButton title={strings.choose_category}>
            <ScrollView>
                {Object.values(items_categories).map((cat: any) => (
                    <View key={cat.id}>
                        <Pressable
                            style={{ paddingVertical: 10, backgroundColor: selectedCategory === cat.id ? theme.high_color + "50" : theme.background, borderRadius: 7, paddingLeft: 10 }}>
                            <YambiText text={cat.name.toUpperCase()} bold />
                        </Pressable>
                        {cat.subcategories && (
                            <View style={{ marginLeft: 15 }}>
                                {Object.entries(cat.subcategories).map(([subKey, subValue], index) => (
                                    <Pressable
                                        key={subKey}
                                        onPress={() => {
                                            setSelectedCategory(cat.id);
                                            setSelectedSubCategory(subKey); // store the subcategory ID, not the label
                                            updateItemImmediately({ category: cat.id, subcategory: subKey });
                                            setShowCategoryModal(false);
                                            dispatch(setShowModalApp(false));
                                        }}
                                        style={{
                                            paddingVertical: 8,
                                            marginVertical: 2,
                                            paddingLeft: 10,
                                            backgroundColor: selectedSubCategory === subKey
                                                ? theme.high_color + "50"
                                                : theme.background,
                                            borderRadius: 7,
                                        }}
                                    >
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

    // --- Modal for Colors ---
    const ColorsModal = () => {
        const [cc, setCc] = useState<string[]>([]);

        const setColor = (color: string) => {
            const ff = cc.find(e => e === color);
            if (ff === undefined) {
                setCc(prev => [...prev, color]);
            } else {
                setCc(cc.filter(e => e !== color));
            }
        }

        useEffect(() => {
            if (selectedColors !== "" && selectedColors !== "[]") {
                const pp = JSON.parse(selectedColors);
                setCc(pp);
            }
        }, []);

        const find_color_inList = (color: string) => {
            const ff = cc.find(e => e === color);

            if (ff === undefined) {
                return false;
            }

            return true;
        }

        return (
            <ModalApp paddings={false} onClose={() => {
                setShowColorsModal(false);
                dispatch(setShowModalApp(false));
            }}
                singleButton={false}
                textAction={strings.add_colors}
                onAction={() => {
                    const colorsJson = JSON.stringify(cc);
                    setSelectedColors(colorsJson);
                    updateItemImmediately({ colors: colorsJson });
                    setShowColorsModal(false);
                    dispatch(setShowModalApp(false));
                }}
                title={strings.choose_colors}>
                <ScrollView style={{ width: "100%" }}>
                    {COLORS_LIST.map((color) => (
                        <Pressable key={color} onPress={() => {
                            setColor(color);
                        }} style={{ flexDirection: 'row', alignItems: 'center', padding: 5, paddingHorizontal: 20 }}>

                            <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: find_color_inList(color) ? theme.high_color + "70" : theme.background, marginRight: 10, borderWidth: 1, borderColor: 'gray' }} />
                            <View style={{ marginHorizontal: 6, borderRadius: 5, backgroundColor: color, height: 15, width: 25 }}></View>
                            <YambiText text={strings[color]} />
                        </Pressable>
                    ))}
                </ScrollView>
            </ModalApp>
        )
    };

    const SizesModal = () => {
        const [cc, setCc] = useState<string[]>([]);

        const setSizes = (size: string) => {
            const ff = cc.find(e => e === size);
            if (ff === undefined) {
                setCc(prev => [...prev, size]);
            } else {
                setCc(cc.filter(e => e !== size));
            }
        }

        useEffect(() => {
            if (selectedSizes !== "" && selectedSizes !== "[]") {
                const pp = JSON.parse(selectedSizes);
                setCc(pp);
            }
        }, []);

        const find_size_inList = (size: string) => {
            const ff = cc.find(e => e === size);

            if (ff === undefined) {
                return false;
            }

            return true;
        }

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
                    const sizesJson = JSON.stringify(cc);
                    setSelectedSizes(sizesJson);
                    updateItemImmediately({ sizes: sizesJson });
                    setShowSizesModal(false);
                    dispatch(setShowModalApp(false));
                }}
                title={strings.choose_sizes}
            >
                <ScrollView>
                    {Object.entries(GENERAL_SIZES).map(([category, sizes]) => (
                        <Pressable key={category} style={{ marginBottom: 15, paddingHorizontal: 20 }}>
                            <YambiText
                                text={strings[category] || category}
                                bold
                                style={{
                                    fontSize: 16,
                                    marginBottom: 8,
                                }}
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
                                            borderColor: find_size_inList(size)
                                                ? theme.high_color
                                                : "gray",
                                            backgroundColor: find_size_inList(size)
                                                ? theme.high_color + "30"
                                                : theme.background,
                                        }}
                                    >
                                        <YambiText text={size} />
                                    </Pressable>
                                ))}
                            </View>
                        </Pressable>
                    ))}
                </ScrollView>
            </ModalApp>

        )
    };

    // --- Modal for Discount ---
    const [showDiscountModal, setShowDiscountModal] = useState(false);
    const DiscountModal = () => {
        const [date_start, setDate_start] = useState<Date>(new Date());
        const [date_end, setDate_end] = useState<Date>(new Date());
        const [time_start, setTime_start] = useState<Date>(new Date());
        const [time_end, setTime_end] = useState<Date>(new Date());
        const [dp, setDp] = useState<string>("");
        const [showStartDatePicker, setShowStartDatePicker] = useState(false);
        const [showStartTimePicker, setShowStartTimePicker] = useState(false);
        const [showEndDatePicker, setShowEndDatePicker] = useState(false);
        const [showEndTimePicker, setShowEndTimePicker] = useState(false);
        const app_language = useAppSelector(state => state.persisted_app.langApp);
        const [showSelectDiscountDates, setShowSelectDiscountDates] = useState(false);

        useEffect(() => {
            if (discountStartDate) {
                const startDate = new Date(discountStartDate);
                setDate_start(startDate);
                setTime_start(startDate);
            }
            if (discountEndDate) {
                const endDate = new Date(discountEndDate);
                setDate_end(endDate);
                setTime_end(endDate);
            }
            if (discountPercentage > 0) {
                setDp(discountPercentage.toString());
            }
        }, []);

        const combineDateAndTime = (date: Date, time: Date) => {
            const combined = new Date(date);
            combined.setHours(time.getHours());
            combined.setMinutes(time.getMinutes());
            combined.setSeconds(0);
            combined.setMilliseconds(0);
            return combined;
        };

        return (
            <ModalApp
                paddings={false}
                onClose={() => {
                    setShowDiscountModal(false);
                    dispatch(setShowModalApp(false));
                }}
                onAction={() => {
                    const startDateTime = combineDateAndTime(date_start, time_start);
                    const endDateTime = combineDateAndTime(date_end, time_end);

                    setShowDiscountModal(false);
                    dispatch(setShowModalApp(false));
                    setDiscountPercentage(parseInt(dp) || 0);
                    setDiscountStartDate(moment(startDateTime).format());
                    setDiscountEndDate(moment(endDateTime).format());
                }}
                textAction={strings.validate}
                singleButton={false} title={strings.discount}>
                <ScrollView style={{ maxHeight: 450, width: "100%", paddingTop: 5, paddingHorizontal: 10 }}>
                    <YambiText size="small" color="gray" text={strings.discount_percentage} style={{ marginBottom: 5 }} />
                    <TextInput
                        placeholder={strings.discount_percentage}
                        keyboardType="numeric"
                        style={{ backgroundColor: theme.border, color: theme.text, borderRadius: 5, paddingLeft: 15, height: 45, marginBottom: 15 }}
                        value={dp}
                        onChangeText={setDp}
                    />

                    <Pressable onPress={() => setShowSelectDiscountDates(!showSelectDiscountDates)} style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: 15
                    }}>
                        <YambiText size="small" color="high" text={strings.show_dates} style={{ marginBottom: 5 }} />

                        <IconApp pack="FI" name={showSelectDiscountDates ? "chevron-up" : "chevron-down"} size={15} color={theme.high_color} />
                    </Pressable>

                    {showSelectDiscountDates && (
                        <View>
                            {/* Discount Start Date and Time */}
                            <YambiText size="small" color="gray" text={strings.start_date_time || strings.discount_start_date || "Start Date & Time"} style={{ marginBottom: 5 }} />
                            <View style={{ flexDirection: 'row', marginBottom: 15 }}>
                                <Pressable
                                    onPress={() => setShowStartDatePicker(true)}
                                    style={{ flex: 1, backgroundColor: theme.border, borderRadius: 5, height: 45, justifyContent: 'center', paddingLeft: 15, marginRight: 5 }}>
                                    <YambiText text={moment(date_start).format('YYYY-MM-DD')} />
                                </Pressable>
                                <Pressable
                                    onPress={() => setShowStartTimePicker(true)}
                                    style={{ flex: 1, backgroundColor: theme.border, borderRadius: 5, height: 45, justifyContent: 'center', paddingLeft: 15, marginLeft: 5 }}>
                                    <YambiText text={moment(time_start).format('HH:mm')} />
                                </Pressable>
                            </View>

                            {showStartDatePicker && (
                                <DateTimePicker
                                    value={date_start}
                                    mode="date"
                                    display="default"
                                    onChange={(event, selectedDate) => {
                                        setShowStartDatePicker(false);
                                        if (selectedDate) {
                                            setDate_start(selectedDate);
                                        }
                                    }}
                                />
                            )}

                            {showStartTimePicker && (
                                <DateTimePicker
                                    value={time_start}
                                    mode="time"
                                    display="default"
                                    onChange={(event, selectedTime) => {
                                        setShowStartTimePicker(false);
                                        if (selectedTime) {
                                            setTime_start(selectedTime);
                                        }
                                    }}
                                />
                            )}

                            {/* Discount End Date and Time */}
                            <YambiText size="small" color="gray" text={strings.end_date_time || strings.discount_end_date || "End Date & Time"} style={{ marginBottom: 5 }} />
                            <View style={{ flexDirection: 'row', marginBottom: 15 }}>
                                <Pressable
                                    onPress={() => setShowEndDatePicker(true)}
                                    style={{ flex: 1, backgroundColor: theme.border, borderRadius: 5, height: 45, justifyContent: 'center', paddingLeft: 15, marginRight: 5 }}>
                                    <YambiText text={moment(date_end).format('YYYY-MM-DD')} />
                                </Pressable>
                                <Pressable
                                    onPress={() => setShowEndTimePicker(true)}
                                    style={{ flex: 1, backgroundColor: theme.border, borderRadius: 5, height: 45, justifyContent: 'center', paddingLeft: 15, marginLeft: 5 }}>
                                    <YambiText text={moment(time_end).format('HH:mm')} />
                                </Pressable>
                            </View>

                            {showEndDatePicker && (
                                <DateTimePicker
                                    value={date_end}
                                    mode="date"
                                    display="default"
                                    onChange={(event, selectedDate) => {
                                        setShowEndDatePicker(false);
                                        if (selectedDate) {
                                            setDate_end(selectedDate);
                                        }
                                    }}
                                />
                            )}

                            {showEndTimePicker && (
                                <DateTimePicker
                                    value={time_end}
                                    mode="time"
                                    display="default"
                                    onChange={(event, selectedTime) => {
                                        setShowEndTimePicker(false);
                                        if (selectedTime) {
                                            setTime_end(selectedTime);
                                        }
                                    }}
                                />
                            )}
                        </View>
                    )}
                </ScrollView>
            </ModalApp>
        )
    };

    const pick_item_image = () => {
        if (!effectiveCanUploadImages) {
            Alert.alert(
                strings.error,
                (strings as any).add_subscription_to_activate_locked_items || "Add a subscription to activate locked items",
                [
                    { text: strings.close || "Close", style: "cancel" },
                    {
                        text: (strings as any).add_subscription || "Add Subscription",
                        onPress: () => navigation.navigate("AddBusinessSubscription", { business_id }),
                    },
                ]
            );
            return;
        }

        if (itemImage === "") {
            ImagePicker.openPicker({
                width: 800,
                height: 800,
                cropping: true,
                quality: 0.7,
                noData: true,
                mediaType: "photo",
            }).then(image => {
                setItemImage(image.path);
            })
                .catch((e) => { });
        } else {
            upload_item_image();
        }
    };

    const upload_item_image = () => {
        setLoading_image(true);

        const filename = Date.now() + '-' + Math.round(Math.random() * 1E9);

        let base_url = remote_host + "/yambi/API/upload_item_image";
        let formData = new FormData();
        formData.append('assemble', itemm._id);
        formData.append('item_images', itemm.images);
        formData.append('image', { type: 'image/jpg', uri: itemImage, name: filename + 'item.jpg' } as any);

        axios.post(base_url, formData, {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'multipart/form-data'
            }
        })
            .then(response => {
                setLoading_image(false);

                if (response.data.message === "1" && response.data.assemble === itemm._id) {

                    // const updated_images = response.data.item_images;
                    // // Mark that images were manually updated
                    // imagesManuallyUpdatedRef.current = true;
                    // // Update local state immediately so UI reflects the change
                    // setCurrentImages(updated_images);
                    // updateItemImmediately({ images: updated_images });

                    const updatedItem: TItem = {
                        _id: itemm._id,
                        business_id: itemm.business_id,
                        phone_number: itemm.phone_number,
                        item_name: itemm.item_name,
                        slogan: itemm.slogan,
                        item_type: itemm.item_type,
                        category: itemm.category,
                        subcategory: itemm.subcategory,
                        manufacture_date: itemm.manufacture_date,
                        expiry_date: itemm.expiry_date,
                        wholesale_content_number: itemm.wholesale_content_number,
                        items_number_stock: itemm.items_number_stock,
                        items_number_warehouse: itemm.items_number_warehouse,
                        description_item: itemm.description_item,
                        keywords: itemm.keywords,
                        images: response.data.item_images,
                        background: itemm.background,
                        item_active: itemm.item_active,
                        supplier: itemm.supplier,
                        other_information: itemm.other_information,
                        alert_low_stock: itemm.alert_low_stock,
                        uploaded: 0,
                        createdAt: itemm.createdAt,
                        updatedAt: moment(new Date()).format(),
                        colors: itemm.colors,
                        discount_percentage: itemm.discount_percentage,
                        discount_start_date: itemm.discount_start_date,
                        discount_end_date: itemm.discount_end_date,
                        marketplace_visibility: itemm.marketplace_visibility,
                        weights: itemm.weights,
                        sizes: itemm.sizes,
                        flag: itemm.flag,
                        is_best_seller: itemm.is_best_seller,
                        visibility_rank: itemm.visibility_rank,
                        is_featured: itemm.is_featured
                    };

                    realm.write(() => {
                        try {
                            realm.create('UserBusinessArticles', updatedItem, true);
                        } catch (error) { }
                    });
                }

                setItemImage("");
            })
            .catch((error) => {
                setShowInternetError(true);
                dispatch(setShowModalApp(true));
                setLoading_image(false);
            });
    };

    // Helper function to update item in realm immediately
    const updateItemImmediately = useCallback((updates: Partial<TItem>) => {
        if (itemm === null) return;

        const updatedItem: TItem = {
            _id: itemm._id,
            business_id: itemm.business_id,
            phone_number: itemm.phone_number,
            item_name: itemm.item_name,
            slogan: itemm.slogan,
            item_type: itemm.item_type,
            category: updates.category !== undefined ? updates.category : itemm.category,
            subcategory: updates.subcategory !== undefined ? updates.subcategory : itemm.subcategory,
            manufacture_date: updates.manufacture_date !== undefined ? updates.manufacture_date : manufactureDate ? createDateFromMonthYear(manufactureDate).toISOString() : itemm.manufacture_date,
            expiry_date: updates.expiry_date !== undefined ? updates.expiry_date : expiryDate ? createDateFromMonthYear(expiryDate).toISOString() : itemm.expiry_date,
            wholesale_content_number: itemm.wholesale_content_number,
            items_number_stock: itemm.items_number_stock,
            items_number_warehouse: itemm.items_number_warehouse,
            description_item: itemm.description_item,
            keywords: itemm.keywords,
            images: updates.images !== undefined ? updates.images : itemm.images,
            background: itemm.background,
            item_active: itemm.item_active,
            supplier: updates.supplier !== undefined ? updates.supplier : suppliers,
            other_information: itemm.other_information,
            alert_low_stock: itemm.alert_low_stock,
            uploaded: 0,
            createdAt: itemm.createdAt,
            updatedAt: moment(new Date()).format(),
            colors: updates.colors !== undefined ? updates.colors : itemm.colors,
            discount_percentage: itemm.discount_percentage,
            discount_start_date: itemm.discount_start_date,
            discount_end_date: itemm.discount_end_date,
            marketplace_visibility: updates.marketplace_visibility !== undefined ? updates.marketplace_visibility : itemm.marketplace_visibility,
            weights: itemm.weights,
            sizes: updates.sizes !== undefined ? updates.sizes : itemm.sizes,
            flag: itemm.flag,
            is_best_seller: itemm.is_best_seller,
            visibility_rank: itemm.visibility_rank,
            is_featured: itemm.is_featured
        };

        realm.write(() => {
            try {
                realm.create('UserBusinessArticles', updatedItem, true);
            } catch (error) { }
        });

        // Update currentImages state if images were updated
        if (updates.images !== undefined) {
            imagesManuallyUpdatedRef.current = true;
            setCurrentImages(updates.images);
        }

        // Emit socket update
        SocketApp.emit("newItems", JSON.stringify({ phone_number: user_data.phone_number, items: [updatedItem] }));
    }, [itemm, realm, user_data, manufactureDate, expiryDate, suppliers]);

    const ViewItemPhoto = () => {
        if (itemm.images !== "") {
            const imagesArray = JSON.parse(itemm.images);
            if (imagesArray.length > 0) {
                navigation.navigate("ViewPhoto", { source: media_url + "/items_images/" + imagesArray[0] });
            } else {
                navigation.navigate("ViewPhoto", { source: "" });
            }
        } else {
            navigation.navigate("ViewPhoto", { source: "" });
        }
    };

    const EditBusinessItem = () => {
        if (name === "" || wholesale_cost_price === "" || wholesale_selling_price === "" || wholesale_content_number === "") {
            setValidationErrorMsg(strings.fields_error_validation);
            dispatch(setShowModalApp(true));
            setShowError(true);
        } else if (
            !/^\d+([.,]\d+)?$/.test(wholesale_cost_price) ||
            !/^\d+([.,]\d+)?$/.test(wholesale_selling_price) ||
            (retail_selling_price !== "" && !/^\d+([.,]\d+)?$/.test(retail_selling_price)) ||
            !/^\d+$/.test(wholesale_content_number) ||
            (stockStoreInput !== "" && !/^\d+$/.test(stockStoreInput)) ||
            (stockWarehouseInput !== "" && !/^\d+$/.test(stockWarehouseInput))
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

            const parseStockInput = (raw: string, fallback: number) => {
                const n = parseInt(String(raw).trim(), 10);
                if (Number.isNaN(n) || n < 0) {
                    return fallback;
                }
                return n;
            };

            const stockOut = hasItemSales
                ? itemm.items_number_stock
                : parseStockInput(stockStoreInput, itemm.items_number_stock);
            const warehouseOut = hasItemSales
                ? itemm.items_number_warehouse
                : parseStockInput(stockWarehouseInput, itemm.items_number_warehouse);

            const item: TItem = {
                _id: itemm._id,
                business_id: itemm.business_id,
                phone_number: itemm.phone_number,
                item_name: name,
                slogan: itemm.slogan,
                item_type: itemm.item_type,
                category: selectedCategory,
                subcategory: selectedSubCategory,
                manufacture_date: manufactureDate ? createDateFromMonthYear(manufactureDate).toISOString() : "",
                expiry_date: expiryDate ? createDateFromMonthYear(expiryDate).toISOString() : "",
                wholesale_content_number: parseInt(wholesale_content_number),
                items_number_stock: stockOut,
                items_number_warehouse: warehouseOut,
                description_item: itemDescription,
                keywords: itemm.keywords,
                images: itemm.images,
                background: itemm.background,
                item_active: itemm.item_active,
                supplier: suppliers,
                other_information: itemm.other_information,
                alert_low_stock: itemm.alert_low_stock,
                uploaded: 0,
                createdAt: itemm.createdAt,
                updatedAt: moment(new Date()).format(),
                colors: selectedColors,
                discount_percentage: discountPercentage,
                discount_start_date: discountStartDate ? moment(discountStartDate).format() : "",
                discount_end_date: discountEndDate ? moment(discountEndDate).format() : "",
                marketplace_visibility: marketplace_visibility,
                weights: "[]",
                sizes: selectedSizes,
                flag: 0,
                is_best_seller: 0,
                visibility_rank: 0,
                is_featured: 0
            }

            const prices: TItemPrices = {
                _id: "G" + item_id,
                item_id: item_id,
                phone_number: user_data.phone_number,
                wholesale_cost_price: wholesale_cost_price,
                wholesale_selling_price: wholesale_selling_price,
                retail_selling_price: retail_selling_price,
                uploaded: 0,
                currency: currency
            }

            realm.write(() => {
                try {
                    realm.create('UserBusinessArticles', item, true);
                } catch (error) { }

                try {
                    realm.create('ItemPrices', prices, true);
                } catch (error) { }
            });

            SocketApp.emit("newItems", JSON.stringify({ phone_number: user_data.phone_number, items: [item] }));
            SocketApp.emit("newItemPrices", JSON.stringify({ phone_number: user_data.phone_number, items: [prices] }));

            setTimeout(() => {
                // setName("");
                // setWholesale_cost_price("");
                // setWholesale_selling_price("");
                // setWholesale_content_number("");
                // setWholesale_number_warehouse("0");
                // setWholesale_number_stock("");
                // setRetail_selling_price("");

                dispatch(setLoadingButton(false));
            }, 300);
        }
    }

    const RenderCurrency = ({ item, index, selectCurrency }: { item: number, index: number, selectCurrency: (currency: number) => void }) => {

        const pressCurrency = () => {
            selectCurrency(item);
            dispatch(setShowModalApp(false));
            setShowCurrencies(false);
        };

        return (
            <Pressable style={{ backgroundColor: theme.background, flex: 1, flexDirection: 'row', borderRadius: 8, paddingHorizontal: 15, height: 50, alignItems: 'center', borderBottomWidth: 1, borderColor: theme.border }} onPress={pressCurrency}>
                <YambiText text={index + 1 + "."} style={{ width: 35 }} />
                <YambiText text={renderCurrency(item, true)} style={{ flex: 1 }} />
            </Pressable>
        )
    }

    const GrosDetail = () => {
        setWholesale_and_retail(!wholesale_and_retail);
        setWholesale_content_number("1");
    }

    const Currencies = () => {
        return (
            <View style={{
                width: '100%',
                height: 300
            }}>
                <FlashList
                    data={currencies as never}
                    estimatedItemSize={50}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item, index }: { item: number, index: number }) => (<RenderCurrency selectCurrency={(item) => setCurrency(index + 1)} item={item} index={index} />)}
                />
            </View>
        )
    }

    useEffect(() => {
        // setCurrency()
        // console.log(business_id)

        setCurrency(prices.currency);
        setName(itemm.item_name);
        setWholesale_cost_price(prices.wholesale_cost_price);
        setWholesale_selling_price(prices.wholesale_selling_price);
        setWholesale_content_number(itemm.wholesale_content_number.toString());
        // setRetail_cost_price(prices.retail)
        setSelectedCategory(itemm.category);
        setSelectedSubCategory(itemm.subcategory);
        setRetail_selling_price(prices.retail_selling_price);
        setSelectedColors(itemm.colors);
        setDiscountPercentage(itemm.discount_percentage);
        setDiscountStartDate(itemm.discount_start_date);
        setDiscountEndDate(itemm.discount_end_date);
        setMarketplace_visibility(itemm.marketplace_visibility);
        setSelectedSizes(itemm.sizes);
        setItemDescription(itemm.description_item || "");

        // Set manufacture and expiry dates (normalize to first of month)
        if (itemm.manufacture_date) {
            const normalizedDate = normalizeToFirstOfMonth(new Date(itemm.manufacture_date));
            setManufactureDate(formatMonthYear(normalizedDate));
            setManufactureDateObj(normalizedDate);
        }
        if (itemm.expiry_date) {
            const normalizedDate = normalizeToFirstOfMonth(new Date(itemm.expiry_date));
            setExpiryDate(formatMonthYear(normalizedDate));
            setExpiryDateObj(normalizedDate);
        }

        // Set suppliers
        setSuppliers(itemm.supplier || "");

        setStockStoreInput(String(itemm.items_number_stock ?? 0));
        setStockWarehouseInput(String(itemm.items_number_warehouse ?? 0));

        // Only set currentImages if it hasn't been manually updated
        // This prevents the useEffect from resetting currentImages after image upload
        if (!imagesManuallyUpdatedRef.current) {
            setCurrentImages(itemm.images || "");
        }
        // setWeights(itemm.weights),
        // setSizes(itemm.sizes),
        // setFlag(itemm.flag),
        // setIsBestSeller(itemm.is_best_seller),
        // setVisibilityRank(itemm.visibility_rank),
        // setIsfeatured(itemm.is_featured)

        // console.log(itemm.marketplace_visibility)
    }, [itemm]);

    const show_category = (category: string) => {
        if (category === null || category === undefined || category === "") return;

        const index = strings.items_categories[category];

        if (index === undefined) return;
        return <YambiText color="high" text={index.name} bold />
    }

    const show_subcategory = (category: string, subcategory: string) => {
        if (category === null || category === undefined || category === "") return;

        const index = strings.items_categories[category];

        if (index.subcategories[subcategory] === undefined) return;

        return <YambiText color="high" text={index.subcategories[subcategory]} bold />
    }

    return (
        <View style={{ borderColor: theme.border, borderTopWidth: 1, backgroundColor: theme.background, flex: 1 }}>
            <ScrollView style={{ paddingHorizontal: 5 }} keyboardShouldPersistTaps='handled' showsVerticalScrollIndicator={false}>

                {/* ── Modals ── */}
                {showError && <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowError(false); }} singleButton title={strings.error}><YambiText color="gray" text={validationErrorMsg || strings.fields_error_validation} /></ModalApp>}
                {showInternetError && <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowInternetError(false); }} singleButton title={strings.error}><YambiText color="gray" text={strings.connection_failed} /></ModalApp>}
                {showCurrencies && <ModalApp paddings={false} onClose={() => { dispatch(setShowModalApp(false)); setShowCurrencies(false); }} singleButton title={strings.currency}><Currencies /></ModalApp>}

                <View style={{ marginTop: 16, paddingBottom: 50 }}>

                    {/* ── Image Upload Card ── */}
                    {effectiveCanUploadImages && (
                        <View style={{ backgroundColor: theme.card, borderRadius: 20, padding: 16, marginBottom: 12, alignItems: "center" }}>
                            <View style={{
                                width: 140, height: 140, borderRadius: 20, justifyContent: "center",
                                alignItems: "center", overflow: "hidden", backgroundColor: theme.border,
                            }}>
                                {(() => {
                                    if (itemImage !== "") {
                                        return <ExpoImage style={{ width: 140, height: 140 }} contentFit="cover" source={itemImage} />;
                                    }
                                    const imagesToUse = currentImages || itemm.images || "";
                                    if (imagesToUse === "" || imagesToUse === "[]") {
                                        return (
                                            <View style={{ alignItems: "center" }}>
                                                <IconApp pack="FI" name="image" size={40} color={theme.gray} />
                                                <YambiText size="small" color="gray" text={strings.add_item_picture} style={{ marginTop: 8, opacity: 0.6 }} />
                                            </View>
                                        );
                                    }
                                    try {
                                        const imagesArray = JSON.parse(itemm.images);
                                        if (imagesArray.length > 0) {
                                            return <ExpoImage style={{ width: 140, height: 140 }} contentFit="cover" source={media_url + "/items_images/" + imagesArray[0]} />;
                                        }
                                    } catch (e) { }
                                    return (
                                        <View style={{ alignItems: "center" }}>
                                            <IconApp pack="FI" name="image" size={40} color={theme.gray} />
                                            <YambiText size="small" color="gray" text={strings.add_item_picture} style={{ marginTop: 8, opacity: 0.6 }} />
                                        </View>
                                    );
                                })()}
                            </View>
                            <Pressable onPress={pick_item_image} style={{
                                marginTop: 14, flexDirection: "row", alignItems: "center", justifyContent: "center",
                                height: 42, paddingHorizontal: 20, borderRadius: 21, backgroundColor: theme.design_tip2,
                            }}>
                                {loading_image ? <ActivityIndicator color={theme.text_design2} size={18} /> :
                                    itemImage === "" ? (
                                        <>
                                            <IconApp pack='FI' name="camera" size={18} color={theme.text_design2} />
                                            <YambiText text={strings.change_item_picture} color="design" bold style={{ marginLeft: 8 }} />
                                        </>
                                    ) : (
                                        <>
                                            <IconApp pack='FI' name="upload-cloud" size={18} color={theme.text_design2} />
                                            <YambiText text={strings.send} color="design" bold style={{ marginLeft: 8 }} />
                                        </>
                                    )}
                            </Pressable>
                        </View>
                    )}

                    {/* ── Settings Card ── */}
                    <View style={{ backgroundColor: theme.card, borderRadius: 20, padding: 16, marginBottom: 12 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
                            <IconApp pack="FI" name="settings" size={16} color={theme.high_color} />
                            <YambiText bold text={strings.settings} style={{ marginLeft: 8 }} />
                        </View>
                        <View style={{ marginBottom: 14 }}>
                            <YambiText size="small" color="gray" text={strings.include} style={{ marginBottom: 8 }} />
                            <Pressable onPress={GrosDetail} style={{
                                flexDirection: "row", alignItems: "center",
                                backgroundColor: theme.background, borderRadius: 12, padding: 12,
                                borderWidth: 1, borderColor: theme.border,
                            }}>
                                <IconApp color={theme.high_color} name={!wholesale_and_retail ? "circle" : "check-circle"} size={20} pack={!wholesale_and_retail ? "FI" : "FA"} />
                                <YambiText text={strings.gros + " " + strings.and + " " + strings.detail} color="high" numberLines={1} style={{ marginLeft: 10, flex: 1 }} />
                            </Pressable>
                        </View>
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
                        <View style={{ marginBottom: 14 }}>
                            <YambiText size="small" color="gray" text={strings.item_name} style={{ marginBottom: 8 }} />
                            <TextInput
                                placeholderTextColor={theme.gray}
                                maxLength={30}
                                style={{
                                    color: theme.text, backgroundColor: theme.background,
                                    borderColor: theme.border, borderWidth: 1,
                                    paddingHorizontal: 16, height: 46, borderRadius: 12, fontSize: app_description.general_font_size,
                                }}
                                value={name}
                                onChangeText={text => setName(text)}
                            />
                        </View>
                        <View style={{ marginBottom: 14 }}>
                            <YambiText size="small" color="gray" text={strings.item_description} style={{ marginBottom: 8 }} />
                            <TextInput
                                placeholderTextColor={theme.gray}
                                maxLength={500}
                                multiline={true}
                                numberOfLines={4}
                                textAlignVertical="top"
                                style={{
                                    color: theme.text, backgroundColor: theme.background,
                                    borderColor: theme.border, borderWidth: 1,
                                    paddingHorizontal: 16, paddingVertical: 12,
                                    minHeight: 100, borderRadius: 12, fontSize: app_description.general_font_size,
                                }}
                                value={itemDescription}
                                onChangeText={text => setItemDescription(text)}
                            />
                        </View>
                        <View>
                            <YambiText size="small" color="gray" text={strings.suppliers} style={{ marginBottom: 8 }} />
                            <TextInput
                                placeholderTextColor={theme.gray}
                                placeholder={strings.suppliers_placeholder}
                                maxLength={200}
                                style={{
                                    color: theme.text, backgroundColor: theme.background,
                                    borderColor: theme.border, borderWidth: 1,
                                    paddingHorizontal: 16, height: 46, borderRadius: 12, fontSize: app_description.general_font_size,
                                }}
                                value={suppliers}
                                onChangeText={text => setSuppliers(text)}
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
                                        onChange={(event, selectedDate) => {
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
                                        onChange={(event, selectedDate) => {
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
                                        JSON.parse(selectedColors).map((color: string, index: number) => (
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
                                        JSON.parse(selectedSizes).map((size: string, index: number) => (
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
                                    multiline={true}
                                    keyboardType="numeric"
                                    style={{ color: theme.text, backgroundColor: theme.background, borderColor: theme.border, borderWidth: 1, paddingHorizontal: 16, minHeight: 46, borderRadius: 12, fontSize: 15 }}
                                    value={wholesale_cost_price}
                                    onChangeText={text => setWholesale_cost_price(text)}
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
                                    onChangeText={text => setWholesale_selling_price(text)}
                                />
                            </View>
                        </View>
                        {wholesale_and_retail && (
                            <View style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderColor: theme.border }}>
                                <YambiText bold text={strings.detail} style={{ marginBottom: 12 }} />
                                <View style={{ flexDirection: "row" }}>
                                    <View style={{ flex: 1, marginRight: 8 }}>
                                        <YambiText size="small" color="gray" text={strings.cost_price + " (" + strings.detail + ")"} style={{ marginBottom: 8 }} />
                                        <TextInput
                                            maxLength={20}
                                            editable={false}
                                            keyboardType="numeric"
                                            style={{ color: theme.text, backgroundColor: theme.background, borderColor: theme.border, borderWidth: 1, paddingHorizontal: 16, minHeight: 46, borderRadius: 12, fontSize: 15 }}
                                            value={parseInt(wholesale_content_number) > 0 && parseInt(wholesale_cost_price) > 0 ? (parseInt(wholesale_cost_price) / parseInt(wholesale_content_number)).toString() : ""}
                                        />
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 8 }}>
                                        <YambiText size="small" color="gray" text={strings.selling_price + " (" + strings.detail + ")"} style={{ marginBottom: 8 }} />
                                        <TextInput
                                            maxLength={20}
                                            keyboardType="numeric"
                                            style={{ color: theme.text, backgroundColor: theme.background, borderColor: theme.border, borderWidth: 1, paddingHorizontal: 16, minHeight: 46, borderRadius: 12, fontSize: 15 }}
                                            value={retail_selling_price}
                                            onChangeText={text => setRetail_selling_price(text)}
                                        />
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* ── Discount Card ── */}
                    <Pressable
                        onPress={() => { setShowDiscountModal(true); dispatch(setShowModalApp(true)); }}
                        style={{ backgroundColor: theme.card, borderRadius: 20, padding: 16, marginBottom: 12, flexDirection: "row", alignItems: "center" }}>
                        <IconApp pack="FI" name="percent" size={16} color={theme.high_color} />
                        <YambiText bold text={strings.discount} style={{ marginLeft: 8, flex: 1 }} />
                        <View style={{ alignItems: "flex-end", marginRight: 8 }}>
                            {discountPercentage > 0 ? (
                                <>
                                    <YambiText text={`${discountPercentage}%`} color="high" bold />
                                    {discountStartDate && discountEndDate && (
                                        <YambiText size="small" color="gray" text={`${moment(discountStartDate).format("MM/DD")} - ${moment(discountEndDate).format("MM/DD")}`} />
                                    )}
                                </>
                            ) : <YambiText size="small" color="gray" text={strings.select} />}
                        </View>
                        <IconApp pack="FI" name="chevron-right" size={16} color={theme.gray} />
                    </Pressable>

                    {/* ── Quantity Card ── */}
                    <View style={{ backgroundColor: theme.card, borderRadius: 20, padding: 16, marginBottom: 12 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                                <IconApp pack="FI" name="package" size={16} color={theme.high_color} />
                                <YambiText bold text={strings.quantity} style={{ marginLeft: 8 }} />
                            </View>
                            {wholesale_and_retail && (
                                <Pressable onPress={() => setWholesale_quantity(!wholesale_quantity)} style={{ flexDirection: "row", alignItems: "center" }}>
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
                                    editable={wholesale_and_retail ? true : false}
                                    keyboardType="numeric"
                                    style={{ color: theme.text, backgroundColor: theme.background, borderColor: theme.border, borderWidth: 1, paddingHorizontal: 16, minHeight: 46, borderRadius: 12, fontSize: 15 }}
                                    value={wholesale_content_number}
                                    onChangeText={text => setWholesale_content_number(text)}
                                />
                            </View>
                            <View style={{ flex: 1, marginHorizontal: 6 }}>
                                <YambiText size="small" color="gray" text={strings.items_number + " " + strings.in_store} style={{ marginBottom: 8 }} numberLines={2} />
                                {hasItemSales ? (
                                    <View style={{ backgroundColor: theme.background, borderColor: theme.border, borderWidth: 1, paddingHorizontal: 16, minHeight: 46, borderRadius: 12, justifyContent: "center" }}>
                                        <YambiText text={String(itemm.items_number_stock)} />
                                    </View>
                                ) : (
                                    <TextInput
                                        placeholderTextColor={theme.gray}
                                        maxLength={12}
                                        keyboardType="numeric"
                                        style={{ color: theme.text, backgroundColor: theme.background, borderColor: theme.border, borderWidth: 1, paddingHorizontal: 16, minHeight: 46, borderRadius: 12, fontSize: 15 }}
                                        value={stockStoreInput}
                                        onChangeText={setStockStoreInput}
                                    />
                                )}
                            </View>
                            <View style={{ flex: 1, marginLeft: 6 }}>
                                <YambiText size="small" color="gray" text={strings.items_number + " " + strings.in_warehouse} style={{ marginBottom: 8 }} numberLines={2} />
                                {hasItemSales ? (
                                    <View style={{ backgroundColor: theme.background, borderColor: theme.border, borderWidth: 1, paddingHorizontal: 16, minHeight: 46, borderRadius: 12, justifyContent: "center" }}>
                                        <YambiText text={String(itemm.items_number_warehouse)} />
                                    </View>
                                ) : (
                                    <TextInput
                                        placeholderTextColor={theme.gray}
                                        maxLength={12}
                                        keyboardType="numeric"
                                        style={{ color: theme.text, backgroundColor: theme.background, borderColor: theme.border, borderWidth: 1, paddingHorizontal: 16, minHeight: 46, borderRadius: 12, fontSize: 15 }}
                                        value={stockWarehouseInput}
                                        onChangeText={setStockWarehouseInput}
                                    />
                                )}
                            </View>
                        </View>
                        {hasItemSales ? (
                            <>
                                <YambiText size="small" color="gray" text={strings.stock_quantities_locked_after_sales} style={{ marginTop: 10, lineHeight: 18 }} />
                                <ButtonNormal title={strings.renew_stock} loadEnabled={false} outline={true} onPress={() => navigation.navigate("RenewStock", { item_id: itemm._id, business_id })} styles={{ marginTop: 12 }} />
                            </>
                        ) : (
                            <YambiText size="small" color="gray" text={strings.stock_quantities_editable_before_sales} style={{ marginTop: 10, lineHeight: 18 }} />
                        )}
                    </View>

                    {/* ── Marketplace Card ── */}
                    <View style={{ backgroundColor: theme.card, borderRadius: 20, padding: 16, marginBottom: 12 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
                            <IconApp pack="FI" name="globe" size={16} color={theme.high_color} />
                            <YambiText bold text={strings.publish_to_marketplace} style={{ marginLeft: 8 }} />
                        </View>
                        {(() => {
                            let hasImage = false;
                            try {
                                if (itemm.images && itemm.images !== "" && itemm.images !== "[]") {
                                    const imagesArray = JSON.parse(itemm.images);
                                    hasImage = Array.isArray(imagesArray) && imagesArray.length > 0;
                                }
                            } catch (e) { hasImage = false; }
                            const hasSellingPrice = (retail_selling_price !== "" && parseFloat(retail_selling_price) > 0) || (wholesale_selling_price !== "" && parseFloat(wholesale_selling_price) > 0);
                            const stockCount = itemm ? itemm.items_number_stock : 0;
                            const hasItemsInStore = stockCount > 0;
                            const canPublish = hasImage && hasSellingPrice && hasItemsInStore && itemm.category !== "" && itemm.subcategory !== "";
                            return (
                                <View>
                                    <Pressable
                                        onPress={() => {
                                            if (canPublish) {
                                                const newVisibility = marketplace_visibility === 0 ? 1 : 0;
                                                setMarketplace_visibility(newVisibility);
                                                updateItemImmediately({ marketplace_visibility: newVisibility });
                                            }
                                        }}
                                        style={{ flexDirection: "row", alignItems: "center", opacity: canPublish ? 1 : 0.5 }}
                                        disabled={!canPublish}
                                    >
                                        <SwitchApp
                                            value={marketplace_visibility === 0 ? false : true}
                                            onPress={() => {
                                                if (canPublish) {
                                                    const newVisibility = marketplace_visibility === 0 ? 1 : 0;
                                                    setMarketplace_visibility(newVisibility);
                                                    updateItemImmediately({ marketplace_visibility: newVisibility });
                                                }
                                            }}
                                            disabled={!canPublish}
                                        />
                                        <YambiText text={strings.publish_to_marketplace} numberLines={1} style={{ marginLeft: 8 }} />
                                    </Pressable>
                                    {!canPublish && (
                                        <YambiText color="gray" size="small" style={{ marginTop: 10 }} text={strings.publish_to_marketplace_description} />
                                    )}
                                </View>
                            );
                        })()}
                    </View>

                    <ButtonNormal title={strings.save} loadEnabled={true} onPress={EditBusinessItem} styles={{ paddingHorizontal: 20, marginTop: 8 }} normal={true} />
                </View>

                {showCategoryModal && <CategoryModal />}
                {showColorsModal && <ColorsModal />}
                {showDiscountModal && <DiscountModal />}
                {showSizesModal && <SizesModal />}
            </ScrollView>
        </View>
    )
}

export default EditBusinessItem;
