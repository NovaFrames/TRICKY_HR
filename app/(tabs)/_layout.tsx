import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function TabLayout() {
    const { theme, isDark } = useTheme();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: theme.background,
                    borderTopColor: theme.inputBorder,
                    height: Platform.OS === 'ios' ? 85 : 65,
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
                name="home"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color }) => <Feather name="home" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="attendance"
                options={{
                    title: 'Attendance',
                    tabBarIcon: ({ color }) => <Feather name="check-circle" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="leaves"
                options={{
                    title: 'Leaves',
                    tabBarIcon: ({ color }) => <Feather name="calendar" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color }) => <Feather name="user" size={24} color={color} />,
                }}
            />
        </Tabs>
    );
}
