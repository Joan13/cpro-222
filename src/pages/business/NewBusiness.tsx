import { Text, Pressable, View, Alert, ScrollView, TextInput } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from "../../store/app/hooks";
import { strings } from "../../lang/lang";
import ButtonNormal from "../../components/app/ButtonNormal";
import { IconApp } from "../../components/app/IconApp";
import { TextBigYambi, TextNormalYambi, TextNormalYambiGray, TextNormalYambiHighColor, TextSmallYambiGray } from "../../components/app/Text";
import ModalApp from "../../components/app/ModalApp";
import { FlashList } from "@shopify/flash-list";
import { setLoadingButton, setShowModalApp } from "../../store/reducers/appSlice";
import { randomString, remote_host, renderCategoryName, renderDateUpToMilliseconds } from "../../../GlobalVariables";
import axios from "axios";
import { TBusiness, TBusinessUser, TSellsPoint } from "../../types/types";
import { useRealm } from "@realm/react";
import * as RootNavigation from './../../services/Navigation_ref';
import moment from "moment";
import SwitchApp from "../../components/app/SwitchApp";

const NewBusinesses = () => {

    const theme = useAppSelector(state => state.app_theme.colors);
    const loading_app = useAppSelector(state => state.app.loading);
    const user_data = useAppSelector(state => state.user_data);
    const app_description = useAppSelector(state => state.persisted_app.app_description);
    const [category, setCategory] = useState<number>(null);
    const [name, setName] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [address, setAddress] = useState<string>("");
    const [define_as_main_site, setDefine_as_main_site] = useState<boolean>(true);
    const [showError, setShowError] = useState<boolean>(false);
    const [showCategories, setShowCategories] = useState<boolean>(false);
    const [showInternetError, setShowInternetError] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [national_id, setNational_id] = useState<string>("");
    const [identification_number, setIdentification_number] = useState<string>("");
    const [tax_number, setTax_number] = useState<string>("");
    const [phones, setPhones] = useState<string>("");
    const [emails, setEmails] = useState<string>("");
    // const category = useAppSelector(state=>state.app.category);
    // const businesses = useAppSelector(state => state.businesses);
    const businesses = [];
    const dispatch = useAppDispatch();
    const navigation = useNavigation();
    const realm = useRealm();

    const categories = [
        strings.retail,
        strings.manufacturing,
        strings.healthcare,
        strings.technology,
        strings.finance,
        strings.education,
        strings.hospitality,
        strings.real_estate,
        strings.entertainment,
        strings.transportation,
        strings.energy,
        strings.agriculture,
        strings.fashion_textile,
        strings.communication_media,
        strings.food_beverages,
        strings.business_services,
        strings.biotechnology,
        strings.telecommunications
    ]

    // useEffect(() => {
    //     // console.log(businesses.length);
    // }, []);

    const NewBusiness = () => {

        if (name === "" || category === null || address === "") {
            setShowError(true);
            dispatch(setShowModalApp(true));
        } else {
            setLoading(true);
            dispatch(setLoadingButton(true));
            const businessID = randomString(5).toUpperCase() + renderDateUpToMilliseconds();

            const business = {
                _id: businessID,
                phone_number: user_data.phone_number,
                business_name: name,
                slogan: "",
                description_service: description,
                category: category,
                keywords: "",
                currency: 1,
                national_number: national_id,
                national_id: identification_number,
                tax_number: tax_number,
                country: user_data.country,
                state: "",
                city: "",
                logo: "",
                phones: phones,
                emails: emails,
                background: "",
                business_active: 0,
                business_address: address,
                business_visible: 0,
                website: "",
                other_links: "",
                yambi: ""
            }

            axios.post(remote_host + "/yambi/API/new_business", { business: business })
                .then(json => {
                    const bb = json.data.business;
                    const bu = json.data.business_user;
                    const new_business: TBusiness = {
                        _id: bb._id,
                        phone_number: user_data.phone_number,
                        business_name: name,
                        slogan: "",
                        description_service: description,
                        category: category,
                        keywords: "",
                        currency: 1,
                        logo: "",
                        phones: phones,
                        emails: emails,
                        background: "",
                        national_number: national_id,
                        national_id: identification_number,
                        tax_number: tax_number,
                        country: user_data.country,
                        state: "",
                        city: "",
                        business_active: bb.business_active,
                        business_address: address,
                        business_visible: bb.business_visible,
                        website: "",
                        other_links: "",
                        yambi: "",
                        valid_until: "",
                        createdAt: bb.createdAt,
                        updatedAt: bb.updatedAt
                    }

                    const business_user: TBusinessUser = {
                        _id: bu._id,
                        business_id: bb._id,
                        user_name: user_data.user_names,
                        phone_number: bb.phone_number,
                        sales_point_id: "",
                        user: bb.phone_number,
                        level: 1,
                        user_active: 1,
                        createdAt: moment(new Date()).format(),
                        updatedAt: moment(new Date()).format()
                    }

                    realm.write(() => {
                        try {
                            realm.create('Businesses', new_business);
                        } catch (error) { }

                        try {
                            realm.create('BusinessUsers', business_user);
                        } catch (error) { }
                    });

                    if (define_as_main_site) {
                        NewSellsPoint(new_business);
                    } else {
                        setName("");
                        setDescription("");
                        setCategory(null);
                        setAddress("");
                        setIdentification_number("");
                        setNational_id("");
                        setPhones("");
                        setEmails("");
                        setDefine_as_main_site(false);
                        setLoading(false);
                        dispatch(setLoadingButton(false));

                        setTimeout(() => {
                            RootNavigation.navigate("Home");
                        }, 300);
                    }
                })
                .catch(error => {
                    setShowInternetError(true);
                    dispatch(setShowModalApp(true));
                    setLoading(false);
                    dispatch(setLoadingButton(false));
                })
        }
    }

    const NewSellsPoint = (NewBusiness: TBusiness) => {
        const sellsPointID = randomString(5).toUpperCase() + renderDateUpToMilliseconds();

        const sells_point = {
            _id: sellsPointID,
            business_id: NewBusiness._id,
            phone_number: user_data.phone_number,
            sells_point_name: NewBusiness.business_name,
            slogan: "",
            description_service: NewBusiness.description_service,
            category: NewBusiness.category,
            tva: "",
            logo: "",
            country: user_data.country,
            phones: phones,
            emails: emails,
            background: "",
            sells_point_active: 0,
            sells_point_address: NewBusiness.business_address,
            sells_point_visible: 0,
            website: "",
            other_links: "",
            yambi: ""
        }

        axios.post(remote_host + "/yambi/API/new_sells_point", { sells_point: sells_point })
            .then(json => {
                const sp = json.data.new_sells_point;
                const new_sells_point: TSellsPoint = {
                    _id: sellsPointID,
                    business_id: sp.business_id,
                    sells_point_name: sp.sells_point_name,
                    phone_number: sp.phone_number,
                    slogan: "",
                    description_service: sp.description_service,
                    category: sp.category,
                    keywords: "",
                    country: user_data.country,
                    logo: "",
                    phones: phones,
                    emails: emails,
                    background: "",
                    notifications: 0,
                    sells_point_active: 0,
                    sells_point_address: sp.sells_point_address,
                    sells_point_visible: 0,
                    website: "",
                    other_links: "",
                    yambi: "",
                    tva: "16",
                    createdAt: sp.createdAt,
                    updatedAt: sp.updatedAt
                }

                realm.write(() => {
                    try {
                        realm.create('SellsPoints', new_sells_point, true);
                    } catch (error) { }
                });

                setLoading(false);
                dispatch(setLoadingButton(false));

                setName("");
                setDescription("");
                setCategory(null);
                setAddress("");
                setDefine_as_main_site(false);

                setTimeout(() => {
                    RootNavigation.navigate("Home");
                }, 300);
            })
            .catch(error => {
                setShowInternetError(true);
                dispatch(setShowModalApp(true));
                setLoading(false);
                dispatch(setLoadingButton(false));
            })
    }

    const EditWorkspace = () => {
        Alert.alert("Information", "Impossible d'éditer les informations sur votre entreprise pour le moment");
    }

    const Category = ({ item, index, selectCategory }: { item: string, index: number, selectCategory: (category: string) => void }) => {

        const pressCategory = () => {
            selectCategory(item);
            dispatch(setShowModalApp(false));
            setShowCategories(false);
        };

        return (
            <Pressable style={{ flex: 1, flexDirection: 'row', paddingHorizontal: 3, height: 50, alignItems: 'center', borderBottomWidth: 1, borderColor: theme.border }} onPress={pressCategory}>
                <TextNormalYambi text={index + 1 + "."} styles={{ width: 35 }} />
                <TextNormalYambi text={item.toUpperCase()} styles={{ flex: 1 }} />
            </Pressable>
        )
    }

    const Categories = () => {
        return (
            <View style={{
                width: '100%',
                height: 300
            }}>
                <FlashList
                    data={categories}
                    estimatedItemSize={50}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item, index }: { item: string, index: number }) => (<Category selectCategory={(item) => setCategory(index + 1)} item={item} index={index} />)}
                />
            </View>
        )
    }

    return (
        <ScrollView style={{
            backgroundColor: theme.background,
            borderColor: theme.border, borderTopWidth: 1,
            paddingHorizontal: 15
        }}>
            <View>
                <TextBigYambi text={"Hey " + user_data.user_names + "!"} bold styles={{ marginHorizontal: 0, marginTop: 10 }} />
                <TextNormalYambiGray text={strings.information_create_business} styles={{ marginTop: 15 }} />

                {/* <Pressable style={{
                    marginTop: 15
                }}>
                    <Text style={{
                        fontSize: app_description.general_font_size,
                        color: theme.high_color
                    }}>{strings.videos_create_business}</Text>
                </Pressable> */}
            </View>

            {/* <View style={{
                justifyContent: 'center',
                alignItems: 'center',
            }}>
                <IconApp pack="IO" color={theme.text} size={70} name="business" />

                <Text style={{
                    margin: 40,
                    marginBottom: 20,
                    color: theme.gray,
                    textAlign: 'center'
                }}>{strings.no_workspace}</Text>

                <ButtonNormal title={strings.new_business} loadEnabled={false} onPress={NewBusiness} styles={{ paddingHorizontal: 20 }} normal={true} />
            </View> */}

            <View style={{ marginTop: 20, borderTopWidth: 1, borderColor: theme.gray }}>

                <TextNormalYambi bold text={strings.business_information} styles={{ marginVertical: 20 }} />

                {showError ?
                    <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowError(false) }} singleButton title={strings.error}>
                        <TextNormalYambiGray text={strings.fields_error_validation} />
                    </ModalApp> : null}

                {showInternetError ?
                    <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowInternetError(false) }} singleButton title={strings.error}>
                        <TextNormalYambiGray text={strings.connection_failed} />
                    </ModalApp> : null}

                <View style={{ backgroundColor: theme.background, marginBottom: 30, marginTop: 10 }}>
                    <Pressable onPress={() => { dispatch(setShowModalApp(true)); setShowCategories(true) }}>
                        <TextSmallYambiGray text={category !== null ? strings.category + " (" + strings.select_category + ")" : strings.category} styles={{ marginLeft: 2, marginBottom: 5 }} />
                        <TextNormalYambiHighColor text={category === null ? strings.select_category : renderCategoryName(category)} styles={{ marginLeft: 2, marginTop: 5 }} />
                    </Pressable>
                </View>

                <View style={{ marginBottom: 15 }}>
                    <TextSmallYambiGray text={strings.business_name} styles={{ marginLeft: 2, marginBottom: 5 }} />
                    <TextInput
                        placeholderTextColor="gray"
                        maxLength={100}
                        style={{ color: theme.text, backgroundColor: theme.border, paddingLeft: 15, height: 45, borderRadius: 5 }}
                        value={name}
                        onChangeText={text => setName(text)}
                    />
                </View>

                <View style={{ marginBottom: 15 }}>
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

                <View style={{ marginBottom: 15 }}>
                    <TextSmallYambiGray text={strings.address} styles={{ marginLeft: 2, marginBottom: 5 }} />
                    <TextInput
                        placeholderTextColor="gray"
                        maxLength={70}
                        style={{ color: theme.text, backgroundColor: theme.border, paddingLeft: 15, height: 45, borderRadius: 5 }}
                        value={address}
                        onChangeText={text => setAddress(text)}
                    />
                </View>

                <View style={{ marginBottom: 15 }}>
                    <TextSmallYambiGray text={strings.national_id} styles={{ marginLeft: 2, marginBottom: 5 }} />
                    <TextInput
                        placeholderTextColor="gray"
                        maxLength={25}
                        style={{ color: theme.text, backgroundColor: theme.border, paddingLeft: 15, height: 45, borderRadius: 5 }}
                        value={national_id}
                        onChangeText={text => setNational_id(text)}
                    />
                </View>

                <View style={{ marginBottom: 15 }}>
                    <TextSmallYambiGray text={strings.identification_number} styles={{ marginLeft: 2, marginBottom: 5 }} />
                    <TextInput
                        placeholderTextColor="gray"
                        maxLength={25}
                        style={{ color: theme.text, backgroundColor: theme.border, paddingLeft: 15, height: 45, borderRadius: 5 }}
                        value={identification_number}
                        onChangeText={text => setIdentification_number(text)}
                    />
                </View>

                <View style={{ marginBottom: 15 }}>
                    <TextSmallYambiGray text={strings.tax_number} styles={{ marginLeft: 2, marginBottom: 5 }} />
                    <TextInput
                        placeholderTextColor="gray"
                        maxLength={25}
                        style={{ color: theme.text, backgroundColor: theme.border, paddingLeft: 15, height: 45, borderRadius: 5 }}
                        value={tax_number}
                        onChangeText={text => setTax_number(text)}
                    />
                </View>

                <View style={{ marginBottom: 15 }}>
                    <TextSmallYambiGray text={strings.phones} styles={{ marginLeft: 2, marginBottom: 5 }} />
                    <TextInput
                        placeholderTextColor="gray"
                        maxLength={45}
                        style={{ color: theme.text, backgroundColor: theme.border, paddingLeft: 15, height: 45, borderRadius: 5 }}
                        value={phones}
                        onChangeText={text => setPhones(text)}
                    />
                </View>

                <View style={{ marginBottom: 15 }}>
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

                {showCategories ?
                    <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowCategories(false) }} singleButton title={strings.select_category}>
                        <Categories />
                    </ModalApp> : null}

                <Pressable
                    onPress={() => setDefine_as_main_site(!define_as_main_site)}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginTop: 10,
                        marginLeft: 2
                    }}>
                    {/* // <IconApp pack="FI" name="check-circle" size={15} color={theme.high_color} /> :
                        // <IconApp pack="FI" name="circle" size={15} color={theme.gray} />}
                    {define_as_main_site ? */}

                    <SwitchApp value={define_as_main_site} onPress={() => setDefine_as_main_site(!define_as_main_site)} small />
                    <TextNormalYambi text={strings.define_as_main_site} styles={{ marginLeft: 8 }} />
                </Pressable>

                <ButtonNormal title={strings.new_business} loading={loading} onPress={NewBusiness} styles={{ paddingHorizontal: 20, marginVertical: 20 }} normal={true} />

            </View>
        </ScrollView>
    )
}

export default NewBusinesses;
