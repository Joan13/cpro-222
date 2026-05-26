import { useMemo, useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable } from 'react-native';
import axios from 'axios';
import { strings } from '../../lang/lang';
import { remote_host } from '../../../GlobalVariables';
import { useAppDispatch, useAppSelector } from '../../store/app/hooks';
import StatusBarYambi from '../../components/app/StatusBar';
import ButtonNormal from '../../components/app/ButtonNormal';
import ModalApp from '../../components/app/ModalApp';
import { IconApp } from '../../components/app/IconApp';
import { TextNormalYambi, TextSmallYambiGray, YambiText } from '../../components/app/Text';
import { setLoadingButton, setShowModalApp } from '../../store/reducers/appSlice';
import { SafeAreaView } from 'react-native-safe-area-context';

const MessageUs = () => {
    const theme = useAppSelector(state => state.app_theme);
    const dispatch = useAppDispatch();
    const user_data = useAppSelector(state => state.user_data);
    const [message, setMessage] = useState('');
    const [email, setEmail] = useState('');
    const [reportType, setReportType] = useState<number | null>(null);
    const [showTypeModal, setShowTypeModal] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [errorDetail, setErrorDetail] = useState('');

    const reportTypes = useMemo(
        () => [
            { id: 1 as const, label: strings.report_type_suggestion },
            { id: 2 as const, label: strings.report_type_problem },
            { id: 3 as const, label: strings.report_type_abuse },
            { id: 4 as const, label: strings.report_type_fraud },
            { id: 5 as const, label: strings.report_type_other },
        ],
        [
            strings.report_type_suggestion,
            strings.report_type_problem,
            strings.report_type_abuse,
            strings.report_type_fraud,
            strings.report_type_other,
        ]
    );

    const selectedLabel =
        reportType === null ? '' : reportTypes.find(t => t.id === reportType)?.label ?? '';

    const phoneOk = (user_data.phone_number || '').trim().length > 0;

    const sendMessage = () => {
        const trimmedMessage = message.trim();
        if (!phoneOk) {
            setErrorDetail(strings.phone_required_message);
            dispatch(setShowModalApp(true));
            setShowError(true);
            return;
        }
        if (reportType === null) {
            setErrorDetail(strings.message_type_required);
            dispatch(setShowModalApp(true));
            setShowError(true);
            return;
        }
        if (!trimmedMessage) {
            setErrorDetail(strings.fields_error_validation);
            dispatch(setShowModalApp(true));
            setShowError(true);
            return;
        }

        dispatch(setLoadingButton(true));
        axios
            .post(remote_host + '/yambi/API/send_user_report', {
                phone_number: user_data.phone_number.trim(),
                email: email.trim() || undefined,
                report_type: reportType,
                message: trimmedMessage,
            })
            .then(response => {
                if (response.data?.success === '1') {
                    setEmail('');
                    setMessage('');
                    setReportType(null);
                    dispatch(setShowModalApp(true));
                    setShowSuccess(true);
                } else {
                    setErrorDetail(
                        typeof response.data?.message === 'string'
                            ? response.data.message
                            : strings.error
                    );
                    dispatch(setShowModalApp(true));
                    setShowError(true);
                }
            })
            .catch(() => {
                setErrorDetail(strings.error);
                dispatch(setShowModalApp(true));
                setShowError(true);
            })
            .finally(() => {
                dispatch(setLoadingButton(false));
            });
    };

    return (
        <View
            style={{
                backgroundColor: theme.colors.background,
                flex: 1,
                borderColor: theme.colors.border,
                borderTopWidth: 1,
            }}
        >
            <View style={{ flex: 1 }}>
                <StatusBarYambi />

                <ScrollView
                    style={{ flex: 1, backgroundColor: 'transparent', padding: 15, paddingTop: 0 }}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={{ backgroundColor: theme.colors.background, marginBottom: 15, marginTop: 25 }}>
                        <TextSmallYambiGray
                            text={strings.select_message_type}
                            styles={{ marginLeft: 2, marginBottom: 8 }}
                        />
                        <Pressable
                            onPress={() => {
                                setShowTypeModal(true);
                                dispatch(setShowModalApp(true));
                            }}
                            style={{
                                backgroundColor: theme.colors.border,
                                paddingLeft: 15,
                                minHeight: 45,
                                borderRadius: 5,
                                marginBottom: 20,
                                justifyContent: 'center',
                                paddingVertical: 12,
                            }}
                        >
                            <Text style={{ color: theme.colors.text }}>
                                {selectedLabel || strings.select_message_type}
                            </Text>
                        </Pressable>

                        <TextInput
                            placeholderTextColor="gray"
                            maxLength={120}
                            style={{
                                color: theme.colors.text,
                                backgroundColor: theme.colors.border,
                                paddingLeft: 15,
                                minHeight: 45,
                                borderRadius: 5,
                                height: 40,
                                marginBottom: 20,
                            }}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            placeholder={strings.optional_email}
                            value={email}
                            onChangeText={text => setEmail(text)}
                        />

                        {/* {phoneOk ? (
                            <TextSmallYambiGray
                                text={formatPhoneInternational(user_data)}
                                styles={{ marginLeft: 2, marginBottom: 8 }}
                            />
                        ) : (
                            <View style={{ marginLeft: 2, marginBottom: 12 }}>
                                <YambiText
                                    text={strings.phone_required_message}
                                    size="small"
                                    color="error"
                                />
                            </View>
                        )} */}

                        <TextInput
                            placeholderTextColor="gray"
                            maxLength={500}
                            multiline={true}
                            style={{
                                color: theme.colors.text,
                                backgroundColor: theme.colors.border,
                                paddingLeft: 15,
                                minHeight: 45,
                                borderRadius: 5,
                                height: 150,
                            }}
                            placeholder={strings.message}
                            value={message}
                            onChangeText={text => setMessage(text)}
                        />
                    </View>
                    <ButtonNormal
                        title={strings.send}
                        loadEnabled={true}
                        onPress={sendMessage}
                        styles={{ paddingHorizontal: 20, marginVertical: 20 }}
                        normal={true}
                    />
                </ScrollView>
            </View>

            {/* <Text style={{ textAlign: 'center', color: 'gray', marginBottom: 20, fontSize: 13 }}>
                {strings.footer}
            </Text> */}

            {showTypeModal && (
                <ModalApp
                    paddings={false}
                    onClose={() => {
                        dispatch(setShowModalApp(false));
                        setShowTypeModal(false);
                    }}
                    singleButton
                    title={strings.select_message_type}
                >
                    <ScrollView style={{ maxHeight: 400, paddingVertical: 0, paddingHorizontal: 0 }}>
                        {reportTypes.map((t, index) => (
                            <Pressable
                                key={t.id}
                                onPress={() => {
                                    setReportType(t.id);
                                    dispatch(setShowModalApp(false));
                                    setShowTypeModal(false);
                                }}
                                style={{
                                    paddingVertical: 16,
                                    paddingHorizontal: 12,
                                    borderBottomWidth: index < reportTypes.length - 1 ? 1 : 0,
                                    borderColor: theme.colors.border,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                }}
                            >
                                <IconApp
                                    pack="FI"
                                    name={reportType === t.id ? 'check-circle' : 'circle'}
                                    color={
                                        reportType === t.id ? theme.colors.high_color : theme.colors.gray
                                    }
                                    size={20}
                                    styles={{ marginRight: 12 }}
                                />
                                <TextNormalYambi text={t.label} bold={reportType === t.id} />
                            </Pressable>
                        ))}
                    </ScrollView>
                </ModalApp>
            )}

            {showSuccess && (
                <ModalApp
                    onClose={() => {
                        dispatch(setShowModalApp(false));
                        setShowSuccess(false);
                    }}
                    singleButton
                    title={strings.success}
                >
                    <TextNormalYambi text={strings.message_sent_success} />
                </ModalApp>
            )}

            {showError && (
                <ModalApp
                    onClose={() => {
                        dispatch(setShowModalApp(false));
                        setShowError(false);
                    }}
                    singleButton
                    title={strings.error}
                >
                    <TextNormalYambi text={errorDetail} />
                </ModalApp>
            )}
        </View>
    );
};

export default MessageUs;
