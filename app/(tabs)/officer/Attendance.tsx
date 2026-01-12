import { API_ENDPOINTS } from '@/constants/api';
import { useTheme } from '@/context/ThemeContext';
import { UserData, useUser } from '@/context/UserContext';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import DynamicTable, { ColumnDef } from '@/components/DynamicTable';
import Header from '@/components/Header';
import { useProtectedBack } from '@/hooks/useProtectedBack';
import { getDomainUrl } from '@/services/urldomain';


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

export default function AttendanceList() {
    const { theme } = useTheme();
    const { user } = useUser();
    const router = useRouter();

    useProtectedBack({
        home: '/home'
    });

    // Date states
    const [fromDate, setFromDate] = useState(() => {
        const d = new Date();
        return new Date(d.getFullYear(), d.getMonth(), 1); // 1st of current month
    });
    const [toDate, setToDate] = useState(new Date());
    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showToPicker, setShowToPicker] = useState(false);

    const [loading, setLoading] = useState(false);
    const [shiftData, setShiftData] = useState<AttendanceShift[]>([]);

    const loginData: Partial<UserData> = user ?? {};
    const token = loginData.Token || loginData.TokenC;

    useEffect(() => {
        fetchAttendance();
    }, [fromDate, toDate]);

    const formatDateForApi = (d: Date) => {
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const year = d.getFullYear();
        return `${month}/${day}/${year}`;
    };

    const formatDisplayDate = (d: Date) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')} ${d.getFullYear()}`;
    };

    const fetchAttendance = async () => {

        const domainUrl = await getDomainUrl();

        if (!token || !domainUrl) return;

        if (fromDate > toDate) {
            Alert.alert('Invalid Date Range', 'From date cannot be greater than To date.');
            return;
        }

        setLoading(true);
        try {
            const url = `${domainUrl}${API_ENDPOINTS.ATTENDANCE_LIST}`;
            const payload = {
                TokenC: token,
                FDate: formatDateForApi(fromDate),
                TDate: formatDateForApi(toDate)
            };

            const response = await axios.post(url, payload);

            if (response.data.Status === 'success') {
                const data = response.data.data || [];
                console.log('Attendance Data:', data);
                setShiftData(data);
            } else {
                setShiftData([]);
            }
        } catch (error) {
            console.error('Fetch Attendance Error:', error);
            Alert.alert('Error', 'Failed to fetch attendance records.');
        } finally {
            setLoading(false);
        }
    };

    const onChangeFrom = (event: any, selectedDate?: Date) => {
        setShowFromPicker(false);
        if (selectedDate) {
            setFromDate(selectedDate);
        }
    };

    const onChangeTo = (event: any, selectedDate?: Date) => {
        setShowToPicker(false);
        if (selectedDate) {
            setToDate(selectedDate);
        }
    };

    const renderHeader = () => (
        <View style={styles.headerWrapper}>
            <Header title="Attendance List" />

            {/* Date Picker Card */}
            <View style={styles.datePickerSection}>
                <View style={[styles.dateCard, { backgroundColor: theme.cardBackground, borderColor: theme.inputBorder }]}>
                    <TouchableOpacity style={styles.dateInput} onPress={() => setShowFromPicker(true)}>
                        <Text style={[styles.dateLabel, { color: theme.textLight }]}>From Date</Text>
                        <View style={styles.dateRow}>
                            <Ionicons name="calendar-outline" size={18} color={theme.primary} />
                            <Text style={[styles.dateValue, { color: theme.text }]}>{formatDisplayDate(fromDate)}</Text>
                        </View>
                    </TouchableOpacity>

                    <View style={[styles.dateDivider, { backgroundColor: theme.inputBorder }]} />

                    <TouchableOpacity style={styles.dateInput} onPress={() => setShowToPicker(true)}>
                        <Text style={[styles.dateLabel, { color: theme.textLight }]}>To Date</Text>
                        <View style={styles.dateRow}>
                            <Ionicons name="calendar-outline" size={18} color={theme.primary} />
                            <Text style={[styles.dateValue, { color: theme.text }]}>{formatDisplayDate(toDate)}</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    // single table view (SHIFT only)

    // Table columns for DynamicTable (SHIFT view)
    const tableWidth = Math.max(780, Dimensions.get('window').width);

    const shiftColumns: ColumnDef[] = [

        {
            key: 'DateD',
            label: 'Date',
            flex: 0.5,
            align: 'flex-start',
            formatter: v =>
                typeof v === 'string'
                    ? new Date(Number(v.replace(/\D/g, ''))).toLocaleDateString()
                    : '',
        },
        { key: 'EmpCodeC', label: 'Code', flex: 0.5, align: 'flex-start' },
        { key: 'EmpNameC', label: 'Name', flex: 0.8, align: 'flex-start' },
        { key: 'ShiftCodeC', label: 'Shift', flex: 0.7, align: 'center' },

        {
            key: 'ShiftInN',
            label: 'Shift In',
            flex: 0.4,
            align: 'flex-end',
            formatter: v => (typeof v === 'number' ? v.toFixed(2) : '0.00'),
        },
        {
            key: 'ShiftOutN',
            label: 'Shift Out',
            flex: 0.5,
            align: 'flex-end',
            formatter: v => (typeof v === 'number' ? v.toFixed(2) : '0.00'),
        },
        { key: 'ReaCodeC', label: 'Reason', flex: 0.5, align: 'center' },

        { key: 'AttC', label: 'Attendance', flex: 0.6, align: 'center' },
        {
            key: 'TInN',
            label: 'Actual In',
            flex: 0.5,
            align: 'flex-end',
            formatter: v => (typeof v === 'number' ? v.toFixed(2) : '0.00'),
        },
        {
            key: 'TOutN',
            label: 'Actual Out',
            flex: 0.6,
            align: 'flex-end',
            formatter: v => (typeof v === 'number' ? v.toFixed(2) : '0.00'),
        },
        {
            key: 'ShiftNRMN',
            label: 'Shift NRM',
            flex: 0.5,
            align: 'flex-end',
        },
        { key: 'LateN', label: 'Late', flex: 0.4, align: 'flex-end' },
        { key: 'UnderN', label: 'Under', flex: 0.4, align: 'flex-end' },


        { key: 'NRMN', label: 'NRM', flex: 0.4, align: 'flex-end' },
        { key: 'AOTN', label: 'AOT', flex: 0.4, align: 'flex-end' },
        { key: 'EOTN', label: 'EOT', flex: 0.4, align: 'flex-end' },

        {
            key: 'LockN',
            label: 'Locked',
            flex: 0.6,
            align: 'center',
            formatter: v => (v === 1 ? 'Yes' : 'No'),
        },
    ];




    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
            <View style={[styles.listContainer, { backgroundColor: theme.cardBackground, flex: 1 }]}>
                {renderHeader()}

                <View style={{ paddingHorizontal: 16, paddingTop: 8, flex: 1 }}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <DynamicTable
                            data={shiftData}
                            columns={shiftColumns}
                            tableWidth={1400}
                            theme={theme}
                        />
                    </ScrollView>

                    {!shiftData.length && !loading && (
                        <View style={styles.emptyState}>
                            <Ionicons name="document-text-outline" size={64} color={theme.textLight} />
                            <Text style={[styles.emptyText, { color: theme.textLight }]}>No records found</Text>
                        </View>
                    )}
                </View>
            </View>

            {showFromPicker && (
                <DateTimePicker
                    value={fromDate}
                    mode="date"
                    display="default"
                    onChange={onChangeFrom}
                    maximumDate={new Date()}
                />
            )}
            {showToPicker && (
                <DateTimePicker
                    value={toDate}
                    mode="date"
                    display="default"
                    onChange={onChangeTo}
                    maximumDate={new Date()}
                    minimumDate={fromDate}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    headerWrapper: {
        backgroundColor: 'transparent',
    },
    headerContainer: {
        paddingTop: Platform.OS === 'ios' ? 0 : 10,
        paddingBottom: 4,
        zIndex: 1,
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
        borderRadius: 16,
        padding: 4,
        elevation: 4,
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
        gap: 6
    },
    dateValue: {
        fontSize: 14,
        fontWeight: '700',
    },
    dateDivider: {
        width: 1,
        height: '50%',
    },
    tabsContainer: {
        flexDirection: 'row',
        marginTop: 5,
        marginHorizontal: 16,
        borderRadius: 10,
        padding: 4,
    },
    tabItem: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    tabText: {
        fontSize: 13,
        fontWeight: '600',
    },
    activeTabText: {
        color: '#fff',
    },
    listContainer: {
        flex: 1,
        marginTop: 0,
        elevation: 2,
        overflow: 'hidden'
    },
    listHeader: {
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        marginTop: 15,
    },
    headerCell: {
        fontSize: 12,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    listContent: {
        paddingBottom: 40,
    },
    row: {
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        alignItems: 'center',
    },
    cell: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    cellText: {
        fontSize: 12,
        textAlign: 'center'
    },
    cellTextBold: {
        fontSize: 12,
        fontWeight: '600',
    },
    emptyState: {
        alignItems: 'center',
        paddingTop: 50,
        opacity: 0.6
    },
    emptyText: {
        marginTop: 10,
        fontSize: 16,
    },
});
