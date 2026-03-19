import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Animated,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    useWindowDimensions,
    View
} from 'react-native';
import Modal from "@/components/common/SingleModal";
import { useTheme } from '../../context/ThemeContext';

interface AppModalProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    size?: "sm" | "md" | "lg";
}

const AppModal: React.FC<AppModalProps> = ({
    visible,
    onClose,
    title,
    subtitle,
    children,
    footer,
    size = "md",
}) => {
    const { theme } = useTheme();
    const isWeb = Platform.OS === "web";
    const { width, height } = useWindowDimensions();
    const isSmall = width < 420;
    const getModalMaxWidth = () => {
        if (size === "sm") return isWeb ? 520 : 460;
        if (size === "lg") return isWeb ? 820 : 620;
        return isWeb ? 640 : 560;
    };
    const modalMaxWidth = getModalMaxWidth();
    const [scaleValue] = useState(new Animated.Value(0));
    const [opacityValue] = useState(new Animated.Value(0));

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(scaleValue, {
                    toValue: 1,
                    useNativeDriver: true,
                    tension: 65,
                    friction: 11
                }),
                Animated.timing(opacityValue, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                })
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(scaleValue, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityValue, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                })
            ]).start();
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="none"
            onRequestClose={onClose}
        >
            <View style={[styles.modalOverlay, { padding: isWeb ? 18 : 16 }]}>
                <TouchableWithoutFeedback onPress={onClose}>
                    <Animated.View style={[styles.overlayBg, { opacity: opacityValue }]} />
                </TouchableWithoutFeedback>

                <Animated.View
                    style={[
                        styles.modalContent,
                        {
                            backgroundColor: theme.cardBackground,
                            borderColor: theme.inputBorder,
                            borderWidth: 1,
                            width: isWeb ? "92%" : "100%",
                            maxWidth: modalMaxWidth,
                            maxHeight: isWeb ? height * 0.86 : height * 0.9,
                            transform: [{ scale: scaleValue }],
                            opacity: opacityValue
                        }
                    ]}
                >
                    {/* Header */}
                    <View style={[styles.modalHeader, { borderBottomColor: theme.inputBorder }]}>
                        <View style={styles.titleContainer}>
                            <Text
                                style={[
                                    styles.modalTitle,
                                    { color: theme.primary, fontSize: isSmall ? 18 : 20 },
                                ]}
                            >
                                {title}
                            </Text>
                            {subtitle ? (
                                <Text style={[styles.modalSubtitle, { color: theme.placeholder }]}>{subtitle}</Text>
                            ) : null}
                        </View>
                        <TouchableOpacity
                            onPress={onClose}
                            style={[styles.closeIcon, { backgroundColor: theme.inputBg }]}
                        >
                            <Ionicons name="close" size={20} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Body */}
                    <View
                        style={[
                            styles.modalBody,
                            { maxHeight: isWeb ? height * 0.68 : height * 0.72 },
                        ]}
                    >
                        {children}
                    </View>

                    {/* Footer */}
                    {footer ? (
                        <View style={[styles.modalFooter, { borderTopColor: theme.inputBorder }]}>
                            {footer}
                        </View>
                    ) : null}
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlayBg: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    modalContent: {
        width: '100%',
        borderRadius: 10,
        elevation: 10,
        maxHeight: '90%',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    titleContainer: {
        flex: 1,
        marginRight: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    modalSubtitle: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 2,
    },
    closeIcon: {
        width: 36,
        height: 36,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBody: {
        flexShrink: 1,
        padding: 0,
    },
    modalFooter: {
        padding: 18,
        borderTopWidth: 1,
    },
});

export default AppModal;
