import Header from '@/components/Header';
import { API_ENDPOINTS } from '@/constants/api';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { useProtectedBack } from '@/hooks/useProtectedBack';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

// Types for Attendance Data
interface AttendanceShift {
    EmpCodeC: string;
    EmpNameC: string;
    ShiftInN: number;
    ShiftOutN: number;
    ShiftCodeC: string;
    ReaCodeC: string;
    AttC: string;
    DateD: string;
    DateDisplay: string;
    DateObj: Date;
}

interface AttendanceOther {
    EmpCodeC: string;
    ActN: number;
    NRMN: number;
    LateN: number;
    UnderN: number;
    TInN: number;
    TOutN: number;
    DateD: string;
    DateDisplay: string;
    DateObj: Date;
}

export default function MobileAttenRpt() {
    const { theme } = useTheme();
    const { user } = useUser();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'SHIFT' | 'OTHERS'>('SHIFT');
    const [fromDate, setFromDate] = useState<Date>(() => {
        const date = new Date();
        date.setDate(date.getDate() - 7); // Default to last 7 days
        return date;
    });
    const [toDate, setToDate] = useState<Date>(new Date());
    const [showFromDatePicker, setShowFromDatePicker] = useState(false);
    const [showToDatePicker, setShowToDatePicker] = useState(false);
    const [loading, setLoading] = useState(false);
    const [shiftData, setShiftData] = useState<AttendanceShift[]>([]);
    const [othersData, setOthersData] = useState<AttendanceOther[]>([]);
    const [filteredShiftData, setFilteredShiftData] = useState<AttendanceShift[]>([]);
    const [filteredOthersData, setFilteredOthersData] = useState<AttendanceOther[]>([]);
    const [showFilterControls, setShowFilterControls] = useState(false);

    const loginData = user || {};
    const token = loginData.Token || loginData.TokenC;
    const companyUrl = API_ENDPOINTS.CompanyUrl;

    useEffect(() => {
        fetchAttendance();
    }, [fromDate, toDate]);

    useEffect(() => {
        filterDataByDateRange();
    }, [shiftData, othersData, fromDate, toDate]);

    // Function to parse /Date(timestamp)/ format
    const parseDateFromApi = (dateString: string): Date => {
        if (!dateString || dateString === '/Date(-62135596800000)/') {
            return new Date(0);
        }

        try {
            const timestampMatch = dateString.match(/\/Date\((-?\d+)\)\//);
            if (timestampMatch && timestampMatch[1]) {
                const timestamp = parseInt(timestampMatch[1], 10);
                return new Date(timestamp);
            }
        } catch (error) {
            console.error('Error parsing date:', error);
        }
        return new Date(0);
    };

    // Format date for display
    const formatDateDisplay = (date: Date): string => {
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    // Format date for API - MM/DD/YYYY format
    const formatDateForApi = (date: Date): string => {
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
    };

    // Filter data based on date range
    const filterDataByDateRange = () => {
        // Reset times to start of day for fromDate and end of day for toDate
        const fromDateStart = new Date(fromDate);
        fromDateStart.setHours(0, 0, 0, 0);

        const toDateEnd = new Date(toDate);
        toDateEnd.setHours(23, 59, 59, 999);

        if (shiftData.length > 0) {
            const filtered = shiftData.filter(item => {
                return item.DateObj >= fromDateStart && item.DateObj <= toDateEnd;
            });
            setFilteredShiftData(filtered);
        }

        if (othersData.length > 0) {
            const filtered = othersData.filter(item => {
                return item.DateObj >= fromDateStart && item.DateObj <= toDateEnd;
            });
            setFilteredOthersData(filtered);
        }
    };

    // Set date range to Today
    const setTodayRange = () => {
        const today = new Date();
        setFromDate(today);
        setToDate(today);
    };

    // Set date range to Yesterday
    const setYesterdayRange = () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        setFromDate(yesterday);
        setToDate(yesterday);
    };

    // Set date range to Last 7 Days
    const setLast7DaysRange = () => {
        const today = new Date();
        const lastWeek = new Date();
        lastWeek.setDate(today.getDate() - 6); // Last 7 days inclusive
        setFromDate(lastWeek);
        setToDate(today);
    };

    // Set date range to This Month
    const setThisMonthRange = () => {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        setFromDate(firstDay);
        setToDate(today);
    };

    // Set date range to Last Month
    const setLastMonthRange = () => {
        const today = new Date();
        const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        setFromDate(firstDayLastMonth);
        setToDate(lastDayLastMonth);
    };

    useProtectedBack({
        home: '/home',
        dashboard: '/dashboard',
    });

    const fetchAttendance = async () => {
        if (!token || !companyUrl) {
            console.log('Missing token or company URL', { token, companyUrl });
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

            console.log('Fetching Attendance:', url, payload);

            const response = await axios.post(url, payload);

            console.log('Attendance Response:', response.data);

            if (response.data.Status === 'success') {
                const list = response.data.data || [];

                const shiftItems: AttendanceShift[] = list.map((i: any) => {
                    const dateObj = parseDateFromApi(i.DateD);
                    return {
                        EmpCodeC: i.EmpCodeC,
                        EmpNameC: i.EmpNameC,
                        ShiftInN: i.ShiftInN,
                        ShiftOutN: i.ShiftOutN,
                        ShiftCodeC: i.ShiftCodeC,
                        ReaCodeC: i.ReaCodeC,
                        AttC: i.AttC,
                        DateD: i.DateD,
                        DateDisplay: formatDateDisplay(dateObj),
                        DateObj: dateObj
                    };
                });

                const otherItems: AttendanceOther[] = list.map((i: any) => {
                    const dateObj = parseDateFromApi(i.DateD);
                    return {
                        EmpCodeC: i.EmpCodeC,
                        ActN: i.ActN,
                        NRMN: i.NRMN,
                        LateN: i.LateN,
                        UnderN: i.UnderN,
                        TInN: i.TInN,
                        TOutN: i.TOutN,
                        DateD: i.DateD,
                        DateDisplay: formatDateDisplay(dateObj),
                        DateObj: dateObj
                    };
                });

                setShiftData(shiftItems);
                setOthersData(otherItems);
            } else {
                setShiftData([]);
                setOthersData([]);
                setFilteredShiftData([]);
                setFilteredOthersData([]);
            }
        } catch (error) {
            console.error('Fetch Attendance Error:', error);
            setShiftData([]);
            setOthersData([]);
            setFilteredShiftData([]);
            setFilteredOthersData([]);
        } finally {
            setLoading(false);
        }
    };

    const onFromDateChange = (event: any, selectedDate?: Date) => {
        setShowFromDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setFromDate(selectedDate);
        }
    };

    const onToDateChange = (event: any, selectedDate?: Date) => {
        setShowToDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setToDate(selectedDate);
        }
    };

    const renderShiftItem = ({ item, index }: { item: AttendanceShift; index: number }) => (
        <View style={[styles.card, {
            backgroundColor: theme.cardBackground,
            borderColor: theme.inputBorder,
            shadowColor: theme.mode === 'dark' ? '#000' : '#000',
        }]}>
            {/* Date Header */}
            <View style={[styles.dateHeader, { backgroundColor: theme.primary + '20' }]}>
                <Text style={[styles.dateHeaderText, { color: theme.primary }]}>
                    {item.DateDisplay}
                </Text>
            </View>

            <View style={styles.row}>
                <View style={styles.column}>
                    <Text style={[styles.label, { color: theme.textLight }]}>Emp Code</Text>
                    <Text style={[styles.value, { color: theme.text }]}>{item.EmpCodeC}</Text>
                </View>
                <View style={styles.column}>
                    <Text style={[styles.label, { color: theme.textLight }]}>Name</Text>
                    <Text style={[styles.value, { color: theme.text }]}>{item.EmpNameC}</Text>
                </View>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.inputBorder }]} />

            <View style={styles.row}>
                <View style={styles.column}>
                    <Text style={[styles.label, { color: theme.textLight }]}>Shift In</Text>
                    <Text style={[styles.value, { color: '#10B981' }]}>
                        {item.ShiftInN ? item.ShiftInN.toFixed(2) : '-'}
                    </Text>
                </View>
                <View style={styles.column}>
                    <Text style={[styles.label, { color: theme.textLight }]}>Shift Out</Text>
                    <Text style={[styles.value, { color: '#EF4444' }]}>
                        {item.ShiftOutN ? item.ShiftOutN.toFixed(2) : '-'}
                    </Text>
                </View>
                <View style={styles.column}>
                    <Text style={[styles.label, { color: theme.textLight }]}>Shift</Text>
                    <Text style={[styles.value, { color: theme.text }]}>{item.ShiftCodeC}</Text>
                </View>
            </View>

            {/* Status Badge */}
            <View style={styles.statusRow}>
                <View style={styles.column}>
                    <Text style={[styles.label, { color: theme.textLight }]}>Status</Text>
                    <View style={[
                        styles.statusBadge,
                        {
                            backgroundColor: item.AttC === 'P' ? '#10B98120' :
                                item.AttC === 'A' ? '#EF444420' : '#F59E0B20'
                        }
                    ]}>
                        <Text style={[
                            styles.statusText,
                            {
                                color: item.AttC === 'P' ? '#10B981' :
                                    item.AttC === 'A' ? '#EF4444' : '#F59E0B'
                            }
                        ]}>
                            {item.AttC === 'P' ? 'Present' :
                                item.AttC === 'A' ? 'Absent' :
                                    item.AttC}
                        </Text>
                    </View>
                </View>
            </View>

            {item.ReaCodeC?.trim() && (
                <View style={[styles.reasonContainer, { borderTopColor: theme.inputBorder }]}>
                    <Text style={[styles.label, { color: theme.textLight }]}>Reason: </Text>
                    <Text style={[styles.value, { color: theme.text }]}>{item.ReaCodeC}</Text>
                </View>
            )}
        </View>
    );

    const renderOtherItem = ({ item, index }: { item: AttendanceOther; index: number }) => (
        <View style={[styles.card, {
            backgroundColor: theme.cardBackground,
            borderColor: theme.inputBorder,
            shadowColor: theme.mode === 'dark' ? '#000' : '#000',
        }]}>
            {/* Date Header */}
            <View style={[styles.dateHeader, { backgroundColor: theme.primary + '20' }]}>
                <Text style={[styles.dateHeaderText, { color: theme.primary }]}>
                    {item.DateDisplay}
                </Text>
            </View>

            <View style={styles.row}>
                <View style={styles.column}>
                    <Text style={[styles.label, { color: theme.textLight }]}>Emp Code</Text>
                    <Text style={[styles.value, { color: theme.text }]}>{item.EmpCodeC}</Text>
                </View>
                <View style={styles.column}>
                    <Text style={[styles.label, { color: theme.textLight }]}>Actual</Text>
                    <Text style={[styles.value, { color: theme.text }]}>{item.ActN?.toFixed(2) || '-'}</Text>
                </View>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.inputBorder }]} />

            <View style={styles.row}>
                <View style={styles.column}>
                    <Text style={[styles.label, { color: theme.textLight }]}>NRM</Text>
                    <Text style={[styles.value, { color: theme.text }]}>{item.NRMN?.toFixed(2) || '-'}</Text>
                </View>
                <View style={styles.column}>
                    <Text style={[styles.label, { color: theme.textLight }]}>Late</Text>
                    <Text style={[styles.value, { color: '#EF4444' }]}>{item.LateN?.toFixed(2) || '-'}</Text>
                </View>
                <View style={styles.column}>
                    <Text style={[styles.label, { color: theme.textLight }]}>Under</Text>
                    <Text style={[styles.value, { color: '#F59E0B' }]}>{item.UnderN?.toFixed(2) || '-'}</Text>
                </View>
            </View>

            <View style={[styles.row, { marginTop: 8 }]}>
                <View style={styles.column}>
                    <Text style={[styles.label, { color: theme.textLight }]}>Time In</Text>
                    <Text style={[styles.value, { color: '#10B981' }]}>{item.TInN?.toFixed(2) || '-'}</Text>
                </View>
                <View style={styles.column}>
                    <Text style={[styles.label, { color: theme.textLight }]}>Time Out</Text>
                    <Text style={[styles.value, { color: '#EF4444' }]}>{item.TOutN?.toFixed(2) || '-'}</Text>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <Header title="Attendance List" />

            {/* Filter Toggle Button */}
            <TouchableOpacity
                style={[styles.filterToggleButton, { backgroundColor: theme.primary }]}
                onPress={() => setShowFilterControls(!showFilterControls)}
            >
                <Ionicons name="filter" size={16} color="#FFFFFF" />
                <Text style={styles.filterToggleText}>
                    {showFilterControls ? 'Hide Filters' : 'Show Filters'}
                </Text>
            </TouchableOpacity>

            {/* Date Range Filters */}
            {showFilterControls && (
                <>
                    <View style={[styles.filterContainer, { backgroundColor: theme.cardBackground }]}>
                        {/* Quick Date Presets */}
                        <View style={styles.datePresetsContainer}>
                            <TouchableOpacity
                                style={[styles.datePresetButton, { backgroundColor: theme.primary + '20' }]}
                                onPress={setTodayRange}
                            >
                                <Text style={[styles.datePresetText, { color: theme.primary }]}>Today</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.datePresetButton, { backgroundColor: theme.primary + '20' }]}
                                onPress={setYesterdayRange}
                            >
                                <Text style={[styles.datePresetText, { color: theme.primary }]}>Yesterday</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.datePresetButton, { backgroundColor: theme.primary + '20' }]}
                                onPress={setLast7DaysRange}
                            >
                                <Text style={[styles.datePresetText, { color: theme.primary }]}>Last 7 Days</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.datePresetButton, { backgroundColor: theme.primary + '20' }]}
                                onPress={setThisMonthRange}
                            >
                                <Text style={[styles.datePresetText, { color: theme.primary }]}>This Month</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.datePresetButton, { backgroundColor: theme.primary + '20' }]}
                                onPress={setLastMonthRange}
                            >
                                <Text style={[styles.datePresetText, { color: theme.primary }]}>Last Month</Text>
                            </TouchableOpacity>
                        </View>

                        {/* From Date */}
                        <View style={styles.dateInputContainer}>
                            <Text style={[styles.dateLabel, { color: theme.text }]}>From Date</Text>
                            <TouchableOpacity
                                style={[styles.dateInput, { borderColor: theme.inputBorder }]}
                                onPress={() => setShowFromDatePicker(true)}
                            >
                                <Ionicons name="calendar-outline" size={18} color={theme.primary} />
                                <Text style={[styles.dateInputText, { color: theme.text }]}>
                                    {formatDateDisplay(fromDate)}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* To Date */}
                        <View style={styles.dateInputContainer}>
                            <Text style={[styles.dateLabel, { color: theme.text }]}>To Date</Text>
                            <TouchableOpacity
                                style={[styles.dateInput, { borderColor: theme.inputBorder }]}
                                onPress={() => setShowToDatePicker(true)}
                            >
                                <Ionicons name="calendar-outline" size={18} color={theme.primary} />
                                <Text style={[styles.dateInputText, { color: theme.text }]}>
                                    {formatDateDisplay(toDate)}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Selected Range Display */}
                        <View style={[styles.rangeDisplay, { borderColor: theme.inputBorder }]}>
                            <Ionicons name="calendar-outline" size={16} color={theme.primary} />
                            <Text style={[styles.rangeDisplayText, { color: theme.text }]}>
                                Showing data from {formatDateDisplay(fromDate)} to {formatDateDisplay(toDate)}
                            </Text>
                        </View>
                    </View>

                    {/* Apply Filters Button */}
                    <TouchableOpacity
                        style={[styles.applyFilterButton, { backgroundColor: theme.primary }]}
                        onPress={fetchAttendance}
                    >
                        <Text style={styles.applyFilterText}>Apply Filters</Text>
                    </TouchableOpacity>
                </>
            )}

            {/* Tabs */}
            <View style={[styles.tabContainer, { backgroundColor: theme.cardBackground }]}>
                <TouchableOpacity
                    style={[
                        styles.tab,
                        activeTab === 'SHIFT' && {
                            borderBottomColor: theme.primary,
                            borderBottomWidth: 2
                        }
                    ]}
                    onPress={() => setActiveTab('SHIFT')}
                >
                    <Text style={[
                        styles.tabText,
                        {
                            color: activeTab === 'SHIFT' ? theme.primary : theme.secondary
                        }
                    ]}>
                        SHIFT TIME
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.tab,
                        activeTab === 'OTHERS' && {
                            borderBottomColor: theme.primary,
                            borderBottomWidth: 2
                        }
                    ]}
                    onPress={() => setActiveTab('OTHERS')}
                >
                    <Text style={[
                        styles.tabText,
                        {
                            color: activeTab === 'OTHERS' ? theme.primary : theme.secondary
                        }
                    ]}>
                        OTHERS
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Results Summary */}
            <View style={[styles.resultsSummary, { backgroundColor: theme.cardBackground }]}>
                <Text style={[styles.resultsText, { color: theme.textLight }]}>
                    Showing {activeTab === 'SHIFT' ? filteredShiftData.length : filteredOthersData.length} records
                </Text>
                <Text style={[styles.dateRangeText, { color: theme.primary }]}>
                    {formatDateDisplay(fromDate)} - {formatDateDisplay(toDate)}
                </Text>
            </View>

            {/* Loading State */}
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={[styles.loadingText, { color: theme.textLight }]}>
                        Loading attendance data...
                    </Text>
                </View>
            ) : (
                <>
                    {/* Content */}
                    {activeTab === 'SHIFT' ? (
                        <FlatList<AttendanceShift>
                            data={filteredShiftData}
                            renderItem={renderShiftItem}
                            keyExtractor={(item, index) => `${item.EmpCodeC}-${item.DateD}-${index}`}
                            contentContainerStyle={styles.listContent}
                            ListEmptyComponent={
                                <View style={styles.center}>
                                    <Ionicons name="filter" size={48} color={theme.textLight} />
                                    <Text style={[styles.emptyText, { color: theme.textLight }]}>
                                        No shift data available
                                    </Text>
                                    <Text style={[styles.emptySubText, { color: theme.textLight }]}>
                                        for {formatDateDisplay(fromDate)} to {formatDateDisplay(toDate)}
                                    </Text>
                                </View>
                            }
                        />
                    ) : (
                        <FlatList<AttendanceOther>
                            data={filteredOthersData}
                            renderItem={renderOtherItem}
                            keyExtractor={(item, index) => `${item.EmpCodeC}-${item.DateD}-${index}`}
                            contentContainerStyle={styles.listContent}
                            ListEmptyComponent={
                                <View style={styles.center}>
                                    <Ionicons name="filter" size={48} color={theme.textLight} />
                                    <Text style={[styles.emptyText, { color: theme.textLight }]}>
                                        No other data available
                                    </Text>
                                    <Text style={[styles.emptySubText, { color: theme.textLight }]}>
                                        for {formatDateDisplay(fromDate)} to {formatDateDisplay(toDate)}
                                    </Text>
                                </View>
                            }
                        />
                    )}
                </>
            )}

            {/* Date Pickers */}
            {showFromDatePicker && (
                <DateTimePicker
                    value={fromDate}
                    mode="date"
                    display="default"
                    onChange={onFromDateChange}
                    themeVariant={theme.mode === 'dark' ? 'dark' : 'light'}
                    maximumDate={toDate} // Can't select from date after to date
                />
            )}
            {showToDatePicker && (
                <DateTimePicker
                    value={toDate}
                    mode="date"
                    display="default"
                    onChange={onToDateChange}
                    themeVariant={theme.mode === 'dark' ? 'dark' : 'light'}
                    minimumDate={fromDate} // Can't select to date before from date
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    filterToggleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginHorizontal: 16,
        marginTop: 12,
        paddingVertical: 12,
        borderRadius: 8,
    },
    filterToggleText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    filterContainer: {
        marginHorizontal: 16,
        marginTop: 12,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    datePresetsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    datePresetButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    datePresetText: {
        fontSize: 12,
        fontWeight: '500',
    },
    dateInputContainer: {
        marginBottom: 12,
    },
    dateLabel: {
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 4,
    },
    dateInput: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
    },
    dateInputText: {
        fontSize: 14,
        fontWeight: '600',
    },
    rangeDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        marginTop: 8,
    },
    rangeDisplayText: {
        fontSize: 12,
        fontWeight: '500',
        flex: 1,
    },
    applyFilterButton: {
        marginHorizontal: 16,
        marginTop: 8,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    applyFilterText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    tabContainer: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 8,
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    tab: {
        flex: 1,
        paddingVertical: 16,
        alignItems: 'center',
    },
    tabText: {
        fontWeight: '600',
        fontSize: 14,
    },
    resultsSummary: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginHorizontal: 16,
        marginBottom: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    resultsText: {
        fontSize: 12,
        fontWeight: '500',
    },
    dateRangeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    listContent: {
        padding: 16,
        paddingBottom: 20,
    },
    card: {
        borderRadius: 12,
        padding: 0,
        marginBottom: 12,
        borderWidth: 1,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        overflow: 'hidden',
    },
    dateHeader: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    dateHeaderText: {
        fontSize: 12,
        fontWeight: '500',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    column: {
        flex: 1,
    },
    label: {
        fontSize: 12,
        marginBottom: 4,
        fontWeight: '500',
    },
    value: {
        fontSize: 14,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        marginHorizontal: 16,
    },
    reasonContainer: {
        marginTop: 12,
        paddingTop: 12,
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderTopWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        minHeight: 200,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
    },
    emptyText: {
        marginTop: 12,
        fontSize: 16,
        fontWeight: '600',
    },
    emptySubText: {
        marginTop: 4,
        fontSize: 12,
    },
});