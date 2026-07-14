import { useEffect, useState, useRef } from 'react';
import { View, ScrollView, Pressable, TextInput, Platform } from 'react-native';
import Animated, { BounceIn, FadeInDown, FadeInUp, SlideInDown, SlideInUp } from 'react-native-reanimated';
import { strings } from '../../lang/lang';
import { useAppDispatch, useAppSelector } from '../../store/app/hooks';
import StatusBarYambi from '../../components/app/StatusBar';
import { TextNormalYambi, TextNormalYambiGray, TextSmallYambiGray } from '../../components/app/Text';
import { IconApp } from '../../components/app/IconApp';
import SwitchApp from '../../components/app/SwitchApp';
import { setAfterSale, setCloseSaleBoardAfterOperation, setPasswordBusiness, setRequirePasswordBusiness, setTypeSaleBoard } from '../../store/reducers/persistedAppSlice';
import ModalApp from '../../components/app/ModalApp';
import { setShowModalApp, setBusinessOpened } from '../../store/reducers/appSlice';

const CustomizeBusiness = () => {

     const theme = useAppSelector(state => state.app_theme);
     const dispatch = useAppDispatch();
     const user_data = useAppSelector(state => state.user_data);
     const app_description = useAppSelector(state => state.persisted_app.app_description);
     const [profile, setProfile] = useState<string>();
     const [frame_style, setFrame_style] = useState<boolean>(false);
     const [print_after_add, setPrint_after_add] = useState<boolean>(false);
     const [close_after_add, setClose_after_add] = useState<boolean>(false);
     const [business_password, setBusiness_password] = useState<string>("");
     const [password_business_enabled, setPassword_business_enabled] = useState<boolean>(false);
     const [showEnterCurrentPassword, setShowEnterCurrentPassword] = useState<boolean>(false);
     const [flag_pass, setFlag_pass] = useState<number>(0);
     const [ste, setSte] = useState<boolean>(true);
     const [cp, setCp] = useState<string>("");
     const [passwordChangeable, setPasswordChangeable] = useState<boolean>(false);
     const [passwordVisible, setPasswordVisible] = useState<boolean>(true);
     const passwordModalInputRef = useRef<TextInput>(null);
     const passwordSetupInputRef = useRef<TextInput>(null);

     const SetValue = (val: boolean, type: number) => {
          if (type === 1) {
               setFrame_style(val);
               dispatch(setTypeSaleBoard(val ? 0 : 1));
          }

          if (type === 2) {
               setPrint_after_add(val);
               dispatch(setAfterSale(val ? 0 : 1));
               dispatch(setCloseSaleBoardAfterOperation(1));
          }

          if (type === 3) {
               setClose_after_add(val);
               dispatch(setCloseSaleBoardAfterOperation(val ? 0 : 1));
               dispatch(setAfterSale(1));
          }
     }

     const SetValuePassword = () => {
          const newEnabledState = !password_business_enabled;
          setPassword_business_enabled(newEnabledState);
          dispatch(setRequirePasswordBusiness(newEnabledState));

          // If disabling password, clear the password and reset business_opened state
          if (!newEnabledState) {
               dispatch(setPasswordBusiness(""));
               setBusiness_password("");
               dispatch(setBusinessOpened(false));
          }
     }

     const Okok = () => {
          // If password exists and is valid (6 digits), require verification before toggling
          if (app_description.password_business && app_description.password_business.length === 6) {
               setFlag_pass(0);
               setShowEnterCurrentPassword(true);
               dispatch(setShowModalApp(true));
               setCp("");
          } else {
               // No valid password exists
               const newEnabledState = !password_business_enabled;
               setPassword_business_enabled(newEnabledState);

               // Only reveal the input area; do NOT dispatch setRequirePasswordBusiness(true)
               // until a valid 6-digit password is actually committed via SetPP.
               // If disabling, clear everything.
               if (!newEnabledState) {
                    dispatch(setRequirePasswordBusiness(false));
                    dispatch(setPasswordBusiness(""));
                    setBusiness_password("");
                    dispatch(setBusinessOpened(false));
               }
          }
     }

     const SetPP = (pp: string) => {
          // Only allow numeric characters
          const numericOnly = pp.replace(/[^0-9]/g, '');

          // If password is not changeable yet, check if we need to verify current password
          if (!passwordChangeable) {
               // If there's an existing password, require verification before allowing change
               if (app_description.password_business && app_description.password_business.length === 6) {
                    setFlag_pass(1);
                    setShowEnterCurrentPassword(true);
                    dispatch(setShowModalApp(true));
                    setCp("");
               } else {
                    // No existing password, allow setting new password directly
                    setPasswordChangeable(true);
                    setBusiness_password(numericOnly);
                    // Only persist to Redux when exactly 6 digits are entered
                    if (numericOnly.length === 6) {
                         dispatch(setPasswordBusiness(numericOnly));
                         dispatch(setRequirePasswordBusiness(true));
                    }
               }
          } else {
               // Password changeable - update local state while typing
               setBusiness_password(numericOnly);
               // Only persist to Redux when exactly 6 digits are entered
               if (numericOnly.length === 6) {
                    dispatch(setPasswordBusiness(numericOnly));
                    dispatch(setRequirePasswordBusiness(true));
               } else {
                    // If user backspaces below 6 digits, clear the persisted password
                    // so partial passwords are never stored
                    if (app_description.password_business && app_description.password_business.length === 6) {
                         dispatch(setPasswordBusiness(""));
                         dispatch(setRequirePasswordBusiness(false));
                    }
               }
          }
     }

     const SETCP = (cpp: string) => {
          setCp(cpp);

          if (flag_pass === 0) {
               if (cpp.length === 6 && cpp === app_description.password_business) {
                    setShowEnterCurrentPassword(false);
                    dispatch(setShowModalApp(false));
                    setCp("");
                    SetValuePassword();
               }
          }

          if (flag_pass === 1) {
               if (cpp.length === 6 && cpp === app_description.password_business) {
                    setShowEnterCurrentPassword(false);
                    dispatch(setShowModalApp(false));
                    setCp("");
                    setPasswordChangeable(true);
                    // Clear the input field so user can type new password
                    setBusiness_password("");
               }
          }

          if (flag_pass === 2) {
               if (cpp.length === 6 && cpp === app_description.password_business) {
                    setShowEnterCurrentPassword(false);
                    dispatch(setShowModalApp(false));
                    setCp("");
                    setPasswordVisible(false);
               }
          }
     }

     useEffect(() => {

          const timeout = setTimeout(() => {
               if (app_description.type_sale_board === 0) {
                    setFrame_style(true);
               }

               if (app_description.after_sale === 0) {
                    setPrint_after_add(true);
                    dispatch(setCloseSaleBoardAfterOperation(1));
               }

               if (app_description.close_sale_board_after_operation === 0) {
                    setClose_after_add(true);
                    dispatch(setAfterSale(1));
               }

               if (app_description.require_password_business) {
                    if (app_description.password_business.length === 6) {
                         setPassword_business_enabled(true);
                         setBusiness_password(app_description.password_business);
                    }
               }

               if (app_description.password_business) {
                    setBusiness_password(app_description.password_business);
               }
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
                                   text={strings.current_business_tab_password}
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
                    <IconApp name="filter-frames" pack='MT' size={20} color={theme.colors.gray} styles={{ marginRight: 20 }} />
                    <TextNormalYambi styles={{ flex: 1, marginRight: 10 }} text={strings.use_small_dialog_box_for_sale_operation} />
                    <View>
                         <SwitchApp value={frame_style} onPress={() => SetValue(!frame_style, 1)} />
                    </View>
               </View>

               <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 15,
                    marginVertical: 15
               }}>
                    <IconApp name="printer" pack='FI' size={20} color={theme.colors.gray} styles={{ marginRight: 20 }} />
                    {close_after_add ? <TextNormalYambiGray styles={{ flex: 1, marginRight: 10 }} text={strings.redirect_to_invoice_after_new_sales} />
                         :
                         <TextNormalYambi styles={{ flex: 1, marginRight: 10 }} text={strings.redirect_to_invoice_after_new_sales} />}
                    <View>
                         <SwitchApp disabled={close_after_add ? true : false} value={print_after_add} onPress={() => SetValue(!print_after_add, 2)} />
                    </View>
               </View>

               <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 15,
                    marginVertical: 15
               }}>
                    <IconApp name="close-circle-outline" pack='MC' size={20} color={theme.colors.gray} styles={{ marginRight: 20 }} />
                    {print_after_add ?
                         <TextNormalYambiGray styles={{ flex: 1, marginRight: 10 }} text={strings.close_sale_frame_after_operation} />
                         :
                         <TextNormalYambi styles={{ flex: 1, marginRight: 10 }} text={strings.close_sale_frame_after_operation} />}
                    <View>
                         <SwitchApp disabled={print_after_add ? true : false} value={close_after_add} onPress={() => SetValue(!close_after_add, 3)} />
                    </View>
               </View>

               <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 15,
                    marginVertical: 15
               }}>
                    <IconApp name="lock" pack='FI' size={20} color={theme.colors.gray} styles={{ marginRight: 20 }} />
                    <TextNormalYambi styles={{ flex: 1, marginRight: 10 }} text={strings.require_password_business} />
                    <View>
                         <SwitchApp value={password_business_enabled} onPress={Okok} />
                    </View>
               </View>

               {password_business_enabled ?
                    <Animated.View entering={FadeInUp}
                         // exiting={FadeInDown} 
                         style={{
                              paddingHorizontal: 15,
                         }}>
                         <View style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              marginVertical: 15
                         }}>
                              <IconApp name="close-circle-outline" pack='MC' size={20} color={theme.colors.background} styles={{ marginRight: 20 }} />
                              <TextNormalYambi styles={{ flex: 1 }} text={strings.set_business_password + " (6 " + strings.numbers.toLowerCase() + ")"} />
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
                                                  borderColor: business_password.length === index
                                                       ? theme.colors.high_color
                                                       : business_password.length > index
                                                            ? theme.colors.success
                                                            : theme.colors.border,
                                                  backgroundColor: business_password.length > index
                                                       ? theme.colors.success + '10'
                                                       : theme.colors.border,
                                                  justifyContent: 'center',
                                                  alignItems: 'center',
                                             }}>
                                             {business_password[index] && (
                                                  <Animated.View entering={BounceIn}>
                                                       {passwordVisible ? (
                                                            <IconApp
                                                                 name="circle"
                                                                 pack='FA'
                                                                 size={8}
                                                                 color={business_password.length > index ? theme.colors.success : theme.colors.high_color}
                                                            />
                                                       ) : (
                                                            <TextNormalYambi
                                                                 text={business_password[index]}
                                                                 styles={{
                                                                      fontSize: 20,
                                                                      fontWeight: 'bold',
                                                                      color: business_password.length > index ? theme.colors.success : theme.colors.high_color
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
                                    value={business_password}
                                   onChangeText={SetPP}
                                   keyboardType="number-pad"
                                   maxLength={6}
                                   secureTextEntry={false}
                                   caretHidden={true}
                              />

                              {/* Action Buttons Row */}
                              <View style={{
                                   flexDirection: 'row',
                                   // justifyContent: 'center',
                                   alignItems: 'center',
                                   marginTop: 10,
                              }}>
                                   {/* Success Indicator */}
                                   {business_password.length === 6 && (
                                        <Animated.View entering={BounceIn} style={{ marginRight: 15 }}>
                                             <IconApp name="check-circle" pack='FA' size={24} color={theme.colors.success} />
                                        </Animated.View>
                                   )}

                                   {/* Password Length Indicator */}
                                   <TextSmallYambiGray
                                        text={`${business_password.length}/6`}
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

               <TextSmallYambiGray text={strings.this_affect_local} styles={{ paddingVertical: 15, borderColor: theme.colors.border, borderTopWidth: 1, paddingHorizontal: 20, marginBottom: 30 }} />
          </ScrollView>
     )
}
// }

export default CustomizeBusiness;
