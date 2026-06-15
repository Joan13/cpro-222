import { Pressable, View, ScrollView, TextInput } from "react-native";
import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from "../../store/app/hooks";
import { strings } from "../../lang/lang";
import ButtonNormal from "../../components/app/ButtonNormal";
import { TextNormalYambi, TextNormalYambiGray, TextNormalYambiHighColor, TextSmallYambiGray } from "../../components/app/Text";
import ModalApp from "../../components/app/ModalApp";
import { setLoadingButton, setShowModalApp } from "../../store/reducers/appSlice";
import { remote_host } from "../../../GlobalVariables";
import axios, { all } from "axios";
import { NavProps, TBusinessUser, TSellsPoint, TUser } from "../../types/types";
import { useObject, useQuery, useRealm } from "@realm/react";
import { BusinessUsers, UserBusinesses, UserContacts, UserSellsPoints } from "../../store/database/Models";
import { IconApp } from "../../components/app/IconApp";
import moment from "moment";
import { FlashList } from "@shopify/flash-list";
import ContactsList from "../../components/lists/contacts/ContactsList";
import SwitchApp from "../../components/app/SwitchApp";

const EditBusinessUser = ({ navigation, route }: NavProps) => {

    const { business_id } = route.params;
    const { sales_point_id } = route.params;
    const { user } = route.params;

    const theme = useAppSelector(state => state.app_theme.colors);
    const user_data = useAppSelector(state => state.user_data);
    const [name, setName] = useState<string>("");
    const [sales_point_to_enter, setSales_point_to_enter] = useState<string>("");
    const [phone_number, setPhone_number] = useState<string>("");
    const [showError, setShowError] = useState<boolean>(false);
    const [showSuccess, setShowSuccess] = useState<boolean>(false);
    const [showInternetError, setShowInternetError] = useState<boolean>(false);
    const [user_active, setUser_active] = useState<number>(0);
    const [showUsers, setShowUsers] = useState<boolean>(false);
    const [showUserError, setShowUserError] = useState<boolean>(false);
    const [showSellsPointsList, setShowSellsPointsList] = useState<boolean>(false);
    const [errorBlockSoleOwner, setErrorBlockSoleOwner] = useState<boolean>(false);
    const [level, setLevel] = useState<number>(1);
    const dispatch = useAppDispatch();
    const realm = useRealm();

    const business = useObject(UserBusinesses, business_id);

    if (business === null) return;

    let sales_point: UserSellsPoints | null = null;

    if (sales_point_id !== "") {
        sales_point = useObject(UserSellsPoints, sales_point_id);

        if (sales_point === null) return;
    }

    const contacts = useQuery(UserContacts, contacts => { return contacts; }, []);

    const uuser = useQuery(
        BusinessUsers, bss => {
            return bss.filtered('user == $0 && business_id == $1', user_data.phone_number, business_id)
        }, []);

    const all_owners = useQuery(
        BusinessUsers, bss => {
            return bss.filtered('level == $0 && business_id == $1 && user_active == $2', 1, business_id, 1)
        }, []);

    const sales_points = useQuery(
        UserSellsPoints, bss => {
            return bss.filtered('business_id == $0', business_id)
        }, []);

    const oo = uuser.find(element => element.user === user_data.phone_number);

    useEffect(() => {
        setName(user.user_name);
        setPhone_number(user.user);
        setLevel(user.level);
        setSales_point_to_enter(user.sales_point_id);
        setUser_active(user.user_active);
    }, [business_id, sales_point_id, user]);

    const conditionEditBusiness = () => {
        if (oo !== null && oo !== undefined) {
            if ((oo.user_active === 1 && oo.level === 1)) {
                return true;
            }
        }

        return false;
    }


    const EditBusinessUserButton = () => {
        if (oo !== null && oo !== undefined) {
            if (oo.user_active === 1) {
                if (phone_number === "") {
                    setShowError(true);
                    dispatch(setShowModalApp(true));
                } else {
                    dispatch(setLoadingButton(true));

                    const business_user: TBusinessUser = {
                        _id: user._id,
                        business_id: user.business_id,
                        user_name: name,
                        phone_number: user.phone_number,
                        sales_point_id: level === 1 ? "" : sales_point_to_enter, // user.sales_point_id,
                        user: user.user,
                        level: level,
                        user_active: user_active,
                        createdAt: user.createdAt,
                        updatedAt: moment(new Date()).format()
                    }

                    axios.post(remote_host + "/yambi/API/edit_business_user", { business_user: business_user, flag: 0 })
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
                            navigation.goBack();
                        })
                        .catch(error => {
                            setShowInternetError(true);
                            dispatch(setShowModalApp(true));
                            dispatch(setLoadingButton(false));
                        })
                }
            } else {
                dispatch(setShowModalApp(true));
                setShowUserError(true);
            }
        } else {
            dispatch(setShowModalApp(true));
            setShowUserError(true);
        }
    }

    const selectCon = (item: TUser) => {
        setPhone_number(item.phone_number);
        setShowModalApp(false);
        setShowUsers(false);
    }

    const selectSalesPoint = (sales_point: string) => {
        setSales_point_to_enter(sales_point);
    }

    const ShowChangeSalesPointButton = () => {
        if (level === 1) {
            return false;
        } else if (sales_point_to_enter !== "" && level !== 1) {
            return true;
        }

        return false;
    }

    const Usersss = () => {
        return (
            <View style={{
                width: '100%',
                height: 300,
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

    const SalesPoints = () => {
        return (
            <View style={{
                width: '100%',
                height: 300,
                marginTop: -12,
                marginBottom: 15
            }}>
                <FlashList
                    data={sales_points as never}
                    estimatedItemSize={50}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item, index }: { item: TSellsPoint, index: number }) => (
                        <Pressable onPress={() => selectSalesPoint(item._id)} style={{
                            marginVertical: 7,
                            flexDirection: 'row'
                        }}>
                            <IconApp pack="FI" name={sales_point_to_enter === item._id ? "check-circle" : "circle"} color={sales_point_to_enter === item._id ? theme.high_color : theme.gray} size={15} styles={{ marginTop: 4, marginRight: 10 }} />
                            <TextNormalYambiHighColor bold={sales_point_to_enter === item._id ? true : false} text={item.sells_point_name} />
                        </Pressable>)}
                />
            </View>
        )
    }

    const button_to_show = () => {
        if (level === 1) {
            return 1;
        } else if (level !== 1 && sales_point_to_enter === "") {
            return 0;
        } else {
            return 1;
        }
    }

    return (
        <ScrollView style={{
            backgroundColor: theme.background,
            paddingHorizontal: 16,
            borderTopColor: theme.border,
            borderTopWidth: 1
        }}>
            <View style={{
                marginBottom: 50
            }}>

                {showUserError ?
                    <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowUserError(false) }} singleButton title={strings.error}>
                        <TextNormalYambiGray text={strings.business_level_error} />
                    </ModalApp> : null}

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
                    <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowInternetError(false) }} singleButton title={strings.contact_select}>
                        <Usersss />
                    </ModalApp> : null}

                {showSellsPointsList ?
                    <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowSellsPointsList(false) }} singleButton title={strings.select_sales_point}>
                        <SalesPoints />
                    </ModalApp> : null}

                {errorBlockSoleOwner ?
                    <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setErrorBlockSoleOwner(false) }} singleButton title={strings.error}>
                        <TextNormalYambiGray text={strings.unable_delete_sole_owner} />
                    </ModalApp> : null}

                {/* Business Info Card */}
                {business_id !== "" || sales_point_id !== "" ? (
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
                        {business_id !== "" ? (
                            <View style={{ marginBottom: sales_point_id !== "" && level !== 1 ? 15 : 0 }}>
                                <TextNormalYambiGray text={strings.business_name} styles={{ marginBottom: 6 }} />
                                <TextNormalYambi bold text={business.business_name} />
                            </View>
                        ) : null}

                        {sales_point_id !== "" && level !== 1 ? (
                            <View>
                                <TextNormalYambiGray text={strings.sales_point_name} styles={{ marginBottom: 6 }} />
                                <TextNormalYambi bold text={sales_point !== null ? sales_point.sells_point_name : ""} />
                            </View>
                        ) : null}
                    </View>
                ) : null}

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
                    <View style={{ marginBottom: 20 }}>
                        <TextNormalYambiGray text={strings.phone_number} styles={{ marginBottom: 6 }} />
                        <TextNormalYambi text={phone_number} bold />
                    </View>

                    <View style={{ marginBottom: 20 }}>
                        <TextNormalYambiGray text={strings.user_status} styles={{ marginBottom: 8 }} />
                        <Pressable
                            onPress={() => {
                                if (user.level === 1 && all_owners.length < 2 && user.user_active === 1) {
                                    dispatch(setShowModalApp(true));
                                    setErrorBlockSoleOwner(true);
                                } else {
                                    setUser_active(!user_active ? 1 : 0)
                                }
                            }}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}>
                            <SwitchApp value={user_active ? true : false} onPress={() => {
                                if (user.level === 1 && all_owners.length < 2 && user.user_active === 1) {
                                    dispatch(setShowModalApp(true));
                                    setErrorBlockSoleOwner(true);
                                } else {
                                    setUser_active(!user_active ? 1 : 0)
                                }
                            }} small />
                            <TextNormalYambiHighColor text={user_active ? strings.active : strings.blocked} styles={{ marginLeft: 10 }} bold />
                        </Pressable>
                    </View>

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

                        <Pressable onPress={() => {
                            if (user.level === 1 && all_owners.length < 2 && user.user_active === 1) {
                                dispatch(setShowModalApp(true));
                                setErrorBlockSoleOwner(true);
                            } else { setLevel(2) }
                        }} style={{
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

                        <Pressable onPress={() => {
                            if (user.level === 1 && all_owners.length < 2 && user.user_active === 1) {
                                dispatch(setShowModalApp(true));
                                setErrorBlockSoleOwner(true);
                            } else { setLevel(3) }
                        }} style={{
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
                    </View>

                    {ShowChangeSalesPointButton() ? (
                        <Pressable
                            onPress={() => { dispatch(setShowModalApp(true)); setShowSellsPointsList(true); }}
                            style={{
                                paddingVertical: 8,
                                marginTop: 8,
                                marginBottom: 4,
                                borderColor: theme.high_color,
                                borderBottomWidth: 1,
                                alignSelf: 'flex-start'
                            }}>
                            <TextNormalYambiHighColor text={strings.edit_sales_point} bold />
                        </Pressable>
                    ) : null}
                </View>

                {/* Action Button */}
                <View style={{ marginBottom: 0 }}>
                    {button_to_show() === 0 ? (
                        <ButtonNormal
                            title={strings.select_sales_point}
                            loadEnabled={true}
                            onPress={() => { dispatch(setShowModalApp(true)); setShowSellsPointsList(true) }}
                            normal={true}
                        />
                    ) : (
                        <ButtonNormal
                            title={strings.continue}
                            loadEnabled={true}
                            onPress={EditBusinessUserButton}
                            normal={true}
                        />
                    )}
                </View>
            </View>
        </ScrollView>
    )
}

export default EditBusinessUser;

