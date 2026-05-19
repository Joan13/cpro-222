import { View, TouchableOpacity, RefreshControl, ScrollView } from "react-native";
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppSelector, useAppDispatch } from "../../store/app/hooks";
import { strings } from "../../lang/lang";
import { IconApp } from "../../components/app/IconApp";
import { YambiText } from "../../components/app/Text";
import { LegendList } from '@legendapp/list';
import { remote_host } from "../../../GlobalVariables";
import axios from "axios";
import { NavProps, TCompanyUser } from "../../types/types";
import AppActivityIndicator from "../../components/app/AppActivityIndicator";
import NoticeBoardRegistration from "./NoticeBoardRegistration";
import NewsItem from "../../components/lists/notice_board/NewsItem";
import * as RootNavigation from '../../services/Navigation_ref';
import { useRealm } from "@realm/react";
import { setLoading, setLoadingHeader } from "../../store/reducers/appSlice";

export type TNews = {
    _id: string;
    company_id: string;
    title: string;
    description?: string;
    content: string;
    tags?: string;
    image?: string;
    createdAt: string;
    updatedAt: string;
}

const NoticeBoard = ({ navigation }: NavProps) => {
    const theme = useAppSelector(state => state.app_theme.colors);
    const user_data = useAppSelector(state => state.user_data);
    const dispatch = useAppDispatch();
    const realm = useRealm();
    const [news, setNews] = useState<TNews[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [hasSubscribed, setHasSubscribed] = useState<boolean | null>(null);
    const [loadingSubscription, setLoadingSubscription] = useState(true);
    const [subscriptionError, setSubscriptionError] = useState(false);
    const [hasUserPosts, setHasUserPosts] = useState(false);
    const [lastId, setLastId] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const fetchingRef = useRef(false);
    const lastIdRef = useRef<string | null>(null);
    const hasMoreRef = useRef(true);

    // Check if user has posts
    const checkUserPosts = useCallback(async () => {
        try {
            const res = await axios.post(remote_host + "/yambi/API/get_notice_board_news", {
                phone_number: user_data.phone_number,
                flag: 1, // flag 1 for user's posts
                last_id: null
            });

            if (res.data.success === "1") {
                const userPosts: TNews[] = res.data.data || [];
                setHasUserPosts(userPosts.length > 0);
            } else {
                setHasUserPosts(false);
            }
        } catch (e) {
            setHasUserPosts(false);
        }
    }, [user_data.phone_number]);

    // Check if user has subscribed to any company and store company_users in Realm
    const checkSubscription = useCallback(async () => {
        setLoadingSubscription(true);
        setSubscriptionError(false);
        
        // First, check Realm for cached subscriptions
        try {
            const cachedUsers = realm.objects('CompanyUsers').filtered('phone_number == $0 && user_active == $1', user_data.phone_number, 1);
            if (cachedUsers.length > 0 && hasSubscribed === null) {
                // Use cached data if available and we haven't loaded from API yet
                setHasSubscribed(true);
            }
        } catch (e) {
            // Ignore Realm errors
        }

        try {
            const res = await axios.post(remote_host + "/yambi/API/get_subscription_data", {
                phone_number: user_data.phone_number
            });

            if (res.data.success === "1") {
                const companyUsers: TCompanyUser[] = res.data.companyUsers || [];
                // Only set to false if we successfully got a response with no subscriptions
                setHasSubscribed(companyUsers.length > 0);
                setSubscriptionError(false);

                // Store company_users in Realm
                if (companyUsers.length > 0) {
                    try {
                        realm.write(() => {
                            // Delete existing company users for this phone number
                            const existingUsers = realm.objects('CompanyUsers').filtered('phone_number == $0', user_data.phone_number);
                            realm.delete(existingUsers);

                            // Add new company users
                            companyUsers.forEach((cu: any) => {
                                const companyUser: TCompanyUser = {
                                _id: cu._id,
                                company_id: cu.company_id,
                                phone_number: cu.phone_number,
                                user_name: cu.user_name || "",
                                service_name: cu.service_name || "",
                                service_name_abb: cu.service_name_abb || "",
                                level: parseInt(cu.level) || 0,
                                role: cu.role || "",
                                tags: cu.tags || "",
                                user_active: parseInt(cu.user_active) || 0,
                                is_admin: parseInt(cu.is_admin) || 0,
                                createdAt: cu.createdAt || "",
                                updatedAt: cu.updatedAt || ""
                                };
                                realm.create('CompanyUsers', companyUser, true);
                            });
                        });
                    } catch (error) {
                        console.log("Error storing company users:", error);
                    }
                }
            } else {
                // API returned success but with no subscriptions
                setHasSubscribed(false);
                setSubscriptionError(false);
            }
        } catch (e) {
            // Network error - don't change hasSubscribed, just mark error
            setSubscriptionError(true);
            // If we don't have a cached value, check Realm again
            if (hasSubscribed === null) {
                try {
                    const cachedUsers = realm.objects('CompanyUsers').filtered('phone_number == $0 && user_active == $1', user_data.phone_number, 1);
                    setHasSubscribed(cachedUsers.length > 0);
                } catch (realmError) {
                    // If no cached data and network error, keep as null
                    setHasSubscribed(null);
                }
            }
        } finally {
            setLoadingSubscription(false);
        }
    }, [user_data.phone_number, realm, hasSubscribed]);

    // Fetch news items with pagination
    const fetchNews = useCallback(async (loadMore = false) => {
        if (!hasSubscribed) {
            setLoading(false);
            dispatch(setLoadingHeader(false));
            return;
        }
        if (fetchingRef.current) return;
        if (!hasMoreRef.current && loadMore) return;

        fetchingRef.current = true;
        if (loadMore) {
            setLoadingMore(true);
        } else {
            setLoading(true);
            dispatch(setLoadingHeader(true));
        }

        try {
            const res = await axios.post(remote_host + "/yambi/API/get_notice_board_news", {
                phone_number: user_data.phone_number,
                last_id: loadMore ? lastIdRef.current : null
            });

            if (res.data.success === "1") {
                const newsItems: TNews[] = res.data.data || [];
                if (loadMore) {
                    setNews(prev => [...prev, ...newsItems]);
                } else {
                    setNews(newsItems);
                    setLastId(null);
                    lastIdRef.current = null;
                }
                
                // Set last ID for pagination (use the last item's _id)
                if (newsItems.length > 0 && newsItems[newsItems.length - 1]?._id) {
                    const newLastId = newsItems[newsItems.length - 1]._id;
                    setLastId(newLastId);
                    lastIdRef.current = newLastId;
                }
                
                // If we got less than 25 items, there's no more to load
                const hasMoreValue = newsItems.length === 25;
                setHasMore(hasMoreValue);
                hasMoreRef.current = hasMoreValue;
            } else {
                if (!loadMore) {
                    setNews([]);
                }
                setHasMore(false);
                hasMoreRef.current = false;
            }
        } catch (e) {
            if (!loadMore) {
                setNews([]);
            }
            setHasMore(false);
            hasMoreRef.current = false;
        } finally {
            if (!loadMore) {
                setLoading(false);
                dispatch(setLoadingHeader(false));
            }
            setLoadingMore(false);
            fetchingRef.current = false;
        }
    }, [hasSubscribed, user_data.phone_number, dispatch]);

    useEffect(() => {
        checkSubscription();
        checkUserPosts();
    }, []);

    useEffect(() => {
        if (hasSubscribed === true) {
            fetchNews(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasSubscribed]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setLastId(null);
        lastIdRef.current = null;
        setHasMore(true);
        hasMoreRef.current = true;
        Promise.all([checkSubscription(), checkUserPosts()]).then(() => {
            if (hasSubscribed) {
                fetchNews(false).finally(() => {
                    setRefreshing(false);
                });
            } else {
                setRefreshing(false);
            }
        });
    }, [checkSubscription, checkUserPosts, fetchNews, hasSubscribed]);

    const openTimetables = () => {
        navigation.navigate("Timetables");
    };

    const handleNewsPress = (newsItem: TNews) => {
        RootNavigation.navigate("Post", { post: newsItem });
    };

    const ListHeader = () => (
        <ScrollView 
        keyboardShouldPersistTaps='handled'
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                paddingBottom: 10, 
                paddingHorizontal: 15,
                gap: 8
            }}
        >
            <TouchableOpacity
                onPress={openTimetables}
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: theme.high_color + '20',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                }}>
                <IconApp pack="FI" name="calendar" size={16} color={theme.high_color} styles={{ marginRight: 6 }} />
                <YambiText text={strings.timetable} size="small" color="high" />
            </TouchableOpacity>

            {hasSubscribed === true && (
                <TouchableOpacity
                    onPress={() => RootNavigation.navigate("Companies", { fromNoticeBoard: true })}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: theme.high_color + '20',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 8,
                    }}>
                    <IconApp pack="FI" name="briefcase" size={16} color={theme.high_color} styles={{ marginRight: 6 }} />
                    <YambiText
                        text={(strings as any).my_subscriptions || "My subscriptions"}
                        size="small"
                        color="high"
                    />
                </TouchableOpacity>
            )}

            {hasUserPosts && (
                <TouchableOpacity
                    onPress={() => RootNavigation.navigate("News", { flag: 1 })}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: theme.high_color + '20',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 8,
                    }}>
                    <IconApp pack="FI" name="file-text" size={16} color={theme.high_color} styles={{ marginRight: 6 }} />
                    <YambiText text={strings.my_posts} size="small" color="high" />
                </TouchableOpacity>
            )}
        </ScrollView>
    );

    // if (loadingSubscription) {
    //     return (
    //         <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
    //             <AppActivityIndicator showLabel />
    //         </View>
    //     );
    // }

    // If user hasn't subscribed (only show if we got a successful response with no subscriptions, not on network errors)
    if (hasSubscribed === false && !subscriptionError) {
        return (
            <View style={{ flex: 1, backgroundColor: theme.background, borderColor: theme.border, borderTopWidth: 1 }}>
                
                <ScrollView 
                keyboardShouldPersistTaps='handled'
                    style={{ flex: 1 }}
                    contentContainerStyle={{ paddingHorizontal: 15, paddingTop: 15, paddingBottom: 20 }}
                    showsVerticalScrollIndicator={true}
                >
                    <ListHeader />
                    <View style={{ 
                        backgroundColor: theme.border + '30', 
                        borderRadius: 12, 
                        padding: 20, 
                        marginBottom: 30,
                        borderWidth: 1,
                        borderColor: theme.border
                    }}>
                        <YambiText 
                            text={(strings as any).not_subscribed_to_company} 
                            size="normal" 
                            color="default" 
                            style={{ marginBottom: 15, textAlign: 'center' }} 
                        />
                        <YambiText 
                            text={(strings as any).subscribe_to_receive_info} 
                            size="normal" 
                            color="gray" 
                            style={{ marginBottom: 20, textAlign: 'center' }} 
                        />
                    </View>
                    <View style={{ 
                        backgroundColor: theme.border + '20', 
                        borderRadius: 12, 
                        padding: 15, 
                        marginBottom: 20,
                        borderWidth: 1,
                        borderColor: theme.border
                    }}>
                        <YambiText 
                            text={(strings as any).enter_company_tags_info} 
                            size="normal" 
                            color="default" 
                            style={{ textAlign: 'center' }} 
                        />
                    </View>
                    <NoticeBoardRegistration onRegistrationSuccess={() => {
                        checkSubscription();
                    }} />
                </ScrollView>
            </View>
        );
    }

    // Show error state if there's a network error and no cached data
    if (subscriptionError && hasSubscribed === null) {
        return (
            <View style={{ flex: 1, backgroundColor: theme.background, borderColor: theme.border, borderTopWidth: 1 }}>
                <ScrollView 
                    keyboardShouldPersistTaps='handled'
                    style={{ flex: 1 }}
                    contentContainerStyle={{ paddingHorizontal: 15, paddingTop: 15, paddingBottom: 20 }}
                    showsVerticalScrollIndicator={true}
                >
                    <ListHeader />
                    <View style={{ 
                        backgroundColor: theme.border + '30', 
                        borderRadius: 12, 
                        padding: 20, 
                        marginBottom: 30,
                        borderWidth: 1,
                        borderColor: theme.border,
                        alignItems: 'center'
                    }}>
                        <IconApp pack="FI" name="wifi-off" size={48} color={theme.error} styles={{ marginBottom: 12, opacity: 0.7 }} />
                        <YambiText 
                            text={(strings as any).connection_error || "Connection Error"} 
                            size="normal" 
                            color="default" 
                            bold
                            style={{ marginBottom: 10, textAlign: 'center' }} 
                        />
                        <YambiText 
                            text={(strings as any).check_internet_connection || "Please check your internet connection and try again."} 
                            size="normal" 
                            color="gray" 
                            style={{ marginBottom: 20, textAlign: 'center' }} 
                        />
                        <TouchableOpacity
                            onPress={() => {
                                setSubscriptionError(false);
                                checkSubscription();
                            }}
                            style={{
                                backgroundColor: theme.high_color,
                                paddingHorizontal: 20,
                                paddingVertical: 10,
                                borderRadius: 8,
                            }}
                        >
                            <YambiText 
                                text={(strings as any).retry || "Retry"} 
                                size="normal" 
                                color="white" 
                            />
                        </TouchableOpacity>
                    </View>
                </ScrollView>
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
            {/* {loading && !refreshing ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <AppActivityIndicator showLabel />
                </View>
            ) : ( */}
                <LegendList
                    keyboardShouldPersistTaps='handled'
                    data={news}
                    keyExtractor={(item: TNews) => item._id}
                    ListHeaderComponent={<ListHeader />}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={theme.high_color}
                        />
                    }
                    renderItem={({ item }: { item: TNews }) => (
                        <NewsItem 
                            item={item} 
                            index={0} 
                            onPress={handleNewsPress}
                        />
                    )}
                    onEndReached={() => {
                        if (hasMore && !loadingMore && !loading) {
                            fetchNews(true);
                        }
                    }}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={
                        loadingMore ? (
                            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                                <AppActivityIndicator />
                            </View>
                        ) : null
                    }
                    contentContainerStyle={{
                        paddingBottom: 20,
                        paddingTop: 10
                    }}
                    ListEmptyComponent={
                        loading ? (
                            <View style={{ alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 }}>
                                <AppActivityIndicator showLabel />
                            </View>
                        ) : (
                            <View style={{ alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 }}>
                                <IconApp pack="FI" name="inbox" size={48} color={theme.gray} styles={{ marginBottom: 12, opacity: 0.5 }} />
                                <YambiText
                                    text={(strings as any).no_news_for_now || "There are not news available for the moment."}
                                    size="normal"
                                    color="gray"
                                    style={{ textAlign: 'center' }}
                                />
                            </View>
                        )
                    }
                />
            {/* )} */}
        </View>
    )
}

export default NoticeBoard;
