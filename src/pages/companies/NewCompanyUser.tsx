import { View, ScrollView, TextInput, Pressable } from "react-native";
import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from "../../store/app/hooks";
import { strings } from "../../lang/lang";
import ButtonNormal from "../../components/app/ButtonNormal";
import { YambiText } from "../../components/app/Text";
import ModalApp from "../../components/app/ModalApp";
import { setLoadingButton, setShowModalApp } from "../../store/reducers/appSlice";
import { randomString, remote_host, renderDateUpToMilliseconds } from "../../../GlobalVariables";
import axios from "axios";
import { NavProps, TCompanyUser, TUser, TCompany } from "../../types/types";
import moment from "moment";
import { useQuery } from "@realm/react";
import { UserContacts } from "../../store/database/Models";
import { FlashList } from "@shopify/flash-list";
import ContactsList from "../../components/lists/contacts/ContactsList";
import { IconApp } from "../../components/app/IconApp";
import SwitchApp from "../../components/app/SwitchApp";

const NewCompanyUser = ({ navigation, route }: NavProps) => {

    const { company_id } = route.params;

    const theme = useAppSelector(state => state.app_theme.colors);
    const [name, setName] = useState<string>("");
    const [phone_number, setPhone_number] = useState<string>("");
    const [service_name, setService_name] = useState<string>("");
    const [service_name_abb, setService_name_abb] = useState<string>("");
    const [showError, setShowError] = useState<boolean>(false);
    const [showSuccess, setShowSuccess] = useState<boolean>(false);
    const [showInternetError, setShowInternetError] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [showUsers, setShowUsers] = useState(false);
    const [showRoles, setShowRoles] = useState(false);
    const [raiseAlert, setRaiseAlert] = useState<boolean>(false);
    const [level, setLevel] = useState<number>(1);
    const [role, setRole] = useState<string>("");
    const [tags, setTags] = useState<string>("");
    const [is_admin, setIs_admin] = useState<number>(0);
    const [company, setCompany] = useState<TCompany | null>(null);
    const dispatch = useAppDispatch();

    const contacts = useQuery(UserContacts, contacts => { return contacts; }, []);

    // Fetch existing company users to check for duplicates
    const [companyUsers, setCompanyUsers] = useState<TCompanyUser[]>([]);
    
    // Fetch company to get company_type
    useEffect(() => {
        axios.post(remote_host + "/yambi/API/get_company", {
            company_id: company_id
        })
        .then(res => {
            if (res.data.success === "1") {
                const companyData = res.data.company;
                setCompany(companyData);
                // Set default tags: use company_name_abb if available, otherwise company_name
                const defaultTags = companyData.company_name_abb && companyData.company_name_abb.trim() !== ""
                    ? `#${companyData.company_name_abb}`
                    : `#${companyData.company_name}`;
                setTags(defaultTags);
            }
        })
        .catch(() => {});
    }, [company_id]);
    
    useEffect(() => {
        axios.post(remote_host + "/yambi/API/get_admin_data", {
            flag: 4, // flag 4 for company users
            last_id: null,
            search: ''
        })
        .then(res => {
            if (res.data.success === "1") {
                const users: TCompanyUser[] = res.data.data || [];
                setCompanyUsers(users.filter(u => u.company_id === company_id));
            }
        })
        .catch(() => {});
    }, [company_id]);

    const selectCon = (item: TUser) => {
        setPhone_number(item.phone_number);
        setName(item.user_names || "");

        const user = companyUsers.find(element => element.phone_number === item.phone_number);

        // If user doesn't exist in company, allow adding (raiseAlert = true)
        // If user exists, don't allow adding (raiseAlert = false)
        setRaiseAlert(user === undefined);

        dispatch(setShowModalApp(false));
        setShowUsers(false);
    }

    // Map company category to company_roles key
    // Categories: 1=retail, 2=manufacturing, 3=healthcare, 4=technology, 5=finance, 6=education,
    // 7=hospitality, 8=real_estate, 9=entertainment, 10=transportation, 11=energy,
    // 12=agriculture, 13=fashion_textile, 14=communication_media, 15=food_beverages,
    // 16=business_services, 17=biotechnology, 18=telecommunications
    const getCompanyRolesKey = (category: number): string => {
        const mapping: { [key: number]: string } = {
            1: "retail",
            2: "manufacturing",
            3: "healthcare",
            4: "technology",
            5: "finance",
            6: "education",
            7: "hospitality",
            8: "real_estate",
            9: "entertainment",
            10: "transportation",
            11: "energy",
            12: "agriculture",
            13: "fashion_textile",
            14: "communication_media",
            15: "food_beverages",
            16: "business_services",
            17: "biotechnology",
            18: "telecommunications"
        };
        return mapping[category];
    };

    // Get available roles based on company category
    const getAvailableRoles = () => {
        if (!company || !company.category) return [];

        const rolesKey = getCompanyRolesKey(company.category);
        const allRoles = (strings.company_roles as any)?.[rolesKey] || [];
        
        return allRoles;
    };

    const selectRole = (selectedRole: any) => {
        setLevel(selectedRole.level);
        // Display role info (not saved to backend)
        setRole(selectedRole.role);
        setService_name(selectedRole.role || "");
        setService_name_abb(selectedRole.abbreviated || "");
        dispatch(setShowModalApp(false));
        setShowRoles(false);
    };

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

    const RolesList = () => {
        const availableRoles = getAvailableRoles();
        
        return (
            <View style={{
                width: '100%',
                // marginTop: -15
            }}>
                <FlashList
                    data={availableRoles}
                    estimatedItemSize={60}
                    showsVerticalScrollIndicator={true}
                    renderItem={({ item, index }: { item: any, index: number }) => {
                        const isLastItem = index === availableRoles.length - 1;
                        return (
                            <Pressable
                                onPress={() => selectRole(item)}
                                style={{
                                    padding: 15,
                                    borderBottomWidth: isLastItem ? 0 : 1,
                                    borderBottomColor: theme.border,
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                <View style={{ flex: 1 }}>
                                    <YambiText text={item.role} size="normal" color="default" />
                                    {item.abbreviated && (
                                        <YambiText text={`${item.abbreviated}`} size="small" color="gray" style={{ marginTop: 4 }} />
                                    )}
                                </View>
                                <IconApp pack="FI" name="chevron-right" size={18} color={theme.gray} />
                            </Pressable>
                        );
                    }}
                />
            </View>
        )
    }

    const NewCompanyUserData = () => {
        if (name === "" || phone_number === "") {
            setShowError(true);
            dispatch(setShowModalApp(true));
        } else {
            setLoading(true);
            dispatch(setLoadingButton(true));

            const company_user_id = randomString(5).toUpperCase() + renderDateUpToMilliseconds();

            const company_user_data: TCompanyUser = {
                _id: company_user_id,
                company_id: company_id,
                user_name: name,
                phone_number: phone_number,
                service_name: "", // Not stored in backend, computed from level
                service_name_abb: "", // Not stored in backend, computed from level
                level: level,
                role: "", // Not stored in backend, computed from level
                tags: tags,
                user_active: 1, // Default to active
                createdAt: moment(new Date()).format(),
                updatedAt: moment(new Date()).format()
            }

            axios.post(remote_host + "/yambi/API/new_company_user", { company_user: company_user_data })
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
                })
        }
    }

    return (
        <ScrollView style={{
            backgroundColor: theme.background,
            borderColor: theme.border, borderTopWidth: 1,
            paddingHorizontal: 15
        }}>

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

                {showUsers ?
                    <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowUsers(false) }} singleButton title={strings.contact_select}>
                        <Usersss />
                    </ModalApp> : null}

                {showRoles ?
                    <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowRoles(false) }} singleButton paddings={false} title={strings.role || "Select Role"}>
                        <RolesList />
                    </ModalApp> : null}

                <View style={{ marginBottom: 15, marginTop: 10 }}>
                    <YambiText text={strings.user_details || strings.phone_number} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 5 }} />
                    <Pressable 
                        onPress={() => { dispatch(setShowModalApp(true)); setShowUsers(true) }}
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
                            text={phone_number === "" ? strings.contact_select : phone_number} 
                            size="normal" 
                            color={phone_number === "" ? "gray" : "default"}
                            style={{ flex: 1 }}
                        />
                        <IconApp pack="FI" name="chevron-right" size={18} color={theme.gray} styles={{ marginRight: 10 }} />
                    </Pressable>
                </View>

                <View style={{ marginBottom: 15 }}>
                    <YambiText text={(strings as any).member_name || strings.user_name} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 5 }} />
                    <TextInput
                        placeholderTextColor="gray"
                        maxLength={100}
                        style={{ color: theme.text, backgroundColor: theme.border, paddingLeft: 15, height: 45, borderRadius: 5 }}
                        value={name}
                        onChangeText={text => setName(text)}
                    />
                </View>

                <View style={{ marginBottom: 15 }}>
                    <YambiText text={strings.role || "Role"} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 5 }} />
                    <Pressable 
                        onPress={() => { if (phone_number !== "") { dispatch(setShowModalApp(true)); setShowRoles(true) } }}
                        style={{
                            backgroundColor: theme.border,
                            paddingLeft: 15,
                            height: 45,
                            borderRadius: 5,
                            justifyContent: 'center',
                            flexDirection: 'row',
                            alignItems: 'center',
                            opacity: phone_number === "" ? 0.5 : 1
                        }}
                    >
                        <YambiText 
                            text={role === "" ? (strings.select_role || "Select Role") : role} 
                            size="normal" 
                            color={role === "" ? "gray" : "default"}
                            style={{ flex: 1 }}
                        />
                        <IconApp pack="FI" name="chevron-right" size={18} color={theme.gray} styles={{ marginRight: 10 }} />
                    </Pressable>
                </View>

                <View style={{ marginBottom: 15 }}>
                    <YambiText text={strings.service_name} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 5 }} />
                    <TextInput
                        placeholderTextColor="gray"
                        maxLength={100}
                        style={{ color: theme.text, backgroundColor: theme.border, paddingLeft: 15, height: 45, borderRadius: 5, opacity: 0.7 }}
                        value={service_name}
                        editable={false}
                    />
                </View>

                <View style={{ marginBottom: 15 }}>
                    <YambiText text={strings.service_name_abb} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 5 }} />
                    <TextInput
                        placeholderTextColor="gray"
                        maxLength={50}
                        style={{ color: theme.text, backgroundColor: theme.border, paddingLeft: 15, height: 45, borderRadius: 5, opacity: 0.7 }}
                        value={service_name_abb}
                        editable={false}
                    />
                </View>

                <View style={{ marginBottom: 15 }}>
                    <YambiText text={strings.tags || "Tags"} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 5 }} />
                    <TextInput
                        placeholderTextColor="gray"
                        maxLength={200}
                        style={{ color: theme.text, backgroundColor: theme.border, paddingLeft: 15, height: 45, borderRadius: 5, opacity: 0.7 }}
                        value={tags}
                        editable={false}
                    />
                </View>

                <View style={{ marginBottom: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <YambiText text={(strings as any).can_publish_info || "Can publish information"} size="small" color="gray" style={{ marginLeft: 2 }} />
                    <SwitchApp value={is_admin === 1} onPress={() => setIs_admin(is_admin === 1 ? 0 : 1)} />
                </View>

                {phone_number !== "" ? (
                    <View style={{ marginBottom: 20 }}>
                        {raiseAlert ? (
                            <ButtonNormal 
                                title={strings.add_user || strings.save} 
                                loading={loading}
                                onPress={NewCompanyUserData} 
                                styles={{ paddingHorizontal: 20, marginVertical: 20 }} 
                                normal={true} 
                            />
                        ) : (
                            <View style={{ alignItems: 'center', paddingVertical: 12 }}>
                                <YambiText text={(strings as any).member_exists || strings.user_exists || "Member already exists in this company"} size="normal" color="error" />
                            </View>
                        )}
                    </View>
                ) : null}

            </View>
        </ScrollView>
    )
}

export default NewCompanyUser;
