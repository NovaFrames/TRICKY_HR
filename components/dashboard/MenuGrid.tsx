import { LinearGradient } from 'expo-linear-gradient';
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
    getMenuIcon: (name: string) => { lib: any; name: string };
}

export const MenuGrid: React.FC<MenuGridProps> = ({
    menuItems,
    theme,
    getMenuIcon,
}) => {

    const safeColor = (color: string, alpha: string) => {
        if (!color || typeof color !== 'string') return theme.primary + alpha;
        if (color.startsWith('#')) {
            if (color.length === 4) {
                // Expand short hex #ABC to #AABBCC
                const expanded = '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
                return expanded + alpha;
            }
            if (color.length === 7) return color + alpha;
            return color;
        }
        return color; // Return as is if it's named color or rgb
    };

    /* -------------------- RESPONSIVE COLUMNS -------------------- */
    const getColumns = () => {
        if (width >= 900) return 5;
        if (width >= 600) return 4;
        return 3;
    };

    const numColumns = getColumns();
    const gap = 16;
    const padding = 32;
    const itemWidth =
        (width - padding - gap * (numColumns - 1)) / numColumns;

    return (
        <View style={[styles.gridContainer, { gap }]}>
            {menuItems.map((item: any, index: number) => {
                const { lib: IconLib, name: iconName } =
                    getMenuIcon(item.MenuNameC);
                const iconColor = item.IconcolorC || theme.primary;

                return (
                    <TouchableOpacity
                        key={index}
                        style={[
                            styles.gridItem,
                            {
                                width: itemWidth,
                                backgroundColor: theme.cardBackground,
                            },
                        ]}
                        activeOpacity={0.7}
                        onPress={() => {
                            if (item.ActionC) {
                                router.push({ pathname: item.ActionC, params: { from: 'home' } });
                            }
                        }}
                    >
                        <LinearGradient
                            colors={[safeColor(iconColor, '15'), safeColor(iconColor, '08')]}
                            style={styles.gridIconBox}
                        >
                            <IconLib
                                name={iconName as any}
                                size={22}
                                color={iconColor}
                            />
                        </LinearGradient>

                        <Text
                            style={[
                                styles.gridLabel,
                                { color: theme.text },
                            ]}
                            numberOfLines={2}
                        >
                            {item.MenuNameC}
                        </Text>
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
        justifyContent: 'flex-start',
    },

    gridItem: {
        alignItems: 'center',
        borderRadius: 20,
        padding: 12,
        paddingVertical: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 3,
    },

    gridIconBox: {
        width: 50,
        height: 50,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },

    gridLabel: {
        fontSize: 10.5,
        fontWeight: '700',
        textAlign: 'center',
        letterSpacing: -0.2,
        lineHeight: 13,
        paddingHorizontal: 2,
    },
});
