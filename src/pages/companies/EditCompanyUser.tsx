import { TouchableOpacity, View, ScrollView, TextInput } from "react-native";
import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from "../../store/app/hooks";
import { strings } from "../../lang/lang";
import ButtonNormal from "../../components/app/ButtonNormal";
import { YambiText } from "../../components/app/Text";
import ModalApp from "../../components/app/ModalApp";
import { setLoadingButton, setShowModalApp } from "../../store/reducers/appSlice";
import { remote_host } from "../../../GlobalVariables";
import axios from "axios";
import { NavProps, TCompanyUser, TUser, TCompany } from "../../types/types";
import { IconApp } from "../../components/app/IconApp";
import moment from "moment";
import SwitchApp from "../../components/app/SwitchApp";
import { useQuery, useRealm } from "@realm/react";
import { UserContacts } from "../../store/database/Models";
import { FlashList } from "@shopify/flash-list";
import ContactsList from "../../components/lists/contacts/ContactsList";
import { getCompanyUserRole } from "../../util/getCompanyUserRole";

const EditCompanyUser = ({ navigation, route }: NavProps) => {

    const { company_user } = route.params;

    const theme = useAppSelector(state => state.app_theme.colors);
    const user_data = useAppSelector(state => state.user_data);
    const realm = useRealm();
    const [name, setName] = useState<string>("");
    const [phone_number, setPhone_number] = useState<string>("");
    const [service_name, setService_name] = useState<string>("");
    const [service_name_abb, setService_name_abb] = useState<string>("");
    const [showError, setShowError] = useState<boolean>(false);
    const [showSuccess, setShowSuccess] = useState<boolean>(false);
    const [showInternetError, setShowInternetError] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [user_active, setUser_active] = useState<number>(0);
    const [level, setLevel] = useState<number>(1);
    const [role, setRole] = useState<string>("");
    const [selectedTags, setSelectedTags] = useState<string[]>([]); // Selected tags as array (with # prefix)
    const [availableTags, setAvailableTags] = useState<string[]>([]); // Available tags from company (with # prefix)
    
    // Helper function to normalize tag (add # if missing)
    const normalizeTag = (tag: string): string => {
        const trimmed = tag.trim();
        return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
    };
    
    // Helper function to remove # prefix for comparison
    const removeHashPrefix = (tag: string): string => {
        return tag.trim().replace(/^#+/, '');
    };
    const [is_admin, setIs_admin] = useState<number>(0);
    const [showUsers, setShowUsers] = useState(false);
    const [showRoles, setShowRoles] = useState(false);
    const [raiseAlert, setRaiseAlert] = useState<boolean>(true);
    const [company, setCompany] = useState<TCompany | null>(null);
    const [companyUsers, setCompanyUsers] = useState<TCompanyUser[]>([]);
    const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false);
    const [currentUserLevel, setCurrentUserLevel] = useState<number | null>(null);
    const [showLevelError, setShowLevelError] = useState<boolean>(false);
    const dispatch = useAppDispatch();

    const contacts = useQuery(UserContacts, contacts => { return contacts; }, []);

    // Check if current user is admin for this company and get their level
    useEffect(() => {
        try {
            const currentUserCompanyUser = realm.objects('CompanyUsers').filtered(
                'phone_number == $0 && company_id == $1 && is_admin == $2',
                user_data.phone_number,
                company_user.company_id,
                1
            );
            setIsCurrentUserAdmin(currentUserCompanyUser.length > 0);
            
            // Get current user's level in this company
            const currentUserInCompany = realm.objects('CompanyUsers').filtered(
                'phone_number == $0 && company_id == $1',
                user_data.phone_number,
                company_user.company_id
            );
            if (currentUserInCompany.length > 0) {
                const userLevel = currentUserInCompany[0].level;
                setCurrentUserLevel(typeof userLevel === 'number' ? userLevel : null);
            } else {
                // If not in local DB, try to get from companyUsers array
                const userFromAPI = companyUsers.find(cu => cu.phone_number === user_data.phone_number);
                if (userFromAPI && typeof userFromAPI.level === 'number') {
                    setCurrentUserLevel(userFromAPI.level);
                }
            }
        } catch (e) {
            setIsCurrentUserAdmin(false);
            setCurrentUserLevel(null);
        }
    }, [user_data.phone_number, company_user.company_id, realm, companyUsers]);

    // Fetch company to get company_type and company users
    useEffect(() => {
        axios.post(remote_host + "/yambi/API/get_company", {
            company_id: company_user.company_id
        })
        .then(res => {
            if (res.data.success === "1") {
                const companyData = res.data.company;
                setCompany(companyData);
                const fetchedCompanyUsers = res.data.companyUsers || [];
                setCompanyUsers(fetchedCompanyUsers);
                
                // Get current user's level from fetched company users
                // Always update from API to ensure we have the latest level
                const userFromAPI = fetchedCompanyUsers.find((cu: TCompanyUser) => cu.phone_number === user_data.phone_number);
                if (userFromAPI && typeof userFromAPI.level === 'number') {
                    setCurrentUserLevel(userFromAPI.level);
                }
                
                // Get available tags from company keywords (also space-separated string)
                // Parse the same way as company user tags for consistency
                // The main tag (company abbreviated name) is always included and will always be checked
                if (companyData) {
                    let companyTags: string[] = [];
                    
                    // Add main tag (company abbreviated name) first - always visible and checked
                    // Add # prefix to main tag
                    if (companyData.company_name_abb && companyData.company_name_abb.trim() !== "") {
                        companyTags.push(normalizeTag(companyData.company_name_abb));
                    }
                    
                    // Add other tags from keywords
                    if (companyData.keywords) {
                        const keywordTags = companyData.keywords.trim()
                            .split(/\s+/)  // Split by one or more spaces
                            .map(tag => tag.trim())  // Trim whitespace from each tag
                            .filter(tag => tag !== "");  // Remove empty strings
                        
                        // Add keyword tags with # prefix, avoiding duplicates of the main tag
                        keywordTags.forEach(tag => {
                            const normalizedTag = normalizeTag(tag);
                            const mainTagNormalized = normalizeTag(companyData.company_name_abb || "");
                            if (removeHashPrefix(normalizedTag).toLowerCase() !== removeHashPrefix(mainTagNormalized).toLowerCase()) {
                                companyTags.push(normalizedTag);
                            }
                        });
                    }
                    
                    setAvailableTags(companyTags);
                }
            }
        })
        .catch(() => {});
    }, [company_user.company_id]);

    useEffect(() => {
        setName(company_user.user_name);
        setPhone_number(company_user.phone_number);
        setLevel(company_user.level || 1);
        
        setUser_active(company_user.user_active !== undefined ? company_user.user_active : 1);
        setIs_admin(company_user.is_admin !== undefined ? company_user.is_admin : 0);
        
        // Load role info from locale based on level and company category
        if (company && company.category && company_user.level) {
            const roleInfo = getCompanyUserRole(company_user.level, company.category);
            if (roleInfo) {
                setRole(roleInfo.role);
                setService_name(roleInfo.service_name);
                setService_name_abb(roleInfo.service_name_abb);
            }
        }
    }, [company_user, company]);

    // Initialize selected tags: parse company_user.tags and filter to only include tags that exist in availableTags
    // The main tag (company abbreviated name) is always included and checked
    useEffect(() => {
        if (availableTags.length === 0 || !company) return; // Wait for available tags and company to load
        
        // Main tag (company abbreviated name) - always checked (with # prefix)
        const mainTag = normalizeTag(company.company_name_abb || "");
        if (mainTag === "#") return; // Wait for company data
        
        // Parse company user tags: tags are stored as space-separated string (e.g., "#tag1 #tag2 tag3")
        // Handle both with and without # prefix for backward compatibility
        const tagsString = company_user.tags || "";
        const parsedUserTags = tagsString.trim() !== "" 
            ? tagsString.trim()
                .split(/\s+/)  // Split by one or more spaces
                .map(tag => normalizeTag(tag))  // Normalize tag (add # if missing)
                .filter(tag => tag !== "#")  // Remove empty strings
            : [];
        
        // Start with main tag (always selected)
        const validSelectedTags: string[] = [mainTag];
        
        // Add other tags that exist in availableTags (company keywords)
        // This auto-checks tags that the company user already has
        parsedUserTags.forEach(userTag => {
            const normalizedUserTag = removeHashPrefix(userTag).toLowerCase();
            const mainTagNormalized = removeHashPrefix(mainTag).toLowerCase();
            
            // Skip if it's the main tag (already added) or doesn't exist in availableTags
            if (normalizedUserTag !== mainTagNormalized && 
                availableTags.some(availableTag => 
                    removeHashPrefix(availableTag).toLowerCase() === normalizedUserTag
                )) {
                validSelectedTags.push(userTag);
            }
        });
        
        setSelectedTags(validSelectedTags);
    }, [company_user.tags, availableTags, company]);
    
    // Toggle tag selection - allows user to add or remove tags
    // Main tag (company abbreviated name) cannot be removed - always stays checked
    const toggleTag = (tag: string) => {
        const normalizedTag = normalizeTag(tag);
        
        // Prevent removing the main tag (company abbreviated name)
        if (company && company.company_name_abb) {
            const mainTagNormalized = normalizeTag(company.company_name_abb);
            if (removeHashPrefix(normalizedTag).toLowerCase() === removeHashPrefix(mainTagNormalized).toLowerCase()) {
                return; // Main tag cannot be unchecked
            }
        }
        
        setSelectedTags(prev => {
            // Check if tag already exists (case-insensitive comparison, ignoring # prefix)
            const tagIndex = prev.findIndex(selectedTag => 
                removeHashPrefix(selectedTag).toLowerCase() === removeHashPrefix(normalizedTag).toLowerCase()
            );
            if (tagIndex >= 0) {
                // Remove tag if it exists (uncheck) - but not the main tag
                return prev.filter((_, index) => index !== tagIndex);
            } else {
                // Add tag if it doesn't exist (check)
                return [...prev, normalizedTag];
            }
        });
    };

    const selectCon = (item: TUser) => {
        // Only allow changing phone number if admin
        if (!isCurrentUserAdmin) return;
        setPhone_number(item.phone_number);
        setName(item.user_names || "");
        const userExists = companyUsers.find(user => user.phone_number === item.phone_number);
        setRaiseAlert(userExists === undefined);
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
        return mapping[category] || "education";
    };

    // Get available roles based on company category
    const getAvailableRoles = () => {
        if (!company || !company.category) return [];
        
        const rolesKey = getCompanyRolesKey(company.category);
        const allRoles = (strings.company_roles as any)?.[rolesKey] || [];
        
        return allRoles;
    };

    const selectRole = (selectedRole: any) => {
        // Only allow changing role if admin
        if (!isCurrentUserAdmin) {
            dispatch(setShowModalApp(false));
            setShowRoles(false);
            return;
        }
        
        // Check if selected level is higher than current user's level
        // Lower level number = higher authority (e.g., level 1 = Admin is highest)
        // User cannot set a level with higher authority (lower number) than their own
        if (currentUserLevel !== null && selectedRole.level < currentUserLevel) {
            setShowLevelError(true);
            dispatch(setShowModalApp(true));
            setShowRoles(false);
            return;
        }
        
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
                // maxHeight: 400,
                marginTop: -15
            }}>
                <FlashList
                    data={availableRoles}
                    estimatedItemSize={60}
                    showsVerticalScrollIndicator={true}
                    renderItem={({ item, index }: { item: any, index: number }) => {
                        const isLastItem = index === availableRoles.length - 1;
                        // Check if this role's level is higher than current user's level
                        // Lower level number = higher authority (e.g., level 1 = Admin is highest)
                        // User cannot set a level with higher authority (lower number) than their own
                        const isDisabled = currentUserLevel !== null && item.level < currentUserLevel;
                        
                        return (
                            <TouchableOpacity
                                onPress={() => selectRole(item)}
                                disabled={isDisabled}
                                style={{
                                    padding: 15,
                                    borderBottomWidth: isLastItem ? 0 : 1,
                                    borderBottomColor: theme.border,
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    opacity: isDisabled ? 0.5 : 1
                                }}>
                                <View style={{ flex: 1 }}>
                                    <YambiText text={item.role} size="normal" color={isDisabled ? "gray" : "default"} />
                                    {item.abbreviated && (
                                        <YambiText text={`${item.abbreviated}`} size="small" color="gray" style={{ marginTop: 4 }} />
                                    )}
                                </View>
                                <IconApp pack="FI" name="chevron-right" size={18} color={theme.gray} />
                            </TouchableOpacity>
                        );
                    }}
                />
            </View>
        )
    }

    const EditCompanyUserData = () => {
        setLoading(true);
        // setTimeout(()=> {
            // For non-admins editing themselves, only validate name
            if (isCurrentUserAdmin) {
                if (name === "" || phone_number === "" || !raiseAlert) {
                    setShowError(true);
                    dispatch(setShowModalApp(true));
                    setLoading(false);
                    return;
                }
            } else {
                if (name === "") {
                    setShowError(true);
                    dispatch(setShowModalApp(true));
                    setLoading(false);
                    return;
                }
            }
            
            setLoading(true);
            dispatch(setLoadingButton(true));
    
                // Ensure main tag (company abbreviated name) is always included (with # prefix)
                let finalSelectedTags = [...selectedTags];
                if (company && company.company_name_abb) {
                    const mainTag = normalizeTag(company.company_name_abb);
                    const hasMainTag = finalSelectedTags.some(tag => 
                        removeHashPrefix(tag).toLowerCase() === removeHashPrefix(mainTag).toLowerCase()
                    );
                    if (!hasMainTag) {
                        finalSelectedTags.unshift(mainTag); // Add main tag at the beginning
                    }
                }
                
                // Convert selected tags array back to string (all tags already have # prefix)
                const tagsString = finalSelectedTags.join(' ');
                
                const company_user_data: TCompanyUser = {
                    _id: company_user._id,
                    company_id: company_user.company_id,
                    user_name: name,
                    phone_number: isCurrentUserAdmin ? phone_number : company_user.phone_number, // Only allow phone change if admin
                    service_name: "", // Not stored in backend, computed from level
                    service_name_abb: "", // Not stored in backend, computed from level
                    level: isCurrentUserAdmin ? level : company_user.level, // Only allow level change if admin
                    role: "", // Not stored in backend, computed from level
                    tags: tagsString,
                    user_active: isCurrentUserAdmin ? user_active : company_user.user_active, // Only allow change if admin
                    is_admin: isCurrentUserAdmin ? is_admin : company_user.is_admin, // Only allow change if admin
                    createdAt: company_user.createdAt,
                    updatedAt: moment(new Date()).format()
                }
    
                axios.post(remote_host + "/yambi/API/edit_company_user", { company_user: company_user_data })
                    .then(json => {
                        if (json.data.success === "1") {
                            // Update local Realm database if CompanyUser exists
                            try {
                                const existingCompanyUser = realm.objects('CompanyUsers').filtered('_id == $0', company_user._id);
                                if (existingCompanyUser.length > 0) {
                                    realm.write(() => {
                                        // Update the existing CompanyUser in Realm
                                        realm.create('CompanyUsers', {
                                            _id: company_user_data._id,
                                            company_id: company_user_data.company_id,
                                            phone_number: company_user_data.phone_number,
                                            user_name: company_user_data.user_name,
                                            service_name: company_user_data.service_name || "",
                                            service_name_abb: company_user_data.service_name_abb || "",
                                            level: company_user_data.level,
                                            role: company_user_data.role || "",
                                            tags: company_user_data.tags,
                                            user_active: company_user_data.user_active,
                                            is_admin: company_user_data.is_admin,
                                            createdAt: company_user_data.createdAt,
                                            updatedAt: company_user_data.updatedAt
                                        }, true); // true = update if exists
                                    });
                                }
                            } catch (realmError) {
                                // console.log("Error updating CompanyUser in Realm:", realmError);
                                // Continue even if Realm update fails
                            }
                            
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
        // }, 3000);
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

                {showLevelError ?
                    <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowLevelError(false) }} singleButton title={strings.error || "Error"}>
                        <YambiText text={(strings as any).cannot_set_higher_level || "You cannot set a user level higher than your own level."} size="normal" color="gray" />
                    </ModalApp> : null}

                {showLevelError ?
                    <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowLevelError(false) }} singleButton title={strings.error || "Error"}>
                        <YambiText text={(strings as any).cannot_set_higher_level || "You cannot set a user level higher than your own level."} size="normal" color="gray" />
                    </ModalApp> : null}

                {isCurrentUserAdmin && (
                    <View style={{ marginBottom: 15, marginTop: 10 }}>
                        <YambiText text={strings.user_details || strings.phone_number} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 5 }} />
                        <TouchableOpacity 
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
                                text={phone_number || strings.contact_select} 
                                size="normal" 
                                color={phone_number === "" ? "gray" : "default"}
                                style={{ flex: 1 }}
                            />
                            <IconApp pack="FI" name="chevron-right" size={18} color={theme.gray} styles={{ marginRight: 10 }} />
                        </TouchableOpacity>
                        {!raiseAlert && phone_number !== "" && (
                            <YambiText text={strings.user_exists} size="small" color="error" style={{ marginTop: 5, marginLeft: 2 }} />
                        )}
                    </View>
                )}
                
                {!isCurrentUserAdmin && (
                    <View style={{ marginBottom: 15, marginTop: 10 }}>
                        <YambiText text={strings.user_details || strings.phone_number} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 5 }} />
                        <View style={{
                            backgroundColor: theme.border,
                            paddingLeft: 15,
                            height: 45,
                            borderRadius: 5,
                            justifyContent: 'center',
                            opacity: 0.7
                        }}>
                            <YambiText 
                                text={phone_number || strings.contact_select} 
                                size="normal" 
                                color="gray"
                            />
                        </View>
                    </View>
                )}

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

                {isCurrentUserAdmin && (
                    <View style={{ marginBottom: 15 }}>
                        <YambiText text={strings.role || "Role"} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 5 }} />
                        <TouchableOpacity 
                            onPress={() => { dispatch(setShowModalApp(true)); setShowRoles(true) }}
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
                                text={role === "" ? (strings.select_role || "Select Role") : role} 
                                size="normal" 
                                color={role === "" ? "gray" : "default"}
                                style={{ flex: 1 }}
                            />
                            <IconApp pack="FI" name="chevron-right" size={18} color={theme.gray} styles={{ marginRight: 10 }} />
                        </TouchableOpacity>
                    </View>
                )}
                
                {!isCurrentUserAdmin && (
                    <View style={{ marginBottom: 15 }}>
                        <YambiText text={strings.role || "Role"} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 5 }} />
                        <View style={{
                            backgroundColor: theme.border,
                            paddingLeft: 15,
                            height: 45,
                            borderRadius: 5,
                            justifyContent: 'center',
                            opacity: 0.7
                        }}>
                            <YambiText 
                                text={role === "" ? (strings.select_role || "Select Role") : role} 
                                size="normal" 
                                color="gray"
                            />
                        </View>
                    </View>
                )}

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
                    {availableTags.length > 0 ? (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                            {availableTags.map((tag, index) => {
                                // Check if this tag from company keywords exists in the company user's tags
                                // This automatically checks tags that are already assigned to the company user
                                const normalizedTag = tag.trim();
                                const isSelected = selectedTags.some(selectedTag => 
                                    removeHashPrefix(selectedTag).toLowerCase() === removeHashPrefix(normalizedTag).toLowerCase()
                                );
                                
                                // Check if this is the main tag (company abbreviated name) - always checked and non-removable
                                const mainTagNormalized = company ? normalizeTag(company.company_name_abb || "") : "";
                                const isMainTag = !!(company && company.company_name_abb && 
                                    removeHashPrefix(normalizedTag).toLowerCase() === removeHashPrefix(mainTagNormalized).toLowerCase());
                                
                                return (
                                    <TouchableOpacity
                                        key={index}
                                        onPress={() => toggleTag(tag)}
                                        disabled={isMainTag} // Main tag cannot be toggled
                                        style={{
                                            backgroundColor: isSelected ? theme.high_color + '40' : theme.high_color + '20',
                                            paddingHorizontal: 12,
                                            paddingVertical: 6,
                                            borderRadius: 20,
                                            borderWidth: 1,
                                            borderColor: isSelected ? theme.high_color : theme.high_color + '40',
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            opacity: isMainTag ? 1 : 1 // Main tag is always visible and checked
                                        }}
                                    >
                                        {isSelected && (
                                            <IconApp pack="FI" name="check" size={12} color={theme.high_color} styles={{ marginRight: 4 }} />
                                        )}
                                        <YambiText text={tag} size="small" color={isSelected ? "high" : "gray"} />
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    ) : (
                        <View style={{
                            backgroundColor: theme.border,
                            paddingLeft: 15,
                            height: 45,
                            borderRadius: 5,
                            justifyContent: 'center',
                            opacity: 0.7
                        }}>
                            <YambiText text={strings.no_tags_available || "No tags available"} size="normal" color="gray" />
                        </View>
                    )}
                </View>

                {isCurrentUserAdmin && (
                    <>
                        <View style={{ marginBottom: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <YambiText text={strings.active} size="small" color="gray" style={{ marginLeft: 2 }} />
                            <SwitchApp value={user_active === 1} onPress={() => setUser_active(user_active === 1 ? 0 : 1)} />
                        </View>

                        <View style={{ marginBottom: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <YambiText text={(strings as any).can_publish_info || "Can publish information"} size="small" color="gray" style={{ marginLeft: 2 }} />
                            <SwitchApp value={is_admin === 1} onPress={() => setIs_admin(is_admin === 1 ? 0 : 1)} />
                        </View>
                    </>
                )}

                <ButtonNormal title={strings.save} loading={loading} onPress={EditCompanyUserData} styles={{ paddingHorizontal: 20, marginVertical: 20 }} normal={true} />

            </View>
        </ScrollView>
    )
}

export default EditCompanyUser;
