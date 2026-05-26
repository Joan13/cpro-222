import { useState, useEffect } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { strings } from '../../lang/lang';
import { useAppDispatch, useAppSelector } from '../../store/app/hooks';
import StatusBarYambi from '../../components/app/StatusBar';
import { TextNormalYambi, TextSmallYambiGray } from '../../components/app/Text';
import { IconApp } from '../../components/app/IconApp';
import { NavProps } from '../../types/types';
import SwitchApp from '../../components/app/SwitchApp';
import { 
    setTabVisibleChats, 
    setTabVisibleMarketplace, 
    setTabVisibleBusiness, 
    setTabVisibleExpenses, 
    setTabVisibleAdmin,
    setTabVisibleNoticeboard 
} from '../../store/reducers/persistedAppSlice';
import { SafeAreaView } from 'react-native-safe-area-context';

const Customize = ({ navigation }: NavProps) => {
    const theme = useAppSelector(state => state.app_theme);
    const dispatch = useAppDispatch();
    const user_data = useAppSelector(state => state.user_data);
    const app_description = useAppSelector(state => state.persisted_app.app_description);
    const [tabVisibleChats, setTabVisibleChatsState] = useState<boolean>(true);
    const [tabVisibleMarketplace, setTabVisibleMarketplaceState] = useState<boolean>(true);
    const [tabVisibleBusiness, setTabVisibleBusinessState] = useState<boolean>(true);
    const [tabVisibleExpenses, setTabVisibleExpensesState] = useState<boolean>(true);
    const [tabVisibleAdmin, setTabVisibleAdminState] = useState<boolean>(true);
    const [tabVisibleNoticeboard, setTabVisibleNoticeboardState] = useState<boolean>(true);

    useEffect(() => {
        const timeout = setTimeout(() => {
            setTabVisibleChatsState(app_description.tab_visible_chats);
            setTabVisibleMarketplaceState(app_description.tab_visible_marketplace);
            setTabVisibleBusinessState(app_description.tab_visible_business);
            setTabVisibleExpensesState(app_description.tab_visible_expenses);
            setTabVisibleAdminState(app_description.tab_visible_admin);
            setTabVisibleNoticeboardState(app_description.tab_visible_noticeboard);
        }, 300);

        return () => clearTimeout(timeout);
    }, []);

    const SetTabVisibility = (val: boolean, type: string) => {
        switch (type) {
            case 'chats':
                setTabVisibleChatsState(val);
                dispatch(setTabVisibleChats(val));
                break;
            case 'marketplace':
                setTabVisibleMarketplaceState(val);
                dispatch(setTabVisibleMarketplace(val));
                break;
            case 'business':
                setTabVisibleBusinessState(val);
                dispatch(setTabVisibleBusiness(val));
                break;
            case 'expenses':
                setTabVisibleExpensesState(val);
                dispatch(setTabVisibleExpenses(val));
                break;
            case 'admin':
                setTabVisibleAdminState(val);
                dispatch(setTabVisibleAdmin(val));
                break;
            case 'noticeboard':
                setTabVisibleNoticeboardState(val);
                dispatch(setTabVisibleNoticeboard(val));
                break;
        }
    }

    return (
        <View style={{ backgroundColor: theme.colors.background, flex: 1, borderColor: theme.colors.border, borderTopWidth: 1 }}>
            <StatusBarYambi />

            <ScrollView style={{ flex: 1, backgroundColor: 'transparent' }}>
                <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
                    {/* Business Customization Card */}
                    <View style={{ paddingHorizontal: 15, marginTop: 20 }}>
                        <Pressable
                            style={{
                                backgroundColor: theme.colors.background,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: theme.colors.border,
                                marginBottom: 12,
                            }}
                            onPress={() => navigation.navigate('CustomizeBusiness')}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
                                <View style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 20,
                                    backgroundColor: theme.colors.border,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginRight: 15,
                                }}>
                                    <IconApp pack='FI' name="briefcase" size={20} color={theme.colors.high_color} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <TextNormalYambi text={strings.customize_business_actions} styles={{ marginBottom: 2 }} />
                                    <TextSmallYambiGray text={strings.customize_business_settings_text} />
                                </View>
                                <IconApp pack='FI' name="chevron-right" size={20} color={theme.colors.gray} />
                            </View>
                        </Pressable>

                        {/* Expenses Customization Card */}
                        <Pressable
                            style={{
                                backgroundColor: theme.colors.background,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: theme.colors.border,
                                marginBottom: 20,
                            }}
                            onPress={() => navigation.navigate('CustomizeExpenses')}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
                                <View style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 20,
                                    backgroundColor: theme.colors.border,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginRight: 15,
                                }}>
                                    <IconApp pack='FI' name="dollar-sign" size={20} color={theme.colors.high_color} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <TextNormalYambi text={strings.customize_expenses} styles={{ marginBottom: 2 }} />
                                    <TextSmallYambiGray text={strings.customize_expenses_settings_text} />
                                </View>
                                <IconApp pack='FI' name="chevron-right" size={20} color={theme.colors.gray} />
                            </View>
                        </Pressable>
                    </View>

                    {/* Border Line */}
                    {/* <View style={{
                        height: 1,
                        backgroundColor: theme.colors.border,
                        marginHorizontal: 20,
                        marginBottom: 20,
                    }} /> */}

                    {/* Customize Application Section */}
                    <View style={{ paddingHorizontal: 15 }}>
                        <TextNormalYambi text={strings.customize_application} bold styles={{ marginBottom: 15, fontSize: 18 }} />

                        {/* Tabs Submenu */}
                        <View style={{
                            backgroundColor: theme.colors.background,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: theme.colors.border,
                            marginBottom: 20,
                            padding: 16,
                        }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                                <IconApp pack='FI' name="grid" size={18} color={theme.colors.high_color} styles={{ marginRight: 10 }} />
                                <TextNormalYambi text={strings.tabs} styles={{ fontSize: 16 }} />
                            </View>

                            {/* Chat Tab */}
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingVertical: 12,
                                borderBottomWidth: 1,
                                borderBottomColor: theme.colors.border,
                            }}>
                                <IconApp pack='SLI' name="bubbles" size={18} color={theme.colors.gray} styles={{ marginRight: 15 }} />
                                <TextNormalYambi styles={{ flex: 1, marginRight: 10 }} text={strings.chats} />
                                <View>
                                    <SwitchApp disabled={true} value={tabVisibleChats} onPress={() => {}} />
                                </View>
                            </View>

                            {/* Marketplace Tab */}
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingVertical: 12,
                                borderBottomWidth: 1,
                                borderBottomColor: theme.colors.border,
                            }}>
                                <IconApp pack='SLI' name="layers" size={18} color={theme.colors.gray} styles={{ marginRight: 15 }} />
                                <TextNormalYambi styles={{ flex: 1, marginRight: 10 }} text={strings.marketplace} />
                                <View>
                                    <SwitchApp disabled={true} value={tabVisibleMarketplace} onPress={() => {}} />
                                </View>
                            </View>

                            {/* Business Tab */}
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingVertical: 12,
                                borderBottomWidth: 1,
                                borderBottomColor: theme.colors.border,
                            }}>
                                <IconApp pack='IO' name="bag-handle-outline" size={18} color={theme.colors.gray} styles={{ marginRight: 15 }} />
                                <TextNormalYambi styles={{ flex: 1, marginRight: 10 }} text={strings.business} />
                                <View>
                                    <SwitchApp value={tabVisibleBusiness} onPress={() => SetTabVisibility(!tabVisibleBusiness, 'business')} />
                                </View>
                            </View>

                            {/* Expenses Tab */}
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingVertical: 12,
                                borderBottomWidth: 1,
                                borderBottomColor: theme.colors.border,
                            }}>
                                <IconApp pack='FI' name="dollar-sign" size={18} color={theme.colors.gray} styles={{ marginRight: 15 }} />
                                <TextNormalYambi styles={{ flex: 1, marginRight: 10 }} text={strings.expenses} />
                                <View>
                                    <SwitchApp disabled={true} value={tabVisibleExpenses} onPress={() => {}} />
                                </View>
                            </View>

                            {/* Noticeboard Tab */}
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingVertical: 12,
                                borderBottomWidth: user_data.user_verified === 1 ? 1 : 0,
                                borderBottomColor: theme.colors.border,
                            }}>
                                <IconApp pack='FI' name="bell" size={18} color={theme.colors.gray} styles={{ marginRight: 15 }} />
                                <TextNormalYambi styles={{ flex: 1, marginRight: 10 }} text={strings.notice_board} />
                                <View>
                                    <SwitchApp disabled={true} value={tabVisibleNoticeboard} onPress={() => SetTabVisibility(!tabVisibleNoticeboard, 'noticeboard')} />
                                </View>
                            </View>

                            {/* Admin Tab - Only visible if user is admin */}
                            {user_data.user_verified === 1 && (
                                <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    paddingVertical: 12,
                                }}>
                                    <IconApp pack='SLI' name="settings" size={18} color={theme.colors.gray} styles={{ marginRight: 15 }} />
                                    <TextNormalYambi styles={{ flex: 1, marginRight: 10 }} text={strings.admin} />
                                    <View>
                                        <SwitchApp value={tabVisibleAdmin} onPress={() => SetTabVisibility(!tabVisibleAdmin, 'admin')} />
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    )
}

export default Customize;
