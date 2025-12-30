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
    const padding = 48;
    const itemWidth = isDashboard ?
        (width - padding - gap * (numColumns - 2)) / numColumns :
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
                                padding: isDashboard ? 16 : 0,
                                marginBottom: 16
                            },
                        ]}
                        onPress={() => {
                            if (item.ActionC) {
                                router.push(item.ActionC);
                            }
                        }}
                    >
                        <View style={{ flexDirection: isDashboard ? 'row' : 'column', alignItems: isDashboard ? 'flex-start' : 'center', justifyContent: isDashboard ? 'flex-start' : 'center' }}>
                            <View
                                style={[
                                    styles.gridIconBox,
                                    {
                                        backgroundColor: isDashboard && item.MenuNameC === 'Mobile Attendance' ? 'rgba(255,255,255,0.2)' : (isDashboard ? 'transparent' : undefined)
                                    }
                                ]}
                            >
                                <IconLib
                                    name={iconName as any}
                                    size={isDashboard ? 24 : 30}
                                    color={itemIconColor}
                                />
                            </View>

                            <View>
                                <Text
                                    style={[
                                        styles.gridLabel,
                                        {
                                            color: isDashboard && item.MenuNameC === 'Mobile Attendance' ? '#fff' : theme.text,
                                            textAlign: isDashboard ? 'left' : 'center',
                                            fontSize: isDashboard ? 16 : 12,
                                            fontWeight: isDashboard ? '700' : '500',
                                            marginTop: isDashboard ? 8 : 0
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
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 24,

    },

    /* Attendance */
    attendanceCard: {
        width: '100%',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
    },
    attendanceContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    attendanceIconBox: {
        width: 52,
        height: 52,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    attendanceTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    attendanceSub: {
        fontSize: 12,
        marginTop: 2,
        opacity: 0.85,
    },

    /* Grid */
    gridItem: {
        alignItems: 'center',
        marginBottom: 16,
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
