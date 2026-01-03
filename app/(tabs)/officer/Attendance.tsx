import { API_ENDPOINTS } from '@/constants/api';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

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
    const [activeTab, setActiveTab] = useState<'SHIFT' | 'OTHERS'>('SHIFT');

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
    const [othersData, setOthersData] = useState<AttendanceOther[]>([]);

    const loginData = user || {};
    const token = loginData.Token || loginData.TokenC;
    const companyUrl = API_ENDPOINTS.CompanyUrl;

    useEffect(() => {
        fetchAttendance();
    }, [activeTab, fromDate, toDate]);

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
        if (!token || !companyUrl) return;

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
            <View style={styles.headerContainer}>
                <Stack.Screen options={{ headerShown: false }} />
                <View style={styles.navBar}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                        <Ionicons name="arrow-back" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={[styles.navTitle, { color: theme.text }]}>Attendance List</Text>
                    <View style={styles.iconButton} />
                </View>
            </View>

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

    const renderTabs = () => (
        <View style={[styles.tabsContainer, { backgroundColor: theme.cardBackground }]}>
            {['SHIFT', 'OTHERS'].map((tab) => (
                <TouchableOpacity
                    key={tab}
                    style={[styles.tabItem, activeTab === tab && { backgroundColor: theme.primary }]}
                    onPress={() => setActiveTab(tab as any)}
                >
                    <Text style={[styles.tabText, activeTab === tab ? styles.activeTabText : { color: theme.text }]}>
                        {tab === 'SHIFT' ? 'SHIFT TIME' : 'OTHERS'}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    const renderListHeader = () => {
        const renderHeaderCell = (label: string, flexCb: number) => (
            <Text style={[styles.headerCell, { flex: flexCb, color: theme.secondary }]}>{label}</Text>
        );

        if (activeTab === 'SHIFT') {
            return (
                <View style={[styles.listHeader, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                    {renderHeaderCell('Name', 1.5)}
                    {renderHeaderCell('Shift', 1)}
                    {renderHeaderCell('In', 0.8)}
                    {renderHeaderCell('Out', 0.8)}
                </View>
            );
        } else {
            return (
                <View style={[styles.listHeader, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                    {renderHeaderCell('Name', 1.5)}
                    {renderHeaderCell('Act', 0.8)}
                    {renderHeaderCell('NRM', 0.8)}
                    {renderHeaderCell('Late', 0.8)}
                    {renderHeaderCell('Under', 0.8)}
                </View>
            );
        }
    };

    const renderListItem = ({ item, index }: { item: any, index: number }) => {
        const cellTextStyle = [styles.cellText, { color: theme.text }];
        const cellBoldStyle = [styles.cellTextBold, { color: theme.text }];

        if (activeTab === 'SHIFT') {
            return (
                <View style={[styles.row, { borderColor: theme.inputBorder }, index % 2 === 0 ? { backgroundColor: theme.cardBackground } : { backgroundColor: theme.background }]}>
                    <View style={[styles.cell, { flex: 1.5 }]}>
                        <Text style={cellBoldStyle} numberOfLines={1}>{item.EmpNameC}</Text>
                    </View>
                    <View style={[styles.cell, { flex: 1 }]}>
                        <Text style={cellTextStyle}>{item.ShiftCodeC}</Text>
                    </View>
                    <View style={[styles.cell, { flex: 0.8 }]}>
                        <Text style={cellTextStyle}>{item.ShiftInN?.toFixed(2) || '0.00'}</Text>
                    </View>
                    <View style={[styles.cell, { flex: 0.8 }]}>
                        <Text style={cellTextStyle}>{item.ShiftOutN?.toFixed(2) || '0.00'}</Text>
                    </View>
                </View>
            );
        } else {
            return (
                <View style={[styles.row, { borderColor: theme.inputBorder }, index % 2 === 0 ? { backgroundColor: theme.cardBackground } : { backgroundColor: theme.background }]}>
                    <View style={[styles.cell, { flex: 1.5 }]}>
                        <Text style={cellBoldStyle} numberOfLines={1}>{item.EmpNameC}</Text>
                    </View>
                    <View style={[styles.cell, { flex: 0.8 }]}>
                        <Text style={cellTextStyle}>{item.ActN?.toFixed(2) || '0.00'}</Text>
                    </View>
                    <View style={[styles.cell, { flex: 0.8 }]}>
                        <Text style={cellTextStyle}>{item.NRMN?.toFixed(2) || '0.00'}</Text>
                    </View>
                    <View style={[styles.cell, { flex: 0.8 }]}>
                        <Text style={cellTextStyle}>{item.LateN?.toFixed(2) || '0.00'}</Text>
                    </View>
                    <View style={[styles.cell, { flex: 0.8 }]}>
                        <Text style={cellTextStyle}>{item.UnderN?.toFixed(2) || '0.00'}</Text>
                    </View>
                </View>
            );
        }
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
            <View style={[styles.listContainer, { backgroundColor: theme.cardBackground, flex: 1 }]}>
                <FlatList
                    ListHeaderComponent={() => (
                        <View>
                            {renderHeader()}
                            {renderTabs()}
                            {renderListHeader()}
                        </View>
                    )}
                    data={activeTab === 'SHIFT' ? shiftData : othersData}
                    renderItem={renderListItem}
                    keyExtractor={(item, index) => `${item.EmpCodeC}-${index}`}
                    contentContainerStyle={styles.listContent}
                    refreshing={loading}
                    onRefresh={fetchAttendance}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="document-text-outline" size={64} color={theme.textLight} />
                            <Text style={[styles.emptyText, { color: theme.textLight }]}>No records found</Text>
                        </View>
                    }
                />
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