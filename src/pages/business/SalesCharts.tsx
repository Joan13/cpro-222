import React, { useMemo, useState } from "react";
import { ScrollView, Text, Pressable, View } from "react-native";
import { BarChart, LineChart, PieChart } from "react-native-gifted-charts";
import { TSale } from "../../types/types";
import { useAppSelector } from "../../store/app/hooks";
import { strings } from "../../lang/lang";

type ChartType = "line" | "bar" | "area" | "pie" | "donut";
type GroupBy = "hour" | "day" | "month";

interface SalesChartsProps {
    sales: TSale[];
    startDate?: string | Date;
    endDate?: string | Date;
    businessId?: string;
}

type Bucket = {
    key: string;
    label: string;
    value: number;
};

const toDate = (value?: string | Date): Date | null => {
    if (!value) return null;
    const d = value instanceof Date ? value : new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
};

const normalizeStart = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
};

const normalizeEnd = (date: Date) => {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
};

const buildBuckets = (groupBy: GroupBy, start: Date, end: Date): Bucket[] => {
    const out: Bucket[] = [];

    if (groupBy === "hour") {
        for (let h = 0; h < 24; h++) {
            out.push({
                key: `h-${h}`,
                label: `${h}H`,
                value: 0,
            });
        }
        return out;
    }

    if (groupBy === "month") {
        const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
        const last = new Date(end.getFullYear(), end.getMonth(), 1);
        while (cursor <= last) {
            const monthLabel = cursor.toLocaleDateString(undefined, { month: "short" });
            out.push({
                key: `${cursor.getFullYear()}-${cursor.getMonth() + 1}`,
                label: monthLabel,
                value: 0,
            });
            cursor.setMonth(cursor.getMonth() + 1);
        }
        return out;
    }

    const cursor = new Date(start);
    while (cursor <= end) {
        out.push({
            key: `${cursor.getFullYear()}-${cursor.getMonth() + 1}-${cursor.getDate()}`,
            label: cursor.toLocaleDateString(undefined, { weekday: "short" }),
            value: 0,
        });
        cursor.setDate(cursor.getDate() + 1);
    }
    return out;
};

const bucketKeyForDate = (groupBy: GroupBy, date: Date): string => {
    if (groupBy === "hour") return `h-${date.getHours()}`;
    if (groupBy === "month") return `${date.getFullYear()}-${date.getMonth() + 1}`;
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
};

const SalesCharts = ({ sales, startDate, endDate, businessId }: SalesChartsProps) => {
    const theme = useAppSelector(state => state.app_theme.colors);
    const [chartType, setChartType] = useState<ChartType>("area");

    const dateRange = useMemo(() => {
        const validSalesDates = (sales || [])
            .map(s => toDate(s.createdAt))
            .filter((d): d is Date => !!d)
            .sort((a, b) => a.getTime() - b.getTime());

        const fallbackStart = validSalesDates.length > 0 ? validSalesDates[0] : new Date();
        const fallbackEnd = validSalesDates.length > 0 ? validSalesDates[validSalesDates.length - 1] : new Date();

        const resolvedStart = normalizeStart(toDate(startDate) || fallbackStart);
        const resolvedEnd = normalizeEnd(toDate(endDate) || fallbackEnd);
        return {
            start: resolvedStart,
            end: resolvedEnd,
        };
    }, [sales, startDate, endDate]);

    const filteredSales = useMemo(() => {
        return (sales || []).filter(sale => {
            if (businessId && sale.business_id !== businessId) return false;
            if (sale.sale_active !== undefined && sale.sale_active !== 1) return false;
            const created = toDate(sale.createdAt);
            if (!created) return false;
            return created >= dateRange.start && created <= dateRange.end;
        });
    }, [sales, businessId, dateRange]);

    const groupBy = useMemo<GroupBy>(() => {
        const { start, end } = dateRange;
        const sameDay =
            start.getFullYear() === end.getFullYear() &&
            start.getMonth() === end.getMonth() &&
            start.getDate() === end.getDate();

        if (sameDay) return "hour";

        const spansMultipleMonths =
            start.getFullYear() !== end.getFullYear() || start.getMonth() !== end.getMonth();
        if (spansMultipleMonths) return "month";

        return "day";
    }, [dateRange]);

    const buckets = useMemo(() => {
        const prebuilt = buildBuckets(groupBy, dateRange.start, dateRange.end);
        const map = new Map<string, Bucket>();
        prebuilt.forEach(b => map.set(b.key, { ...b }));

        filteredSales.forEach(sale => {
            const d = toDate(sale.createdAt);
            if (!d) return;
            const key = bucketKeyForDate(groupBy, d);
            const bucket = map.get(key);
            if (!bucket) return;
            bucket.value += 1;
            map.set(key, bucket);
        });

        return prebuilt.map(b => map.get(b.key) || b);
    }, [filteredSales, groupBy, dateRange]);

    const chartData = useMemo(
        () => buckets.map(b => ({ value: b.value, label: b.label })),
        [buckets]
    );

    const pieData = useMemo(() => {
        const palette = ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#EF4444", "#14B8A6"];
        const nonZero = buckets.filter(b => b.value > 0);
        const source = nonZero.length > 0 ? nonZero : [{ key: "none", label: "-", value: 1 }];
        return source.map((b, i) => ({
            value: b.value,
            text: b.label,
            color: palette[i % palette.length],
        }));
    }, [buckets]);

    const chartTitle = useMemo(() => {
        if (groupBy === "hour") return strings.sales_by_hour;
        if (groupBy === "month") return strings.sales_by_month;
        return strings.sales_by_day;
    }, [groupBy]);

    return (
        <View
            style={{
                backgroundColor: theme.border,
                borderRadius: 12,
                padding: 15,
                marginBottom: 15,
                borderWidth: 1,
                borderColor: theme.border,
            }}
        >
            <Text style={{ color: theme.text, fontWeight: "700", marginBottom: 12 }}>{chartTitle}</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {[
                    { key: "line", label: strings.chart_type_line },
                    { key: "bar", label: strings.chart_type_bar },
                    { key: "area", label: strings.chart_type_area },
                    { key: "pie", label: strings.chart_type_pie },
                    { key: "donut", label: strings.chart_type_donut },
                ].map(type => (
                    <Pressable
                        key={type.key}
                        onPress={() => setChartType(type.key as ChartType)}
                        style={{
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 16,
                            marginRight: 8,
                            backgroundColor: chartType === type.key ? theme.high_color + "20" : theme.background,
                            borderWidth: 1,
                            borderColor: chartType === type.key ? theme.high_color : theme.border,
                        }}
                    >
                        <Text style={{ color: chartType === type.key ? theme.high_color : theme.gray, fontSize: 12 }}>
                            {type.label}
                        </Text>
                    </Pressable>
                ))}
            </ScrollView>

            <View style={{ minHeight: 220, justifyContent: "center" }}>
                {(chartType === "line" || chartType === "area") && (
                    <LineChart
                        data={chartData}
                        areaChart={chartType === "area"}
                        startFillColor={theme.high_color}
                        endFillColor={theme.high_color}
                        startOpacity={0.35}
                        endOpacity={0.05}
                        color={theme.high_color}
                        thickness={2}
                        hideDataPoints={false}
                        dataPointsColor={theme.high_color}
                        yAxisColor={theme.border}
                        xAxisColor={theme.border}
                        yAxisTextStyle={{ color: theme.gray }}
                        xAxisLabelTextStyle={{ color: theme.gray, fontSize: 10 }}
                        noOfSections={4}
                    />
                )}

                {chartType === "bar" && (
                    <BarChart
                        data={chartData}
                        barWidth={18}
                        spacing={16}
                        roundedTop
                        frontColor={theme.high_color}
                        yAxisColor={theme.border}
                        xAxisColor={theme.border}
                        yAxisTextStyle={{ color: theme.gray }}
                        xAxisLabelTextStyle={{ color: theme.gray, fontSize: 10 }}
                        noOfSections={4}
                    />
                )}

                {(chartType === "pie" || chartType === "donut") && (
                    <PieChart
                        data={pieData}
                        donut={chartType === "donut"}
                        radius={85}
                        innerRadius={chartType === "donut" ? 45 : 0}
                        textColor={theme.text}
                        textSize={10}
                        showText
                    />
                )}
            </View>
        </View>
    );
};

export default SalesCharts;
