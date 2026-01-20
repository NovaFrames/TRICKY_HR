import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    FlatList,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface ServiceStatus {
    IdN: number;
    NameC: string;
    selected: boolean;
}

interface SelectServiceStatusModalProps {
    visible: boolean;
    serviceStatus: ServiceStatus[];
    selectedIds: number[];
    onClose: () => void;
    onDone: (selectedIds: number[]) => void;
}

export default function SelectServiceStatusModal({
    visible,
    serviceStatus,
    selectedIds,
    onClose,
    onDone,
}: SelectServiceStatusModalProps) {
    const { theme } = useTheme();
    const [tempSelected, setTempSelected] = useState<number[]>(selectedIds);

    React.useEffect(() => {
        if (visible) {
            setTempSelected(selectedIds);
        }
    }, [visible, selectedIds]);

    const toggleSelection = (id: number) => {
        // Handle mutual exclusion for IDs 101 and 102
        if (id === 101 || id === 102) {
            const otherStatusId = id === 101 ? 102 : 101;
            const newSelected = tempSelected.filter(item => item !== otherStatusId);

            if (tempSelected.includes(id)) {
                setTempSelected(newSelected.filter(item => item !== id));
            } else {
                setTempSelected([...newSelected, id]);
            }
        } else {
            if (tempSelected.includes(id)) {
                setTempSelected(tempSelected.filter(item => item !== id));
            } else {
                setTempSelected([...tempSelected, id]);
            }
        }
    };

    const handleDone = () => {
        onDone(tempSelected);
        onClose();
    };

    const renderItem = ({ item }: { item: ServiceStatus }) => {
        const isSelected = tempSelected.includes(item.IdN);

        return (
            <Pressable
                style={[styles.item, { borderBottomColor: theme.inputBorder }]}
                onPress={() => toggleSelection(item.IdN)}
            >
                <Text style={[styles.itemText, { color: theme.text }]}>{item.NameC}</Text>
                <View style={[styles.checkbox, { borderColor: theme.primary }]}>
                    {isSelected && (
                        <Ionicons name="checkmark" size={18} color={theme.primary} />
                    )}
                </View>
            </Pressable>
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
                    <FlatList
                        data={serviceStatus}
                        keyExtractor={(item) => item.IdN.toString()}
                        renderItem={renderItem}
                        style={styles.list}
                        showsVerticalScrollIndicator={false}
                    />

                    <TouchableOpacity
                        style={[styles.doneButton, { backgroundColor: theme.primary }]}
                        onPress={handleDone}
                    >
                        <Text style={styles.doneButtonText}>Done</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxHeight: '70%',
        borderRadius: 4,
        padding: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    list: {
        maxHeight: 400,
    },
    item: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    itemText: {
        fontSize: 16,
        flex: 1,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderWidth: 2,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    doneButton: {
        marginTop: 20,
        paddingVertical: 14,
        borderRadius: 4,
        alignItems: 'center',
    },
    doneButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});
