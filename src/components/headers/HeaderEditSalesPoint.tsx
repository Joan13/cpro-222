import { View, TouchableOpacity, ActivityIndicator, Text } from "react-native"
import { useAppDispatch, useAppSelector } from "../../store/app/hooks";
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Feather from 'react-native-vector-icons/Feather';
import { setLoadingButton, setSearchContactEnabled, setShowModalApp } from "../../store/reducers/appSlice";
// import { SocketApp } from "../../../App";
import { NavProps, TItem } from "../../types/types";
import { IconApp } from "../app/IconApp";
import { useObject, useQuery, useRealm } from "@realm/react";
import moment from "moment";
import { strings } from "../../lang/lang";
import { TextNormalYambiGray, TextSmallYambiError } from "../app/Text";
import ModalApp from "../app/ModalApp";
import { useState } from "react";
import Animated, { BounceIn } from "react-native-reanimated";
import axios from "axios";
import { remote_host } from "../../../GlobalVariables";
import { BusinessItemsSale, BusinessUsers, UserBusinessArticles, UserSellsPoints } from "../../store/database/Models";
const HeaderEditSalesPoint = ({ navigation, route }: NavProps) => {

    const theme = useAppSelector(state => state.app_theme);
    const user_data = useAppSelector(state => state.user_data);
    const [showInternetError, setShowInternetError] = useState<boolean>(false);
    const [confirm_delete, setConfirm_delete] = useState(false);
    const [item_deleted, setItem_deleted] = useState(false);
    const dispatch = useAppDispatch();
    const { sales_point } = route.params;
    const realm = useRealm();

    const to_del = useObject(UserSellsPoints, sales_point._id);

    const to_del_users = useQuery(
        BusinessUsers, users => {
            return users.filtered('sales_point_id == $0 && user == $1', sales_point._id, user_data.phone_number)
        }, []);

    // const to_del_userss = useQuery(
    //     BusinessUsers, users => {
    //         return users.filtered('business_id == $0', sales_point.business_id)
    //     }, []);

    const to_del_sales = useQuery(
        BusinessItemsSale, items => {
            return items.filtered('sales_point_id == $0', sales_point._id);
        }, []);


    const DeletePointOfSales = () => {

        // const sells_point = {
        //     _id: sales_point._id,
        //     business_id: sales_point.business_id,
        //     phone_number: sales_point.phone_number,
        //     sells_point_name: sales_point.sells_point_name,
        //     slogan: sales_point.slogan,
        //     description_service: sales_point.description_service,
        //     category: sales_point.category,
        //     keywords: sales_point.keywords,
        //     logo: sales_point.logo,
        //     phones: sales_point.emails,
        //     emails: sales_point.phones,
        //     background: sales_point.background,
        //     sells_point_active: sales_point.sells_point_active,
        //     sells_point_address: sales_point.address,
        //     sells_point_visible: sales_point.sells_point_visible,
        //     website: sales_point.website,
        //     other_links: sales_point.other_links,
        //     yambi: sales_point.yambi,
        //     notifications: sales_point.notifications,
        //     createdAt: sales_point.createdAt,
        //     updatedAt: sales_point.updatedAt
        // }

        axios.post(remote_host + "/yambi/API/edit_sales_point", { sales_point: to_del, flag: "0" })
            .then(json => {

                if (json.data.success === "1") {
                    realm.write(() => {
                        try {
                            realm.delete(to_del);
                        } catch (error) { }

                        try {
                            realm.delete(to_del_sales);
                        } catch (error) { }

                        try {
                            realm.delete(to_del_users);
                        } catch (error) { }
                    });

                    navigation.goBack();
                }

                dispatch(setLoadingButton(false));

                // setTimeout(() => {
                //     navigation.goBack();
                // }, 300);
            })
            .catch(error => {
                setShowInternetError(true);
                dispatch(setShowModalApp(true));
                dispatch(setLoadingButton(false));
            })
    }

    return (
        <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
        }}>

            {confirm_delete ?
                <ModalApp onCancel={() => { dispatch(setShowModalApp(false)); setConfirm_delete(false) }} onClose={() => { dispatch(setShowModalApp(false)); setConfirm_delete(false) }} singleButton={false} textAction={strings.confirm} onAction={DeletePointOfSales} title={strings.delete_sales_point}>
                    <View>
                        {!item_deleted ?
                            <>
                                <TextNormalYambiGray text={strings.delete_sales_point_text} />
                                <TextSmallYambiError text={strings.delete_sales_point_nb} styles={{ marginTop: 20 }} />
                            </>
                            :
                            <Animated.View entering={BounceIn}>
                                <IconApp pack="FA" name="check-circle" size={50} color={theme.colors.text} />
                            </Animated.View>}
                    </View>
                </ModalApp> : null}

            {showInternetError ?
                <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowInternetError(false) }} singleButton title={strings.error}>
                    <TextNormalYambiGray text={strings.connection_failed} />
                </ModalApp> : null}

            <TouchableOpacity
                onPress={() => { dispatch(setShowModalApp(true)); setConfirm_delete(true) }}
                style={{
                    height: 30,
                    width: 30,
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    marginLeft: 5
                }}>
                <IconApp pack="MT" name="delete" size={20} color={theme.colors.text_design1} />
            </TouchableOpacity>
        </View>
    )
}

export default HeaderEditSalesPoint;
