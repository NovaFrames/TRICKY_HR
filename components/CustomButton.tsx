import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  useWindowDimensions,
  View,
  ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useTheme } from "../context/ThemeContext";

interface CustomButtonProps extends TouchableOpacityProps {
  title?: string;
  icon?: keyof typeof Ionicons.glyphMap; // ✅ proper typing
  isLoading?: boolean;
  textColor?: string;
  iconColor?: string;
  indicatorColor?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  icon,
  isLoading,
  textColor,
  iconColor,
  indicatorColor,
  containerStyle,
  style,
  disabled,
  ...props
}) => {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const isSmall = width < 380;
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, containerStyle]}>
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: theme.primary,
            shadowColor: theme.primary,
            opacity: disabled ? 0.6 : 1,
          },
          style,
        ]}
        activeOpacity={1}
        onPressIn={() => (scale.value = withSpring(0.96))}
        onPressOut={() => (scale.value = withSpring(1))}
        disabled={isLoading || disabled}
        {...props}
      >
        {isLoading ? (
          <ActivityIndicator color={indicatorColor || "#fff"} />
        ) : (
          <View style={styles.content}>
            {title && (
              <Text
                style={[
                  styles.buttonText,
                  { color: textColor || "#fff", fontSize: isSmall ? 14 : 16 },
                ]}
              >
                {title}
              </Text>
            )}
            {icon && (
              <Ionicons
                name={icon}
                size={20}
                color={iconColor || textColor || "#fff"}
              />
            )}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    width: "100%",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.5,
  },
});
