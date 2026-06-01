import { View, Pressable } from "react-native"
import { useAppDispatch, useAppSelector } from "../../store/app/hooks";
import {  setShowModalApp } from "../../store/reducers/appSlice";
import { NavProps } from "../../types/types";
import { IconApp } from "../app/IconApp";
import * as RootNavigation from "../../services/Navigation_ref";


const HeaderAddBusinessUser = ({ navigation, route }: NavProps) => {

    const theme = useAppSelector(state => state.app_theme);
    const dispatch = useAppDispatch();
    const { sales_point } = route.params;
    const {business}=route.params;

    const  AddUser=()=>{
        RootNavigation.navigate("NewBusinessUser", { sales_point_id: sales_point, business_id: business });
    }

    return (
        <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            {/* {confirm_delete ?
                <ModalApp onCancel={() => { dispatch(setShowModalApp(false)); setConfirm_delete(false) }} onClose={() => { dispatch(setShowModalApp(false)); setConfirm_delete(false) }} singleButton={false} textAction={strings.confirm} onAction={delete_business_item} title={strings.delete_item}>
                    <View>
                        {!item_deleted ?
                            <TextNormalYambiGray text={strings.delete_item_text} />
                            :
                            <Animated.View entering={BounceIn}>
                                <IconApp pack="FA" name="check-circle" size={50} color={theme.colors.text} />
                            </Animated.View>}
                    </View>
                </ModalApp> : null} */}

            <Pressable
                onPress={AddUser}
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

export default HeaderAddBusinessUser;
