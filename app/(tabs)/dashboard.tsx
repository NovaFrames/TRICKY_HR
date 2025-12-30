import DashboardCards from '@/components/dashboard/DashboardCards';
import { useUser } from '@/context/UserContext';
import { Feather, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { DashboardHeader } from '../../components/dashboard/DashboardHeader';
import { IdCard } from '../../components/dashboard/IdCard';
import { useTheme } from '../../context/ThemeContext';

// Fallback menu items if API doesn't return any
const STATIC_MENU_ITEMS = [
    { MenuNameC: 'Mobile Attendance', IconcolorC: '#10B981' },
    { MenuNameC: 'Profile', IconcolorC: '#0EA5E9' },
    { MenuNameC: 'Request Status', IconcolorC: '#10B981' },
    { MenuNameC: 'Leave Manage', IconcolorC: '#F59E0B' },
];

export default function HomeScreen() {
    const { theme, isDark, toggleTheme } = useTheme();
    const { user } = useUser();

    const [locationAddress, setLocationAddress] = useState<string | null>(null);

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
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <DashboardHeader
                empName={empName}
                initial={initial}
                isDark={isDark}
                theme={theme}
                toggleTheme={toggleTheme}
            />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                style={styles.scrollView}
            >

                <IdCard
                    empName={empName}
                    designation={designation}
                    empCode={empCode}
                    company={company}
                    initial={initial}
                    locationAddress={locationAddress}
                    liveLocationEnabled={liveLocationEnabled}
                    isDark={isDark}
                    theme={theme}
                />

                <Text style={[styles.sectionHeader, { color: theme.text }]}>Quick Actions</Text>

                <DashboardCards />

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: 24,
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
    },
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
