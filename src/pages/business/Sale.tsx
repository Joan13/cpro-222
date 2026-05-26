import { ActivityIndicator, FlatList, Button, Text, Pressable, View, Alert, Image, ScrollView } from "react-native";
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from "@react-navigation/native";
import { useCallback, useEffect, useState } from 'react';
import { NavProps, TBusiness, TSale, TSellsPoint } from "../../types/types";
import { strings } from "../../lang/lang";
import ButtonNormal from "../../components/app/ButtonNormal";
import { IconApp } from "../../components/app/IconApp";
import { useAppDispatch, useAppSelector } from "../../store/app/hooks";
import * as RootNavigation from './../../services/Navigation_ref';
import { useObject, useQuery, useRealm } from "@realm/react";
import { BusinessItemsSale, UserBusinesses, UserSellsPoints } from "../../store/database/Models";
import { setShowModalApp } from "../../store/reducers/appSlice";
import { TextBigYambi, TextNormalYambi, TextNormalYambiGray, TextSmallYambi, TextSmallYambiGray } from "../../components/app/Text";
import ModalApp from "../../components/app/ModalApp";
import { FlashList } from "@shopify/flash-list";
import BusinessesList from "../../components/lists/business/BusinessesList";
import { renderCurrency, renderDateTime, SocketApp } from "../../../GlobalVariables";
import RNPrint from 'react-native-print';
// import { SocketApp } from "../../../App";
import moment from "moment";

const Sale = ({ navigation, route }: NavProps) => {

    const app_theme = useAppSelector(state => state.app_theme);
    const loading_app = useAppSelector(state => state.app.loading);
    const user_data = useAppSelector(state => state.user_data);
    // const [sala, setSala] = useState<TSale>();
    const [showInfo, setShowInfo] = useState<boolean>(false);
    const dispatch = useAppDispatch();
    const realm = useRealm();
    // const businesses = useAppSelector(state => state.businesses);
    // const businesses = [];

    const { item } = route.params;
    const { sale } = route.params;
    const business = useObject(UserBusinesses, item.business_id);
    const sala = useObject(BusinessItemsSale, sale._id);

    if (sala === null) return;
    const sales_point = useObject(UserSellsPoints, sale.sales_point_id);
    const { prices } = route.params;

    if (business === null || sales_point === null) return;

    const tva_rate = (parseInt(sales_point?.tva) || 16) / 100;
    const totalPrice = parseFloat(sale.selling_price) * sale.number;
    const tva = totalPrice * tva_rate;
    const tht = totalPrice - tva;

    const PrintInvoice = async () => {
        await RNPrint.print({
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body { 
                            font-family: 'Courier New', monospace; 
                            padding: 20px;
                            max-width: 800px;
                            margin: 0 auto;
                            background: white;
                        }
                        .receipt-container { 
                            border: 2px solid #333;
                            padding: 30px;
                            background: white;
                        }
                        .header { 
                            text-align: center;
                            border-bottom: 2px dashed #333;
                            padding-bottom: 20px;
                            margin-bottom: 25px;
                        }
                        .header h1 { 
                            font-size: 28px;
                            margin-bottom: 10px;
                            text-transform: uppercase;
                        }
                        .header-info { 
                            font-size: 13px;
                            line-height: 1.6;
                            color: #555;
                        }
                        .section-title {
                            font-size: 16px;
                            font-weight: bold;
                            margin: 20px 0 10px 0;
                            text-transform: uppercase;
                            border-bottom: 1px solid #ddd;
                            padding-bottom: 5px;
                        }
                        table { 
                            width: 100%;
                            border-collapse: collapse;
                            margin: 15px 0;
                        }
                        th, td { 
                            padding: 12px;
                            text-align: left;
                            border-bottom: 1px solid #ddd;
                        }
                        th { 
                            background-color: #f8f8f8;
                            font-weight: bold;
                            text-transform: uppercase;
                            font-size: 12px;
                        }
                        td { font-size: 14px; }
                        .text-right { text-align: right; }
                        .text-center { text-align: center; }
                        .item-name { font-weight: bold; }
                        .summary {
                            margin-top: 25px;
                            border-top: 2px solid #333;
                            padding-top: 15px;
                        }
                        .summary-row {
                            display: flex;
                            justify-content: space-between;
                            padding: 8px 0;
                            font-size: 14px;
                        }
                        .summary-row.total {
                            font-size: 18px;
                            font-weight: bold;
                            border-top: 2px solid #333;
                            margin-top: 10px;
                            padding-top: 15px;
                        }
                        .info-section {
                            margin: 25px 0;
                            padding: 15px;
                            background: #f8f8f8;
                            border-radius: 5px;
                        }
                        .info-row {
                            display: flex;
                            justify-content: space-between;
                            padding: 5px 0;
                            font-size: 13px;
                        }
                        .info-label { 
                            font-weight: bold;
                            color: #555;
                        }
                        .footer {
                            text-align: center;
                            margin-top: 30px;
                            padding-top: 20px;
                            border-top: 2px dashed #333;
                        }
                        .footer h2 {
                            font-size: 32px;
                            margin-bottom: 10px;
                        }
                        .footer p {
                            font-size: 14px;
                            color: #666;
                        }
                    </style>
                </head>
                <body>
                    <div class="receipt-container">
                        <div class="header">
                            <h1>${business.business_name}</h1>
                            <div class="header-info">
                                <div>${business.national_number}</div>
                                <div>${business.national_id}</div>
                                <div>${business.business_address}</div>
                                <div>${business.phones}${business.emails ? ' | ' + business.emails : ''}</div>
                            </div>
                        </div>

                        <div class="section-title">${strings.invoice_details}</div>
                        <table>
                            <thead>
                                <tr>
                                    <th>${strings.item_name}</th>
                                    <th class="text-center">${strings.quantity_small}</th>
                                    <th class="text-right">${strings.price}</th>
                                    <th class="text-center">${strings.currency_small}</th>
                                    <th class="text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td class="item-name">${item.item_name.toUpperCase()}</td>
                                    <td class="text-center">${sale.number}</td>
                                    <td class="text-right">${parseFloat(sale.selling_price).toFixed(2)}</td>
                                    <td class="text-center">${renderCurrency(sale.currency, false)}</td>
                                    <td class="text-right">${totalPrice.toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>

                        <div class="summary">
                            <div class="summary-row">
                                <span>${strings.subtotal} (HT):</span>
                                <span>${tht.toFixed(2)} ${renderCurrency(sale.currency, false)}</span>
                            </div>
                            <div class="summary-row">
                                <span>TVA (${(tva_rate * 100).toFixed(0)}%):</span>
                                <span>${tva.toFixed(2)} ${renderCurrency(sale.currency, false)}</span>
                            </div>
                            <div class="summary-row total">
                                <span>Total (TTC):</span>
                                <span>${totalPrice.toFixed(2)} ${renderCurrency(sale.currency, false)}</span>
                            </div>
                        </div>

                        <div class="info-section">
                            <div class="info-row">
                                <span class="info-label">${strings.Date}:</span>
                                <span>${renderDateTime(sale.createdAt, 2, false)}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">${strings.seller}:</span>
                                <span>${sale.sale_operator}</span>
                            </div>
                            ${sale.buyer_name ? `
                            <div class="info-row">
                                <span class="info-label">${strings.buyer}:</span>
                                <span>${sale.buyer_name}${sale.buyer_phone ? ' (' + sale.buyer_phone + ')' : ''}</span>
                            </div>
                            ` : ''}
                        </div>

                        <div class="footer">
                            <h2>KARIBU!</h2>
                            <p>${strings.thank_you_business}</p>
                        </div>
                    </div>
                </body>
                </html>
                `
        });
    };

    useEffect(() => {
        navigation.setOptions({ title: strings.sale_id + "" + sale._id });
    }, [sale]);

    const MakeInvoiceAsPaid = () => {
        const salee: TSale = {
            _id: sale._id,
            item_id: sale.item_id,
            business_id: sale.business_id,
            number: sale.number,
            sale_operator: sale.sale_operator,
            sales_point_id: sale.sales_point_id,
            cost_price: sale.cost_price,
            selling_price: sale.selling_price,
            delivery_price: sale.delivery_price,
            delivery_address: sale.delivery_address,
            delivery_time: sale.delivery_time,
            delivery_status: sale.delivery_status,
            discount_price: sale.discount_price,
            type_sale: 0,
            buyer_name: sale.buyer_name,
            buyer_phone: sale.buyer_phone,
            currency: sale.currency,
            country: sale.country,
            description: sale.description,
            agent_paid: user_data.phone_number,
            uploaded: 0,
            sale_active: sale.sale_active,
            createdAt: sale.createdAt,
            updatedAt: moment(new Date()).format()
        }

        realm.write(() => {
            try {
                realm.create('BusinessItemsSale', salee, true);
            } catch (error) { }

            SocketApp.emit("newSales", JSON.stringify({ phone_number: user_data.phone_number, items: [salee] }));
        });
    }

    const InvoiceHeader = () => {
        return (
            <View
                style={{
                    borderColor: app_theme.colors.border,
                    backgroundColor: app_theme.colors.background,
                    borderTopWidth: 1,
                    borderBottomWidth: 1,
                    paddingHorizontal: 15,
                    width: '100%'
                }}>
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    // flex:1
                }}>
                    <View style={{
                        flex: 6
                    }}>
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            // paddingLeft: 15
                        }}>
                            <TextSmallYambi bold text={strings.item_name} numberLines={1} />
                        </View>
                    </View>

                    <View style={{
                        borderLeftWidth: 1,
                        borderRightWidth: 1,
                        borderColor: app_theme.colors.border,
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: 40
                    }}>
                        <TextSmallYambi bold text={strings.quantity_small} />
                    </View>

                    <View style={{
                        borderRightWidth: 1,
                        borderColor: app_theme.colors.border,
                        flex: 2,
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: 40
                    }}>
                        <TextSmallYambi bold text={strings.price} />
                    </View>

                    <View style={{
                        borderLeftWidth: 0,
                        borderColor: app_theme.colors.border,
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: 40
                    }}>
                        <TextSmallYambi bold text={strings.currency_small} />
                    </View>
                </View>
            </View>
        )
    }

    // console.log(prices)

    return (
        <View style={{
            flex: 1,
            backgroundColor: app_theme.colors.background,
            borderTopWidth: 1,
            borderColor: app_theme.colors.border
        }}>
            <ScrollView style={{ width: '100%' }}>
                <View style={{
                    backgroundColor: app_theme.colors.border,
                    padding: 20,
                    margin: 15,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: app_theme.colors.border,
                }}>
                    <TextBigYambi styles={{ marginVertical: 8, textAlign: 'center' }} bold text={business.business_name} />
                    <TextSmallYambi styles={{ marginVertical: 3, textAlign: 'center' }} text={business.national_number} />
                    <TextSmallYambi styles={{ marginVertical: 3, textAlign: 'center' }} text={business.national_id} />
                    <TextSmallYambiGray styles={{ marginVertical: 2, textAlign: 'center' }} text={business.business_address} />
                    <TextSmallYambiGray styles={{ marginVertical: 2, textAlign: 'center' }} text={business.phones} />
                </View>

                <View style={{
                    backgroundColor: app_theme.colors.border,
                    margin: 15,
                    marginTop: 0,
                    borderRadius: 12,
                    overflow: 'hidden'
                }}>
                    <InvoiceHeader />

                    <View style={{
                        paddingHorizontal: 15,
                        paddingVertical: 15,
                        backgroundColor: app_theme.colors.background,
                    }}>
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                        }}>
                            <View style={{ flex: 6 }}>
                                <TextNormalYambi bold text={item.item_name.toUpperCase()} numberLines={1} />
                            </View>
                            <View style={{ flex: 1, alignItems: 'center' }}>
                                <TextSmallYambi text={sale.number.toString()} />
                            </View>
                            <View style={{ flex: 2, alignItems: 'center' }}>
                                <TextSmallYambi text={parseFloat(sale.selling_price).toFixed(2)} />
                                <TextSmallYambiGray text={totalPrice.toFixed(2)} />
                            </View>
                            <View style={{ flex: 1, alignItems: 'center' }}>
                                <TextSmallYambi bold text={renderCurrency(prices.currency, false)} />
                            </View>
                        </View>
                    </View>
                </View>

                <View style={{
                    backgroundColor: app_theme.colors.border,
                    margin: 15,
                    padding: 15,
                    borderRadius: 12,
                }}>
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        paddingVertical: 8,
                    }}>
                        <TextSmallYambiGray text={`${strings.subtotal} (HT)`} />
                        <TextNormalYambi bold text={`${tht.toFixed(2)} ${renderCurrency(sale.currency, false)}`} />
                    </View>
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        paddingVertical: 8,
                    }}>
                        <TextSmallYambiGray text={`TVA (${(tva_rate * 100).toFixed(0)}%)`} />
                        <TextNormalYambi bold text={`${tva.toFixed(2)} ${renderCurrency(sale.currency, false)}`} />
                    </View>
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        paddingVertical: 12,
                        borderTopWidth: 2,
                        borderColor: app_theme.colors.high_color,
                        marginTop: 8,
                    }}>
                        <TextNormalYambi bold text="Total (TTC)" />
                        <TextBigYambi bold text={`${totalPrice.toFixed(2)} ${renderCurrency(sale.currency, false)}`} styles={{ color: app_theme.colors.high_color }} />
                    </View>
                </View>

                <View style={{
                    backgroundColor: app_theme.colors.border,
                    margin: 15,
                    padding: 15,
                    borderRadius: 12,
                }}>
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        paddingVertical: 5,
                    }}>
                        <TextSmallYambiGray text={strings.Date} />
                        <TextSmallYambi bold text={renderDateTime(sale.createdAt, 2, false)} />
                    </View>
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        paddingVertical: 5,
                    }}>
                        <TextSmallYambiGray text={strings.sale_operator} />
                        <TextSmallYambi bold text={sale.sale_operator} />
                    </View>
                    {sale.buyer_name && (
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            paddingVertical: 5,
                            borderTopWidth: 1,
                            borderColor: app_theme.colors.background,
                            marginTop: 8,
                            paddingTop: 13,
                        }}>
                            <TextSmallYambiGray text={strings.buyer} />
                            <TextSmallYambi bold text={sale.buyer_name} />
                        </View>
                    )}
                    {sale.buyer_phone && (
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            paddingVertical: 5,
                        }}>
                            <TextSmallYambiGray text={strings.phone_number} />
                            <TextSmallYambi bold text={sale.buyer_phone} />
                        </View>
                    )}
                </View>

                {/* <View style={{
                borderTopWidth: 1,
                width: '100%',
                borderColor: app_theme.colors.border,
                // marginVertical: 20,
                paddingVertical: 20,
                paddingLeft: 15
            }}>
                <TextSmallYambi styles={{ marginVertical: 7 }} bold text={strings.karibu} /> */}

                {/* <Text style={{
                    color: app_theme.colors.text,
                    fontSize: 25,
                    textAlign: 'center',
                    marginVertical: 30,
                    fontWeight: '900'
                }}>
                    {strings.karibu}
                </Text> */}

                <View style={{
                    alignItems: 'center',
                    paddingVertical: 30,
                }}>
                    <Text style={{
                        color: app_theme.colors.text,
                        fontSize: 32,
                        fontWeight: '900',
                    }}>
                        {strings.karibu}
                    </Text>
                    <TextSmallYambiGray text={strings.thank_you_business} styles={{ marginTop: 5 }} />
                </View>
            </ScrollView>

            <View style={{
                padding: 15,
                backgroundColor: app_theme.colors.background,
                borderTopWidth: 1,
                borderColor: app_theme.colors.border,
            }}>
                {sala.type_sale === 1 ?
                    <ButtonNormal title={strings.mark_invoice_as_paid} loadEnabled={true} onPress={MakeInvoiceAsPaid} styles={{}} normal={true} />
                    :
                    <ButtonNormal title={strings.print} loadEnabled={true} onPress={PrintInvoice} styles={{}} normal={true} />
                }
            </View>
        </View>
    )
}

export default Sale;
