import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useTheme } from "../context/ThemeContext";

interface CustomButtonProps extends TouchableOpacityProps {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap; // ✅ proper typing
  isLoading?: boolean;
  textColor?: string;
  iconColor?: string;
  indicatorColor?: string;
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  icon,
  isLoading,
  textColor,
  iconColor,
  indicatorColor,
  style,
  disabled,
  ...props
}) => {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
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
            {icon && (
              <Ionicons
                name={icon}
                size={20}
                color={iconColor || textColor || "#fff"}
                style={{ marginRight: 8 }}
              />
            )}
            <Text style={[styles.buttonText, { color: textColor || "#fff" }]}>
              {title}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    // height: 54,
    padding: 16,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.5,
  },
});
