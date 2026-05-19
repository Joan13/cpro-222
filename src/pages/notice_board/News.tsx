import { View, RefreshControl } from "react-native";
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppSelector } from "../../store/app/hooks";
import { strings } from "../../lang/lang";
import { IconApp } from "../../components/app/IconApp";
import { YambiText } from "../../components/app/Text";
import { LegendList } from '@legendapp/list';
import { remote_host } from "../../../GlobalVariables";
import axios from "axios";
import { NavProps, TNews } from "../../types/types";
import AppActivityIndicator from "../../components/app/AppActivityIndicator";
import NewsItem from "../../components/lists/notice_board/NewsItem";
import * as RootNavigation from '../../services/Navigation_ref';

const News = ({ navigation, route }: NavProps) => {
    const theme = useAppSelector(state => state.app_theme.colors);
    const user_data = useAppSelector(state => state.user_data);
    const { flag, company_id } = route.params || {};
    
    const [news, setNews] = useState<TNews[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [lastId, setLastId] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const fetchingRef = useRef(false);

    // Set navigation title based on flag
    useEffect(() => {
        if (flag === 1) {
            navigation.setOptions({ title: strings.my_posts });
        } else if (flag === 2 && company_id) {
            navigation.setOptions({ title: strings.news || "News" });
        }
    }, [flag, company_id, navigation]);

    // Fetch news items with pagination
    const fetchNews = useCallback(async (loadMore = false) => {
        if (fetchingRef.current) return;
        if (!hasMore && loadMore) return;

        fetchingRef.current = true;
        if (loadMore) setLoadingMore(true);
        else setLoading(true);

        try {
            const res = await axios.post(remote_host + "/yambi/API/get_notice_board_news", {
                phone_number: user_data.phone_number,
                flag: flag || 0, // flag 1 for user's posts, flag 2 for company news
                company_id: company_id || null,
                last_id: loadMore ? lastId : null
            });

            if (res.data.success === "1") {
                const newsItems: TNews[] = res.data.data || [];
                if (loadMore) {
                    setNews(prev => [...prev, ...newsItems]);
                } else {
                    setNews(newsItems);
                    setLastId(null);
                }
                
                // Set last ID for pagination (use the last item's _id)
                if (newsItems.length > 0 && newsItems[newsItems.length - 1]?._id) {
                    setLastId(newsItems[newsItems.length - 1]._id);
                }
                
                // If we got less than 25 items, there's no more to load
                setHasMore(newsItems.length === 25);
            } else {
                if (!loadMore) {
                    setNews([]);
                }
                setHasMore(false);
            }
        } catch (e) {
            if (!loadMore) {
                setNews([]);
            }
            setHasMore(false);
        } finally {
            setLoading(false);
            setLoadingMore(false);
            fetchingRef.current = false;
        }
    }, [user_data.phone_number, flag, company_id, lastId, hasMore]);

    useEffect(() => {
        fetchNews();
    }, [fetchNews]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setLastId(null);
        setHasMore(true);
        fetchNews(false).finally(() => {
            setRefreshing(false);
        });
    }, [fetchNews]);

    const handleNewsPress = (newsItem: TNews) => {
        RootNavigation.navigate("Post", { post: newsItem });
    };

    if (loading && !refreshing) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
                <AppActivityIndicator showLabel />
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
            <LegendList
                data={news}
                keyExtractor={(item: TNews) => item._id}
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
                    <View style={{ alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 }}>
                        <IconApp pack="FI" name="inbox" size={48} color={theme.gray} styles={{ marginBottom: 12, opacity: 0.5 }} />
                        <YambiText
                            text={(strings as any).no_news_for_now || "There are not news available for the moment."}
                            size="normal"
                            color="gray"
                            style={{ textAlign: 'center' }}
                        />
                    </View>
                }
            />
        </View>
    )
}

export default News;
