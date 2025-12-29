
import { Feather, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getProjectList } from '../services/api';

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
    const [projects, setProjects] = useState<Project[]>([]);
    const [loadingProjects, setLoadingProjects] = useState(false);

    useEffect(() => {
        if (userDataParam) {
            try {
                const parsed = JSON.parse(userDataParam);
                setUser(parsed);
                console.log('Parsed User Data:', parsed);
            } catch (e) {
                console.log('Error parsing user data', e);
            }
        }
    }, [userDataParam]);

    // Data Mappings based on Ionic App
    // Ionic: const loginData = user?.loginResponse?.data || {};
    // Here 'user' is likely that data object already due to how our api.ts works
    const loginData = user || {};

    const empName = loginData.EmpNameC || loginData.EmpName || loginData.Name || 'Employee';
    const empCode = loginData.EmpCodeC || loginData.EmpCode || '-';
    const designation = loginData.DesigNameC || loginData.Designation || '-';
    const company = loginData.CompNameC || loginData.DomainId || '-';
    const liveLocationEnabled = loginData.IsLiveLocN === 1;
    const token = loginData.Token || loginData.TokenC || loginData.data?.TokenC;

    // Dynamic Menu Items
    const menuItems = (Array.isArray(loginData.EmpMenu) && loginData.EmpMenu.length > 0)
        ? loginData.EmpMenu
        : STATIC_MENU_ITEMS;

    // Reverse Geocoding Effect (Simulated from Ionic logic)
    useEffect(() => {
        // In a real native app, you'd use expo-location to get current coords.
        // Here we simulate or use what's in the user object if it existed.
        const userLoc = loginData.location || { lat: 11.44, lng: 77.67 }; // Default/Mock

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

    // Fetch Active Projects
    useEffect(() => {
        const fetchProjects = async () => {
            if (!token) return;

            setLoadingProjects(true);
            try {
                const data = await getProjectList(token);
                if (Array.isArray(data)) {
                    setProjects(data);
                } else if (data && Array.isArray(data.data)) {
                    setProjects(data.data);
                } else if (data && Array.isArray(data.Table)) {
                    setProjects(data.Table);
                }
            } catch (error) {
                console.error("Failed to fetch projects", error);
            } finally {
                setLoadingProjects(false);
            }
        };

        fetchProjects();
    }, [token]);

    const handleLogout = () => {
        router.replace('/');
    };

    // Helper to resolve icons based on name
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
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        {/* Show initials or logo */}
                        <Text style={styles.headerTitle}>Home</Text>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity style={styles.iconButton}>
                            <Feather name="bell" size={20} color="#64748B" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                            <Feather name="log-out" size={16} color="#E11D48" style={{ marginRight: 4 }} />
                            <Text style={styles.logoutText}>Termination</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* Welcome Msg */}
                    <View style={styles.welcomeSection}>
                        <Text style={styles.welcomeText}>
                            Welcome back, <Text style={styles.userName}>{empName}</Text>.
                        </Text>
                        <View style={styles.verifiedBadge}>
                            <MaterialCommunityIcons name="map-marker-radius" size={12} color="#065F46" />
                            <Text style={styles.verifiedText}>
                                Verified At: {locationAddress || 'Locating...'}
                            </Text>
                        </View>
                    </View>

                    {/* Profile Card */}
                    <View style={styles.card}>
                        <View style={styles.avatarCircle}>
                            <Text style={styles.avatarText}>{initial}</Text>
                        </View>
                        <Text style={styles.profileName}>{empName} - {empCode}</Text>
                        <View style={styles.row}>
                            <Feather name="briefcase" size={14} color="#64748B" />
                            <Text style={styles.profileDetail}>{designation}</Text>
                        </View>
                        <View style={styles.companyPill}>
                            <FontAwesome5 name="building" size={12} color="#9A3412" />
                            <Text style={styles.companyText}>{company}</Text>
                        </View>
                        <Text style={styles.liveStatus}>
                            {liveLocationEnabled ? 'Live Location is Activated' : 'Live Location is Disabled'}
                        </Text>
                    </View>

                    {/* Live Tracking Toggle Section */}
                    <View style={styles.trackingCard}>
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <View style={styles.trackingIconBox}>
                                <Feather name="navigation" size={18} color="#475569" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.cardTitle}>Live Tracking</Text>
                                <Text style={styles.cardSub}>Enable live tracking to monitor your location.</Text>
                            </View>
                        </View>
                        {/* Simulated Toggle Visual */}
                        <View style={[styles.toggleTrack, liveLocationEnabled ? { backgroundColor: '#D1FAE5' } : { backgroundColor: '#F1F5F9' }]}>
                            <View style={[styles.toggleThumb, liveLocationEnabled ? { backgroundColor: '#10B981', transform: [{ translateX: 18 }] } : { backgroundColor: '#94A3B8' }]} />
                        </View>
                    </View>

                    {/* Dynamic Menu Grid */}
                    <View style={styles.gridContainer}>
                        {menuItems.map((item: any, index: number) => {
                            const { lib: IconLib, name: iconName } = getMenuIcon(item.MenuNameC);
                            const isAttendance = index === 0 || item.MenuNameC?.toLowerCase().includes('mobile attendance');
                            const itemColor = item.IconcolorC || '#d77a2f'; // Default accent

                            // Attendance usually spans full width in the ionic app design logic provided
                            const styleItems = isAttendance ? styles.gridItemFull : styles.gridItem;

                            return (
                                <TouchableOpacity key={index} style={styleItems}>
                                    <View style={[styles.gridIconBox, { backgroundColor: itemColor }]}>
                                        <IconLib name={iconName as any} size={20} color="#fff" />
                                    </View>
                                    <Text style={styles.gridLabel}>{item.MenuNameC}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Active Projects Section */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>Active Projects</Text>
                        {loadingProjects ? (
                            <ActivityIndicator size="small" color="#3B82F6" style={{ marginTop: 20 }} />
                        ) : (
                            <View style={styles.projectsList}>
                                {projects.map((project, index) => (
                                    <View key={index} style={styles.projectCard}>
                                        <View style={styles.projectHeader}>
                                            <MaterialCommunityIcons name="folder-outline" size={20} color="#3B82F6" />
                                            <Text style={styles.projectTitle}>
                                                {project.ProjectName || project.Name || 'Unnamed Project'}
                                            </Text>
                                        </View>
                                        <Text style={styles.projectId}>
                                            ID: {project.Id || project.ProjectId || 'N/A'}
                                        </Text>
                                    </View>
                                ))}
                                {projects.length === 0 && (
                                    <Text style={styles.noDataText}>No projects found.</Text>
                                )}
                            </View>
                        )}
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 15,
        backgroundColor: '#fff',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#0F172A',
    },
    logoContainer: {
        justifyContent: 'center',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    logoutButton: {
        flexDirection: 'row',
        paddingHorizontal: 12,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#FFF1F2',
        borderWidth: 1,
        borderColor: '#FECDD3',
        alignItems: 'center',
    },
    logoutText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#E11D48',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    welcomeSection: {
        marginVertical: 20,
    },
    welcomeText: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 8,
    },
    userName: {
        fontWeight: '700',
        color: '#d77a2f',
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#D1FAE5',
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 20,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: '#A7F3D0',
    },
    verifiedText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#065F46',
        marginLeft: 4,
        textTransform: 'uppercase',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
    },
    avatarCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    avatarText: {
        fontSize: 28,
        fontWeight: '700',
        color: '#334155',
    },
    profileName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 4,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
    },
    profileDetail: {
        fontSize: 14,
        color: '#64748B',
    },
    companyPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(215,122,47,0.14)',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(215,122,47,0.35)',
        marginBottom: 10,
    },
    companyText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#8a4b18',
    },
    liveStatus: {
        fontSize: 12,
        fontStyle: 'italic',
        color: '#94A3B8',
    },
    trackingCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    trackingIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(215,122,47,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
    },
    cardSub: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
    },
    toggleTrack: {
        width: 44,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        paddingHorizontal: 2,
    },
    toggleThumb: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#fff',
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    gridItem: {
        width: (width - 64) / 3, // 3 columns accounting for padding and gap
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    gridItemFull: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 12,
    },
    gridIconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    gridLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#0F172A',
        textAlign: 'center',
    },
    sectionContainer: {
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 12,
        color: '#0F172A',
    },
    projectsList: {},
    projectCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    projectHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    projectTitle: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '700',
        color: '#1E293B',
    },
    projectId: {
        fontSize: 12,
        color: '#64748B',
        marginLeft: 28,
    },
    noDataText: {
        textAlign: 'center',
        color: '#94A3B8',
        fontStyle: 'italic',
        marginTop: 10,
    }
});
