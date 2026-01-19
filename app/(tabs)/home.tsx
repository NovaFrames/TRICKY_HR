import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { UserData, useUser } from "@/context/UserContext";
import {
    Feather,
    FontAwesome5,
    MaterialCommunityIcons,
} from "@expo/vector-icons";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { MenuGrid } from "../../components/dashboard/MenuGrid";
import { useTheme } from "../../context/ThemeContext";

// Fallback menu items if API doesn't return any
const STATIC_MENU_ITEMS = [
  { MenuNameC: "Mobile Attendance", IconcolorC: "#10B981" },
  { MenuNameC: "Profile", IconcolorC: "#0EA5E9" },
  { MenuNameC: "Request Status", IconcolorC: "#10B981" },
  { MenuNameC: "Leave Manage", IconcolorC: "#F59E0B" },
];

export default function HomeScreen() {
  const { theme, isDark } = useTheme();
  const { user } = useUser();

  const loginData: Partial<UserData> = user ?? {};
  const empName =
    loginData.EmpNameC || loginData.EmpName || loginData.Name || "User";

  // Critical: Token extraction
  const token = loginData.Token || loginData.TokenC;

  // console.log('Extracted Token for Projects:', token);

  // Dynamic Menu Items
  const menuItems =
    Array.isArray(loginData.EmpMenu) && loginData.EmpMenu.length > 0
      ? loginData.EmpMenu
      : STATIC_MENU_ITEMS;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const getMenuIcon = (name: string) => {
    const key = name.toLowerCase();
    if (key.includes("attendance"))
      return { lib: FontAwesome5, name: "clipboard-check" };
    if (key.includes("report")) return { lib: FontAwesome5, name: "file-alt" };
    if (key.includes("profile"))
      return { lib: FontAwesome5, name: "user-circle" };
    if (key.includes("request"))
      return { lib: FontAwesome5, name: "clipboard-list" };
    if (key.includes("leave"))
      return { lib: MaterialCommunityIcons, name: "calendar-minus" };
    if (key.includes("time")) return { lib: Feather, name: "clock" };
    if (key.includes("holiday"))
      return { lib: FontAwesome5, name: "umbrella-beach" };
    if (key.includes("document"))
      return { lib: MaterialCommunityIcons, name: "file-document-outline" };
    if (key.includes("payslip"))
      return { lib: MaterialCommunityIcons, name: "cash-multiple" };

    return { lib: Feather, name: "grid" };
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        <DashboardHeader isDark={isDark} theme={theme} />
        {/* Dynamic Greeting Section */}
        {/* <View style={styles.greetingSection}>
                    <View>
                        <Text style={[styles.greetingLabel, { color: theme.text }]}>
                            {getGreeting()},
                        </Text>
                        <Text style={[styles.userName, { color: theme.text }]}>
                            {empName}
                        </Text>
                    </View>
                </View> */}

        <View style={styles.menuContainer}>
          {/* <Text style={[styles.sectionHeader, { color: theme.text, marginBottom: 16 }]}>Quick Access</Text> */}
          <MenuGrid
            menuItems={menuItems}
            theme={theme}
            getMenuIcon={getMenuIcon}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  menuContainer: {
    marginTop: 16,
  },
});
