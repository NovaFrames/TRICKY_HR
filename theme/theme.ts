// Theme Colors
export const lightTheme = {
  mode: "light",
  primary: "#e46a23",
  secondary: "#115E59",
  background: "#FFFFFF",
  text: "#1F2937", // Slightly softer black
  textLight: "#6B7280",
  inputBg: "#F3F4F6", // Light gray for inputs
  inputBorder: "#E5E7EB",
  placeholder: "#9CA3AF",
  icon: "#6B7280",
  cardBackground: "#FFFFFF",
  error: "#d90000",
  success: "#07b907",
};

export const darkTheme = {
  mode: "dark",
  primary: "#e46a23",
  secondary: "#38BDF8",
  background: "#0B0E14",
  text: "#F8FAFC",
  textLight: "#94A3B8",
  inputBg: "#1C222D",
  inputBorder: "#2A3342",
  placeholder: "#475569",
  icon: "#94A3B8",
  cardBackground: "#151921",
  error: "#d90000",
  success: "#07b907",
};

export type ThemeType = typeof lightTheme;
