import { ThemeType } from '@/theme/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ConfirmationModalProps {
    visible: boolean;
    totalAmount: number;
    theme: ThemeType;
    onCancel: () => void;
    onConfirm: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ visible, totalAmount, theme, onCancel, onConfirm }) => (
    <Modal
        visible={visible}
        animationType="fade"
        transparent={true}
        onRequestClose={onCancel}
    >
        <View style={styles.overlay}>
            <View style={[styles.modal, { backgroundColor: theme.cardBackground }]}>
                <Ionicons name="help-circle" size={60} color={theme.primary} style={styles.icon} />
                <Text style={[styles.title, { color: theme.text }]}>Confirm Submission</Text>
                <Text style={[styles.message, { color: theme.textLight }]}>
                    Are you sure you want to submit this claim for ₹{totalAmount.toFixed(2)}?
                </Text>
                <View style={styles.buttons}>
                    <TouchableOpacity
                        style={[styles.button, styles.noButton, { backgroundColor: theme.inputBg }]}
                        onPress={onCancel}
                    >
                        <Text style={[styles.noButtonText, { color: theme.textLight }]}>No, Review</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.button, styles.yesButton, { backgroundColor: theme.primary }]}
                        onPress={onConfirm}
                    >
                        <Text style={styles.yesButtonText}>Yes, Submit</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    </Modal>
);

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modal: {
        borderRadius: 20,
        padding: 25,
        width: '90%',
        alignItems: 'center',
    },
    icon: {
        marginBottom: 15,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    message: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 25,
        lineHeight: 22,
    },
    buttons: {
        flexDirection: 'row',
        width: '100%',
    },
    button: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        marginHorizontal: 8,
    },
    noButton: {},
    yesButton: {},
    noButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    yesButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});

export default ConfirmationModal;
