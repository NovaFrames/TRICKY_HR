import DatePicker from '@/components/DatePicker';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { Stack, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

import DynamicTable, { ColumnDef } from '@/components/DynamicTable';
import { formatDateForApi, formatDisplayDate, formatTimeNumber } from '@/constants/timeFormat';
import { useProtectedBack } from '@/hooks/useProtectedBack';
import TimeRequestModal from '../../../components/TimeManage/TimeRequestModal';
import { useTheme } from '../../../context/ThemeContext';
import ApiService from '../../../services/ApiService';

/* ---------------- CONSTANTS ---------------- */

const ROW_HEIGHT = 44;
const TABLE_WIDTH = 780;

const TIME_COLUMNS: ColumnDef[] = [
  { key: 'DateD', label: 'Date', flex: 2, align: 'flex-start', formatter: v => formatDisplayDate(v) },
  { key: 'ShiftCodeC', label: 'Shift', flex: 1.6, align: 'center' },
  { key: 'TInN', label: 'In', flex: 1, align: 'flex-end', formatter: v => formatTimeNumber(v) },
  { key: 'TOutN', label: 'Out', flex: 1, align: 'flex-end', formatter: v => formatTimeNumber(v) },
  { key: 'ReaCodeC', label: 'Reason', flex: 1.2, align: 'flex-start' },
  { key: 'ActN', label: 'Actual', flex: 1, align: 'flex-end', formatter: v => formatTimeNumber(v) },
  { key: 'NRMN', label: 'NRM', flex: 1, align: 'flex-end', formatter: v => formatTimeNumber(v) },
  { key: 'LateN', label: 'Late', flex: 1, align: 'flex-end', formatter: v => formatTimeNumber(v) },
  { key: 'UnderN', label: 'Under', flex: 1, align: 'flex-end', formatter: v => formatTimeNumber(v) },
  { key: 'OTH1N', label: 'OT1', flex: 1, align: 'flex-end', formatter: v => formatTimeNumber(v) },
  { key: 'OTH2N', label: 'OT2', flex: 1, align: 'flex-end', formatter: v => formatTimeNumber(v) },
  { key: 'OTH3N', label: 'OT3', flex: 1, align: 'flex-end', formatter: v => formatTimeNumber(v) },
  { key: 'OTH4N', label: 'OT4', flex: 1, align: 'flex-end', formatter: v => formatTimeNumber(v) },
];


/* ---------------- COMPONENT ---------------- */

export default function TimeManage() {
    const { theme } = useTheme();
    const router = useRouter();

    const [timeData, setTimeData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [downloading, setDownloading] = useState(false);

    const [fromDate, setFromDate] = useState(() => {
        const d = new Date();
        return new Date(d.getFullYear(), d.getMonth(), 1);
    });
    const [toDate, setToDate] = useState(new Date());

    useProtectedBack({
        home: '/home',
        settings: '/settings',
        dashboard: '/dashboard',
    });

    useEffect(() => {
        const d = new Date(fromDate);
        d.setDate(d.getDate() + 30);
        setToDate(d);
    }, [fromDate]);

    /* ---------------- API ---------------- */

    const fetchTimeData = async () => {
        setLoading(true);
        try {
            const res = await ApiService.getTimeManageList(
                formatDateForApi(fromDate),
                formatDateForApi(toDate),
            );
            if (res?.success) setTimeData(res.data || []);
            console.log("timemanageData: ", res.data);

        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTimeData();
    }, [fromDate, toDate]);


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

    /* ---------------- HEADER ---------------- */

    const renderHeader = () => (
        <>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.navBar}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>

                <Text style={[styles.navTitle, { color: theme.text }]}>
                    Time Management
                </Text>

                <TouchableOpacity onPress={handleDownload} disabled={downloading}>
                    {downloading ? (
                        <ActivityIndicator />
                    ) : (
                        <Ionicons
                            name="download-outline"
                            size={24}
                            color={theme.text}
                        />
                    )}
                </TouchableOpacity>
            </View>

            <View style={styles.datePickerSection}>
                <DatePicker
                    fromDate={fromDate}
                    toDate={toDate}
                    onFromChange={setFromDate}
                />
            </View>
        </>
    );

    /* ---------------- RENDER ---------------- */

    return (
        <View style={[styles.safeArea, { backgroundColor: theme.background }]}>
            {renderHeader()}

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {/* <View style={{ width: TABLE_WIDTH }}> */}

                    <DynamicTable
                        data={timeData}
                        columns={TIME_COLUMNS}   // remove this to auto-generate
                        theme={theme}
                        tableWidth={900}
                    />

                {/* </View> */}
            </ScrollView>

            <TouchableOpacity
                style={[styles.fab, { backgroundColor: theme.primary }]}
                onPress={() => setShowRequestModal(true)}
            >
                <Ionicons name="add" size={30} color="#fff" />
            </TouchableOpacity>

            <TimeRequestModal
                visible={showRequestModal}
                onClose={() => setShowRequestModal(false)}
                onSuccess={fetchTimeData}
            />
        </View>
    );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
    safeArea: { flex: 1 },

    navBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 12,
        alignItems: 'center',
    },

    navTitle: {
        fontSize: 17,
        fontWeight: '700',
    },

    datePickerSection: {
        paddingHorizontal: 8,
    },

    tableRow: {
        flexDirection: 'row',
        height: ROW_HEIGHT,
        minWidth: TABLE_WIDTH,
        borderBottomWidth: 1,
        borderColor: '#e5e7eb',
    },

    headerRow: {
        borderBottomWidth: 2,
    },

    cell: {
        justifyContent: 'center',
        paddingHorizontal: 8,
        borderRightWidth: 1,
        borderColor: '#e5e7eb',
    },

    headerText: {
        fontSize: 12,
        fontWeight: '700',
    },

    cellText: {
        fontSize: 11,
        fontWeight: '500',
    },

    fab: {
        position: 'absolute',
        bottom: 60,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
    },
});
