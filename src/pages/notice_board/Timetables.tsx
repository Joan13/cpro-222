import { View, RefreshControl } from "react-native";
import { useState, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from "../../store/app/hooks";
import { strings } from "../../lang/lang";
import { IconApp } from "../../components/app/IconApp";
import { YambiText } from "../../components/app/Text";
import { FlashList } from "@shopify/flash-list";
import { remote_host } from "../../../GlobalVariables";
import axios from "axios";
import { NavProps } from "../../types/types";
import { setShowModalApp } from "../../store/reducers/appSlice";
import AppActivityIndicator from "../../components/app/AppActivityIndicator";

export type TTimetable = {
    _id: string;
    company_id: string;
    title: string;
    description?: string;
    start_time: string;
    end_time: string;
    day_of_week?: number;
    date?: string;
    createdAt: string;
    updatedAt: string;
}

const Timetables = ({ navigation }: NavProps) => {
    const theme = useAppSelector(state => state.app_theme.colors);
    const user_data = useAppSelector(state => state.user_data);
    const dispatch = useAppDispatch();
    const [timetables, setTimetables] = useState<TTimetable[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Fetch timetables
    const fetchTimetables = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.post(remote_host + "/yambi/API/get_timetables", {
                phone_number: user_data.phone_number
            });

            if (res.data.success === "1") {
                const timetableItems: TTimetable[] = res.data.data || [];
                // Sort by date/time
                timetableItems.sort((a, b) => {
                    const dateA = a.date ? new Date(a.date).getTime() : 0;
                    const dateB = b.date ? new Date(b.date).getTime() : 0;
                    if (dateA !== dateB) return dateA - dateB;
                    return a.start_time.localeCompare(b.start_time);
                });
                setTimetables(timetableItems);
            } else {
                setTimetables([]);
            }
        } catch (e) {
            setTimetables([]);
        } finally {
            setLoading(false);
        }
    }, [user_data.phone_number]);

    useEffect(() => {
        fetchTimetables();
    }, [fetchTimetables]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchTimetables().finally(() => {
            setRefreshing(false);
        });
    }, [fetchTimetables]);

    const formatTime = (time: string) => {
        if (!time) return "";
        // If time is in HH:mm format, return as is, otherwise try to parse
        if (time.includes(":")) {
            return time.substring(0, 5); // Get HH:mm
        }
        return time;
    };

    const formatDate = (date: string) => {
        if (!date) return "";
        return new Date(date).toLocaleDateString();
    };

    const getDayName = (dayOfWeek: number) => {
        const days = [
            (strings as any).sunday || "Sunday",
            (strings as any).monday || "Monday",
            (strings as any).tuesday || "Tuesday",
            (strings as any).wednesday || "Wednesday",
            (strings as any).thursday || "Thursday",
            (strings as any).friday || "Friday",
            (strings as any).saturday || "Saturday"
        ];
        return days[dayOfWeek] || "";
    };

    const renderTimetableItem = ({ item, index }: { item: TTimetable, index: number }) => {
        return (
            <View style={{
                backgroundColor: theme.border + '30',
                borderRadius: 12,
                padding: 15,
                marginBottom: 12,
                marginHorizontal: 15,
                borderWidth: 1,
                borderColor: theme.border,
            }}>
                {item.title && (
                    <YambiText text={item.title} bold size="normal" color="default" style={{ marginBottom: 8, fontSize: 18 }} />
                )}
                {item.description && (
                    <YambiText text={item.description} size="normal" color="gray" numberLines={0} style={{ marginBottom: 8 }} />
                )}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
                    {item.date && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 15, marginBottom: 8 }}>
                            <IconApp pack="FI" name="calendar" size={12} color={theme.gray} styles={{ marginRight: 6 }} />
                            <YambiText text={formatDate(item.date)} size="small" color="gray" />
                        </View>
                    )}
                    {item.day_of_week !== undefined && item.day_of_week !== null && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 15, marginBottom: 8 }}>
                            <IconApp pack="FI" name="calendar" size={12} color={theme.gray} styles={{ marginRight: 6 }} />
                            <YambiText text={getDayName(item.day_of_week)} size="small" color="gray" />
                        </View>
                    )}
                    {item.start_time && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 15, marginBottom: 8 }}>
                            <IconApp pack="FI" name="clock" size={12} color={theme.gray} styles={{ marginRight: 6 }} />
                            <YambiText text={`${formatTime(item.start_time)}${item.end_time ? ` - ${formatTime(item.end_time)}` : ""}`} size="small" color="gray" />
                        </View>
                    )}
                </View>
            </View>
        );
    };

    const ListHeader = () => (
        <View style={{ paddingHorizontal: 15, paddingVertical: 15 }}>
            <YambiText text={strings.timetable || "Timetable"} bold size="normal" color="default" style={{ fontSize: 20 }} />
        </View>
    );

    return (
        <View style={{
            flex: 1,
            backgroundColor: theme.background,
            borderColor: theme.border,
            borderTopWidth: 1
        }}>
            {loading && !refreshing ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <AppActivityIndicator showLabel />
                </View>
            ) : (
                <FlashList
                    data={timetables}
                    estimatedItemSize={150}
                    ListHeaderComponent={<ListHeader />}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={theme.high_color}
                        />
                    }
                    renderItem={renderTimetableItem}
                    contentContainerStyle={{
                        paddingBottom: 20,
                        paddingTop: 10
                    }}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 }}>
                            <IconApp pack="FI" name="calendar" size={48} color={theme.gray} styles={{ marginBottom: 12, opacity: 0.5 }} />
                            <YambiText text={(strings as any).no_timetables_available || "No timetables available"} size="normal" color="gray" style={{ textAlign: 'center' }} />
                        </View>
                    }
                />
            )}
        </View>
    )
}

export default Timetables;
