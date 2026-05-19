import { View, ScrollView } from "react-native";
import { useAppSelector } from "../../store/app/hooks";
import { strings } from "../../lang/lang";
import { IconApp } from "../../components/app/IconApp";
import { YambiText } from "../../components/app/Text";
import { renderCurrency, renderDateTime } from "../../../GlobalVariables";
import { formatAmount } from "../../util/formatAmount";
import { NavProps } from "../../types/types";
import { useObject, useQuery } from "@realm/react";
import { Expenses, UserBusinesses, UserSellsPoints } from "../../store/database/Models";
import moment from "moment";

const Expense = ({ route, navigation }: NavProps) => {
    const { expense_id } = route.params;
    const theme = useAppSelector(state => state.app_theme.colors);
    const expenses_categories = strings.expenses_categories || [];
    
    const expense = useObject(Expenses, expense_id);
    
    if (expense === null) return null;
    
    const category = expenses_categories.find(c => c.id === expense.category);
    
    // Get business and sales point info if linked
    const businessQuery = useQuery(
        UserBusinesses, businesses => {
            if (expense.business_id && expense.business_id !== "") {
                return businesses.filtered('_id == $0', expense.business_id);
            }
            return businesses.filtered('_id == $0', 'impossible_id_that_will_never_match');
        }, [expense.business_id]);
    const business = businessQuery.length > 0 ? businessQuery[0] : null;

    const salesPointQuery = useQuery(
        UserSellsPoints, points => {
            if (expense.sales_point_id && expense.sales_point_id !== "") {
                return points.filtered('_id == $0', expense.sales_point_id);
            }
            return points.filtered('_id == $0', 'impossible_id_that_will_never_match');
        }, [expense.sales_point_id]);
    const salesPoint = salesPointQuery.length > 0 ? salesPointQuery[0] : null;
    
    const hasBusiness = business !== null;
    const hasSalesPoint = salesPoint !== null;

    const getCategoryIcon = (categoryId: number) => {
        const icons: { [key: number]: string } = {
            1: "home", 2: "shopping-bag", 3: "truck", 4: "heart", 5: "book",
            6: "user", 7: "coffee", 8: "shopping-cart", 9: "briefcase",
            10: "credit-card", 11: "shield", 12: "heart", 13: "gift"
        };
        return icons[categoryId] || "dollar-sign";
    };

    const getCategoryColor = (categoryId: number) => {
        const colors: { [key: number]: string } = {
            1: "#4A90E2", 2: "#50C878", 3: "#FF6B6B", 4: "#FF8C42", 5: "#9B59B6",
            6: "#E91E63", 7: "#00BCD4", 8: "#FFC107", 9: "#607D8B",
            10: "#795548", 11: "#3F51B5", 12: "#FF9800", 13: "#4CAF50"
        };
        return colors[categoryId] || theme.high_color;
    };

    const categoryColor = getCategoryColor(expense.category);
    const categoryIcon = getCategoryIcon(expense.category);

    return (
        <View style={{
            backgroundColor: theme.background,
            flex: 1,
            borderColor: theme.border,
            borderTopWidth: 1
        }}>
            <ScrollView style={{ flex: 1 }}>
                <View style={{ paddingHorizontal: 15, paddingTop: 15, paddingBottom:15 }}>
                    {/* Main Expense Card */}
                    <View style={{
                        backgroundColor: theme.background,
                        borderRadius: 20,
                        padding: 15,
                        marginBottom: 20,
                        borderWidth: 1,
                        borderColor: theme.border,
                        // shadowColor: theme.high_color,
                        // shadowOffset: { width: 0, height: 4 },
                        // shadowOpacity: 0.1,
                        // shadowRadius: 8,
                        // elevation: 4,
                    }}>
                        {/* Category Icon */}
                        <View style={{
                            alignSelf: 'center',
                            backgroundColor: categoryColor + "20",
                            borderRadius: 50,
                            width: 80,
                            height: 80,
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginBottom: 20
                        }}>
                            <IconApp pack="FI" name={categoryIcon} size={40} color={categoryColor} />
                        </View>

                        {/* Title */}
                        <YambiText
                            text={expense.title}
                            size="big"
                            color="high"
                            style={{ 
                                textAlign: 'center', 
                                fontWeight: '700', 
                                fontSize: 24, 
                                marginBottom: 10 
                            }}
                        />

                        {/* Amount */}
                        <View style={{ alignItems: 'center', marginBottom: 20 }}>
                            <YambiText
                                text={formatAmount(expense.amount) + " " + renderCurrency(expense.currency, false)}
                                size="big"
                                color="high"
                                style={{ 
                                    fontWeight: '700', 
                                    fontSize: 32 
                                }}
                            />
                        </View>

                        {/* Category */}
                        {category && (
                            <View style={{
                                backgroundColor: theme.background,
                                borderRadius: 12,
                                padding: 15,
                                marginBottom: 15,
                                borderWidth: 1,
                                borderColor: theme.border
                            }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <IconApp pack="FI" name="tag" size={18} color={categoryColor} styles={{ marginRight: 10 }} />
                                    <YambiText
                                        text={category.name}
                                        size="normal"
                                        color="high"
                                        style={{ fontWeight: '600' }}
                                    />
                                </View>
                            </View>
                        )}

                        {/* Payment Type */}
                        <View style={{
                            backgroundColor: theme.background,
                            borderRadius: 12,
                            padding: 15,
                            marginBottom: 15,
                            borderWidth: 1,
                            borderColor: theme.border
                        }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <IconApp 
                                        pack="FI" 
                                        name={
                                            expense.payment_type === 0 ? "x-circle" :
                                            expense.payment_type === 1 ? "dollar-sign" :
                                            expense.payment_type === 2 ? "credit-card" :
                                            "bank"
                                        } 
                                        size={18} 
                                        color={theme.high_color} 
                                        styles={{ marginRight: 10 }} 
                                    />
                                    <YambiText
                                        text={strings.payment_type || "Payment Type"}
                                        size="normal"
                                        color="gray"
                                    />
                                </View>
                                <YambiText
                                    text={
                                        expense.payment_type === 0 ? (strings as any).not_paid || "Not Paid" :
                                        expense.payment_type === 1 ? strings.cash || "Cash" :
                                        expense.payment_type === 2 ? strings.card || "Card" :
                                        strings.bank_transfer || "Bank Transfer"
                                    }
                                    size="normal"
                                    color="high"
                                    style={{ fontWeight: '600' }}
                                />
                            </View>
                        </View>

                        {/* Wallet */}
                        <View style={{
                            backgroundColor: theme.background,
                            borderRadius: 12,
                            padding: 15,
                            marginBottom: 15,
                            borderWidth: 1,
                            borderColor: theme.border
                        }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <IconApp pack="MC" name="wallet-outline" size={18} color={theme.high_color} styles={{ marginRight: 10 }} />
                                    <YambiText
                                        text={strings.wallet || "Wallet"}
                                        size="normal"
                                        color="gray"
                                        numberLines={1}
                                    />
                                </View>
                                <YambiText
                                    text={strings.wallet + " " + expense.wallet + (expense.wallet === 1 ? " (" + strings.primary + ")" : "")}
                                    size="normal"
                                    color="high"
                                    style={{ fontWeight: '600' }}
                                />
                            </View>
                        </View>

                        {/* Debt Badge */}
                        {expense.debt === 1 && (
                            <View style={{
                                backgroundColor: theme.error + "20",
                                borderRadius: 12,
                                padding: 15,
                                marginBottom: 15,
                                borderWidth: 1,
                                borderColor: theme.error + "40",
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <IconApp pack="FI" name="alert-circle" size={18} color={theme.error} styles={{ marginRight: 10 }} />
                                <YambiText
                                    text={strings.debt || "Debt"}
                                    size="normal"
                                    color="error"
                                    style={{ fontWeight: '600' }}
                                />
                            </View>
                        )}

                        {/* Business/Sales Point */}
                        {hasSalesPoint && (
                            <View style={{
                                backgroundColor: theme.background,
                                borderRadius: 12,
                                padding: 15,
                                marginBottom: 15,
                                borderWidth: 1,
                                borderColor: theme.border
                            }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                    <IconApp pack="FI" name="map-pin" size={18} color={theme.high_color} styles={{ marginRight: 10 }} />
                                    <YambiText
                                        text={strings.sales_point || "Sales Point"}
                                        size="normal"
                                        color="gray"
                                    />
                                </View>
                                <YambiText
                                    text={salesPoint!.sells_point_name}
                                    size="normal"
                                    color="high"
                                    style={{ marginLeft: 28, fontWeight: '600' }}
                                />
                            </View>
                        )}
                        {hasBusiness && !hasSalesPoint && (
                            <View style={{
                                backgroundColor: theme.background,
                                borderRadius: 12,
                                padding: 15,
                                marginBottom: 15,
                                borderWidth: 1,
                                borderColor: theme.border
                            }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                    <IconApp pack="FI" name="briefcase" size={18} color={theme.high_color} styles={{ marginRight: 10 }} />
                                    <YambiText
                                        text={strings.business || "Business"}
                                        size="normal"
                                        color="gray"
                                    />
                                </View>
                                <YambiText
                                    text={business!.business_name}
                                    size="normal"
                                    color="high"
                                    style={{ marginLeft: 28, fontWeight: '600' }}
                                />
                            </View>
                        )}

                        {/* Description */}
                        {expense.description !== "" && (
                            <View style={{
                                backgroundColor: theme.background,
                                borderRadius: 12,
                                padding: 15,
                                marginBottom: 15,
                                borderWidth: 1,
                                borderColor: theme.border
                            }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                                    <IconApp pack="FI" name="file-text" size={18} color={theme.high_color} styles={{ marginRight: 10 }} />
                                    <YambiText
                                        text={strings.description || "Description"}
                                        size="normal"
                                        color="gray"
                                    />
                                </View>
                                <YambiText
                                    text={expense.description}
                                    size="normal"
                                    color="default"
                                    style={{ marginLeft: 28, lineHeight: 22 }}
                                />
                            </View>
                        )}

                        {/* Date Info */}
                        <View style={{
                            backgroundColor: theme.background,
                            borderRadius: 12,
                            padding: 15,
                            marginBottom: 15,
                            borderWidth: 1,
                            borderColor: theme.border
                        }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <IconApp pack="FI" name="calendar" size={18} color={theme.high_color} styles={{ marginRight: 10 }} />
                                    <YambiText
                                        text={renderDateTime(expense.createdAt, 0, false, false)}
                                        size="normal"
                                        color="gray"
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Time Info */}
                        <View style={{
                            backgroundColor: theme.background,
                            borderRadius: 12,
                            padding: 15,
                            borderWidth: 1,
                            borderColor: theme.border
                        }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <IconApp pack="FI" name="clock" size={18} color={theme.high_color} styles={{ marginRight: 10 }} />
                                    <YambiText
                                        text={strings.time || "Time"}
                                        size="normal"
                                        color="gray"
                                    />
                                </View>
                                <YambiText
                                    text={moment(expense.createdAt).format("LT")}
                                    size="normal"
                                    color="high"
                                    style={{ fontWeight: '600' }}
                                />
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

export default Expense;
