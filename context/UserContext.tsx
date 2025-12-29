import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface UserContextType {
    user: any;
    setUser: (user: any) => void;
    logout: () => void;
    isLoading: boolean;
}

const UserContext = createContext<UserContextType>({
    user: null,
    setUser: () => { },
    logout: () => { },
    isLoading: true,
});

export const useUser = () => useContext(UserContext);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUserState] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const storedUser = await AsyncStorage.getItem('user_data');
            if (storedUser) {
                setUserState(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error('Failed to load user', error);
        } finally {
            setIsLoading(false);
        }
    };

    const setUser = async (userData: any) => {
        setUserState(userData);
        try {
            await AsyncStorage.setItem('user_data', JSON.stringify(userData));
        } catch (error) {
            console.error('Failed to save user', error);
        }
    };

    const logout = async () => {
        setUserState(null);
        try {
            await AsyncStorage.removeItem('user_data');
        } catch (error) {
            console.error('Failed to logout', error);
        }
    };

    return (
        <UserContext.Provider value={{ user, setUser, logout, isLoading }}>
            {children}
        </UserContext.Provider>
    );
};
