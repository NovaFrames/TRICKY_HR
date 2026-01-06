import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface RequestStatusItemProps {
    item: any;
    onPress?: () => void;
}

const RequestStatusItem: React.FC<RequestStatusItemProps> = ({ item, onPress }) => {
    const { theme, isDark } = useTheme();

    // Helper to format ASP.NET JSON Date /Date(1234567890)/
    const formatDate = (dateString: string) => {
        try {
            if (!dateString) return '';

            let date: Date;

            // Handle ASP.NET format
            if (typeof dateString === 'string' && dateString.includes('/Date(')) {
                const timestamp = parseInt(
                    dateString.replace(/\/Date\((-?\d+)\)\//, '$1'),
                    10
                );
                date = new Date(timestamp);
            } else {
                // Fallback for standard date strings
                date = new Date(dateString);
            }

            if (isNaN(date.getTime())) return dateString;

            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

            const d = date.getDate();
            const m = months[date.getMonth()];
            const y = date.getFullYear();

            let hours = date.getHours();
            const minutes = date.getMinutes().toString().padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';

            hours = hours % 12 || 12;

            return `${m} ${d}, ${y}, ${hours}:${minutes} ${ampm}`;
        } catch {
            return dateString;
        }
    };

    // Determine status color and icon
    const getStatusInfo = (status: string) => {
        const s = status?.toLowerCase() || '';
        if (s.includes('wait') || s.includes('pend')) {
            return {
                bg: '#FEF3C7',
                color: '#D97706',
                icon: 'time-outline' as const,
                label: 'Waiting'
            };
        } else if (s.includes('approv')) {
            return {
                bg: '#DCFCE7',
                color: '#16A34A',
                icon: 'checkmark-circle-outline' as const,
                label: 'Approved'
            };
        } else if (s.includes('reject')) {
            return {
                bg: '#FEE2E2',
                color: '#DC2626',
                icon: 'close-circle-outline' as const,
                label: 'Rejected'
            };
        }
        return {
            bg: theme.inputBg,
            color: theme.icon,
            icon: 'help-circle-outline' as const,
            label: status
        };
    };

    const rawStatus = item.StatusC || item.StatusResult || item.Status || 'Waiting';
    const statusInfo = getStatusInfo(rawStatus.trim());

    const requestDate = item.applyDateD || item.RequestDate || item.CreatedDate;
    const description = item.DescC || item.LeaveName || item.Description || 'General Request';

    return (
        <TouchableOpacity
            style={[
                styles.card,
                {
                    backgroundColor: theme.cardBackground,
                    borderColor: theme.inputBorder,
                    shadowColor: isDark ? '#000' : '#E2E8F0',
                }
            ]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: theme.primary + '10' }]}>
                    <Ionicons name="document-text" size={20} color={theme.primary} />
                </View>

                <View style={styles.headerTextContainer}>
                    <Text style={[styles.title, { color: theme.text }]}>{description}</Text>
                    <Text style={[styles.date, { color: theme.placeholder }]}>
                        Requested on {formatDate(requestDate)}
                    </Text>
                </View>

                <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
                    <Ionicons name={statusInfo.icon} size={14} color={statusInfo.color} />
                    <Text style={[styles.statusLabel, { color: statusInfo.color }]}>
                        {statusInfo.label}
                    </Text>
                </View>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.inputBorder }]} />

            <View style={styles.cardFooter}>
                <View style={styles.footerDetail}>
                    <Ionicons name="finger-print-outline" size={14} color={theme.placeholder} />
                    <Text style={[styles.footerText, { color: theme.placeholder }]}>
                        Ref: {item.IdN || 'N/A'}
                    </Text>
                </View>

                <View style={styles.actionPrompt}>
                    <Text style={[styles.actionText, { color: theme.primary }]}>View Details</Text>
                    <Ionicons name="chevron-forward" size={14} color={theme.primary} />
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        marginHorizontal: 20,
        marginVertical: 8,
        borderRadius: 4,
        padding: 16,
        borderWidth: 1,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    headerTextContainer: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 2,
        letterSpacing: -0.3,
    },
    date: {
        fontSize: 12,
        fontWeight: '500',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 4,
        gap: 4,
    },
    statusLabel: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    divider: {
        height: 1,
        marginVertical: 14,
        opacity: 0.5,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footerDetail: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    footerText: {
        fontSize: 12,
        fontWeight: '500',
    },
    actionPrompt: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    actionText: {
        fontSize: 12,
        fontWeight: '700',
    },
});

export default RequestStatusItem;
