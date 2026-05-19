import { TouchableOpacity, View, TextInput, RefreshControl } from "react-native";
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
import BusinessesList from "../../components/lists/business/BusinessesList";
import { remote_host } from "../../../GlobalVariables";
import AppActivityIndicator from "../../components/app/AppActivityIndicator";

const YambiBusinesses = () => {

    const theme = useAppSelector(state => state.app_theme.colors);
    const text_business_search = useAppSelector(state => state.app.text_business_search);
    const [showInfo, setShowInfo] = useState<boolean>(false);
    const app_description = useAppSelector(state => state.persisted_app.app_description);
    const business_opened = useAppSelector(state => state.app.business_opened);
    const [showEnterCurrentPassword, setShowEnterCurrentPassword] = useState<boolean>(false);
    const [showSuccessPasswordEntered, setShowSuccessPasswordEntered] = useState<boolean>(false);
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

    const fetchBusinesses = useCallback(async (loadMore = false, searchText = '') => {
        if (fetchingRef.current) return;
        if (!hasMore && loadMore) return;

        fetchingRef.current = true;
        if (loadMore) setLoadingMore(true);
        else setLoading(true);

        try {
            const res = await axios.post(remote_host + "/yambi/API/get_admin_data", {
                flag: 2, // flag 2 for businesses
                last_id: loadMore ? lastId : null,
                search: searchText || ''
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

    useEffect(() => {
        fetchBusinesses(false, text_business_search);
    }, [text_business_search]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setLastId(null);
        setHasMore(true);
        fetchBusinesses(false, text_business_search).finally(() => {
            setRefreshing(false);
        });
    }, [text_business_search]);

    // Check password requirement when component mounts or when password requirement changes
    useEffect(() => {
        if (app_description.require_password_business && !business_opened) {
            setShowEnterCurrentPassword(true);
        }
    }, [app_description.require_password_business, business_opened]);

    const SearchItem = (search: string) => {
        dispatch(setTextBusinessSearch(search));
        // Fetch will be triggered by useEffect
    }

    const OverviewHeader = () => (
        <View style={{
            marginVertical: 15,
            backgroundColor: theme.border + '40',
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: theme.border,
        }}>
            <TextNormalYambi text={strings.businesses_overview} bold styles={{ marginBottom: 12, fontSize: 18 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                <View style={{ alignItems: 'center' }}>
                    <IconApp pack="FI" name="briefcase" size={24} color={theme.high_color} />
                    <TextNormalYambiHighColor text={overview.total.toString()} bold styles={{ marginTop: 8, fontSize: 24 }} />
                    <TextNormalYambiGray text={strings.total} styles={{ marginTop: 4 }} />
                </View>
                <View style={{ alignItems: 'center' }}>
                    <IconApp pack="FI" name="check-circle" size={24} color={theme.success} />
                    <TextNormalYambiHighColor text={overview.active.toString()} bold styles={{ marginTop: 8, fontSize: 24, color: theme.success }} />
                    <TextNormalYambiGray text={strings.active} styles={{ marginTop: 4 }} />
                </View>
                <View style={{ alignItems: 'center' }}>
                    <IconApp pack="FI" name="x-circle" size={24} color={theme.error} />
                    <TextNormalYambiHighColor text={overview.inactive.toString()} bold styles={{ marginTop: 8, fontSize: 24, color: theme.error }} />
                    <TextNormalYambiGray text={strings.inactive} styles={{ marginTop: 4 }} />
                </View>
            </View>
        </View>
    );

    const SETCP = (cpp: string) => {
        if (cpp.length === 6 && cpp === app_description.password_business) {
            setShowSuccessPasswordEntered(true);

            setTimeout(() => {
                setShowEnterCurrentPassword(false);
                dispatch(setBusinessOpened(true));
            }, 500);
        } else {
            setShowSuccessPasswordEntered(false);
        }
    }

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

            {showEnterCurrentPassword ?
                <>
                    <TextNormalYambi bold text={strings.enter_password} styles={{ textAlign: 'center' }} />

                    <View style={{ height: 40, justifyContent: 'center', }}>
                        {showSuccessPasswordEntered ?
                            <View style={{ alignItems: 'center' }}>
                                <IconApp name={"check-circle"} pack='FA' size={25} color={theme.success} />
                            </View> : null}
                    </View>

                    <View style={{
                        height: 50,
                        width: '100%',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                        <TextInput
                            placeholderTextColor="gray"
                            placeholder={strings.code}
                            textAlign="center"
                            secureTextEntry
                            keyboardType="number-pad"
                            maxLength={6}
                            style={{
                                flex: 1,
                                color: theme.text,
                                height: 45,
                                textAlign: 'center',
                                letterSpacing: 20,
                                fontSize: 20,
                                fontWeight: '900',
                                width: '100%'
                            }}
                            //    secureTextEntry={ste ? true : false}
                            // value={cp}
                            onChangeText={SETCP}
                        />
                    </View>
                </>
                :
                <View style={{ flex: 1 }}>
                    <View
                        style={{ marginBottom: 0, marginHorizontal: 15, borderBottomWidth: 1, paddingVertical: 0, borderColor: theme.border, flexDirection: 'row', alignItems: 'center', backgroundColor: theme.background }}>
                        <Feather name="search" size={16} style={{ marginRight: 10, color: theme.gray }} />
                        <TextInput
                            onChangeText={SearchItem}
                            value={text_business_search}
                            placeholder={strings.search}
                            placeholderTextColor={theme.gray}
                            style={{ flex: 1, paddingVertical: 0, height: 40, borderWidth: 0, borderColor: theme.background, backgroundColor: theme.background, color: theme.text }}
                        />
                        {text_business_search !== "" ?
                            <TouchableOpacity
                                onPress={() => {
                                    dispatch(setTextBusinessSearch(""));
                                }}
                                style={{
                                    height: 30,
                                    width: 30,
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }}>
                                <Feather name="x" size={16} style={{ color: theme.text }} />
                            </TouchableOpacity> : null}
                    </View>

                    {loading && !loadingMore ? (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <AppActivityIndicator showLabel />
                        </View>
                    ) : (
                        <LegendList
                            data={businesses}
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
                                <BusinessesList
                                    index={index}
                                    item={item}
                                    isAdmin={true}
                                />)}
                            onEndReached={() => fetchBusinesses(true, text_business_search)}
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
            }
        </View>
    )
}

export default YambiBusinesses;

