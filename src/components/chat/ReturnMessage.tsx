import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store/app/hooks';
import { useCallback, useEffect, memo } from 'react';
import { useObject, useQuery, useRealm } from '@realm/react';
import { UserChats, UsersMessages } from '../../store/database/Models';
import { TMessage } from '../../types/types';
import Animated from 'react-native-reanimated';

const MessageText = (token: string) => {
    const app_theme = useAppSelector(state => state.app_theme);
    // const current_user = useAppSelector(state => state.current_user);
    // const user_data = useAppSelector(state => state.user_data);
    const dispatch = useAppDispatch();
    const realm = useRealm();

    // const messages = useQuery(
    //     UsersMessages, msgs => {
    //         return msgs.filtered('receiver == $0 || sender == $1', current_user.phone_number, current_user.phone_number)
    //             .sorted('createdAt', true);
    //     }, []);

    const message = useObject(UsersMessages, token);

    // useEffect(()=> {
    //     console.log(chat_exists);
    // },[]);

    return (
        <Text>{message?.main_text_message}</Text>
    )
};

// export const ResponseToMessageText = (token: string) => {
//     const app_theme = useAppSelector(state => state.app_theme);
//     // const current_user = useAppSelector(state => state.current_user);
//     // const user_data = useAppSelector(state => state.user_data);
//     const app_description = useAppSelector(state=>state.persisted_app.app_description);
//     const dispatch = useAppDispatch();
//     const realm = useRealm();

//     // const messages = useQuery(
//     //     UsersMessages, msgs => {
//     //         return msgs.filtered('receiver == $0 || sender == $1', current_user.phone_number, current_user.phone_number)
//     //             .sorted('createdAt', true);
//     //     }, []);

//     const message = useObject(UsersMessages, token);

//     // useEffect(()=> {
//     //     console.log(chat_exists);
//     // },[]);

//     // return (
//     //     <Text style={{
//     //         color: app_theme.colors.text,
//     //       fontSize:app_description.small_general_font_size,
//     //       fontWeight: app_description.small_general_font_weight as any
//     //     }}>{message?.main_text_message}</Text>
//     // )
// }

export default memo(MessageText);
