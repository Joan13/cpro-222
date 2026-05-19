import { View, ScrollView, } from 'react-native';
import { useAppSelector } from '../../store/app/hooks';
import React, { useEffect } from 'react';
import { NavProps } from '../../types/types';
import { strings } from '../../lang/lang';
import { YambiText } from '../app/Text';
import StatusBarYambi from '../app/StatusBar';

const AllMessages = ({ navigation, route }: NavProps) => {
    const app_theme = useAppSelector(state => state.app_theme);
    const { messages } = route.params;
    // const current_user = useAppSelector(state => state.current_user);
    const user_data = useAppSelector(state => state.user_data);
    // const app_description = useAppSelector(state => state.persisted_app.app_description);
    // const contacts = useAppSelector(state => state.contacts);
    // const lang = useAppSelector(state => state.persisted_app.langApp);
    // const [stickyDate, setStickyDate] = useState<string>("");
    // const dispatch = useAppDispatch();
    // const [mm, setMm] = useState([]);
    // const realm = useRealm();

    useEffect(() => {
        navigation.setOptions({ title: strings.all_messages + " (" + messages.length + ")" })
    }, []);

    return (
        <View style={{
            flex: 1,
            backgroundColor: app_theme.colors.background,
            borderColor: app_theme.colors.border,
            borderTopWidth: 1,
        }}>

            <StatusBarYambi />

            <ScrollView style={{ paddingHorizontal: 15 }}>
                <YambiText text={strings.text_messages} size="normal" color="default" bold style={{ marginTop: 15 }} />

                <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 15 }}>
                    <View style={{ flex: 1 }}>
                        <YambiText text={strings.all_messages} size="normal" color="default" />
                        <YambiText text={strings.messages_received_and_sent} size="normal" color="gray" />
                    </View>
                    <YambiText text={messages.filter(element => element.message_type === 0).length.toString()} size="normal" color="default" />
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 15 }}>
                    <View style={{ flex: 1 }}>
                        <YambiText text={strings.sent_messages} size="normal" color="default" />
                        <YambiText text={strings.only_sent_messages} size="normal" color="gray" />
                    </View>
                    <YambiText text={messages.filter(element => (element.sender === user_data.phone_number) && (element.message_type === 0) && (element.flag === 0)).length.toString()} size="normal" color="default" />
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 15 }}>
                    <View style={{ flex: 1 }}>
                        <YambiText text={strings.received_messages} size="normal" color="default" />
                        <YambiText text={strings.only_received_messages} size="normal" color="gray" />
                    </View>
                    <YambiText text={messages.filter(element => (element.receiver === user_data.phone_number) && (element.message_type === 0) && (element.flag === 0)).length.toString()} size="normal" color="default" />
                </View>

                {/* <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 15 }}>
                    <View style={{ flex: 1 }}>
                        <TextNormalYambi text={strings.message_deleted} />
                        <TextNormalYambiGray text={strings.only_deleted_messages} />
                    </View>
                    <TextNormalYambi text={messages.filter(element => (element.flag === 1 || element.flag === 2) && (element.message_type === 0)).length.toString()} />
                </View> */}

                <YambiText text={strings.media} size="normal" color="default" bold />
                <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 15 }}>
                    <View style={{ flex: 1 }}>
                        <YambiText text={strings.all_messages} size="normal" color="default" />
                        <YambiText text={strings.messages_received_and_sent} size="normal" color="gray" />
                    </View>
                    <YambiText text={messages.filter(element => (element.message_type === 1 || element.message_type === 2) && (element.flag === 0)).length.toString()} size="normal" color="default" />
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 15 }}>
                    <View style={{ flex: 1 }}>
                        <YambiText text={strings.sent_messages} size="normal" color="default" />
                        <YambiText text={strings.only_sent_messages} size="normal" color="gray" />
                    </View>
                    <YambiText text={messages.filter(element => (element.sender === user_data.phone_number) && (element.message_type === 1 || element.message_type === 2) && (element.flag === 0)).length.toString()} size="normal" color="default" />
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 15 }}>
                    <View style={{ flex: 1 }}>
                        <YambiText text={strings.received_messages} size="normal" color="default" />
                        <YambiText text={strings.only_received_messages} size="normal" color="gray" />
                    </View>
                    <YambiText text={messages.filter(element => (element.receiver === user_data.phone_number) && (element.message_type === 1 || element.message_type === 2) && (element.flag === 0)).length.toString()} size="normal" color="default" />
                </View>

                {/* <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 15 }}>
                    <View style={{ flex: 1 }}>
                        <TextNormalYambi text={strings.message_deleted} />
                        <TextNormalYambiGray text={strings.only_deleted_messages} />
                    </View>
                    <TextNormalYambi text={messages.filter(element => (element.flag === 1 || element.flag === 2) && (element.message_type === 1 || element.message_type === 2)).length.toString()} />
                </View> */}
            </ScrollView>
        </View>
    )
}

export default AllMessages;
