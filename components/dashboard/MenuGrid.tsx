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
    const gap = 16;
    const padding = 48;
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
                                borderColor: theme.inputBg,
                            },
                        ]}
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
                                        theme.primary + '15',
                                },
                            ]}
                        >
                            <IconLib
                                name={iconName as any}
                                size={20}
                                color={item.IconcolorC || theme.primary}
                            />
                        </View>

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
    },

    gridItem: {
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
    },

    gridIconBox: {
        width: 48,
        height: 48,
        borderRadius: 12,
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
