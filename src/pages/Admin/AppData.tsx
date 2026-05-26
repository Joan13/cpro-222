import React, { useEffect, useState, useCallback } from "react";
import { View, TextInput, ScrollView, Pressable, RefreshControl } from "react-native";
import axios from "axios";
import { remote_host, renderDateTime } from "../../../GlobalVariables";
import { useAppSelector, useAppDispatch } from "../../store/app/hooks";
import { strings } from "../../lang/lang";
import { TextNormalYambi, TextNormalYambiGray, TextBigYambi, TextSmallYambiGray } from "../../components/app/Text";
import { IconApp } from "../../components/app/IconApp";
import AppActivityIndicator from "../../components/app/AppActivityIndicator";
import ButtonNormal from "../../components/app/ButtonNormal";
import ModalApp from "../../components/app/ModalApp";
import { setShowModalApp } from "../../store/reducers/appSlice";
import { TAppData } from "../../types/types";

export default function AppData() {
    const app_theme = useAppSelector(state => state.app_theme);
    const dispatch = useAppDispatch();
    const [appData, setAppData] = useState<any>(null);
    const [versions, setVersions] = useState<TAppData[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingVersions, setLoadingVersions] = useState(false);
    const [editing, setEditing] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [dataNotAvailable, setDataNotAvailable] = useState(false);
    const [showAdsModal, setShowAdsModal] = useState(false);
    const [showPersonalizedAdsModal, setShowPersonalizedAdsModal] = useState(false);
    const [showAdTypeModal, setShowAdTypeModal] = useState(false);
    const [showUpdateRequiredModal, setShowUpdateRequiredModal] = useState(false);
    const [showAllVersions, setShowAllVersions] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const adTypes = [
        { id: 0, name: strings.banners },
        { id: 1, name: strings.native_videos },
        { id: 2, name: strings.interstitial_ads },
        { id: 3, name: strings.rewarded_ads },
        { id: 4, name: strings.rewarded_interstitial_ads },
        { id: 5, name: strings.native_ads },
        { id: 6, name: strings.app_open_ads },
    ];

    const fetchAppData = () => {
        setLoading(true);
        axios.post(remote_host + "/yambi/API/get_app_data")
            .then(res => {
                if (res.data.success === "1") {
                    const data = res.data.app_data;
                    // Ensure new fields have default values if not present
                    setAppData({
                        ...data,
                        update_required: data.update_required !== undefined ? data.update_required : 0,
                        update_device: data.update_device !== undefined ? data.update_device : 1,
                        update_link: data.update_link || ""
                    });
                    setDataNotAvailable(false);
                } else {
                    setDataNotAvailable(true);
                }
            })
            .catch(() => {
                setErrorMessage(strings.connection_failed);
                setShowError(true);
                dispatch(setShowModalApp(true));
            })
            .finally(() => setLoading(false));
    };

    const fetchVersions = () => {
        setLoadingVersions(true);
        axios.post(remote_host + "/yambi/API/get_app_data", { get_versions: true })
            .then(res => {
                if (res.data.success === "1") {
                    setVersions(res.data.versions || []);
                    // Set latest version as current app data if not already set
                    if (res.data.app_data && !appData) {
                        setAppData(res.data.app_data);
                    }
                }
            })
            .catch(() => {
                // Silently fail for versions, it's not critical
            })
            .finally(() => setLoadingVersions(false));
    };

    useEffect(() => {
        fetchAppData();
        fetchVersions();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchAppData();
        fetchVersions();
        setTimeout(() => {
            setRefreshing(false);
        }, 1000);
    }, []);

    const handleCreate = () => {
        setEditing(true);
        const newAppData = {
            app_version_code: "1",
            app_version_name: "1.0.0",
            can_show_ads: 0,
            can_show_personalized_ads: 0,
            type_main_ads: 0,
            update_required: 0,
            update_device: 1, // 1 for mobile
            update_link: ""
        };
        
        axios.post(remote_host + "/yambi/API/edit_app_data", { app_data: newAppData })
            .then(res => {
                if (res.data.success === "1") {
                    setAppData(newAppData);
                    setDataNotAvailable(false);
                    setShowSuccess(true);
                    dispatch(setShowModalApp(true));
                } else {
                    setErrorMessage(res.data.error || strings.error);
                    setShowError(true);
                    dispatch(setShowModalApp(true));
                }
            })
            .catch(() => {
                setErrorMessage(strings.connection_failed);
                setShowError(true);
                dispatch(setShowModalApp(true));
            })
            .finally(() => setEditing(false));
    };

    const handleEdit = () => {
        setEditing(true);
        axios.post(remote_host + "/yambi/API/edit_app_data", { app_data: appData })
            .then(res => {
                if (res.data.success === "1") {
                    // Refresh data and versions after successful edit
                    fetchAppData();
                    fetchVersions();
                    setShowSuccess(true);
                    dispatch(setShowModalApp(true));
                } else {
                    setErrorMessage(res.data.error || strings.error);
                    setShowError(true);
                    dispatch(setShowModalApp(true));
                }
            })
            .catch(() => {
                setErrorMessage(strings.connection_failed);
                setShowError(true);
                dispatch(setShowModalApp(true));
            })
            .finally(() => setEditing(false));
    };

    if (loading) return <AppActivityIndicator />;

    // Show message when data is not available
    if (dataNotAvailable || !appData) {
        return (
            <View style={{
                flex: 1,
                backgroundColor: app_theme.colors.background,
                padding: 16,
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                {showSuccess && (
                    <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowSuccess(false); }} singleButton title={strings.success}>
                        <TextNormalYambiGray text={strings.information_success} />
                    </ModalApp>
                )}

                {showError && (
                    <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowError(false); }} singleButton title={strings.error}>
                        <TextNormalYambiGray text={errorMessage} />
                    </ModalApp>
                )}

                <View style={{
                    backgroundColor: app_theme.colors.background,
                    borderRadius: 12,
                    padding: 40,
                    width: '100%',
                    maxWidth: 400,
                    borderWidth: 1,
                    borderColor: app_theme.colors.border,
                    shadowColor: app_theme.colors.border,
                    shadowOpacity: 0.15,
                    shadowRadius: 8,
                    elevation: 3,
                    alignItems: 'center'
                }}>
                    <IconApp pack="FI" name="alert-circle" color={app_theme.colors.gray} size={60} styles={{ marginBottom: 20 }} />
                    <TextBigYambi text={strings.app_data} bold styles={{ marginBottom: 12, textAlign: 'center' }} />
                    <TextNormalYambiGray text={`${strings.app_data} ${strings.no_items.toLowerCase()}`} styles={{ marginBottom: 30, textAlign: 'center' }} />
                    <ButtonNormal
                        title={`${strings.add} ${strings.app_data}`}
                        onPress={handleCreate}
                        loadEnabled={true}
                        normal={true}
                        styles={{ width: '100%' }}
                    />
                </View>
            </View>
        );
    }

    return (
        <ScrollView 
            style={{
                flex: 1,
                backgroundColor: app_theme.colors.background,
                padding: 16
            }}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor={app_theme.colors.high_color}
                />
            }
        >
            {showSuccess && (
                <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowSuccess(false); }} singleButton title={strings.success}>
                    <TextNormalYambiGray text={strings.information_success} />
                </ModalApp>
            )}

            {showError && (
                <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowError(false); }} singleButton title={strings.error}>
                    <TextNormalYambiGray text={errorMessage} />
                </ModalApp>
            )}

            {/* Version History Section */}
            {versions.length > 0 && (
                <View style={{
                    backgroundColor: app_theme.colors.background,
                    borderRadius: 12,
                    padding: 20,
                    marginBottom: 20,
                    borderWidth: 1,
                    borderColor: app_theme.colors.border,
                    shadowColor: app_theme.colors.border,
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 3,
                }}>
                    <View style={{ 
                        flexDirection: 'row', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        marginBottom: 16 
                    }}>
                        <TextBigYambi text={strings.version_history} bold />
                        <Pressable
                            onPress={() => setShowAllVersions(!showAllVersions)}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                backgroundColor: app_theme.colors.border,
                                borderRadius: 8,
                            }}
                        >
                            <TextNormalYambi 
                                text={showAllVersions ? strings.hide : strings.show} 
                                bold
                                styles={{ marginRight: 6 }}
                            />
                            <IconApp 
                                pack="FI" 
                                name={showAllVersions ? "chevron-up" : "chevron-down"} 
                                color={app_theme.colors.text} 
                                size={16} 
                            />
                        </Pressable>
                    </View>
                    
                    {loadingVersions ? (
                        <AppActivityIndicator />
                    ) : (
                        <ScrollView style={{ maxHeight: showAllVersions ? 300 : 'auto' }}>
                            {(showAllVersions ? versions : [versions[versions.length - 1]]).map((version, index) => {
                                const isLatest = version._id === versions[versions.length - 1]._id;
                                return (
                                    <View
                                        key={version._id || index}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            paddingVertical: 12,
                                            paddingHorizontal: 12,
                                            backgroundColor: isLatest ? app_theme.colors.high_color + '15' : app_theme.colors.border,
                                            borderRadius: 8,
                                            marginBottom: 8,
                                            borderWidth: isLatest ? 1.5 : 1,
                                            borderColor: isLatest ? app_theme.colors.high_color : app_theme.colors.border,
                                        }}
                                    >
                                        <View style={{ flex: 1 }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                                <TextNormalYambi 
                                                    text={`${version.app_version_name || ''}`} 
                                                    bold={isLatest}
                                                    styles={{ marginRight: 8 }}
                                                />
                                                {isLatest && (
                                                    <View style={{
                                                        backgroundColor: app_theme.colors.high_color,
                                                        paddingHorizontal: 8,
                                                        paddingVertical: 2,
                                                        borderRadius: 4,
                                                    }}>
                                                        <TextSmallYambiGray 
                                                            text={strings.latest}
                                                        />
                                                    </View>
                                                )}
                                            </View>
                                            <TextSmallYambiGray 
                                                text={`${strings.version} Code: ${version.app_version_code || ''}`} 
                                                styles={{ marginBottom: 2 }}
                                            />
                                            {version.createdAt && (
                                                <TextSmallYambiGray 
                                                    text={renderDateTime(version.createdAt, 3, true)} 
                                                    styles={{ fontSize: 11 }}
                                                />
                                            )}
                                        </View>
                                        <IconApp 
                                            pack="FA" 
                                            name={isLatest ? "check-circle" : "circle"} 
                                            color={isLatest ? app_theme.colors.high_color : app_theme.colors.gray} 
                                            size={20} 
                                        />
                                    </View>
                                );
                            })}
                        </ScrollView>
                    )}
                </View>
            )}

            {showAdsModal && (
                <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowAdsModal(false); }} singleButton title={strings.can_show_ads}>
                    <View style={{ paddingVertical: 10 }}>
                        <Pressable
                            onPress={() => {
                                setAppData({ ...appData, can_show_ads: 1 });
                                dispatch(setShowModalApp(false));
                                setShowAdsModal(false);
                            }}
                            style={{
                                paddingVertical: 16,
                                paddingHorizontal: 12,
                                borderBottomWidth: 1,
                                borderColor: app_theme.colors.border,
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}
                        >
                            <IconApp 
                                pack="FI" 
                                name={appData.can_show_ads === 1 ? "check-circle" : "circle"} 
                                color={appData.can_show_ads === 1 ? app_theme.colors.high_color : app_theme.colors.gray} 
                                size={20} 
                                styles={{ marginRight: 12 }} 
                            />
                            <TextNormalYambi text={strings.yes} bold={appData.can_show_ads === 1} />
                        </Pressable>
                        <Pressable
                            onPress={() => {
                                setAppData({ ...appData, can_show_ads: 0 });
                                dispatch(setShowModalApp(false));
                                setShowAdsModal(false);
                            }}
                            style={{
                                paddingVertical: 16,
                                paddingHorizontal: 12,
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}
                        >
                            <IconApp 
                                pack="FI" 
                                name={appData.can_show_ads === 0 ? "check-circle" : "circle"} 
                                color={appData.can_show_ads === 0 ? app_theme.colors.high_color : app_theme.colors.gray} 
                                size={20} 
                                styles={{ marginRight: 12 }} 
                            />
                            <TextNormalYambi text={strings.no} bold={appData.can_show_ads === 0} />
                        </Pressable>
                    </View>
                </ModalApp>
            )}

            {showPersonalizedAdsModal && (
                <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowPersonalizedAdsModal(false); }} singleButton title={strings.can_show_personalized_ads}>
                    <View style={{ paddingVertical: 10 }}>
                        <Pressable
                            onPress={() => {
                                setAppData({ ...appData, can_show_personalized_ads: 1 });
                                dispatch(setShowModalApp(false));
                                setShowPersonalizedAdsModal(false);
                            }}
                            style={{
                                paddingVertical: 16,
                                paddingHorizontal: 12,
                                borderBottomWidth: 1,
                                borderColor: app_theme.colors.border,
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}
                        >
                            <IconApp 
                                pack="FI" 
                                name={appData.can_show_personalized_ads === 1 ? "check-circle" : "circle"} 
                                color={appData.can_show_personalized_ads === 1 ? app_theme.colors.high_color : app_theme.colors.gray} 
                                size={20} 
                                styles={{ marginRight: 12 }} 
                            />
                            <TextNormalYambi text={strings.yes} bold={appData.can_show_personalized_ads === 1} />
                        </Pressable>
                        <Pressable
                            onPress={() => {
                                setAppData({ ...appData, can_show_personalized_ads: 0 });
                                dispatch(setShowModalApp(false));
                                setShowPersonalizedAdsModal(false);
                            }}
                            style={{
                                paddingVertical: 16,
                                paddingHorizontal: 12,
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}
                        >
                            <IconApp 
                                pack="FI" 
                                name={appData.can_show_personalized_ads === 0 ? "check-circle" : "circle"} 
                                color={appData.can_show_personalized_ads === 0 ? app_theme.colors.high_color : app_theme.colors.gray} 
                                size={20} 
                                styles={{ marginRight: 12 }} 
                            />
                            <TextNormalYambi text={strings.no} bold={appData.can_show_personalized_ads === 0} />
                        </Pressable>
                    </View>
                </ModalApp>
            )}

            {showAdTypeModal && (
                <ModalApp paddings={false} onClose={() => { dispatch(setShowModalApp(false)); setShowAdTypeModal(false); }} singleButton title={strings.select_ad_type}>
                    <ScrollView style={{ maxHeight: 400, paddingVertical: 0, paddingHorizontal:0 }}>
                        {adTypes.map((adType, index) => (
                            <Pressable 
                                key={adType.id}
                                onPress={() => {
                                    setAppData({ ...appData, type_main_ads: adType.id });
                                    dispatch(setShowModalApp(false));
                                    setShowAdTypeModal(false);
                                }}
                                style={{
                                    paddingVertical: 16,
                                    paddingHorizontal: 12,
                                    borderBottomWidth: index < adTypes.length - 1 ? 1 : 0,
                                    borderColor: app_theme.colors.border,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                }}>
                                <IconApp
                                    pack="FI" 
                                    name={appData.type_main_ads === adType.id ? "check-circle" : "circle"} 
                                    color={appData.type_main_ads === adType.id ? app_theme.colors.high_color : app_theme.colors.gray} 
                                    size={20} 
                                    styles={{ marginRight: 12 }} 
                                />
                                <TextNormalYambi text={adType.name} bold={appData.type_main_ads === adType.id} />
                            </Pressable>
                        ))}
                    </ScrollView>
                </ModalApp>
            )}

            {showUpdateRequiredModal && (
                <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowUpdateRequiredModal(false); }} singleButton title={strings.update_required}>
                    <View style={{ paddingVertical: 10 }}>
                        <Pressable
                            onPress={() => {
                                setAppData({ ...appData, update_required: 1 });
                                dispatch(setShowModalApp(false));
                                setShowUpdateRequiredModal(false);
                            }}
                            style={{
                                paddingVertical: 16,
                                paddingHorizontal: 12,
                                borderBottomWidth: 1,
                                borderColor: app_theme.colors.border,
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}
                        >
                            <IconApp 
                                pack="FI" 
                                name={appData.update_required === 1 ? "check-circle" : "circle"} 
                                color={appData.update_required === 1 ? app_theme.colors.high_color : app_theme.colors.gray} 
                                size={20} 
                                styles={{ marginRight: 12 }} 
                            />
                            <TextNormalYambi text={strings.yes} bold={appData.update_required === 1} />
                        </Pressable>
                        <Pressable
                            onPress={() => {
                                setAppData({ ...appData, update_required: 0 });
                                dispatch(setShowModalApp(false));
                                setShowUpdateRequiredModal(false);
                            }}
                            style={{
                                paddingVertical: 16,
                                paddingHorizontal: 12,
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}
                        >
                            <IconApp 
                                pack="FI" 
                                name={appData.update_required === 0 ? "check-circle" : "circle"} 
                                color={appData.update_required === 0 ? app_theme.colors.high_color : app_theme.colors.gray} 
                                size={20} 
                                styles={{ marginRight: 12 }} 
                            />
                            <TextNormalYambi text={strings.no} bold={appData.update_required === 0} />
                        </Pressable>
                    </View>
                </ModalApp>
            )}

            <View style={{
                backgroundColor: app_theme.colors.background,
                borderRadius: 12,
                padding: 20,
                marginBottom: 20,
                borderWidth: 1,
                borderColor: app_theme.colors.border,
                shadowColor: app_theme.colors.border,
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 3,
            }}>
                <TextBigYambi text={strings.app_data} bold styles={{ marginBottom: 20 }} />

                <View style={{ marginBottom: 20 }}>
                    <TextNormalYambiGray text={`${strings.version} Code`} styles={{ marginBottom: 8 }} />
                    <TextInput
                        value={appData.app_version_code}
                        onChangeText={v => setAppData({ ...appData, app_version_code: v })}
                        style={{
                            color: app_theme.colors.text,
                            backgroundColor: app_theme.colors.border,
                            paddingHorizontal: 15,
                            paddingVertical: 12,
                            borderRadius: 8,
                            fontSize: 15,
                        }}
                        placeholderTextColor={app_theme.colors.gray}
                    />
                </View>

                <View style={{ marginBottom: 20 }}>
                    <TextNormalYambiGray text={`${strings.version} Name`} styles={{ marginBottom: 8 }} />
                    <TextInput
                        value={appData.app_version_name}
                        onChangeText={v => setAppData({ ...appData, app_version_name: v })}
                        style={{
                            color: app_theme.colors.text,
                            backgroundColor: app_theme.colors.border,
                            paddingHorizontal: 15,
                            paddingVertical: 12,
                            borderRadius: 8,
                            fontSize: 15,
                        }}
                        placeholderTextColor={app_theme.colors.gray}
                    />
                </View>

                <Pressable 
                    onPress={() => { setShowAdsModal(true); dispatch(setShowModalApp(true)); }}
                    style={{ marginBottom: 20 }}
                >
                    <TextNormalYambiGray text={strings.can_show_ads} styles={{ marginBottom: 8 }} />
                    <View style={{
                        backgroundColor: app_theme.colors.border,
                        paddingHorizontal: 15,
                        paddingVertical: 14,
                        borderRadius: 8,
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}>
                        <TextNormalYambi text={appData.can_show_ads === 1 ? strings.yes : strings.no} bold />
                        <IconApp pack="FI" name="chevron-down" color={app_theme.colors.text} size={18} />
                    </View>
                </Pressable>

                <Pressable 
                    onPress={() => { setShowPersonalizedAdsModal(true); dispatch(setShowModalApp(true)); }}
                    style={{ marginBottom: 20 }}
                >
                    <TextNormalYambiGray text={strings.can_show_personalized_ads} styles={{ marginBottom: 8 }} />
                    <View style={{
                        backgroundColor: app_theme.colors.border,
                        paddingHorizontal: 15,
                        paddingVertical: 14,
                        borderRadius: 8,
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}>
                        <TextNormalYambi text={appData.can_show_personalized_ads === 1 ? strings.yes : strings.no} bold />
                        <IconApp pack="FI" name="chevron-down" color={app_theme.colors.text} size={18} />
                    </View>
                </Pressable>

                <Pressable 
                    onPress={() => { setShowAdTypeModal(true); dispatch(setShowModalApp(true)); }}
                    style={{ marginBottom: 20 }}
                >
                    <TextNormalYambiGray text={strings.type_main_ads} styles={{ marginBottom: 8 }} />
                    <View style={{
                        backgroundColor: app_theme.colors.border,
                        paddingHorizontal: 15,
                        paddingVertical: 14,
                        borderRadius: 8,
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}>
                        <TextNormalYambi 
                            text={adTypes.find(t => t.id === appData.type_main_ads)?.name || strings.select_ad_type} 
                            bold 
                        />
                        <IconApp pack="FI" name="chevron-down" color={app_theme.colors.text} size={18} />
                    </View>
                </Pressable>

                {/* Update Required Section */}
                <View style={{ marginBottom: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: app_theme.colors.border }}>
                    <TextBigYambi text={strings.update_settings} bold styles={{ marginBottom: 16 }} />
                    
                    <Pressable 
                        onPress={() => { setShowUpdateRequiredModal(true); dispatch(setShowModalApp(true)); }}
                        style={{ marginBottom: 20 }}
                    >
                        <TextNormalYambiGray text={strings.update_required} styles={{ marginBottom: 8 }} />
                        <View style={{
                            backgroundColor: app_theme.colors.border,
                            paddingHorizontal: 15,
                            paddingVertical: 14,
                            borderRadius: 8,
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}>
                            <TextNormalYambi text={appData.update_required === 1 ? strings.yes : strings.no} bold />
                            <IconApp pack="FI" name="chevron-down" color={app_theme.colors.text} size={18} />
                        </View>
                    </Pressable>

                    <View style={{ marginBottom: 20 }}>
                        <TextNormalYambiGray text={`${strings.update_device} (1 = Mobile)`} styles={{ marginBottom: 8 }} />
                        <TextInput
                            value={appData.update_device?.toString() || "1"}
                            onChangeText={v => setAppData({ ...appData, update_device: parseInt(v) || 1 })}
                            keyboardType="numeric"
                            style={{
                                color: app_theme.colors.text,
                                backgroundColor: app_theme.colors.border,
                                paddingHorizontal: 15,
                                paddingVertical: 12,
                                borderRadius: 8,
                                fontSize: 15,
                            }}
                            placeholderTextColor={app_theme.colors.gray}
                            placeholder="1"
                        />
                    </View>

                    <View style={{ marginBottom: 20 }}>
                        <TextNormalYambiGray text={strings.update_link} styles={{ marginBottom: 8 }} />
                        <TextInput
                            value={appData.update_link || ""}
                            onChangeText={v => setAppData({ ...appData, update_link: v })}
                            style={{
                                color: app_theme.colors.text,
                                backgroundColor: app_theme.colors.border,
                                paddingHorizontal: 15,
                                paddingVertical: 12,
                                borderRadius: 8,
                                fontSize: 15,
                            }}
                            placeholderTextColor={app_theme.colors.gray}
                            placeholder="https://play.google.com/store/apps/details?id=com.yambi.app"
                        />
                    </View>
                </View>

                <ButtonNormal
                    title={editing ? strings.loading : strings.continue}
                    onPress={handleEdit}
                    loadEnabled={true}
                    normal={true}
                    styles={{ marginTop: 10 }}
                />
            </View>
        </ScrollView>
    );
}
