import { useUser } from '@/context/UserContext';
import { FontAwesome } from '@expo/vector-icons';
import { Href, router } from 'expo-router';
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

    /* -------------------- NAVIGATION -------------------- */
    const goToAction = (action: string) => {
        router.push(`/${action}` as Href);
    };

    return (
        <View style={styles.container}>
            {filteredMenuItems.map((item: any, index: number) => (
                <TouchableOpacity
                    key={index}
                    style={[
                        styles.card,
                        {
                            backgroundColor: theme.backgroundCard,
                        },
                    ]}
                    activeOpacity={0.8}
                    onPress={() => goToAction(item.ActionC)}
                >
                    <View style={styles.iconBox}>
                        <FontAwesome
                            name={getFontAwesomeIcon(item.IconC)}
                            size={22}
                            color={item.IconcolorC || theme.text}
                        />

                    </View>

                    <Text style={[styles.title, { color: theme.text }]}>
                        {item.MenuNameC}
                    </Text>

                    <Text style={[styles.subtitle, { color: theme.placeholder }]}>
                        {item.MenuNameC}
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
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        elevation: 3,
    },

    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: 'rgba(0,0,0,0.08)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },

    title: {
        fontSize: 14,
        fontWeight: '600',
    },

    subtitle: {
        fontSize: 12,
        marginTop: 4,
    },
});
