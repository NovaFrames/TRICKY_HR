
import { Feather, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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

interface Project {
    Id?: number;
    ProjectId?: number;
    ProjectName?: string;
    Name?: string;
}

// Fallback menu items if API doesn't return any
const STATIC_MENU_ITEMS = [
    { MenuNameC: 'Mobile Attendance', IconcolorC: '#10B981' },
    { MenuNameC: 'Profile', IconcolorC: '#0EA5E9' },
    { MenuNameC: 'Request Status', IconcolorC: '#10B981' },
    { MenuNameC: 'Leave Manage', IconcolorC: '#F59E0B' },
];

export default function DashboardScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const userDataParam = params.userData as string;

    const [user, setUser] = useState<any>(null);
    const [locationAddress, setLocationAddress] = useState<string | null>(null);
    // const [projects, setProjects] = useState<Project[]>([]);
    // const [loadingProjects, setLoadingProjects] = useState(false);

    useEffect(() => {
        if (userDataParam) {
            try {
                const parsed = JSON.parse(userDataParam);
                console.log('--- DASHBOARD DEBUG ---');
                console.log('Parsed User Object:', JSON.stringify(parsed, null, 2));

                const realUser = parsed.data || parsed;
                setUser(realUser);
            } catch (e) {
                console.log('Error parsing user data', e);
            }
        }
    }, [userDataParam]);

    const loginData = user || {};

    const empName = loginData.EmpNameC || loginData.EmpName || loginData.Name || '-';
    const empCode = loginData.EmpCodeC || loginData.EmpCode || '-';
    const designation = loginData.DesigNameC || loginData.Designation || '-';
    const company = loginData.CompNameC || loginData.DomainId || '-';
    const liveLocationEnabled = loginData.IsLiveLocN === 1;

    // Critical: Token extraction
    const token = loginData.Token || loginData.TokenC;

    console.log('Extracted Token for Projects:', token);

    // Dynamic Menu Items
    const menuItems = (Array.isArray(loginData.EmpMenu) && loginData.EmpMenu.length > 0)
        ? loginData.EmpMenu
        : STATIC_MENU_ITEMS;

    useEffect(() => {
        const userLoc = loginData.location || { lat: 11.44, lng: 77.67 };

        if (userLoc) {
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLoc.lat}&lon=${userLoc.lng}`)
                .then(res => res.json())
                .then(data => {
                    const addr = data.address;
                    if (addr) {
                        const city = addr.city || addr.town || addr.village || addr.county;
                        const state = addr.state || addr.country;
                        setLocationAddress(`${city}, ${state}`);
                    }
                })
                .catch(() => setLocationAddress(`${userLoc.lat.toFixed(4)}, ${userLoc.lng.toFixed(4)}`));
        }
    }, [user]);

    // Project fetching removed as per previous user edit state

    const handleLogout = () => {
        router.replace('/');
    };

    const getMenuIcon = (name: string) => {
        const key = name.toLowerCase();
        if (key.includes('attendance')) return { lib: FontAwesome5, name: 'clipboard-check' };
        if (key.includes('report')) return { lib: FontAwesome5, name: 'file-alt' };
        if (key.includes('profile')) return { lib: FontAwesome5, name: 'user-circle' };
        if (key.includes('request')) return { lib: FontAwesome5, name: 'clipboard-list' };
        if (key.includes('leave')) return { lib: MaterialCommunityIcons, name: 'calendar-minus' };
        if (key.includes('time')) return { lib: Feather, name: 'clock' };
        if (key.includes('holiday')) return { lib: FontAwesome5, name: 'umbrella-beach' };
        if (key.includes('document')) return { lib: MaterialCommunityIcons, name: 'file-document-outline' };
        if (key.includes('payslip')) return { lib: MaterialCommunityIcons, name: 'cash-multiple' };

        return { lib: Feather, name: 'grid' };
    };

    const initial = empName.charAt(0);

    return (
        <View style={styles.container}>
            {/* Professional Header Gradient */}
            <LinearGradient
                colors={['#fff', '#f3f4f6']}
                style={styles.headerBackground}
            >
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.greeting}>Welcome Back,</Text>
                            <Text style={styles.headerTitle}>{empName.split(' ')[0]}</Text>
                        </View>
                        <View style={styles.headerRight}>
                            <TouchableOpacity style={styles.iconButton}>
                                <Feather name="bell" size={22} color="#1F2937" />
                                <View style={styles.notificationDot} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.profileButton} onPress={handleLogout}>
                                <View style={styles.headerAvatar}>
                                    <Text style={styles.headerAvatarText}>{initial}</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                style={styles.scrollView}
            >

                {/* ID Card Style Profile */}
                <View style={styles.idCard}>
                    <LinearGradient
                        colors={['#1E293B', '#0F172A']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.idCardGradient}
                    >
                        <View style={styles.idCardTop}>
                            <View style={styles.avatarLarge}>
                                <Text style={styles.avatarLargeText}>{initial}</Text>
                            </View>
                            <View style={styles.idCardInfo}>
                                <Text style={styles.idName}>{empName}</Text>
                                <Text style={styles.idRole}>{designation}</Text>
                                <View style={styles.idBadgeRow}>
                                    <View style={styles.idBadge}>
                                        <Text style={styles.idBadgeText}>ID: {empCode}</Text>
                                    </View>
                                    <View style={[styles.idBadge, { backgroundColor: 'rgba(215,122,47,0.2)' }]}>
                                        <Text style={[styles.idBadgeText, { color: '#FB923C' }]}>{company}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        <View style={styles.idCardBottom}>
                            <View style={styles.locationContainer}>
                                <MaterialCommunityIcons name="map-marker" size={14} color="#94A3B8" />
                                <Text style={styles.locationText} numberOfLines={1}>
                                    {locationAddress || 'Locating...'}
                                </Text>
                            </View>
                            <View style={styles.liveTag}>
                                <View style={[styles.liveDot, liveLocationEnabled ? { backgroundColor: '#10B981' } : { backgroundColor: '#EF4444' }]} />
                                <Text style={styles.liveText}>
                                    {liveLocationEnabled ? 'Live' : 'Offline'}
                                </Text>
                            </View>
                        </View>
                    </LinearGradient>
                </View>

                {/* Tracking Toggle Card (Subtle) */}
                <View style={styles.trackingCard}>
                    <View style={styles.trackingInfo}>
                        <View style={styles.trackingIcon}>
                            <Feather name="navigation" size={20} color="#fff" />
                        </View>
                        <View>
                            <Text style={styles.trackingTitle}>Live Tracking</Text>
                            <Text style={styles.trackingSub}>Monitor your location</Text>
                        </View>
                    </View>
                    <View style={[styles.toggleTrack, liveLocationEnabled ? { backgroundColor: '#10B98120' } : { backgroundColor: '#F1F5F9' }]}>
                        <View style={[styles.toggleThumb, liveLocationEnabled ? { backgroundColor: '#10B981', transform: [{ translateX: 20 }] } : { backgroundColor: '#94A3B8' }]} />
                    </View>
                </View>

                <Text style={styles.sectionHeader}>Quick Actions</Text>

                {/* Menu Grid */}
                <View style={styles.gridContainer}>
                    {menuItems.map((item: any, index: number) => {
                        const { lib: IconLib, name: iconName } = getMenuIcon(item.MenuNameC);
                        const isAttendance = index === 0 || item.MenuNameC?.toLowerCase().includes('mobile attendance');
                        const itemColor = item.IconcolorC || '#d77a2f';

                        if (isAttendance) {
                            return (
                                <TouchableOpacity key={index} style={styles.attendanceCard}>
                                    <LinearGradient
                                        colors={[itemColor, '#d77a2f']}
                                        style={styles.attendanceGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        <View style={styles.attendanceContent}>
                                            <View style={styles.attendanceIconBox}>
                                                <IconLib name={iconName as any} size={24} color={itemColor} />
                                            </View>
                                            <View>
                                                <Text style={styles.attendanceTitle}>{item.MenuNameC}</Text>
                                                <Text style={styles.attendanceSub}>Check-in / Check-out</Text>
                                            </View>
                                            <Feather name="chevron-right" size={24} color="#fff" style={{ marginLeft: 'auto' }} />
                                        </View>
                                    </LinearGradient>
                                </TouchableOpacity>
                            )
                        }

                        return (
                            <TouchableOpacity key={index} style={styles.gridItem}>
                                <View style={[styles.gridIconBox, { backgroundColor: itemColor + '15' }]}>
                                    <IconLib name={iconName as any} size={24} color={itemColor} />
                                </View>
                                <Text style={styles.gridLabel} numberOfLines={2}>{item.MenuNameC}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <TouchableOpacity style={styles.logoutRow} onPress={handleLogout}>
                    <Feather name="log-out" size={18} color="#EF4444" />
                    <Text style={styles.logoutText}>End Session</Text>
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    headerBackground: {
        paddingBottom: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        backgroundColor: '#fff',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 5,
        zIndex: 10,
    },
    safeArea: {
        marginBottom: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 10,
    },
    greeting: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#1E293B',
        letterSpacing: -0.5,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#F1F5F9', // Subtle gray
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationDot: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#EF4444',
        borderWidth: 1.5,
        borderColor: '#F1F5F9',
    },
    profileButton: {
        // Shadow handled by headerAvatar
    },
    headerAvatar: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#0F172A',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerAvatarText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 18,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: 24,
        paddingHorizontal: 24,
        paddingBottom: 40,
    },

    // ID Card
    idCard: {
        borderRadius: 24,
        marginBottom: 24,
        shadowColor: "#1E293B",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
    idCardGradient: {
        borderRadius: 24,
        padding: 24,
    },
    idCardTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    avatarLarge: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        marginRight: 16,
    },
    avatarLargeText: {
        fontSize: 28,
        fontWeight: '700',
        color: '#fff',
    },
    idCardInfo: {
        flex: 1,
    },
    idName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 4,
    },
    idRole: {
        fontSize: 14,
        color: '#94A3B8',
        marginBottom: 10,
    },
    idBadgeRow: {
        flexDirection: 'row',
        gap: 8,
    },
    idBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 8,
    },
    idBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#E2E8F0',
    },
    idCardBottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    locationText: {
        fontSize: 12,
        color: '#94A3B8',
        marginLeft: 6,
        paddingRight: 10,
    },
    liveTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    liveText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#fff',
        textTransform: 'uppercase',
    },

    // Tracking
    trackingCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 2,
    },
    trackingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    trackingIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#3B82F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    trackingTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1E293B',
    },
    trackingSub: {
        fontSize: 12,
        color: '#64748B',
    },
    toggleTrack: {
        width: 48,
        height: 28,
        borderRadius: 14,
        padding: 2,
        justifyContent: 'center',
    },
    toggleThumb: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#fff',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },

    sectionHeader: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 16,
    },

    // Grid
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 24,
    },
    // Mobile Attendance specific
    attendanceCard: {
        width: '100%',
        marginBottom: 0, // In grid gap handles it if wrapped, but here likely separated
        borderRadius: 20,
        shadowColor: "#EC4899", // Pinkish shadow logic from prev code
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 4,
    },
    attendanceGradient: {
        borderRadius: 20,
        padding: 20,
    },
    attendanceContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    attendanceIconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    attendanceTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    attendanceSub: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 2,
    },

    // Regular Items
    gridItem: {
        width: (width - 48 - 16) / 2, // 2 columns: Screen - padding - gap
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center', // Center content
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#F1F5F9', // Very subtle border
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 2,
    },
    gridIconBox: {
        width: 56,
        height: 56,
        borderRadius: 20, // Softer radius
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    gridLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#334155',
        textAlign: 'center',
    },

    // Logout
    logoutRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
        marginTop: 10,
        marginBottom: 30,
        gap: 8,
    },
    logoutText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#EF4444',
    }
});
