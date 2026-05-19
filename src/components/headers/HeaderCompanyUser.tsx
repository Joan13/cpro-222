import { View, TouchableOpacity, ActivityIndicator } from "react-native"
import { useAppDispatch, useAppSelector } from "../../store/app/hooks";
import { setShowModalApp } from "../../store/reducers/appSlice";
import { NavProps, TCompanyUser } from "../../types/types";
import { IconApp } from "../app/IconApp";
import { strings } from "../../lang/lang";
import { TextNormalYambiGray, YambiText } from "../app/Text";
import ModalApp from "../app/ModalApp";
import { useState, useEffect } from "react";
import { remote_host } from "../../../GlobalVariables";
import axios from "axios";
import * as RootNavigation from "../../services/Navigation_ref";
import { useRealm } from "@realm/react";

const HeaderCompanyUser = ({ navigation, route }: NavProps) => {

    const theme = useAppSelector(state => state.app_theme);
    const user_data = useAppSelector(state => state.user_data);
    const realm = useRealm();
    const [confirm_delete, setConfirm_delete] = useState(false);
    const dispatch = useAppDispatch();
    const { company_user } = route.params;
    const [showInternetError, setShowInternetError] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const isDeleted = company_user.user_active === 0;
    
    // Check if current user is admin for this company
    const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false);
    const isEditingSelf = company_user.phone_number === user_data.phone_number;
    
    useEffect(() => {
        // Check if current user is admin for this company
        try {
            const currentUserCompanyUser = realm.objects('CompanyUsers').filtered(
                'phone_number == $0 && company_id == $1 && is_admin == $2',
                user_data.phone_number,
                company_user.company_id,
                1
            );
            setIsCurrentUserAdmin(currentUserCompanyUser.length > 0);
        } catch (e) {
            setIsCurrentUserAdmin(false);
        }
    }, [user_data.phone_number, company_user.company_id, realm]);
    
    // Only admins can edit/delete other users, or users can delete themselves
    const canEdit = isCurrentUserAdmin || isEditingSelf;
    const canDelete = isCurrentUserAdmin || isEditingSelf;

    const DeleteCompanyUser = () => {
        setLoading(true);

        axios.post(remote_host + "/yambi/API/edit_company_user", { 
            company_user: company_user, 
            flag: 1 
        })
        .then(json => {
            if (json.data.success === "1") {
                navigation.goBack();
            } else {
                setShowInternetError(true);
                dispatch(setShowModalApp(true));
            }
            setLoading(false);
        })
        .catch(error => {
            setShowInternetError(true);
            dispatch(setShowModalApp(true));
            setLoading(false);
        })
    }

    const RestoreCompanyUser = () => {
        setLoading(true);

        axios.post(remote_host + "/yambi/API/edit_company_user", { 
            company_user: {
                ...company_user,
                user_active: 1
            }
        })
        .then(json => {
            if (json.data.success === "1") {
                navigation.goBack();
            } else {
                setShowInternetError(true);
                dispatch(setShowModalApp(true));
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
            gap: 10,
        }}>
            {confirm_delete ?
                <ModalApp 
                    onCancel={() => { dispatch(setShowModalApp(false)); setConfirm_delete(false) }} 
                    onClose={() => { dispatch(setShowModalApp(false)); setConfirm_delete(false) }} 
                    singleButton={false} 
                    textAction={strings.confirm} 
                    onAction={DeleteCompanyUser} 
                    title={(strings as any).delete_member || strings.delete_user}
                >
                    <View>
                        <TextNormalYambiGray 
                            text={
                                isEditingSelf 
                                    ? ((strings as any).remove_company_affiliation)
                                    : (strings.delete_company_user_confirmation || strings.delete_user)
                            } 
                        />
                    </View>
                </ModalApp> : null}

            {showInternetError ?
                <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowInternetError(false) }} singleButton title={strings.error}>
                    <TextNormalYambiGray text={strings.connection_failed} />
                </ModalApp> : null}

            {isDeleted ? (
                isCurrentUserAdmin && (
                    <TouchableOpacity
                        onPress={RestoreCompanyUser}
                        style={{
                            backgroundColor: theme.colors.high_color + '20',
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 8,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                        {loading ?
                            <ActivityIndicator size="small" color={theme.colors.high_color} /> :
                            <YambiText text={(strings as any).restore_member || strings.restore_user} size="small" color="high" style={{ fontSize: 14 }} />}
                    </TouchableOpacity>
                )
            ) : (
                <>
                    {canEdit && (
                        <TouchableOpacity
                            onPress={() => RootNavigation.navigate("EditCompanyUser", { company_user: company_user })}
                            style={{
                                height: 30,
                                width: 30,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                            <IconApp pack="FI" name="edit" size={20} color={theme.colors.text_design1} />
                        </TouchableOpacity>
                    )}

                    {canDelete && (
                        <TouchableOpacity
                            onPress={() => {
                                dispatch(setShowModalApp(true));
                                setConfirm_delete(true);
                            }}
                            style={{
                                height: 30,
                                width: 30,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                            {loading ?
                                <ActivityIndicator size="small" color={theme.colors.text_design1} /> :
                                <IconApp pack="MT" name="delete" size={20} color={theme.colors.text_design1} />}
                        </TouchableOpacity>
                    )}
                </>
            )}
        </View>
    )
}

export default HeaderCompanyUser;
