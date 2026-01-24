import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useTheme } from '../../context/ThemeContext';
import Modal from "@/components/common/SingleModal";
interface ServiceDetail {
    WHC: string;          // Work Hours
    PartCodeC: string;    // Part Code
    PartDescC: string;    // Part Description
    QtyN: number;         // Quantity
    UnitN: number;        // Unit Price
}
interface ServiceDetailsModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (detail: ServiceDetail) => void;
    editingDetail?: ServiceDetail | null;
}
export default function ServiceDetailsModal({
    visible,
    onClose,
    onSave,
    editingDetail,
}: ServiceDetailsModalProps) {
    const { theme } = useTheme();
    const [workHours, setWorkHours] = useState('');
    const [partCode, setPartCode] = useState('');
    const [partDescription, setPartDescription] = useState('');
    const [quantity, setQuantity] = useState('');
    const [unit, setUnit] = useState('');
    useEffect(() => {
        if (visible) {
            if (editingDetail) {
                setWorkHours(editingDetail.WHC);
                setPartCode(editingDetail.PartCodeC);
                setPartDescription(editingDetail.PartDescC);
                setQuantity(String(editingDetail.QtyN));
                setUnit(String(editingDetail.UnitN));
            } else {
                clearForm();
            }
        }
    }, [visible, editingDetail]);
    const clearForm = () => {
        setWorkHours('');
        setPartCode('');
        setPartDescription('');
        setQuantity('');
        setUnit('');
    };
    const handleSave = () => {
        // Check if all fields are empty
        if (!workHours && !partCode && !partDescription && !quantity && !unit) {
            onClose();
            return;
        }
        const detail: ServiceDetail = {
            WHC: workHours.trim(),
            PartCodeC: partCode.trim(),
            PartDescC: partDescription.trim(),
            QtyN: quantity ? parseInt(quantity) : 0,
            UnitN: unit ? parseFloat(unit) : 0,
        };
        onSave(detail);
        clearForm();
        onClose();
    };
    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: theme.primary }]}>
                            Service Description
                        </Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={theme.text} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* W/H (Work Hours) */}
                        <View style={styles.fieldContainer}>
                            <Text style={[styles.label, { color: theme.text }]}>W/H</Text>
                            <TextInput
                                style={[styles.input, {
                                    backgroundColor: theme.inputBg,
                                    borderColor: theme.inputBorder,
                                    color: theme.text
                                }]}
                                placeholder=""
                                placeholderTextColor={theme.placeholder}
                                value={workHours}
                                onChangeText={setWorkHours}
                            />
                        </View>
                        {/* Part Code */}
                        <View style={styles.fieldContainer}>
                            <Text style={[styles.label, { color: theme.text }]}>Part Code</Text>
                            <TextInput
                                style={[styles.input, {
                                    backgroundColor: theme.inputBg,
                                    borderColor: theme.inputBorder,
                                    color: theme.text
                                }]}
                                placeholder=""
                                placeholderTextColor={theme.placeholder}
                                value={partCode}
                                onChangeText={setPartCode}
                            />
                        </View>
                        {/* Part Description */}
                        <View style={styles.fieldContainer}>
                            <Text style={[styles.label, { color: theme.text }]}>Part Description</Text>
                            <TextInput
                                style={[styles.textArea, {
                                    backgroundColor: theme.inputBg,
                                    borderColor: theme.inputBorder,
                                    color: theme.text
                                }]}
                                placeholder=""
                                placeholderTextColor={theme.placeholder}
                                value={partDescription}
                                onChangeText={setPartDescription}
                                multiline
                                numberOfLines={3}
                            />
                        </View>
                        {/* Quantity */}
                        <View style={styles.fieldContainer}>
                            <Text style={[styles.label, { color: theme.text }]}>Quantity</Text>
                            <TextInput
                                style={[styles.input, {
                                    backgroundColor: theme.inputBg,
                                    borderColor: theme.inputBorder,
                                    color: theme.text
                                }]}
                                placeholder=""
                                placeholderTextColor={theme.placeholder}
                                value={quantity}
                                onChangeText={setQuantity}
                                keyboardType="numeric"
                            />
                        </View>
                        {/* Unit */}
                        <View style={styles.fieldContainer}>
                            <Text style={[styles.label, { color: theme.text }]}>Unit</Text>
                            <TextInput
                                style={[styles.input, {
                                    backgroundColor: theme.inputBg,
                                    borderColor: theme.inputBorder,
                                    color: theme.text
                                }]}
                                placeholder=""
                                placeholderTextColor={theme.placeholder}
                                value={unit}
                                onChangeText={setUnit}
                                keyboardType="decimal-pad"
                            />
                        </View>
                        {/* Save Button */}
                        <TouchableOpacity
                            style={[styles.saveButton, { backgroundColor: theme.primary }]}
                            onPress={handleSave}
                        >
                            <Text style={styles.saveButtonText}>Save</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}
const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxHeight: '80%',
        borderRadius: 4,
        padding: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
    },
    closeButton: {
        padding: 4,
    },
    fieldContainer: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '400',
        marginBottom: 8,
    },
    input: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 4,
        borderWidth: 1,
        fontSize: 15,
    },
    textArea: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 4,
        borderWidth: 1,
        fontSize: 15,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    saveButton: {
        paddingVertical: 14,
        borderRadius: 4,
        alignItems: 'center',
        marginTop: 10,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});