import { Ionicons } from "@expo/vector-icons";
import { Href, Stack, useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";

const HEADER_HEIGHT =
  36 + (Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0);

export const BACK_FALLBACKS: Record<string, Href> = {
  home: "/home",
  settings: "/settings",
  dashboard: "/dashboard",
  approvaldetails: "/officer/approvaldetails",
};

export default function Header({ title }: { title: string }) {
  const { theme } = useTheme();
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: string }>();

  const handleBack = () => {
    if (typeof from === "string" && BACK_FALLBACKS[from]) {
      router.replace(BACK_FALLBACKS[from]);
      return;
    }
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.navBar}>
        <TouchableOpacity onPress={handleBack} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>

        <Text style={[styles.navTitle, { color: theme.text }]}>{title}</Text>

        <View style={styles.headerRight} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
  },
  navBar: {
    height: HEADER_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  navTitle: {
    fontSize: 19,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  iconButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  headerRight: {
    width: 36,
  },
});

export { HEADER_HEIGHT };
