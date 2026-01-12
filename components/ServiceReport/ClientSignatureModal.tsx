import React, { useRef, useState } from 'react';
import {
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import SignatureCanvas from 'react-native-signature-canvas';
import { useTheme } from '../../context/ThemeContext';

interface ClientSignatureModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (signature: string) => void;
}

const { width, height } = Dimensions.get('window');

export default function ClientSignatureModal({
    visible,
    onClose,
    onSave,
}: ClientSignatureModalProps) {
    const { theme } = useTheme();
    const signatureRef = useRef<any>(null);
    const [hasSignature, setHasSignature] = useState(false);

    const handleOK = (signature: string) => {
        onSave(signature);
        onClose();
        setHasSignature(false);
    };

    const handleClear = () => {
        signatureRef.current?.clearSignature();
        setHasSignature(false);
    };

    const handleEmpty = () => {
        console.log('Signature is empty');
    };

    const handleBegin = () => {
        setHasSignature(true);
    };

    const handleEnd = () => {
        signatureRef.current?.readSignature();
    };

    const style = `
        .m-signature-pad {
            box-shadow: none;
            border: none;
        }
        .m-signature-pad--body {
            border: none;
        }
        .m-signature-pad--footer {
            display: none;
        }
        body,html {
            width: 100%;
            height: 100%;
        }
    `;

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
                    <Text style={styles.headerTitle}>Client Signature</Text>
                </View>

                {/* Signature Canvas */}
                <View style={[styles.canvasContainer, { borderColor: theme.inputBorder }]}>
                    <SignatureCanvas
                        ref={signatureRef}
                        onOK={handleOK}
                        onEmpty={handleEmpty}
                        onBegin={handleBegin}

                        descriptionText=""
                        clearText="Clear"
                        confirmText="Save"
                        webStyle={style}
                        autoClear={false}
                        backgroundColor={theme.cardBackground}
                        penColor={theme.text}
                    />
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[styles.button, styles.cancelButton]}
                        onPress={onClose}
                    >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.clearButton]}
                        onPress={handleClear}
                    >
                        <Text style={styles.clearButtonText}>Clear</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.doneButton, { backgroundColor: theme.primary }]}
                        onPress={handleEnd}
                        disabled={!hasSignature}
                    >
                        <Text style={styles.doneButtonText}>Done</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 50,
        paddingBottom: 16,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
    canvasContainer: {
        flex: 1,
        margin: 20,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderRadius: 8,
        overflow: 'hidden',
    },
    buttonContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingBottom: 30,
        gap: 10,
    },
    button: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: '#F44336',
    },
    cancelButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    clearButton: {
        backgroundColor: '#9E9E9E',
    },
    clearButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    doneButton: {
        // backgroundColor set dynamically
    },
    doneButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});
