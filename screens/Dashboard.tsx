
import { Feather, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const MENU_ITEMS = [
    { id: 1, title: 'Mobile\nAtten.Report', icon: 'file-document-outline', color: '#10B981', lib: MaterialCommunityIcons },
    { id: 2, title: 'Profile', icon: 'user-circle', color: '#0EA5E9', lib: FontAwesome5 },
    { id: 3, title: 'Request\nStatus', icon: 'clipboard-list', color: '#10B981', lib: FontAwesome5 },
    { id: 4, title: 'Leave Manage', icon: 'calendar-minus', color: '#F59E0B', lib: MaterialCommunityIcons }, // Yellow/Orange
    { id: 5, title: 'Time Manage', icon: 'clock-time-four-outline', color: '#F97316', lib: MaterialCommunityIcons }, // Orange
    { id: 6, title: 'Uploaded\nDocument', icon: 'file-upload-outline', color: '#06B6D4', lib: MaterialCommunityIcons }, // Cyan
    { id: 7, title: 'Office\nDocument', icon: 'file-certificate-outline', color: '#EC4899', lib: MaterialCommunityIcons }, // Pink
    { id: 8, title: 'PaySlip', icon: 'cash-multiple', color: '#EC4899', lib: MaterialCommunityIcons }, // Pink
    { id: 9, title: 'Holiday', icon: 'umbrella-beach', color: '#A855F7', lib: FontAwesome5 }, // Purple
    { id: 10, title: 'Upcoming\nCelebration', icon: 'birthday-cake', color: '#84CC16', lib: FontAwesome5 }, // Lime
    { id: 11, title: 'Calender', icon: 'calendar-alt', color: '#3B82F6', lib: FontAwesome5 }, // Blue
    { id: 12, title: 'Employee List', icon: 'users', color: '#3B82F6', lib: FontAwesome5 }, // Blue
    { id: 13, title: 'Employee\nAttendance', icon: 'clipboard-check', color: '#10B981', lib: FontAwesome5 }, // Green
    { id: 14, title: 'Claim &\nExpense', icon: 'hand-holding-usd', color: '#3B82F6', lib: FontAwesome5 }, // Blue
    { id: 15, title: 'Emp Mobile\nAtten.Rpt', icon: 'file-alt', color: '#EC4899', lib: FontAwesome5 }, // Pink
    { id: 16, title: 'Service Report', icon: 'file-invoice', color: '#14B8A6', lib: FontAwesome5 }, // Teal
    { id: 17, title: 'Pending\nApproval', icon: 'user-clock', color: '#06B6D4', lib: FontAwesome5 }, // Cyan
    { id: 18, title: 'Other Pending\nApproval', icon: 'file-contract', color: '#06B6D4', lib: FontAwesome5 }, // Cyan
];

export default function DashboardScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const userDataParam = params.userData as string;

    let user: any = null;
    try {
        if (userDataParam) {
            user = JSON.parse(userDataParam);
        }
    } catch (e) {
        console.log('Error parsing user data', e);
    }

    const empName = user?.EmpName || user?.Name || 'DR.Baiju';
    const empCode = user?.EmpCode || '10005';
    const designation = user?.Designation || user?.Role || 'Senior Executive';
    const company = user?.DomainId || 'TRICKY HR - DEMO';

    const handleLogout = () => {
        router.replace('/');
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <View style={styles.logoIcon}>
                            <MaterialCommunityIcons name="fingerprint" size={24} color="#fff" />
                        </View>
                        <View>
                            <Text style={styles.logoText}>NovaFrames</Text>
                            <Text style={styles.tagline}>AI SECURITY & SMART SYSTEMS</Text>
                        </View>
                    </View>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* Welcome Section */}
                    <View style={styles.welcomeSection}>
                        <Text style={styles.sectionTitle}>Home</Text>
                        <Text style={styles.welcomeText}>
                            Welcome back, <Text style={styles.userName}>{empName} .</Text>
                        </Text>

                        <View style={styles.locationBadge}>
                            <MaterialCommunityIcons name="map-marker-radius" size={16} color="#065F46" />
                            <Text style={styles.locationText}>VERIFIED AT: BHAVANI, TAMIL NADU</Text>
                        </View>

                        <View style={styles.actionRow}>
                            <TouchableOpacity style={styles.bellButton}>
                                <Feather name="bell" size={20} color="#64748B" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.terminationButton} onPress={handleLogout}>
                                <Feather name="log-out" size={18} color="#BE123C" style={{ marginRight: 8 }} />
                                <Text style={styles.terminationText}>Termination Session</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Profile Card */}
                    <View style={styles.card}>
                        <View style={styles.avatarContainer}>
                            <Text style={styles.avatarText}>{empName.charAt(0)}</Text>
                        </View>
                        <Text style={styles.profileName}>{empName} - {empCode}</Text>
                        <View style={styles.roleContainer}>
                            <MaterialCommunityIcons name="briefcase-outline" size={16} color="#64748B" />
                            <Text style={styles.roleText}>{designation}</Text>
                        </View>

                        <View style={styles.companyBadge}>
                            <MaterialCommunityIcons name="domain" size={18} color="#9A3412" />
                            <Text style={styles.companyText}>{company}</Text>
                        </View>

                        <Text style={styles.liveLocationText}>Live Location is Activated</Text>
                    </View>

                    {/* Mobile Attendance Button */}
                    <TouchableOpacity style={styles.attendanceCard}>
                        <View style={styles.attendanceIconContainer}>
                            <MaterialCommunityIcons name="clipboard-text-outline" size={32} color="#fff" />
                        </View>
                        <Text style={styles.attendanceText}>Mobile Attendance</Text>
                    </TouchableOpacity>

                    {/* Grid Menu */}
                    <View style={styles.gridContainer}>
                        {MENU_ITEMS.map((item) => {
                            const IconLib = item.lib;
                            return (
                                <TouchableOpacity key={item.id} style={styles.gridItem}>
                                    <View style={[styles.gridIconContainer, { backgroundColor: item.color }]}>
                                        <IconLib name={item.icon as any} size={24} color="#fff" />
                                    </View>
                                    <Text style={styles.gridTitle}>{item.title}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    safeArea: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#F97316', // Orange
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    logoText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#EA580C', // Darker Orange
    },
    tagline: {
        fontSize: 8,
        color: '#C2410C',
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    welcomeSection: {
        marginTop: 20,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#0F172A',
        marginBottom: 5,
    },
    welcomeText: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 10,
    },
    userName: {
        fontWeight: '700',
        color: '#D97706', // Amber
    },
    locationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#D1FAE5', // Light Green
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        alignSelf: 'flex-start',
        marginBottom: 15,
    },
    locationText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#065F46',
        marginLeft: 6,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    bellButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    terminationButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF1F2', // Light Pink
        height: 44,
        borderRadius: 12,
    },
    terminationText: {
        color: '#BE123C',
        fontWeight: '600',
        fontSize: 14,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatarText: {
        fontSize: 32,
        fontWeight: '600',
        color: '#1E293B',
    },
    profileName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 4,
    },
    roleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    roleText: {
        fontSize: 14,
        color: '#64748B',
        marginLeft: 6,
    },
    companyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFEDD5', // Light Orange
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 12,
        width: '100%',
        justifyContent: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#FED7AA',
    },
    companyText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#9A3412',
        marginLeft: 8,
    },
    liveLocationText: {
        fontSize: 12,
        color: '#64748B',
        fontStyle: 'italic',
    },
    attendanceCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 20,
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    attendanceIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: '#EC4899', // Pink
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: '#EC4899',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    attendanceText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    gridItem: {
        width: '31%', // 3 columns
        aspectRatio: 0.85,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    gridIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    gridTitle: {
        fontSize: 11,
        fontWeight: '600',
        color: '#334155',
        textAlign: 'center',
        lineHeight: 14, // Handle multi-line
    },
});
