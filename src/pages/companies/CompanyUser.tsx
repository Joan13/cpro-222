import { View, ScrollView } from "react-native";
import { useEffect, useState } from 'react';
import { useAppSelector } from "../../store/app/hooks";
import { strings } from "../../lang/lang";
import { IconApp } from "../../components/app/IconApp";
import { YambiText } from "../../components/app/Text";
import { NavProps, TCompanyUser, TCompany } from "../../types/types";
import AppActivityIndicator from "../../components/app/AppActivityIndicator";
import { getCompanyUserRole } from "../../util/getCompanyUserRole";

const CompanyUser = ({ navigation, route }: NavProps) => {

    const { company_user, company: initialCompany } = route.params;

    const theme = useAppSelector(state => state.app_theme.colors);
    const [user, setUser] = useState<TCompanyUser | null>(company_user || null);
    const [company, setCompany] = useState<TCompany | null>(initialCompany || null);

    useEffect(() => {
        setUser(company_user);
        setCompany(initialCompany || null);
        
        // Set navigation title
        if (company_user) {
                    navigation.setOptions({ title: company_user.user_name });
                }
    }, [company_user, initialCompany, navigation]);

    if (!user) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
                <AppActivityIndicator showLabel />
            </View>
        );
    }

    // Get role info from level and company category
    const roleInfo = company && company.category && user.level ? getCompanyUserRole(user.level, company.category) : null;

    return (
        <ScrollView style={{
            backgroundColor: theme.background,
            borderColor: theme.border,
            borderTopWidth: 1,
            paddingHorizontal: 15
        }}>
            <View style={{ marginTop: 15 }}>
                {/* User Name */}
                <View style={{
                    backgroundColor: theme.border + '30',
                    borderRadius: 12,
                    padding: 15,
                    marginBottom: 15,
                    borderWidth: 1,
                    borderColor: theme.border,
                }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                        <YambiText text={(strings as any).member_name || strings.user_name} size="small" color="gray" />
                        {user.is_admin === 1 && (
                            <YambiText text={(strings as any).admin || "Admin"} size="small" color="success" />
                        )}
                    </View>
                    <YambiText text={user.user_name} bold size="normal" color="default" style={{ fontSize: 18 }} />
                </View>

                {/* Phone Number */}
                <View style={{
                    backgroundColor: theme.border + '30',
                    borderRadius: 12,
                    padding: 15,
                    marginBottom: 15,
                    borderWidth: 1,
                    borderColor: theme.border,
                }}>
                    <YambiText text={strings.phone_number} size="small" color="gray" style={{ marginBottom: 5 }} />
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <IconApp pack="FI" name="phone" size={14} color={theme.gray} styles={{ marginRight: 6 }} />
                        <YambiText text={user.phone_number} size="normal" color="default" />
                    </View>
                </View>

                {/* Role */}
                {roleInfo && roleInfo.role && (
                    <View style={{
                        backgroundColor: theme.border + '30',
                        borderRadius: 12,
                        padding: 15,
                        marginBottom: 15,
                        borderWidth: 1,
                        borderColor: theme.border,
                    }}>
                        <YambiText text={strings.role} size="small" color="gray" style={{ marginBottom: 5 }} />
                        <View style={{
                            backgroundColor: theme.high_color + '20',
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            borderRadius: 8,
                            alignSelf: 'flex-start',
                        }}>
                            <YambiText text={roleInfo.role} size="normal" color="high" />
                        </View>
                    </View>
                )}

                {/* Service Name */}
                {roleInfo && roleInfo.service_name && (
                    <View style={{
                        backgroundColor: theme.border + '30',
                        borderRadius: 12,
                        padding: 15,
                        marginBottom: 15,
                        borderWidth: 1,
                        borderColor: theme.border,
                    }}>
                        <YambiText text={strings.service_name} size="small" color="gray" style={{ marginBottom: 5 }} />
                        <YambiText text={roleInfo.service_name} size="normal" color="default" />
                    </View>
                )}

                {/* Service Name Abbreviation */}
                {roleInfo && roleInfo.service_name_abb && (
                    <View style={{
                        backgroundColor: theme.border + '30',
                        borderRadius: 12,
                        padding: 15,
                        marginBottom: 15,
                        borderWidth: 1,
                        borderColor: theme.border,
                    }}>
                        <YambiText text={strings.service_name_abb} size="small" color="gray" style={{ marginBottom: 5 }} />
                        <YambiText text={roleInfo.service_name_abb} size="normal" color="default" />
                    </View>
                )}

                {/* Tags */}
                {user.tags && (
                    <View style={{
                        backgroundColor: theme.border + '30',
                        borderRadius: 12,
                        padding: 15,
                        marginBottom: 15,
                        borderWidth: 1,
                        borderColor: theme.border,
                    }}>
                        <YambiText text={strings.tags} size="small" color="gray" style={{ marginBottom: 5 }} />
                        <YambiText text={user.tags} size="normal" color="default" />
                    </View>
                )}

                {/* Company Info */}
                {company && (
                    <View style={{
                        backgroundColor: theme.border + '30',
                        borderRadius: 12,
                        padding: 15,
                        marginBottom: 15,
                        borderWidth: 1,
                        borderColor: theme.border,
                    }}>
                        <YambiText text={strings.company_name} size="small" color="gray" style={{ marginBottom: 5 }} />
                        <YambiText text={company.company_name} size="normal" color="default" />
                    </View>
                )}

                {/* Created Date */}
                <View style={{
                    backgroundColor: theme.border + '30',
                    borderRadius: 12,
                    padding: 15,
                    marginBottom: 15,
                    borderWidth: 1,
                    borderColor: theme.border,
                }}>
                    <YambiText text={strings.created_at} size="small" color="gray" style={{ marginBottom: 5 }} />
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <IconApp pack="FI" name="calendar" size={14} color={theme.gray} styles={{ marginRight: 6 }} />
                        <YambiText text={new Date(user.createdAt).toLocaleDateString()} size="normal" color="default" />
                    </View>
                </View>
            </View>
        </ScrollView>
    )
}

export default CompanyUser;
