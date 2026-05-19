import { View, TouchableOpacity, ActivityIndicator, Text, Platform, SafeAreaView } from "react-native"
import { useAppSelector } from "../../store/app/hooks";
import { useNavigation } from "@react-navigation/native";
import { IconApp } from "../app/IconApp";
import { YambiText } from "../app/Text";
import { strings } from "../../lang/lang";
import { NavProps } from "../../types/types";

const HeaderSettings = ({ navigation, route }: NavProps) => {
    const theme = useAppSelector(state => state.app_theme);
    const user_data = useAppSelector(state => state.user_data);

    return (
        <View style={{
            // flexDirection: 'row',
            alignItems: 'center',
            justifyContent: "center",
            // height: 60,
            // marginHorizontal: 15,
            // backgroundColor: 'green'
        }}>
            {/* <TouchableOpacity onPress={() => navigation.goBack()} style={{
                width: 50,
                height: 50,
                alignItems: 'center',
                justifyContent: 'center',
                marginHorizontal: 5,
                backgroundColor: theme.colors.border,
                borderRadius: 50
            }}>
                <IconApp pack='FI' name={Platform.OS === 'android' ? "arrow-left" : "chevron-left"} size={20} color={theme.colors.text} />
            </TouchableOpacity>

            <TextBigYambi text={strings.account_settings} /> */}

            <TouchableOpacity onPress={() => navigation.navigate('EditProfile', { user: user_data })} style={{
                width: 30,
                height: 30,
                alignItems: 'flex-end',
                justifyContent: 'center',
                // marginHorizontal: 5,
                borderRadius: 50
            }}>
                <IconApp pack='FI' name="edit" size={20} color={theme.colors.text_design1} />
            </TouchableOpacity>

            {/* <TouchableOpacity style={{
                height: 30,
                width: 30,
                alignItems: 'center',
                justifyContent: 'center',
                marginHorizontal: 5
            }}>
                <Feather name="search" size={20} color={theme.colors.text_design1} />
            </TouchableOpacity> */}

            {/* <TouchableOpacity style={{
                height: 30,
                width: 30,
                // backgroundColor:'red',
                alignItems: app_description.home_user_image_position === 'left' ? 'center' : 'flex-end',
                justifyContent: 'center',
                marginLeft: 5
            }}>
                <Feather name="camera" size={20} color={theme.colors.text_design1} />
            </TouchableOpacity> */}

            {/* {app_description.home_user_image_position === 'right' ?
                <TouchableOpacity onPress={() => navigation.navigate('Themes' as never)}>
                    <Animated.View
                        style={{
                            justifyContent: 'center',
                            alignContent: 'center',
                            alignItems: 'center',
                            paddingLeft: 15,
                        }}>
                        <Animated.Image
                            source={require('./../../assets/profile_blackkk.jpg')}
                            style={{ width: app_description.home_user_image_size, height: app_description.home_user_image_size, borderRadius: 50, borderWidth: 1, borderColor: theme.colors.border }}
                        />
                    </Animated.View>
                </TouchableOpacity> : null} */}
        </View>
    )
}

export default HeaderSettings;