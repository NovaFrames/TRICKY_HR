import { MENU_ICON_MAP } from "@/constants/menuIconMap";
import { UserData, useUser } from "@/context/UserContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";

const STATIC_MENU_ITEMS = [
  {
    MenuNameC: "Mobile Attendance",
    IconcolorC: "#10B981",
    ActionC: "employee/Attendance",
  },
  {
    MenuNameC: "Leave Manage",
    IconcolorC: "#F59E0B",
    ActionC: "employee/leavemanage",
  },
];

const DASHBOARD_MENU_ACTIONS = [
  "employee/Attendance",
  "employee/leavemanage",
];

type PlaceholderItem = { __placeholder: true; key: string };

export default function DashboardCards() {
  const { theme } = useTheme();
  const { user } = useUser();
  const { width } = useWindowDimensions();

  const columns = width >= 1200 ? 4 : width >= 900 ? 3 : width >= 600 ? 2 : 1;
  const gap = width >= 600 ? 10 : 8;

  const loginData: Partial<UserData> = user ?? {};
  const menuItems =
    Array.isArray(loginData.EmpMenu) && loginData.EmpMenu.length > 0
      ? loginData.EmpMenu
      : STATIC_MENU_ITEMS;

  const filteredMenuItems = menuItems.filter((item: any) =>
    DASHBOARD_MENU_ACTIONS.includes(item.ActionC),
  );

  const gridData: (any | PlaceholderItem)[] = [...filteredMenuItems];
  if (columns > 1) {
    const remainder = gridData.length % columns;
    if (remainder !== 0) {
      const fillers = columns - remainder;
      for (let i = 0; i < fillers; i += 1) {
        gridData.push({ __placeholder: true, key: `placeholder-${i}` });
      }
    }
  }

  return (
    <FlatList
      key={`dashboard-grid-${columns}`}
      data={gridData}
      numColumns={columns}
      scrollEnabled={false}
      contentContainerStyle={styles.container}
      columnWrapperStyle={
        columns > 1 ? { gap, marginBottom: gap } : undefined
      }
      keyExtractor={(item: any, index) =>
        item.__placeholder ? `${item.key}-${index}` : `${item.ActionC}-${index}`
      }
      renderItem={({ item, index }) => {
        if (item.__placeholder) {
          return <View style={[styles.card, styles.placeholderCard]} />;
        }

        const iconConfig = MENU_ICON_MAP[item.ActionC] ?? {
          lib: Ionicons,
          name: "apps",
        };
        const IconLib = iconConfig.lib;
        const iconColor = item.IconcolorC || theme.primary;

        return (
          <TouchableOpacity
            key={index}
            style={[
              styles.card,
              {
                marginBottom: columns === 1 ? gap : 0,
                backgroundColor: theme.cardBackground,
                borderColor: theme.inputBorder,
              },
            ]}
            activeOpacity={0.85}
            onPress={() =>
              router.push({
                pathname: item.ActionC,
                params: { from: "dashboard" },
              })
            }
          >
            <View style={[styles.iconBox, { backgroundColor: `${iconColor}15` }]}>
              <IconLib
                name={iconConfig.name as any}
                size={width >= 992 ? 24 : 22}
                color={iconColor}
              />
            </View>

            <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
              {item.MenuNameC}
            </Text>

            <Text style={[styles.subtitle, { color: theme.placeholder }]} numberOfLines={2}>
              Access your {item.MenuNameC.toLowerCase()}
            </Text>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  card: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    alignItems: "center",
  },
  placeholderCard: {
    opacity: 0,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
  },
});
