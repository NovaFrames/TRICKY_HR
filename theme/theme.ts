// Theme Colors
export const lightTheme = {
    mode: 'light',
    primary: '#e46a23',
    secondary: '#115E59',
    background: '#FFFFFF',
    text: '#1F2937', // Slightly softer black
    textLight: '#6B7280',
    inputBg: '#F3F4F6', // Light gray for inputs
    inputBorder: '#E5E7EB',
    placeholder: '#9CA3AF',
    icon: '#6B7280',
    cardBackground: '#FFFFFF',
};

export const darkTheme = {
    mode: 'dark',
    primary: '#e46a23',
    secondary: '#ccfbf1',
    background: '#130b1dff',
    text: '#f0fdfa',
    textLight: '#94a3b8',
    inputBg: '#1e293b',
    inputBorder: '#334155',
    placeholder: '#64748b',
    icon: '#64748b',
    cardBackground: '#0f172a',
};

export type ThemeType = typeof lightTheme;