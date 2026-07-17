import { useState, useEffect, useCallback, useRef } from 'react';
import { View, TextInput, Pressable, RefreshControl } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import axios from 'axios';
import { strings } from '../../lang/lang';
import { useAppDispatch, useAppSelector } from '../../store/app/hooks';
import StatusBarYambi from '../../components/app/StatusBar';
import { TUser } from '../../types/types';
import ContactsList from '../../components/lists/contacts/ContactsList';
import { setTextContactSearch, setShowModalApp } from '../../store/reducers/appSlice';
import { FlashList } from '@shopify/flash-list';
import { TextNormalYambi, TextSmallYambiGray, TextNormalYambiHighColor } from '../../components/app/Text';
import { IconApp } from '../../components/app/IconApp';
import { remote_host } from '../../../GlobalVariables';
import * as RootNavigation from './../../services/Navigation_ref';
import AppActivityIndicator from '../../components/app/AppActivityIndicator';

// const navigation = NativeStackScreenProps<RootStackParamList>();

const Users = () => {

    const app_theme = useAppSelector(state => state.app_theme);
    const dispatch = useAppDispatch();
    const text_contact_search = useAppSelector(state => state.app.text_contact_search);

    const [localSearch, setLocalSearch] = useState(text_contact_search);
    const [users, setUsers] = useState<TUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [lastId, setLastId] = useState<string | null>(null);
    const [overview, setOverview] = useState<{ total: number; active: number; inactive: number }>({ total: 0, active: 0, inactive: 0 });
    const fetchingRef = useRef(false);
    const [refreshing, setRefreshing] = useState(false);

    const fetchUsers = useCallback(async (loadMore = false) => {
        if (fetchingRef.current) return;
        if (!hasMore && loadMore) return;

        fetchingRef.current = true;
        if (loadMore) setLoadingMore(true);
        else setLoading(true);

        try {
            const res = await axios.post(remote_host + "/yambi/API/get_admin_data", {
                flag: 1, // flag 1 for users
                last_id: loadMore ? lastId : null,
                search: '' // empty string for local search
            });

            if (res.data.success === "1") {
                const newUsers: TUser[] = res.data.data || [];
                if (loadMore) {
                    setUsers(prev => [...prev, ...newUsers]);
                } else {
                    setUsers(newUsers);
                    setLastId(null);
                }

                // Update overview stats
                if (res.data.overview) {
                    setOverview(res.data.overview);
                }

                // Set last ID for pagination
                if (newUsers.length > 0) {
                    const lastUser = newUsers[newUsers.length - 1];
                    // API returns _id, but TUser uses user_id - use _id from API response
                    const lastUserId = (lastUser as any)?._id || lastUser?.user_id;
                    if (lastUserId) {
                        setLastId(lastUserId);
                    }
                }

                // Check if more data available (assuming 100 items per page)
                setHasMore(newUsers.length === 100);
            } else {
                dispatch(setShowModalApp(true));
            }
        } catch (e) {
            dispatch(setShowModalApp(true));
        } finally {
            setLoading(false);
            setLoadingMore(false);
            fetchingRef.current = false;
        }
    }, [lastId, hasMore, dispatch]);

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            dispatch(setTextContactSearch(localSearch));
        }, 500);
        return () => clearTimeout(timer);
    }, [localSearch, dispatch]);

    useEffect(() => {
        fetchUsers(false);
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setLastId(null);
        setHasMore(true);
        fetchUsers(false).finally(() => {
            setRefreshing(false);
        });
    }, [fetchUsers]);

    const selectCon = useCallback((item: TUser) => {
        RootNavigation.navigate("UserProfileInfo", { user: item });
    }, []);

    const SearchItem = (search: string) => {
        setLocalSearch(search);
    }

    const filteredUsers = users.filter(user => {
        const searchStr = localSearch.toLowerCase().trim();
        if (searchStr === '') return true;
        const nameMatch = user.user_names?.toLowerCase().includes(searchStr);
        const phoneMatch = user.phone_number?.toLowerCase().includes(searchStr);
        return nameMatch || phoneMatch;
    });

    const OverviewHeader = () => (
        <View style={{ marginVertical: 15 }}>
            <TextNormalYambi text={strings.users_overview} bold styles={{ marginBottom: 12, fontSize: 16 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{
                    flex: 1,
                    backgroundColor: app_theme.colors.border + '15',
                    borderRadius: 14,
                    padding: 12,
                    alignItems: 'center',
                    marginRight: 6,
                    borderWidth: 1,
                    borderColor: app_theme.colors.border,
                }}>
                    <View style={{ backgroundColor: app_theme.colors.high_color + '15', padding: 8, borderRadius: 10 }}>
                        <IconApp pack="FI" name="users" size={18} color={app_theme.colors.high_color} />
                    </View>
                    <TextNormalYambiHighColor text={overview.total.toString()} bold styles={{ marginTop: 8, fontSize: 18 }} />
                    <TextSmallYambiGray text={strings.total} styles={{ marginTop: 2, fontSize: 11 }} />
                </View>
                <View style={{
                    flex: 1,
                    backgroundColor: app_theme.colors.border + '15',
                    borderRadius: 14,
                    padding: 12,
                    alignItems: 'center',
                    marginHorizontal: 3,
                    borderWidth: 1,
                    borderColor: app_theme.colors.border,
                }}>
                    <View style={{ backgroundColor: app_theme.colors.success + '15', padding: 8, borderRadius: 10 }}>
                        <IconApp pack="FI" name="check-circle" size={18} color={app_theme.colors.success} />
                    </View>
                    <TextNormalYambiHighColor text={overview.active.toString()} bold styles={{ marginTop: 8, fontSize: 18, color: app_theme.colors.success }} />
                    <TextSmallYambiGray text={strings.active} styles={{ marginTop: 2, fontSize: 11 }} />
                </View>
                <View style={{
                    flex: 1,
                    backgroundColor: app_theme.colors.border + '15',
                    borderRadius: 14,
                    padding: 12,
                    alignItems: 'center',
                    marginLeft: 6,
                    borderWidth: 1,
                    borderColor: app_theme.colors.border,
                }}>
                    <View style={{ backgroundColor: app_theme.colors.error + '15', padding: 8, borderRadius: 10 }}>
                        <IconApp pack="FI" name="x-circle" size={18} color={app_theme.colors.error} />
                    </View>
                    <TextNormalYambiHighColor text={overview.inactive.toString()} bold styles={{ marginTop: 8, fontSize: 18, color: app_theme.colors.error }} />
                    <TextSmallYambiGray text={strings.inactive} styles={{ marginTop: 2, fontSize: 11 }} />
                </View>
            </View>
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: app_theme.colors.background, borderColor: app_theme.colors.border, borderTopWidth: 0 }}>

            <StatusBarYambi />

            <View style={{
                backgroundColor: app_theme.colors.background,
                flex: 1
            }}>
                <View
                    style={{
                        marginHorizontal: 15,
                        marginVertical: 10,
                        paddingHorizontal: 12,
                        borderRadius: 12,
                        borderWidth: 1.5,
                        borderColor: app_theme.colors.border,
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: app_theme.colors.border + '20',
                        height: 48,
                    }}>
                    <Feather name="search" size={18} style={{ marginRight: 10, color: app_theme.colors.gray }} />
                    <TextInput
                        onChangeText={SearchItem}
                        value={localSearch}
                        placeholder={strings.search}
                        placeholderTextColor={app_theme.colors.gray}
                        style={{ flex: 1, paddingVertical: 0, height: '100%', borderWidth: 0, backgroundColor: 'transparent', color: app_theme.colors.text, fontSize: 15 }}
                    />
                    {localSearch !== "" ?
                        <Pressable
                            onPress={() => {
                                setLocalSearch("");
                                dispatch(setTextContactSearch(""));
                            }}
                            style={{
                                height: 30,
                                width: 30,
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}>
                            <Feather name="x" size={18} style={{ color: app_theme.colors.text }} />
                        </Pressable> : null}
                </View>

                {loading && !loadingMore ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <AppActivityIndicator showLabel />
                    </View>
                ) : (
                    <FlashList
                        estimatedItemSize={200}
                        data={filteredUsers}
                        keyboardShouldPersistTaps="handled"
                        ListHeaderComponent={<OverviewHeader />}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                tintColor={app_theme.colors.high_color}
                            />
                        }
                        renderItem={({ item, index }: { item: TUser, index: number }) => (
                            <ContactsList
                                item={item}
                                index={index}
                                type={0}
                                selectContact={selectCon}
                                isAdmin={true}
                            />)}
                        onEndReached={() => fetchUsers(true)}
                        onEndReachedThreshold={0.5}
                        contentContainerStyle={{
                            backgroundColor: app_theme.colors.background,
                            paddingHorizontal: 15,
                            paddingBottom: 20
                        }}
                    />
                )}

                {loadingMore && (
                    <View style={{ paddingVertical: 20, borderTopWidth: 1, borderColor: app_theme.colors.border }}>
                        <AppActivityIndicator showLabel />
                    </View>
                )}
            </View>
        </View>
    );
}

export default Users;
