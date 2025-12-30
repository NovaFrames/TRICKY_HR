// LeaveApply.tsx
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ApplyLeaveModal from '../../../components/LeaveApply/ApplyLeaveModal';
import SurrenderLeaveModal from '../../../components/LeaveApply/SurrenderLeaveModal';
import ApiService, { AvailableLeaveType, LeaveBalanceResponse, LeaveType } from '../../../services/ApiService';

interface FormattedLeaveType extends LeaveType {
    formattedBalance: string;
    formattedEligible: string;
    formattedCredit: string;
    formattedSurrender: string;
    formattedBF: string;
    formattedEarn: string;
    formattedTotal: string;
    formattedRequest: string;
    formattedTaken: string;
}

const LeaveApply: React.FC = () => {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(true);
    const [leaveData, setLeaveData] = useState<LeaveBalanceResponse | null>(null);
    const [formattedLeaves, setFormattedLeaves] = useState<FormattedLeaveType[]>([]);
    const [availableLeaves, setAvailableLeaves] = useState<AvailableLeaveType[]>([]);
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [showSurrenderModal, setShowSurrenderModal] = useState(false);
    const [canSurrender, setCanSurrender] = useState(false);

    useEffect(() => {
        loadLeaveData();
    }, []);

    const loadLeaveData = async () => {
        try {
            setLoading(true);
            const result = await ApiService.getLeaveDetails();

            console.log('Leave API Result:', JSON.stringify(result, null, 2));

            if (result.success && result.data) {
                setLeaveData(result.data);
                setCanSurrender(result.data.LVSurrenderN === 1);

                if (result.data.data && Array.isArray(result.data.data) && result.data.data.length > 0) {
                    // Format leave data
                    const formatted = result.data.data[0].EmpLeaveApply.map(formatLeaveData);
                    setFormattedLeaves(formatted);
                    setAvailableLeaves(result.data.data[0].Reason);
                } else {
                    console.log('Leave data array is missing or empty');
                }
            } else {
                console.log('Leave API failed:', result.error);
                Alert.alert('Error', result.error || 'Failed to load leave data');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to load leave data');
        } finally {
            setLoading(false);
        }
    };

    const formatLeaveData = (leave: LeaveType): FormattedLeaveType => {
        if (leave.ReaGrpIdN === -3) {
            // Format as HH:MM (e.g., 3:00 for PERMISION)
            return {
                ...leave,
                formattedBalance: formatToHHMM(leave.BalanceN),
                formattedEligible: formatToHHMM(leave.EligibleN),
                formattedCredit: formatToHHMM(leave.CreditN),
                formattedSurrender: formatToHHMM(leave.LVSurrenderN),
                formattedBF: formatToHHMM(leave.BFN),
                formattedEarn: formatToHHMM(leave.ALEarnN),
                formattedTotal: formatToHHMM(leave.ALTotalN),
                formattedRequest: formatToHHMM(leave.RequestN),
                formattedTaken: formatToHHMM(leave.TakenN),
            };
        } else if (leave.HrlN === 1) {
            // Format as DD.HH:MM (e.g., 10.00:00 for ONDUTY)
            return {
                ...leave,
                formattedBalance: formatToDDHHMM(leave.BalanceN),
                formattedEligible: formatToDDHHMM(leave.EligibleN),
                formattedCredit: formatToDDHHMM(leave.CreditN),
                formattedSurrender: formatToDDHHMM(leave.LVSurrenderN),
                formattedBF: formatToDDHHMM(leave.BFN),
                formattedEarn: formatToDDHHMM(leave.ALEarnN),
                formattedTotal: formatToDDHHMM(leave.ALTotalN),
                formattedRequest: formatToDDHHMM(leave.RequestN),
                formattedTaken: formatToDDHHMM(leave.TakenN),
            };
        } else {
            // Format as decimal (e.g., 21.00 for CASUAL LEAVE)
            return {
                ...leave,
                formattedBalance: leave.BalanceN.toFixed(2),
                formattedEligible: leave.EligibleN.toFixed(2),
                formattedCredit: leave.CreditN.toFixed(2),
                formattedSurrender: leave.LVSurrenderN.toFixed(2),
                formattedBF: leave.BFN.toFixed(2),
                formattedEarn: leave.ALEarnN.toFixed(2),
                formattedTotal: leave.ALTotalN.toFixed(2),
                formattedRequest: leave.RequestN.toFixed(2),
                formattedTaken: leave.TakenN.toFixed(2),
            };
        }
    };

    const formatToHHMM = (value: number): string => {
        const hours = Math.floor(value);
        const minutes = Math.round((value - hours) * 60);
        return `${hours}:${minutes.toString().padStart(2, '0')}`;
    };

    const formatToDDHHMM = (value: number): string => {
        const days = Math.floor(value);
        const hours = Math.floor((value - days) * 100);
        const minutes = Math.round(((value - days) * 100 - hours) * 60);
        return `${days}.${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    const handleLeaveApplied = () => {
        setShowApplyModal(false);
        loadLeaveData(); // Refresh data
    };

    const handleSurrenderSubmitted = () => {
        setShowSurrenderModal(false);
        loadLeaveData(); // Refresh data
    };

    const renderLeaveCard = (leave: FormattedLeaveType) => (
        <View key={leave.ReaGrpNameC} style={styles.leaveBlock}>
            {/* Header: Leave Name + Balance */}
            <View style={styles.blockHeader}>
                <Text style={styles.leaveTitle}>{leave.ReaGrpNameC}</Text>
                <Text style={styles.leaveBalanceText}>Balance : {leave.formattedBalance}</Text>
            </View>

            {/* Grid Row 1 */}
            <View style={styles.gridRow}>
                <View style={styles.gridCell}>
                    <Text style={styles.gridLabel}>Elig.. :</Text>
                    <Text style={styles.gridValue}>{leave.formattedEligible}</Text>
                </View>
                <View style={styles.gridCell}>
                    <Text style={styles.gridLabel}>Credit :</Text>
                    <Text style={styles.gridValue}>{leave.formattedCredit}</Text>
                </View>
                <View style={styles.gridCell}>
                    <Text style={styles.gridLabel}>Surre.. :</Text>
                    <Text style={styles.gridValue}>{leave.formattedSurrender}</Text>
                </View>
                <View style={[styles.gridCell, styles.lastCell]}>
                    <Text style={styles.gridLabel}>B/F :</Text>
                    <Text style={styles.gridValue}>{leave.formattedBF}</Text>
                </View>
            </View>

            {/* Grid Row 2 */}
            <View style={[styles.gridRow, styles.lastRow]}>
                <View style={styles.gridCell}>
                    <Text style={styles.gridLabel}>Earn :</Text>
                    <Text style={styles.gridValue}>{leave.formattedEarn}</Text>
                </View>
                <View style={styles.gridCell}>
                    <Text style={styles.gridLabel}>Total :</Text>
                    <Text style={styles.gridValue}>{leave.formattedTotal}</Text>
                </View>
                <View style={styles.gridCell}>
                    <Text style={styles.gridLabel}>Request :</Text>
                    <Text style={styles.gridValue}>{leave.formattedRequest}</Text>
                </View>
                <View style={[styles.gridCell, styles.lastCell]}>
                    <Text style={styles.gridLabel}>Taken :</Text>
                    <Text style={styles.gridValue}>{leave.formattedTaken}</Text>
                </View>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading leave data...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0091EA" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Leave Manage</Text>
                <View style={styles.headerRight}>
                    <View style={styles.headerIcons}>
                        <Icon name="phone" size={20} color="#fff" style={{ marginRight: 15 }} />
                        <Icon name="signal-cellular-alt" size={20} color="#fff" />
                    </View>
                </View>
            </View>

            {/* Leave List */}
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {formattedLeaves.map(renderLeaveCard)}

                <View style={{ height: 20 }} />
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.actionContainer}>
                {/* Always show both buttons as per image, handle disabled state if needed */}
                <TouchableOpacity
                    style={[styles.actionButton, styles.surrenderButton]}
                    onPress={() => canSurrender && setShowSurrenderModal(true)}
                    activeOpacity={0.8}
                >
                    <Text style={styles.actionButtonText}>Leave Surrender</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, styles.applyButton]}
                    onPress={() => setShowApplyModal(true)}
                    activeOpacity={0.8}
                >
                    <Text style={styles.actionButtonText}>Leave Request</Text>
                </TouchableOpacity>
            </View>

            {/* Modals */}
            {showApplyModal && (
                <ApplyLeaveModal
                    visible={showApplyModal}
                    onClose={() => setShowApplyModal(false)}
                    onSuccess={handleLeaveApplied}
                    availableLeaves={availableLeaves}
                    leaveData={leaveData}
                />
            )}

            {showSurrenderModal && (
                <SurrenderLeaveModal
                    visible={showSurrenderModal}
                    onClose={() => setShowSurrenderModal(false)}
                    onSuccess={handleSurrenderSubmitted}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 15,
        backgroundColor: '#0091EA', // Light Blue Header
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '500',
        color: '#fff',
        marginLeft: 16,
        flex: 1,
    },
    headerRight: {
        // width: 32,
    },
    headerIcons: {
        flexDirection: 'row',
    },
    scrollView: {
        flex: 1,
        backgroundColor: '#fff',
    },
    leaveBlock: {
        marginBottom: 0,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    blockHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#F5FCFF', // Very light blue/white bg for header
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    leaveTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#00796B', // Teal color
        textTransform: 'uppercase',
    },
    leaveBalanceText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#0277BD', // Blue color
    },
    gridRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    lastRow: {
        borderBottomWidth: 0,
    },
    gridCell: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 4,
        alignItems: 'center', // Center content horizontally? Image looks like Row: "Label : Value"
        justifyContent: 'center',
        borderRightWidth: 1,
        borderRightColor: '#f0f0f0',
        flexDirection: 'row', // Label and Value in one line
        flexWrap: 'wrap',
    },
    lastCell: {
        borderRightWidth: 0,
    },
    gridLabel: {
        fontSize: 11,
        color: '#333',
        fontWeight: '600',
        marginRight: 4,
    },
    gridValue: {
        fontSize: 11,
        color: '#666',
    },
    actionContainer: {
        flexDirection: 'row',
        padding: 0,
        backgroundColor: '#fff',
    },
    actionButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        backgroundColor: '#008CBA', // Blue Button
    },
    surrenderButton: {
        backgroundColor: '#008CBA',
        borderRightWidth: 1,
        borderRightColor: '#fff', // Separator if needed
    },
    applyButton: {
        backgroundColor: '#008CBA',
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
});

export default LeaveApply;