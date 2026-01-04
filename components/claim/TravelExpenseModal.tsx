import { ThemeType } from '@/theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface TravelExpenseModalProps {
    visible: boolean;
    theme: ThemeType;
    isDark: boolean;
    editIndex: number | null;
    travelType: number;
    boardingPoint: string;
    destination: string;
    pnr: string;
    amount: string;
    travelTypes: string[];
    onCancel: () => void;
    onSave: () => void;
    setTravelType: (val: number) => void;
    setBoardingPoint: (val: string) => void;
    setDestination: (val: string) => void;
    setPnr: (val: string) => void;
    setAmount: (val: string) => void;
}

const TravelExpenseModal: React.FC<TravelExpenseModalProps> = ({
    visible,
    theme,
    isDark,
    editIndex,
    travelType,
    boardingPoint,
    destination,
    pnr,
    amount,
    travelTypes,
    onCancel,
    onSave,
    setTravelType,
    setBoardingPoint,
    setDestination,
    setPnr,
    setAmount
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
                    <Text style={[styles.title, { color: theme.text }]}>
                        {editIndex !== null ? 'Edit Travel' : 'Add Travel/Expense'}
                    </Text>
                    <TouchableOpacity onPress={onCancel}>
                        <Ionicons name="close" size={24} color={theme.text} />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.body}>
                    <View style={styles.inputContainer}>
                        <Text style={[styles.label, { color: theme.text }]}>Type</Text>
                        <View style={[styles.pickerContainer, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                            <Picker
                                selectedValue={travelType}
                                onValueChange={(itemValue: number) => setTravelType(itemValue)}
                                style={[styles.picker, { color: theme.text }]}
                                dropdownIconColor={theme.text}
                            >
                                {travelTypes.map((type: string, index: number) => (
                                    <Picker.Item key={index} label={type} value={index} color={isDark ? '#fff' : '#000'} />
                                ))}
                            </Picker>
                        </View>
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={[styles.label, { color: theme.text }]}>Boarding Point/Description *</Text>
                        <TextInput
                            style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
                            value={boardingPoint}
                            onChangeText={setBoardingPoint}
                            placeholder="Enter boarding point or description"
                            placeholderTextColor={theme.placeholder}
                        />
                    </View>

                    {travelType !== 0 && (
                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: theme.text }]}>Destination *</Text>
                            <TextInput
                                style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
                                value={destination}
                                onChangeText={setDestination}
                                placeholder="Enter destination"
                                placeholderTextColor={theme.placeholder}
                            />
                        </View>
                    )}

                    <View style={styles.inputContainer}>
                        <Text style={[styles.label, { color: theme.text }]}>PNR/Ticket Number</Text>
                        <TextInput
                            style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
                            value={pnr}
                            onChangeText={setPnr}
                            placeholder="Enter PNR or ticket number"
                            placeholderTextColor={theme.placeholder}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={[styles.label, { color: theme.text }]}>Amount *</Text>
                        <TextInput
                            style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
                            value={amount}
                            onChangeText={setAmount}
                            placeholder="0.00"
                            placeholderTextColor={theme.placeholder}
                            keyboardType="numeric"
                        />
                    </View>
                </ScrollView>

                <View style={[styles.footer, { borderTopColor: theme.inputBorder }]}>
                    <TouchableOpacity
                        style={[styles.button, styles.cancelButton, { backgroundColor: theme.inputBg }]}
                        onPress={onCancel}
                    >
                        <Text style={[styles.cancelButtonText, { color: theme.textLight }]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.button, styles.saveButton, { backgroundColor: theme.primary }]}
                        onPress={onSave}
                    >
                        <Text style={styles.saveButtonText}>
                            {editIndex !== null ? 'Update' : 'Add'}
                        </Text>
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
        width: '100%',
        maxHeight: '85%',
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
    body: {
        padding: 20,
    },
    inputContainer: {
        marginBottom: 15,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    pickerContainer: {
        borderWidth: 1,
        borderRadius: 4,
        overflow: 'hidden',
    },
    picker: {
        height: 50,
    },
    textInput: {
        borderWidth: 1,
        borderRadius: 4,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 15,
        minHeight: 50,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderTopWidth: 1,
    },
    button: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 4,
        alignItems: 'center',
    },
    cancelButton: {
        marginRight: 10,
    },
    saveButton: {
        marginLeft: 10,
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});

export default TravelExpenseModal;
