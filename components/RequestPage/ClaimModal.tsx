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

interface ClaimModalProps {
    visible: boolean;
    onClose: () => void;
    item: any;
    onRefresh?: () => void;
}

const ClaimModal: React.FC<ClaimModalProps> = ({ visible, onClose, item, onRefresh }) => {
    const { theme } = useTheme();
    const [loading, setLoading] = useState(false);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [claimData, setClaimData] = useState<any>(null);
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
                return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
            }

            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;
            return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
        } catch (e) {
            return dateString;
        }
    };

    // Fetch claim details and documents
    useEffect(() => {
        const fetchClaimDetails = async () => {
            if (!visible || !item) return;

            setDetailsLoading(true);

            try {
                const [claimResult, docsResult] = await Promise.all([
                    ApiService.getClaimDetails(item.IdN),
                    ApiService.getClaimDocuments(item.IdN)
                ]);

                if (claimResult?.success && claimResult?.data) {
                    setClaimData(claimResult.data);
                }

                if (docsResult?.success && docsResult.data?.xx) {
                    setDocuments(docsResult.data.xx);
                }
            } catch (error) {
                console.error('Error fetching claim details:', error);
            } finally {
                setDetailsLoading(false);
            }
        };

        fetchClaimDetails();
    }, [visible, item]);

    const handleCancelRequest = async () => {
        Alert.alert(
            "Cancel Request",
            "Are you sure you want to cancel this claim request?",
            [
                { text: "No", style: "cancel" },
                {
                    text: "Yes, Cancel",
                    style: "destructive",
                    onPress: async () => {
                        setLoading(true);
                        try {
                            const requestId = item.IdN || item.Id || item.id;
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

                            const result = await ApiService.deleteRequest(
                                requestId,
                                'Claim',
                                fromDate,
                                toDate,
                                'Cancelled by user'
                            );

                            if (result.success) {
                                Alert.alert("Success", "Claim request cancelled successfully");
                                onClose();
                                onRefresh?.();
                            } else {
                                Alert.alert("Error", result.error || "Failed to cancel claim request.");
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

    const getTravelTypeLabel = (type: number) => {
        const types = ['', 'Flight', 'Train', 'Bus', 'Taxi', 'Own Vehicle', 'Other'];
        return types[type] || 'Unknown';
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

        if (!claimData) {
            return (
                <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyText, { color: theme.placeholder }]}>No claim details available</Text>
                </View>
            );
        }

        const travelExpenses = claimData.ClaimExpenseDtl1 || [];

        return (
            <>
                {/* Claim Information */}
                <View style={styles.section}>
                    <InfoRow label="Claim Amount" value={`₹${claimData.ClaimAmtN?.toFixed(2) || '0'}`} theme={theme} />
                    <InfoRow label="Claim Name" value={claimData.NameC || 'N/A'} theme={theme} />
                    <InfoRow label="Period From" value={formatDate(claimData.FromDateD)} theme={theme} />
                    <InfoRow label="Period To" value={formatDate(claimData.ToDateD)} theme={theme} />
                    {claimData.CurrencyNameC && (
                        <InfoRow label="Currency" value={claimData.CurrencyNameC} theme={theme} />
                    )}
                    <InfoRow label="Description" value={claimData.DescC || 'No description'} theme={theme} />
                </View>

                {/* Travel and Other Expense */}
                {travelExpenses.length > 0 && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.primary }]}>
                            Travel and Other Expense
                        </Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.tableScrollView}
                            contentContainerStyle={styles.tableScrollContent}
                        >
                            <View style={styles.tableContainer}>
                                <View style={[styles.tableHeader, { backgroundColor: theme.inputBg }]}>
                                    <Text style={[styles.tableHeaderText, { color: theme.text }]}>Travel By</Text>
                                    <Text style={[styles.tableHeaderText, { color: theme.text }]}>Boarding Point/Desc</Text>
                                    <Text style={[styles.tableHeaderText, { color: theme.text }]}>Destination</Text>
                                    <Text style={[styles.tableHeaderText, { color: theme.text }]}>PNR</Text>
                                    <Text style={[styles.tableHeaderText, { color: theme.text }]}>Amount</Text>
                                </View>
                                {travelExpenses.map((expense: any, index: number) => (
                                    <View key={index} style={[styles.tableRow, { borderBottomColor: theme.inputBorder }]}>
                                        <Text style={[styles.tableCell, { color: theme.text }]} numberOfLines={1}>
                                            {getTravelTypeLabel(expense.TravelByN)}
                                        </Text>
                                        <Text style={[styles.tableCell, { color: theme.text }]} numberOfLines={1}>
                                            {expense.BoardintPointC || '-'}
                                        </Text>
                                        <Text style={[styles.tableCell, { color: theme.text }]} numberOfLines={1}>
                                            {expense.DestinationC || '-'}
                                        </Text>
                                        <Text style={[styles.tableCell, { color: theme.text }]} numberOfLines={1}>
                                            {expense.PNRC || '-'}
                                        </Text>
                                        <Text style={[styles.tableCell, { color: theme.text, fontWeight: '600' }]} numberOfLines={1}>
                                            ₹{expense.TravelAmountN?.toFixed(2) || '0.00'}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </ScrollView>
                    </View>
                )}

                {/* Claim Documents */}
                {documents.length > 0 && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.primary }]}>
                            Claim Documents
                        </Text>
                        {documents.map((doc: any, index: number) => {
                            const fileName = doc.NameC || 'Unknown';
                            const fileDate = doc.LastWriteTimeC ? formatDate(doc.LastWriteTimeC) : 'N/A';
                            const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';

                            let iconName = 'document-outline';
                            if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
                                iconName = 'image-outline';
                            } else if (fileExtension === 'pdf') {
                                iconName = 'document-text-outline';
                            }

                            return (
                                <View key={index} style={[styles.documentItem, { backgroundColor: theme.inputBg }]}>
                                    <View style={[styles.documentIcon, { backgroundColor: theme.primary + '20' }]}>
                                        <Ionicons name={iconName as any} size={24} color={theme.primary} />
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
                                        <Ionicons name="download-outline" size={20} color={theme.primary} />
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
            title="Claim"
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
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 12,
        letterSpacing: 0.5,
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 12,
        alignItems: 'flex-start',
    },
    infoLabel: {
        fontSize: 14,
        fontWeight: '600',
        width: 120,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '500',
        flex: 1,
    },
    tableScrollView: {
        marginBottom: 8,
    },
    tableScrollContent: {
        paddingRight: 16,
    },
    tableContainer: {
        minWidth: '100%',
    },
    tableHeader: {
        flexDirection: 'row',
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderRadius: 4,
        marginBottom: 4,
    },
    tableHeaderText: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
        width: 110,
        marginRight: 8,
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
    },
    tableCell: {
        fontSize: 13,
        fontWeight: '500',
        width: 110,
        marginRight: 8,
    },
    scrollHint: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: 8,
    },
    scrollHintText: {
        fontSize: 11,
        fontWeight: '500',
    },
    documentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
        gap: 12,
    },
    documentIcon: {
        width: 48,
        height: 48,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    documentInfo: {
        flex: 1,
    },
    documentName: {
        fontSize: 14,
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

export default ClaimModal;
