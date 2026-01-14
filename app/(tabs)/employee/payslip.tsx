import Header, { HEADER_HEIGHT } from '@/components/Header';
import { useProtectedBack } from '@/hooks/useProtectedBack';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '../../../context/ThemeContext';
import ApiService, { PaySlip } from '../../../services/ApiService';

export default function PayslipScreen() {
    const { theme, isDark } = useTheme();
    const [payslips, setPayslips] = useState<PaySlip[]>([]);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [viewingUrl, setViewingUrl] = useState<string | null>(null);

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

    const handleDownloadedFile = async (url: string, shouldShare: boolean = false) => {
        try {
            if (!url) throw new Error('Download URL is empty');

            const fileName = `PaySlip_${new Date().getTime()}.pdf`;
            const fileUri = FileSystem.documentDirectory + fileName;

            // 1. If explicit "Download" on Android -> Use Storage Access Framework
            if (!shouldShare && Platform.OS === 'android') {
                const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
                if (permissions.granted) {
                    const downloadRes = await FileSystem.downloadAsync(url, fileUri);
                    if (downloadRes.status !== 200) throw new Error('Failed to download temp file');

                    const base64 = await FileSystem.readAsStringAsync(downloadRes.uri, { encoding: FileSystem.EncodingType.Base64 });
                    const createdUri = await FileSystem.StorageAccessFramework.createFileAsync(permissions.directoryUri, fileName, 'application/pdf');
                    await FileSystem.writeAsStringAsync(createdUri, base64, { encoding: FileSystem.EncodingType.Base64 });

                    Alert.alert('Success', 'File saved successfully.');
                    return;
                } else {
                    return; // User cancelled
                }
            }

            // 2. Default logic (iOS or Sharing)
            const downloadRes = await FileSystem.downloadAsync(url, fileUri);
            if (downloadRes.status === 200) {
                if (shouldShare) {
                    const isAvailable = await Sharing.isAvailableAsync();
                    if (isAvailable) {
                        await Sharing.shareAsync(downloadRes.uri, {
                            mimeType: 'application/pdf',
                            dialogTitle: 'Download Payslip',
                            UTI: 'com.adobe.pdf'
                        });
                    }
                } else {
                    Alert.alert('Success', 'File downloaded successfully.');
                }
            } else {
                throw new Error(`Download failed with status: ${downloadRes.status}`);
            }

        } catch (error: any) {
            console.error('Download Error', error);
            Alert.alert('Error', error?.message || 'Download failed');
        }
    };

    const handleViewPdf = async (item: PaySlip) => {
        try {
            setDownloading(true);
            const response = await ApiService.downloadPaySlip(item);
            if (response.success && response.url) {
                setViewingUrl(response.url);
            } else {
                Alert.alert('Error', response.error || 'Failed to generate payslip link');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to open payslip');
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
                    onPress={() => handleViewPdf(item)}
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
                    contentContainerStyle={{paddingTop:HEADER_HEIGHT}}
                />
            )}

            {/* PDF Viewer Modal */}
            <Modal
                visible={!!viewingUrl}
                transparent={true}
                onRequestClose={() => setViewingUrl(null)}
                animationType="slide"
            >
                <SafeAreaView style={{ flex: 1, backgroundColor: 'black' }}>
                    <View style={styles.viewerHeader}>
                        <TouchableOpacity onPress={() => setViewingUrl(null)} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color="white" />
                        </TouchableOpacity>
                        <Text style={{ color: 'white', fontWeight: 'bold', flex: 1, textAlign: 'center' }}>Payslip Preview</Text>

                        <View style={{ flexDirection: 'row' }}>
                            <TouchableOpacity onPress={() => viewingUrl && handleDownloadedFile(viewingUrl, true)} style={styles.iconButton}>
                                <Ionicons name="share-social-outline" size={24} color="white" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => viewingUrl && handleDownloadedFile(viewingUrl, false)} style={styles.iconButton}>
                                <Ionicons name="download-outline" size={24} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={{ flex: 1 }}>
                        {viewingUrl && (
                            <WebView
                                source={{
                                    uri: Platform.OS === 'android'
                                        ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(viewingUrl)}`
                                        : viewingUrl
                                }}
                                style={{ flex: 1 }}
                                startInLoadingState={true}
                                renderLoading={() => (
                                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
                                        <ActivityIndicator size="large" color={theme.primary} />
                                    </View>
                                )}
                            />
                        )}
                    </View>
                </SafeAreaView>
            </Modal>

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
    },
    viewerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'rgba(0,0,0,0.8)',
    },
    closeButton: {
        padding: 8,
    },
    iconButton: {
        padding: 8,
        marginLeft: 8
    }
});
