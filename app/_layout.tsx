import { Stack } from 'expo-router';
import 'react-native-reanimated';

import { UserProvider } from '@/context/UserContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from '../context/ThemeContext';

export default function RootLayout() {

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <UserProvider>
      <ThemeProvider>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
      </ThemeProvider>
    </UserProvider>
    </GestureHandlerRootView>
  );
}
