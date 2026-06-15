import { View, Pressable } from "react-native"
import { useAppDispatch, useAppSelector } from "../../store/app/hooks";
import { setSearchContactEnabled, setShowModalApp } from "../../store/reducers/appSlice";
// import { SocketApp } from "../../../App";
import { NavProps, TItem } from "../../types/types";
import { IconApp } from "../app/IconApp";
import { useObject, useRealm } from "@realm/react";
import moment from "moment";
import { strings } from "../../lang/lang";
import { TextNormalYambiGray } from "../app/Text";
import ModalApp from "../app/ModalApp";
import { useEffect, useState } from "react";
import Animated, { BounceIn } from "react-native-reanimated";
import { UserBusinessArticles } from "../../store/database/Models";
import { SocketApp } from "../../../GlobalVariables";
const HeaderEditBusinessItem = ({ navigation, route }: NavProps) => {

    const theme = useAppSelector(state => state.app_theme);
    const [confirm_delete, setConfirm_delete] = useState(false);
    const [item_deleted, setItem_deleted] = useState(false);
    const user_data = useAppSelector(state => state.user_data);
    const dispatch = useAppDispatch();
    const { item_id } = route.params;
    const realm = useRealm();

    const itemm = useObject(UserBusinessArticles, item_id);

    const delete_business_item = () => {

        if (itemm === null) return;

        const item: TItem = {
            _id: itemm._id,
            business_id: itemm.business_id,
            phone_number: itemm.phone_number,
            item_name: itemm.item_name,
            slogan: itemm.slogan,
            item_type: itemm.item_type,
            category: itemm.category,
            subcategory: itemm.subcategory,
            manufacture_date: itemm.manufacture_date,
            expiry_date: itemm.expiry_date,
            wholesale_content_number: itemm.wholesale_content_number,
            items_number_stock: itemm.items_number_stock,
            items_number_warehouse: itemm.items_number_warehouse,
            description_item: itemm.description_item,
            keywords: itemm.keywords,
            images: itemm.images,
            background: itemm.background,
            supplier: itemm.supplier,
            other_information: itemm.other_information,
            alert_low_stock: itemm.alert_low_stock,
            item_active: 0,
            uploaded: itemm.uploaded,
            createdAt: itemm.createdAt,
            updatedAt: moment(new Date()).format(),
            colors: itemm.colors,
            discount_percentage: itemm.discount_percentage,
            discount_start_date: itemm.discount_start_date,
            discount_end_date: itemm.discount_end_date,
            marketplace_visibility: itemm.marketplace_visibility,
            weights: itemm.weights,
            sizes: itemm.sizes,
            flag: itemm.flag,
            is_best_seller: itemm.is_best_seller,
            visibility_rank: itemm.visibility_rank,
            is_featured: itemm.is_featured
        }

        realm.write(() => {
            try {
                realm.create('UserBusinessArticles', item, true);
            } catch (error) { }

            SocketApp.emit("newItems", JSON.stringify({ phone_number: user_data.phone_number, items: [item] }));
        });

        setItem_deleted(true);

        setTimeout(() => {
            navigation.goBack();
        }, 1000);
    }

    useEffect(() => {
        if (itemm !== null) {
            navigation.setOptions({ title: itemm.item_name });
        }
    }, [itemm]);

    return (
        <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            {confirm_delete ?
                <ModalApp onCancel={() => { dispatch(setShowModalApp(false)); setConfirm_delete(false) }} onClose={() => { dispatch(setShowModalApp(false)); setConfirm_delete(false) }} singleButton={false} textAction={strings.confirm} onAction={delete_business_item} title={strings.delete_item}>
                    <View>
                        {!item_deleted ?
                            <TextNormalYambiGray text={strings.delete_item_text} />
                            :
                            <Animated.View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }} entering={BounceIn}>
                                <IconApp pack="FA" name="check-circle" size={50} color={theme.colors.text} />
                            </Animated.View>}
                    </View>
                </ModalApp> : null}

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
            </Pressable>
        </View>
    )
}

export default HeaderEditBusinessItem;
