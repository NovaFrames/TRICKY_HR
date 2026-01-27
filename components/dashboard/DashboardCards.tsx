import { MENU_ICON_MAP } from "@/constants/menuIconMap";
import { UserData, useUser } from "@/context/UserContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";

/* -------------------- FALLBACK MENU -------------------- */
const STATIC_MENU_ITEMS = [
  {
    MenuNameC: "Mobile Attendance",
    IconcolorC: "#10B981",
    ActionC: "employee/Attendance",
    IconC: "fa fa-th-large",
  },
  {
    MenuNameC: "Leave Manage",
    IconcolorC: "#F59E0B",
    ActionC: "employee/leavemanage",
    IconC: "fa fa-plane",
  },
];

/* -------------------- DASHBOARD ALLOWED ACTIONS -------------------- */
const DASHBOARD_MENU_ACTIONS = [
  "employee/Attendance",
  "employee/leavemanage",
];

/* -------------------- LAYOUT -------------------- */
const { width } = Dimensions.get("window");
const GAP = 4;
const CARD_WIDTH = (width - 32 - GAP) / 2;

export default function DashboardCards() {
  const { theme } = useTheme();
  const { user } = useUser();

  const loginData: Partial<UserData> = user ?? {};

  const menuItems =
    Array.isArray(loginData.EmpMenu) && loginData.EmpMenu.length > 0
      ? loginData.EmpMenu
      : STATIC_MENU_ITEMS;

  const filteredMenuItems = menuItems.filter((item: any) =>
    DASHBOARD_MENU_ACTIONS.includes(item.ActionC),
  );

  return (
    <View style={styles.container}>
      {filteredMenuItems.map((item: any, index: number) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.card,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.inputBorder,
              borderWidth: 1,
            },
          ]}
          activeOpacity={0.7}
          onPress={() =>
            router.push({
              pathname: item.ActionC,
              params: { from: "dashboard" },
            })
          }
        >
          {(() => {
            const iconConfig =
              MENU_ICON_MAP[item.ActionC] ?? {
                lib: Ionicons,
                name: "apps",
              };
            const IconLib = iconConfig.lib;
            const iconColor = item.IconcolorC || theme.primary;

            return (
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: iconColor + "15" },
                ]}
              >
                <IconLib
                  name={iconConfig.name as any}
                  size={20}
                  color={iconColor}
                />
              </View>
            );
          })()}

          <Text style={[styles.title, { color: theme.text }]}>
            {item.MenuNameC}
          </Text>

          <Text style={[styles.subtitle, { color: theme.placeholder }]}>
            Access your {item.MenuNameC.toLowerCase()}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

/* -------------------- STYLES -------------------- */
const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },

  card: {
    width: CARD_WIDTH,
    borderRadius: 4,
    padding: 12, // Reduced from 16
    marginBottom: 4, // Reduced from 16
    shadowColor: "#000", // Neutral shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },

  iconBox: {
    width: 40, // Reduced from 48
    height: 40, // Reduced from 48
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8, // Reduced from 16
  },

  title: {
    fontSize: 14, // Reduced from 16
    fontWeight: "700",
    marginBottom: 2, // Reduced from 4
  },

  subtitle: {
    fontSize: 11, // Reduced from 12
    fontWeight: "500",
  },
});
