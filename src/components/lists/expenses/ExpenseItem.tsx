import { TouchableOpacity, View } from "react-native";
import { useAppSelector } from "../../../store/app/hooks";
import { strings } from "../../../lang/lang";
import { IconApp } from "../../app/IconApp";
import { YambiText } from "../../app/Text";
import { renderCurrency, renderDateTime } from "../../../../GlobalVariables";
import { Expenses, UserBusinesses, UserSellsPoints } from "../../../store/database/Models";
import { useQuery } from "@realm/react";
import { formatAmount } from "../../../util/formatAmount";

const ExpenseItem = ({ item, index, onPress }: { item: Expenses, index: number, onPress: () => void }) => {
    const theme = useAppSelector(state => state.app_theme.colors);
    const expenses_categories = strings.expenses_categories || [];
    const category = expenses_categories.find(c => c.id === item.category);

    // Get business and sales point info if linked
    const businessQuery = useQuery(
        UserBusinesses, businesses => {
            if (item.business_id && item.business_id !== "") {
                return businesses.filtered('_id == $0', item.business_id);
            }
            return businesses.filtered('_id == $0', 'impossible_id_that_will_never_match');
        }, [item.business_id]);
    const business = businessQuery.length > 0 ? businessQuery[0] : null;

    const salesPointQuery = useQuery(
        UserSellsPoints, points => {
            if (item.sales_point_id && item.sales_point_id !== "") {
                return points.filtered('_id == $0', item.sales_point_id);
            }
            return points.filtered('_id == $0', 'impossible_id_that_will_never_match');
        }, [item.sales_point_id]);
    const salesPoint = salesPointQuery.length > 0 ? salesPointQuery[0] : null;
    
    // Safe check for valid objects
    const hasBusiness = business !== null;
    const hasSalesPoint = salesPoint !== null;

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

    // Determine color scheme based on category for consistent color per category
    // Use category ID to ensure same category always has same colors
    const colorScheme = (item.category || index) % 3;
    const primaryColor = colorScheme === 0 ? theme.high_color : colorScheme === 1 ? theme.high_color2 : theme.high_color3;
    const secondaryColor = colorScheme === 0 ? theme.high_color2 : colorScheme === 1 ? theme.high_color3 : theme.high_color;
    const tertiaryColor = colorScheme === 0 ? theme.high_color3 : colorScheme === 1 ? theme.high_color : theme.high_color2;
    
    const primaryColorText = colorScheme === 0 ? "high" : colorScheme === 1 ? "high2" : "high3";
    const secondaryColorText = colorScheme === 0 ? "high2" : colorScheme === 1 ? "high3" : "high";
    const tertiaryColorText = colorScheme === 0 ? "high3" : colorScheme === 1 ? "high" : "high2";

    return (
        <TouchableOpacity
            onPress={onPress}
            style={{
                backgroundColor: theme.background,
                borderRadius: 12,
                padding: 12,
                marginBottom: 8,
                borderWidth: 1,
                borderColor: theme.border,
                // borderLeftColor: primaryColor,
                // shadowColor: primaryColor,
                // shadowOffset: { width: 0, height: 2 },
                // shadowOpacity: 0.08,
                // shadowRadius: 4,
                // elevation: 2,
            }}
        >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1, marginRight: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                        <View style={{
                            backgroundColor: primaryColor + "25",
                            borderRadius: 8,
                            width: 36,
                            height: 36,
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginRight: 10,
                            borderWidth: 1,
                            borderColor: primaryColor + "40"
                        }}>
                            <IconApp
                                pack="FI"
                                name={getCategoryIcon(item.category)}
                                size={18}
                                color={primaryColor}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <YambiText
                                text={item.title}
                                size="normal"
                                color="high"
                                style={{ flex: 1, fontWeight: '700', fontSize: 15 }}
                                numberLines={2}
                            />
                        </View>
                    </View>

                    {category && (
                        <View style={{ marginLeft: 46, marginBottom: 4 }}>
                            <View style={{
                                backgroundColor: secondaryColor + "15",
                                paddingHorizontal: 8,
                                paddingVertical: 3,
                                borderRadius: 6,
                                alignSelf: 'flex-start',
                                borderWidth: 1,
                                borderColor: secondaryColor + "30"
                            }}>
                                <YambiText
                                    text={category.name}
                                    size="small"
                                    color={secondaryColorText}
                                    style={{ fontWeight: '600', fontSize: 11 }}
                                />
                            </View>
                        </View>
                    )}

                    {item.description !== "" && (
                        <YambiText
                            text={item.description}
                            size="small"
                            color="gray"
                            style={{ marginLeft: 46, marginTop: 3, marginBottom: 6, lineHeight: 16 }}
                            numberLines={2}
                        />
                    )}

                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, marginLeft: 46, flexWrap: 'wrap' }}>
                        <View style={{
                            backgroundColor: tertiaryColor + "20",
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 6,
                            marginRight: 6,
                            marginBottom: 4,
                            borderWidth: 1,
                            borderColor: tertiaryColor + "30"
                        }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <IconApp pack="MC" name="wallet-outline" size={11} color={tertiaryColor} styles={{ marginRight: 3 }} />
                                <YambiText
                                    text={strings.wallet + " " + item.wallet}
                                    size="xsmall"
                                    color={tertiaryColorText}
                                    style={{ fontSize: 10, fontWeight: '600' }}
                                />
                            </View>
                        </View>
                        {item.debt === 1 && (
                            <View style={{
                                backgroundColor: theme.error + "20",
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                borderRadius: 6,
                                marginRight: 6,
                                marginBottom: 4,
                                borderWidth: 1,
                                borderColor: theme.error + "40",
                                flexDirection: 'row',
                                alignItems: 'center'
                            }}>
                                <IconApp pack="FI" name="alert-circle" size={11} color={theme.error} styles={{ marginRight: 3 }} />
                                <YambiText
                                    text={strings.debt}
                                    size="xsmall"
                                    color="error"
                                    style={{ fontSize: 10, fontWeight: '600' }}
                                />
                            </View>
                        )}
                        {hasSalesPoint && (
                            <View style={{
                                backgroundColor: secondaryColor + "20",
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                borderRadius: 6,
                                marginRight: 6,
                                marginBottom: 4,
                                flexDirection: 'row',
                                alignItems: 'center',
                                borderWidth: 1,
                                borderColor: secondaryColor + "40"
                            }}>
                                <IconApp pack="FI" name="map-pin" size={11} color={secondaryColor} styles={{ marginRight: 3 }} />
                                <YambiText
                                    text={salesPoint!.sells_point_name}
                                    size="xsmall"
                                    color={secondaryColorText}
                                    style={{ fontSize: 10, fontWeight: '600' }}
                                    numberLines={1}
                                />
                            </View>
                        )}
                        {hasBusiness && !hasSalesPoint && (
                            <View style={{
                                backgroundColor: tertiaryColor + "20",
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                borderRadius: 6,
                                marginRight: 6,
                                marginBottom: 4,
                                flexDirection: 'row',
                                alignItems: 'center',
                                borderWidth: 1,
                                borderColor: tertiaryColor + "40"
                            }}>
                                <IconApp pack="FI" name="briefcase" size={11} color={tertiaryColor} styles={{ marginRight: 3 }} />
                                <YambiText
                                    text={business!.business_name}
                                    size="xsmall"
                                    color={tertiaryColorText}
                                    style={{ fontSize: 10, fontWeight: '600' }}
                                    numberLines={1}
                                />
                            </View>
                        )}
                    </View>

                    <View style={{ marginLeft: 46, marginTop: 6, flexDirection: 'row', alignItems: 'center' }}>
                        <IconApp pack="FI" name="clock" size={11} color={theme.gray} styles={{ marginRight: 4 }} />
                        <YambiText
                            text={renderDateTime(item.createdAt, 0, false, false)}
                            size="xsmall"
                            color="gray"
                            style={{ fontSize: 10 }}
                        />
                    </View>
                </View>

                <View style={{ alignItems: 'flex-end', justifyContent: 'space-between' }}>
                    <View style={{
                        backgroundColor: primaryColor + "15",
                        borderRadius: 10,
                        padding: 10,
                        borderWidth: 1.5,
                        borderColor: primaryColor + "30",
                        minWidth: 90,
                        alignItems: 'flex-end'
                    }}>
                        <YambiText
                            text={formatAmount(item.amount) + " " + renderCurrency(item.currency, false)}
                            size="normal"
                            color={primaryColorText}
                            style={{ fontWeight: '700', fontSize: 16, marginBottom: 6 }}
                        />
                        <View style={{
                            backgroundColor: item.payment_type === 0 
                                ? theme.error + "25" 
                                : item.payment_type === 1 
                                    ? primaryColor + "25" 
                                    : item.payment_type === 2 
                                        ? secondaryColor + "25" 
                                        : tertiaryColor + "25",
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 6,
                            borderWidth: 1,
                            borderColor: item.payment_type === 0 
                                ? theme.error + "40" 
                                : item.payment_type === 1 
                                    ? primaryColor + "40" 
                                    : item.payment_type === 2 
                                        ? secondaryColor + "40" 
                                        : tertiaryColor + "40",
                            flexDirection: 'row',
                            alignItems: 'center'
                        }}>
                            <IconApp 
                                pack="FI" 
                                name={
                                    item.payment_type === 0 ? "x-circle" :
                                    item.payment_type === 1 ? "dollar-sign" :
                                    item.payment_type === 2 ? "credit-card" :
                                    "bank"
                                } 
                                size={11} 
                                color={
                                    item.payment_type === 0 
                                        ? theme.error 
                                        : item.payment_type === 1 
                                            ? primaryColor 
                                            : item.payment_type === 2 
                                                ? secondaryColor 
                                                : tertiaryColor
                                } 
                                styles={{ marginRight: 3 }} 
                            />
                            <YambiText
                                text={
                                    item.payment_type === 0 ? (strings as any).not_paid || "Not Paid" :
                                    item.payment_type === 1 ? strings.cash || "Cash" :
                                    item.payment_type === 2 ? strings.card || "Card" :
                                    strings.bank_transfer || "Bank Transfer"
                                }
                                size="xsmall"
                                color={
                                    item.payment_type === 0 ? "error" : 
                                    item.payment_type === 1 ? primaryColorText : 
                                    item.payment_type === 2 ? secondaryColorText : 
                                    tertiaryColorText
                                }
                                style={{ fontSize: 10, fontWeight: '600' }}
                            />
                        </View>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};

export default ExpenseItem;
