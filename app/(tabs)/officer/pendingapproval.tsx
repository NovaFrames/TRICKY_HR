import { useProtectedBack } from '@/hooks/useProtectedBack';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import PendingApprovalModal from '../../../components/PendingApproval/PendingApprovalModal';
import { useTheme } from '../../../context/ThemeContext';
import ApiService from '../../../services/ApiService';

interface PendingApproval {
    IdN: number;
    EmpIdN: number;
    CodeC: string;              // Employee Code
    NameC: string;              // Employee Name
    CatgNameC: string;          // Category Name
    YearN: number;
    ApplyDateD: string;         // Apply Date
    ApproveRejDateD: string;    // Approve/Reject Date
    DescC: string;              // Description (Type: Claim, Leave, etc.)
    StatusC: string;            // Status (Waiting, Approved, Rejected)
    LvDescC: string | null;     // Leave Description
    FromDateC: string;          // From Date
    ToDateC: string;            // To Date
    EmpRemarksC: string;        // Employee Remarks
    ApproveRemarkC: string;     // Approve Remark
    LeaveDaysN: number | null;  // Leave Days
    Approve1C: string | null;
    Approve2C: string | null;
    FinalApproveC: string | null;
}

type TabType = 'your' | 'other';

export default function PendingApproval() {
    const { theme } = useTheme();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>('your');
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    // Your pending approvals
    const [yourPendings, setYourPendings] = useState<PendingApproval[]>([]);

    // Other pending approvals
    const [otherPendings, setOtherPendings] = useState<PendingApproval[]>([]);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<PendingApproval | null>(null);
    const [updating, setUpdating] = useState(false);

    useProtectedBack({
        home: '/home',
        settings: '/settings',
        dashboard: '/dashboard',
    });

    useEffect(() => {
        fetchPendingApprovals();
    }, [activeTab]);

    const fetchPendingApprovals = async () => {
        setLoading(true);
        try {
            if (activeTab === 'your') {
                const result = await ApiService.getYourPendingApprovals();
                if (result.success && result.data) {
                    console.log('Your Pending Data:', JSON.stringify(result.data[0], null, 2));
                    setYourPendings(result.data);
                } else {
                    Alert.alert('Error', result.error || 'Failed to fetch your pending approvals');
                }
            } else {
                const result = await ApiService.getOtherPendingApprovals();
                if (result.success && result.data) {
                    console.log('Other Pending Data:', JSON.stringify(result.data[0], null, 2));
                    setOtherPendings(result.data);
                } else {
                    Alert.alert('Error', result.error || 'Failed to fetch other pending approvals');
                }
            }
        } catch (error: any) {
            Alert.alert('Error', error?.message || 'Failed to fetch pending approvals');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchPendingApprovals();
        setRefreshing(false);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '';

        // Handle /Date(milliseconds)/ format from Android
        const match = dateString.match(/\/Date\((\d+)\)\//);
        if (match) {
            const millis = parseInt(match[1]);
            const date = new Date(millis);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: '2-digit'
            });
        }

        // Handle regular date string
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit'
        });
    };

    const getStatusIcon = (status?: string) => {
        if (!status) return 'alert-circle';

        switch (status.toLowerCase()) {
            case 'waiting':
            case 'pending':
                return 'alert-circle';
            case 'approved':
                return 'checkmark-circle';
            case 'rejected':
                return 'close-circle';
            default:
                return 'alert-circle';
        }
    };

    const getStatusColor = (status?: string) => {
        if (!status) return '#FF9800';

        switch (status.toLowerCase()) {
            case 'waiting':
            case 'pending':
                return '#FF9800';
            case 'approved':
                return '#4CAF50';
            case 'rejected':
                return '#F44336';
            default:
                return '#FF9800';
        }
    };

    const handleItemPress = (index: number, item: PendingApproval) => {
        setSelectedIndex(index);
        setSelectedItem(item);
        setShowModal(true);
    };

    const handleUpdateApproval = async (status: string, remarks: string) => {
        if (!selectedItem) return;

        setUpdating(true);
        try {
            const result = await ApiService.updatePendingApproval({
                IdN: selectedItem.IdN,
                StatusC: status,
                ApproveRemarkC: remarks,
            });

            if (result.success) {
                Alert.alert('Success', `Request ${status.toLowerCase()} successfully`, [
                    {
                        text: 'OK',
                        onPress: () => {
                            setShowModal(false);
                            setSelectedItem(null);
                            fetchPendingApprovals();
                        },
                    },
                ]);
            } else {
                Alert.alert('Error', result.error || 'Failed to update approval');
            }
        } catch (error: any) {
            Alert.alert('Error', error?.message || 'Failed to update approval');
        } finally {
            setUpdating(false);
        }
    };

    const renderPendingItem = ({ item, index }: { item: PendingApproval; index: number }) => {
        const isSelected = selectedIndex === index;
        const statusColor = getStatusColor(item.StatusC);
        const statusIcon = getStatusIcon(item.StatusC);

        // Create period string from FromDateC and ToDateC
        const period = item.FromDateC && item.ToDateC
            ? `${item.FromDateC} - ${item.ToDateC}`
            : '';

        return (
            <TouchableOpacity
                style={[
                    styles.pendingCard,
                    {
                        backgroundColor: isSelected ? theme.inputBorder : theme.cardBackground,
                        borderColor: theme.inputBorder,
                    },
                ]}
                onPress={() => handleItemPress(index, item)}
                activeOpacity={0.7}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.employeeInfo}>
                        <Text style={[styles.employeeName, { color: theme.text }]}>
                            {item.NameC || 'N/A'}
                        </Text>
                        <Text style={[styles.employeeCode, { color: theme.placeholder }]}>
                            Emp code: {item.CodeC || 'N/A'}
                        </Text>
                        <Text style={[styles.reqDate, { color: theme.placeholder }]}>
                            Req Date: {item.ApplyDateD ? formatDate(item.ApplyDateD) : 'N/A'}
                        </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                        <Ionicons name={statusIcon} size={20} color={statusColor} />
                    </View>
                </View>

                {period && (
                    <View style={styles.periodContainer}>
                        <Ionicons name="arrow-up" size={16} color={theme.placeholder} />
                        <Text style={[styles.period, { color: theme.text }]}>
                            {period}
                        </Text>
                    </View>
                )}

                <Text style={[styles.description, { color: theme.text }]} numberOfLines={2}>
                    {item.LvDescC || item.DescC || 'No description'}
                </Text>

                {item.EmpRemarksC && (
                    <Text style={[styles.remarks, { color: theme.placeholder }]} numberOfLines={1}>
                        Amount: ₹{item.EmpRemarksC}
                    </Text>
                )}

                <View style={styles.cardFooter}>
                    <View style={[styles.typeContainer, { backgroundColor: theme.inputBorder }]}>
                        <Text style={[styles.typeText, { color: theme.text }]}>
                            {item.DescC || 'Request'}
                        </Text>
                    </View>
                    <View style={[styles.statusContainer, { backgroundColor: statusColor + '15' }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>
                            {item.StatusC || 'Pending'}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color={theme.placeholder} />
            <Text style={[styles.emptyText, { color: theme.placeholder }]}>
                No pending approvals
            </Text>
        </View>
    );

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={styles.navBar}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.navTitle, { color: theme.text }]}>Pending Approval</Text>
                <View style={styles.iconButton} />
            </View>

            {/* Tabs */}
            <View style={[styles.tabContainer, { backgroundColor: theme.cardBackground }]}>
                <TouchableOpacity
                    style={[
                        styles.tab,
                        activeTab === 'your' && styles.activeTab,
                        activeTab === 'your' && { borderBottomColor: theme.primary },
                    ]}
                    onPress={() => setActiveTab('your')}
                >
                    <Text
                        style={[
                            styles.tabText,
                            { color: activeTab === 'your' ? theme.primary : theme.placeholder },
                        ]}
                    >
                        YOUR PENDING
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.tab,
                        activeTab === 'other' && styles.activeTab,
                        activeTab === 'other' && { borderBottomColor: theme.primary },
                    ]}
                    onPress={() => setActiveTab('other')}
                >
                    <Text
                        style={[
                            styles.tabText,
                            { color: activeTab === 'other' ? theme.primary : theme.placeholder },
                        ]}
                    >
                        OTHER PENDING
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const currentData = activeTab === 'your' ? yourPendings : otherPendings;

    if (loading && !refreshing) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                {renderHeader()}
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={[styles.loadingText, { color: theme.text }]}>Loading...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {renderHeader()}

            <FlatList
                data={currentData}
                keyExtractor={(item, index) => `${item.IdN}-${index}`}
                renderItem={renderPendingItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={renderEmptyState}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={[theme.primary]}
                        tintColor={theme.primary}
                    />
                }
            />

            {/* Approval Modal */}
            <PendingApprovalModal
                visible={showModal}
                onClose={() => {
                    setShowModal(false);
                    setSelectedItem(null);
                }}
                onUpdate={handleUpdateApproval}
                data={selectedItem}
                loading={updating}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerContainer: {
        paddingTop: 10,
        paddingBottom: 0,
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
    tabContainer: {
        flexDirection: 'row',
        marginTop: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    tab: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomWidth: 2,
    },
    tabText: {
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
    },
    listContent: {
        padding: 16,
        paddingBottom: 32,
    },
    pendingCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    employeeInfo: {
        flex: 1,
    },
    employeeName: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    employeeCode: {
        fontSize: 13,
        marginBottom: 2,
    },
    reqDate: {
        fontSize: 13,
    },
    statusBadge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    periodContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 4,
    },
    period: {
        fontSize: 14,
        fontWeight: '600',
    },
    description: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 12,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 8,
    },
    remarks: {
        fontSize: 13,
        marginBottom: 8,
        fontWeight: '600',
    },
    typeContainer: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    typeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    statusContainer: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'capitalize',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        marginTop: 16,
    },
});
