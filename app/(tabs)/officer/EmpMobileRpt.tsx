import { useProtectedBack } from '@/hooks/useProtectedBack';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
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

    const renderHeader = () => (
        <View style={styles.headerWrapper}>
            <View style={styles.headerContainer}>
                <Stack.Screen options={{ headerShown: false }} />
                <View style={styles.navBar}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                        <Ionicons name="arrow-back" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={[styles.navTitle, { color: theme.text }]}>Mobile Attendance Report</Text>
                    <View style={styles.iconButton} />
                </View>
            </View>

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

            {/* Stats Card */}
            <View style={styles.statsSection}>
                <View style={[styles.statsCard, { backgroundColor: theme.cardBackground, borderColor: theme.inputBorder }]}>
                    <View style={styles.statItem}>
                        <Ionicons name="people-outline" size={24} color={theme.primary} />
                        <Text style={[styles.statValue, { color: theme.text }]}>{attendanceData.length}</Text>
                        <Text style={[styles.statLabel, { color: theme.placeholder }]}>Total Records</Text>
                    </View>
                    <View style={[styles.statDivider, { backgroundColor: theme.inputBorder }]} />
                    <View style={styles.statItem}>
                        <Ionicons name="log-in-outline" size={24} color="#4CAF50" />
                        <Text style={[styles.statValue, { color: theme.text }]}>
                            {attendanceData.filter(item => item.ModeN === 0).length}
                        </Text>
                        <Text style={[styles.statLabel, { color: theme.placeholder }]}>Check In</Text>
                    </View>
                    <View style={[styles.statDivider, { backgroundColor: theme.inputBorder }]} />
                    <View style={styles.statItem}>
                        <Ionicons name="log-out-outline" size={24} color="#F44336" />
                        <Text style={[styles.statValue, { color: theme.text }]}>
                            {attendanceData.filter(item => item.ModeN === 1).length}
                        </Text>
                        <Text style={[styles.statLabel, { color: theme.placeholder }]}>Check Out</Text>
                    </View>
                </View>
            </View>
        </View>
    );

    const renderAttendanceItem = ({ item, index }: { item: AttendanceRecord; index: number }) => {
        const isCheckIn = item.ModeN === 0;
        const modeColor = isCheckIn ? '#4CAF50' : '#F44336';
        const modeIcon = isCheckIn ? 'log-in' : 'log-out';
        const modeText = isCheckIn ? 'IN' : 'OUT';

        return (
            <View
                style={[
                    styles.attendanceCard,
                    {
                        backgroundColor: index % 2 === 0 ? theme.cardBackground : theme.background,
                        borderColor: theme.inputBorder,
                    },
                ]}
            >
                {/* Header Row */}
                <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                        <View style={[styles.modeBadge, { backgroundColor: modeColor + '20' }]}>
                            <Ionicons name={modeIcon} size={16} color={modeColor} />
                            <Text style={[styles.modeText, { color: modeColor }]}>{modeText}</Text>
                        </View>
                        <Text style={[styles.employeeName, { color: theme.text }]}>{item.EmpNameC}</Text>
                    </View>
                    <Text style={[styles.employeeCode, { color: theme.placeholder }]}>{item.EmpCodeC}</Text>
                </View>

                {/* Info Grid */}
                <View style={styles.infoGrid}>
                    <View style={styles.infoRow}>
                        <View style={styles.infoItem}>
                            <Ionicons name="calendar-outline" size={14} color={theme.placeholder} />
                            <Text style={[styles.infoLabel, { color: theme.placeholder }]}>Date</Text>
                        </View>
                        <Text style={[styles.infoValue, { color: theme.text }]}>{formatDisplayDate(item.DateD)}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <View style={styles.infoItem}>
                            <Ionicons name="time-outline" size={14} color={theme.placeholder} />
                            <Text style={[styles.infoLabel, { color: theme.placeholder }]}>Time</Text>
                        </View>
                        <Text style={[styles.infoValue, { color: theme.text }]}>{item.PunchTimeC || 'N/A'}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <View style={styles.infoItem}>
                            <Ionicons name="briefcase-outline" size={14} color={theme.placeholder} />
                            <Text style={[styles.infoLabel, { color: theme.placeholder }]}>Project</Text>
                        </View>
                        <Text style={[styles.infoValue, { color: theme.text }]} numberOfLines={1}>
                            {item.ProjectNameC || 'N/A'}
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <View style={styles.infoItem}>
                            <Ionicons name="moon-outline" size={14} color={theme.placeholder} />
                            <Text style={[styles.infoLabel, { color: theme.placeholder }]}>Shift</Text>
                        </View>
                        <Text style={[styles.infoValue, { color: theme.text }]}>{item.ShiftCodeC || 'N/A'}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <View style={styles.infoItem}>
                            <Ionicons name="location-outline" size={14} color={theme.placeholder} />
                            <Text style={[styles.infoLabel, { color: theme.placeholder }]}>Location</Text>
                        </View>
                        <Text style={[styles.infoValue, { color: theme.text }]} numberOfLines={1}>
                            {item.PunchLocC || 'N/A'}
                        </Text>
                    </View>

                    {item.RemarkC && item.RemarkC !== '' && (
                        <View style={styles.infoRow}>
                            <View style={styles.infoItem}>
                                <Ionicons name="document-text-outline" size={14} color={theme.placeholder} />
                                <Text style={[styles.infoLabel, { color: theme.placeholder }]}>Remark</Text>
                            </View>
                            <Text style={[styles.infoValue, { color: theme.text }]} numberOfLines={2}>
                                {item.RemarkC}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <FlatList
                ListHeaderComponent={renderHeader}
                data={attendanceData}
                renderItem={renderAttendanceItem}
                keyExtractor={(item, index) => `${item.EmpCodeC}-${index}`}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[theme.primary]}
                        tintColor={theme.primary}
                    />
                }
                ListEmptyComponent={
                    loading ? (
                        <View style={styles.emptyState}>
                            <ActivityIndicator size="large" color={theme.primary} />
                            <Text style={[styles.emptyText, { color: theme.placeholder }]}>Loading...</Text>
                        </View>
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="document-text-outline" size={64} color={theme.icon} />
                            <Text style={[styles.emptyText, { color: theme.placeholder }]}>No attendance records found</Text>
                            <Text style={[styles.emptySubtext, { color: theme.placeholder }]}>
                                Try adjusting the date range
                            </Text>
                        </View>
                    )
                }
            />

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
    listContent: {
        paddingBottom: 20,
    },
    headerWrapper: {
        backgroundColor: 'transparent',
    },
    headerContainer: {
        paddingTop: 10,
        paddingBottom: 4,
    },
    navBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    navTitle: {
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: -0.3,
    },
    iconButton: {
        padding: 8,
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
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
    statsSection: {
        paddingHorizontal: 16,
        paddingBottom: 10,
    },
    statsCard: {
        flexDirection: 'row',
        borderRadius: 12,
        padding: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderWidth: 1,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
        marginTop: 4,
    },
    statLabel: {
        fontSize: 11,
        fontWeight: '500',
        textAlign: 'center',
    },
    statDivider: {
        width: 1,
        marginHorizontal: 8,
    },
    attendanceCard: {
        marginHorizontal: 16,
        marginVertical: 6,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    cardHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    modeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    modeText: {
        fontSize: 12,
        fontWeight: '700',
    },
    employeeName: {
        fontSize: 15,
        fontWeight: '600',
        flex: 1,
    },
    employeeCode: {
        fontSize: 12,
        fontWeight: '500',
    },
    infoGrid: {
        gap: 10,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1,
    },
    infoLabel: {
        fontSize: 13,
        fontWeight: '500',
    },
    infoValue: {
        fontSize: 13,
        fontWeight: '600',
        flex: 1,
        textAlign: 'right',
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
