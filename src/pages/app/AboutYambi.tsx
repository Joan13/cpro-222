import React, { useEffect, useLayoutEffect, useState } from 'react';
import { View, Image, Platform, ScrollView, Text, Pressable, Linking } from 'react-native';
import axios from 'axios';
import { strings } from '../../lang/lang';
import { useAppSelector } from '../../store/app/hooks';
import StatusBarYambi from '../../components/app/StatusBar';
import AppActivityIndicator from '../../components/app/AppActivityIndicator';
import packagee from './../../../package.json';
import { TextBigYambi, TextNormalYambi, TextNormalYambiGray, TextSmallYambiGray } from '../../components/app/Text';
import { remote_host, isRemoteAppVersionNewer } from '../../../GlobalVariables';
import { NavProps } from '../../types/types';
import { IconApp } from '../../components/app/IconApp';
// import { SafeAreaView } from 'react-native-safe-area-context';

const AboutYambi = ({ navigation }: NavProps) => {
    const theme = useAppSelector(state => state.app_theme);
    const [checking, setChecking] = useState<boolean>(false);

    // Parse translation string to extract parts for "Built with {heart} by {name}"
    const translation = strings.built_with_heart_by || 'Built with {heart} by {name}';
    const translationParts = translation.split('{heart}');
    const beforeHeart = translationParts[0] || 'Built with ';
    const afterHeart = translationParts[1] || 'by {name}';
    const afterHeartParts = afterHeart.split('{name}');
    const afterHeartBeforeName = afterHeartParts[0] || 'by ';

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
                    const appData = res.data?.app_data;
                    const remoteVersion: string | undefined = appData?.app_version_code;
                    const newerThanLocal =
                        !!remoteVersion &&
                        !!packagee.version &&
                        isRemoteAppVersionNewer(remoteVersion, packagee.version);

                    if (newerThanLocal) {
                        navigation.replace('UpdateYambi');
                    }
                }
            })
            .catch(() => { })
            .finally(() => {
                if (!cancelled) setChecking(false);
            });

        return () => { cancelled = true; }
    }, [navigation]);



    return (
        <View style={{ backgroundColor: theme.colors.background, flex: 1, borderColor: theme.colors.border, borderTopWidth: 1 }}>
            <StatusBarYambi />
            <ScrollView
                showsVerticalScrollIndicator={false}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 25, paddingVertical: 0 }}>
                    {/* Logo Section */}
                    <View style={{
                        width: 80,
                        height: 80,
                        borderRadius: 30,
                        // backgroundColor: theme.colors.border + '40',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                        <Image
                            source={require("./../../assets/logo.png")}
                            style={{ width: 50, height: 50 }}
                        />
                    </View>

                    {/* Title */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                        <TextBigYambi text="Yambi" bold />
                        {checking ? (
                            <View style={{ marginLeft: 10 }}>
                                <AppActivityIndicator />
                            </View>
                        ) : null}
                    </View>

                    {/* Up to date message */}
                    {!checking && (
                        <View style={{
                            backgroundColor: theme.colors.success + '15',
                            borderRadius: 12,
                            paddingHorizontal: 16,
                            paddingVertical: 10,
                            marginBottom: 24,
                            flexDirection: 'row',
                            alignItems: 'center',
                            borderWidth: 1,
                            borderColor: theme.colors.success + '30',
                        }}>
                            <IconApp pack="FI" name="check-circle" size={18} color={theme.colors.success} />
                            <TextNormalYambiGray
                                text={strings.everything_is_up_to_date || 'Everything is up to date'}
                                styles={{ marginLeft: 8, color: theme.colors.success }}
                            />
                        </View>
                    )}

                    {/* App Info Card */}
                    <View style={{
                        backgroundColor: theme.colors.border + '40',
                        borderRadius: 16,
                        padding: 20,
                        width: '100%',
                        marginBottom: 24,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                    }}>
                        {/* Version Code */}
                        <View style={{ marginBottom: 20 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                <IconApp pack="FI" name="package" size={18} color={theme.colors.high_color} />
                                <TextNormalYambiGray text={strings.vcode} bold styles={{ marginLeft: 8 }} />
                            </View>
                            <View style={{
                                backgroundColor: theme.colors.background,
                                padding: 12,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: theme.colors.border,
                            }}>
                                <TextNormalYambi text={packagee.version} styles={{ fontSize: 16 }} />
                            </View>
                        </View>

                        {/* Version Name */}
                        <View style={{ marginBottom: 20 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                <IconApp pack="FI" name="tag" size={18} color={theme.colors.high_color} />
                                <TextNormalYambiGray text={strings.version_name} bold styles={{ marginLeft: 8 }} />
                            </View>
                            <View style={{
                                backgroundColor: theme.colors.background,
                                padding: 12,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: theme.colors.border,
                            }}>
                                <TextNormalYambi text={packagee.version_name} styles={{ fontSize: 16 }} />
                            </View>
                        </View>

                        {/* Platform */}
                        <View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                <IconApp pack="FI" name="smartphone" size={18} color={theme.colors.high_color} />
                                <TextNormalYambiGray text={strings.platform || 'Platform'} bold styles={{ marginLeft: 8 }} />
                            </View>
                            <View style={{
                                backgroundColor: theme.colors.background,
                                padding: 12,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: theme.colors.border,
                            }}>
                                <TextNormalYambi text={Platform.OS.toUpperCase()} styles={{ fontSize: 16 }} />
                            </View>
                        </View>
                    </View>

                </View>

                {/* Modern Footer with Copyright and Built with Heart */}
                <View style={{
                    marginTop: 32,
                    marginBottom: 40,
                    paddingHorizontal: 25,
                    alignItems: 'center',
                }}>
                    {/* Built with heart section - Modern card design */}
                    <View style={{
                        backgroundColor: theme.colors.border + '25',
                        borderRadius: 20,
                        paddingVertical: 18,
                        paddingHorizontal: 24,
                        marginBottom: 20,
                        borderWidth: 1,
                        borderColor: theme.colors.border + '50',
                        width: '100%',
                        alignItems: 'center',
                        shadowColor: theme.colors.border,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 8,
                        elevation: 3,
                    }}>
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexWrap: 'wrap',
                        }}>
                            <Text style={{
                                fontSize: 15,
                                color: theme.colors.text,
                                fontWeight: '500',
                            }}>
                                {beforeHeart}
                            </Text>
                            <Text style={{
                                fontSize: 18,
                                marginHorizontal: 4,
                            }}>❤️</Text>
                            <Text style={{
                                fontSize: 15,
                                color: theme.colors.text,
                                fontWeight: '500',
                            }}>
                                {afterHeartBeforeName}
                                <Text style={{
                                    color: theme.colors.high_color,
                                    fontWeight: '600',
                                }}>Agisha Migani Joan</Text>
                            </Text>
                        </View>
                    </View>

                    {/* Copyright and Footer Date - Centered */}
                    <View style={{
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <TextSmallYambiGray
                            text={strings.footer || 'Yambi © 2018 - 2025'}
                            styles={{ textAlign: 'center', color: theme.colors.gray, fontSize: 12 }}
                        />
                    </View>
                </View>
            </ScrollView>


        </View>
    );
}

export default AboutYambi;
