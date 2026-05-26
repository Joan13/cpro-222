import React, { useEffect, useLayoutEffect, useState } from 'react';
import { View, Image, Linking, Platform, ScrollView, Pressable, Text } from 'react-native';
import axios from 'axios';
import { strings } from '../../lang/lang';
import { useAppSelector } from '../../store/app/hooks';
import StatusBarYambi from '../../components/app/StatusBar';
import packagee from '../../../package.json';
import { TextBigYambi, TextNormalYambi, TextNormalYambiGray, TextNormalYambiHighColor, TextSmallYambiGray, TextSmallYambiHighColor } from '../../components/app/Text';
import { remote_host } from '../../../GlobalVariables';
import { IconApp } from '../../components/app/IconApp';
import AppActivityIndicator from '../../components/app/AppActivityIndicator';
import { NavProps } from '../../types/types';
import { SafeAreaView } from 'react-native-safe-area-context';

const UpdateYambi = ({ navigation }: NavProps) => {
    const theme = useAppSelector(state => state.app_theme);
    const [loading, setLoading] = useState<boolean>(true);
    const [appData, setAppData] = useState<any>(null);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <Pressable
                    onPress={() => Linking.openURL('https://yambi.net')}
                    style={{ marginRight: 14, paddingVertical: 6, paddingHorizontal: 4 }}
                    accessibilityRole="link"
                    accessibilityLabel={strings.site_web || 'Website'}>
                    <Text style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: theme.colors.high_color,
                        textDecorationLine: 'underline',
                    }}>
                        {strings.site_web || 'Website'}
                    </Text>
                </Pressable>
            ),
        });
    }, [navigation, theme.colors.high_color]);

    useEffect(() => {
        let cancelled = false;
        axios.post(remote_host + "/yambi/API/get_app_data")
            .then(res => {
                if (!cancelled && res.data?.success === "1") {
                    setAppData(res.data.app_data);
                }
            })
            .catch(() => { })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true; };
    }, []);

    const handleUpdate = () => {
        // Use update_link if available, otherwise fall back to default store links
        if (appData?.update_link && appData.update_link.trim() !== "") {
            Linking.openURL(appData.update_link);
        } else {
            // Default store links
            if (Platform.OS === 'android') {
                Linking.openURL('https://play.google.com/store/apps/details?id=com.yambi.app');
            } else if (Platform.OS === 'ios') {
                Linking.openURL('https://apps.apple.com/us/app/yambi/id6741203050');
            }
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={{ backgroundColor: theme.colors.background, flex: 1, borderColor: theme.colors.border, borderTopWidth: 1 }}>
                <StatusBarYambi />
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <AppActivityIndicator />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <View style={{ backgroundColor: theme.colors.background, flex: 1, borderColor: theme.colors.border, borderTopWidth: 1 }}>
            <StatusBarYambi />
            <ScrollView 
                contentContainerStyle={{ flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
            >
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 0 }}>
                    {/* Logo Section */}
                    <View style={{ 
                        width: 80, 
                        height: 80,
                        borderRadius: 10,
                    //     backgroundColor: theme.colors.border + '40',
                        justifyContent: 'center',
                        alignItems: 'center', marginBottom: 0
                    }}>
                        <Image 
                            source={require("./../../assets/logo.png")} 
                            style={{ width: 50, height: 50 }} 
                        />
                    </View>

                    {/* Title */}
                    <TextBigYambi text="Yambi" bold styles={{ marginBottom: 8 }} />

                    {/* Update Available Card */}
                    <View style={{
                        backgroundColor: theme.colors.high_color + '15',
                        borderRadius: 20,
                        padding: 24,
                        marginTop: 24,
                        marginBottom: 32,
                        width: '100%',
                        borderWidth: 2,
                        borderColor: theme.colors.high_color + '30',
                        alignItems: 'center',
                    }}>
                        <View style={{
                            width: 64,
                            height: 64,
                            borderRadius: 32,
                            backgroundColor: theme.colors.high_color,
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginBottom: 16,
                        }}>
                            <IconApp pack="FI" name="download" size={32} color="#FFFFFF" />
                        </View>

                        <TextNormalYambiHighColor 
                            text={appData?.update_required === 1 
                                ? strings.update_required_message 
                                : strings.new_version_available} 
                            bold 
                            styles={{ fontSize: 20, marginBottom: 12, textAlign: 'center' }} 
                        />
                        {appData?.update_required === 1 && (
                            <TextSmallYambiGray 
                                text={strings.update_required_description} 
                                styles={{ textAlign: 'center', marginBottom: 12, lineHeight: 20 }} 
                            />
                        )}
                        <Pressable onPress={handleUpdate}>
                            <TextSmallYambiHighColor 
                                text={strings.click_here_to_download_install || 'Click here to download and install the new app version'} 
                                styles={{ textAlign: 'center', lineHeight: 20, textDecorationLine: 'underline' }} 
                            />
                        </Pressable>
                    </View>

                    {/* Version Comparison Card */}
                    <View style={{
                        backgroundColor: theme.colors.border + '40',
                        borderRadius: 16,
                        padding: 20,
                        width: '100%',
                        marginBottom: 32,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                    }}>
                        {/* Current Version */}
                        <View style={{ marginBottom: 20 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                <IconApp pack="FI" name="package" size={18} color={theme.colors.gray} />
                                <TextNormalYambiGray text={strings.vcode || 'Version Code'} bold styles={{ marginLeft: 8 }} />
                            </View>
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                backgroundColor: theme.colors.background,
                                padding: 12,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: theme.colors.border,
                            }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                    <TextNormalYambi text={packagee.version} styles={{ fontSize: 16 }} />
                                    <IconApp pack="FI" name="arrow-right" size={16} color={theme.colors.high_color} styles={{ marginHorizontal: 12 }} />
                                    <TextNormalYambiHighColor text={appData?.app_version_code ?? '-'} bold styles={{ fontSize: 16 }} />
                                </View>
                            </View>
                        </View>

                        {/* Version Name */}
                        <View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                <IconApp pack="FI" name="tag" size={18} color={theme.colors.gray} />
                                <TextNormalYambiGray text={strings.version_name || 'Version Name'} bold styles={{ marginLeft: 8 }} />
                            </View>
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                backgroundColor: theme.colors.background,
                                padding: 12,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: theme.colors.border,
                            }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                    <TextNormalYambi text={packagee.version_name} styles={{ fontSize: 16 }} />
                                    <IconApp pack="FI" name="arrow-right" size={16} color={theme.colors.high_color} styles={{ marginHorizontal: 12 }} />
                                    <TextNormalYambiHighColor text={appData?.app_version_name ?? '-'} bold styles={{ fontSize: 16 }} />
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Platform Info */}
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        backgroundColor: theme.colors.border + '30',
                        borderRadius: 12,
                        marginBottom: 16,
                    }}>
                        <IconApp pack="FI" name={Platform.OS === 'ios' ? 'smartphone' : 'smartphone'} size={16} color={theme.colors.gray} />
                        <TextSmallYambiGray text={Platform.OS.toUpperCase()} styles={{ marginLeft: 8 }} />
                    </View>
                </View>
                
                {/* Footer */}
            <View style={{ paddingBottom: 30, paddingHorizontal: 20 }}>
                <TextSmallYambiGray 
                    text={strings.footer || 'Copyright Agisha Migani Joan'} 
                    styles={{ textAlign: 'center', color: theme.colors.gray }} 
                />
            </View>
            </ScrollView>

            
        </View>
    )
}

export default UpdateYambi;
