import { useUser } from '@/context/UserContext';
import { Feather } from '@expo/vector-icons';
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
                initial={initial}
                isDark={isDark}
                theme={theme}
                toggleTheme={toggleTheme}
            />
            <View style={styles.content}>
                <Text style={[styles.text, { color: theme.text }]}>Settings Screen</Text>
                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.button} onPress={handleLogout}>
                        <Text style={[styles.buttonText]}>Logout</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={toggleTheme} style={[styles.iconButton, { backgroundColor: theme.inputBg }]}>
                        <Feather name={isDark ? "sun" : "moon"} size={24} color={isDark ? theme.textLight : theme.text} />
                    </TouchableOpacity>
                </View>
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
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    button: {
        backgroundColor: '#f81100ff',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
