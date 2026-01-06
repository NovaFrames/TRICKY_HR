import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as FileSystem from 'expo-file-system/legacy';
import { Stack, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import TimeRequestModal from '../../../components/TimeManage/TimeRequestModal';
import ApiService from '../../../services/ApiService';

import { useProtectedBack } from '@/hooks/useProtectedBack';
import { useTheme } from '../../../context/ThemeContext';

export default function TimeManage() {
    const { theme } = useTheme();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('SHIFT TIME');
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [timeData, setTimeData] = useState<any[]>([]);

    // Dates for filter
    const [fromDate, setFromDate] = useState(() => {
        const d = new Date();
        return new Date(d.getFullYear(), d.getMonth(), 1); // 1st of current month
    });
    const [toDate, setToDate] = useState(new Date());
    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showToPicker, setShowToPicker] = useState(false);

    // Helper to format Date for API "MM/dd/yyyy" format as expected by the API
    const formatDateForApi = (d: Date) => {
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${month}/${day}/${year}`; // MM/dd/yyyy format
    };

    useProtectedBack({
        home: '/home',
        settings: '/settings',
        dashboard: '/dashboard',
    });

    React.useEffect(() => {
        if (!fromDate) return;

        const newToDate = new Date(fromDate);
        newToDate.setDate(newToDate.getDate() + 30);

        setToDate(newToDate);
    }, [fromDate]);


    // Helper to view format
    // Helper to view format
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

    // Helper for time format
    const formatTime = (timeString: any) => {
        if (!timeString || timeString === '0.00' || timeString === 0) return '00.00';

        if (typeof timeString === 'number') {
            const hours = Math.floor(timeString);
            const minutes = Math.round((timeString - hours) * 100);
            return `${String(hours).padStart(2, '0')}.${String(minutes).padStart(2, '0')}`;
        }
        return timeString;
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

    const fetchTimeData = async () => {
        setLoading(true);
        try {
            // Use current dates or defaults
            // For now using hardcoded defaults or you can add a picker
            // Sending in US format based on request snippet "01/01/2024"
            const fDate = formatDateForApi(fromDate);
            const tDate = formatDateForApi(toDate);

            const result = await ApiService.getTimeManageList(fDate, tDate);
            if (result.success && result.data) {
                setTimeData(result.data);
            } else {
                // Alert.alert("Error", result.error || "Failed to fetch data");
                console.log("Failed to fetch time data", result.error);
            }
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchTimeData();
    }, [activeTab, fromDate, toDate]); // Refresh on tab or date change

    const [downloading, setDownloading] = useState(false);

    const handleDownloadedFile = async (url: string) => {
        try {
            if (!url) {
                throw new Error('Download URL is empty');
            }

            const fileName = `TimeReport_${new Date().getTime()}.pdf`;
            const fileUri = FileSystem.documentDirectory + fileName;

            console.log('Starting download from URL:', url);
            console.log('Saving to:', fileUri);

            const downloadRes = await FileSystem.downloadAsync(url, fileUri);

            console.log('Download response:', downloadRes);

            if (downloadRes.status === 200) {
                console.log('Download complete:', downloadRes.uri);

                // Check if sharing is available
                const isAvailable = await Sharing.isAvailableAsync();
                console.log('Sharing available:', isAvailable);

                if (isAvailable) {
                    await Sharing.shareAsync(downloadRes.uri, {
                        mimeType: 'application/pdf',
                        dialogTitle: 'Download Time Report',
                        UTI: 'com.adobe.pdf' // for iOS
                    });
                } else {
                    Alert.alert('Success', 'File downloaded to: ' + downloadRes.uri);
                }
            } else {
                throw new Error(`Download failed with status: ${downloadRes.status}`);
            }
        } catch (error: any) {
            console.error('Error downloading file:', error);
            const errorMessage = error?.message || 'Could not download the file.';
            Alert.alert('Download Error', errorMessage);
        }
    };

    const handleDownload = async () => {
        // 1. Validate dates
        if (toDate < fromDate) {
            Alert.alert('Error', 'To date must be greater than From date');
            return;
        }

        // 2. Calculate days difference (max 31 days)
        const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 31) {
            Alert.alert('Error', 'Total days must be less than 31 days');
            return;
        }

        setDownloading(true);

        try {
            const fromDateStr = formatDateForApi(fromDate);
            const toDateStr = formatDateForApi(toDate);

            console.log('Downloading report for dates:', { fromDateStr, toDateStr });

            // 4. Call ApiService
            const result = await ApiService.downloadTimeReport(fromDateStr, toDateStr);

            console.log('Download result:', result);

            if (result.success && result.url) {
                console.log('Download URL received:', result.url);
                // 5. Handle the downloaded URL
                await handleDownloadedFile(result.url);
            } else {
                const errorMsg = result.error || 'Failed to download report';
                console.error('Download failed:', errorMsg);
                Alert.alert('Download Failed', errorMsg);
            }
        } catch (error: any) {
            console.error('Download error:', error);
            Alert.alert('Error', error?.message || 'Download failed. Please try again.');
        } finally {
            setDownloading(false);
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
                    <Text style={[styles.navTitle, { color: theme.text }]}>Time Management</Text>
                    <TouchableOpacity onPress={handleDownload} style={styles.iconButton} disabled={downloading}>
                        {downloading ? (
                            <ActivityIndicator color={theme.text} size="small" />
                        ) : (
                            <Ionicons name="download-outline" size={24} color={theme.text} />
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {/* Date Picker Card - Now outside the colored header */}
            <View style={styles.datePickerSection}>
                <View style={[styles.dateCard, { backgroundColor: theme.cardBackground, borderColor: theme.inputBorder }]}>
                    <TouchableOpacity style={styles.dateInput} onPress={() => setShowFromPicker(true)}>
                        <Text style={[styles.dateLabel, { color: theme.placeholder }]}>From Date</Text>
                        <View style={styles.dateRow}>
                            <Ionicons name="calendar-outline" size={18} color={theme.primary} />
                            <Text style={[styles.dateValue, { color: theme.text }]}>{formatDisplayDate(fromDate)}</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    const renderTabs = () => (
        <View style={[styles.tabsContainer, { backgroundColor: theme.cardBackground }]}>
            {['SHIFT TIME', 'OTHERS', 'OT HRS'].map((tab) => (
                <TouchableOpacity
                    key={tab}
                    style={[styles.tabItem, activeTab === tab && { backgroundColor: theme.primary }]}
                    onPress={() => setActiveTab(tab)}
                >
                    <Text style={[styles.tabText, activeTab === tab ? styles.activeTabText : { color: theme.text }]}>{tab}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );


    const renderListItem = ({ item, index }: { item: any, index: number }) => {
        const dateDisplay = item.DateD ? formatDisplayDate(item.DateD) : formatDisplayDate(new Date()); // Fallback
        const safeNum = (val: any) => val ? parseFloat(val).toFixed(2) : '0.00';

        let rowContent = null;
        const cellTextStyle = [styles.cellText, { color: theme.text }];
        const cellBoldStyle = [styles.cellTextBold, { color: theme.text }];

        if (activeTab === 'SHIFT TIME') {
            const shiftCode = item.ShiftCodeC || item.ShiftCode || '-';
            const inTime = safeNum(item.TInN !== undefined ? item.TInN : item.InTimeN);
            const outTime = safeNum(item.TOutN !== undefined ? item.TOutN : item.OutTimeN);
            const reason = item.ReaCodeC || item.TMSRemarksC || item.Reason || item.ABS || '-';

            rowContent = (
                <>
                    <View style={[styles.cell, { flex: 1.2 }]}>
                        <Text style={cellBoldStyle}>{dateDisplay}</Text>
                    </View>
                    <View style={[styles.cell, { flex: 1 }]}>
                        <Text style={cellTextStyle}>{shiftCode}</Text>
                    </View>
                    <View style={[styles.cell, { flex: 0.8 }]}>
                        <Text style={cellTextStyle}>{inTime}</Text>
                    </View>
                    <View style={[styles.cell, { flex: 0.8 }]}>
                        <Text style={cellTextStyle}>{outTime}</Text>
                    </View>
                    <View style={[styles.cell, { flex: 1 }]}>
                        <Text style={cellTextStyle} numberOfLines={1}>{reason}</Text>
                    </View>
                </>
            );
        } else if (activeTab === 'OTHERS') {
            const actual = safeNum(item.ActN || item.Actual || item.ActHrs);
            const nrm = safeNum(item.NRMN || item.NRM || item.NrmHrs);
            const late = safeNum(item.LateN || item.Late);
            const under = safeNum(item.UnderN || item.Under);

            rowContent = (
                <>
                    <View style={[styles.cell, { flex: 1.2 }]}>
                        <Text style={cellBoldStyle}>{dateDisplay}</Text>
                    </View>
                    <View style={[styles.cell, { flex: 1 }]}>
                        <Text style={cellTextStyle}>{actual}</Text>
                    </View>
                    <View style={[styles.cell, { flex: 1 }]}>
                        <Text style={cellTextStyle}>{nrm}</Text>
                    </View>
                    <View style={[styles.cell, { flex: 1 }]}>
                        <Text style={cellTextStyle}>{late}</Text>
                    </View>
                    <View style={[styles.cell, { flex: 1 }]}>
                        <Text style={cellTextStyle}>{under}</Text>
                    </View>
                </>
            );
        } else /* OT HRS */ {
            const ot1 = safeNum(item.OTH1N || item.OT1N || item.OT1);
            const ot2 = safeNum(item.OTH2N || item.OT2N || item.OT2);
            const ot3 = safeNum(item.OTH3N || item.OT3N || item.OT3);
            const ot4 = safeNum(item.OTH4N || item.OT4N || item.OT4);

            rowContent = (
                <>
                    <View style={[styles.cell, { flex: 1.2 }]}>
                        <Text style={cellBoldStyle}>{dateDisplay}</Text>
                    </View>
                    <View style={[styles.cell, { flex: 0.8 }]}>
                        <Text style={cellTextStyle}>{ot1}</Text>
                    </View>
                    <View style={[styles.cell, { flex: 0.8 }]}>
                        <Text style={cellTextStyle}>{ot2}</Text>
                    </View>
                    <View style={[styles.cell, { flex: 0.8 }]}>
                        <Text style={cellTextStyle}>{ot3}</Text>
                    </View>
                    <View style={[styles.cell, { flex: 0.8 }]}>
                        <Text style={cellTextStyle}>{ot4}</Text>
                    </View>
                </>
            );
        }

        return (
            <View style={[styles.row, { borderColor: theme.inputBorder }, index % 2 === 0 ? { backgroundColor: theme.cardBackground } : { backgroundColor: theme.background }]}>
                {rowContent}
            </View>
        );
    };

    const renderListHeader = () => {
        const renderHeaderCell = (label: string, flexCb: number) => (
            <Text style={[styles.headerCell, { flex: flexCb, color: theme.secondary }]}>{label}</Text>
        );

        let headers = null;
        if (activeTab === 'SHIFT TIME') {
            headers = (
                <>
                    {renderHeaderCell('Date', 1.2)}
                    {renderHeaderCell('Shift', 1)}
                    {renderHeaderCell('In', 0.8)}
                    {renderHeaderCell('Out', 0.8)}
                    {renderHeaderCell('Reason', 1)}
                </>
            );
        } else if (activeTab === 'OTHERS') {
            headers = (
                <>
                    {renderHeaderCell('Date', 1.2)}
                    {renderHeaderCell('Actual', 1)}
                    {renderHeaderCell('NRM', 1)}
                    {renderHeaderCell('Late', 1)}
                    {renderHeaderCell('Under', 1)}
                </>
            );
        } else {
            headers = (
                <>
                    {renderHeaderCell('Date', 1.2)}
                    {renderHeaderCell('OT1', 0.8)}
                    {renderHeaderCell('OT2', 0.8)}
                    {renderHeaderCell('OT3', 0.8)}
                    {renderHeaderCell('OT4', 0.8)}
                </>
            );
        }

        return <View style={[styles.listHeader, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>{headers}</View>;
    };

    return (
        <View style={[styles.safeArea, { backgroundColor: theme.background }]}>
            <View style={[styles.listContainer, { backgroundColor: theme.cardBackground, flex: 1 }]}>
                <FlatList
                    ListHeaderComponent={() => (
                        <View>
                            {renderHeader()}
                            {renderTabs()}
                            {renderListHeader()}
                        </View>
                    )}
                    data={timeData}
                    renderItem={renderListItem}
                    keyExtractor={(item, index) => index.toString()}
                    refreshing={loading}
                    onRefresh={fetchTimeData}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="document-text-outline" size={64} color={theme.icon} />
                            <Text style={[styles.emptyText, { color: theme.placeholder }]}>No records found</Text>
                        </View>
                    }
                />
            </View>

            {/* Floating Action Button (FAB) for Requests */}
            <TouchableOpacity
                style={[styles.fab, { backgroundColor: theme.primary }]}
                onPress={() => setShowRequestModal(true)}
                activeOpacity={0.8}
            >
                <Ionicons name="add" size={30} color="#fff" />
            </TouchableOpacity>

            <TimeRequestModal
                visible={showRequestModal}
                onClose={() => setShowRequestModal(false)}
                onSuccess={() => {
                    setShowRequestModal(false);
                    fetchTimeData();
                    Alert.alert('Request Sent', 'Your time request has been sent successfully.');
                }}
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
    safeArea: {
        flex: 1,
    },
    headerWrapper: {
        backgroundColor: 'transparent',
    },
    headerContainer: {
        paddingTop: 10,
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
        borderRadius: 4,
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
        marginTop: 20, // Overlapping nicely if needed, but here simple flow
        marginHorizontal: 16,
        borderRadius: 4,
        padding: 4,
        // elevation: 2,
    },
    tabItem: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 4,
    },
    activeTabItem: {
        // backgroundColor: '#00838F', // Handled by theme.primary
    },
    tabText: {
        fontSize: 13,
        fontWeight: '600',
        // color: '#757575', // Handled by theme.textLight
    },
    activeTabText: {
        color: '#fff',
    },
    listContainer: {
        flex: 1,
        marginTop: 15,
        // marginHorizontal: 16,
        marginBottom: 0,
        // borderTopLeftRadius: 12,
        // borderTopRightRadius: 12,
        elevation: 2,
        overflow: 'hidden'
    },
    listHeader: {
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        // backgroundColor: '#E0F7FA', // Light Teal - Handled by theme.inputBg
        // borderBottomColor: '#B2EBF2', // Handled by theme.inputBorder
    },
    headerCell: {
        fontSize: 12,
        fontWeight: 'bold',
        // color: '#006064', // Handled by theme.secondary
        textAlign: 'center',
    },
    row: {
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        // borderColor: '#F1F1F1', // Handled by theme.inputBorder
        alignItems: 'center',
    },
    rowEven: {
        // backgroundColor: '#fff', // Handled by theme.cardBackground
    },
    rowOdd: {
        // backgroundColor: '#FAFAFA', // Handled by theme.background
    },
    cell: {
        justifyContent: 'center',
        alignItems: 'center', // Center align commonly better for data tables
    },
    cellText: {
        fontSize: 12,
        // color: '#424242', // Handled by theme.text
        textAlign: 'center'
    },
    cellTextBold: {
        fontSize: 12,
        fontWeight: '600',
        // color: '#333', // Handled by theme.text
    },
    emptyState: {
        alignItems: 'center',
        paddingTop: 50,
        opacity: 0.6
    },
    emptyText: {
        marginTop: 10,
        fontSize: 16,
        // color: '#888' // Handled by theme.placeholder
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        // backgroundColor: '#00838F', // Handled by theme.primary
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.27,
        shadowRadius: 4.65,
    }
});
