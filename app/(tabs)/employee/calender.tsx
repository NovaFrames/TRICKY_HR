import Header from '@/components/Header';
import { useProtectedBack } from '@/hooks/useProtectedBack';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Platform,
    SectionList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import ApiService, { CalendarEvent, CalendarLeaveDetail } from '../../../services/ApiService';

export default function CalendarScreen() {
    const { theme, isDark } = useTheme();
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(false);

    // Date Selection
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Detail Modal
    const [modalVisible, setModalVisible] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailData, setDetailData] = useState<{ title: string, data: CalendarLeaveDetail[] }[]>([]);
    const [detailDateStr, setDetailDateStr] = useState('');

    useProtectedBack({
        home: '/home',
    });

    useEffect(() => {
        fetchEvents();
    }, [selectedDate]);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const month = selectedDate.getMonth() + 1; // 1-12
            const year = selectedDate.getFullYear();

            const response = await ApiService.getCalendarEvents(month, year);
            if (response.success && response.data) {
                // Java code sorts by date: return v1.getDate().compareTo(v2.getDate());
                const sortedEvents = [...response.data].sort((a, b) => {
                    const dateA = parseDotNetDate(a.LDateD);
                    const dateB = parseDotNetDate(b.LDateD);
                    return dateA.getTime() - dateB.getTime();
                });
                // console.log(sortedEvents);s

                setEvents(sortedEvents);
            } else {
                setEvents([]);
                // Silent fail or alert if needed, similar to Payslip
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to fetch calendar events');
        } finally {
            setLoading(false);
        }
    };

    const parseDotNetDate = (dateStr: string): Date => {
        // Format: /Date(1518028200000)/ or /Date(1518028200000+0530)/
        try {
            const timestamp = parseInt(dateStr.replace(/\/Date\((.*?)\)\//, '$1'));
            return new Date(timestamp);
        } catch (e) {
            return new Date();
        }
    };

    const handleDateChange = (event: any, date?: Date) => {
        setShowDatePicker(false);
        if (date) {
            setSelectedDate(date);
        }
    };

    const handleDescriptionPress = async (event: CalendarEvent) => {
        try {
            const date = parseDotNetDate(event.LDateD);
            // Format "MMM dd yyyy" e.g. "Feb 08 2018"
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const formattedDate = `${months[date.getMonth()]} ${String(date.getDate()).padStart(2, '0')} ${date.getFullYear()}`;

            setDetailDateStr(formattedDate);
            setModalVisible(true);
            setDetailLoading(true);
            setDetailData([]);

            const response = await ApiService.getCalendarDetails(formattedDate);

            if (response.success && response.data) {
                // Group by LeaveTypeC
                const grouped = response.data.reduce((acc: any, item: CalendarLeaveDetail) => {
                    if (!acc[item.LeaveTypeC]) {
                        acc[item.LeaveTypeC] = [];
                    }
                    acc[item.LeaveTypeC].push(item);
                    return acc;
                }, {});

                const sections = Object.keys(grouped).map(key => ({
                    title: key,
                    data: grouped[key]
                }));

                setDetailData(sections);
            } else {
                // Handle no details or error
            }

        } catch (error) {
            Alert.alert('Error', 'Failed to fetch details');
        } finally {
            setDetailLoading(false);
        }
    };

    // Date formatting for UI
    const getMonthYearString = () => {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return `${months[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
    };

    const renderItem = ({ item, index }: { item: CalendarEvent; index: number }) => {
        const date = parseDotNetDate(item.LDateD);
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const dayStr = days[date.getDay()];
        const dateNum = String(date.getDate()).padStart(2, '0');
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthStr = months[date.getMonth()];

        return (
            <TouchableOpacity
                style={[styles.eventCard, { backgroundColor: theme.cardBackground }]}
                onPress={() => handleDescriptionPress(item)}
                activeOpacity={0.7}
            >
                <View style={[styles.eventDateSection, { backgroundColor: theme.primary + '10' }]}>
                    <View style={styles.dateCircle}>
                        <Text style={[styles.eventDateNum, { color: theme.primary }]}>{dateNum}</Text>
                    </View>
                    <View style={styles.dateMeta}>
                        <Text style={[styles.eventDay, { color: theme.primary }]}>{dayStr}</Text>
                        <Text style={[styles.eventMonth, { color: theme.placeholder }]}>{monthStr}</Text>
                    </View>
                </View>

                <View style={styles.eventContent}>
                    <View style={styles.eventTextContainer}>
                        <Text style={[styles.eventTitle, { color: theme.text }]} numberOfLines={2}>
                            {item.DescC}
                        </Text>
                        <View style={styles.eventMeta}>
                            <Ionicons name="time-outline" size={14} color={theme.placeholder} />
                            <Text style={[styles.eventMetaText, { color: theme.placeholder }]}>
                                {date.toLocaleDateString()}
                            </Text>
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.placeholder} />
                </View>
            </TouchableOpacity>
        );
    };

    const renderDetailItem = ({ item }: { item: CalendarLeaveDetail }) => (
        <View style={[styles.detailItem, { backgroundColor: theme.cardBackground, borderColor: theme.inputBorder }]}>
            <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.placeholder }]}>Emp Code:</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>{item.EmpCodeC}</Text>
            </View>
            <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.placeholder }]}>Desc:</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>{item.DescC}</Text>
            </View>
            <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.placeholder }]}>Remarks:</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>{item.RemarksC}</Text>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Stack.Screen options={{ headerShown: false }} />
            <Header title="Calendar" />

            {/* Modern Month Selector Card */}
            <View style={styles.monthSelectorContainer}>
                <TouchableOpacity
                    style={[styles.monthSelector, { backgroundColor: theme.cardBackground }]}
                    onPress={() => setShowDatePicker(true)}
                    activeOpacity={0.7}
                >
                    <View style={styles.monthSelectorContent}>
                        <View style={[styles.calendarIconBox, { backgroundColor: theme.primary + '15' }]}>
                            <Ionicons name="calendar" size={24} color={theme.primary} />
                        </View>
                        <View style={styles.monthTextContainer}>
                            <Text style={[styles.monthLabel, { color: theme.placeholder }]}>Selected Month</Text>
                            <Text style={[styles.monthText, { color: theme.text }]}>{getMonthYearString()}</Text>
                        </View>
                    </View>
                    <Ionicons name="chevron-down" size={20} color={theme.placeholder} />
                </TouchableOpacity>
            </View>

            {showDatePicker && (
                <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                />
            )}

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={[styles.loadingText, { color: theme.placeholder }]}>Loading events...</Text>
                </View>
            ) : events.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <View style={[styles.emptyIconBox, { backgroundColor: theme.inputBg }]}>
                        <Ionicons name="calendar-outline" size={64} color={theme.placeholder} />
                    </View>
                    <Text style={[styles.emptyTitle, { color: theme.text }]}>No Events Found</Text>
                    <Text style={[styles.emptySubtitle, { color: theme.placeholder }]}>
                        There are no calendar events for {getMonthYearString()}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={events}
                    renderItem={renderItem}
                    keyExtractor={(item, index) => index.toString()}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* Detail Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: theme.inputBorder }]}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>
                                Leave Details as on {detailDateStr}
                            </Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={theme.text} />
                            </TouchableOpacity>
                        </View>

                        {detailLoading ? (
                            <View style={styles.center}>
                                <ActivityIndicator size="large" color={theme.primary} />
                            </View>
                        ) : (
                            <SectionList
                                sections={detailData}
                                keyExtractor={(item, index) => index.toString()}
                                renderItem={renderDetailItem}
                                renderSectionHeader={({ section: { title } }) => (
                                    <View style={[styles.sectionHeader, { backgroundColor: theme.inputBg }]}>
                                        <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
                                    </View>
                                )}
                                ListEmptyComponent={
                                    <Text style={[styles.noDataText, { color: theme.placeholder, textAlign: 'center', marginTop: 20 }]}>
                                        No details available
                                    </Text>
                                }
                                contentContainerStyle={styles.modalListContent}
                            />
                        )}
                        <TouchableOpacity
                            style={[styles.closeButton, { backgroundColor: theme.primary }]}
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
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
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        fontWeight: '500',
    },

    // Month Selector Styles
    monthSelectorContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    monthSelector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    monthSelectorContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    calendarIconBox: {
        width: 48,
        height: 48,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    monthTextContainer: {
        flex: 1,
    },
    monthLabel: {
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 2,
    },
    monthText: {
        fontSize: 18,
        fontWeight: '700',
    },

    // Event List Styles
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 24,
    },
    eventCard: {
        flexDirection: 'row',
        marginBottom: 12,
        borderRadius: 4,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    eventDateSection: {
        width: 90,
        padding: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dateCircle: {
        marginBottom: 4,
    },
    eventDateNum: {
        fontSize: 32,
        fontWeight: '800',
        lineHeight: 36,
    },
    dateMeta: {
        alignItems: 'center',
    },
    eventDay: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    eventMonth: {
        fontSize: 11,
        fontWeight: '500',
        marginTop: 2,
    },
    eventContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        paddingLeft: 12,
    },
    eventTextContainer: {
        flex: 1,
    },
    eventTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 6,
        lineHeight: 22,
    },
    eventMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    eventMetaText: {
        fontSize: 12,
        fontWeight: '500',
        marginLeft: 4,
    },

    // Empty State Styles
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingTop: 60,
    },
    emptyIconBox: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
        lineHeight: 20,
    },
    noDataText: {
        fontSize: 16,
        fontWeight: '500',
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
        maxHeight: '85%',
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        flex: 1,
    },
    modalListContent: {
        paddingBottom: 20,
    },
    sectionHeader: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        marginTop: 8,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    detailItem: {
        marginHorizontal: 16,
        marginVertical: 6,
        padding: 16,
        borderRadius: 4,
        borderWidth: 1,
    },
    detailRow: {
        flexDirection: 'row',
        marginBottom: 8,
        alignItems: 'flex-start',
    },
    detailLabel: {
        width: 90,
        fontWeight: '600',
        fontSize: 13,
    },
    detailValue: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
        lineHeight: 20,
    },
    closeButton: {
        margin: 16,
        padding: 16,
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});
