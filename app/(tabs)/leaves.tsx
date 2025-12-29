import { useUser } from '@/context/UserContext';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DashboardHeader } from '../../components/dashboard/DashboardHeader';
import { useTheme } from '../../context/ThemeContext';

export default function LeavesScreen() {
    const { theme, isDark, toggleTheme } = useTheme();
    const { user, logout } = useUser();
    const router = useRouter();

    const loginData = user || {};
    const empName = loginData.EmpNameC || loginData.EmpName || loginData.Name || '-';
    const initial = empName.charAt(0);

    const handleLogout = async () => {
        await logout();
        router.replace('/');
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <DashboardHeader
                empName={empName}
                initial={initial}
                isDark={isDark}
                theme={theme}
                toggleTheme={toggleTheme}
                handleLogout={handleLogout}
            />
            <View style={styles.content}>
                <Text style={[styles.text, { color: theme.text }]}>Leaves Screen</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        fontSize: 20,
        fontWeight: 'bold',
    },
});
