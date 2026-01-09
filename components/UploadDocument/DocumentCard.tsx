import { MaterialIcons as Icon } from '@expo/vector-icons';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface DocumentCardProps {
    document: {
        id: string | number;
        name: string;
        type: string;
        date: string;
        size: string;
        status?: string;
    };
    onPress: () => void;
    onDownload: () => void;
}

const DocumentCard: React.FC<DocumentCardProps> = ({ document, onPress, onDownload }) => {
    const { theme } = useTheme();

    const getDocumentIcon = () => {
        const name = document.name.toLowerCase();
        if (name.endsWith('.pdf')) return 'picture-as-pdf';
        if (name.endsWith('.doc') || name.endsWith('.docx')) return 'description';
        return 'insert-drive-file';
    };

    const getDocumentColor = () => {
        const name = document.name.toLowerCase();
        if (name.endsWith('.pdf')) return '#EF4444'; // Red-500
        if (name.endsWith('.doc') || name.endsWith('.docx')) return '#3B82F6'; // Blue-500
        return theme.icon;
    };

    return (
        <TouchableOpacity style={[styles.card, { backgroundColor: theme.cardBackground }]} onPress={onPress}>
            <View style={styles.cardContent}>
                <View style={styles.iconContainer}>
                    <Icon
                        name={getDocumentIcon()}
                        size={32}
                        color={getDocumentColor()}
                    />
                </View>
                <View style={styles.details}>
                    <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
                        {document.name}
                    </Text>
                    <Text style={[styles.type, { color: theme.textLight }]}>{document.type}</Text>
                    <View style={styles.metaInfo}>
                        <View style={styles.metaItem}>
                            <Icon name="calendar-today" size={14} color={theme.icon} />
                            <Text style={[styles.metaText, { color: theme.textLight }]}>{document.date}</Text>
                        </View>
                        <View style={styles.metaItem}>
                            <Icon name="storage" size={14} color={theme.icon} />
                            <Text style={[styles.metaText, { color: theme.textLight }]}>{document.size}</Text>
                        </View>
                    </View>
                </View>
                <TouchableOpacity
                    style={styles.downloadButton}
                    onPress={onDownload}
                >
                    <Icon name="cloud-download" size={24} color={theme.primary} />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 4,
        marginBottom: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        marginRight: 12,
    },
    details: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    type: {
        fontSize: 12,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    metaInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
    },
    metaText: {
        fontSize: 12,
        marginLeft: 4,
    },
    downloadButton: {
        padding: 8,
    },
});

export default DocumentCard;