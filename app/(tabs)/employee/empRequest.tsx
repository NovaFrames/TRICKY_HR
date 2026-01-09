import Header from '@/components/Header';
import SegmentTabs from '@/components/SegmentTabs';
import { useProtectedBack } from '@/hooks/useProtectedBack';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    View
} from 'react-native';
import RequestModal from '../../../components/RequestPage/RequestModal';
import RequestStatusItem from '../../../components/RequestPage/RequestStatusItem';
import { useTheme } from '../../../context/ThemeContext';
import ApiService from '../../../services/ApiService';

/* ---------------- TYPES ---------------- */

interface EmpRequest {
    DescC: string;
    IdN: number;
    LvDescC: string;
    StatusC: string;
    YearN: number;
    applyDateD: string;
}

interface RequestsState {
    empRequestWating: EmpRequest[];
    empRequestApproved: EmpRequest[];
    empRequestRejected: EmpRequest[];
}

/* ---------------- COMPONENT ---------------- */

export default function EmpRequestPage() {
    const { theme } = useTheme();

    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'Waiting' | 'Approved' | 'Rejected'>('Waiting');

    const [requests, setRequests] = useState<RequestsState>({
        empRequestWating: [],
        empRequestApproved: [],
        empRequestRejected: [],
    });

    const [modalVisible, setModalVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState<EmpRequest | null>(null);

    useProtectedBack({
        home: '/home',
        settings: '/settings',
        dashboard: '/dashboard',
    });

    /* ---------------- HELPERS ---------------- */

    const parseDotNetDate = (dateStr: string) =>
        new Date(Number(dateStr.replace(/[^0-9]/g, '')));

    const sortByDateDesc = (arr: EmpRequest[]) =>
        [...arr].sort(
            (a, b) =>
                parseDotNetDate(b.applyDateD).getTime() -
                parseDotNetDate(a.applyDateD).getTime()
        );

    /* ---------------- API ---------------- */

    const fetchRequests = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const result = await ApiService.getEmpRequestStatus();

            if (result.success && result.data) {
                const data = result.data as any;

                setRequests({
                    empRequestWating: sortByDateDesc(data.empRequestWating || []),
                    empRequestApproved: sortByDateDesc(data.empRequestApproved || []),
                    empRequestRejected: sortByDateDesc(data.empRequestRejected || []),
                });
            } else {
                setRequests({
                    empRequestWating: [],
                    empRequestApproved: [],
                    empRequestRejected: [],
                });
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

    const onRefresh = () => fetchRequests(true);

    /* ---------------- DATA ---------------- */

    const getFilteredRequests = (): EmpRequest[] => {
        if (activeTab === 'Waiting') return requests.empRequestWating;
        if (activeTab === 'Approved') return requests.empRequestApproved;
        if (activeTab === 'Rejected') return requests.empRequestRejected;
        return [];
    };

    const filteredRequests = getFilteredRequests();
    const TABS: Array<'Waiting' | 'Approved' | 'Rejected'> = ['Waiting', 'Approved', 'Rejected'];

    /* ---------------- UI ---------------- */

    const renderListHeader = () => (
        <View>
            <Header title="Request Status" />

            <SegmentTabs
                tabs={TABS}
                activeTab={activeTab}
                onChange={setActiveTab}
            />
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={[styles.loadingText, { color: theme.placeholder }]}>
                        Loading requests...
                    </Text>
                </View>
            ) : (
                <FlatList
                    ListHeaderComponent={renderListHeader}
                    data={filteredRequests}
                    keyExtractor={(item, index) =>
                        `${item.StatusC?.trim() || 'UNKNOWN'}-${item.IdN}-${index}`
                    }
                    renderItem={({ item }) => (
                        <RequestStatusItem
                            item={item}
                            onPress={() => {
                                setSelectedItem(item);
                                setModalVisible(true);
                            }}
                        />
                    )}
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
                                <Ionicons
                                    name="document-text-outline"
                                    size={48}
                                    color={theme.placeholder}
                                />
                            </View>
                            <Text style={[styles.emptyTitle, { color: theme.text }]}>
                                No {activeTab} Requests
                            </Text>
                            <Text style={[styles.emptySubtitle, { color: theme.placeholder }]}>
                                When you have {activeTab.toLowerCase()} requests, they will appear here.
                            </Text>
                        </View>
                    }
                />
            )}

            {modalVisible && selectedItem && (
                <RequestModal
                    visible={modalVisible}
                    item={selectedItem}
                    onClose={() => setModalVisible(false)}
                    onRefresh={() => fetchRequests(true)}
                />
            )}
        </View>
    );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
    container: { flex: 1 },

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
