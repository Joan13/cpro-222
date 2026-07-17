import { View, ActivityIndicator, ScrollView, TextInput, Pressable, Platform } from "react-native";
import ImagePicker from '../../utils/imagePicker';
import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from "../../store/app/hooks";
import { strings } from "../../lang/lang";
import ButtonNormal from "../../components/app/ButtonNormal";
import { IconApp } from "../../components/app/IconApp";
import { TextNormalYambi, TextNormalYambiGray, TextNormalYambiHighColor, TextNormalYambiInDesign, TextSmallYambiGray } from "../../components/app/Text";
import ModalApp from "../../components/app/ModalApp";
import { FlashList } from "@shopify/flash-list";
import { setLoadingButton, setShowModalApp } from "../../store/reducers/appSlice";
import { remote_host, remote_host_server, renderCategoryName, media_url } from "../../../GlobalVariables";
import axios from "axios";
import { NavProps, TBusiness } from "../../types/types";
import { useRealm } from "@realm/react";
import { Image as ExpoImage } from 'expo-image';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from "moment";

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
    const [loading_profile, setLoading_profile] = useState<boolean>(false);

    // Admin controls
    const isAdmin = user_data?.user_level === 2;
    const [subscription_active, setSubscription_active] = useState<number>(0);
    const [valid_until, setValid_until] = useState<Date>(new Date());
    const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
    // const category = useAppSelector(state=>state.app.category);
    // const businesses = useAppSelector(state => state.businesses);
    // const businesses = [];
    const dispatch = useAppDispatch();
    // const navigation = useNavigation();
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
    ]

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
            // const businessID = randomString(5).toUpperCase() + renderDateUpToMilliseconds();

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
            }

            // console.log(json);

            axios.post(remote_host + "/yambi/API/edit_business", { business: businesss, flag: "1" })
                .then(json => {
                    if (json.data.success === "1") {
                        realm.write(() => {
                            try {
                                realm.create('Businesses', businesss, true);
                            } catch (error) { console.log(error) }
                        });
                    }

                    setLoading(false);
                    dispatch(setLoadingButton(false));

                    setTimeout(() => {
                        navigation.navigate("Home");
                    }, 300);
                    // }
                })
                .catch(error => {
                    setShowInternetError(true);
                    dispatch(setShowModalApp(true));
                    setLoading(false);
                    dispatch(setLoadingButton(false));
                })
        }
    }

    // const NewSellsPoint = (NewBusiness: TBusiness) => {
    //     const sellsPointID = randomString(5).toUpperCase() + renderDateUpToMilliseconds();

    //     const sells_point = {
    //         _id: sellsPointID,
    //         business_id: NewBusiness._id,
    //         phone_number: user_data.phone_number,
    //         sells_point_name: NewBusiness.business_name,
    //         slogan: "",
    //         description_service: NewBusiness.description_service,
    //         category: NewBusiness.category,
    //         keywords: "",
    //         logo: "",
    //         phones: phones,
    //         emails: emails,
    //         background: "",
    //         sells_point_active: 0,
    //         sells_point_address: NewBusiness.business_address,
    //         sells_point_visible: 0,
    //         website: "",
    //         other_links: "",
    //         yambi: ""
    //     }

    //     axios.post(remote_host + "/yambi/API/new_sells_point", { sells_point: sells_point })
    //         .then(json => {
    //             const sp = json.data.new_sells_point;
    //             const new_sells_point: TSellsPoint = {
    //                 _id: sellsPointID,
    //                 business_id: sp.business_id,
    //                 sells_point_name: sp.sells_point_name,
    //                 phone_number: sp.phone_number,
    //                 slogan: "",
    //                 description_service: sp.description_service,
    //                 category: sp.category,
    //                 keywords: "",
    //                 logo: "",
    //                 phones: phones,
    //                 emails: emails,
    //                 background: "",
    //                 notifications: 0,
    //                 sells_point_active: 0,
    //                 sells_point_address: sp.sells_point_address,
    //                 sells_point_visible: 0,
    //                 website: "",
    //                 other_links: "",
    //                 yambi: "",
    //                 createdAt: sp.createdAt,
    //                 updatedAt: sp.updatedAt
    //             }

    //             realm.write(() => {
    //                 try {
    //                     realm.create('SellsPoints', new_sells_point, true);
    //                 } catch (error) { }
    //             });

    //             dispatch(setLoadingButton(false));

    //             setName("");
    //             setDescription("");
    //             setCategory(null);
    //             setAddress("");
    //             setDefine_as_main_site(false);

    //             setTimeout(() => {
    //                 RootNavigation.navigate("Home");
    //             }, 300);
    //         })
    //         .catch(error => {
    //             setShowInternetError(true);
    //             dispatch(setShowModalApp(true));
    //             dispatch(setLoadingButton(false));
    //         })
    // }

    // const EditWorkspace = () => {
    //     Alert.alert("Information", "Impossible d'éditer les informations sur votre entreprise pour le moment");
    // }

    const Category = ({ item, index, selectCategory }: { item: string, index: number, selectCategory: (category: string) => void }) => {

        const pressCategory = () => {
            selectCategory(item);
            dispatch(setShowModalApp(false));
            setShowCategories(false);
        };

        return (
            <Pressable style={{ flex: 1, flexDirection: 'row', paddingHorizontal: 3, height: 50, alignItems: 'center', borderBottomWidth: 1, borderColor: theme.border }} onPress={pressCategory}>
                <TextNormalYambi text={index + 1 + "."} styles={{ width: 35 }} />
                <TextNormalYambi text={item.toLocaleUpperCase()} numberLines={1} styles={{ flex: 1 }} />
            </Pressable>
        )
    }

    const Categories = () => {
        return (
            <View style={{
                width: '100%',
                height: 300,
                paddingHorizontal: 15
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

    const ViewPhoto = () => {
        if (business.logo !== "") {
            navigation.navigate("ViewPhoto", { source: media_url + "/business_logos/" + business.logo });
        } else {
            navigation.navigate("ViewPhoto", { source: "" });
        }
    }

    const pick_profile = () => {

        if (profile === "") {
            ImagePicker.openPicker({
                width: 500,
                height: 500,
                cropping: true,
                quality: 0.5,
                noData: true,
                mediaType: "photo",
            }).then(image => {

                setProfile(image.path);
            })
                .catch((e) => { });
        } else {
            upload_profile_picture();
        }
    }

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

                console.log(response.data)

                if (response.data.message === "1" && response.data.assemble === business._id) {
                    //    dispatch(updateUserProfile(response.data.user_profile));

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
                    }

                    realm.write(() => {
                        try {
                            realm.create('Businesses', bbb, true);
                        } catch (error) { }
                    });
                }

                setProfile("");

                // console.log(response.data)

            })
            .catch((error) => {
                // Alert.alert(strings.error, strings.connection_failed);
                // console.log(error)
                setShowInternetError(true);
                dispatch(setShowModalApp(true));
                setLoading_profile(false);

            });
    };

    return (
        <ScrollView style={{
            backgroundColor: theme.background,
            borderColor: theme.border, borderTopWidth: 1,
            paddingHorizontal: 15
        }}>
            <View>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: "center" }}>

                    <View style={{
                        marginTop: 15, alignItems: 'flex-end',
                    }}>
                        <Pressable onPress={ViewPhoto}>
                            <View
                                style={{ width: 150, height: 150, borderWidth: 1, borderColor: theme.border, borderRadius: 100, justifyContent: 'center', alignItems: 'center' }}>
                                {business.logo === "" ?
                                    <ExpoImage
                                        style={{
                                            width: 100,
                                            height: 100
                                        }}
                                        contentFit="contain"
                                        source={require("./../../assets/budget.png")} />
                                    :
                                    <ExpoImage
                                        style={{
                                            width: 150,
                                            height: 150,
                                            borderRadius: 150
                                        }}
                                        contentFit="contain"
                                        source={media_url + "/business_logos/" + business.logo} />}
                            </View>
                        </Pressable>


                        <Pressable onPress={pick_profile} style={{
                            marginTop: -50,
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: 50,
                            minWidth: 50,
                            borderRadius: 50,
                            backgroundColor: theme.design_tip2,
                            borderWidth: 1,
                            borderColor: theme.background
                        }}>
                            {loading_profile ?
                                <ActivityIndicator color={theme.text_design2} size={20} /> :
                                profile === "" ?
                                    <IconApp pack='FI' name="camera" size={20} color={theme.text_design2} />
                                    :
                                    <View style={{
                                        flexDirection: 'row',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        paddingHorizontal: 10
                                    }}>
                                        <TextNormalYambiInDesign text={strings.send} />
                                        <IconApp pack='FI' name="send" size={15} color={theme.text_design2} styles={{ marginLeft: 5 }} />
                                    </View>}
                        </Pressable>
                    </View>
                </View>
            </View>

            <View style={{ marginTop: 0, borderTopWidth: 0, borderColor: theme.gray }}>

                <TextNormalYambi bold text={strings.business_information} styles={{ marginTop: 20 }} />

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
                        <TextSmallYambiGray text={category !== null ? strings.category + " (" + strings.select_category + ")" : strings.category} styles={{ marginBottom: 5 }} />
                        <TextNormalYambiHighColor text={category === null ? strings.select_category : renderCategoryName(category)} styles={{ marginLeft: 2, marginTop: 5 }} />
                    </Pressable>
                </View>

                <View style={{ backgroundColor: theme.background, marginBottom: 15 }}>
                    <TextSmallYambiGray text={strings.business_name} styles={{ marginLeft: 2, marginBottom: 5 }} />
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
                        maxLength={70}
                        style={{ color: theme.text, backgroundColor: theme.border, paddingLeft: 15, height: 45, borderRadius: 5 }}
                        value={address}
                        onChangeText={text => setAddress(text)}
                    />
                </View>

                <View style={{ backgroundColor: theme.background, marginBottom: 15 }}>
                    <TextSmallYambiGray text={strings.national_id} styles={{ marginLeft: 2, marginBottom: 5 }} />
                    <TextInput
                        placeholderTextColor="gray"
                        maxLength={25}
                        style={{ color: theme.text, backgroundColor: theme.border, paddingLeft: 15, height: 45, borderRadius: 5 }}
                        value={national_id}
                        onChangeText={text => setNational_id(text)}
                    />
                </View>

                <View style={{ backgroundColor: theme.background, marginBottom: 15 }}>
                    <TextSmallYambiGray text={strings.identification_number} styles={{ marginLeft: 2, marginBottom: 5 }} />
                    <TextInput
                        placeholderTextColor="gray"
                        maxLength={25}
                        style={{ color: theme.text, backgroundColor: theme.border, paddingLeft: 15, height: 45, borderRadius: 5 }}
                        value={identification_number}
                        onChangeText={text => setIdentification_number(text)}
                    />
                </View>


                <View style={{ backgroundColor: theme.background, marginBottom: 15 }}>
                    <TextSmallYambiGray text={strings.tax_number} styles={{ marginLeft: 2, marginBottom: 5 }} />
                    <TextInput
                        placeholderTextColor="gray"
                        maxLength={25}
                        style={{ color: theme.text, backgroundColor: theme.border, paddingLeft: 15, height: 45, borderRadius: 5 }}
                        value={tax_number}
                        onChangeText={text => setTax_number(text)}
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

                {/* Admin Controls */}
                {isAdmin && (
                    <>
                        <View style={{
                            backgroundColor: theme.background,
                            marginBottom: 15,
                            marginTop: 20,
                            padding: 15,
                            borderRadius: 12,
                            borderWidth: 2,
                            borderColor: theme.high_color + '40'
                        }}>
                            <TextNormalYambi
                                text={(strings as any).admin_subscription_settings || "Admin: Subscription Settings"}
                                bold
                                styles={{ marginBottom: 15, color: theme.high_color }}
                            />

                            {/* Subscription Active Toggle */}
                            <View style={{ marginBottom: 20 }}>
                                <TextSmallYambiGray
                                    text={(strings as any).subscription_status || "Subscription Status"}
                                    styles={{ marginBottom: 8 }}
                                />
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Pressable
                                        onPress={() => setSubscription_active(0)}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            marginRight: 20,
                                            padding: 10,
                                            borderRadius: 8,
                                            backgroundColor: subscription_active === 0 ? theme.high_color + '20' : theme.border,
                                            borderWidth: 2,
                                            borderColor: subscription_active === 0 ? theme.high_color : theme.border,
                                        }}
                                    >
                                        <IconApp
                                            pack="FI"
                                            name={subscription_active === 0 ? "check-circle" : "circle"}
                                            size={18}
                                            color={subscription_active === 0 ? theme.high_color : theme.gray}
                                        />
                                        <TextNormalYambi
                                            text={(strings as any).inactive || "Inactive"}
                                            styles={{ marginLeft: 8, color: subscription_active === 0 ? theme.high_color : theme.text }}
                                        />
                                    </Pressable>

                                    <Pressable
                                        onPress={() => setSubscription_active(1)}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            padding: 10,
                                            borderRadius: 8,
                                            backgroundColor: subscription_active === 1 ? theme.high_color + '20' : theme.border,
                                            borderWidth: 2,
                                            borderColor: subscription_active === 1 ? theme.high_color : theme.border,
                                        }}
                                    >
                                        <IconApp
                                            pack="FI"
                                            name={subscription_active === 1 ? "check-circle" : "circle"}
                                            size={18}
                                            color={subscription_active === 1 ? theme.high_color : theme.gray}
                                        />
                                        <TextNormalYambi
                                            text={(strings as any).active || "Active"}
                                            styles={{ marginLeft: 8, color: subscription_active === 1 ? theme.high_color : theme.text }}
                                        />
                                    </Pressable>
                                </View>
                            </View>

                            {/* Valid Until Date Picker */}
                            <View style={{ marginBottom: 15 }}>
                                <TextSmallYambiGray
                                    text={(strings as any).valid_until || "Valid Until"}
                                    styles={{ marginBottom: 8 }}
                                />
                                <Pressable
                                    onPress={() => setShowDatePicker(true)}
                                    style={{
                                        backgroundColor: theme.border,
                                        padding: 15,
                                        borderRadius: 8,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                    }}
                                >
                                    <TextNormalYambi
                                        text={moment(valid_until).format('YYYY-MM-DD HH:mm')}
                                    />
                                    <IconApp pack="FI" name="calendar" size={18} color={theme.text} />
                                </Pressable>
                            </View>
                        </View>
                    </>
                )}

                {showCategories ?
                    <ModalApp paddings={false} onClose={() => { dispatch(setShowModalApp(false)); setShowCategories(false) }} singleButton title={strings.select_category}>
                        <Categories />
                    </ModalApp> : null}

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

                {/* <Pressable
                    onPress={() => setDefine_as_main_site(!define_as_main_site)}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginTop: 10,
                        marginLeft: 2
                    }}>
                    {define_as_main_site ?
                        <IconApp pack="FI" name="check-circle" size={15} color={theme.high_color} /> :
                        <IconApp pack="FI" name="circle" size={15} color={theme.gray} />}
                    <TextNormalYambi text={strings.define_as_main_site} styles={{ marginLeft: 8 }} />
                </Pressable> */}

                <ButtonNormal title={strings.edit_business} loading={loading} onPress={EBusiness} styles={{ paddingHorizontal: 20, marginVertical: 20, marginBottom: 50 }} normal={true} />

            </View>
        </ScrollView>
    )
}

export default EditBusiness;

