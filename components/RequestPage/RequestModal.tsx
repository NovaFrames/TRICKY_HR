import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import ApiService from '../../services/ApiService';

interface RequestModalProps {
    visible: boolean;
    onClose: () => void;
    item: any;
}

const RequestModal: React.FC<RequestModalProps> = ({ visible, onClose, item }) => {
    const { theme, isDark } = useTheme();
    const [scaleValue] = useState(new Animated.Value(0));
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible) {
            Animated.spring(scaleValue, {
                toValue: 1,
                useNativeDriver: true,
                tension: 65,
                friction: 11
            }).start();
        } else {
            Animated.timing(scaleValue, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);


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

    // Status Logic for Color
    let statusInfo = { color: '#D97706', bg: '#FEF3C7', label: 'WAITING' };
    if (status.toLowerCase().includes('approv')) statusInfo = { color: '#16A34A', bg: '#DCFCE7', label: 'APPROVED' };
    if (status.toLowerCase().includes('reject') || status.toLowerCase().includes('cancel')) {
        statusInfo = { color: '#DC2626', bg: '#FEE2E2', label: status.toUpperCase() };
    }

    const handleCancelLeave = async () => {
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
                            const { empId, token } = ApiService.getCurrentUser();
                            if (!empId) {
                                Alert.alert("Error", "User details not found.");
                                setLoading(false);
                                return;
                            }

                            const payload = {
                                Flag: "CancelLeave",
                                Tokenc: token || '',
                                EmpId: empId,
                                Id: item.IdN || item.Id,
                                Approval: 2,
                                YearN: 0,
                                Remarks: "Cancellation requested by user",
                                title: "",
                                DocName: "",
                                ReceiveYearN: 0,
                                ReceiveMonthN: 0,
                                ApproveAmtN: 0,
                                PayTypeN: 0,
                                LFromDateD: item.LFromDateD ? item.LFromDateD.split('T')[0] : new Date().toISOString().split('T')[0],
                                LToDateD: item.LToDateD ? item.LToDateD.split('T')[0] : new Date().toISOString().split('T')[0],
                            };

                            const result = await ApiService.cancelLeave(payload);
                            if (result.success) {
                                Alert.alert("Success", "Request cancelled successfully");
                                onClose();
                            } else {
                                Alert.alert("Error", result.error || "Failed to cancel request");
                            }
                        } catch (error) {
                            Alert.alert("Error", "An unexpected error occurred");
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
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <Animated.View
                    style={[
                        styles.modalContent,
                        {
                            backgroundColor: theme.cardBackground,
                            transform: [{ scale: scaleValue }]
                        }
                    ]}
                >
                    <View style={[styles.modalHeader, { borderBottomColor: theme.inputBorder }]}>
                        <View>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>Request Details</Text>
                            <Text style={[styles.modalSubtitle, { color: theme.placeholder }]}>Ref: #{item.IdN || 'N/A'}</Text>
                        </View>
                        <TouchableOpacity
                            onPress={onClose}
                            style={[styles.closeIcon, { backgroundColor: theme.inputBg }]}
                        >
                            <Ionicons name="close" size={20} color={theme.text} />
                        </TouchableOpacity>
                    </View>

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
                        <DetailItem icon="chatbubble-outline" label="REMARKS" value={item.LVRemarksC || item.RemarksC} />
                    </ScrollView>

                    <View style={[styles.modalFooter, { borderTopColor: theme.inputBorder }]}>
                        {(status.toLowerCase().includes('waiting') || status.toLowerCase().includes('pending')) && (
                            <TouchableOpacity
                                style={[styles.cancelButton]}
                                onPress={handleCancelLeave}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.cancelButtonText}>Cancel Request</Text>
                                )}
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={[styles.closeButtonFull, { backgroundColor: theme.primary }]}
                            onPress={onClose}
                        >
                            <Text style={styles.closeButtonText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        width: '100%',
        borderRadius: 28,
        elevation: 10,
        maxHeight: '85%',
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    modalSubtitle: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 2,
    },
    closeIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBody: {
        padding: 24,
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
        borderRadius: 12,
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
        borderRadius: 12,
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
    modalFooter: {
        padding: 24,
        borderTopWidth: 1,
        gap: 12,
    },
    closeButtonFull: {
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    cancelButton: {
        height: 56,
        borderRadius: 16,
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
