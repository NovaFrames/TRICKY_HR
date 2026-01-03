import Header from '@/components/Header';
import { useProtectedBack } from '@/hooks/useProtectedBack';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { TabBar, TabView } from 'react-native-tab-view';
import DocumentCard from '../../../components/UploadDocument/DocumentCard';
import UploadDocumentModal from '../../../components/UploadDocument/UploadDocumentModal';
import { useTheme } from '../../../context/ThemeContext';
import ApiService from '../../../services/ApiService';

interface Document {
    id: number;
    name: string;
    type: string;
    date: string;
    size: string;
    url?: string;
}

type DocumentType = string;

const initialLayout = { width: Dimensions.get('window').width };

const empdocument: React.FC = () => {
    const { theme } = useTheme();
    const [index, setIndex] = useState(0);
    const [routes] = useState([
        { key: 'all', title: 'ALL' },
        { key: 'education', title: 'EDUCATION' },
        { key: 'experience', title: 'EXPERIENCE' },
        { key: 'proof', title: 'PROOF' },
        { key: 'birth', title: 'BIRTH CERTIFICATE' },
    ]);

    const [documents, setDocuments] = useState<Document[]>([]);
    const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [uploading, setUploading] = useState(false);

    const flatListRefs = useRef<{ [key: string]: FlatList | null }>({});

    useProtectedBack({
        home: '/home'
    });

    useEffect(() => {
        fetchDocuments();
    }, []);

    useEffect(() => {
        filterDocumentsByTab();
    }, [index, documents]);

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const docs = await ApiService.getDocuments();
            setDocuments(docs);
        } catch (error) {
            Alert.alert('Error', 'Failed to load documents');
            console.error('Error fetching documents:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const filterDocumentsByTab = () => {
        const currentTab = routes[index].key;
        if (currentTab === 'all') {
            setFilteredDocuments(documents);
        } else {
            const filtered = documents.filter(doc =>
                doc.type.toLowerCase() === currentTab.toLowerCase()
            );
            setFilteredDocuments(filtered);
        }
    };

    const handleUpload = async (data: {
        name: string;
        type: DocumentType;
        remarks: string;
        file: {
            uri: string;
            name: string;
            type: string;
        };
    }) => {
        try {
            setUploading(true);
            const result = await ApiService.uploadDocument(data);

            if (result.success) {
                Alert.alert('Success', 'Document uploaded successfully');
                setModalVisible(false);
                fetchDocuments(); // Refresh list
            } else {
                Alert.alert('Upload Failed', result.error || 'Failed to upload document');
            }
        } catch (error: any) {
            Alert.alert('Upload Failed', error.message || 'Failed to upload document');
        } finally {
            setUploading(false);
        }
    };

    const handleDocumentPress = (document: Document) => {
        Alert.alert(
            'Document Details',
            `Name: ${document.name}\nType: ${document.type}\nDate: ${document.date}\nSize: ${document.size}`,
            [
                { text: 'Download', onPress: () => downloadDocument(document) },
                { text: 'Cancel', style: 'cancel' },
            ]
        );
    };

    const downloadDocument = (document: Document) => {
        Alert.alert('Download', `Downloading ${document.name}`);
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchDocuments();
    };

    const renderTabScene = ({ route }: { route: { key: string } }) => {
        const renderItem = ({ item }: { item: Document }) => (
            <DocumentCard
                document={item}
                onPress={() => handleDocumentPress(item)}
                onDownload={() => downloadDocument(item)}
            />
        );

        const renderEmpty = () => (
            <View style={styles.emptyContainer}>
                <Icon name="folder-open" size={60} color={theme.icon} />
                <Text style={[styles.emptyText, { color: theme.text }]}>No documents found</Text>
                <Text style={[styles.emptySubText, { color: theme.textLight }]}>
                    {index === 0 ? 'No documents available' : `No ${routes[index].title.toLowerCase()} documents`}
                </Text>
            </View>
        );

        return (
            <FlatList
                ref={(ref) => { flatListRefs.current[route.key] = ref; }}
                data={filteredDocuments}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                ListHeaderComponent={() => <Header title="Documents" />}
                ListEmptyComponent={renderEmpty}
                refreshing={refreshing}
                onRefresh={handleRefresh}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
            />
        );
    };

    const renderTabBar = (props: any) => (
        <TabBar
            {...props}
            indicatorStyle={{ backgroundColor: theme.primary, height: 3 }}
            style={[styles.tabBar, { backgroundColor: theme.cardBackground }]}
            labelStyle={styles.tabLabel}
            activeColor={theme.primary}
            inactiveColor={theme.textLight}
            scrollEnabled={true}
            tabStyle={styles.tabStyle}
        />
    );

    if (loading && !refreshing) {
        return (
            <View style={[styles.centered, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.loadingText, { color: theme.textLight }]}>Loading documents...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.inputBg }]}>
            {/* Tab View */}
            <TabView
                navigationState={{ index, routes }}
                renderScene={renderTabScene}
                onIndexChange={setIndex}
                initialLayout={initialLayout}
                renderTabBar={renderTabBar}
                swipeEnabled={true}
            />

            {/* Floating Action Button */}
            <TouchableOpacity
                style={[styles.fab, { backgroundColor: theme.primary }]}
                onPress={() => setModalVisible(true)}
                disabled={uploading}
            >
                {uploading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                    <Icon name="add" size={28} color="#FFFFFF" />
                )}
            </TouchableOpacity>

            {/* Upload Modal */}
            <UploadDocumentModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onUpload={handleUpload}
                uploading={uploading}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
    },
    tabBar: {
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
    },
    tabLabel: {
        fontSize: 12,
        fontWeight: '500',
        textTransform: 'none',
    },
    tabStyle: {
        width: 'auto',
        minWidth: 100,
    },
    listContainer: {
        padding: 16,
        flexGrow: 1,
        paddingBottom: 88, // Space for FAB
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 100,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
    },
    emptySubText: {
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
    },
});

export default empdocument;