import { View, Image, Text, Pressable } from "react-native";
import { useAppSelector } from "../../../store/app/hooks";
import { memo, useState } from 'react';
import { YambiText } from "../../app/Text";

// Category type as used by Marketplace
export type TCategory = { id: string; name: string };

// Static mapping for local assets (RN requires static requires)
const CATEGORY_IMAGES: Record<string, { 0: any; 1: any }> = {
  automotive: {
    0: require('../../../assets/marketplace_categories/automotive.jpg'),
    1: require('../../../assets/marketplace_categories/automotive_1.jpg'),
  },
  bags_luggage: {
    0: require('../../../assets/marketplace_categories/bags_luggage.jpg'),
    1: require('../../../assets/marketplace_categories/bags_luggage_1.jpg'),
  },
  // Support both keys to avoid fallback to others
  beauty_health: {
    0: require('../../../assets/marketplace_categories/beauty_health.jpg'),
    1: require('../../../assets/marketplace_categories/beauty_health_1.jpg'),
  },
//   beaty_health: {
//     0: require('../../../assets/marketplace_categories/beaty_health.jpg'),
//     1: require('../../../assets/marketplace_categories/beaty_health_1.jpg'),
//   },
  clothing_shoes: {
    0: require('../../../assets/marketplace_categories/clothing_shoes.jpg'),
    1: require('../../../assets/marketplace_categories/clothing_shoes_1.jpg'),
  },
  construction: {
    0: require('../../../assets/marketplace_categories/construction.jpg'),
    1: require('../../../assets/marketplace_categories/construction_1.jpg'),
  },
  crafts_culture: {
    0: require('../../../assets/marketplace_categories/crafts_culture.jpg'),
    1: require('../../../assets/marketplace_categories/crafts_culture_1.jpg'),
  },
  food_agro: {
    0: require('../../../assets/marketplace_categories/food_agro.jpg'),
    1: require('../../../assets/marketplace_categories/food_agro_1.jpg'),
  },
  home_appliances: {
    0: require('../../../assets/marketplace_categories/home_appliances.jpg'),
    1: require('../../../assets/marketplace_categories/home_appliances_1.jpg'),
  },
  it_electronics: {
    0: require('../../../assets/marketplace_categories/it_electronics.jpg'),
    1: require('../../../assets/marketplace_categories/it_electronics_1.jpg'),
  },
  jewelry: {
    0: require('../../../assets/marketplace_categories/jewelry.jpg'),
    1: require('../../../assets/marketplace_categories/jewelry_1.jpg'),
  },
  medical: {
    0: require('../../../assets/marketplace_categories/medical.jpg'),
    1: require('../../../assets/marketplace_categories/medical_1.jpg'),
  },
  office_supplies: {
    0: require('../../../assets/marketplace_categories/office_supplies.jpg'),
    1: require('../../../assets/marketplace_categories/office_supplies_1.jpg'),
  },
  others: {
    0: require('../../../assets/marketplace_categories/others.jpg'),
    1: require('../../../assets/marketplace_categories/others_1.jpg'),
  },
  pets: {
    0: require('../../../assets/marketplace_categories/pets.jpg'),
    1: require('../../../assets/marketplace_categories/pets_1.jpg'),
  },
  real_estate: {
    0: require('../../../assets/marketplace_categories/real_estate.jpg'),
    1: require('../../../assets/marketplace_categories/real_estate_1.jpg'),
  },
  services: {
    0: require('../../../assets/marketplace_categories/services.jpg'),
    1: require('../../../assets/marketplace_categories/services_1.jpg'),
  },
  sports_leisure: {
    0: require('../../../assets/marketplace_categories/sports_leisure.jpg'),
    1: require('../../../assets/marketplace_categories/sports_leisure_1.jpg'),
  },
  toys_kids: {
    0: require('../../../assets/marketplace_categories/toys_kids.jpg'),
    1: require('../../../assets/marketplace_categories/toys_kids_1.jpg'),
  },
  watches_bracelets: {
    0: require('../../../assets/marketplace_categories/watches_bracelets.jpg'),
    1: require('../../../assets/marketplace_categories/watches_bracelets_1.jpg'),
  },
};

const CategoryItem = ({ item,onPress }: {
  item: TCategory;
  onPress: () => void;
  onEdit: () => void;
  index: number;
}) => {
  const app_theme = useAppSelector(state => state.app_theme);

  // Choose randomly one of the two variants at mount
  const [variantIndex] = useState<0 | 1>(() => (Math.random() < 0.5 ? 0 : 1));

  // Lookup asset by id with graceful fallback
  const assets = CATEGORY_IMAGES[item.id];
  const source = assets ? assets[variantIndex] : CATEGORY_IMAGES['others'][0];

  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: app_theme.colors.background,
        borderRadius: 15,
        shadowColor: app_theme.colors.border,
        borderColor: app_theme.colors.border,
        justifyContent: 'center',
        alignItems: 'center',
        width: 70,
        marginLeft: 10,
        marginRight: 10,
      }}>
      <Image source={source} style={{ width: 70, height: 70, borderRadius: 10 }} />
      <YambiText 
        size="xsmall"
        text={item.name}
        style={{ marginTop: 6, textAlign: 'center' }}
        numberLines={2}
      />
    </Pressable>
  );
};

export default memo(CategoryItem);
