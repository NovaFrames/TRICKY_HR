import { ConfirmModalProvider } from "@/components/common/ConfirmModal";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import { ModalManagerProvider } from "@/components/common/ModalManager";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { UserProvider, useUser } from "@/context/UserContext";
import { LinearGradient } from "expo-linear-gradient";
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
import { Platform, View } from "react-native";
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
          alignItems: Platform.OS === "web" ? "center" : undefined,
        }}
      >
        {Platform.OS === "web" && (
          <View style={styles.webBgLayer} pointerEvents="none">
            <LinearGradient
              colors={isDark ? ["#0B1220", "#111A2A"] : ["#F7F9FC", "#EEF2F7"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.webBgGradient}
            />
            <View
              style={[
                styles.bgOrb,
                styles.bgOrbTop,
                { backgroundColor: isDark ? "rgba(99,102,241,0.10)" : "rgba(99,102,241,0.14)" },
              ]}
            />
            <View
              style={[
                styles.bgOrb,
                styles.bgOrbBottom,
                { backgroundColor: isDark ? "rgba(16,185,129,0.10)" : "rgba(16,185,129,0.10)" },
              ]}
            />
          </View>
        )}
        <View
          style={{
            flex: 1,
            width: Platform.OS === "web" ? "70%" : "100%",
            maxWidth: Platform.OS === "web" ? 1400 : undefined,
          }}
        >
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="auth/login" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = {
  webBgLayer: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden" as const,
  },
  webBgGradient: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bgOrb: {
    position: "absolute" as const,
    borderRadius: 999,
  },
  bgOrbTop: {
    width: 460,
    height: 460,
    top: -140,
    right: -110,
  },
  bgOrbBottom: {
    width: 520,
    height: 520,
    left: -180,
    bottom: -220,
  },
};
