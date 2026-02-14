// utils/systemUI.ts
import * as NavigationBar from "expo-navigation-bar";

export async function lockAndroidNavigationBar(
  _backgroundColor: string,
  isDark: boolean,
) {
  await NavigationBar.setVisibilityAsync("visible");
  // In edge-to-edge mode, background color APIs are not supported.
  // Keep icons readable; app background is handled by root container styles.

  await NavigationBar.setButtonStyleAsync(isDark ? "light" : "dark");
}
