import { View, ScrollView, TextInput, TouchableOpacity } from "react-native";
import { useState, useCallback, useEffect, useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import axios, { isAxiosError } from "axios";
import moment from "moment";
import { useObject, useRealm } from "@realm/react";
import { useAppDispatch, useAppSelector } from "../../store/app/hooks";
import { setShowModalApp } from "../../store/reducers/appSlice";
import ModalApp from "../../components/app/ModalApp";
import { strings } from "../../lang/lang";
import ButtonNormal from "../../components/app/ButtonNormal";
import { YambiText } from "../../components/app/Text";
import { remote_host, SocketApp } from "../../../GlobalVariables";
import { NavProps, TItem } from "../../types/types";
import { UserBusinessArticles } from "../../store/database/Models";

const parsePositiveInt = (s: string) => {
    const n = parseInt(String(s).replace(/\D/g, ""), 10);
    return Number.isNaN(n) ? 0 : n;
};

const movementActionLabel = (type: number): string => {
    switch (type) {
        case 1:
            return strings.add_inventory_to_warehouse;
        case 2:
            return strings.add_inventory_to_store;
        case 3:
            return strings.move_to_warehouse;
        case 4:
            return strings.move_to_store;
        default:
            return "";
    }
};

const RenewStock = ({ route, navigation }: NavProps) => {
    const { item_id, business_id } = route.params;
    const theme = useAppSelector((state) => state.app_theme.colors);
    const dispatch = useAppDispatch();
    const insets = useSafeAreaInsets();
    const user_data = useAppSelector((state) => state.user_data);
    const app_description = useAppSelector((state) => state.persisted_app.app_description);
    const realm = useRealm();
    const itemm = useObject(UserBusinessArticles, item_id);

    /** true = wholesale (bulk) lots, false = retail (single) units */
    const [useBulk, setUseBulk] = useState(false);
    const [entryQty, setEntryQty] = useState("");
    const [unitsPerBulk, setUnitsPerBulk] = useState("1");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    /** Selected movement: 1 add warehouse, 2 add store, 3 store→warehouse, 4 warehouse→store */
    const [movementType, setMovementType] = useState<number | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    useEffect(() => {
        if (itemm == null) return;
        setUnitsPerBulk(String(Math.max(1, itemm.wholesale_content_number || 1)));
    }, [itemm, itemm?.wholesale_content_number]);

    const retailUnitsInvolved = useMemo(() => {
        if (useBulk) {
            const lots = parsePositiveInt(entryQty);
            const per = parsePositiveInt(unitsPerBulk);
            if (per < 1) return 0;
            return lots * per;
        }
        return parsePositiveInt(entryQty);
    }, [useBulk, entryQty, unitsPerBulk]);

    const applyMovement = useCallback(
        async (movement_type: number) => {
            setError("");
            const quantity = retailUnitsInvolved;
            if (useBulk) {
                const per = parsePositiveInt(unitsPerBulk);
                if (per < 1) {
                    setError(strings.error_units_per_bulk);
                    return;
                }
            }
            if (quantity <= 0) {
                setError(strings.enter_quantity);
                return;
            }
            if (itemm === null) return;

            if (movement_type === 3 && quantity > itemm.items_number_stock) {
                setError(strings.error_move_exceeds_store);
                return;
            }
            if (movement_type === 4 && quantity > itemm.items_number_warehouse) {
                setError(strings.error_move_exceeds_warehouse);
                return;
            }

            setLoading(true);
            try {
                const response = await axios.post(
                    remote_host + "/yambi/API/add_inventory_movement",
                    {
                        phone_number: user_data.phone_number,
                        business_id,
                        item_id: itemm._id,
                        movement_type,
                        quantity,
                        description: "",
                    },
                    { validateStatus: () => true }
                );

                const data = response.data;
                if (data == null || typeof data !== "object") {
                    setError(strings.connection_failed);
                    setLoading(false);
                    return;
                }

                const success = data.success === "1" || data.success === 1;
                if (!success) {
                    const err = data.error as string | undefined;
                    if (err === "insufficient_store") {
                        setError(strings.error_move_exceeds_store);
                    } else if (err === "insufficient_warehouse") {
                        setError(strings.error_move_exceeds_warehouse);
                    } else if (err === "item_not_found") {
                        setError(strings.error_inventory_item_not_found);
                    } else if (err === "forbidden") {
                        setError(strings.error_inventory_forbidden);
                    } else if (err === "invalid_params") {
                        setError(strings.enter_quantity);
                    } else if (err === "server_error" || response.status >= 500) {
                        setError(strings.error_inventory_server);
                    } else if (response.status === 404) {
                        setError(strings.error_inventory_item_not_found);
                    } else {
                        setError(strings.connection_failed);
                    }
                    setLoading(false);
                    return;
                }

                const doc = data.item;
                const mov = data.movement;
                if (!doc || !mov) {
                    setError(strings.error_inventory_server);
                    setLoading(false);
                    return;
                }

                const updatedItem: TItem = {
                    _id: itemm._id,
                    business_id: itemm.business_id,
                    phone_number: itemm.phone_number,
                    item_name: itemm.item_name,
                    slogan: itemm.slogan,
                    item_type: itemm.item_type,
                    category: doc.category ?? itemm.category,
                    subcategory: doc.subcategory ?? itemm.subcategory,
                    manufacture_date: doc.manufacture_date ?? itemm.manufacture_date,
                    expiry_date: doc.expiry_date ?? itemm.expiry_date,
                    wholesale_content_number: doc.wholesale_content_number != null ? Number(doc.wholesale_content_number) : itemm.wholesale_content_number,
                    items_number_stock: Number(doc.items_number_stock),
                    items_number_warehouse: Number(doc.items_number_warehouse),
                    description_item: doc.description_item ?? itemm.description_item,
                    keywords: doc.keywords ?? itemm.keywords,
                    images: doc.images ?? itemm.images,
                    background: doc.background ?? itemm.background,
                    item_active: doc.item_active != null ? Number(doc.item_active) : itemm.item_active,
                    supplier: doc.supplier ?? itemm.supplier,
                    other_information: doc.other_information ?? itemm.other_information,
                    alert_low_stock: doc.alert_low_stock != null ? Number(doc.alert_low_stock) : Math.floor(0.25 * Number(doc.items_number_stock)),
                    uploaded: 0,
                    createdAt: doc.createdAt ?? itemm.createdAt,
                    updatedAt: moment(new Date()).format(),
                    colors: doc.colors ?? itemm.colors,
                    discount_percentage: doc.discount_percentage != null ? Number(doc.discount_percentage) : itemm.discount_percentage,
                    discount_start_date: doc.discount_start_date ?? itemm.discount_start_date,
                    discount_end_date: doc.discount_end_date ?? itemm.discount_end_date,
                    marketplace_visibility:
                        doc.marketplace_visibility != null ? Number(doc.marketplace_visibility) : itemm.marketplace_visibility,
                    weights: doc.weights ?? itemm.weights,
                    sizes: doc.sizes ?? itemm.sizes,
                    flag: doc.flag != null ? Number(doc.flag) : itemm.flag,
                    is_best_seller: doc.is_best_seller != null ? Number(doc.is_best_seller) : itemm.is_best_seller,
                    visibility_rank: doc.visibility_rank != null ? Number(doc.visibility_rank) : itemm.visibility_rank,
                    is_featured: doc.is_featured != null ? Number(doc.is_featured) : itemm.is_featured,
                };

                const createdAt =
                    typeof mov.createdAt === "string" ? mov.createdAt : new Date(mov.createdAt || Date.now()).toISOString();
                const updatedAtMov =
                    typeof mov.updatedAt === "string" ? mov.updatedAt : new Date(mov.updatedAt || mov.createdAt || Date.now()).toISOString();

                const movementQty = mov.quantity != null ? Number(mov.quantity) : quantity;

                const movementRow = {
                    _id: String(mov._id),
                    phone_number: String(mov.phone_number),
                    business_id: String(mov.business_id),
                    item_id: String(mov.item_id),
                    movement_type: Number(mov.movement_type),
                    quantity: movementQty,
                    quantity_stock: Number(mov.quantity_stock),
                    quantity_warehouse: Number(mov.quantity_warehouse),
                    description: mov.description != null ? String(mov.description) : "",
                    createdAt,
                    updatedAt: updatedAtMov,
                };

                realm.write(() => {
                    try {
                        realm.create("UserBusinessArticles", updatedItem, true);
                    } catch (e) {}
                    try {
                        realm.create("InventoryMovementTracking", movementRow, true);
                    } catch (e) {}
                });

                SocketApp.emit("newItems", JSON.stringify({ phone_number: user_data.phone_number, items: [updatedItem] }));
                setEntryQty("");
                navigation.goBack();
            } catch (e) {
                if (isAxiosError(e) && e.response?.data && typeof e.response.data === "object") {
                    const d = e.response.data as { success?: string | number; error?: string };
                    if (d.error === "insufficient_store") setError(strings.error_move_exceeds_store);
                    else if (d.error === "insufficient_warehouse") setError(strings.error_move_exceeds_warehouse);
                    else if (d.error === "item_not_found") setError(strings.error_inventory_item_not_found);
                    else if (d.error === "forbidden") setError(strings.error_inventory_forbidden);
                    else if (d.error === "invalid_params") setError(strings.enter_quantity);
                    else setError(strings.connection_failed);
                } else {
                    setError(strings.connection_failed);
                }
            } finally {
                setLoading(false);
            }
        },
        [itemm, retailUnitsInvolved, useBulk, business_id, user_data.phone_number, realm, navigation]
    );

    const closeConfirmModal = useCallback(() => {
        setShowConfirmModal(false);
        dispatch(setShowModalApp(false));
    }, [dispatch]);

    const handleFinish = useCallback(() => {
        setError("");
        if (movementType === null) {
            setError(strings.renew_stock_select_operation);
            return;
        }
        if (useBulk) {
            const per = parsePositiveInt(unitsPerBulk);
            if (per < 1) {
                setError(strings.error_units_per_bulk);
                return;
            }
        }
        if (retailUnitsInvolved <= 0) {
            setError(strings.enter_quantity);
            return;
        }
        if (itemm === null) return;
        if (movementType === 3 && retailUnitsInvolved > itemm.items_number_stock) {
            setError(strings.error_move_exceeds_store);
            return;
        }
        if (movementType === 4 && retailUnitsInvolved > itemm.items_number_warehouse) {
            setError(strings.error_move_exceeds_warehouse);
            return;
        }
        setShowConfirmModal(true);
        dispatch(setShowModalApp(true));
    }, [
        movementType,
        useBulk,
        unitsPerBulk,
        retailUnitsInvolved,
        itemm,
        dispatch,
    ]);

    const handleConfirmSave = useCallback(() => {
        if (movementType === null) {
            closeConfirmModal();
            return;
        }
        closeConfirmModal();
        void applyMovement(movementType);
    }, [movementType, applyMovement, closeConfirmModal]);

    if (itemm === null) {
        return null;
    }

    const modeChip = (bulk: boolean, label: string) => {
        const selected = useBulk === bulk;
        return (
            <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                    setUseBulk(bulk);
                    setError("");
                }}
                style={{
                    flex: 1,
                    paddingVertical: 12,
                    paddingHorizontal: 10,
                    borderRadius: 8,
                    marginHorizontal: 4,
                    backgroundColor: selected ? theme.badge_background_color+60 : theme.border,
                    borderWidth: 1,
                    borderColor: selected ? theme.badge_background_color : theme.border,
                }}>
                <YambiText text={label} color={selected ? "default" : "default"} />
            </TouchableOpacity>
        );
    };

    const movementOption = (type: number, label: string) => {
        const selected = movementType === type;
        return (
            <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                    setMovementType(type);
                    setError("");
                }}
                style={{
                    paddingVertical: 14,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    marginBottom: 8,
                    backgroundColor: selected ? theme.badge_background_color+60 : theme.border,
                    borderWidth: 1,
                    borderColor: selected ? theme.badge_background_color : theme.border,
                }}>
                <YambiText text={label} color={selected ? "default" : "default"} />
            </TouchableOpacity>
        );
    };

    const desc = (itemm.description_item || "").trim();
    const descPreview = desc.length > 160 ? desc.slice(0, 160) + "…" : desc;

    return (
        <View style={{ flex: 1, backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border }}>
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingHorizontal: 15, paddingTop: 16, paddingBottom: 20 }}
                keyboardShouldPersistTaps="handled">
                <View
                    style={{
                        backgroundColor: theme.border,
                        borderRadius: 10,
                        padding: 14,
                        marginBottom: 16,
                    }}>
                    <YambiText text={strings.item_name} size="small" color="gray" style={{ marginBottom: 4 }} />
                    <YambiText text={itemm.item_name} bold numberLines={3} />
                    {descPreview.length > 0 ? (
                        <YambiText
                            text={descPreview}
                            size="small"
                            color="gray"
                            numberLines={4}
                            style={{ marginTop: 10 }}
                        />
                    ) : null}
                </View>

                <YambiText text={strings.renew_stock_description} size="small" color="gray" style={{ marginBottom: 16 }} />

                <View
                    style={{
                        flexDirection: "row",
                        marginBottom: 12,
                        justifyContent: "space-between",
                    }}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                        <YambiText text={strings.in_store} size="small" color="gray" style={{ marginBottom: 6 }} />
                        <View
                            style={{
                                backgroundColor: theme.border,
                                borderRadius: 8,
                                paddingVertical: 12,
                                paddingHorizontal: 12,
                            }}>
                            <YambiText text={String(itemm.items_number_stock)} />
                        </View>
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                        <YambiText text={strings.in_warehouse} size="small" color="gray" style={{ marginBottom: 6 }} />
                        <View
                            style={{
                                backgroundColor: theme.border,
                                borderRadius: 8,
                                paddingVertical: 12,
                                paddingHorizontal: 12,
                            }}>
                            <YambiText text={String(itemm.items_number_warehouse)} />
                        </View>
                    </View>
                </View>

                <YambiText text={strings.renew_stock_count_as} size="small" color="gray" style={{ marginBottom: 8 }} />
                <View style={{ flexDirection: "row", marginBottom: 16, marginHorizontal: -4 }}>
                    {modeChip(false, strings.detail)}
                    {modeChip(true, strings.gros)}
                </View>

                <YambiText
                    text={strings.quantity + (useBulk ? " (" + strings.gros + ")" : " (" + strings.detail + ")")}
                    size="small"
                    color="gray"
                    style={{ marginBottom: 6 }}
                />
                <TextInput
                    placeholderTextColor="gray"
                    keyboardType="numeric"
                    placeholder={strings.enter_quantity}
                    style={{
                        color: theme.text,
                        backgroundColor: theme.border,
                        paddingLeft: 15,
                        height: 45,
                        borderRadius: 8,
                        marginBottom: 12,
                        fontSize: app_description.general_font_size,
                    }}
                    value={entryQty}
                    onChangeText={(t) => {
                        setError("");
                        setEntryQty(t);
                    }}
                />

                {useBulk ? (
                    <>
                        <YambiText text={strings.wholesale_content_number} size="small" color="gray" style={{ marginBottom: 6 }} />
                        <TextInput
                            placeholderTextColor="gray"
                            keyboardType="numeric"
                            placeholder="1"
                            style={{
                                color: theme.text,
                                backgroundColor: theme.border,
                                paddingLeft: 15,
                                height: 45,
                                borderRadius: 8,
                                marginBottom: 12,
                                fontSize: app_description.general_font_size,
                            }}
                            value={unitsPerBulk}
                            onChangeText={(t) => {
                                setError("");
                                setUnitsPerBulk(t);
                            }}
                        />
                        {retailUnitsInvolved > 0 ? (
                            <YambiText
                                text={strings.renew_stock_equivalent_retail + ": " + String(retailUnitsInvolved)}
                                style={{ marginBottom: 12 }}
                            />
                        ) : null}
                    </>
                ) : null}

                {error ? <YambiText text={error} size="small" color="error" style={{ marginBottom: 12 }} /> : null}

                <YambiText text={strings.transfer_between_locations} bold style={{ marginTop: 8, marginBottom: 10 }} />
                {movementOption(3, strings.move_to_warehouse)}
                {movementOption(4, strings.move_to_store)}

                <YambiText text={strings.receive_inventory} bold style={{ marginTop: 8, marginBottom: 10 }} />
                {movementOption(1, strings.add_inventory_to_warehouse)}
                {movementOption(2, strings.add_inventory_to_store)}
            </ScrollView>

            <View
                style={{
                    borderTopWidth: 1,
                    borderColor: theme.border,
                    paddingHorizontal: 15,
                    paddingTop: 12,
                    paddingBottom: Math.max(16, insets.bottom + 10),
                    backgroundColor: theme.background,
                }}>
                <ButtonNormal
                    title={strings.finish_and_save}
                    loadEnabled={false}
                    loading={loading}
                    onPress={handleFinish}
                    styles={{ marginVertical: 0 }}
                    normal={true}
                />
            </View>

            {showConfirmModal && movementType !== null ? (
                <ModalApp
                    singleButton={false}
                    title={strings.renew_stock_confirm_title}
                    textAction={strings.confirm}
                    textCancel={strings.close}
                    onClose={closeConfirmModal}
                    onCancel={closeConfirmModal}
                    onAction={handleConfirmSave}>
                    <YambiText
                        text={strings.renew_stock_confirm_hint}
                        size="small"
                        color="gray"
                        style={{ marginBottom: 14 }}
                    />
                    <YambiText text={strings.item_name} size="small" color="gray" />
                    <YambiText text={itemm.item_name} bold style={{ marginTop: 4, marginBottom: 12 }} numberLines={4} />
                    <YambiText text={strings.renew_stock_confirm_operation} size="small" color="gray" />
                    <YambiText
                        text={movementActionLabel(movementType)}
                        style={{ marginTop: 4, marginBottom: 12 }}
                        numberLines={3}
                    />
                    <YambiText text={strings.renew_stock_confirm_retail_qty} size="small" color="gray" />
                    <YambiText text={String(retailUnitsInvolved)} bold style={{ marginTop: 4, marginBottom: 12 }} />
                    {useBulk ? (
                        <>
                            <YambiText text={strings.renew_stock_confirm_bulk_breakdown} size="small" color="gray" />
                            <YambiText
                                text={
                                    String(parsePositiveInt(entryQty)) +
                                    " × " +
                                    String(parsePositiveInt(unitsPerBulk)) +
                                    " = " +
                                    String(retailUnitsInvolved) +
                                    " (" +
                                    strings.detail +
                                    ")"
                                }
                                size="small"
                                color="gray"
                                style={{ marginTop: 4 }}
                            />
                        </>
                    ) : null}
                </ModalApp>
            ) : null}
        </View>
    );
};

export default RenewStock;
