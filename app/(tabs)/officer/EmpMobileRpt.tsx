import Header, { HEADER_HEIGHT } from '@/components/Header';
import { useProtectedBack } from '@/hooks/useProtectedBack';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import ApiService from '../../../services/ApiService';

interface AttendanceRecord {
    ModeN: number;
    EmpNameC: string;
    EmpCodeC: string;
    ProjectNameC: string;
    DateD: string;
    ShiftCodeC: string;
    PunchTimeC: string;
    PunchLocC: string;
    RemarkC: string;
}

export default function EmpMobileRpt() {
    const { theme } = useTheme();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);

    // Date states
    const [fromDate, setFromDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30); // 30 days ago
        return d;
    });
    const [toDate, setToDate] = useState(new Date());
    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showToPicker, setShowToPicker] = useState(false);

    useProtectedBack({
        home: '/home',
        settings: '/settings',
        dashboard: '/dashboard',
    });

    // Format date for display (MMM dd yyyy)
    const formatDisplayDate = (dateVal: string | Date | null) => {
        if (!dateVal) return '';

        let d: Date;
        if (typeof dateVal === 'string') {
            // Handle ASP.NET format /Date(123456789)/
            if (dateVal.includes('/Date(')) {
                const timestamp = parseInt(dateVal.replace(/\/Date\((-?\d+)\)\//, '$1'));
                if (!isNaN(timestamp)) {
                    d = new Date(timestamp);
                } else {
                    return dateVal;
                }
            } else {
                d = new Date(dateVal);
            }
        } else {
            d = dateVal;
        }

        if (isNaN(d.getTime())) return String(dateVal);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')} ${d.getFullYear()}`;
    };

    // Format date for API (MM/dd/yyyy)
    const formatDateForApi = (d: Date) => {
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${month}/${day}/${year}`;
    };

    const fetchAttendanceReport = async () => {
        setLoading(true);
        try {
            const fromDateStr = formatDateForApi(fromDate);
            const toDateStr = formatDateForApi(toDate);

            console.log('Fetching attendance report:', { fromDateStr, toDateStr });

            const result = await ApiService.getAttendanceReport(fromDateStr, toDateStr, 0);

            if (result.success && result.data) {
                setAttendanceData(result.data);
                console.log('Attendance data loaded:', result.data.length, 'records');
            } else {
                console.error('Failed to fetch attendance report:', result.error);
                Alert.alert('Error', result.error || 'Failed to fetch attendance report');
            }
        } catch (error: any) {
            console.error('Error fetching attendance report:', error);
            Alert.alert('Error', error?.message || 'Failed to fetch attendance report');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAttendanceReport();
    }, [fromDate, toDate]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchAttendanceReport();
    };

    const onChangeFrom = (event: any, selectedDate?: Date) => {
        setShowFromPicker(false);
        if (selectedDate) {
            if (selectedDate > toDate) {
                Alert.alert('Invalid Date', 'From date cannot be after To date');
                return;
            }
            setFromDate(selectedDate);
        }
    };

    const onChangeTo = (event: any, selectedDate?: Date) => {
        setShowToPicker(false);
        if (selectedDate) {
            if (selectedDate < fromDate) {
                Alert.alert('Invalid Date', 'To date cannot be before From date');
                return;
            }
            setToDate(selectedDate);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Header title='Mobile Attendance Report' />

            <ScrollView
                style={styles.scrollContainer}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[theme.primary]}
                        tintColor={theme.primary}
                    />
                }
            >
                {/* Date Picker Section */}
                <View style={styles.datePickerSection}>
                    <View style={[styles.dateCard, { backgroundColor: theme.cardBackground, borderColor: theme.inputBorder }]}>
                        <TouchableOpacity style={styles.dateInput} onPress={() => setShowFromPicker(true)}>
                            <Text style={[styles.dateLabel, { color: theme.placeholder }]}>From Date</Text>
                            <View style={styles.dateRow}>
                                <Ionicons name="calendar-outline" size={18} color={theme.primary} />
                                <Text style={[styles.dateValue, { color: theme.text }]}>{formatDisplayDate(fromDate)}</Text>
                            </View>
                        </TouchableOpacity>

                        <View style={[styles.dateDivider, { backgroundColor: theme.inputBorder }]} />

                        <TouchableOpacity style={styles.dateInput} onPress={() => setShowToPicker(true)}>
                            <Text style={[styles.dateLabel, { color: theme.placeholder }]}>To Date</Text>
                            <View style={styles.dateRow}>
                                <Ionicons name="calendar-outline" size={18} color={theme.primary} />
                                <Text style={[styles.dateValue, { color: theme.text }]}>{formatDisplayDate(toDate)}</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Table Container */}
                <View style={styles.tableContainer}>
                    {loading ? (
                        <View style={styles.emptyState}>
                            <ActivityIndicator size="large" color={theme.primary} />
                            <Text style={[styles.emptyText, { color: theme.placeholder }]}>Loading...</Text>
                        </View>
                    ) : attendanceData.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="document-text-outline" size={64} color={theme.icon} />
                            <Text style={[styles.emptyText, { color: theme.placeholder }]}>No attendance records found</Text>
                            <Text style={[styles.emptySubtext, { color: theme.placeholder }]}>
                                Try adjusting the date range
                            </Text>
                        </View>
                    ) : (
                        <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.horizontalScroll}>
                            <View style={[styles.table, { borderColor: theme.inputBorder }]}>
                                {/* Table Header */}
                                <View style={[styles.tableHeader, { backgroundColor: theme.cardBackground, borderColor: theme.inputBorder }]}>
                                    <Text style={[styles.headerCell, styles.dateColumn, { color: theme.text }]}>Date</Text>
                                    <Text style={[styles.headerCell, styles.nameColumn, { color: theme.text }]}>Employee</Text>
                                    <Text style={[styles.headerCell, styles.codeColumn, { color: theme.text }]}>Code</Text>
                                    <Text style={[styles.headerCell, styles.modeColumn, { color: theme.text }]}>Mode</Text>
                                    <Text style={[styles.headerCell, styles.timeColumn, { color: theme.text }]}>Time</Text>
                                    <Text style={[styles.headerCell, styles.shiftColumn, { color: theme.text }]}>Shift</Text>
                                    <Text style={[styles.headerCell, styles.projectColumn, { color: theme.text }]}>Project</Text>
                                    <Text style={[styles.headerCell, styles.locationColumn, { color: theme.text }]}>Location</Text>
                                </View>

                                {/* Table Rows */}
                                {attendanceData.map((item, index) => {
                                    const isCheckIn = item.ModeN === 0;
                                    const modeColor = isCheckIn ? '#4CAF50' : '#F44336';
                                    const modeText = isCheckIn ? 'IN' : 'OUT';

                                    return (
                                        <View
                                            key={`${item.EmpCodeC}-${index}`}
                                            style={[
                                                styles.tableRow,
                                                {
                                                    backgroundColor: index % 2 === 0 ? theme.background : theme.cardBackground,
                                                    borderColor: theme.inputBorder,
                                                },
                                            ]}
                                        >
                                            <Text style={[styles.cell, styles.dateColumn, { color: theme.text }]}>
                                                {formatDisplayDate(item.DateD)}
                                            </Text>
                                            <Text style={[styles.cell, styles.nameColumn, { color: theme.text }]} numberOfLines={1}>
                                                {item.EmpNameC}
                                            </Text>
                                            <Text style={[styles.cell, styles.codeColumn, { color: theme.placeholder }]}>
                                                {item.EmpCodeC}
                                            </Text>
                                            <View style={[styles.cell, styles.modeColumn]}>
                                                <View style={[styles.modeBadge, { backgroundColor: modeColor + '20' }]}>
                                                    <Text style={[styles.modeText, { color: modeColor }]}>{modeText}</Text>
                                                </View>
                                            </View>
                                            <Text style={[styles.cell, styles.timeColumn, { color: theme.text }]}>
                                                {item.PunchTimeC || 'N/A'}
                                            </Text>
                                            <Text style={[styles.cell, styles.shiftColumn, { color: theme.text }]}>
                                                {item.ShiftCodeC || 'N/A'}
                                            </Text>
                                            <Text style={[styles.cell, styles.projectColumn, { color: theme.text }]} numberOfLines={1}>
                                                {item.ProjectNameC || 'N/A'}
                                            </Text>
                                            <Text style={[styles.cell, styles.locationColumn, { color: theme.text }]}>
                                                {item.PunchLocC || 'N/A'}
                                            </Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </ScrollView>
                    )}
                </View>
            </ScrollView>

            {/* Date Pickers */}
            {showFromPicker && (
                <DateTimePicker
                    value={fromDate}
                    mode="date"
                    display="default"
                    onChange={onChangeFrom}
                />
            )}
            {showToPicker && (
                <DateTimePicker
                    value={toDate}
                    mode="date"
                    display="default"
                    onChange={onChangeTo}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContainer: {
        flex: 1,
        marginTop: HEADER_HEIGHT,
    },
    scrollContent: {
        flexGrow: 1,
    },
    datePickerSection: {
        paddingHorizontal: 16,
        paddingVertical: 15,
    },
    dateCard: {
        flexDirection: 'row',
        borderRadius: 12,
        padding: 4,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
    },
    dateInput: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    dateLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dateValue: {
        fontSize: 14,
        fontWeight: '700',
    },
    dateDivider: {
        width: 1,
        height: '60%',
    },
    tableContainer: {
        flex: 1,
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    horizontalScroll: {
        flex: 1,
    },
    table: {
        borderWidth: 1,
        borderRadius: 8,
        overflow: 'hidden',
    },
    tableHeader: {
        flexDirection: 'row',
        borderBottomWidth: 2,
        paddingVertical: 12,
        paddingHorizontal: 8,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        paddingVertical: 10,
        paddingHorizontal: 8,
    },
    headerCell: {
        fontSize: 13,
        fontWeight: '700',
        textAlign: 'center',
        paddingHorizontal: 8,
    },
    cell: {
        fontSize: 12,
        fontWeight: '500',
        textAlign: 'center',
        paddingHorizontal: 8,
        justifyContent: 'center',
    },
    // Column widths
    dateColumn: {
        width: 100,
    },
    nameColumn: {
        width: 140,
    },
    codeColumn: {
        width: 80,
    },
    modeColumn: {
        width: 70,
        alignItems: 'center',
    },
    timeColumn: {
        width: 80,
    },
    shiftColumn: {
        width: 80,
    },
    projectColumn: {
        width: 140,
    },
    locationColumn: {
        width: 200,
    },
    modeBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modeText: {
        fontSize: 11,
        fontWeight: '700',
    },
    emptyState: {
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: 40,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    emptySubtext: {
        marginTop: 8,
        fontSize: 14,
        textAlign: 'center',
    },
});
