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
import Svg, { Path } from 'react-native-svg';

const { width } = Dimensions.get('window');

const TAB_COUNT = 3;
const TAB_WIDTH = width / TAB_COUNT;

const TAB_BAR_HEIGHT = 64;
const CURVE_WIDTH = 140;
const CURVE_HEIGHT = 50;


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
        V80
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
        <View style={styles.container}>
            {/* SVG CURVE */}
            <Svg width={width} height={TAB_BAR_HEIGHT} style={styles.svg}>
                <AnimatedPath
                    animatedProps={animatedPathProps}
                    fill={theme.primary}
                />
            </Svg>

            {/* FLOATING CIRCLE */}
            <Animated.View style={[styles.circle, circleStyle, { backgroundColor: theme.primary }]}>
                <Ionicons name={activeIcon} size={28} color={theme.background} />
            </Animated.View>

            {/* TAB BUTTONS */}
            <View style={styles.row}>
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
        height: 70,
    },
    svg: {
        position: 'absolute',
        bottom: 0,
    },
    row: {
        flexDirection: 'row',
        height: 60,
    },
    tab: {
        width: TAB_WIDTH,
        alignItems: 'center',
        justifyContent: 'center',
    },
    circle: {
        position: 'absolute',
        bottom: 15,
        left: TAB_WIDTH / 2 - 30,
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 6,
    },
});
