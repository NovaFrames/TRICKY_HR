import { ThemeType } from '@/theme/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DocumentCard from './DocumentCard';

interface DocumentItem {
    id: string;
    uri: string;
    name: string;
    type: 'image' | 'document';
    ext: string;
}

interface DocumentsSectionProps {
    theme: ThemeType;
    documents: DocumentItem[];
    onAddPress: () => void;
    onDelete: (id: string) => void;
}

const DocumentsSection: React.FC<DocumentsSectionProps> = ({
    theme,
    documents,
    onAddPress,
    onDelete
}) => (
    <View style={[styles.section, { backgroundColor: theme.cardBackground, borderColor: theme.inputBorder }]}>
        <View style={styles.header}>
            <Text style={[styles.title, { color: theme.primary }]}>Documents *</Text>
            <TouchableOpacity
                style={[styles.addButton, { backgroundColor: theme.primary }]}
                onPress={onAddPress}
            >
                <Ionicons name="attach" size={24} color="#fff" />
            </TouchableOpacity>
        </View>

        {documents.length === 0 ? (
            <View style={styles.emptyState}>
                <Ionicons name="folder-open-outline" size={50} color={theme.textLight} />
                <Text style={[styles.emptyStateText, { color: theme.textLight }]}>No documents attached</Text>
                <Text style={[styles.emptyStateSubtext, { color: theme.placeholder }]}>Click + to add documents</Text>
            </View>
        ) : (
            <FlatList
                data={documents}
                renderItem={({ item }) => (
                    <DocumentCard
                        item={item}
                        theme={theme}
                        onDelete={onDelete}
                    />
                )}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
            />
        )}
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
});

export default DocumentsSection;
