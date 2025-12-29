import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface IdCardProps {
    empName: string;
    designation: string;
    empCode: string;
    company: string;
    initial: string;
    locationAddress: string | null;
    liveLocationEnabled: boolean;
    isDark: boolean;
    theme: any;
}

export const IdCard: React.FC<IdCardProps> = ({
    empName,
    designation,
    empCode,
    company,
    initial,
    locationAddress,
    liveLocationEnabled,
    isDark,
    theme
}) => {
    return (
        <View style={[styles.idCard, { shadowColor: theme.text }]}>
            <LinearGradient
                colors={isDark ? ['#1e293b', '#0f172a'] : ['#1E293B', '#0F172A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.idCardGradient}
            >
                <View style={styles.idCardTop}>
                    <View style={styles.avatarLarge}>
                        <Text style={styles.avatarLargeText}>{initial}</Text>
                    </View>
                    <View style={styles.idCardInfo}>
                        <Text style={styles.idName}>{empName}</Text>
                        <Text style={styles.idRole}>{designation}</Text>
                        <View style={styles.idBadgeRow}>
                            <View style={styles.idBadge}>
                                <Text style={styles.idBadgeText}>ID: {empCode}</Text>
                            </View>
                            <View style={[styles.idBadge, { backgroundColor: 'rgba(215,122,47,0.2)' }]}>
                                <Text style={[styles.idBadgeText, { color: '#FB923C' }]}>{company}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.idCardBottom}>
                    <View style={styles.locationContainer}>
                        <MaterialCommunityIcons name="map-marker" size={14} color="#94A3B8" />
                        <Text style={styles.locationText} numberOfLines={1}>
                            {locationAddress || 'Locating...'}
                        </Text>
                    </View>
                    <View style={styles.liveTag}>
                        <View style={[styles.liveDot, liveLocationEnabled ? { backgroundColor: '#10B981' } : { backgroundColor: '#EF4444' }]} />
                        <Text style={styles.liveText}>
                            {liveLocationEnabled ? 'Live' : 'Offline'}
                        </Text>
                    </View>
                </View>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    idCard: {
        borderRadius: 24,
        marginBottom: 24,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
    idCardGradient: {
        borderRadius: 24,
        padding: 24,
    },
    idCardTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    avatarLarge: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        marginRight: 16,
    },
    avatarLargeText: {
        fontSize: 28,
        fontWeight: '700',
        color: '#fff',
    },
    idCardInfo: {
        flex: 1,
    },
    idName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 4,
    },
    idRole: {
        fontSize: 14,
        color: '#94A3B8',
        marginBottom: 10,
    },
    idBadgeRow: {
        flexDirection: 'row',
        gap: 8,
    },
    idBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 8,
    },
    idBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#E2E8F0',
    },
    idCardBottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    locationText: {
        fontSize: 12,
        color: '#94A3B8',
        marginLeft: 6,
        paddingRight: 10,
    },
    liveTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    liveText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#fff',
        textTransform: 'uppercase',
    },
});
