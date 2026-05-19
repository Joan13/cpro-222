import { View, ScrollView, TextInput, TouchableOpacity } from "react-native";
import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from "../../store/app/hooks";
import { strings } from "../../lang/lang";
import ButtonNormal from "../../components/app/ButtonNormal";
import { YambiText } from "../../components/app/Text";
import ModalApp from "../../components/app/ModalApp";
import { setLoadingButton, setShowModalApp } from "../../store/reducers/appSlice";
import { remote_host } from "../../../GlobalVariables";
import axios from "axios";
import { NavProps, TCompany, TCompanyUser } from "../../types/types";
import { IconApp } from "../../components/app/IconApp";
import { FlashList } from "@shopify/flash-list";
import moment from "moment";

const AddNews = ({ navigation, route }: NavProps) => {
    const theme = useAppSelector(state => state.app_theme.colors);
    const user_data = useAppSelector(state => state.user_data);
    const [title, setTitle] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [content, setContent] = useState<string>("");
    const [tags, setTags] = useState<string[]>([]);
    const [currentTag, setCurrentTag] = useState<string>("");
    const [company_id, setCompany_id] = useState<string>("");
    const [company, setCompany] = useState<TCompany | null>(null);
    const [companies, setCompanies] = useState<{ company: TCompany, companyUser: TCompanyUser }[]>([]);
    const [showError, setShowError] = useState<boolean>(false);
    const [showSuccess, setShowSuccess] = useState<boolean>(false);
    const [showInternetError, setShowInternetError] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [showCompanies, setShowCompanies] = useState<boolean>(false);
    const dispatch = useAppDispatch();

    // Fetch user's admin companies
    useEffect(() => {
        axios.post(remote_host + "/yambi/API/get_admin_data", {
            flag: 4, // flag 4 for company users
            last_id: null,
            search: ''
        })
            .then(res => {
                if (res.data.success === "1") {
                    const users: TCompanyUser[] = res.data.data || [];
                    // Filter: user must be admin (is_admin === 1) and active
                    const adminUsers = users.filter(u =>
                        u.phone_number === user_data.phone_number &&
                        u.user_active === 1 &&
                        u.is_admin === 1
                    );

                    // Fetch company details for each admin company
                    const fetchCompanies = async () => {
                        const companiesData = await Promise.all(
                            adminUsers.map(async (user) => {
                                try {
                                    const companyRes = await axios.post(remote_host + "/yambi/API/get_company", {
                                        company_id: user.company_id
                                    });
                                    if (companyRes.data.success === "1") {
                                        return { company: companyRes.data.company, companyUser: user };
                                    }
                                } catch (e) {
                                    return null;
                                }
                                return null;
                            })
                        );
                        setCompanies(companiesData.filter(c => c !== null) as { company: TCompany, companyUser: TCompanyUser }[]);
                    };

                    fetchCompanies();
                }
            })
            .catch(() => { });
    }, [user_data.phone_number]);

    // Load company tags when company is selected
    useEffect(() => {
        if (company && company.keywords) {
            const companyTags = company.keywords.trim().split(/\s+/).filter(tag => tag.trim() !== "");
            setTags(companyTags);
        }
    }, [company]);

    const selectCompany = (selectedCompany: { company: TCompany, companyUser: TCompanyUser }) => {
        setCompany(selectedCompany.company);
        setCompany_id(selectedCompany.company._id);
        dispatch(setShowModalApp(false));
        setShowCompanies(false);
    };

    const addTag = () => {
        const trimmedTag = currentTag.trim();
        if (trimmedTag !== "" && !tags.includes(trimmedTag)) {
            setTags([...tags, trimmedTag]);
            setCurrentTag("");
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const CompaniesList = () => {
        return (
            <View style={{ width: '100%', maxHeight: 400 }}>
                <FlashList
                    data={companies}
                    estimatedItemSize={60}
                    showsVerticalScrollIndicator={true}
                    renderItem={({ item }: { item: { company: TCompany, companyUser: TCompanyUser } }) => (
                        <TouchableOpacity
                            onPress={() => selectCompany(item)}
                            style={{
                                padding: 15,
                                borderBottomWidth: 1,
                                borderBottomColor: theme.border,
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}
                        >
                            <View style={{ flex: 1 }}>
                                <YambiText text={item.company.company_name} size="normal" color="default" />
                                {item.company.company_name_abb && (
                                    <YambiText text={item.company.company_name_abb} size="small" color="gray" style={{ marginTop: 4 }} />
                                )}
                            </View>
                            <IconApp pack="FI" name="chevron-right" size={18} color={theme.gray} />
                        </TouchableOpacity>
                    )}
                />
            </View>
        );
    };

    const PostNews = () => {
        if (title === "" || content === "" || company_id === "") {
            setShowError(true);
            dispatch(setShowModalApp(true));
        } else {
            setLoading(true);
            dispatch(setLoadingButton(true));

            // Convert tags array to space-separated string
            const tagsString = tags.join(" ");

            const news = {
                company_id: company_id,
                title: title,
                description: description || "",
                content: content,
                tags: tagsString,
                image: "",
                news_active: 1
            };

            axios.post(remote_host + "/yambi/API/post_news", {
                news: news,
                phone_number: user_data.phone_number
            })
                .then(json => {
                    if (json.data.success === "1") {
                        setShowSuccess(true);
                        dispatch(setShowModalApp(true));
                        setLoading(false);
                        dispatch(setLoadingButton(false));
                        setTimeout(() => {
                            navigation.goBack();
                        }, 500);
                    } else {
                        setShowInternetError(true);
                        dispatch(setShowModalApp(true));
                        setLoading(false);
                        dispatch(setLoadingButton(false));
                    }
                })
                .catch(() => {
                    setShowInternetError(true);
                    dispatch(setShowModalApp(true));
                    setLoading(false);
                    dispatch(setLoadingButton(false));
                });
        }
    };

    return (
        <ScrollView style={{
            backgroundColor: theme.background,
            borderColor: theme.border,
            borderTopWidth: 1,
            paddingHorizontal: 15
        }} keyboardShouldPersistTaps='handled'>
            <View>
                {showError ?
                    <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowError(false) }} singleButton title={strings.error}>
                        <YambiText text={strings.fields_error_validation} size="normal" color="gray" />
                    </ModalApp> : null}

                {showSuccess ?
                    <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowSuccess(false) }} singleButton title={strings.success}>
                        <YambiText text={strings.data_updated_successfully} size="normal" color="gray" />
                    </ModalApp> : null}

                {showInternetError ?
                    <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowInternetError(false) }} singleButton title={strings.error}>
                        <YambiText text={strings.connection_failed} size="normal" color="gray" />
                    </ModalApp> : null}

                {showCompanies ?
                    <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowCompanies(false) }} singleButton title={(strings as any).select_company || "Select Company"}>
                        <CompaniesList />
                    </ModalApp> : null}

                <View style={{ marginBottom: 15, marginTop: 10 }}>
                    <YambiText text={(strings as any).company || "Company"} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 5 }} />
                    <TouchableOpacity
                        onPress={() => { dispatch(setShowModalApp(true)); setShowCompanies(true) }}
                        style={{
                            backgroundColor: theme.border,
                            paddingLeft: 15,
                            height: 45,
                            borderRadius: 5,
                            justifyContent: 'center',
                            flexDirection: 'row',
                            alignItems: 'center'
                        }}
                    >
                        <YambiText
                            text={company ? company.company_name : ((strings as any).select_company || "Select Company")}
                            size="normal"
                            color={company ? "default" : "gray"}
                            style={{ flex: 1 }}
                        />
                        <IconApp pack="FI" name="chevron-right" size={18} color={theme.gray} styles={{ marginRight: 10 }} />
                    </TouchableOpacity>
                </View>

                <View style={{ marginBottom: 15 }}>
                    <YambiText text={(strings as any).title || "Title"} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 5 }} />
                    <TextInput
                        placeholderTextColor="gray"
                        maxLength={200}
                        style={{ color: theme.text, backgroundColor: theme.border, paddingLeft: 15, height: 45, borderRadius: 5 }}
                        value={title}
                        onChangeText={text => setTitle(text)}
                        placeholder={(strings as any).enter_title || "Enter title"}
                    />
                </View>

                <View style={{ marginBottom: 15 }}>
                    <YambiText text={(strings as any).description || "Description"} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 5 }} />
                    <TextInput
                        placeholderTextColor="gray"
                        maxLength={500}
                        multiline
                        numberOfLines={3}
                        style={{
                            color: theme.text,
                            backgroundColor: theme.border,
                            paddingLeft: 15,
                            paddingTop: 10,
                            paddingRight: 15,
                            minHeight: 80,
                            borderRadius: 5,
                            textAlignVertical: 'top'
                        }}
                        value={description}
                        onChangeText={text => setDescription(text)}
                        placeholder={(strings as any).enter_description || "Enter description (optional)"}
                    />
                </View>

                <View style={{ marginBottom: 15 }}>
                    <YambiText text={(strings as any).content || "Content"} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 5 }} />
                    <TextInput
                        placeholderTextColor="gray"
                        maxLength={5000}
                        multiline
                        numberOfLines={10}
                        style={{
                            color: theme.text,
                            backgroundColor: theme.border,
                            paddingLeft: 15,
                            paddingTop: 10,
                            paddingRight: 15,
                            minHeight: 200,
                            borderRadius: 5,
                            textAlignVertical: 'top'
                        }}
                        value={content}
                        onChangeText={text => setContent(text)}
                        placeholder={(strings as any).enter_content || "Enter main content"}
                    />
                </View>

                <View style={{ marginBottom: 15 }}>
                    <YambiText text={strings.tags || "Tags"} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 5 }} />
                    <View style={{ flexDirection: 'row', marginBottom: 10 }}>
                        <TextInput
                            placeholderTextColor="gray"
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
                            onChangeText={text => setCurrentTag(text.replace(/\s/g, ""))}
                            placeholder={(strings as any).enter_tag || "Enter tag (no spaces)"}
                            onSubmitEditing={addTag}
                        />
                        <ButtonNormal
                            title={strings.add_tag || "Add tag"}
                            onPress={addTag}
                            normal={true}
                            disabled={currentTag.trim() === ""}
                            styles={{ paddingHorizontal: 15, height: 45 }}
                        />
                    </View>
                    {tags.length > 0 && (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                            {tags.map((tag, index) => (
                                <View
                                    key={index}
                                    style={{
                                        backgroundColor: theme.high_color + '20',
                                        paddingHorizontal: 12,
                                        paddingVertical: 6,
                                        borderRadius: 20,
                                        borderWidth: 1,
                                        borderColor: theme.high_color + '40',
                                        flexDirection: 'row',
                                        alignItems: 'center'
                                    }}
                                >
                                    <YambiText text={tag} size="small" color="high" />
                                    <TouchableOpacity
                                        onPress={() => removeTag(tag)}
                                        style={{ marginLeft: 8 }}
                                    >
                                        <IconApp pack="FI" name="x" size={14} color={theme.high_color} />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {company_id !== "" ? (
                    <ButtonNormal
                        title={(strings as any).post_news || "Post News"}
                        loading={loading}
                        onPress={PostNews}
                        styles={{ paddingHorizontal: 20, marginVertical: 20 }}
                        normal={true}
                    />
                ) : null}
            </View>
        </ScrollView>
    );
};

export default AddNews;
