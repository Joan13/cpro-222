import React, { useEffect, useState } from 'react';
import {
    View,
    Pressable,
    FlatList,
    TextInput,
    ActivityIndicator,
    Platform
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as DocumentPicker from 'expo-document-picker';
import { NavProps, TChat, TMessage } from '../../types/types';
import { useAppDispatch, useAppSelector } from '../../store/app/hooks';
import { useRealm } from '@realm/react';
import moment from 'moment';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { YambiText } from '../app/Text';
import { randomString, renderDateUpToMilliseconds } from '../../../GlobalVariables';
import { setResponseTo } from '../../store/reducers/appSlice';
import { strings } from '../../lang/lang';

export interface DocItem {
    name: string;
    path: string;
    size: number;
    extension: string;
    mimeType?: string;
}

const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const getFileIcon = (ext: string, color: string) => {
    const e = ext.toLowerCase();
    if (e === 'pdf') {
        return <MaterialCommunityIcons name="file-pdf-box" size={36} color="#E53935" />;
    } else if (['doc', 'docx', 'odt'].includes(e)) {
        return <MaterialCommunityIcons name="file-word-box" size={36} color="#1E88E5" />;
    } else if (['xls', 'xlsx', 'csv', 'ods'].includes(e)) {
        return <MaterialCommunityIcons name="file-excel-box" size={36} color="#43A047" />;
    } else if (['ppt', 'pptx', 'odp'].includes(e)) {
        return <MaterialCommunityIcons name="file-powerpoint-box" size={36} color="#FB8C00" />;
    } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(e)) {
        return <MaterialCommunityIcons name="zip-box" size={36} color="#8E24AA" />;
    } else if (e === 'txt') {
        return <MaterialCommunityIcons name="file-document-outline" size={36} color={color} />;
    }
    return <MaterialCommunityIcons name="file-outline" size={36} color={color} />;
};

const SendDocument = ({ navigation, route }: NavProps) => {
    const { user } = route.params;
    const dispatch = useAppDispatch();
    const user_data = useAppSelector(state => state.user_data);
    const app_theme = useAppSelector(state => state.app_theme);
    const response_to = useAppSelector(state => state.app.response_to);
    const realm = useRealm();

    const [documents, setDocuments] = useState<DocItem[]>([]);
    const [selectedDocs, setSelectedDocs] = useState<DocItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [caption, setCaption] = useState('');
    const [loading, setLoading] = useState(false);

    const pickDocumentWithExpo = async () => {
        try {
            setLoading(true);
            Haptics.selectionAsync();
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                multiple: true,
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const picked: DocItem[] = result.assets.map(asset => ({
                    name: asset.name,
                    path: asset.uri,
                    size: asset.size || 0,
                    extension: asset.name.split('.').pop()?.toLowerCase() || '',
                    mimeType: asset.mimeType || ''
                }));

                setDocuments(prev => {
                    const combined = [...picked, ...prev];
                    return combined.filter((v, i, a) => a.findIndex(t => t.path === v.path) === i);
                });

                setSelectedDocs(prev => {
                    const combined = [...prev, ...picked];
                    return combined.filter((v, i, a) => a.findIndex(t => t.path === v.path) === i);
                });
            }
        } catch (err) {
            console.error('DocumentPicker Error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Automatically trigger native document picker on screen open
    useEffect(() => {
        pickDocumentWithExpo();
    }, []);

    const toggleSelectDoc = (doc: DocItem) => {
        Haptics.selectionAsync();
        const exists = selectedDocs.some(d => d.path === doc.path);
        if (exists) {
            setSelectedDocs(prev => prev.filter(d => d.path !== doc.path));
        } else {
            setSelectedDocs(prev => [...prev, doc]);
        }
    };

    const sendSelectedDocuments = () => {
        if (selectedDocs.length === 0) return;
        Haptics.selectionAsync();

        const time = moment(new Date()).format();

        selectedDocs.forEach(doc => {
            const token = randomString(30) + renderDateUpToMilliseconds();

            const msg: TMessage = {
                sender: user_data.phone_number,
                receiver: user,
                main_text_message: doc.path,
                caption: caption.trim() !== '' ? `${caption.trim()} (${formatFileSize(doc.size)})` : `${doc.name} (${formatFileSize(doc.size)})`,
                message_type: 3, // Document
                reactions: '[]',
                response_to: response_to,
                message_read: 5, // Pending upload
                message_effect: 0,
                read_once: 0,
                flag: 0,
                token: token,
                deleted: 0,
                platform: Platform.OS,
                createdAt: time,
                receivedAt: '',
                readAt: '',
                playedAt: '',
                cc: moment(time).format('DD/MM/YYYY'),
                alignment: moment().utc().toISOString()
            };

            const chat: TChat = {
                _id: user,
                phone_number: user,
                type_chat: 0,
                last_message: token,
                user: user_data.phone_number,
                flag: 0,
                chat_read: 0,
                deleted: 0,
                chat_effect: 0,
                createdAt: time,
                updatedAt: time,
            };

            realm.write(() => {
                try {
                    realm.create('UsersMessages', msg);
                    realm.create('UserChats', chat, true);
                } catch (error) { }
            });
        });

        dispatch(setResponseTo(""));
        navigation.goBack();
    };

    const filteredDocs = documents.filter(d =>
        d.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <View style={{ flex: 1, backgroundColor: app_theme.colors.background }}>
            {/* Header with Search and Pick More Button */}
            <View style={{
                paddingHorizontal: 15,
                paddingVertical: 10,
                backgroundColor: app_theme.colors.card,
                borderBottomWidth: 1,
                borderColor: app_theme.colors.border
            }}>
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: app_theme.colors.background,
                    borderRadius: 8,
                    paddingHorizontal: 10,
                    height: 40,
                    marginBottom: 8
                }}>
                    <Ionicons name="search" size={18} color={app_theme.colors.gray} style={{ marginRight: 8 }} />
                    <TextInput
                        placeholder={(strings as any).search_documents || strings.search || "Search documents..."}
                        placeholderTextColor={app_theme.colors.gray}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        style={{ flex: 1, color: app_theme.colors.text, fontSize: 14 }}
                    />
                    {searchQuery !== '' && (
                        <Pressable onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={18} color={app_theme.colors.gray} />
                        </Pressable>
                    )}
                </View>

                {/* Button to pick more files */}
                <Pressable
                    onPress={pickDocumentWithExpo}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: app_theme.colors.high_color + '20',
                        borderWidth: 1,
                        borderColor: app_theme.colors.high_color + '40',
                        borderRadius: 8,
                        paddingVertical: 8,
                        paddingHorizontal: 12
                    }}
                >
                    <MaterialCommunityIcons name="folder-open-outline" size={20} color={app_theme.colors.high_color} style={{ marginRight: 6 }} />
                    <YambiText text={(strings as any).browse_files || "Browse Files"} size="normal" color="high" bold />
                </Pressable>
            </View>

            {/* Document List */}
            {loading && documents.length === 0 ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={app_theme.colors.high_color} />
                    <YambiText text={strings.loading || "Opening document picker..."} size="small" color="gray" style={{ marginTop: 10 }} />
                </View>
            ) : filteredDocs.length === 0 ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <MaterialCommunityIcons name="file-cancel-outline" size={48} color={app_theme.colors.gray} />
                    <YambiText text={(strings as any).select_documents || "No documents selected"} size="normal" color="gray" style={{ marginTop: 12, textAlign: 'center' }} />
                    <Pressable
                        onPress={pickDocumentWithExpo}
                        style={{
                            marginTop: 16,
                            paddingHorizontal: 18,
                            paddingVertical: 10,
                            backgroundColor: app_theme.colors.button_background_color,
                            borderRadius: 20
                        }}
                    >
                        <YambiText text={(strings as any).browse_files || "Browse Files"} size="normal" color="white" bold />
                    </Pressable>
                </View>
            ) : (
                <FlatList
                    data={filteredDocs}
                    keyExtractor={item => item.path}
                    contentContainerStyle={{ paddingVertical: 8 }}
                    renderItem={({ item }) => {
                        const isSelected = selectedDocs.some(d => d.path === item.path);
                        return (
                            <Pressable
                                onPress={() => toggleSelectDoc(item)}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    paddingHorizontal: 16,
                                    paddingVertical: 10,
                                    backgroundColor: isSelected ? app_theme.colors.card : 'transparent'
                                }}
                            >
                                {getFileIcon(item.extension, app_theme.colors.text)}
                                <View style={{ flex: 1, marginLeft: 12, marginRight: 8 }}>
                                    <YambiText text={item.name} size="normal" color="default" bold={isSelected} numberLines={1} />
                                    <YambiText text={`${formatFileSize(item.size)} • ${item.extension.toUpperCase()}`} size="small" color="gray" style={{ marginTop: 2 }} />
                                </View>
                                <Ionicons
                                    name={isSelected ? "checkbox" : "square-outline"}
                                    size={22}
                                    color={isSelected ? app_theme.colors.high_color : app_theme.colors.gray}
                                />
                            </Pressable>
                        );
                    }}
                />
            )}

            {/* Bottom Actions Bar */}
            {selectedDocs.length > 0 && (
                <View style={{
                    padding: 12,
                    backgroundColor: app_theme.colors.card,
                    borderTopWidth: 1,
                    borderColor: app_theme.colors.border,
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 50
                }}>
                    <TextInput
                        placeholder={strings.caption || "Add a caption..."}
                        placeholderTextColor={app_theme.colors.gray}
                        value={caption}
                        onChangeText={setCaption}
                        style={{
                            flex: 1,
                            backgroundColor: app_theme.colors.background,
                            borderRadius: 20,
                            paddingHorizontal: 14,
                            paddingVertical: 8,
                            color: app_theme.colors.text,
                            marginRight: 10
                        }}
                    />
                    <Pressable
                        onPress={sendSelectedDocuments}
                        style={{
                            height: 44,
                            paddingHorizontal: 18,
                            borderRadius: 22,
                            backgroundColor: app_theme.colors.button_background_color,
                            justifyContent: 'center',
                            alignItems: 'center',
                            flexDirection: 'row'
                        }}
                    >
                        <YambiText text={`${strings.send || 'Send'} (${selectedDocs.length})`} size="normal" color="white" bold />
                        <Ionicons name="send" size={16} color={app_theme.colors.button_foreground_color} style={{ marginLeft: 6 }} />
                    </Pressable>
                </View>
            )}
        </View>
    );
};

export default SendDocument;
