import { Pressable, View, ScrollView, TextInput } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useState } from 'react';
import { useAppDispatch, useAppSelector } from "../../store/app/hooks";
import { strings } from "../../lang/lang";
import ButtonNormal from "../../components/app/ButtonNormal";
import { IconApp } from "../../components/app/IconApp";
import { YambiText } from "../../components/app/Text";
import ModalApp from "../../components/app/ModalApp";
import BottomSheet from "../../components/app/BottomSheet";
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
    const user_data = useAppSelector(state => state.user_data);
    const [category, setCategory] = useState<number | null>(null);
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
    ];

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
            };

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
                    };

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
                    };

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
                });
        }
    };

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
        };

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
                };

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
            });
    };

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
            {/* Header Title Section */}
            <View style={{
                alignItems: 'center',
                marginVertical: 24,
            }}>
                <View style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    backgroundColor: theme.high_color + "15",
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 12
                }}>
                    <IconApp pack="FI" name="briefcase" size={28} color={theme.high_color} />
                </View>
                <YambiText
                    text={strings.new_business}
                    bold
                    size="big"
                    style={{ fontSize: 22, textAlign: 'center' }}
                />
            </View>

            {/* Error Modals */}
            {showError ? (
                <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowError(false); }} singleButton title={strings.error}>
                    <YambiText color="gray" text={strings.fields_error_validation} />
                </ModalApp>
            ) : null}

            {showInternetError ? (
                <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowInternetError(false); }} singleButton title={strings.error}>
                    <YambiText color="gray" text={strings.connection_failed} />
                </ModalApp>
            ) : null}

            {/* CARD 1: General Information */}
            <View style={{
                backgroundColor: theme.border + "15",
                borderRadius: 16,
                padding: 16,
                marginBottom: 20,
                borderWidth: 1,
                borderColor: theme.border,
            }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                    <View style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        backgroundColor: theme.high_color + "20",
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 10,
                    }}>
                        <IconApp pack="FI" name="briefcase" size={18} color={theme.high_color} />
                    </View>
                    <YambiText bold text={strings.business_information} style={{ fontSize: 16 }} />
                </View>

                {/* Category Selector Pressable */}
                <Pressable
                    onPress={() => setShowCategories(true)}
                    style={{
                        backgroundColor: theme.background,
                        padding: 14,
                        borderRadius: 12,
                        marginBottom: 14,
                        borderWidth: 1,
                        borderColor: category !== null ? theme.high_color + "60" : theme.border,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <View style={{ flex: 1, marginRight: 10 }}>
                        <YambiText
                            size="small"
                            color="gray"
                            text={category !== null ? strings.category + " (" + strings.select_category + ")" : strings.category}
                            style={{ marginBottom: 4 }}
                        />
                        <YambiText
                            color="high"
                            text={category === null ? strings.select_category : renderCategoryName(category)}
                            style={{ fontSize: 15, fontWeight: '600' }}
                        />
                    </View>
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: theme.high_color + "15",
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 8,
                    }}>
                        <IconApp pack="FI" name="layers" size={16} color={theme.high_color} styles={{ marginRight: 6 }} />
                        <IconApp pack="FI" name="chevron-down" size={16} color={theme.high_color} />
                    </View>
                </Pressable>

                {/* Business Name Field */}
                <View style={{ marginBottom: 14 }}>
                    <YambiText size="small" color="gray" text={strings.business_name} style={{ marginLeft: 2, marginBottom: 6 }} />
                    <TextInput
                        placeholderTextColor={theme.gray}
                        style={{
                            backgroundColor: theme.background,
                            padding: 14,
                            borderRadius: 12,
                            color: theme.text,
                            fontSize: 15,
                            borderWidth: 1,
                            borderColor: theme.border,
                        }}
                        placeholder={strings.enter_business_name}
                        value={name}
                        onChangeText={setName}
                        maxLength={100}
                    />
                </View>

                {/* Description Field */}
                <View style={{ marginBottom: 14 }}>
                    <YambiText size="small" color="gray" text={strings.description} style={{ marginLeft: 2, marginBottom: 6 }} />
                    <TextInput
                        placeholderTextColor={theme.gray}
                        multiline
                        style={{
                            backgroundColor: theme.background,
                            padding: 14,
                            borderRadius: 12,
                            color: theme.text,
                            fontSize: 15,
                            borderWidth: 1,
                            borderColor: theme.border,
                            minHeight: 80,
                            textAlignVertical: 'top',
                        }}
                        placeholder={strings.describe_business_services}
                        value={description}
                        onChangeText={setDescription}
                        maxLength={700}
                    />
                </View>

                {/* Address Field */}
                <View style={{ marginBottom: 4 }}>
                    <YambiText size="small" color="gray" text={strings.address} style={{ marginLeft: 2, marginBottom: 6 }} />
                    <TextInput
                        placeholderTextColor={theme.gray}
                        style={{
                            backgroundColor: theme.background,
                            padding: 14,
                            borderRadius: 12,
                            color: theme.text,
                            fontSize: 15,
                            borderWidth: 1,
                            borderColor: theme.border,
                        }}
                        placeholder={strings.physical_address}
                        value={address}
                        onChangeText={setAddress}
                        maxLength={70}
                    />
                </View>
            </View>

            {/* CARD 2: Legal & Registration */}
            <View style={{
                backgroundColor: theme.border + "15",
                borderRadius: 16,
                padding: 16,
                marginBottom: 20,
                borderWidth: 1,
                borderColor: theme.border,
            }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                    <View style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        backgroundColor: theme.high_color + "20",
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 10,
                    }}>
                        <IconApp pack="FI" name="file-text" size={18} color={theme.high_color} />
                    </View>
                    <YambiText bold text={strings.legal_registration_optional} style={{ fontSize: 16 }} />
                </View>

                {/* National ID Field */}
                <View style={{ marginBottom: 14 }}>
                    <YambiText size="small" color="gray" text={strings.national_id} style={{ marginLeft: 2, marginBottom: 6 }} />
                    <TextInput
                        placeholderTextColor={theme.gray}
                        style={{
                            backgroundColor: theme.background,
                            padding: 14,
                            borderRadius: 12,
                            color: theme.text,
                            fontSize: 15,
                            borderWidth: 1,
                            borderColor: theme.border,
                        }}
                        placeholder={strings.national_id}
                        value={national_id}
                        onChangeText={setNational_id}
                        maxLength={25}
                    />
                </View>

                {/* Identification Number Field */}
                <View style={{ marginBottom: 14 }}>
                    <YambiText size="small" color="gray" text={strings.identification_number} style={{ marginLeft: 2, marginBottom: 6 }} />
                    <TextInput
                        placeholderTextColor={theme.gray}
                        style={{
                            backgroundColor: theme.background,
                            padding: 14,
                            borderRadius: 12,
                            color: theme.text,
                            fontSize: 15,
                            borderWidth: 1,
                            borderColor: theme.border,
                        }}
                        placeholder={strings.identification_number}
                        value={identification_number}
                        onChangeText={setIdentification_number}
                        maxLength={25}
                    />
                </View>

                {/* Tax Number Field */}
                <View style={{ marginBottom: 4 }}>
                    <YambiText size="small" color="gray" text={strings.tax_number} style={{ marginLeft: 2, marginBottom: 6 }} />
                    <TextInput
                        placeholderTextColor={theme.gray}
                        style={{
                            backgroundColor: theme.background,
                            padding: 14,
                            borderRadius: 12,
                            color: theme.text,
                            fontSize: 15,
                            borderWidth: 1,
                            borderColor: theme.border,
                        }}
                        placeholder={strings.tax_number}
                        value={tax_number}
                        onChangeText={setTax_number}
                        maxLength={25}
                    />
                </View>
            </View>

            {/* CARD 3: Contact Channels */}
            <View style={{
                backgroundColor: theme.border + "15",
                borderRadius: 16,
                padding: 16,
                marginBottom: 20,
                borderWidth: 1,
                borderColor: theme.border,
            }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                    <View style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        backgroundColor: theme.high_color + "20",
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 10,
                    }}>
                        <IconApp pack="FI" name="phone-call" size={18} color={theme.high_color} />
                    </View>
                    <YambiText bold text={strings.contact_information_optional} style={{ fontSize: 16 }} />
                </View>

                {/* Phones Field */}
                <View style={{ marginBottom: 14 }}>
                    <YambiText size="small" color="gray" text={strings.phones} style={{ marginLeft: 2, marginBottom: 6 }} />
                    <TextInput
                        placeholderTextColor={theme.gray}
                        style={{
                            backgroundColor: theme.background,
                            padding: 14,
                            borderRadius: 12,
                            color: theme.text,
                            fontSize: 15,
                            borderWidth: 1,
                            borderColor: theme.border,
                        }}
                        placeholder={strings.placeholder_phone}
                        value={phones}
                        onChangeText={setPhones}
                        maxLength={45}
                    />
                </View>

                {/* Emails Field */}
                <View style={{ marginBottom: 4 }}>
                    <YambiText size="small" color="gray" text={strings.emails} style={{ marginLeft: 2, marginBottom: 6 }} />
                    <TextInput
                        placeholderTextColor={theme.gray}
                        keyboardType="email-address"
                        style={{
                            backgroundColor: theme.background,
                            padding: 14,
                            borderRadius: 12,
                            color: theme.text,
                            fontSize: 15,
                            borderWidth: 1,
                            borderColor: theme.border,
                        }}
                        placeholder={strings.placeholder_email}
                        value={emails}
                        onChangeText={setEmails}
                        maxLength={70}
                    />
                </View>
            </View>

            {/* CARD 4: Options / Main Site Toggle */}
            <View style={{
                backgroundColor: theme.border + "15",
                borderRadius: 16,
                padding: 16,
                marginBottom: 24,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderWidth: 1,
                borderColor: theme.border,
            }}>
                <View style={{ flex: 1, marginRight: 16 }}>
                    <YambiText bold text={strings.define_as_main_site} style={{ fontSize: 15, marginBottom: 2 }} />
                    <YambiText size="small" color="gray" text={strings.define_as_main_site_description} style={{ lineHeight: 16 }} />
                </View>
                <SwitchApp value={define_as_main_site} onPress={() => setDefine_as_main_site(!define_as_main_site)} small />
            </View>

            {/* BottomSheet for Category Selection */}
            {showCategories ? (
                <BottomSheet
                    visible={showCategories}
                    onClose={() => setShowCategories(false)}
                >
                    <View style={{ paddingBottom: 10, paddingHorizontal: 20 }}>
                        {categories.map((catName, index) => {
                            const catId = index + 1;
                            const isSelected = category === catId;
                            return (
                                <Pressable
                                    key={index}
                                    onPress={() => {
                                        setCategory(catId);
                                    }}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        paddingVertical: 14,
                                        paddingHorizontal: 14,
                                        borderRadius: 12,
                                        marginVertical: 3,
                                        backgroundColor: isSelected ? theme.high_color + "18" : 'transparent',
                                        borderWidth: 1,
                                        borderColor: isSelected ? theme.high_color + "50" : 'transparent',
                                    }}
                                >
                                    <View style={{
                                        width: 30,
                                        height: 30,
                                        borderRadius: 15,
                                        backgroundColor: isSelected ? theme.button_background_color : theme.border,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        marginRight: 12,
                                    }}>
                                        <YambiText
                                            text={`${catId}`}
                                            bold
                                            size="xsmall"
                                            color={isSelected ? theme.button_foreground_color : theme.text}
                                        />
                                    </View>
                                    <YambiText
                                        text={catName}
                                        bold={isSelected}
                                        style={{
                                            flex: 1,
                                            fontSize: 15,
                                            color: isSelected ? theme.high_color : theme.text,
                                        }}
                                    />
                                    {isSelected ? (
                                        <IconApp pack="IO" name="checkmark-circle" size={22} color={theme.high_color} />
                                    ) : null}
                                </Pressable>
                            );
                        })}
                    </View>
                </BottomSheet>
            ) : null}

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
    );
};

export default NewBusinesses;
