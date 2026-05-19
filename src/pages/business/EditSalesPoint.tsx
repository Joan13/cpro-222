import { Text, TouchableOpacity, View, ScrollView, TextInput } from "react-native";
import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from "../../store/app/hooks";
import { strings } from "../../lang/lang";
import ButtonNormal from "../../components/app/ButtonNormal";
import { TextBigYambi, TextNormalYambi, TextNormalYambiGray, TextSmallYambiGray } from "../../components/app/Text";
import ModalApp from "../../components/app/ModalApp";
import { setLoadingButton, setShowModalApp } from "../../store/reducers/appSlice";
import { randomString, remote_host, renderDateUpToMilliseconds } from "../../../GlobalVariables";
import axios from "axios";
import { NavProps, TSellsPoint } from "../../types/types";
import { useObject, useRealm } from "@realm/react";
import { UserBusinesses } from "../../store/database/Models";

const EditSalesPoint = ({ navigation, route }: NavProps) => {

    const theme = useAppSelector(state => state.app_theme.colors);
    const user_data = useAppSelector(state => state.user_data);
    const app_description = useAppSelector(state => state.persisted_app.app_description);
    const [name, setName] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [address, setAddress] = useState<string>("");
    const [showError, setShowError] = useState<boolean>(false);
    const [showInternetError, setShowInternetError] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [emails, setEmails] = useState<string>("");
    const [phones, setPhones] = useState<string>("");
    const [tva, setTva] = useState<string>("");
    const dispatch = useAppDispatch();
    const realm = useRealm();

    const { sales_point } = route.params;

    // const business = useObject(UserBusinesses, business_id);

    useEffect(() => {
        setName(sales_point.sells_point_name);
        setAddress(sales_point.sells_point_address);
        setEmails(sales_point.emails);
        setPhones(sales_point.phones);
        setDescription(sales_point.description_service);
        setTva(sales_point.tva || "");
    }, [sales_point]);


    const EditPointOfSales = () => {
        if (name === "" || address === "") {
            setShowError(true);
            dispatch(setShowModalApp(true));
        } else {
            setLoading(true);
            dispatch(setLoadingButton(true));
            // const sellsPointID = randomString(5).toUpperCase() + renderDateUpToMilliseconds();

            const sells_point: TSellsPoint = {
                _id: sales_point._id,
                business_id: sales_point.business_id,
                phone_number: sales_point.phone_number,
                sells_point_name: name,
                slogan: sales_point.slogan,
                description_service: description,
                category: sales_point.category,
                tva: tva,
                logo: sales_point.logo,
                country: sales_point.country,
                phones: phones,
                emails: emails,
                background: sales_point.background,
                sells_point_active: sales_point.sells_point_active,
                sells_point_address: address,
                sells_point_visible: sales_point.sells_point_visible,
                website: sales_point.website,
                other_links: sales_point.other_links,
                yambi: sales_point.yambi,
                notifications: sales_point.notifications,
                createdAt: sales_point.createdAt,
                updatedAt: sales_point.updatedAt
            }

            axios.post(remote_host + "/yambi/API/edit_sales_point", { sales_point: sells_point, flag: "1" })
                .then(json => {

                    if (json.data.success === "1") {
                        realm.write(() => {
                            try {
                                realm.create('SellsPoints', sells_point, true);
                            } catch (error) { }
                        });
                    }

                    setLoading(false);
                    dispatch(setLoadingButton(false));

                    setTimeout(() => {
                        navigation.goBack();
                    }, 300);
                })
                .catch(error => {
                    setShowInternetError(true);
                    dispatch(setShowModalApp(true));
                    setLoading(false);
                    dispatch(setLoadingButton(false));
                })
        }
    }

    return (
        <ScrollView style={{
            backgroundColor: theme.background,
            borderColor: theme.border, borderTopWidth: 1,
            paddingHorizontal: 15,
            paddingVertical: 15
        }} keyboardShouldPersistTaps='handled'>
            {showError ?
                <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowError(false) }} singleButton title={strings.error}>
                    <TextNormalYambiGray text={strings.fields_error_validation} />
                </ModalApp> : null}

            {showInternetError ?
                <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowInternetError(false) }} singleButton title={strings.error}>
                    <TextNormalYambiGray text={strings.connection_failed} />
                </ModalApp> : null}

            <View style={{ backgroundColor: theme.background, marginBottom: 15 }}>
                <TextSmallYambiGray text={strings.sales_point_name} styles={{ marginLeft: 2, marginBottom: 5 }} />
                <TextInput
                    placeholderTextColor="gray"
                    maxLength={100}
                    style={{ color: theme.text, backgroundColor: theme.border, paddingLeft: 15, height: 45, borderRadius: 5 }}
                    value={name}
                    onChangeText={text => setName(text)}
                />
            </View>

            <View style={{ backgroundColor: theme.background, marginBottom: 15 }}>
                <TextSmallYambiGray text={strings.description} styles={{ marginLeft: 2, marginBottom: 5 }} />
                <TextInput
                    placeholderTextColor="gray"
                    maxLength={700}
                    multiline={true}
                    style={{ color: theme.text, backgroundColor: theme.border, paddingLeft: 15, minHeight: 45, borderRadius: 5 }}
                    value={description}
                    onChangeText={text => setDescription(text)}
                />
            </View>

            <View style={{ backgroundColor: theme.background, marginBottom: 15 }}>
                <TextSmallYambiGray text={strings.address} styles={{ marginLeft: 2, marginBottom: 5 }} />
                <TextInput
                    placeholderTextColor="gray"
                    maxLength={50}
                    style={{ color: theme.text, backgroundColor: theme.border, paddingLeft: 15, height: 45, borderRadius: 5 }}
                    value={address}
                    onChangeText={text => setAddress(text)}
                />
            </View>

            <View style={{ backgroundColor: theme.background, marginBottom: 15 }}>
                <TextSmallYambiGray text={strings.emails} styles={{ marginLeft: 2, marginBottom: 5 }} />
                <TextInput
                    placeholderTextColor="gray"
                    maxLength={70}
                    style={{ color: theme.text, backgroundColor: theme.border, paddingLeft: 15, height: 45, borderRadius: 5 }}
                    value={emails}
                    keyboardType="email-address"
                    onChangeText={text => setEmails(text)}
                />
            </View>

            <View style={{ backgroundColor: theme.background, marginBottom: 15 }}>
                <TextSmallYambiGray text={strings.phones} styles={{ marginLeft: 2, marginBottom: 5 }} />
                <TextInput
                    placeholderTextColor="gray"
                    maxLength={45}
                    style={{ color: theme.text, backgroundColor: theme.border, paddingLeft: 15, height: 45, borderRadius: 5 }}
                    value={phones}
                    onChangeText={text => setPhones(text)}
                />
            </View>

            <View style={{ backgroundColor: theme.background, marginBottom: 15 }}>
                <TextSmallYambiGray text={strings.tva_rate} styles={{ marginLeft: 2, marginBottom: 5 }} />
                <TextInput
                    placeholderTextColor="gray"
                    maxLength={5}
                    keyboardType="numeric"
                    style={{ color: theme.text, backgroundColor: theme.border, paddingLeft: 15, height: 45, borderRadius: 5 }}
                    value={tva}
                    onChangeText={text => setTva(text)}
                    placeholder="0"
                />
            </View>

            <ButtonNormal title={strings.edit_sales_point} loading={loading} onPress={EditPointOfSales} styles={{ paddingHorizontal: 20, marginVertical: 20 }} normal={true} />
        </ScrollView>
    )
}

export default EditSalesPoint;
