import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useAppSelector } from '../../store/app/hooks';

export interface DateRange {
  firstDate: string;
  secondDate: string;
}

export interface DateRangePickerProps {
  onSelectDateRange: (range: DateRange) => void;
  onClear: () => void;
  ln?: string;
  blockSingleDateSelection?: boolean;
  responseFormat?: string;
  selectedDateContainerStyle?: any;
  selectedDateStyle?: any;
  confirmBtnTitle?: string;
  clearBtnTitle?: string;
}

const getDatesInRange = (startStr: string, endStr: string): string[] => {
  const dates: string[] = [];
  const start = new Date(startStr + 'T00:00:00');
  const end = new Date(endStr + 'T00:00:00');
  let current = new Date(start);
  while (current <= end) {
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, '0');
    const dd = String(current.getDate()).padStart(2, '0');
    dates.push(`${yyyy}-${mm}-${dd}`);
    current.setDate(current.getDate() + 1);
  }
  return dates;
};

export default function DateRangePicker({
  onSelectDateRange,
  onClear,
  selectedDateContainerStyle,
  selectedDateStyle,
  clearBtnTitle
}: DateRangePickerProps) {
  const colors = useAppSelector((state) => state.app_theme.colors);
  
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  const selectedBgColor = selectedDateContainerStyle?.backgroundColor || colors.badge_background_color || '#007AFF';
  const selectedTextColor = selectedDateStyle?.color || colors.badge_color || '#ffffff';

  const onDayPress = (day: any) => {
    const dateStr = day.dateString;
    
    if (!startDate || (startDate && endDate)) {
      setStartDate(dateStr);
      setEndDate(null);
      onSelectDateRange({ firstDate: dateStr, secondDate: dateStr });
    } else {
      if (dateStr >= startDate) {
        setEndDate(dateStr);
        onSelectDateRange({ firstDate: startDate, secondDate: dateStr });
      } else {
        setStartDate(dateStr);
        setEndDate(null);
        onSelectDateRange({ firstDate: dateStr, secondDate: dateStr });
      }
    }
  };

  const handleClear = () => {
    setStartDate(null);
    setEndDate(null);
    onClear();
  };

  const markedDates: any = {};
  if (startDate) {
    if (!endDate) {
      markedDates[startDate] = {
        startingDay: true,
        endingDay: true,
        color: selectedBgColor,
        textColor: selectedTextColor,
      };
    } else {
      const dates = getDatesInRange(startDate, endDate);
      dates.forEach((d) => {
        if (d === startDate) {
          markedDates[d] = {
            startingDay: true,
            color: selectedBgColor,
            textColor: selectedTextColor,
          };
        } else if (d === endDate) {
          markedDates[d] = {
            endingDay: true,
            color: selectedBgColor,
            textColor: selectedTextColor,
          };
        } else {
          markedDates[d] = {
            color: selectedBgColor + '33',
            textColor: colors.text,
          };
        }
      });
    }
  }

  return (
    <View style={styles.container}>
      <Calendar
        markingType={'period'}
        markedDates={markedDates}
        onDayPress={onDayPress}
        theme={{
          calendarBackground: 'transparent',
          textSectionTitleColor: colors.gray,
          selectedDayBackgroundColor: selectedBgColor,
          selectedDayTextColor: selectedTextColor,
          todayTextColor: selectedBgColor,
          dayTextColor: colors.text,
          textDisabledColor: colors.gray + '55',
          arrowColor: selectedBgColor,
          monthTextColor: colors.text,
          textDayFontWeight: 'normal',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: 'bold',
        }}
      />
      {startDate && (
        <TouchableOpacity style={[styles.clearButton, { borderColor: colors.border }]} onPress={handleClear}>
          <Text style={[styles.clearButtonText, { color: colors.error || '#FF3B30' }]}>
            {clearBtnTitle || 'Clear Selection'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingBottom: 10,
  },
  clearButton: {
    marginTop: 15,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
    marginHorizontal: 15,
  },
  clearButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
});
