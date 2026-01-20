import { ThemeType } from '@/theme/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface DocumentPickerModalProps {
    visible: boolean;
    theme: ThemeType;
    onCancel: () => void;
    onTakePhoto: () => void;
    onPickImage: () => void;
    onPickDocument: () => void;
}

const DocumentPickerModal: React.FC<DocumentPickerModalProps> = ({
    visible,
    theme,
    onCancel,
    onTakePhoto,
    onPickImage,
    onPickDocument
}) => (
    <Modal
        visible={visible}
        animationType="fade"
        transparent={true}
        onRequestClose={onCancel}
    >
        <View style={styles.overlay}>
            <View style={[styles.modal, { backgroundColor: theme.cardBackground }]}>
                <View style={[styles.header, { borderBottomColor: theme.inputBorder }]}>
                    <Text style={[styles.title, { color: theme.text }]}>Add Document</Text>
                    <TouchableOpacity onPress={onCancel}>
                        <Ionicons name="close" size={24} color={theme.text} />
                    </TouchableOpacity>
                </View>

                <View style={styles.options}>
                    <TouchableOpacity style={styles.option} onPress={onTakePhoto}>
                        <View style={[styles.iconCircle, { backgroundColor: theme.inputBg }]}>
                            <Ionicons name="camera" size={30} color={theme.primary} />
                        </View>
                        <Text style={[styles.optionText, { color: theme.text }]}>Camera</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.option} onPress={onPickImage}>
                        <View style={[styles.iconCircle, { backgroundColor: theme.inputBg }]}>
                            <Ionicons name="image" size={30} color={theme.primary} />
                        </View>
                        <Text style={[styles.optionText, { color: theme.text }]}>Gallery</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.option} onPress={onPickDocument}>
                        <View style={[styles.iconCircle, { backgroundColor: theme.inputBg }]}>
                            <Ionicons name="document" size={30} color={theme.primary} />
                        </View>
                        <Text style={[styles.optionText, { color: theme.text }]}>Files</Text>
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
        borderRadius: 4,
        width: '85%',
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 18,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    options: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 30,
    },
    option: {
        alignItems: 'center',
    },
    iconCircle: {
        width: 60,
        height: 60,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    optionText: {
        fontSize: 14,
        fontWeight: '500',
    },
});

export default DocumentPickerModal;
