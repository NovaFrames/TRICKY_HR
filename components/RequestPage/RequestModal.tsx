import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import ApiService from '../../services/ApiService';
import AppModal from '../common/AppModal';

interface RequestModalProps {
    visible: boolean;
    onClose: () => void;
    item: any;
    onRefresh?: () => void;
}

const RequestModal: React.FC<RequestModalProps> = ({ visible, onClose, item, onRefresh }) => {
    const { theme } = useTheme();
    const [loading, setLoading] = useState(false);

    if (!item) return null;

    // Helper to format ASP.NET JSON Date /Date(1234567890)/
    const formatDate = (dateString: string) => {
        try {
            if (!dateString) return 'N/A';

            if (typeof dateString === 'string' && dateString.includes('/Date(')) {
                const timestamp = parseInt(dateString.replace(/\/Date\((-?\d+)\)\//, '$1'));
                const date = new Date(timestamp);
                return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
            }

            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;
            return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
        } catch (e) {
            return dateString;
        }
    };

    // Mapping fields
    const requestDate = item.applyDateD || item.RequestDate || item.CreatedDate;
    const description = item.DescC || item.LeaveName || item.Description || 'General Request';
    const rangeDescription = item.LvDescC || '';
    const status = item.StatusC || item.StatusResult || item.Status || 'Waiting';
    const remarks = item.LVRemarksC || item.RemarksC || item.Remarks || 'No remarks provided';

    // Status Logic for Color
    let statusInfo = { color: '#D97706', bg: '#FEF3C7', label: 'WAITING' };
    if (status.toLowerCase().includes('approv')) statusInfo = { color: '#16A34A', bg: '#DCFCE7', label: 'APPROVED' };
    if (status.toLowerCase().includes('reject') || status.toLowerCase().includes('cancel')) {
        statusInfo = { color: '#DC2626', bg: '#FEE2E2', label: status.toUpperCase() };
    }

    const handleCancelRequest = async () => {
        Alert.alert(
            "Cancel Request",
            "Are you sure you want to cancel this request?",
            [
                { text: "No", style: "cancel" },
                {
                    text: "Yes, Cancel",
                    style: "destructive",
                    onPress: async () => {
                        setLoading(true);
                        try {
                            const requestId = item.IdN || item.Id || item.id;
                            // Attempt to get EmpId from item or fallback to current user
                            const currentUser = ApiService.getCurrentUser();
                            const empId = item.EmpIdN || item.EmpId || currentUser.empId;

                            if (!requestId) {
                                Alert.alert("Error", "Request ID not found.");
                                setLoading(false);
                                return;
                            }

                            const descLower = description.toLowerCase();

                            // Specific logic for Time/Attendance requests
                            if (descLower.includes('time') || descLower.includes('attendance')) {
                                if (!empId) {
                                    Alert.alert("Error", "Employee ID not found.");
                                    setLoading(false);
                                    return;
                                }

                                const result = await ApiService.updatePendingApproval({
                                    IdN: requestId,
                                    StatusC: 'Rejected', // Mapping to Approval: 2
                                    ApproveRemarkC: remarks !== 'No remarks provided' ? remarks : 'Cancelled by user',
                                    EmpIdN: empId,
                                    Flag: 'Time',
                                    ApproveAmtN: 0,
                                    title: "",
                                    DocName: "",
                                    ReceiveYearN: 0,
                                    ReceiveMonthN: 0,
                                    PayTypeN: 0
                                });

                                if (result.success) {
                                    Alert.alert("Success", "Request cancelled successfully");
                                    onClose();
                                    onRefresh?.();
                                } else {
                                    Alert.alert("Error", result.error || "Failed to cancel time request.");
                                }
                            } else {
                                // Existing logic for other requests
                                const parseDate = (dateStr: string | undefined) => {
                                    if (!dateStr) return undefined;
                                    try {
                                        if (typeof dateStr === 'string' && dateStr.includes('/Date(')) {
                                            const timestamp = parseInt(dateStr.replace(/\/Date\((-?\d+)\)\//, '$1'));
                                            return new Date(timestamp);
                                        }
                                        return new Date(dateStr);
                                    } catch (e) { return undefined; }
                                };

                                const fromDate = parseDate(item.LFromDateD || item.FromDate);
                                const toDate = parseDate(item.LToDateD || item.ToDate);

                                const getRequestType = (desc: string): string => {
                                    const d = desc.toLowerCase();
                                    if (d.includes('leave') || d.includes('permission')) return 'Lev';
                                    if (d.includes('claim')) return 'Claim';
                                    if (d.includes('profile')) return 'Pro';
                                    if (d.includes('document')) return 'Doc';
                                    return 'Lev';
                                };

                                const result = await ApiService.deleteRequest(
                                    requestId,
                                    getRequestType(description),
                                    fromDate,
                                    toDate,
                                    'Cancelled by user'
                                );

                                if (result.success) {
                                    Alert.alert("Success", "Request cancelled successfully");
                                    onClose();
                                    onRefresh?.();
                                } else {
                                    Alert.alert("Error", result.error || "Failed to cancel request.");
                                }
                            }
                        } catch (error: any) {
                            Alert.alert("Error", error.message || "An unexpected error occurred.");
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const DetailItem = ({ label, value, icon }: { label: string, value: string, icon: any }) => (
        <View style={styles.detailItem}>
            <View style={[styles.detailIcon, { backgroundColor: theme.inputBg }]}>
                <Ionicons name={icon} size={18} color={theme.primary} />
            </View>
            <View style={styles.detailText}>
                <Text style={[styles.detailLabel, { color: theme.placeholder }]}>{label}</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>{value || '—'}</Text>
            </View>
        </View>
    );

    return (
        <AppModal
            visible={visible}
            onClose={onClose}
            title="Request Details"
            subtitle={`Ref: #${item.IdN || 'N/A'}`}
            footer={(status.toLowerCase().includes('waiting') || status.toLowerCase().includes('pending')) ? (
                <TouchableOpacity
                    style={[styles.cancelButton]}
                    onPress={handleCancelRequest}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.cancelButtonText}>Cancel Request</Text>
                    )}
                </TouchableOpacity>
            ) : null}
        >
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.badgeRow}>
                    <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
                        <View style={[styles.dot, { backgroundColor: statusInfo.color }]} />
                        <Text style={[styles.statusLabelText, { color: statusInfo.color }]}>
                            {statusInfo.label}
                        </Text>
                    </View>
                </View>

                <DetailItem icon="document-text-outline" label="DESCRIPTION" value={description} />
                <DetailItem icon="calendar-outline" label="REQUEST DATE" value={formatDate(requestDate)} />
                {rangeDescription ? (
                    <DetailItem icon="time-outline" label="SCHEDULE/DURATION" value={rangeDescription} />
                ) : null}
                <DetailItem icon="chatbubble-outline" label="REMARKS" value={remarks} />
            </ScrollView>
        </AppModal>
    );
};

const styles = StyleSheet.create({
    modalBody: {
        padding: 18,
        flexShrink: 1,
    },
    badgeRow: {
        flexDirection: 'row',
        marginBottom: 24,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
        gap: 6,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusLabelText: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    detailItem: {
        flexDirection: 'row',
        marginBottom: 24,
        alignItems: 'flex-start',
    },
    detailIcon: {
        width: 40,
        height: 40,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    detailText: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 4,
    },
    detailValue: {
        fontSize: 15,
        fontWeight: '600',
        lineHeight: 22,
    },
    cancelButton: {
        height: 56,
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FEE2E2', // Soft red
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    cancelButtonText: {
        color: '#DC2626',
        fontWeight: '700',
        fontSize: 16,
    },
});

export default RequestModal;
