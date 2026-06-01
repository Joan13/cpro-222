import { View, Pressable, Platform } from "react-native"
import { useAppSelector } from "../../store/app/hooks";
import { IconApp } from "../app/IconApp";
import { NavProps } from "../../types/types";
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import { YambiText } from "../app/Text";
import { strings } from "../../lang/lang";
import { Text } from "react-native";

const HeaderSettings = ({ navigation }: {navigation:any}) => {
    const theme = useAppSelector(state => state.app_theme);
    const user_data = useAppSelector(state => state.user_data);
    const insets = useSafeAreaInsets();

    return (
        <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: "center",
            paddingTop: insets.top,
    height: insets.top + 40,
    paddingRight: 12,
            // height: 60,
            // marginHorizontal: 15,
            backgroundColor: theme.colors.design_tip1
        }}>
            <Pressable onPress={() => navigation.goBack()} style={{
                width: 44,
                height: 44,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                // marginHorizontal: 5,
                // backgroundColor: theme.colors.border,
            }}>
                <IconApp pack='FI' name={Platform.OS === 'android' ? "arrow-left" : "chevron-left"} size={25} color={theme.colors.text_design1} />
            </Pressable>

            {/* <YambiText text={strings.account_settings} style={{flex:1, textAlign:'center'}}  /> */}
            <Text style={{
                color:theme.colors.text_design1,
                fontSize: 20,
                flex:1,
                textAlign:'center',
                // fontWeight: 'bold'
            }}>
{strings.account_settings}
            </Text>

            <Pressable onPress={() => navigation.navigate('EditProfile', { user: user_data })} style={{
                width: 30,
                height: 30,
                alignItems: 'center',
                justifyContent: 'center',
                // marginHorizontal: 5,
                borderRadius: 50
            }}>
                <IconApp pack='FI' name="edit" size={20} color={theme.colors.text_design1} />
            </Pressable>

            {/* <Pressable style={{
                height: 30,
                width: 30,
                alignItems: 'center',
                justifyContent: 'center',
                marginHorizontal: 5
            }}>
                <Feather name="search" size={20} color={theme.colors.text_design1} />
            </Pressable> */}

            {/* <Pressable style={{
                height: 30,
                width: 30,
                // backgroundColor:'red',
                alignItems: app_description.home_user_image_position === 'left' ? 'center' : 'flex-end',
                justifyContent: 'center',
                marginLeft: 5
            }}>
                <Feather name="camera" size={20} color={theme.colors.text_design1} />
            </Pressable> */}

            {/* {app_description.home_user_image_position === 'right' ?
                <Pressable onPress={() => navigation.navigate('Themes' as never)}>
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
                </Pressable> : null} */}
        </View>
    )
}

export default HeaderSettings;