import { useEffect, useState, useRef } from 'react';
import { View, ScrollView, Pressable, TextInput, Platform } from 'react-native';
import Animated, { BounceIn, FadeInUp } from 'react-native-reanimated';
import { strings } from '../../lang/lang';
import { useAppDispatch, useAppSelector } from '../../store/app/hooks';
import StatusBarYambi from '../../components/app/StatusBar';
import { TextNormalYambi, TextNormalYambiGray, TextSmallYambiGray } from '../../components/app/Text';
import { IconApp } from '../../components/app/IconApp';
import SwitchApp from '../../components/app/SwitchApp';
import { setPasswordExpenses, setRequirePasswordExpenses, setEnableExpenseReminderNotifications } from '../../store/reducers/persistedAppSlice';
import ModalApp from '../../components/app/ModalApp';
import { setShowModalApp, setExpensesOpened } from '../../store/reducers/appSlice';

const CustomizeExpenses = () => {
    const theme = useAppSelector(state => state.app_theme);
    const dispatch = useAppDispatch();
    const app_description = useAppSelector(state => state.persisted_app.app_description);
    const [expenses_password, setExpenses_password] = useState<string>("");
    const [password_expenses_enabled, setPassword_expenses_enabled] = useState<boolean>(false);
    const [showEnterCurrentPassword, setShowEnterCurrentPassword] = useState<boolean>(false);
    const [flag_pass, setFlag_pass] = useState<number>(0);
    const [cp, setCp] = useState<string>("");
    const [passwordChangeable, setPasswordChangeable] = useState<boolean>(false);
    const [passwordVisible, setPasswordVisible] = useState<boolean>(true);
    const passwordModalInputRef = useRef<TextInput>(null);
    const passwordSetupInputRef = useRef<TextInput>(null);
    const [expenseReminderEnabled, setExpenseReminderEnabled] = useState<boolean>(app_description.enable_expense_reminder_notifications ?? true);

    const SetValuePassword = () => {
        const newEnabledState = !password_expenses_enabled;
        setPassword_expenses_enabled(newEnabledState);
        dispatch(setRequirePasswordExpenses(newEnabledState));

        // If disabling password, clear the password and reset expenses_opened state
        if (!newEnabledState) {
            dispatch(setPasswordExpenses(""));
            setExpenses_password("");
            dispatch(setExpensesOpened(false));
        }
    }

    const Okok = () => {
        // If password exists and is valid (6 digits), require verification before toggling
        if (app_description.password_expenses && app_description.password_expenses.length === 6) {
            setFlag_pass(0);
            setShowEnterCurrentPassword(true);
            dispatch(setShowModalApp(true));
            setCp("");
        } else {
            // No valid password exists
            const newEnabledState = !password_expenses_enabled;
            setPassword_expenses_enabled(newEnabledState);

            // Only reveal the input area; do NOT dispatch setRequirePasswordExpenses(true)
            // until a valid 6-digit password is actually committed via SetPP.
            // If disabling, clear everything.
            if (!newEnabledState) {
                dispatch(setRequirePasswordExpenses(false));
                dispatch(setPasswordExpenses(""));
                setExpenses_password("");
                dispatch(setExpensesOpened(false));
            }
        }
    }

    const SetPP = (pp: string) => {
        // Only allow numeric characters
        const numericOnly = pp.replace(/[^0-9]/g, '');

        // If password is not changeable yet, check if we need to verify current password
        if (!passwordChangeable) {
            // If there's an existing password, require verification before allowing change
            if (app_description.password_expenses && app_description.password_expenses.length === 6) {
                setFlag_pass(1);
                setShowEnterCurrentPassword(true);
                dispatch(setShowModalApp(true));
                setCp("");
            } else {
                // No existing password, allow setting new password directly
                setPasswordChangeable(true);
                setExpenses_password(numericOnly);
                // Only persist to Redux when exactly 6 digits are entered
                if (numericOnly.length === 6) {
                    dispatch(setPasswordExpenses(numericOnly));
                    dispatch(setRequirePasswordExpenses(true));
                }
            }
        } else {
            // Password changeable - update local state while typing
            setExpenses_password(numericOnly);
            // Only persist to Redux when exactly 6 digits are entered
            if (numericOnly.length === 6) {
                dispatch(setPasswordExpenses(numericOnly));
                dispatch(setRequirePasswordExpenses(true));
            } else {
                // If user backspaces below 6 digits, clear the persisted password
                // so partial passwords are never stored
                if (app_description.password_expenses && app_description.password_expenses.length === 6) {
                    dispatch(setPasswordExpenses(""));
                    dispatch(setRequirePasswordExpenses(false));
                }
            }
        }
    }

    const SETCP = (cpp: string) => {
        setCp(cpp);

        if (flag_pass === 0) {
            if (cpp.length === 6 && cpp === app_description.password_expenses) {
                setShowEnterCurrentPassword(false);
                dispatch(setShowModalApp(false));
                setCp("");
                SetValuePassword();
            }
        }

        if (flag_pass === 1) {
            if (cpp.length === 6 && cpp === app_description.password_expenses) {
                setShowEnterCurrentPassword(false);
                dispatch(setShowModalApp(false));
                setCp("");
                setPasswordChangeable(true);
                // Clear the input field so user can type new password
                setExpenses_password("");
            }
        }

        if (flag_pass === 2) {
            if (cpp.length === 6 && cpp === app_description.password_expenses) {
                setShowEnterCurrentPassword(false);
                dispatch(setShowModalApp(false));
                setCp("");
                setPasswordVisible(false);
            }
        }
    }

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (app_description.require_password_expenses) {
                if (app_description.password_expenses && app_description.password_expenses.length === 6) {
                    setPassword_expenses_enabled(true);
                    setExpenses_password(app_description.password_expenses);
                }
            }

            if (app_description.password_expenses) {
                setExpenses_password(app_description.password_expenses);
            }

            setExpenseReminderEnabled(app_description.enable_expense_reminder_notifications ?? true);
        }, 300);

        return () => clearTimeout(timeout);
    }, []);

    // Focus password input when modal opens (using 400ms delay to let the native Modal transition finish)
    useEffect(() => {
        if (showEnterCurrentPassword) {
            setTimeout(() => {
                passwordModalInputRef.current?.focus();
            }, 400);
        } else {
            setCp("");
        }
    }, [showEnterCurrentPassword]);

    return (
        <ScrollView style={{ backgroundColor: theme.colors.background, flex: 1, borderColor: theme.colors.border, borderTopWidth: 1 }}>
            <StatusBarYambi />

            {showEnterCurrentPassword ?
                <ModalApp onClose={() => {
                    dispatch(setShowModalApp(false));
                    setShowEnterCurrentPassword(false);
                    setCp("");
                    setFlag_pass(0);
                }} singleButton title={strings.enter_password}>
                    <View style={{
                        alignItems: 'center',
                        paddingVertical: 10,
                    }}>
                        {/* Icon */}
                        <Animated.View
                            entering={BounceIn}
                            style={{
                                width: 60,
                                height: 60,
                                borderRadius: 30,
                                backgroundColor: theme.colors.high_color + '15',
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginBottom: 20,
                            }}>
                            <IconApp name="lock" pack='FI' size={30} color={theme.colors.high_color} />
                        </Animated.View>

                        <TextNormalYambiGray
                            text={strings.current_expenses_tab_password}
                            styles={{
                                textAlign: 'center',
                                marginBottom: 30
                            }}
                        />

                        {/* Modern OTP Input */}
                        <View style={{
                            width: '100%',
                            marginBottom: 15,
                        }}>
                            <Pressable
                                onPress={() => passwordModalInputRef.current?.focus()}
                                style={{
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    marginBottom: 15,
                                }}
                            >
                                {[0, 1, 2, 3, 4, 5].map((index) => (
                                    <Animated.View
                                        key={index}
                                        entering={FadeInUp.delay(100 + index * 50)}
                                        style={{
                                            width: 35,
                                            height: 45,
                                            borderRadius: 10,
                                            borderWidth: 2,
                                            borderColor: cp.length === index
                                                ? theme.colors.high_color
                                                : cp.length > index
                                                    ? theme.colors.success
                                                    : theme.colors.border,
                                            backgroundColor: cp.length > index
                                                ? theme.colors.success + '10'
                                                : theme.colors.background,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                        }}>
                                        {cp[index] && (
                                            <Animated.View entering={BounceIn}>
                                                <IconApp
                                                    name="circle"
                                                    pack='FA'
                                                    size={10}
                                                    color={cp.length > index ? theme.colors.success : theme.colors.high_color}
                                                />
                                            </Animated.View>
                                        )}
                                    </Animated.View>
                                ))}
                            </Pressable>

                            {/* Hidden TextInput — positioned off-screen + caretHidden to fix keyboard issues */}
                            <TextInput
                                ref={passwordModalInputRef}
                                style={{
                                    position: 'absolute',
                                    left: -9999,
                                    width: 100,
                                    height: 40,
                                }}
                                value={cp}
                                onChangeText={SETCP}
                                keyboardType="number-pad"
                                maxLength={6}
                                secureTextEntry={false}
                                caretHidden={true}
                            />
                        </View>

                        {/* Helper Text */}
                        {cp.length > 0 && (
                            <TextSmallYambiGray
                                text={`${cp.length}/6`}
                                styles={{
                                    textAlign: 'center',
                                    marginTop: 5
                                }}
                            />
                        )}
                    </View>
                </ModalApp> : null}

            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 15,
                marginVertical: 15
            }}>
                <IconApp name="bell" pack='FI' size={20} color={theme.colors.gray} styles={{ marginRight: 20 }} />
                <TextNormalYambi styles={{ flex: 1, marginRight: 10 }} text={strings.enable_expense_reminder_notifications} />
                <View>
                    <SwitchApp value={expenseReminderEnabled} onPress={() => {
                        const newValue = !expenseReminderEnabled;
                        setExpenseReminderEnabled(newValue);
                        dispatch(setEnableExpenseReminderNotifications(newValue));
                    }} />
                </View>
            </View>

            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 15,
                marginVertical: 15,
                borderTopWidth: 1,
                borderTopColor: theme.colors.border,
                paddingTop: 15
            }}>
                <IconApp name="lock" pack='FI' size={20} color={theme.colors.gray} styles={{ marginRight: 20 }} />
                <TextNormalYambi styles={{ flex: 1, marginRight: 10 }} text={strings.require_password_expenses} />
                <View>
                    <SwitchApp value={password_expenses_enabled} onPress={Okok} />
                </View>
            </View>

            {password_expenses_enabled ?
                <Animated.View entering={FadeInUp}
                    style={{
                        paddingHorizontal: 15,
                    }}>
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginVertical: 15
                    }}>
                        <IconApp name="close-circle-outline" pack='MC' size={20} color={theme.colors.background} styles={{ marginRight: 20 }} />
                        <TextNormalYambi styles={{ flex: 1 }} text={strings.set_expenses_password + " (6 " + strings.numbers.toLowerCase() + ")"} />
                    </View>

                    {/* Modern OTP-Style Password Input */}
                    <View style={{
                        width: '100%',
                        marginBottom: 20,
                        marginLeft: 40,
                    }}>
                        <Pressable
                            onPress={() => passwordSetupInputRef.current?.focus()}
                            style={{
                                flexDirection: 'row',
                                marginBottom: 15,
                            }}
                        >
                            {[0, 1, 2, 3, 4, 5].map((index) => (
                                <Animated.View
                                    key={index}
                                    entering={FadeInUp.delay(index * 50)}
                                    style={{
                                        width: 30,
                                        height: 40,
                                        marginRight: 10,
                                        borderRadius: 8,
                                        borderWidth: 2,
                                        borderColor: expenses_password.length === index
                                            ? theme.colors.high_color
                                            : expenses_password.length > index
                                                ? theme.colors.success
                                                : theme.colors.border,
                                        backgroundColor: expenses_password.length > index
                                            ? theme.colors.success + '10'
                                            : theme.colors.border,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                    }}>
                                    {expenses_password[index] && (
                                        <Animated.View entering={BounceIn}>
                                            {passwordVisible ? (
                                                <IconApp
                                                    name="circle"
                                                    pack='FA'
                                                    size={8}
                                                    color={expenses_password.length > index ? theme.colors.success : theme.colors.high_color}
                                                />
                                            ) : (
                                                <TextNormalYambi
                                                    text={expenses_password[index]}
                                                    styles={{
                                                        fontSize: 20,
                                                        fontWeight: 'bold',
                                                        color: expenses_password.length > index ? theme.colors.success : theme.colors.high_color
                                                    }}
                                                />
                                            )}
                                        </Animated.View>
                                    )}
                                </Animated.View>
                            ))}
                        </Pressable>

                        {/* Hidden TextInput — positioned off-screen + caretHidden to fix keyboard issues */}
                        <TextInput
                            ref={passwordSetupInputRef}
                            style={{
                                position: 'absolute',
                                left: -9999,
                                width: 100,
                                height: 40,
                            }}
                            value={expenses_password}
                            onChangeText={SetPP}
                            keyboardType="number-pad"
                            maxLength={6}
                            secureTextEntry={false}
                            caretHidden={true}
                        />

                        {/* Action Buttons Row */}
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginTop: 10,
                        }}>
                            {/* Success Indicator */}
                            {expenses_password.length === 6 && (
                                <Animated.View entering={BounceIn} style={{ marginRight: 15 }}>
                                    <IconApp name="check-circle" pack='FA' size={24} color={theme.colors.success} />
                                </Animated.View>
                            )}

                            {/* Password Length Indicator */}
                            <TextSmallYambiGray
                                text={`${expenses_password.length}/6`}
                                styles={{
                                    marginRight: 15,
                                    fontSize: 12
                                }}
                            />

                            {/* Visibility Toggle */}
                            <Pressable onPress={() => {
                                if (passwordVisible) {
                                    // Show password - no verification needed
                                    setPasswordVisible(false);
                                } else {
                                    // Hide password - require verification
                                    setFlag_pass(2);
                                    setShowEnterCurrentPassword(true);
                                    dispatch(setShowModalApp(true));
                                    setCp("");
                                }
                            }} style={{
                                width: 40,
                                height: 40,
                                justifyContent: 'center',
                                alignItems: 'center',
                                borderRadius: 20,
                                backgroundColor: theme.colors.border,
                            }}>
                                <IconApp name={passwordVisible ? "eye-off" : "eye"} pack='FI' size={18} color={theme.colors.gray} />
                            </Pressable>
                        </View>
                    </View>
                </Animated.View> : null}

            <TextSmallYambiGray text={strings.this_affect_local} styles={{ paddingVertical: 15, borderColor: theme.colors.border, borderTopWidth: 1, paddingHorizontal: 20, marginBottom: 50 }} />
        </ScrollView>
    )
}

export default CustomizeExpenses;
