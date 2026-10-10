import { ConfirmModalProvider } from "@/components/common/ConfirmModal";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import { ModalManagerProvider } from "@/components/common/ModalManager";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { UserProvider, useUser } from "@/context/UserContext";
import {
  clearForegroundLocationSharing,
  isForegroundLocationSharingEnabled,
  pauseForegroundLocationSharing,
  saveForegroundLocationCredentials,
  startForegroundLocationSharing,
} from "@/services/liveLocationForeground";
import * as Location from "expo-location";
import * as NavigationBar from "expo-navigation-bar";
import {
  SplashScreen,
  Stack,
  useFocusEffect,
  usePathname,
  useRouter,
} from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef } from "react";
import { AppState, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

SplashScreen.preventAutoHideAsync();

/* ---------------- ROOT ---------------- */

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ModalManagerProvider>
          <ConfirmModalProvider>
            <UserProvider>
              <RootNavigator />
            </UserProvider>
          </ConfirmModalProvider>
        </ModalManagerProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

/* ---------------- NAVIGATION ---------------- */

function RootNavigator() {
  const hidden = useRef(false);
  const router = useRouter();
  const pathname = usePathname();
  const { theme, isDark } = useTheme();

  const { user, isLoading } = useUser();
  const isAuthenticated = !!user;

  // console.log("Authenticated: ", isAuthenticated);
  // console.log("Current Pathname: ", pathname);

  useEffect(() => {
    if (!isLoading && !hidden.current) {
      hidden.current = true;

      requestAnimationFrame(() => {
        SplashScreen.hideAsync();
      });
    }
  }, [isLoading]);

  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setButtonStyleAsync(
        isDark ? "light" : "dark"
      );
    }
  }, [isDark]);

  useFocusEffect(
    React.useCallback(() => {
      if (Platform.OS === "android") {
        NavigationBar.setButtonStyleAsync(
          isDark ? "light" : "dark"
        );
      }
    }, [isDark])
  );

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated && pathname === "/") {
      router.replace("/auth/login");
    }

    if (isAuthenticated && pathname.startsWith("/auth")) {
      router.replace("/(tabs)/dashboard");
    }
  }, [isAuthenticated, isLoading, pathname]);

  useEffect(() => {
    if (isLoading) return;

    const syncForegroundLocationSharing = async () => {
      if (!isAuthenticated) {
        await clearForegroundLocationSharing();
        return;
      }

      if (AppState.currentState !== "active") {
        pauseForegroundLocationSharing();
        return;
      }

      const enabled = await isForegroundLocationSharingEnabled();
      if (!enabled) {
        pauseForegroundLocationSharing();
        return;
      }

      const foreground = await Location.getForegroundPermissionsAsync();
      if (foreground.status !== "granted") {
        return;
      }

      const token = (user?.TokenC || user?.Token || "").trim();
      const empId = Number(user?.EmpIdN ?? 0);
      const interval = Number(user?.LiveDurN ?? 0);

      if (!token || !empId) return;

      await saveForegroundLocationCredentials(
        token,
        empId,
        interval > 0 ? interval : undefined,
      );

      await startForegroundLocationSharing(
        interval > 0 ? interval : undefined,
      );
    };

    void syncForegroundLocationSharing();

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void syncForegroundLocationSharing();
        return;
      }

      pauseForegroundLocationSharing();
    });

    return () => {
      subscription.remove();
      pauseForegroundLocationSharing();
    };
  }, [
    isAuthenticated,
    isLoading,
    user?.EmpIdN,
    user?.LiveDurN,
    user?.Token,
    user?.TokenC,
  ]);

  if (isLoading) return null;

  return (
    <GestureHandlerRootView
      style={{ flex: 1, backgroundColor: theme.background }}
    >
      <StatusBar style={isDark ? "light" : "dark"} />

      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: theme.background,
        }}
      >
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="auth/login" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
