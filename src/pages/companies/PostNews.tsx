import { View, ScrollView, TextInput, TouchableOpacity, Image, Dimensions, Platform } from "react-native";
import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from "../../store/app/hooks";
import { strings } from "../../lang/lang";
import ButtonNormal from "../../components/app/ButtonNormal";
import { YambiText } from "../../components/app/Text";
import ModalApp from "../../components/app/ModalApp";
import { setLoadingButton, setShowModalApp } from "../../store/reducers/appSlice";
import { remote_host, randomString } from "../../../GlobalVariables";
import axios from "axios";
import { NavProps, TCompany } from "../../types/types";
import ImagePicker from 'react-native-image-crop-picker';
import FastImage from 'react-native-fast-image';
import { IconApp } from "../../components/app/IconApp";
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from "moment";

const PostNews = ({ navigation, route }: NavProps) => {
    const theme = useAppSelector(state => state.app_theme.colors);
    const user_data = useAppSelector(state => state.user_data);
    const [title, setTitle] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [content, setContent] = useState<string>("");
    const [availableTags, setAvailableTags] = useState<string[]>([]); // All company tags
    const [selectedTags, setSelectedTags] = useState<string[]>([]); // Selected tags
    const [images, setImages] = useState<string[]>([]); // Array of image file names
    const [imageUris, setImageUris] = useState<string[]>([]); // Local URIs for display
    const [uploadingImages, setUploadingImages] = useState<boolean>(false);
    const [showError, setShowError] = useState<boolean>(false);
    const [showSuccess, setShowSuccess] = useState<boolean>(false);
    const [showInternetError, setShowInternetError] = useState<boolean>(false);
    const [showAuthError, setShowAuthError] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const dispatch = useAppDispatch();

    // Get company and flag from route params
    const company: TCompany | undefined = (route.params as any)?.company;
    const flag: number = (route.params as any)?.flag || 1; // 1 for information, 2 for timetable

    // Timetable-specific state
    interface TimetableEntry {
        date_news: Date;
        morning: string;
        morning_time: string;
        morning_time_end: string;
        afternoon: string;
        afternoon_time: string;
        afternoon_time_end: string;
        evening: string;
        evening_time: string;
        evening_time_end: string;
        tags: string[];
    }
    const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([
        {
            date_news: new Date(),
            morning: "",
            morning_time: "",
            morning_time_end: "",
            afternoon: "",
            afternoon_time: "",
            afternoon_time_end: "",
            evening: "",
            evening_time: "",
            evening_time_end: "",
            tags: []
        }
    ]);
    const [timetableStartDate, setTimetableStartDate] = useState<Date>(new Date());
    const [timetableEndDate, setTimetableEndDate] = useState<Date>(new Date());
    const [timetableId] = useState<string>(randomString(30));
    const [showDatePicker, setShowDatePicker] = useState<{ entryIndex?: number; field: 'date_news' | 'start_date' | 'end_date' } | null>(null);
    const [showTimePicker, setShowTimePicker] = useState<{ entryIndex: number; field: 'morning_time' | 'morning_time_end' | 'afternoon_time' | 'afternoon_time_end' | 'evening_time' | 'evening_time_end' } | null>(null);

    // Load company tags when component mounts
    useEffect(() => {
        if (company && company.keywords) {
            const companyTags = company.keywords.trim().split(/\s+/).filter(tag => tag.trim() !== "");
            setAvailableTags(companyTags);
        }
    }, [company]);

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
        if (imageUris.length === 0) return [];

        setUploadingImages(true);
        const uploadedImageNames: string[] = [];

        try {
            for (const imageUri of imageUris) {
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

    const addTimetableEntry = (afterIndex: number) => {
        const newEntry = {
            date_news: new Date(),
            morning: "",
            morning_time: "",
            morning_time_end: "",
            afternoon: "",
            afternoon_time: "",
            afternoon_time_end: "",
            evening: "",
            evening_time: "",
            evening_time_end: "",
            tags: []
        };
        const updated = [...timetableEntries];
        updated.splice(afterIndex + 1, 0, newEntry);
        setTimetableEntries(updated);
    };

    const removeTimetableEntry = (index: number) => {
        if (timetableEntries.length > 1) {
            setTimetableEntries(timetableEntries.filter((_, i) => i !== index));
        }
    };

    const updateTimetableEntry = (index: number, field: keyof TimetableEntry, value: any) => {
        const updated = [...timetableEntries];
        updated[index] = { ...updated[index], [field]: value };
        setTimetableEntries(updated);
    };

    const toggleTimetableTag = (entryIndex: number, tag: string) => {
        const updated = [...timetableEntries];
        const entryTags = updated[entryIndex].tags;
        if (entryTags.includes(tag)) {
            updated[entryIndex].tags = entryTags.filter(t => t !== tag);
        } else {
            updated[entryIndex].tags = [...entryTags, tag];
        }
        setTimetableEntries(updated);
    };

    const PostNews = async () => {
        if (!company) {
            setShowError(true);
            dispatch(setShowModalApp(true));
            return;
        }

        if (flag === 1) {
            // Normal news validation
        if (title === "" || content === "") {
            setShowError(true);
            dispatch(setShowModalApp(true));
            return;
            }
        } else {
            // Timetable validation
            if (!timetableStartDate || !timetableEndDate) {
                setShowError(true);
                dispatch(setShowModalApp(true));
                return;
            }
            
            const hasInvalidEntry = timetableEntries.some(entry => {
                if (!entry.date_news) return true;
                
                // At least one activity must be filled
                const hasMorning = entry.morning.trim() !== "";
                const hasAfternoon = entry.afternoon.trim() !== "";
                const hasEvening = entry.evening.trim() !== "";
                
                if (!hasMorning && !hasAfternoon && !hasEvening) return true;
                
                // If morning is filled, morning_time is required
                if (hasMorning && (!entry.morning_time || entry.morning_time.trim() === "")) return true;
                
                // If afternoon is filled, afternoon_time is required
                if (hasAfternoon && (!entry.afternoon_time || entry.afternoon_time.trim() === "")) return true;
                
                // If evening is filled, evening_time is required
                if (hasEvening && (!entry.evening_time || entry.evening_time.trim() === "")) return true;
                
                return false;
            });
            
            if (hasInvalidEntry) {
                setShowError(true);
                dispatch(setShowModalApp(true));
                return;
            }
        }

        setLoading(true);
        dispatch(setLoadingButton(true));

        try {
            if (flag === 1) {
                // Normal news posting
            const uploadedImages = await uploadImages();
            const tagsString = selectedTags.join(" ");

            const news = {
                company_id: company._id,
                title: title,
                description: description || "",
                content: content,
                tags: tagsString,
                    images: JSON.stringify(uploadedImages),
                    news_type: 1,
                news_active: 1
            };

            axios.post(remote_host + "/yambi/API/post_news", {
                news: news,
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
                            // Check if it's an authorization error
                            const errorMsg = json.data.error || "";
                            if (errorMsg.toLowerCase().includes("not authorized") || errorMsg.toLowerCase().includes("authorized")) {
                                setShowAuthError(true);
                            } else {
                                setShowInternetError(true);
                            }
                            dispatch(setShowModalApp(true));
                            setLoading(false);
                            dispatch(setLoadingButton(false));
                        }
                    })
                    .catch((error: any) => {
                        // Check if it's an authorization error
                        if (error.response && error.response.data && error.response.data.error) {
                            const errorMsg = error.response.data.error.toLowerCase();
                            if (errorMsg.includes("not authorized") || errorMsg.includes("authorized")) {
                                setShowAuthError(true);
                            } else {
                                setShowInternetError(true);
                            }
                    } else {
                        setShowInternetError(true);
                        }
                        dispatch(setShowModalApp(true));
                        setLoading(false);
                        dispatch(setLoadingButton(false));
                    });
            } else {
                // Timetable posting - send multiple entries sequentially to avoid authorization issues
                let allSuccess = true;
                let lastError = null;
                
                for (let i = 0; i < timetableEntries.length; i++) {
                    const entry = timetableEntries[i];
                    try {
                        // Use entry-specific tags if available, otherwise use shared tags
                        const entryTagsString = entry.tags && entry.tags.length > 0 ? entry.tags.join(" ") : (selectedTags.length > 0 ? selectedTags.join(" ") : "");
                        
                        const news = {
                            company_id: company._id,
                            title: title || "",
                            description: description || "",
                            content: "",
                            tags: entryTagsString,
                            images: "",
                            news_type: 2,
                            timetable_id: timetableId,
                            date_news: moment(entry.date_news).format("YYYY-MM-DD"),
                            start_date: moment(timetableStartDate).format("YYYY-MM-DD"),
                            end_date: moment(timetableEndDate).format("YYYY-MM-DD"),
                            morning: entry.morning || "",
                            morning_time: entry.morning_time || "",
                            morning_time_end: entry.morning_time_end || "",
                            afternoon: entry.afternoon || "",
                            afternoon_time: entry.afternoon_time || "",
                            afternoon_time_end: entry.afternoon_time_end || "",
                            evening: entry.evening || "",
                            evening_time: entry.evening_time || "",
                            evening_time_end: entry.evening_time_end || "",
                            news_active: 1
                        };

                        const response = await axios.post(remote_host + "/yambi/API/post_news", {
                            news: news,
                            phone_number: user_data.phone_number
                        });

                        if (response.data.success !== "1") {
                            allSuccess = false;
                            lastError = response.data.error || "Unknown error";
                            break; // Stop on first error
                        }
                    } catch (error: any) {
                        allSuccess = false;
                        // Check if it's an authorization error from response
                        if (error.response && error.response.data && error.response.data.error) {
                            const errorMsg = error.response.data.error.toLowerCase();
                            if (errorMsg.includes("not authorized") || errorMsg.includes("authorized")) {
                                lastError = error.response.data.error;
                            } else {
                                lastError = error.response.data.error || "Network error";
                            }
                        } else {
                            lastError = error.message || "Network error";
                        }
                        break; // Stop on first error
                    }
                }

                if (allSuccess) {
                    setShowSuccess(true);
                    dispatch(setShowModalApp(true));
                    setLoading(false);
                    dispatch(setLoadingButton(false));
                    setTimeout(() => {
                        navigation.goBack();
                    }, 500);
                } else {
                    // Check if it's an authorization error
                    const errorMsg = (lastError || "").toLowerCase();
                    if (errorMsg.includes("not authorized") || errorMsg.includes("authorized")) {
                        setShowAuthError(true);
                    } else {
                    setShowInternetError(true);
                    }
                    dispatch(setShowModalApp(true));
                    setLoading(false);
                    dispatch(setLoadingButton(false));
                }
            }
        } catch (error: any) {
            // Check if it's an authorization error
            if (error.response && error.response.data && error.response.data.error) {
                const errorMsg = error.response.data.error.toLowerCase();
                if (errorMsg.includes("not authorized") || errorMsg.includes("authorized")) {
                    setShowAuthError(true);
                } else {
                    setShowInternetError(true);
                }
            } else {
            setShowInternetError(true);
            }
            dispatch(setShowModalApp(true));
            setLoading(false);
            dispatch(setLoadingButton(false));
        }
    };

    if (!company) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
                <YambiText text={strings.error} size="normal" color="default" />
            </View>
        );
    }

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

                {showAuthError ?
                    <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowAuthError(false) }} singleButton title={strings.error}>
                        <YambiText text={(strings as any).not_authorized || "You are not authorized to post news for this company. Please contact the company administrator."} size="normal" color="gray" />
                    </ModalApp> : null}

                <View style={{ marginBottom: 15, marginTop: 10 }}>
                    <YambiText text={(strings as any).company} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 5 }} />
                    <View style={{
                        backgroundColor: theme.border,
                        paddingLeft: 15,
                        height: 45,
                        borderRadius: 5,
                        justifyContent: 'center',
                    }}>
                        <YambiText
                            text={company.company_name}
                            size="normal"
                            color="default"
                        />
                        {company.company_name_abb && (
                            <YambiText
                                text={company.company_name_abb}
                                size="small"
                                color="gray"
                                style={{ marginTop: 2 }}
                            />
                        )}
                    </View>
                </View>

                {flag === 1 ? (
                    <>
                <View style={{ marginBottom: 15 }}>
                            <YambiText text={(strings as any).title} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 5 }} />
                    <TextInput
                        placeholderTextColor="gray"
                        maxLength={200}
                        style={{ color: theme.text, backgroundColor: theme.border, paddingLeft: 15, height: 45, borderRadius: 5 }}
                        value={title}
                        onChangeText={text => setTitle(text)}
                                placeholder={(strings as any).enter_title}
                    />
                </View>

                <View style={{ marginBottom: 15 }}>
                            <YambiText text={(strings as any).description} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 5 }} />
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
                                placeholder={(strings as any).enter_description}
                    />
                </View>

                <View style={{ marginBottom: 15 }}>
                            <YambiText text={(strings as any).content} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 5 }} />
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
                                placeholder={(strings as any).enter_content}
                            />
                        </View>
                    </>
                ) : (
                    <>
                        <View style={{ marginBottom: 15 }}>
                            <YambiText text={strings.title} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 5 }} />
                            <TextInput
                                placeholderTextColor="gray"
                                maxLength={200}
                                style={{ color: theme.text, backgroundColor: theme.border, paddingLeft: 15, height: 45, borderRadius: 5 }}
                                value={title}
                                onChangeText={text => setTitle(text)}
                                placeholder={(strings as any).enter_title}
                            />
                        </View>

                        <View style={{ marginBottom: 15 }}>
                            <YambiText text={(strings as any).description} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 5 }} />
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
                                placeholder={(strings as any).enter_description}
                    />
                </View>

                <View style={{ marginBottom: 15 }}>
                            <YambiText text={strings.timetable} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 10, fontWeight: 'bold' }} />

                            {/* Shared Start Date and End Date */}
                            <View style={{ marginBottom: 15 }}>
                                <View style={{ flexDirection: 'row', gap: 10 }}>
                                    <View style={{ flex: 1 }}>
                                        <YambiText text={strings.start_date} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 5 }} />
                                        <TouchableOpacity
                                            onPress={() => setShowDatePicker({ field: 'start_date' })}
                                            style={{
                                                backgroundColor: theme.border,
                                                padding: 12,
                                                borderRadius: 5,
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'space-between'
                                            }}
                                        >
                                            <YambiText text={moment(timetableStartDate).format('YYYY-MM-DD')} size="normal" color="default" />
                                            <IconApp pack="FI" name="calendar" size={18} color={theme.text} />
                                        </TouchableOpacity>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <YambiText text={strings.end_date} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 5 }} />
                                        <TouchableOpacity
                                            onPress={() => setShowDatePicker({ field: 'end_date' })}
                                            style={{
                                                backgroundColor: theme.border,
                                                padding: 12,
                                                borderRadius: 5,
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'space-between'
                                            }}
                                        >
                                            <YambiText text={moment(timetableEndDate).format('YYYY-MM-DD')} size="normal" color="default" />
                                            <IconApp pack="FI" name="calendar" size={18} color={theme.text} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>

                            <YambiText text={(strings as any).timetable_entries} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 10 }} />

                            {timetableEntries.map((entry, index) => (
                                <View key={index} style={{
                                    backgroundColor: theme.border + '40',
                                    padding: 15,
                                    borderRadius: 8,
                                    marginBottom: 15,
                                    borderWidth: 1,
                                    borderColor: theme.border
                                }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                        <YambiText text={strings.entry + " " + (index + 1)} size="small" color="gray" style={{ fontWeight: 'bold' }} />
                                        {timetableEntries.length > 1 && (
                                            <TouchableOpacity
                                                onPress={() => removeTimetableEntry(index)}
                                                style={{
                                                    backgroundColor: theme.error + '20',
                                                    paddingHorizontal: 10,
                                                    paddingVertical: 5,
                                                    borderRadius: 5
                                                }}
                                            >
                                                <IconApp pack="FI" name="trash-2" size={14} color={theme.error} />
                                            </TouchableOpacity>
                                        )}
                                    </View>

                                    {/* Date News */}
                                    <View style={{ marginBottom: 10 }}>
                                        <YambiText text={strings.date} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 5 }} />
                                        <TouchableOpacity
                                            onPress={() => setShowDatePicker({ entryIndex: index, field: 'date_news' })}
                                            style={{
                                                backgroundColor: theme.border,
                                                padding: 12,
                                                borderRadius: 5,
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'space-between'
                                            }}
                                        >
                                            <YambiText text={moment(entry.date_news).format('YYYY-MM-DD')} size="normal" color="default" />
                                            <IconApp pack="FI" name="calendar" size={18} color={theme.text} />
                                        </TouchableOpacity>
                                    </View>

                                    {/* Morning */}
                                    <View style={{ marginBottom: 10 }}>
                                        <YambiText text={(strings as any).morning} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 5 }} />
                                        <View style={{ flexDirection: 'row', gap: 10 }}>
                                            <View style={{ flex: 1 }}>
                                                <TextInput
                                                    placeholderTextColor="gray"
                                                    maxLength={500}
                                                    style={{ color: theme.text, backgroundColor: theme.border, paddingLeft: 15, height: 45, borderRadius: 5 }}
                                                    value={entry.morning}
                                                    onChangeText={text => updateTimetableEntry(index, 'morning', text)}
                                                    placeholder={(strings as any).enter_morning}
                                                />
                                            </View>
                                            {entry.morning.trim() !== "" && (
                                                <>
                                                    <View style={{ width: 100 }}>
                                                        <TouchableOpacity
                                                            onPress={() => setShowTimePicker({ entryIndex: index, field: 'morning_time' })}
                                                            style={{
                                                                backgroundColor: theme.border,
                                                                padding: 12,
                                                                borderRadius: 5,
                                                                flexDirection: 'row',
                                                                alignItems: 'center',
                                                                justifyContent: 'space-between',
                                                                height: 45
                                                            }}
                                                        >
                                                            <YambiText text={entry.morning_time || (strings as any).start || "Start"} size="small" color={entry.morning_time ? "default" : "gray"} />
                                                            <IconApp pack="FI" name="clock" size={14} color={theme.text} />
                                                        </TouchableOpacity>
                                                    </View>
                                                    <View style={{ width: 100 }}>
                                                        <TouchableOpacity
                                                            onPress={() => setShowTimePicker({ entryIndex: index, field: 'morning_time_end' })}
                                                            style={{
                                                                backgroundColor: theme.border,
                                                                padding: 12,
                                                                borderRadius: 5,
                                                                flexDirection: 'row',
                                                                alignItems: 'center',
                                                                justifyContent: 'space-between',
                                                                height: 45
                                                            }}
                                                        >
                                                            <YambiText text={entry.morning_time_end || (strings as any).end || "End"} size="small" color={entry.morning_time_end ? "default" : "gray"} />
                                                            <IconApp pack="FI" name="clock" size={14} color={theme.text} />
                                                        </TouchableOpacity>
                                                    </View>
                                                </>
                                            )}
                                        </View>
                                    </View>

                                    {/* Afternoon */}
                                    <View style={{ marginBottom: 10 }}>
                                        <YambiText text={(strings as any).afternoon} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 5 }} />
                                        <View style={{ flexDirection: 'row', gap: 10 }}>
                                            <View style={{ flex: 1 }}>
                                                <TextInput
                                                    placeholderTextColor="gray"
                                                    maxLength={500}
                                                    style={{ color: theme.text, backgroundColor: theme.border, paddingLeft: 15, height: 45, borderRadius: 5 }}
                                                    value={entry.afternoon}
                                                    onChangeText={text => updateTimetableEntry(index, 'afternoon', text)}
                                                    placeholder={(strings as any).enter_afternoon}
                                                />
                                            </View>
                                            {entry.afternoon.trim() !== "" && (
                                                <>
                                                    <View style={{ width: 100 }}>
                                                        <TouchableOpacity
                                                            onPress={() => setShowTimePicker({ entryIndex: index, field: 'afternoon_time' })}
                                                            style={{
                                                                backgroundColor: theme.border,
                                                                padding: 12,
                                                                borderRadius: 5,
                                                                flexDirection: 'row',
                                                                alignItems: 'center',
                                                                justifyContent: 'space-between',
                                                                height: 45
                                                            }}
                                                        >
                                                            <YambiText text={entry.afternoon_time || (strings as any).start || "Start"} size="small" color={entry.afternoon_time ? "default" : "gray"} />
                                                            <IconApp pack="FI" name="clock" size={14} color={theme.text} />
                                                        </TouchableOpacity>
                                                    </View>
                                                    <View style={{ width: 100 }}>
                                                        <TouchableOpacity
                                                            onPress={() => setShowTimePicker({ entryIndex: index, field: 'afternoon_time_end' })}
                                                            style={{
                                                                backgroundColor: theme.border,
                                                                padding: 12,
                                                                borderRadius: 5,
                                                                flexDirection: 'row',
                                                                alignItems: 'center',
                                                                justifyContent: 'space-between',
                                                                height: 45
                                                            }}
                                                        >
                                                            <YambiText text={entry.afternoon_time_end || (strings as any).end || "End"} size="small" color={entry.afternoon_time_end ? "default" : "gray"} />
                                                            <IconApp pack="FI" name="clock" size={14} color={theme.text} />
                                                        </TouchableOpacity>
                                                    </View>
                                                </>
                                            )}
                                        </View>
                                    </View>

                                    {/* Evening */}
                                    <View style={{ marginBottom: 10 }}>
                                        <YambiText text={(strings as any).evening} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 5 }} />
                                        <View style={{ flexDirection: 'row', gap: 10 }}>
                                            <View style={{ flex: 1 }}>
                                                <TextInput
                                                    placeholderTextColor="gray"
                                                    maxLength={500}
                                                    style={{ color: theme.text, backgroundColor: theme.border, paddingLeft: 15, height: 45, borderRadius: 5 }}
                                                    value={entry.evening}
                                                    onChangeText={text => updateTimetableEntry(index, 'evening', text)}
                                                    placeholder={(strings as any).enter_evening}
                                                />
                                            </View>
                                            {entry.evening.trim() !== "" && (
                                                <>
                                                    <View style={{ width: 100 }}>
                                                        <TouchableOpacity
                                                            onPress={() => setShowTimePicker({ entryIndex: index, field: 'evening_time' })}
                                                            style={{
                                                                backgroundColor: theme.border,
                                                                padding: 12,
                                                                borderRadius: 5,
                                                                flexDirection: 'row',
                                                                alignItems: 'center',
                                                                justifyContent: 'space-between',
                                                                height: 45
                                                            }}
                                                        >
                                                            <YambiText text={entry.evening_time || (strings as any).start || "Start"} size="small" color={entry.evening_time ? "default" : "gray"} />
                                                            <IconApp pack="FI" name="clock" size={14} color={theme.text} />
                                                        </TouchableOpacity>
                                                    </View>
                                                    <View style={{ width: 100 }}>
                                                        <TouchableOpacity
                                                            onPress={() => setShowTimePicker({ entryIndex: index, field: 'evening_time_end' })}
                                                            style={{
                                                                backgroundColor: theme.border,
                                                                padding: 12,
                                                                borderRadius: 5,
                                                                flexDirection: 'row',
                                                                alignItems: 'center',
                                                                justifyContent: 'space-between',
                                                                height: 45
                                                            }}
                                                        >
                                                            <YambiText text={entry.evening_time_end || (strings as any).end || "End"} size="small" color={entry.evening_time_end ? "default" : "gray"} />
                                                            <IconApp pack="FI" name="clock" size={14} color={theme.text} />
                                                        </TouchableOpacity>
                                                    </View>
                                                </>
                                            )}
                                        </View>
                                    </View>

                                    {/* Tags for this entry */}
                                    <View style={{ marginBottom: 15 }}>
                                        <YambiText text={strings.tags} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 5 }} />
                                        {availableTags.length > 0 && (
                                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                                                {availableTags.map((tag, tagIndex) => {
                                                    const isSelected = entry.tags.includes(tag);
                                                    return (
                                                        <TouchableOpacity
                                                            key={tagIndex}
                                                            onPress={() => toggleTimetableTag(index, tag)}
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
                                                        </TouchableOpacity>
                                                    );
                                                })}
                                            </View>
                                        )}
                                    </View>

                                    {/* Add Entry Button */}
                                    <ButtonNormal
                                        title={(strings as any).add_entry}
                                        onPress={() => addTimetableEntry(index)}
                                        ghost={true}
                                        styles={{ marginTop: 10 }}
                                        iconName="plus"
                                        iconPack="FI"
                                    />
                                </View>
                            ))}
                        </View>
                    </>
                )}

                {flag === 1 && (
                    <>
                        <View style={{ marginBottom: 15 }}>
                            <YambiText text={strings.tags} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 5 }} />
                    {availableTags.length > 0 && (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                            {availableTags.map((tag, index) => {
                                const isSelected = selectedTags.includes(tag);
                                return (
                                    <TouchableOpacity
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
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}
                </View>

                <View style={{ marginBottom: 15 }}>
                            <YambiText text={(strings as any).images} size="small" color="gray" style={{ marginLeft: 2, marginBottom: 5 }} />
                    <TouchableOpacity
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
                                <YambiText text={(strings as any).select_images} size="normal" color="high" />
                    </TouchableOpacity>
                    {imageUris.length > 0 && (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                            {imageUris.map((uri, index) => (
                                <View key={index} style={{ position: 'relative', width: 100, height: 100 }}>
                                    <FastImage
                                        source={{ uri: uri }}
                                        style={{ width: 100, height: 100, borderRadius: 8 }}
                                        resizeMode={FastImage.resizeMode.cover}
                                    />
                                    <TouchableOpacity
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
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
                    </>
                )}

                {showDatePicker && (
                    <DateTimePicker
                        value={showDatePicker.field === 'date_news' && showDatePicker.entryIndex !== undefined
                            ? timetableEntries[showDatePicker.entryIndex].date_news
                            : showDatePicker.field === 'start_date'
                            ? timetableStartDate
                            : timetableEndDate
                        }
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(event, selectedDate) => {
                            if (Platform.OS === 'android') {
                                setShowDatePicker(null);
                                if (event.type === 'set' && selectedDate) {
                                    if (showDatePicker.field === 'date_news' && showDatePicker.entryIndex !== undefined) {
                                        updateTimetableEntry(showDatePicker.entryIndex, showDatePicker.field, selectedDate);
                                    } else if (showDatePicker.field === 'start_date') {
                                        setTimetableStartDate(selectedDate);
                                    } else if (showDatePicker.field === 'end_date') {
                                        setTimetableEndDate(selectedDate);
                                    }
                                }
                            } else {
                                if (selectedDate) {
                                    if (showDatePicker.field === 'date_news' && showDatePicker.entryIndex !== undefined) {
                                        updateTimetableEntry(showDatePicker.entryIndex, showDatePicker.field, selectedDate);
                                    } else if (showDatePicker.field === 'start_date') {
                                        setTimetableStartDate(selectedDate);
                                    } else if (showDatePicker.field === 'end_date') {
                                        setTimetableEndDate(selectedDate);
                                    }
                                }
                                setShowDatePicker(null);
                            }
                        }}
                    />
                )}

                {showTimePicker && (
                    <DateTimePicker
                        value={(() => {
                            const entry = timetableEntries[showTimePicker.entryIndex];
                            const timeValue = entry[showTimePicker.field];
                            if (timeValue) {
                                // Parse time string (HH:mm format) to Date
                                const [hours, minutes] = timeValue.split(':');
                                const date = new Date();
                                date.setHours(parseInt(hours) || 0, parseInt(minutes) || 0, 0, 0);
                                return date;
                            }
                            return new Date();
                        })()}
                        mode="time"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(event, selectedTime) => {
                            if (Platform.OS === 'android') {
                                setShowTimePicker(null);
                                if (event.type === 'set' && selectedTime) {
                                    const timeString = moment(selectedTime).format('HH:mm');
                                    updateTimetableEntry(showTimePicker.entryIndex, showTimePicker.field, timeString);
                                }
                            } else {
                                if (selectedTime) {
                                    const timeString = moment(selectedTime).format('HH:mm');
                                    updateTimetableEntry(showTimePicker.entryIndex, showTimePicker.field, timeString);
                                }
                                setShowTimePicker(null);
                            }
                        }}
                    />
                )}

                <ButtonNormal
                    title={flag === 1 ? ((strings as any).post_news) : ((strings as any).add_timetable)}
                    loading={loading}
                    onPress={PostNews}
                    styles={{ paddingHorizontal: 20, marginVertical: 20 }}
                    normal={true}
                />
            </View>
        </ScrollView>
    );
};

export default PostNews;
