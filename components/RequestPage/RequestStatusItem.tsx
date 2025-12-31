import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface RequestStatusItemProps {
    item: any;
    onPress?: () => void;
}

const RequestStatusItem: React.FC<RequestStatusItemProps> = ({ item, onPress }) => {
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
        return { color: '#9E9E9E', icon: 'help-circle', label: status };
    };

    // Mappings based on user response
    // Response example: {"IdN":26,"YearN":0,"applyDateD":"/Date(1767092399847)/","DescC":"LEAVE","StatusC":"Waiting ","LvDescC":"From : 20 Jan 2024, To : 20 Jan 2024"}

    // StatusC can be "Waiting ". Trim it.
    const rawStatus = item.StatusC || item.StatusResult || item.Status || 'Waiting';
    const statusInfo = getStatusInfo(rawStatus.trim());

    const requestDate = item.applyDateD || item.RequestDate || item.CreatedDate;
    const description = item.DescC || item.LeaveName || item.Description || 'LEAVE';
    // Valid for LEAVE, string contains "From : ..., To : ..."
    // Valid for Leave Surrender, empty string usually
    const rangeDescription = item.LvDescC || '';

    // If LvDescC is empty, we don't show the range footer part or show simpler one

    return (
        <TouchableOpacity style={styles.container} onPress={onPress}>
            <View style={styles.header}>
                <Text style={styles.headerLabel}>Request Date</Text>
                <Text style={styles.headerDate}>{formatDate(requestDate)}</Text>
            </View>
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <View style={styles.circleIcon}>
                        <Ionicons name="create-outline" size={24} color="#FFF" />
                    </View>
                </View>
                <View style={styles.detailsContainer}>
                    <Text style={styles.description}>Description</Text>
                    <Text style={styles.subDescription}>{description}</Text>
                </View>
            </View>

            {rangeDescription ? (
                <View style={styles.footer}>
                    <View style={styles.dateRangeContainer}>
                        <Ionicons name="arrow-up" size={16} color="#4CAF50" />
                        <Text style={styles.dateRange}>
                            {rangeDescription}
                        </Text>
                    </View>

                    <View style={styles.statusContainer}>
                        <Text style={styles.statusText}>{statusInfo.label}</Text>
                        <Ionicons name={statusInfo.icon as any} size={24} color={statusInfo.color} style={{ marginLeft: 5 }} />
                    </View>
                </View>
            ) : (
                <View style={styles.footer}>
                    <View style={{ flex: 1 }} />
                    <View style={styles.statusContainer}>
                        <Text style={styles.statusText}>{statusInfo.label}</Text>
                        <Ionicons name={statusInfo.icon as any} size={24} color={statusInfo.color} style={{ marginLeft: 5 }} />
                    </View>
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: '#f9f9f9',
    },
    headerLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    headerDate: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
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
        backgroundColor: '#03A9F4', // Blue color from screenshot
        justifyContent: 'center',
        alignItems: 'center',
    },
    detailsContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    description: {
        fontSize: 16,
        color: '#333',
    },
    subDescription: {
        fontSize: 16,
        color: '#777',
        marginTop: 2,
    },
    leaveType: {
        fontSize: 14,
        color: '#777',
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
        color: '#777',
        marginLeft: 5,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusText: {
        fontSize: 14,
        color: '#333',
        marginRight: 5,
    },
});

export default RequestStatusItem;
