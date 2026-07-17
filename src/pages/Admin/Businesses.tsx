import { Pressable, View, TextInput, RefreshControl } from "react-native";
import Feather from 'react-native-vector-icons/Feather';
import { useEffect, useState, useCallback, useRef } from 'react';
import { TBusiness } from "../../types/types";
import { strings } from "../../lang/lang";
import { IconApp } from "../../components/app/IconApp";
import { useAppDispatch, useAppSelector } from "../../store/app/hooks";
import axios from "axios";
import { setBusinessOpened, setTextBusinessSearch, setShowModalApp } from "../../store/reducers/appSlice";
import { TextNormalYambi, TextNormalYambiGray, TextNormalYambiHighColor } from "../../components/app/Text";
import ModalApp from "../../components/app/ModalApp";
import { LegendList } from '@legendapp/list';
import BusinessesListItem from "../../components/lists/admin/BusinessesListItem";
import * as RootNavigation from "../../services/Navigation_ref";
import { remote_host } from "../../../GlobalVariables";
import AppActivityIndicator from "../../components/app/AppActivityIndicator";

const YambiBusinesses = () => {

    const theme = useAppSelector(state => state.app_theme.colors);
    const text_business_search = useAppSelector(state => state.app.text_business_search);
    const [localSearch, setLocalSearch] = useState(text_business_search);
    const [showInfo, setShowInfo] = useState<boolean>(false);
    const app_description = useAppSelector(state => state.persisted_app.app_description);
    const dispatch = useAppDispatch();

    const [businesses, setBusinesses] = useState<TBusiness[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [lastId, setLastId] = useState<string | null>(null);
    const [overview, setOverview] = useState<{ total: number; active: number; inactive: number }>({ total: 0, active: 0, inactive: 0 });
    const fetchingRef = useRef(false);
    const [refreshing, setRefreshing] = useState(false);
    // const businesses = useAppSelector(state => state.businesses);
    // const businesses = [];
    // const height = useWindowDimensions().height;

    // const business_users = useQuery(
    //     BusinessUsers, user => {
    //         return user.filtered('user == $0', user_data.phone_number)
    //     }, []);

    // console.log(businesses.length)

    const fetchBusinesses = useCallback(async (loadMore = false) => {
        if (fetchingRef.current) return;
        if (!hasMore && loadMore) return;

        fetchingRef.current = true;
        if (loadMore) setLoadingMore(true);
        else setLoading(true);

        try {
            const res = await axios.post(remote_host + "/yambi/API/get_admin_data", {
                flag: 2, // flag 2 for businesses
                last_id: loadMore ? lastId : null,
                search: '' // empty string to search in local fetched data
            });

            if (res.data.success === "1") {
                const newBusinesses: TBusiness[] = res.data.data || [];
                if (loadMore) {
                    setBusinesses(prev => [...prev, ...newBusinesses]);
                } else {
                    setBusinesses(newBusinesses);
                    setLastId(null);
                }

                // Update overview stats
                if (res.data.overview) {
                    setOverview(res.data.overview);
                }

                // Set last ID for pagination
                if (newBusinesses.length > 0 && newBusinesses[newBusinesses.length - 1]?._id) {
                    setLastId(newBusinesses[newBusinesses.length - 1]._id);
                }

                // Check if more data available (assuming 100 items per page)
                setHasMore(newBusinesses.length === 100);
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
            dispatch(setTextBusinessSearch(localSearch));
        }, 500);
        return () => clearTimeout(timer);
    }, [localSearch, dispatch]);

    useEffect(() => {
        fetchBusinesses(false);
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setLastId(null);
        setHasMore(true);
        fetchBusinesses(false).finally(() => {
            setRefreshing(false);
        });
    }, [fetchBusinesses]);



    const SearchItem = (search: string) => {
        setLocalSearch(search);
    }

    const filteredBusinesses = businesses.filter(business => {
        const searchStr = localSearch.toLowerCase().trim();
        if (searchStr === '') return true;
        
        return (
            business.business_name?.toLowerCase().includes(searchStr) ||
            business._id?.toLowerCase().includes(searchStr) ||
            business.phone_number?.toLowerCase().includes(searchStr) ||
            business.description_service?.toLowerCase().includes(searchStr) ||
            business.slogan?.toLowerCase().includes(searchStr)
        );
    });

    const OverviewHeader = () => (
        <View style={{ marginVertical: 15 }}>
            <TextNormalYambi text={strings.businesses_overview} bold styles={{ marginBottom: 12, fontSize: 16 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{
                    flex: 1,
                    backgroundColor: theme.border + '15',
                    borderRadius: 14,
                    padding: 12,
                    alignItems: 'center',
                    marginRight: 6,
                    borderWidth: 1,
                    borderColor: theme.border,
                }}>
                    <View style={{ backgroundColor: theme.high_color + '15', padding: 8, borderRadius: 10 }}>
                        <IconApp pack="FI" name="briefcase" size={18} color={theme.high_color} />
                    </View>
                    <TextNormalYambiHighColor text={overview.total.toString()} bold styles={{ marginTop: 8, fontSize: 18 }} />
                    <TextNormalYambiGray text={strings.total} styles={{ marginTop: 2, fontSize: 11 }} />
                </View>
                <View style={{
                    flex: 1,
                    backgroundColor: theme.border + '15',
                    borderRadius: 14,
                    padding: 12,
                    alignItems: 'center',
                    marginHorizontal: 3,
                    borderWidth: 1,
                    borderColor: theme.border,
                }}>
                    <View style={{ backgroundColor: theme.success + '15', padding: 8, borderRadius: 10 }}>
                        <IconApp pack="FI" name="check-circle" size={18} color={theme.success} />
                    </View>
                    <TextNormalYambiHighColor text={overview.active.toString()} bold styles={{ marginTop: 8, fontSize: 18, color: theme.success }} />
                    <TextNormalYambiGray text={strings.active} styles={{ marginTop: 2, fontSize: 11 }} />
                </View>
                <View style={{
                    flex: 1,
                    backgroundColor: theme.border + '15',
                    borderRadius: 14,
                    padding: 12,
                    alignItems: 'center',
                    marginLeft: 6,
                    borderWidth: 1,
                    borderColor: theme.border,
                }}>
                    <View style={{ backgroundColor: theme.error + '15', padding: 8, borderRadius: 10 }}>
                        <IconApp pack="FI" name="x-circle" size={18} color={theme.error} />
                    </View>
                    <TextNormalYambiHighColor text={overview.inactive.toString()} bold styles={{ marginTop: 8, fontSize: 18, color: theme.error }} />
                    <TextNormalYambiGray text={strings.inactive} styles={{ marginTop: 2, fontSize: 11 }} />
                </View>
            </View>
        </View>
    );



    return (
        <View style={{
            flex: 1,
            justifyContent: 'center',
            backgroundColor: theme.background,
            borderColor: theme.border,
            borderTopWidth: 0
        }}>
            {showInfo ?
                <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowInfo(false) }} singleButton title={strings.error}>
                    <TextNormalYambiGray text={strings.impossible_edit} />
                </ModalApp> : null}

            <View style={{ flex: 1 }}>
                <View
                    style={{
                        marginHorizontal: 15,
                        marginVertical: 10,
                        paddingHorizontal: 12,
                        borderRadius: 12,
                        borderWidth: 1.5,
                        borderColor: theme.border,
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: theme.border + '20',
                        height: 48,
                    }}>
                    <Feather name="search" size={18} style={{ marginRight: 10, color: theme.gray }} />
                    <TextInput
                        onChangeText={SearchItem}
                        value={localSearch}
                        placeholder={strings.search}
                        placeholderTextColor={theme.gray}
                        style={{ flex: 1, paddingVertical: 0, height: '100%', borderWidth: 0, backgroundColor: 'transparent', color: theme.text, fontSize: 15 }}
                    />
                    {localSearch !== "" ?
                        <Pressable
                            onPress={() => {
                                setLocalSearch("");
                                dispatch(setTextBusinessSearch(""));
                            }}
                            style={{
                                height: 30,
                                width: 30,
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}>
                            <Feather name="x" size={18} style={{ color: theme.text }} />
                        </Pressable> : null}
                </View>

                {loading && !loadingMore ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <AppActivityIndicator showLabel />
                    </View>
                ) : (
                    <LegendList
                        data={filteredBusinesses}
                        keyExtractor={(item: TBusiness) => item._id}
                        keyboardShouldPersistTaps='handled'
                        ListHeaderComponent={<OverviewHeader />}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                tintColor={theme.high_color}
                            />
                        }
                        renderItem={({ item, index }: { item: TBusiness, index: number }) => (
                            <BusinessesListItem
                                item={item}
                                onPress={() => RootNavigation.navigate("AdminBusiness", { business: item })}
                                onEditPress={() => RootNavigation.navigate("EditBusiness", { business: item })}
                            />)}
                        onEndReached={() => fetchBusinesses(true)}
                        onEndReachedThreshold={0.5}
                        contentContainerStyle={{
                            paddingHorizontal: 15,
                            paddingBottom: 20
                        }}
                    />
                )}

                {loadingMore && (
                    <View style={{ paddingVertical: 20, borderTopWidth: 1, borderColor: theme.border }}>
                        <AppActivityIndicator showLabel />
                    </View>
                )}
            </View>
        </View>
    )
}

export default YambiBusinesses;

