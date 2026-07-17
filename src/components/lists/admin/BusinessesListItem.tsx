import { Pressable, View } from "react-native";
import { TBusiness } from "../../../types/types";
import { useAppSelector } from "../../../store/app/hooks";
import { TextNormalYambi, TextNormalYambiGray, TextNormalYambiHighColor, TextSmallYambiGray } from "../../app/Text";
import { IconApp } from "../../app/IconApp";
import { renderDateTime } from "../../../../GlobalVariables";
import { strings } from "../../../lang/lang";

interface BusinessesListItemProps {
    item: TBusiness;
    onPress: () => void;
    onEditPress: () => void;
}

export default function BusinessesListItem({ item, onPress, onEditPress }: BusinessesListItemProps) {
    const app_theme = useAppSelector(state => state.app_theme);

    const formattedCreatedAt = item.createdAt ? renderDateTime(item.createdAt, 3, true) : 'N/A';

    return (
        <Pressable
            onPress={onPress}
            style={{
                backgroundColor: app_theme.colors.border + '15',
                borderRadius: 16,
                padding: 16,
                marginVertical: 8,
                borderWidth: 1,
                borderColor: app_theme.colors.border,
            }}
        >
            <View style={{ flex: 1 }}>
                {/* Title and Edit Button */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <TextNormalYambi text={item.business_name} bold styles={{ flex: 1, fontSize: 16 }} />
                    <Pressable 
                        onPress={onEditPress}
                        style={{ flexDirection: 'row', alignItems: 'center', padding: 6, backgroundColor: app_theme.colors.high_color + '15', borderRadius: 8 }}
                    >
                        <IconApp pack='FI' name='edit' size={14} color={app_theme.colors.high_color} styles={{ marginRight: 4 }} />
                        <TextNormalYambiHighColor styles={{ fontSize: 12 }} text={strings.edit} />
                    </Pressable>
                </View>

                {/* ID */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <TextSmallYambiGray text="ID: " styles={{ fontSize: 13 }} />
                    <TextSmallYambiGray text={item._id} bold styles={{ flex: 1, fontSize: 13 }} />
                </View>

                {/* Creator Phone Number */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <TextSmallYambiGray text="Creator: " styles={{ fontSize: 13 }} />
                    <TextNormalYambi text={item.phone_number} styles={{ fontSize: 13, fontWeight: '500' }} />
                </View>

                {/* Date of Creation */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <TextSmallYambiGray text="Created: " styles={{ fontSize: 13 }} />
                    <TextSmallYambiGray text={formattedCreatedAt} styles={{ fontSize: 13 }} />
                </View>

                {/* Description */}
                {item.description_service ? (
                    <View style={{ borderTopWidth: 1, borderTopColor: app_theme.colors.border, paddingTop: 8, marginTop: 4 }}>
                        <TextNormalYambiGray text={item.description_service} numberLines={3} styles={{ fontSize: 13, lineHeight: 18 }} />
                    </View>
                ) : null}
            </View>
        </Pressable>
    );
}
