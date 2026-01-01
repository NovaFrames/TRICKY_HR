import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Image, LayoutAnimation, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useUser } from '@/context/UserContext';
import { useProfileImage } from '@/hooks/useCompanyLogo';
import { ThemeType } from '../../theme/theme';

interface IdCardProps {
    empName: string;
    designation: string;
    empCode: string;
    company: string;
    initial: string;
    theme: ThemeType;
}

export const IdCard: React.FC<IdCardProps> = ({
    empName,
    designation,
    empCode,
    company,
    initial,
    theme,
}) => {
    const [isTracking, setIsTracking] = React.useState(true);

    const toggleTracking = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsTracking(!isTracking);
    };

    const { user } = useUser();

    const [logoError, setLogoError] = React.useState(false);

    const logoUrl = useProfileImage(user?.CustomerIdC, user?.CompIdN, user?.EmpIdN);

    return (
        <View style={[styles.idCard, { shadowColor: theme.text, backgroundColor: theme.cardBackground }]}>
            <View style={styles.idCardGradient}>
                <View style={styles.idCardTop}>
                    <View style={[styles.avatarLarge]}>
                        <Image
                            source={
                                !logoError && logoUrl
                                    ? { uri: logoUrl }
                                    : require('@/assets/images/trickyhr.png')
                            }
                            onError={() => setLogoError(true)}
                            style={styles.avatarImage}
                        />
                    </View>
                    <View style={styles.idCardInfo}>
                        <Text style={[styles.idName, { color: theme.text }]}>{empName}</Text>
                        <Text style={[styles.idRole, { color: theme.text }]}>{designation} • ID {empCode}</Text>
                        <View style={{ marginTop: 8 }}>
                            <View style={[styles.idBadge, { backgroundColor: '#FFEDD5' }]}>
                                <Text style={[styles.idBadgeText, { color: '#C2410C' }]}>{company} - DEMO</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={[styles.idCardBottom, { borderTopColor: theme.inputBorder }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: isTracking ? '#76630fff' : '#8b7564ff', justifyContent: 'center', alignItems: 'center' }}>
                            <Feather name={isTracking ? "map-pin" : "map-pin"} size={14} color="#fff" />
                        </View>
                        <View>
                            <Text style={[styles.trackingTitle, { color: theme.text, fontSize: 14 }]}>
                                Live Tracking: <Text style={{ color: isTracking ? '#059669' : '#64748B' }}>{isTracking ? 'ON' : 'OFF'}</Text>
                            </Text>
                            <Text style={[styles.trackingSub, { color: theme.text, fontSize: 11 }]}>
                                {isTracking ? 'Your location is shared during work hours' : 'Location sharing is paused'}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={toggleTracking}
                        style={[
                            styles.toggleTrack,
                            {
                                backgroundColor: isTracking ? 'rgba(250, 225, 209, 1)' : '#f0e8e2ff',
                                alignItems: isTracking ? 'flex-end' : 'flex-start'
                            }
                        ]}
                    >
                        <View style={[styles.toggleThumb, { backgroundColor: isTracking ? '#e46a23' : '#b8ab94ff' }]} />
                    </TouchableOpacity>
                </View>
            </View>
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
        width: 80,
        height: 80,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        marginRight: 16,
        overflow: 'hidden', // 🔑 important
    },

    avatarImage: {
        width: 80,
        height: 80,
        borderRadius: 20,
        resizeMode: 'cover',
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
        alignSelf: 'flex-start',
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
        borderRadius: 14,
        padding: 2,
        justifyContent: 'center',
    },
    toggleThumb: {
        width: 24,
        height: 24,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
});
