import { ThemeType } from '@/theme/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface DocumentItem {
    id: string;
    uri: string;
    name: string;
    type: 'image' | 'document';
    ext: string;
}

interface DocumentCardProps {
    item: DocumentItem;
    theme: ThemeType;
    onDelete: (id: string) => void;
}

const DocumentCard: React.FC<DocumentCardProps> = ({ item, theme, onDelete }) => (
    <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.inputBorder }]}>
        <View style={styles.iconContainer}>
            {item.type === 'image' ? (
                <Ionicons name="image" size={30} color={theme.primary} />
            ) : (
                <Ionicons name="document-text" size={30} color="#FF9800" />
            )}
        </View>
        <View style={styles.info}>
            <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
            <Text style={[styles.type, { color: theme.textLight }]}>{item.ext.toUpperCase()} File</Text>
        </View>
        <TouchableOpacity onPress={() => onDelete(item.id)} style={styles.deleteBtn}>
            <Ionicons name="close-circle" size={24} color="#F44336" />
        </TouchableOpacity>
    </View>
);

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 10,
        marginBottom: 10,
        borderWidth: 1,
    },
    iconContainer: {
        marginRight: 12,
    },
    info: {
        flex: 1,
    },
    name: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 2,
    },
    type: {
        fontSize: 12,
    },
    deleteBtn: {
        padding: 5,
    },
});

export default DocumentCard;
