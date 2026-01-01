import { useUser } from '@/context/UserContext';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';

/* -------------------- FALLBACK MENU -------------------- */
const STATIC_MENU_ITEMS = [
    { MenuNameC: 'Mobile Attendance', IconcolorC: '#10B981', ActionC: 'employee/Attendance', IconC: 'fa fa-th-large' },
    { MenuNameC: 'Profile', IconcolorC: '#0EA5E9', ActionC: 'employee/profileupdate', IconC: 'fa fa-user' },
    { MenuNameC: 'Request Status', IconcolorC: '#10B981', ActionC: 'employee/empRequest', IconC: 'fa fa-bar-chart' },
    { MenuNameC: 'Leave Manage', IconcolorC: '#F59E0B', ActionC: 'employee/leavemanage', IconC: 'fa fa-plane' },
];

/* -------------------- DASHBOARD ALLOWED ACTIONS -------------------- */
const DASHBOARD_MENU_ACTIONS = [
    'employee/Attendance',
    'employee/leavemanage',
    'employee/empRequest',
    'employee/timemanage',
];

/* -------------------- LAYOUT -------------------- */
const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 64) / 2;

/* -------------------- ICON PARSER -------------------- */
const getFontAwesomeIcon = (
    iconClass?: string
): keyof typeof FontAwesome.glyphMap => {
    if (!iconClass) return 'question-circle';

    return iconClass
        .replace('fa ', '')
        .replace('fa-', '') as keyof typeof FontAwesome.glyphMap;
};

export default function DashboardCards() {
    const { theme } = useTheme();
    const { user } = useUser();

    const loginData = user || {};

    const menuItems =
        Array.isArray(loginData.EmpMenu) && loginData.EmpMenu.length > 0
            ? loginData.EmpMenu
            : STATIC_MENU_ITEMS;

    const filteredMenuItems = menuItems.filter((item: any) =>
        DASHBOARD_MENU_ACTIONS.includes(item.ActionC)
    );

    return (
        <View style={styles.container}>
            {filteredMenuItems.map((item: any, index: number) => (
                <TouchableOpacity
                    key={index}
                    style={[
                        styles.card,
                        {
                            backgroundColor: theme.cardBackground,
                            borderColor: theme.inputBorder,
                            borderWidth: 1,
                        },
                    ]}
                    activeOpacity={0.7}
                    onPress={() => router.push({ pathname: item.ActionC, params: { from: 'dashboard' } })}
                >
                    <View style={[styles.iconBox, { backgroundColor: theme.primary + '15' }]}>
                        <FontAwesome
                            name={getFontAwesomeIcon(item.IconC)}
                            size={20}
                            color={theme.primary}
                        />

                    </View>

                    <Text style={[styles.title, { color: theme.text }]}>
                        {item.MenuNameC}
                    </Text>

                    <Text style={[styles.subtitle, { color: theme.placeholder }]}>
                        Access your {item.MenuNameC.toLowerCase()}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
}

/* -------------------- STYLES -------------------- */
const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 24,
    },

    card: {
        width: CARD_WIDTH,
        borderRadius: 24,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000', // Neutral shadow
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },

    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },

    title: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },

    subtitle: {
        fontSize: 12,
        fontWeight: '500',
    },
});
