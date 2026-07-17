import { View, ScrollView, TextInput, ActivityIndicator, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from "../../store/app/hooks";
import { strings } from "../../lang/lang";
import ButtonNormal from "../../components/app/ButtonNormal";
import { IconApp } from "../../components/app/IconApp";
import { YambiText } from "../../components/app/Text";
import ModalApp from "../../components/app/ModalApp";
import { FlashList } from "@shopify/flash-list";
import { setLoadingButton, setShowModalApp } from "../../store/reducers/appSlice";
import { remote_host, remote_host_server, renderCategoryName, media_url } from "../../../GlobalVariables";
import axios from "axios";
import { NavProps, TCompany } from "../../types/types";
import moment from "moment";
import ImagePicker from '../../utils/imagePicker';
import { Image as ExpoImage } from 'expo-image';

const EditCompany = ({ navigation, route }: NavProps) => {

    const { company } = route.params;

    const theme = useAppSelector(state => state.app_theme.colors);
    const loading_app = useAppSelector(state => state.app.loading);
    const user_data = useAppSelector(state => state.user_data);
    const app_description = useAppSelector(state => state.persisted_app.app_description);
    const [category, setCategory] = useState<number | null>(null);
    const [name, setName] = useState<string>("");
    const [name_abb, setName_abb] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [address, setAddress] = useState<string>("");
    const [tags, setTags] = useState<string[]>([]);
    const [currentTag, setCurrentTag] = useState<string>("");
    const [showError, setShowError] = useState<boolean>(false);
    const [showCategories, setShowCategories] = useState<boolean>(false);
    const [showInternetError, setShowInternetError] = useState<boolean>(false);
    const [national_id, setNational_id] = useState<string>("");
    const [identification_number, setIdentification_number] = useState<string>("");
    const [tax_number, setTax_number] = useState<string>("");
    const [phones, setPhones] = useState<string>("");
    const [emails, setEmails] = useState<string>("");
    const [company_active, setCompany_active] = useState<number>(1);
    const [subscription_active, setSubscription_active] = useState<number>(1);
    const [certified, setCertified] = useState<number>(1);
    const [profile, setProfile] = useState<string>("");
    const [loading_profile, setLoading_profile] = useState<boolean>(false);
    const dispatch = useAppDispatch();

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
        setName(company.company_name);
        setName_abb(company.company_name_abb || "");
        setDescription(company.description_service || "");
        setCategory(company.category);
        setAddress(company.company_address || "");
        // Parse keywords string into tags array (split by spaces, filter empty strings)
        const keywordsString = company.keywords || "";
        const tagsArray = keywordsString.trim() !== "" 
            ? keywordsString.split(/\s+/).filter(tag => tag.trim() !== "")
            : [];
        setTags(tagsArray);
        setCurrentTag("");
        setNational_id(company.national_number || "");
        setIdentification_number(company.national_id || "");
        setTax_number(company.tax_number || "");
        setPhones(company.phones || "");
        setEmails(company.emails || "");
        setCompany_active(company.company_active !== undefined ? company.company_active : 1);
        setSubscription_active(company.subscription_active !== undefined ? company.subscription_active : 1);
        setCertified(company.certified !== undefined ? company.certified : 1);
        setProfile("");
    }, [company]);

    const EditCompanyData = () => {

        if (name === "" || category === null || address === "") {
            setShowError(true);
            dispatch(setShowModalApp(true));
        } else {
            dispatch(setLoadingButton(true));

            // Convert tags array to space-separated string
            const keywordsString = tags.join(" ");

            const                 company_data: TCompany = {
                _id: company._id,
                company_name: name,
                company_name_abb: name_abb,
                slogan: company.slogan || "",
                description_service: description,
                category: category,
                company_type: company.company_type !== undefined ? company.company_type : 0,
                keywords: keywordsString,
                country: company.country || "",
                logo: company.logo || "",
                background: company.background || "",
                phones: phones,
                emails: emails,
                company_address: address,
                national_number: national_id,
                national_id: identification_number,
                tax_number: tax_number,
                bio: company.bio || "",
                status_information: company.status_information || "",
                subscription_active: subscription_active,
                valid_until: company.valid_until || "",
                links: company.links || "",
                company_active: company_active,
                certified: certified,
                createdAt: company.createdAt,
                updatedAt: moment(new Date()).format()
            }

            // Upload logo if profile is selected
            if (profile !== "") {
                upload_profile_picture(company_data);
            } else {
                saveCompanyData(company_data);
            }
        }
    }

    const saveCompanyData = (company_data: TCompany) => {
        axios.post(remote_host + "/yambi/API/edit_company", { company: company_data })
            .then(json => {
                if (json.data.success === "1") {
                    dispatch(setLoadingButton(false));
                    setTimeout(() => {
                        navigation.goBack();
                    }, 300);
                } else {
                    setShowInternetError(true);
                    dispatch(setShowModalApp(true));
                    dispatch(setLoadingButton(false));
                }
            })
            .catch(error => {
                setShowInternetError(true);
                dispatch(setShowModalApp(true));
                dispatch(setLoadingButton(false));
            })
    }

    const upload_profile_picture = (company_data: TCompany) => {
        setLoading_profile(true);

        const filename = Date.now() + '-' + Math.round(Math.random() * 1E9);

        let base_url = remote_host + "/yambi/API/upload_company_logo";
        let formData = new FormData();
        formData.append('company_id', company._id);
        formData.append('company_logo', company.logo || "");
        formData.append('image', { type: 'image/jpg', uri: profile, name: filename + '.jpg' } as any);

        axios.post(base_url, formData, {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'multipart/form-data'
            }
        })
            .then(response => {
                setLoading_profile(false);

                if (response.data.success === "1" && response.data.company_id === company._id) {
                    // Update company data with new logo
                    company_data.logo = response.data.company_logo;
                    saveCompanyData(company_data);
                } else {
                    setShowInternetError(true);
                    dispatch(setShowModalApp(true));
                    dispatch(setLoadingButton(false));
                }

                setProfile("");
            })
            .catch(() => {
                setLoading_profile(false);
                setShowInternetError(true);
                dispatch(setShowModalApp(true));
                dispatch(setLoadingButton(false));
                setProfile("");
            });
    }

    const ViewPhoto = () => {
        if (company.logo !== "") {
            navigation.navigate("ViewPhoto", { source: media_url + "/company_logos/" + company.logo });
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
            // Convert tags array to space-separated string
            const keywordsString = tags.join(" ");

            upload_profile_picture({
                _id: company._id,
                company_name: name,
                company_name_abb: name_abb,
                slogan: company.slogan || "",
                description_service: description,
                category: category as number,
                company_type: company.company_type !== undefined ? company.company_type : 0,
                keywords: keywordsString,
                country: company.country || "",
                logo: company.logo || "",
                background: company.background || "",
                phones: phones,
                emails: emails,
                company_address: address,
                national_number: national_id,
                national_id: identification_number,
                tax_number: tax_number,
                bio: company.bio || "",
                status_information: company.status_information || "",
                subscription_active: subscription_active,
                valid_until: company.valid_until || "",
                links: company.links || "",
                company_active: company_active,
                certified: certified,
                createdAt: company.createdAt,
                updatedAt: moment(new Date()).format()
            });
        }
    }


    const Category = ({ item, index, selectCategory }: { item: string, index: number, selectCategory: (category: string) => void }) => {

        const pressCategory = () => {
            selectCategory(item);
            dispatch(setShowModalApp(false));
            setShowCategories(false);
        };

        return (
            <Pressable style={{ flex: 1, flexDirection: 'row', paddingHorizontal: 3, height: 50, alignItems: 'center', borderBottomWidth: 1, borderColor: theme.border }} onPress={pressCategory}>
                <YambiText text={index + 1 + "."} size="normal" color="default" style={{ width: 35 }} />
                <YambiText text={item.toUpperCase()} size="normal" color="default" style={{ flex: 1 }} />
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

    const addTag = () => {
        const trimmedTag = currentTag.trim();
        if (trimmedTag !== "" && !tags.includes(trimmedTag)) {
            setTags([...tags, trimmedTag]);
            setCurrentTag("");
        }
    }

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    }

    const handleTagInputChange = (text: string) => {
        // Remove spaces from input (spaces separate tags)
        const textWithoutSpaces = text.replace(/\s/g, "");
        setCurrentTag(textWithoutSpaces);
    }

    return (
        <ScrollView style={{
            backgroundColor: theme.background,
            borderColor: theme.border, borderTopWidth: 1,
            paddingHorizontal: 15
        }} keyboardShouldPersistTaps='handled'>

            <View>

                {showError ?
                    <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowError(false) }} singleButton title={strings.error}>
                        <YambiText text={strings.fields_error_validation} size="normal" color="gray" />
                    </ModalApp> : null}

                {showInternetError ?
                    <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowInternetError(false) }} singleButton title={strings.error}>
                        <YambiText text={strings.connection_failed} size="normal" color="gray" />
                    </ModalApp> : null}

                <View style={{ marginBottom: 30, marginTop: 10, alignItems: 'center' }}>
                    <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
                        <Pressable onPress={ViewPhoto}>
                            <View style={{
                                width: 150,
                                height: 150,
                                borderRadius: 75,
                                backgroundColor: theme.border,
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                borderWidth: 3,
                                borderColor: theme.high_color + '30'
                            }}>
                                {company.logo === "" ?
                                    <ExpoImage
                                        style={{
                                            width: 100,
                                            height: 100
                                        }}
                                        contentFit="contain"
                                        source={require("./../../assets/budget.png")} />
                                    :
                                    profile !== "" ?
                                        <ExpoImage
                                            style={{
                                                width: 150,
                                                height: 150,
                                                borderRadius: 150
                                            }}
                                            contentFit="cover"
                                            source={profile} />
                                        :
                                        <ExpoImage
                                            style={{
                                                width: 150,
                                                height: 150,
                                                borderRadius: 150
                                            }}
                                            contentFit="cover"
                                            source={media_url + "/company_logos/" + company.logo} />}
                            </View>
                        </Pressable>

                        <Pressable onPress={pick_profile} style={{
                            marginTop: -50,
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: 50,
                            minWidth: 50,
                            borderRadius: 25,
                            backgroundColor: theme.high_color,
                            borderWidth: 2,
                            borderColor: theme.background
                        }}>
                            {loading_profile ?
                                <ActivityIndicator color="#FFFFFF" size={20} /> :
                                profile === "" ?
                                    <IconApp pack='FI' name="camera" size={20} color="#FFFFFF" />
                                    :
                                    <View style={{
                                        flexDirection: 'row',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        paddingHorizontal: 10
                                    }}>
                                        <YambiText text={strings.send} size="small" color="white" />
                                        <IconApp pack='FI' name="send" size={15} color="#FFFFFF" styles={{ marginLeft: 5 }} />
                                    </View>}
                        </Pressable>
                    </View>
                </View>

                <View style={{ marginBottom: 30, marginTop: 10 }}>
                    <Pressable onPress={() => { dispatch(setShowModalApp(true)); setShowCategories(true) }}>
                        <YambiText text={category !== null ? strings.category + " (" + strings.select_category + ")" : strings.category} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 5 }} />
                        <YambiText text={category === null ? strings.select_category : renderCategoryName(category)} size="normal" color="high" style={{ marginLeft: 2, marginTop: 5 }} />
                    </Pressable>
                </View>

                <View style={{ marginBottom: 15 }}>
                    <YambiText text={strings.company_name} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 5 }} />
                    <TextInput
                        placeholderTextColor="gray"
                        maxLength={100}
                        style={{ color: theme.text, backgroundColor: theme.border, paddingLeft: 15, height: 45, borderRadius: 5 }}
                        value={name}
                        onChangeText={text => setName(text)}
                    />
                </View>

                <View style={{ marginBottom: 15 }}>
                    <YambiText text={strings.name_in_short} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 5 }} />
                    <TextInput
                        placeholderTextColor="gray"
                        maxLength={100}
                        style={{ color: theme.text, backgroundColor: theme.border, paddingLeft: 15, height: 45, borderRadius: 5 }}
                        value={name_abb}
                        onChangeText={text => setName_abb(text)}
                    />
                </View>

                <View style={{ marginBottom: 15 }}>
                    <YambiText text={strings.description} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 5 }} />
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
                    <YambiText text={strings.address} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 5 }} />
                    <TextInput
                        placeholderTextColor="gray"
                        maxLength={70}
                        style={{ color: theme.text, backgroundColor: theme.border, paddingLeft: 15, height: 45, borderRadius: 5 }}
                        value={address}
                        onChangeText={text => setAddress(text)}
                    />
                </View>

                <View style={{ marginBottom: 15 }}>
                    <YambiText text={strings.national_id} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 5 }} />
                    <TextInput
                        placeholderTextColor="gray"
                        maxLength={25}
                        style={{ color: theme.text, backgroundColor: theme.border, paddingLeft: 15, height: 45, borderRadius: 5 }}
                        value={national_id}
                        onChangeText={text => setNational_id(text)}
                    />
                </View>

                <View style={{ marginBottom: 15 }}>
                    <YambiText text={strings.identification_number} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 5 }} />
                    <TextInput
                        placeholderTextColor="gray"
                        maxLength={25}
                        style={{ color: theme.text, backgroundColor: theme.border, paddingLeft: 15, height: 45, borderRadius: 5 }}
                        value={identification_number}
                        onChangeText={text => setIdentification_number(text)}
                    />
                </View>

                <View style={{ marginBottom: 15 }}>
                    <YambiText text={strings.tax_number} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 5 }} />
                    <TextInput
                        placeholderTextColor="gray"
                        maxLength={25}
                        style={{ color: theme.text, backgroundColor: theme.border, paddingLeft: 15, height: 45, borderRadius: 5 }}
                        value={tax_number}
                        onChangeText={text => setTax_number(text)}
                    />
                </View>

                <View style={{ marginBottom: 15 }}>
                    <YambiText text={strings.phones} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 5 }} />
                    <TextInput
                        placeholderTextColor="gray"
                        maxLength={45}
                        style={{ color: theme.text, backgroundColor: theme.border, paddingLeft: 15, height: 45, borderRadius: 5 }}
                        value={phones}
                        onChangeText={text => setPhones(text)}
                    />
                </View>

                <View style={{ marginBottom: 15 }}>
                    <YambiText text={strings.emails} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 5 }} />
                    <TextInput
                        placeholderTextColor="gray"
                        maxLength={70}
                        style={{ color: theme.text, backgroundColor: theme.border, paddingLeft: 15, height: 45, borderRadius: 5 }}
                        value={emails}
                        keyboardType="email-address"
                        onChangeText={text => setEmails(text)}
                    />
                </View>

                <View style={{ marginBottom: 15 }}>
                    <YambiText text={strings.tags || "Tags"} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 5 }} />
                    
                    {tags.length > 0 && (
                        <View style={{ 
                            flexDirection: 'row', 
                            flexWrap: 'wrap', 
                            gap: 8,
                            marginBottom: 10
                        }}>
                            {tags.map((tag, index) => (
                                <View
                                    key={index}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        backgroundColor: theme.high_color + '20',
                                        paddingHorizontal: 12,
                                        paddingVertical: 8,
                                        borderRadius: 20,
                                        borderWidth: 1,
                                        borderColor: theme.high_color + '40'
                                    }}
                                >
                                    <YambiText text={tag} size="small" color="high" style={{ marginRight: 8 }} />
                                    <Pressable
                                        onPress={() => removeTag(tag)}
                                        style={{
                                            width: 20,
                                            height: 20,
                                            borderRadius: 10,
                                            backgroundColor: theme.high_color,
                                            justifyContent: 'center',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <IconApp pack="FI" name="x" size={12} color="white" />
                                    </Pressable>
                                </View>
                            ))}
                        </View>
                    )}

                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TextInput
                            placeholderTextColor="gray"
                            placeholder={(strings as any).enter_tag || "Enter tag (no spaces)"}
                            maxLength={50}
                            style={{ 
                                flex: 1, 
                                color: theme.text, 
                                backgroundColor: theme.border, 
                                paddingLeft: 15, 
                                height: 45, 
                                borderRadius: 5,
                                marginRight: 10
                            }}
                            value={currentTag}
                            onChangeText={handleTagInputChange}
                            onSubmitEditing={addTag}
                        />
                        <ButtonNormal
                            title={(strings as any).add_tag || "Add tag"}
                            loadEnabled={false}
                            normal={true}
                            onPress={addTag}
                            disabled={currentTag.trim() === ""}
                            styles={{ 
                                paddingHorizontal: 20,
                                height: 45,
                                minWidth: 100
                            }}
                        />
                    </View>
                </View>

                {showCategories ?
                    <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowCategories(false) }} singleButton title={strings.select_category}>
                        <Categories />
                    </ModalApp> : null}

                <ButtonNormal title={strings.save} loadEnabled={true} onPress={EditCompanyData} styles={{ paddingHorizontal: 20, marginVertical: 20 }} normal={true} />

            </View>
        </ScrollView>
    )
}

export default EditCompany;
