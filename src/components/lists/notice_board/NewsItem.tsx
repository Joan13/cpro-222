import { View, Dimensions, Image, Pressable, TextInput, Animated, ScrollView } from "react-native";
import { useState, useEffect, useRef, memo } from "react";
import { useAppSelector } from "../../../store/app/hooks";
import { SocketApp, media_url } from "../../../../GlobalVariables";
import { YambiText } from "../../app/Text";
import { IconApp } from "../../app/IconApp";
import { TNews, TCompany, TCompanyUser } from "../../../types/types";
import { Image as ExpoImage } from 'expo-image';
import { remote_host, remote_host_server } from "../../../../GlobalVariables";
import axios from "axios";
import * as RootNavigation from '../../../services/Navigation_ref';
import { getCompanyUserRole } from "../../../util/getCompanyUserRole";
import moment from "moment";
import { strings } from "../../../lang/lang";
import CommentItem from "./CommentItem";
import { LegendList } from '@legendapp/list';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CONTENT_WIDTH = SCREEN_WIDTH; // Full screen width for images

// Auto-height image component (for first image only)
const AutoHeightImage = ({ 
    uri, 
    width, 
    onPress, 
    showOverlay, 
    overlayText,
    theme
}: { 
    uri: string; 
    width: number; 
    onPress: () => void;
    showOverlay?: boolean;
    overlayText?: string;
    theme: any;
}) => {
    const [imageHeight, setImageHeight] = useState(150);
    const imageUri = media_url + "/news_images/" + uri;

    useEffect(() => {
        Image.getSize(
            imageUri,
            (imgWidth, imgHeight) => {
                const ratio = imgHeight / imgWidth;
                const calculatedHeight = width * ratio;
                setImageHeight(Math.min(calculatedHeight, 250)); // Max height of 400
            },
            () => {
                setImageHeight(150); // Default height on error
            }
        );
    }, [imageUri, width]);

    return (
        <Pressable
            onPress={onPress}
            style={{
                width: width,
                height: imageHeight,
                borderRadius: 0,
                overflow: 'hidden',
                backgroundColor: theme.border + '20',
            }}
        >
            <ExpoImage
                source={{ uri: imageUri }}
                style={{
                    width: '100%',
                    height: '100%',
                }}
                contentFit="cover"
            />
            {showOverlay && (
                <View style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                    <YambiText 
                        text={overlayText || ''} 
                        size="normal" 
                        color="white" 
                        bold
                        style={{ fontSize: 16 }} 
                    />
                </View>
            )}
        </Pressable>
    );
};

// Fixed-height image component (for 2nd and 3rd images, max 300px)
const FixedHeightImage = ({ 
    uri, 
    width, 
    onPress, 
    showOverlay, 
    overlayText,
    theme
}: { 
    uri: string; 
    width: number; 
    onPress: () => void;
    showOverlay?: boolean;
    overlayText?: string;
    theme: any;
}) => {
    const imageUri = media_url + "/news_images/" + uri;
    const maxHeight = 123.5;

    return (
        <Pressable
            onPress={onPress}
            style={{
                width: width,
                height: maxHeight,
                borderRadius: 0,
                overflow: 'hidden',
                backgroundColor: theme.border + '20',
            }}
        >
            <ExpoImage
                source={{ uri: imageUri }}
                style={{
                    width: '100%',
                    height: '100%',
                }}
                contentFit="cover"
            />
            {showOverlay && (
                <View style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                    <YambiText 
                        text={overlayText || ''} 
                        size="normal" 
                        color="white" 
                        bold
                        style={{ fontSize: 16 }} 
                    />
                </View>
            )}
        </Pressable>
    );
};

interface NewsItemProps {
    item: TNews;
    index: number;
    onPress?: (news: TNews) => void;
}

const NewsItem = ({ item, onPress }: NewsItemProps) => {
    const theme = useAppSelector(state => state.app_theme.colors);
    const user_data = useAppSelector(state => state.user_data);
    const isTimetable = item?.news_type === 2;
    const timetableEntries: any[] = isTimetable ? (item.entries || []) : [];
    const hasAfternoonProgram = isTimetable && timetableEntries.some(e => (e?.afternoon || "").trim() !== "");
    const hasEveningProgram = isTimetable && timetableEntries.some(e => (e?.evening || "").trim() !== "");
    const [images, setImages] = useState<string[]>([]);
    const [imageAspectRatios, setImageAspectRatios] = useState<boolean[]>([]); // true = portrait (height > width), false = landscape
    const [company, setCompany] = useState<TCompany | null>(null);
    const [companyUser, setCompanyUser] = useState<TCompanyUser | null>(null);
    const [userProfile, setUserProfile] = useState<string>("");
    const [isLiked, setIsLiked] = useState<boolean>(false);
    const [reactionCount, setReactionCount] = useState<number>(0);
    const [commentCount, setCommentCount] = useState<number>(0);
    const [comments, setComments] = useState<any[]>([]);
    const [commentText, setCommentText] = useState<string>("");
    const heartScale = useRef(new Animated.Value(1)).current;
    const commentIconScale = useRef(new Animated.Value(1)).current;
    const prevReactionCount = useRef<number>(0);
    const prevCommentCount = useRef<number>(0);

    // Fetch company data and company user (publisher) data
    useEffect(() => {
        if (item.company_id) {
            axios.post(remote_host + "/yambi/API/get_company", {
                company_id: item.company_id
            })
            .then(res => {
                if (res.data.success === "1") {
                    setCompany(res.data.company);
                    
                    // Find company user (publisher) if phone_number is available
                    if (item.phone_number && res.data.companyUsers) {
                        const user = res.data.companyUsers.find((cu: TCompanyUser) => 
                            cu.phone_number === item.phone_number && cu.company_id === item.company_id
                        );
                        if (user) {
                            setCompanyUser(user);
                        }
                    }
                }
            })
            .catch(() => { });
        }
    }, [item.company_id, item.phone_number]);

    // Fetch user profile picture
    useEffect(() => {
        if (item.phone_number) {
            axios.post(remote_host + "/yambi/API/fetch_user_data", {
                user: item.phone_number
            })
            .then(res => {
                if (res.data.success === "1" && res.data.assemble) {
                    setUserProfile(res.data.assemble.user_profile || "");
                }
            })
            .catch(() => { });
        }
    }, [item.phone_number]);

    useEffect(() => {
        // Parse images if available
        if (item.images) {
            try {
                const parsedImages = JSON.parse(item.images);
                if (Array.isArray(parsedImages) && parsedImages.length > 0) {
                    setImages(parsedImages);
                    // Get aspect ratios for first 3 images
                    const ratios: boolean[] = [];
                    let loadedCount = 0;
                    const totalToLoad = Math.min(3, parsedImages.length);
                    
                    parsedImages.slice(0, 3).forEach((imgUri, index) => {
                        const imageUri = media_url + "/news_images/" + imgUri;
                        Image.getSize(
                            imageUri,
                            (imgWidth, imgHeight) => {
                                ratios[index] = imgHeight > imgWidth; // true if portrait
                                loadedCount++;
                                if (loadedCount === totalToLoad) {
                                    setImageAspectRatios([...ratios]);
                                }
                            },
                            () => {
                                ratios[index] = false; // Default to landscape on error
                                loadedCount++;
                                if (loadedCount === totalToLoad) {
                                    setImageAspectRatios([...ratios]);
                                }
                            }
                        );
                    });
                }
            } catch (e) {
                // If not JSON, treat as single image string
                if (typeof item.images === 'string' && item.images.trim() !== '') {
                    setImages([item.images]);
                }
            }
        }
    }, [item.images]);

    // Fetch initial like status and count
    useEffect(() => {
        const fetchLikeData = async () => {
            if (!item?._id || !user_data?.phone_number) return;
            
            try {
                const res = await axios.post(remote_host + "/yambi/API/get_post", {
                    post_id: item._id,
                    phone_number: user_data.phone_number
                });
                
                if (res.data.success === "1") {
                    setIsLiked(res.data.is_liked || false);
                    setReactionCount(res.data.like_count || 0);
                }
            } catch (error) {
                console.error("Error fetching like data:", error);
            }
        };

        const fetchCommentCount = async () => {
            if (!item?._id) return;
            
            try {
                const res = await axios.post(remote_host + "/yambi/API/get_comments", {
                    news_id: item._id
                });
                
                if (res.data.success === "1") {
                    setCommentCount(res.data.comment_count || 0);
                    // Store first 2 comments for preview
                    setComments((res.data.comments || []).slice(0, 2));
                }
            } catch (error) {
                console.error("Error fetching comment count:", error);
            }
        };

        fetchLikeData();
        fetchCommentCount();
    }, [item._id, user_data?.phone_number]);

    // Initialize prevReactionCount and prevCommentCount when counts are fetched
    useEffect(() => {
        prevReactionCount.current = reactionCount;
    }, [reactionCount]);

    useEffect(() => {
        prevCommentCount.current = commentCount;
    }, [commentCount]);

    // Listen for socket updates on reaction changes
    useEffect(() => {
        if (!item?._id) return;

        const handleReactionUpdate = (data: any) => {
            if (data.news_id === item._id) {
                const newCount = data.like_count || 0;
                // Trigger bounce animation if reaction count changed
                if (newCount !== prevReactionCount.current) {
                    // Bounce animation
                    Animated.sequence([
                        Animated.spring(heartScale, {
                            toValue: 1.3,
                            useNativeDriver: true,
                            tension: 300,
                            friction: 3,
                        }),
                        Animated.spring(heartScale, {
                            toValue: 1,
                            useNativeDriver: true,
                            tension: 300,
                            friction: 3,
                        }),
                    ]).start();
                    prevReactionCount.current = newCount;
                }
                // Always update reaction count for any user's reaction
                setReactionCount(newCount);
                // Only update isLiked if it's for the current user
                if (data.phone_number === user_data?.phone_number) {
                    setIsLiked(data.is_liked || false);
                }
            }
        };

        const handleCommentAdded = (data: any) => {
            if (data.news_id === item._id) {
                const newCount = data.comment_count || 0;
                // Trigger bounce animation if comment count changed
                if (newCount !== prevCommentCount.current) {
                    // Bounce animation
                    Animated.sequence([
                        Animated.spring(commentIconScale, {
                            toValue: 1.3,
                            useNativeDriver: true,
                            tension: 300,
                            friction: 3,
                        }),
                        Animated.spring(commentIconScale, {
                            toValue: 1,
                            useNativeDriver: true,
                            tension: 300,
                            friction: 3,
                        }),
                    ]).start();
                    prevCommentCount.current = newCount;
                }
                // Always update comment count for any user's comment
                setCommentCount(newCount);
                // Add comment to preview if we have less than 2
                setComments((prev: any[]) => {
                    if (prev.length < 2) {
                        return [...prev, data.comment];
                    }
                    return prev;
                });
            }
        };

        SocketApp.on('reactionUpdated', handleReactionUpdate);
        SocketApp.on('commentAdded', handleCommentAdded);

        return () => {
            SocketApp.off('reactionUpdated', handleReactionUpdate);
            SocketApp.off('commentAdded', handleCommentAdded);
        };
    }, [item._id, user_data?.phone_number, heartScale, commentIconScale]);

    const handleImagePress = (imageIndex: number) => {
        // Build full image URLs
        const imageUrls = images.map(img => media_url + "/news_images/" + img);
        RootNavigation.navigate("ViewPhoto", { 
            images: imageUrls,
            initialIndex: imageIndex
        });
    };

    return (
        <Pressable
            // Important: for timetable cards we must not steal swipe gestures from the timetable ScrollView.
            // Disabling the outer Pressable ensures horizontal scrolling works reliably.
            onPress={isTimetable ? undefined : () => onPress && onPress(item)}
            disabled={isTimetable}
            style={{
                // backgroundColor: theme.border + '30',
                borderRadius: 12,
                // padding: 15,
                marginBottom: 12,
                // marginHorizontal: 15,
                // borderWidth: 1,
                // borderColor: theme.border,
            }}
        >
            <View style={{ }}>
            
            <Pressable style={{paddingHorizontal: 15}} onPress={() => onPress && onPress(item)}>
            {company && (
                <YambiText text={company.company_name} size="small" color="high" style={{ marginBottom: 8, fontSize: 14 }} />
            )}
            
            {/* Publisher Information */}
            {companyUser && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    {/* Profile Picture */}
                    <Pressable
                        onPress={() => {
                            if (userProfile) {
                                RootNavigation.navigate("ViewPhoto", { 
                                    source: media_url + "/profile_pictures/" + userProfile,
                                    title: companyUser.user_name
                                });
                            } else {
                                RootNavigation.navigate("ViewPhoto", { 
                                    source: "",
                                    title: companyUser.user_name
                                });
                            }
                        }}
                        style={{ marginRight: 12 }}
                    >
                        {userProfile ? (
                            <ExpoImage
                                style={{ width: 40, height: 40, borderRadius: 20 }}
                                contentFit="cover"
                                source={media_url + "/profile_pictures/" + userProfile}
                            />
                        ) : (
                            <View style={{
                                width: 40,
                                height: 40,
                                borderRadius: 20,
                                backgroundColor: theme.border,
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}>
                                <IconApp pack="FI" name="user" size={20} color={theme.gray} />
                            </View>
                        )}
                    </Pressable>
                    
                    {/* Publisher Details */}
                    <View style={{ flex: 1 }}>
                        <YambiText 
                            text={companyUser.user_name || item.phone_number || ""} 
                            size="normal" 
                            color="default" 
                            bold
                            style={{ marginBottom: 2, fontSize: 14 }} 
                        />
                        {company && company.category && companyUser.level && (() => {
                            const roleInfo = getCompanyUserRole(companyUser.level, company.category);
                            return roleInfo && roleInfo.role ? (
                                <YambiText 
                                    text={roleInfo.role} 
                                    size="small" 
                                    color="gray" 
                                    style={{ marginBottom: 2, fontSize: 12 }} 
                                />
                            ) : null;
                        })()}
                        <YambiText 
                            text={moment(item.createdAt).format('MMMM DD, YYYY [at] HH:mm')} 
                            size="small" 
                            color="gray" 
                            style={{ fontSize: 11 }} 
                        />
                    </View>
                </View>
            )}
            
            {item.title && (
                <YambiText text={item.title} bold size="normal" color="default" style={{ marginBottom: 8, fontSize: 18 }} />
            )}
            {item.description && (
                <YambiText text={item.description} size="normal" color="gray" numberLines={2} style={{ marginBottom: 8 }} />
            )}
            {item.content && (
                <YambiText text={item.content} size="normal" color="default" numberLines={3} style={{ marginBottom: 8 }} />
            )}
            </Pressable>
            
            {/* Timetable Table - Show when news_type === 2 */}
            {item.news_type === 2 && item.entries && item.entries.length > 0 && (
                <View style={{ marginTop: 12, marginBottom: 8 }}>
                    {/* Date Range */}
                    {item.start_date && item.end_date && (
                        <View style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft:  15}}>
                            <IconApp pack="FI" name="calendar" size={14} color={theme.high_color} />
                            <YambiText 
                                text={`${moment(item.start_date).format('MMM DD')} - ${moment(item.end_date).format('MMM DD, YYYY')}`} 
                                size="small" 
                                color="high" 
                                bold
                            />
                        </View>
                    )}
                    
                    {/* Timetable Table - Scrollable for mobile */}
                    <ScrollView
                        horizontal
                        nestedScrollEnabled={true}
                        scrollEnabled={true}
                        showsHorizontalScrollIndicator={false}
                        // The NewsItem outer container already has paddingHorizontal: 15,
                        // so avoid adding extra horizontal padding here (it forces unnecessary overflow).
                        style={{ marginHorizontal: 0 }}
                        contentContainerStyle={{ paddingBottom: 5 }}
                        directionalLockEnabled={true}
                        bounces={false}
                        overScrollMode="never"
                    >
                        <View style={{
                            backgroundColor: theme.border + '40',
                            overflow: 'hidden',
                            borderWidth: 1,
                            borderColor: theme.border,
                            // Take full available width; when there are many columns, the activity columns
                            // will keep min widths and the horizontal ScrollView will allow scrolling.
                            width: '100%',
                            minWidth: '100%'
                        }}>
                            {/* Table Header */}
                            <View style={{
                                flexDirection: 'row',
                                backgroundColor: theme.high_color + '20',
                                borderBottomWidth: 2,
                                borderBottomColor: theme.high_color + '60',
                                paddingVertical: 12,
                                paddingHorizontal: 12
                            }}>
                                <View style={{ width: 110, paddingRight: 8 }}>
                                    <YambiText text={(strings as any).date || "Date"} size="small" color="high" bold />
                                </View>
                                <View style={{ flex: 1, minWidth: 180, paddingRight: (hasAfternoonProgram || hasEveningProgram) ? 8 : 0 }}>
                                    <YambiText text={(strings as any).morning || "Morning"} size="small" color="high" bold />
                                </View>
                                {hasAfternoonProgram && (
                                    <View style={{ flex: 1, minWidth: 180, paddingRight: hasEveningProgram ? 8 : 0 }}>
                                        <YambiText text={(strings as any).afternoon || "Afternoon"} size="small" color="high" bold />
                                    </View>
                                )}
                                {hasEveningProgram && (
                                    <View style={{ flex: 1, minWidth: 180 }}>
                                        <YambiText text={(strings as any).evening || "Evening"} size="small" color="high" bold />
                                    </View>
                                )}
                            </View>
                            
                            {/* Table Rows */}
                            {item.entries.map((entry, index) => (
                                <View 
                                    key={entry._id || index}
                                    style={{
                                        flexDirection: 'row',
                                        borderBottomWidth: index < item.entries!.length - 1 ? 1 : 0,
                                        borderBottomColor: theme.border,
                                        paddingVertical: 14,
                                        paddingHorizontal: 12,
                                        backgroundColor: index % 2 === 0 ? 'transparent' : theme.border + '15',
                                        minHeight: 60
                                    }}
                                >
                                    {/* Date Column */}
                                    <View style={{ width: 110, paddingRight: 8, justifyContent: 'flex-start', paddingTop: 2 }}>
                                        <YambiText 
                                            text={entry.date_news ? moment(entry.date_news).format('MMM DD') : '-'} 
                                            size="small" 
                                            color="default" 
                                            bold
                                        />
                                        {entry.date_news && (
                                            <YambiText 
                                                text={moment(entry.date_news).format('ddd')} 
                                                size="small" 
                                                color="gray" 
                                                style={{ fontSize: 10, marginTop: 2 }}
                                            />
                                        )}
                                    </View>
                                    
                                    {/* Morning Column */}
                                    <View
                                        style={{
                                            flex: 1,
                                            minWidth: 180,
                                            paddingRight: (hasAfternoonProgram || hasEveningProgram) ? 8 : 0,
                                            justifyContent: 'flex-start'
                                        }}
                                    >
                                        {entry.morning && entry.morning.trim() !== "" ? (
                                            <View>
                                                <YambiText 
                                                    text={entry.morning} 
                                                    size="small" 
                                                    color="default" 
                                                    numberLines={3}
                                                    style={{ lineHeight: 18 }}
                                                />
                                                {(entry.morning_time || entry.morning_time_end) && (
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                                                        <IconApp pack="FI" name="clock" size={10} color={theme.high_color} />
                                                        <YambiText 
                                                            text={
                                                                entry.morning_time && entry.morning_time_end
                                                                    ? ` ${entry.morning_time} - ${entry.morning_time_end}`
                                                                    : ` ${entry.morning_time || entry.morning_time_end || ''}`
                                                            } 
                                                            size="small" 
                                                            color="high" 
                                                            style={{ fontSize: 11, marginLeft: 4 }}
                                                        />
                                                    </View>
                                                )}
                                            </View>
                                        ) : (
                                            <YambiText text="-" size="small" color="gray" style={{ opacity: 0.5 }} />
                                        )}
                                    </View>
                                    
                                    {/* Afternoon Column */}
                                    {hasAfternoonProgram && (
                                        <View style={{ flex: 1, minWidth: 180, paddingRight: hasEveningProgram ? 8 : 0, justifyContent: 'flex-start' }}>
                                            {entry.afternoon && entry.afternoon.trim() !== "" ? (
                                                <View>
                                                    <YambiText 
                                                        text={entry.afternoon} 
                                                        size="small" 
                                                        color="default" 
                                                        numberLines={3}
                                                        style={{ lineHeight: 18 }}
                                                    />
                                                    {(entry.afternoon_time || entry.afternoon_time_end) && (
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                                                            <IconApp pack="FI" name="clock" size={10} color={theme.high_color} />
                                                            <YambiText 
                                                                text={
                                                                    entry.afternoon_time && entry.afternoon_time_end
                                                                        ? ` ${entry.afternoon_time} - ${entry.afternoon_time_end}`
                                                                        : ` ${entry.afternoon_time || entry.afternoon_time_end || ''}`
                                                                } 
                                                                size="small" 
                                                                color="high" 
                                                                style={{ fontSize: 11, marginLeft: 4 }}
                                                            />
                                                        </View>
                                                    )}
                                                </View>
                                            ) : (
                                                <YambiText text="-" size="small" color="gray" style={{ opacity: 0.5 }} />
                                            )}
                                        </View>
                                    )}
                                    
                                    {/* Evening Column */}
                                    {hasEveningProgram && (
                                        <View style={{ flex: 1, minWidth: 180, justifyContent: 'flex-start' }}>
                                            {entry.evening && entry.evening.trim() !== "" ? (
                                                <View>
                                                    <YambiText 
                                                        text={entry.evening} 
                                                        size="small" 
                                                        color="default" 
                                                        numberLines={3}
                                                        style={{ lineHeight: 18 }}
                                                    />
                                                    {(entry.evening_time || entry.evening_time_end) && (
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                                                            <IconApp pack="FI" name="clock" size={10} color={theme.high_color} />
                                                            <YambiText 
                                                                text={
                                                                    entry.evening_time && entry.evening_time_end
                                                                        ? ` ${entry.evening_time} - ${entry.evening_time_end}`
                                                                        : ` ${entry.evening_time || entry.evening_time_end || ''}`
                                                                } 
                                                                size="small" 
                                                                color="high" 
                                                                style={{ fontSize: 11, marginLeft: 4 }}
                                                            />
                                                        </View>
                                                    )}
                                                </View>
                                            ) : (
                                                <YambiText text="-" size="small" color="gray" style={{ opacity: 0.5 }} />
                                            )}
                                        </View>
                                    )}
                                </View>
                            ))}
                        </View>
                    </ScrollView>
                </View>
            )}
            </View>
            
            {/* Images Layout */}
            {images.length > 0 && (
                <View style={{ marginBottom: 0, marginTop: 8 }}>
                    {images.length === 1 ? (
                        // 1 image: Full width, auto height
                        <Pressable 
                            onPress={(e) => {
                                e.stopPropagation();
                                handleImagePress(0);
                            }}
                        >
                            <AutoHeightImage
                                uri={images[0]}
                                width={CONTENT_WIDTH}
                                onPress={() => handleImagePress(0)}
                                theme={theme}
                            />
                        </Pressable>
                    ) : images.length === 2 ? (
                        // 2 images: Side by side, first auto-height, second fixed 300px
                        <View style={{ flexDirection: 'row' }}>
                            <Pressable 
                                onPress={(e) => {
                                    e.stopPropagation();
                                    handleImagePress(0);
                                }}
                                style={{ flex: 1 }}
                            >
                                <AutoHeightImage
                                    uri={images[0]}
                                    width={(CONTENT_WIDTH - 3) / 2}
                                    onPress={() => handleImagePress(0)}
                                    theme={theme}
                                />
                            </Pressable>
                            <Pressable 
                                onPress={(e) => {
                                    e.stopPropagation();
                                    handleImagePress(1);
                                }}
                                style={{ flex: 1 }}
                        >
                                <FixedHeightImage
                                    uri={images[1]}
                                    width={(CONTENT_WIDTH - 3) / 2}
                                    onPress={() => handleImagePress(1)}
                                    theme={theme}
                                />
                            </Pressable>
                        </View>
                    ) : (
                        // 3+ images: Dynamic layout based on aspect ratios
                        (() => {
                            // Check if 2+ of first 3 images are portrait (taller)
                            const portraitCount = imageAspectRatios.filter(r => r).length;
                            const isPortraitLayout = portraitCount >= 2;

                            if (isPortraitLayout) {
                                // Portrait layout: First 65%, 2nd+3rd 35% side by side to the right
                                return (
                                    <View style={{ flexDirection: 'row', gap: 3 }}>
                                        {/* First image - 65% width */}
                                        <Pressable 
                                            onPress={(e) => {
                                                e.stopPropagation();
                                                handleImagePress(0);
                                            }}
                                            style={{ width: CONTENT_WIDTH * 0.65 }}
                                        >
                                            <AutoHeightImage
                                                uri={images[0]}
                                                width={CONTENT_WIDTH * 0.65}
                                                onPress={() => handleImagePress(0)}
                                                theme={theme}
                                            />
                                        </Pressable>
                                        {/* Second and third images - 35% width, stacked vertically */}
                                        <View style={{ width: CONTENT_WIDTH * 0.35 - 3, gap: 3 }}>
                                            <Pressable 
                                                onPress={(e) => {
                                                    e.stopPropagation();
                                                    handleImagePress(1);
                                                }}
                                            >
                                                <FixedHeightImage
                                                    uri={images[1]}
                                                    width={CONTENT_WIDTH * 0.35 - 3}
                                                    onPress={() => handleImagePress(1)}
                                                    theme={theme}
                                                />
                                            </Pressable>
                                            <Pressable 
                                                onPress={(e) => {
                                                    e.stopPropagation();
                                                    handleImagePress(2);
                                                }}
                                            >
                                                <FixedHeightImage
                                                    uri={images[2]}
                                                    width={CONTENT_WIDTH * 0.35 - 3}
                                                    onPress={() => handleImagePress(2)}
                                                    showOverlay={images.length > 3}
                                                    overlayText={`+${images.length - 3}`}
                                                    theme={theme}
                                                />
                                            </Pressable>
                                        </View>
                                    </View>
                                );
                            } else {
                                // Landscape layout: First full width, then two side by side below
                                return (
                                    <View>
                                        {/* First image - full width */}
                                        <Pressable 
                                            onPress={(e) => {
                                                e.stopPropagation();
                                                handleImagePress(0);
                                            }}
                                        >
                                            <AutoHeightImage
                                                uri={images[0]}
                                                width={CONTENT_WIDTH}
                                                onPress={() => handleImagePress(0)}
                                                theme={theme}
                                            />
                                        </Pressable>
                                        {/* Second and third images side by side */}
                                        <View style={{ flexDirection: 'row', gap: 3, marginTop: 3 }}>
                                            <Pressable 
                                                onPress={(e) => {
                                                    e.stopPropagation();
                                                    handleImagePress(1);
                                                }}
                                                style={{ flex: 1 }}
                                            >
                                                <FixedHeightImage
                                                    uri={images[1]}
                                                    width={(CONTENT_WIDTH - 3) / 2}
                                                    onPress={() => handleImagePress(1)}
                                                    theme={theme}
                                                />
                                            </Pressable>
                                            <Pressable 
                                                onPress={(e) => {
                                                    e.stopPropagation();
                                                    handleImagePress(2);
                                                }}
                                                style={{ flex: 1 }}
                                            >
                                                <FixedHeightImage
                                                    uri={images[2]}
                                                    width={(CONTENT_WIDTH - 3) / 2}
                                                    onPress={() => handleImagePress(2)}
                                                    showOverlay={images.length > 3}
                                                    overlayText={`+${images.length - 3}`}
                                                    theme={theme}
                                                />
                                            </Pressable>
                                        </View>
                                    </View>
                                );
                            }
                        })()
                    )}
                </View>
            )}

            {/* Like and Comment Buttons */}
            {!isTimetable && (
                <Pressable style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    paddingHorizontal: 15,
                    paddingTop: 12,
                    paddingBottom: 8,
                    borderTopWidth: 1,
                    borderColor: theme.border + '40',
                    gap: 20
                }}>
                    {/* Like Button */}
                        <Pressable
                            onPress={() => {
                                if (!item?._id || !user_data?.phone_number) return;
                                
                                // Optimistic update
                                const newIsLiked = !isLiked;
                                const newCount = newIsLiked ? reactionCount + 1 : Math.max(0, reactionCount - 1);
                                
                                // Trigger bounce animation if reaction count changes
                                if (newCount !== prevReactionCount.current) {
                                    Animated.sequence([
                                        Animated.spring(heartScale, {
                                            toValue: 1.3,
                                            useNativeDriver: true,
                                            tension: 300,
                                            friction: 3,
                                        }),
                                        Animated.spring(heartScale, {
                                            toValue: 1,
                                            useNativeDriver: true,
                                            tension: 300,
                                            friction: 3,
                                        }),
                                    ]).start();
                                    prevReactionCount.current = newCount;
                                }
                                
                                setIsLiked(newIsLiked);
                                setReactionCount(newCount);
                                
                                // Send socket event
                                SocketApp.emit('toggleReaction', {
                                    news_id: item._id,
                                    phone_number: user_data.phone_number,
                                    reaction_id: 1,
                                    reaction_type: 1,
                                    business_id: "",
                                    message_id: "",
                                    comment_id: null,
                                    sales_point_id: "",
                                    item_id: "",
                                    comment_text: ""
                                });
                            }}
                        style={{ 
                            flexDirection: 'row', 
                            alignItems: 'center', 
                            gap: 6,
                            paddingVertical: 4,
                            paddingHorizontal: 8,
                            borderRadius: 20,
                            backgroundColor: isLiked ? theme.high_color + '15' : 'transparent'
                        }}
                    >
                        <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                            <IconApp 
                                pack="OC" 
                                name="heart-fill" 
                                size={18} 
                                color={isLiked ? "#FF0000" : theme.gray} 
                            />
                        </Animated.View>
                        {reactionCount > 0 && (
                            <YambiText 
                                text={reactionCount.toString()} 
                                size="small" 
                                color={isLiked ? "high" : "gray"} 
                                style={{ fontSize: 13 }}
                            />
                        )}
                    </Pressable>

                    {/* Comment Section */}
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        {/* Comment Button */}
                        <Pressable
                            onPress={() => {
                                RootNavigation.navigate("PostReactions", { post: item });
                            }}
                            style={{ 
                                flexDirection: 'row', 
                                alignItems: 'center', 
                                gap: 6,
                                paddingVertical: 4,
                                paddingHorizontal: 8,
                                borderRadius: 20
                            }}
                        >
                            <Animated.View style={{ transform: [{ scale: commentIconScale }] }}>
                                <IconApp 
                                    pack="FI" 
                                    name="message-circle" 
                                    size={18} 
                                    color={theme.gray} 
                                />
                            </Animated.View>
                            {commentCount > 0 && (
                                <YambiText 
                                    text={commentCount.toString()} 
                                    size="small" 
                                    color="gray" 
                                    style={{ fontSize: 13 }}
                                />
                            )}
                        </Pressable>

                        {/* Quick Comment Input */}
                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <TextInput
                                value={commentText}
                                onChangeText={setCommentText}
                                placeholder={strings.add_comment || "Add a comment..."}
                                placeholderTextColor={theme.gray}
                                style={{
                                    flex: 1,
                                    backgroundColor: theme.border + '30',
                                    borderRadius: 20,
                                    paddingHorizontal: 12,
                                    paddingVertical: 10,
                                    minHeight: 40,
                                    maxHeight: 100,
                                    color: theme.text,
                                    borderWidth: 1,
                                    borderColor: theme.border
                                }}
                                multiline={true}
                                textAlignVertical="top"
                            />
                            {commentText.trim().length > 0 && (
                                <Pressable
                                    onPress={() => {
                                        if (!item?._id || !user_data?.phone_number || !commentText.trim()) return;
                                        
                                        // Send comment via socket
                                        SocketApp.emit('toggleReaction', {
                                            news_id: item._id,
                                            phone_number: user_data.phone_number,
                                            reaction_id: 0,
                                            reaction_type: 2,
                                            comment_text: commentText.trim(),
                                            business_id: "",
                                            message_id: "",
                                            comment_id: null,
                                            sales_point_id: "",
                                            item_id: ""
                                        });
                                        
                                        setCommentText("");
                                    }}
                                    style={{
                                        padding: 6,
                                        borderRadius: 20,
                                        backgroundColor: theme.design_tip2
                                    }}
                                >
                                    <IconApp 
                                        pack="FI" 
                                        name="send" 
                                        size={16} 
                                        color={theme.text_design2} 
                                    />
                                </Pressable>
                            )}
                        </View>
                    </View>
                </Pressable>
            )}

            {/* Comments Preview Section */}
            {!isTimetable && comments.length > 0 && (
                <Pressable style={{ paddingHorizontal: 15, paddingTop: 0, paddingBottom: 0 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 }}>
                        <YambiText 
                            text={`${strings.comments} (${commentCount})`} 
                            size="small" 
                            color="default" 
                            bold
                            style={{ fontSize: 13 }} 
                        />
                        {commentCount > 2 && (
                            <Pressable
                                onPress={() => {
                                    RootNavigation.navigate("PostReactions", { post: item });
                                }}
                            >
                                <YambiText 
                                    text={strings.see_more} 
                                    size="small" 
                                    color="high" 
                                    style={{ fontSize: 12 }} 
                                />
                            </Pressable>
                        )}
                    </View>
                    <LegendList
                        data={comments as never}
                        keyExtractor={(item: any, index: number) => item._id || index.toString()}
                        scrollEnabled={false}
                        renderItem={({ item }: { item: any }) => (
                                <CommentItem 
                                    comment={item} 
                                    theme={theme} 
                                    size="small"
                                    showFullText={false}
                                />
                        )}
                    />
                </Pressable>
            )}
        </Pressable>
    );
};

export default memo(NewsItem);
