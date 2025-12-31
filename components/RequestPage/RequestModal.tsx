import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Animated, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface RequestModalProps {
    visible: boolean;
    onClose: () => void;
    item: any;
}

const RequestModal: React.FC<RequestModalProps> = ({ visible, onClose, item }) => {
    const [scaleValue] = useState(new Animated.Value(0));

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


    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="none" // We handle animation
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <Animated.View style={[styles.modalContent, { transform: [{ scale: scaleValue }] }]}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Request Details</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color="#555" />
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
                            <Text style={styles.detailLabel}>Description</Text>
                            <Text style={styles.detailValue}>{description}</Text>
                        </View>

                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Request Date</Text>
                            <Text style={styles.detailValue}>{formatDate(requestDate)}</Text>
                        </View>

                        {rangeDescription ? (
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Details</Text>
                                <Text style={styles.detailValue}>{rangeDescription}</Text>
                            </View>
                        ) : null}

                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Reference ID</Text>
                            <Text style={styles.detailValue}>{item.IdN}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Remarks</Text>
                            <Text style={styles.detailValue}>{item.LVRemarksC}</Text>
                        </View>
                    </ScrollView>

                    <View style={styles.modalFooter}>
                        <TouchableOpacity style={styles.closeButtonFull} onPress={onClose}>
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
        backgroundColor: '#fff',
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
        borderBottomColor: '#eee',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
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
        color: '#888',
        marginBottom: 5,
        textTransform: 'uppercase',
    },
    detailValue: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    modalFooter: {
        padding: 15,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    closeButtonFull: {
        backgroundColor: '#03A9F4',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    closeButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    }
});

export default RequestModal;
