import React, { useEffect, useState, useCallback } from "react";
import { View, TextInput, ScrollView, TouchableOpacity, Image, Text, Pressable, RefreshControl } from "react-native";
import axios from "axios";
import { remote_host, remote_host_server, media_url } from "../../../GlobalVariables";
import ImagePicker from 'react-native-image-crop-picker';
import MarketingItemAdmin from "../../components/lists/marketing/MarketingItemAdmin";
import { useAppSelector, useAppDispatch } from "../../store/app/hooks";
import { strings } from "../../lang/lang";
import { TextNormalYambiGray, TextBigYambi, TextSmallYambiGray, TextNormalYambiHighColor, TextNormalYambi } from "../../components/app/Text";
import { IconApp } from "../../components/app/IconApp";
import AppActivityIndicator from "../../components/app/AppActivityIndicator";
import ButtonNormal from "../../components/app/ButtonNormal";
import ModalApp from "../../components/app/ModalApp";
import { setShowModalApp } from "../../store/reducers/appSlice";
import FastImage from "react-native-fast-image";

export default function Marketing() {
    const app_theme = useAppSelector(state => state.app_theme);
    const dispatch = useAppDispatch();
    const [marketingItems, setMarketingItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [selectedImage, setSelectedImage] = useState<string>("");
    const [uploadingImage, setUploadingImage] = useState(false);
    const [editItemId, setEditItemId] = useState<string | null>(null);
    const [editItem, setEditItem] = useState<any>(null);
    const [editImage, setEditImage] = useState<string>("");
    const [editUploadingImage, setEditUploadingImage] = useState(false);
    const [showAddMarketing, setShowAddMarketing] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const [newItem, setNewItem] = useState({
        business_id: "",
        sales_point_id: "",
        item_id: "",
        pub_title: "",
        pub_description: "",
        visibility_level: 1,
        image: "",
        valid_until: "",
        pub_active: 1,
        extra_link: ""
    });

    useEffect(() => {
        fetchMarketing();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchMarketing().finally(() => {
            setRefreshing(false);
        });
    }, []);

    const handleAdd = () => {
        axios.post(remote_host + "/yambi/API/add_marketing", { marketing: newItem })
            .then(res => {
                if (res.data.success === "1") {
                    setNewItem({
                        business_id: "",
                        sales_point_id: "",
                        item_id: "",
                        pub_title: "",
                        pub_description: "",
                        visibility_level: 1,
                        image: "",
                        valid_until: "",
                        pub_active: 1,
                        extra_link: ""
                    });
                    fetchMarketing();
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
            });
    };

    const fetchMarketing = () => {
        setLoading(true);
        return axios.post(remote_host + "/yambi/API/get_marketing")
            .then(res => {
                if (res.data.success === "1") {
                    setMarketingItems(res.data.marketing || []);
                }
            })
            .catch(() => {
                setErrorMessage(strings.connection_failed);
                setShowError(true);
                dispatch(setShowModalApp(true));
            })
            .finally(() => setLoading(false));
    };

    const pickImage = () => {
        ImagePicker.openPicker({
            width: 800,
            height: 600,
            cropping: true,
            quality: 0.7,
            mediaType: "photo",
        }).then(image => {
            setSelectedImage(image.path);
        }).catch(() => { });
    };

    const uploadImage = () => {
        if (selectedImage === "") return;

        setUploadingImage(true);
        const filename = Date.now() + '-' + Math.round(Math.random() * 1E9);
        let formData = new FormData();
        formData.append('image', { type: 'image/jpg', uri: selectedImage, name: filename + '.jpg' } as any);

        axios.post(remote_host + "/yambi/API/upload_marketing_image", formData, {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'multipart/form-data'
            }
        })
            .then(response => {
                setUploadingImage(false);
                if (response.data.success === "1") {
                    setNewItem({ ...newItem, image: response.data.image });
                    setSelectedImage("");
                } else {
                    setErrorMessage(strings.error);
                    setShowError(true);
                    dispatch(setShowModalApp(true));
                }
            })
            .catch(() => {
                setUploadingImage(false);
                setErrorMessage(strings.connection_failed);
                setShowError(true);
                dispatch(setShowModalApp(true));
            });
    };

    // --- Edit Mechanism ---
    const openEditModal = (item: any) => {
        setEditItemId(item._id);
        setEditItem({ ...item });
        setEditImage("");
        dispatch(setShowModalApp(true));
    };

    const handleEditSave = () => {
        axios.post(remote_host + "/yambi/API/edit_marketing", { marketing: { ...editItem, _id: editItemId } })
            .then(res => {
                if (res.data.success === "1") {
                    fetchMarketing();
                    setEditItemId(null);
                    setEditItem(null);
                    setShowSuccess(true);
                    dispatch(setShowModalApp(false));
                } else {
                    setErrorMessage(res.data.error || strings.error);
                    setShowError(true);
                }
            })
            .catch(() => {
                setErrorMessage(strings.connection_failed);
                setShowError(true);
            });
    };

    const pickEditImage = () => {
        ImagePicker.openPicker({
            width: 800,
            height: 600,
            cropping: true,
            quality: 0.7,
            mediaType: "photo",
        }).then(image => {
            setEditImage(image.path);
        }).catch(() => { });
    };

    const uploadEditImage = () => {
        if (!editImage || !editItemId) return;

        setEditUploadingImage(true);
        const filename = Date.now() + '-' + Math.round(Math.random() * 1E9);
        let formData = new FormData();
        formData.append('image', { type: 'image/jpg', uri: editImage, name: filename + '.jpg' } as any);
        formData.append('marketing_id', editItemId);

        axios.post(remote_host + "/yambi/API/upload_marketing_image", formData, {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'multipart/form-data'
            }
        })
            .then(response => {
                setEditUploadingImage(false);
                if (response.data.success === "1") {
                    setEditItem({ ...editItem, image: response.data.image });
                    setEditImage("");
                    fetchMarketing();
                } else {
                    setErrorMessage(strings.error);
                    setShowError(true);
                }
            })
            .catch(() => {
                setEditUploadingImage(false);
                setErrorMessage(strings.connection_failed);
                setShowError(true);
            });
    };

    const handleDelete = (_id: string) => {
        axios.post(remote_host + "/yambi/API/delete_marketing", { _id })
            .then(res => {
                if (res.data.success === "1") {
                    fetchMarketing();
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
            });
    };

    if (loading) return <AppActivityIndicator />;

    return (
        <ScrollView 
            style={{
                flex: 1,
                backgroundColor: app_theme.colors.background,
                paddingHorizontal: 16
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

            {/* Add Marketing Item Section */}
            {showAddMarketing?
            <View style={{
                backgroundColor: app_theme.colors.background,
                borderRadius: 12,
                padding: 20,
                // marginBottom: 24,
                borderWidth: 1,
                borderColor: app_theme.colors.border,
                shadowColor: app_theme.colors.border,
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 3,
                marginTop: 15
            }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TextBigYambi text={`${strings.add} ${strings.marketing} ${strings.item}`} styles={{ flex: 1 }} bold />

                    <Pressable onPress={()=>setShowAddMarketing(false)}>
                        <IconApp pack="FI" name="x" size={15} color={app_theme.colors.high_color} />
                    </Pressable>
                </View>

                <View style={{ marginBottom: 16, marginTop: 10 }}>
                    <TextNormalYambiGray text={strings.name} styles={{ marginBottom: 8 }} />
                    <TextInput
                        placeholder={strings.name}
                        placeholderTextColor={app_theme.colors.gray}
                        value={newItem.pub_title}
                        onChangeText={v => setNewItem({ ...newItem, pub_title: v })}
                        style={{
                            color: app_theme.colors.text,
                            backgroundColor: app_theme.colors.border,
                            paddingHorizontal: 15,
                            paddingVertical: 12,
                            borderRadius: 8,
                            fontSize: 15,
                        }}
                    />
                </View>

                <View style={{ marginBottom: 16 }}>
                    <TextNormalYambiGray text={strings.description} styles={{ marginBottom: 8 }} />
                    <TextInput
                        placeholder={strings.description}
                        placeholderTextColor={app_theme.colors.gray}
                        value={newItem.pub_description}
                        onChangeText={v => setNewItem({ ...newItem, pub_description: v })}
                        multiline
                        numberOfLines={4}
                        style={{
                            color: app_theme.colors.text,
                            backgroundColor: app_theme.colors.border,
                            paddingHorizontal: 15,
                            paddingVertical: 12,
                            borderRadius: 8,
                            fontSize: 15,
                            minHeight: 100,
                            textAlignVertical: 'top',
                        }}
                    />
                </View>

                {/* Image Section */}
                {/* <View style={{ marginBottom: 16 }}>
                    <TextNormalYambiGray text={strings.picture} styles={{ marginBottom: 8 }} />
                    {selectedImage !== "" || newItem.image !== "" ? (
                        <View style={{
                            borderRadius: 12,
                            overflow: 'hidden',
                            marginBottom: 12,
                            borderWidth: 1,
                            borderColor: app_theme.colors.border,
                        }}>
                            <Image
                                source={{ uri: selectedImage !== "" ? selectedImage : newItem.image }}
                                style={{ width: '100%', height: 200 }}
                                resizeMode="cover"
                            />

                            <FastImage
                        style={{ height: 60, width: 60, marginRight: 12, borderRadius: 8 }}
                        resizeMode={FastImage.resizeMode.cover}
                        source={{
                            priority: FastImage.priority.high,
                            cache: 'immutable',
                            uri: editImage !== "" ? editImage : media_url + "/marketing_images/" + newItem.image
                        }}
                    />
                        </View>
                    ) : null}

                    <View style={{ flexDirection: 'row', alignItems:'center' }}>
                        <TouchableOpacity
                            onPress={pickImage}
                            style={{
                                flex: 1,
                                backgroundColor: app_theme.colors.border,
                                paddingVertical: 12,
                                borderRadius: 8,
                                alignItems: 'center',
                                flexDirection: 'row',
                                justifyContent: 'center',
                                marginRight: 10
                            }}
                        >
                            <IconApp pack="FI" name="image" color={app_theme.colors.high_color} size={20} styles={{ marginRight: 8 }} />
                            <TextNormalYambiHighColor text={selectedImage !== "" || newItem.image !== "" ? strings.change_picture : strings.add_item_picture} />
                        </TouchableOpacity>

                        {selectedImage !== "" && (
                            <TouchableOpacity
                                onPress={uploadImage}
                                disabled={uploadingImage}
                                style={{
                                    flex: 1,
                                    backgroundColor: app_theme.colors.high_color,
                                    paddingVertical: 12,
                                    borderRadius: 8,
                                    alignItems: 'center',
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                    opacity: uploadingImage ? 0.6 : 1,
                                }}
                            >
                                <IconApp pack="FI" name="upload" color="#fff" size={20} styles={{ marginRight: 8 }} />
                                <TextNormalYambi text={uploadingImage ? strings.loading : strings.save_picture} styles={{ color: '#fff' }} bold />
                            </TouchableOpacity>
                        )}
                    </View>

                    {newItem.image !== "" && selectedImage === "" && (
                        <TextSmallYambiGray text={strings.picture_selected} styles={{ marginTop: 8, textAlign: 'center' }} />
                    )}
                </View> */}

                <ButtonNormal
                    title={strings.add}
                    onPress={handleAdd}
                    loadEnabled={false}
                    normal={true}
                    styles={{ marginTop: 10 }}
                />
            </View>:null}

            {/* Marketing Items List Section */}
            <View style={{
                backgroundColor: app_theme.colors.background,
                borderRadius: 12,
                // padding: 20,
                // marginBottom: 24,
                // borderWidth: 1,
                borderColor: app_theme.colors.border,
                shadowColor: app_theme.colors.border,
                shadowOpacity: 0.1,
                shadowRadius: 8,
                marginTop:15
                // elevation: 3,
            }}>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                    <TextBigYambi text={`${strings.marketing} ${strings.items}`} styles={{ flex: 1 }} bold />

                    <Pressable onPress={()=>setShowAddMarketing(true)} style={{flexDirection:'row', alignItems:'center'}}>
                        <IconApp pack="FI" name="plus" size={15} color={app_theme.colors.high_color} />
                        <TextNormalYambiHighColor text={strings.add} styles={{marginLeft:5}}/>
                    </Pressable>
                </View>

                {marketingItems.length === 0 ? (
                    <TextNormalYambiGray text={`${strings.no_items}`} styles={{ textAlign: 'center', marginVertical: 20 }} />
                ) : (
                    marketingItems.map((item, index) => (
                        <View key={item._id}>
                            <MarketingItemAdmin
                                item={item}
                                index={index}
                                onPress={() => handleDelete(item._id)}
                                onEdit={() => openEditModal(item)}
                            />
                        </View>
                    ))
                )}
            </View>

            {/* Edit Modal */}
            {editItemId && editItem && (
                <ModalApp paddings={false}
                    onClose={() => { setEditItemId(null); setEditItem(null); dispatch(setShowModalApp(false)); }}
                    onAction={handleEditSave}
                    singleButton={false}
                    textAction={strings.save}
                    title={strings.edit}>
                    <ScrollView style={{ maxHeight: 400, paddingHorizontal: 15 }}>
                        <View style={{ marginBottom: 16 }}>
                            <TextNormalYambiGray text={strings.name} styles={{ marginBottom: 8 }} />
                            <TextInput
                                value={editItem.pub_title}
                                onChangeText={v => setEditItem({ ...editItem, pub_title: v })}
                                style={{
                                    color: app_theme.colors.text,
                                    backgroundColor: app_theme.colors.border,
                                    paddingHorizontal: 15,
                                    paddingVertical: 12,
                                    borderRadius: 8,
                                    fontSize: 15,
                                }}
                            />
                        </View>
                        <View style={{ marginBottom: 16 }}>
                            <TextNormalYambiGray text={strings.description} styles={{ marginBottom: 8 }} />
                            <TextInput
                                value={editItem.pub_description}
                                onChangeText={v => setEditItem({ ...editItem, pub_description: v })}
                                multiline
                                numberOfLines={4}
                                style={{
                                    color: app_theme.colors.text,
                                    backgroundColor: app_theme.colors.border,
                                    paddingHorizontal: 15,
                                    paddingVertical: 12,
                                    borderRadius: 8,
                                    fontSize: 15,
                                    minHeight: 100,
                                    textAlignVertical: 'top',
                                }}
                            />
                        </View>

                        <View style={{ marginBottom: 16 }}>
                            <TextNormalYambiGray text={strings.picture} styles={{ marginBottom: 8 }} />
                            {editImage !== "" || editItem.image !== "" ? (
                                <View style={{
                                    borderRadius: 12,
                                    overflow: 'hidden',
                                    marginBottom: 12,
                                    borderWidth: 1,
                                    borderColor: app_theme.colors.border,
                                }}>
                                    {/* <Image
                                        source={{ uri: editImage !== "" ? editImage : editItem.image }}
                                        style={{ width: '100%', height: 200 }}
                                        resizeMode="cover"
                                    /> */}

                                    <FastImage
                        style={{ height: 60, width: 60, marginRight: 12, borderRadius: 8 }}
                        resizeMode={FastImage.resizeMode.cover}
                        source={{
                            priority: FastImage.priority.high,
                            cache: 'immutable',
                            uri: editImage !== "" ? editImage : media_url + "/marketing_images/" + newItem.image
                        }}
                    />
                                </View>
                            ) : null}
                            <View style={{ flexDirection: 'column', gap: 12 }}>
                                <TouchableOpacity
                                    onPress={pickEditImage}
                                    style={{
                                        flex: 1,
                                        backgroundColor: app_theme.colors.border,
                                        paddingVertical: 12,
                                        borderRadius: 8,
                                        alignItems: 'center',
                                        flexDirection: 'row',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <IconApp pack="FI" name="image" color={app_theme.colors.high_color} size={20} styles={{ marginRight: 8 }} />
                                    <TextNormalYambiHighColor text={editImage !== "" || editItem.image !== "" ? strings.change_picture : strings.add_item_picture} />
                                </TouchableOpacity>
                                {editImage !== "" && (
                                    <TouchableOpacity
                                        onPress={uploadEditImage}
                                        disabled={editUploadingImage}
                                        style={{
                                            flex: 1,
                                            backgroundColor: app_theme.colors.badge_background_color,
                                            paddingVertical: 12,
                                            borderRadius: 8,
                                            alignItems: 'center',
                                            flexDirection: 'row',
                                            justifyContent: 'center',
                                            opacity: editUploadingImage ? 0.6 : 1,
                                        }}
                                    >
                                        <IconApp pack="FI" name="upload" color="#fff" size={20} styles={{ marginRight: 8 }} />
                                        <Text style={{
                                            fontWeight: "800",
                                            color: app_theme.colors.badge_color
                                        }}>{editUploadingImage ? strings.loading : strings.save_picture}</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                        {/* <ButtonNormal
                            title={strings.save}
                            onPress={handleEditSave}
                            loadEnabled={false}
                            normal={true}
                            styles={{ marginTop: 10 }}
                        /> */}
                    </ScrollView>
                </ModalApp>
            )}
        </ScrollView>
    );
}