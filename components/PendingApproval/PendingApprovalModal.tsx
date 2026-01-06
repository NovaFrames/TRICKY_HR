import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';

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

    useEffect(() => {
        if (visible && data) {
            setSelectedStatus('');
            setRejectRemarks('');
        }
    }, [visible, data]);

    const formatDate = (dateString: string) => {
        if (!dateString) return '';

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

        return dateString;
    };

    const handleUpdate = () => {
        if (!selectedStatus) {
            Alert.alert('Error', 'Please select a status');
            return;
        }

        if (selectedStatus === 'Rejected' && !rejectRemarks.trim()) {
            Alert.alert('Error', 'Please enter reject remarks');
            return;
        }

        onUpdate(selectedStatus, rejectRemarks);
    };

    if (!data) return null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={false}
            onRequestClose={onClose}
        >
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                {/* Header */}
                <View style={[styles.header, { backgroundColor: theme.primary }]}>
                    <TouchableOpacity onPress={onClose} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{data.NameC}</Text>
                    <View style={styles.backButton} />
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Read-only Information */}
                    <View style={styles.section}>
                        <View style={styles.infoRow}>
                            <Text style={[styles.label, { color: theme.text }]}>Apply date</Text>
                            <Text style={[styles.value, { color: theme.text }]}>
                                {formatDate(data.ApplyDateD)}
                            </Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={[styles.label, { color: theme.text }]}>Project Name</Text>
                            <Text style={[styles.value, { color: theme.text }]}>
                                {data.CatgNameC || 'N/A'}
                            </Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={[styles.label, { color: theme.text }]}>Request Type</Text>
                            <Text style={[styles.value, { color: theme.text }]}>
                                {data.DescC || 'N/A'}
                            </Text>
                        </View>

                        {data.LeaveDaysN !== null && (
                            <View style={styles.infoRow}>
                                <Text style={[styles.label, { color: theme.text }]}>In Time</Text>
                                <Text style={[styles.value, { color: theme.text }]}>
                                    {data.LeaveDaysN}
                                </Text>
                            </View>
                        )}

                        {data.EmpRemarksC && (
                            <View style={styles.infoRow}>
                                <Text style={[styles.label, { color: theme.text }]}>Remarks</Text>
                                <Text style={[styles.value, { color: theme.text }]}>
                                    {data.EmpRemarksC}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Editable Section */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.primary }]}>
                            Editable
                        </Text>

                        {/* Status Dropdown */}
                        <View style={styles.fieldContainer}>
                            <Text style={[styles.fieldLabel, { color: theme.text }]}>Status</Text>
                            <View style={[styles.pickerContainer, {
                                backgroundColor: theme.inputBg,
                                borderColor: theme.inputBorder
                            }]}>
                                <Picker
                                    selectedValue={selectedStatus}
                                    onValueChange={(value) => setSelectedStatus(value)}
                                    style={[styles.picker, { color: theme.text }]}
                                    dropdownIconColor={theme.text}
                                >
                                    <Picker.Item label="--Select--" value="" />
                                    <Picker.Item label="Approved" value="Approved" />
                                    <Picker.Item label="Rejected" value="Rejected" />
                                </Picker>
                            </View>
                        </View>

                        {/* Reject Remarks */}
                        <View style={styles.fieldContainer}>
                            <Text style={[styles.fieldLabel, { color: theme.text }]}>
                                Reject Remarks
                            </Text>
                            <TextInput
                                style={[styles.textArea, {
                                    backgroundColor: theme.inputBg,
                                    borderColor: theme.inputBorder,
                                    color: theme.text
                                }]}
                                placeholder=""
                                placeholderTextColor={theme.placeholder}
                                value={rejectRemarks}
                                onChangeText={setRejectRemarks}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />
                        </View>

                        {/* Update Button */}
                        <TouchableOpacity
                            style={[styles.updateButton, { backgroundColor: theme.primary }]}
                            onPress={handleUpdate}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.updateButtonText}>Update</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        paddingVertical: 12,
        paddingTop: 40,
    },
    backButton: {
        padding: 8,
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    label: {
        fontSize: 14,
        fontWeight: '400',
        flex: 1,
    },
    value: {
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
        textAlign: 'right',
    },
    fieldContainer: {
        marginBottom: 20,
    },
    fieldLabel: {
        fontSize: 14,
        fontWeight: '400',
        marginBottom: 8,
    },
    pickerContainer: {
        borderWidth: 1,
        borderRadius: 4,
        overflow: 'hidden',
    },
    picker: {
        height: 50,
    },
    textArea: {
        borderWidth: 1,
        borderRadius: 4,
        padding: 12,
        fontSize: 15,
        minHeight: 100,
    },
    updateButton: {
        paddingVertical: 14,
        borderRadius: 25,
        alignItems: 'center',
        marginTop: 20,
        marginHorizontal: 40,
    },
    updateButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});
