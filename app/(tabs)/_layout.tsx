import { useUser } from '@/context/UserContext';
import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

// Fallback menu items if API doesn't return any

// Fallback menu items if API doesn't return any
const STATIC_MENU_ITEMS = [
    { MenuNameC: 'Mobile Attendance', IconcolorC: '#10B981' },
    { MenuNameC: 'Profile', IconcolorC: '#0EA5E9' },
    { MenuNameC: 'Request Status', IconcolorC: '#10B981' },
    { MenuNameC: 'Leave Manage', IconcolorC: '#F59E0B' },
];

export default function TabLayout() {
    const { theme, isDark } = useTheme();

    const { user } = useUser();

    const loginData = user || {};

    // Dynamic Menu Items
    const menuItems = (Array.isArray(loginData.EmpMenu) && loginData.EmpMenu.length > 0)
        ? loginData.EmpMenu
        : STATIC_MENU_ITEMS;

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: theme.background,
                    borderTopColor: theme.inputBorder,
                    height: Platform.OS === 'ios' ? 85 : 75,
                    paddingBottom: Platform.OS === 'ios' ? 30 : 10,
                    paddingTop: 10,
                },
                tabBarActiveTintColor: theme.primary,
                tabBarInactiveTintColor: theme.placeholder,
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600',
                },
            }}
        >
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: 'Dashboard',
                    tabBarIcon: ({ color }) => <Feather name="bar-chart" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="home"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color }) => <Feather name="grid" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: 'Settings',
                    tabBarIcon: ({ color }) => <Feather name="settings" size={24} color={color} />,
                }}
            />

            {menuItems.map((item: any, index: number) => (
                <Tabs.Screen
                    key={index}
                    name={item.ActionC}
                    options={{
                        title: item.MenuNameC,
                        tabBarIcon: ({ color }) => <Feather name={item.IconC} size={24} color={color} />,
                        href: null,
                    }}
                />
            ))}

        </Tabs>
    );
}
