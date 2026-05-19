import { View, ScrollView, Pressable, RefreshControl, TextInput } from "react-native";
import { useEffect, useState } from 'react';
import { useAppSelector } from "../../store/app/hooks";
import { strings } from "../../lang/lang";
import { IconApp } from "../../components/app/IconApp";
import { YambiText } from "../../components/app/Text";
import { remote_host, SocketApp } from "../../../GlobalVariables";
import axios from "axios";
import { NavProps } from "../../types/types";
import CommentItem from "../../components/lists/notice_board/CommentItem";
import ReactionItem from "../../components/lists/notice_board/ReactionItem";
import { LegendList } from '@legendapp/list';

const PostReactions = ({ navigation, route }: NavProps) => {
    const theme = useAppSelector(state => state.app_theme.colors);
    const user_data = useAppSelector(state => state.user_data);
    const { post } = route.params as { post: any };
    const [comments, setComments] = useState<any[]>([]);
    const [likes, setLikes] = useState<any[]>([]);
    const [commentCount, setCommentCount] = useState<number>(0);
    const [likeCount, setLikeCount] = useState<number>(0);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<'comments' | 'likes'>('comments');
    const [commentText, setCommentText] = useState<string>("");

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

    // Fetch likes
    const fetchLikes = async () => {
        if (!post?._id) return;
        
        try {
            const res = await axios.post(remote_host + "/yambi/API/get_reactions", {
                news_id: post._id,
                reaction_id: 1,
                reaction_type: 1
            });
            
            if (res.data.success === "1") {
                // Get user data for each like
                const likesWithUsers = await Promise.all(
                    (res.data.reactions || []).map(async (reaction: any) => {
                        try {
                            const userRes = await axios.post(remote_host + "/yambi/API/fetch_user_data", {
                                user: reaction.phone_number
                            });
                            return {
                                ...reaction,
                                user_name: userRes.data.assemble?.user_names || reaction.phone_number,
                                user_profile: userRes.data.assemble?.user_profile || ""
                            };
                        } catch (error) {
                            return {
                                ...reaction,
                                user_name: reaction.phone_number,
                                user_profile: ""
                            };
                        }
                    })
                );
                setLikes(likesWithUsers);
                setLikeCount(likesWithUsers.length);
            }
        } catch (error) {
            console.error("Error fetching likes:", error);
        }
    };

    // Refresh function
    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([fetchComments(), fetchLikes()]);
        setRefreshing(false);
    };

    useEffect(() => {
        if (post?._id) {
            fetchComments();
            fetchLikes();
        }
    }, [post?._id]);

    // Listen for new comments
    useEffect(() => {
        if (!post?._id) return;

        const handleCommentAdded = (data: any) => {
            if (data.news_id === post._id) {
                setComments(prev => [...prev, data.comment]);
                setCommentCount(data.comment_count || 0);
            }
        };

        SocketApp.on('commentAdded', handleCommentAdded);

        return () => {
            SocketApp.off('commentAdded', handleCommentAdded);
        };
    }, [post?._id]);

    useEffect(() => {
        navigation.setOptions({ 
            title: strings.reactions
        });
    }, [navigation]);

    return (
        <View style={{
            flex: 1,
            backgroundColor: theme.background,
        }}>
            {/* Tabs */}
            <View style={{ 
                flexDirection: 'row', 
                borderBottomWidth: 1, 
                borderBottomColor: theme.border,
                backgroundColor: theme.background
            }}>
                <Pressable
                    onPress={() => setActiveTab('comments')}
                    style={{
                        flex: 1,
                        paddingVertical: 15,
                        alignItems: 'center',
                        borderBottomWidth: activeTab === 'comments' ? 2 : 0,
                        borderBottomColor: activeTab === 'comments' ? theme.high_color : 'transparent'
                    }}
                >
                    <YambiText 
                        text={`${strings.comments} (${commentCount})`}
                        size="normal"
                        color={activeTab === 'comments' ? "high" : "gray"}
                        bold={activeTab === 'comments'}
                    />
                </Pressable>
                <Pressable
                    onPress={() => setActiveTab('likes')}
                    style={{
                        flex: 1,
                        paddingVertical: 15,
                        alignItems: 'center',
                        borderBottomWidth: activeTab === 'likes' ? 2 : 0,
                        borderBottomColor: activeTab === 'likes' ? theme.high_color : 'transparent'
                    }}
                >
                    <YambiText 
                        text={`${strings.likes} (${likeCount})`}
                        size="normal"
                        color={activeTab === 'likes' ? "high" : "gray"}
                        bold={activeTab === 'likes'}
                    />
                </Pressable>
            </View>

            <ScrollView
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[theme.high_color]}
                        tintColor={theme.high_color}
                    />
                }
                contentContainerStyle={{ paddingBottom: activeTab === 'comments' ? 80 : 20 }}
            >
                {activeTab === 'comments' ? (
                    <View style={{ paddingHorizontal: 15, paddingTop: 0, paddingBottom: 20 }}>
                        {comments.length > 0 ? (
                            <LegendList
                                data={comments as never}
                                keyExtractor={(item: any, index: number) => item._id || index.toString()}
                                scrollEnabled={false}
                                renderItem={({ item, index }: { item: any, index: number }) => (
                                    <View 
                                        style={{ 
                                            marginBottom: 15,
                                            paddingBottom: 15,
                                            borderBottomWidth: index < comments.length - 1 ? 1 : 0,
                                            borderBottomColor: theme.border + '40'
                                        }}
                                    >
                                        <CommentItem 
                                            comment={item} 
                                            theme={theme} 
                                            size="normal"
                                            showFullText={true}
                                        />
                                    </View>
                                )}
                            />
                        ) : (
                            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                                <YambiText 
                                    text={strings.no_comments} 
                                    size="normal" 
                                    color="gray" 
                                />
                            </View>
                        )}
                    </View>
                ) : (
                    <View style={{ paddingHorizontal: 15, paddingTop: 0, paddingBottom: 10 }}>
                        {likes.length > 0 ? (
                            <LegendList
                                data={likes as never}
                                keyExtractor={(item: any, index: number) => item._id || index.toString()}
                                scrollEnabled={false}
                                renderItem={({ item }: { item: any }) => (
                                    <ReactionItem 
                                        reaction={item} 
                                        theme={theme}
                                    />
                                )}
                            />
                        ) : (
                            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                                <YambiText 
                                    text={strings.no_likes} 
                                    size="normal" 
                                    color="gray" 
                                />
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>

            {/* Comment Input - Fixed at bottom (only visible in comments tab) */}
            {activeTab === 'comments' && (
                <View style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: theme.background,
                    borderTopWidth: 1,
                    borderTopColor: theme.border,
                    paddingHorizontal: 15,
                    paddingVertical: 12,
                    paddingBottom: 20,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8
                }}>
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
                                padding: 10,
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
            )}
        </View>
    );
};

export default PostReactions;
