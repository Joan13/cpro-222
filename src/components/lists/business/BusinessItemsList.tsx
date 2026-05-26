import { Pressable, View, Image } from "react-native";
import { TItem } from "../../../types/types";
import { useAppSelector } from "../../../store/app/hooks";
import { memo } from 'react';
import { TextNormalYambi, TextNormalYambiError, TextNormalYambiHighColor, TextNormalYambiHighColor2, TextNormalYambiSuccess, TextSmallYambi, TextSmallYambiError, TextSmallYambiGray, TextSmallYambiHighColor, TextSmallYambiHighColor3, TextSmallYambiSuccess } from "../../app/Text";
import { IconApp } from "../../app/IconApp";
import { renderCurrency, renderDateTime, remote_host_server, media_url } from "../../../../GlobalVariables";
import { strings } from "../../../lang/lang";
import { useObject, useQuery } from "@realm/react";
import { BusinessItemsSale, ItemPrices } from "../../../store/database/Models";
import * as RootNavigation from '../../../services/Navigation_ref';

const BusinessItemsList = ({ item, index, business_id, onSelectItem, flag, can_upload_images, locked = false }: { item: TItem, business_id: string, index: number, flag: number, onSelectItem, can_upload_images?: boolean, locked?: boolean }) => {
    const app_theme = useAppSelector(state => state.app_theme);
    const prices = useObject(ItemPrices, "G" + item._id);

    if (prices === null) return;

    const SS = useQuery(
        BusinessItemsSale, bss => {
            return bss.filtered('item_id == $0 && sale_active==$1', item._id, 1)
        }, []);

    const bs = useQuery(
        BusinessItemsSale, bss => {
            return bss.filtered('business_id == $0 && sale_active==$1 && currency==$2', business_id, 1, prices.currency)
        }, []);

    let BCP: string = "0";
    let BSP: string = "0";
    let BNS: string = "0";

    // const SS = is.filter(sale => sale.currency === currency);

    for (let i in bs) {
        if (bs[i].cost_price) {
            BCP = (parseFloat(BCP) + (parseFloat(bs[i].cost_price) * bs[i].number)).toString();
        }

        if (bs[i].selling_price) {
            BSP = (parseFloat(BSP) + (parseFloat(bs[i].selling_price) * bs[i].number)).toString();
        }

        if (bs[i].number) {
            BNS = (parseInt(BNS) + (bs[i].number)).toString();
        }
    }

    // let pp = (parseFloat(item.selling_price) - (parseFloat(item.cost_price)));
    // let pp2 = pp / parseFloat(item.selling_price);
    // let profit = pp2 ? pp2 * 100 : 0;

    let CP: string = "0";
    let SP: string = "0";
    let NS: string = "0";
    let pl: number = 0;

    // const SS = is.filter(sale => sale.currency === currency);

    for (let i in SS) {
        if (SS[i].cost_price) {
            CP = (parseFloat(CP) + (parseFloat(SS[i].cost_price) * SS[i].number)).toString();
        }

        if (SS[i].selling_price) {
            SP = (parseFloat(SP) + (parseFloat(SS[i].selling_price) * SS[i].number)).toString();
        }

        if (SS[i].number) {
            NS = (parseInt(NS) + (SS[i].number)).toString();

            if (SS[i].sale_active === 1) {
                pl = pl + SS[i].number;
            }
        }
    }

    let bpp = (parseFloat(BSP) - (parseFloat(BCP)));
    // let bpp2 = bpp / parseFloat(BSP);

    let pp = (parseFloat(SP) - (parseFloat(CP)));
    let pp2 = pp / parseFloat(SP);
    let profit = pp2 ? pp2 * 100 : 0;

    let bprofit = pp / bpp;
    let profitt = bprofit * 100;

    const display_sales_number = () => {
        if (pl === 0) {
            return strings.no_sales;
        } else if (pl === 1) {
            return pl + " " + strings.sale.toLowerCase()
        } else {
            return pl + " " + strings.total_sales.toLowerCase()
        }
    }

    const first_activity = () => {
        if (SS.length === 0) {
            return null;
        } else {
            return strings.first_activity + ": " + renderDateTime(SS[0].createdAt, 1, true);
        }
    }

    const last_activity = () => {
        if (SS.length === 0) {
            return null;
        } else {
            return strings.last_activity + ": " + renderDateTime(SS[SS.length - 1].createdAt, 1, true)
        }
    }
    return (
        <Pressable
            disabled={locked}
            onPress={() => {
                if (!locked) onSelectItem(item, prices, flag);
            }}
            style={{
                marginHorizontal: 15,
                marginVertical: 6,
                backgroundColor: app_theme.colors.background,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: app_theme.colors.border,
                overflow: 'hidden',
                opacity: locked ? 0.75 : 1,
            }}>
            <View style={{
                padding: 15,
            }}>
                {locked && (
                    <View style={{
                        backgroundColor: app_theme.colors.error + '15',
                        borderColor: app_theme.colors.error + '35',
                        borderWidth: 1,
                        borderRadius: 8,
                        paddingHorizontal: 10,
                        paddingVertical: 8,
                        marginBottom: 10,
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}>
                        <IconApp pack="FI" name="lock" size={14} color={app_theme.colors.error} />
                        <TextSmallYambiError
                            text={strings.add_subscription_to_activate_locked_items}
                            styles={{ marginLeft: 8, flex: 1 }}
                        />
                    </View>
                )}

                {/* Header Row */}
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 10,
                }}>
                    {/* Item Image or Icon */}
                    <View style={{
                        height: 50,
                        width: 50,
                        borderRadius: 10,
                        backgroundColor: app_theme.colors.border,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 12,
                        overflow: 'hidden',
                    }}>
                        {(() => {
                            try {
                                if (item.images && item.images !== "" && item.images !== "[]") {
                                    const imagesArray = JSON.parse(item.images);
                                    if (imagesArray.length > 0) {
                                        return (
                                            <Image
                                                source={{ uri: media_url + "/items_images/" + imagesArray[0] }}
                                                style={{
                                                    height: '100%',
                                                    width: '100%',
                                                    resizeMode: 'cover',
                                                }}
                                            />
                                        );
                                    }
                                }
                            } catch (e) {
                                // If parsing fails, show default icon
                            }
                            return <IconApp pack="FI" name="package" size={24} color={app_theme.colors.high_color} />;
                        })()}
                    </View>

                    <View style={{ flex: 1 }}>
                        <TextNormalYambi bold text={item.item_name} numberLines={1} styles={{ marginBottom: 2 }} />
                        {flag === 0 ? (
                            <TextSmallYambiHighColor
                                text={prices.retail_selling_price + " " + renderCurrency(prices.currency, true)}
                                styles={{ fontSize: 15 }}
                            />
                        ) : (
                            <TextSmallYambi
                                text={prices.retail_selling_price + " " + renderCurrency(prices.currency, true)}
                            />
                        )}
                    </View>

                    {flag === 1 ? (
                        <View style={{
                            backgroundColor: app_theme.colors.high_color + '20',
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                            borderRadius: 8,
                        }}>
                            <TextSmallYambiHighColor text={display_sales_number()} styles={{ fontSize: 12 }} />
                        </View>
                    ) : flag !== 3 && !locked ? (
                        // Hide Edit button when flag === 3 (viewing from BusinessItem)
                        <Pressable
                            onPress={() => RootNavigation.navigate("EditBusinessItem", { item_id: item._id, business_id: business_id, can_upload_images })}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: app_theme.colors.border,
                                paddingHorizontal: 10,
                                paddingVertical: 6,
                                borderRadius: 8,
                            }}>
                            <IconApp pack="FI" name="edit" size={14} color={app_theme.colors.high_color} />
                            <TextSmallYambiHighColor styles={{ marginLeft: 5 }} text={strings.edit} />
                        </Pressable>
                    ) : null}
                </View>

                {/* Stock Badges */}
                <View style={{ marginBottom: 10 }}>
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                    }}>
                        {/* Store Stock Badge */}
                        <View style={{
                            backgroundColor: item.items_number_stock > 0 ? app_theme.colors.success + '20' : app_theme.colors.error + '20',
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 8,
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginRight: 8,
                            marginBottom: 4,
                        }}>
                            <IconApp 
                                pack="FI" 
                                name={item.items_number_stock > 0 ? "check-circle" : "alert-circle"} 
                                size={12} 
                                color={item.items_number_stock > 0 ? app_theme.colors.success : app_theme.colors.error} 
                            />
                            <TextSmallYambi 
                                text={item.items_number_stock.toString() + " " + strings.in_store.toLowerCase()} 
                                styles={{ 
                                    marginLeft: 5,
                                    color: item.items_number_stock > 0 ? app_theme.colors.success : app_theme.colors.error,
                                    fontSize: 12
                                }} 
                            />
                        </View>

                        {/* Warehouse Stock Badge */}
                        {item.items_number_warehouse > 0 && (
                            <View style={{
                                backgroundColor: app_theme.colors.high_color + '20',
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                borderRadius: 8,
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginBottom: 4,
                            }}>
                                <IconApp 
                                    pack="FI" 
                                    name="home" 
                                    size={12} 
                                    color={app_theme.colors.high_color} 
                                />
                                <TextSmallYambi 
                                    text={item.items_number_warehouse.toString() + " " + strings.in_warehouse.toLowerCase()} 
                                    styles={{ 
                                        marginLeft: 5,
                                        color: app_theme.colors.high_color,
                                        fontSize: 12
                                    }} 
                                />
                            </View>
                        )}
                    </View>
                </View>

                {/* Activity Info for Sales View */}
                {SS.length > 0 && flag === 1 && (
                    <View style={{
                        backgroundColor: app_theme.colors.border,
                        padding: 10,
                        borderRadius: 8,
                        marginBottom: 10,
                    }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                            <IconApp pack="FI" name="clock" size={12} color={app_theme.colors.gray} />
                            <TextSmallYambiGray text={first_activity() || ""} styles={{ marginLeft: 5, fontSize: 11 }} numberLines={1} />
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <IconApp pack="FI" name="activity" size={12} color={app_theme.colors.gray} />
                            <TextSmallYambiGray text={last_activity() || ""} styles={{ marginLeft: 5, fontSize: 11 }} numberLines={1} />
                        </View>
                    </View>
                )}

                {/* Profit Stats for Sales View */}
                {parseInt(display_sales_number()) > 0 && flag === 1 && (
                    <View style={{
                        borderTopWidth: 1,
                        borderColor: app_theme.colors.border,
                        paddingTop: 10,
                    }}>
                        {profit !== 0 && (
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginBottom: 5,
                            }}>
                                <IconApp
                                    pack="FI"
                                    name={profit > 0 ? "trending-up" : "trending-down"}
                                    size={14}
                                    color={profit > 0 ? app_theme.colors.high_color2 : app_theme.colors.error}
                                />
                                {profit > 0 ? (
                                    <TextSmallYambiHighColor text={"~" + profit.toFixed(2) + "% " + strings.profit_on_each_sale.toLowerCase()} styles={{ marginLeft: 5, fontSize: 12 }} />
                                ) : (
                                    <TextSmallYambiError text={"~" + profit.toFixed(2) + "% " + strings.profit_on_each_sale.toLowerCase()} styles={{ marginLeft: 5, fontSize: 12 }} />
                                )}
                            </View>
                        )}

                        {profitt !== 0 && (
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}>
                                <IconApp
                                    pack="FI"
                                    name="dollar-sign"
                                    size={14}
                                    color={profitt > 0 ? app_theme.colors.success : app_theme.colors.error}
                                />
                                {profitt > 0 ? (
                                    <TextSmallYambiSuccess
                                        text={"~" + profitt.toFixed(2) + "% " + strings.total_profit_sales.toLowerCase() + " " + strings.in.toLowerCase() + " " + renderCurrency(prices.currency, true)}
                                        styles={{ marginLeft: 5, fontSize: 12 }}
                                    />
                                ) : (
                                    <TextSmallYambiError
                                        text={"~" + profitt.toFixed(2) + "% " + strings.total_profit_sales.toLowerCase() + " " + strings.in.toLowerCase() + " " + renderCurrency(prices.currency, true)}
                                        styles={{ marginLeft: 5, fontSize: 12 }}
                                    />
                                )}
                            </View>
                        )}
                    </View>
                )}
            </View>
        </Pressable>
    );
}

export default memo(BusinessItemsList);

