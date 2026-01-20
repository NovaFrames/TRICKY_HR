import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface TrackingCardProps {
    liveLocationEnabled: boolean;
    theme: any;
}

export const TrackingCard: React.FC<TrackingCardProps> = ({
    liveLocationEnabled,
    theme
}) => {
    return (
        <View style={[styles.trackingCard, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, shadowColor: theme.text }]}>
            <View style={styles.trackingInfo}>
                <View style={[styles.trackingIcon, { backgroundColor: theme.primary }]}>
                    <Feather name="navigation" size={20} color="#fff" />
                </View>
                <View>
                    <Text style={[styles.trackingTitle, { color: theme.text }]}>Live Tracking</Text>
                    <Text style={[styles.trackingSub, { color: theme.placeholder }]}>Monitor your location</Text>
                </View>
            </View>
            <View style={[styles.toggleTrack, liveLocationEnabled ? { backgroundColor: '#10B98120' } : { backgroundColor: theme.background }]}>
                <View style={[styles.toggleThumb, liveLocationEnabled ? { backgroundColor: '#10B981', transform: [{ translateX: 20 }] } : { backgroundColor: theme.placeholder }]} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    trackingCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: 4,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 2,
    },
    trackingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    trackingIcon: {
        width: 40,
        height: 40,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    trackingTitle: {
        fontSize: 15,
        fontWeight: '700',
    },
    trackingSub: {
        fontSize: 12,
    },
    toggleTrack: {
        width: 48,
        height: 28,
        borderRadius: 4,
        padding: 2,
        justifyContent: 'center',
    },
    toggleThumb: {
        width: 24,
        height: 24,
        borderRadius: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
});
