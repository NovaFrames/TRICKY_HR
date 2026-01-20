import React, { useRef, useState } from 'react';
import {
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import SignatureCanvas from 'react-native-signature-canvas';
import { useTheme } from '../../context/ThemeContext';
import { CustomButton } from '../CustomButton';

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
                    <CustomButton
                        title="Cancel"
                        icon="close"
                        onPress={onClose}
                        style={[styles.button, styles.cancelButton]}
                    />

                    <CustomButton
                        title="Clear"
                        icon="trash-outline"
                        onPress={handleClear}
                        style={[styles.button, styles.clearButton]}
                    />

                    <CustomButton
                        title="Done"
                        icon="checkmark-circle"
                        onPress={handleEnd}
                        disabled={!hasSignature}
                        style={[styles.button, styles.doneButton, { backgroundColor: theme.primary }]}
                    />
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
        borderRadius: 4,
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
        borderRadius: 4,
        marginBottom: 0,
    },
    cancelButton: {
        backgroundColor: '#F44336',
    },
    clearButton: {
        backgroundColor: '#9E9E9E',
    },
    doneButton: {
        // backgroundColor set dynamically
    },
});
