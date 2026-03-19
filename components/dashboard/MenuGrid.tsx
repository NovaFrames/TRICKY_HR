import { MENU_ICON_MAP } from '@/constants/menuIconMap';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo } from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';

interface MenuGridProps {
    menuItems: any[];
    theme: any;
    getMenuIcon?: (name: string) => { lib: any; name: string; };
}

export const MenuGrid: React.FC<MenuGridProps> = ({
    menuItems,
    theme,
    getMenuIcon,
}) => {
    const { width } = useWindowDimensions();
    /* ---------------- GRID CALCULATION ---------------- */
    const numColumns = width >= 1200 ? 5 : width >= 992 ? 4 : width >= 640 ? 3 : 2;
    const horizontalGap = width >= 992 ? 12 : 10;
    const verticalGap = width >= 992 ? 12 : 10;
    const getItemBasis = () => {
        if (numColumns === 5) return "20%";
        if (numColumns === 4) return "25%";
        if (numColumns === 3) return "33.3333%";
        return "50%";
    };

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
        <View
            style={[
                styles.gridContainer,
                { marginHorizontal: -(horizontalGap / 2) },
            ]}
        >
            {data.map((item, index) => {
                const iconConfig =
                    MENU_ICON_MAP[item.ActionC] ?? {
                        lib: Ionicons,
                        name: 'apps',
                    };

                const IconLib = iconConfig.lib;
                const iconColor = item.IconcolorC || theme.primary;

                return (
                    <View
                        key={`${item.IdN}-${index}`}
                        style={[
                            styles.gridCell,
                            {
                                flexBasis: getItemBasis(),
                                paddingHorizontal: horizontalGap / 2,
                                marginBottom: verticalGap,
                            },
                        ]}
                    >
                        <TouchableOpacity
                            style={[
                                styles.gridItem,
                                {
                                    backgroundColor: theme.cardBackground,
                                    borderColor: theme.inputBorder,
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
                                    size={width >= 992 ? 24 : 22}
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
                    </View>
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
        alignItems: 'stretch',
    },

    gridCell: {
        minWidth: 0,
    },

    gridItem: {
        width: '100%',
        alignItems: 'center',
        borderRadius: 8,
        borderWidth: 1,
        paddingVertical: 14,
        paddingHorizontal: 8,
        elevation: 3,
    },

    gridIconBox: {
        width: 48,
        height: 48,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },

    gridLabel: {
        fontSize: 12,
        fontWeight: '700',
        textAlign: 'center',
        lineHeight: 16,
    },
});
