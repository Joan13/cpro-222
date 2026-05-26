import { View, ScrollView, Dimensions, Image, Pressable, TextInput, RefreshControl, Animated, Platform } from "react-native";
import { useEffect, useState, useRef } from 'react';
import { useAppSelector, useAppDispatch } from "../../store/app/hooks";
import { strings } from "../../lang/lang";
import { IconApp } from "../../components/app/IconApp";
import { YambiText } from "../../components/app/Text";
import { remote_host, SocketApp, media_url } from "../../../GlobalVariables";
import axios from "axios";
import { NavProps, TCompany, TCompanyUser } from "../../types/types";
import FastImage from 'react-native-fast-image';
import * as RootNavigation from '../../services/Navigation_ref';
import { getCompanyUserRole } from "../../util/getCompanyUserRole";
import moment from "moment";
import ModalApp from "../../components/app/ModalApp";
import { setShowModalApp } from "../../store/reducers/appSlice";
import { useRealm } from "@realm/react";
import CommentItem from "../../components/lists/notice_board/CommentItem";
import { LegendList } from '@legendapp/list';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CONTENT_WIDTH = SCREEN_WIDTH; // Account for padding

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
    const [imageHeight, setImageHeight] = useState(200);
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
                setImageHeight(200); // Default height on error
            }
        );
    }, [imageUri, width]);

    return (
        <Pressable
            onPress={onPress}
            style={{
                width: width,
                height: imageHeight,
                // borderRadius: 8,
                overflow: 'hidden',
                backgroundColor: theme.border + '20',
            }}
        >
            <FastImage
                source={{ uri: imageUri }}
                style={{
                    width: '100%',
                    height: '100%',
                }}
                resizeMode={FastImage.resizeMode.cover}
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
                // borderRadius: 8,
                overflow: 'hidden',
                backgroundColor: theme.border + '20',
            }}
        >
            <FastImage
                source={{ uri: imageUri }}
                style={{
                    width: '100%',
                    height: '100%',
                }}
                resizeMode={FastImage.resizeMode.cover}
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

const Post = ({ navigation, route }: NavProps) => {
    const theme = useAppSelector(state => state.app_theme.colors);
    const user_data = useAppSelector(state => state.user_data);
    const dispatch = useAppDispatch();
    const realm = useRealm();
    const { post: initialPost, id } = route.params as { post?: any; id?: string };
    const fromDeepLinkRef = useRef(!!id && !initialPost);
    const [post, setPost] = useState<any>(initialPost || null);
    const [loading, setLoading] = useState<boolean>(() => !!(id && !initialPost));
    const [postNotFound, setPostNotFound] = useState(false);
    const [company, setCompany] = useState<TCompany | null>(null);
    const [companyUser, setCompanyUser] = useState<TCompanyUser | null>(null);
    const [userProfile, setUserProfile] = useState<string>("");
    const [images, setImages] = useState<string[]>([]);
    const [imageAspectRatios, setImageAspectRatios] = useState<boolean[]>([]); // true = portrait (height > width), false = landscape
    const [isLiked, setIsLiked] = useState<boolean>(false);
    const [reactionCount, setReactionCount] = useState<number>(0);
    const [commentText, setCommentText] = useState<string>("");
    const [comments, setComments] = useState<any[]>([]);
    const [commentCount, setCommentCount] = useState<number>(0);
    const heartScale = useRef(new Animated.Value(1)).current;
    const prevReactionCount = useRef<number>(0);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
    const [showInternetError, setShowInternetError] = useState<boolean>(false);

    // Function to load post-related data (company, user, images)
    const loadPostData = (postData: any) => {
        // Fetch company data and company user data
        if (postData.company_id) {
            axios.post(remote_host + "/yambi/API/get_company", {
                company_id: postData.company_id
            })
            .then(res => {
                if (res.data.success === "1") {
                    setCompany(res.data.company);
                    
                    // Fetch company user data if phone_number is available
                    if (postData.phone_number && res.data.companyUsers) {
                        const user = res.data.companyUsers.find((cu: TCompanyUser) => 
                            cu.phone_number === postData.phone_number && cu.company_id === postData.company_id
                        );
                        if (user) {
                            setCompanyUser(user);
                        }
                    }
                }
            })
            .catch(() => { });
        }

        // Fetch user profile picture
        if (postData.phone_number) {
            axios.post(remote_host + "/yambi/API/fetch_user_data", {
                user: postData.phone_number
            })
            .then(res => {
                if (res.data.success === "1" && res.data.assemble) {
                    setUserProfile(res.data.assemble.user_profile || "");
                }
            })
            .catch(() => { });
        }

        // Parse images if available
        if (postData.images) {
            try {
                const parsedImages = JSON.parse(postData.images);
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
                if (typeof postData.images === 'string' && postData.images.trim() !== '') {
                    setImages([postData.images]);
                }
            }
        } else {
            setImages([]);
        }
    };

    // Fetch initial like status and count
    const fetchLikeData = async () => {
        if (!post?._id || !user_data?.phone_number) return;
        
        try {
            const res = await axios.post(remote_host + "/yambi/API/get_post", {
                post_id: post._id,
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

    // Fetch comments
    const fetchComments = async () => {
        if (!post?._id) return;
        
        try {
            const res = await axios.post(remote_host + "/yambi/API/get_comments", {
                news_id: post._id
            });
            
            if (res.data.success === "1") {
                setComments(res.data.comments || []);
                setCommentCount(res.data.comment_count || 0);
            }
        } catch (error) {
            console.error("Error fetching comments:", error);
        }
    };

    // Refresh function to fetch latest post data
    const onRefresh = async () => {
        if (!post?._id) return;
        
        setRefreshing(true);
        try {
            const res = await axios.post(remote_host + "/yambi/API/get_post", {
                post_id: post._id,
                phone_number: user_data?.phone_number
            });
            
            if (res.data.success === "1" && res.data.post) {
                setPost(res.data.post);
                loadPostData(res.data.post);
                setIsLiked(res.data.is_liked || false);
                setReactionCount(res.data.like_count || 0);
                // Fetch comments on refresh
                fetchComments();
            }
        } catch (error) {
            console.error("Error refreshing post:", error);
        } finally {
            setRefreshing(false);
        }
    };

    // Check if current user is admin for the post's company
    useEffect(() => {
        if (post?.company_id && user_data?.phone_number) {
            try {
                const currentUserCompanyUser = realm.objects('CompanyUsers').filtered(
                    'phone_number == $0 && company_id == $1 && is_admin == $2 && user_active == $3',
                    user_data.phone_number,
                    post.company_id,
                    1,
                    1
                );
                setIsAdmin(currentUserCompanyUser.length > 0);
            } catch (e) {
                setIsAdmin(false);
            }
        } else {
            setIsAdmin(false);
        }
    }, [post?.company_id, user_data?.phone_number, realm]);

    // Fetch post by id if only id is provided (from deep link)
    useEffect(() => {
        if (id && !post) {
            setLoading(true);
            setPostNotFound(false);
            axios.post(remote_host + "/yambi/API/get_post", {
                post_id: id,
                phone_number: user_data?.phone_number
            })
            .then(res => {
                if (res.data.success === "1" && res.data.post) {
                    console.log("Opened post:", id);
                    setPost(res.data.post);
                    loadPostData(res.data.post);
                    setIsLiked(res.data.is_liked || false);
                    setReactionCount(res.data.like_count || 0);
                } else {
                    setPostNotFound(true);
                }
            })
            .catch(error => {
                console.error("Error fetching post:", error);
                setPostNotFound(true);
            })
            .finally(() => {
                setLoading(false);
            });
        } else if (id && post) {
            console.log("Opened post:", id);
        }
    }, [id]);

    // Fetch initial like data and comments on mount
    useEffect(() => {
        if (post?._id) {
            fetchLikeData();
            fetchComments();
        }
    }, [post?._id]);

    // Initialize prevReactionCount when reactionCount is fetched
    useEffect(() => {
        prevReactionCount.current = reactionCount;
    }, [reactionCount]);

    // Listen for socket updates on reaction changes
    useEffect(() => {
        if (!post?._id) return;

        const handleReactionUpdate = (data: any) => {
            if (data.news_id === post._id) {
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
            if (data.news_id === post._id) {
                // Add new comment to the list
                setComments(prev => [...prev, data.comment]);
                setCommentCount(data.comment_count || 0);
            }
        };

        SocketApp.on('reactionUpdated', handleReactionUpdate);
        SocketApp.on('commentAdded', handleCommentAdded);

        return () => {
            SocketApp.off('reactionUpdated', handleReactionUpdate);
            SocketApp.off('commentAdded', handleCommentAdded);
        };
    }, [post?._id, user_data?.phone_number, heartScale]);

    // Delete post function
    const deletePost = () => {
        if (!post?._id) return;
        
        axios.post(remote_host + "/yambi/API/edit_news", {
            news: {
                _id: post._id,
                company_id: post.company_id,
                title: post.title,
                description: post.description || "",
                content: post.content,
                tags: post.tags || "",
                images: post.images || "",
                createdAt: post.createdAt,
                updatedAt: moment(new Date()).format()
            },
            phone_number: user_data.phone_number,
            flag: "0" // flag 0 for delete
        })
        .then(res => {
            if (res.data.success === "1") {
                setShowDeleteModal(false);
                dispatch(setShowModalApp(false));
                navigation.goBack();
            } else {
                setShowInternetError(true);
                dispatch(setShowModalApp(true));
            }
        })
        .catch(() => {
            setShowInternetError(true);
            dispatch(setShowModalApp(true));
        });
    };

    useEffect(() => {
        const deepLink = fromDeepLinkRef.current;
        const headerLeft = deepLink
            ? () => (
                <Pressable
                    onPress={() => navigation.navigate('Home' as never)}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    style={{ marginLeft: Platform.OS === 'ios' ? 8 : 4 }}>
                    <IconApp
                        pack="FI"
                        name={Platform.OS === 'android' ? 'arrow-left' : 'chevron-left'}
                        size={22}
                        color={theme.text_design1}
                    />
                </Pressable>
            )
            : undefined;

        if (post) {
            navigation.setOptions({
                title: post.title || strings.news,
                headerLeft,
                headerRight: isAdmin ? () => (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10 }}>
                    <Pressable
                        onPress={() => {
                            navigation.navigate('EditNews', { news: post });
                        }}
                        style={{
                            height: 30,
                            width: 30,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 10
                        }}
                    >
                        <IconApp pack="FI" name="edit" size={20} color={theme.text_design1} />
                    </Pressable>
                    <Pressable
                        onPress={() => {
                            setShowDeleteModal(true);
                            dispatch(setShowModalApp(true));
                        }}
                        style={{
                            height: 30,
                            width: 30,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 10
                        }}
                    >
                        <IconApp pack="FI" name="trash-2" size={20} color={theme.error || theme.high_color} />
                    </Pressable>
                </View>
            ) : undefined
            });
            loadPostData(post);
        } else {
            navigation.setOptions({
                title: strings.news,
                headerLeft,
                headerRight: undefined,
            });
        }
    }, [post, navigation, isAdmin, theme]);

    // Show loading state if post is being fetched
    if (loading) {
        return (
            <View style={{
                flex: 1,
                backgroundColor: theme.background,
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                <YambiText text={strings.loading || "Loading..."} size="normal" color="gray" />
            </View>
        );
    }

    // Deep-linked id but no matching post on server
    if (postNotFound || (!post && id)) {
        return (
            <View style={{
                flex: 1,
                backgroundColor: theme.background,
                justifyContent: 'center',
                alignItems: 'center',
                paddingHorizontal: 32,
            }}>
                <IconApp pack="FI" name="file-text" size={56} color={theme.gray} />
                <YambiText
                    text={strings.post_not_found}
                    size="normal"
                    color="gray"
                    style={{ textAlign: 'center', marginTop: 16 }}
                />
            </View>
        );
    }

    // Show error state if no post and no id
    if (!post && !id) {
        return (
            <View style={{
                flex: 1,
                backgroundColor: theme.background,
                justifyContent: 'center',
                alignItems: 'center',
                paddingHorizontal: 32,
            }}>
                <IconApp pack="FI" name="file-text" size={56} color={theme.gray} />
                <YambiText text={strings.error || "Error loading post"} size="normal" color="gray" style={{ textAlign: 'center', marginTop: 16 }} />
            </View>
        );
    }

    return (
        <View style={{
            flex: 1,
            backgroundColor: theme.background,
            borderColor: theme.border,
            borderTopWidth: 1
        }}>
            <ScrollView 
                keyboardShouldPersistTaps='handled'
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[theme.high_color]}
                        tintColor={theme.high_color}
                    />
                }
            >
            <View style={{ paddingHorizontal: 15, paddingTop: 15, paddingBottom: 20 }}>
                {/* Company Name */}
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
                                <FastImage
                                    style={{ width: 40, height: 40, borderRadius: 20 }}
                                    resizeMode={FastImage.resizeMode.cover}
                                    source={{
                                        priority: FastImage.priority.normal,
                                        cache: 'immutable',
                                        uri: media_url + "/profile_pictures/" + userProfile
                                    }}
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
                                text={companyUser.user_name || post.phone_number || ""} 
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
                                text={moment(post.createdAt).format('MMMM DD, YYYY [at] HH:mm')} 
                                size="small" 
                                color="gray" 
                                style={{ fontSize: 11 }} 
                            />
                        </View>
                    </View>
                )}

                {/* Title */}
                {post.title && (
                    <YambiText text={post.title} bold size="normal" color="default" style={{ marginBottom: 10, fontSize: 24 }} />
                )}

                {/* Description */}
                {post.description && (
                    <YambiText text={post.description} size="normal" color="gray" style={{ marginBottom: 0, fontStyle: 'italic' }} />
                )}

                {/* Timetable Table - grouped programs */}
                {post?.news_type === 2 && post?.entries && post.entries.length > 0 && (
                    (() => {
                        const hasAfternoonProgram = post.entries.some((e: any) => (e?.afternoon || "").trim() !== "");
                        const hasEveningProgram = post.entries.some((e: any) => (e?.evening || "").trim() !== "");

                        const formatTimeRange = (start?: string, end?: string) => {
                            const s = (start || "").trim();
                            const e = (end || "").trim();
                            if (s && e) return `${s} - ${e}`;
                            return s || e || "";
                        };

                        return (
                            <View style={{ marginTop: 12, marginBottom: 15 }}>
                                {/* Date Range */}
                                {post.start_date && post.end_date && (
                                    <View style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <IconApp pack="FI" name="calendar" size={14} color={theme.high_color} />
                                        <YambiText
                                            text={`${moment(post.start_date).format('MMM DD')} - ${moment(post.end_date).format('MMM DD, YYYY')}`}
                                            size="normal"
                                            color="high"
                                            bold
                                        />
                                    </View>
                                )}

                                {/* Vertical timetable blocks (no nested horizontal ScrollView) */}
                                <View>
                                    {post.entries.map((entry: any, index: number) => {
                                        const dateLabel = entry.date_news ? moment(entry.date_news).format('MMM DD') : '-';
                                        const dayLabel = entry.date_news ? moment(entry.date_news).format('ddd') : '';

                                        const morningRange = formatTimeRange(entry.morning_time, entry.morning_time_end);
                                        const afternoonRange = formatTimeRange(entry.afternoon_time, entry.afternoon_time_end);
                                        const eveningRange = formatTimeRange(entry.evening_time, entry.evening_time_end);

                                        return (
                                            <View
                                                key={entry._id || index}
                                                style={{
                                                    backgroundColor: theme.border + (index % 2 === 0 ? '20' : '10'),
                                                    borderColor: theme.border,
                                                    borderWidth: 1,
                                                    borderRadius: 10,
                                                    // padding: 12,
                                                    marginBottom: 10,
                                                    paddingTop:0
                                                }}
                                            >
                                                {/* Date pill */}
                                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <View
                                                        style={{
                                                            backgroundColor: theme.high_color + '18',
                                                            borderColor: theme.high_color + '40',
                                                            borderWidth: 1,
                                                            borderTopEndRadius:10,
                                                            borderTopStartRadius:10,
                                                            paddingHorizontal: 12,
                                                            paddingVertical: 8,
                                                            flex:1,
                                                            flexDirection:'row',
                                                        }}
                                                    >
                                                        <YambiText
                                                            text={dateLabel}
                                                            size="normal"
                                                            color="high"
                                                            bold
                                                            style={{ fontSize: 14, flex:1 }}
                                                        />
                                                        {dayLabel ? (
                                                            <YambiText
                                                                text={dayLabel}
                                                                size="normal"
                                                                color="gray"
                                                                style={{ fontSize: 10, marginTop: 2 }}
                                                            />
                                                        ) : null}
                                                    </View>
                                                </View>

                                                {/* Morning */}
                                                {entry.morning && entry.morning.trim() !== "" ? (
                                                    <View
                                                        style={{
                                                            marginTop: 10,
                                                            marginHorizontal: 0,
                                                            width: '100%',
                                                            alignSelf: 'stretch',
                                                            backgroundColor: 'transparent',
                                                            borderRadius: 10
                                                        }}
                                                    >
                                                        {/* Padding on inner content so the background itself fills the whole width */}
                                                        <View style={{ paddingHorizontal: 12 }}>
                                                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                                                <YambiText text={(strings as any).morning || "Morning"} size="normal" color="high" bold />
                                                                {morningRange ? (
                                                                    <View
                                                                        style={{
                                                                            backgroundColor: theme.high_color + '18',
                                                                            borderColor: theme.high_color + '40',
                                                                            borderWidth: 1,
                                                                            borderRadius: 10,
                                                                            paddingHorizontal: 10,
                                                                            paddingVertical: 2,
                                                                            flexDirection: 'row',
                                                                            alignItems: 'center'
                                                                        }}
                                                                    >
                                                                        <IconApp pack="FI" name="clock" size={10} color={theme.high_color} />
                                                                        <YambiText text={morningRange} size="normal" color="high" style={{ fontSize: 11, marginLeft: 6 }} />
                                                                    </View>
                                                                ) : null}
                                                            </View>
                                                            <YambiText
                                                                text={entry.morning}
                                                                size="normal"
                                                                color="default"
                                                                numberLines={3}
                                                                style={{ marginTop: 6, lineHeight: 18 }}
                                                            />
                                                        </View>
                                                    </View>
                                                ) : null}

                                                {/* Separator (Morning -> Afternoon) */}
                                                {entry.morning && entry.morning.trim() !== "" && hasAfternoonProgram && entry.afternoon && entry.afternoon.trim() !== "" ? (
                                                    <View
                                                        style={{
                                                            marginVertical: 10,
                                                            marginHorizontal: 0,
                                                            width: '100%',
                                                            alignSelf: 'stretch',
                                                            backgroundColor: 'transparent',
                                                            borderRadius: 0,
                                                            paddingVertical: 0
                                                        }}
                                                    >
                                                        <View style={{ height: 1, backgroundColor: theme.border, width: '100%' }} />
                                                    </View>
                                                ) : null}

                                                {/* Afternoon */}
                                                {hasAfternoonProgram && entry.afternoon && entry.afternoon.trim() !== "" ? (
                                                    <View
                                                        style={{
                                                            marginTop: 10,
                                                            marginHorizontal: 0,
                                                            width: '100%',
                                                            alignSelf: 'stretch',
                                                            backgroundColor: 'transparent',
                                                            borderRadius: 10,
                                                            paddingHorizontal: 12
                                                        }}
                                                    >
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                                            <YambiText text={(strings as any).afternoon || "Afternoon"} size="normal" color="high" bold />
                                                            {afternoonRange ? (
                                                                <View
                                                                    style={{
                                                                        backgroundColor: theme.high_color + '18',
                                                                        borderColor: theme.high_color + '40',
                                                                        borderWidth: 1,
                                                                        borderRadius: 10,
                                                                        paddingHorizontal: 10,
                                                                        paddingVertical: 2,
                                                                        flexDirection: 'row',
                                                                        alignItems: 'center'
                                                                    }}
                                                                >
                                                                    <IconApp pack="FI" name="clock" size={10} color={theme.high_color} />
                                                                    <YambiText text={afternoonRange} size="normal" color="high" style={{ fontSize: 11, marginLeft: 6 }} />
                                                                </View>
                                                            ) : null}
                                                        </View>
                                                        <YambiText
                                                            text={entry.afternoon}
                                                            size="normal"
                                                            color="default"
                                                            numberLines={3}
                                                            style={{ marginTop: 6, lineHeight: 18 }}
                                                        />
                                                    </View>
                                                ) : null}

                                                {/* Separator (Afternoon -> Evening) */}
                                                {hasAfternoonProgram && entry.afternoon && entry.afternoon.trim() !== "" && hasEveningProgram && entry.evening && entry.evening.trim() !== "" ? (
                                                    <View
                                                        style={{
                                                            marginVertical: 10,
                                                            marginHorizontal: 0,
                                                            width: '100%',
                                                            alignSelf: 'stretch',
                                                            backgroundColor: 'transparent',
                                                            borderRadius: 0,
                                                            paddingVertical: 0
                                                        }}
                                                    >
                                                        <View style={{ height: 1, backgroundColor: theme.border + '45', width: '100%' }} />
                                                    </View>
                                                ) : null}

                                                {/* Evening */}
                                                {hasEveningProgram && entry.evening && entry.evening.trim() !== "" ? (
                                                    <View
                                                        style={{
                                                            marginTop: 10,
                                                            marginHorizontal: 0,
                                                            width: '100%',
                                                            alignSelf: 'stretch',
                                                            backgroundColor: 'transparent',
                                                            borderRadius: 10,
                                                            paddingHorizontal: 12
                                                        }}
                                                    >
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                                            <YambiText text={(strings as any).evening || "Evening"} size="normal" color="high" bold />
                                                            {eveningRange ? (
                                                                <View
                                                                    style={{
                                                                        backgroundColor: theme.high_color + '18',
                                                                        borderColor: theme.high_color + '40',
                                                                        borderWidth: 1,
                                                                        borderRadius: 10,
                                                                        paddingHorizontal: 10,
                                                                        paddingVertical: 2,
                                                                        flexDirection: 'row',
                                                                        alignItems: 'center'
                                                                    }}
                                                                >
                                                                    <IconApp pack="FI" name="clock" size={10} color={theme.high_color} />
                                                                    <YambiText text={eveningRange} size="normal" color="high" style={{ fontSize: 11, marginLeft: 6 }} />
                                                                </View>
                                                            ) : null}
                                                        </View>
                                                        <YambiText
                                                            text={entry.evening}
                                                            size="normal"
                                                            color="default"
                                                            numberLines={3}
                                                            style={{ marginTop: 6, lineHeight: 18 }}
                                                        />
                                                    </View>
                                                ) : null}
                                            </View>
                                        );
                                    })}
                                </View>
                            </View>
                        );
                    })()
                )}
            </View>

            {/* Images Layout - Full width, no padding */}
            {images.length > 0 && (
                <View style={{ marginBottom: 15, marginTop: 0 }}>
                        {images.length === 1 ? (
                            // 1 image: Full width, auto height
                            <AutoHeightImage
                                uri={images[0]}
                                width={CONTENT_WIDTH}
                                onPress={() => {
                                    const imageUrls = images.map(img => media_url + "/news_images/" + img);
                                    RootNavigation.navigate("ViewPhoto", { 
                                        images: imageUrls,
                                        initialIndex: 0
                                    });
                                }}
                                theme={theme}
                            />
                        ) : images.length === 2 ? (
                            // 2 images: Side by side, first auto-height, second fixed 300px
                            <View style={{ flexDirection: 'row', gap: 3 }}>
                                <AutoHeightImage
                                    uri={images[0]}
                                    width={(CONTENT_WIDTH - 3) / 2}
                                    onPress={() => {
                                        const imageUrls = images.map(img => media_url + "/news_images/" + img);
                                        RootNavigation.navigate("ViewPhoto", { 
                                            images: imageUrls,
                                            initialIndex: 0
                                        });
                                    }}
                                    theme={theme}
                                />
                                <FixedHeightImage
                                    uri={images[1]}
                                    width={(CONTENT_WIDTH - 3) / 2}
                                    onPress={() => {
                                        const imageUrls = images.map(img => media_url + "/news_images/" + img);
                                        RootNavigation.navigate("ViewPhoto", { 
                                            images: imageUrls,
                                            initialIndex: 1
                                        });
                                    }}
                                    theme={theme}
                                />
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
                                            <AutoHeightImage
                                                uri={images[0]}
                                                width={CONTENT_WIDTH * 0.65}
                                                onPress={() => {
                                                    const imageUrls = images.map(img => media_url + "/news_images/" + img);
                                                    RootNavigation.navigate("ViewPhoto", { 
                                                        images: imageUrls,
                                                        initialIndex: 0
                                                    });
                                                }}
                                                theme={theme}
                                            />
                                            {/* Second and third images - 35% width, stacked vertically */}
                                            <View style={{ width: CONTENT_WIDTH * 0.35 - 3, gap: 3 }}>
                                                <FixedHeightImage
                                                    uri={images[1]}
                                                    width={CONTENT_WIDTH * 0.35 - 3}
                                                    onPress={() => {
                                                        const imageUrls = images.map(img => media_url + "/news_images/" + img);
                                                        RootNavigation.navigate("ViewPhoto", { 
                                                            images: imageUrls,
                                                            initialIndex: 1
                                                        });
                                                    }}
                                                    theme={theme}
                                                />
                                                <FixedHeightImage
                                                    uri={images[2]}
                                                    width={CONTENT_WIDTH * 0.35 - 3}
                                                    onPress={() => {
                                                        const imageUrls = images.map(img => media_url + "/news_images/" + img);
                                                        RootNavigation.navigate("ViewPhoto", { 
                                                            images: imageUrls,
                                                            initialIndex: 2
                                                        });
                                                    }}
                                                    showOverlay={images.length > 3}
                                                    overlayText={`+${images.length - 3}`}
                                                    theme={theme}
                                                />
                                            </View>
                                        </View>
                                    );
                                } else {
                                    // Landscape layout: First full width, then two side by side below
                                    return (
                                        <View>
                                            {/* First image - full width */}
                                            <AutoHeightImage
                                                uri={images[0]}
                                                width={CONTENT_WIDTH}
                                                onPress={() => {
                                                    const imageUrls = images.map(img => media_url + "/news_images/" + img);
                                                    RootNavigation.navigate("ViewPhoto", { 
                                                        images: imageUrls,
                                                        initialIndex: 0
                                                    });
                                                }}
                                                theme={theme}
                                            />
                                            {/* Second and third images side by side */}
                                            <View style={{ flexDirection: 'row', gap: 3, marginTop: 3 }}>
                                                <FixedHeightImage
                                                    uri={images[1]}
                                                    width={(CONTENT_WIDTH - 3) / 2}
                                                    onPress={() => {
                                                        const imageUrls = images.map(img => media_url + "/news_images/" + img);
                                                        RootNavigation.navigate("ViewPhoto", { 
                                                            images: imageUrls,
                                                            initialIndex: 1
                                                        });
                                                    }}
                                                    theme={theme}
                                                />
                                                <FixedHeightImage
                                                    uri={images[2]}
                                                    width={(CONTENT_WIDTH - 3) / 2}
                                                    onPress={() => {
                                                        const imageUrls = images.map(img => media_url + "/news_images/" + img);
                                                        RootNavigation.navigate("ViewPhoto", { 
                                                            images: imageUrls,
                                                            initialIndex: 2
                                                        });
                                                    }}
                                                    showOverlay={images.length > 3}
                                                    overlayText={`+${images.length - 3}`}
                                                    theme={theme}
                                                />
                                            </View>
                                        </View>
                                    );
                                }
                            })()
                        )}
                    </View>
                )}

            {/* Tags - placed just under the pictures block */}
            {(() => {
                // Get all tags: main tag (company abbreviated name) + news tags
                const allTags: string[] = [];
                
                // Add main tag (company abbreviated name) first if available
                if (company && company.company_name_abb && company.company_name_abb.trim() !== "") {
                    allTags.push("#" + company.company_name_abb.trim());
                }
                
                // Add news tags if available
                if (post.tags && post.tags.trim() !== "") {
                    const newsTags = post.tags.trim().split(/\s+/).filter(tag => tag.trim() !== "");
                    newsTags.forEach(tag => {
                        // Avoid duplicate of main tag (remove # prefix for comparison)
                        const normalizedTag = tag.replace(/^#+/, '').trim();
                        const mainTagNormalized = company?.company_name_abb?.trim() || "";
                        if (normalizedTag.toLowerCase() !== mainTagNormalized.toLowerCase()) {
                            // Ensure tag has # prefix
                            const tagWithHash = tag.startsWith('#') ? tag : '#' + tag;
                            allTags.push(tagWithHash);
                        }
                    });
                }
                
                return allTags.length > 0 ? (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8, marginBottom: 15, paddingHorizontal: 15 }}>
                        {allTags.map((tag, tagIndex) => (
                            <View
                                key={tagIndex}
                                style={{
                                    paddingHorizontal: 12,
                                    paddingVertical: 6,
                                    borderRadius: 20,
                                    borderWidth: 1,
                                    borderColor: theme.high_color + '40'
                                }}
                            >
                                <YambiText text={tag} size="small" color="high" />
                            </View>
                        ))}
                    </View>
                ) : null;
            })()}

            {/* Content - with padding */}
            <View style={{ paddingHorizontal: 15, paddingBottom: 20 }}>
                {/* Content */}
                {post.content && (
                    <YambiText text={post.content} size="normal" color="default" style={{ marginBottom: 10, lineHeight: 24 }} />
                )}

                {/* Date */}
                {/* <View style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    marginTop: 15,
                    paddingTop: 15,
                    borderTopWidth: 1,
                    borderColor: theme.border
                }}>
                    <IconApp pack="FI" name="calendar" size={14} color={theme.gray} styles={{ marginRight: 6 }} />
                    <YambiText text={new Date(post.createdAt).toLocaleDateString()} size="small" color="gray" />
                </View> */}

                {/* Comments Section - Limited Preview (hide for timetable) */}
                {post?.news_type !== 2 && comments.length > 0 && (
                    <View style={{ paddingTop: 10, paddingBottom: 0, borderTopWidth: 1, borderColor: theme.border }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 }}>
                            <YambiText 
                                text={`${strings.comments} (${commentCount})`} 
                                size="normal" 
                                color="default" 
                                bold
                                style={{ fontSize: 16 }} 
                            />
                            {commentCount > 2 && (
                                <Pressable
                                    onPress={() => {
                                        RootNavigation.navigate("PostReactions", { post: post });
                                    }}
                                >
                                    <YambiText 
                                        text={strings.see_more} 
                                        size="small" 
                                        color="high" 
                                        style={{ fontSize: 14 }} 
                                    />
                                </Pressable>
                            )}
                        </View>
                        <LegendList
                            data={comments.slice(0, 2) as never}
                            keyExtractor={(item: any, index: number) => item._id || index.toString()}
                            scrollEnabled={false}
                            renderItem={({ item }: { item: any }) => (
                                    <CommentItem 
                                        comment={item} 
                                        theme={theme} 
                                        size="normal"
                                        showFullText={true}
                                    />
                            )}
                        />
                    </View>
                )}

                {/* Like and Comment Buttons (hide for timetable) */}
                {post?.news_type !== 2 && (
                    <View style={{ 
                        flexDirection: 'row', 
                        alignItems: 'center', 
                        marginTop: 0,
                        paddingTop: 5,
                        borderTopWidth: 1,
                        borderColor: theme.border,

                        // gap: 24
                    }}>
                        {/* Like Button */}
                        <Pressable
                            onPress={() => {
                                if (!post?._id || !user_data?.phone_number) return;
                                
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
                                    news_id: post._id,
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
                                gap: 8,
                                paddingVertical: 8,
                                paddingHorizontal: 12,
                                borderRadius: 24,
                                backgroundColor: isLiked ? theme.high_color + '15' : 'transparent'
                            }}
                        >
                            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                                <IconApp 
                                    pack="OC" 
                                    name="heart-fill" 
                                    size={20} 
                                    color={isLiked ? "#FF0000" : theme.gray} 
                                />
                            </Animated.View>
                            {reactionCount > 0 && (
                                <YambiText 
                                    text={reactionCount.toString()} 
                                    size="small" 
                                    color={isLiked ? "high" : "gray"} 
                                    style={{ fontSize: 14 }}
                                />
                            )}
                        </Pressable>

                        {/* Comment Section */}
                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            {/* Comment Button */}
                            <Pressable
                                onPress={() => {
                                    RootNavigation.navigate("PostReactions", { post: post });
                                }}
                                style={{ 
                                    flexDirection: 'row', 
                                    alignItems: 'center', 
                                    gap: 8,
                                    paddingVertical: 8,
                                    paddingHorizontal: 12,
                                    borderRadius: 24
                                }}
                            >
                                <IconApp 
                                    pack="FI" 
                                    name="message-circle" 
                                    size={20} 
                                    color={theme.gray} 
                                />
                                <YambiText 
                                    text={commentCount.toString()} 
                                    size="small" 
                                    color="gray" 
                                    style={{ fontSize: 14 }}
                                />
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
                                            if (!post?._id || !user_data?.phone_number || !commentText.trim()) return;
                                            
                                            // Send comment via socket
                                            SocketApp.emit('toggleReaction', {
                                                news_id: post._id,
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
                                            padding: 8,
                                            borderRadius: 20,
                                            backgroundColor: theme.design_tip2
                                        }}
                                    >
                                        <IconApp 
                                            pack="FI" 
                                            name="send" 
                                            size={18} 
                                            color={theme.text_design2} 
                                        />
                                    </Pressable>
                                )}
                            </View>
                        </View>
                    </View>
                )}
            </View>
        </ScrollView>
        
        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
            <ModalApp
                onClose={() => {
                    dispatch(setShowModalApp(false));
                    setShowDeleteModal(false);
                }}
                singleButton={false}
                title={strings.delete}
                onAction={deletePost}
                onCancel={() => {
                    dispatch(setShowModalApp(false));
                    setShowDeleteModal(false);
                }}
                textAction={strings.delete}
                textCancel={strings.cancel}
            >
                <YambiText
                    text={strings.delete_post_confirmation}
                    size="normal"
                    color="default"
                    style={{ textAlign: 'center', marginBottom: 20 }}
                />
            </ModalApp>
        )}

        {/* Internet Error Modal */}
        {showInternetError && (
            <ModalApp
                onClose={() => {
                    dispatch(setShowModalApp(false));
                    setShowInternetError(false);
                }}
                singleButton={true}
                title={strings.connection_error}
                onAction={() => {
                    dispatch(setShowModalApp(false));
                    setShowInternetError(false);
                }}
                textAction={strings.ok || "OK"}
            >
                <YambiText
                    text={strings.check_internet_connection}
                    size="normal"
                    color="default"
                    style={{ textAlign: 'center', marginBottom: 20 }}
                />
            </ModalApp>
        )}
        </View>
    )
}

export default Post;
