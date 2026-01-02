import { MaterialIcons as Icon } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import React, { useState } from 'react';
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
import RNPickerSelect from 'react-native-picker-select';
import { useTheme } from '../../context/ThemeContext';

interface UploadDocumentModalProps {
    visible: boolean;
    onClose: () => void;
    onUpload: (data: UploadData) => Promise<void>;
    uploading: boolean;
}

interface UploadData {
    name: string;
    type: string;
    remarks: string;
    file: {
        uri: string;
        name: string;
        type: string;
    };
}

const documentTypes = [
    { label: 'Education', value: 'EDUCATION' },
    { label: 'Experience', value: 'EXPERIENCE' },
    { label: 'Proof', value: 'PROOF' },
    { label: 'Birth Certificate', value: 'BIRTH' },
];

const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({
    visible,
    onClose,
    onUpload,
    uploading,
}) => {
    const { theme } = useTheme();
    const [documentName, setDocumentName] = useState('');
    const [documentType, setDocumentType] = useState('');
    const [remarks, setRemarks] = useState('');
    const [selectedFile, setSelectedFile] = useState<any | null>(null);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const validateForm = (): boolean => {
        const newErrors: { [key: string]: string } = {};

        if (!documentName.trim()) {
            newErrors.documentName = 'Document name is required';
        }

        if (!documentType) {
            newErrors.documentType = 'Please select a document type';
        }

        if (!remarks.trim()) {
            newErrors.remarks = 'Remarks are required';
        } else if (remarks.trim().length < 11) {
            newErrors.remarks = 'Remarks should be more than 10 characters';
        }

        if (!selectedFile) {
            newErrors.file = 'Please select a file to upload';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: [
                    'application/pdf',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'image/*'
                ],
                copyToCacheDirectory: true,
            });

            if (result.canceled) {
                // User cancelled
                return;
            }

            const file = result.assets ? result.assets[0] : result; // Handle API differences if any

            if (file.size && file.size > 10 * 1024 * 1024) { // 10MB limit
                Alert.alert('Error', 'File size should be less than 10MB');
                return;
            }

            // Map to expected structure
            const mappedFile = {
                uri: file.uri,
                name: file.name,
                type: file.mimeType || 'application/octet-stream',
                size: file.size
            };

            setSelectedFile(mappedFile as any);
            setErrors(prev => ({ ...prev, file: '' }));
        } catch (err) {
            Alert.alert('Error', 'Failed to pick document');
        }
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        // Confirmation dialog
        Alert.alert(
            'Confirm Upload',
            'Are you sure you want to upload this document?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Upload',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            if (!selectedFile) return;

                            const uploadData: UploadData = {
                                name: documentName.trim(),
                                type: documentType,
                                remarks: remarks.trim(),
                                file: {
                                    uri: selectedFile.uri,
                                    name: selectedFile.name || 'document',
                                    type: selectedFile.type || 'application/octet-stream',
                                },
                            };

                            await onUpload(uploadData);
                            resetForm();
                        } catch (error) {
                            console.error('Upload error:', error);
                        }
                    },
                },
            ]
        );
    };

    const resetForm = () => {
        setDocumentName('');
        setDocumentType('');
        setRemarks('');
        setSelectedFile(null);
        setErrors({});
    };

    const handleClose = () => {
        if (uploading) {
            Alert.alert(
                'Upload in Progress',
                'Document upload is in progress. Are you sure you want to cancel?',
                [
                    { text: 'Continue Upload', style: 'cancel' },
                    {
                        text: 'Cancel Upload',
                        onPress: () => {
                            resetForm();
                            onClose();
                        },
                    },
                ]
            );
        } else {
            resetForm();
            onClose();
        }
    };

    const getFileIcon = () => {
        if (!selectedFile) return 'insert-drive-file';

        const fileName = selectedFile.name?.toLowerCase() || '';
        if (fileName.endsWith('.pdf')) return 'picture-as-pdf';
        if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) return 'description';
        if (fileName.endsWith('.jpg') || fileName.endsWith('.png') || fileName.endsWith('.jpeg')) {
            return 'image';
        }
        return 'insert-drive-file';
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={handleClose}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContainer, { backgroundColor: theme.cardBackground }]}>
                    {/* Header */}
                    <View style={[styles.modalHeader, { borderBottomColor: theme.inputBorder }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>Upload Document</Text>
                        <TouchableOpacity onPress={handleClose} disabled={uploading}>
                            <Icon name="close" size={24} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        style={styles.modalContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Document Name */}
                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: theme.text }]}>
                                Document Name <Text style={styles.required}>*</Text>
                            </Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text },
                                    errors.documentName && styles.inputError
                                ]}
                                placeholder="Enter document name"
                                placeholderTextColor={theme.placeholder}
                                value={documentName}
                                onChangeText={(text) => {
                                    setDocumentName(text);
                                    setErrors(prev => ({ ...prev, documentName: '' }));
                                }}
                                editable={!uploading}
                            />
                            {errors.documentName ? (
                                <Text style={styles.errorText}>{errors.documentName}</Text>
                            ) : null}
                        </View>

                        {/* Document Type */}
                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: theme.text }]}>
                                Document Type <Text style={styles.required}>*</Text>
                            </Text>
                            <View style={[
                                styles.pickerContainer,
                                { backgroundColor: theme.inputBg, borderColor: theme.inputBorder },
                                errors.documentType && styles.inputError
                            ]}>
                                <RNPickerSelect
                                    onValueChange={(value) => {
                                        setDocumentType(value);
                                        setErrors(prev => ({ ...prev, documentType: '' }));
                                    }}
                                    items={documentTypes}
                                    placeholder={{ label: 'Select document type', value: null }}
                                    value={documentType}
                                    disabled={uploading}
                                    style={{
                                        inputIOS: [styles.pickerInput, { color: theme.text }],
                                        inputAndroid: [styles.pickerInput, { color: theme.text }],
                                        placeholder: { color: theme.placeholder },
                                    }}
                                    Icon={() => (
                                        <Icon name="arrow-drop-down" size={24} color={theme.icon} />
                                    )}
                                />
                            </View>
                            {errors.documentType ? (
                                <Text style={styles.errorText}>{errors.documentType}</Text>
                            ) : null}
                        </View>

                        {/* Remarks */}
                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: theme.text }]}>
                                Remarks <Text style={styles.required}>*</Text>
                            </Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    styles.multilineInput,
                                    { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text },
                                    errors.remarks && styles.inputError,
                                ]}
                                placeholder="Enter remarks (min. 11 characters)"
                                placeholderTextColor={theme.placeholder}
                                value={remarks}
                                onChangeText={(text) => {
                                    setRemarks(text);
                                    setErrors(prev => ({ ...prev, remarks: '' }));
                                }}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                                editable={!uploading}
                            />
                            <Text style={[styles.charCount, { color: theme.textLight }]}>
                                {remarks.length} / 11 characters minimum
                            </Text>
                            {errors.remarks ? (
                                <Text style={styles.errorText}>{errors.remarks}</Text>
                            ) : null}
                        </View>

                        {/* File Selection */}
                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: theme.text }]}>
                                Select File <Text style={styles.required}>*</Text>
                            </Text>
                            <TouchableOpacity
                                style={[
                                    styles.filePicker,
                                    { backgroundColor: theme.inputBg, borderColor: theme.inputBorder },
                                    errors.file && styles.inputError
                                ]}
                                onPress={pickDocument}
                                disabled={uploading}
                            >
                                {selectedFile ? (
                                    <View style={styles.fileInfo}>
                                        <Icon name={getFileIcon()} size={24} color={theme.primary} />
                                        <View style={styles.fileDetails}>
                                            <Text style={[styles.fileName, { color: theme.text }]} numberOfLines={1}>
                                                {selectedFile.name}
                                            </Text>
                                            <Text style={[styles.fileSize, { color: theme.textLight }]}>
                                                {selectedFile.size ? formatFileSize(selectedFile.size) : 'Unknown size'}
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => setSelectedFile(null)}
                                            disabled={uploading}
                                        >
                                            <Icon name="close" size={20} color="#F44336" />
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <View style={styles.filePlaceholder}>
                                        <Icon name="cloud-upload" size={32} color={theme.icon} />
                                        <Text style={[styles.filePlaceholderText, { color: theme.textLight }]}>
                                            Tap to select document
                                        </Text>
                                        <Text style={[styles.fileHint, { color: theme.placeholder }]}>
                                            Supported: PDF, DOC, DOCX, Images
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                            {errors.file ? (
                                <Text style={styles.errorText}>{errors.file}</Text>
                            ) : null}
                        </View>

                        {/* Upload Button */}
                        <TouchableOpacity
                            style={[styles.uploadButton, { backgroundColor: theme.primary }, uploading && styles.uploadButtonDisabled]}
                            onPress={handleSubmit}
                            disabled={uploading}
                        >
                            {uploading ? (
                                <>
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                    <Text style={styles.uploadButtonText}>Uploading...</Text>
                                </>
                            ) : (
                                <>
                                    <Icon name="cloud-upload" size={20} color="#FFFFFF" />
                                    <Text style={styles.uploadButtonText}>Upload Document</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        {/* Cancel Button */}
                        <TouchableOpacity
                            style={[
                                styles.cancelButton,
                                { borderColor: theme.inputBorder }
                            ]}
                            onPress={handleClose}
                            disabled={uploading}
                        >
                            <Text style={[styles.cancelButtonText, { color: theme.textLight }]}>Cancel</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    modalContent: {
        padding: 20,
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },
    required: {
        color: '#F44336',
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: Platform.OS === 'ios' ? 12 : 8,
        fontSize: 16,
    },
    inputError: {
        borderColor: '#F44336',
    },
    multilineInput: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    errorText: {
        color: '#F44336',
        fontSize: 12,
        marginTop: 4,
    },
    charCount: {
        fontSize: 12,
        marginTop: 4,
        textAlign: 'right',
    },
    pickerContainer: {
        borderWidth: 1,
        borderRadius: 8,
    },
    pickerInput: {
        fontSize: 16,
        paddingHorizontal: 12,
        paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    },
    pickerPlaceholder: {},
    filePicker: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 16,
    },
    fileInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    fileDetails: {
        flex: 1,
        marginLeft: 12,
    },
    fileName: {
        fontSize: 14,
        fontWeight: '500',
    },
    fileSize: {
        fontSize: 12,
        marginTop: 2,
    },
    filePlaceholder: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    filePlaceholderText: {
        fontSize: 16,
        marginTop: 12,
    },
    fileHint: {
        fontSize: 12,
        marginTop: 4,
    },
    uploadButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 14,
        borderRadius: 8,
        marginTop: 10,
        marginBottom: 16,
    },
    uploadButtonDisabled: {
        opacity: 0.7,
    },
    uploadButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    cancelButton: {
        paddingVertical: 14,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '500',
    },
});

export default UploadDocumentModal;