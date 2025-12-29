import { useUser } from '@/context/UserContext';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DashboardHeader } from '../../components/dashboard/DashboardHeader';
import { useTheme } from '../../context/ThemeContext';

export default function ProfileScreen() {
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
                <Text style={[styles.text, { color: theme.text }]}>Profile Screen</Text>
                <Text style={[styles.subText, { color: theme.placeholder }]}>
                    {user?.EmpName || user?.Name || 'User'}
                </Text>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
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
        gap: 20,
    },
    text: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    subText: {
        fontSize: 16,
    },
    logoutButton: {
        paddingVertical: 12,
        paddingHorizontal: 30,
        backgroundColor: '#EF4444',
        borderRadius: 12,
    },
    logoutText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    }
});
