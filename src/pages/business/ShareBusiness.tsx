import { useCallback, useMemo, useRef, useState } from 'react';
import {
    Alert,
    Image,
    InteractionManager,
    Platform,
    Pressable,
    ScrollView,
    Share,
    StyleSheet,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { captureRef } from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { QrCodeSvg } from 'react-native-qr-svg';

import StatusBarYambi from '../../components/app/StatusBar';
import ButtonNormal from '../../components/app/ButtonNormal';
import { YambiText } from '../../components/app/Text';
import { IconApp } from '../../components/app/IconApp';
import { useAppSelector } from '../../store/app/hooks';
import { RootStackParamList } from '../../types/types';
import { strings } from '../../lang/lang';
import { copyToClipboard } from '../../../GlobalVariables';

type Props = NativeStackScreenProps<RootStackParamList, 'ShareBusiness'>;

const QR_FRAME = 248;
const QR_LOGO_AREA = 50;
const QR_LOGO_SIZE = 35;

const ShareBusiness = ({ route }: Props) => {
    const { share_kind: shareKindParam, business_id, item_id } = route.params;
    const share_kind = shareKindParam ?? 'business';
    const theme = useAppSelector(state => state.app_theme);
    const insets = useSafeAreaInsets();
    const qrShotRef = useRef<View>(null);

    const publicUrl = useMemo(() => {
        if (share_kind === 'item' && item_id) {
            return `https://app.yambi.net/item/${item_id}`;
        }
        return `https://app.yambi.net/business/${business_id}`;
    }, [share_kind, item_id, business_id]);

    const [showCopied, setShowCopied] = useState(false);
    const [downloadingQr, setDownloadingQr] = useState(false);

    const flashCopied = useCallback(() => {
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
    }, []);

    const onCopyLink = useCallback(() => {
        copyToClipboard(publicUrl);
        flashCopied();
    }, [publicUrl, flashCopied]);

    const onLongPressLink = useCallback(() => {
        copyToClipboard(publicUrl);
        flashCopied();
    }, [publicUrl, flashCopied]);

    const onShareLink = useCallback(async () => {
        try {
            await Share.share(
                Platform.OS === 'ios'
                    ? { message: publicUrl, url: publicUrl }
                    : { message: publicUrl },
            );
        } catch {
            /* user dismissed sheet */
        }
    }, [publicUrl]);

    const onDownloadQrCode = useCallback(async () => {
        if (!qrShotRef.current) return;
        const cacheDir = FileSystem.cacheDirectory;
        if (!cacheDir) {
            Alert.alert(strings.error, strings.qr_code_share_failed);
            return;
        }

        setDownloadingQr(true);
        try {
            await new Promise<void>((resolve) =>
                InteractionManager.runAfterInteractions(() => requestAnimationFrame(() => resolve())),
            );
            await new Promise<void>((r) => setTimeout(r, 150));

            let base64: string;
            try {
                base64 = await captureRef(qrShotRef, {
                    format: 'png',
                    quality: 1,
                    result: 'base64',
                    ...(Platform.OS === 'ios' ? { useRenderInContext: true as const } : {}),
                });
            } catch {
                base64 = await captureRef(qrShotRef, {
                    format: 'png',
                    quality: 1,
                    result: 'base64',
                });
            }

            const slug =
                share_kind === 'item' && item_id ? `item-${item_id}` : `business-${business_id}`;
            const dest = `${cacheDir}yambi-${slug}-qr-${Date.now()}.png`;
            await FileSystem.writeAsStringAsync(dest, base64, {
                encoding: FileSystem.EncodingType.Base64,
            });

            if (!(await MediaLibrary.isAvailableAsync())) {
                Alert.alert(strings.error, strings.qr_code_share_failed);
                return;
            }

            let perm = await MediaLibrary.getPermissionsAsync(true);
            if (!perm.granted) {
                perm = await MediaLibrary.requestPermissionsAsync(true);
            }
            if (!perm.granted) {
                Alert.alert(strings.error, strings.gallery_permission_needed);
                return;
            }

            await MediaLibrary.saveToLibraryAsync(dest);
            Alert.alert(strings.success, strings.qr_saved_to_gallery);
        } catch {
            Alert.alert(strings.error, strings.qr_code_share_failed);
        } finally {
            setDownloadingQr(false);
        }
    }, [business_id, item_id, share_kind]);

    const qrBg = '#ffffff';
    const qrDots = '#111111';
    const cardShadow =
        Platform.OS === 'ios'
            ? {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.09,
                  shadowRadius: 20,
              }
            : { elevation: 8 };

    return (
        <View style={[styles.root, { backgroundColor: theme.colors.background, borderTopColor: theme.colors.border, borderTopWidth: 1 }]}>
            <StatusBarYambi />
            <ScrollView
                contentContainerStyle={{
                    paddingHorizontal: 22,
                    paddingTop: 20,
                    paddingBottom: Math.max(insets.bottom, 28) + 12,
                }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}>
                <YambiText
                    text={share_kind === 'item' ? strings.share_item_qr_intro : strings.share_business_qr_intro}
                    color="default"
                    size="big"
                    bold
                    style={{ marginBottom: 8 }}
                />
                <YambiText
                    text={share_kind === 'item' ? strings.share_item_qr_subtitle : strings.share_business_qr_subtitle}
                    color="gray"
                    size="small"
                    style={{ lineHeight: 22, marginBottom: 22 }}
                />

                <View style={[styles.qrCard, cardShadow, { backgroundColor: qrBg, borderColor: theme.colors.border }]}>
                    <View
                        ref={qrShotRef}
                        collapsable={false}
                        style={styles.qrInner}>
                        <QrCodeSvg
                            value={publicUrl}
                            frameSize={QR_FRAME}
                            contentCells={6}
                            errorCorrectionLevel="H"
                            backgroundColor={qrBg}
                            dotColor={qrDots}
                            contentStyle={{
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                            content={
                                <View style={styles.logoWrap}>
                                    <Image
                                        source={require('../../assets/logo.png')}
                                        style={{ width: QR_LOGO_SIZE, height: QR_LOGO_SIZE }}
                                        resizeMode="contain"
                                        accessibilityIgnoresInvertColors
                                    />
                                </View>
                            }
                        />
                    </View>
                </View>

                <ButtonNormal
                    title={strings.download_qr_code}
                    onPress={onDownloadQrCode}
                    normal
                    loadEnabled={false}
                    loading={downloadingQr}
                    disabled={downloadingQr}
                    iconPack="FI"
                    iconName="download"
                    iconSize={18}
                    styles={{ alignSelf: 'stretch', marginBottom: 30, marginTop: 30 }}
                />

                <View style={styles.sectionHeader}>
                    <IconApp pack="FI" name="link" size={18} color={theme.colors.high_color} styles={{ marginRight: 8 }} />
                    <YambiText text={strings.share_business_public_link} color="high" size="normal" bold />
                </View>

                <Pressable
                    onLongPress={onLongPressLink}
                    delayLongPress={350}
                    style={({ pressed }) => [
                        styles.linkCard,
                        {
                            borderColor: theme.colors.border,
                            backgroundColor: pressed ? theme.colors.border + '40' : theme.colors.modal_background || theme.colors.background,
                        },
                    ]}>
                    <YambiText
                        text={publicUrl}
                        color="high"
                        size="small"
                        style={{ textAlign: 'center', lineHeight: 22 }}
                    />
                </Pressable>

                {/* <YambiText
                    text={strings.share_business_long_press_hint}
                    color="gray"
                    size="xsmall"
                    style={{ textAlign: 'center', marginTop: 10, marginBottom: 12 }}
                /> */}

                <View style={styles.copiedSlot}>
                    {showCopied ? (
                        <View style={[styles.copiedPill, { backgroundColor: theme.colors.high_color + '22' }]}>
                            <IconApp pack="FI" name="check" size={14} color={theme.colors.high_color} styles={{ marginRight: 6 }} />
                            <YambiText text={strings.link_copied} color="high" size="small" bold />
                        </View>
                    ) : null}
                </View>

                <View style={styles.actionsRow}>
                    <View style={styles.actionHalf}>
                        <ButtonNormal
                            title={strings.copy_link}
                            onPress={onCopyLink}
                            outline
                            loadEnabled={false}
                            iconPack="FI"
                            iconName="copy"
                            iconSize={16}
                        />
                    </View>
                    <View style={styles.actionHalf}>
                        <ButtonNormal
                            title={strings.share_link}
                            onPress={onShareLink}
                            normal
                            loadEnabled={false}
                            iconPack="FI"
                            iconName="share-2"
                            iconSize={16}
                        />
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    root: {
        flex: 1,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    qrCard: {
        alignSelf: 'center',
        borderRadius: 22,
        borderWidth: StyleSheet.hairlineWidth,
        padding: 18,
        marginBottom: 8,
    },
    qrInner: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoWrap: {
        width: QR_LOGO_AREA,
        height: QR_LOGO_AREA,
        maxWidth: '100%',
        maxHeight: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    linkCard: {
        alignSelf: 'stretch',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderRadius: 14,
        borderWidth: StyleSheet.hairlineWidth,
    },
    copiedSlot: {
        minHeight: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    copiedPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 12,
        alignSelf: 'stretch',
    },
    actionHalf: {
        flex: 1,
    },
});

export default ShareBusiness;
