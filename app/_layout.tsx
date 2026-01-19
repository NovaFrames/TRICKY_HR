import { UserProvider, useUser } from "@/context/UserContext";
import { SplashScreen, Stack, usePathname, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

SplashScreen.preventAutoHideAsync();

/* ---------------- ROOT ---------------- */

export default function RootLayout() {
  return (
    <UserProvider>
      <RootNavigator />
    </UserProvider>
  );
}

/* ---------------- NAVIGATION ---------------- */

function RootNavigator() {
  const hidden = useRef(false);
  const router = useRouter();
  const pathname = usePathname();

  const { user, isLoading } = useUser();
  const isAuthenticated = !!user;

  console.log("Authenticated: ", isAuthenticated);
  console.log("Current Pathname: ", pathname);

  useEffect(() => {
    if (!isLoading && !hidden.current) {
      hidden.current = true;
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="auth/login" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
