import { Text, TouchableOpacity, View, Pressable } from "react-native";
import { TBusiness, TBusinessUser, TSellsPoint } from "../../../types/types";
import { useAppDispatch, useAppSelector } from "../../../store/app/hooks";
import { memo, useState } from 'react';
import { setShowModalApp } from "../../../store/reducers/appSlice";
import { TextNormalYambi, TextNormalYambiGray, TextNormalYambiHighColor, TextNormalYambiHighColor2, TextNormalYambiHighColor3, TextSmallYambiHighColor, TextSmallYambiHighColor2 } from "../../app/Text";
import { IconApp } from "../../app/IconApp";
import { strings } from "../../../lang/lang";
import * as RootNavigation from "../../../services/Navigation_ref";
import { useQuery } from "@realm/react";
import { FlashList } from "@shopify/flash-list";
import BusinessUsersList from './BusinessUsers';
import { BusinessItemsSale, BusinessUsers } from "../../../store/database/Models";
import ModalApp from "../../app/ModalApp";

const SellsPointsList = ({ item, index, show_sell, show_users, show_edit }: { item: TSellsPoint, index: number, show_sell: boolean, show_users: boolean, show_edit: boolean }) => {
    const app_theme = useAppSelector(state => state.app_theme);
    const user_data = useAppSelector(state => state.user_data);
    const business_badge = useAppSelector(state => state.persisted_app.business_badge)
    const app_description = useAppSelector(state => state.persisted_app.app_description);
    const [showUserError, setShowUserError] = useState<boolean>(false);
    const dispatch = useAppDispatch();

    const spu = useQuery(
        BusinessUsers, user => {
            return user.filtered('sales_point_id == $0 && user_active != $1', item._id, 2);
        }, []);

        // console.log(spu)

    const sps = useQuery(
        BusinessItemsSale, ss => {
            return ss.filtered('sale_active == $0 && sales_point_id == $1', 1, item._id);
        }, []);

    const CCC = () => {

    }

    const uuser = useQuery(
        BusinessUsers, bss => {
            return bss.filtered('user == $0 && business_id == $1 && user_active != $2', user_data.phone_number, item.business_id, 2)
        }, []);

    const oo = uuser.find(element => element.user === user_data.phone_number);

    const conditionGoUsers = () => {
        if (oo !== null && oo !== undefined) {
            if ((oo.user_active === 1 && oo.level === 1) || (oo.user_active === 1 && oo.level === 2)) {
                return true;
            } else {
                dispatch(setShowModalApp(true));
                setShowUserError(true);
            }
        }
        else {
            dispatch(setShowModalApp(true));
            setShowUserError(true);
        }

        return false;
    }

    // const conditionEditBusiness = () => {
    //     if (oo === null && oo !== undefined) {
    //         if ((oo.user_active === 1 && oo.level === 1)) {
    //             return true;
    //         } else {
    //             dispatch(setShowModalApp(true));
    //             setShowUserError(true);
    //         }
    //     } else {
    //         dispatch(setShowModalApp(true));
    //         setShowUserError(true);
    //     }

    //     return false;
    // }

    const sales_point_badge = business_badge ? business_badge.filter(element => element.sales_point_id === item._id) : [];


    const show_sell_button = () => {
        if (oo !== null && oo !== undefined) {
            if (oo.user_active === 1 && oo.level === 1 || (oo.user_active === 1 && oo.sales_point_id === item._id && oo.level === 2) || (oo.user_active === 1 && oo.sales_point_id === item._id && oo.level === 3)) {
                return true;
            }
        }

        return false;
    }

    const GoSalesPoint = () => {
        if (oo !== null && oo !== undefined) {
            if (oo.user_active === 1 && oo.level === 1 || (oo.user_active === 1 && oo.sales_point_id === item._id && oo.level === 2) || (oo.user_active === 1 && oo.sales_point_id === item._id && oo.level === 3)) {
                RootNavigation.navigate("BusinessSales", { business_id: "", sales_point_id: item._id, item_id: "" });
            } else {
                dispatch(setShowModalApp(true));
                setShowUserError(true);
            }
        }
    }

    return (
        show_sell_button() ?
            <View
                style={{
                    marginHorizontal: 0,
                    marginVertical: 8,
                    backgroundColor: app_theme.colors.background,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: app_theme.colors.border,
                    padding: 16,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 4,
                    // elevation: 3,
                }}>

                {showUserError ?
                    <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowUserError(false) }} singleButton title={strings.error}>
                        <TextNormalYambiGray text={strings.business_level_error} />
                    </ModalApp> : null}

                <TouchableOpacity onPress={GoSalesPoint} style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 12,
                }}>
                    <View style={{
                        height: 48,
                        width: 48,
                        borderRadius: 24,
                        backgroundColor: app_theme.colors.high_color + '15',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 12,
                    }}>
                        <IconApp pack="MT" name="store" size={24} color={app_theme.colors.high_color} />
                    </View>
                    <View style={{
                        flex: 1
                    }}>
                        <View style={{
                            flexDirection:'row',
                            justifyContent:'space-between'
                        }}>
                            <TextNormalYambi bold text={item.sells_point_name} styles={{ marginBottom: 4, fontSize: 16 }} />

                    {show_edit && (
                        <TouchableOpacity
                            onPress={() => RootNavigation.navigate("EditSalesPoint", { sales_point: item })}
                            style={{
                                height: 35,
                                width: 35,
                                justifyContent: 'center',
                                alignItems: 'center',
                                backgroundColor: app_theme.colors.high_color+"15",
                                borderRadius: 20,
                                flexDirection: 'row',
                            }}>
                            <IconApp pack="FI" name="edit" size={16} color={app_theme.colors.high_color} />
                            {/* <TextNormalYambiHighColor text={strings.edit} styles={{ marginLeft: 6, fontWeight: '600' }} /> */}
                        </TouchableOpacity>
                    )}
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                            <IconApp pack="FI" name="map-pin" size={12} color={app_theme.colors.gray} />
                            <TextNormalYambiGray text={item.sells_point_address} styles={{ marginLeft: 4, flex: 1 }} numberLines={1} />
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                            <View style={{
                                backgroundColor: app_theme.colors.high_color + '20',
                                paddingHorizontal: 10,
                                paddingVertical: 4,
                                borderRadius: 12,
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}>
                                <IconApp pack="FI" name="shopping-bag" size={12} color={app_theme.colors.high_color} />
                                <TextSmallYambiHighColor 
                                    text={sps.length > 1 ? sps.length + " " + strings.total_sales.toLowerCase() : sps.length + " " + strings.sale.toLowerCase()} 
                                    styles={{ marginLeft: 4, fontSize: 11, fontWeight: '600' }} 
                                />
                            </View>

                            {sales_point_badge.length > 0 && (
                                <View style={{
                                    backgroundColor: app_theme.colors.high_color2 + '20',
                                    paddingHorizontal: 10,
                                    paddingVertical: 4,
                                    borderRadius: 12,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                }}>
                                    <IconApp pack="FI" name="bell" size={12} color={app_theme.colors.high_color2} />
                                    <TextSmallYambiHighColor2 
                                        text={sales_point_badge.length > 1 ? sales_point_badge.length + " " + strings.new_sales.toLowerCase() : sales_point_badge.length + " " + strings.new_sale.toLowerCase()} 
                                        styles={{ marginLeft: 4, fontSize: 11, fontWeight: '600' }} 
                                    />
                                </View>
                            )}
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Action Buttons */}
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                    {show_sell && (
                        <TouchableOpacity
                            onPress={() => RootNavigation.navigate("BusinessItems", { business_id: item.business_id, sales_point_id: item._id, flag: 0 })}
                            style={{
                                flex: 1,
                                height: 44,
                                justifyContent: 'center',
                                alignItems: 'center',
                                backgroundColor: app_theme.colors.design_tip2,
                                borderRadius: 12,
                                flexDirection: 'row',
                                shadowColor: app_theme.colors.design_tip2,
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.3,
                                shadowRadius: 3,
                                elevation: 3,
                            }}>
                            <IconApp pack="FI" name="shopping-cart" size={16} color={app_theme.colors.text_design2} />
                            <Text style={{
                                color: app_theme.colors.text_design2,
                                marginLeft: 6,
                                fontWeight: '600',
                            }}>{strings.sell}</Text>
                        </TouchableOpacity>
                    )}

                </View>

                {/* Users Section */}
                <View style={{
                    borderTopWidth: 1,
                    borderColor: app_theme.colors.border,
                    paddingTop: 12,
                }}>
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: spu.length > 0 ? 10 : 0,
                    }}>
                        {spu.length > 0 && (
                            <TextNormalYambi text={strings.all_users} styles={{ fontSize: 14, fontWeight: '600' }} />
                        )}

                        <TouchableOpacity
                            onPress={() => {
                                if (conditionGoUsers()) {
                                    RootNavigation.navigate("NewBusinessUser", { sales_point_id: item._id, business_id: item.business_id });
                                }
                            }}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                backgroundColor: app_theme.colors.high_color + '15',
                                borderRadius: 10,
                            }}>
                            <IconApp pack='FI' name='plus' size={16} color={app_theme.colors.high_color} />
                            <TextNormalYambiHighColor text={spu.length>0?strings.add:strings.add_user} styles={{ marginLeft: 4, fontSize: 13, fontWeight: '600' }} />
                        </TouchableOpacity>
                    </View>
                </View>

                {show_users ?
                    <FlashList
                        data={spu as never}
                        estimatedItemSize={150}
                        renderItem={({ item, index }: { item: TBusinessUser, index: number }) => (<BusinessUsersList index={index} show_level item={item} selectContact={CCC} />)}
                    /> : null}
            </View> : null
    );
}

export default memo(SellsPointsList);

