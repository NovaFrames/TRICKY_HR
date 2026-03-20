import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
    fromDate: Date;
    toDate?: Date;
    onFromChange: (d: Date) => void;
    labelFrom?: string;
    labelTo?: string;
}

export default function DatePicker({ fromDate, toDate, onFromChange, labelFrom = 'From Date', labelTo = 'To Date' }: Props) {
    const { theme } = useTheme();
    const [showPicker, setShowPicker] = useState(false);
    const [showWebCalendar, setShowWebCalendar] = useState(false);
    const [calendarMonth, setCalendarMonth] = useState(
        new Date(fromDate.getFullYear(), fromDate.getMonth(), 1),
    );

    const onChange = (_: any, selected?: Date) => {
        setShowPicker(false);
        if (selected) onFromChange(selected);
    };

    const formatDisplay = (d?: Date) => {
        if (!d) return '';
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2,'0')} ${d.getFullYear()}`;
    };

    const normalizeDate = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const today = normalizeDate(new Date());
    const selectedDay = normalizeDate(fromDate);

    const openDatePicker = () => {
        if (Platform.OS !== "web") {
            setShowPicker(true);
            return;
        }
        setCalendarMonth(new Date(fromDate.getFullYear(), fromDate.getMonth(), 1));
        setShowWebCalendar(true);
    };

    const renderWebCalendar = () => {
        const monthStart = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
        const monthEnd = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0);
        const startWeekday = monthStart.getDay();
        const totalDays = monthEnd.getDate();
        const cells: (number | null)[] = [];

        for (let i = 0; i < startWeekday; i += 1) cells.push(null);
        for (let d = 1; d <= totalDays; d += 1) cells.push(d);
        while (cells.length % 7 !== 0) cells.push(null);

        const monthTitle = calendarMonth.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
        });

        const weekDays = ["S", "M", "T", "W", "T", "F", "S"];

        return (
            <Modal
                transparent
                visible={showWebCalendar}
                animationType="fade"
                onRequestClose={() => setShowWebCalendar(false)}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    style={styles.webBackdrop}
                    onPress={() => setShowWebCalendar(false)}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={() => { }}
                        style={[
                            styles.webCalendarCard,
                            { backgroundColor: theme.cardBackground, borderColor: theme.inputBorder },
                        ]}
                    >
                        <View style={styles.webCalendarHeader}>
                            <TouchableOpacity
                                onPress={() =>
                                    setCalendarMonth(
                                        new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1),
                                    )
                                }
                            >
                                <Ionicons name="chevron-back" size={18} color={theme.text} />
                            </TouchableOpacity>
                            <Text style={[styles.webCalendarTitle, { color: theme.text }]}>
                                {monthTitle}
                            </Text>
                            <TouchableOpacity
                                onPress={() =>
                                    setCalendarMonth(
                                        new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1),
                                    )
                                }
                            >
                                <Ionicons name="chevron-forward" size={18} color={theme.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.webWeekRow}>
                            {weekDays.map((day) => (
                                <Text key={day} style={[styles.webWeekLabel, { color: theme.placeholder }]}>
                                    {day}
                                </Text>
                            ))}
                        </View>

                        <View style={styles.webGrid}>
                            {cells.map((day, idx) => {
                                if (!day) {
                                    return <View key={`empty-${idx}`} style={styles.webDayCell} />;
                                }

                                const cellDate = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
                                const normalizedCell = normalizeDate(cellDate);
                                const isFuture = normalizedCell > today;
                                const isSelected = normalizedCell.getTime() === selectedDay.getTime();

                                return (
                                    <TouchableOpacity
                                        key={`${calendarMonth.getMonth()}-${day}`}
                                        style={[
                                            styles.webDayCell,
                                            isSelected && { backgroundColor: theme.primary },
                                            isFuture && { opacity: 0.35 },
                                        ]}
                                        disabled={isFuture}
                                        onPress={() => {
                                            onFromChange(cellDate);
                                            setShowWebCalendar(false);
                                        }}
                                    >
                                        <Text
                                            style={[
                                                styles.webDayText,
                                                { color: isSelected ? "#fff" : theme.text },
                                            ]}
                                        >
                                            {day}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        );
    };

    return (
        <View style={styles.container}>
            <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.inputBorder }]}>
                <TouchableOpacity style={styles.input} onPress={openDatePicker}>
                    <Text style={[styles.label, { color: theme.placeholder }]}>{labelFrom}</Text>
                    <View style={styles.row}>
                        <Ionicons name="calendar-outline" size={18} color={theme.primary} />
                        <Text style={[styles.value, { color: theme.text }]}>{formatDisplay(fromDate)}</Text>
                    </View>
                </TouchableOpacity>

                <View style={styles.arrowWrapper}>
                    <Ionicons name="arrow-forward" size={16} color={theme.textLight} />
                </View>

                <View style={styles.input}>
                    <Text style={[styles.label, { color: theme.placeholder }]}>{labelTo}</Text>
                    <View style={styles.row}>
                        <Ionicons name="calendar-outline" size={18} color={theme.primary} />
                        <Text style={[styles.value, { color: theme.text }]}>{formatDisplay(toDate)}</Text>
                    </View>
                </View>
            </View>

            {showPicker && Platform.OS !== "web" && (
                <DateTimePicker
                    value={fromDate || new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onChange}
                    maximumDate={new Date()}
                />
            )}

            {Platform.OS === "web" && showWebCalendar && renderWebCalendar()}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { width: '100%' },
    card: {
        flexDirection: 'row',
        borderRadius: 4,
        padding: 4,
        alignItems: 'center',
        borderWidth: 1,
    },
    input: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 12,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    value: {
        fontSize: 14,
        fontWeight: '700',
        marginLeft: 6,
    },
    arrowWrapper: {
        paddingHorizontal: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    webBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    webCalendarCard: {
        width: 320,
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
    },
    webCalendarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    webCalendarTitle: {
        fontSize: 15,
        fontWeight: '700',
    },
    webWeekRow: {
        flexDirection: 'row',
        marginBottom: 6,
    },
    webWeekLabel: {
        width: `${100 / 7}%`,
        textAlign: 'center',
        fontSize: 12,
        fontWeight: '600',
    },
    webGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    webDayCell: {
        width: `${100 / 7}%`,
        aspectRatio: 1,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    webDayText: {
        fontSize: 13,
        fontWeight: '600',
    },
});
