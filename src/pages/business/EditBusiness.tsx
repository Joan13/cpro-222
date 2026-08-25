import { View, ActivityIndicator, ScrollView, TextInput, Pressable, Platform } from "react-native";
import ImagePicker from '../../utils/imagePicker';
import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from "../../store/app/hooks";
import { strings } from "../../lang/lang";
import ButtonNormal from "../../components/app/ButtonNormal";
import { IconApp } from "../../components/app/IconApp";
import { YambiText } from "../../components/app/Text";
import ModalApp from "../../components/app/ModalApp";
import BottomSheet from "../../components/app/BottomSheet";
import { setLoadingButton, setShowModalApp } from "../../store/reducers/appSlice";
import { remote_host, remote_host_server, renderCategoryName, media_url } from "../../../GlobalVariables";
import axios from "axios";
import { NavProps, TBusiness } from "../../types/types";
import { useRealm } from "@realm/react";
import { Image as ExpoImage } from 'expo-image';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from "moment";
import * as MediaLibrary from 'expo-media-library';
import { PhotoEditor } from '../../components/lists/gallery/PhotoEditor';
import { ProcessedPhoto } from '../../types/gallery';

const EditBusiness = ({ navigation, route }: NavProps) => {

    const theme = useAppSelector(state => state.app_theme.colors);
    const loading_app = useAppSelector(state => state.app.loading);
    const user_data = useAppSelector(state => state.user_data);
    const app_description = useAppSelector(state => state.persisted_app.app_description);
    const [category, setCategory] = useState<number>(null);
    const [name, setName] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [address, setAddress] = useState<string>("");
    const [define_as_main_site, setDefine_as_main_site] = useState<boolean>(false);
    const [showError, setShowError] = useState<boolean>(false);
    const [showCategories, setShowCategories] = useState<boolean>(false);
    const [showInternetError, setShowInternetError] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [national_id, setNational_id] = useState<string>("");
    const [identification_number, setIdentification_number] = useState<string>("");
    const [tax_number, setTax_number] = useState<string>("");
    const [phones, setPhones] = useState<string>("");
    const [emails, setEmails] = useState<string>("");
    const [profile, setProfile] = useState<string>("");
    const [selectedAssets, setSelectedAssets] = useState<MediaLibrary.Asset[]>([]);
    const [showEditor, setShowEditor] = useState<boolean>(false);
    const [loading_profile, setLoading_profile] = useState<boolean>(false);

    // Admin controls
    const isAdmin = user_data?.user_level === 2;
    const [subscription_active, setSubscription_active] = useState<number>(0);
    const [valid_until, setValid_until] = useState<Date>(new Date());
    const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
    const dispatch = useAppDispatch();
    const realm = useRealm();

    const { business } = route.params;

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

    useEffect(() => {
        setName(business.business_name);
        setDescription(business.description_service);
        setCategory(business.category);
        setAddress(business.business_address);
        setIdentification_number(business.national_id);
        setTax_number(business.tax_number);
        setNational_id(business.national_number);
        setPhones(business.phones);
        setEmails(business.emails);

        // Admin controls initialization
        if (isAdmin) {
            setSubscription_active(business.subscription_active !== undefined ? business.subscription_active : 0);
            if (business.valid_until) {
                setValid_until(new Date(business.valid_until));
            } else {
                setValid_until(new Date());
            }
        }
    }, [business, isAdmin]);

    const EBusiness = () => {
        if (name === "" || category === null || address === "") {
            setShowError(true);
            dispatch(setShowModalApp(true));
        } else {
            setLoading(true);
            dispatch(setLoadingButton(true));

            const businesss = {
                _id: business._id,
                phone_number: business.phone_number,
                business_name: name,
                slogan: business.slogan,
                description_service: description,
                category: category,
                keywords: business.keywords,
                currency: business.currency,
                national_number: national_id,
                national_id: identification_number,
                tax_number: tax_number,
                country: business.country,
                state: business.state,
                city: business.city,
                valid_until: isAdmin ? valid_until.toISOString() : business.valid_until,
                logo: business.logo,
                phones: phones,
                emails: emails,
                background: business.background,
                business_active: business.business_active,
                business_address: address,
                business_visible: business.business_visible,
                website: business.website,
                other_links: business.other_links,
                yambi: business.yambi,
                subscription_active: isAdmin ? subscription_active : (business.subscription_active !== undefined ? business.subscription_active : 0),
                createdAt: business.createdAt,
                updatedAt: business.updatedAt
            };

            axios.post(remote_host + "/yambi/API/edit_business", { business: businesss, flag: "1" })
                .then(json => {
                    if (json.data.success === "1") {
                        realm.write(() => {
                            try {
                                realm.create('Businesses', businesss, true);
                            } catch (error) { console.log(error); }
                        });
                    }

                    setLoading(false);
                    dispatch(setLoadingButton(false));

                    setTimeout(() => {
                        navigation.navigate("Home");
                    }, 300);
                })
                .catch(error => {
                    setShowInternetError(true);
                    dispatch(setShowModalApp(true));
                    setLoading(false);
                    dispatch(setLoadingButton(false));
                });
        }
    };

    const ViewPhoto = () => {
        if (business.logo !== "") {
            navigation.navigate("ViewPhoto", { source: media_url + "/business_logos/" + business.logo });
        } else {
            navigation.navigate("ViewPhoto", { source: "" });
        }
    };

    const handleEditorComplete = (processedPhotos: ProcessedPhoto[]) => {
        if (processedPhotos && processedPhotos.length > 0) {
            setProfile(processedPhotos[0].uri);
        }
        setShowEditor(false);
    };

    const pick_profile = () => {
        if (profile === "") {
            (navigation as any).navigate('Gallery', {
                multiple: false,
                maxSelection: 1,
                onSelect: (assets: MediaLibrary.Asset[]) => {
                    if (assets && assets.length > 0) {
                        setSelectedAssets(assets);
                        setShowEditor(true);
                    }
                }
            });
        } else {
            upload_profile_picture();
        }
    };

    const upload_profile_picture = () => {
        setLoading_profile(true);

        const filename = Date.now() + '-' + Math.round(Math.random() * 1E9);

        let base_url = remote_host + "/yambi/API/upload_business_logo";
        let formData = new FormData();
        formData.append('assemble', business._id);
        formData.append('business_profile', business.logo);
        formData.append('image', { type: 'image/jpg', uri: profile, name: filename + 'profile.jpg' } as any);

        axios.post(base_url, formData, {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'multipart/form-data'
            }
        })
            .then(response => {
                setLoading_profile(false);

                if (response.data.message === "1" && response.data.assemble === business._id) {
                    const bbb: TBusiness = {
                        _id: business._id,
                        phone_number: business.phone_number,
                        business_name: name,
                        slogan: business.slogan,
                        description_service: description,
                        category: category,
                        keywords: business.keywords,
                        currency: business.currency,
                        national_number: national_id,
                        national_id: identification_number,
                        tax_number: tax_number,
                        country: business.country,
                        state: business.state,
                        city: business.city,
                        valid_until: business.valid_until,
                        logo: response.data.business_profile,
                        phones: phones,
                        emails: emails,
                        background: business.background,
                        business_active: business.business_active,
                        business_address: address,
                        business_visible: business.business_visible,
                        website: business.website,
                        other_links: business.other_links,
                        yambi: business.yambi,
                        createdAt: business.createdAt,
                        updatedAt: business.updatedAt
                    };

                    realm.write(() => {
                        try {
                            realm.create('Businesses', bbb, true);
                        } catch (error) { }
                    });
                }

                setProfile("");
            })
            .catch((error) => {
                setShowInternetError(true);
                dispatch(setShowModalApp(true));
                setLoading_profile(false);
            });
    };

    return (
        <ScrollView
            style={{
                flex: 1,
                backgroundColor: theme.background,
            }}
            contentContainerStyle={{
                padding: 16,
                paddingBottom: 40,
            }}
            showsVerticalScrollIndicator={false}
        >
            {/* Header / Profile Logo Section */}
            <View style={{
                backgroundColor: theme.border + "20",
                borderRadius: 20,
                padding: 20,
                alignItems: 'center',
                marginBottom: 20,
                borderWidth: 1,
                borderColor: theme.border,
            }}>
                <View style={{ position: 'relative', marginBottom: 12 }}>
                    <Pressable onPress={ViewPhoto} style={{
                        width: 120,
                        height: 120,
                        borderRadius: 60,
                        borderWidth: 3,
                        borderColor: theme.high_color,
                        justifyContent: 'center',
                        alignItems: 'center',
                        overflow: 'hidden',
                        backgroundColor: theme.background,
                    }}>
                        {business.logo === "" ? (
                            <ExpoImage
                                style={{ width: 75, height: 75 }}
                                contentFit="contain"
                                source={require("./../../assets/budget.png")}
                            />
                        ) : (
                            <ExpoImage
                                style={{ width: 120, height: 120, borderRadius: 60 }}
                                contentFit="cover"
                                source={media_url + "/business_logos/" + business.logo}
                            />
                        )}
                    </Pressable>

                    <Pressable
                        onPress={pick_profile}
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            right: -4,
                            backgroundColor: theme.high_color,
                            paddingHorizontal: profile === "" ? 10 : 12,
                            paddingVertical: 8,
                            borderRadius: 20,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderWidth: 2,
                            borderColor: theme.background,
                        }}
                    >
                        {loading_profile ? (
                            <ActivityIndicator color="#FFFFFF" size={18} />
                        ) : profile === "" ? (
                            <IconApp pack='FI' name="camera" size={16} color="#FFFFFF" />
                        ) : (
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <YambiText text={strings.send} color="design" />
                                <IconApp pack='FI' name="send" size={14} color="#FFFFFF" styles={{ marginLeft: 6 }} />
                            </View>
                        )}
                    </Pressable>
                </View>

                <YambiText bold text={business.business_name} size="big" style={{ textAlign: 'center' }} />
                <YambiText size="small" color="gray" text={strings.id + ": " + business._id} style={{ marginTop: 2 }} />
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

            {/* General Information Card */}
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
                        placeholder={strings.business_name}
                        value={name}
                        onChangeText={text => setName(text)}
                    />
                </View>

                {/* Description Field */}
                <View>
                    <YambiText size="small" color="gray" text={strings.description} style={{ marginLeft: 2, marginBottom: 6 }} />
                    <TextInput
                        placeholderTextColor={theme.gray}
                        maxLength={700}
                        multiline={true}
                        style={{
                            color: theme.text,
                            backgroundColor: theme.background,
                            paddingHorizontal: 14,
                            paddingVertical: 10,
                            minHeight: 80,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: theme.border,
                            fontSize: 15,
                            textAlignVertical: 'top',
                        }}
                        value={description}
                        onChangeText={text => setDescription(text)}
                    />
                </View>
            </View>

            {/* Contact Information Card */}
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
                        <IconApp pack="FI" name="map-pin" size={18} color={theme.high_color} />
                    </View>
                    <YambiText bold text={strings.address} style={{ fontSize: 16 }} />
                </View>

                {/* Address Field */}
                <View style={{ marginBottom: 14 }}>
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
                        placeholder={strings.address}
                        value={address}
                        onChangeText={text => setAddress(text)}
                    />
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
                        placeholder={strings.phones}
                        value={phones}
                        onChangeText={text => setPhones(text)}
                    />
                </View>

                {/* Emails Field */}
                <View>
                    <YambiText size="small" color="gray" text={strings.emails} style={{ marginLeft: 2, marginBottom: 6 }} />
                    <TextInput
                        placeholderTextColor={theme.gray}
                        maxLength={70}
                        style={{
                            color: theme.text,
                            backgroundColor: theme.background,
                            paddingHorizontal: 14,
                            height: 48,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: theme.border,
                            fontSize: 15,
                        }}
                        value={emails}
                        keyboardType="email-address"
                        onChangeText={text => setEmails(text)}
                    />
                </View>
            </View>

            {/* Legal & Identification Card */}
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
                    <YambiText bold text={strings.tax_number} style={{ fontSize: 16 }} />
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
                        onChangeText={text => setNational_id(text)}
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
                        onChangeText={text => setIdentification_number(text)}
                    />
                </View>

                {/* Tax Number Field */}
                <View>
                    <YambiText size="small" color="gray" text={strings.tax_number} style={{ marginLeft: 2, marginBottom: 6 }} />
                    <TextInput
                        placeholderTextColor={theme.gray}
                        maxLength={25}
                        style={{
                            color: theme.text,
                            backgroundColor: theme.background,
                            paddingHorizontal: 14,
                            height: 48,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: theme.border,
                            fontSize: 15,
                        }}
                        value={tax_number}
                        onChangeText={text => setTax_number(text)}
                    />
                </View>
            </View>

            {/* Admin Subscription Controls */}
            {isAdmin && (
                <View style={{
                    backgroundColor: theme.border + "15",
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 20,
                    borderWidth: 2,
                    borderColor: theme.high_color + '40',
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
                            <IconApp pack="FI" name="lock" size={18} color={theme.high_color} />
                        </View>
                        <YambiText
                            text={strings.admin_subscription_settings}
                            bold
                            style={{ fontSize: 16, color: theme.high_color }}
                        />
                    </View>

                    {/* Subscription Active Toggle */}
                    <View style={{ marginBottom: 16 }}>
                        <YambiText
                            size="small"
                            color="gray"
                            text={strings.subscription_status}
                            style={{ marginBottom: 8 }}
                        />
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <Pressable
                                onPress={() => setSubscription_active(0)}
                                style={{
                                    flex: 1,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: 12,
                                    borderRadius: 10,
                                    backgroundColor: subscription_active === 0 ? theme.high_color + '20' : theme.background,
                                    borderWidth: 1.5,
                                    borderColor: subscription_active === 0 ? theme.high_color : theme.border,
                                }}
                            >
                                <IconApp
                                    pack="FI"
                                    name={subscription_active === 0 ? "check-circle" : "circle"}
                                    size={18}
                                    color={subscription_active === 0 ? theme.high_color : theme.gray}
                                />
                                <YambiText
                                    text={strings.inactive}
                                    style={{ marginLeft: 8, fontWeight: '600', color: subscription_active === 0 ? theme.high_color : theme.text }}
                                />
                            </Pressable>

                            <Pressable
                                onPress={() => setSubscription_active(1)}
                                style={{
                                    flex: 1,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: 12,
                                    borderRadius: 10,
                                    backgroundColor: subscription_active === 1 ? theme.high_color + '20' : theme.background,
                                    borderWidth: 1.5,
                                    borderColor: subscription_active === 1 ? theme.high_color : theme.border,
                                }}
                            >
                                <IconApp
                                    pack="FI"
                                    name={subscription_active === 1 ? "check-circle" : "circle"}
                                    size={18}
                                    color={subscription_active === 1 ? theme.high_color : theme.gray}
                                />
                                <YambiText
                                    text={strings.active}
                                    style={{ marginLeft: 8, fontWeight: '600', color: subscription_active === 1 ? theme.high_color : theme.text }}
                                />
                            </Pressable>
                        </View>
                    </View>

                    {/* Valid Until Date Picker */}
                    <View style={{ marginBottom: 4 }}>
                        <YambiText
                            size="small"
                            color="gray"
                            text={strings.valid_until}
                            style={{ marginBottom: 8 }}
                        />
                        <Pressable
                            onPress={() => setShowDatePicker(true)}
                            style={{
                                backgroundColor: theme.background,
                                padding: 14,
                                borderRadius: 10,
                                borderWidth: 1,
                                borderColor: theme.border,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}
                        >
                            <YambiText
                                text={moment(valid_until).format('YYYY-MM-DD HH:mm')}
                                style={{ fontSize: 15 }}
                            />
                            <IconApp pack="FI" name="calendar" size={18} color={theme.high_color} />
                        </Pressable>
                    </View>
                </View>
            )}

            {/* DatePicker Component */}
            {showDatePicker && (
                <DateTimePicker
                    value={valid_until}
                    mode="datetime"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedDate) => {
                        setShowDatePicker(Platform.OS === 'ios');
                        if (selectedDate) {
                            setValid_until(selectedDate);
                        }
                    }}
                    minimumDate={new Date()}
                />
            )}

            {/* BottomSheet for Category Selection */}
            {showCategories ? (
                <BottomSheet
                    visible={showCategories}
                    onClose={() => setShowCategories(false)}
                // title={strings.select_category}
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

            {/* Save Button */}
            <ButtonNormal
                title={strings.edit_business}
                loading={loading}
                onPress={EBusiness}
                styles={{ marginVertical: 10, borderRadius: 14, height: 50 }}
                normal={true}
            />

            {/* Photo Editor Modal */}
            {showEditor && selectedAssets.length > 0 ? (
                <PhotoEditor
                    assets={selectedAssets}
                    visible={showEditor}
                    onClose={() => setShowEditor(false)}
                    onComplete={handleEditorComplete}
                />
            ) : null}
        </ScrollView>
    );
};

export default EditBusiness;
