import Header from '@/components/Header';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { API_ENDPOINTS } from '../../../constants/api';
import { useUser } from '../../../context/UserContext';

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
    DateD: string;
    DateC: string;
    PunchTimeC: string;
    RemarkC: string;
    Group1C: string | null;
    InOutC: string | null;
}

export default function MobileAttenRpt() {
    const { user } = useUser();
    const [fromDate, setFromDate] = useState(new Date());
    const [toDate, setToDate] = useState(new Date());
    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showToPicker, setShowToPicker] = useState(false);
    const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(false);

    // Format date for API (dd/MM/yyyy)
    const formatDateForApi = (date: Date) => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    // Format date for Display (DD MMM YYYY)
    const formatDateForDisplay = (date: Date) => {
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    // Parse DateC from the API (format: YYMMDDHHmmss)
    const parseDateFromApi = (dateC: string) => {
        try {
            if (!dateC || dateC.length < 6) return new Date();

            // Extract date parts from the string
            // Assuming format: YYMMDDHHmmss
            const year = parseInt(dateC.substring(0, 2)) + 2000; // Assuming 2000s
            const month = parseInt(dateC.substring(2, 4)) - 1; // JS months are 0-indexed
            const day = parseInt(dateC.substring(4, 6));
            const hours = dateC.length >= 8 ? parseInt(dateC.substring(6, 8)) : 0;
            const minutes = dateC.length >= 10 ? parseInt(dateC.substring(8, 10)) : 0;
            const seconds = dateC.length >= 12 ? parseInt(dateC.substring(10, 12)) : 0;

            return new Date(year, month, day, hours, minutes, seconds);
        } catch (error) {
            console.error('Error parsing date:', error);
            return new Date();
        }
    };

    // Format the date from API for display
    const formatApiDateForDisplay = (dateC: string) => {
        const date = parseDateFromApi(dateC);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    // Format the time from API
    const formatApiTimeForDisplay = (dateC: string, punchTimeC: string) => {
        // If punchTimeC has time, use it, otherwise extract from dateC
        if (punchTimeC && punchTimeC.includes(':')) {
            return punchTimeC;
        }

        try {
            const date = parseDateFromApi(dateC);
            return date.toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
            });
        } catch (error) {
            return 'N/A';
        }
    };

    // Check if record date is within selected range
    const isRecordInDateRange = (recordDateC: string, from: Date, to: Date) => {
        const recordDate = parseDateFromApi(recordDateC);
        recordDate.setHours(0, 0, 0, 0);

        const startDate = new Date(from);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(to);
        endDate.setHours(23, 59, 59, 999);

        return recordDate >= startDate && recordDate <= endDate;
    };

    const fetchAttendanceReport = async () => {
        if (!user?.TokenC) {
            Alert.alert('Error', 'User token not found. Please login again.');
            return;
        }

        // Validate date range
        if (fromDate > toDate) {
            Alert.alert('Invalid Date Range', 'From date cannot be greater than To date.');
            return;
        }

        setLoading(true);
        setAttendanceData([]);

        try {
            const payload = {
                TokenC: user.TokenC,
                FromDate: formatDateForApi(fromDate),
                ToDate: formatDateForApi(toDate),
                Type: 0,
            };

            console.log('API Payload:', payload);
            console.log('API URL:', `${API_ENDPOINTS.CompanyUrl}${API_ENDPOINTS.ATTENDANCE_REPORT}`);

            const response = await axios.post(
                `${API_ENDPOINTS.CompanyUrl}${API_ENDPOINTS.ATTENDANCE_REPORT}`,
                payload
            );

            console.log('API Response Status:', response.data.Status);
            console.log('API Response Data:', JSON.stringify(response.data, null, 2));

            if (response.data.Status === 'success' && Array.isArray(response.data.data)) {
                // Filter data based on actual date range (server might return extra data)
                const filteredData = response.data.data.filter((record: AttendanceRecord) =>
                    isRecordInDateRange(record.DateC, fromDate, toDate)
                );

                setAttendanceData(filteredData);

                if (filteredData.length === 0) {
                    Alert.alert(
                        'No Records Found',
                        'No attendance records found for the selected date range.',
                        [{ text: 'OK' }]
                    );
                }
            } else {
                Alert.alert(
                    'Info',
                    response.data.Error || 'No attendance records found.',
                    [{ text: 'OK' }]
                );
            }
        } catch (error: any) {
            console.error('API Error Details:', error);
            Alert.alert(
                'Error',
                error.message || 'Failed to fetch attendance report. Please try again.',
                [{ text: 'OK' }]
            );
        } finally {
            setLoading(false);
        }
    };

    const onFromDateChange = (event: any, selectedDate?: Date) => {
        setShowFromPicker(Platform.OS === 'ios');
        if (selectedDate) {
            setFromDate(selectedDate);
            // If fromDate is after toDate, adjust toDate
            if (selectedDate > toDate) {
                setToDate(selectedDate);
            }
        }
    };

    const onToDateChange = (event: any, selectedDate?: Date) => {
        setShowToPicker(Platform.OS === 'ios');
        if (selectedDate) {
            // Ensure toDate is not before fromDate
            if (selectedDate < fromDate) {
                Alert.alert('Invalid Date', 'To date cannot be earlier than From date.');
                return;
            }
            setToDate(selectedDate);
        }
    };

    const renderItem = ({ item }: { item: AttendanceRecord }) => {
        const displayDate = formatApiDateForDisplay(item.DateC);
        const displayTime = formatApiTimeForDisplay(item.DateC, item.PunchTimeC);

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={styles.empInfoContainer}>
                        <Text style={styles.empName}>{item.EmpNameC}</Text>
                        <Text style={styles.empCode}>{item.EmpCodeC}</Text>
                        <View style={styles.dateContainer}>
                            <Ionicons name="calendar-outline" size={12} color="#666" />
                            <Text style={styles.dateText}>{displayDate}</Text>
                        </View>
                    </View>
                    <View style={[styles.timeBadge, {
                        backgroundColor: item.ModeN === 0 ? '#E8F5E9' : '#FFF3E0',
                        borderColor: item.ModeN === 0 ? '#2E7D32' : '#EF6C00'
                    }]}>
                        <Ionicons
                            name={item.ModeN === 0 ? "enter-outline" : "exit-outline"}
                            size={14}
                            color={item.ModeN === 0 ? '#2E7D32' : '#EF6C00'}
                        />
                        <Text style={[styles.timeText, { color: item.ModeN === 0 ? '#2E7D32' : '#EF6C00' }]}>
                            {displayTime}
                        </Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.cardBody}>
                    <View style={styles.infoGrid}>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Shift</Text>
                            <Text style={styles.infoValue}>{item.ShiftCodeC || 'N/A'}</Text>
                        </View>

                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Mode</Text>
                            <Text style={[styles.infoValue, {
                                color: item.ModeN === 0 ? '#2E7D32' : '#EF6C00',
                                fontWeight: '700'
                            }]}>
                                {item.ModeN === 0 ? 'IN' : 'OUT'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.projectContainer}>
                        <Text style={styles.infoLabel}>Project</Text>
                        <Text style={styles.projectValue}>
                            {item.ProjectNameC || 'N/A'}
                            {item.ProjectCodeC && ` (${item.ProjectCodeC})`}
                        </Text>
                    </View>

                    {item.DeptNameC && (
                        <View style={styles.departmentContainer}>
                            <Text style={styles.infoLabel}>Department</Text>
                            <Text style={styles.departmentValue}>{item.DeptNameC}</Text>
                        </View>
                    )}

                    <View style={styles.locationContainer}>
                        <View style={styles.locationHeader}>
                            <Ionicons name="location" size={14} color="#4A90E2" />
                            <Text style={styles.locationTitle}>Punch Location</Text>
                        </View>
                        <Text style={styles.locationText}>{item.PunchLocC || 'N/A'}</Text>
                    </View>

                    <View style={styles.locationContainer}>
                        <View style={styles.locationHeader}>
                            <Ionicons name="business" size={14} color="#666" />
                            <Text style={styles.locationTitle}>Address</Text>
                        </View>
                        <Text style={styles.locationText}>{item.AddressC || 'N/A'}</Text>
                    </View>

                    {item.RemarkC && item.RemarkC.trim() !== '' ? (
                        <View style={styles.remarkContainer}>
                            <View style={styles.remarkHeader}>
                                <Ionicons name="document-text" size={14} color="#888" />
                                <Text style={styles.remarkLabel}>Remark</Text>
                            </View>
                            <Text style={styles.remarkText}>{item.RemarkC}</Text>
                        </View>
                    ) : null}

                    {(item.Group1C || item.InOutC) && (
                        <View style={styles.extraInfo}>
                            {item.Group1C && (
                                <View style={styles.extraItem}>
                                    <Ionicons name="people" size={12} color="#999" />
                                    <Text style={styles.extraText}>{item.Group1C}</Text>
                                </View>
                            )}
                            {item.InOutC && (
                                <View style={styles.extraItem}>
                                    <Ionicons name="swap-horizontal" size={12} color="#999" />
                                    <Text style={styles.extraText}>{item.InOutC}</Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>
            </View>
        );
    };

    const getTotalRecordsText = () => {
        if (attendanceData.length === 0) return '';
        return `${attendanceData.length} record${attendanceData.length > 1 ? 's' : ''} found`;
    };

    return (
        <SafeAreaView style={styles.container}>
            <Header title="Attendance Report" />

            <View style={styles.filterContainer}>
                <View style={styles.dateRow}>
                    <View style={styles.dateInputContainer}>
                        <Text style={styles.dateLabel}>From Date</Text>
                        <TouchableOpacity
                            style={styles.dateButton}
                            onPress={() => setShowFromPicker(true)}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="calendar" size={18} color="#4A90E2" />
                            <Text style={styles.dateButtonText}>{formatDateForDisplay(fromDate)}</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.dateSeparator}>
                        <Ionicons name="arrow-forward" size={16} color="#888" />
                    </View>

                    <View style={styles.dateInputContainer}>
                        <Text style={styles.dateLabel}>To Date</Text>
                        <TouchableOpacity
                            style={styles.dateButton}
                            onPress={() => setShowToPicker(true)}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="calendar" size={18} color="#4A90E2" />
                            <Text style={styles.dateButtonText}>{formatDateForDisplay(toDate)}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.searchButton}
                    onPress={fetchAttendanceReport}
                    activeOpacity={0.8}
                    disabled={loading}
                >
                    <LinearGradient
                        colors={fromDate.toDateString() === toDate.toDateString() ? ['#6C63FF', '#5A52D3'] : ['#4A90E2', '#357ABD']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.gradientButton}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                            <>
                                <Ionicons name="search" size={20} color="#FFF" />
                                <Text style={styles.searchButtonText}>
                                    {fromDate.toDateString() === toDate.toDateString() ? 'Search Today' : 'Search Range'}
                                </Text>
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {showFromPicker && (
                <DateTimePicker
                    value={fromDate}
                    mode="date"
                    display="default"
                    onChange={onFromDateChange}
                    maximumDate={new Date()}
                />
            )}

            {showToPicker && (
                <DateTimePicker
                    value={toDate}
                    mode="date"
                    display="default"
                    onChange={onToDateChange}
                    maximumDate={new Date()}
                    minimumDate={fromDate}
                />
            )}

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4A90E2" />
                    <Text style={styles.loadingText}>Fetching attendance records...</Text>
                </View>
            ) : (
                <FlatList
                    data={attendanceData}
                    renderItem={renderItem}
                    keyExtractor={(item, index) => `${item.EmpIdN}-${item.DateC}-${index}`}
                    contentContainerStyle={styles.listContent}
                    ListHeaderComponent={
                        attendanceData.length > 0 ? (
                            <View style={styles.resultsHeader}>
                                <Text style={styles.resultsTitle}>Attendance Records</Text>
                                <Text style={styles.resultsCount}>{getTotalRecordsText()}</Text>
                            </View>
                        ) : null
                    }
                    ListEmptyComponent={
                        !loading && (
                            <View style={styles.emptyContainer}>
                                <View style={styles.emptyIconContainer}>
                                    <Ionicons name="calendar-outline" size={80} color="#E0E0E0" />
                                </View>
                                <Text style={styles.emptyText}>No attendance records</Text>
                                <Text style={styles.emptySubText}>
                                    Select a date range and tap 'Search Records' to view attendance history
                                </Text>
                            </View>
                        )
                    }
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    filterContainer: {
        backgroundColor: '#FFF',
        margin: 16,
        padding: 20,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    dateInputContainer: {
        flex: 1,
    },
    dateLabel: {
        fontSize: 12,
        color: '#666',
        fontWeight: '600',
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FF',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#E8ECFF',
        gap: 10,
    },
    dateButtonText: {
        fontSize: 15,
        color: '#333',
        fontWeight: '600',
        flex: 1,
    },
    dateSeparator: {
        marginHorizontal: 12,
        padding: 8,
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
    },
    searchButton: {
        borderRadius: 14,
        overflow: 'hidden',
        shadowColor: '#4A90E2',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
    },
    gradientButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 10,
    },
    searchButtonText: {
        color: '#FFF',
        fontSize: 16,
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
        borderRadius: 12,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 24,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        marginBottom: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: 20,
        paddingBottom: 16,
    },
    empInfoContainer: {
        flex: 1,
        marginRight: 12,
    },
    empName: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 2,
    },
    empCode: {
        fontSize: 13,
        color: '#666',
        fontWeight: '500',
        marginBottom: 8,
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dateText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#666',
    },
    timeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
        minWidth: 80,
        justifyContent: 'center',
        borderWidth: 1,
    },
    timeText: {
        fontSize: 13,
        fontWeight: '700',
    },
    divider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginHorizontal: 20,
    },
    cardBody: {
        padding: 20,
        paddingTop: 16,
        gap: 16,
    },
    infoGrid: {
        flexDirection: 'row',
        gap: 16,
    },
    infoItem: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 11,
        color: '#888',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 14,
        color: '#333',
        fontWeight: '600',
    },
    projectContainer: {
        backgroundColor: '#F0F8FF',
        padding: 12,
        borderRadius: 8,
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
        borderRadius: 8,
    },
    departmentValue: {
        fontSize: 14,
        color: '#22543D',
        fontWeight: '600',
    },
    locationContainer: {
        backgroundColor: '#F9FAFF',
        padding: 14,
        borderRadius: 12,
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
        borderRadius: 12,
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
        fontSize: 14,
        color: '#5D4037',
        lineHeight: 20,
        fontStyle: 'italic',
    },
    extraInfo: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 4,
    },
    extraItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#F5F5F5',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
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
        fontSize: 15,
        color: '#666',
        fontWeight: '500',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 80,
        paddingHorizontal: 20,
    },
    emptyIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#F9F9F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#B0B0B0',
        textAlign: 'center',
        marginBottom: 8,
    },
    emptySubText: {
        fontSize: 15,
        color: '#C0C0C0',
        textAlign: 'center',
        lineHeight: 22,
    },
});