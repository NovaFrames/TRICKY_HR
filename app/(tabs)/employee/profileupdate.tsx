import { useUser } from '@/context/UserContext';
import { useProtectedBack } from '@/hooks/useProtectedBack';
import {
    Feather,
    Ionicons,
    MaterialIcons
} from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    Dimensions,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function ProfileUpdate() {
    const { theme, isDark } = useTheme();
    const { user } = useUser();

    useProtectedBack({
        home: '/home',
        settings: '/settings',
        dashboard: '/dashboard',
    });

    // ✅ Fallback UI (prevents crash)
    if (!user) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.emptyState}>
                    <Ionicons name="person-circle-outline" size={80} color={theme.textLight} />
                    <Text style={[styles.emptyStateTitle, { color: theme.text }]}>
                        No Profile Data
                    </Text>
                    <Text style={[styles.emptyStateText, { color: theme.textLight }]}>
                        Employee information not available
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    /* -------------------- UI HELPERS -------------------- */

    const DetailCard = ({
        title,
        children,
        icon,
    }: {
        title: string;
        children: React.ReactNode;
        icon?: React.ReactNode;
    }) => (
        <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.cardHeader}>
                <LinearGradient
                    colors={[`${theme.primary}20`, `${theme.primary}10`]}
                    style={styles.cardIcon}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    {icon || (
                        <Ionicons
                            name="information-circle"
                            size={20}
                            color={theme.primary}
                        />
                    )}
                </LinearGradient>
                <View style={styles.cardTitleContainer}>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>
                        {title}
                    </Text>
                    <View style={[styles.titleUnderline, { backgroundColor: theme.primary }]} />
                </View>
            </View>
            <View style={styles.cardContent}>{children}</View>
        </View>
    );

    const DetailRow = ({
        label,
        value,
        icon,
        withDivider = true,
    }: {
        label: string;
        value: string | number;
        icon?: React.ReactNode;
        withDivider?: boolean;
    }) => (
        <>
            <View style={styles.detailRow}>
                <View style={styles.detailLeft}>
                    <View style={[styles.rowIconContainer, { backgroundColor: `${theme.primary}15` }]}>
                        {icon}
                    </View>
                    <Text style={[styles.detailLabel, { color: theme.text }]}>
                        {label}
                    </Text>
                </View>
                <View style={styles.valueContainer}>
                    <Text
                        style={[styles.detailValue, { color: theme.text }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                    >
                        {value}
                    </Text>
                </View>
            </View>
            {withDivider && <View style={[styles.divider, { backgroundColor: `${theme.textLight}20` }]} />}
        </>
    );

    const StatusBadge = ({ status }: { status: string }) => {
        const active = status === 'Enabled' || status === 'Yes';
        return (
            <LinearGradient
                colors={active ? ['#10B981', '#059669'] : ['#EF4444', '#DC2626']}
                style={styles.badge}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
            >
                <Text style={styles.badgeText}>
                    {status}
                </Text>
            </LinearGradient>
        );
    };

    const InfoItem = ({ label, value }: { label: string; value: string | number }) => (
        <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: theme.textLight }]}>{label}</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>{value}</Text>
        </View>
    );

    /* -------------------- RENDER -------------------- */

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor="transparent"
                translucent
            />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >

                {/* Basic Information */}
                <DetailCard
                    title="Basic Information"
                    icon={<Ionicons name="person-outline" size={20} color={theme.primary} />}
                >
                    <DetailRow
                        label="Employee ID"
                        value={user?.EmpCodeC}
                        icon={<Ionicons name="id-card" size={18} color={theme.primary} />}
                    />
                    <DetailRow
                        label="Full Name"
                        value={user?.EmpNameC}
                        icon={<Ionicons name="person" size={18} color={theme.primary} />}
                    />
                    <DetailRow
                        label="Designation"
                        value={user?.DesigNameC}
                        icon={<MaterialIcons name="work" size={18} color={theme.primary} />}
                    />
                    <DetailRow
                        label="Company"
                        value={user?.CompNameC}
                        icon={<Ionicons name="business" size={18} color={theme.primary} />}
                    />
                    <DetailRow
                        label="Employee Number"
                        value={user?.EmpIdN}
                        icon={<Feather name="hash" size={18} color={theme.primary} />}
                        withDivider={false}
                    />
                </DetailCard>

                {/* System Settings */}
                <DetailCard
                    title="System Settings"
                    icon={<Ionicons name="settings-outline" size={20} color={theme.primary} />}
                >
                    <View style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <View style={[styles.rowIconContainer, { backgroundColor: `${theme.primary}15` }]}>
                                <Ionicons name="location" size={18} color={theme.primary} />
                            </View>
                            <View>
                                <Text style={[styles.detailLabel, { color: theme.text }]}>
                                    Location Tracking
                                </Text>
                                <Text style={[styles.settingDescription, { color: theme.textLight }]}>
                                    Real-time location updates
                                </Text>
                            </View>
                        </View>
                        <StatusBadge status={user?.IsLiveLocN === 1 ? 'Enabled' : 'Disabled'} />
                    </View>
                    <View style={[styles.divider, { backgroundColor: `${theme.textLight}20` }]} />

                    <View style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <View style={[styles.rowIconContainer, { backgroundColor: `${theme.primary}15` }]}>
                                <Ionicons name="time" size={18} color={theme.primary} />
                            </View>
                            <View>
                                <Text style={[styles.detailLabel, { color: theme.text }]}>
                                    Tracking Duration
                                </Text>
                                <Text style={[styles.settingDescription, { color: theme.textLight }]}>
                                    Update frequency
                                </Text>
                            </View>
                        </View>
                        <StatusBadge status={`${user?.LiveDurN} min`} />
                    </View>
                    <View style={[styles.divider, { backgroundColor: `${theme.textLight}20` }]} />

                    <View style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <View style={[styles.rowIconContainer, { backgroundColor: `${theme.primary}15` }]}>
                                <Ionicons name="camera" size={18} color={theme.primary} />
                            </View>
                            <View>
                                <Text style={[styles.detailLabel, { color: theme.text }]}>
                                    Face Verification
                                </Text>
                                <Text style={[styles.settingDescription, { color: theme.textLight }]}>
                                    Biometric authentication
                                </Text>
                            </View>
                        </View>
                        <StatusBadge status={user?.FaceVerN === 1 ? 'Enabled' : 'Disabled'} />
                    </View>
                    <View style={[styles.divider, { backgroundColor: `${theme.textLight}20` }]} />

                    <View style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <View style={[styles.rowIconContainer, { backgroundColor: `${theme.primary}15` }]}>
                                <MaterialIcons name="settings" size={18} color={theme.primary} />
                            </View>
                            <View>
                                <Text style={[styles.detailLabel, { color: theme.text }]}>
                                    Mid-Month Enable
                                </Text>
                                <Text style={[styles.settingDescription, { color: theme.textLight }]}>
                                    Payroll processing
                                </Text>
                            </View>
                        </View>
                        <StatusBadge status={user?.EnableMidMonthN === 1 ? 'Yes' : 'No'} />
                    </View>
                </DetailCard>

                {/* Company Details */}
                <DetailCard
                    title="Company Details"
                    icon={<Ionicons name="business-outline" size={20} color={theme.primary} />}
                >
                    <View style={styles.companyGrid}>
                        <InfoItem label="Customer ID" value={user?.CustomerIdC} />
                        <InfoItem label="Company ID" value={user?.CompIdN} />
                        <InfoItem label="Country ID" value={user?.CountryIdN} />
                        <InfoItem label="Website" value={user?.WebsiteC || 'Not set'} />
                    </View>
                </DetailCard>

            </ScrollView>
        </SafeAreaView>
    );
}

/* -------------------- STYLES -------------------- */

const styles = StyleSheet.create({
    container: { flex: 1 },

    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyStateTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyStateText: {
        fontSize: 14,
        textAlign: 'center',
    },

    gradientHeader: {
        paddingTop: 60,
        paddingBottom: 30,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerContent: {
        paddingHorizontal: 24,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: -0.5,
    },
    editButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 20,
    },
    avatar: {
        width: 90,
        height: 90,
        borderRadius: 45,
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    cameraButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#3B82F6',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },

    profileInfo: {
        flex: 1,
    },
    employeeName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 6,
    },
    designationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    employeeDesignation: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        marginLeft: 6,
    },
    idContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    employeeId: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginLeft: 6,
    },

    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },

    statsCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '500',
        opacity: 0.7,
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: 'rgba(0,0,0,0.1)',
    },

    card: {
        borderRadius: 16,
        marginBottom: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    cardIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    cardTitleContainer: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 4,
    },
    titleUnderline: {
        width: 24,
        height: 3,
        borderRadius: 2,
    },
    cardContent: {
        paddingHorizontal: 20,
        paddingVertical: 8,
    },

    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    detailLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    rowIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    detailLabel: {
        fontSize: 15,
        fontWeight: '500',
        flex: 1,
    },
    valueContainer: {
        maxWidth: '50%',
    },
    detailValue: {
        fontSize: 15,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        marginLeft: 48, // Align with icon
    },

    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    settingDescription: {
        fontSize: 12,
        marginTop: 2,
    },

    badge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        minWidth: 80,
        alignItems: 'center',
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#fff',
    },

    companyGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    infoItem: {
        width: '48%',
        marginBottom: 16,
    },
    infoLabel: {
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 4,
        opacity: 0.7,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '600',
    },

    actionsCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
    },
    actionsTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
    },
    actionsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    actionButton: {
        alignItems: 'center',
        justifyContent: 'center',
        width: (width - 80) / 4,
        paddingVertical: 16,
        borderRadius: 12,
    },
    actionIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    actionText: {
        fontSize: 12,
        fontWeight: '500',
    },

    footer: {
        alignItems: 'center',
        paddingTop: 20,
        paddingBottom: 40,
    },
    footerText: {
        fontSize: 12,
        marginBottom: 8,
    },
    onlineStatus: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '500',
    },
});