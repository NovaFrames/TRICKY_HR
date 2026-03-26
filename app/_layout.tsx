import { ConfirmModalProvider } from "@/components/common/ConfirmModal";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import { ModalManagerProvider } from "@/components/common/ModalManager";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { UserProvider, useUser } from "@/context/UserContext";
import "@/services/liveLocationBackground";
import {
  clearLiveLocationCredentials,
  saveLiveLocationCredentials,
  startLiveLocationTask,
  stopLiveLocationTask,
} from "@/services/liveLocationBackground";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Sentry from '@sentry/react-native';
import * as NavigationBar from "expo-navigation-bar";
import {
  SplashScreen,
  Stack,
  useFocusEffect,
  usePathname,
  useRouter,
} from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

Sentry.init({
  dsn: 'https://7221addf6e9fac21ebdc89d25cea4d5e@o4510939901853696.ingest.de.sentry.io/4510939907358800',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

SplashScreen.preventAutoHideAsync();

/* ---------------- ROOT ---------------- */

export default Sentry.wrap(function RootLayout() {
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
});

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
    NavigationBar.setButtonStyleAsync(isDark ? "light" : "dark");
  }, [isDark, theme.background]);

  useFocusEffect(() => {
    NavigationBar.setButtonStyleAsync(isDark ? "light" : "dark");
  });

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

    let cancelled = false;

    const syncLiveLocationTracking = async () => {
      const enabled = (await AsyncStorage.getItem("live_location_enabled")) === "true";

      if (!enabled || !isAuthenticated) {
        await stopLiveLocationTask();
        await clearLiveLocationCredentials();
        return;
      }

      const token = (user?.TokenC || user?.Token || "").trim();
      const empId = Number(user?.EmpIdN ?? 0);

      if (!token || !empId) {
        await stopLiveLocationTask();
        await clearLiveLocationCredentials();
        return;
      }

      await saveLiveLocationCredentials(token, empId);
      const started = await startLiveLocationTask();

      if (!started && !cancelled) {
        await AsyncStorage.setItem("live_location_enabled", "false");
        await stopLiveLocationTask();
        await clearLiveLocationCredentials();
      }
    };

    void syncLiveLocationTracking();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isLoading, user?.EmpIdN, user?.Token, user?.TokenC]);

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
