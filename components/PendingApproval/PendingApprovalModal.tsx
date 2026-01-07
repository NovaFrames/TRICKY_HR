import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import AppModal from '../common/AppModal';

interface PendingApprovalData {
    IdN: number;
    EmpIdN: number;
    CodeC: string;
    NameC: string;
    CatgNameC: string;
    YearN: number;
    ApplyDateD: string;
    ApproveRejDateD: string;
    DescC: string;
    StatusC: string;
    LvDescC: string | null;
    FromDateC: string;
    ToDateC: string;
    EmpRemarksC: string;
    ApproveRemarkC: string;
    LeaveDaysN: number | null;
    Approve1C: string | null;
    Approve2C: string | null;
    FinalApproveC: string | null;
}

interface PendingApprovalModalProps {
    visible: boolean;
    onClose: () => void;
    onUpdate: (status: string, remarks: string) => void;
    data: PendingApprovalData | null;
    loading?: boolean;
}

export default function PendingApprovalModal({
    visible,
    onClose,
    onUpdate,
    data,
    loading = false,
}: PendingApprovalModalProps) {
    const { theme } = useTheme();

    const [selectedStatus, setSelectedStatus] = useState('');
    const [rejectRemarks, setRejectRemarks] = useState('');
    const [processingAction, setProcessingAction] = useState<'Approved' | 'Rejected' | null>(null);

    useEffect(() => {
        if (visible && data) {
            setSelectedStatus('');
            setRejectRemarks('');
            setProcessingAction(null);
        }
    }, [visible, data]);

    if (!data) return null;

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

    // Status Logic for Color
    const status = data.StatusC || 'Waiting';
    let statusInfo = { color: '#D97706', bg: '#FEF3C7', label: 'PENDING' };
    if (status.toLowerCase().includes('approv')) statusInfo = { color: '#16A34A', bg: '#DCFCE7', label: 'APPROVED' };
    if (status.toLowerCase().includes('reject') || status.toLowerCase().includes('cancel')) {
        statusInfo = { color: '#DC2626', bg: '#FEE2E2', label: status.toUpperCase() };
    }

    const handleApprove = () => {
        Alert.alert(
            "Approve Request",
            "Are you sure you want to approve this request?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Approve",
                    style: "default",
                    onPress: () => {
                        setProcessingAction('Approved');
                        onUpdate('Approved', rejectRemarks);
                    }
                }
            ]
        );
    };

    const handleReject = () => {
        if (!rejectRemarks.trim()) {
            Alert.alert('Error', 'Please enter reject remarks');
            return;
        }

        Alert.alert(
            "Reject Request",
            "Are you sure you want to reject this request?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Reject",
                    style: "destructive",
                    onPress: () => {
                        setProcessingAction('Rejected');
                        onUpdate('Rejected', rejectRemarks);
                    }
                }
            ]
        );
    };

    const DetailItem = ({ label, value, icon }: { label: string, value: string | number, icon: any }) => (
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
            title="Approval Request"
            subtitle={`Employee: ${data.NameC} • Ref: #${data.IdN}`}
            footer={
                <View style={styles.footerButtons}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.rejectButton]}
                        onPress={handleReject}
                        disabled={loading || processingAction !== null}
                    >
                        {loading && processingAction === 'Rejected' ? (
                            <ActivityIndicator size="small" color="#DC2626" />
                        ) : (
                            <>
                                <Ionicons name="close-circle-outline" size={20} color="#DC2626" />
                                <Text style={styles.rejectButtonText}>Reject</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.approveButton, { backgroundColor: theme.primary }]}
                        onPress={handleApprove}
                        disabled={loading || processingAction !== null}
                    >
                        {loading && processingAction === 'Approved' ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                                <Text style={styles.approveButtonText}>Approve</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            }
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

                <DetailItem icon="person-outline" label="EMPLOYEE CODE" value={data.CodeC} />
                <DetailItem icon="briefcase-outline" label="PROJECT NAME" value={data.CatgNameC || 'N/A'} />
                <DetailItem icon="document-text-outline" label="REQUEST TYPE" value={data.DescC || 'N/A'} />
                <DetailItem icon="calendar-outline" label="APPLY DATE" value={formatDate(data.ApplyDateD)} />

                {data.LvDescC && (
                    <DetailItem icon="time-outline" label="SCHEDULE/DURATION" value={data.LvDescC} />
                )}

                {data.LeaveDaysN !== null && (
                    <DetailItem icon="timer-outline" label="LEAVE DAYS" value={data.LeaveDaysN} />
                )}

                {data.EmpRemarksC && (
                    <DetailItem icon="chatbubble-outline" label="EMPLOYEE REMARKS" value={data.EmpRemarksC} />
                )}

                {/* Approval Section */}
                <View style={styles.approvalSection}>
                    <Text style={[styles.sectionTitle, { color: theme.primary }]}>
                        APPROVAL DECISION
                    </Text>

                    <View style={styles.fieldContainer}>
                        <Text style={[styles.fieldLabel, { color: theme.text }]}>Remarks</Text>
                        <TextInput
                            style={[styles.textArea, {
                                backgroundColor: theme.inputBg,
                                borderColor: theme.inputBorder,
                                color: theme.text
                            }]}
                            placeholder="Enter your remarks here (required for rejection)"
                            placeholderTextColor={theme.placeholder}
                            value={rejectRemarks}
                            onChangeText={setRejectRemarks}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    </View>
                </View>
            </ScrollView>
        </AppModal>
    );
}

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
    approvalSection: {
        marginTop: 8,
        paddingTop: 24,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1,
        marginBottom: 16,
    },
    fieldContainer: {
        marginBottom: 8,
    },
    fieldLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    textArea: {
        borderWidth: 1,
        borderRadius: 4,
        padding: 12,
        fontSize: 15,
        minHeight: 100,
    },
    footerButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        height: 56,
        borderRadius: 4,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    approveButton: {
        backgroundColor: '#16A34A',
    },
    approveButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    rejectButton: {
        backgroundColor: '#FEE2E2',
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    rejectButtonText: {
        color: '#DC2626',
        fontWeight: '700',
        fontSize: 16,
    },
});
