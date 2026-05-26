import { Text, Pressable, View, Image } from "react-native";
import { TBusiness, TSale, TSellsPoint, TTheme, TUser } from "../../../types/types";
import { useAppDispatch, useAppSelector } from "../../../store/app/hooks";
import { memo, useCallback } from 'react';
import Animated from "react-native-reanimated";
// import { setCurrentUser } from "../../store/reducers/currentUserSlice";
import { setTextContactSearch } from "../../../store/reducers/appSlice";
import { TextBigYambi, TextNormalYambi, TextNormalYambiError, TextNormalYambiGray, TextSmallYambi, TextSmallYambiError, TextSmallYambiGray, TextSmallYambiSuccess } from "../../app/Text";
import Feather from 'react-native-vector-icons/Feather';
import { IconApp } from "../../app/IconApp";
import { renderCategoryName, renderCurrency, renderDateTime } from "../../../../GlobalVariables";
import { strings } from "../../../lang/lang";
import * as RootNavigation from "../../../services/Navigation_ref";
import { useObject } from "@realm/react";
import { ItemPrices, UserBusinessArticles } from "../../../store/database/Models";
import SwitchApp from "../../app/SwitchApp";

const SalesList = ({ item, index, onLongPress }: { item: TSale, onLongPress, index: number }) => {
    const app_theme = useAppSelector(state => state.app_theme);
    const article = useObject(UserBusinessArticles, item.item_id);

    if (article === null) return;
    const prices = useObject(ItemPrices, "G" + article._id);
    const language = useAppSelector(state => state.persisted_app.langApp);

    // console.log("sale displayed")

    let pp = (parseFloat(item.selling_price) - (parseFloat(item.cost_price)));
    let pp2 = pp / parseFloat(item.selling_price);
    let profit = pp2 ? pp2 * 100 : 0;

    const show_buyer = () => {
        if (item.buyer_name !== "") {
            return true;
        }

        return false;
    }

    return (
        <Pressable onPress={() => onLongPress(item, article, prices)}
            style={{
                // borderBottomWidth: 1,
                // borderTopWidth: 0,
                borderColor: app_theme.colors.border,
                flex: 1,
                paddingVertical: 15,
                paddingHorizontal: 15,
                backgroundColor: index % 2 === 0 ? app_theme.colors.background : app_theme.colors.border
            }}>
            <View style={{
                flexDirection: 'row',
                justifyContent: 'center',
                // borderBottomWidth: 1,
                // paddingVertical: 15,
                borderColor: app_theme.colors.border
            }}>
                <View style={{
                    flex: 6,
                    // paddingVertical:5
                }}>
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center'
                    }}>
                        <TextNormalYambi text={article.item_name} styles={{ flex: 1 }} />
                        {item.sale_active === 1 ?
                            <View style={{
                                // backgroundColor: profit > 0 ? app_theme.colors.success + '40' : app_theme.colors.error + '40',
                                borderRadius: 15,
                                paddingVertical: 2,
                                paddingHorizontal: 10
                            }}>
                                {profit > 0 ?
                                    <TextSmallYambiSuccess text={"+" + (profit.toFixed(2) + " %")} />
                                    :
                                    <TextSmallYambiError text={(profit.toFixed(2) + " %")} />}
                            </View> : null}
                    </View>

                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center'
                    }}>
                        <TextSmallYambiGray text={renderDateTime(item.createdAt, 1, false)} styles={{ flex: 1 }} />
                        {item.sale_active === 1 && item.agent_paid === "" ?
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center'
                            }}>
                                <TextSmallYambi text={strings.cash.toLowerCase()} styles={{ marginRight: 3 }} numberLines={1} />
                                <IconApp pack="MC" name="check-all" size={17} color={item.type_sale === 0 ? app_theme.colors.high_color : app_theme.colors.gray} />
                            </View> : null}
                    </View>

                    <TextSmallYambiGray text={strings.seller + " : " + item.sale_operator} />
                </View>

                <View style={{
                    borderColor: app_theme.colors.border,
                    flex: 1,
                    // justifyContent: 'center',
                    alignItems: 'center',
                    // borderLeftWidth:1
                }}>
                    <TextSmallYambi text={item.number.toString()} />
                </View>

                <View style={{
                    borderColor: app_theme.colors.border,
                    flex: 2,
                    // justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <TextSmallYambi text={(parseFloat(item.selling_price) * item.number).toFixed(2).toString()} />
                    <TextSmallYambiGray text={parseFloat(item.selling_price).toFixed(2)} />
                </View>

                <View style={{
                    borderColor: app_theme.colors.border,
                    flex: 1,
                    // justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <TextSmallYambi text={renderCurrency(item.currency, false)} />
                </View>
            </View>

            {show_buyer() ?
                <TextSmallYambiGray text={strings.buyer + " : " + item.buyer_name + " (" + item.buyer_phone + ")"} /> : null}

            {item.sale_active === 0 ?
                <TextNormalYambiError text={strings.sale_cancelled_by_user} numberLines={1} /> : null}
        </Pressable>
    );
}

export default memo(SalesList);

