// components/DashboardCards.tsx
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 64) / 2; // (Window - 48px parent padding - 16px gap) / 2

export default function DashboardCards() {
    const { theme, isDark, toggleTheme } = useTheme();
    const router = useRouter();
    return (
        <View style={styles.container}>

            {/* Check In / Out */}
            <TouchableOpacity style={[styles.card, styles.orange]}>
                <View style={styles.iconBox}>
                    <Feather name="check-square" size={22} color="#fff" />
                </View>
                <Text style={[styles.title, { color: theme.text }]}>Check In / Out</Text>
                <Text style={[styles.subtitle, { color: theme.text }]}>Tap to check in or out</Text>
            </TouchableOpacity>

            {/* Leave Request */}
            <TouchableOpacity style={[styles.card, { backgroundColor: theme.background }]} onPress={() => router.push('/leavemanagement')}>
                <View style={styles.iconBox}>
                    <Feather name="calendar" size={22} color="#2f855a" />
                </View>
                <Text style={[styles.title, { color: theme.text }]}>Leave Request</Text>
                <Text style={[styles.subtitle, { color: theme.text }]}>Apply for leave</Text>
            </TouchableOpacity>

            {/* Request Status */}
            <TouchableOpacity style={[styles.card, { backgroundColor: theme.background }]}>
                <View style={styles.iconBox}>
                    <MaterialCommunityIcons name="clipboard-text-outline" size={22} color="#4a5568" />
                </View>
                <Text style={[styles.title, { color: theme.text }]}>Request Status</Text>
                <Text style={[styles.subtitle, { color: theme.text }]}>View request progress</Text>
            </TouchableOpacity>

            {/* Time Sheet */}
            <TouchableOpacity style={[styles.card, { backgroundColor: theme.background }]}>
                <View style={styles.iconBox}>
                    <Feather name="clock" size={22} color="#ed8936" />
                </View>
                <Text style={[styles.title, { color: theme.text }]}>Time Sheet</Text>
                <Text style={[styles.subtitle, { color: theme.text }]}>Manage your time logs</Text>
            </TouchableOpacity>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 24,
    },

    card: {
        width: CARD_WIDTH,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        elevation: 3,
        shadowColor: '#aa9191ff',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },

    orange: {
        backgroundColor: '#f6ad55',
    },

    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: 'rgba(0,0,0,0.08)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },

    title: {
        fontSize: 14,
        fontWeight: '600',
    },

    subtitle: {
        fontSize: 12,
        marginTop: 4,
    },
});
