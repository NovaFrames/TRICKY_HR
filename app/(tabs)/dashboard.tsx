import Celebrations from "@/components/dashboard/Celebrations";
import DashboardCards from "@/components/dashboard/DashboardCards";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Schedule } from "@/components/dashboard/Schedule";
import { UserData, useUser } from "@/context/UserContext";
import React from "react";
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { IdCard } from "../../components/dashboard/IdCard";
import { useTheme } from "../../context/ThemeContext";

export default function HomeScreen() {
  const { theme, isDark } = useTheme();
  const { user } = useUser();
  const { width } = useWindowDimensions();
  const isSmall = width < 480;
  const isTablet = width >= 768;

  const loginData: Partial<UserData> = user ?? {};

  const empName =
    loginData.EmpNameC || loginData.EmpName || loginData.Name || "-";
  const empCode = loginData.EmpCodeC || loginData.EmpCode || "-";
  const designation = loginData.DesigNameC || loginData.Designation || "-";
  const company =
    loginData.CompNameC ||
    loginData.CustomerIdC ||
    String(loginData.DomainId || "-");
  const domainLabel = loginData.domain_id || loginData.CustomerIdC || "-";

  const initial = empName.charAt(0);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: isSmall ? 12 : isTablet ? 20 : 16,
            gap: isTablet ? 16 : 12,
          },
        ]}
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        <DashboardHeader isDark={isDark} theme={theme} />

        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.inputBorder,
            },
          ]}
        >
          <Text style={[styles.sectionHeader, { color: theme.text }]}>
            Employee Profile
          </Text>
          <IdCard
            empName={empName}
            designation={designation}
            empCode={empCode}
            company={company}
            initial={initial}
            theme={theme}
          />
        </View>

        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.inputBorder,
            },
          ]}
        >
          <Text style={[styles.sectionHeader, { color: theme.text }]}>
            Schedule
          </Text>
          <Schedule />
        </View>

        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.inputBorder,
            },
          ]}
        >
          <Text style={[styles.sectionHeader, { color: theme.text }]}>
            Upcoming Celebrations
          </Text>
          <Celebrations />
        </View>

        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.inputBorder,
            },
          ]}
        >
          <Text style={[styles.sectionHeader, { color: theme.text }]}>
            Quick Actions
          </Text>
          <DashboardCards />
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
    gap: 14,
  },
  welcomeCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: "800",
  },
  welcomeSubTitle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "500",
  },
  metaRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: 10,
  },
  metaColumn: {
    flexDirection: "column",
  },
  metaPill: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  designationText: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: "500",
  },
  sectionCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  sectionHeader: {
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 10,
  },
});
