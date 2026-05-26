import { Pressable } from "react-native";
import { useAppSelector } from "../../../store/app/hooks";
import { memo } from 'react';
import { YambiText } from "../../app/Text";

// Subcategory type as used by Marketplace
export type TSubcategory = { id: string; name: string };

const SubcategoryItem = ({ item, onPress }: {
  item: TSubcategory;
  onPress: () => void;
  onEdit?: () => void;
  index?: number;
}) => {
  const app_theme = useAppSelector(state => state.app_theme);

  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginRight: 8,
        marginBottom: 8,
        borderRadius: 8,
        backgroundColor: app_theme.colors.high_color + "20",
        borderWidth: 1,
        borderColor: app_theme.colors.high_color + "40",
      }}
    >
      <YambiText size="small" color="high" text={item.name} />
    </Pressable>
  );
};
export default memo(SubcategoryItem);
