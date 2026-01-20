import { ThemeType } from '@/theme/theme';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import CenterModalSelection from '../common/CenterModalSelection';

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
}) => {
    const [showClaimModal, setShowClaimModal] = useState(false);
    const [showCurrencyModal, setShowCurrencyModal] = useState(false);

    return (
        <>
            <View style={[styles.section, { backgroundColor: theme.cardBackground, borderColor: theme.inputBorder }]}>
                <Text style={[styles.title, { color: theme.primary }]}>Claim Details</Text>

                <View style={styles.inputContainer}>
                    <Text style={[styles.label, { color: theme.text }]}>Claim Name *</Text>
                    <TouchableOpacity
                        style={[styles.selectorContainer, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}
                        onPress={() => setShowClaimModal(true)}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="pricetag-outline" size={20} color={theme.primary} />
                        <Text style={[styles.selectorText, { color: selectedClaim > 0 ? theme.text : theme.placeholder }]}>
                            {claimNames[selectedClaim] || 'Select Claim Name'}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color={theme.text + '80'} />
                    </TouchableOpacity>
                </View>

                {currencyStatus && (
                    <View style={styles.inputContainer}>
                        <Text style={[styles.label, { color: theme.text }]}>Currency *</Text>
                        <TouchableOpacity
                            style={[styles.selectorContainer, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}
                            onPress={() => setShowCurrencyModal(true)}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="cash-outline" size={20} color={theme.primary} />
                            <Text style={[styles.selectorText, { color: selectedCurrency > 0 ? theme.text : theme.placeholder }]}>
                                {currencyNames[selectedCurrency] || 'Select Currency'}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color={theme.text + '80'} />
                        </TouchableOpacity>
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

            {/* Claim Name Modal */}
            <CenterModalSelection
                visible={showClaimModal}
                onClose={() => setShowClaimModal(false)}
                title="Select Claim Name"
                options={claimNames.map((name, index) => ({ label: name || 'Select Claim Name', value: index }))}
                selectedValue={selectedClaim}
                onSelect={(val: number) => onClaimChange(val)}
            />

            {/* Currency Modal */}
            {currencyStatus && (
                <CenterModalSelection
                    visible={showCurrencyModal}
                    onClose={() => setShowCurrencyModal(false)}
                    title="Select Currency"
                    options={currencyNames.map((name, index) => ({ label: name || 'Select Currency', value: index }))}
                    selectedValue={selectedCurrency}
                    onSelect={(val: number) => onCurrencyChange(val)}
                />
            )}
        </>
    );
};

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
    selectorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1.5,
        borderRadius: 4,
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 12,
    },
    selectorText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
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
