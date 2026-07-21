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

const FormInput = ({
    label,
    value,
    onChangeText,
    placeholder,
    maxLength,
    multiline = false,
    keyboardType = "default",
    theme
}: {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    maxLength?: number;
    multiline?: boolean;
    keyboardType?: any;
    theme: any;
}) => {
    return (
        <View style={{ marginBottom: 16 }}>
            <Text style={{
                fontSize: 13,
                fontWeight: '600',
                color: theme.gray,
                marginBottom: 6,
                marginLeft: 2
            }}>
                {label}
            </Text>
            <TextInput
                placeholder={placeholder}
                placeholderTextColor={theme.gray}
                maxLength={maxLength}
                multiline={multiline}
                keyboardType={keyboardType}
                style={{
                    color: theme.text,
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                    borderWidth: 1,
                    paddingHorizontal: 16,
                    paddingVertical: multiline ? 12 : 10,
                    height: multiline ? undefined : 46,
                    minHeight: multiline ? 80 : undefined,
                    borderRadius: 12,
                    fontSize: 15,
                    textAlignVertical: multiline ? 'top' : 'center'
                }}
                value={value}
                onChangeText={onChangeText}
            />
        </View>
    );
};

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
                            RootNavigation.navigate("BusinessSales", { business_id: new_business._id, sales_point_id: "", item_id: "" });
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
                    RootNavigation.navigate("BusinessSales", { business_id: NewBusiness._id, sales_point_id: "", item_id: "" });
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
        <ScrollView
            style={{
                backgroundColor: theme.background,
                borderColor: theme.border,
                borderTopWidth: 1,
            }}
            contentContainerStyle={{
                paddingHorizontal: 16,
                paddingBottom: 40
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
        >
            {/* Modern visual header */}
            <View style={{
                alignItems: 'center',
                marginVertical: 24,
            }}>
                <View style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    backgroundColor: (theme.high_color || '#1E68FF') + '15',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 12
                }}>
                    <IconApp pack="FI" name="briefcase" size={28} color={theme.high_color || '#1E68FF'} />
                </View>
                <Text style={{
                    fontSize: 22,
                    fontWeight: '800',
                    color: theme.text,
                    textAlign: 'center',
                }}>
                    {strings.new_business}
                </Text>
            </View>

            {showError ?
                <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowError(false) }} singleButton title={strings.error}>
                    <TextNormalYambiGray text={strings.fields_error_validation} />
                </ModalApp> : null}

            {showInternetError ?
                <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowInternetError(false) }} singleButton title={strings.error}>
                    <TextNormalYambiGray text={strings.connection_failed} />
                </ModalApp> : null}

            {/* CARD 1: Basic Information */}
            <View style={{
                backgroundColor: theme.card,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: theme.border,
                padding: 16,
                marginBottom: 20,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.03,
                shadowRadius: 6,
                // elevation: 1
            }}>
                <Text style={{
                    fontSize: 15,
                    fontWeight: '700',
                    color: theme.text,
                    marginBottom: 16
                }}>
                    {strings.business_information}
                </Text>

                {/* Category Selector Pressable */}
                <Text style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: theme.gray,
                    marginBottom: 6,
                    marginLeft: 2
                }}>
                    {strings.category}
                </Text>
                <Pressable
                    onPress={() => { dispatch(setShowModalApp(true)); setShowCategories(true) }}
                    style={({ pressed }) => ({
                        backgroundColor: theme.background,
                        borderColor: theme.border,
                        borderWidth: 1,
                        borderRadius: 12,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 16,
                        opacity: pressed ? 0.8 : 1,
                        height: 46
                    })}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 }}>
                        <IconApp pack="FI" name="grid" size={16} color={theme.high_color || '#1E68FF'} styles={{ marginRight: 8 }} />
                        <Text style={{
                            fontSize: 15,
                            fontWeight: '600',
                            color: category === null ? theme.gray : theme.text,
                            flex: 1
                        }} numberOfLines={1}>
                            {category === null ? strings.select_category : renderCategoryName(category)}
                        </Text>
                    </View>
                    <IconApp pack="FI" name="chevron-down" size={18} color={theme.gray} />
                </Pressable>

                {/* Business Name Input */}
                <FormInput
                    label={strings.business_name}
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter business name"
                    maxLength={100}
                    theme={theme}
                />

                {/* Description Input */}
                <FormInput
                    label={strings.description}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Describe your business services..."
                    maxLength={700}
                    multiline
                    theme={theme}
                />

                {/* Address Input */}
                <FormInput
                    label={strings.address}
                    value={address}
                    onChangeText={setAddress}
                    placeholder="Physical address"
                    maxLength={70}
                    theme={theme}
                />
            </View>

            {/* CARD 2: Tax & Identification Numbers */}
            <View style={{
                backgroundColor: theme.card,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: theme.border,
                padding: 16,
                marginBottom: 20,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.03,
                shadowRadius: 6,
                // elevation: 1
            }}>
                <Text style={{
                    fontSize: 15,
                    fontWeight: '700',
                    color: theme.text,
                    marginBottom: 16
                }}>
                    Legal & Registration (Optional)
                </Text>

                <FormInput
                    label={strings.national_id}
                    value={national_id}
                    onChangeText={setNational_id}
                    placeholder="National ID"
                    maxLength={25}
                    theme={theme}
                />

                <FormInput
                    label={strings.identification_number}
                    value={identification_number}
                    onChangeText={setIdentification_number}
                    placeholder="Identification number"
                    maxLength={25}
                    theme={theme}
                />

                <FormInput
                    label={strings.tax_number}
                    value={tax_number}
                    onChangeText={setTax_number}
                    placeholder="Tax registration number"
                    maxLength={25}
                    theme={theme}
                />
            </View>

            {/* CARD 3: Contact Channels */}
            <View style={{
                backgroundColor: theme.card,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: theme.border,
                padding: 16,
                marginBottom: 20,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.03,
                shadowRadius: 6,
                // elevation: 1
            }}>
                <Text style={{
                    fontSize: 15,
                    fontWeight: '700',
                    color: theme.text,
                    marginBottom: 16
                }}>
                    Contact Information (Optional)
                </Text>

                <FormInput
                    label={strings.phones}
                    value={phones}
                    onChangeText={setPhones}
                    placeholder="e.g. +1234567890"
                    maxLength={45}
                    theme={theme}
                />

                <FormInput
                    label={strings.emails}
                    value={emails}
                    onChangeText={setEmails}
                    placeholder="e.g. contact@business.com"
                    maxLength={70}
                    keyboardType="email-address"
                    theme={theme}
                />
            </View>

            {/* Define as main site Switch Card */}
            <View style={{
                backgroundColor: theme.card,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: theme.border,
                padding: 16,
                marginBottom: 24,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.03,
                shadowRadius: 6,
                // elevation: 1
            }}>
                <View style={{ flex: 1, marginRight: 16 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text, marginBottom: 2 }}>
                        {strings.define_as_main_site}
                    </Text>
                    <Text style={{ fontSize: 12, color: theme.gray, lineHeight: 16 }}>
                        Automatically sets up this business as your primary sales location.
                    </Text>
                </View>
                <SwitchApp value={define_as_main_site} onPress={() => setDefine_as_main_site(!define_as_main_site)} small />
            </View>

            {/* Categories Selection Modal */}
            {showCategories ?
                <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowCategories(false) }} singleButton title={strings.select_category}>
                    <Categories />
                </ModalApp> : null}

            {/* Create Business Button */}
            <ButtonNormal
                title={strings.new_business}
                loading={loading}
                onPress={NewBusiness}
                iconPack="FI"
                iconName="check"
                iconSize={16}
                styles={{
                    paddingHorizontal: 20,
                    height: 48,
                    borderRadius: 24,
                    shadowColor: theme.high_color,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.15,
                    shadowRadius: 8,
                    elevation: 4,
                    marginBottom: 30
                }}
                normal={true}
            />
        </ScrollView>
    )
}

export default NewBusinesses;
