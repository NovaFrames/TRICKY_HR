import { useUser } from '@/context/UserContext';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DashboardHeader } from '../../components/dashboard/DashboardHeader';
import { useTheme } from '../../context/ThemeContext';

export default function SettingsScreen() {
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
            />
            <View style={styles.content}>
                <Text style={[styles.text, { color: theme.text }]}>Settings Screen</Text>
                <TouchableOpacity style={styles.button} onPress={handleLogout}>
                    <Text style={[styles.buttonText]}>Logout</Text>
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
    },
    text: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    button: {
        backgroundColor: '#f81100ff',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 24,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
