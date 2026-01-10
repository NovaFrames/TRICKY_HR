import AppModal from '@/components/common/AppModal';
import DynamicTable, { ColumnDef } from '@/components/DynamicTable';
import { XMLParser } from 'fast-xml-parser';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import ApiService from '../../services/ApiService';

interface Props {
    visible: boolean;
    onClose: () => void;
    empId: number;
    empName: string;
}

// Helper functions for formatting
const formatToHHMM = (value: number): string => {
    const hours = Math.floor(value || 0);
    const minutes = Math.round(((value || 0) - hours) * 60);
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
};

const formatToDDHHMM = (value: number): string => {
    const days = Math.floor(value || 0);
    const hours = Math.floor(((value || 0) - days) * 100);
    const minutes = Math.round((((value || 0) - days) * 100 - hours) * 60);
    return `${days}.${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const formatLeaveValue = (value: unknown, row: any): string => {
    const numValue = Number(value) || 0;

    if (row.ReaGrpIdN === -3) {
        return formatToHHMM(numValue);
    } else if (row.HrlN === 1) {
        return formatToDDHHMM(numValue);
    } else {
        return numValue.toFixed(2);
    }
};

const COLUMNS: ColumnDef[] = [
    { key: 'ReaGrpNameC', label: 'Leave Group', flex: 2, align: 'flex-start' },
    { key: 'EligibleN', label: 'Eligible', flex: 1, align: 'flex-end', formatter: formatLeaveValue },
    { key: 'BFN', label: 'B/F', flex: 1, align: 'flex-end', formatter: formatLeaveValue },
    { key: 'CreditN', label: 'Credit', flex: 1, align: 'flex-end', formatter: formatLeaveValue },
    { key: 'ALEarnN', label: 'Earn', flex: 1, align: 'flex-end', formatter: formatLeaveValue },
    { key: 'ALTotalN', label: 'Total', flex: 1, align: 'flex-end', formatter: formatLeaveValue },
    { key: 'TakenN', label: 'Taken', flex: 1, align: 'flex-end', formatter: formatLeaveValue },
    { key: 'BalanceN', label: 'Balance', flex: 1, align: 'flex-end', formatter: formatLeaveValue },
];

export default function EmployeeLeaveBalance({ visible, onClose, empId, empName }: Props) {
    const { theme } = useTheme();
    const [loading, setLoading] = useState(false);
    const [balanceData, setBalanceData] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (visible && empId) {
            fetchBalance();
        }
    }, [visible, empId]);

    const fetchBalance = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await ApiService.getLeaveApprovalDetails({ IdN: empId });
            if (result.success && result.data) {
                let data = (result.data as any).data;

                // Handle XML string response
                if (typeof data === 'string' && data.includes('<NewDataSet>')) {
                    try {
                        const parser = new XMLParser();
                        const parsed = parser.parse(data);
                        if (parsed.NewDataSet && parsed.NewDataSet.Table) {
                            data = parsed.NewDataSet.Table;
                        } else {
                            data = [];
                        }
                    } catch (e) {
                        console.error("XML Parsing Error:", e);
                        data = []; // Fallback
                    }
                }

                const list = Array.isArray(data) ? data : (data ? [data] : []);
                setBalanceData(list);
            } else {
                setError(result.error || 'Failed to fetch leave balance');
            }
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppModal
            visible={visible}
            onClose={onClose}
            title="Leave Balance"
            subtitle={`${empName} (${empId})`}
        >
            <View style={styles.content}>
                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color={theme.primary} />
                        <Text style={{ color: theme.text, marginTop: 10 }}>Loading...</Text>
                    </View>
                ) : error ? (
                    <View style={styles.center}>
                        <Text style={{ color: 'red', marginBottom: 10 }}>{error}</Text>
                        <TouchableOpacity
                            style={[styles.retryButton, { backgroundColor: theme.primary }]}
                            onPress={fetchBalance}
                        >
                            <Text style={{ color: '#fff' }}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <DynamicTable
                        data={balanceData}
                        columns={COLUMNS}
                        tableWidth={800} // Wide table for many columns
                        theme={theme}
                    />
                )}
            </View>
        </AppModal>
    );
}

const styles = StyleSheet.create({
    content: {
        padding: 0,
        minHeight: 200,
    },
    center: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        minHeight: 200
    },
    retryButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 4,
    },
});
