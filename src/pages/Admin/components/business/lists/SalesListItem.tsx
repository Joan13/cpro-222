import React, { memo } from 'react';
import { View } from 'react-native';
import { TSale } from '../../../../../types/types';
import { useAppSelector } from '../../../../../store/app/hooks';
import { TextNormalYambi, TextNormalYambiError, TextSmallYambi, TextSmallYambiError, TextSmallYambiGray, TextSmallYambiSuccess } from '../../../../../components/app/Text';
import { IconApp } from '../../../../../components/app/IconApp';
import { renderCurrency, renderDateTime } from '../../../../../../GlobalVariables';
import { strings } from '../../../../../lang/lang';
import { useObject, useRealm } from '@realm/react';
import { UserBusinessArticles } from '../../../../../store/database/Models';
import { getSalePaymentDetails } from '../../../../../utils/paymentHelpers';
import Feather from 'react-native-vector-icons/Feather';

interface SalesListItemProps {
    item: TSale;
    index: number;
}

const SalesListItem = memo(({ item, index }: SalesListItemProps) => {
    const app_theme = useAppSelector(state => state.app_theme);
    const realm = useRealm();
    const article = useObject(UserBusinessArticles, item.item_id);
    const { isPaid } = getSalePaymentDetails(item, realm);

    const sellingPriceVal = parseFloat(item.selling_price || '0');
    const costPriceVal = parseFloat(item.cost_price || '0');
    const pp = sellingPriceVal - costPriceVal;
    const pp2 = pp / (sellingPriceVal || 1);
    const profit = pp2 ? pp2 * 100 : 0;

    const showBuyer = item.buyer_name && item.buyer_name !== '';

    return (
        <View
            style={{
                borderColor: app_theme.colors.border,
                paddingVertical: 15,
                paddingHorizontal: 15,
                backgroundColor: index % 2 === 0 ? app_theme.colors.background : app_theme.colors.border,
                borderBottomWidth: 1,
            }}
        >
            <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                <View style={{ flex: 6 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TextNormalYambi 
                            text={article ? article.item_name : `Item ID: ${item.item_id}`} 
                            styles={{ flex: 1 }} 
                        />
                        {item.sale_active === 1 && (
                            <View style={{ borderRadius: 15, paddingVertical: 2, paddingHorizontal: 10 }}>
                                {profit > 0 ? (
                                    <TextSmallYambiSuccess text={"+" + (profit.toFixed(2) + " %")} />
                                ) : (
                                    <TextSmallYambiError text={(profit.toFixed(2) + " %")} />
                                )}
                            </View>
                        )}
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <TextSmallYambiGray text={renderDateTime(item.createdAt, 1, false)} />
                        {!isPaid && (
                            <View style={{
                                backgroundColor: app_theme.colors.error + '18',
                                paddingHorizontal: 8,
                                paddingVertical: 2,
                                borderRadius: 10,
                                flexDirection: 'row',
                                alignItems: 'center'
                            }}>
                                <Feather name="alert-circle" size={10} color={app_theme.colors.error} style={{ marginRight: 4 }} />
                                <TextSmallYambiError text={strings.debt || "Debt"} styles={{ fontSize: 10 }} />
                            </View>
                        )}
                        {item.sale_active === 1 && item.agent_paid === "" && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 'auto' }}>
                                <TextSmallYambi text={strings.cash.toLowerCase()} styles={{ marginRight: 3 }} numberLines={1} />
                                <IconApp pack="MC" name="check-all" size={17} color={isPaid ? app_theme.colors.high_color : app_theme.colors.gray} />
                            </View>
                        )}
                    </View>

                    <TextSmallYambiGray text={`${strings.seller} : ${item.sale_operator}`} styles={{ marginTop: 4 }} />
                </View>

                <View style={{ flex: 1, alignItems: 'center' }}>
                    <TextSmallYambi text={item.number.toString()} />
                </View>

                <View style={{ flex: 2, alignItems: 'center' }}>
                    <TextSmallYambi text={(sellingPriceVal * item.number).toFixed(2)} />
                    <TextSmallYambiGray text={sellingPriceVal.toFixed(2)} />
                </View>

                <View style={{ flex: 1, alignItems: 'center' }}>
                    <TextSmallYambi text={renderCurrency(item.currency, false)} />
                </View>
            </View>

            {showBuyer && (
                <TextSmallYambiGray 
                    text={`${strings.buyer} : ${item.buyer_name} (${item.buyer_phone})`} 
                    styles={{ marginTop: 6 }} 
                />
            )}

            {item.sale_active === 0 && (
                <TextNormalYambiError 
                    text={strings.sale_cancelled_by_user} 
                    numberLines={1} 
                    styles={{ marginTop: 6 }} 
                />
            )}
        </View>
    );
});

export default SalesListItem;
