import { View, ScrollView, RefreshControl } from "react-native";
import { useState, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from "../../store/app/hooks";
import { strings } from "../../lang/lang";
import { TextBigYambi, TextNormalYambi, TextNormalYambiGray } from "../../components/app/Text";
import { setShowModalApp } from "../../store/reducers/appSlice";
import { NavProps } from "../../types/types";
import { useObject } from "@realm/react";
import { UserBusinesses } from "../../store/database/Models";
import { FlashList } from "@shopify/flash-list";
import SubscriberItem from "../../components/lists/business/SubscriberItem";
import { remote_host } from "../../../GlobalVariables";
import axios from "axios";
import AppActivityIndicator from "../../components/app/AppActivityIndicator";
import ModalApp from "../../components/app/ModalApp";

const BusinessSubscribers = ({ route }: NavProps) => {
    const { business_id } = route.params;

    const theme = useAppSelector(state => state.app_theme.colors);
    const [subscribers, setSubscribers] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [showInternetError, setShowInternetError] = useState<boolean>(false);
    const dispatch = useAppDispatch();

    const business = useObject(UserBusinesses, business_id);

    useEffect(() => {
        fetchSubscribers();
    }, [business_id]);

    const fetchSubscribers = async () => {
        try {
            setLoading(true);
            const res = await axios.post(remote_host + "/yambi/API/get_subscriptions", {
                business_id: business_id
            });

            if (res.data.success === "1") {
                setSubscribers(res.data.subscriptions || []);
                setShowInternetError(false);
            } else {
                setShowInternetError(true);
                dispatch(setShowModalApp(true));
            }
        } catch (error) {
            console.error("Error fetching subscribers:", error);
            setShowInternetError(true);
            dispatch(setShowModalApp(true));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchSubscribers();
    }, []);

    if (business === null) {
        return null;
    }

    return (
        <View style={{
            flex: 1,
            backgroundColor: theme.background,
            borderColor: theme.border,
            borderTopWidth: 1,
        }}>
            {showInternetError && (
                <ModalApp 
                    onClose={() => { 
                        dispatch(setShowModalApp(false)); 
                        setShowInternetError(false);
                    }} 
                    singleButton 
                    title={strings.error}>
                    <TextNormalYambiGray text={strings.connection_failed} />
                </ModalApp>
            )}

            <ScrollView
                style={{ flex: 1 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={theme.high_color}
                    />
                }>
                <View style={{
                    paddingHorizontal: 15,
                    paddingTop: 15,
                    // paddingBottom: 20,
                }}>
                    <TextNormalYambi text={strings.business_name} />
                    <TextBigYambi bold text={business.business_name} styles={{ marginBottom: 20 }} />

                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        // marginBottom: 15,
                        paddingBottom: 10,
                        borderBottomWidth: 1,
                        borderBottomColor: theme.border
                    }}>
                        <TextNormalYambi text={strings.followers} bold />
                        <TextNormalYambiGray text={subscribers.length.toString()} />
                    </View>
                </View>

                {loading ? (
                    <View style={{ paddingVertical: 50 }}>
                        <AppActivityIndicator />
                    </View>
                ) : subscribers.length === 0 ? (
                    <View style={{ padding: 30, alignItems: 'center' }}>
                        <TextNormalYambiGray text={strings.no_subscribers} styles={{ textAlign: 'center' }} />
                    </View>
                ) : (
                    <FlashList
                        data={subscribers as never}
                        estimatedItemSize={80}
                        renderItem={({ item, index }: { item: any, index: number }) => (
                            <SubscriberItem item={item} index={index} />
                        )}
                        keyExtractor={(item: any) => item._id}
                    />
                )}
            </ScrollView>
        </View>
    );
};

export default BusinessSubscribers;
