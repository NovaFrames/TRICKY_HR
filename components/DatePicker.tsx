import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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

    const onChange = (_: any, selected?: Date) => {
        setShowPicker(false);
        if (selected) onFromChange(selected);
    };

    const formatDisplay = (d?: Date) => {
        if (!d) return '';
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2,'0')} ${d.getFullYear()}`;
    };

    return (
        <View style={styles.container}>
            <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.inputBorder }]}>
                <TouchableOpacity style={styles.input} onPress={() => setShowPicker(true)}>
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

            {showPicker && (
                <DateTimePicker
                    value={fromDate || new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onChange}
                    maximumDate={new Date()}
                />
            )}
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
});
