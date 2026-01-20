// utils/systemUI.ts
import * as NavigationBar from "expo-navigation-bar";

export async function lockAndroidNavigationBar(
  backgroundColor: string,
  isDark: boolean,
) {
  await NavigationBar.setVisibilityAsync("visible");

  // ✅ THIS WORKS with or without edge-to-edge
  await NavigationBar.setBackgroundColorAsync(backgroundColor);

  await NavigationBar.setButtonStyleAsync(isDark ? "light" : "dark");
}
