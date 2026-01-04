import { ThemeType } from '@/theme/theme';
import { FontAwesome5 } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface ClaimDetailsSectionProps {
    theme: ThemeType;
    isDark: boolean;
    selectedClaim: number;
    claimNames: string[];
    currencyStatus: boolean;
    selectedCurrency: number;
    currencyNames: string[];
    fromDate: Date;
    toDate: Date;
    description: string;
    showFromDatePicker: boolean;
    showToDatePicker: boolean;
    onClaimChange: (val: number) => void;
    onCurrencyChange: (val: number) => void;
    onFromDatePress: () => void;
    onToDatePress: () => void;
    onFromDateChange: (event: any, date?: Date) => void;
    onToDateChange: (event: any, date?: Date) => void;
    onDescriptionChange: (text: string) => void;
    formatDate: (date: Date) => string;
}

const ClaimDetailsSection: React.FC<ClaimDetailsSectionProps> = ({
    theme,
    isDark,
    selectedClaim,
    claimNames,
    currencyStatus,
    selectedCurrency,
    currencyNames,
    fromDate,
    toDate,
    description,
    showFromDatePicker,
    showToDatePicker,
    onClaimChange,
    onCurrencyChange,
    onFromDatePress,
    onToDatePress,
    onFromDateChange,
    onToDateChange,
    onDescriptionChange,
    formatDate
}) => (
    <View style={[styles.section, { backgroundColor: theme.cardBackground, borderColor: theme.inputBorder }]}>
        <Text style={[styles.title, { color: theme.primary }]}>Claim Details</Text>

        <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Claim Name *</Text>
            <View style={[styles.pickerContainer, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                <Picker
                    selectedValue={selectedClaim}
                    onValueChange={onClaimChange}
                    style={[styles.picker, { color: theme.text }]}
                    dropdownIconColor={theme.text}
                >
                    {claimNames.map((name, index) => (
                        <Picker.Item key={index} label={name || 'Select Claim Name'} value={index} color={isDark ? '#fff' : '#000'} />
                    ))}
                </Picker>
            </View>
        </View>

        {currencyStatus && (
            <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: theme.text }]}>Currency *</Text>
                <View style={[styles.pickerContainer, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                    <Picker
                        selectedValue={selectedCurrency}
                        onValueChange={onCurrencyChange}
                        style={[styles.picker, { color: theme.text }]}
                        dropdownIconColor={theme.text}
                    >
                        {currencyNames.map((name, index) => (
                            <Picker.Item key={index} label={name || 'Select Currency'} value={index} color={isDark ? '#fff' : '#000'} />
                        ))}
                    </Picker>
                </View>
            </View>
        )}

        <View style={styles.row}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                <Text style={[styles.label, { color: theme.text }]}>From Date *</Text>
                <TouchableOpacity
                    style={[styles.dateButton, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}
                    onPress={onFromDatePress}
                >
                    <Text style={[styles.dateText, { color: theme.text }]}>{formatDate(fromDate)}</Text>
                    <FontAwesome5 name="calendar-alt" size={18} color={theme.primary} />
                </TouchableOpacity>
            </View>

            <View style={[styles.inputContainer, { flex: 1, marginLeft: 10 }]}>
                <Text style={[styles.label, { color: theme.text }]}>To Date *</Text>
                <TouchableOpacity
                    style={[styles.dateButton, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}
                    onPress={onToDatePress}
                >
                    <Text style={[styles.dateText, { color: theme.text }]}>{formatDate(toDate)}</Text>
                    <FontAwesome5 name="calendar-alt" size={18} color={theme.primary} />
                </TouchableOpacity>
            </View>
        </View>

        {showFromDatePicker && (
            <DateTimePicker
                value={fromDate}
                mode="date"
                display="default"
                onChange={onFromDateChange}
                maximumDate={new Date()}
            />
        )}

        {showToDatePicker && (
            <DateTimePicker
                value={toDate}
                mode="date"
                display="default"
                onChange={onToDateChange}
                maximumDate={new Date()}
            />
        )}

        <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Description *</Text>
            <TextInput
                style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
                value={description}
                onChangeText={onDescriptionChange}
                placeholder="Enter description"
                placeholderTextColor={theme.placeholder}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
            />
        </View>
    </View>
);

const styles = StyleSheet.create({
    section: {
        borderRadius: 4,
        padding: 15,
        marginBottom: 20,
        borderWidth: 1,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
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
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    dateButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 4,
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    dateText: {
        fontSize: 15,
    },
    textInput: {
        borderWidth: 1,
        borderRadius: 4,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 15,
        minHeight: 100,
    },
});

export default ClaimDetailsSection;
