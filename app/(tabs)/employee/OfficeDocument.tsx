import Header from '@/components/Header';
import { useProtectedBack } from '@/hooks/useProtectedBack';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useUser } from '../../../context/UserContext';
import ApiService from '../../../services/ApiService';

interface Document {
    NameC: string;
    LastWriteTimeC: string;
    FolderName: string;
}

const OfficeDocument: React.FC<any> = ({ navigation }) => {
    const { theme } = useTheme();
    const { user } = useUser();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useProtectedBack({
        home: '/home'
    });

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await ApiService.getOfficeDocuments('OfficeDoc');
            if (result.success && result.data) {
                setDocuments(result.data);
            } else {
                setError(result.error || 'Failed to fetch documents');
            }
        } catch (error: any) {
            setError(error.message || 'Error fetching documents');
        } finally {
            setLoading(false);
        }
    };

    const constructDownloadUrl = (fileName: string) => {
        const customerId = user?.CustomerIdC || 'kevit';
        const companyId = user?.CompIdN || '1';
        const empId = user?.EmpIdN || '1';

        // Pattern based on previous tasks
        return `https://hr.trickyhr.com/kevit-Customer/${customerId}/${companyId}/OfficeDoc/${empId}/${encodeURIComponent(fileName)}`;
    };

    const handleDocumentPress = async (document: Document) => {
        const fileName = document.NameC;
        const fs = FileSystem as any;
        const localDir = fs.documentDirectory + 'OfficeDoc/';
        const localUri = localDir + fileName;

        try {
            const dirInfo = await fs.getInfoAsync(localDir);
            if (!dirInfo.exists) {
                await fs.makeDirectoryAsync(localDir, { intermediates: true });
            }

            const fileInfo = await fs.getInfoAsync(localUri);

            if (fileInfo.exists) {
                await openDocument(localUri);
            } else {
                if (downloading) return;

                setDownloading(fileName);
                const url = constructDownloadUrl(fileName);
                const downloadedUri = await ApiService.downloadFile(url, fileName);

                if (downloadedUri) {
                    await openDocument(downloadedUri);
                } else {
                    Alert.alert('Error', 'Failed to download document');
                }
                setDownloading(null);
            }
        } catch (error) {
            console.error('Error handling document:', error);
            Alert.alert('Error', 'Failed to open document');
            setDownloading(null);
        }
    };

    const openDocument = async (uri: string) => {
        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(uri);
        } else {
            Alert.alert('Error', 'Sharing is not available on this device');
        }
    };

    const formatDate = (dateString: string) => {
        try {
            if (!dateString) return '';
            // Handle /Date(...)/ format if present
            const match = dateString.match(/\/Date\((\d+)\)\//);
            if (match) {
                return new Date(parseInt(match[1])).toLocaleDateString() + ' ' + new Date(parseInt(match[1])).toLocaleTimeString();
            }
            return new Date(dateString).toLocaleDateString();
        } catch {
            return dateString;
        }
    };

    const renderDocumentItem = ({ item }: { item: Document }) => (
        <TouchableOpacity
            style={[styles.documentItem, { backgroundColor: theme.cardBackground }]}
            onPress={() => handleDocumentPress(item)}
            disabled={downloading === item.NameC}
        >
            <View style={styles.documentIcon}>
                <Icon name="description" size={24} color={theme.primary} />
            </View>

            <View style={styles.documentInfo}>
                <Text style={[styles.documentName, { color: theme.text }]} numberOfLines={1}>
                    {item.NameC}
                </Text>
                <Text style={[styles.documentDate, { color: theme.textLight }]}>
                    Modified: {formatDate(item.LastWriteTimeC)}
                </Text>
            </View>

            <View style={styles.documentAction}>
                {downloading === item.NameC ? (
                    <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                    <Icon name="cloud-download" size={24} color={theme.icon} />
                )}
            </View>
        </TouchableOpacity>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Icon name="folder-open" size={80} color={theme.icon} />
            <Text style={[styles.emptyText, { color: theme.text }]}>No documents found</Text>
            <Text style={[styles.emptySubText, { color: theme.textLight }]}>
                There are no office documents available at the moment.
            </Text>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.inputBg }]}>
            <Header title="Office Documents" />

            <View style={styles.content}>
                {loading && !documents.length ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.primary} />
                        <Text style={[styles.loadingText, { color: theme.textLight }]}>Loading documents...</Text>
                    </View>
                ) : error ? (
                    <View style={styles.errorContainer}>
                        <Icon name="error-outline" size={40} color="#FF6B6B" />
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity
                            style={[styles.retryButton, { backgroundColor: theme.primary }]}
                            onPress={fetchDocuments}
                        >
                            <Text style={styles.retryButtonText}>Try Again</Text>
                        </TouchableOpacity>
                    </View>
                ) : documents.length === 0 ? (
                    renderEmptyState()
                ) : (
                    <FlatList
                        data={documents}
                        renderItem={renderDocumentItem}
                        keyExtractor={(item, index) => `${item.NameC}-${index}`}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        refreshing={loading}
                        onRefresh={fetchDocuments}
                    />
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    errorText: {
        marginTop: 16,
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    listContent: {
        padding: 16,
    },
    documentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    documentIcon: {
        marginRight: 16,
    },
    documentInfo: {
        flex: 1,
    },
    documentName: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 4,
    },
    documentDate: {
        fontSize: 12,
    },
    documentAction: {
        marginLeft: 16,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubText: {
        fontSize: 14,
        textAlign: 'center',
    },
});

export default OfficeDocument;