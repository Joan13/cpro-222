import { View, ScrollView, TextInput, TouchableOpacity } from "react-native";
import { useState, useCallback, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from "../../store/app/hooks";
import { strings } from "../../lang/lang";
import ButtonNormal from "../../components/app/ButtonNormal";
import { YambiText } from "../../components/app/Text";
import ModalApp from "../../components/app/ModalApp";
import { setLoadingButton, setShowModalApp } from "../../store/reducers/appSlice";
import { randomString, remote_host, renderDateUpToMilliseconds } from "../../../GlobalVariables";
import axios from "axios";
import { TCompany, TCompanyUser } from "../../types/types";
import moment from "moment";
import { IconApp } from "../../components/app/IconApp";

interface NoticeBoardRegistrationProps {
    onRegistrationSuccess?: () => void;
}

const NoticeBoardRegistration = ({ onRegistrationSuccess }: NoticeBoardRegistrationProps) => {
    const theme = useAppSelector(state => state.app_theme.colors);
    const user_data = useAppSelector(state => state.user_data);
    const [company_tags, setCompany_tags] = useState<string>("");
    const [name, setName] = useState<string>("");
    const [service_name, setService_name] = useState<string>("");
    const [service_name_abb, setService_name_abb] = useState<string>("");
    const [showError, setShowError] = useState<boolean>(false);
    const [showSuccess, setShowSuccess] = useState<boolean>(false);
    const [showInternetError, setShowInternetError] = useState<boolean>(false);
    const [role, setRole] = useState<string>("");
    const [tags, setTags] = useState<string[]>([]);
    const [company, setCompany] = useState<TCompany | null>(null);
    const [companies, setCompanies] = useState<TCompany[]>([]);
    const [searchingCompanies, setSearchingCompanies] = useState(false);
    const dispatch = useAppDispatch();

    // Search for companies by tags - as user types (with debouncing)
    const searchCompanies = useCallback(async (tags: string) => {
        if (!tags || tags.trim() === "") {
            setCompanies([]);
            setSearchingCompanies(false);
            return;
        }

        setSearchingCompanies(true);
        try {
            const res = await axios.post(remote_host + "/yambi/API/find_company_by_tags", {
                tags: tags.trim()
            });

            if (res.data.success === "1") {
                const foundCompanies: TCompany[] = res.data.data || [];
                setCompanies(foundCompanies);
            } else {
                setCompanies([]);
            }
        } catch (e) {
            setCompanies([]);
        } finally {
            setSearchingCompanies(false);
        }
    }, []);

    // Debounce search as user types
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    
    useEffect(() => {
        // Clear previous timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // If input is empty, clear companies immediately
        if (company_tags.trim() === "") {
            setCompanies([]);
            setSearchingCompanies(false);
            return;
        }

        // Set new timer to search after user stops typing (500ms delay)
        debounceTimerRef.current = setTimeout(() => {
            searchCompanies(company_tags);
        }, 500);

        // Cleanup function
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [company_tags, searchCompanies]);

    const selectCompany = async (selectedCompany: TCompany) => {
        // Fetch full company data to ensure we have keywords field
        try {
            const res = await axios.post(remote_host + "/yambi/API/get_company", {
                company_id: selectedCompany._id
            });

            if (res.data.success === "1" && res.data.company) {
                const fullCompanyData = res.data.company;
                setCompany(fullCompanyData);
                
                // Set main tag: use company_name_abb if available, otherwise company_name (without #)
                const mainTag = fullCompanyData.company_name_abb && fullCompanyData.company_name_abb.trim() !== ""
                    ? fullCompanyData.company_name_abb
                    : fullCompanyData.company_name;
                // Pre-fill with main tag only
                setTags([mainTag]);
                setCompany_tags(`#${mainTag}`); // Update the input field with the selected company's tag
                setName(user_data.user_names || "");
                setCompanies([]); // Clear the companies list after selection
                
                // Automatically set the last level role for the selected company
                const lastLevelRole = getLastLevelRole(fullCompanyData.category);
                if (lastLevelRole) {
                    setRole(lastLevelRole.role);
                    setService_name(lastLevelRole.role || "");
                    setService_name_abb(lastLevelRole.abbreviated || "");
                } else {
                    // Reset if no roles found
                    setRole("");
                    setService_name("");
                    setService_name_abb("");
                }
            } else {
                // Fallback to selected company if fetch fails
                setCompany(selectedCompany);
                const mainTag = selectedCompany.company_name_abb && selectedCompany.company_name_abb.trim() !== ""
                    ? selectedCompany.company_name_abb
                    : selectedCompany.company_name;
                setTags([mainTag]);
                setCompany_tags(`#${mainTag}`);
                setName(user_data.user_names || "");
                setCompanies([]);
            }
        } catch (error) {
            // Fallback to selected company if fetch fails
            setCompany(selectedCompany);
            const mainTag = selectedCompany.company_name_abb && selectedCompany.company_name_abb.trim() !== ""
                ? selectedCompany.company_name_abb
                : selectedCompany.company_name;
            setTags([mainTag]);
            setCompany_tags(`#${mainTag}`);
            setName(user_data.user_names || "");
            setCompanies([]);
        }
    };

    // Get company tags from keywords field
    const getCompanyTags = (): string[] => {
        if (!company) {
            return [];
        }
        
        // Get main tag (company abbreviated name or company name)
        const mainTag = company.company_name_abb && company.company_name_abb.trim() !== ""
            ? company.company_name_abb
            : company.company_name;
        
        // Parse tags from keywords field (space-separated)
        // Each word/block in keywords is a tag
        const keywordsTags: string[] = company.keywords && company.keywords.trim() !== ""
            ? company.keywords.trim().split(/\s+/).filter(tag => tag.trim() !== "")
            : [];
        
        // Combine main tag with keywords tags, ensuring main tag is first and no duplicates
        const allTags = [mainTag, ...keywordsTags.filter(tag => tag !== mainTag && tag !== `#${mainTag}`)];
        
        return allTags;
    };

    // Toggle tag selection
    const toggleTag = (tag: string) => {
        const mainTag = tags[0]; // Main tag is always first
        if (tag === mainTag) return; // Can't deselect main tag

        if (tags.includes(tag)) {
            // Remove tag
            setTags(tags.filter(t => t !== tag));
        } else {
            // Add tag (keep main tag first)
            setTags([mainTag, ...tags.slice(1), tag]);
        }
    };

    // Check if tag is selected
    const isTagSelected = (tag: string): boolean => {
        if (!company) return false;
        // Main tag is always selected
        const mainTag = company.company_name_abb && company.company_name_abb.trim() !== ""
            ? company.company_name_abb
            : company.company_name;
        if (tag === mainTag) return true;
        return tags.includes(tag);
    };

    // Map company category to company_roles key
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
        return mapping[category] || "";
    };

    // Get available roles based on company category
    const getAvailableRoles = (companyCategory?: number) => {
        const category = companyCategory || company?.category;
        if (!category) return [];

        const rolesKey = getCompanyRolesKey(category);
        const allRoles = (strings.company_roles as any)?.[rolesKey] || [];
        
        return allRoles;
    };

    // Get the last level (highest level number) from available roles
    const getLastLevel = (companyCategory?: number) => {
        const availableRoles = getAvailableRoles(companyCategory);
        if (availableRoles.length === 0) return 1;
        
        const levels = availableRoles.map((r: any) => r.level || 0);
        return Math.max(...levels, 1);
    };

    // Get the role object with the last level (highest level number)
    const getLastLevelRole = (companyCategory?: number) => {
        const availableRoles = getAvailableRoles(companyCategory);
        if (availableRoles.length === 0) return null;
        
        const lastLevel = getLastLevel(companyCategory);
        const lastRole = availableRoles.find((r: any) => r.level === lastLevel);
        return lastRole || null;
    };



    const CompaniesList = () => {
        if (searchingCompanies) {
            return (
                <View style={{ padding: 15, alignItems: 'center', backgroundColor: theme.border + '20', borderRadius: 8, marginTop: 10 }}>
                    <YambiText text={strings.search} size="normal" color="gray" />
                </View>
            );
        }

        if (companies.length === 0 && company_tags.trim() !== "") {
            return (
                <View style={{ padding: 15, alignItems: 'center', backgroundColor: theme.border + '20', borderRadius: 8, marginTop: 10 }}>
                    <IconApp pack="FI" name="search" size={24} color={theme.gray} styles={{ marginBottom: 8, opacity: 0.5 }} />
                    <YambiText text={(strings as any).no_companies_found || "No companies found"} size="normal" color="gray" style={{ textAlign: 'center', marginBottom: 4 }} />
                    <YambiText text={(strings as any).try_different_tags || "Try entering a different company tag"} size="small" color="gray" style={{ textAlign: 'center' }} />
                </View>
            );
        }

        if (companies.length === 0) {
            return null;
        }

        return (
            <View style={{
                backgroundColor: theme.border + '20',
                borderRadius: 8,
                marginTop: 10,
                maxHeight: 300,
                borderWidth: 1,
                borderColor: theme.border
            }}>
                <View style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                    <YambiText text={`${strings.companies} (${companies.length})`} size="small" color="gray" bold />
                </View>
                {companies.map((item, index) => {
                    const isLastItem = index === companies.length - 1;
                    return (
                        <TouchableOpacity
                            key={item._id}
                            onPress={() => selectCompany(item)}
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
                                <YambiText text={item.company_name} size="normal" color="default" />
                                {item.company_name_abb && (
                                    <YambiText text={item.company_name_abb} size="small" color="gray" style={{ marginTop: 4 }} />
                                )}
                            </View>
                            <IconApp pack="FI" name="chevron-right" size={18} color={theme.gray} />
                        </TouchableOpacity>
                    );
                })}
            </View>
        );
    };

    const RegisterCompanyUser = () => {
        if (name === "" || !company) {
            setShowError(true);
            dispatch(setShowModalApp(true));
        } else {
            dispatch(setLoadingButton(true));

            const company_user_id = randomString(5).toUpperCase() + renderDateUpToMilliseconds();

            // Level is automatically set to the last level of the company
            const finalLevel = getLastLevel();

            // Convert tags array to space-separated string (with # prefix for each tag)
            const tagsString = tags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(" ");

            const company_user_data: TCompanyUser = {
                _id: company_user_id,
                company_id: company._id,
                user_name: name,
                phone_number: user_data.phone_number, // Use current user's phone number
                service_name: "", // Not stored in backend, computed from level
                service_name_abb: "", // Not stored in backend, computed from level
                level: finalLevel, // Last level of the company
                role: "", // Not stored in backend, computed from level
                tags: tagsString,
                user_active: 1, // Default to active
                createdAt: moment(new Date()).format(),
                updatedAt: moment(new Date()).format()
            }

            axios.post(remote_host + "/yambi/API/new_company_user", { company_user: company_user_data })
                .then(json => {
                    if (json.data.success === "1") {
                        setShowSuccess(true);
                        dispatch(setShowModalApp(true));
                        dispatch(setLoadingButton(false));
                        setTimeout(() => {
                            // Reset form
                            setCompany(null);
                            setCompany_tags("");
                            setName("");
                            setRole("");
                            setService_name("");
                            setService_name_abb("");
                            setTags([]);
                            if (onRegistrationSuccess) {
                                onRegistrationSuccess();
                            }
                        }, 500);
                    } else {
                        setShowInternetError(true);
                        dispatch(setShowModalApp(true));
                        dispatch(setLoadingButton(false));
                    }
                })
                .catch(() => {
                    setShowInternetError(true);
                    dispatch(setShowModalApp(true));
                    dispatch(setLoadingButton(false));
                })
        }
    }

    return (
        <ScrollView style={{
            backgroundColor: theme.background,
        }}>

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



            <View style={{ marginBottom: 15 }}>
                <YambiText text={strings.tags} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 5 }} />
                <TextInput
                    placeholderTextColor="gray"
                    placeholder={(strings as any).enter_company_tags}
                    maxLength={100}
                    style={{ color: theme.text, backgroundColor: theme.border, paddingLeft: 15, height: 45, borderRadius: 5 }}
                    value={company_tags}
                    onChangeText={text => {
                        setCompany_tags(text);
                        // Clear selected company when user starts typing again
                        if (company) {
                            setCompany(null);
                            setName("");
                            setRole("");
                            setService_name("");
                            setService_name_abb("");
                            setTags([]);
                        }
                    }}
                />
                <CompaniesList />
            </View>

            {company && (
                <>
                    <View style={{ marginBottom: 15, padding: 15, backgroundColor: theme.border + '30', borderRadius: 8, borderWidth: 1, borderColor: theme.border }}>
                        <YambiText text={strings.company} size="small" color="gray" style={{ marginBottom: 5 }} />
                        <YambiText text={company.company_name} bold size="normal" color="default" />
                        {company.company_name_abb && (
                            <YambiText text={company.company_name_abb} size="small" color="gray" style={{ marginTop: 4 }} />
                        )}
                    </View>

                    <View style={{ marginBottom: 15 }}>
                        <YambiText text={strings.user_name} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 5 }} />
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
                        <View
                            style={{
                                backgroundColor: theme.border,
                                paddingLeft: 15,
                                height: 45,
                                borderRadius: 5,
                                justifyContent: 'center',
                                flexDirection: 'row',
                                alignItems: 'center',
                                opacity: 0.7
                            }}
                        >
                            <YambiText 
                                text={role || (strings.select_role || "Select Role")} 
                                size="normal" 
                                color={role === "" ? "gray" : "default"}
                                style={{ flex: 1 }}
                            />
                        </View>
                        <YambiText 
                            text={(strings as any).auto_assigned_last_level || "Automatically assigned: Last level access"} 
                            size="small" 
                            color="gray" 
                            style={{ marginLeft: 2, marginTop: 4, fontStyle: 'italic' }} 
                        />
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
                        <YambiText text={(strings as any).tags_to_receive_info || strings.tags || "Tags to receive information"} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 5 }} />
                        <YambiText text={(strings as any).tags_info_description || "You will receive information from the main tag and any additional tags you select"} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 15, fontStyle: 'italic' }} />
                        
                        {company && (() => {
                            const companyTags = getCompanyTags();
                            const mainTag = company.company_name_abb && company.company_name_abb.trim() !== ""
                                ? company.company_name_abb
                                : company.company_name;

                            if (companyTags.length === 0) {
                                return (
                                    <View style={{ padding: 20, alignItems: 'center' }}>
                                        <YambiText text={(strings as any).no_tags_available || "No tags available"} size="normal" color="gray" />
                                    </View>
                                );
                            }

                            return (
                                <View style={{ 
                                    flexDirection: 'row', 
                                    flexWrap: 'wrap', 
                                    gap: 10
                                }}>
                                    {companyTags.map((tag, index) => {
                                        const isMainTag = tag === mainTag;
                                        const isSelected = isTagSelected(tag);
                                        
                                        return (
                                            <TouchableOpacity
                                                key={index}
                                                onPress={() => {
                                                    if (isMainTag) {
                                                        // Main tag cannot be deselected
                                                        return;
                                                    }
                                                    toggleTag(tag);
                                                }}
                                                disabled={isMainTag}
                                                style={{
                                                    paddingHorizontal: 15,
                                                    paddingVertical: 10,
                                                    borderRadius: 20,
                                                    borderWidth: 1,
                                                    borderColor: isSelected ? theme.high_color : theme.border,
                                                    backgroundColor: isSelected ? theme.high_color + '30' : theme.border + '30',
                                                    opacity: isMainTag ? 0.7 : 1
                                                }}
                                            >
                                                <YambiText 
                                                    text={isMainTag ? `#${tag} (${(strings as any).main_tag || "Main"})` : `#${tag}`} 
                                                    size="small" 
                                                    color={isSelected ? "high" : "default"} 
                                                />
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            );
                        })()}
                    </View>

                    <View style={{ marginBottom: 20 }}>
                        <ButtonNormal 
                            title={(strings as any).register || strings.subscribe || "Register"} 
                            loadEnabled={true} 
                            onPress={RegisterCompanyUser} 
                            styles={{ paddingHorizontal: 20, marginVertical: 20 }} 
                            normal={true} 
                        />
                    </View>
                </>
            )}
        </ScrollView>
    )
}

export default NoticeBoardRegistration;
