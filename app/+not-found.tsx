import Header from '@/components/Header';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useTheme } from '@/context/ThemeContext';

export default function NotFoundScreen() {
    const { theme } = useTheme();
    const router = useRouter();

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <Header title="Oops!" />
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <Text style={[styles.title, { color: theme.text }]}>This screen in Progress.</Text>

                <TouchableOpacity onPress={() => router.back()} style={styles.link}>
                    <Text style={[styles.linkText, { color: theme.primary }]}>Go Back</Text>
                </TouchableOpacity>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    link: {
        marginTop: 15,
        paddingVertical: 15,
    },
    linkText: {
        fontSize: 14,
        color: '#2e78b7',
    },
});
