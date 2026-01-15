import { Ionicons } from '@expo/vector-icons';
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
import AppModal from '../../components/common/AppModal';
import { useTheme } from '../../context/ThemeContext';
import ApiService from '../../services/ApiService';

interface DocModalProps {
    visible: boolean;
    onClose: () => void;
    item: any;
    onRefresh?: () => void;
}

const DocModal: React.FC<DocModalProps> = ({ visible, onClose, item, onRefresh }) => {
    const { theme } = useTheme();
    const [loading, setLoading] = useState(false);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [docData, setDocData] = useState<any>(null);
    const [documents, setDocuments] = useState<any[]>([]);

    if (!item) return null;

    const status = item.StatusC || item.StatusResult || item.Status || 'Waiting';

    // Status Logic for Color
    let statusInfo = { color: '#D97706', bg: '#FEF3C7', label: 'WAITING' };
    if (status.toLowerCase().includes('approv')) statusInfo = { color: '#16A34A', bg: '#DCFCE7', label: 'APPROVED' };
    if (status.toLowerCase().includes('reject') || status.toLowerCase().includes('cancel')) {
        statusInfo = { color: '#DC2626', bg: '#FEE2E2', label: status.toUpperCase() };
    }

    // Helper to format ASP.NET JSON Date
    const formatDate = (dateString: string) => {
        try {
            if (!dateString) return 'N/A';

            if (typeof dateString === 'string' && dateString.includes('/Date(')) {
                const timestamp = parseInt(dateString.replace(/\/Date\((-?\d+)\)\//, '$1'));
                const date = new Date(timestamp);
                return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' +
                    date.toLocaleDateString('en-US', { weekday: 'short' });
            }

            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;
            return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' +
                date.toLocaleDateString('en-US', { weekday: 'short' });
        } catch (e) {
            return dateString;
        }
    };

    // Fetch document details
    useEffect(() => {
        const fetchDocDetails = async () => {
            if (!visible || !item) return;

            setDetailsLoading(true);

            try {
                const docResult = await ApiService.getEmployeeDocument(item.IdN);

                if (docResult?.success && docResult?.data?.data?.[0]) {
                    const docInfo = docResult.data.data[0];
                    setDocData(docInfo);

                    // Get employee ID - try multiple sources
                    const currentUser = ApiService.getCurrentUser();
                    const empId = docInfo.EmpIdN || item.EmpIdN || currentUser.empId;

                    // Fetch documents using getEmployeeDocuments with proper parameters
                    if (empId && docInfo.DocTypeC && docInfo.DocNameC) {
                        const docsResult = await ApiService.getEmployeeDocuments(
                            empId,
                            docInfo.DocTypeC,
                            docInfo.DocNameC
                        );

                        if (docsResult?.success && docsResult.data?.xx) {
                            setDocuments(docsResult.data.xx);
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching document details:', error);
            } finally {
                setDetailsLoading(false);
            }
        };

        fetchDocDetails();
    }, [visible, item]);

    const handleCancelRequest = async () => {
        Alert.alert(
            "Cancel Request",
            "Are you sure you want to cancel this document request?",
            [
                { text: "No", style: "cancel" },
                {
                    text: "Yes, Cancel",
                    style: "destructive",
                    onPress: async () => {
                        setLoading(true);
                        try {
                            const requestId = item.IdN || item.Id || item.id;
                            const currentUser = ApiService.getCurrentUser();
                            const empId = item.EmpIdN || item.EmpId || currentUser.empId;

                            if (!empId) {
                                Alert.alert("Error", "Employee ID not found.");
                                setLoading(false);
                                return;
                            }

                            const result = await ApiService.updatePendingApproval({
                                IdN: requestId,
                                StatusC: 'Rejected',
                                ApproveRemarkC: 'Cancelled by user',
                                EmpIdN: empId,
                                Flag: 'Employee Document',
                                ApproveAmtN: 0,
                                title: docData?.DocTypeC || "",
                                DocName: docData?.DocNameC || "",
                                ReceiveYearN: 0,
                                ReceiveMonthN: 0,
                                PayTypeN: 0
                            });

                            if (result.success) {
                                Alert.alert("Success", "Document request cancelled successfully");
                                onClose();
                                onRefresh?.();
                            } else {
                                Alert.alert("Error", result.error || "Failed to cancel document request.");
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

    const renderContent = () => {
        if (detailsLoading) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={[styles.loadingText, { color: theme.placeholder }]}>Loading details...</Text>
                </View>
            );
        }

        if (!docData) {
            return (
                <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyText, { color: theme.placeholder }]}>No document details available</Text>
                </View>
            );
        }

        return (
            <>
                <View style={styles.content}>
                    <InfoRow label="Doc Name" value={docData.DocNameC || 'N/A'} theme={theme} />
                    <InfoRow label="Doc Type" value={docData.DocTypeC || 'N/A'} theme={theme} />
                    <InfoRow label="Remarks" value={docData.PDRemarksC || 'No remarks'} theme={theme} />
                </View>

                {/* Documents */}
                {documents.length > 0 && (
                    <View style={styles.documentsSection}>
                        {documents.map((doc: any, index: number) => {
                            const fileName = doc.NameC || 'Unknown';
                            const fileDate = doc.LastWriteTimeC ? formatDate(doc.LastWriteTimeC) : 'N/A';
                            const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';

                            let iconName = 'document-outline';
                            let iconColor = theme.primary;
                            let iconBg = theme.primary + '20';

                            if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
                                iconName = 'image-outline';
                            } else if (fileExtension === 'pdf') {
                                iconName = 'document-text-outline';
                                iconColor = '#DC2626';
                                iconBg = '#FEE2E2';
                            }

                            return (
                                <View key={index} style={[styles.documentItem, { backgroundColor: theme.inputBg }]}>
                                    <View style={[styles.documentIcon, { backgroundColor: iconBg }]}>
                                        <Ionicons name={iconName as any} size={28} color={iconColor} />
                                    </View>
                                    <View style={styles.documentInfo}>
                                        <Text style={[styles.documentName, { color: theme.text }]} numberOfLines={1}>
                                            {fileName}
                                        </Text>
                                        <Text style={[styles.documentDate, { color: theme.placeholder }]}>
                                            {fileDate}
                                        </Text>
                                    </View>
                                    <TouchableOpacity style={styles.downloadButton}>
                                        <Ionicons name="download-outline" size={22} color={theme.primary} />
                                    </TouchableOpacity>
                                </View>
                            );
                        })}
                    </View>
                )}
            </>
        );
    };

    return (
        <AppModal
            visible={visible}
            onClose={onClose}
            title="Employee Document Manage"
            subtitle={`Ref: #${item.IdN || 'N/A'}`}
            footer={(status.toLowerCase().includes('waiting') || status.toLowerCase().includes('pending')) ? (
                <TouchableOpacity
                    style={styles.cancelButton}
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

                {renderContent()}
            </ScrollView>
        </AppModal>
    );
};

// Helper component for info rows
const InfoRow = ({ label, value, theme }: { label: string; value: string; theme: any }) => (
    <View style={styles.infoRow}>
        <Text style={[styles.infoLabel, { color: theme.textLight }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: theme.text }]}>: {value}</Text>
    </View>
);

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
    content: {
        paddingVertical: 8,
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 16,
        alignItems: 'flex-start',
    },
    infoLabel: {
        fontSize: 14,
        fontWeight: '600',
        width: 100,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '500',
        flex: 1,
    },
    documentsSection: {
        marginTop: 8,
    },
    documentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 10,
        marginBottom: 10,
        gap: 12,
    },
    documentIcon: {
        width: 52,
        height: 52,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    documentInfo: {
        flex: 1,
    },
    documentName: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 4,
    },
    documentDate: {
        fontSize: 12,
        fontWeight: '500',
    },
    downloadButton: {
        padding: 8,
    },
    cancelButton: {
        height: 56,
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FEE2E2',
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    cancelButtonText: {
        color: '#DC2626',
        fontWeight: '700',
        fontSize: 16,
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 14,
        fontWeight: '600',
    },
});

export default DocModal;
