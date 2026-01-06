import DatePicker from '@/components/DatePicker';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { Stack, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlexAlignType,
    ScrollView,
    SectionList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { formatDateForApi, formatDisplayDate, formatTimeNumber } from '@/constants/timeFormat';
import { useProtectedBack } from '@/hooks/useProtectedBack';
import TimeRequestModal from '../../../components/TimeManage/TimeRequestModal';
import { useTheme } from '../../../context/ThemeContext';
import ApiService from '../../../services/ApiService';

/* ---------------- CONSTANTS ---------------- */

const ROW_HEIGHT = 44;
const TABLE_WIDTH = 780;

/* ---------------- TYPES ---------------- */

type ColumnDef = {
    key: string;
    label: string;
    flex: number;
    align: FlexAlignType;
};

/* ---------------- COLUMNS ---------------- */

const SHIFT_COLUMNS: ColumnDef[] = [
    { key: 'date', label: 'Date', flex: 2.5, align: 'flex-start' },
    { key: 'shift', label: 'Shift', flex: 1.6, align: 'center' },
    { key: 'in', label: 'In', flex: 1, align: 'flex-end' },
    { key: 'out', label: 'Out', flex: 1, align: 'flex-end' },
    { key: 'reason', label: 'Reason', flex: 1.2, align: 'flex-start' },
    { key: 'actual', label: 'Actual', flex: 1.2, align: 'flex-end' },
    { key: 'nrm', label: 'NRM', flex: 1, align: 'flex-end' },
    { key: 'late', label: 'Late', flex: 1, align: 'flex-end' },
    { key: 'under', label: 'Under', flex: 1, align: 'flex-end' },
    { key: 'ot1', label: 'OT1', flex: 1, align: 'flex-end' },
    { key: 'ot2', label: 'OT2', flex: 1, align: 'flex-end' },
    { key: 'ot3', label: 'OT3', flex: 1, align: 'flex-end' },
    { key: 'ot4', label: 'OT4', flex: 1, align: 'flex-end' },
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

    /* ---------------- TABLE HEADER ---------------- */

    const renderTableHeader = () => (
        <View
            style={[
                styles.tableRow,
                styles.headerRow,
                { backgroundColor: theme.inputBg },
            ]}
        >
            {SHIFT_COLUMNS.map(col => (
                <View
                    key={col.key}
                    style={[
                        styles.cell,
                        { flex: col.flex, alignItems: col.align },
                    ]}
                >
                    <Text
                        style={[
                            styles.headerText,
                            { color: theme.secondary },
                        ]}
                    >
                        {col.label}
                    </Text>
                </View>
            ))}
        </View>
    );

    /* ---------------- ROW ---------------- */

    const renderRow = ({ item, index }: any) => {
        const rowValues = [
            formatDisplayDate(item.DateD),
            item.ShiftCodeC,
            formatTimeNumber(item.TInN),
            formatTimeNumber(item.TOutN),
            item.ReaCodeC,
            formatTimeNumber(item.ActN),
            formatTimeNumber(item.NRMN),
            formatTimeNumber(item.LateN),
            formatTimeNumber(item.UnderN),
            formatTimeNumber(item.OTH1N),
            formatTimeNumber(item.OTH2N),
            formatTimeNumber(item.OTH3N),
            formatTimeNumber(item.OTH4N),
        ];

        return (
            <View
                style={[
                    styles.tableRow,
                    {
                        backgroundColor:
                            index % 2 === 0
                                ? theme.cardBackground
                                : theme.background,
                    },
                ]}
            >
                {rowValues.map((val, i) => (
                    <View
                        key={i}
                        style={[
                            styles.cell,
                            {
                                flex: SHIFT_COLUMNS[i].flex,
                                alignItems: SHIFT_COLUMNS[i].align,
                            },
                        ]}
                    >
                        <Text
                            style={[
                                styles.cellText,
                                { color: theme.text },
                            ]}
                        >
                            {val}
                        </Text>
                    </View>
                ))}
            </View>
        );
    };

    /* ---------------- RENDER ---------------- */

    return (
        <View style={[styles.safeArea, { backgroundColor: theme.background }]}>
            {renderHeader()}

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ width: TABLE_WIDTH }}>
                    {renderTableHeader()}

                    <SectionList
                        sections={[{ title: 'SHIFT TIME', data: timeData }]}
                        keyExtractor={(_, i) => i.toString()}
                        renderItem={renderRow}
                        renderSectionHeader={() => null}
                        refreshing={loading}
                        onRefresh={fetchTimeData}
                        stickySectionHeadersEnabled={false}
                        contentContainerStyle={{ paddingBottom: 120 }}
                    />
                </View>
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
