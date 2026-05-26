import { Text, Pressable, View, Image } from "react-native";
import { TBusiness, TSellsPoint, TTheme, TUser } from "../../types/types";
import { useAppDispatch, useAppSelector } from "../../store/app/hooks";
import { memo, useCallback } from 'react';
import Animated from "react-native-reanimated";
// import { setCurrentUser } from "../../store/reducers/currentUserSlice";
import { setTextContactSearch } from "../../store/reducers/appSlice";
import Feather from 'react-native-vector-icons/Feather';
import { renderCategoryName } from "../../../GlobalVariables";
import { strings } from "../../lang/lang";
import * as RootNavigation from "./../../services/Navigation_ref";
import { IconApp } from "../../components/app/IconApp";
import { TextNormalYambi, TextNormalYambiGray, TextSmallYambi } from "../../components/app/Text";

const SellsPointsList = ({ item,  }: { item: TSellsPoint, index: number }) => {
    const app_theme = useAppSelector(state => state.app_theme);

    return (
        <Pressable
            onPress={() => {
                // dispatch(setBusiness(item));
                // navigation.navigate("Workspace" as never);
            }}
            style={{
                // borderTopWidth: index === 0 ? 1 : 0,
                borderColor: app_theme.colors.border,
                flex: 1,
                padding: 10,
                paddingVertical: 15,
                paddingRight: 0
            }}>
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
            }}>
                <IconApp pack="MT" name="business-center" size={40} color={app_theme.colors.gray} />
                <View style={{
                    flex: 1,
                    paddingHorizontal: 10
                }}>
                    <TextNormalYambi bold text={item.sells_point_name} numberLines={1} />
                    <TextSmallYambi text={item.sells_point_address} numberLines={1} />
                    <TextNormalYambiGray text={renderCategoryName(item.category)} numberLines={1} />
                </View>
                <Pressable
                    onPress={() => RootNavigation.navigate("BusinessItems", { business_id: item.business_id, sales_point_id: item._id })}
                    style={{
                        height: 50,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: app_theme.colors.design_tip2,
                        paddingHorizontal: 8,
                        borderRadius: 5
                    }}>
                    <Text style={{
                        color: app_theme.colors.text_design2
                    }}>{strings.sell}</Text>
                </Pressable>
            </View>
        </Pressable>
    );
}

export default memo(SellsPointsList);

