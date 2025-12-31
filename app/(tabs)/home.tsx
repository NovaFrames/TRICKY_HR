import { useUser } from '@/context/UserContext';
import { Feather, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    View
} from 'react-native';
import { MenuGrid } from '../../components/dashboard/MenuGrid';
import { useTheme } from '../../context/ThemeContext';

// Fallback menu items if API doesn't return any
const STATIC_MENU_ITEMS = [
    { MenuNameC: 'Mobile Attendance', IconcolorC: '#10B981' },
    { MenuNameC: 'Profile', IconcolorC: '#0EA5E9' },
    { MenuNameC: 'Request Status', IconcolorC: '#10B981' },
    { MenuNameC: 'Leave Manage', IconcolorC: '#F59E0B' },
];

export default function HomeScreen() {
    const { theme } = useTheme();
    const { user } = useUser();

    const loginData = user || {};

    // Critical: Token extraction
    const token = loginData.Token || loginData.TokenC;

    console.log('Extracted Token for Projects:', token);

    // Dynamic Menu Items
    const menuItems = (Array.isArray(loginData.EmpMenu) && loginData.EmpMenu.length > 0)
        ? loginData.EmpMenu
        : STATIC_MENU_ITEMS;

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

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                style={styles.scrollView}
            >
                <MenuGrid
                    menuItems={menuItems}
                    theme={theme}
                    getMenuIcon={getMenuIcon}
                    type='home'
                />

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingBottom: 40,
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
