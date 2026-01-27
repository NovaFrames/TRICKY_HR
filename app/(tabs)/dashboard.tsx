import Celebrations from "@/components/dashboard/Celebrations";
import DashboardCards from "@/components/dashboard/DashboardCards";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Schedule } from "@/components/dashboard/Schedule";
import { UserData, useUser } from "@/context/UserContext";
import { router } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { IdCard } from "../../components/dashboard/IdCard";
import { useTheme } from "../../context/ThemeContext";

export default function HomeScreen() {
  const { theme, isDark } = useTheme();
  const { user } = useUser();

  const loginData: Partial<UserData> = user ?? {};

  const empName =
    loginData.EmpNameC || loginData.EmpName || loginData.Name || "-";
  const empCode = loginData.EmpCodeC || loginData.EmpCode || "-";
  const designation = loginData.DesigNameC || loginData.Designation || "-";
  const company = loginData.CompNameC || loginData.DomainId || "-";

  const initial = empName.charAt(0);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? theme.background : "#FFFFFF" },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        <DashboardHeader isDark={isDark} theme={theme} />

        <IdCard
          empName={empName}
          designation={designation}
          empCode={empCode}
          company={company}
          initial={initial}
          theme={theme}
        />

        <Text style={[styles.sectionHeader, { color: theme.text }]}>
          Schedule
        </Text>
        <Schedule />

        <View style={styles.header}>
          <Text style={[styles.sectionHeader, { color: theme.text }]}>
            Upcoming Celebration
          </Text>
          <TouchableOpacity onPress={() =>
            router.push({
              pathname: "/(tabs)/employee/celebration",
              params: { from: "dashboard" }
            })}>
            <Text style={[{ color: theme.textLight }]}>View all</Text>
          </TouchableOpacity>
        </View>
        <Celebrations />

        <Text style={[styles.sectionHeader, { color: theme.text }]}>
          Quick Actions
        </Text>

        <DashboardCards />
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
    // paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center", // 👈 THIS
    marginBottom: 14,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "700",
  },

});
