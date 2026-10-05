import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, View, Linking, Platform } from "react-native";
import * as Haptics from "expo-haptics";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import RNFS from "react-native-fs";
import { TMessage } from "../../../types/types";
import { useAppSelector } from "../../../store/app/hooks";
import { useRealm } from "@realm/react";
import axios from "axios";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { YambiText } from "../../app/Text";
import { strings } from "../../../lang/lang";
import ENG from "../../../lang/locales/en.json";
import FRC from "../../../lang/locales/fr.json";
import SW_CD from "../../../lang/locales/swcd.json";
import { remote_host, SocketApp, media_url } from "../../../../GlobalVariables";

const formatFileSize = (bytes: number) => {
    if (bytes <= 0) return '';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const getFileIconName = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (ext === 'pdf') return { icon: 'file-pdf-box', color: '#E53935' };
    if (['doc', 'docx', 'odt'].includes(ext)) return { icon: 'file-word-box', color: '#1E88E5' };
    if (['xls', 'xlsx', 'csv', 'ods'].includes(ext)) return { icon: 'file-excel-box', color: '#43A047' };
    if (['ppt', 'pptx', 'odp'].includes(ext)) return { icon: 'file-powerpoint-box', color: '#FB8C00' };
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return { icon: 'zip-box', color: '#8E24AA' };
    return { icon: 'file-document-outline', color: '#757575' };
};

const getFileMimeType = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    switch (ext) {
        case 'pdf': return 'application/pdf';
        case 'doc': return 'application/msword';
        case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        case 'xls': return 'application/vnd.ms-excel';
        case 'xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        case 'ppt': return 'application/vnd.ms-powerpoint';
        case 'pptx': return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        case 'txt': return 'text/plain';
        case 'csv': return 'text/csv';
        case 'zip': return 'application/zip';
        case 'rar': return 'application/x-rar-compressed';
        case '7z': return 'application/x-7z-compressed';
        case 'tar': return 'application/x-tar';
        case 'gz': return 'application/gzip';
        case 'json': return 'application/json';
        case 'jpg':
        case 'jpeg': return 'image/jpeg';
        case 'png': return 'image/png';
        default: return 'application/octet-stream';
    }
};

const getFileUTI = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    switch (ext) {
        case 'pdf': return 'com.adobe.pdf';
        case 'doc': return 'com.microsoft.word.doc';
        case 'docx': return 'org.openxmlformats.wordprocessingml.document';
        case 'xls': return 'com.microsoft.excel.xls';
        case 'xlsx': return 'org.openxmlformats.spreadsheetml.sheet';
        case 'ppt': return 'com.microsoft.powerpoint.ppt';
        case 'pptx': return 'org.openxmlformats.presentationml.presentation';
        case 'txt': return 'public.plain-text';
        case 'json': return 'public.json';
        case 'zip': return 'public.zip-archive';
        default: return 'public.data';
    }
};

const getCleanFileName = (mainText: string, caption?: string) => {
    if (caption) {
        const cleanedCaption = caption.replace(/\s*\([^)]*\)\s*$/, '').trim();
        if (cleanedCaption && cleanedCaption.includes('.')) {
            const ext = cleanedCaption.split('.').pop();
            if (ext && ext.length <= 6) {
                return cleanedCaption;
            }
        }
    }
    let base = mainText.split('/').pop() || 'document.pdf';
    base = base.split('?')[0];
    const hasExt = base.includes('.') && (base.split('.').pop()?.length || 0) <= 6;
    if (hasExt) return base;

    return `${base}.pdf`;
};

const DOCUMENTS_DIR = `${FileSystem.documentDirectory}YambiDownloadedDocuments`;

const ensureDocumentDirExists = async () => {
    try {
        const dirInfo = await FileSystem.getInfoAsync(DOCUMENTS_DIR);
        if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(DOCUMENTS_DIR, { intermediates: true });
        }
    } catch (e) { }
    return DOCUMENTS_DIR;
};

const documentSizeCacheMap = new Map<string, string>();

const DocumentMessageItem = ({ message }: { message: TMessage }) => {
    const user_data = useAppSelector(state => state.user_data);
    const app_theme = useAppSelector(state => state.app_theme);
    const lang = useAppSelector(state => state.persisted_app.langApp);
    const realm = useRealm();

    const [uploading, setUploading] = useState<boolean>(false);
    const [downloading, setDownloading] = useState<boolean>(false);
    const [isDownloaded, setIsDownloaded] = useState<boolean>(false);
    const [localFilePath, setLocalFilePath] = useState<string>('');
    const [fileSizeStr, setFileSizeStr] = useState<string>(() => message.main_text_message ? documentSizeCacheMap.get(message.main_text_message) || '' : '');

    const getI18nText = (key: string, fallback: string): string => {
        const localized = (strings as any)[key];
        if (localized && typeof localized === 'string' && localized.trim() !== '') {
            return localized;
        }
        const currentLang = (lang || strings.getLanguage() || 'fr').toLowerCase();
        if (currentLang.startsWith('fr')) {
            return (FRC as any)[key] || fallback;
        }
        if (currentLang.startsWith('sw')) {
            return (SW_CD as any)[key] || fallback;
        }
        return (ENG as any)[key] || fallback;
    };

    // Check if document exists locally in YambiDownloadedDocuments or on device
    useEffect(() => {
        let isMounted = true;

        const checkLocalDocument = async () => {
            const raw = message.main_text_message;
            if (!raw) return;

            await ensureDocumentDirExists();

            // 1. If it's a local uri (pending upload or local device path)
            if (raw.startsWith('file://') || raw.startsWith('/data/') || raw.startsWith('/storage/') || raw.startsWith('content://')) {
                try {
                    const info = await FileSystem.getInfoAsync(raw);
                    if (info.exists) {
                        if (isMounted) {
                            setLocalFilePath(raw);
                            setIsDownloaded(true);
                            if (info.size && info.size > 0) {
                                const formatted = formatFileSize(info.size);
                                documentSizeCacheMap.set(raw, formatted);
                                setFileSizeStr(formatted);
                            }
                        }
                        return;
                    }
                } catch (e) { }

                if (isMounted) {
                    setLocalFilePath(raw);
                    setIsDownloaded(true);
                }
                return;
            }

            // 2. If it's a remote file name, check in YambiDownloadedDocuments
            const serverFileName = raw.split('/').pop()?.split('?')[0] || '';
            const cleanName = getCleanFileName(raw, message.caption);

            const candidatePaths = [
                `${DOCUMENTS_DIR}/${serverFileName}`,
                `${DOCUMENTS_DIR}/${cleanName}`,
                `${RNFS.DocumentDirectoryPath}/YambiDownloadedDocuments/${serverFileName}`,
                `${RNFS.DocumentDirectoryPath}/YambiDownloadedDocuments/${cleanName}`
            ];

            for (const cPath of candidatePaths) {
                try {
                    const info = await FileSystem.getInfoAsync(cPath);
                    if (info.exists && info.size && info.size > 0) {
                        if (isMounted) {
                            setLocalFilePath(cPath);
                            setIsDownloaded(true);
                            const formatted = formatFileSize(info.size);
                            documentSizeCacheMap.set(raw, formatted);
                            setFileSizeStr(formatted);
                        }
                        return;
                    }
                } catch (e) { }
            }

            if (isMounted) {
                setLocalFilePath(`${DOCUMENTS_DIR}/${serverFileName}`);
                setIsDownloaded(false);
            }
        };

        checkLocalDocument();

        return () => { isMounted = false; };
    }, [message.main_text_message, message.message_read]);

    const upload_document = async () => {
        setUploading(true);

        const fileName = getCleanFileName(message.main_text_message, message.caption);
        const mimeType = getFileMimeType(fileName);
        const base_url = remote_host + "/yambi/API/upload_document";

        const formData = new FormData();
        formData.append('document', {
            type: mimeType,
            uri: message.main_text_message,
            name: fileName
        } as any);

        try {
            const response = await axios.post(base_url, formData, {
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'multipart/form-data'
                }
            });

            const isSuccess = response.data && (response.data.message === "1" || parseInt(response.data.message) === 1) && response.data.file_name;

            if (isSuccess) {
                const serverFileName = response.data.file_name;

                // Copy original sent file into YambiDownloadedDocuments so sender can read it locally without re-downloading
                try {
                    await ensureDocumentDirExists();
                    const destPath = `${DOCUMENTS_DIR}/${serverFileName}`;
                    const sourceUri = message.main_text_message;

                    await FileSystem.copyAsync({
                        from: sourceUri,
                        to: destPath
                    });

                    // Also copy under clean name for extra compatibility
                    const cleanDestPath = `${DOCUMENTS_DIR}/${fileName}`;
                    await FileSystem.copyAsync({
                        from: sourceUri,
                        to: cleanDestPath
                    }).catch(() => {});

                    setLocalFilePath(destPath);
                    setIsDownloaded(true);
                } catch (copyErr) { }

                sendMessage(serverFileName);
            }
        } catch (error) { } finally {
            setUploading(false);
        }
    };

    const sendMessage = (text: string) => {
        if (message.main_text_message !== "") {
            Haptics.selectionAsync();

            const msg: TMessage = {
                sender: message.sender,
                receiver: message.receiver,
                main_text_message: text,
                caption: message.caption,
                message_type: 3,
                reactions: message.reactions,
                response_to: message.response_to,
                message_read: 0,
                read_once: message.read_once,
                message_effect: message.message_effect,
                flag: message.flag,
                token: message.token,
                deleted: message.deleted,
                platform: message.platform,
                createdAt: message.createdAt,
                receivedAt: message.receivedAt,
                readAt: message.readAt,
                playedAt: message.playedAt,
                cc: message.cc,
                alignment: message.alignment
            };

            realm.write(() => {
                try {
                    realm.create('UsersMessages', msg, true);
                } catch (error) { }
            });

            SocketApp.emit('newMessage', msg);
        }
    };

    useEffect(() => {
        if (message.message_read === 5 && message.sender === user_data.phone_number) {
            const timeout = setTimeout(() => {
                upload_document();
            }, 200);
            return () => clearTimeout(timeout);
        }
    }, []);

    const downloadRemoteDocument = async (): Promise<string | null> => {
        setDownloading(true);

        try {
            await ensureDocumentDirExists();

            const raw = message.main_text_message || '';
            const serverFileName = raw.split('/').pop()?.split('?')[0] || '';

            if (!serverFileName) {
                return null;
            }

            const targetPath = `${DOCUMENTS_DIR}/${serverFileName}`;

            const urlsToTry: string[] = [];
            if (raw.startsWith('http://') || raw.startsWith('https://')) {
                urlsToTry.push(raw);
            } else {
                urlsToTry.push(`${media_url}/document_messages/${serverFileName}`);
                urlsToTry.push(`${remote_host}/media/document_messages/${serverFileName}`);
                urlsToTry.push(`${media_url}/picture_messages/${serverFileName}`);
            }

            for (const url of urlsToTry) {
                try {
                    const existingInfo = await FileSystem.getInfoAsync(targetPath);
                    if (existingInfo.exists) {
                        await FileSystem.deleteAsync(targetPath, { idempotent: true }).catch(() => {});
                    }

                    const res = await FileSystem.downloadAsync(url, targetPath);

                    if (res.status === 200) {
                        const fileInfo = await FileSystem.getInfoAsync(targetPath);

                        if (fileInfo.exists && fileInfo.size && fileInfo.size > 0) {
                            setLocalFilePath(targetPath);
                            setIsDownloaded(true);
                            const formatted = formatFileSize(fileInfo.size);
                            documentSizeCacheMap.set(raw, formatted);
                            setFileSizeStr(formatted);
                            return targetPath;
                        }
                    }

                    await FileSystem.deleteAsync(targetPath, { idempotent: true }).catch(() => {});
                } catch (urlErr) {
                    await FileSystem.deleteAsync(targetPath, { idempotent: true }).catch(() => {});
                }
            }

            return null;
        } catch (fatalErr) {
            return null;
        } finally {
            setDownloading(false);
        }
    };

    const openDocumentInSystemReader = async () => {
        Haptics.selectionAsync();

        let pathToOpen = localFilePath;

        // Check if the file really exists locally on disk
        let fileExistsLocally = false;
        if (isDownloaded && pathToOpen) {
            try {
                if (pathToOpen.startsWith('content://')) {
                    fileExistsLocally = true;
                } else {
                    const info = await FileSystem.getInfoAsync(pathToOpen);
                    fileExistsLocally = info.exists && (info.size ?? 0) > 0;
                }
            } catch (e) {
                fileExistsLocally = false;
            }
        }

        // If not present locally on device, download from server first
        if (!fileExistsLocally) {
            const downloadedPath = await downloadRemoteDocument();
            if (!downloadedPath) {
                return;
            }
            pathToOpen = downloadedPath;
        }

        try {
            const displayName = message.caption || message.main_text_message.split('/').pop() || 'Document';
            const friendlyName = getCleanFileName(pathToOpen, message.caption);
            const mimeType = getFileMimeType(friendlyName);
            const uti = getFileUTI(friendlyName);

            // Copy to cache with friendly name so system readers show the proper document title
            let fileUriToShare = pathToOpen;
            if (!pathToOpen.startsWith('content://')) {
                const tempCachePath = `${FileSystem.cacheDirectory}${friendlyName}`;
                try {
                    await FileSystem.copyAsync({
                        from: pathToOpen,
                        to: tempCachePath
                    });
                    fileUriToShare = tempCachePath;
                } catch (copyErr) {
                    fileUriToShare = pathToOpen;
                }
            }

            // Primary: expo-sharing (opens native system viewer / open-with with proper MIME type and permissions)
            const sharingAvailable = await Sharing.isAvailableAsync();

            if (sharingAvailable && !fileUriToShare.startsWith('content://')) {
                await Sharing.shareAsync(fileUriToShare, {
                    mimeType: mimeType,
                    dialogTitle: displayName,
                    UTI: uti
                });
                return;
            }

            // Fallback for content:// or when Sharing is not available
            let linkUri = fileUriToShare;
            if (Platform.OS === 'android' && !linkUri.startsWith('content://')) {
                try {
                    const contentUri = await FileSystem.getContentUriAsync(linkUri);
                    if (contentUri) {
                        linkUri = contentUri;
                    }
                } catch (cErr) { }
            }

            await Linking.openURL(linkUri);
        } catch (err) { }
    };

    const displayName = message.caption || message.main_text_message.split('/').pop() || 'Document';
    const iconInfo = getFileIconName(displayName);

    const isPendingSender = message.message_read === 5 && message.sender === user_data.phone_number;

    const handlePress = () => {
        if (isPendingSender && !uploading) {
            upload_document();
        } else {
            openDocumentInSystemReader();
        }
    };

    let statusText = '';
    if (uploading) {
        statusText = getI18nText('uploading', 'Uploading...');
    } else if (isPendingSender) {
        statusText = getI18nText('pending_tap_to_retry', 'Pending • Tap to retry');
    } else if (downloading) {
        statusText = getI18nText('downloading', 'Downloading...');
    } else if (!isDownloaded) {
        const tapText = getI18nText('tap_to_download', 'Tap to download');
        statusText = fileSizeStr ? `${fileSizeStr} • ${tapText}` : tapText;
    } else {
        const openText = getI18nText('open_in_reader', 'Open');
        statusText = fileSizeStr ? `${fileSizeStr} • ${openText}` : openText;
    }

    return (
        <Pressable
            onPress={handlePress}
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: app_theme.colors.card,
                padding: 10,
                borderRadius: 7,
                marginVertical: 4,
                borderWidth: 1,
                borderColor: app_theme.colors.border,
                width: 235
            }}
        >
            <MaterialCommunityIcons name={iconInfo.icon as any} size={38} color={iconInfo.color} />
            <View style={{ flex: 1, marginLeft: 10, marginRight: 6 }}>
                <YambiText text={displayName} size="normal" color="default" bold numberLines={1} />
                <YambiText
                    text={statusText}
                    size="small"
                    color={isPendingSender && !uploading ? "high" : !isDownloaded ? "high" : "gray"}
                    style={{ marginTop: 2 }}
                />
            </View>
            {uploading || downloading ? (
                <ActivityIndicator size="small" color={app_theme.colors.high_color} />
            ) : isPendingSender ? (
                <MaterialCommunityIcons name="cloud-upload-outline" size={20} color={app_theme.colors.high_color} />
            ) : !isDownloaded ? (
                <MaterialCommunityIcons name="arrow-down-circle-outline" size={22} color={app_theme.colors.high_color} />
            ) : (
                <MaterialCommunityIcons name="open-in-new" size={20} color={app_theme.colors.gray} />
            )}
        </Pressable>
    );
};

export default DocumentMessageItem;
