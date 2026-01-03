import Header from "@/components/Header";
import { API_ENDPOINTS } from "@/constants/api";
import { useTheme } from "@/context/ThemeContext";
import { useUser } from "@/context/UserContext";
import { useProtectedBack } from "@/hooks/useProtectedBack";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Modal, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Holiday() {
    const { user } = useUser();
    const { theme } = useTheme();
    const [holidayData, setHolidayData] = useState<any[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

    useProtectedBack({
        home: '/home'
    });

    // Generate years for the modal (2000 to 2050)
    const startYear = 2000;
    const endYear = 2050;
    const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => (startYear + i).toString());

    const fetchHoliday = async () => {
        try {
            const payload = {
                TokenC: user?.TokenC,
                Year: selectedYear,
            };

            const response = await axios.post(
                `${API_ENDPOINTS.CompanyUrl}${API_ENDPOINTS.HOLIDAY}`,
                payload
            );

            if (response.data.Status === "success") {
                setHolidayData(response.data.Holiday ?? []);
            } else {
                setHolidayData([]);
            }
        } catch (error) {
            console.error("Holiday API error:", error);
            setHolidayData([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchHoliday();
    }, [selectedYear]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchHoliday();
    };

    const handleYearSelect = (year: string) => {
        setSelectedYear(year);
        setModalVisible(false);
    };

    const renderYearGridItem = ({ item }: { item: string }) => (
        <TouchableOpacity
            style={[
                styles.gridItem,
                {
                    backgroundColor: item === selectedYear ? theme.primary : theme.inputBg,
                    borderColor: theme.inputBorder,
                }
            ]}
            onPress={() => handleYearSelect(item)}
        >
            <Text style={[
                styles.gridItemText,
                { color: item === selectedYear ? '#FFFFFF' : theme.text }
            ]}>
                {item}
            </Text>
        </TouchableOpacity>
    );

    const renderHolidayItem = ({ item }: { item: any }) => (
        <View style={[styles.card, { backgroundColor: theme.cardBackground, shadowColor: theme.text }]}>
            <View style={[styles.dateContainer, { backgroundColor: theme.inputBg }]}>
                <Text style={[styles.dateDay, { color: theme.primary }]}>
                    {new Date(item.HDate).getDate()}
                </Text>
                <Text style={[styles.dateMonth, { color: theme.textLight }]}>
                    {new Date(item.HDate).toLocaleString('default', { month: 'short' })}
                </Text>
            </View>
            <View style={styles.detailsContainer}>
                <Text style={[styles.holidayName, { color: theme.text }]}>{item.HName}</Text>
                <Text style={[styles.holidayDay, { color: theme.textLight }]}>{item.HDay}</Text>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Header title="Holiday" />

            <View style={styles.headerControls}>
                <Text style={[styles.yearLabel, { color: theme.text }]}>Year: {selectedYear}</Text>
                <TouchableOpacity
                    style={[styles.calendarButton, { backgroundColor: theme.primary }]}
                    onPress={() => setModalVisible(true)}
                >
                    <Ionicons name="calendar" size={20} color="#FFFFFF" />
                    <Text style={styles.calendarButtonText}>Select Year</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (
                <FlatList
                    data={holidayData}
                    renderItem={renderHolidayItem}
                    keyExtractor={(item, index) => index.toString()}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="calendar-outline" size={64} color={theme.textLight} />
                            <Text style={[styles.emptyText, { color: theme.textLight }]}>
                                No holidays found for {selectedYear}
                            </Text>
                        </View>
                    }
                />
            )}

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>Select Year</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={theme.text} />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={years}
                            renderItem={renderYearGridItem}
                            keyExtractor={(item) => item}
                            numColumns={4}
                            contentContainerStyle={styles.gridContent}
                            columnWrapperStyle={styles.gridColumnWrapper}
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    yearLabel: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    calendarButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    calendarButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
    },
    listContent: {
        padding: 16,
        paddingTop: 0,
        gap: 12,
    },
    card: {
        flexDirection: 'row',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        elevation: 2,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    dateContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        borderRadius: 10,
        width: 60,
        height: 60,
        marginRight: 16,
    },
    dateDay: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    dateMonth: {
        fontSize: 12,
        fontWeight: '500',
        textTransform: 'uppercase',
    },
    detailsContainer: {
        flex: 1,
    },
    holidayName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    holidayDay: {
        fontSize: 14,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100,
        gap: 16,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 16,
        height: '50%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    gridContent: {
        paddingBottom: 20,
    },
    gridColumnWrapper: {
        gap: 10,
        marginBottom: 10,
    },
    gridItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
    },
    gridItemText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
