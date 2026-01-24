import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from '../../context/ThemeContext';
import Modal from "@/components/common/SingleModal";
interface Option {
    label: string;
    value: any;
}
interface BottomSelectionProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (value: any) => void;
    options: Option[];
    title?: string;
    selectedValue?: any;
}
const BottomSelection: React.FC<BottomSelectionProps> = ({
    visible,
    onClose,
    onSelect,
    options,
    title,
    selectedValue,
}) => {
    const { theme } = useTheme();
    if (!visible) return null;
    return (
        <Modal
            transparent
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={onClose}
                    style={styles.backdrop}
                />
                <View style={[styles.sheet, { backgroundColor: theme.cardBackground }]}>
                    <View style={[styles.header, { borderBottomColor: theme.inputBorder }]}>
                        <Text style={[styles.title, { color: theme.text }]}>
                            {title || 'Select Option'}
                        </Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={theme.icon} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
                        {options.map((option, index) => {
                            const isSelected = selectedValue === option.value;
                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.option,
                                        isSelected && { backgroundColor: theme.primary + '10' }
                                    ]}
                                    onPress={() => {
                                        onSelect(option.value);
                                        onClose();
                                    }}
                                >
                                    <Text style={[
                                        styles.optionText,
                                        { color: theme.text },
                                        isSelected && { color: theme.primary, fontWeight: '700' }
                                    ]}>
                                        {option.label}
                                    </Text>
                                    {isSelected && (
                                        <Ionicons name="checkmark" size={20} color={theme.primary} />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                        <View style={{ height: 40 }} />
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};
const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    sheet: {
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
        maxHeight: '70%',
        width: '100%',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
    },
    closeButton: {
        padding: 4,
    },
    list: {
        paddingHorizontal: 20,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 18,
        paddingHorizontal: 12,
        borderRadius: 4,
        marginVertical: 4,
    },
    optionText: {
        fontSize: 16,
    },
});
export default BottomSelection;