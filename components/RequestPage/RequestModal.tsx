import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
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
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [detailedData, setDetailedData] = useState<any>(null);

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

    const formatTime = (timeValue: number) => {
        if (!timeValue || timeValue === 0) return 'N/A';
        return timeValue.toFixed(2);
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

    // Fetch detailed data based on request type
    useEffect(() => {
        const fetchDetails = async () => {
            if (!visible || !item) return;

            const descLower = description.toLowerCase();
            setDetailsLoading(true);

            try {
                let result;

                // Employee Document
                if (descLower.includes('document')) {
                    result = await ApiService.getEmployeeDocument(item.IdN);
                }
                // Time Update
                else if (descLower.includes('time')) {
                    result = await ApiService.getTimeUpdate(item.IdN);
                }
                // Leave/Permission/OnDuty
                else if (descLower.includes('leave') || descLower.includes('permission') || descLower.includes('onduty')) {
                    result = await ApiService.getLeaveDetails(item.IdN);
                }
                // Leave Surrender
                else if (descLower.includes('surrender')) {
                    result = await ApiService.getLeaveSurrender(item.IdN);
                }
                // Profile Update
                else if (descLower.includes('profile')) {
                    result = await ApiService.getProfileUpdate();
                }
                // Claim
                else if (descLower.includes('claim')) {
                    // Fetch both claim details and documents
                    const [claimResult, docsResult] = await Promise.all([
                        ApiService.getClaimDetails(item.IdN),
                        ApiService.getClaimDocuments(item.IdN)
                    ]);

                    if (claimResult?.success && claimResult?.data) {
                        result = {
                            success: true,
                            data: {
                                ...claimResult.data,
                                documents: docsResult?.success ? docsResult.data?.xx || [] : []
                            }
                        };
                    }
                }

                if (result?.success && result?.data) {
                    setDetailedData(result.data);
                }
            } catch (error) {
                console.error('Error fetching details:', error);
            } finally {
                setDetailsLoading(false);
            }
        };

        fetchDetails();
    }, [visible, item]);

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
                                    StatusC: 'Rejected',
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
                                    if (d.includes('surrender')) return 'LVSurrender';
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

    // Render detailed content based on request type
    const renderDetailedContent = () => {
        if (detailsLoading) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={[styles.loadingText, { color: theme.placeholder }]}>Loading details...</Text>
                </View>
            );
        }

        if (!detailedData) {
            return (
                <>
                    <DetailItem icon="document-text-outline" label="DESCRIPTION" value={description} />
                    <DetailItem icon="calendar-outline" label="REQUEST DATE" value={formatDate(requestDate)} />
                    {rangeDescription ? (
                        <DetailItem icon="time-outline" label="SCHEDULE/DURATION" value={rangeDescription} />
                    ) : null}
                    <DetailItem icon="chatbubble-outline" label="REMARKS" value={remarks} />
                </>
            );
        }

        const descLower = description.toLowerCase();

        // Time Update Details
        if (descLower.includes('time') && detailedData.data?.[0]) {
            const timeData = detailedData.data[0];
            const inTime = timeData.InTimeN || 0;
            const outTime = timeData.OutTimeN || 0;

            let requestType = 'In & Out Time';
            if (inTime === 0) requestType = 'Out Time';
            if (outTime === 0) requestType = 'In Time';

            return (
                <>
                    <DetailItem icon="time-outline" label="REQUEST TYPE" value={requestType} />
                    <DetailItem icon="calendar-outline" label="DATE" value={formatDate(timeData.DateD)} />
                    {inTime > 0 && <DetailItem icon="log-in-outline" label="IN TIME" value={formatTime(inTime)} />}
                    {outTime > 0 && <DetailItem icon="log-out-outline" label="OUT TIME" value={formatTime(outTime)} />}
                    <DetailItem icon="briefcase-outline" label="PROJECT" value={timeData.ProjectNameC || 'N/A'} />
                    <DetailItem icon="chatbubble-outline" label="REMARKS" value={timeData.TMSRemarksC || 'No remarks'} />
                </>
            );
        }

        // Leave Details
        if ((descLower.includes('leave') || descLower.includes('permission') || descLower.includes('onduty')) && detailedData.data?.[0]) {
            const leaveData = detailedData.data[0];
            const hasPermission = leaveData.THrsN > 0;

            return (
                <>
                    <DetailItem icon="document-text-outline" label="LEAVE TYPE" value={leaveData.ReaGrpNameC || 'N/A'} />
                    <DetailItem icon="calendar-outline" label="FROM DATE" value={formatDate(leaveData.LFromDateD)} />
                    <DetailItem icon="calendar-outline" label="TO DATE" value={formatDate(leaveData.LToDateD)} />
                    <DetailItem icon="time-outline" label="NUMBER OF DAYS" value={leaveData.LeaveDaysN?.toString() || '0'} />

                    {hasPermission && (
                        <>
                            <DetailItem icon="time-outline" label="FROM TIME" value={formatTime(leaveData.FHN)} />
                            <DetailItem icon="time-outline" label="TO TIME" value={formatTime(leaveData.THN)} />
                            <DetailItem icon="hourglass-outline" label="TOTAL HOURS" value={formatTime(leaveData.THrsN)} />
                        </>
                    )}

                    {leaveData.MLClaimAmtN > 0 && (
                        <DetailItem icon="cash-outline" label="MEDICAL CLAIM" value={`₹${leaveData.MLClaimAmtN.toFixed(2)}`} />
                    )}

                    <DetailItem icon="chatbubble-outline" label="REMARKS" value={leaveData.LVRemarksC || 'No remarks'} />

                    {leaveData.LVCancelRemarksC && (
                        <DetailItem icon="close-circle-outline" label="CANCEL REMARKS" value={leaveData.LVCancelRemarksC} />
                    )}
                </>
            );
        }

        // Leave Surrender Details
        if (descLower.includes('surrender') && detailedData.data?.[0]) {
            const surrenderData = detailedData.data[0];
            return (
                <>
                    <DetailItem icon="gift-outline" label="SURRENDER LEAVES" value={surrenderData.SurrenderN?.toFixed(2) || '0'} />
                    <DetailItem icon="calendar-outline" label="PAYOUT DATE" value={formatDate(surrenderData.PayoutDateD)} />
                    <DetailItem icon="chatbubble-outline" label="REMARKS" value={surrenderData.RemarksC || 'No remarks'} />
                </>
            );
        }

        // Document Details
        if (descLower.includes('document') && detailedData.data?.[0]) {
            const docData = detailedData.data[0];
            return (
                <>
                    <DetailItem icon="document-outline" label="DOCUMENT NAME" value={docData.DocNameC || 'N/A'} />
                    <DetailItem icon="folder-outline" label="DOCUMENT TYPE" value={docData.DocTypeC || 'N/A'} />
                    <DetailItem icon="chatbubble-outline" label="REMARKS" value={docData.PDRemarksC || 'No remarks'} />
                </>
            );
        }

        // Profile Update Details
        if (descLower.includes('profile') && detailedData.data?.[0]?.empProfile) {
            const profileData = detailedData.data[0].empProfile;
            const maritalStatus = ['', 'Married', 'Unmarried', 'Divorce', 'Others', 'Widow'][profileData.MaritalN] || 'N/A';
            const bloodGroup = ['', 'O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'A1+', 'A1B+', 'A1B-', 'A1-', 'B1+', 'B1-'][profileData.BloodTypeN] || 'N/A';

            return (
                <>
                    <DetailItem icon="person-outline" label="NAME" value={`${profileData.EmpNameC} ${profileData.MiddleNameC} ${profileData.LastNameC}`} />
                    <DetailItem icon="call-outline" label="PHONE" value={profileData.PhNoC || 'N/A'} />
                    <DetailItem icon="mail-outline" label="EMAIL" value={profileData.EmailIdC || 'N/A'} />
                    <DetailItem icon="heart-outline" label="MARITAL STATUS" value={maritalStatus} />
                    <DetailItem icon="water-outline" label="BLOOD GROUP" value={bloodGroup} />
                    <DetailItem icon="home-outline" label="CURRENT ADDRESS" value={`${profileData.CDoorNoC}, ${profileData.CStreetC}, ${profileData.CAreaC}, ${profileData.CCityC}`} />
                </>
            );
        }

        // Claim Details
        if (descLower.includes('claim') && detailedData.data) {
            const claimData = detailedData.data;
            const documents = claimData.documents || [];

            return (
                <>
                    <DetailItem icon="document-text-outline" label="CLAIM NAME" value={claimData.NameC || 'N/A'} />
                    <DetailItem icon="cash-outline" label="CLAIM AMOUNT" value={`₹${claimData.ClaimAmtN?.toFixed(2) || '0'}`} />
                    <DetailItem icon="calendar-outline" label="FROM DATE" value={formatDate(claimData.FromDateD)} />
                    <DetailItem icon="calendar-outline" label="TO DATE" value={formatDate(claimData.ToDateD)} />
                    {claimData.CurrencyNameC && (
                        <DetailItem icon="cash-outline" label="CURRENCY" value={claimData.CurrencyNameC} />
                    )}
                    <DetailItem icon="chatbubble-outline" label="DESCRIPTION" value={claimData.DescC || 'No description'} />

                    {documents.length > 0 && (
                        <View style={styles.documentsSection}>
                            <Text style={[styles.documentsSectionTitle, { color: theme.text }]}>
                                Attached Documents ({documents.length})
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
                                        <Ionicons name={iconName as any} size={24} color={theme.primary} />
                                        <View style={styles.documentInfo}>
                                            <Text style={[styles.documentName, { color: theme.text }]} numberOfLines={1}>
                                                {fileName}
                                            </Text>
                                            <Text style={[styles.documentDate, { color: theme.placeholder }]}>
                                                {fileDate}
                                            </Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </>
            );
        }

        // Default fallback
        return (
            <>
                <DetailItem icon="document-text-outline" label="DESCRIPTION" value={description} />
                <DetailItem icon="calendar-outline" label="REQUEST DATE" value={formatDate(requestDate)} />
                {rangeDescription ? (
                    <DetailItem icon="time-outline" label="SCHEDULE/DURATION" value={rangeDescription} />
                ) : null}
                <DetailItem icon="chatbubble-outline" label="REMARKS" value={remarks} />
            </>
        );
    };

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

                {renderDetailedContent()}
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
    documentsSection: {
        marginTop: 16,
        marginBottom: 8,
    },
    documentsSectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 12,
    },
    documentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
        gap: 12,
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
});

export default RequestModal;
