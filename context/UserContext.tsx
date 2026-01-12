import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

export interface UserData {
    domain_url: string;
    domain_id: string;
    [key: string]: any;
}

interface UserContextType {
    user: UserData | null;
    setUser: (user: UserData) => Promise<void>;
    logout: () => Promise<void>;
    isLoading: boolean;
}

const UserContext = createContext<UserContextType>({
    user: null,
    setUser: async () => { },
    logout: async () => { },
    isLoading: true,
});

export const useUser = () => useContext(UserContext);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUserState] = useState<UserData | null>(null);
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

    const setUser = async (userData: UserData) => {
        setUserState(userData);

        try {
            await AsyncStorage.setItem('user_data', JSON.stringify(userData));

            // 🔥 Save domain_url separately for Axios
            if (userData.domain_url) {
                await AsyncStorage.setItem('domain_url', userData.domain_url);
            }

            if (userData.domain_id) {
                await AsyncStorage.setItem('domain_id', userData.domain_id);
            }
        } catch (error) {
            console.error('Failed to save user', error);
        }
    };

    const logout = async () => {
        setUserState(null);

        try {
            await AsyncStorage.multiRemove([
                'user_data',
                'domain_url',
                'auth_token',
                'emp_id',
                'domain_id',
            ]);
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
