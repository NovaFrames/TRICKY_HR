import DatePicker from '@/components/DatePicker';
import DynamicTable, { ColumnDef } from '@/components/DynamicTable';
import Header from '@/components/Header';
import { formatDateForApi, formatDisplayDate } from '@/constants/timeFormat';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { useProtectedBack } from '@/hooks/useProtectedBack';
import ApiService from '@/services/ApiService';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    StyleSheet,
    Text,
    View
} from 'react-native';

/* ---------------- TYPES ---------------- */

interface AttendanceRecord {
    EmpIdN: number;
    EmpCodeC: string;
    EmpNameC: string;
    ShiftCodeC: string;
    DeptNameC: string | null;
    ProjectCodeC: string | null;
    ProjectNameC: string;
    AddressC: string;
    PunchLocC: string;
    ModeN: number;
    DateC: string; // DDMMYYYYHHmmss
    PunchTimeC: string;
    RemarkC: string;
}

/* ---------------- HELPERS ---------------- */
const parseDateFromApi = (dateC: string) => {
    try {
        if (!dateC || dateC.length < 8) return new Date();
        const day = parseInt(dateC.slice(0, 2));
        const month = parseInt(dateC.slice(2, 4)) - 1;
        const year = parseInt(dateC.slice(4, 8));
        const hour = dateC.length >= 10 ? parseInt(dateC.slice(8, 10)) : 0;
        const min = dateC.length >= 12 ? parseInt(dateC.slice(10, 12)) : 0;
        const sec = dateC.length >= 14 ? parseInt(dateC.slice(12, 14)) : 0;
        return new Date(year, month, day, hour, min, sec);
    } catch (e) {
        return new Date();
    }
};

const isRecordInDateRange = (recordDateC: string, from: Date, to: Date) => {
    const recordDate = parseDateFromApi(recordDateC);
    recordDate.setHours(0, 0, 0, 0);
    const startDate = new Date(from);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(to);
    endDate.setHours(23, 59, 59, 999);
    return recordDate >= startDate && recordDate <= endDate;
};

const safeFromDateForApi = (from: Date) => {
    const adjusted = new Date(from);
    adjusted.setDate(adjusted.getDate() - 1);
    return adjusted;
};

/* ---------------- COMPONENT ---------------- */

export default function MobileAttenRpt() {
    const { theme } = useTheme();
    const { user } = useUser();

    useProtectedBack({ home: '/home' });

    const [fromDate, setFromDate] = useState(new Date());
    const [toDate, setToDate] = useState(new Date());
    const [loading, setLoading] = useState(false);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

    React.useEffect(() => {
        const date = new Date(fromDate);
        date.setDate(date.getDate() + 30);
        setToDate(date);
    }, [fromDate]);

    // Fetch report on mount
    React.useEffect(() => {
        if (user?.TokenC) {
            fetchReport();
        }
    }, [user?.TokenC, toDate]);

    const fetchReport = async () => {
        if (!user?.TokenC) {
            Alert.alert('Error', 'Session expired. Please login again.');
            return;
        }

        if (fromDate > toDate) {
            Alert.alert('Invalid Range', 'From date cannot be after To date.');
            return;
        }

        setLoading(true);
        setAttendance([]);

        try {
            const result = await ApiService.getMobileAttendanceReport(
                user.TokenC,
                formatDateForApi(safeFromDateForApi(fromDate)),
                formatDateForApi(toDate),
                0
            );

            if (result.success && Array.isArray(result.data)) {
                const filteredData = result.data.filter((record: AttendanceRecord) =>
                    isRecordInDateRange(record.DateC, fromDate, toDate)
                );
                setAttendance(filteredData);
            } else {
                Alert.alert('Info', result.error || 'No attendance records found.');
            }
        } catch (err: any) {
            console.error('Attendance API error:', err);
            Alert.alert('Error', 'Failed to fetch attendance.');
        } finally {
            setLoading(false);
        }
    };

    const tableWidth = Math.max(1100, Dimensions.get('window').width);

    const columns: ColumnDef[] = [
        {
            key: 'ShiftCodeC',
            label: 'Shift',
            flex: 0.9,
            align: 'center',
            formatter: v => (typeof v === 'string' ? v : 'N/A'),
        },
        {
            key: 'DateC',
            label: 'Date',
            flex: 0.7,
            align: 'center',
            formatter: v => formatDisplayDate(parseDateFromApi(String(v))),
        },
        { key: 'PunchTimeC', label: 'Time', flex: 0.5, align: 'center' },
        {
            key: 'ModeN',
            label: 'Mode',
            flex: 0.4,
            align: 'center',
            formatter: v => (Number(v) === 0 ? 'IN' : 'OUT'),
        },
        {
            key: 'ProjectNameC',
            label: 'Project',
            flex: 0.9,
            align: 'flex-start',
            formatter: v => (v ? String(v) : 'General'),
        },
        {
            key: 'PunchLocC',
            label: 'Location',
            flex: 1,
            align: 'flex-start',
            formatter: v => (v ? String(v) : 'N/A'),
        },
        {
            key: 'RemarkC',
            label: 'Remark',
            flex: 1.2,
            align: 'flex-start',
            formatter: v => (v ? String(v) : ''),
        },
    ];

    return (
        <View style={{ flex: 1 }}>
            <Header title="Attendance Report" />

            {/* Modern Integrated Filter */}
            <View style={[styles.filterWrapper, { backgroundColor: theme.cardBackground }]}>
                <View style={styles.filterHeader}>
                    <Text style={[styles.filterTitle, { color: theme.text }]}>Filter History</Text>
                    <Ionicons name="options-outline" size={20} color={theme.primary} />
                </View>

                <View style={styles.filterRow}>
                    <DatePicker fromDate={fromDate} toDate={toDate} onFromChange={setFromDate} />
                </View>

                {/* <TouchableOpacity onPress={fetchReport} disabled={loading}>
                    <LinearGradient
                        colors={[theme.primary, theme.primary + 'DD']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.searchBtn}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                            <>
                                <Ionicons name="search" size={18} color="#FFF" />
                                <Text style={styles.searchBtnText}>Generate Report</Text>
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity> */}
            </View>

            {/* DatePicker handles From selection internally; To is auto-calculated */}

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={[styles.loadingText, { color: theme.textLight }]}>Analyzing records...</Text>
                </View>
            ) : (
                <View style={styles.tableContainer}>
                    <DynamicTable
                        data={attendance}
                        columns={columns}
                        tableWidth={tableWidth}
                        theme={theme}
                    />
                    {!attendance.length && (
                        <View style={styles.emptyContainer}>
                            <View style={[styles.emptyIconWrapper, { backgroundColor: theme.cardBackground, shadowColor: theme.primary }]}>
                                <Ionicons name="calendar-outline" size={50} color={theme.primary + '80'} />
                            </View>
                            <Text style={[styles.emptyTitle, { color: theme.text }]}>No Attendance History</Text>
                            <Text style={[styles.emptySubtitle, { color: theme.textLight }]}>
                                Adjust the date range above to view your attendance records.
                            </Text>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },

    // Filter Styles
    filterWrapper: {
        margin: 16,
        borderRadius: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
    },
    filterHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    filterTitle: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    filterRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateInput: {
        flex: 1,
        padding: 12,
        borderRadius: 14,
        borderWidth: 1,
    },
    inputLabel: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FF',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 4,
        borderWidth: 1.5,
        borderColor: '#E8ECFF',
        gap: 10,
    },
    dateButtonText: {
        fontSize: 15,
        color: '#333',
        fontWeight: '600',
    },
    dateSeparator: {
        marginHorizontal: 12,
        padding: 8,
        backgroundColor: '#F5F5F5',
        borderRadius: 4,
    },
    searchButton: {
        borderRadius: 4,
        overflow: 'hidden',
    },
    searchBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        gap: 8,
    },
    searchBtnText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    resultsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    resultsTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    resultsCount: {
        fontSize: 14,
        color: '#666',
        fontWeight: '600',
        backgroundColor: '#F0F0F0',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 4,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 40,
    },
    tableContainer: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 60,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 14,
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 80,
        paddingHorizontal: 40,
    },
    emptyIconWrapper: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        elevation: 4,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 22,
    },
});
