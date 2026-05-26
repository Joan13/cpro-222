import { Pressable } from 'react-native';
import { } from 'react';
import Animated from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../store/app/hooks';

const HeaderTitleChat = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const border_color = useAppSelector(state => state.app_theme.colors.border);
  // const current_user = useAppSelector(state=>state.current_user);
  const user_data = useAppSelector(state => state.user_data);

  return (
    <Pressable onPress={() => navigation.navigate('Themes' as never)}>
      <Animated.View
        style={{
          justifyContent: 'center',
          alignContent: 'center',
          alignItems: 'center',
          marginRight: 20,
        }}>
        {/* <Text numberOfLines={1}>{current_user.user_names}</Text> */}
      </Animated.View>
    </Pressable>
  )
}

export default HeaderTitleChat;
