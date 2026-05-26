import { Pressable, View, Image } from "react-native";
import { TCompanyUser, TCompany } from "../../../types/types";
import { useAppSelector } from "../../../store/app/hooks";
import { YambiText } from "../../app/Text";
import * as RootNavigation from './../../../services/Navigation_ref';
import { getCompanyUserRole } from "../../../util/getCompanyUserRole";
import FastImage from "react-native-fast-image";
import { remote_host_server, media_url } from "../../../../GlobalVariables";

const CompanyUserItem = ({ item, company }: { item: TCompanyUser, company?: TCompany | null }) => {
    const app_theme = useAppSelector(state => state.app_theme);

    // Get user profile from server data (item may have user_profile even if not in type)
    const userProfile = (item as any).user_profile || "";

    const ViewPhoto = () => {
        if (userProfile !== "") {
            RootNavigation.navigate("ViewPhoto", { 
                source: media_url + "/profile_pictures/" + userProfile,
                title: item.user_name
            });
        } else {
            RootNavigation.navigate("ViewPhoto", { source: "", title: item.user_name });
        }
    };

    // Get role info from level and company category
    const roleInfo = company && company.category && item.level ? getCompanyUserRole(item.level, company.category) : null;

    return (
        <Pressable
            onPress={() => RootNavigation.navigate("CompanyUser", { company_user: item, company: company })}
            style={{
                // backgroundColor: app_theme.colors.border + '30',
                borderRadius: 12,
                paddingVertical: 15,
                // borderWidth: 1,
                // borderColor: app_theme.colors.border,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}
        >
            <Pressable onPress={ViewPhoto} style={{ marginRight: 12 }}>
                {userProfile && userProfile !== "" ? (
                    <View style={{
                        width: 50,
                        height: 50,
                        borderRadius: 25,
                        borderWidth: 2,
                        borderColor: app_theme.colors.high_color + '30',
                        overflow: 'hidden',
                    }}>
                        <FastImage
                            style={{ width: '100%', height: '100%' }}
                            resizeMode={FastImage.resizeMode.cover}
                            source={{
                                priority: FastImage.priority.high,
                                cache: 'immutable',
                                uri: media_url + "/profile_pictures/" + userProfile
                            }}
                        />
                    </View>
                ) : (
                    <View style={{
                        width: 50,
                        height: 50,
                        borderRadius: 25,
                        borderWidth: 2,
                        borderColor: app_theme.colors.border,
                        overflow: 'hidden',
                    }}>
                        <Image
                            source={require('./../../../assets/profile_black.jpg')}
                            style={{ width: '100%', height: '100%' }}
                        />
                    </View>
                )}
            </Pressable>

            <View style={{ flex: 1, marginRight: 10 }}>
                <YambiText text={item.user_name} bold size="normal" color="default" numberLines={1} style={{ marginBottom: 4, fontSize: 16 }} />
                <YambiText text={item.phone_number} size="small" color="gray" numberLines={1} />
            </View>

            {roleInfo && roleInfo.role && (
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <View style={{
                        backgroundColor: app_theme.colors.high_color + '20',
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 8
                    }}>
                        <YambiText
                            text={roleInfo.role}
                            size="small"
                            color="high"
                            numberLines={1}
                            style={{ fontSize: 12 }}
                        />
                    </View>
                </View>
            )}
        </Pressable>
    )
}

export default CompanyUserItem;
