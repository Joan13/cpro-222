import React, { useState, useMemo, useCallback } from "react";
import { View, TextInput, Pressable, StyleSheet, useWindowDimensions } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useRealm } from "@realm/react";
import { useAppDispatch, useAppSelector } from "../../store/app/hooks";
import { UserChats, UserContacts, YambiGroups, UsersMessages, GroupMessages } from "../../store/database/Models";
import { YambiText } from "../../components/app/Text";
import { IconApp } from "../../components/app/IconApp";
import { LegendList } from "@legendapp/list";
import SearchChatItem from "../../components/lists/app/SearchChatItem";
import { strings } from "../../lang/lang";
import { setMessageSelected } from "../../store/reducers/appSlice";

const Search = ({ navigation }: any) => {
    const theme = useAppSelector(state => state.app_theme);
    const dispatch = useAppDispatch();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();

    const [keyword, setKeyword] = useState("");

    // Database Queries
    const allChats = useQuery(UserChats);
    const allContacts = useQuery(UserContacts);
    const allGroups = useQuery(YambiGroups);
    const directMessages = useQuery(UsersMessages);
    const groupMessages = useQuery(GroupMessages);

    // Filter conversations where contact name, group name, or last message matches
    const filteredChats = useMemo(() => {
        if (!keyword.trim()) return [];
        
        const cleanKeyword = keyword.toLowerCase().trim();
        return allChats.filter(chat => {
            if (chat.deleted !== 0) return false;

            const isGroup = chat.type_chat === 2;
            const targetId = chat._id;
            
            let displayName = "";
            if (isGroup) {
                const group = allGroups.find(g => g._id === targetId);
                displayName = group?.user_names || "";
            } else {
                const contact = allContacts.find(c => c.user_id === targetId);
                displayName = contact?.user_names || "";
            }

            const nameMatches = displayName.toLowerCase().includes(cleanKeyword);
            const lastMessageMatches = chat.last_message && chat.last_message.toLowerCase().includes(cleanKeyword);

            return nameMatches || lastMessageMatches;
        });
    }, [keyword, allChats, allContacts, allGroups]);

    // Filter individual messages containing keyword
    const filteredMessages = useMemo(() => {
        if (!keyword.trim()) return [];

        const cleanKeyword = keyword.toLowerCase().trim();

        // Query both direct and group messages
        const matchedDirect = directMessages.filtered(
            "main_text_message LIKE[c] $0 && deleted != 2 && message_type != 2",
            `*${cleanKeyword}*`
        );
        const matchedGroup = groupMessages.filtered(
            "main_text_message LIKE[c] $0 && deleted != 2 && message_type != 2",
            `*${cleanKeyword}*`
        );

        const merged = [...matchedDirect, ...matchedGroup];
        // Sort descending by creation date
        return merged.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }, [keyword, directMessages, groupMessages]);

    // Handle navigation to chat
    const navigateToChat = useCallback((userId: string, messageToken?: string) => {
        if (messageToken) {
            dispatch(setMessageSelected(messageToken));
            navigation.navigate("Inbox", { user: userId, highlight_message_token: messageToken });
        } else {
            dispatch(setMessageSelected(""));
            navigation.navigate("Inbox", { user: userId });
        }
    }, [dispatch, navigation]);

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
            {/* Header bar */}
            <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
                <Pressable 
                    onPress={() => navigation.goBack()} 
                    style={styles.backButton}
                >
                    <IconApp 
                        pack="FI" 
                        name="arrow-left" 
                        size={22} 
                        color={theme.colors.text_design1} 
                    />
                </Pressable>
                
                <TextInput
                    autoFocus
                    value={keyword}
                    onChangeText={setKeyword}
                    placeholder={strings.search || "Search chats and messages..."}
                    placeholderTextColor={theme.colors.gray}
                    style={[
                        styles.searchInput, 
                        { 
                            color: theme.colors.text, 
                            backgroundColor: theme.colors.border 
                        }
                    ]}
                />

                {keyword !== "" ? (
                    <Pressable 
                        onPress={() => setKeyword("")} 
                        style={styles.clearButton}
                    >
                        <IconApp 
                            pack="MC" 
                            name="close-circle" 
                            size={20} 
                            color={theme.colors.gray} 
                        />
                    </Pressable>
                ) : null}
            </View>

            {/* Results */}
            {keyword.trim() === "" ? (
                <View style={styles.stateContainer}>
                    <IconApp 
                        pack="FI" 
                        name="search" 
                        size={48} 
                        color={theme.colors.border} 
                    />
                    <YambiText 
                        text="Search through your conversations" 
                        color="gray" 
                        style={{ marginTop: 12 }} 
                    />
                </View>
            ) : filteredChats.length === 0 && filteredMessages.length === 0 ? (
                <View style={styles.stateContainer}>
                    <IconApp 
                        pack="MC" 
                        name="message-text-outline" 
                        size={48} 
                        color={theme.colors.border} 
                    />
                    <YambiText 
                        text="No matching chats or messages found" 
                        color="gray" 
                        style={{ marginTop: 12 }} 
                    />
                </View>
            ) : (
                <LegendList
                    data={filteredMessages}
                    keyExtractor={(item) => item.token}
                    estimatedItemSize={72}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={styles.listContent}
                    ListHeaderComponent={
                        <View style={{ marginBottom: 8 }}>
                            {/* Conversations Card (Matching Chats) */}
                            {filteredChats.length > 0 ? (
                                <View style={[styles.card, { backgroundColor: theme.colors.design_tip1 || theme.colors.border }]}>
                                    <View style={styles.cardHeader}>
                                        <YambiText bold text="Conversations" size="normal" color="high" />
                                        <YambiText text={`${filteredChats.length} found`} size="small" color="gray" />
                                    </View>
                                    {filteredChats.map((chat) => (
                                        <SearchChatItem
                                            key={chat._id}
                                            item={chat}
                                            type="chat"
                                            searchKeyword={keyword}
                                            onPress={() => navigateToChat(chat._id)}
                                        />
                                    ))}
                                </View>
                            ) : null}

                            {/* Messages Section Header */}
                            {filteredMessages.length > 0 ? (
                                <View style={styles.sectionHeader}>
                                    <YambiText bold text="Messages" size="normal" color="high" />
                                    <YambiText text={`${filteredMessages.length} found`} size="small" color="gray" />
                                </View>
                            ) : null}
                        </View>
                    }
                    renderItem={({ item }) => {
                        const isGroup = item.receiver.startsWith("G");
                        const chatUser = isGroup ? item.receiver : (item.alignment === 'outgoing' ? item.receiver : item.sender);
                        return (
                            <SearchChatItem
                                item={item}
                                type="message"
                                searchKeyword={keyword}
                                onPress={() => navigateToChat(chatUser, item.token)}
                            />
                        );
                    }}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    backButton: {
        padding: 8,
        marginRight: 4,
    },
    searchInput: {
        flex: 1,
        height: 40,
        borderRadius: 20,
        paddingHorizontal: 16,
        fontSize: 15,
    },
    clearButton: {
        position: "absolute",
        right: 20,
        padding: 8,
    },
    stateContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 32,
    },
    listContent: {
        paddingBottom: 24,
    },
    card: {
        margin: 16,
        borderRadius: 12,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        marginTop: 16,
        marginBottom: 8,
    }
});

export default Search;
