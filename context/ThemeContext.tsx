import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Appearance } from "react-native";
import { darkTheme, lightTheme, ThemeType } from "../theme/theme";

interface ThemeContextType {
  theme: ThemeType;
  isDark: boolean;
  toggleTheme: () => void;
  setPrimaryColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: lightTheme,
  isDark: false,
  toggleTheme: () => {},
  setPrimaryColor: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const initialIsDark = Appearance.getColorScheme() === "dark";
  const [isDark, setIsDark] = useState(initialIsDark);
  const [primaryColor, setPrimaryColorState] = useState("#e46a23");
  const [userOverride, setUserOverride] = useState<boolean | null>(null);

  /** Load stored preferences */
  useEffect(() => {
    void loadPreferences();
  }, []);

  // Listen to system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (userOverride === null) {
        setIsDark(colorScheme === "dark");
      }
    });

    return () => subscription.remove();
  }, [userOverride]);

  const loadPreferences = async () => {
    try {
      const storedTheme = await AsyncStorage.getItem("theme_preference");
      const storedColor = await AsyncStorage.getItem("theme_primary_color");

      if (storedTheme === "dark" || storedTheme === "light") {
        setIsDark(storedTheme === "dark");
        setUserOverride(true); // user manually chose
      } else {
        // No stored preference → follow system
        const systemTheme = Appearance.getColorScheme();
        setIsDark(systemTheme === "dark");
      }

      if (storedColor) {
        setPrimaryColorState(storedColor);
      }
    } catch (e) {
      console.error("Theme load error", e);
    }
  };

  /** Manual toggle overrides system */
  const toggleTheme = async () => {
    const newMode = !isDark;
    setIsDark(newMode);
    setUserOverride(true);

    try {
      await AsyncStorage.setItem(
        "theme_preference",
        newMode ? "dark" : "light",
      );
    } catch (e) {
      console.error("Theme save error", e);
    }
  };

  const setPrimaryColor = async (color: string) => {
    setPrimaryColorState(color);
    try {
      await AsyncStorage.setItem("theme_primary_color", color);
    } catch (e) {
      console.error("Primary color save error", e);
    }
  };

  const baseTheme = isDark ? darkTheme : lightTheme;
  const theme = { ...baseTheme, primary: primaryColor };

  return (
    <ThemeContext.Provider
      value={{ theme, isDark, toggleTheme, setPrimaryColor }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
