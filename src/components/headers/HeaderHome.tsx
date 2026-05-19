import { View, Text, TouchableOpacity } from 'react-native';
import { useEffect } from 'react';
import Animated from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector } from '../../store/app/hooks';
import FastImage from 'react-native-fast-image';
import HeaderRightHome from './HeaderRightHome';
import { remote_host, remote_host_server, media_url } from '../../../GlobalVariables';
import axios from 'axios';
const packagee = './.././../../package.json';

const HeaderHome = () => {
  const navigation = useNavigation();
  const border_color = useAppSelector(state => state.app_theme.colors.border);
  const app_description = useAppSelector(state => state.persisted_app.app_description);
  const user_data = useAppSelector(state => state.user_data);
  const theme = useAppSelector(state => state.app_theme);
  const title = useAppSelector(state => state.app.title);

    //    useEffect(() => {
    //       let cancelled = false;
    //       axios.post(remote_host + "/yambi/API/get_app_data")
    //            .then(res => {
    //                 if (res.data?.success === "1") {
    //                      const remoteVersion: string | undefined = res.data?.app_data?.app_version_code;
    //                      if (remoteVersion && remoteVersion !== packagee.version) {
    //                           navigation.replace('UpdateYambi');
    //                      }
    //                 }
    //            })
    //            .catch(() => { })
    //            .finally(() => { if (!cancelled) setChecking(false); });

    //       return () => { cancelled = true; }
    //  }, [navigation]);

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      // paddingHorizontal: 15,
      // height: 60,
      backgroundColor: theme.colors.design_tip1,
      borderBottomWidth: 1,
      borderColor: theme.colors.border
    }}>
      {app_description.home_user_image_position === 'left' ?
        <TouchableOpacity onPress={() => navigation.navigate('SettingsYambi' as never)}>
          <Animated.View
            // sharedTransitionTag='homeImageViewAnimated'
            style={{
              justifyContent: 'center',
              alignContent: 'center',
              alignItems: 'center',
              paddingRight: 15,
              // alignItems: app_description.home_user_image_position === 'left' ? 'center' :'flex-end',
            }}>
            {user_data.user_profile !== "" ?
              <FastImage
                style={{
                  width: app_description.home_user_image_size,
                  height: app_description.home_user_image_size,
                  borderRadius: 150,
                  borderColor: theme.colors.border,
                  borderWidth: 1
                }}
                resizeMode={FastImage.resizeMode.contain}
                source={{
                  priority: FastImage.priority.high,
                  cache: 'immutable',
                  uri: media_url + "/profile_pictures/" + user_data.user_profile
                }} />
              :
              <Animated.Image
                // sharedTransitionTag='homeImageAnimated'
                source={require('./../../assets/profile_black.jpg')}
                style={{
                  width: app_description.home_user_image_size,
                  height: app_description.home_user_image_size,
                  borderRadius: 50, borderWidth: 1, borderColor: border_color
                }}
              />}
          </Animated.View>
        </TouchableOpacity>
        : null}

      {/* <Text style={{
        color: theme.colors.text_design1,
        fontSize: app_description.home_title_font_size,
        fontWeight: app_description.home_title_font_weight as any,
        flex: 1
      }}>{title}</Text> */}

      {/* <HeaderRightHome /> */}
    </View>
  )
}

{/* <FastImage
              style={{
                width: app_description.home_user_image_size, 
                height: app_description.home_user_image_size,
                   borderRadius: 150,
                   borderColor: theme.colors.border,
                   borderWidth: 1
              }}
              resizeMode={FastImage.resizeMode.contain}
              source={{
                   priority: FastImage.priority.high,
                   cache: 'immutable',
                   uri: media_url + "/profile_pictures/" + user_data.user_profile
              }} /> */}

export default HeaderHome;
