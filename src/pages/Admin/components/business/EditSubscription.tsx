import React, { useState } from 'react';
import { View, ScrollView, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import axios from 'axios';
import moment from 'moment';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAppDispatch, useAppSelector } from '../../../../store/app/hooks';
import { setShowModalApp } from '../../../../store/reducers/appSlice';
import { remote_host } from '../../../../../GlobalVariables';
import { YambiText } from '../../../../components/app/Text';
import { IconApp } from '../../../../components/app/IconApp';
import { strings } from '../../../../lang/lang';
import ButtonNormal from '../../../../components/app/ButtonNormal';
import ModalApp from '../../../../components/app/ModalApp';

type RootStackParamList = {
    AdminEditSubscription: { subscription: any };
};

type Props = NativeStackScreenProps<RootStackParamList, 'AdminEditSubscription'>;

const EditSubscription = ({ route, navigation }: Props) => {
    const { subscription } = route.params;
    const theme = useAppSelector(state => state.app_theme.colors);
    const dispatch = useAppDispatch();

    const [amount, setAmount] = useState(String(subscription.amount ?? '0'));
    const [plan, setPlan] = useState<number>(subscription.subscription_plan ?? 0);
    const [status, setStatus] = useState<number>(subscription.payment_status ?? 0);
    const [subType, setSubType] = useState<number>(subscription.subscription_type ?? 1);
    
    // Dates
    const [startDateObj, setStartDateObj] = useState<Date>(
        subscription.subscription_start_date ? new Date(subscription.subscription_start_date) : new Date()
    );
    const [endDateObj, setEndDateObj] = useState<Date>(
        subscription.subscription_end_date ? new Date(subscription.subscription_end_date) : new Date()
    );
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);

    const [saving, setSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleSave = async () => {
        if (Number.isNaN(parseFloat(amount))) {
            setErrorMsg(strings.invalid_amount || 'Amount must be a valid number');
            setShowError(true);
            dispatch(setShowModalApp(true));
            return;
        }

        setSaving(true);
        try {
            const updates = {
                subscription_plan: plan,
                amount: parseFloat(amount),
                currency: 'usd',
                subscription_start_date: startDateObj.toISOString(),
                subscription_end_date: endDateObj.toISOString(),
                subscription_type: subType,
                payment_status: status,
            };

            const res = await axios.post(`${remote_host}/yambi/API/edit_subscription`, {
                subscription_id: subscription._id,
                updates,
            });

            if (res.data?.success === '1') {
                setShowSuccess(true);
                dispatch(setShowModalApp(true));
                setTimeout(() => {
                    dispatch(setShowModalApp(false));
                    navigation.goBack();
                }, 1500);
            } else {
                setErrorMsg(res.data?.error || strings.connection_failed);
                setShowError(true);
                dispatch(setShowModalApp(true));
            }
        } catch (error: any) {
            console.error('Update subscription error:', error);
            setErrorMsg(error.message || strings.connection_failed);
            setShowError(true);
            dispatch(setShowModalApp(true));
        } finally {
            setSaving(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.background, borderTopWidth: 1, borderColor: theme.border }}>
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
                keyboardShouldPersistTaps="handled"
            >
                {showSuccess && (
                    <ModalApp
                        onClose={() => {
                            dispatch(setShowModalApp(false));
                            setShowSuccess(false);
                        }}
                        singleButton
                        title={strings.success || "Success"}
                    >
                        <YambiText text={(strings as any).edit_subscription_success || "Subscription updated successfully"} size="normal" color="default" />
                    </ModalApp>
                )}

                {showError && (
                    <ModalApp
                        onClose={() => {
                            dispatch(setShowModalApp(false));
                            setShowError(false);
                        }}
                        singleButton
                        title={strings.error || "Error"}
                    >
                        <YambiText text={errorMsg} size="normal" color="error" />
                    </ModalApp>
                )}

                {/* Amount Card (Currency is hardcoded to USD) */}
                <View style={{
                    backgroundColor: theme.background,
                    borderRadius: 12,
                    padding: 20,
                    marginBottom: 20,
                    borderWidth: 1,
                    borderColor: theme.border,
                }}>
                    <View>
                        <YambiText text={(strings as any).amount_usd || "Amount (USD)"} size="normal" color="gray" style={{ marginBottom: 8 }} />
                        <TextInput
                            keyboardType="numeric"
                            style={{
                                color: theme.text,
                                backgroundColor: theme.border,
                                paddingHorizontal: 15,
                                paddingVertical: 12,
                                minHeight: 48,
                                borderRadius: 8,
                                fontSize: 15,
                            }}
                            value={amount}
                            onChangeText={setAmount}
                        />
                    </View>
                </View>

                {/* Plan Selection Card */}
                <View style={{
                    backgroundColor: theme.background,
                    borderRadius: 12,
                    padding: 20,
                    marginBottom: 20,
                    borderWidth: 1,
                    borderColor: theme.border,
                }}>
                    <YambiText text={strings.subscription_plans || "Subscription Plans"} size="normal" color="gray" style={{ marginBottom: 12 }} />
                    {[
                        { id: 0, label: 'Free' },
                        { id: 1, label: 'Basic' },
                        { id: 2, label: 'Premium X' },
                        { id: 3, label: 'Ultimate' },
                    ].map(p => (
                        <Pressable
                            key={p.id}
                            onPress={() => setPlan(p.id)}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingVertical: 8,
                                marginBottom: 8,
                            }}
                        >
                            <IconApp
                                pack="IO"
                                name={plan === p.id ? 'checkmark-circle' : 'ellipse-outline'}
                                color={plan === p.id ? theme.high_color : theme.gray}
                                size={18}
                            />
                            <YambiText
                                text={p.label}
                                size="normal"
                                color={plan === p.id ? 'high' : 'default'}
                                bold={plan === p.id}
                                style={{ marginLeft: 12 }}
                            />
                        </Pressable>
                    ))}
                </View>

                {/* Payment Status Card */}
                <View style={{
                    backgroundColor: theme.background,
                    borderRadius: 12,
                    padding: 20,
                    marginBottom: 20,
                    borderWidth: 1,
                    borderColor: theme.border,
                }}>
                    <YambiText text={(strings as any).payment_status || "Payment Status"} size="normal" color="gray" style={{ marginBottom: 12 }} />
                    {[
                        { id: 0, label: (strings as any).pending_processing || 'Pending / Processing' },
                        { id: 1, label: (strings as any).completed_succeeded || 'Completed / Succeeded' },
                        { id: 2, label: strings.failed || 'Failed' },
                    ].map(st => (
                        <Pressable
                            key={st.id}
                            onPress={() => setStatus(st.id)}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingVertical: 8,
                                marginBottom: 8,
                            }}
                        >
                            <IconApp
                                pack="IO"
                                name={status === st.id ? 'checkmark-circle' : 'ellipse-outline'}
                                color={status === st.id ? theme.high_color : theme.gray}
                                size={18}
                            />
                            <YambiText
                                text={st.label}
                                size="normal"
                                color={status === st.id ? 'high' : 'default'}
                                bold={status === st.id}
                                style={{ marginLeft: 12 }}
                            />
                        </Pressable>
                    ))}
                </View>

                {/* Subscription Type Card */}
                <View style={{
                    backgroundColor: theme.background,
                    borderRadius: 12,
                    padding: 20,
                    marginBottom: 20,
                    borderWidth: 1,
                    borderColor: theme.border,
                }}>
                    <YambiText text={(strings as any).subscription_billing_type || "Subscription Billing Type"} size="normal" color="gray" style={{ marginBottom: 12 }} />
                    {[
                        { id: 0, label: (strings as any).one_time_payment || 'One-Time Payment' },
                        { id: 1, label: strings.monthly_subscription || 'Monthly Subscription' },
                    ].map(t => (
                        <Pressable
                            key={t.id}
                            onPress={() => setSubType(t.id)}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingVertical: 8,
                                marginBottom: 8,
                            }}
                        >
                            <IconApp
                                pack="IO"
                                name={subType === t.id ? 'checkmark-circle' : 'ellipse-outline'}
                                color={subType === t.id ? theme.high_color : theme.gray}
                                size={18}
                            />
                            <YambiText
                                text={t.label}
                                size="normal"
                                color={subType === t.id ? 'high' : 'default'}
                                bold={subType === t.id}
                                style={{ marginLeft: 12 }}
                            />
                        </Pressable>
                    ))}
                </View>

                {/* Start and End Date Card with DatePickers */}
                <View style={{
                    backgroundColor: theme.background,
                    borderRadius: 12,
                    padding: 20,
                    marginBottom: 20,
                    borderWidth: 1,
                    borderColor: theme.border,
                }}>
                    <View style={{ marginBottom: 16 }}>
                        <YambiText text={(strings as any).start_date || "Start Date"} size="normal" color="gray" style={{ marginBottom: 8 }} />
                        <Pressable
                            onPress={() => setShowStartDatePicker(true)}
                            style={{
                                backgroundColor: theme.border,
                                paddingHorizontal: 15,
                                paddingVertical: 12,
                                minHeight: 48,
                                borderRadius: 8,
                                justifyContent: 'center',
                            }}
                        >
                            <YambiText
                                text={moment(startDateObj).format('MMMM DD, YYYY')}
                                size="normal"
                                color="default"
                            />
                        </Pressable>
                        {showStartDatePicker && (
                            <DateTimePicker
                                value={startDateObj}
                                mode="date"
                                display="default"
                                onChange={(_event, date) => {
                                    setShowStartDatePicker(false);
                                    if (date) setStartDateObj(date);
                                }}
                            />
                        )}
                    </View>

                    <View>
                        <YambiText text={(strings as any).end_date || "End Date"} size="normal" color="gray" style={{ marginBottom: 8 }} />
                        <Pressable
                            onPress={() => setShowEndDatePicker(true)}
                            style={{
                                backgroundColor: theme.border,
                                paddingHorizontal: 15,
                                paddingVertical: 12,
                                minHeight: 48,
                                borderRadius: 8,
                                justifyContent: 'center',
                            }}
                        >
                            <YambiText
                                text={moment(endDateObj).format('MMMM DD, YYYY')}
                                size="normal"
                                color="default"
                            />
                        </Pressable>
                        {showEndDatePicker && (
                            <DateTimePicker
                                value={endDateObj}
                                mode="date"
                                display="default"
                                onChange={(_event, date) => {
                                    setShowEndDatePicker(false);
                                    if (date) setEndDateObj(date);
                                }}
                            />
                        )}
                    </View>
                </View>

                {saving ? (
                    <ActivityIndicator color={theme.high_color} size="large" style={{ marginVertical: 12 }} />
                ) : (
                    <ButtonNormal
                        title={strings.save || "Save Changes"}
                        loadEnabled={true}
                        onPress={handleSave}
                        normal={true}
                    />
                )}
            </ScrollView>
        </View>
    );
};

export default EditSubscription;
