import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import ApiService from '../../services/ApiService';
import AppModal from '../common/AppModal';
import CenterModalSelection from '../common/CenterModalSelection';

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
    const [showProjectSelector, setShowProjectSelector] = useState(false);
    const [showRequestTypeSelector, setShowRequestTypeSelector] = useState(false);
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
            fetchProjects();
            setFormData({
                date: new Date(),
                projectId: 0,
                requestType: 'In Time',
                inTime: '00:00',
                outTime: '00:00',
                remarks: '',
            });
        }
    }, [visible]);

    const fetchProjects = async () => {
        try {
            const projectsData = await ApiService.getProjectList();

            if (projectsData && projectsData.length > 0) {
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
                return;
            }

            const d = formData.date;
            const dateString = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
            const requests = [];

            if (formData.requestType === 'In Time') {
                requests.push({ InTimeN: formData.inTime, OutTimeN: '00:00' });
            } else if (formData.requestType === 'Out Time') {
                requests.push({ InTimeN: '00:00', OutTimeN: formData.outTime });
            } else if (formData.requestType === 'In & Out Time') {
                requests.push({ InTimeN: formData.inTime, OutTimeN: '00:00' });
                requests.push({ InTimeN: '00:00', OutTimeN: formData.outTime });
            }

            let successCount = 0;
            let errorMsg = '';

            for (const req of requests) {
                const payload = {
                    TokenC: '',
                    model: {
                        EmpIdN: Number(empId),
                        DateD: dateString,
                        InTimeN: req.InTimeN.replace(':', '.'),
                        OutTimeN: req.OutTimeN.replace(':', '.'),
                        ProjectIdN: formData.projectId,
                        TMSRemarksC: formData.remarks
                    }
                };
                const result = await ApiService.submitTimeRequest(payload);
                if (result.success) successCount++;
                else errorMsg = result.error || 'Failed';
            }

            if (successCount === requests.length) {
                Alert.alert('Success', 'Time request submitted successfully');
                onSuccess?.();
                onClose();
            } else {
                Alert.alert(successCount > 0 ? 'Partial Success' : 'Error', errorMsg || 'Failed to submit request');
                if (successCount > 0) { onSuccess?.(); onClose(); }
            }
        } catch (error) {
            Alert.alert('Error', 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    const labelStyle = [styles.label, { color: theme.text }];
    const inputStyle = [styles.inputWrapper, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }];

    return (
        <>
            <AppModal
                visible={visible}
                onClose={onClose}
                title="Time Request"
                footer={
                    <View style={styles.footerRow}>
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
                                    <Ionicons name="send" size={20} color="#fff" />
                                    <Text style={styles.submitButtonText}>Submit Request</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                }
            >
                <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* Date Field (Read-only as per policy usually, but shown as fixed) */}
                    <View style={styles.formGroup}>
                        <Text style={labelStyle}>Date</Text>
                        <View style={inputStyle}>
                            <Text style={{ color: theme.text }}>{formData.date.toLocaleDateString()}</Text>
                            <Ionicons name="calendar-outline" size={20} color={theme.icon} />
                        </View>
                    </View>

                    {/* Project Dropdown */}
                    <View style={styles.formGroup}>
                        <Text style={labelStyle}>Project</Text>
                        <TouchableOpacity
                            style={inputStyle}
                            onPress={() => setShowProjectSelector(true)}
                        >
                            <Text style={{ color: formData.projectId ? theme.text : theme.placeholder }}>
                                {formData.projectId ? projects.find(p => p.value === formData.projectId)?.label : 'Select Project'}
                            </Text>
                            <Ionicons name="chevron-down" size={24} color={theme.icon} />
                        </TouchableOpacity>
                    </View>

                    {/* Request Type */}
                    <View style={styles.formGroup}>
                        <Text style={labelStyle}>Request Type</Text>
                        <TouchableOpacity
                            style={inputStyle}
                            onPress={() => setShowRequestTypeSelector(true)}
                        >
                            <Text style={{ color: theme.text }}>{formData.requestType}</Text>
                            <Ionicons name="chevron-down" size={24} color={theme.icon} />
                        </TouchableOpacity>
                    </View>

                    {/* In/Out Time */}
                    <View style={styles.timeRow}>
                        {(formData.requestType === 'In Time' || formData.requestType === 'In & Out Time') && (
                            <View style={styles.timeGroup}>
                                <Text style={labelStyle}>In Time</Text>
                                <TouchableOpacity style={inputStyle} onPress={() => setShowInTimePicker(true)}>
                                    <Text style={{ color: theme.text }}>{formData.inTime}</Text>
                                    <Ionicons name="time-outline" size={20} color={theme.icon} />
                                </TouchableOpacity>
                            </View>
                        )}
                        {(formData.requestType === 'Out Time' || formData.requestType === 'In & Out Time') && (
                            <View style={styles.timeGroup}>
                                <Text style={labelStyle}>Out Time</Text>
                                <TouchableOpacity style={inputStyle} onPress={() => setShowOutTimePicker(true)}>
                                    <Text style={{ color: theme.text }}>{formData.outTime}</Text>
                                    <Ionicons name="time-outline" size={20} color={theme.icon} />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={labelStyle}>Remarks</Text>
                        <TextInput
                            style={[styles.input, styles.textArea, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
                            value={formData.remarks}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, remarks: text }))}
                            placeholder="Reason for request"
                            placeholderTextColor={theme.placeholder}
                            multiline
                            numberOfLines={4}
                        />
                    </View>
                </ScrollView>
            </AppModal>

            {/* Time Pickers */}
            {showInTimePicker && (
                <DateTimePicker
                    value={new Date()}
                    mode="time"
                    is24Hour={true}
                    display="default"
                    onChange={(event, date) => {
                        setShowInTimePicker(false);
                        if (date) {
                            const hours = String(date.getHours()).padStart(2, '0');
                            const minutes = String(date.getMinutes()).padStart(2, '0');
                            setFormData(prev => ({ ...prev, inTime: `${hours}:${minutes}` }));
                        }
                    }}
                />
            )}
            {showOutTimePicker && (
                <DateTimePicker
                    value={new Date()}
                    mode="time"
                    is24Hour={true}
                    display="default"
                    onChange={(event, date) => {
                        setShowOutTimePicker(false);
                        if (date) {
                            const hours = String(date.getHours()).padStart(2, '0');
                            const minutes = String(date.getMinutes()).padStart(2, '0');
                            setFormData(prev => ({ ...prev, outTime: `${hours}:${minutes}` }));
                        }
                    }}
                />
            )}

            <CenterModalSelection
                visible={showProjectSelector}
                onClose={() => setShowProjectSelector(false)}
                title="Select Project"
                options={projects}
                selectedValue={formData.projectId}
                onSelect={(val) => setFormData(prev => ({ ...prev, projectId: val }))}
            />
            <CenterModalSelection
                visible={showRequestTypeSelector}
                onClose={() => setShowRequestTypeSelector(false)}
                title="Select Request Type"
                options={RequestTypes}
                selectedValue={formData.requestType}
                onSelect={(val) => setFormData(prev => ({ ...prev, requestType: val }))}
            />
        </>
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        padding: 18,
        flexShrink: 1,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    inputWrapper: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 4,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    timeRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    timeGroup: {
        flex: 1,
    },
    input: {
        borderWidth: 1,
        borderRadius: 4,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        fontWeight: '600',
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    footerRow: {
        flexDirection: 'row',
        gap: 12,
    },
    footerButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
        borderRadius: 4,
    },
    cancelButton: {
        borderWidth: 1,
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '700',
    },
    submitButton: {
        elevation: 2
        ,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
        marginLeft: 8,
    },
});

export default TimeRequestModal;
