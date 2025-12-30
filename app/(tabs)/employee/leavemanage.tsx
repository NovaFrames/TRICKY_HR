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
        <View key={leave.ReaGrpNameC} style={styles.card}>
            {/* Header: Leave Name + Balance */}
            <View style={styles.cardHeader}>
                <View style={styles.headerLeft}>
                    <Icon name="event-note" size={20} color="#005662" />
                    <Text style={styles.cardTitle}>{leave.ReaGrpNameC}</Text>
                </View>
                <View style={styles.balanceBadge}>
                    <Text style={styles.balanceLabel}>BAL</Text>
                    <Text style={styles.balanceValue}>{leave.formattedBalance}</Text>
                </View>
            </View>

            <View style={styles.divider} />

            {/* Grid Stats */}
            <View style={styles.statsContainer}>
                {/* Column 1 */}
                <View style={styles.statsColumn}>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Eligible</Text>
                        <Text style={styles.statValue}>{leave.formattedEligible}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Credit</Text>
                        <Text style={styles.statValue}>{leave.formattedCredit}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Surrendered</Text>
                        <Text style={styles.statValue}>{leave.formattedSurrender}</Text>
                    </View>
                </View>

                {/* Column 2 */}
                <View style={styles.statsColumn}>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>B/F</Text>
                        <Text style={styles.statValue}>{leave.formattedBF}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Earned</Text>
                        <Text style={styles.statValue}>{leave.formattedEarn}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Total</Text>
                        <Text style={styles.statValue}>{leave.formattedTotal}</Text>
                    </View>
                </View>

                {/* Column 3 */}
                <View style={styles.statsColumn}>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Requested</Text>
                        <Text style={styles.statValue}>{leave.formattedRequest}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Taken</Text>
                        <Text style={styles.statValue}>{leave.formattedTaken}</Text>
                    </View>
                </View>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#00838F" />
                <Text style={styles.loadingText}>Loading leave data...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#00838F" />

            {/* Modern Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="arrow-back-ios" size={20} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Leave Management</Text>
                <View style={styles.headerRight}>
                    {/* Placeholder for future actions */}
                </View>
            </View>

            {/* Leave List */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {formattedLeaves.map(renderLeaveCard)}
                <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* Floating Action Bar */}
            <View style={styles.floatingActionBar}>
                <TouchableOpacity
                    style={[styles.fabButton, styles.fabSurrender, !canSurrender && styles.disabledButton]}
                    onPress={() => canSurrender && setShowSurrenderModal(true)}
                    activeOpacity={0.8}
                    disabled={!canSurrender}
                >
                    <Icon name="history" size={20} color={canSurrender ? "#00838F" : "#999"} />
                    <Text style={[styles.fabText, !canSurrender && styles.disabledText]}>Surrender</Text>
                </TouchableOpacity>

                <View style={styles.fabDivider} />

                <TouchableOpacity
                    style={[styles.fabButton, styles.fabApply]}
                    onPress={() => setShowApplyModal(true)}
                >
                    <Icon name="add-circle-outline" size={20} color="#fff" />
                    <Text style={[styles.fabText, styles.fabTextPrimary]}>Apply Leave</Text>
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
        backgroundColor: '#F5F7FA', // Light Gray-Blue Background
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F7FA',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#546E7A',
        fontWeight: '500',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#00838F', // Teal 800
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#fff',
        letterSpacing: 0.5,
    },
    headerRight: {
        width: 40,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 100, // Space for FAB
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 16,
        padding: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.02)',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#37474F', // Blue Grey 800
        marginLeft: 8,
        textTransform: 'uppercase',
        flex: 1,
    },
    balanceBadge: {
        backgroundColor: '#E0F7FA', // Cyan 50
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#B2EBF2',
    },
    balanceLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: '#006064', // Cyan 900
        marginRight: 4,
        opacity: 0.7,
    },
    balanceValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#00838F',
    },
    divider: {
        height: 1,
        backgroundColor: '#ECEFF1',
        marginBottom: 12,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statsColumn: {
        flex: 1,
    },
    statItem: {
        marginBottom: 8,
    },
    statLabel: {
        fontSize: 11,
        color: '#90A4AE', // Blue Grey 300
        marginBottom: 2,
        fontWeight: '500',
    },
    statValue: {
        fontSize: 13,
        color: '#455A64', // Blue Grey 700
        fontWeight: '600',
    },
    bottomSpacer: {
        height: 20,
    },
    floatingActionBar: {
        position: 'absolute',
        bottom: 24,
        left: 20,
        right: 20,
        backgroundColor: '#fff',
        borderRadius: 30,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 6,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
    },
    fabButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 24,
    },
    fabSurrender: {
        backgroundColor: 'transparent',
    },
    fabApply: {
        backgroundColor: '#00838F',
    },
    fabDivider: {
        width: 1,
        height: 24,
        backgroundColor: '#ECEFF1',
        marginHorizontal: 4,
    },
    fabText: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 6,
        color: '#00838F',
    },
    fabTextPrimary: {
        color: '#fff',
    },
    disabledButton: {
        opacity: 0.6,
    },
    disabledText: {
        color: '#CFD8DC',
    },
});

export default LeaveApply;