import { API_ENDPOINTS } from '@/constants/api';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
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

// Import new components
import AttendanceCard from '@/components/attendance/AttendanceCard';
import AttendanceTabs from '@/components/attendance/AttendanceTabs';
import Header from '@/components/Header';

// Types for Attendance Data
export interface AttendanceShift {
    EmpCodeC: string;
    EmpNameC: string;
    ShiftInN: number;
    ShiftOutN: number;
    ShiftCodeC: string;
    ReaCodeC?: string;
}

export interface AttendanceOther {
    EmpNameC: string;
    EmpCodeC: string;
    ActN: number;
    NRMN: number;
    LateN: number;
    UnderN: number;
    TInN: number;
    TOutN: number;
}

export default function MobileAttenRpt() {
    const { theme } = useTheme();
    const { user } = useUser();
    const [activeTab, setActiveTab] = useState<'SHIFT' | 'OTHERS'>('SHIFT');

    // Date states
    const [fromDate, setFromDate] = useState(new Date());
    const [toDate, setToDate] = useState(new Date());
    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showToPicker, setShowToPicker] = useState(false);

    const [loading, setLoading] = useState(false);
    const [shiftData, setShiftData] = useState<AttendanceShift[]>([]);
    const [othersData, setOthersData] = useState<AttendanceOther[]>([]);

    const loginData = user || {};
    const token = loginData.Token || loginData.TokenC;
    const companyUrl = API_ENDPOINTS.CompanyUrl;

    useEffect(() => {
        fetchAttendance();
    }, []);

    const formatDateForApi = (d: Date) => {
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const year = d.getFullYear();
        return `${month}/${day}/${year}`;
    };

    const formatDateDisplay = (d: Date) => {
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const fetchAttendance = async () => {
        if (!token || !companyUrl) {
            console.log('Missing token or company URL', { token, companyUrl });
            return;
        }

        if (fromDate > toDate) {
            Alert.alert('Invalid Date Range', 'From date cannot be greater than To date.');
            return;
        }

        setLoading(true);
        try {
            const url = `${companyUrl}${API_ENDPOINTS.ATTENDANCE_LIST}`;
            const payload = {
                TokenC: token,
                FDate: formatDateForApi(fromDate),
                TDate: formatDateForApi(toDate)
            };

            console.log('Fetching Attendance Range:', url, payload);

            const response = await axios.post(url, payload);

            if (response.data.Status === 'success') {
                const data = response.data.data || [];
                setShiftData(data);
                setOthersData(data);
            } else {
                setShiftData([]);
                setOthersData([]);
            }
        } catch (error) {
            console.error('Fetch Attendance Error:', error);
            Alert.alert('Error', 'Failed to fetch attendance records. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const onFromDateChange = (event: any, selectedDate?: Date) => {
        setShowFromPicker(Platform.OS === 'ios');
        if (selectedDate) {
            setFromDate(selectedDate);
            if (selectedDate > toDate) {
                setToDate(selectedDate);
            }
        }
    };

    const onToDateChange = (event: any, selectedDate?: Date) => {
        setShowToPicker(Platform.OS === 'ios');
        if (selectedDate) {
            if (selectedDate < fromDate) {
                Alert.alert('Invalid Date', 'To date cannot be earlier than From date.');
                return;
            }
            setToDate(selectedDate);
        }
    };

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconContainer, { backgroundColor: theme.cardBackground }]}>
                <Ionicons name="document-text-outline" size={60} color={theme.textLight} />
            </View>
            <Text style={[styles.emptyText, { color: theme.text }]}>No records found</Text>
            <Text style={[styles.emptySubtext, { color: theme.textLight }]}>
                There are no attendance records for the selected date range.
            </Text>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <Header title="Attendance List" />

            {/* Date Range Selector */}
            <View style={[styles.filterCard, { backgroundColor: theme.cardBackground }]}>
                <View style={styles.dateRow}>
                    <View style={styles.dateInputContainer}>
                        <Text style={[styles.dateLabel, { color: theme.textLight }]}>From Date</Text>
                        <TouchableOpacity
                            style={[styles.dateButton, { backgroundColor: theme.background, borderColor: theme.inputBorder }]}
                            onPress={() => setShowFromPicker(true)}
                        >
                            <Ionicons name="calendar-outline" size={18} color={theme.primary} />
                            <Text style={[styles.dateButtonText, { color: theme.text }]}>{formatDateDisplay(fromDate)}</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.dateSeparator}>
                        <Ionicons name="arrow-forward" size={16} color={theme.textLight} />
                    </View>

                    <View style={styles.dateInputContainer}>
                        <Text style={[styles.dateLabel, { color: theme.textLight }]}>To Date</Text>
                        <TouchableOpacity
                            style={[styles.dateButton, { backgroundColor: theme.background, borderColor: theme.inputBorder }]}
                            onPress={() => setShowToPicker(true)}
                        >
                            <Ionicons name="calendar-outline" size={18} color={theme.primary} />
                            <Text style={[styles.dateButtonText, { color: theme.text }]}>{formatDateDisplay(toDate)}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.searchButton}
                    onPress={fetchAttendance}
                    disabled={loading}
                >
                    <LinearGradient
                        colors={[theme.primary, theme.primary + 'CC']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.gradientButton}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                            <>
                                <Ionicons name="search" size={20} color="#FFF" />
                                <Text style={styles.searchButtonText}>Search Records</Text>
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* Tabs */}
            <AttendanceTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                theme={theme}
            />

            {/* Content */}
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={[styles.loadingText, { color: theme.textLight }]}>Fetching records...</Text>
                </View>
            ) : activeTab === 'SHIFT' ? (
                <FlatList<AttendanceShift>
                    data={shiftData}
                    renderItem={({ item, index }) => (
                        <AttendanceCard
                            item={item}
                            index={index}
                            theme={theme}
                            type="SHIFT"
                        />
                    )}
                    keyExtractor={(item, index) => `${item.EmpCodeC}-${index}`}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={renderEmptyState}
                    showsVerticalScrollIndicator={false}
                />
            ) : (
                <FlatList<AttendanceOther>
                    data={othersData}
                    renderItem={({ item, index }) => (
                        <AttendanceCard
                            item={item}
                            index={index}
                            theme={theme}
                            type="OTHERS"
                        />
                    )}
                    keyExtractor={(item, index) => `${item.EmpCodeC}-${index}`}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={renderEmptyState}
                    showsVerticalScrollIndicator={false}
                />
            )}

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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    filterCard: {
        margin: 16,
        padding: 16,
        borderRadius: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    dateInputContainer: {
        flex: 1,
    },
    dateLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 10,
        borderWidth: 1,
        gap: 8,
    },
    dateButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    dateSeparator: {
        marginHorizontal: 8,
        paddingTop: 20,
    },
    searchButton: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    gradientButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 8,
    },
    searchButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    listContent: {
        padding: 16,
        paddingBottom: 32,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 60,
        paddingHorizontal: 40,
    },
    emptyIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
});