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

            {/* Modern Header - Matching Leave Management */}
            <View style={[styles.headerContainer, { backgroundColor: theme.primary }]}>
                <View style={styles.navBar}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.iconButton}
                    >
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.navTitle}>{title}</Text>
                    <View style={styles.headerRight} />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({

    headerContainer: {
        paddingTop: 30,
        paddingBottom: 15,
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        zIndex: 1,
    },
    navBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    navTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    iconButton: {
        padding: 8,
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerRight: {
        width: 40,
    },
});
