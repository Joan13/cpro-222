import { View, Alert, ScrollView, TextInput, Pressable, ActivityIndicator } from "react-native";
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from "../../store/app/hooks";
import { strings } from "../../lang/lang";
import ButtonNormal from "../../components/app/ButtonNormal";
import { IconApp } from "../../components/app/IconApp";
import { YambiText } from "../../components/app/Text";
import ModalApp from "../../components/app/ModalApp";
import BottomSheet from "../../components/app/BottomSheet";
import { setLoadingButton, setShowModalApp } from "../../store/reducers/appSlice";
import { remote_host, renderCurrency, SocketApp, global_currencies, media_url } from "../../../GlobalVariables";
import axios from "axios";
import { NavProps, TBusinessSubscription, TItem, TItemPrices } from "../../types/types";
import { useObject, useQuery, useRealm } from "@realm/react";
import moment from "moment";
import { UserBusinessArticles, ItemPrices, BusinessItemsSale } from "../../store/database/Models";
import SwitchApp from "../../components/app/SwitchApp";
import DateTimePicker from '@react-native-community/datetimepicker';
import { Image as ExpoImage } from 'expo-image';
import * as MediaLibrary from 'expo-media-library';
import { PhotoEditor } from '../../components/lists/gallery/PhotoEditor';
import { ProcessedPhoto } from '../../types/gallery';

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

const EditBusinessItem = ({ route, navigation }: NavProps) => {
    const { business_id, item_id } = route.params;
    const canUploadImages = (route.params as any)?.can_upload_images !== false;
    const persistedSubscriptions = useAppSelector(state => state.persisted_app.business_subscriptions || []);

    const theme = useAppSelector(state => state.app_theme.colors);
    const user_data = useAppSelector(state => state.user_data);

    const [selectedAssets, setSelectedAssets] = useState<MediaLibrary.Asset[]>([]);
    const [showEditor, setShowEditor] = useState<boolean>(false);
    const [currency, setCurrency] = useState<number>(1);
    const [name, setName] = useState<string>("");
    const [itemDescription, setItemDescription] = useState<string>("");
    const [wholesale_cost_price, setWholesale_cost_price] = useState<string>("");
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

    const dispatch = useAppDispatch();
    const realm = useRealm();

    const itemSales = useQuery(
        BusinessItemsSale,
        (collection) => collection.filtered("item_id == $0 && sale_active == $1", item_id, 1),
        [item_id]
    );
    const hasItemSales = itemSales.length > 0;
    const itemm = useObject(UserBusinessArticles, item_id);

    if (itemm === null) return null;

    const prices = useObject(ItemPrices, "G" + itemm._id);
    if (prices === null) return null;

    // Selector BottomSheet states
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [selectedSubCategory, setSelectedSubCategory] = useState<string>("");

    const [showColorsModal, setShowColorsModal] = useState(false);
    const [selectedColors, setSelectedColors] = useState("[]");
    const [selectedSizes, setSelectedSizes] = useState("[]");

    // Discount fields
    const [discountPercentage, setDiscountPercentage] = useState<number>(0);
    const [discountStartDate, setDiscountStartDate] = useState<string>("");
    const [discountEndDate, setDiscountEndDate] = useState<string>("");
    const [showDiscountModal, setShowDiscountModal] = useState(false);
    const [showDiscountStartDatePicker, setShowDiscountStartDatePicker] = useState<boolean>(false);
    const [showDiscountEndDatePicker, setShowDiscountEndDatePicker] = useState<boolean>(false);
    const [discountStartDateObj, setDiscountStartDateObj] = useState<Date>(new Date());
    const [discountEndDateObj, setDiscountEndDateObj] = useState<Date>(new Date());

    // Date fields
    const [manufactureDate, setManufactureDate] = useState<string>("");
    const [expiryDate, setExpiryDate] = useState<string>("");
    const [showManufactureDatePicker, setShowManufactureDatePicker] = useState(false);
    const [showExpiryDatePicker, setShowExpiryDatePicker] = useState(false);
    const [manufactureDateObj, setManufactureDateObj] = useState<Date>(new Date());
    const [expiryDateObj, setExpiryDateObj] = useState<Date>(new Date());

    const isInitializedRef = useRef<boolean>(false);

    const formatMonthYear = (date: Date | string): string => {
        const d = typeof date === 'string' ? new Date(date) : date;
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    };

    const createDateFromMonthYear = (monthYear: string): Date => {
        if (!monthYear) return new Date();
        const [year, month] = monthYear.split('-').map(Number);
        return new Date(year, month - 1, 1);
    };

    const normalizeToFirstOfMonth = (date: Date): Date => {
        return new Date(date.getFullYear(), date.getMonth(), 1);
    };

    const [suppliers, setSuppliers] = useState<string>("");
    const [itemImage, setItemImage] = useState<string>("");
    const [loading_image, setLoading_image] = useState<boolean>(false);
    const [currentImages, setCurrentImages] = useState<string>("");
    const imagesManuallyUpdatedRef = useRef<boolean>(false);

    const [showDeletePhotoModal, setShowDeletePhotoModal] = useState<boolean>(false);
    const [photoIndexToDelete, setPhotoIndexToDelete] = useState<number | null>(null);

    const parseImagesArray = (rawImages: any): string[] => {
        if (!rawImages) return [];
        if (Array.isArray(rawImages)) return rawImages;
        if (typeof rawImages === 'string') {
            const trimmed = rawImages.trim();
            if (trimmed === '' || trimmed === '[]') return [];
            if (trimmed.startsWith('[')) {
                try {
                    const parsed = JSON.parse(trimmed);
                    return Array.isArray(parsed) ? parsed : [];
                } catch {
                    return [];
                }
            }
            return [trimmed];
        }
        return [];
    };

    const items_categories = strings.items_categories;
    const [marketplace_visibility, setMarketplace_visibility] = useState<number>(0);

    const maxImagesForPlan = useMemo(() => {
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

        if (!activeSubscription) return 0;
        const plan = Number(activeSubscription.subscription_plan ?? 0);
        if (plan === 1) return 1;
        if (plan === 2) return 3;
        if (plan === 3) return 5;
        return 0;
    }, [persistedSubscriptions, business_id]);

    const planAllowsImages = maxImagesForPlan > 0;
    const effectiveCanUploadImages = canUploadImages && planAllowsImages;

    const handleEditorComplete = async (processedPhotos: ProcessedPhoto[]) => {
        setShowEditor(false);
        if (processedPhotos && processedPhotos.length > 0 && itemm !== null) {
            setLoading_image(true);
            let latestImages = currentImages || itemm?.images || "";

            for (let i = 0; i < processedPhotos.length; i++) {
                const photo = processedPhotos[i];
                const filename = Date.now() + '-' + i + '-' + Math.round(Math.random() * 1E9);
                const base_url = remote_host + "/yambi/API/upload_item_image";
                const formData = new FormData();
                formData.append('assemble', itemm._id);
                formData.append('item_images', latestImages);
                formData.append('image', { type: 'image/jpeg', uri: photo.uri, name: `${filename}item.jpg` } as any);

                try {
                    const response = await axios.post(base_url, formData, {
                        headers: {
                            Accept: 'application/json',
                            'Content-Type': 'multipart/form-data'
                        }
                    });

                    if (response.data.message === "1" && response.data.item_images) {
                        latestImages = response.data.item_images;
                        imagesManuallyUpdatedRef.current = true;
                        setCurrentImages(latestImages);

                        realm.write(() => {
                            try {
                                realm.create('UserBusinessArticles', {
                                    _id: itemm._id,
                                    images: latestImages,
                                    updatedAt: moment().format()
                                }, true);
                            } catch (e) { }
                        });
                    }
                } catch (error) {
                    console.log('Error uploading article image:', error);
                }
            }
            setLoading_image(false);
        }
    };

    const pick_item_image = () => {
        if (!effectiveCanUploadImages) {
            Alert.alert(
                strings.error,
                strings.add_subscription_to_activate_locked_items,
                [
                    { text: strings.close, style: "cancel" },
                    {
                        text: strings.add_subscription,
                        onPress: () => navigation.navigate("AddBusinessSubscription", { business_id }),
                    },
                ]
            );
            return;
        }

        if (itemm === null) return;

        const imagesToUse = currentImages || itemm?.images || "";
        const existingImages = parseImagesArray(imagesToUse);
        const remainingQuota = maxImagesForPlan - existingImages.length;

        if (remainingQuota <= 0) {
            Alert.alert(
                strings.error || "Limit Reached",
                `Your subscription plan allows up to ${maxImagesForPlan} image${maxImagesForPlan > 1 ? "s" : ""} per article.`,
                [
                    { text: strings.close || "Close", style: "cancel" },
                    {
                        text: (strings as any).upgrade_subscription || "Upgrade Plan",
                        onPress: () => navigation.navigate("BusinessSubscriptionPlans", { business_id }),
                    },
                ]
            );
            return;
        }

        (navigation as any).navigate('Gallery', {
            multiple: true,
            maxSelection: remainingQuota,
            onSelect: (assets: MediaLibrary.Asset[]) => {
                if (assets && assets.length > 0) {
                    setSelectedAssets(assets);
                    setShowEditor(true);
                }
            }
        });
    };

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
            discount_percentage: updates.discount_percentage !== undefined ? updates.discount_percentage : itemm.discount_percentage,
            discount_start_date: updates.discount_start_date !== undefined ? updates.discount_start_date : itemm.discount_start_date,
            discount_end_date: updates.discount_end_date !== undefined ? updates.discount_end_date : itemm.discount_end_date,
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

        if (updates.images !== undefined) {
            imagesManuallyUpdatedRef.current = true;
            setCurrentImages(updates.images);
        }

        SocketApp.emit("newItems", JSON.stringify({ phone_number: user_data.phone_number, items: [updatedItem] }));
    }, [itemm, realm, user_data, manufactureDate, expiryDate, suppliers]);

    const activeColorsList = useMemo(() => safeJsonStringArray(selectedColors), [selectedColors]);
    const activeSizesList = useMemo(() => safeJsonStringArray(selectedSizes), [selectedSizes]);

    const toggleColorItem = useCallback((color: string) => {
        setSelectedColors((prev) => {
            const active = safeJsonStringArray(prev);
            const next = active.includes(color) ? active.filter(c => c !== color) : [...active, color];
            return JSON.stringify(next);
        });
    }, []);

    const toggleSizeItem = useCallback((size: string) => {
        setSelectedSizes((prev) => {
            const active = safeJsonStringArray(prev);
            const next = active.includes(size) ? active.filter(s => s !== size) : [...active, size];
            return JSON.stringify(next);
        });
    }, []);

    const confirmDeletePhoto = (index: number) => {
        setPhotoIndexToDelete(index);
        setShowDeletePhotoModal(true);
        dispatch(setShowModalApp(true));
    };

    const handleDeletePhotoAction = () => {
        if (photoIndexToDelete !== null) {
            const imagesToUse = currentImages || itemm?.images || "";
            const currentArray = parseImagesArray(imagesToUse);
            const updatedArray = currentArray.filter((_, i) => i !== photoIndexToDelete);
            const updatedImagesString = JSON.stringify(updatedArray);
            updateItemImmediately({ images: updatedImagesString });
        }
        setShowDeletePhotoModal(false);
        dispatch(setShowModalApp(false));
        setPhotoIndexToDelete(null);
    };

    const ViewItemPhoto = (initialIndex: number = 0) => {
        const imagesToUse = currentImages || itemm?.images || "";
        const imagesArray = parseImagesArray(imagesToUse);
        const urls = imagesArray.map(img => media_url + "/items_images/" + img);
        if (urls.length > 0) {
            navigation.navigate("ViewPhoto", { images: urls, initialIndex });
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
                if (Number.isNaN(n) || n < 0) return fallback;
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
            };

            const pricesData: TItemPrices = {
                _id: "G" + item_id,
                item_id: item_id,
                phone_number: user_data.phone_number,
                wholesale_cost_price: wholesale_cost_price,
                wholesale_selling_price: wholesale_selling_price,
                retail_selling_price: retail_selling_price,
                uploaded: 0,
                currency: currency
            };

            realm.write(() => {
                try {
                    realm.create('UserBusinessArticles', item, true);
                } catch (error) { }

                try {
                    realm.create('ItemPrices', pricesData, true);
                } catch (error) { }
            });

            SocketApp.emit("newItems", JSON.stringify({ phone_number: user_data.phone_number, items: [item] }));
            SocketApp.emit("newItemPrices", JSON.stringify({ phone_number: user_data.phone_number, items: [pricesData] }));

            setTimeout(() => {
                dispatch(setLoadingButton(false));
            }, 300);
        }
    };

    const GrosDetail = () => {
        setWholesale_and_retail(!wholesale_and_retail);
        setWholesale_content_number("1");
    };

    useEffect(() => {
        if (!itemm || !prices) return;
        if (!isInitializedRef.current) {
            setCurrency(prices.currency);
            setName(itemm.item_name);
            setWholesale_cost_price(prices.wholesale_cost_price);
            setWholesale_selling_price(prices.wholesale_selling_price);
            setWholesale_content_number(itemm.wholesale_content_number.toString());
            setSelectedCategory(itemm.category);
            setSelectedSubCategory(itemm.subcategory);
            setRetail_selling_price(prices.retail_selling_price);
            setSelectedColors(itemm.colors || "[]");
            setDiscountPercentage(itemm.discount_percentage || 0);
            setDiscountStartDate(itemm.discount_start_date || "");
            setDiscountEndDate(itemm.discount_end_date || "");
            if (itemm.discount_start_date) {
                setDiscountStartDateObj(new Date(itemm.discount_start_date));
            }
            if (itemm.discount_end_date) {
                setDiscountEndDateObj(new Date(itemm.discount_end_date));
            }
            setMarketplace_visibility(itemm.marketplace_visibility || 0);
            setSelectedSizes(itemm.sizes || "[]");
            setItemDescription(itemm.description_item || "");

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

            setSuppliers(itemm.supplier || "");
            setStockStoreInput(String(itemm.items_number_stock ?? 0));
            setStockWarehouseInput(String(itemm.items_number_warehouse ?? 0));

            if (!imagesManuallyUpdatedRef.current) {
                setCurrentImages(itemm.images || "");
            }

            isInitializedRef.current = true;
        }
    }, [itemm, prices]);

    const show_category = (catId: string) => {
        if (!catId) return null;
        const index = strings.items_categories[catId];
        if (!index) return null;
        return <YambiText color="high" text={index.name} bold />;
    };

    const show_subcategory = (catId: string, subKey: string) => {
        if (!catId || !subKey) return null;
        const index = strings.items_categories[catId];
        if (!index || !index.subcategories[subKey]) return null;
        return <YambiText color="high" text={index.subcategories[subKey]} bold />;
    };

    return (
        <View style={{ borderColor: theme.border, borderTopWidth: 1, backgroundColor: theme.background, flex: 1 }}>
            <ScrollView style={{ paddingHorizontal: 16 }} keyboardShouldPersistTaps='handled' showsVerticalScrollIndicator={false}>

                {/* ── Modals ── */}
                {showError && <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowError(false); }} singleButton title={strings.error}><YambiText color="gray" text={validationErrorMsg || strings.fields_error_validation} /></ModalApp>}
                {showInternetError && <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowInternetError(false); }} singleButton title={strings.error}><YambiText color="gray" text={strings.connection_failed} /></ModalApp>}
                {showDeletePhotoModal && (
                    <ModalApp
                        onClose={() => {
                            setShowDeletePhotoModal(false);
                            dispatch(setShowModalApp(false));
                            setPhotoIndexToDelete(null);
                        }}
                        singleButton={false}
                        textCancel={strings.cancel || "Cancel"}
                        textAction={strings.delete || "Delete"}
                        onAction={handleDeletePhotoAction}
                        title={strings.delete || "Delete Photo"}
                    >
                        <YambiText color="gray" text="Are you sure you want to remove this photo?" />
                    </ModalApp>
                )}

                <View style={{ marginTop: 16, paddingBottom: 50 }}>

                    {/* ── Image Upload Card ── */}
                    {effectiveCanUploadImages && (() => {
                        const imagesToUse = currentImages || itemm?.images || "";
                        const imagesArray = parseImagesArray(imagesToUse);
                        const count = imagesArray.length;

                        return (
                            <View style={{ backgroundColor: theme.border + "15", borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: theme.border }}>
                                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                                        <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: theme.high_color + "20", justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
                                            <IconApp pack="FI" name="image" size={18} color={theme.high_color} />
                                        </View>
                                        <YambiText bold text={strings.item_picture || "Item Photos"} style={{ fontSize: 16 }} />
                                    </View>
                                    <View style={{ backgroundColor: theme.border, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                                        <YambiText size="small" bold color={count >= maxImagesForPlan ? "error" : "high"} text={`${count}/${maxImagesForPlan}`} />
                                    </View>
                                </View>

                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', alignItems: 'center' }}>
                                    {imagesArray.map((imgFileName, idx) => (
                                        <View key={idx} style={{ position: 'relative', marginRight: 12, marginVertical: 4 }}>
                                            <Pressable onPress={() => ViewItemPhoto(idx)} style={{ width: 110, height: 110, borderRadius: 16, overflow: 'hidden', backgroundColor: theme.border }}>
                                                <ExpoImage style={{ width: 110, height: 110 }} contentFit="cover" source={media_url + "/items_images/" + imgFileName} />
                                            </Pressable>
                                            <Pressable
                                                onPress={() => confirmDeletePhoto(idx)}
                                                hitSlop={6}
                                                style={{
                                                    position: 'absolute',
                                                    top: -6,
                                                    right: -6,
                                                    backgroundColor: theme.error || '#FF3B30',
                                                    width: 26,
                                                    height: 26,
                                                    borderRadius: 13,
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    borderWidth: 2,
                                                    borderColor: theme.card,
                                                    elevation: 3,
                                                }}>
                                                <IconApp pack="FI" name="trash-2" size={12} color="#FFFFFF" />
                                            </Pressable>
                                        </View>
                                    ))}

                                    {loading_image && (
                                        <View style={{ width: 110, height: 110, borderRadius: 16, backgroundColor: theme.border, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                                            <ActivityIndicator color={theme.high_color} size={24} />
                                        </View>
                                    )}

                                    {count < maxImagesForPlan && !loading_image && (
                                        <Pressable
                                            onPress={pick_item_image}
                                            style={{
                                                width: 110,
                                                height: 110,
                                                borderRadius: 16,
                                                borderWidth: 2,
                                                borderColor: theme.high_color + "50",
                                                borderStyle: 'dashed',
                                                backgroundColor: theme.background,
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                            }}>
                                            <IconApp pack="FI" name="camera" size={24} color={theme.high_color} />
                                            <YambiText size="xsmall" bold color="high" text={strings.add || "Add Photo"} style={{ marginTop: 6 }} />
                                        </Pressable>
                                    )}
                                </ScrollView>
                            </View>
                        );
                    })()}

                    {/* ── CARD 1: Settings & Currency ── */}
                    <View style={{ backgroundColor: theme.border + "15", borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: theme.border }}>
                        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
                            <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: theme.high_color + "20", justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
                                <IconApp pack="FI" name="settings" size={18} color={theme.high_color} />
                            </View>
                            <YambiText bold text={strings.settings} style={{ fontSize: 16 }} />
                        </View>
                        <View style={{ marginBottom: 14 }}>
                            <YambiText size="small" color="gray" text={strings.include} style={{ marginBottom: 8 }} />
                            <Pressable onPress={GrosDetail} style={{
                                flexDirection: "row", alignItems: "center",
                                backgroundColor: theme.background, borderRadius: 12, padding: 14,
                                borderWidth: 1, borderColor: theme.border,
                            }}>
                                <IconApp color={theme.high_color} name={!wholesale_and_retail ? "ellipse-outline" : "checkmark-circle"} size={20} pack="IO" />
                                <YambiText text={strings.gros + " " + strings.and + " " + strings.detail} color="high" numberLines={1} style={{ marginLeft: 10, flex: 1, fontWeight: '600' }} />
                            </Pressable>
                        </View>
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
                                    minHeight: 100, borderRadius: 12, fontSize: 15,
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
                                    paddingHorizontal: 16, height: 46, borderRadius: 12, fontSize: 15,
                                }}
                                value={suppliers}
                                onChangeText={text => setSuppliers(text)}
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

                    {/* ── CARD 5: Pricing & Discount ── */}
                    <View style={{ backgroundColor: theme.border + "15", borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: theme.border }}>
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                                <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: theme.high_color + "20", justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
                                    <IconApp pack="FI" name="dollar-sign" size={18} color={theme.high_color} />
                                </View>
                                <YambiText bold text={strings.gros} style={{ fontSize: 16 }} />
                            </View>
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
                                <Pressable onPress={() => setWholesale_quantity(!wholesale_quantity)} style={{ flexDirection: "row", alignItems: "center" }}>
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

                    {/* ── CARD 7: Marketplace ── */}
                    <View style={{ backgroundColor: theme.border + "15", borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: theme.border }}>
                        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
                            <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: theme.high_color + "20", justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
                                <IconApp pack="FI" name="globe" size={18} color={theme.high_color} />
                            </View>
                            <YambiText bold text={strings.publish_to_marketplace} style={{ fontSize: 16 }} />
                        </View>
                        {(() => {
                            const imagesToUse = currentImages || itemm?.images || "";
                            const imagesArray = parseImagesArray(imagesToUse);
                            const hasImage = imagesArray.length > 0;
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

                    <ButtonNormal title={strings.save} loadEnabled={true} onPress={EditBusinessItem} styles={{ paddingHorizontal: 20, marginTop: 8, height: 48, borderRadius: 24 }} normal={true} />
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
                                                            updateItemImmediately({ category: cat.id, subcategory: subKey });
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
                        onClose={() => {
                            setShowColorsModal(false);
                            updateItemImmediately({ colors: selectedColors });
                        }}
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
                        onClose={() => {
                            setShowSizesModal(false);
                            updateItemImmediately({ sizes: selectedSizes });
                        }}
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
                                onPress={() => {
                                    updateItemImmediately({
                                        discount_percentage: discountPercentage,
                                        discount_start_date: discountStartDate,
                                        discount_end_date: discountEndDate
                                    });
                                    setShowDiscountModal(false);
                                }}
                                styles={{ height: 48, borderRadius: 24, marginTop: 6 }}
                                normal={true}
                            />
                        </View>
                    </BottomSheet>
                ) : null}

            </ScrollView>
            {showEditor && selectedAssets.length > 0 ? (
                <PhotoEditor
                    assets={selectedAssets}
                    visible={showEditor}
                    onClose={() => setShowEditor(false)}
                    onComplete={handleEditorComplete}
                />
            ) : null}
        </View>
    );
};

export default EditBusinessItem;
