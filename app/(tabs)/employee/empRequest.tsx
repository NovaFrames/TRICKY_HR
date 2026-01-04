import Header from '@/components/Header';
import { useProtectedBack } from '@/hooks/useProtectedBack';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import RequestModal from '../../../components/RequestPage/RequestModal';
import RequestStatusItem from '../../../components/RequestPage/RequestStatusItem';
import { useTheme } from '../../../context/ThemeContext';
import ApiService from '../../../services/ApiService';

export default function EmpRequestPage() {
    const { theme, isDark } = useTheme();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [requests, setRequests] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('Waiting');

    const [modalVisible, setModalVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);

    useProtectedBack({
        home: '/home',
        settings: '/settings',
        dashboard: '/dashboard',
    });

    const fetchRequests = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const result = await ApiService.getEmpRequestStatus();
            if (result.success && result.data) {
                setRequests(result.data);
            } else {
                setRequests(null);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const onRefresh = () => {
        fetchRequests(true);
    };

    const filterRequests = () => {
        if (!requests) return [];
        let data = [];
        if (activeTab === 'Waiting') data = requests.empRequestWating || [];
        else if (activeTab === 'Approved') data = requests.empRequestApproved || [];
        else if (activeTab === 'Rejected') data = requests.empRequestRejected || [];
        return data;
    };

    const handleItemPress = (item: any) => {
        setSelectedItem(item);
        setModalVisible(true);
    };

    const filteredRequests = filterRequests();

    const TABS = ['Waiting', 'Approved', 'Rejected'];

    const renderListHeader = () => (
        <View>
            <Header title="Request Status" />
            <View style={styles.tabSection}>
                <View style={[styles.tabOuterContainer, { backgroundColor: theme.inputBg }]}>
                    {TABS.map((tab) => {
                        const isActive = activeTab === tab;
                        return (
                            <TouchableOpacity
                                key={tab}
                                style={[
                                    styles.tabItem,
                                    isActive && { backgroundColor: theme.cardBackground }
                                ]}
                                onPress={() => setActiveTab(tab)}
                            >
                                <Text
                                    style={[
                                        styles.tabText,
                                        { color: isActive ? theme.primary : theme.placeholder }
                                    ]}
                                >
                                    {tab}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={[styles.loadingText, { color: theme.placeholder }]}>Loading requests...</Text>
                </View>
            ) : (
                <FlatList
                    ListHeaderComponent={renderListHeader}
                    data={filteredRequests}
                    renderItem={({ item }) => (
                        <RequestStatusItem
                            item={item}
                            onPress={() => handleItemPress(item)}
                        />
                    )}
                    keyExtractor={(item, index) => index.toString()}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[theme.primary]}
                            tintColor={theme.primary}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <View style={[styles.emptyIconBox, { backgroundColor: theme.inputBg }]}>
                                <Ionicons name="document-text-outline" size={48} color={theme.placeholder} />
                            </View>
                            <Text style={[styles.emptyTitle, { color: theme.text }]}>No {activeTab} Requests</Text>
                            <Text style={[styles.emptySubtitle, { color: theme.placeholder }]}>
                                When you have {activeTab.toLowerCase()} requests, they will appear here.
                            </Text>
                        </View>
                    }
                />
            )}

            {modalVisible && (
                <RequestModal
                    visible={modalVisible}
                    item={selectedItem}
                    onClose={() => setModalVisible(false)}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    navBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    navTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    iconButton: {
        padding: 8,
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabSection: {
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    tabOuterContainer: {
        flexDirection: 'row',
        padding: 5,
        borderRadius: 4,
    },
    tabItem: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 4,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '700',
    },
    listContent: {
        paddingTop: 10,
        paddingBottom: 120,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
        paddingHorizontal: 40,
    },
    emptyIconBox: {
        width: 100,
        height: 100,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        fontWeight: '500',
    },
});
