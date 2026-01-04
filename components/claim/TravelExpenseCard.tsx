import { ThemeType } from '@/theme/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface TravelExpenseItem {
    type: number;
    typeName: string;
    boarding: string;
    destination: string;
    pnr: string;
    amount: number;
}

interface TravelExpenseCardProps {
    item: TravelExpenseItem;
    index: number;
    theme: ThemeType;
    onEdit: (index: number) => void;
    onDelete: (index: number) => void;
}

const TravelExpenseCard: React.FC<TravelExpenseCardProps> = ({ item, index, theme, onEdit, onDelete }) => (
    <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.inputBorder }]}>
        <View style={styles.info}>
            <Text style={[styles.type, { color: theme.primary }]}>{item.typeName}</Text>
            <Text style={[styles.detail, { color: theme.text }]}>
                {item.boarding} {item.destination ? `→ ${item.destination}` : ''}
            </Text>
            {item.pnr ? <Text style={[styles.pnr, { color: theme.textLight }]}>PNR: {item.pnr}</Text> : null}
            <Text style={[styles.amount, { color: theme.primary }]}>Amount: ₹{item.amount.toFixed(2)}</Text>
        </View>
        <View style={styles.actions}>
            <TouchableOpacity onPress={() => onEdit(index)} style={styles.actionBtn}>
                <Ionicons name="pencil" size={20} color={theme.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDelete(index)} style={styles.actionBtn}>
                <Ionicons name="trash" size={20} color="#F44336" />
            </TouchableOpacity>
        </View>
    </View>
);

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderRadius: 4,
        marginBottom: 10,
        borderWidth: 1,
    },
    info: {
        flex: 1,
    },
    type: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    detail: {
        fontSize: 13,
        marginBottom: 2,
    },
    pnr: {
        fontSize: 12,
        marginBottom: 2,
    },
    amount: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    actions: {
        flexDirection: 'row',
    },
    actionBtn: {
        padding: 8,
        marginLeft: 5,
    },
});

export default TravelExpenseCard;
