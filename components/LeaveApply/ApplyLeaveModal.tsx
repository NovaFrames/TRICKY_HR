// ApplyLeaveModal.tsx
import { MaterialIcons as Icon } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
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
import ApiService, {
    AvailableLeaveType,
    LeaveApplicationData,
    LeaveBalanceResponse
} from '../../services/ApiService';

interface ApplyLeaveModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    availableLeaves: AvailableLeaveType[];
    leaveData: LeaveBalanceResponse | null;
}

const ApplyLeaveModal: React.FC<ApplyLeaveModalProps> = ({
    visible,
    onClose,
    onSuccess,
    availableLeaves,
    leaveData,
}) => {
    const [loading, setLoading] = useState(false);
    const [checkingAvailability, setCheckingAvailability] = useState(false);
    const [selectedLeaveType, setSelectedLeaveType] = useState<AvailableLeaveType | null>(null);
    const [fromDate, setFromDate] = useState<Date>(new Date());
    const [toDate, setToDate] = useState<Date>(new Date());
    const [showFromDatePicker, setShowFromDatePicker] = useState(false);
    const [showToDatePicker, setShowToDatePicker] = useState(false);
    const [fromTime, setFromTime] = useState<string>('09.00');
    const [toTime, setToTime] = useState<string>('17.00');
    const [totalTime, setTotalTime] = useState<string>('8.00');
    const [showFromTimePicker, setShowFromTimePicker] = useState(false);
    const [showToTimePicker, setShowToTimePicker] = useState(false);
    const [pastLeaveYes, setPastLeaveYes] = useState(false);
    const [pastLeaveNo, setPastLeaveNo] = useState(true);
    const [remarks, setRemarks] = useState('');
    const [claimAmount, setClaimAmount] = useState('');
    const [availableDays, setAvailableDays] = useState<number>(0);
    const [showTimeSection, setShowTimeSection] = useState(false);
    const [showMedicalSection, setShowMedicalSection] = useState(false);

    useEffect(() => {
        if (availableLeaves.length > 0 && !selectedLeaveType) {
            setSelectedLeaveType(availableLeaves[0]);
            checkLeaveTypeChange(availableLeaves[0]);
        }
    }, [availableLeaves]);

    const checkLeaveTypeChange = (leaveType: AvailableLeaveType) => {
        // Show time section for hourly leaves (Type 4) or ONDUTY group
        const isTimeRequired = leaveType.ReaTypeN === 4 || leaveType.ReaGrpIdN === 8;
        setShowTimeSection(isTimeRequired);

        // Show medical section for sick leaves (Group 16)
        const isMedical = leaveType.ReaGrpIdN === 16;
        setShowMedicalSection(isMedical);

        // Check past leave availability
        if (leaveType.PastLeaveN === 0) {
            setPastLeaveNo(true);
            setPastLeaveYes(false);
        }
    };

    const calculateTimeDifference = (from: string, to: string): string => {
        const [fromHours, fromMinutes] = from.split('.').map(Number);
        const [toHours, toMinutes] = to.split('.').map(Number);

        let totalHours = toHours - fromHours;
        let totalMinutes = toMinutes - fromMinutes;

        if (totalMinutes < 0) {
            totalHours -= 1;
            totalMinutes += 60;
        }

        if (totalHours < 0) {
            totalHours += 24;
        }

        return `${totalHours}.${totalMinutes.toString().padStart(2, '0')}`;
    };

    const handleFromTimeChange = (time: string) => {
        setFromTime(time);
        setTotalTime(calculateTimeDifference(time, toTime));
    };

    const handleToTimeChange = (time: string) => {
        setToTime(time);
        setTotalTime(calculateTimeDifference(fromTime, time));
    };

    const formatDateForAPI = (date: Date): string => {
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
    };

    const checkAvailability = async () => {
        if (!selectedLeaveType) return;

        try {
            setCheckingAvailability(true);
            const result = await ApiService.checkLeaveAvailability(
                formatDateForAPI(fromDate),
                formatDateForAPI(toDate),
                selectedLeaveType.ReaGrpIdN,
                parseFloat(totalTime) || 0,
                selectedLeaveType.ReaTypeN === 4 ? 0 : 1
            );

            if (result.success && result.leaveDays !== undefined) {
                setAvailableDays(result.leaveDays);
                Alert.alert('Availability', `Available for ${result.leaveDays} day(s)`);
            } else {
                Alert.alert('Error', result.error || 'Failed to check availability');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to check availability');
        } finally {
            setCheckingAvailability(false);
        }
    };

    const validateForm = (): boolean => {
        if (!selectedLeaveType) {
            Alert.alert('Error', 'Please select leave type');
            return false;
        }

        if (fromDate > toDate) {
            Alert.alert('Error', 'To date must be after from date');
            return false;
        }

        if (!pastLeaveYes && !pastLeaveNo) {
            Alert.alert('Error', 'Please select past leave option');
            return false;
        }

        if (pastLeaveYes && fromDate > new Date()) {
            Alert.alert('Error', 'Past leave must be before current date');
            return false;
        }

        if (showTimeSection && parseFloat(totalTime) <= 0) {
            Alert.alert('Error', 'Please enter valid time');
            return false;
        }

        if (showMedicalSection) {
            const claim = parseFloat(claimAmount) || 0;
            const maxPerVisit = leaveData?.MLPerVisitMaxN || 0;
            if (claim > maxPerVisit) {
                Alert.alert('Error', `Claim amount cannot exceed ₹${maxPerVisit}`);
                return false;
            }
        }

        if (remarks.trim().length === 0) {
            Alert.alert('Error', 'Please enter remarks');
            return false;
        }

        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm() || !selectedLeaveType) return;

        try {
            setLoading(true);

            const leaveData: LeaveApplicationData = {
                AppEmpIdN: ApiService.getCurrentUser().empId!,
                LIdN: selectedLeaveType.ReaIdN,
                LFromDateD: formatDateForAPI(fromDate),
                LToDateD: formatDateForAPI(toDate),
                FHN: parseFloat(fromTime) || 0,
                THN: parseFloat(toTime) || 0,
                THrsN: parseFloat(totalTime) || 0,
                UnitN: selectedLeaveType.ReaTypeN === 4 ? 0 :
                    selectedLeaveType.ReaTypeN === 2 || selectedLeaveType.ReaTypeN === 3 ? 0.5 : 1,
                MLClaimAmtN: parseFloat(claimAmount) || 0,
                LVRemarksC: remarks.trim(),
                PastLeaveN: pastLeaveYes ? 1 : 0,
            };

            const result = await ApiService.applyLeave(leaveData);

            if (result.success) {
                if (result.data?.data && result.data.data !== '') {
                    Alert.alert(
                        'Success',
                        `Leave applied successfully. Note: ${result.data.data} days of unpaid leave required.`,
                        [{ text: 'OK', onPress: onSuccess }]
                    );
                } else {
                    Alert.alert(
                        'Success',
                        'Leave applied successfully!',
                        [{ text: 'OK', onPress: onSuccess }]
                    );
                }
            } else {
                Alert.alert('Error', result.error || 'Failed to apply leave');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to apply leave');
        } finally {
            setLoading(false);
        }
    };

    const renderDatePicker = (
        show: boolean,
        date: Date,
        onChange: (event: any, selectedDate?: Date) => void,
        onClose: () => void
    ) => {
        if (Platform.OS === 'ios') {
            return (
                <Modal
                    transparent={true}
                    animationType="slide"
                    visible={show}
                    onRequestClose={onClose}
                >
                    <View style={styles.pickerContainer}>
                        <View style={styles.pickerHeader}>
                            <TouchableOpacity onPress={onClose}>
                                <Text style={styles.pickerButton}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={onClose}>
                                <Text style={[styles.pickerButton, styles.pickerConfirm]}>Done</Text>
                            </TouchableOpacity>
                        </View>
                        <DateTimePicker
                            value={date}
                            mode="date"
                            display="spinner"
                            onChange={onChange}
                            style={styles.datePicker}
                        />
                    </View>
                </Modal>
            );
        }

        return show ? (
            <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={onChange}
            />
        ) : null;
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Apply Leave</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Icon name="close" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {/* Leave Type */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Leave Type</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={selectedLeaveType?.ReaIdN}
                                    onValueChange={(itemValue: number) => {
                                        const selected = availableLeaves.find(l => l.ReaIdN === itemValue);
                                        if (selected) {
                                            setSelectedLeaveType(selected);
                                            checkLeaveTypeChange(selected);
                                        }
                                    }}
                                    style={styles.picker}
                                >
                                    {availableLeaves.map((leave) => (
                                        <Picker.Item
                                            key={leave.ReaIdN}
                                            label={leave.ReaNameC}
                                            value={leave.ReaIdN}
                                        />
                                    ))}
                                </Picker>
                            </View>
                        </View>

                        {/* Dates */}
                        <View style={styles.dateRow}>
                            <View style={styles.dateGroup}>
                                <Text style={styles.label}>From Date</Text>
                                <TouchableOpacity
                                    style={styles.dateInput}
                                    onPress={() => setShowFromDatePicker(true)}
                                >
                                    <Text>{fromDate.toDateString()}</Text>
                                    <Icon name="calendar-today" size={20} color="#666" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.dateGroup}>
                                <Text style={styles.label}>To Date</Text>
                                <TouchableOpacity
                                    style={styles.dateInput}
                                    onPress={() => setShowToDatePicker(true)}
                                >
                                    <Text>{toDate.toDateString()}</Text>
                                    <Icon name="calendar-today" size={20} color="#666" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Availability Check */}
                        <TouchableOpacity
                            style={styles.checkButton}
                            onPress={checkAvailability}
                            disabled={checkingAvailability}
                        >
                            {checkingAvailability ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <Icon name="check-circle" size={20} color="#fff" />
                                    <Text style={styles.checkButtonText}>Check Availability</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        {availableDays > 0 && (
                            <View style={styles.availabilityBadge}>
                                <Text style={styles.availabilityText}>
                                    Available: {availableDays} day(s)
                                </Text>
                            </View>
                        )}

                        {/* Past Leave */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Past Leave</Text>
                            <View style={styles.radioGroup}>
                                <TouchableOpacity
                                    style={styles.radioOption}
                                    onPress={() => {
                                        setPastLeaveYes(true);
                                        setPastLeaveNo(false);
                                    }}
                                >
                                    <View style={styles.radioCircle}>
                                        {pastLeaveYes && <View style={styles.radioSelected} />}
                                    </View>
                                    <Text style={styles.radioLabel}>Yes</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.radioOption}
                                    onPress={() => {
                                        setPastLeaveYes(false);
                                        setPastLeaveNo(true);
                                    }}
                                >
                                    <View style={styles.radioCircle}>
                                        {pastLeaveNo && <View style={styles.radioSelected} />}
                                    </View>
                                    <Text style={styles.radioLabel}>No</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Time Section (for hourly leaves) */}
                        {showTimeSection && (
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Time Details</Text>

                                <View style={styles.timeRow}>
                                    <View style={styles.timeGroup}>
                                        <Text style={styles.timeLabel}>From Time</Text>
                                        <TouchableOpacity
                                            style={styles.timeInput}
                                            onPress={() => setShowFromTimePicker(true)}
                                        >
                                            <Text>{fromTime}</Text>
                                            <Icon name="access-time" size={20} color="#666" />
                                        </TouchableOpacity>
                                    </View>

                                    <View style={styles.timeGroup}>
                                        <Text style={styles.timeLabel}>To Time</Text>
                                        <TouchableOpacity
                                            style={styles.timeInput}
                                            onPress={() => setShowToTimePicker(true)}
                                        >
                                            <Text>{toTime}</Text>
                                            <Icon name="access-time" size={20} color="#666" />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View style={styles.totalTime}>
                                    <Text style={styles.timeLabel}>Total Hours:</Text>
                                    <Text style={styles.totalTimeValue}>{totalTime}</Text>
                                </View>
                            </View>
                        )}

                        {/* Medical Claim Section */}
                        {showMedicalSection && leaveData && (
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Medical Claim</Text>

                                <View style={styles.claimInfo}>
                                    <Text style={styles.claimText}>
                                        Limit: ₹{leaveData.MLClaimLimitN.toFixed(2)}
                                    </Text>
                                    <Text style={styles.claimText}>
                                        Available: ₹{leaveData.MLClaimAvailN.toFixed(2)}
                                    </Text>
                                    <Text style={styles.claimText}>
                                        Per Visit Max: ₹{leaveData.MLPerVisitMaxN.toFixed(2)}
                                    </Text>
                                </View>

                                <TextInput
                                    style={styles.input}
                                    placeholder="Claim Amount (₹)"
                                    keyboardType="decimal-pad"
                                    value={claimAmount}
                                    onChangeText={setClaimAmount}
                                />
                            </View>
                        )}

                        {/* Remarks */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Remarks</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Enter remarks (min. 10 characters)"
                                multiline
                                numberOfLines={4}
                                value={remarks}
                                onChangeText={setRemarks}
                            />
                        </View>
                    </ScrollView>

                    {/* Footer Buttons */}
                    <View style={styles.modalFooter}>
                        <TouchableOpacity
                            style={[styles.footerButton, styles.cancelButton]}
                            onPress={onClose}
                            disabled={loading}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.footerButton, styles.submitButton]}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <Icon name="send" size={20} color="#fff" />
                                    <Text style={styles.submitButtonText}>Apply Leave</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Date Pickers */}
            {renderDatePicker(
                showFromDatePicker,
                fromDate,
                (event, date) => {
                    setShowFromDatePicker(false);
                    if (date) setFromDate(date);
                },
                () => setShowFromDatePicker(false)
            )}

            {renderDatePicker(
                showToDatePicker,
                toDate,
                (event, date) => {
                    setShowToDatePicker(false);
                    if (date) setToDate(date);
                },
                () => setShowToDatePicker(false)
            )}
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
        backgroundColor: '#fff',
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
        borderBottomColor: '#e0e0e0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    scrollContent: {
        padding: 16,
    },
    formGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginBottom: 8,
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        overflow: 'hidden',
    },
    picker: {
        height: 50,
    },
    dateRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    dateGroup: {
        flex: 1,
        marginHorizontal: 4,
    },
    dateInput: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 14,
        backgroundColor: '#fff',
    },
    checkButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#34C759',
        borderRadius: 8,
        paddingVertical: 12,
        marginBottom: 16,
    },
    checkButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    availabilityBadge: {
        backgroundColor: '#D4EDDA',
        padding: 8,
        borderRadius: 6,
        marginBottom: 16,
        alignItems: 'center',
    },
    availabilityText: {
        color: '#155724',
        fontSize: 14,
        fontWeight: '500',
    },
    radioGroup: {
        flexDirection: 'row',
    },
    radioOption: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 24,
    },
    radioCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    radioSelected: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#007AFF',
    },
    radioLabel: {
        fontSize: 14,
        color: '#333',
    },
    timeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    timeGroup: {
        flex: 1,
        marginHorizontal: 4,
    },
    timeLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    timeInput: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        backgroundColor: '#fff',
    },
    totalTime: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 8,
    },
    totalTimeValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#007AFF',
    },
    claimInfo: {
        backgroundColor: '#e3f2fd',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    claimText: {
        fontSize: 12,
        color: '#1976d2',
        marginBottom: 2,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 14,
        color: '#333',
        backgroundColor: '#fff',
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    modalFooter: {
        flexDirection: 'row',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
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
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '600',
    },
    submitButton: {
        backgroundColor: '#007AFF',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
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

export default ApplyLeaveModal;