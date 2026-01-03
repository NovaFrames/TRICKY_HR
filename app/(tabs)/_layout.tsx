import { AnimatedTabBar } from '@/components/AnimatedTabBar';
import { useTheme } from '@/context/ThemeContext';
import { Tabs, usePathname } from 'expo-router';
import { View } from 'react-native';

export default function TabsLayout() {
    const pathname = usePathname();
    const hideTabs =
        pathname.startsWith('/employee') ||
        pathname.startsWith('/officer');

    // Header should also hide on these routes
    const hideHeader = hideTabs;

    const { theme, isDark } = useTheme();

    return (
        <View
            style={{
                flex: 1,
                backgroundColor: isDark ? theme.background : '#FFFFFF',
            }}
        >
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
