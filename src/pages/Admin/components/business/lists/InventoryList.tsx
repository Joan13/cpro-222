import React, { memo } from 'react';
import { View, Image } from 'react-native';
import { TItem } from '../../../../../types/types';
import { useAppSelector } from '../../../../../store/app/hooks';
import { TextNormalYambi, TextSmallYambi } from '../../../../../components/app/Text';
import { IconApp } from '../../../../../components/app/IconApp';
import { renderCurrency, media_url } from '../../../../../../GlobalVariables';
import { useObject } from '@realm/react';
import { ItemPrices } from '../../../../../store/database/Models';

interface InventoryListProps {
    item: TItem;
    index: number;
    business_id: string;
}

const InventoryList = memo(({ item, business_id }: InventoryListProps) => {
    const app_theme = useAppSelector(state => state.app_theme);
    const prices = useObject(ItemPrices, "G" + item._id);

    if (item.item_active !== 1) return null;

    return (
        <View
            style={{
                marginHorizontal: 15,
                marginVertical: 6,
                backgroundColor: app_theme.colors.background,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: app_theme.colors.border,
                overflow: 'hidden',
                padding: 15,
            }}>
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
                            // ignore
                        }
                        return <IconApp pack="FI" name="package" size={24} color={app_theme.colors.high_color} />;
                    })()}
                </View>

                <View style={{ flex: 1 }}>
                    <TextNormalYambi bold text={item.item_name} numberLines={1} styles={{ marginBottom: 2 }} />
                    {prices && (
                        <TextSmallYambi
                            text={prices.retail_selling_price + " " + renderCurrency(prices.currency, true)}
                        />
                    )}
                </View>
            </View>

            {/* Stock Information (Without restrictions and alerts) */}
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                {/* In Store Stock */}
                <View style={{
                    backgroundColor: app_theme.colors.border,
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
                        name="check-circle" 
                        size={12} 
                        color={app_theme.colors.high_color} 
                    />
                    <TextSmallYambi 
                        text={`${item.items_number_stock} in store`} 
                        styles={{ 
                            marginLeft: 4, 
                            color: app_theme.colors.text, 
                            fontSize: 11 
                        }} 
                    />
                </View>

                {/* Warehouse Stock */}
                <View style={{
                    backgroundColor: app_theme.colors.border,
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
                        name="archive" 
                        size={12} 
                        color={app_theme.colors.high_color} 
                    />
                    <TextSmallYambi 
                        text={`${item.items_number_warehouse} in warehouse`} 
                        styles={{ 
                            marginLeft: 4, 
                            color: app_theme.colors.text, 
                            fontSize: 11 
                        }} 
                    />
                </View>
            </View>
        </View>
    );
});

export default InventoryList;
