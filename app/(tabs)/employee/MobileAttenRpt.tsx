import DatePicker from '@/components/DatePicker';
import Header from '@/components/Header';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { useProtectedBack } from '@/hooks/useProtectedBack';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { API_ENDPOINTS } from '../../../constants/api';

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

const formatDateForApi = (date: Date) => {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${m}/${d}/${y}`;
};

const formatDateForDisplay = (date: Date) =>
    date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });

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

    React.useEffect(()=>{
        const date = new Date(fromDate);
        date.setDate(date.getDate() + 30);
        setToDate(date);
    },[fromDate]);

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
            const payload = {
                TokenC: user.TokenC,
                FromDate: formatDateForApi(safeFromDateForApi(fromDate)),
                ToDate: formatDateForApi(toDate),
                Type: 0,
            };

            const res = await axios.post(
                `${API_ENDPOINTS.CompanyUrl}${API_ENDPOINTS.ATTENDANCE_REPORT}`,
                payload
            );

            if (res.data?.Status === 'success' && Array.isArray(res.data.data)) {
                const filteredData = res.data.data.filter((record: AttendanceRecord) =>
                    isRecordInDateRange(record.DateC, fromDate, toDate)
                );
                setAttendance(filteredData);
            } else {
                Alert.alert('Info', res.data?.Error || 'No attendance records found.');
            }
        } catch (err: any) {
            console.error('Attendance API error:', err);
            Alert.alert('Error', 'Failed to fetch attendance.');
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item, index }: { item: AttendanceRecord, index: number }) => {
        const dateObj = parseDateFromApi(item.DateC);
        const isCheckIn = item.ModeN === 0;

        return (
            <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.inputBorder }]}>
                {/* Card Header: Employee Info & Mode Badge */}
                <View style={styles.cardHeader}>
                    <View style={styles.empInfo}>
                        <View style={[styles.avatar, { backgroundColor: theme.primary + '10' }]}>
                            <Text style={[styles.avatarText, { color: theme.primary }]}>
                                {item.EmpNameC.charAt(0)}
                            </Text>
                        </View>
                        <View>
                            <Text style={[styles.empName, { color: theme.text }]} numberOfLines={1}>
                                {item.EmpNameC}
                            </Text>
                            <Text style={[styles.empCode, { color: theme.textLight }]}>
                                ID: {item.EmpCodeC}
                            </Text>
                        </View>
                    </View>
                    <View style={[styles.modeBadge, { backgroundColor: isCheckIn ? '#E8F5E9' : '#FFF3E0' }]}>
                        <Ionicons
                            name={isCheckIn ? 'log-in' : 'log-out'}
                            size={12}
                            color={isCheckIn ? '#2E7D32' : '#EF6C00'}
                        />
                        <Text style={[styles.modeText, { color: isCheckIn ? '#2E7D32' : '#EF6C00' }]}>
                            {isCheckIn ? 'IN' : 'OUT'}
                        </Text>
                    </View>
                </View>

                {/* Card Body: Time, Date, Shift */}
                <View style={styles.cardBody}>
                    <View style={styles.mainInfoRow}>
                        <View style={styles.mainInfoItem}>
                            <Ionicons name="time-outline" size={16} color={theme.primary} />
                            <Text style={[styles.mainInfoValue, { color: theme.text }]}>
                                {item.PunchTimeC}
                            </Text>
                        </View>
                        <View style={styles.verticalDivider} />
                        <View style={styles.mainInfoItem}>
                            <Ionicons name="calendar-outline" size={16} color={theme.primary} />
                            <Text style={[styles.mainInfoValue, { color: theme.text }]}>
                                {dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                            </Text>
                        </View>
                        <View style={styles.verticalDivider} />
                        <View style={styles.mainInfoItem}>
                            <Ionicons name="business-outline" size={16} color={theme.primary} />
                            <Text style={[styles.mainInfoValue, { color: theme.text }]} numberOfLines={1}>
                                {item.ShiftCodeC?.split(' ')[0] || 'N/A'}
                            </Text>
                        </View>
                    </View>

                    <View style={[styles.horizontalDivider, { backgroundColor: theme.inputBorder + '50' }]} />

                    {/* Project & Location */}
                    <View style={styles.detailSection}>
                        <View style={styles.detailItem}>
                            <Text style={[styles.detailLabel, { color: theme.textLight }]}>Project</Text>
                            <Text style={[styles.detailValue, { color: theme.text }]} numberOfLines={1}>
                                {item.ProjectNameC || 'General'}
                            </Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={[styles.detailLabel, { color: theme.textLight }]}>Location</Text>
                            <Text style={[styles.detailValue, { color: theme.text }]} numberOfLines={1}>
                                {item.PunchLocC || 'N/A'}
                            </Text>
                        </View>
                    </View>

                    {/* Remark if exists */}
                    {item.RemarkC ? (
                        <View style={[styles.remarkContainer, { backgroundColor: theme.background + '80' }]}>
                            <Ionicons name="chatbubble-ellipses-outline" size={14} color={theme.textLight} />
                            <Text style={[styles.remarkText, { color: theme.textLight }]} numberOfLines={2}>
                                {item.RemarkC}
                            </Text>
                        </View>
                    ) : null}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
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
                <FlatList
                    data={attendance}
                    keyExtractor={(i, idx) => `${i.EmpIdN}-${idx}`}
                    renderItem={renderItem}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <View style={[styles.emptyIconWrapper, { backgroundColor: theme.cardBackground, shadowColor: theme.primary }]}>
                                <Ionicons name="calendar-outline" size={50} color={theme.primary + '80'} />
                            </View>
                            <Text style={[styles.emptyTitle, { color: theme.text }]}>No Attendance History</Text>
                            <Text style={[styles.emptySubtitle, { color: theme.textLight }]}>
                                Adjust the date range above to view your attendance records.
                            </Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
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
    card: {
        backgroundColor: '#FFF',
        borderRadius: 4,
        marginBottom: 16,
        borderWidth: 1,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        paddingBottom: 12,
    },
    empInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    empName: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 2,
    },
    empCode: {
        fontSize: 11,
        fontWeight: '600',
    },
    modeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
    },
    modeText: {
        fontSize: 11,
        fontWeight: '800',
    },
    cardBody: {
        padding: 16,
        paddingTop: 0,
    },
    mainInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F8F9FA',
        padding: 12,
        borderRadius: 14,
        marginBottom: 16,
    },
    mainInfoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 4,
        gap: 6,
        flex: 1,
        justifyContent: 'center',
    },
    mainInfoValue: {
        fontSize: 13,
        fontWeight: '700',
    },
    verticalDivider: {
        width: 1,
        height: 16,
        backgroundColor: '#E0E0E0',
    },
    horizontalDivider: {
        height: 1,
        marginBottom: 16,
    },
    detailSection: {
        flexDirection: 'row',
        gap: 20,
        marginBottom: 12,
    },
    detailItem: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    detailValue: {
        fontSize: 13,
        fontWeight: '600',
    },
    projectContainer: {
        backgroundColor: '#F0F8FF',
        padding: 12,
        borderRadius: 4,
    },
    projectValue: {
        fontSize: 14,
        color: '#2C5282',
        fontWeight: '600',
        lineHeight: 20,
    },
    departmentContainer: {
        backgroundColor: '#F0FFF4',
        padding: 12,
        borderRadius: 4,
    },
    departmentValue: {
        fontSize: 14,
        color: '#22543D',
        fontWeight: '600',
    },
    locationContainer: {
        backgroundColor: '#F9FAFF',
        padding: 14,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#F0F3FF',
    },
    locationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
    },
    locationTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#555',
    },
    locationText: {
        fontSize: 14,
        color: '#444',
        lineHeight: 20,
        paddingLeft: 6,
    },
    remarkContainer: {
        backgroundColor: '#FFF8E1',
        padding: 14,
        borderRadius: 4,
        borderLeftWidth: 4,
        borderLeftColor: '#FFC107',
    },
    remarkHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
    },
    remarkLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FF9800',
    },
    remarkText: {
        fontSize: 12,
        fontStyle: 'italic',
        flex: 1,
    },
    extraItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#F5F5F5',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 4,
    },
    extraText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
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
