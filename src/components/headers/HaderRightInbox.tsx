import { View, Pressable } from "react-native"
import { useAppSelector } from "../../store/app/hooks";
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Feather from 'react-native-vector-icons/Feather';

const HeaderRightInbox = () => {
    const theme = useAppSelector(state => state.app_theme);
    return (
        <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            {/* <View style={{
                width: 30,
                alignItems: 'center',
                justifyContent: 'center',
                marginHorizontal: 5
            }}>
                <ActivityIndicator size={20} color={theme.colors.text_design1} />
            </View> */}

            <Pressable style={{
                height: 30,
                width: 30,
                alignItems: 'center',
                justifyContent: 'center',
                marginHorizontal: 5
            }}>
                <Feather name="search" size={20} color={theme.colors.text_design1} />
            </Pressable>

            <Pressable style={{
                height: 30,
                width: 30,
                alignItems: 'flex-end',
                justifyContent: 'center',
                marginLeft: 5
            }}>
                <Feather name="camera" size={20} color={theme.colors.text_design1} />
            </Pressable>
        </View>
    )
}

export default HeaderRightInbox;
