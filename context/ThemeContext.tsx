import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { darkTheme, lightTheme, ThemeType } from '../theme/theme';

interface ThemeContextType {
    theme: ThemeType;
    isDark: boolean;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: lightTheme,
    isDark: false,
    toggleTheme: () => { },
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const systemScheme = useColorScheme();
    const [isDark, setIsDark] = useState(systemScheme === 'dark');

    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            const storedTheme = await AsyncStorage.getItem('theme_preference');
            if (storedTheme) {
                setIsDark(storedTheme === 'dark');
            } else {
                setIsDark(systemScheme === 'dark');
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

    const theme = isDark ? darkTheme : lightTheme;

    return (
        <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
