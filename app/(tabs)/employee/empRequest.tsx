import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import RequestModal from '../../../components/RequestPage/RequestModal';
import RequestStatusItem from '../../../components/RequestPage/RequestStatusItem';
import ApiService from '../../../services/ApiService';

export default function EmpRequestPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [requests, setRequests] = useState<any>(null); // Store the full object
    const [activeTab, setActiveTab] = useState('Waiting'); // Tabs: Waiting, Approved, Rejected

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const result = await ApiService.getEmpRequestStatus();
            if (result.success && result.data) {
                setRequests(result.data);
            } else {
                setRequests(null);
                // Optionally show error toast, but keep it subtle
                console.log("Error fetching requests:", result.error);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const filterRequests = () => {
        if (!requests) return [];

        let data = [];
        if (activeTab === 'Waiting') {
            data = requests.empRequestWating || [];
        } else if (activeTab === 'Approved') {
            data = requests.empRequestApproved || [];
        } else if (activeTab === 'Rejected') {
            data = requests.empRequestRejected || [];
        }

        return data;
    };

    const handleItemPress = (item: any) => {
        setSelectedItem(item);
        setModalVisible(true);
    };

    const filteredRequests = filterRequests();

    const renderTab = (tabName: string) => (
        <TouchableOpacity
            style={[styles.tab, activeTab === tabName && styles.activeTab]}
            onPress={() => setActiveTab(tabName)}
        >
            <Text style={[styles.tabText, activeTab === tabName && styles.activeTabText]}>
                {tabName.toUpperCase()}
            </Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    title: 'Request Status',
                    headerStyle: { backgroundColor: '#03A9F4' }, // Match standard blue
                    headerTintColor: '#fff',
                    headerTitleStyle: { fontWeight: 'bold' },
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
                            <Ionicons name="arrow-back" size={24} color="#FFF" />
                        </TouchableOpacity>
                    ),
                }}
            />

            <View style={styles.tabContainer}>
                {renderTab('Waiting')}
                {renderTab('Approved')}
                {renderTab('Rejected')}
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#03A9F4" />
                </View>
            ) : (
                <FlatList
                    data={filteredRequests}
                    renderItem={({ item }) => (
                        <RequestStatusItem
                            item={item}
                            onPress={() => handleItemPress(item)}
                        />
                    )}
                    keyExtractor={(item, index) => index.toString()}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Text style={styles.emptyText}>No requests found.</Text>
                        </View>
                    }
                />
            )}

            <RequestModal
                visible={modalVisible}
                item={selectedItem}
                onClose={() => setModalVisible(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f2f2f2',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#03A9F4',
        elevation: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 15,
        alignItems: 'center',
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: '#fff',
    },
    tabText: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontWeight: 'bold',
        fontSize: 14,
    },
    activeTabText: {
        color: '#fff',
    },
    listContent: {
        paddingBottom: 20,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
    },
});
