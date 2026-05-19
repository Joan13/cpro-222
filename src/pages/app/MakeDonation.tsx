import React, { useState } from 'react';
import { View, ScrollView, SafeAreaView, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput } from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { strings } from '../../lang/lang';
import { useAppSelector, useAppDispatch } from '../../store/app/hooks';
import StatusBarYambi from '../../components/app/StatusBar';
import { TextNormalYambi, TextNormalYambiGray, TextSmallYambi, TextSmallYambiGray, TextBigYambi, YambiText } from '../../components/app/Text';
import { remote_host } from '../../../GlobalVariables';
import { IconApp } from '../../components/app/IconApp';
import { NavProps } from '../../types/types';
import axios from 'axios';
import ModalApp from '../../components/app/ModalApp';
import { setShowModalApp } from '../../store/reducers/appSlice';
import SwitchApp from '../../components/app/SwitchApp';

const MakeDonation = ({ navigation }: NavProps) => {
    const theme = useAppSelector(state => state.app_theme);
    const user_data = useAppSelector(state => state.user_data);
    const dispatch = useAppDispatch();
    const { initPaymentSheet, presentPaymentSheet } = useStripe();
    
    const [donationType, setDonationType] = useState<number>(1); // 0 = one-time, 1 = monthly (default)
    const [amount, setAmount] = useState<number>(10); // Default amount
    const [customAmount, setCustomAmount] = useState<string>('10');
    const [useCustomAmount, setUseCustomAmount] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [initializing, setInitializing] = useState<boolean>(false);
    const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
    const [showErrorModal, setShowErrorModal] = useState<boolean>(false);
    const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>('');

    const presetAmounts = [10, 25, 50, 100, 250];

    const handleCustomAmountChange = (text: string) => {
        // Only allow numbers and decimal point
        const numericValue = text.replace(/[^0-9.]/g, '');
        setCustomAmount(numericValue);
        const numValue = parseFloat(numericValue);
        if (!isNaN(numValue) && numValue > 0) {
            setAmount(numValue);
        }
    };

    const handlePresetAmountPress = (presetAmount: number) => {
        if (!useCustomAmount) {
            setAmount(presetAmount);
        }
    };

    const initializePaymentSheet = async () => {
        try {
            setInitializing(true);
            setErrorMessage(''); // Clear any previous errors
            
            // Validate required data
            if (!user_data?.phone_number) {
                throw new Error("User phone number is required");
            }
            
            if (!amount || amount < 1) {
                throw new Error("Invalid donation amount");
            }
            
            // Create payment intent on backend
            const response = await axios.post(remote_host + '/yambi/API/make_donation', {
                phone_number: user_data.phone_number,
                amount: amount,
                currency: 'usd',
                donation_type: donationType
            }, {
                timeout: 30000, // 30 second timeout
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                }
            });

            if (response.data && response.data.success === "1" && response.data.client_secret) {
                const { error } = await initPaymentSheet({
                    merchantDisplayName: 'Yambi',
                    paymentIntentClientSecret: response.data.client_secret,
                    defaultBillingDetails: {
                        name: user_data.user_names,
                        email: user_data.user_email || undefined,
                        phone: user_data.phone_number,
                    },
                });

                if (error) {
                    throw new Error(error.message || strings.connection_failed);
                }
            } else {
                throw new Error(response.data?.message || strings.connection_failed);
            }
        } catch (error: any) {
            // Handle different types of errors
            if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
                setErrorMessage(strings.connection_failed || "Request timed out. Please check your internet connection and try again.");
            } else if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
                setErrorMessage(strings.connection_failed || "Network error. Please check your internet connection and try again.");
            } else if (error.response) {
                // Server responded with error status
                setErrorMessage(error.response.data?.message || error.response.statusText || strings.connection_failed);
            } else if (error.request) {
                // Request was made but no response received
                setErrorMessage(strings.connection_failed || "No response from server. Please check your internet connection.");
            } else {
                // Something else happened
                setErrorMessage(error.message || strings.connection_failed);
            }
            
            throw error; // Re-throw to be caught by handleConfirmDonate
        } finally {
            setInitializing(false);
        }
    };

    const handleDonateClick = () => {
        // Show confirmation modal first
        setShowConfirmModal(true);
        dispatch(setShowModalApp(true));
    };

    const handleConfirmDonate = async () => {
        // Close confirmation modal
        setShowConfirmModal(false);
        dispatch(setShowModalApp(false));
        
        // Start payment process
        try {
            setLoading(true);
            setErrorMessage(''); // Clear any previous errors
            
            // Initialize payment sheet with current amount and type
            await initializePaymentSheet();
            
            const { error } = await presentPaymentSheet();

            if (error) {
                // Check if user canceled (don't show error for cancellation)
                const errorType = error.type || error.code;
                if (errorType === 'Canceled' || error.message?.toLowerCase().includes('cancel')) {
                    return;
                }
                
                // Handle Stripe payment errors with user-friendly messages
                let userFriendlyMessage = strings.connection_failed || "Payment failed. Please try again.";
                
                if (error.code === 'Failed' || error.message?.includes('declined')) {
                    userFriendlyMessage = "Your card was declined. Please check your card details or use a different payment method.";
                } else if (error.message?.includes('insufficient') || error.message?.includes('funds')) {
                    userFriendlyMessage = "Your card has insufficient funds. Please use a different payment method.";
                } else if (error.message?.includes('expired')) {
                    userFriendlyMessage = "Your card has expired. Please use a different payment method.";
                } else if (error.message?.includes('incorrect') || error.message?.includes('invalid')) {
                    userFriendlyMessage = "Your card details are incorrect. Please check and try again.";
                } else {
                    // Use backend error message if available, otherwise generic message
                    userFriendlyMessage = error.message || userFriendlyMessage;
                }
                
                setErrorMessage(userFriendlyMessage);
                setShowErrorModal(true);
                dispatch(setShowModalApp(true));
            } else {
                // Payment succeeded - save donation to database
                try {
                    await axios.post(remote_host + '/yambi/API/save_donation', {
                        phone_number: user_data.phone_number,
                        amount: amount,
                        currency: 'usd',
                        donation_type: donationType
                    }, {
                        timeout: 15000, // 15 second timeout
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    });
                    
                    setShowSuccessModal(true);
                    dispatch(setShowModalApp(true));
                } catch (error: any) {
                    // Payment succeeded but failed to save - still show success
                    // Webhook will handle saving if configured
                    setShowSuccessModal(true);
                    dispatch(setShowModalApp(true));
                }
            }
        } catch (error: any) {
            // Use backend error message if available (already user-friendly)
            if (!errorMessage) {
                if (error.response?.data?.message) {
                    setErrorMessage(error.response.data.message);
                } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
                    setErrorMessage(strings.connection_failed || "Request timed out. Please check your internet connection and try again.");
                } else if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
                    setErrorMessage(strings.connection_failed || "Network error. Please check your internet connection and try again.");
                } else if (error.response) {
                    setErrorMessage(error.response.data?.message || strings.connection_failed || "Payment failed. Please try again.");
                } else if (error.request) {
                    setErrorMessage(strings.connection_failed || "No response from server. Please check your internet connection.");
                } else {
                    setErrorMessage(strings.connection_failed || "Payment failed. Please try again.");
                }
            }
            
            setShowErrorModal(true);
            dispatch(setShowModalApp(true));
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[{ backgroundColor: theme.colors.background, flex: 1, borderColor: theme.colors.border, borderTopWidth: 1 }, StyleSheet.absoluteFill]}>
            {showSuccessModal ? (
                <ModalApp 
                    onClose={() => { 
                        dispatch(setShowModalApp(false)); 
                        setShowSuccessModal(false);
                        navigation.goBack();
                    }} 
                    singleButton 
                    title={strings.success || "Success"}
                >
                    <TextNormalYambiGray text={strings.donation_success || "Thank you for your donation! Your support helps us continue improving Yambi."} />
                </ModalApp>
            ) : null}

            {showConfirmModal ? (
                <ModalApp 
                    onClose={() => { 
                        dispatch(setShowModalApp(false)); 
                        setShowConfirmModal(false);
                    }}
                    title={strings.confirm_donation || "Confirm Donation"}
                    onAction={handleConfirmDonate}
                    textAction={strings.confirm || "Confirm"}
                    textCancel={strings.cancel || "Cancel"}
                    singleButton={false}
                >
                    <View style={{ alignItems: 'center', marginBottom: 16 }}>
                        <View style={{
                            width: 60,
                            height: 60,
                            borderRadius: 30,
                            backgroundColor: theme.colors.high_color + '20',
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginBottom: 12,
                        }}>
                            <IconApp pack="FI" name="heart" size={30} color={theme.colors.high_color} />
                        </View>
                        <TextNormalYambi 
                            text={strings.donation_summary || "Donation Summary"} 
                            bold 
                            styles={{ marginBottom: 8, textAlign: 'center' }} 
                        />
                    </View>
                    <View style={{
                        backgroundColor: theme.colors.border + '40',
                        borderRadius: 12,
                        padding: 16,
                        marginBottom: 12,
                    }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                            <TextNormalYambiGray text={strings.donation_type || "Type"} />
                            <TextNormalYambi 
                                text={donationType === 1 ? (strings.monthly || "Monthly") : (strings.one_time || "One-time")} 
                                bold 
                            />
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                            <TextNormalYambiGray text={strings.amount || "Amount"} />
                            <TextNormalYambi text={`$${amount}`} bold />
                        </View>
                        {donationType === 1 && (
                            <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: theme.colors.border }}>
                                <TextSmallYambiGray 
                                    text={strings.monthly_donation_info || "Your card will be charged monthly. You can cancel anytime from your account settings."} 
                                    styles={{ fontSize: 11, lineHeight: 16 }} 
                                />
                            </View>
                        )}
                    </View>
                    <TextNormalYambiGray 
                        text={strings.confirm_donation_message || "Are you sure you want to proceed with this donation?"} 
                        styles={{ textAlign: 'center', marginTop: 8 }} 
                    />
                </ModalApp>
            ) : null}

            {showErrorModal ? (
                <ModalApp 
                    onClose={() => { 
                        dispatch(setShowModalApp(false)); 
                        setShowErrorModal(false);
                    }} 
                    singleButton 
                    title={strings.error}
                >
                    <TextNormalYambiGray text={errorMessage || strings.connection_failed} />
                </ModalApp>
            ) : null}

            <View style={{ flex: 1 }}>
                <StatusBarYambi />

                <ScrollView 
                keyboardShouldPersistTaps='handled'
                    style={{ flex: 1, backgroundColor: 'transparent' }}
                    contentContainerStyle={{ paddingBottom: 30 }}
                >
                    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
                        {/* Header Section */}
                        <View style={{
                            backgroundColor: theme.colors.border,
                            marginHorizontal: 20,
                            marginTop: 20,
                            marginBottom: 15,
                            borderRadius: 16,
                            padding: 24,
                            alignItems: 'center',
                        }}>
                            <View style={{
                                width: 80,
                                height: 80,
                                borderRadius: 40,
                                backgroundColor: theme.colors.high_color + '20',
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginBottom: 16,
                            }}>
                                <IconApp pack="FI" name="heart" size={40} color={theme.colors.high_color} />
                            </View>
                            
                            <TextBigYambi 
                                text={strings.support_the_project || "Support the Project"} 
                                bold 
                                styles={{ marginBottom: 8, textAlign: 'center' }} 
                            />
                            
                            <TextNormalYambiGray 
                                text={strings.support_project_description || "Your contribution helps us maintain and improve Yambi. Every donation makes a difference!"} 
                                styles={{ textAlign: 'center', lineHeight: 22 }} 
                            />
                        </View>

                        {/* Donation Type Selection */}
                        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
                            <TextNormalYambi 
                                text={strings.donation_type || "Donation Type"} 
                                bold 
                                styles={{ marginBottom: 12 }} 
                            />
                            
                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                <TouchableOpacity
                                    style={{
                                        flex: 1,
                                        backgroundColor: donationType === 1 ? theme.colors.high_color + '20' : theme.colors.border,
                                        borderRadius: 12,
                                        padding: 16,
                                        borderWidth: 2,
                                        borderColor: donationType === 1 ? theme.colors.high_color : theme.colors.border,
                                    }}
                                    onPress={() => setDonationType(1)}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                        <IconApp 
                                            pack="FI" 
                                            name="repeat" 
                                            size={18} 
                                            color={donationType === 1 ? theme.colors.high_color : theme.colors.gray} 
                                        />
                                        <TextNormalYambi 
                                            text={strings.monthly || "Monthly"} 
                                            bold 
                                            styles={{ 
                                                marginLeft: 8,
                                                color: donationType === 1 ? theme.colors.high_color : theme.colors.text 
                                            }} 
                                        />
                                    </View>
                                    <TextSmallYambiGray 
                                        text={strings.monthly_donation_description || "Recurring monthly donation"} 
                                        styles={{ fontSize: 11 }} 
                                    />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={{
                                        flex: 1,
                                        backgroundColor: donationType === 0 ? theme.colors.high_color + '20' : theme.colors.border,
                                        borderRadius: 12,
                                        padding: 16,
                                        borderWidth: 2,
                                        borderColor: donationType === 0 ? theme.colors.high_color : theme.colors.border,
                                    }}
                                    onPress={() => setDonationType(0)}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                        <IconApp 
                                            pack="FI" 
                                            name="dollar-sign" 
                                            size={18} 
                                            color={donationType === 0 ? theme.colors.high_color : theme.colors.gray} 
                                        />
                                        <TextNormalYambi 
                                            text={strings.one_time || "One-time"} 
                                            bold 
                                            styles={{ 
                                                marginLeft: 8,
                                                color: donationType === 0 ? theme.colors.high_color : theme.colors.text 
                                            }} 
                                        />
                                    </View>
                                    <TextSmallYambiGray 
                                        text={strings.one_time_donation_description || "Single donation"} 
                                        styles={{ fontSize: 11 }} 
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Amount Selection */}
                        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
                            <TextNormalYambi 
                                text={strings.select_amount || "Select Amount"} 
                                bold 
                                styles={{ marginBottom: 12 }} 
                            />
                            
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                                {presetAmounts.map((presetAmount) => (
                                    <TouchableOpacity
                                        key={presetAmount}
                                        disabled={useCustomAmount}
                                        style={{
                                            flex: 1,
                                            minWidth: '30%',
                                            backgroundColor: !useCustomAmount && amount === presetAmount ? theme.colors.badge_background_color : theme.colors.border,
                                            borderRadius: 12,
                                            padding: 16,
                                            alignItems: 'center',
                                            borderWidth: 2,
                                            borderColor: !useCustomAmount && amount === presetAmount ? theme.colors.badge_background_color : theme.colors.border,
                                            opacity: useCustomAmount ? 0.5 : 1,
                                        }}
                                        onPress={() => handlePresetAmountPress(presetAmount)}
                                    >
                                        <YambiText 
                                            text={`$${presetAmount}`} 
                                            bold 
                                            color={!useCustomAmount && amount === presetAmount ? "badge" : "default"}
                                            style={{ fontSize: 16 }}
                                        />
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Custom Amount Toggle */}
                            <View style={{
                                marginTop: 16,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                backgroundColor: theme.colors.border,
                                borderRadius: 12,
                                padding: 16,
                            }}>
                                <View style={{ flex: 1 }}>
                                    <TextNormalYambi 
                                        text={strings.custom_amount || "Custom Amount"} 
                                        bold 
                                        styles={{ marginBottom: 4 }} 
                                    />
                                    <TextSmallYambiGray 
                                        text={strings.custom_amount_description || "Enter your own donation amount"} 
                                        styles={{ fontSize: 11 }} 
                                    />
                                </View>
                                <SwitchApp
                                    value={useCustomAmount}
                                    onPress={() => {
                                        setUseCustomAmount(!useCustomAmount);
                                        if (!useCustomAmount) {
                                            // When enabling, set current amount as custom
                                            setCustomAmount(amount.toString());
                                        } else {
                                            // When disabling, reset to first preset
                                            setAmount(presetAmounts[0]);
                                        }
                                    }}
                                />
                            </View>

                            {/* Custom Amount Input */}
                            {useCustomAmount && (
                                <View style={{
                                    marginTop: 12,
                                    backgroundColor: theme.colors.border,
                                    borderRadius: 12,
                                    padding: 16,
                                    borderWidth: 2,
                                    borderColor: theme.colors.badge_background_color,
                                }}>
                                    <TextSmallYambiGray 
                                        text={strings.enter_amount || "Enter Amount"} 
                                        styles={{ marginBottom: 8 }} 
                                    />
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <TextSmallYambi text="$" styles={{ marginRight: 8, fontSize: 18 }} />
                                        <TextInput
                                            placeholderTextColor={theme.colors.gray}
                                            placeholder="0.00"
                                            maxLength={20}
                                            keyboardType="decimal-pad"
                                            style={{ 
                                                flex: 1,
                                                color: theme.colors.text, 
                                                fontSize: 18,
                                                fontWeight: '600',
                                            }}
                                            value={customAmount}
                                            onChangeText={handleCustomAmountChange}
                                            autoFocus={useCustomAmount}
                                        />
                                    </View>
                                </View>
                            )}
                        </View>

                        {/* Info Section */}
                        <View style={{
                            backgroundColor: theme.colors.border + '40',
                            marginHorizontal: 20,
                            marginBottom: 20,
                            borderRadius: 12,
                            padding: 16,
                        }}>
                            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
                                <IconApp pack="FI" name="info" size={16} color={theme.colors.high_color} styles={{ marginRight: 8, marginTop: 2 }} />
                                <View style={{ flex: 1 }}>
                                    <TextSmallYambiGray 
                                        text={donationType === 1 
                                            ? (strings.monthly_donation_info || "Your card will be charged monthly. You can cancel anytime from your account settings.")
                                            : (strings.one_time_donation_info || "This is a one-time payment. You will not be charged again.")
                                        } 
                                        styles={{ lineHeight: 18 }} 
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Donate Button */}
                        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
                            <TouchableOpacity
                                style={{
                                    backgroundColor: theme.colors.badge_background_color,
                                    borderRadius: 12,
                                    padding: 18,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexDirection: 'row',
                                    opacity: (loading || initializing) ? 0.6 : 1,
                                }}
                                onPress={handleDonateClick}
                                disabled={loading || initializing}
                            >
                                {loading || initializing ? (
                                    <>
                                        <ActivityIndicator color={theme.colors.badge_color} size="small" style={{ marginRight: 10 }} />
                                        <YambiText 
                                            text={strings.processing || "Processing..."} 
                                            color="badge"
                                            style={{ marginRight: 0 }}
                                        />
                                    </>
                                ) : (
                                    <>
                                        <IconApp pack="FI" name="heart" size={18} color={theme.colors.badge_color} styles={{ marginRight: 8 }} />
                                        <YambiText 
                                            text={strings.donate || "Donate"} 
                                            bold 
                                            color="badge"
                                            style={{ marginRight: 0 }}
                                        />
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </View>
        </SafeAreaView>
    );
};

export default MakeDonation;
