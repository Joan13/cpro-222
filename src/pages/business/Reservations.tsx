import React, { useState } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { useAppSelector } from '../../store/app/hooks';
import { useQuery } from '@realm/react';
import { Reservations as ReservationsModel } from '../../store/database/Models';
import { NavProps } from '../../types/types';
import { strings } from '../../lang/lang';
import { LegendList } from '@legendapp/list';
import ReservationItem from '../../components/lists/business/ReservationItem';
import { IconApp } from '../../components/app/IconApp';
import { TextNormalYambi, TextNormalYambiGray, TextSmallYambi, TextSmallYambiGray } from '../../components/app/Text';

const STATUS_FILTERS = [0, 1, 2, 3, 4, 5]; // 0 = All

const ReservationsPage = ({ navigation, route }: NavProps) => {
    const { business_id = '', sales_point_id = '' } = route.params || {};
    const app_theme = useAppSelector(state => state.app_theme);
    const [statusFilter, setStatusFilter] = useState<number>(0);

    const reservations = useQuery(
        ReservationsModel, res => {
            let q = res.filtered(
                'business_id == $0 || sales_point_id == $1',
                business_id,
                sales_point_id
            ).sorted('createdAt', true);
            return q;
        }, [business_id, sales_point_id]
    );

    const filtered = statusFilter === 0
        ? Array.from(reservations as any)
        : Array.from(reservations as any).filter((r: any) => r.status === statusFilter);

    const statusLabel = (s: number) => {
        const map: Record<number, string> = {
            0: (strings as any).all || 'All',
            1: (strings as any).reservation_status_1 || 'Pending',
            2: (strings as any).reservation_status_2 || 'Confirmed',
            3: (strings as any).reservation_status_3 || 'Completed',
            4: (strings as any).reservation_status_4 || 'Cancelled',
            5: (strings as any).reservation_status_5 || 'Expired',
        };
        return map[s];
    };

    const statusColor = (s: number) => {
        const map: Record<number, string> = {
            0: app_theme.colors.high_color,
            1: '#F59E0B',
            2: '#6366F1',
            3: '#10B981',
            4: app_theme.colors.error,
            5: app_theme.colors.gray,
        };
        return map[s] || app_theme.colors.gray;
    };

    return (
        <View style={{ flex: 1, backgroundColor: app_theme.colors.background }}>
            {/* Status filter chips */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{
                    maxHeight: 50,
                    borderBottomWidth: 1,
                    borderColor: app_theme.colors.border,
                }}
                contentContainerStyle={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                }}
            >
                {STATUS_FILTERS.map(s => {
                    const active = statusFilter === s;
                    const color = statusColor(s);
                    return (
                        <Pressable
                            key={s}
                            onPress={() => setStatusFilter(s)}
                            style={{
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                borderRadius: 20,
                                height: 35,
                                marginRight: 8,
                                backgroundColor: active ? color + '22' : app_theme.colors.border,
                                borderWidth: 1,
                                borderColor: active ? color : 'transparent',
                            }}
                        >
                            <TextSmallYambi
                                text={statusLabel(s)}
                                styles={{ color: active ? color : app_theme.colors.gray, fontSize: 12 }}
                            />
                        </Pressable>
                    );
                })}
            </ScrollView>

            <LegendList
                style={{ flex: 1 }}
                data={filtered as never}
                keyExtractor={(item: any) => item._id}
                estimatedItemSize={90}
                contentContainerStyle={{ paddingBottom: 50 }}
                ListHeaderComponent={() => (
                    <View style={{ paddingHorizontal: 15, paddingTop: 15, paddingBottom: 8 }}>
                        <TextSmallYambiGray
                            text={`${filtered.length} ${(strings as any).reservations || 'reservations'}`}
                        />
                    </View>
                )}
                ListEmptyComponent={() => (
                    <View style={{ alignItems: 'center', padding: 60 }}>
                        <IconApp pack="FI" name="bookmark" size={48} color={app_theme.colors.gray} />
                        <TextNormalYambiGray
                            text={(strings as any).no_reservations || 'No reservations found'}
                            styles={{ marginTop: 16, textAlign: 'center' }}
                        />
                    </View>
                )}
                renderItem={({ item, index }: { item: any, index: number }) => (
                    <ReservationItem
                        item={item}
                        isLast={index === filtered.length - 1}
                        onPress={() => navigation.navigate('Reservation' as never, { reservationId: item._id } as never)}
                    />
                )}
                ListFooterComponent={<View style={{ height: 24 }} />}
            />
        </View>
    );
};

export default ReservationsPage;
