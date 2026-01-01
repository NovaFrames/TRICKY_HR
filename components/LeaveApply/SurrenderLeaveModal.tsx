// SurrenderLeaveModal.tsx
import { MaterialIcons as Icon } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import ApiService, { SurrenderData } from '../../services/ApiService';

interface SurrenderLeaveModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const SurrenderLeaveModal: React.FC<SurrenderLeaveModalProps> = ({
    visible,
    onClose,
    onSuccess,
}) => {
    const { theme } = useTheme();
    const [loading, setLoading] = useState(false);
    const [checkingEligibility, setCheckingEligibility] = useState(false);
    const [eligibleDays, setEligibleDays] = useState<number>(10);
    const [surrenderDays, setSurrenderDays] = useState<string>('');
    const [payoutDate, setPayoutDate] = useState<Date>(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [remarks, setRemarks] = useState('');

    useEffect(() => {
        if (visible) {
            checkEligibility();
        }
    }, [visible]);

    const checkEligibility = async () => {
        try {
            setCheckingEligibility(true);
            const result = await ApiService.getSurrenderBalance();

            if (result.success && result.eligLeave !== undefined) {
                // Logic to set eligible days if backend returns valid number
                setEligibleDays(result.eligLeave || 10);
            } else {
                Alert.alert('Error', result.error || 'Failed to check surrender eligibility');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to check surrender eligibility');
        } finally {
            setCheckingEligibility(false);
        }
    };

    const formatDateForAPI = (date: Date): string => {
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
    };

    const validateForm = (): boolean => {
        const days = parseFloat(surrenderDays);

        if (isNaN(days) || days <= 0) {
            Alert.alert('Error', 'Please enter valid surrender days (greater than 0)');
            return false;
        }

        if (days > eligibleDays) {
            Alert.alert('Error', `Cannot surrender more than ${eligibleDays} days`);
            return false;
        }

        if (remarks.trim().length < 10) {
            Alert.alert('Error', 'Remarks must be at least 10 characters');
            return false;
        }

        if (payoutDate < new Date()) {
            Alert.alert('Error', 'Payout date must be in the future');
            return false;
        }

        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        try {
            setLoading(true);

            const surrenderData: SurrenderData = {
                EmpIdN: ApiService.getCurrentUser().empId!,
                SurrenderN: parseFloat(surrenderDays),
                PayoutDateD: formatDateForAPI(payoutDate),
                RemarksC: remarks.trim(),
            };

            const result = await ApiService.submitSurrender(surrenderData);

            if (result.success) {
                Alert.alert(
                    'Success',
                    'Leave surrender request submitted successfully!',
                    [{ text: 'OK', onPress: onSuccess }]
                );
            } else {
                Alert.alert('Error', result.error || 'Failed to submit surrender request');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to submit surrender request');
        } finally {
            setLoading(false);
        }
    };

    const renderDatePicker = () => {
        const pickerContent = (
            <DateTimePicker
                value={payoutDate}
                mode="date"
                display={Platform.OS === 'ios' ? "spinner" : "default"}
                minimumDate={new Date()}
                onChange={(event: any, date?: Date) => {
                    setShowDatePicker(false);
                    if (date) setPayoutDate(date);
                }}
                style={Platform.OS === 'ios' ? styles.datePicker : undefined}
            />
        );

        if (Platform.OS === 'ios') {
            return (
                <Modal
                    transparent={true}
                    animationType="slide"
                    visible={showDatePicker}
                    onRequestClose={() => setShowDatePicker(false)}
                >
                    <View style={styles.pickerContainer}>
                        <View style={[styles.pickerHeader, { backgroundColor: theme.cardBackground, borderBottomColor: theme.inputBorder }]}>
                            <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                <Text style={[styles.pickerButton, { color: theme.primary }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                <Text style={[styles.pickerButton, styles.pickerConfirm, { color: theme.primary }]}>Done</Text>
                            </TouchableOpacity>
                        </View>
                        {pickerContent}
                    </View>
                </Modal>
            );
        }

        return showDatePicker ? pickerContent : null;
    };

    // Shared Styles
    const labelStyle = [styles.label, { color: theme.text }];
    const inputStyle = [styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }];
    const dateInputStyle = [styles.dateInput, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }];

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalContainer}>
                <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
                    {/* Header */}
                    <View style={[styles.modalHeader, { borderBottomColor: theme.inputBorder }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>Leave Surrender</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Icon name="close" size={24} color={theme.icon} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {/* Eligibility Section */}
                        <View style={[styles.eligibilityCard, { backgroundColor: theme.inputBg }]}>
                            <View style={styles.eligibilityHeader}>
                                <Icon name="info" size={20} color={theme.primary} />
                                <Text style={[styles.eligibilityTitle, { color: theme.primary }]}>Eligibility Information</Text>
                            </View>

                            {checkingEligibility ? (
                                <ActivityIndicator size="small" color={theme.primary} style={styles.loader} />
                            ) : (
                                <>
                                    <View style={styles.eligibilityRow}>
                                        <Text style={[styles.eligibilityLabel, { color: theme.secondary }]}>Eligible Leave Surrender:</Text>
                                        <Text style={[styles.eligibilityValue, { color: theme.primary }]}>
                                            {eligibleDays.toFixed(2)} days
                                        </Text>
                                    </View>

                                    <View style={[styles.note, { backgroundColor: theme.cardBackground }]}>
                                        <Text style={[styles.noteText, { color: theme.placeholder }]}>
                                            Note: You can surrender up to {eligibleDays.toFixed(2)} days of eligible leave.
                                        </Text>
                                    </View>
                                </>
                            )}
                        </View>

                        {/* Surrender Days */}
                        <View style={styles.formGroup}>
                            <Text style={labelStyle}>Surrender Leave (Days)</Text>
                            <TextInput
                                style={inputStyle}
                                placeholder={`Enter days (max: ${eligibleDays.toFixed(2)})`}
                                placeholderTextColor={theme.placeholder}
                                keyboardType="decimal-pad"
                                value={surrenderDays}
                                onChangeText={setSurrenderDays}
                            />
                            <Text style={[styles.hint, { color: theme.placeholder }]}>
                                Maximum: {eligibleDays.toFixed(2)} days
                            </Text>
                        </View>

                        {/* Payout Date */}
                        <View style={styles.formGroup}>
                            <Text style={labelStyle}>Payout Date</Text>
                            <TouchableOpacity
                                style={dateInputStyle}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Text style={{ color: theme.text }}>{payoutDate.toDateString()}</Text>
                                <Icon name="calendar-today" size={20} color={theme.icon} />
                            </TouchableOpacity>
                            <Text style={[styles.hint, { color: theme.placeholder }]}>
                                Date when surrender amount will be paid
                            </Text>
                        </View>

                        {/* Remarks */}
                        <View style={styles.formGroup}>
                            <Text style={labelStyle}>Remarks (Min. 10 characters)</Text>
                            <TextInput
                                style={[inputStyle, styles.textArea]}
                                placeholder="Enter reason for surrender"
                                placeholderTextColor={theme.placeholder}
                                multiline
                                numberOfLines={4}
                                value={remarks}
                                onChangeText={setRemarks}
                            />
                            <Text style={[styles.hint, { color: remarks.length < 10 ? '#FF3B30' : theme.placeholder }]}>
                                Characters: {remarks.length}/10
                            </Text>
                        </View>

                        {/* Validation Summary */}
                        <View style={[styles.validationCard, { backgroundColor: theme.background }]}>
                            <Text style={[styles.validationTitle, { color: theme.text }]}>Summary</Text>

                            <View style={styles.validationRow}>
                                <Text style={[styles.validationLabel, { color: theme.placeholder }]}>Surrender Days:</Text>
                                <Text style={[styles.validationValue, { color: theme.text }]}>
                                    {surrenderDays || '0'} days
                                </Text>
                            </View>

                            <View style={styles.validationRow}>
                                <Text style={[styles.validationLabel, { color: theme.placeholder }]}>Payout Date:</Text>
                                <Text style={[styles.validationValue, { color: theme.text }]}>
                                    {payoutDate.toDateString()}
                                </Text>
                            </View>

                            <View style={styles.validationRow}>
                                <Text style={[styles.validationLabel, { color: theme.placeholder }]}>Remarks Length:</Text>
                                <Text style={[
                                    styles.validationValue,
                                    { color: remarks.length >= 10 ? '#34C759' : '#FF3B30' }
                                ]}>
                                    {remarks.length}/10 characters
                                </Text>
                            </View>
                        </View>
                    </ScrollView>

                    {/* Footer Buttons */}
                    <View style={[styles.modalFooter, { borderTopColor: theme.inputBorder }]}>
                        <TouchableOpacity
                            style={[styles.footerButton, styles.cancelButton, { backgroundColor: theme.background, borderColor: theme.inputBorder }]}
                            onPress={onClose}
                            disabled={loading}
                        >
                            <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.footerButton, styles.submitButton, { backgroundColor: theme.primary }]}
                            onPress={handleSubmit}
                            disabled={loading || checkingEligibility}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <Icon name="check-circle" size={20} color="#fff" />
                                    <Text style={styles.submitButtonText}>Submit Surrender</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Date Picker */}
            {renderDatePicker()}
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    scrollContent: {
        padding: 16,
    },
    eligibilityCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
    },
    eligibilityHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    eligibilityTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    loader: {
        alignSelf: 'center',
        marginVertical: 20,
    },
    eligibilityRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    eligibilityLabel: {
        fontSize: 14,
    },
    eligibilityValue: {
        fontSize: 18,
        fontWeight: '700',
    },
    note: {
        padding: 8,
        borderRadius: 6,
        marginTop: 8,
    },
    noteText: {
        fontSize: 12,
        fontStyle: 'italic',
    },
    formGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 14,
    },
    hint: {
        fontSize: 12,
        marginTop: 4,
        fontStyle: 'italic',
    },
    dateInput: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 14,
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    validationCard: {
        borderRadius: 12,
        padding: 16,
        marginTop: 8,
        marginBottom: 20,
    },
    validationTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    validationRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    validationLabel: {
        fontSize: 14,
    },
    validationValue: {
        fontSize: 14,
        fontWeight: '500',
    },
    modalFooter: {
        flexDirection: 'row',
        padding: 16,
        borderTopWidth: 1,
    },
    footerButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 8,
        marginHorizontal: 4,
    },
    cancelButton: {
        borderWidth: 1,
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    submitButton: {
        // bg set via theme
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    pickerContainer: {
        backgroundColor: '#fff',
    },
    pickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    pickerButton: {
        fontSize: 16,
        color: '#007AFF',
    },
    pickerConfirm: {
        fontWeight: '600',
    },
    datePicker: {
        width: '100%',
        backgroundColor: '#fff',
    },
});

export default SurrenderLeaveModal;