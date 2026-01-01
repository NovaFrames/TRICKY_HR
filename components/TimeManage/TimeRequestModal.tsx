import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import ApiService from '../../services/ApiService';

interface TimeRequestModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const RequestTypes = [
    { label: 'In Time', value: 'In Time' },
    { label: 'Out Time', value: 'Out Time' },
    { label: 'In & Out Time', value: 'In & Out Time' },
];

const TimeRequestModal: React.FC<TimeRequestModalProps> = ({ visible, onClose, onSuccess }) => {
    const { theme } = useTheme();
    const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState<{ label: string; value: number }[]>([]);
    const [showInTimePicker, setShowInTimePicker] = useState(false);
    const [showOutTimePicker, setShowOutTimePicker] = useState(false);

    const [formData, setFormData] = useState({
        date: new Date(),
        projectId: 0,
        requestType: 'In Time',
        inTime: '00:00',
        outTime: '00:00',
        remarks: '',
    });

    useEffect(() => {
        if (visible) {
            getEmpId();
            fetchProjects();
            // Reset form logic if needed, but keeping existing state is sometimes better or reset here
            setFormData(prev => ({
                ...prev,
                date: new Date(),
                projectId: 0,
                requestType: 'In Time',
                inTime: '00:00',
                outTime: '00:00',
                remarks: '',
            }));
        }
    }, [visible]);

    const getEmpId = async () => {
        const id = await AsyncStorage.getItem('EmpId');
        // Logic if needed
    };

    const fetchProjects = async () => {
        try {
            const { token } = ApiService.getCurrentUser();
            if (!token) return;

            const result = await ApiService.getProjectList(token);
            // Result is either array or { Status: 'success', data: [...] } based on ApiService
            // ApiService.ts says: return response?.data?.data || response?.data || [];
            // So result IS the data array (or object if structure differs).
            // Let's assume result is the array directly or contains data.
            // Previous code used result.success check. 
            // If ApiService returns array directly, result.success is undefined.
            // Let's check if array.

            let projectsData = [];
            if (Array.isArray(result)) {
                projectsData = result;
            } else if (result && result.data && Array.isArray(result.data)) {
                projectsData = result.data;
            } else if (result && result.Status === 'success' && Array.isArray(result.data)) {
                projectsData = result.data;
            }

            // Safety check
            if (projectsData.length > 0) {
                const mapped = projectsData.map((p: any) => ({
                    label: p.ProjectNameC || p.NameC || `Project ${p.ProjectIdN || p.IdN}`,
                    value: p.ProjectIdN || p.IdN,
                }));
                setProjects(mapped);
            }

        } catch (error) {
            console.log('Error fetching projects', error);
        }
    };

    const handleSubmit = async () => {
        if (!formData.projectId) {
            Alert.alert('Validation', 'Please select a project');
            return;
        }

        setLoading(true);
        try {
            const currentUser = ApiService.getCurrentUser();
            const empId = currentUser?.empId || await AsyncStorage.getItem('EmpId');

            if (!empId) {
                Alert.alert('Error', 'User ID not found');
                setLoading(false);
                return;
            }

            const d = formData.date;
            const dateString = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;

            const requests = [];

            if (formData.requestType === 'In Time') {
                requests.push({
                    InTimeN: formData.inTime,
                    OutTimeN: '00:00'
                });
            } else if (formData.requestType === 'Out Time') {
                requests.push({
                    InTimeN: '00:00',
                    OutTimeN: formData.outTime
                });
            } else if (formData.requestType === 'In & Out Time') {
                requests.push({
                    InTimeN: formData.inTime,
                    OutTimeN: '00:00'
                });
                requests.push({
                    InTimeN: '00:00',
                    OutTimeN: formData.outTime
                });
            }

            let successCount = 0;
            let errorMsg = '';

            for (const req of requests) {
                const payload = {
                    TokenC: '',
                    model: {
                        EmpIdN: Number(empId),
                        DateD: dateString,
                        InTimeN: req.InTimeN.replace(':', '.'), // Send as string "HH.MM"
                        OutTimeN: req.OutTimeN.replace(':', '.'), // Send as string "HH.MM"
                        ProjectIdN: formData.projectId,
                        TMSRemarksC: formData.remarks
                    }
                };

                const result = await ApiService.submitTimeRequest(payload);

                if (result.success) {
                    successCount++;
                } else {
                    errorMsg = result.error || 'Failed';
                }
            }

            if (successCount === requests.length) {
                Alert.alert('Success', 'Time request submitted successfully');
                onSuccess?.();
                onClose();
            } else {
                if (successCount > 0) {
                    Alert.alert('Partial Success', 'Some requests submitted, others failed: ' + errorMsg);
                    onSuccess?.();
                    onClose();
                } else {
                    Alert.alert('Error', errorMsg || 'Failed to submit request');
                }
            }
        } catch (error) {
            console.log(error);
            Alert.alert('Error', 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: Date) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[date.getMonth()]} ${String(date.getDate()).padStart(2, '0')} ${date.getFullYear()}`;
    };

    // Shared Styles using Theme
    const inputStyle = [styles.inputContainer, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }];
    const labelStyle = [styles.label, { color: theme.textLight }];
    const textStyle = [styles.inputText, { color: theme.text }];
    const pickerStyle = [styles.pickerContainer, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }];

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: theme.cardBackground }]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: theme.primary }]}>Time Request</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={theme.icon} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.form}>
                        {/* Date Field */}
                        <View style={styles.field}>
                            <Text style={labelStyle}>Date</Text>
                            <View style={inputStyle}>
                                <Text style={textStyle}>{formatDate(formData.date)}</Text>
                                <Ionicons name="calendar-outline" size={20} color={theme.icon} />
                            </View>
                        </View>

                        {/* Project Dropdown */}
                        <View style={styles.field}>
                            <Text style={labelStyle}>Project</Text>
                            <View style={pickerStyle}>
                                <Picker
                                    selectedValue={formData.projectId}
                                    onValueChange={(itemValue) => setFormData(prev => ({ ...prev, projectId: itemValue }))}
                                    style={[styles.picker, { color: theme.text }]}
                                    dropdownIconColor={theme.icon}
                                    itemStyle={{ color: theme.text }}
                                >
                                    <Picker.Item label="--Select--" value={0} color={theme.text} />
                                    {projects.map((p) => (
                                        <Picker.Item key={p.value} label={p.label} value={p.value} color={theme.text} />
                                    ))}
                                </Picker>
                            </View>
                        </View>

                        {/* Request Type */}
                        <View style={styles.field}>
                            <Text style={labelStyle}>Request Type</Text>
                            <View style={pickerStyle}>
                                <Picker
                                    selectedValue={formData.requestType}
                                    onValueChange={(itemValue) => setFormData(prev => ({ ...prev, requestType: itemValue }))}
                                    style={[styles.picker, { color: theme.text }]}
                                    dropdownIconColor={theme.icon}
                                    itemStyle={{ color: theme.text }}
                                >
                                    {RequestTypes.map((t) => (
                                        <Picker.Item key={t.value} label={t.label} value={t.value} color={theme.text} />
                                    ))}
                                </Picker>
                            </View>
                        </View>

                        {/* In Time / Out Time Inputs */}
                        <View style={styles.row}>
                            {(formData.requestType === 'In Time' || formData.requestType === 'In & Out Time') && (
                                <View style={[styles.field, { flex: 1 }]}>
                                    <Text style={labelStyle}>In Time</Text>
                                    <TouchableOpacity
                                        style={inputStyle}
                                        onPress={() => setShowInTimePicker(true)}
                                    >
                                        <Text style={textStyle}>{formData.inTime}</Text>
                                        <Ionicons name="time-outline" size={20} color={theme.icon} />
                                    </TouchableOpacity>
                                    {showInTimePicker && (
                                        <DateTimePicker
                                            value={new Date()}
                                            mode="time"
                                            is24Hour={true}
                                            display="default"
                                            onChange={(event, selectedDate) => {
                                                setShowInTimePicker(false);
                                                if (selectedDate) {
                                                    const hours = String(selectedDate.getHours()).padStart(2, '0');
                                                    const minutes = String(selectedDate.getMinutes()).padStart(2, '0');
                                                    setFormData(prev => ({ ...prev, inTime: `${hours}:${minutes}` }));
                                                }
                                            }}
                                        />
                                    )}
                                </View>
                            )}

                            {(formData.requestType === 'Out Time' || formData.requestType === 'In & Out Time') && (
                                <View style={[styles.field, { flex: 1 }]}>
                                    <Text style={labelStyle}>Out Time</Text>
                                    <TouchableOpacity
                                        style={inputStyle}
                                        onPress={() => setShowOutTimePicker(true)}
                                    >
                                        <Text style={textStyle}>{formData.outTime}</Text>
                                        <Ionicons name="time-outline" size={20} color={theme.icon} />
                                    </TouchableOpacity>
                                    {showOutTimePicker && (
                                        <DateTimePicker
                                            value={new Date()}
                                            mode="time"
                                            is24Hour={true}
                                            display="default"
                                            onChange={(event, selectedDate) => {
                                                setShowOutTimePicker(false);
                                                if (selectedDate) {
                                                    const hours = String(selectedDate.getHours()).padStart(2, '0');
                                                    const minutes = String(selectedDate.getMinutes()).padStart(2, '0');
                                                    setFormData(prev => ({ ...prev, outTime: `${hours}:${minutes}` }));
                                                }
                                            }}
                                        />
                                    )}
                                </View>
                            )}
                        </View>

                        {/* Remarks */}
                        <View style={styles.field}>
                            <Text style={labelStyle}>Remarks</Text>
                            <TextInput
                                style={[styles.inputContainer, styles.inputText, styles.textArea, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
                                value={formData.remarks}
                                onChangeText={(text) => setFormData(prev => ({ ...prev, remarks: text }))}
                                placeholder="Enter reason"
                                placeholderTextColor={theme.placeholder}
                                multiline
                                numberOfLines={3}
                            />
                        </View>

                        {/* Buttons */}
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity style={[styles.button, styles.cancelButton, { borderColor: theme.inputBorder, backgroundColor: theme.background }]} onPress={onClose} disabled={loading}>
                                <Text style={[styles.cancelButtonText, { color: theme.textLight }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.button, styles.submitButton, { backgroundColor: theme.primary }]} onPress={handleSubmit} disabled={loading}>
                                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Submit</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    container: {
        borderRadius: 16,
        padding: 24,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    form: {
        gap: 16,
    },
    field: {
        gap: 8,
    },
    row: {
        flexDirection: 'row',
        gap: 16
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    inputText: {
        flex: 1,
        fontSize: 14,
    },
    pickerContainer: {
        borderWidth: 1,
        borderRadius: 8,
        overflow: 'hidden',
    },
    picker: {
        height: 50,
        width: '100%',
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
        paddingTop: 12,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 60,
    },
    button: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        borderWidth: 1,
    },
    submitButton: {
        elevation: 2,
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    }
});

export default TimeRequestModal;
