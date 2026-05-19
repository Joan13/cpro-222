import { View, TouchableOpacity } from "react-native"
import { useAppDispatch, useAppSelector } from "../../store/app/hooks";
import { NavProps } from "../../types/types";
import { IconApp } from "../app/IconApp";
import { useEffect } from "react";
import { strings } from "../../lang/lang";

const HeaderCategoryItems = ({ navigation, route }: NavProps) => {

    const theme = useAppSelector(state => state.app_theme);
    const category = useAppSelector(state => state.app.category);
    const dispatch = useAppDispatch();

    const show_category = (category: string) => {
        if (category === null || category === undefined || category === "") return;

        const index = strings.items_categories[category];

        if (index === undefined) return"";
        return index.name
    }

    const findSubcategory = (subcategoryKey: string) => {
        for (const categoryKey in strings.items_categories) {
            const category = strings.items_categories[categoryKey];

            if (category.subcategories && category.subcategories[subcategoryKey]) {
                return {
                    categoryId: category.id,
                    categoryName: category.name,
                    subcategoryKey: subcategoryKey,
                    subcategoryName: category.subcategories[subcategoryKey]
                };
            }
        }

        return "";
    }

    useEffect(() => {
        navigation.setOptions({
            title: show_category(category) || (findSubcategory(category) as any)?.subcategoryName
        })
    }, [category]);

    return null
}

export default HeaderCategoryItems;

