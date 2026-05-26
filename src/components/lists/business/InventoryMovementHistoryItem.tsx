import { Pressable, View } from "react-native";
import { useObject } from "@realm/react";
import { useAppSelector } from "../../../store/app/hooks";
import { TextNormalYambi, TextSmallYambiGray } from "../../app/Text";
import { IconApp } from "../../app/IconApp";
import { strings } from "../../../lang/lang";
import { TInventoryMovement } from "../../../types/types";
import { getDateFormat, getHourFormat } from "../../../../GlobalVariables";
import { UserBusinessArticles } from "../../../store/database/Models";
import { formatInventoryMovementQuantityText } from "../../../util/inventoryMovementQuantityText";
import { memo } from "react";

const movementTypeLabel = (type: number): string => {
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

type Props = {
    movement: TInventoryMovement;
    onPress: () => void;
};

const InventoryMovementHistoryItem = ({ movement, onPress }: Props) => {
    const app_theme = useAppSelector((s) => s.app_theme);
    const lang = useAppSelector((s) => s.persisted_app.langApp);
    const item = useObject(UserBusinessArticles, movement.item_id);

    const title = movement.item_name?.trim() || movement.item_id;
    const when = movement.createdAt || movement.updatedAt;
    const dateLine =
        when != null && when !== ""
            ? `${getDateFormat(when, lang)} · ${getHourFormat(when, lang, 1)}`
            : "";

    const wholesalePerLot = item != null ? item.wholesale_content_number : undefined;
    const qtyInsight = formatInventoryMovementQuantityText(movement.quantity, wholesalePerLot);

    return (
        <Pressable
            onPress={onPress}
            style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 14,
                paddingHorizontal: 4,
                borderBottomWidth: 1,
                borderBottomColor: app_theme.colors.border,
            }}
        >
            <View
                style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: app_theme.colors.high_color + "18",
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: 12,
                }}
            >
                <IconApp pack="FI" name="package" size={22} color={app_theme.colors.high_color} />
            </View>
            <View style={{ flex: 1, marginRight: 8 }}>
                <TextNormalYambi text={title} bold styles={{ marginBottom: 4 }} numberLines={2} />
                <TextSmallYambiGray text={movementTypeLabel(movement.movement_type)} styles={{ marginBottom: 2 }} />
                {qtyInsight !== "" && qtyInsight !== "—" ? (
                    <TextSmallYambiGray text={qtyInsight} styles={{ marginBottom: 2 }} numberLines={2} />
                ) : null}
                {dateLine !== "" ? <TextSmallYambiGray text={dateLine} /> : null}
            </View>
            <IconApp pack="FI" name="chevron-right" size={20} color={app_theme.colors.gray} />
        </Pressable>
    );
};

export default memo(InventoryMovementHistoryItem);
