import { View, ScrollView, TextInput, Pressable, Image } from "react-native";
import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from "../../store/app/hooks";
import { strings } from "../../lang/lang";
import ButtonNormal from "../../components/app/ButtonNormal";
import { YambiText } from "../../components/app/Text";
import ModalApp from "../../components/app/ModalApp";
import { setLoadingButton, setShowModalApp } from "../../store/reducers/appSlice";
import { remote_host, media_url } from "../../../GlobalVariables";
import axios from "axios";
import { NavProps, TNews, TCompany } from "../../types/types";
import { IconApp } from "../../components/app/IconApp";
import moment from "moment";
import ImagePicker from 'react-native-image-crop-picker';
import { Image as ExpoImage } from 'expo-image';

const EditNews = ({ navigation, route }: NavProps) => {
    const theme = useAppSelector(state => state.app_theme.colors);
    const user_data = useAppSelector(state => state.user_data);
    const { news } = route.params;
    
    const [title, setTitle] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [content, setContent] = useState<string>("");
    const [company, setCompany] = useState<TCompany | null>(null);
    const [availableTags, setAvailableTags] = useState<string[]>([]); // All company tags
    const [selectedTags, setSelectedTags] = useState<string[]>([]); // Selected tags
    const [images, setImages] = useState<string[]>([]); // Array of image file names
    const [imageUris, setImageUris] = useState<string[]>([]); // Local URIs for display
    const [uploadingImages, setUploadingImages] = useState<boolean>(false);
    const [showError, setShowError] = useState<boolean>(false);
    const [showSuccess, setShowSuccess] = useState<boolean>(false);
    const [showInternetError, setShowInternetError] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const dispatch = useAppDispatch();

    // Fetch company data to get available tags
    useEffect(() => {
        if (news.company_id) {
            axios.post(remote_host + "/yambi/API/get_company", {
                company_id: news.company_id
            })
            .then(res => {
                if (res.data.success === "1") {
                    const companyData = res.data.company;
                    setCompany(companyData);
                    if (companyData && companyData.keywords) {
                        const companyTags = companyData.keywords.trim().split(/\s+/).filter(tag => tag.trim() !== "");
                        setAvailableTags(companyTags);
                    }
                }
            })
            .catch(() => { });
        }
    }, [news.company_id]);

    useEffect(() => {
        setTitle(news.title || "");
        setDescription(news.description || "");
        setContent(news.content || "");
        
        // Load selected tags from news
        if (news.tags) {
            const newsTags = news.tags.trim().split(/\s+/).filter(tag => tag.trim() !== "");
            setSelectedTags(newsTags);
        }

        // Load existing images
        if (news.images) {
            try {
                const imagesArray = JSON.parse(news.images);
                if (Array.isArray(imagesArray)) {
                    setImages(imagesArray);
                    // Set image URIs for display (from server)
                    const imageUrls = imagesArray.map(img => media_url + "/news_images/" + img);
                    setImageUris(imageUrls);
                }
            } catch (e) {
                // If parsing fails, treat as empty
                setImages([]);
                setImageUris([]);
            }
        }
    }, [news]);

    const toggleTag = (tag: string) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter(t => t !== tag));
        } else {
            setSelectedTags([...selectedTags, tag]);
        }
    };

    const pickImages = () => {
        ImagePicker.openPicker({
            width: 800,
            height: 800,
            cropping: false,
            quality: 0.7,
            mediaType: "photo",
            multiple: true,
            maxFiles: 10
        }).then(selectedImages => {
            const newUris = selectedImages.map(img => img.path);
            setImageUris([...imageUris, ...newUris]);
        }).catch(() => { });
    };

    const removeImage = (index: number) => {
        const newUris = imageUris.filter((_, i) => i !== index);
        const newImages = images.filter((_, i) => i !== index);
        setImageUris(newUris);
        setImages(newImages);
    };

    const uploadImages = async (): Promise<string[]> => {
        // Only upload new images (those that are local paths, not URLs)
        const newImageUris = imageUris.filter(uri => !uri.startsWith('http'));
        if (newImageUris.length === 0) return images; // Return existing images if no new ones

        setUploadingImages(true);
        const uploadedImageNames: string[] = [...images]; // Start with existing images

        try {
            for (const imageUri of newImageUris) {
                const filename = Date.now() + '-' + Math.round(Math.random() * 1E9) + '.jpg';
                let formData = new FormData();
                formData.append('image', { type: 'image/jpg', uri: imageUri, name: filename } as any);

                const response = await axios.post(remote_host + "/yambi/API/upload_news_image", formData, {
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'multipart/form-data'
                    }
                });

                if (response.data.success === "1") {
                    uploadedImageNames.push(response.data.image);
                }
            }
        } catch (error) {
            console.log("Error uploading images:", error);
        } finally {
            setUploadingImages(false);
        }

        return uploadedImageNames;
    };

    const UpdateNews = async () => {
        if (title === "" || content === "") {
            setShowError(true);
            dispatch(setShowModalApp(true));
            return;
        }

        setLoading(true);
            dispatch(setLoadingButton(true));

        try {
            // Upload new images first
            const uploadedImages = await uploadImages();

            // Convert selected tags array to space-separated string
            const tagsString = selectedTags.join(" ");

            const newsData: any = {
                _id: news._id,
                company_id: news.company_id,
                title: title,
                description: description || "",
                content: content,
                tags: tagsString,
                images: JSON.stringify(uploadedImages), // Stringified array of image names
                createdAt: news.createdAt,
                updatedAt: moment(new Date()).format()
            };

            axios.post(remote_host + "/yambi/API/edit_news", { 
                news: newsData,
                phone_number: user_data.phone_number
            })
            .then(json => {
                if (json.data.success === "1") {
                    setShowSuccess(true);
                    dispatch(setShowModalApp(true));
                    setLoading(false);
                    dispatch(setLoadingButton(false));
                    setTimeout(() => {
                        navigation.goBack();
                    }, 500);
                } else {
                    setShowInternetError(true);
                    dispatch(setShowModalApp(true));
                    setLoading(false);
                    dispatch(setLoadingButton(false));
                }
            })
            .catch(() => {
                setShowInternetError(true);
                dispatch(setShowModalApp(true));
                setLoading(false);
                dispatch(setLoadingButton(false));
            });
        } catch (error) {
            setShowInternetError(true);
            dispatch(setShowModalApp(true));
            setLoading(false);
            dispatch(setLoadingButton(false));
        }
    };

    return (
        <ScrollView style={{
            backgroundColor: theme.background,
            borderColor: theme.border, 
            borderTopWidth: 1,
            paddingHorizontal: 15
        }} keyboardShouldPersistTaps='handled'>
            <View>
                {showError ?
                    <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowError(false) }} singleButton title={strings.error}>
                        <YambiText text={strings.fields_error_validation} size="normal" color="gray" />
                    </ModalApp> : null}

                {showSuccess ?
                    <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowSuccess(false) }} singleButton title={strings.success}>
                        <YambiText text={strings.data_updated_successfully} size="normal" color="gray" />
                    </ModalApp> : null}

                {showInternetError ?
                    <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowInternetError(false) }} singleButton title={strings.error}>
                        <YambiText text={strings.connection_failed} size="normal" color="gray" />
                    </ModalApp> : null}

                <View style={{ marginBottom: 15, marginTop: 10 }}>
                    <YambiText text={(strings as any).title || "Title"} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 5 }} />
                    <TextInput
                        placeholderTextColor="gray"
                        maxLength={200}
                        style={{ color: theme.text, backgroundColor: theme.border, paddingLeft: 15, height: 45, borderRadius: 5 }}
                        value={title}
                        onChangeText={text => setTitle(text)}
                        placeholder={(strings as any).enter_title || "Enter title"}
                    />
                </View>

                <View style={{ marginBottom: 15 }}>
                    <YambiText text={(strings as any).description || "Description"} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 5 }} />
                    <TextInput
                        placeholderTextColor="gray"
                        maxLength={500}
                        multiline
                        numberOfLines={3}
                        style={{ 
                            color: theme.text, 
                            backgroundColor: theme.border, 
                            paddingLeft: 15, 
                            paddingTop: 10,
                            paddingRight: 15,
                            minHeight: 80,
                            borderRadius: 5,
                            textAlignVertical: 'top'
                        }}
                        value={description}
                        onChangeText={text => setDescription(text)}
                        placeholder={(strings as any).enter_description || "Enter description (optional)"}
                    />
                </View>

                <View style={{ marginBottom: 15 }}>
                    <YambiText text={(strings as any).content || "Content"} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 5 }} />
                    <TextInput
                        placeholderTextColor="gray"
                        maxLength={5000}
                        multiline
                        numberOfLines={10}
                        style={{ 
                            color: theme.text, 
                            backgroundColor: theme.border, 
                            paddingLeft: 15, 
                            paddingTop: 10,
                            paddingRight: 15,
                            minHeight: 200,
                            borderRadius: 5,
                            textAlignVertical: 'top'
                        }}
                        value={content}
                        onChangeText={text => setContent(text)}
                        placeholder={(strings as any).enter_content || "Enter main content"}
                    />
                </View>

                <View style={{ marginBottom: 15 }}>
                    <YambiText text={strings.tags || "Tags"} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 5 }} />
                    {availableTags.length > 0 && (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                            {availableTags.map((tag, index) => {
                                const isSelected = selectedTags.includes(tag);
                                return (
                                    <Pressable
                                    key={index}
                                        onPress={() => toggleTag(tag)}
                                    style={{
                                            backgroundColor: isSelected ? theme.high_color + '40' : theme.high_color + '20',
                                        paddingHorizontal: 12,
                                        paddingVertical: 6,
                                        borderRadius: 20,
                                        borderWidth: 1,
                                            borderColor: isSelected ? theme.high_color : theme.high_color + '40',
                                        flexDirection: 'row',
                                        alignItems: 'center'
                                    }}
                                >
                                        {isSelected && (
                                            <IconApp pack="FI" name="check" size={12} color={theme.high_color} styles={{ marginRight: 4 }} />
                                        )}
                                    <YambiText text={tag} size="small" color="high" />
                                    </Pressable>
                                );
                            })}
                        </View>
                    )}
                </View>

                <View style={{ marginBottom: 15 }}>
                    <YambiText text={(strings as any).images || "Images"} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 5 }} />
                    <Pressable
                        onPress={pickImages}
                        style={{
                            backgroundColor: theme.border,
                            padding: 15,
                            borderRadius: 5,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 10
                        }}
                    >
                        <IconApp pack="FI" name="image" size={20} color={theme.high_color} styles={{ marginRight: 8 }} />
                        <YambiText text={(strings as any).select_images || "Select Images"} size="normal" color="high" />
                    </Pressable>
                    {imageUris.length > 0 && (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                            {imageUris.map((uri, index) => (
                                <View key={index} style={{ position: 'relative', width: 100, height: 100 }}>
                                    <ExpoImage
                                        source={uri}
                                        style={{ width: 100, height: 100, borderRadius: 8 }}
                                        contentFit="cover"
                                    />
                                    <Pressable
                                        onPress={() => removeImage(index)}
                                        style={{
                                            position: 'absolute',
                                            top: 5,
                                            right: 5,
                                            backgroundColor: theme.error + '90',
                                            borderRadius: 12,
                                            width: 24,
                                            height: 24,
                                            justifyContent: 'center',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <IconApp pack="FI" name="x" size={12} color="#FFFFFF" />
                                    </Pressable>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                <ButtonNormal 
                    title={strings.save} 
                    loading={loading}
                    onPress={UpdateNews} 
                    styles={{ paddingHorizontal: 20, marginVertical: 20 }} 
                    normal={true} 
                />
            </View>
        </ScrollView>
    );
};

export default EditNews;
