import { useTheme } from '@/context/ThemeContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
    useAnimatedProps,
    useAnimatedStyle,
    useSharedValue,
    withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

const { width } = Dimensions.get('window');

const TAB_COUNT = 3;
const TAB_WIDTH = width / TAB_COUNT;

const TAB_BAR_HEIGHT = 56;
const CURVE_WIDTH = 120;
const CURVE_HEIGHT = 38;


const AnimatedPath = Animated.createAnimatedComponent(Path);

type TabKey = 'dashboard' | 'home' | 'settings';

const isTabKey = (name: string): name is TabKey =>
    name === 'dashboard' || name === 'home' || name === 'settings';

const iconMap: Record<TabKey, React.ComponentProps<typeof Ionicons>['name']> = {
    home: 'home',
    settings: 'settings',
    dashboard: 'grid',
};

export function AnimatedTabBar({
    state,
    navigation,
}: BottomTabBarProps) {

    const { theme, isDark } = useTheme();
    const insets = useSafeAreaInsets();

    const curveX = useSharedValue(
        state.index * TAB_WIDTH + TAB_WIDTH / 2
    );

    // 🔥 Animate curve + circle together
    useEffect(() => {
        curveX.value = withTiming(
            state.index * TAB_WIDTH + TAB_WIDTH / 2,
            {
                duration: 350,
            }
        );
    }, [state.index]);

    // 🔵 SVG CURVE ANIMATION
    const animatedPathProps = useAnimatedProps(() => {
        const x = curveX.value;

        return {
            d: `
        M0 0
        H${x - CURVE_WIDTH / 2}
        C${x - CURVE_WIDTH / 4} 0,
         ${x - CURVE_WIDTH / 4} ${CURVE_HEIGHT},
         ${x} ${CURVE_HEIGHT}
        C${x + CURVE_WIDTH / 4} ${CURVE_HEIGHT},
         ${x + CURVE_WIDTH / 4} 0,
         ${x + CURVE_WIDTH / 2} 0
        H${width}
        V${TAB_BAR_HEIGHT}
        H0
        Z
      `,
        };
    });

    // 🔵 FLOATING CIRCLE ANIMATION
    const circleStyle = useAnimatedStyle(() => ({
        transform: [
            {
                translateX: curveX.value - TAB_WIDTH / 2,
            },
        ],
    }));

    const activeRoute = state.routes[state.index].name;
    const activeIcon =
        isTabKey(activeRoute) ? iconMap[activeRoute] : 'ellipse';

    return (
        <View style={[styles.container, { height: TAB_BAR_HEIGHT + insets.bottom, backgroundColor: theme.background }]}>
            {/* SVG CURVE */}
            <Svg width={width} height={TAB_BAR_HEIGHT} style={styles.svg}>
                <AnimatedPath
                    animatedProps={animatedPathProps}
                    fill={theme.primary}
                />
            </Svg>

            {/* FLOATING CIRCLE */}
            <Animated.View style={[styles.circle, circleStyle, { backgroundColor: theme.primary, bottom: insets.bottom + 15 }]}>
                <Ionicons name={activeIcon} size={28} color={theme.background} />
            </Animated.View>

            {/* TAB BUTTONS */}
            <View style={[styles.row, { paddingBottom: 0 }]}>
                {state.routes.map((route, index) => {
                    if (!isTabKey(route.name)) return null;

                    const focused = index === state.index;

                    return (
                        <TouchableOpacity
                            key={route.key}
                            style={styles.tab}
                            onPress={() => navigation.navigate(route.name)}
                        >
                            {!focused && (
                                <Ionicons
                                    name={iconMap[route.name]}
                                    size={24}
                                    color={isDark ? theme.background : theme.background}
                                />
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        width,
    },
    svg: {
        position: 'absolute',
        top: 0, // Align SVG to the top of the container
    },
    row: {
        flexDirection: 'row',
        height: TAB_BAR_HEIGHT,
        zIndex: 1,
    },
    tab: {
        width: TAB_WIDTH,
        alignItems: 'center',
        justifyContent: 'center',
    },
    circle: {
        position: 'absolute',
        left: TAB_WIDTH / 2 - 26,
        width: 52,
        height: 52,
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 6,
        zIndex: 2,
    },
});
