import { API_ENDPOINTS } from '@/constants/api';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { FontAwesome5 } from '@expo/vector-icons';
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
    ShiftIn: number;
    ShiftOut: number;
    ReasonC: string;
    ShiftCodeC: string;
}

interface AttendanceOther {
    EmpCodeC: string;
    Actual: number;
    Nrm: number;
    Late: number;
    Under: number;
    TimeIn: number;
    TimeOut: number;
}

export interface AttendanceResponse {
    success: boolean;
    message?: string;
    raw?: any; // optional: keep original server response if needed
}


export default function MobileAttenRpt() {
    const { theme } = useTheme();
    const { user } = useUser();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'SHIFT' | 'OTHERS'>('SHIFT');
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [loading, setLoading] = useState(false);
    const [shiftData, setShiftData] = useState<AttendanceShift[]>([]);
    const [othersData, setOthersData] = useState<AttendanceOther[]>([]);

    const loginData = user || {};
    const token = loginData.Token || loginData.TokenC;
    const companyUrl = loginData.CompanyUrl || loginData.company_url;

    useEffect(() => {
        fetchAttendance();
    }, [date]);

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

        setLoading(true);
        try {
            const url = `${companyUrl}${API_ENDPOINTS.ATTENDANCE_LIST}`;
            const payload = {
                TokenC: token,
                FDate: formatDateForApi(date)
            };

            console.log('Fetching Attendance:', url, payload);

            const response = await axios.post(url, payload);

            console.log('Attendance Response:', response.data);

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
        } finally {
            setLoading(false);
        }
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setDate(selectedDate);
        }
    };

    const renderShiftItem = ({ item, index }: { item: any, index: number }) => (
        <View style={[
            styles.card,
            { backgroundColor: index % 2 === 0 ? theme.cardBackground : theme.background, borderColor: theme.inputBorder }
        ]}>
            <View style={styles.row}>
                <View style={styles.column}>
                    <Text style={[styles.label, { color: theme.secondary }]}>Emp Code</Text>
                    <Text style={[styles.value, { color: theme.text }]}>{item.EmpCodeC || '-'}</Text>
                </View>
                <View style={styles.column}>
                    <Text style={[styles.label, { color: theme.secondary }]}>Name</Text>
                    <Text style={[styles.value, { color: theme.text }]}>{item.EmpNameC || '-'}</Text>
                </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
                <View style={styles.column}>
                    <Text style={[styles.label, { color: theme.secondary }]}>Shift In</Text>
                    <Text style={[styles.value, { color: '#10B981' }]}>{item.ShiftIn ? Number(item.ShiftIn).toFixed(2) : '-'}</Text>
                </View>
                <View style={styles.column}>
                    <Text style={[styles.label, { color: theme.secondary }]}>Shift Out</Text>
                    <Text style={[styles.value, { color: '#EF4444' }]}>{item.ShiftOut ? Number(item.ShiftOut).toFixed(2) : '-'}</Text>
                </View>
                <View style={styles.column}>
                    <Text style={[styles.label, { color: theme.secondary }]}>Code</Text>
                    <Text style={[styles.value, { color: theme.primary }]}>{item.ShiftCodeC || '-'}</Text>
                </View>
            </View>
            {item.ReasonC && (
                <View style={styles.reasonContainer}>
                    <Text style={[styles.label, { color: theme.secondary }]}>Reason: </Text>
                    <Text style={[styles.value, { color: theme.text }]}>{item.ReasonC}</Text>
                </View>
            )}
        </View>
    );

    const renderOtherItem = ({ item, index }: { item: any, index: number }) => (
        <View style={[
            styles.card,
            { backgroundColor: index % 2 === 0 ? theme.cardBackground : theme.background, borderColor: theme.inputBorder }
        ]}>
            <View style={styles.row}>
                <View style={styles.column}>
                    <Text style={[styles.label, { color: theme.secondary }]}>Emp Code</Text>
                    <Text style={[styles.value, { color: theme.text }]}>{item.EmpCodeC || '-'}</Text>
                </View>
                <View style={styles.column}>
                    <Text style={[styles.label, { color: theme.secondary }]}>Actual</Text>
                    <Text style={[styles.value, { color: theme.text }]}>{item.Actual ? Number(item.Actual).toFixed(2) : '-'}</Text>
                </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
                <View style={styles.column}>
                    <Text style={[styles.label, { color: theme.secondary }]}>NRM</Text>
                    <Text style={[styles.value, { color: theme.text }]}>{item.Nrm ? Number(item.Nrm).toFixed(2) : '-'}</Text>
                </View>
                <View style={styles.column}>
                    <Text style={[styles.label, { color: theme.secondary }]}>Late</Text>
                    <Text style={[styles.value, { color: '#EF4444' }]}>{item.Late ? Number(item.Late).toFixed(2) : '-'}</Text>
                </View>
                <View style={styles.column}>
                    <Text style={[styles.label, { color: theme.secondary }]}>Under</Text>
                    <Text style={[styles.value, { color: '#F59E0B' }]}>{item.Under ? Number(item.Under).toFixed(2) : '-'}</Text>
                </View>
            </View>
            <View style={[styles.row, { marginTop: 8 }]}>
                <View style={styles.column}>
                    <Text style={[styles.label, { color: theme.secondary }]}>Time In</Text>
                    <Text style={[styles.value, { color: '#10B981' }]}>{item.TimeIn ? Number(item.TimeIn).toFixed(2) : '-'}</Text>
                </View>
                <View style={styles.column}>
                    <Text style={[styles.label, { color: theme.secondary }]}>Time Out</Text>
                    <Text style={[styles.value, { color: '#EF4444' }]}>{item.TimeOut ? Number(item.TimeOut).toFixed(2) : '-'}</Text>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.inputBorder }]}>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Attendance List</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateButton}>
                        <FontAwesome5 name="calendar-alt" size={18} color={theme.primary} />
                        <Text style={[styles.dateText, { color: theme.primary }]}>{formatDateDisplay(date)}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Tabs */}
            <View style={[styles.tabContainer, { backgroundColor: theme.cardBackground }]}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'SHIFT' && { borderBottomColor: theme.primary, borderBottomWidth: 2 }]}
                    onPress={() => setActiveTab('SHIFT')}
                >
                    <Text style={[styles.tabText, { color: activeTab === 'SHIFT' ? theme.primary : theme.secondary }]}>SHIFT TIME</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'OTHERS' && { borderBottomColor: theme.primary, borderBottomWidth: 2 }]}
                    onPress={() => setActiveTab('OTHERS')}
                >
                    <Text style={[styles.tabText, { color: activeTab === 'OTHERS' ? theme.primary : theme.secondary }]}>OTHERS</Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (
                <FlatList
                    data={activeTab === 'SHIFT' ? shiftData : othersData}
                    renderItem={activeTab === 'SHIFT' ? renderShiftItem : renderOtherItem}
                    keyExtractor={(item, index) => index.toString()}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Text style={{ color: theme.secondary }}>No records found</Text>
                        </View>
                    }
                />
            )}

            {showDatePicker && (
                <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                />
            )}
        </SafeAreaView>
    );
}

const parseServerDate = (serverDateTime: string) => {
    // Example: "02 Jan 2026 17:18:27"
    const [day, monthStr, year, time] = serverDateTime.split(' ');

    const monthMap: Record<string, string> = {
        Jan: '01', Feb: '02', Mar: '03', Apr: '04',
        May: '05', Jun: '06', Jul: '07', Aug: '08',
        Sep: '09', Oct: '10', Nov: '11', Dec: '12',
    };

    return {
        date: `${monthMap[monthStr]}/${day}/${year}`, // MM/dd/yyyy
        time,                                        // HH:mm:ss
    };
};


// Logic for Uploading Attendance (Analysis & Implementation)
// Endpoint: /WebApi/InsertMobileAtten
// Required Fields (Inferred): TokenC, Date, Time, Location, Image (Base64), Remark
export const markAttendance = async (
    companyUrl: string,
    token: string,
    empId: number,
    projectId: number,
    mode: 0 | 1,
    location: { latitude: number; longitude: number; address?: string },
    imageUri: string,
    remark: string,
    serverDateTime: string
): Promise<AttendanceResponse> => {

    const url = `${companyUrl}${API_ENDPOINTS.INSERT_MOBILE_ATTENDANCE}`;
    const { date, time } = parseServerDate(serverDateTime);

    const formData = new FormData();

    formData.append('MobilePht', {
        uri: imageUri,
        name: 'attendance.jpg',
        type: 'image/jpeg',
    } as any);

    formData.append('TokenC', token);
    formData.append('EmpIdN', empId.toString());
    formData.append('DateD', date);
    formData.append('TimeD', time);
    formData.append('GPRSC', `${location.latitude},${location.longitude}`);
    formData.append('ModeN', mode.toString());
    formData.append('PunchLocC', location.address || '');
    formData.append('RemarkC', remark || '');
    formData.append('ProjectIdN', projectId.toString());
    formData.append('CreatedByN', empId.toString());

    try {
        const response = await axios.post(url, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 120000,
        });

        // ✅ normalize backend response
        if (response.data?.Status === 'success') {
            return {
                success: true,
                message: response.data?.Message || 'Attendance marked successfully',
                raw: response.data,
            };
        }

        return {
            success: false,
            message: response.data?.Message || 'Attendance failed',
            raw: response.data,
        };

    } catch (error: any) {
        return {
            success: false,
            message: error?.message || 'Network / Server error',
        };
    }
};



const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 8,
        borderRadius: 8,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    dateText: {
        fontWeight: '600',
    },
    tabContainer: {
        flexDirection: 'row',
        marginBottom: 8,
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
    listContent: {
        padding: 16,
    },
    card: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    column: {
        flex: 1,
    },
    label: {
        fontSize: 12,
        marginBottom: 4,
    },
    value: {
        fontSize: 14,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.05)',
        marginVertical: 12,
    },
    reasonContainer: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
        flexDirection: 'row',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    }
});