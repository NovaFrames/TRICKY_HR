import { router } from 'expo-router';
import React from 'react';
import {
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

interface MenuGridProps {
    menuItems: any[];
    theme: any;
    type: string;
    getMenuIcon: (name: string) => { lib: any; name: string };
}

const DASHBOARD_MENU_NAMES = [
    'Mobile Attendance',
    'Leave Manage',
    'Time Manage',
    'Request Status',
];

export const MenuGrid: React.FC<MenuGridProps> = ({
    menuItems,
    theme,
    type,
    getMenuIcon,
}) => {
    /* -------------------- DATA FILTER -------------------- */
    const displayItems =
        type === 'dashboard'
            ? menuItems.filter(item =>
                DASHBOARD_MENU_NAMES.includes(item.MenuNameC)
            )
            : menuItems;

    const isDashboard = type === 'dashboard';

    /* -------------------- RESPONSIVE COLUMNS -------------------- */
    const getColumns = () => {
        if (width >= 900) return isDashboard ? 4 : 5;
        if (width >= 600) return isDashboard ? 3 : 4;
        return 3;
    };

    const numColumns = getColumns();
    const gap = 16;
    const padding = 48; // Total horizontal padding
    const itemWidth = isDashboard ?
        (width - padding - gap * (numColumns - 1)) / numColumns :
        (width - padding - gap * (numColumns - 1)) / numColumns;

    return (
        <View style={[styles.gridContainer, { gap }]}>
            {displayItems.map((item: any, index: number) => {
                const { lib: IconLib, name: iconName } = getMenuIcon(item.MenuNameC);

                // Dashboard specific styling
                let itemBg = theme.background;
                let itemIconColor = item.IconcolorC || theme.primary;
                let subText = '';

                if (isDashboard) {
                    if (item.MenuNameC === 'Mobile Attendance') {
                        itemBg = '#F97316'; // Orange
                        itemIconColor = '#fff';
                        subText = 'Tap to check in or out';
                    } else if (item.MenuNameC === 'Leave Manage') {
                        itemBg = '#E0F2FE'; // Light Blue
                        itemIconColor = '#0EA5E9';
                        subText = 'Apply for leave';
                    } else if (item.MenuNameC === 'Request Status') {
                        itemBg = '#fff';
                        itemIconColor = '#10B981';
                        subText = 'View request progress';
                    } else if (item.MenuNameC === 'Time Manage') {
                        itemBg = '#fff';
                        itemIconColor = '#F97316';
                        subText = 'Manage your time logs';
                    }
                } else {
                    // Non-dashboard styling improvements
                    itemBg = 'transparent';
                }

                return (
                    <TouchableOpacity
                        key={index}
                        style={[
                            styles.gridItem,
                            {
                                width: itemWidth,
                                backgroundColor: itemBg,
                                alignItems: isDashboard ? 'flex-start' : 'center',
                                padding: isDashboard ? 16 : 12,
                                borderColor: isDashboard ? 'transparent' : (theme.border || '#E5E7EB'),
                                borderWidth: isDashboard ? 0 : 1,
                                // Add shadow for dashboard items or if desired
                                elevation: isDashboard ? 2 : 0,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: isDashboard ? 0.1 : 0,
                                shadowRadius: 2,
                            },
                        ]}
                        onPress={() => {
                            if (item.ActionC) {
                                router.push(item.ActionC);
                            }
                        }}
                    >
                        <View style={{
                            flexDirection: isDashboard ? 'row' : 'column',
                            alignItems: isDashboard ? 'flex-start' : 'center',
                            justifyContent: isDashboard ? 'flex-start' : 'center',
                            width: '100%'
                        }}>
                            <View
                                style={[
                                    styles.gridIconBox,
                                    {
                                        backgroundColor: isDashboard && item.MenuNameC === 'Mobile Attendance' ? 'rgba(255,255,255,0.2)' : (isDashboard ? 'transparent' : (theme.primary ? theme.primary + '15' : '#F3F4F6')),
                                        width: isDashboard ? 60 : 48,
                                        height: isDashboard ? 60 : 48,
                                        borderRadius: isDashboard ? 18 : 12,
                                    }
                                ]}
                            >
                                <IconLib
                                    name={iconName as any}
                                    size={isDashboard ? 24 : 20}
                                    color={itemIconColor}
                                />
                            </View>

                            <View style={{ flex: 1, marginLeft: isDashboard ? 12 : 0, alignItems: isDashboard ? 'flex-start' : 'center' }}>
                                <Text
                                    style={[
                                        styles.gridLabel,
                                        {
                                            color: isDashboard && item.MenuNameC === 'Mobile Attendance' ? '#fff' : theme.text,
                                            textAlign: isDashboard ? 'left' : 'center',
                                            fontSize: isDashboard ? 16 : 12,
                                            fontWeight: isDashboard ? '700' : '500',
                                            marginTop: isDashboard ? 8 : 8
                                        },
                                    ]}
                                    numberOfLines={2}
                                >
                                    {isDashboard && item.MenuNameC === 'Mobile Attendance' ? 'Check In / Out' :
                                        isDashboard && item.MenuNameC === 'Leave Manage' ? 'Leave Request' :
                                            isDashboard && item.MenuNameC === 'Time Manage' ? 'Time Sheet' :
                                                item.MenuNameC}
                                </Text>
                                {isDashboard && subText ? (
                                    <Text style={{ fontSize: 11, color: item.MenuNameC === 'Mobile Attendance' ? 'rgba(255,255,255,0.8)' : '#64748B', marginTop: 4 }}>
                                        {subText}
                                    </Text>
                                ) : null}
                            </View>
                        </View>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    sectionContainer: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },

    /* Grid */
    gridItem: {
        alignItems: 'center',
        marginBottom: 16,
        borderColor: '#E5E7EB',
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
    },

    gridIconBox: {
        width: 60,
        height: 60,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    gridLabel: {
        fontSize: 12,
        fontWeight: '500',
        textAlign: 'center',
    },
});
