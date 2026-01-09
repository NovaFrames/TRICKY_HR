import { Ionicons } from '@expo/vector-icons';
import { Href, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const BACK_FALLBACKS: Record<string, Href> = {
    home: '/home',
    settings: '/settings',
    dashboard: '/dashboard',
    approvaldetails: '/officer/approvaldetails',
};

export default function Header({ title }: { title: string }) {
    const { theme, isDark } = useTheme();
    const router = useRouter();
    const { from } = useLocalSearchParams<{ from?: string }>();

    const handleBack = () => {
        if (typeof from === 'string' && BACK_FALLBACKS[from]) {
            router.replace(BACK_FALLBACKS[from]);
            return;
        }

        router.back();
    };

    return (
        <View style={[{ backgroundColor: theme.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Simple Minimal Header */}
            <View style={styles.headerContainer}>
                <View style={styles.navBar}>
                    <TouchableOpacity
                        onPress={handleBack}
                        style={styles.iconButton}
                    >
                        <Ionicons name="arrow-back" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={[styles.navTitle, { color: theme.text }]}>{title}</Text>
                    <View style={styles.headerRight} />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    headerContainer: {
        paddingTop: 8,
        paddingBottom: 2,
        zIndex: 1,
    },
    navBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8, // Tighter horizontal padding
        paddingVertical: 2,
    },
    navTitle: {
        fontSize: 19,
        fontWeight: '700',
        letterSpacing: -0.5,
    },
    iconButton: {
        padding: 4,
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerRight: {
        width: 36,
    },
});
