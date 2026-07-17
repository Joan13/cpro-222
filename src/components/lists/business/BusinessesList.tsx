import { Pressable, View } from "react-native";
import { TBusiness, TBusinessUser, TSellsPoint } from "../../../types/types";
import { useAppDispatch, useAppSelector } from "../../../store/app/hooks";
import { memo, useCallback, useEffect, useState } from 'react';
import { TextBigYambi, TextNormalYambi, TextNormalYambiError, TextNormalYambiGray, TextNormalYambiHighColor, TextSmallYambiError, TextSmallYambiGray, TextSmallYambiHighColor } from "../../app/Text";
import Feather from 'react-native-vector-icons/Feather';
import { IconApp } from "../../app/IconApp";
import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@realm/react";
import { BusinessItemsSale, BusinessUsers, UserBusinessArticles, UserSellsPoints } from "../../../store/database/Models";
import SellsPointsList from "./SellsPointsList";
import { copyToClipboard, remote_host_server, renderCategoryName, media_url } from "../../../../GlobalVariables";
import { strings } from "../../../lang/lang";
import * as RootNavigation from './../../../services/Navigation_ref';
import SwitchApp from "../../app/SwitchApp";
import ModalApp from "../../app/ModalApp";
import { setShowModalApp } from "../../../store/reducers/appSlice";
import { Image as ExpoImage } from 'expo-image';

const BusinessesList = ({ item, index, business_users, isAdmin }: { item: TBusiness, business_users?: TBusinessUser, index: number, isAdmin?: boolean }) => {
    const app_theme = useAppSelector(state => state.app_theme);
    const user_data = useAppSelector(state => state.user_data);
    const [showUserError, setShowUserError] = useState(false);
    const dispatch = useAppDispatch();
    const [sss, setSss] = useState([]);

    const sells_points = useQuery(
        UserSellsPoints, sells_points => {
            return sells_points.filtered('business_id == $0', item._id)
        }, []);

    const bs = useQuery(
        BusinessItemsSale, ss => {
            return ss.filtered('sale_active == $0 && business_id == $1', 1, item._id);
        }, []);

    const bu = useQuery(
        BusinessUsers, ss => {
            return ss.filtered('business_id == $0 && user_active != $1', item._id, 2);
        }, []);

    const bitems = useQuery(
        UserBusinessArticles, ss => {
            return ss.filtered('item_active == $0 && business_id == $1', 1, item._id);
        }, []);

    // const user_is_in_business = useQuery(
    //     BusinessUsers, ss => {
    //         return ss.filtered('business_id == $0 && user_active == $1 && user == $2', item._id, 1, user_data.phone_number);
    //     }, []);

    const uuser = useQuery(
        BusinessUsers, bss => {
            return bss.filtered('user == $0 && business_id == $1 && user_active == $2', user_data.phone_number, item._id, 1)
        }, []);

    const isAppAdmin = user_data.user_level !== 0;

    const oo = uuser.find(element => element.user === user_data.phone_number) || (isAppAdmin ? {
        _id: 'mock_admin',
        business_id: item._id,
        user_name: user_data.user_names,
        phone_number: user_data.phone_number,
        user: user_data.phone_number,
        level: 1,
        user_active: 1,
        createdAt: '',
        updatedAt: ''
    } as any : undefined);

    const conditionGoUsers = () => {
        if (isAppAdmin) return true;
        if (oo !== undefined) {
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

    const conditionEditBusiness = () => {
        if (isAppAdmin) return true;
        // if (oo !== null && oo !== undefined) {
        if (oo !== undefined) {
            if ((oo.user_active === 1 && oo.level === 1)) {
                return true;
            } else {
                dispatch(setShowModalApp(true));
                setShowUserError(true);
            }
        } else {
            dispatch(setShowModalApp(true));
            setShowUserError(true);
        }

        return false;
    }

    const show_global_infos = () => {
        if (isAppAdmin) return true;
        if (oo !== undefined) {
            if (oo.level === 1 && oo.user_active === 1) {
                return true;
            } else {
                return false;
            }
        }

        return false;
    }

    // useEffect(() => {
    //     //             let ooo = [];
    //     // for(let i in business_users) {
    //     //     if(business_users[i].level !== 1) {
    //     //     const iii = sells_points.filter(itemm => itemm._id === business_users[i].sales_point_id && business_users[i].user === user_data.phone_number);

    //     //     ooo.push(iii);
    //     //     console.log(iii);
    //     // } else {
    //     //     const iii = sells_points.filter(itemm => business_users[i].user === user_data.phone_number);
    //     //     ooo.push(iii);

    //     //     // console.log(iii)
    //     // }
    //     // }

    //     // console.log(ooo);
    //     // setSss(ooo as never);
    // }, [sss]);

    const GoBusiness = () => {
        if (isAppAdmin) {
            RootNavigation.navigate("BusinessSales", { business_id: item._id, sales_point_id: "", item_id: "" });
            return;
        }
        if (oo !== null && oo !== undefined) {
            if (oo.user_active === 1 && oo.level < 3) {
                RootNavigation.navigate("BusinessSales", { business_id: item._id, sales_point_id: "", item_id: "" })
            }
        }
    }

    const ViewPhoto = () => {
        if (item.logo !== "") {
            RootNavigation.navigate("ViewPhoto", { source: media_url + "/business_logos/" + item.logo });
        } else {
            RootNavigation.navigate("ViewPhoto", { source: "" });
        }
    }

    if (oo && !isAdmin) {
        return (
            <View
                style={{
                    // borderTopWidth: 1,
                    borderTopWidth: index !== 0 ? 1 : 0,
                    backgroundColor: app_theme.colors.background,
                    // paddingHorizontal: 15,
                    // paddingVertical: 0,
                    borderColor: app_theme.colors.gray,
                    flex: 1,
                    marginTop: index === 0 ? 10 : -1,
                    paddingTop: index !== 0 ? 20 : 0,
                    marginBottom: 15,
                    // borderRadius: 5,
                    // elevation: 2,
                }}>

                {showUserError ?
                    <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowUserError(false) }} singleButton title={strings.error}>
                        <TextNormalYambiGray text={strings.business_level_error} />
                    </ModalApp> : null}

                <View
                    // onPress={GoBusiness}
                    // onPress={() => RootNavigation.navigate("NewBusinessUser", { business_id: item._id })}
                    // onPress={() => RootNavigation.navigate("EditBusiness", { business: item })}
                    style={{
                        // padding: 10,
                        paddingBottom: 0
                    }}>

                    {/* <View style={{
                        justifyContent:'center',
                        alignItems:'center'
                    }}>
                    <Image
                        source={require("./../../assets/4381.png")}
                        style={{
                            // flex:1,
                            width: 300,
                            height: 185
                        }} />
                    </View> */}

                    <View style={{
                        flexDirection: 'row'
                    }}>
                        <Pressable onPress={ViewPhoto} style={{
                            width: 140,
                            height: 140,
                            borderRadius: 100,
                            borderWidth: 1,
                            borderColor: app_theme.colors.border,
                            justifyContent: 'center',
                            alignItems: 'center',
                            alignSelf: 'center'
                        }}>
                            {item.logo === "" ?
                                <ExpoImage
                                    style={{
                                        width: 85,
                                        height: 85
                                    }}
                                    contentFit="contain"
                                    source={require("./../../../assets/budget.png")} />
                                :
                                <ExpoImage
                                    style={{
                                        width: 140,
                                        height: 140,
                                        borderRadius: 100
                                        // flex:1
                                    }}
                                    contentFit="contain"
                                    source={media_url + "/business_logos/" + item.logo} />}
                        </Pressable>
                        <View style={{
                            justifyContent: 'flex-end',
                            alignItems: 'flex-end',
                            flex: 1
                        }}>
                            <View
                                // onPress={() => RootNavigation.navigate("NewSalesPoint", { business_id: item._id })}
                                style={{
                                    alignItems: 'center',
                                    flexDirection: 'row',
                                    borderColor: app_theme.colors.border,
                                    borderRadius: 5,
                                    marginRight: -3
                                }}>
                                {item.business_active === 1 ?
                                    <>
                                        <TextSmallYambiHighColor text={strings.active_subscription} styles={{ marginRight: 8 }} />
                                        <SwitchApp small value={item.business_active === 1 ? true : false} onPress={() => { }} />
                                    </>
                                    :
                                    <View style={{
                                        flexDirection: 'row'
                                    }}>
                                        <IconApp name="warning" color={app_theme.colors.error} size={18} pack="FA" />
                                        <TextSmallYambiError text={strings.expired_subscription} styles={{ marginLeft: 5 }} />
                                    </View>}
                            </View>

                            {item.business_active === 0 ?
                                <Pressable
                                    onPress={() => {
                                        if (conditionEditBusiness()) {
                                            RootNavigation.navigate("ContactUs", { flag: 1 })
                                        }
                                    }}
                                    style={{
                                        borderColor: app_theme.colors.high_color,
                                        borderBottomWidth: 1,
                                        paddingBottom: 0,
                                        marginTop: -5
                                    }}>
                                    <TextSmallYambiHighColor text={strings.renew_my_subscription} styles={{ marginLeft: 7 }} />
                                </Pressable> : null}

                            <Pressable
                                onPress={() => {
                                    if (conditionEditBusiness()) {
                                        RootNavigation.navigate("EditBusiness", { business: item })
                                    }
                                }}
                                style={{
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    flexDirection: 'row',
                                    borderColor: app_theme.colors.border,
                                    borderWidth: 1,
                                    borderRadius: 5,
                                    padding: 7,
                                    marginTop: 10
                                }}>
                                <IconApp pack="FI" name="edit" size={13} color={app_theme.colors.high_color} />
                                {/* <Text numberOfLines={1} style={{ marginLeft: 7, color: app_theme.colors.high_color }}>{strings.edit_business}</Text> */}
                                <TextSmallYambiHighColor text={strings.edit_business} styles={{ marginLeft: 7 }} />
                            </Pressable>

                            {/* <Pressable
                            onPress={() => RootNavigation.navigate("NewSalesPoint", { business_id: item._id })}
                            style={{
                                justifyContent: 'center',
                                alignItems: 'center',
                                flexDirection: 'row',
                                borderColor: app_theme.colors.border,
                                borderWidth: 1,
                                borderRadius: 5,
                                padding: 7,
                                marginTop: 7
                            }}>
                            <IconApp pack="FI" name="plus" size={15} color={app_theme.colors.high_color} />
                            <Text numberOfLines={1} style={{ marginLeft: 7, color: app_theme.colors.high_color }}>{strings.new_sales_point}</Text>
                        </Pressable> */}

                            <Pressable
                                onPress={() => {
                                    if (conditionGoUsers()) {
                                        RootNavigation.navigate("NewBusinessItem", { business_id: item._id });
                                    }
                                }}
                                style={{
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    flexDirection: 'row',
                                    borderColor: app_theme.colors.border,
                                    borderWidth: 1,
                                    borderRadius: 5,
                                    padding: 7,
                                    marginTop: 8
                                }}>
                                <IconApp pack="FI" name="plus" size={15} color={app_theme.colors.high_color} />
                                {/* <Text numberOfLines={1} style={{ marginLeft: 7, color: app_theme.colors.high_color }}>{strings.add_item}</Text> */}
                                <TextSmallYambiHighColor text={strings.add_item} styles={{ marginLeft: 7 }} />
                            </Pressable>

                            <Pressable
                                onPress={() => {
                                    if (conditionEditBusiness()) {
                                        RootNavigation.navigate("NewSalesPoint", { business_id: item._id })
                                    }
                                }}
                                style={{
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    flexDirection: 'row',
                                    borderColor: app_theme.colors.border,
                                    borderWidth: 1,
                                    borderRadius: 5,
                                    padding: 7,
                                    marginTop: 8
                                }}>
                                <IconApp pack="FI" name="plus" size={15} color={app_theme.colors.high_color} />
                                {/* <Text numberOfLines={1} style={{ marginLeft: 7, color: app_theme.colors.high_color }}>{strings.new_sales_point}</Text> */}
                                <TextSmallYambiHighColor text={strings.add_new_sales_point} styles={{ marginLeft: 7 }} />
                            </Pressable>
                        </View>
                    </View>

                    <Pressable
                        onPress={GoBusiness}
                        style={{
                            flexDirection: 'row',
                            // justifyContent:'flex-start'
                        }}>
                        <View style={{
                            flex: 1,
                            marginBottom: 30,
                            marginTop: 10
                        }}>
                            <TextBigYambi bold text={item.business_name} />
                            <TextNormalYambiGray styles={{ marginTop: 8 }} text={item.description_service} />

                            <Pressable onPress={GoBusiness} onLongPress={() => copyToClipboard(item._id)}>
                                <TextNormalYambiGray styles={{ marginTop: 8 }} text={strings.business_id + " : " + item._id} />
                            </Pressable>
                        </View>
                        {/* <Pressable
                        onPress={() => RootNavigation.navigate("NewSalesPoint", { business_id: item._id })}
                        style={{
                            width: 30,
                            height: 30,
                            justifyContent: 'center',
                            alignItems: 'flex-end'
                        }}>
                        <IconApp pack="FI" name="edit" size={15} color={app_theme.colors.text} />
                    </Pressable> */}
                    </Pressable>



                    <View style={{
                        flexDirection: 'row'
                    }}>
                        <View style={{
                            flex: 1,
                            marginRight: 10
                        }}>
                            <TextNormalYambiHighColor text={renderCategoryName(item.category)} styles={{ marginBottom: 3 }} />
                            {item.business_address !== "" ?
                                <TextNormalYambiGray text={item.business_address} /> : null}

                            {show_global_infos() ?
                                <>
                                    {bs.length > 0 ?
                                        <TextNormalYambiHighColor text={bs.length === 1 ? bs.length + " " + strings.sale.toLowerCase() : bs.length + " " + strings.total_sales.toLowerCase()} styles={{ marginTop: 5 }} /> : null}

                                    {sells_points.length > 0 ?
                                        <TextNormalYambiHighColor text={sells_points.length === 1 ? 1 + " " + strings.sales_point.toLowerCase() : sells_points.length + " " + strings.sells_points.toLowerCase()} styles={{ marginTop: 5 }} /> : null}

                                    {bu.length > 0 ?
                                        <TextNormalYambiHighColor text={bu.length === 1 ? 1 + " " + strings.user.toLowerCase() : bu.length + " " + strings.users.toLowerCase()} styles={{ marginTop: 5 }} /> : null}

                                    {bitems.length > 0 ?
                                        <TextNormalYambiHighColor text={bitems.length === 1 ? 1 + " " + strings.item.toLowerCase() : bitems.length + " " + strings.items.toLowerCase()} styles={{ marginTop: 5 }} /> : null}
                                </> : null}

                            {bitems.length > 0 ?
                                <Pressable
                                    onPress={() => {
                                        if (conditionGoUsers()) {
                                            RootNavigation.navigate("BusinessItems", { business_id: item._id, sales_point_id: "", flag: 2 })
                                        }
                                    }}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'baseline',
                                        paddingTop: 5
                                    }}>
                                    <TextNormalYambiHighColor text={strings.view_inventory} styles={{ marginRight: 3 }} />
                                    <IconApp pack='FI' name='chevron-right' size={18} color={app_theme.colors.high_color} />
                                </Pressable> : null}
                        </View>

                        <View style={{ flex: 1 }}>
                            {item.national_number !== "" ?
                                <View>
                                    <TextNormalYambi text={strings.national_id} styles={{ textAlign: 'right', marginBottom: 3 }} />
                                    <TextNormalYambiGray text={item.national_number} styles={{ textAlign: 'right' }} />
                                </View> : null}

                            {item.national_id !== "" ?
                                <View style={{ marginTop: 8 }}>
                                    <TextNormalYambi text={strings.identification_number} styles={{ textAlign: 'right', marginBottom: 3 }} />
                                    <TextNormalYambiGray text={item.national_id} styles={{ textAlign: 'right' }} />
                                </View> : null}

                            {item.tax_number !== "" ?
                                <View style={{ marginTop: 8 }}>
                                    <TextNormalYambi text={strings.tax_number} styles={{ textAlign: 'right', marginBottom: 3 }} />
                                    <TextNormalYambiGray text={item.tax_number} styles={{ textAlign: 'right' }} />
                                </View> : null}
                        </View>
                    </View>

                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: 10,
                        marginBottom: 7
                    }}>

                        {sells_points.length > 0 ?
                            <TextNormalYambi text={strings.sells_points} styles={{}} /> : null}

                        <Pressable
                            onPress={() => {
                                if (conditionGoUsers()) {
                                    RootNavigation.navigate("UserBusinessUsers", { business_id: item._id });
                                }
                            }}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                            <TextNormalYambiHighColor text={strings.see_users} />
                            <IconApp pack='FI' name='chevron-right' size={20} color={app_theme.colors.high_color} />
                        </Pressable>
                    </View>
                </View>

                <FlashList
                    data={sells_points as never}
                    estimatedItemSize={150}
                    renderItem={({ item, index }: { item: TSellsPoint, index: number }) => (<SellsPointsList index={index} item={item} show_sell={true} show_users={true} show_edit={false} />)}
                />
            </View>
        );
    } else if (isAdmin) {
        return (
            <Pressable
                onPress={() => RootNavigation.navigate("BusinessViewModern", { business: item })}
                style={{
                    marginVertical: 15
                }}>
                <View style={{
                    flexDirection: 'row',
                    flex: 1
                }}>
                    <Pressable onPress={ViewPhoto} style={{
                        width: 45,
                        height: 45,
                        borderRadius: 40,
                        borderWidth: 1,
                        borderColor: app_theme.colors.border,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 15,
                        marginTop: 7
                    }}>
                        {item.logo === "" ?
                            <ExpoImage
                                style={{
                                    width: 30,
                                    height: 30
                                }}
                                contentFit="contain"
                                source={require("./../../../assets/budget.png")} />
                            :
                            <ExpoImage
                                style={{
                                    width: 45,
                                    height: 45,
                                    borderRadius: 45
                                }}
                                contentFit="contain"
                                source={media_url + "/business_logos/" + item.logo} />}
                    </Pressable>
                    <View style={{ flex: 1 }}>
                        <TextNormalYambi text={item.business_name} bold />
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            {/* <TextNormalYambiGray text="ID: " /> */}
                            <TextNormalYambi text={item._id} styles={{ flex: 1 }} />

                            <Pressable style={{
                                flexDirection: 'row',
                                alignItems: 'center'
                            }}>
                                <TextNormalYambiHighColor styles={{ marginRight: 5 }} numberLines={1} text={strings.edit} />
                                <IconApp pack='FI' name='edit' size={15} color={app_theme.colors.high_color} />
                            </Pressable>
                        </View>
                        <TextNormalYambiGray text={item.description_service} />

                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between'
                        }}>
                            <View style={{
                                flexDirection: 'row',
                            }}>
                                <TextNormalYambiHighColor text={strings.active_subscription} />
                                <IconApp pack='FI' name='chevron-right' size={20} color={app_theme.colors.high_color} />
                            </View>
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center'
                            }}>
                                <IconApp pack='FA' name='circle' size={5} color={app_theme.colors.high_color} />
                                <TextNormalYambiHighColor styles={{ marginLeft: 5 }} text={item.valid_until + "15/05/2025"} />
                            </View>
                        </View>
                    </View>
                </View>
            </Pressable>
        )
    }
    else {
        return null;
    }
}

export default memo(BusinessesList);

