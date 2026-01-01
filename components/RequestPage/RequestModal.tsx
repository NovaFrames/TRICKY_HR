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
    const { theme } = useTheme();
    const [scaleValue] = useState(new Animated.Value(0));
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible) {
            Animated.spring(scaleValue, {
                toValue: 1,
                useNativeDriver: true,
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
            if (!dateString) return '';

            // Handle ASP.NET format
            if (typeof dateString === 'string' && dateString.includes('/Date(')) {
                const timestamp = parseInt(dateString.replace(/\/Date\((-?\d+)\)\//, '$1'));
                const date = new Date(timestamp);

                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const d = date.getDate();
                const m = months[date.getMonth()];
                const y = date.getFullYear();
                const h = date.getHours().toString().padStart(2, '0');
                const min = date.getMinutes().toString().padStart(2, '0');
                const s = date.getSeconds().toString().padStart(2, '0');

                return `${m} ${d} ${y} ${h}:${min}:${s}`;
            }

            // Fallback for standard date strings
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;

            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const d = date.getDate();
            const m = months[date.getMonth()];
            const y = date.getFullYear();
            const h = date.getHours().toString().padStart(2, '0');
            const min = date.getMinutes().toString().padStart(2, '0');
            const s = date.getSeconds().toString().padStart(2, '0');

            return `${m} ${d} ${y} ${h}:${min}:${s}`;
        } catch (e) {
            return dateString;
        }
    };

    // Mapping fields
    const requestDate = item.applyDateD || item.RequestDate || item.CreatedDate;
    const description = item.DescC || item.LeaveName || item.Description || 'LEAVE';
    const rangeDescription = item.LvDescC || '';
    const status = item.StatusC || item.StatusResult || item.Status || 'Waiting';

    // Status Logic for Color
    let statusColor = '#FFC107'; // Waiting
    if (status.toLowerCase().includes('approv')) statusColor = '#4CAF50';
    if (status.toLowerCase().includes('reject')) statusColor = '#F44336';
    if (status.toLowerCase().includes('cancel')) statusColor = '#F44336';

    const handleCancelLeave = async () => {
        Alert.alert(
            "Cancel Leave",
            "Are you sure you want to cancel this leave request?",
            [
                { text: "No", style: "cancel" },
                {
                    text: "Yes",
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
                                Tokenc: token || '', // User requested Tokenc
                                EmpId: empId,
                                Id: item.IdN || item.Id,
                                Approval: 2,
                                YearN: 0,
                                Remarks: "Cancellation requested",
                                title: "",
                                DocName: "",
                                ReceiveYearN: 0,
                                ReceiveMonthN: 0,
                                ApproveAmtN: 0,
                                PayTypeN: 0,
                                // Adding dates to prevent SQL overflow if backend checks them
                                LFromDateD: item.LFromDateD ? item.LFromDateD.split('T')[0] : new Date().toISOString().split('T')[0],
                                LToDateD: item.LToDateD ? item.LToDateD.split('T')[0] : new Date().toISOString().split('T')[0],
                            };

                            console.log('Sending Cancel Payload:', JSON.stringify(payload));
                            const result = await ApiService.cancelLeave(payload);
                            if (result.success) {
                                Alert.alert("Success", "Leave cancelled successfully");
                                onClose();
                            } else {
                                Alert.alert("Error", result.error || "Failed to cancel leave");
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

    // Style Refs
    const modalContentStyle = [styles.modalContent, { backgroundColor: theme.cardBackground, transform: [{ scale: scaleValue }] }];
    const headerStyle = [styles.modalHeader, { borderBottomColor: theme.inputBorder }];
    const titleStyle = [styles.modalTitle, { color: theme.text }];
    const labelStyle = [styles.detailLabel, { color: theme.placeholder }];
    const valueStyle = [styles.detailValue, { color: theme.text }];
    const footerStyle = [styles.modalFooter, { borderTopColor: theme.inputBorder }];

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="none" // We handle animation
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <Animated.View style={modalContentStyle}>
                    <View style={headerStyle}>
                        <Text style={titleStyle}>Request Details</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={theme.icon} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalBody}>
                        {/* Status Badge */}
                        <View style={styles.statusBadgeContainer}>
                            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                                <Text style={styles.statusBadgeText}>{status.trim().toUpperCase()}</Text>
                            </View>
                        </View>

                        <View style={styles.detailRow}>
                            <Text style={labelStyle}>Description</Text>
                            <Text style={valueStyle}>{description}</Text>
                        </View>

                        <View style={styles.detailRow}>
                            <Text style={labelStyle}>Request Date</Text>
                            <Text style={valueStyle}>{formatDate(requestDate)}</Text>
                        </View>

                        {rangeDescription ? (
                            <View style={styles.detailRow}>
                                <Text style={labelStyle}>Details</Text>
                                <Text style={valueStyle}>{rangeDescription}</Text>
                            </View>
                        ) : null}

                        <View style={styles.detailRow}>
                            <Text style={labelStyle}>Reference ID</Text>
                            <Text style={valueStyle}>{item.IdN}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={labelStyle}>Remarks</Text>
                            <Text style={valueStyle}>{item.LVRemarksC}</Text>
                        </View>
                    </ScrollView>

                    <View style={footerStyle}>
                        {(status.toLowerCase().includes('waiting') || status.toLowerCase().includes('pending')) && (
                            <TouchableOpacity
                                style={[styles.cancelButton, loading && styles.disabledButton]}
                                onPress={handleCancelLeave}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.cancelButtonText}>Cancel Leave</Text>
                                )}
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity style={[styles.closeButtonFull, { backgroundColor: theme.primary }]} onPress={onClose}>
                            <Text style={styles.closeButtonText}>Close</Text>
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
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '90%',
        borderRadius: 15,
        elevation: 5,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    closeButton: {
        padding: 5,
    },
    modalBody: {
        padding: 20,
    },
    statusBadgeContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    statusBadge: {
        paddingHorizontal: 15,
        paddingVertical: 5,
        borderRadius: 20,
    },
    statusBadgeText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    detailRow: {
        marginBottom: 15,
    },
    detailLabel: {
        fontSize: 12,
        marginBottom: 5,
        textTransform: 'uppercase',
    },
    detailValue: {
        fontSize: 16,
        fontWeight: '500',
    },
    modalFooter: {
        padding: 15,
        borderTopWidth: 1,
    },
    closeButtonFull: {
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    closeButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    cancelButton: {
        backgroundColor: '#F44336', // Red
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 10,
    },
    cancelButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    disabledButton: {
        opacity: 0.7,
    },
});

export default RequestModal;
