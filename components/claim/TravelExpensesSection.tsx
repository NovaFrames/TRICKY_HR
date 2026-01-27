import { ThemeType } from '@/theme/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import TravelExpenseCard from './TravelExpenseCard';

interface TravelExpenseItem {
    type: number;
    typeName: string;
    boarding: string;
    destination: string;
    pnr: string;
    amount: number;
}

interface TravelExpensesSectionProps {
    theme: ThemeType;
    travelExpenses: TravelExpenseItem[];
    totalAmount: number;
    onAddPress: () => void;
    onEdit: (index: number) => void;
    onDelete: (index: number) => void;
}

const TravelExpensesSection: React.FC<TravelExpensesSectionProps> = ({
    theme,
    travelExpenses,
    totalAmount,
    onAddPress,
    onEdit,
    onDelete
}) => (
    <View style={[styles.section, { backgroundColor: theme.cardBackground, borderColor: theme.inputBorder }]}>
        <View style={styles.header}>
            <Text style={[styles.title, { color: theme.primary }]}>Travel & Expenses</Text>
            <TouchableOpacity
                style={[styles.addButton, { backgroundColor: theme.primary }]}
                onPress={onAddPress}
            >
                <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
        </View>

        {travelExpenses.length === 0 ? (
            <View style={styles.emptyState}>
                <Ionicons name="airplane-outline" size={50} color={theme.textLight} />
                <Text style={[styles.emptyStateText, { color: theme.textLight }]}>No travel expenses added</Text>
                <Text style={[styles.emptyStateSubtext, { color: theme.placeholder }]}>Click + to add travel or other expenses</Text>
            </View>
        ) : (
            <FlatList
                data={travelExpenses}
                renderItem={({ item, index }) => (
                    <TravelExpenseCard
                        item={item}
                        index={index}
                        theme={theme}
                        onEdit={onEdit}
                        onDelete={onDelete}
                    />
                )}
                keyExtractor={(_, index) => index.toString()}
                scrollEnabled={false}
            />
        )}

        {/* <View style={[styles.totalContainer, { borderTopColor: theme.inputBorder }]}>
            <Text style={[styles.totalLabel, { color: theme.text }]}>Total Amount:</Text>
            <Text style={[styles.totalValue, { color: theme.primary }]}>₹{totalAmount.toFixed(2)}</Text>
        </View> */}
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    addButton: {
        width: 36,
        height: 36,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
    },
    emptyState: {
        alignItems: 'center',
        padding: 20,
    },
    emptyStateText: {
        fontSize: 16,
        marginTop: 10,
        marginBottom: 5,
    },
    emptyStateSubtext: {
        fontSize: 14,
        textAlign: 'center',
    },
    totalContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
        paddingTop: 15,
        borderTopWidth: 1,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    totalValue: {
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default TravelExpensesSection;
