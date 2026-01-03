import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface AttendanceShift {
    EmpCodeC: string;
    EmpNameC: string;
    ShiftInN: number;
    ShiftOutN: number;
    ShiftCodeC: string;
    ReaCodeC?: string;
}

interface AttendanceOther {
    EmpNameC: string;
    EmpCodeC: string;
    ActN: number;
    NRMN: number;
    LateN: number;
    UnderN: number;
    TInN: number;
    TOutN: number;
}

interface AttendanceCardProps {
    item: AttendanceShift | AttendanceOther;
    index: number;
    theme: any;
    type: 'SHIFT' | 'OTHERS';
}

const AttendanceCard: React.FC<AttendanceCardProps> = ({ item, index, theme, type }) => {
    const formatNumber = (value: any, decimals = 2) => {
        if (value === null || value === undefined) return '-';
        return Number(value).toFixed(decimals);
    };

    const isShift = (data: any): data is AttendanceShift => type === 'SHIFT';

    if (isShift(item)) {
        return (
            <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
                <View style={styles.header}>
                    <View style={styles.empInfo}>
                        <View style={[styles.iconContainer, { backgroundColor: theme.primary + '20' }]}>
                            <Ionicons name="person" size={20} color={theme.primary} />
                        </View>
                        <View>
                            <Text style={[styles.empName, { color: theme.text }]}>{item.EmpNameC}</Text>
                            <Text style={[styles.empCode, { color: theme.textLight }]}>{item.EmpCodeC}</Text>
                        </View>
                    </View>
                    <View style={[styles.badge, { backgroundColor: theme.primary + '15' }]}>
                        <Text style={[styles.badgeText, { color: theme.primary }]}>{item.ShiftCodeC}</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={[styles.statLabel, { color: theme.textLight }]}>Shift In</Text>
                        <View style={styles.statValueContainer}>
                            <Ionicons name="log-in-outline" size={16} color="#10B981" />
                            <Text style={[styles.statValue, { color: '#10B981' }]}>{formatNumber(item.ShiftInN)}</Text>
                        </View>
                    </View>

                    <View style={styles.statItem}>
                        <Text style={[styles.statLabel, { color: theme.textLight }]}>Shift Out</Text>
                        <View style={styles.statValueContainer}>
                            <Ionicons name="log-out-outline" size={16} color="#EF4444" />
                            <Text style={[styles.statValue, { color: '#EF4444' }]}>{formatNumber(item.ShiftOutN)}</Text>
                        </View>
                    </View>

                    <View style={styles.statItem}>
                        <Text style={[styles.statLabel, { color: theme.textLight }]}>Reason</Text>
                        <View style={styles.statValueContainer}>
                            <Text style={[styles.statValue, { color: '#EF4444' }]}>{item.ReaCodeC}</Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    }

    // OTHERS view
    const otherItem = item as AttendanceOther;
    return (
        <View style={[styles.card, { backgroundColor: theme.cardBackground, borderLeftColor: theme.primary }]}>
            <View style={styles.header}>
                <View style={styles.empInfo}>
                    <View style={[styles.iconContainer, { backgroundColor: theme.primary + '20' }]}>
                        <Ionicons name="person" size={20} color={theme.primary} />
                    </View>
                    <View>
                        <Text style={[styles.empName, { color: theme.text }]}>{otherItem.EmpNameC}</Text>
                        <Text style={[styles.empCode, { color: theme.textLight }]}>{otherItem.EmpCodeC}</Text>
                    </View>
                </View>
                <View style={[styles.badge, { backgroundColor: theme.primary + '15' }]}>
                    <Text style={[styles.badgeText, { color: theme.primary }]}>Act: {formatNumber(otherItem.ActN)}</Text>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.statsRow}>
                <View style={styles.statItem}>
                    <Text style={[styles.statLabel, { color: theme.textLight }]}>NRM</Text>
                    <Text style={[styles.statValue, { color: theme.text }]}>{formatNumber(otherItem.NRMN)}</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={[styles.statLabel, { color: theme.textLight }]}>Late</Text>
                    <Text style={[styles.statValue, { color: '#EF4444' }]}>{formatNumber(otherItem.LateN)}</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={[styles.statLabel, { color: theme.textLight }]}>Under</Text>
                    <Text style={[styles.statValue, { color: '#F59E0B' }]}>{formatNumber(otherItem.UnderN)}</Text>
                </View>
            </View>

            <View style={[styles.statsRow, { marginTop: 12 }]}>
                <View style={styles.statItem}>
                    <Text style={[styles.statLabel, { color: theme.textLight }]}>Time In</Text>
                    <View style={styles.statValueContainer}>
                        <Ionicons name="time-outline" size={16} color="#10B981" />
                        <Text style={[styles.statValue, { color: '#10B981' }]}>{formatNumber(otherItem.TInN)}</Text>
                    </View>
                </View>
                <View style={styles.statItem}>
                    <Text style={[styles.statLabel, { color: theme.textLight }]}>Time Out</Text>
                    <View style={styles.statValueContainer}>
                        <Ionicons name="time-outline" size={16} color="#EF4444" />
                        <Text style={[styles.statValue, { color: '#EF4444' }]}>{formatNumber(otherItem.TOutN)}</Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    empInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    empName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    empCode: {
        fontSize: 12,
        marginTop: 2,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.05)',
        marginVertical: 12,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statItem: {
        flex: 1,
    },
    statLabel: {
        fontSize: 11,
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    statValueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statValue: {
        fontSize: 14,
        fontWeight: '600',
    },
});

export default AttendanceCard;
