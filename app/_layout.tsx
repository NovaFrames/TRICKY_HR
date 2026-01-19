import { UserProvider, useUser } from '@/context/UserContext';
import { SplashScreen, Stack } from 'expo-router';
import { useEffect, useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const { user, isLoading } = useUser();
  const isAuthenticated = !!user;
  console.log('isAuthenticated: ', isAuthenticated)

  useEffect(() => {
    if (!isLoading && !hidden.current) {
      hidden.current = true;
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  if (isLoading) return null; // keep splash visible

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          {!isAuthenticated ? (
            <Stack.Screen name="auth/login" />   // ✅ CORRECT
          ) : (
            <Stack.Screen name="(tabs)" /> // ✅ CORRECT
          )}
        </Stack>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
