import { useUser } from '@/context/UserContext';
import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';

// Fallback menu items if API doesn't return any
const STATIC_MENU_ITEMS = [
    { MenuNameC: 'Mobile Attendance', IconcolorC: '#10B981' },
    { MenuNameC: 'Profile', IconcolorC: '#0EA5E9' },
    { MenuNameC: 'Request Status', IconcolorC: '#10B981' },
    { MenuNameC: 'Leave Manage', IconcolorC: '#F59E0B' },
];

const AnimatedTabIcon = ({ name, color, focused }: { name: any, color: string, focused: boolean }) => {
    const scale = useSharedValue(0);
    const iconTranslateY = useSharedValue(0);

    useEffect(() => {
        scale.value = withSpring(focused ? 1 : 0, {
            damping: 15,
            stiffness: 150,
        });
        iconTranslateY.value = withSpring(focused ? -4 : 0, {
            damping: 15,
            stiffness: 150,
        });
    }, [focused]);

    const bgStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: Math.max(scale.value, 0.01) }],
            opacity: scale.value,
        };
    });

    const iconStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: iconTranslateY.value }],
        };
    });

    return (
        <View style={{ alignItems: 'center', justifyContent: 'center', width: 50, height: 50 }}>
            <Animated.View
                style={[
                    bgStyle,
                    {
                        position: 'absolute',
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                    },
                ]}
            />
            <Animated.View style={iconStyle}>
                <Feather name={name} size={26} color={color} />
            </Animated.View>
        </View>
    );
};

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
                    backgroundColor: theme.backgroundCard,
                    borderTopColor: theme.inputBorder,
                    height: Platform.OS === 'ios' ? 85 : 75,
                    paddingBottom: Platform.OS === 'ios' ? 30 : 10,
                    paddingTop: 10,
                    elevation: 0,
                    shadowOpacity: 0,
                },
                tabBarActiveTintColor: theme.primary,
                tabBarInactiveTintColor: theme.placeholder,
                tabBarShowLabel: false,
            }}
        >
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: 'Dashboard',
                    tabBarIcon: ({ color, focused }) => (
                        <AnimatedTabIcon name="bar-chart" color={color} focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="home"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, focused }) => (
                        <AnimatedTabIcon name="grid" color={color} focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: 'Settings',
                    tabBarIcon: ({ color, focused }) => (
                        <AnimatedTabIcon name="settings" color={color} focused={focused} />
                    ),
                }}
            />

            {menuItems.map((item: any, index: number) => (
                <Tabs.Screen
                    key={index}
                    name={item.ActionC}
                    options={{
                        title: item.MenuNameC,
                        tabBarIcon: ({ color, focused }) => (
                            <AnimatedTabIcon name={item.IconC || 'circle'} color={color} focused={focused} />
                        ),
                        href: null,
                    }}
                />
            ))}

        </Tabs>
    );
}
