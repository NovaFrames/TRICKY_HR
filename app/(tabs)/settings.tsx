import ProfileImage from "@/components/common/ProfileImage";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { useTheme } from "@/context/ThemeContext";
import { useUser } from "@/context/UserContext";
import {
  clearForegroundLocationSharing,
  isForegroundLocationSharingEnabled,
  saveForegroundLocationCredentials,
  setForegroundLocationSharingEnabled,
  startForegroundLocationSharing,
} from "@/services/liveLocationForeground";
import {
  Feather,
  FontAwesome5,
  Ionicons,
  MaterialIcons,
} from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Linking,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from "react-native";

/* -------------------- TYPES ------------------- */

type IconProps = {
  color?: string;
  size?: number;
};

interface SettingItem {
  label: string;
  description?: string;
  icon: React.ReactElement<IconProps>;
  color: string;
  type?: "navigation" | "switch" | "action";
  onPress?: () => void;
  switchValue?: boolean;
  onValueChange?: (value: boolean) => void;
}

interface SettingSection {
  title: string;
  items: SettingItem[];
}

/* -------------------- SCREEN -------------------- */
export default function SettingsScreen() {
  const { theme, isDark, toggleTheme, setPrimaryColor } = useTheme();
  const { logout, user } = useUser();
  const router = useRouter();
  const [isLiveLocationEnabled, setIsLiveLocationEnabled] = useState(false);

  const startLiveLocationSharing = useCallback(async () => {
    try {
      const token = user?.TokenC || user?.Token || "";
      const empId = Number(user?.EmpIdN ?? 0);

      if (!token || !empId) {
        Alert.alert("Live Location", "User session is not ready. Please login again.");
        return false;
      }

      const intervalMinutes = Math.max(Number(user?.LiveDurN) || 1, 1);

      await saveForegroundLocationCredentials(token, empId, intervalMinutes);

      const started = await startForegroundLocationSharing(intervalMinutes);

      if (!started) {
        Alert.alert(
          "Location Permission Required",
          "Allow location access while using the app to share your work location.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() },
          ],
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error("Failed to start live location sharing:", error);
      return false;
    }
  }, [user?.EmpIdN, user?.LiveDurN, user?.Token, user?.TokenC]);

  const handleToggleLiveLocation = useCallback(
    async (enabled: boolean) => {
      if (enabled) {
        Alert.alert(
          "Enable Live Location",
          "TrickyHR will share your location only while the app is open and you are using it for workplace attendance verification. You can turn this off anytime.",
          [
            {
              text: "Cancel",
              style: "cancel",
              onPress: async () => {
                setIsLiveLocationEnabled(false);
                await setForegroundLocationSharingEnabled(false);
              },
            },
            {
              text: "Continue",
              onPress: async () => {
                const started = await startLiveLocationSharing();

                if (!started) {
                  setIsLiveLocationEnabled(false);
                  await setForegroundLocationSharingEnabled(false);
                  await clearForegroundLocationSharing();
                  return;
                }

                setIsLiveLocationEnabled(true);
                await setForegroundLocationSharingEnabled(true);
              },
            },
          ],
        );
        return;
      }

      setIsLiveLocationEnabled(false);
      await setForegroundLocationSharingEnabled(false);
      await clearForegroundLocationSharing();
    },
    [startLiveLocationSharing],
  );

  const loadLiveLocationState = useCallback(async () => {
    setIsLiveLocationEnabled(await isForegroundLocationSharingEnabled());
  }, []);

  useEffect(() => {
    void loadLiveLocationState();
  }, [loadLiveLocationState]);

  useFocusEffect(
    useCallback(() => {
      void loadLiveLocationState();
    }, [loadLiveLocationState]),
  );

  const handleLogout = async () => {
    await setForegroundLocationSharingEnabled(false);
    await clearForegroundLocationSharing();
    await logout();
    router.replace("../auth/login");
  };

  /* -------------------- SETTINGS CONFIG -------------------- */
  const SETTINGS_SECTIONS: SettingSection[] = [
    {
      title: "Account Settings",
      items: [
        {
          label: "Profile",
          description: "Update your profile information",
          icon: <FontAwesome5 name="user" />,
          color: "#3b82f6",
          type: "action" as const,
          onPress: () => {
            router.push({
              pathname: "/(tabs)/employee/profileupdate",
              params: { from: "settings" },
            });
          },
        },
        {
          label: "Change Password",
          description: "Update your password",
          icon: <MaterialIcons name="lock" />,
          color: "#f59e0b",
          type: "action" as const,
          onPress: () => {
            router.push("/settings/ChangePassword");
          },
        },
      ],
    },
    {
      title: "App Preferences",
      items: [
        {
          label: "Dark Mode",
          description: "Toggle dark theme",
          icon: <Ionicons name="moon" />,
          color: "#6366f1",
          type: "switch" as const,
          switchValue: isDark,
          onValueChange: toggleTheme,
        },
        ...(user?.IsLiveLocN === 1
          ? [
            {
              label: "Live Location",
              description: isLiveLocationEnabled
                ? "Sharing while app is in use"
                : "Share work location while using the app",
              icon: <Ionicons name="location" />,
              color: "#0ea5e9",
              type: "switch" as const,
              switchValue: isLiveLocationEnabled,
              onValueChange: handleToggleLiveLocation,
            },
          ]
          : []),
        {
          label: "Choose Theme",
          description: "",
          icon: <Ionicons name="brush" />,
          color: theme.primary,
        },
      ],
    },
    {
      title: "Logout",
      items: [
        {
          label: "Sign Out",
          description: "Log out from your account",
          icon: <Ionicons name="log-out-outline" />,
          color: "#ef4444",
          type: "action" as const,
          onPress: handleLogout,
        },
      ],
    },
  ];

  /* -------------------- UI COMPONENTS -------------------- */
  const SectionHeader = ({ title }: { title: string }) => (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
    </View>
  );

  const THEME_COLORS = [
    { label: "Orange", color: "#e46a23" },
    { label: "Indigo", color: "#6366F1" },
    { label: "Emerald", color: "#10B981" },
  ];

  const SettingsItem = ({
    item,
    isLast,
  }: {
    item: SettingItem;
    isLast: boolean;
  }) => {
    const rightElement =
      item.type === "switch" ? (
        <Switch
          trackColor={{ false: theme.inputBorder, true: `${theme.primary}80` }}
          thumbColor={isDark ? theme.primary : theme.inputBg}
          onValueChange={item.onValueChange ?? toggleTheme}
          value={item.switchValue ?? isDark}
        />
      ) : item.type === "action" ? (
        <Feather name="chevron-right" size={20} color={`${theme.text}80`} />
      ) : (
        ""
      );

    return (
      <TouchableOpacity
        style={[
          styles.itemContainer,
          { backgroundColor: theme.cardBackground },
          !isLast && {
            borderBottomWidth: 1,
            borderBottomColor: theme.inputBorder,
          },
        ]}
        onPress={item.onPress}
        disabled={item.type === "switch"}
      >
        <View style={styles.itemLeft}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: `${item.color}15` },
            ]}
          >
            {React.cloneElement(item.icon, {
              color: item.color,
              size: 20,
            })}
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.itemLabel, { color: theme.text }]}>
              {item.label}
            </Text>
            {item.description ? (
              <Text
                style={[styles.itemDescription, { color: theme.textLight }]}
              >
                {item.description}
              </Text>
            ) : (
              <View style={styles.themeBadgeSection}>
                <View style={styles.inlineColorRow}>
                  {THEME_COLORS.map((color, index) => {
                    const isSelected = theme.primary === color.color;
                    return (
                      <View
                        key={index}
                        style={{ alignItems: "center", gap: 6 }}
                      >
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.inlineColorCircle,
                            { backgroundColor: color.color },
                            isSelected && styles.inlineSelectedCircle,
                          ]}
                          onPress={() => setPrimaryColor(color.color)}
                        >
                          {isSelected && (
                            <Feather name="check" size={14} color="#FFF" />
                          )}
                        </TouchableOpacity>
                        <Text style={{ color: theme.text }}>{color.label}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        </View>
        {rightElement}
      </TouchableOpacity>
    );
  };

  /* -------------------- RENDER -------------------- */
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Settings */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <DashboardHeader isDark={isDark} theme={theme} />

        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={[styles.screenTitle, { color: theme.text }]}>
            Settings
          </Text>

          <View
            style={[
              styles.profileCard,
              { backgroundColor: theme.cardBackground },
            ]}
          >
            <View style={styles.profileContent}>
              <ProfileImage
                customerIdC={user?.CustomerIdC}
                compIdN={user?.CompIdN}
                empIdN={user?.EmpIdN}
                size={60}
              />
              <View style={styles.userInfo}>
                <Text style={[styles.userName, { color: theme.text }]}>
                  {user?.EmpNameC}
                </Text>
                <Text style={[styles.userId, { color: theme.secondary }]}>
                  ID: {user?.EmpCodeC}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {SETTINGS_SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <SectionHeader title={section.title} />
            {section.items.map((item, index) => (
              <SettingsItem
                key={item.label}
                item={item}
                isLast={index === section.items.length - 1}
              />
            ))}
          </View>
        ))}

        <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: theme.textLight }]}>
                        Version 3.5.7 • © 2026
                    </Text>
                </View>
      </ScrollView>
    </View>
  );
}

/* -------------------- STYLES -------------------- */
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 60 },
  headerContainer: { padding: 12 }, // Reduced from 20
  screenTitle: { fontSize: 22, fontWeight: "700", marginBottom: 8 }, // Smaller title
  profileCard: { borderRadius: 4, padding: 12, elevation: 2 }, // Compact card
  profileContent: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 50, height: 50, borderRadius: 4, marginRight: 12 }, // Smaller avatar
  userInfo: { flex: 1 },
  userName: { fontSize: 18, fontWeight: "600" },
  userId: { fontSize: 13, marginTop: 2 },

  section: { marginHorizontal: 20, marginBottom: 8 },
  sectionHeader: { paddingVertical: 12 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    opacity: 0.7,
  },

  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 4,
  },
  itemLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  textContainer: { flex: 1 },
  itemLabel: { fontSize: 16, fontWeight: "500" },
  itemDescription: { fontSize: 13, opacity: 0.7 },

  footer: { paddingVertical: 24, alignItems: "center" },
  footerText: { fontSize: 12, opacity: 0.6 },

  themeBadgeSection: {
    marginTop: 12,
    paddingHorizontal: 8,
  },
  inlineLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 12,
    opacity: 0.7,
    textTransform: "uppercase",
  },
  inlineColorRow: {
    flexDirection: "row",
    gap: 16,
    paddingBottom: 8,
  },
  inlineColorCircle: {
    width: 36,
    height: 36,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inlineSelectedCircle: {
    borderWidth: 3,
    borderColor: "#FFF",
    transform: [{ scale: 1.1 }],
  },
});
