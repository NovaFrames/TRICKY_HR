import { AnimatedTabBar } from '@/components/AnimatedTabBar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { useTheme } from '@/context/ThemeContext';
import { Tabs, usePathname } from 'expo-router';
import { View } from 'react-native';

const TAB_BAR_HEIGHT = 70;

export default function TabsLayout() {
    const pathname = usePathname();
    const hideTabs =
        pathname.startsWith('/employee') ||
        pathname.startsWith('/officer');

    const { theme, isDark } = useTheme();

    return (
        <View
            style={{
                flex: 1,
                backgroundColor: isDark
                    ? theme.background
                    : '#f3f4f6', // 👈 MUST match header bottom color
            }}
        >
            <DashboardHeader
                isDark={isDark}
                theme={theme}
            />

            <Tabs
                screenOptions={{
                    headerShown: false,
                }}
                tabBar={(props) =>
                    hideTabs ? null : <AnimatedTabBar {...props} />
                }
            >
                <Tabs.Screen name="dashboard" />
                <Tabs.Screen name="home" />
                <Tabs.Screen name="settings" />
            </Tabs>
        </View>
    );
}
