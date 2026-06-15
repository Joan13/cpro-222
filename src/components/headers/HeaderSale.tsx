import { View, Pressable, Text } from "react-native"
import { useAppDispatch, useAppSelector } from "../../store/app/hooks";
import { setShowModalApp } from "../../store/reducers/appSlice";
// import { SocketApp } from "../../../App";
import { NavProps, TItem, TSale } from "../../types/types";
import { IconApp } from "../app/IconApp";
import { useObject, useQuery, useRealm } from "@realm/react";
import moment from "moment";
import { strings } from "../../lang/lang";
import { TextNormalYambiGray, TextSmallYambiError } from "../app/Text";
import ModalApp from "../app/ModalApp";
import { useState } from "react";
import Animated, { BounceIn } from "react-native-reanimated";
import { BusinessUsers } from "../../store/database/Models";
import { SocketApp } from "../../../GlobalVariables";
const HeaderSale = ({ navigation, route }: NavProps) => {

    const theme = useAppSelector(state => state.app_theme);
    const [confirm_delete, setConfirm_delete] = useState(false);
    const [item_deleted, setItem_deleted] = useState(false);
    const user_data = useAppSelector(state => state.user_data);
    const dispatch = useAppDispatch();
    const { item } = route.params;
    const { sale } = route.params;
    const realm = useRealm();

    // const item = useObject(UserBusinessArticles, item._id);

    const uuser = useQuery(
        BusinessUsers, bss => {
            return bss.filtered('user == $0 && business_id == $1', user_data.phone_number, sale.business_id)
        }, []);

    const oo = uuser.find(element => element.user === user_data.phone_number);

    const delete_business_item = () => {

        if (oo !== null && oo !== undefined) {
            if (oo.user_active === 1) {

                const itemm = {
                    _id: item._id,
                    business_id: item.business_id,
                    phone_number: item.phone_number,
                    item_name: item.item_name,
                    slogan: item.slogan,
                    item_type: item.item_type,
                    category: item.category,
                    manufacture_date: item.manufacture_date,
                    expiry_date: item.expiry_date,
                    wholesale_content_number: item.wholesale_content_number,
                    items_number_stock: item.items_number_stock + sale.number,
                    items_number_warehouse: item.items_number_warehouse,
                    description_item: item.description_item,
                    keywords: item.keywords,
                    images: item.images,
                    background: item.background,
                    supplier: item.supplier,
                    other_information: item.other_information,
                    alert_low_stock: item.alert_low_stock,
                    item_active: 1,
                    uploaded: item.uploaded,
                    createdAt: item.createdAt,
                    updatedAt: moment(new Date()).format()
                } as TItem;

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
                    type_sale: sale.type_sale,
                    buyer_name: sale.buyer_name,
                    buyer_phone: sale.buyer_phone,
                    currency: sale.currency,
                    country: sale.country,
                    description: sale.description,
                    agent_paid: sale.agent_paid,
                    uploaded: 0,
                    sale_active: 0,
                    createdAt: sale.createdAt,
                    updatedAt: sale.updatedAt
                }

                realm.write(() => {
                    try {
                        realm.create('BusinessItemsSale', salee, true);
                    } catch (error) { console.log(error) }

                    try {
                        realm.create('UserBusinessArticles', itemm, true);
                    } catch (error) { console.log(error) }

                    SocketApp.emit("newItems", JSON.stringify({ phone_number: user_data.phone_number, items: [itemm] }));

                    SocketApp.emit("newSales", JSON.stringify({ phone_number: user_data.phone_number, items: [salee] }));
                });

                setItem_deleted(true);

                setTimeout(() => {
                    navigation.goBack();
                }, 1000);
            }
        }
    }

    return (
        <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            {confirm_delete ?
                <ModalApp onCancel={() => { dispatch(setShowModalApp(false)); setConfirm_delete(false) }} onClose={() => { dispatch(setShowModalApp(false)); setConfirm_delete(false) }} singleButton={false} textAction={strings.confirm} onAction={delete_business_item} title={strings.delete_sale}>
                    <View>
                        {!item_deleted ?
                            <View>
                                <TextNormalYambiGray text={strings.delete_sale_text} />
                                <TextSmallYambiError text={strings.delete_sale_nb} styles={{ marginTop: 15 }} />
                            </View>
                            :
                            <Animated.View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }} entering={BounceIn}>
                                <IconApp pack="FA" name="check-circle" size={50} color={theme.colors.text} />
                            </Animated.View>}
                    </View>
                </ModalApp> : null}

            {sale.sale_operator === user_data.phone_number ?
                <Pressable
                    onPress={() => { dispatch(setShowModalApp(true)); setConfirm_delete(true) }}
                    style={{
                        height: 30,
                        width: 30,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginLeft: 5
                    }}>
                    <IconApp pack="MT" name="delete" size={20} color={theme.colors.text_design1} />
                </Pressable> : null}
        </View>
    )
}

export default HeaderSale;
