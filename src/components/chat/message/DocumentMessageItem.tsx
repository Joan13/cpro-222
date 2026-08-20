import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, View, Linking, Platform } from "react-native";
import * as Haptics from "expo-haptics";
import * as FileSystem from "expo-file-system/legacy";
import RNFS from "react-native-fs";
import { TMessage } from "../../../types/types";
import { useAppSelector } from "../../../store/app/hooks";
import { useRealm } from "@realm/react";
import axios from "axios";
import moment from "moment";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { YambiText } from "../../app/Text";
import { strings } from "../../../lang/lang";
import { randomString, remote_host, renderDateUpToMilliseconds, SocketApp, media_url } from "../../../../GlobalVariables";

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

const getCleanFileName = (mainText: string, caption?: string) => {
    let base = mainText.split('/').pop() || 'document.pdf';
    const hasExt = base.includes('.') && (base.split('.').pop()?.length || 0) <= 5;
    if (hasExt) return base;

    if (caption) {
        const firstWord = caption.split(' ')[0] || '';
        const capExt = firstWord.includes('.') ? firstWord.split('.').pop() : '';
        if (capExt && capExt.length <= 5) {
            return `${base}.${capExt}`;
        }
    }
    return `${base}.pdf`;
};

const documentSizeCacheMap = new Map<string, string>();

const DocumentMessageItem = ({ message }: { message: TMessage }) => {
    const user_data = useAppSelector(state => state.user_data);
    const app_theme = useAppSelector(state => state.app_theme);
    const realm = useRealm();

    const [uploading, setUploading] = useState<boolean>(false);
    const [downloading, setDownloading] = useState<boolean>(false);
    const [fileSizeStr, setFileSizeStr] = useState<string>(() => message.main_text_message ? documentSizeCacheMap.get(message.main_text_message) || '' : '');

    useEffect(() => {
        let isMounted = true;
        const checkSize = async () => {
            if (!message.main_text_message) return;
            if (documentSizeCacheMap.has(message.main_text_message)) {
                setFileSizeStr(documentSizeCacheMap.get(message.main_text_message)!);
                return;
            }
            if (message.main_text_message.startsWith('file://') || message.main_text_message.startsWith('/storage/') || message.main_text_message.startsWith('/data/')) {
                try {
                    const fileStat = await RNFS.stat(message.main_text_message);
                    if (isMounted && fileStat && fileStat.size) {
                        const formatted = formatFileSize(fileStat.size);
                        documentSizeCacheMap.set(message.main_text_message, formatted);
                        setFileSizeStr(formatted);
                    }
                } catch (e) { }
            }
        };
        checkSize();
        return () => { isMounted = false; };
    }, [message.main_text_message]);

    const upload_document = async () => {
        setUploading(true);

        const fileName = message.main_text_message.split('/').pop() || 'document';
        let base_url = remote_host + "/yambi/API/upload_document";
        let formData = new FormData();
        formData.append('document', {
            type: 'application/octet-stream',
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

            if (response.data && response.data.file_name) {
                sendMessage(response.data.file_name);
                setUploading(false);
            } else {
                upload_document_fallback();
            }
        } catch (error) {
            upload_document_fallback();
        }
    };

    const upload_document_fallback = async () => {
        const fileName = message.main_text_message.split('/').pop() || 'document';
        let base_url = remote_host + "/yambi/API/upload_picture";
        let formData = new FormData();
        formData.append('image', {
            type: 'application/octet-stream',
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
            if (response.data && response.data.file_name) {
                sendMessage(response.data.file_name);
            }
        } catch (e) {
        } finally {
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

    const downloadRemoteFile = async (remoteFileName: string, targetPath: string): Promise<boolean> => {
        const urlsToTry = [
            `${media_url}/document_messages/${remoteFileName}`,
            `${media_url}/picture_messages/${remoteFileName}`
        ];

        for (const url of urlsToTry) {
            try {
                const exists = await RNFS.exists(targetPath);
                if (exists) {
                    await RNFS.unlink(targetPath).catch(() => {});
                }

                const res = await RNFS.downloadFile({
                    fromUrl: url,
                    toFile: targetPath
                }).promise;

                if (res.statusCode === 200) {
                    const stat = await RNFS.stat(targetPath);
                    if (stat && stat.size > 0) {
                        return true;
                    }
                }
                await RNFS.unlink(targetPath).catch(() => {});
            } catch (e) {
                await RNFS.unlink(targetPath).catch(() => {});
            }
        }
        return false;
    };

    const openDocumentInSystemReader = async () => {
        Haptics.selectionAsync();

        let rawPath = message.main_text_message;
        if (!rawPath) return;

        try {
            let localPath = rawPath;

            // 1. Handle content:// URIs by copying to cache directory
            if (rawPath.startsWith('content://')) {
                const fileName = getCleanFileName(rawPath, message.caption);
                const cachePath = `${RNFS.CachesDirectoryPath}/${fileName}`;
                try {
                    const cacheExists = await RNFS.exists(cachePath);
                    if (!cacheExists) {
                        await RNFS.copyFile(rawPath, cachePath);
                    }
                    localPath = cachePath;
                } catch (e) {
                    localPath = rawPath;
                }
            }

            const isRemote = !localPath.startsWith('file://') && !localPath.startsWith('/storage/') && !localPath.startsWith('/data/') && !localPath.startsWith('content://');

            if (isRemote) {
                const fileName = getCleanFileName(localPath, message.caption);
                const targetDir = `${RNFS.DocumentDirectoryPath}/YambiDownloadedDocuments`;
                await RNFS.mkdir(targetDir).catch(() => {});
                const cachedFilePath = `${targetDir}/${fileName}`;

                let fileReady = false;
                const fileExists = await RNFS.exists(cachedFilePath);
                if (fileExists) {
                    const stat = await RNFS.stat(cachedFilePath).catch(() => null);
                    if (stat && stat.size > 0) {
                        fileReady = true;
                        localPath = cachedFilePath;
                    }
                }

                if (!fileReady) {
                    setDownloading(true);
                    const success = await downloadRemoteFile(localPath, cachedFilePath);
                    setDownloading(false);
                    if (success) {
                        localPath = cachedFilePath;
                    } else {
                        console.error('Failed to download remote document file.');
                        return;
                    }
                }
            }

            // 2. Ensure file:// scheme for local files
            let fileUri = localPath;
            if (!fileUri.startsWith('file://') && !fileUri.startsWith('content://') && !fileUri.startsWith('http://') && !fileUri.startsWith('https://')) {
                fileUri = 'file://' + (fileUri.startsWith('/') ? fileUri : '/' + fileUri);
            }

            // If content:// URI, open directly
            if (fileUri.startsWith('content://')) {
                await Linking.openURL(fileUri);
                return;
            }

            // On Android, convert file:// URI to content:// URI using legacy FileSystem (FileProvider)
            if (Platform.OS === 'android') {
                try {
                    const contentUri = await FileSystem.getContentUriAsync(fileUri);
                    if (contentUri) {
                        await Linking.openURL(contentUri);
                        return;
                    }
                } catch (err) {
                    console.log('getContentUriAsync error:', err);
                }
            }

            await Linking.openURL(fileUri);
        } catch (err) {
            console.error('Error opening document in system reader:', err);
            setDownloading(false);
        }
    };

    const displayName = message.caption || message.main_text_message.split('/').pop() || 'Document';
    const iconInfo = getFileIconName(displayName);

    return (
        <Pressable
            onPress={openDocumentInSystemReader}
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
                    text={
                        uploading
                            ? ((strings as any).uploading || "Uploading...")
                            : downloading
                            ? (strings.downloading || "Downloading...")
                            : fileSizeStr
                            ? `${fileSizeStr} • ${(strings as any).open_in_reader || "Open in reader"}`
                            : `${(strings as any).document_file || "Document"} • ${(strings as any).open_in_reader || "Open in reader"}`
                    }
                    size="small"
                    color="gray"
                    style={{ marginTop: 2 }}
                />
            </View>
            {uploading || downloading ? (
                <ActivityIndicator size="small" color={app_theme.colors.high_color} />
            ) : (
                <MaterialCommunityIcons name="open-in-new" size={20} color={app_theme.colors.gray} />
            )}
        </Pressable>
    );
};

export default DocumentMessageItem;
