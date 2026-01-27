import { useTheme } from "@/context/ThemeContext";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, Platform, StatusBar, StyleSheet, Text, View } from "react-native";

type SnackbarType = "error" | "success" | "info";

type SnackbarProps = {
  visible: boolean;
  message: string;
  type?: SnackbarType;
  onDismiss: () => void;
  duration?: number;
  topOffset?: number;
};

const Snackbar: React.FC<SnackbarProps> = ({
  visible,
  message,
  type = "info",
  onDismiss,
  duration = 1200,
  topOffset = 0,
}) => {
  const { theme } = useTheme();
  const translateY = useRef(new Animated.Value(32)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    if (!visible) return;

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        speed: 18,
        bounciness: 6,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 24,
          duration: 180,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.96,
          duration: 180,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) onDismiss();
      });
    }, duration);

    return () => clearTimeout(timer);
  }, [visible, duration, onDismiss, opacity, scale, translateY]);

  if (!visible) return null;

  const backgroundColor =
    type === "error"
      ? theme.error
      : type === "success"
        ? theme.success
        : theme.cardBackground;
  const textColor = type === "info" ? theme.text : "#fff";
  const borderColor =
    type === "info" ? theme.inputBorder : backgroundColor;

  return (
    <View style={[styles.wrapper, {
      top:
        (Platform.OS === "android"
          ? (StatusBar.currentHeight ?? 0)
          : 0) +
        topOffset +
        12,
    }]} pointerEvents="none">
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor,
            borderColor,
            transform: [{ translateY }, { scale }],
            opacity,
          },
        ]}
      >
        <Text style={[styles.message, { color: textColor }]}>{message}</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 16,
    right: 16,
    alignItems: "center",
    zIndex: 9999,
    elevation: 9999,
  },
  container: {
    width: "100%",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 4,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
  },
  message: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
});

export default Snackbar;
