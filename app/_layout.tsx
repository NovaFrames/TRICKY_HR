import { Stack } from 'expo-router';
import 'react-native-reanimated';

import { UserProvider } from '@/context/UserContext';
import { ThemeProvider } from '../context/ThemeContext';

export default function RootLayout() {

  return (
    <UserProvider>
      <ThemeProvider>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
      </ThemeProvider>
    </UserProvider>
  );
}
