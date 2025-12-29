import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

interface MenuGridProps {
    menuItems: any[];
    theme: any;
    getMenuIcon: (name: string) => { lib: any, name: string };
}

export const MenuGrid: React.FC<MenuGridProps> = ({
    menuItems,
    theme,
    getMenuIcon
}) => {
    return (
        <View style={styles.gridContainer}>
            {menuItems.map((item: any, index: number) => {
                const { lib: IconLib, name: iconName } = getMenuIcon(item.MenuNameC);
                const isAttendance = index === 0 || item.MenuNameC?.toLowerCase().includes('mobile attendance');
                const itemColor = item.IconcolorC || '#d77a2f';

                if (isAttendance) {
                    return (
                        <TouchableOpacity key={index} style={[styles.attendanceCard, { shadowColor: itemColor }]}>
                            <LinearGradient
                                colors={[itemColor, '#d77a2f']}
                                style={styles.attendanceGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <View style={styles.attendanceContent}>
                                    <View style={styles.attendanceIconBox}>
                                        <IconLib name={iconName as any} size={24} color={itemColor} />
                                    </View>
                                    <View>
                                        <Text style={styles.attendanceTitle}>{item.MenuNameC}</Text>
                                        <Text style={styles.attendanceSub}>Check-in / Check-out</Text>
                                    </View>
                                    <Feather name="chevron-right" size={24} color="#fff" style={{ marginLeft: 'auto' }} />
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>
                    )
                }

                return (
                    <TouchableOpacity key={index} style={[styles.gridItem, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, shadowColor: theme.text }]}>
                        <View style={[styles.gridIconBox, { backgroundColor: itemColor + '15' }]}>
                            <IconLib name={iconName as any} size={24} color={itemColor} />
                        </View>
                        <Text style={[styles.gridLabel, { color: theme.text }]} numberOfLines={2}>{item.MenuNameC}</Text>
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
        gap: 16,
        marginBottom: 24,
    },
    attendanceCard: {
        width: '100%',
        marginBottom: 0,
        borderRadius: 20,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 4,
    },
    attendanceGradient: {
        borderRadius: 20,
        padding: 20,
    },
    attendanceContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    attendanceIconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    attendanceTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    attendanceSub: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 2,
    },
    gridItem: {
        width: (width - 48 - 16) / 2, // 2 columns: Screen - padding - gap
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 2,
    },
    gridIconBox: {
        width: 56,
        height: 56,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    gridLabel: {
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
    },
});
