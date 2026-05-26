import { View, Pressable, ActivityIndicator, Text } from "react-native"
import { useAppDispatch, useAppSelector } from "../../store/app/hooks";
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Feather from 'react-native-vector-icons/Feather';
import { setSearchContactEnabled, setShowModalApp } from "../../store/reducers/appSlice";
// import { SocketApp } from "../../../App";
import { NavProps, TBusinessUser, TItem } from "../../types/types";
import { IconApp } from "../app/IconApp";
import { useObject, useQuery, useRealm } from "@realm/react";
import moment from "moment";
import { strings } from "../../lang/lang";
import { TextNormalYambiGray } from "../app/Text";
import ModalApp from "../app/ModalApp";
import { useState } from "react";
import Animated, { BounceIn } from "react-native-reanimated";
import { BusinessUsers, UserBusinessArticles } from "../../store/database/Models";
import { remote_host } from "../../../GlobalVariables";
import axios from "axios";
const HeaderEditBusinessUser = ({ navigation, route }: NavProps) => {

    const theme = useAppSelector(state => state.app_theme);
    const [confirm_delete, setConfirm_delete] = useState(false);
    const dispatch = useAppDispatch();
    const { user } = route.params;
    const realm = useRealm();
    const [showInternetError, setShowInternetError] = useState<boolean>(false);
    const [errorBlockSoleOwner, setErrorBlockSoleOwner] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);

    const to_del = useObject(BusinessUsers, user._id);

    const all_owners = useQuery(
        BusinessUsers, bss => {
            return bss.filtered('level == $0 && business_id == $1 && user_active == $2', 1, user.business_id, 1)
        }, []);

    const DeleteBusinessUser = () => {

        setLoading(true);

        axios.post(remote_host + "/yambi/API/edit_business_user", { business_user: to_del, flag: 1 })
            .then(json => {

                if (json.data.success === "1") {
                    const business_user: TBusinessUser = {
                        _id: user._id,
                        business_id: user.business_id,
                        user_name: user.user_name,
                        phone_number: user.phone_number,
                        sales_point_id: user.sales_point_id,
                        user: user.user,
                        level: user.level,
                        user_active: 2,
                        createdAt: user.createdAt,
                        updatedAt: user.updatedAt
                    }
                    realm.write(() => {
                        try {
                            realm.create(BusinessUsers, business_user, true);
                        } catch (error) { }
                    });

                    navigation.goBack();
                }

                setLoading(false);
            })
            .catch(error => {
                setShowInternetError(true);
                dispatch(setShowModalApp(true));
                setLoading(false);
            })
    }

    return (
        <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            {confirm_delete ?
                <ModalApp onCancel={() => { dispatch(setShowModalApp(false)); setConfirm_delete(false) }} onClose={() => { dispatch(setShowModalApp(false)); setConfirm_delete(false) }} singleButton={false} textAction={strings.confirm} onAction={DeleteBusinessUser} title={strings.delete_user}>
                    <View>
                        <TextNormalYambiGray text={strings.delete_user} />
                    </View>
                </ModalApp> : null}

            {showInternetError ?
                <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowInternetError(false) }} singleButton title={strings.error}>
                    <TextNormalYambiGray text={strings.connection_failed} />
                </ModalApp> : null}

            {errorBlockSoleOwner ?
                <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setErrorBlockSoleOwner(false) }} singleButton title={strings.error}>
                    <TextNormalYambiGray text={strings.unable_delete_sole_owner} />
                </ModalApp> : null}

            <Pressable
                onPress={() => {
                    if (user.level === 1 && all_owners.length < 2 && user.user_active === 1) {
                        dispatch(setShowModalApp(true));
                        setErrorBlockSoleOwner(true);
                    } else {
                        dispatch(setShowModalApp(true));
                        setConfirm_delete(true);
                    }
                }}
                style={{
                    height: 30,
                    width: 30,
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    marginLeft: 5
                }}>
                {loading ?
                    <ActivityIndicator size="small" color={theme.colors.text_design1} /> :
                    <IconApp pack="MT" name="delete" size={20} color={theme.colors.text_design1} />}
            </Pressable>
        </View>
    )
}

export default HeaderEditBusinessUser;
