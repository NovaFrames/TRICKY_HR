import Header from '@/components/Header';
import { useProtectedBack } from '@/hooks/useProtectedBack';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import ApiService, { PaySlip } from '../../../services/ApiService';

export default function PayslipScreen() {
    const { theme, isDark } = useTheme();
    const [payslips, setPayslips] = useState<PaySlip[]>([]);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        loadPayslips();
    }, []);

    useProtectedBack({
        home: '/home'
    });

    const loadPayslips = async () => {
        try {
            setLoading(true);
            const response = await ApiService.getPaySlipList();
            if (response.success && response.data) {
                setPayslips([...response.data].reverse());
            } else {
                // Silent fail or empty handling
            }
        } catch (error) {
            Alert.alert('Error', 'An unexpected error occurred while fetching payslips');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (item: PaySlip) => {
        try {
            setDownloading(true);
            const response = await ApiService.downloadPaySlip(item);
            if (response.success && response.url) {
                const supported = await Linking.canOpenURL(response.url);
                if (supported) {
                    await Linking.openURL(response.url);
                } else {
                    Alert.alert('Error', 'Cannot open this URL: ' + response.url);
                }
            } else {
                Alert.alert('Error', response.error || 'Failed to generate download link');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to download payslip');
        } finally {
            setDownloading(false);
        }
    };

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const renderItem = ({ item, index }: { item: PaySlip; index: number }) => {
        const monthIndex = item.MonthN - 1;
        const monthName = (monthIndex >= 0 && monthIndex < months.length) ? months[monthIndex] : '';
        const payPeriod = `${monthName} ${item.YearN}`;

        // Use theme-aware background colors. 
        // In light mode, maintain the requested alternating colors (#F9FDFF / #ffffff).
        // In dark mode, use theme background/card colors.
        let backgroundColor;
        if (isDark) {
            backgroundColor = index % 2 === 0 ? theme.cardBackground : theme.background;
        } else {
            backgroundColor = index % 2 === 0 ? '#F9FDFF' : '#ffffff';
        }

        return (
            <View style={[styles.itemContainer, { backgroundColor, borderColor: theme.inputBorder }]}>
                <Text style={[styles.dateText, { color: theme.text }]}>{payPeriod}</Text>
                <TouchableOpacity
                    style={styles.downloadButton}
                    onPress={() => handleDownload(item)}
                    disabled={downloading}
                >
                    <Ionicons name="document-text-outline" size={20} color={theme.primary || "#00A3E0"} />
                    <Text style={[styles.downloadText, { color: theme.text }]}>View PaySlip</Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            <Header title="PaySlip" />

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.primary || "#00A3E0"} />
                </View>
            ) : payslips.length === 0 ? (
                <View style={styles.center}>
                    <Text style={[styles.noDataText, { color: theme.placeholder }]}>No payslips available</Text>
                </View>
            ) : (
                <FlatList
                    data={payslips}
                    renderItem={renderItem}
                    keyExtractor={(item, index) => item.PaySalIdN ? item.PaySalIdN.toString() : index.toString()}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {downloading && (
                <View style={styles.loadingOverlay}>
                    <View style={[styles.loadingBox, { backgroundColor: theme.cardBackground }]}>
                        <ActivityIndicator size="large" color={theme.primary || "#00A3E0"} />
                        <Text style={[styles.loadingText, { color: theme.text }]}>Opening PaySlip...</Text>
                    </View>
                </View>
            )}
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
    itemContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
    },
    dateText: {
        fontSize: 16,
        fontWeight: '500',
    },
    downloadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 5,
    },
    downloadText: {
        marginLeft: 5,
        fontSize: 15,
        fontWeight: '400',
    },
    noDataText: {
        fontSize: 16,
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    loadingBox: {
        padding: 20,
        borderRadius: 4,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 14
    }
});
