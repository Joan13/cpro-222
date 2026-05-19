import { useCallback, useEffect, useMemo, useState } from "react";
import { View, RefreshControl, StyleSheet, Platform, useWindowDimensions, TextInput, TouchableOpacity } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { FlashList } from "@shopify/flash-list";
import axios from "axios";
import { useAppDispatch, useAppSelector } from "../../store/app/hooks";
import { strings } from "../../lang/lang";
import { YambiText } from "../../components/app/Text";
import StatusBarYambi from "../../components/app/StatusBar";
import { RootStackParamList, TInventoryMovement } from "../../types/types";
import { remote_host } from "../../../GlobalVariables";
import AppActivityIndicator from "../../components/app/AppActivityIndicator";
import ModalApp from "../../components/app/ModalApp";
import { setShowModalApp } from "../../store/reducers/appSlice";
import InventoryMovementHistoryItem from "../../components/lists/business/InventoryMovementHistoryItem";
import { IconApp } from "../../components/app/IconApp";

type ScreenProps = NativeStackScreenProps<RootStackParamList, "BusinessInventoryMovementHistory">;

const filterMovements = (list: TInventoryMovement[], query: string): TInventoryMovement[] => {
    const q = query.trim().toLowerCase();
    if (q === "") {
        return list;
    }
    return list.filter((m) => {
        const name = (m.item_name || "").toLowerCase();
        const id = String(m.item_id || "").toLowerCase();
        return name.includes(q) || id.includes(q);
    });
};

const BusinessInventoryMovementHistory = ({ navigation, route }: ScreenProps) => {
    const { business_id } = route.params;
    const theme = useAppSelector((state) => state.app_theme);
    const user_data = useAppSelector((state) => state.user_data);
    const dispatch = useAppDispatch();
    const { height: windowHeight } = useWindowDimensions();

    const [movements, setMovements] = useState<TInventoryMovement[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showError, setShowError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const filteredMovements = useMemo(() => filterMovements(movements, searchQuery), [movements, searchQuery]);

    const fetchMovements = useCallback(async () => {
        try {
            setErrorMessage("");
            const res = await axios.post(remote_host + "/yambi/API/view_inventory_movement_history", {
                phone_number: user_data.phone_number,
                business_id,
            });

            if (res.data?.success === "1") {
                setMovements((res.data.movements || []) as TInventoryMovement[]);
                setShowError(false);
            } else if (res.data?.error === "forbidden") {
                setErrorMessage(strings.error_inventory_forbidden);
                setShowError(true);
                dispatch(setShowModalApp(true));
            } else {
                setErrorMessage(strings.connection_failed);
                setShowError(true);
                dispatch(setShowModalApp(true));
            }
        } catch (e) {
            setErrorMessage(strings.connection_failed);
            setShowError(true);
            dispatch(setShowModalApp(true));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [business_id, user_data.phone_number, dispatch]);

    useEffect(() => {
        setLoading(true);
        fetchMovements();
    }, [fetchMovements]);

    useEffect(() => {
        if (movements.length === 0) {
            setSearchQuery("");
        }
    }, [movements.length]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchMovements();
    }, [fetchMovements]);

    const fixedSearchBar =
        movements.length > 0 ? (
            <View
                style={{
                    paddingHorizontal: 16,
                    paddingTop: 8,
                    paddingBottom: 12,
                    backgroundColor: theme.colors.background,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.border
                }}
            >
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: theme.colors.border,
                        borderRadius: 12,
                        paddingHorizontal: 14,
                    }}
                >
                    <IconApp pack="FI" name="search" color={theme.colors.gray} size={18} />
                    <TextInput
                        placeholderTextColor={theme.colors.gray}
                        style={{
                            color: theme.colors.text,
                            paddingLeft: 10,
                            paddingRight: 10,
                            minHeight: 44,
                            flex: 1,
                            fontSize: 15,
                        }}
                        value={searchQuery}
                        placeholder={strings.search_item}
                        onChangeText={setSearchQuery}
                        autoCorrect={false}
                        autoCapitalize="none"
                        clearButtonMode="never"
                    />
                    {searchQuery !== "" ? (
                        <TouchableOpacity
                            onPress={() => setSearchQuery("")}
                            style={{
                                height: 36,
                                width: 36,
                                justifyContent: "center",
                                alignItems: "center",
                            }}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <IconApp pack="FI" name="x" size={18} color={theme.colors.gray} />
                        </TouchableOpacity>
                    ) : null}
                </View>
            </View>
        ) : null;

    const emptyNoData = (
        <View
            style={{
                minHeight: Math.max(280, windowHeight * 0.45),
                paddingHorizontal: 28,
                paddingVertical: 32,
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            <View
                style={{
                    backgroundColor: theme.colors.border + "55",
                    borderRadius: 16,
                    paddingVertical: 36,
                    paddingHorizontal: 24,
                    alignItems: "center",
                    width: "100%",
                    maxWidth: 400,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                }}
            >
                <View
                    style={{
                        width: 88,
                        height: 88,
                        borderRadius: 44,
                        backgroundColor: theme.colors.high_color + "18",
                        justifyContent: "center",
                        alignItems: "center",
                        marginBottom: 20,
                    }}
                >
                    <IconApp pack="FI" name="package" size={40} color={theme.colors.high_color} />
                </View>
                <YambiText
                    text={strings.no_inventory_movements}
                    size="big"
                    color="default"
                    bold
                    style={{ textAlign: "center", marginBottom: 12 }}
                />
                <YambiText
                    text={strings.no_inventory_movements_hint}
                    size="normal"
                    color="gray"
                    style={{ textAlign: "center", lineHeight: 22 }}
                />
            </View>
        </View>
    );

    const emptyFilterNoMatch = (
        <View
            style={{
                minHeight: 220,
                paddingHorizontal: 20,
                paddingVertical: 32,
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            <IconApp pack="FI" name="search" size={36} color={theme.colors.gray} styles={{ marginBottom: 16 }} />
            <YambiText
                text={strings.inventory_movement_filter_no_results}
                size="normal"
                color="gray"
                style={{ textAlign: "center", lineHeight: 22 }}
            />
        </View>
    );

    const listIsEmpty = filteredMovements.length === 0;
    const hasNoServerData = movements.length === 0;
    const showFilterEmpty = !hasNoServerData && listIsEmpty && searchQuery.trim() !== "";

    return (
        <View
            style={[
                { backgroundColor: theme.colors.background, flex: 1, borderColor: theme.colors.border, borderTopWidth: 1 },
                StyleSheet.absoluteFill,
            ]}
        >
            {showError ? (
                <ModalApp
                    onClose={() => {
                        dispatch(setShowModalApp(false));
                        setShowError(false);
                    }}
                    singleButton
                    title={strings.error}
                >
                    <YambiText text={errorMessage || strings.connection_failed} size="normal" color="gray" />
                </ModalApp>
            ) : null}

            <StatusBarYambi />

            {loading ? (
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                    <AppActivityIndicator />
                </View>
            ) : (
                <View style={{ flex: 1 }}>
                    {fixedSearchBar}
                    <FlashList
                        data={filteredMovements}
                        keyExtractor={(item) => item._id}
                        estimatedItemSize={96}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                tintColor={theme.colors.high_color}
                                colors={Platform.OS === "android" ? [theme.colors.high_color] : undefined}
                            />
                        }
                        ListEmptyComponent={
                            hasNoServerData ? emptyNoData : showFilterEmpty ? emptyFilterNoMatch : null
                        }
                        contentContainerStyle={{
                            paddingHorizontal: 16,
                            paddingBottom: 24,
                        }}
                        renderItem={({ item }) => (
                            <InventoryMovementHistoryItem
                                movement={item}
                                onPress={() => navigation.navigate("InventoryMovement", { movement: item })}
                            />
                        )}
                    />
                </View>
            )}
        </View>
    );
};

export default BusinessInventoryMovementHistory;
