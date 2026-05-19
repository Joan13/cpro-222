import { TouchableOpacity, View, Alert, ScrollView, TextInput, Pressable, ActivityIndicator, Platform } from "react-native";
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
import { NavProps, TBusiness, TBusinessSubscription, TItem, TItemPrices, TSellsPoint } from "../../types/types";
import { useObject, useQuery, useRealm } from "@realm/react";
import * as RootNavigation from '../../services/Navigation_ref';
import moment from "moment";
import { UserBusinessArticles, ItemPrices, BusinessItemsSale } from "../../store/database/Models";
// import { SocketApp } from "../../../App";
import SwitchApp from "../../components/app/SwitchApp";
import DateRangePicker from "rn-select-date-range";
import DateTimePicker from '@react-native-community/datetimepicker';
import ImagePicker from 'react-native-image-crop-picker';
import FastImage from "react-native-fast-image";

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
                        <TouchableOpacity
                            style={{ paddingVertical: 10, backgroundColor: selectedCategory === cat.id ? theme.high_color + "50" : theme.background, borderRadius: 7, paddingLeft: 10 }}>
                            <YambiText text={cat.name.toUpperCase()} bold />
                        </TouchableOpacity>
                        {cat.subcategories && (
                            <View style={{ marginLeft: 15 }}>
                                {Object.entries(cat.subcategories).map(([subKey, subValue], index) => (
                                    <TouchableOpacity
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
                                    </TouchableOpacity>
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
                        <TouchableOpacity key={color} onPress={() => {
                            setColor(color);
                        }} style={{ flexDirection: 'row', alignItems: 'center', padding: 5, paddingHorizontal: 20 }}>

                            <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: find_color_inList(color) ? theme.high_color + "70" : theme.background, marginRight: 10, borderWidth: 1, borderColor: 'gray' }} />
                            <View style={{ marginHorizontal: 6, borderRadius: 5, backgroundColor: color, height: 15, width: 25 }}></View>
                            <YambiText text={strings[color]} />
                        </TouchableOpacity>
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
                                    <TouchableOpacity
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
                                    </TouchableOpacity>
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
                                <TouchableOpacity
                                    onPress={() => setShowStartDatePicker(true)}
                                    style={{ flex: 1, backgroundColor: theme.border, borderRadius: 5, height: 45, justifyContent: 'center', paddingLeft: 15, marginRight: 5 }}>
                                    <YambiText text={moment(date_start).format('YYYY-MM-DD')} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setShowStartTimePicker(true)}
                                    style={{ flex: 1, backgroundColor: theme.border, borderRadius: 5, height: 45, justifyContent: 'center', paddingLeft: 15, marginLeft: 5 }}>
                                    <YambiText text={moment(time_start).format('HH:mm')} />
                                </TouchableOpacity>
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
                                <TouchableOpacity
                                    onPress={() => setShowEndDatePicker(true)}
                                    style={{ flex: 1, backgroundColor: theme.border, borderRadius: 5, height: 45, justifyContent: 'center', paddingLeft: 15, marginRight: 5 }}>
                                    <YambiText text={moment(date_end).format('YYYY-MM-DD')} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setShowEndTimePicker(true)}
                                    style={{ flex: 1, backgroundColor: theme.border, borderRadius: 5, height: 45, justifyContent: 'center', paddingLeft: 15, marginLeft: 5 }}>
                                    <YambiText text={moment(time_end).format('HH:mm')} />
                                </TouchableOpacity>
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
            <TouchableOpacity style={{ backgroundColor: theme.background, flex: 1, flexDirection: 'row', borderRadius: 8, paddingHorizontal: 15, height: 50, alignItems: 'center', borderBottomWidth: 1, borderColor: theme.border }} onPress={pressCurrency}>
                <YambiText text={index + 1 + "."} style={{ width: 35 }} />
                <YambiText text={renderCurrency(item, true)} style={{ flex: 1 }} />
            </TouchableOpacity>
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
        <View style={{
            borderColor: theme.border,
            borderTopWidth: 1,
            backgroundColor: theme.background,
            flex: 1
        }}>
            <ScrollView style={{
                paddingHorizontal: 15,
            }} keyboardShouldPersistTaps='handled'>

                <View style={{ marginTop: 0 }}>

                    {showError ?
                        <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowError(false) }} singleButton title={strings.error}>
                            <YambiText color="gray" text={strings.fields_error_validation} />
                        </ModalApp> : null}

                    {showInternetError ?
                        <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowInternetError(false) }} singleButton title={strings.error}>
                            <YambiText color="gray" text={strings.connection_failed} />
                        </ModalApp> : null}

                    {showCurrencies ?
                        <ModalApp paddings={false} onClose={() => { dispatch(setShowModalApp(false)); setShowCurrencies(false) }} singleButton title={strings.currency}>
                            <Currencies />
                        </ModalApp> : null}

                    {/* Item Image Section */}
                    {effectiveCanUploadImages && (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: "center", marginTop: 20, marginBottom: 20 }}>
                        <View style={{ alignItems: 'center' }}>
                            {/* <YambiText size="small" color="gray" text={strings.item_picture} style={{ marginBottom: 10 }} /> */}
                            <View>
                                <View style={{
                                    width: 160,
                                    height: 160,
                                    borderRadius: 20,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    overflow: 'hidden',
                                    backgroundColor: theme.border,
                                    ...Platform.select({
                                        ios: {
                                            shadowColor: theme.high_color,
                                            shadowOffset: { width: 0, height: 4 },
                                            shadowOpacity: 0.3,
                                            shadowRadius: 8,
                                        },
                                        android: {
                                            elevation: 6,
                                        },
                                    }),
                                }}>
                                    {(() => {
                                        // Show local image if being uploaded
                                        if (itemImage !== "") {
                                            return (
                                                <FastImage
                                                    style={{ width: 160, height: 160 }}
                                                    resizeMode={FastImage.resizeMode.cover}
                                                    source={{ uri: itemImage }} />
                                            );
                                        }

                                        // Use currentImages state (updated immediately) or fallback to itemm.images
                                        const imagesToUse = currentImages || itemm.images || "";

                                        // Check if images exist
                                        if (imagesToUse === "" || imagesToUse === "[]") {
                                            return (
                                                <View style={{ alignItems: 'center' }}>
                                                    <IconApp pack="FI" name="image" size={50} color={theme.border + "80"} />
                                                    <YambiText size="small" color="gray" text={strings.add_item_picture} style={{ marginTop: 10, opacity: 0.6 }} />
                                                </View>
                                            );
                                        }

                                        // Parse and display the first image
                                        try {
                                            const imagesArray = JSON.parse(itemm.images);
                                            // Array.isArray(imagesArray) && 
                                            if (imagesArray.length > 0) {
                                                return (
                                                    <FastImage
                                                        style={{ width: 160, height: 160 }}
                                                        resizeMode={FastImage.resizeMode.cover}
                                                        source={{
                                                            priority: FastImage.priority.high,
                                                            cache: 'immutable',
                                                            uri: media_url + "/items_images/" + imagesArray[0]
                                                        }} />
                                                );
                                            }
                                        } catch (e) {
                                            // If parsing fails, show placeholder
                                        }

                                        // Fallback to placeholder
                                        return (
                                            <View style={{ alignItems: 'center' }}>
                                                <IconApp pack="FI" name="image" size={50} color={theme.border + "80"} />
                                                <YambiText size="small" color="gray" text={strings.add_item_picture} style={{ marginTop: 10, opacity: 0.6 }} />
                                            </View>
                                        );
                                    })()}
                                </View>
                            </View>

                            <TouchableOpacity onPress={pick_item_image} style={{
                                marginTop: 15,
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: 44,
                                paddingHorizontal: 20,
                                borderRadius: 22,
                                backgroundColor: theme.design_tip2,
                                flexDirection: 'row',
                                ...Platform.select({
                                    ios: {
                                        shadowColor: theme.high_color,
                                        shadowOffset: { width: 0, height: 2 },
                                        shadowOpacity: 0.4,
                                        shadowRadius: 4,
                                    },
                                    android: {
                                        elevation: 4,
                                    },
                                }),
                            }}>
                                {loading_image ?
                                    <ActivityIndicator color={theme.text_design2} size={18} /> :
                                    itemImage === "" ?
                                        <>
                                            <IconApp pack='FI' name="camera" size={18} color={theme.text_design2} />
                                            <YambiText text={strings.change_item_picture} color="design" bold style={{ marginLeft: 8 }} />
                                        </>
                                        :
                                        <>
                                            <IconApp pack='FI' name="upload-cloud" size={18} color={theme.text_design2} />
                                            <YambiText text={strings.send} color="design" bold style={{ marginLeft: 8 }} />
                                        </>}
                            </TouchableOpacity>
                        </View>
                    </View>
                    )}
                    <View style={{
                        flexDirection: 'row',
                        marginTop: 15
                    }}>

                        <View style={{ flex: 1 }}>
                            <YambiText size="small" color="gray" text={strings.include} style={{ marginLeft: 2, marginBottom: 5 }} />
                            <TouchableOpacity
                                onPress={GrosDetail}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    // marginTop: 10,
                                    marginLeft: 2
                                }}>
                                <SwitchApp value={wholesale_and_retail} small onPress={GrosDetail} />
                                <YambiText text={strings.gros + " " + strings.and + " " + strings.detail} numberLines={1} style={{ marginLeft: 8 }} />
                            </TouchableOpacity>
                        </View>

                        <View style={{ width: 20 }}></View>

                        <View style={{ marginBottom: 5, flex: 1 }}>
                            <TouchableOpacity onPress={() => { dispatch(setShowModalApp(true)); setShowCurrencies(true) }}>
                                <YambiText size="small" color="gray" text={strings.currency} style={{ marginLeft: 2, marginBottom: 5 }} />
                                <YambiText color="high" text={renderCurrency(currency, true)} style={{ marginLeft: 2, marginTop: 0 }} numberLines={1} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={{ marginBottom: 15, marginTop: 15 }}>
                        <YambiText size="small" color="gray" text={strings.item_name} style={{ marginLeft: 2, marginBottom: 8 }} />
                        <TextInput
                            placeholderTextColor="gray"
                            maxLength={30}
                            style={{ 
                                color: theme.text, 
                                backgroundColor: theme.border, 
                                paddingLeft: 15, 
                                paddingRight: 15,
                                height: 45, 
                                borderRadius: 8,
                                borderWidth: 1,
                                borderColor: 'transparent',
                                fontSize: app_description.general_font_size,
                            }}
                            value={name}
                            onChangeText={text => setName(text)}
                        />
                    </View>

                    <View style={{ marginBottom: 15 }}>
                        <YambiText size="small" color="gray" text={strings.item_description} style={{ marginLeft: 2, marginBottom: 8 }} />
                        <TextInput
                            placeholderTextColor="gray"
                            maxLength={500}
                            multiline={true}
                            numberOfLines={4}
                            textAlignVertical="top"
                            style={{ 
                                color: theme.text, 
                                backgroundColor: theme.border, 
                                paddingLeft: 15, 
                                paddingRight: 15,
                                paddingTop: 12, 
                                paddingBottom: 12,
                                minHeight: 100, 
                                borderRadius: 8,
                                borderWidth: 1,
                                borderColor: 'transparent',
                                fontSize: app_description.general_font_size,
                            }}
                            value={itemDescription}
                            onChangeText={text => setItemDescription(text)}
                        />
                    </View>

                    {/* Manufacturing Date & Expiry Date Row */}
                    <View style={{ flexDirection: 'row', marginBottom: 15 }}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                            <YambiText size="small" color="gray" text={strings.manufacture_date} style={{ marginLeft: 2, marginBottom: 5 }} />
                            <TouchableOpacity
                                onPress={() => setShowManufactureDatePicker(true)}
                                activeOpacity={0.7}
                                style={{ 
                                    backgroundColor: theme.border, 
                                    borderRadius: 8, 
                                    height: 45, 
                                    justifyContent: 'center', 
                                    paddingLeft: 15,
                                    borderWidth: 1,
                                    borderColor: showManufactureDatePicker ? theme.high_color : 'transparent',
                                }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 15 }}>
                                    <YambiText text={manufactureDate ? formatMonthYear(manufactureDateObj) : strings.select} />
                                    <IconApp pack="FI" name="calendar" size={18} color={manufactureDate ? theme.high_color : theme.gray} />
                                </View>
                            </TouchableOpacity>
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

                        <View style={{ flex: 1, marginLeft: 10 }}>
                            <YambiText size="small" color="gray" text={strings.expiry_date} style={{ marginLeft: 2, marginBottom: 5 }} />
                            <TouchableOpacity
                                onPress={() => setShowExpiryDatePicker(true)}
                                activeOpacity={0.7}
                                style={{ 
                                    backgroundColor: theme.border, 
                                    borderRadius: 8, 
                                    height: 45, 
                                    justifyContent: 'center', 
                                    paddingLeft: 15,
                                    borderWidth: 1,
                                    borderColor: showExpiryDatePicker ? theme.high_color : 'transparent',
                                }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 15 }}>
                                    <YambiText text={expiryDate ? formatMonthYear(expiryDateObj) : strings.select} />
                                    <IconApp pack="FI" name="calendar" size={18} color={expiryDate ? theme.high_color : theme.gray} />
                                </View>
                            </TouchableOpacity>
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

                    {/* Suppliers */}
                    <View style={{ marginBottom: 15 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                            {/* <IconApp pack="FI" name="users" size={16} color={theme.high_color} styles={{ marginRight: 6 }} /> */}
                            <YambiText size="small" color="gray" text={strings.suppliers} style={{ marginLeft: 2 }} />
                        </View>
                        <TextInput
                            placeholderTextColor="gray"
                            placeholder={strings.suppliers_placeholder}
                            maxLength={200}
                            style={{ 
                                color: theme.text, 
                                backgroundColor: theme.border, 
                                paddingLeft: 15,
                                paddingRight: 15,
                                height: 45, 
                                borderRadius: 8,
                                borderWidth: 1,
                                borderColor: 'transparent',
                                fontSize: app_description.general_font_size,
                            }}
                            value={suppliers}
                            onChangeText={text => setSuppliers(text)}
                        />
                    </View>

                    <YambiText text={strings.gros} bold style={{ marginBottom: 15 }} />

                    <View style={{
                        flexDirection: 'row'
                    }}>
                        <View style={{ backgroundColor: theme.background, marginBottom: 15, flex: 1 }}>
                            {wholesale_and_retail ? <YambiText size="small" color="gray" text={strings.cost_price + " (" + strings.gros + ")"} style={{ marginLeft: 2, marginBottom: 5 }} numberLines={2} /> :
                                <YambiText size="small" color="gray" text={strings.cost_price} style={{ marginLeft: 2, marginBottom: 5 }} numberLines={2} />}
                            <TextInput
                                placeholderTextColor="gray"
                                maxLength={20}
                                multiline={true}
                                keyboardType="numeric"
                                style={{ color: theme.text, backgroundColor: theme.border, paddingLeft: 15, minHeight: 45, borderRadius: 5 }}
                                value={wholesale_cost_price}
                                onChangeText={text => setWholesale_cost_price(text)}
                            />
                        </View>
                        <View style={{ width: 20 }}></View>

                        <View style={{ marginBottom: 15, flex: 1 }}>
                            {wholesale_and_retail ? <YambiText size="small" color="gray" text={strings.selling_price + " (" + strings.gros + ")"} style={{ marginLeft: 2, marginBottom: 5 }} numberLines={2} /> :
                                <YambiText size="small" color="gray" text={strings.selling_price} style={{ marginLeft: 2, marginBottom: 5 }} numberLines={2} />}
                            <TextInput
                                placeholderTextColor="gray"
                                maxLength={20}
                                keyboardType="numeric"
                                style={{ color: theme.text, backgroundColor: theme.border, paddingLeft: 15, minHeight: 45, borderRadius: 5 }}
                                value={wholesale_selling_price}
                                onChangeText={text => setWholesale_selling_price(text)}
                            />
                        </View>
                    </View>

                    {wholesale_and_retail ?
                        <View style={{
                            marginTop: 5,
                            paddingTop: 10,
                            borderTopWidth: 1,
                            borderColor: theme.border
                        }}>
                            <YambiText text={strings.detail} bold style={{ marginBottom: 5 }} />

                            <View style={{
                                flexDirection: 'row'
                            }}>
                                <View style={{ marginBottom: 15, flex: 1 }}>
                                    <YambiText size="small" color="gray" text={strings.cost_price + " (" + strings.detail + ")"} style={{ marginLeft: 2, marginBottom: 5 }} />
                                    <TextInput
                                        maxLength={20}
                                        editable={false}
                                        keyboardType="numeric"
                                        style={{ color: theme.text, backgroundColor: theme.border, paddingLeft: 15, minHeight: 45, borderRadius: 5 }}
                                        value={parseInt(wholesale_content_number) > 0 && parseInt(wholesale_cost_price) > 0 ? (parseInt(wholesale_cost_price) / parseInt(wholesale_content_number)).toString() : ""}
                                    // onChangeText={text => setRetail_cost_price(text)}
                                    />
                                </View>
                                <View style={{ width: 20 }}></View>

                                <View style={{ marginBottom: 15, flex: 1 }}>
                                    <YambiText size="small" color="gray" text={strings.selling_price + " (" + strings.detail + ")"} style={{ marginLeft: 2, marginBottom: 5 }} />
                                    <TextInput
                                        maxLength={20}
                                        keyboardType="numeric"
                                        style={{ color: theme.text, backgroundColor: theme.border, paddingLeft: 15, minHeight: 45, borderRadius: 5 }}
                                        value={retail_selling_price}
                                        onChangeText={text => setRetail_selling_price(text)}
                                    />
                                </View>
                            </View>
                        </View>
                        : null}

                    <View style={{
                        marginTop: 5,
                        paddingTop: 10,
                        borderTopWidth: 1,
                        borderColor: theme.border
                    }}>
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            marginRight: 5,
                            alignItems: 'center'
                        }}>
                            <YambiText bold text={strings.quantity} />

                            {wholesale_and_retail ?
                                <TouchableOpacity
                                    onPress={() => setWholesale_quantity(!wholesale_quantity)}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        marginLeft: 2
                                    }}>
                                    <IconApp pack="FA" name="check-circle" size={15} color={theme.high_color} />
                                    <YambiText color="high" text={wholesale_quantity ? strings.wholesale_quantity : strings.retail_quantity} style={{ marginLeft: 8 }} />
                                </TouchableOpacity> : null}
                        </View>

                        <View style={{ flexDirection: 'row', marginTop: 5 }}>
                            <View style={{ marginBottom: 15, flex: 1 }}>
                                <YambiText size="small" color="gray" text={strings.wholesale_content_number} style={{ marginLeft: 2, marginBottom: 5 }} numberLines={2} />
                                <TextInput
                                    placeholderTextColor="gray"
                                    maxLength={20}
                                    editable={wholesale_and_retail ? true : false}
                                    keyboardType="numeric"
                                    style={{ color: theme.text, backgroundColor: theme.border, minHeight: 45, borderRadius: 5, paddingLeft: 15 }}
                                    value={wholesale_content_number}
                                    onChangeText={text => setWholesale_content_number(text)}
                                />
                            </View>

                            <View style={{ width: 10 }}></View>

                            <View style={{ marginBottom: 15, flex: 1 }}>
                                <YambiText size="small" color="gray" text={strings.items_number + " " + strings.in_store} style={{ marginLeft: 2, marginBottom: 5 }} numberLines={2} />
                                {hasItemSales ? (
                                    <View style={{ backgroundColor: theme.border, paddingLeft: 15, minHeight: 45, borderRadius: 5, justifyContent: "center" }}>
                                        <YambiText text={String(itemm.items_number_stock)} />
                                    </View>
                                ) : (
                                    <TextInput
                                        placeholderTextColor="gray"
                                        maxLength={12}
                                        keyboardType="numeric"
                                        style={{ color: theme.text, backgroundColor: theme.border, minHeight: 45, borderRadius: 5, paddingLeft: 15 }}
                                        value={stockStoreInput}
                                        onChangeText={setStockStoreInput}
                                    />
                                )}
                            </View>

                            <View style={{ width: 10 }}></View>

                            <View style={{ marginBottom: 15, flex: 1 }}>
                                <YambiText size="small" color="gray" text={strings.items_number + " " + strings.in_warehouse} style={{ marginLeft: 2, marginBottom: 5 }} numberLines={2} />
                                {hasItemSales ? (
                                    <View style={{ backgroundColor: theme.border, paddingLeft: 15, minHeight: 45, borderRadius: 5, justifyContent: "center" }}>
                                        <YambiText text={String(itemm.items_number_warehouse)} />
                                    </View>
                                ) : (
                                    <TextInput
                                        placeholderTextColor="gray"
                                        maxLength={12}
                                        keyboardType="numeric"
                                        style={{ color: theme.text, backgroundColor: theme.border, minHeight: 45, borderRadius: 5, paddingLeft: 15 }}
                                        value={stockWarehouseInput}
                                        onChangeText={setStockWarehouseInput}
                                    />
                                )}
                            </View>
                        </View>

                        {hasItemSales ? (
                            <YambiText
                                size="small"
                                color="gray"
                                text={strings.stock_quantities_locked_after_sales}
                                style={{ marginBottom: 10, lineHeight: 18 }}
                            />
                        ) : (
                            <YambiText
                                size="small"
                                color="gray"
                                text={strings.stock_quantities_editable_before_sales}
                                style={{ marginBottom: 10, lineHeight: 18 }}
                            />
                        )}

                        {hasItemSales && (
                            <ButtonNormal
                                title={strings.renew_stock}
                                loadEnabled={false}
                                outline={true}
                                onPress={() => navigation.navigate("RenewStock", { item_id: itemm._id, business_id })}
                                styles={{ marginBottom: 8 }}
                            />
                        )}
                    </View>

                    <Pressable onPress={() => {
                        setShowCategoryModal(true);
                        dispatch(setShowModalApp(true));
                    }} style={{ marginTop: 15, flex: 1, borderTopWidth: 1, borderColor: theme.border, paddingTop: 15 }}>
                        <YambiText color="high" text={strings.item_category} />

                        {show_category(selectedCategory)}

                        {show_subcategory(selectedCategory, selectedSubCategory)}
                    </Pressable>

                    <View style={{ flexDirection: 'row', flex: 1, width: "100%" }}>
                        <Pressable onPress={() => {
                            setShowColorsModal(true);
                            dispatch(setShowModalApp(true));
                        }} style={{ marginTop: 10, flex: 1, borderTopWidth: 1, borderColor: theme.border, paddingVertical: 10 }}>
                            <YambiText color="high" text={strings.colors} />

                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5, flexWrap: 'wrap', }}>{selectedColors && selectedColors !== "[]" &&
                                JSON.parse(selectedColors).map((color: string, index: number) => (
                                    <View key={index} style={{ marginRight: 6, borderRadius: 5, backgroundColor: color, height: 25, width: 25, borderWidth: 1, borderColor: theme.border, marginVertical: 2, }}></View>
                                ))}</View>
                        </Pressable>

                        <Pressable onPress={() => {
                            setShowSizesModal(true);
                            dispatch(setShowModalApp(true));
                        }} style={{ marginTop: 10, flex: 1, borderTopWidth: 1, borderColor: theme.border, paddingVertical: 10 }}>
                            <YambiText color="high" text={strings.sizes} />

                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5, flexWrap: 'wrap', }}>{selectedSizes && selectedSizes !== "[]" &&
                                JSON.parse(selectedSizes).map((size: string, index: number) => (
                                    <View key={index} style={{ marginRight: 6, borderRadius: 5, backgroundColor: theme.background, height: 25, borderColor: theme.border, borderWidth: 1, alignItems: 'center', paddingHorizontal: 10, justifyContent: 'center', marginVertical: 2 }}>
                                        <YambiText size="small" text={size} />
                                    </View>
                                ))}</View>
                        </Pressable>
                    </View>

                    <Pressable
                        onPress={() => {
                            setShowDiscountModal(true);
                            dispatch(setShowModalApp(true));
                        }}
                        style={{ marginTop: 10, flex: 1, borderTopWidth: 1, borderColor: theme.border, paddingVertical: 10 }}>
                        <YambiText color="high" text={strings.discount} />
                        {discountPercentage > 0 && (
                            <View style={{ marginTop: 5 }}>
                                <YambiText size="small" text={`${discountPercentage}% ${strings.discount || "discount"}`} />
                                {discountStartDate && discountEndDate && (
                                    <YambiText size="small" color="gray" text={`${moment(discountStartDate).format('YYYY-MM-DD HH:mm')} - ${moment(discountEndDate).format('YYYY-MM-DD HH:mm')}`} />
                                )}
                            </View>
                        )}
                    </Pressable>

                    <View style={{ flex: 1, borderTopWidth: 1, borderColor: theme.border, paddingTop: 15 }}>
                        {(() => {
                            //Check if item can be published to marketplace 
                            // Check if item has image
                            let hasImage = false;
                            try {
                                if (itemm.images && itemm.images !== "" && itemm.images !== "[]") {
                                    const imagesArray = JSON.parse(itemm.images);
                                    hasImage = Array.isArray(imagesArray) && imagesArray.length > 0;
                                }
                            } catch (e) {
                                hasImage = false;
                            }

                            // Check if item has selling price
                            const hasSellingPrice = (retail_selling_price !== "" && parseFloat(retail_selling_price) > 0) ||
                                (wholesale_selling_price !== "" && parseFloat(wholesale_selling_price) > 0);

                            // Check if item has items in store
                            const stockCount = itemm ? itemm.items_number_stock : 0;
                            const hasItemsInStore = stockCount > 0;

                            const canPublish = hasImage && hasSellingPrice && hasItemsInStore && itemm.category !== "" && itemm.subcategory !== "";

                            return (
                                <View>
                                    <TouchableOpacity
                                        onPress={() => {
                                            if (canPublish) {
                                                const newVisibility = marketplace_visibility === 0 ? 1 : 0;
                                                setMarketplace_visibility(newVisibility);
                                                updateItemImmediately({ marketplace_visibility: newVisibility });
                                            }
                                        }}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            marginLeft: 2,
                                            opacity: canPublish ? 1 : 0.5
                                        }}
                                        disabled={!canPublish}
                                    >
                                        <SwitchApp
                                            value={marketplace_visibility === 0 ? false : true}
                                            small
                                            onPress={() => {
                                                if (canPublish) {
                                                    const newVisibility = marketplace_visibility === 0 ? 1 : 0;
                                                    setMarketplace_visibility(newVisibility);
                                                    updateItemImmediately({ marketplace_visibility: newVisibility });
                                                }
                                            }}
                                            disabled={!canPublish}
                                        />
                                        <YambiText
                                            text={strings.publish_to_marketplace}
                                            numberLines={1}
                                            style={{ marginLeft: 8 }}
                                        />
                                    </TouchableOpacity>

                                    {!canPublish && (
                                        <YambiText color="gray" style={{ marginTop: 10 }} text={strings.publish_to_marketplace_description} />
                                    )}
                                </View>
                            );
                        })()}
                    </View>

                    <ButtonNormal title={strings.save} loadEnabled={true} onPress={EditBusinessItem} styles={{ paddingHorizontal: 20, marginVertical: 20 }} normal={true} />

                    {showCategoryModal && <CategoryModal />}
                    {showColorsModal && <ColorsModal />}
                    {showDiscountModal && <DiscountModal />}
                    {showSizesModal && <SizesModal />}

                </View>
            </ScrollView>
        </View>
    )
}

export default EditBusinessItem;

