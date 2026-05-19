import { View, Image, SafeAreaView, TouchableOpacity, Linking, ScrollView } from 'react-native';
import { strings } from '../../lang/lang';
import { useAppSelector } from '../../store/app/hooks';
import StatusBarYambi from '../../components/app/StatusBar';
import { TextNormalYambi, TextNormalYambiHighColor, TextSmallYambiGray } from '../../components/app/Text';
import { NavProps } from '../../types/types';
import { useEffect } from 'react';
import ButtonNormal from '../../components/app/ButtonNormal';

const ContactUs = ({ navigation, route }: NavProps) => {

     const theme = useAppSelector(state => state.app_theme);
     const { flag } = route.params;
     // const dispatch = useAppDispatch();
     // const user_data = useAppSelector(state => state.user_data);
     // const app_description = useAppSelector(state => state.persisted_app.app_description);
     // const [profile, setProfile] = useState<string>();
     // const [loading_profile, setLoading_profile] = useState<boolean>(false);

     useEffect(() => {

          if (flag) {
               if (flag === 1) {
                    navigation.setOptions({ title: strings.renew_my_subscription });
               }
          }
     }, []);

     return (
          <SafeAreaView style={{ backgroundColor: theme.colors.background, flex: 1, borderColor: theme.colors.border, borderTopWidth: 1 }}>

               <StatusBarYambi />

               <ScrollView style={{ padding: 15 }}>
                    <TextNormalYambiHighColor text={strings.subscription_renewal_price_message} />

                    <ButtonNormal title={strings.go_whatsapp} loadEnabled={false} onPress={() =>
                         Linking.openURL("https://wa.me/+243837122188")} normal={true} styles={{ marginBottom: 10, marginTop: 25 }} />

                    <ButtonNormal title={strings.email_us} loadEnabled={false} onPress={() => navigation.navigate("MessageUs")} normal={true} styles={{ marginVertical: 10 }} />

                    <ButtonNormal title={strings.normal_message} loadEnabled={false} onPress={() =>
                         Linking.openURL("sms:+243837122188")} normal={true} styles={{ marginVertical: 10 }} />

                    <ButtonNormal title={strings.call_us} loadEnabled={false} onPress={() =>
                         Linking.canOpenURL("tel:+243837122188")} normal={true} styles={{ marginVertical: 10 }} />
               </ScrollView>

          </SafeAreaView>
     )
}
// }

export default ContactUs;
