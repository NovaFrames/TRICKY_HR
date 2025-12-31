import { AnimatedTabBar } from '@/components/AnimatedTabBar';
import { Tabs } from 'expo-router';

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{ headerShown: false }}
            tabBar={(props) => <AnimatedTabBar {...props} />}
        >
            <Tabs.Screen name="dashboard" />
            <Tabs.Screen name="home" />
            <Tabs.Screen name="settings" />
        </Tabs>
    );
}
