import { View, Pressable} from "react-native"
import { useAppDispatch, useAppSelector } from "../../store/app/hooks";
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
import { BusinessItemsSale, BusinessUsers, UserBusinessArticles, UserBusinesses, UserSellsPoints } from "../../store/database/Models";
const HeaderEditBusiness = ({ navigation, route }: NavProps) => {

    const theme = useAppSelector(state => state.app_theme);
    const [showInternetError, setShowInternetError] = useState<boolean>(false);
    const [confirm_delete, setConfirm_delete] = useState(false);
    const [item_deleted, setItem_deleted] = useState(false);
    const dispatch = useAppDispatch();
    const { business } = route.params;
    const realm = useRealm();

    const to_del = useObject(UserBusinesses, business._id);

    const to_del_users = useQuery(
        BusinessUsers, users => {
            return users.filtered('business_id == $0', business._id)
        }, []);

    const to_del_sales_points = useQuery(
        UserSellsPoints, sales_points => {
            return sales_points.filtered('business_id == $0', business._id)
        }, []);

    const to_del_items = useQuery(
        UserBusinessArticles, items => {
            return items.filtered('business_id == $0', business._id);
        }, []);


    const to_del_sales = useQuery(
        BusinessItemsSale, sales => {
            return sales.filtered('business_id == $0', business._id);
        }, []);

    const EBusiness = () => {
        dispatch(setLoadingButton(true));
        // const businessID = randomString(5).toUpperCase() + renderDateUpToMilliseconds();

        // const businesss = {
        //     _id: business._id,
        //     phone_number: business.phone_number,
        //     business_name: business.business_name,
        //     slogan: business.slogan,
        //     description_service: business.description,
        //     category: business.category,
        //     keywords: business.keywords,
        //     currency: business.currency,
        //     national_number: business.national_number,
        //     national_id: business.national_id,
        //     logo: business.logo,
        //     phones: business.phones,
        //     emails: business.emails,
        //     background: business.background,
        //     business_active: business.business_active,
        //     business_address: business.business_address,
        //     business_visible: business.business_visible,
        //     website: business.website,
        //     other_links: business.other_links,
        //     yambi: business.yambi,
        //     createdAt: business.createdAt,
        //     updatedAt: business.updatedAt
        // }

        axios.post(remote_host + "/yambi/API/edit_business", { business: to_del, flag: "0" })
            .then(json => {
                if (json.data.success === "1") {
                    realm.write(() => {
                        try {
                            realm.delete(to_del);
                        } catch (error) { }

                        try {
                            realm.delete(to_del_users);
                        } catch (error) { }

                        try {
                            realm.delete(to_del_sales_points);
                        } catch (error) { }

                        try {
                            realm.delete(to_del_items);
                        } catch (error) { }

                        try {
                            realm.delete(to_del_sales);
                        } catch (error) { }
                    });

                    navigation.goBack();
                }

                dispatch(setLoadingButton(false));

                setTimeout(() => {
                    navigation.goBack();
                }, 500);
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
                <ModalApp onCancel={() => { dispatch(setShowModalApp(false)); setConfirm_delete(false) }} onClose={() => { dispatch(setShowModalApp(false)); setConfirm_delete(false) }} singleButton={false} textAction={strings.confirm} onAction={EBusiness} title={strings.delete_business}>
                    <View>
                        {!item_deleted ?
                            <>
                                <TextNormalYambiGray text={strings.delete_business_text} />
                                <TextSmallYambiError text={strings.delete_business_nb} styles={{ marginTop: 20 }} />
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

            <Pressable
                onPress={() => { dispatch(setShowModalApp(true)); setConfirm_delete(true) }}
                style={{
                    height: 30,
                    width: 30,
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    marginLeft: 5,
                    // backgroundColor:'green'
                }}>
                <IconApp pack="MT" name="delete" size={20} color={theme.colors.text_design1} />
            </Pressable>
        </View>
    )
}

export default HeaderEditBusiness;
