// utils/systemUI.ts

import * as NavigationBar from "expo-navigation-bar";
import { Platform } from "react-native";

export async function lockAndroidNavigationBar(
  _backgroundColor: string,
  isDark: boolean,
) {
  if (Platform.OS !== "android") return;

  await NavigationBar.setVisibilityAsync("visible");

  await NavigationBar.setButtonStyleAsync(isDark ? "light" : "dark");
}
