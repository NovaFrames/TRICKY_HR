import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function Header({ title }: { title: string }) {
    const { theme, isDark } = useTheme();
    const router = useRouter();

    return (
        <View style={[{ backgroundColor: theme.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Simple Minimal Header */}
            <View style={styles.headerContainer}>
                <View style={styles.navBar}>
                    <TouchableOpacity
                        onPress={() => router.back()}
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
        paddingTop: 10,
        paddingBottom: 4,
        zIndex: 1,
    },
    navBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8, // Tighter horizontal padding
        paddingVertical: 4,
    },
    navTitle: {
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: -0.3,
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
