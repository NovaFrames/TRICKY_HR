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
    /* -------------------- RESPONSIVE COLUMNS -------------------- */
    const getColumns = () => {
        if (width >= 900) return 5;
        if (width >= 600) return 4;
        return 3;
    };

    const numColumns = getColumns();
    const gap = 14;
    const padding = 40;
    const itemWidth =
        (width - padding - gap * (numColumns - 1)) / numColumns;

    return (
        <View style={[styles.gridContainer, { gap }]}>
            {menuItems.map((item: any, index: number) => {
                const { lib: IconLib, name: iconName } =
                    getMenuIcon(item.MenuNameC);

                return (
                    <TouchableOpacity
                        key={index}
                        style={[
                            styles.gridItem,
                            {
                                width: itemWidth,
                                backgroundColor: '#FFFFFF',
                                borderColor: '#F1F5F9',
                                borderWidth: 1,
                            },
                        ]}
                        activeOpacity={0.7}
                        onPress={() => {
                            if (item.ActionC) {
                                router.push({ pathname: item.ActionC, params: { from: 'home' } });
                            }
                        }}
                    >
                        <View
                            style={[
                                styles.gridIconBox,
                                {
                                    backgroundColor:
                                        (item.IconcolorC || theme.primary) + '12',
                                },
                            ]}
                        >
                            <IconLib
                                name={iconName as any}
                                size={18}
                                color={item.IconcolorC || theme.primary}
                            />
                        </View>

                        <Text
                            style={[
                                styles.gridLabel,
                                { color: '#1E293B' },
                            ]}
                            numberOfLines={1}
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
        marginBottom: 14,
        borderRadius: 20,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2,
    },

    gridIconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },

    gridLabel: {
        fontSize: 11,
        fontWeight: '800',
        textAlign: 'center',
        letterSpacing: -0.2,
    },
});
