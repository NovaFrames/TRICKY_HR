import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface RequestStatusItemProps {
    item: any;
    onPress?: () => void;
}

const RequestStatusItem: React.FC<RequestStatusItemProps> = ({ item, onPress }) => {
    const { theme } = useTheme();

    // Helper to format ASP.NET JSON Date /Date(1234567890)/
    const formatDate = (dateString: string) => {
        try {
            if (!dateString) return '';

            // Handle ASP.NET format
            if (typeof dateString === 'string' && dateString.includes('/Date(')) {
                const timestamp = parseInt(dateString.replace(/\/Date\((-?\d+)\)\//, '$1'));
                const date = new Date(timestamp);

                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const d = date.getDate();
                const m = months[date.getMonth()];
                const y = date.getFullYear();
                const h = date.getHours().toString().padStart(2, '0');
                const min = date.getMinutes().toString().padStart(2, '0');
                const s = date.getSeconds().toString().padStart(2, '0');

                return `${m} ${d} ${y} ${h}:${min}:${s}`;
            }

            // Fallback for standard date strings
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;

            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const d = date.getDate();
            const m = months[date.getMonth()];
            const y = date.getFullYear();
            const h = date.getHours().toString().padStart(2, '0');
            const min = date.getMinutes().toString().padStart(2, '0');
            const s = date.getSeconds().toString().padStart(2, '0');

            return `${m} ${d} ${y} ${h}:${min}:${s}`;
        } catch (e) {
            return dateString;
        }
    };

    // Determine status color and icon
    const getStatusInfo = (status: string) => {
        const s = status?.toLowerCase() || '';
        if (s.includes('wait') || s.includes('pend')) {
            return { color: '#FFC107', icon: 'alert-circle', label: 'Waiting' };
        } else if (s.includes('approv')) {
            return { color: '#4CAF50', icon: 'checkmark-circle', label: 'Approved' };
        } else if (s.includes('reject')) {
            return { color: '#F44336', icon: 'close-circle', label: 'Rejected' };
        }
        return { color: theme.icon, icon: 'help-circle', label: status };
    };

    // Mappings based on user response
    const rawStatus = item.StatusC || item.StatusResult || item.Status || 'Waiting';
    const statusInfo = getStatusInfo(rawStatus.trim());

    const requestDate = item.applyDateD || item.RequestDate || item.CreatedDate;
    const description = item.DescC || item.LeaveName || item.Description || 'LEAVE';
    const rangeDescription = item.LvDescC || '';

    // Styles Refs
    const containerStyle = [styles.container, { backgroundColor: theme.cardBackground, borderBottomColor: theme.inputBorder }];
    const headerStyle = [styles.header, { backgroundColor: theme.inputBg }];
    const textMainStyle = { color: theme.text };
    const textSubStyle = { color: theme.placeholder };

    return (
        <TouchableOpacity style={containerStyle} onPress={onPress}>
            <View style={headerStyle}>
                <Text style={[styles.headerLabel, textMainStyle]}>Request Date</Text>
                <Text style={[styles.headerDate, textMainStyle]}>{formatDate(requestDate)}</Text>
            </View>
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <View style={[styles.circleIcon, { backgroundColor: theme.primary }]}>
                        <Ionicons name="create-outline" size={24} color="#FFF" />
                    </View>
                </View>
                <View style={styles.detailsContainer}>
                    <Text style={[styles.description, textMainStyle]}>Description</Text>
                    <Text style={[styles.subDescription, textSubStyle]}>{description}</Text>
                </View>
            </View>

            {rangeDescription ? (
                <View style={styles.footer}>
                    <View style={styles.dateRangeContainer}>
                        <Ionicons name="arrow-up" size={16} color="#4CAF50" />
                        <Text style={[styles.dateRange, textSubStyle]}>
                            {rangeDescription}
                        </Text>
                    </View>

                    <View style={styles.statusContainer}>
                        <Text style={[styles.statusText, textMainStyle]}>{statusInfo.label}</Text>
                        <Ionicons name={statusInfo.icon as any} size={24} color={statusInfo.color} style={{ marginLeft: 5 }} />
                    </View>
                </View>
            ) : (
                <View style={styles.footer}>
                    <View style={{ flex: 1 }} />
                    <View style={styles.statusContainer}>
                        <Text style={[styles.statusText, textMainStyle]}>{statusInfo.label}</Text>
                        <Ionicons name={statusInfo.icon as any} size={24} color={statusInfo.color} style={{ marginLeft: 5 }} />
                    </View>
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 10,
        borderBottomWidth: 1,
        paddingBottom: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 10,
    },
    headerLabel: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    headerDate: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    content: {
        flexDirection: 'row',
        paddingHorizontal: 15,
        paddingTop: 15,
    },
    iconContainer: {
        marginRight: 15,
        justifyContent: 'center',
    },
    circleIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    detailsContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    description: {
        fontSize: 16,
    },
    subDescription: {
        fontSize: 16,
        marginTop: 2,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        marginTop: 15,
    },
    dateRangeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateRange: {
        fontSize: 12,
        marginLeft: 5,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusText: {
        fontSize: 14,
        marginRight: 5,
    },
});

export default RequestStatusItem;
