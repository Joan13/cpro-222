import { Pressable, View, ScrollView, TextInput } from "react-native";
import { useState } from 'react';
import { useAppDispatch, useAppSelector } from "../../store/app/hooks";
import { strings } from "../../lang/lang";
import ButtonNormal from "../../components/app/ButtonNormal";
import { TextNormalYambi, TextNormalYambiError, TextNormalYambiGray, TextNormalYambiHighColor, TextSmallYambi, TextSmallYambiGray } from "../../components/app/Text";
import ModalApp from "../../components/app/ModalApp";
import { setLoadingButton, setShowModalApp } from "../../store/reducers/appSlice";
import { randomString, remote_host, renderDateUpToMilliseconds } from "../../../GlobalVariables";
import axios from "axios";
import { NavProps, TBusinessUser, TUser } from "../../types/types";
import { useObject, useQuery, useRealm } from "@realm/react";
import { BusinessUsers, UserBusinesses, UserContacts, UserSellsPoints } from "../../store/database/Models";
import { IconApp } from "../../components/app/IconApp";
import moment from "moment";
import { FlashList } from "@shopify/flash-list";
import ContactsList from "../../components/lists/contacts/ContactsList";

const NewBusinessUser = ({ navigation, route }: NavProps) => {

    const { business_id } = route.params;
    const { sales_point_id } = route.params;

    const theme = useAppSelector(state => state.app_theme.colors);
    const user_data = useAppSelector(state => state.user_data);
    const app_description = useAppSelector(state => state.persisted_app.app_description);
    const [name, setName] = useState<string>("");
    const [phone_number, setPhone_number] = useState<string>("");
    const [showError, setShowError] = useState<boolean>(false);
    const [showSuccess, setShowSuccess] = useState<boolean>(false);
    const [raiseAlert, setRaiseAlert] = useState<boolean>(false);
    const [showInternetError, setShowInternetError] = useState<boolean>(false);
    const [showUsers, setShowUsers] = useState(false);
    const [showUserError, setShowUserError] = useState(false);
    const [level, setLevel] = useState(3);
    const dispatch = useAppDispatch();
    const realm = useRealm();

    const business = useObject(UserBusinesses, business_id);
    const sales_point = useObject(UserSellsPoints, sales_point_id);
    const contacts = useQuery(UserContacts, contacts => { return contacts; }, []);

    if (business === null) return;

    // useEffect(() => {
    //     setName(business.business_name);
    // }, [business_id]);

    const businessUsers = useQuery(
        BusinessUsers, bss => {
            return bss.filtered('user_active == $0 && business_id == $1', 1, business_id)
        }, []);

    const uuser = useQuery(
        BusinessUsers, bss => {
            return bss.filtered('user == $0 && business_id == $1', user_data.phone_number, business_id)
        }, []);

    const oo = uuser.find(element => element.user === user_data.phone_number);

    // const conditionGoUsers = () => {
    //     if (oo !== null && oo !== undefined) {
    //         if ((oo.user_active === 1 && oo.level === 1) || (oo.user_active === 1 && oo.level === 2)) {
    //             return true;
    //         }
    //     }

    //     return false;
    // }

    const conditionEditBusiness = () => {
        if (oo !== undefined) {
            if ((oo.user_active === 1 && oo.level === 1)) {
                return true;
            }
        }

        return false;
    }

    const NewBusinessUserButton = () => {
        if (oo !== undefined) {
            if (oo.user_active === 1) {
                if (phone_number === "") {
                    setShowError(true);
                    dispatch(setShowModalApp(true));
                } else {
                    dispatch(setLoadingButton(true));
                    const idid = randomString(5).toUpperCase() + renderDateUpToMilliseconds();

                    const business_user: TBusinessUser = {
                        _id: idid,
                        business_id: business_id,
                        user_name: name,
                        phone_number: user_data.phone_number,
                        sales_point_id: level === 1 ? "" : sales_point_id,
                        user: phone_number,
                        level: level,
                        user_active: 1,
                        createdAt: moment(new Date()).format(),
                        updatedAt: moment(new Date()).format()
                    }

                    axios.post(remote_host + "/yambi/API/new_business_user", { business_user: business_user })
                        .then(json => {

                            if (json.data.success === "1") {
                                realm.write(() => {
                                    try {
                                        realm.create('BusinessUsers', business_user, true);
                                        setShowSuccess(true);
                                        dispatch(setShowModalApp(true));
                                        setPhone_number("");
                                    } catch (error) { }
                                });
                            }

                            dispatch(setLoadingButton(false));
                        })
                        .catch(error => {
                            setShowInternetError(true);
                            dispatch(setShowModalApp(true));
                            dispatch(setLoadingButton(false));
                        })
                }
            }
        }
    }

    const selectCon = (item: TUser) => {
        setPhone_number(item.phone_number);

        const user = businessUsers.find(element => element.user === item.phone_number);

        if (user === undefined) {
            setRaiseAlert(true);
        } else {
            setRaiseAlert(false);
        }

        setShowModalApp(false);
        setShowUsers(false);
    }

    const Usersss = () => {
        return (
            <View style={{
                width: '100%',
                height: 300,
                // backgroundColor: 'green',
                marginTop: -15
            }}>
                <FlashList
                    data={contacts as never}
                    estimatedItemSize={50}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item, index }: { item: TUser, index: number }) => (
                        <ContactsList
                            selectContact={selectCon}
                            type={3}
                            item={item}
                            index={index} />)}
                />
            </View>
        )
    }

    return (
        <View style={{
            flex: 1, 
            backgroundColor: theme.background,
        }}>
            <ScrollView style={{
                paddingHorizontal: 16,
                paddingTop: 16,
            }}>
                {/* Business Info Card */}
                <View style={{
                    backgroundColor: theme.background,
                    borderRadius: 12,
                    padding: 20,
                    marginBottom: 20,
                    borderWidth: 1,
                    borderColor: theme.border,
                    shadowColor: theme.border,
                    shadowOpacity: 0.1,
                    shadowRadius: 6,
                    elevation: 3,
                }}>
                    <View style={{ marginBottom: 15 }}>
                        <TextNormalYambiGray text={strings.business_name} styles={{ marginBottom: 6 }} />
                        <TextNormalYambi bold text={business.business_name} />
                    </View>

                    {sales_point !== null && level !== 1 ? (
                        <View>
                            <TextNormalYambiGray text={strings.sales_point_name} styles={{ marginBottom: 6 }} />
                            <TextNormalYambi bold text={sales_point.sells_point_name} />
                        </View>
                    ) : null}
                </View>

                {showError ?
                    <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowError(false) }} singleButton title={strings.error}>
                        <TextNormalYambiGray text={strings.fields_error_validation} />
                    </ModalApp> : null}

                {showSuccess ?
                    <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowSuccess(false) }} singleButton title={strings.success}>
                        <TextNormalYambiGray text={strings.success_added_user} />
                    </ModalApp> : null}

                {showInternetError ?
                    <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowInternetError(false) }} singleButton title={strings.error}>
                        <TextNormalYambiGray text={strings.connection_failed} />
                    </ModalApp> : null}

                {showUsers ?
                    <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowUsers(false) }} singleButton title={strings.contact_select}>
                        <Usersss />
                    </ModalApp> : null}

                {/* User Details Card */}
                <View style={{
                    backgroundColor: theme.background,
                    borderRadius: 12,
                    padding: 20,
                    marginBottom: 20,
                    borderWidth: 1,
                    borderColor: theme.border,
                    shadowColor: theme.border,
                    shadowOpacity: 0.1,
                    shadowRadius: 6,
                    elevation: 3,
                }}>
                    <Pressable onPress={() => { dispatch(setShowModalApp(true)); setShowUsers(true) }} style={{ marginBottom: 20 }}>
                        <TextNormalYambiGray text={strings.user_details} styles={{ marginBottom: 8 }} />
                        <TextNormalYambiHighColor text={phone_number === "" ? strings.contact_select : phone_number} bold />
                    </Pressable>

                    <View style={{ marginBottom: 20 }}>
                        <TextNormalYambiGray text={strings.name} styles={{ marginBottom: 8 }} />
                        <TextInput
                            placeholder={strings.name}
                            placeholderTextColor={theme.gray}
                            maxLength={50}
                            style={{ 
                                color: theme.text, 
                                backgroundColor: theme.border, 
                                paddingHorizontal: 15, 
                                paddingVertical: 12,
                                minHeight: 48, 
                                borderRadius: 8,
                                fontSize: 15,
                            }}
                            value={name}
                            onChangeText={text => setName(text)}
                        />
                    </View>

                    <View>
                        <TextNormalYambiGray text={strings.access_level} styles={{ marginBottom: 12 }} />

                        {conditionEditBusiness() ? (
                            <Pressable onPress={() => setLevel(1)} style={{
                                flexDirection: 'row',
                                marginBottom: 16,
                                paddingVertical: 8,
                            }}>
                                <IconApp pack="FI" name={level === 1 ? "check-circle" : "circle"} color={level === 1 ? theme.high_color : theme.gray} size={18} styles={{ marginTop: 2 }} />
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <TextNormalYambiHighColor text={strings.owner} bold={level === 1} />
                                    <TextSmallYambiGray text={strings.admin_text} styles={{ marginTop: 4 }} />
                                </View>
                            </Pressable>
                        ) : null}

                        {sales_point !== null && conditionEditBusiness() ? (
                            <Pressable onPress={() => setLevel(2)} style={{
                                flexDirection: 'row',
                                marginBottom: 16,
                                paddingVertical: 8,
                            }}>
                                <IconApp pack="FI" name={level === 2 ? "check-circle" : "circle"} color={level === 2 ? theme.high_color : theme.gray} size={18} styles={{ marginTop: 2 }} />
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <TextNormalYambiHighColor text={strings.salesforce_manager} bold={level === 2} />
                                    <TextSmallYambiGray text={strings.salesforce_manager_text} styles={{ marginTop: 4 }} />
                                </View>
                            </Pressable>
                        ) : null}

                        {sales_point !== null ? (
                            <Pressable onPress={() => setLevel(3)} style={{
                                flexDirection: 'row',
                                marginBottom: 8,
                                paddingVertical: 8,
                            }}>
                                <IconApp pack="FI" name={level === 3 ? "check-circle" : "circle"} color={level === 3 ? theme.high_color : theme.gray} size={18} styles={{ marginTop: 2 }} />
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <TextNormalYambiHighColor text={strings.sale_operator} bold={level === 3} />
                                    <TextSmallYambiGray text={strings.sale_operator_text} styles={{ marginTop: 4 }} />
                                </View>
                            </Pressable>
                        ) : null}
                    </View>
                </View>

                {/* Action Button */}
                {phone_number !== "" ? (
                    <View style={{ marginBottom: 24 }}>
                        {raiseAlert ? (
                            <ButtonNormal 
                                title={strings.add_user_to_business} 
                                loadEnabled={true} 
                                onPress={NewBusinessUserButton} 
                                normal={true} 
                            />
                        ) : (
                            <TextNormalYambiError text={strings.user_exists} styles={{ textAlign: 'center', marginVertical: 12 }} />
                        )}
                    </View>
                ) : null}
            </ScrollView>
        </View>
    )
}

export default NewBusinessUser;
