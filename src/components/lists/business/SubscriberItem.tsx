import { TouchableOpacity, View, Pressable } from "react-native";
import { useAppSelector } from "../../../store/app/hooks";
import { TextNormalYambi, TextSmallYambiGray } from "../../app/Text";
import { IconApp } from "../../app/IconApp";
import { remote_host_server, formatPhoneInternational, media_url } from "../../../../GlobalVariables";
import * as RootNavigation from './../../../services/Navigation_ref';
import { useObject } from "@realm/react";
import { UserContacts, UserData } from "../../../store/database/Models";
import FastImage from "react-native-fast-image";
import { TUser } from "../../../types/types";

interface SubscriberItemProps {
    item: {
        _id: string;
        phone_number: string;
        createdAt: string;
        user_data?: {
            user_names: string;
            user_profile: string;
            phone_number: string;
            account_privacy: string;
        } | null;
    };
    index: number;
}

const SubscriberItem = ({ item }: SubscriberItemProps) => {
    const app_theme = useAppSelector(state => state.app_theme);
    const user_data = useAppSelector(state => state.user_data);
    const contacts = useAppSelector(state => state.app.raw_contacts);

    // Try to get user from local database
    const localUser = useObject(
        item.phone_number !== user_data.phone_number ? UserContacts : UserData,
        item.phone_number
    );

    // Use API data if available, otherwise use local data
    const user = item.user_data || (localUser ? {
        user_names: localUser.user_names || "",
        user_profile: localUser.user_profile || "",
        phone_number: localUser.phone_number || item.phone_number,
        account_privacy: localUser.account_privacy || "1"
    } : null);

    const ShowUserName = (phone_number: string) => {
        const contact = contacts.find((cc) => cc.phoneNumber === phone_number);
        if (contact !== undefined) {
            return contact.displayName;
        } else if (user) {
            return user.user_names || phone_number;
        } else {
            return phone_number;
        }
    };

    const ViewPhoto = () => {
        const profile = user?.user_profile || "";
        if (profile !== "") {
            RootNavigation.navigate("ViewPhoto", { 
                source: media_url + "/profile_pictures/" + profile 
            });
        } else {
            RootNavigation.navigate("ViewPhoto", { source: "" });
        }
    };

    const GoToProfile = () => {
        // Construct a TUser object from available data
        const userObject: TUser = {
            user_id: item.phone_number,
            user_names: user?.user_names || item.phone_number,
            phone_number: item.phone_number,
            gender: localUser?.gender || 0,
            birth_date: localUser?.birth_date || "",
            country: localUser?.country || "",
            user_profile: user?.user_profile || "",
            profession: localUser?.profession || "",
            bio: localUser?.bio || "",
            user_email: localUser?.user_email || "",
            user_address: localUser?.user_address || "",
            status_information: localUser?.status_information || "",
            user_password: "",
            account_privacy: typeof (user?.account_privacy) === 'number' ? user.account_privacy : (typeof (localUser?.account_privacy) === 'number' ? localUser.account_privacy : 1),
            user_level: localUser?.user_level || 0,
            user_active: localUser?.user_active || 1,
            user_verified: localUser?.user_verified || 0,
            user_verified_at: localUser?.user_verified_at || "",
            notification_token: localUser?.notification_token || "",
            createdAt: item.createdAt || "",
            updatedAt: localUser?.updatedAt || ""
        };
        RootNavigation.navigate("UserProfileInfo", { user: userObject });
    };

    return (
        <Pressable
            onPress={GoToProfile}
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                paddingHorizontal: 15,
                backgroundColor: app_theme.colors.background,
                borderBottomWidth: 1,
                borderBottomColor: app_theme.colors.border,
            }}>
            <Pressable onPress={ViewPhoto}>
                {user?.user_profile && user.user_profile !== "" ? (
                    <FastImage
                        style={{ width: 50, height: 50, borderRadius: 25 }}
                        resizeMode={FastImage.resizeMode.cover}
                        source={{
                            priority: FastImage.priority.high,
                            cache: 'immutable',
                            uri: media_url + "/profile_pictures/" + user.user_profile
                        }}
                    />
                ) : (
                    <View style={{
                        width: 50,
                        height: 50,
                        borderRadius: 25,
                        backgroundColor: app_theme.colors.border,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}>
                        <IconApp pack="FI" name="user" size={24} color={app_theme.colors.gray} />
                    </View>
                )}
            </Pressable>

            <View style={{ flex: 1, marginLeft: 15 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TextNormalYambi 
                        numberLines={1} 
                        bold={true}
                        text={ShowUserName(item.phone_number)}
                    />
                    {localUser?.user_verified === 1 ?
                        <IconApp name="verified" pack="MT" size={15} color={app_theme.colors.high_color} styles={{ marginLeft: 5 }} /> : null}
                </View>
                <TextSmallYambiGray 
                    numberLines={1} 
                    text={formatPhoneInternational({ phone_number: item.phone_number, country: "" } as any)}
                />
            </View>

            <TouchableOpacity
                onPress={GoToProfile}
                style={{
                    padding: 8,
                }}>
                <IconApp pack="FI" name="chevron-right" size={20} color={app_theme.colors.gray} />
            </TouchableOpacity>
        </Pressable>
    );
};

export default SubscriberItem;
