import { ScrollView, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useObject } from "@realm/react";
import { useAppSelector } from "../../store/app/hooks";
import { strings } from "../../lang/lang";
import { TextNormalYambi, TextSmallYambiGray } from "../../components/app/Text";
import StatusBarYambi from "../../components/app/StatusBar";
import { RootStackParamList, TUser } from "../../types/types";
import { getDateFormat, getHourFormat, formatPhoneInternational } from "../../../GlobalVariables";
import { UserBusinessArticles, UserBusinesses, UserContacts } from "../../store/database/Models";
import { formatInventoryMovementQuantityText } from "../../util/inventoryMovementQuantityText";

type Props = NativeStackScreenProps<RootStackParamList, "InventoryMovement">;

const stubUserForPhone = (phone: string): TUser => ({
    user_id: phone,
    user_names: phone,
    phone_number: phone,
    gender: 0,
    birth_date: "",
    country: "",
    user_profile: "",
    profession: "",
    bio: "",
    user_email: "",
    user_address: "",
    status_information: "",
    user_password: "",
    account_privacy: 0,
    user_level: 0,
    user_active: 1,
    user_verified: 0,
    user_verified_at: "",
    notification_token: "",
    createdAt: "",
    updatedAt: "",
});

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
            return String(type);
    }
};

const Row = ({ label, value }: { label: string; value: string }) => {
    const theme = useAppSelector((s) => s.app_theme);
    return (
        <View
            style={{
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.border,
            }}
        >
            <TextSmallYambiGray text={label} styles={{ marginBottom: 6 }} />
            <TextNormalYambi text={value} />
        </View>
    );
};

const QuantityRow = ({
    wholesalePerLot,
    quantityRetail,
}: {
    wholesalePerLot: number | undefined;
    quantityRetail: number | null | undefined;
}) => {
    const theme = useAppSelector((s) => s.app_theme);
    const main = formatInventoryMovementQuantityText(quantityRetail, wholesalePerLot);
    const qNum = quantityRetail != null && !Number.isNaN(Number(quantityRetail)) ? Math.floor(Number(quantityRetail)) : null;
    const showEquivalent =
        qNum != null &&
        qNum > 0 &&
        wholesalePerLot != null &&
        Number.isFinite(Number(wholesalePerLot)) &&
        Number(wholesalePerLot) >= 2;

    return (
        <View
            style={{
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.border,
            }}
        >
            <TextSmallYambiGray text={strings.quantity} styles={{ marginBottom: 6 }} />
            <TextNormalYambi text={main} />
            {showEquivalent ? (
                <TextSmallYambiGray
                    text={`${strings.renew_stock_equivalent_retail}: ${qNum}`}
                    styles={{ marginTop: 8, lineHeight: 18 }}
                />
            ) : null}
        </View>
    );
};

const UserRow = ({ phone }: { phone: string }) => {
    const theme = useAppSelector((s) => s.app_theme);
    const contacts = useAppSelector((s) => s.app.raw_contacts);
    const user_data = useAppSelector((s) => s.user_data);
    const yambiUser = useObject(UserContacts, phone);

    const phoneFormatted = formatPhoneInternational(stubUserForPhone(phone));

    let secondLine: string | null = null;
    if (phone === user_data.phone_number) {
        secondLine = `(${strings.you})`;
    } else {
        const contact = contacts.find((c) => c.phoneNumber === phone);
        if (contact !== undefined) {
            secondLine = contact.displayName;
        } else if (yambiUser !== null && yambiUser.user_names !== yambiUser.phone_number) {
            secondLine = yambiUser.user_names;
        }
    }

    return (
        <View
            style={{
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.border,
            }}
        >
            <TextSmallYambiGray text={strings.user} styles={{ marginBottom: 6 }} />
            <TextNormalYambi text={phoneFormatted} />
            {secondLine != null && secondLine !== "" ? (
                <TextNormalYambi text={secondLine} styles={{ marginTop: 6 }} />
            ) : null}
        </View>
    );
};

const InventoryMovement = ({ route }: Props) => {
    const { movement } = route.params;
    const theme = useAppSelector((s) => s.app_theme);
    const lang = useAppSelector((s) => s.persisted_app.langApp);
    const business = useObject(UserBusinesses, movement.business_id);
    const item = useObject(UserBusinessArticles, movement.item_id);

    const created = movement.createdAt;
    const createdStr =
        created != null && created !== ""
            ? `${getDateFormat(created, lang)} · ${getHourFormat(created, lang, 1)}`
            : "—";

    const wholesalePerLot = item != null ? item.wholesale_content_number : undefined;

    const businessName =
        business != null && business.business_name?.trim() !== "" ? business.business_name : "—";

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.border }}>
            <StatusBarYambi />
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
                keyboardShouldPersistTaps="handled"
            >
                <Row label={strings.business_name} value={businessName} />
                <Row label={strings.item_name} value={movement.item_name?.trim() ? movement.item_name : "—"} />
                <Row label={strings.renew_stock_confirm_operation} value={movementTypeLabel(movement.movement_type)} />
                <QuantityRow wholesalePerLot={wholesalePerLot} quantityRetail={movement.quantity} />
                <Row label={strings.qty_after_store} value={String(movement.quantity_stock)} />
                <Row label={strings.qty_after_warehouse} value={String(movement.quantity_warehouse)} />
                <Row label={strings.description} value={movement.description?.trim() !== "" ? movement.description : "—"} />
                {movement.phone_number ? <UserRow phone={movement.phone_number} /> : <Row label={strings.user} value="—" />}
                <Row label={strings.inventory_movement_date} value={createdStr} />
            </ScrollView>
        </View>
    );
};

export default InventoryMovement;
