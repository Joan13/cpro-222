import { TouchableOpacity, View } from "react-native";
import { TCompany } from "../../../types/types";
import { useAppSelector } from "../../../store/app/hooks";
import { YambiText } from "../../app/Text";
import { strings } from "../../../lang/lang";
import * as RootNavigation from './../../../services/Navigation_ref';
import ButtonNormal from "../../app/ButtonNormal";
import { IconApp } from "../../app/IconApp";

const CompanyItem = ({ item, showPostButtons = false }: { item: TCompany, showPostButtons?: boolean }) => {
    const app_theme = useAppSelector(state => state.app_theme);

    const openCompanyDetails = () => {
        RootNavigation.navigate("Company", { company_id: item._id, company: item });
    };

    return (
        <TouchableOpacity onPress={openCompanyDetails} activeOpacity={0.8}>
            <View
            style={{
            backgroundColor: app_theme.colors.border + '30',
            borderRadius: 12,
            padding: 15,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: app_theme.colors.border,
        }}>
                <View style={{ marginBottom: 10 }}>
                    <YambiText text={item.company_name} bold size="normal" color="default" style={{ marginBottom: 4, fontSize: 16 }} />
                    {item.company_name_abb && (
                        <YambiText text={item.company_name_abb} size="small" color="gray" />
                    )}
                    {item.description_service && (
                        <YambiText
                            text={item.description_service}
                            size="small"
                            color="gray"
                            numberLines={2}
                            style={{ marginTop: 6 }}
                        />
                    )}
                    
                    {/* Address */}
                    {item.company_address && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                            <IconApp pack="FI" name="map-pin" size={12} color={app_theme.colors.gray} styles={{ marginRight: 6 }} />
                    <YambiText 
                                text={item.company_address}
                        size="small"
                                color="gray"
                                numberLines={1}
                                style={{ flex: 1 }}
                    />
                </View>
            )}

                    {/* Phones and Emails */}
            {(item.phones || item.emails) && (
                        <View style={{ marginTop: 6 }}>
                    {item.phones && (
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                    <IconApp pack="FI" name="phone" size={12} color={app_theme.colors.gray} styles={{ marginRight: 6 }} />
                                    <YambiText
                                        text={item.phones}
                                        size="small"
                                        color="gray"
                                        numberLines={1}
                                    />
                        </View>
                    )}
                    {item.emails && (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <IconApp pack="FI" name="mail" size={12} color={app_theme.colors.gray} styles={{ marginRight: 6 }} />
                                    <YambiText
                                        text={item.emails}
                                        size="small"
                                        color="gray"
                                        numberLines={1}
                                    />
                                </View>
                            )}
                        </View>
                    )}
                </View>

                {showPostButtons && (
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 5 }}>
                        <ButtonNormal
                            title={strings.timetable}
                            onPress={() => RootNavigation.navigate("PostNews", { company: item, flag: 2 })}
                            normal
                            iconName="plus"
                            iconPack="FI"
                            iconSize={14}
                            styles={{ flex: 1 }}
                        />
                        <ButtonNormal
                            title={(strings as any).information || "Information"}
                            onPress={() => RootNavigation.navigate("PostNews", { company: item, flag: 1 })}
                            normal
                            iconName="plus"
                            iconPack="FI"
                            iconSize={14}
                            styles={{ flex: 1 }}
                        />
                </View>
                )}
            </View>
        </TouchableOpacity>
    )
}

export default CompanyItem;
