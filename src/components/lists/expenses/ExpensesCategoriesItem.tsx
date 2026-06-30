import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { useAppSelector } from '../../../store/app/hooks';
import { strings } from '../../../lang/lang';
import { IconApp } from '../../app/IconApp';
import { YambiText } from '../../app/Text';
import { renderCurrency } from '../../../../GlobalVariables';
import { formatAmount } from '../../../util/formatAmount';
import { Expenses } from '../../../store/database/Models';
import { NavProps } from '../../../types/types';

interface ExpensesCategoriesItemProps {
    item: {
        id: number;
        name: string;
        items: string;
    };
    expenses: Expenses[];
    navigation: NavProps['navigation'];
    flag?: number;
    business_id?: string;
    sales_point_id?: string;
}

const ExpensesCategoriesItem = ({ item, expenses, navigation, flag, business_id, sales_point_id }: ExpensesCategoriesItemProps) => {
    const theme = useAppSelector(state => state.app_theme.colors);

    // Get category icon
    const getCategoryIcon = (categoryId: number) => {
        const icons: { [key: number]: string } = {
            1: "home",
            2: "shopping-bag",
            3: "truck",
            4: "heart",
            5: "book",
            6: "user",
            7: "coffee",
            8: "shopping-cart",
            9: "briefcase",
            10: "credit-card",
            11: "shield",
            12: "heart",
            13: "gift"
        };
        return icons[categoryId] || "dollar-sign";
    };

    // Get category color
    const getCategoryColor = (categoryId: number) => {
        const colors: { [key: number]: string } = {
            1: "#4A90E2", // Blue for Housing
            2: "#50C878", // Green for Food
            3: "#FF6B6B", // Red for Transportation
            4: "#FF8C42", // Orange for Health
            5: "#9B59B6", // Purple for Education
            6: "#E91E63", // Pink for Personal
            7: "#00BCD4", // Cyan for Leisure
            8: "#FFC107", // Amber for Shopping
            9: "#607D8B", // Blue Grey for Work
            10: "#795548", // Brown for Finance
            11: "#3F51B5", // Indigo for Insurance
            12: "#FF9800", // Deep Orange for Pets
            13: "#4CAF50"  // Green for Donations
        };
        return colors[categoryId] || theme.high_color;
    };

    // Memoize filtered expenses and currency stats for performance
    const { categoryExpenses, currencyStats, hasExpenses } = useMemo(() => {
        const filtered = expenses.filter(exp => exp.category === item.id && exp.expense_active === 1);
        
        // Calculate amounts by currency
        const stats: { [key: number]: number } = {};
        filtered.forEach(exp => {
            const currency = exp.currency;
            if (!stats[currency]) {
                stats[currency] = 0;
            }
            stats[currency] += parseFloat(exp.amount || "0");
        });
        
        return {
            categoryExpenses: filtered,
            currencyStats: stats,
            hasExpenses: filtered.length > 0
        };
    }, [expenses, item.id]);

    const categoryColor = getCategoryColor(item.id);
    const categoryIcon = getCategoryIcon(item.id);

    return (
        <Pressable
            onPress={() => {
                if (hasExpenses) {
                    navigation.navigate('CategoryExpenses', { category_id: item.id, flag: flag, business_id: business_id, sales_point_id: sales_point_id });
                } else {
                    navigation.navigate('AddExpense', { category_id: item.id, business_id: business_id, sales_point_id: sales_point_id });
                }
            }}
            style={{
                backgroundColor: theme.background,
                borderRadius: 12,
                padding: 15,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: theme.border
            }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', flex: 1, alignItems: 'center' }}>
                    <View style={{
                        backgroundColor: categoryColor + "20",
                        borderRadius: 10,
                        width: 50,
                        height: 50,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 12
                    }}>
                        <IconApp pack="FI" name={categoryIcon} size={24} color={categoryColor} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <YambiText text={item.name} size="normal" color="high" style={{ marginBottom: 4, fontWeight: '600' }} />
                        <YambiText text={item.items} size="small" color="gray" style={{ marginBottom: 8 }} />
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <IconApp pack="FI" name="file-text" size={14} color={theme.gray} styles={{ marginRight: 6 }} />
                            <YambiText text={`${categoryExpenses.length} ${strings.expenses || 'expenses'}`} size="small" color="gray" />
                        </View>
                    </View>
                </View>
                {Object.keys(currencyStats).length > 0 && (
                    <View style={{ alignItems: 'flex-end', marginLeft: 10 }}>
                        {Object.entries(currencyStats).map(([currency, amount]) => (
                            <YambiText 
                                key={currency}
                                text={formatAmount(amount) + " " + renderCurrency(parseInt(currency), false)} 
                                size="small" 
                                color="high" 
                                style={{ fontWeight: '600', marginBottom: Object.keys(currencyStats).length > 1 ? 2 : 0 }} 
                            />
                        ))}
                    </View>
                )}
            </View>
        </Pressable>
    );
};

export default ExpensesCategoriesItem;
