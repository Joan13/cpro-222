import { View, RefreshControl, Pressable, ScrollView } from "react-native";
import { useEffect, useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from "../../store/app/hooks";
import { strings } from "../../lang/lang";
import { IconApp } from "../../components/app/IconApp";
import { YambiText } from "../../components/app/Text";
import { LegendList } from '@legendapp/list';
import CompanyUserItem from "../../components/lists/companies/CompanyUserItem";
import { remote_host, renderCategoryName } from "../../../GlobalVariables";
import axios from "axios";
import { NavProps, TCompany, TCompanyUser } from "../../types/types";
import { setShowModalApp } from "../../store/reducers/appSlice";
import AppActivityIndicator from "../../components/app/AppActivityIndicator";
import * as RootNavigation from './../../services/Navigation_ref';

const Company = ({ navigation, route }: NavProps) => {

    const { company_id, company: initialCompany } = route.params;

    const theme = useAppSelector(state => state.app_theme.colors);
    const dispatch = useAppDispatch();
    const [company, setCompany] = useState<TCompany | null>(initialCompany || null);
    const [companyUsers, setCompanyUsers] = useState<TCompanyUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const fetchCompany = useCallback(async (showLoading = true) => {
        if (showLoading) {
        setLoading(true);
        }
        try {
            const res = await axios.post(remote_host + "/yambi/API/get_company", {
                company_id: company_id
            });

            if (res.data.success === "1") {
                setCompany(res.data.company);
                setCompanyUsers(res.data.companyUsers || []);
                
                if (res.data.company) {
                    navigation.setOptions({ title: res.data.company.company_name });
                }
            } else {
                dispatch(setShowModalApp(true));
            }
        } catch (e) {
            dispatch(setShowModalApp(true));
        } finally {
            if (showLoading) {
            setLoading(false);
            }
        }
    }, [company_id, navigation, dispatch]);

    useEffect(() => {
        // If we have initial company data, set title immediately and fetch in background
        if (initialCompany) {
            navigation.setOptions({ title: initialCompany.company_name });
            // Fetch fresh data in background without showing loading
            fetchCompany(false);
        } else {
            // No initial data, fetch with loading indicator
            fetchCompany(true);
        }
    }, [company_id, initialCompany, navigation, fetchCompany]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        // Always fetch fresh data on refresh
        fetchCompany(false).finally(() => {
            setRefreshing(false);
        });
    }, [fetchCompany]);

    if (loading && !company) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
                <AppActivityIndicator showLabel />
            </View>
        );
    }

    if (!company) {
        return null;
    }

    const CompanyDetails = () => (
        <View style={{
            backgroundColor: theme.border + '30',
            borderRadius: 12,
            padding: 15,
            marginBottom: 15,
            marginTop: 15,
            borderWidth: 1,
            borderColor: theme.border,
        }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 }}>
                <View style={{ flex: 1 }}>
                    <YambiText text={company.company_name} bold size="normal" color="default" style={{ marginBottom: 4, fontSize: 20 }} />
                    {company.company_name_abb && (
                        <YambiText text={company.company_name_abb} size="small" color="gray" style={{ marginBottom: 8 }} />
                    )}
                    {company.category && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                            <IconApp pack="FI" name="tag" size={14} color={theme.gray} styles={{ marginRight: 4 }} />
                            <YambiText text={renderCategoryName(company.category)} size="small" color="gray" />
                        </View>
                    )}
                </View>
                <View style={{
                    backgroundColor: company.company_active === 1 ? theme.success + '20' : theme.error + '20',
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 8,
                }}>
                    <YambiText 
                        text={company.company_active === 1 ? strings.active : strings.inactive} 
                        size="small"
                        color={company.company_active === 1 ? "success" : "error"}
                        style={{ fontSize: 12 }}
                    />
                </View>
            </View>

            {company.description_service && (
                <YambiText text={company.description_service} numberLines={0} size="normal" color="gray" style={{ marginBottom: 15 }} />
            )}

            {company.company_address && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                    <IconApp pack="FI" name="map-pin" size={14} color={theme.gray} styles={{ marginRight: 6 }} />
                    <YambiText text={company.company_address} numberLines={2} size="normal" color="gray" style={{ flex: 1 }} />
                </View>
            )}

            {(company.phones || company.emails) && (
                <View style={{ marginBottom: 10 }}>
                    {company.phones && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                            <IconApp pack="FI" name="phone" size={14} color={theme.gray} styles={{ marginRight: 6 }} />
                            <YambiText text={company.phones} numberLines={1} size="normal" color="gray" />
                        </View>
                    )}
                    {company.emails && (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <IconApp pack="FI" name="mail" size={14} color={theme.gray} styles={{ marginRight: 6 }} />
                            <YambiText text={company.emails} numberLines={1} size="normal" color="gray" />
                        </View>
                    )}
                </View>
            )}

            {(company.national_id || company.national_number || company.tax_number) && (
                <View style={{ marginTop: 10, paddingTop: 15, borderTopWidth: 1, borderColor: theme.border }}>
                    {company.national_id && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                            <IconApp pack="MC" name="id-card" size={14} color={theme.gray} styles={{ marginRight: 6 }} />
                            <YambiText text={`${strings.identification_number}: ${company.national_id}`} size="small" color="gray" />
                        </View>
                    )}
                    {company.national_number && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                            <IconApp pack="FI" name="hash" size={14} color={theme.gray} styles={{ marginRight: 6 }} />
                            <YambiText text={`${strings.national_id}: ${company.national_number}`} size="small" color="gray" />
                        </View>
                    )}
                    {company.tax_number && (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <IconApp pack="FI" name="file-text" size={14} color={theme.gray} styles={{ marginRight: 6 }} />
                            <YambiText text={`${strings.tax_number}: ${company.tax_number}`} size="small" color="gray" />
                        </View>
                    )}
                </View>
            )}

            {company.keywords && company.keywords.trim() !== "" && (
                <View style={{ 
                    marginTop: 15, 
                    marginBottom: 10, 
                    paddingTop: 10, 
                    paddingBottom: 10,
                    borderTopWidth: 1,
                    borderColor: theme.border 
                }}>
                    <YambiText text={strings.tags} size="small" color="gray" style={{ marginBottom: 8 }} />
                    <View style={{ 
                        flexDirection: 'row', 
                        flexWrap: 'wrap', 
                        gap: 8
                    }}>
                        {company.keywords.trim().split(/\s+/).filter(tag => tag.trim() !== "").map((tag, index) => (
                            <View
                                key={index}
                                style={{
                                    backgroundColor: theme.high_color + '20',
                                    paddingHorizontal: 12,
                                    paddingVertical: 6,
                                    borderRadius: 20,
                                    borderWidth: 1,
                                    borderColor: theme.high_color + '40'
                                }}
                            >
                                <YambiText text={tag} size="small" color="high" />
                            </View>
                        ))}
                    </View>
                </View>
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderColor: theme.border }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <IconApp pack="FI" name="calendar" size={12} color={theme.gray} styles={{ marginRight: 4 }} />
                    <YambiText text={new Date(company.createdAt).toLocaleDateString()} size="small" color="gray" />
                </View>
                <Pressable
                    onPress={() => RootNavigation.navigate("EditCompany", { company: company })}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: theme.high_color + '15',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 8,
                    }}
                >
                    <IconApp pack="FI" name="edit" size={14} color={theme.high_color} styles={{ marginRight: 5 }} />
                    <YambiText text={strings.edit} size="small" color="high" style={{ fontSize: 12 }} />
                </Pressable>
            </View>
        </View>
    );

    // Sort users by level ASC, then filter
    const sortedUsers = [...companyUsers].sort((a, b) => (a.level || 0) - (b.level || 0));
    const activeUsers = sortedUsers.filter(user => user.user_active === 1);
    const pastMembers = sortedUsers.filter(user => user.user_active === 0);

    const ListHeader = () => (
        <View>
            <CompanyDetails />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 }}>
                <YambiText text={`${strings.company_users} (${activeUsers.length})`} bold size="normal" color="default" />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                    {/* <Pressable
                        onPress={() => RootNavigation.navigate("News", { flag: 2, company_id: company_id })}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: theme.high_color + '20',
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 8,
                        }}
                    >
                        <IconApp pack="FI" name="file-text" size={14} color={theme.high_color} styles={{ marginRight: 5 }} />
                        <YambiText text={strings.news || "News"} size="small" color="high" style={{ fontSize: 12 }} />
                    </Pressable> */}
                <Pressable
                    onPress={() => RootNavigation.navigate("NewCompanyUser", { company_id: company_id })}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: theme.high_color,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 8,
                    }}
                >
                    <IconApp pack="FI" name="plus" size={14} color="#FFFFFF" styles={{ marginRight: 5 }} />
                    <YambiText text={(strings as any).add} size="small" color="white" style={{ fontSize: 12 }} />
                </Pressable>
                </View>
            </View>
        </View>
    );

    return (
        <View style={{
            flex: 1,
            backgroundColor: theme.background,
            borderColor: theme.border,
            borderTopWidth: 1
        }}>
            {loading && !refreshing ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <AppActivityIndicator showLabel />
                </View>
            ) : (
                <ScrollView
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={theme.high_color}
                        />
                    }
                    contentContainerStyle={{
                        paddingHorizontal: 15,
                        paddingBottom: 20
                    }}
                >
                    <ListHeader />
                    
                    {activeUsers.length === 0 && pastMembers.length === 0 ? (
                        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                            <IconApp pack="FI" name="users" size={48} color={theme.gray} styles={{ marginBottom: 12, opacity: 0.5 }} />
                            <YambiText text={(strings as any).no_company_users || strings.no_items} size="normal" color="gray" style={{ textAlign: 'center' }} />
                        </View>
                    ) : (
                        <>
                            {activeUsers.length > 0 && (
                                <LegendList
                                    data={activeUsers}
                                    scrollEnabled={false}
                                    keyExtractor={(item: TCompanyUser) => item._id}
                                    renderItem={({ item }: { item: TCompanyUser }) => (
                                        <CompanyUserItem
                                            item={item}
                                            company={company}
                                        />
                                    )}
                                />
                            )}
                            
                            {pastMembers.length > 0 && (
                                <>
                                    <View style={{ marginTop: 10, marginBottom: 0 }}>
                                        <YambiText text={`${strings.past_members} (${pastMembers.length})`} bold size="normal" color="default" style={{ fontSize: 18 }} />
                                    </View>
                                    <LegendList
                                        data={pastMembers}
                                        scrollEnabled={false}
                                        keyExtractor={(item: TCompanyUser) => item._id}
                                        renderItem={({ item }: { item: TCompanyUser }) => (
                                            <CompanyUserItem
                                                item={item}
                                                company={company}
                                            />
                                        )}
                                    />
                                </>
                            )}
                        </>
                    )}
                </ScrollView>
            )}
        </View>
    )
}

export default Company;
