// LeaveApply.tsx
import Header from '@/components/Header';
import { useProtectedBack } from '@/hooks/useProtectedBack';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
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
import ApplyLeaveModal from '../../../components/LeaveApply/ApplyLeaveModal';
import SurrenderLeaveModal from '../../../components/LeaveApply/SurrenderLeaveModal';
import { useTheme } from '../../../context/ThemeContext';
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
    const { theme } = useTheme();
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

    useProtectedBack({
        home: '/home',
        settings: '/settings',
        dashboard: '/dashboard',
    });

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

    // Style Refs
    const cardStyle = [styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.inputBorder }];
    const labelStyle = [styles.statLabel, { color: theme.placeholder }];
    const valueStyle = [styles.statValue, { color: theme.text }];

    const renderLeaveCard = (leave: FormattedLeaveType) => (
        <View key={leave.ReaGrpNameC} style={cardStyle}>
            {/* Header: Leave Name + Balance */}
            <View style={styles.cardHeader}>
                <View style={styles.headerLeft}>
                    <Icon name="event-note" size={20} color={theme.primary} />
                    <Text style={[styles.cardTitle, { color: theme.text }]}>{leave.ReaGrpNameC}</Text>
                </View>
                <View style={[styles.balanceBadge, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                    <Text style={[styles.balanceLabel, { color: theme.secondary }]}>BAL</Text>
                    <Text style={[styles.balanceValue, { color: theme.primary }]}>{leave.formattedBalance}</Text>
                </View>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.inputBorder }]} />

            {/* Grid Stats */}
            <View style={styles.statsContainer}>
                {/* Column 1 */}
                <View style={styles.statsColumn}>
                    <View style={styles.statItem}>
                        <Text style={labelStyle}>Eligible</Text>
                        <Text style={valueStyle}>{leave.formattedEligible}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={labelStyle}>Credit</Text>
                        <Text style={valueStyle}>{leave.formattedCredit}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={labelStyle}>Surrendered</Text>
                        <Text style={valueStyle}>{leave.formattedSurrender}</Text>
                    </View>
                </View>

                {/* Column 2 */}
                <View style={styles.statsColumn}>
                    <View style={styles.statItem}>
                        <Text style={labelStyle}>B/F</Text>
                        <Text style={valueStyle}>{leave.formattedBF}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={labelStyle}>Earned</Text>
                        <Text style={valueStyle}>{leave.formattedEarn}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={labelStyle}>Total</Text>
                        <Text style={valueStyle}>{leave.formattedTotal}</Text>
                    </View>
                </View>

                {/* Column 3 */}
                <View style={styles.statsColumn}>
                    <View style={styles.statItem}>
                        <Text style={labelStyle}>Requested</Text>
                        <Text style={valueStyle}>{leave.formattedRequest}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={labelStyle}>Taken</Text>
                        <Text style={valueStyle}>{leave.formattedTaken}</Text>
                    </View>
                </View>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.loadingText, { color: theme.text }]}>Loading leave data...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>

            {/* Leave List */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Modern Header */}
                <Header title="Leave Management" />

                {formattedLeaves.map(renderLeaveCard)}
                <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* Floating Action Bar */}
            <View style={[styles.floatingActionBar, { backgroundColor: theme.cardBackground }]}>
                <TouchableOpacity
                    style={[styles.fabButton, styles.fabSurrender, !canSurrender && styles.disabledButton]}
                    onPress={() => canSurrender && setShowSurrenderModal(true)}
                    activeOpacity={0.8}
                    disabled={!canSurrender}
                >
                    <Icon name="history" size={20} color={canSurrender ? theme.primary : theme.icon} />
                    <Text style={[styles.fabText, !canSurrender && styles.disabledText, { color: canSurrender ? theme.primary : theme.icon }]}>Surrender</Text>
                </TouchableOpacity>

                <View style={[styles.fabDivider, { backgroundColor: theme.inputBorder }]} />

                <TouchableOpacity
                    style={[styles.fabButton, styles.fabApply, { backgroundColor: theme.primary }]}
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
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        fontWeight: '500',
    },
    navBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    navTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    iconButton: {
        padding: 8,
    },
    headerRight: {
        width: 40,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 120, // Space for nav + FAB
    },
    card: {
        borderRadius: 4,
        marginBottom: 16,
        padding: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderWidth: 1,
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
        marginLeft: 8,
        textTransform: 'uppercase',
        flex: 1,
    },
    balanceBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
    },
    balanceLabel: {
        fontSize: 10,
        fontWeight: '600',
        marginRight: 4,
        opacity: 0.7,
    },
    balanceValue: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    divider: {
        height: 1,
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
        marginBottom: 2,
        fontWeight: '500',
    },
    statValue: {
        fontSize: 13,
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
        borderRadius: 4,
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
        borderRadius: 4,
    },
    fabSurrender: {
        backgroundColor: 'transparent',
    },
    fabApply: {
        // backgroundColor: set via theme.primary
    },
    fabDivider: {
        width: 1,
        height: 24,
        marginHorizontal: 4,
    },
    fabText: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 6,
    },
    fabTextPrimary: {
        color: '#fff',
    },
    disabledButton: {
        opacity: 0.6,
    },
    disabledText: {
        // color handled via prop
    },
});

export default LeaveApply;