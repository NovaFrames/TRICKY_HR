import { MENU_ICON_MAP } from '@/constants/menuIconMap';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo } from 'react';
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
}

export const MenuGrid: React.FC<MenuGridProps> = ({
    menuItems,
    theme,
}) => {
    /* ---------------- GRID CALCULATION ---------------- */
    const numColumns = 3;
    const gap = 3;
    const parentPadding = 32;
    const availableWidth = width - parentPadding;
    const itemWidth =
        (availableWidth - gap * (numColumns - 1)) / numColumns;

    /* ---------------- SPLIT SECTIONS ---------------- */
    const { employeeMenus, officerMenus } = useMemo(() => {
        const employee: any[] = [];
        const officer: any[] = [];

        menuItems.forEach(item => {
            if (!item?.ActionC) return;

            if (item.ActionC.startsWith('employee/')) {
                employee.push(item);
            } else if (item.ActionC.startsWith('officer/')) {
                officer.push(item);
            }
        });

        return { employeeMenus: employee, officerMenus: officer };
    }, [menuItems]);

    /* ---------------- RENDER GRID ---------------- */
    const renderGrid = (data: any[]) => (
        <View style={[styles.gridContainer, { gap }]}>
            {data.map((item, index) => {
                const iconConfig =
                    MENU_ICON_MAP[item.ActionC] ?? {
                        lib: Ionicons,
                        name: 'apps',
                    };

                const IconLib = iconConfig.lib;
                const iconColor = item.IconcolorC || theme.primary;

                return (
                    <TouchableOpacity
                        key={`${item.IdN}-${index}`}
                        style={[
                            styles.gridItem,
                            {
                                width: itemWidth,
                                backgroundColor: theme.cardBackground,
                            },
                        ]}
                        activeOpacity={0.75}
                        onPress={() =>
                            router.push({
                                pathname: item.ActionC,
                                params: { from: 'home' },
                            })
                        }
                    >
                        <View
                            style={[
                                styles.gridIconBox,
                                { backgroundColor: iconColor + '18' },
                            ]}
                        >
                            <IconLib
                                name={iconConfig.name as any}
                                size={24}
                                color={iconColor}
                            />
                        </View>

                        <Text
                            style={[styles.gridLabel, { color: theme.text }]}
                            numberOfLines={2}
                        >
                            {item.MenuNameC}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );

    /* ---------------- UI ---------------- */
    return (
        <View>
            {employeeMenus.length > 0 && (
                <View style={styles.section}>
                    <View style={[styles.sectionHeader, { borderColor: theme.inputBorder, marginBottom: 16 }]}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>
                            Employee
                        </Text>
                    </View>
                    {renderGrid(employeeMenus)}
                </View>
            )}

            {officerMenus.length > 0 && (

                <View style={styles.section}>
                    <View style={[styles.sectionHeader, { borderColor: theme.inputBorder, marginBottom: 16 }]}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>
                            Officer
                        </Text>
                    </View>
                    {renderGrid(officerMenus)}
                </View>
            )}
        </View>
    );
};

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
    section: {
        marginBottom: 26,
    },

    sectionHeader: {
        borderBottomWidth: 0.6,
        paddingBottom: 6,
        marginBottom: 12,
    },

    sectionTitle: {
        fontSize: 15,
        fontWeight: '800',
        letterSpacing: 0.6,
    },

    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },

    gridItem: {
        alignItems: 'center',
        borderRadius: 6,
        paddingVertical: 16,
        paddingHorizontal: 8,
        elevation: 3,
    },

    gridIconBox: {
        width: 52,
        height: 52,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },

    gridLabel: {
        fontSize: 11,
        fontWeight: '700',
        textAlign: 'center',
        lineHeight: 14,
    },
});
