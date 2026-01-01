import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { darkTheme, lightTheme, ThemeType } from '../theme/theme';

interface ThemeContextType {
    theme: ThemeType;
    isDark: boolean;
    toggleTheme: () => void;
    setPrimaryColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: lightTheme,
    isDark: false,
    toggleTheme: () => { },
    setPrimaryColor: () => { },
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isDark, setIsDark] = useState(false);
    const [primaryColor, setPrimaryColorState] = useState('#e46a23'); // Default color

    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            const storedTheme = await AsyncStorage.getItem('theme_preference');
            const storedColor = await AsyncStorage.getItem('theme_primary_color');

            if (storedTheme) {
                setIsDark(storedTheme === 'dark');
            }
            if (storedColor) {
                setPrimaryColorState(storedColor);
            }
        } catch (error) {
            console.error('Failed to load theme', error);
        }
    };

    const toggleTheme = async () => {
        const newMode = !isDark;
        setIsDark(newMode);
        try {
            await AsyncStorage.setItem('theme_preference', newMode ? 'dark' : 'light');
        } catch (error) {
            console.error('Failed to save theme', error);
        }
    };

    const setPrimaryColor = async (color: string) => {
        setPrimaryColorState(color);
        try {
            await AsyncStorage.setItem('theme_primary_color', color);
        } catch (error) {
            console.error('Failed to save primary color', error);
        }
    };

    const baseTheme = isDark ? darkTheme : lightTheme;
    const theme = { ...baseTheme, primary: primaryColor };

    return (
        <ThemeContext.Provider value={{ theme, isDark, toggleTheme, setPrimaryColor }}>
            {children}
        </ThemeContext.Provider>
    );
};
