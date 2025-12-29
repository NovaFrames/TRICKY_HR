import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface DashboardHeaderProps {
    empName: string;
    initial: string;
    isDark: boolean;
    theme: any;
    toggleTheme: () => void;
    handleLogout: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
    empName,
    initial,
    isDark,
    theme,
    toggleTheme,
    handleLogout
}) => {
    return (
        <LinearGradient
            colors={isDark ? [theme.background, theme.inputBg] : ['#fff', '#f3f4f6']}
            style={[styles.headerBackground, { shadowColor: theme.text }]}
        >
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <View>
                        <Text style={[styles.greeting, { color: theme.placeholder }]}>Welcome Back,</Text>
                        <Text style={[styles.headerTitle, { color: theme.text }]}>{empName.split(' ')[0]}</Text>
                    </View>
                    <View style={styles.headerRight}>
                        {/* Theme Toggle Button */}
                        <TouchableOpacity onPress={toggleTheme} style={[styles.iconButton, { backgroundColor: theme.inputBg }]}>
                            <Feather name={isDark ? "sun" : "moon"} size={24} color={isDark ? "#fff" : theme.text} />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.iconButton, { backgroundColor: theme.inputBg }]}>
                            <Feather name="bell" size={22} color={theme.text} />
                            <View style={styles.notificationDot} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.profileButton}>
                            <View style={[styles.headerAvatar, { backgroundColor: theme.primary }]}>
                                <Text style={styles.headerAvatarText}>{initial}</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    headerBackground: {
        paddingBottom: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 5,
        zIndex: 10,
    },
    safeArea: {
        marginBottom: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 10,
    },
    greeting: {
        fontSize: 14,
        fontWeight: '500',
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationDot: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#EF4444',
        borderWidth: 1.5,
        borderColor: '#F1F5F9',
    },
    profileButton: {
        // Shadow handled by headerAvatar
    },
    headerAvatar: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerAvatarText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 18,
    },
});
