import { Pressable, View, TextInput, RefreshControl } from "react-native";
import Feather from 'react-native-vector-icons/Feather';
import { useEffect, useState, useCallback, useRef } from 'react';
import { TCompany } from "../../types/types";
import { strings } from "../../lang/lang";
import { IconApp } from "../../components/app/IconApp";
import { useAppSelector } from "../../store/app/hooks";
import axios from "axios";
import { YambiText } from "../../components/app/Text";
import { TextNormalYambi, TextNormalYambiGray, TextNormalYambiHighColor } from "../../components/app/Text";
import { LegendList } from '@legendapp/list';
import CompanyItem from "../../components/lists/companies/CompanyItem";
import { remote_host } from "../../../GlobalVariables";
import AppActivityIndicator from "../../components/app/AppActivityIndicator";
import { useQuery } from "@realm/react";
import { CompanyUsers } from "../../store/database/Models";
import { useRoute } from "@react-navigation/native";
import ButtonNormal from "../../components/app/ButtonNormal";
import * as RootNavigation from '../../services/Navigation_ref';

const Companies = () => {
    const route = useRoute<any>();
    const fromNoticeBoard = !!(route.params && (route.params as any).fromNoticeBoard);
    const fromPlusButton = !!(route.params && (route.params as any).fromPlusButton);
    const theme = useAppSelector(state => state.app_theme.colors);
    const user_data = useAppSelector(state => state.user_data);
    const [searchText, setSearchText] = useState<string>("");
    const [refreshing, setRefreshing] = useState(false);

    const [companies, setCompanies] = useState<TCompany[]>([]);
    const [loading, setLoading] = useState(false);
    const fetchingRef = useRef(false);
    const [overview, setOverview] = useState<{ total: number; active: number; inactive: number }>({ total: 0, active: 0, inactive: 0 });

    // Get company users from Realm
    const companyUsers = useQuery(
        CompanyUsers, cu => {
            return cu.filtered('phone_number == $0 && user_active == $1', user_data.phone_number, 1);
        }, [user_data.phone_number]);

    const fetchCompanies = useCallback(async () => {
        if (fetchingRef.current) return;

        fetchingRef.current = true;
        setLoading(true);

        try {
            let allCompanies: TCompany[] = [];

            // If coming from plus button, fetch only companies where user is an admin
            if (fromPlusButton) {
                // Get companies where user is a companyUser admin
                const adminCompanyIds = companyUsers
                    .filter((cu: any) => cu.is_admin === 1)
                    .map((cu: any) => cu.company_id);
                
                if (adminCompanyIds.length > 0) {
                    // Fetch company details for each admin company
                    const companyPromises = adminCompanyIds.map(async (companyId: string) => {
                        try {
                            const res = await axios.post(remote_host + "/yambi/API/get_company", {
                                company_id: companyId
                            });
                            if (res.data.success === "1") {
                                return res.data.company;
                            }
                        } catch (e) {
                            return null;
                        }
                        return null;
                    });
                    
                    const companiesData = await Promise.all(companyPromises);
                    allCompanies = companiesData.filter(c => c !== null) as TCompany[];
                }
            }
            // If user is admin (user_level > 0) and not coming from NoticeBoard or plus button, fetch all companies
            else if (user_data.user_level > 0 && !fromNoticeBoard) {
            const res = await axios.post(remote_host + "/yambi/API/get_admin_data", {
                flag: 3, // flag 3 for companies
                    last_id: null,
                search: searchText || ''
            });

            if (res.data.success === "1") {
                    allCompanies = res.data.data || [];
                    // Update overview stats if available
                if (res.data.overview) {
                    setOverview(res.data.overview);
                    } else {
                        // Calculate overview from companies if not provided by API
                        const total = allCompanies.length;
                        const active = allCompanies.filter(c => c.company_active === 1).length;
                        const inactive = total - active;
                        setOverview({ total, active, inactive });
                    }
                }
            } 
            // Regular users OR when coming from NoticeBoard:
            // fetch only companies where the user is a subscriber
            else {
                const res = await axios.post(remote_host + "/yambi/API/get_subscription_data", {
                    phone_number: user_data.phone_number
                });

                if (res.data.success === "1") {
                    allCompanies = res.data.companies || [];
                }
                }

            // Filter companies based on search text (if not already filtered by API)
            let filteredCompanies = allCompanies;
            if (searchText.trim() !== '' && (user_data.user_level <= 0 || fromNoticeBoard || fromPlusButton)) {
                const searchLower = searchText.toLowerCase();
                filteredCompanies = allCompanies.filter(company => 
                    company.company_name?.toLowerCase().includes(searchLower) ||
                    company.company_name_abb?.toLowerCase().includes(searchLower) ||
                    company.description_service?.toLowerCase().includes(searchLower)
                );
            }
            
            setCompanies(filteredCompanies);
        } catch (e) {
            setCompanies([]);
        } finally {
            setLoading(false);
            fetchingRef.current = false;
        }
    }, [user_data.phone_number, user_data.user_level, searchText, fromNoticeBoard, fromPlusButton, companyUsers]);

    useEffect(() => {
        fetchCompanies();
    }, [searchText, companyUsers.length]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchCompanies().finally(() => {
            setRefreshing(false);
        });
    }, [fetchCompanies]);

    const SearchItem = (search: string) => {
        setSearchText(search);
    }

    const OverviewHeader = () => (
        <View style={{
            marginVertical: 15,
            backgroundColor: theme.border + '40',
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: theme.border,
        }}>
            <TextNormalYambi text={(strings as any).companies_overview || strings.businesses_overview || "Companies Overview"} bold styles={{ marginBottom: 12, fontSize: 18 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                <View style={{ alignItems: 'center' }}>
                    <IconApp pack="FA" name="building" size={24} color={theme.high_color} />
                    <TextNormalYambiHighColor text={overview.total.toString()} bold styles={{ marginTop: 8, fontSize: 24 }} />
                    <TextNormalYambiGray text={strings.total} styles={{ marginTop: 4 }} />
                </View>
                <View style={{ alignItems: 'center' }}>
                    <IconApp pack="FI" name="check-circle" size={24} color={theme.success} />
                    <TextNormalYambiHighColor text={overview.active.toString()} bold styles={{ marginTop: 8, fontSize: 24, color: theme.success }} />
                    <TextNormalYambiGray text={strings.active} styles={{ marginTop: 4 }} />
                </View>
                <View style={{ alignItems: 'center' }}>
                    <IconApp pack="FI" name="x-circle" size={24} color={theme.error} />
                    <TextNormalYambiHighColor text={overview.inactive.toString()} bold styles={{ marginTop: 8, fontSize: 24, color: theme.error }} />
                    <TextNormalYambiGray text={strings.inactive} styles={{ marginTop: 4 }} />
                </View>
            </View>
        </View>
    );

    const AddCompanyButton = () => {
        if (user_data.user_level === 0 || fromNoticeBoard || fromPlusButton) {
            return null;
        }
        
        return (
            <View style={{ marginBottom: 15, paddingHorizontal: 0 }}>
                <ButtonNormal
                    title={(strings as any).add_company || strings.add}
                    onPress={() => RootNavigation.navigate("NewCompany")}
                    normal
                    iconName="plus"
                    iconPack="FI"
                    iconSize={16}
                    styles={{ width: '100%' }}
                />
        </View>
    );
    };


    return (
        <View style={{
            flex: 1,
            justifyContent: 'center',
            backgroundColor: theme.background,
            borderColor: theme.border,
            borderTopWidth: 1
        }}>
            <View style={{ flex: 1 }}>
                <View
                    style={{ marginBottom: 0, marginHorizontal: 15, borderBottomWidth: 1, paddingVertical: 0, borderColor: theme.border, flexDirection: 'row', alignItems: 'center', backgroundColor: theme.background }}>
                    <Feather name="search" size={16} style={{ marginRight: 10, color: theme.gray }} />
                    <TextInput
                        onChangeText={SearchItem}
                        value={searchText}
                        placeholder={strings.search}
                        placeholderTextColor={theme.gray}
                        style={{ flex: 1, paddingVertical: 0, height: 40, borderWidth: 0, borderColor: theme.background, backgroundColor: theme.background, color: theme.text }}
                    />
                    {searchText !== "" ?
                        <Pressable
                            onPress={() => {
                                setSearchText("");
                            }}
                            style={{
                                height: 30,
                                width: 30,
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}>
                            <Feather name="x" size={16} style={{ color: theme.text }} />
                        </Pressable> : null}
                </View>

                {loading ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <AppActivityIndicator showLabel />
                    </View>
                ) : (
                    <LegendList
                        data={companies}
                        keyboardShouldPersistTaps='handled'
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                tintColor={theme.high_color}
                            />
                        }
                        ListHeaderComponent={
                            user_data.user_level !== 0 && !fromNoticeBoard && !fromPlusButton ? (
                                <View>
                                    <OverviewHeader />
                                    <AddCompanyButton />
                                </View>
                            ) : null
                        }
                        renderItem={({ item }: { item: TCompany }) => (
                            <CompanyItem
                                item={item}
                                showPostButtons={fromPlusButton || (!fromNoticeBoard && !fromPlusButton)}
                            />
                        )}
                        contentContainerStyle={{
                            paddingHorizontal: 15,
                            paddingBottom: 20
                        }}
                        ListEmptyComponent={
                            <View style={{ alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 }}>
                                <IconApp pack="FA" name="building" size={48} color={theme.gray} styles={{ marginBottom: 12, opacity: 0.5 }} />
                                <YambiText text={(strings as any).no_companies_found || strings.no_items || "No companies found"} size="normal" color="gray" style={{ textAlign: 'center' }} />
                    </View>
                        }
                    />
                )}
            </View>
        </View>
    )
}

export default Companies;
