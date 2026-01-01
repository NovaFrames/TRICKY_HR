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
import { useTheme } from '../../context/ThemeContext';
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
    const { theme } = useTheme();
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

            const isHourly = selectedLeaveType.ReaTypeN === 4 || selectedLeaveType.ReaGrpIdN === 8; // Type 4 or ONDUTY

            const leaveData: LeaveApplicationData = {
                AppEmpIdN: ApiService.getCurrentUser().empId!,
                LIdN: selectedLeaveType.ReaIdN,
                LFromDateD: formatDateForAPI(fromDate),
                LToDateD: formatDateForAPI(toDate),
                FHN: isHourly ? (parseFloat(fromTime) || 0) : 0,
                THN: isHourly ? (parseFloat(toTime) || 0) : 0,
                THrsN: isHourly ? (parseFloat(totalTime) || 0) : 0,
                UnitN: selectedLeaveType.ReaTypeN === 1 ? 1 :
                    selectedLeaveType.ReaTypeN === 4 ? 0 :
                        selectedLeaveType.ReaTypeN === 2 || selectedLeaveType.ReaTypeN === 3 ? 0.5 : 1,
                MLClaimAmtN: parseFloat(claimAmount) || 0,
                LVRemarksC: remarks.trim(),
                PastLeaveN: pastLeaveYes ? 1 : 0,
            };

            console.log('Final Payload:', JSON.stringify(leaveData));

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
                Alert.alert('Error', result.error || 'Leave Already Applied or Failed to Apply Leave');
            }
        } catch (error) {
            Alert.alert('Error', 'Leave Already Applied or Failed to Apply Leave');
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
        const pickerContent = (
            <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === 'ios' ? "spinner" : "default"}
                onChange={onChange}
                style={Platform.OS === 'ios' ? styles.datePicker : undefined}
            />
        );

        if (Platform.OS === 'ios') {
            return (
                <Modal
                    transparent={true}
                    animationType="slide"
                    visible={show}
                    onRequestClose={onClose}
                >
                    <View style={styles.pickerContainer}>
                        <View style={[styles.pickerHeader, { backgroundColor: theme.cardBackground, borderColor: theme.inputBorder }]}>
                            <TouchableOpacity onPress={onClose}>
                                <Text style={[styles.pickerButton, { color: theme.primary }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={onClose}>
                                <Text style={[styles.pickerButton, styles.pickerConfirm, { color: theme.primary }]}>Done</Text>
                            </TouchableOpacity>
                        </View>
                        {pickerContent}
                    </View>
                </Modal>
            );
        }

        return show ? pickerContent : null;
    };

    // Shared styles
    const labelStyle = [styles.label, { color: theme.text }];
    const inputStyle = [styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }];
    const dateInputStyle = [styles.dateInput, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }];
    const pickerStyle = [styles.pickerContainer, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }];

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
                    <View style={[styles.modalHeader, { borderColor: theme.inputBorder }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>Apply Leave</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Icon name="close" size={24} color={theme.icon} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {/* Leave Type */}
                        <View style={styles.formGroup}>
                            <Text style={labelStyle}>Leave Type</Text>
                            <View style={pickerStyle}>
                                <Picker
                                    selectedValue={selectedLeaveType?.ReaIdN}
                                    onValueChange={(itemValue: number) => {
                                        const selected = availableLeaves.find(l => l.ReaIdN === itemValue);
                                        if (selected) {
                                            setSelectedLeaveType(selected);
                                            checkLeaveTypeChange(selected);
                                        }
                                    }}
                                    style={[styles.picker, { color: theme.text }]}
                                    dropdownIconColor={theme.icon}
                                    itemStyle={{ color: theme.text }}
                                >
                                    {availableLeaves.map((leave) => (
                                        <Picker.Item
                                            key={leave.ReaIdN}
                                            label={leave.ReaNameC}
                                            value={leave.ReaIdN}
                                            color={theme.text}
                                        />
                                    ))}
                                </Picker>
                            </View>
                        </View>

                        {/* Dates */}
                        <View style={styles.dateRow}>
                            <View style={styles.dateGroup}>
                                <Text style={labelStyle}>From Date</Text>
                                <TouchableOpacity
                                    style={dateInputStyle}
                                    onPress={() => setShowFromDatePicker(true)}
                                >
                                    <Text style={{ color: theme.text }}>{fromDate.toDateString()}</Text>
                                    <Icon name="calendar-today" size={20} color={theme.icon} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.dateGroup}>
                                <Text style={labelStyle}>To Date</Text>
                                <TouchableOpacity
                                    style={dateInputStyle}
                                    onPress={() => setShowToDatePicker(true)}
                                >
                                    <Text style={{ color: theme.text }}>{toDate.toDateString()}</Text>
                                    <Icon name="calendar-today" size={20} color={theme.icon} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {availableDays > 0 && (
                            <View style={[styles.availabilityBadge, { backgroundColor: theme.inputBg }]}>
                                <Text style={[styles.availabilityText, { color: theme.primary }]}>
                                    Available: {availableDays} day(s)
                                </Text>
                            </View>
                        )}

                        {/* Past Leave */}
                        <View style={styles.formGroup}>
                            <Text style={labelStyle}>Past Leave</Text>
                            <View style={styles.radioGroup}>
                                <TouchableOpacity
                                    style={styles.radioOption}
                                    onPress={() => {
                                        setPastLeaveYes(true);
                                        setPastLeaveNo(false);
                                    }}
                                >
                                    <View style={[styles.radioCircle, { borderColor: theme.primary }]}>
                                        {pastLeaveYes && <View style={[styles.radioSelected, { backgroundColor: theme.primary }]} />}
                                    </View>
                                    <Text style={[styles.radioLabel, { color: theme.text }]}>Yes</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.radioOption}
                                    onPress={() => {
                                        setPastLeaveYes(false);
                                        setPastLeaveNo(true);
                                    }}
                                >
                                    <View style={[styles.radioCircle, { borderColor: theme.primary }]}>
                                        {pastLeaveNo && <View style={[styles.radioSelected, { backgroundColor: theme.primary }]} />}
                                    </View>
                                    <Text style={[styles.radioLabel, { color: theme.text }]}>No</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Time Section (for hourly leaves) */}
                        {showTimeSection && (
                            <View style={styles.formGroup}>
                                <Text style={labelStyle}>Time Details</Text>

                                <View style={styles.timeRow}>
                                    <View style={styles.timeGroup}>
                                        <Text style={[styles.timeLabel, { color: theme.placeholder }]}>From Time</Text>
                                        <TouchableOpacity
                                            style={dateInputStyle}
                                            onPress={() => setShowFromTimePicker(true)}
                                        >
                                            <Text style={{ color: theme.text }}>{fromTime}</Text>
                                            <Icon name="access-time" size={20} color={theme.icon} />
                                        </TouchableOpacity>
                                    </View>

                                    <View style={styles.timeGroup}>
                                        <Text style={[styles.timeLabel, { color: theme.placeholder }]}>To Time</Text>
                                        <TouchableOpacity
                                            style={dateInputStyle}
                                            onPress={() => setShowToTimePicker(true)}
                                        >
                                            <Text style={{ color: theme.text }}>{toTime}</Text>
                                            <Icon name="access-time" size={20} color={theme.icon} />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View style={[styles.totalTime, { backgroundColor: theme.inputBg }]}>
                                    <Text style={[styles.timeLabel, { color: theme.text }]}>Total Hours:</Text>
                                    <Text style={[styles.totalTimeValue, { color: theme.primary }]}>{totalTime}</Text>
                                </View>
                            </View>
                        )}

                        {/* Remarks */}
                        <View style={styles.formGroup}>
                            <Text style={labelStyle}>Remarks</Text>
                            <TextInput
                                style={[inputStyle, styles.textArea]}
                                placeholder="Enter remarks (min. 10 characters)"
                                placeholderTextColor={theme.placeholder}
                                multiline
                                numberOfLines={4}
                                value={remarks}
                                onChangeText={setRemarks}
                            />
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

            {/* Time Pickers (Simplified to Native or basic handling logic as above) */}
            {showFromTimePicker && (
                <DateTimePicker
                    value={(() => {
                        const [h, m] = fromTime.split('.').map(Number);
                        const d = new Date();
                        d.setHours(h || 9, m || 0);
                        return d;
                    })()}
                    mode="time"
                    is24Hour={true}
                    display="default"
                    onChange={(event, date) => {
                        setShowFromTimePicker(false);
                        if (event.type === 'set' && date) {
                            const timeStr = `${date.getHours()}.${date.getMinutes().toString().padStart(2, '0')}`;
                            handleFromTimeChange(timeStr);
                        }
                    }}
                />
            )}

            {showToTimePicker && (
                <DateTimePicker
                    value={(() => {
                        const [h, m] = toTime.split('.').map(Number);
                        const d = new Date();
                        d.setHours(h || 17, m || 0);
                        return d;
                    })()}
                    mode="time"
                    is24Hour={true}
                    display="default"
                    onChange={(event, date) => {
                        setShowToTimePicker(false);
                        if (event.type === 'set' && date) {
                            const timeStr = `${date.getHours()}.${date.getMinutes().toString().padStart(2, '0')}`;
                            handleToTimeChange(timeStr);
                        }
                    }}
                />
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
    formGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },
    pickerContainer: {
        borderWidth: 1,
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
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 14,
    },
    availabilityBadge: {
        padding: 8,
        borderRadius: 6,
        marginBottom: 16,
        alignItems: 'center',
    },
    availabilityText: {
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
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    radioSelected: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    radioLabel: {
        fontSize: 14,
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
        marginBottom: 4,
    },
    totalTime: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderRadius: 8,
    },
    totalTimeValue: {
        fontSize: 16,
        fontWeight: '600',
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 14,
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
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
        // backgroundColor set via theme
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
        borderBottomWidth: 1,
    },
    pickerButton: {
        fontSize: 16,
    },
    pickerConfirm: {
        fontWeight: '600',
    },
    datePicker: {
        width: '100%',
    },
});

export default ApplyLeaveModal;