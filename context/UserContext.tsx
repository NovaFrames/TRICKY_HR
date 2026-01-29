import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import ApiService, { setBaseUrl } from "@/services/ApiService";

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
  isUserReady: boolean;
}

const UserContext = createContext<UserContextType>({
  user: null,
  setUser: async () => {},
  logout: async () => {},
  isLoading: true,
  isUserReady: false,
});

export const useUser = () => useContext(UserContext);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUserState] = useState<UserData | null>(null);
  const [isUserReady, setIsUserReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("user_data");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUserState(parsedUser);
        if (parsedUser?.domain_url) {
          setBaseUrl(parsedUser.domain_url);
        }
        await ApiService.refreshCredentials();
        setIsUserReady(true);
      }
    } catch (error) {
      console.error("Failed to load user", error);
    } finally {
      setIsLoading(false);
    }
  };

  const setUser = async (userData: UserData) => {
    setUserState(userData);
    setIsUserReady(true);

    try {
      await AsyncStorage.setItem("user_data", JSON.stringify(userData));

      // 🔥 Save domain_url separately for Axios
      if (userData.domain_url) {
        await AsyncStorage.setItem("domain_url", userData.domain_url);
      }

      if (userData.domain_id) {
        await AsyncStorage.setItem("domain_id", userData.domain_id);
      }
    } catch (error) {
      console.error("Failed to save user", error);
    }
  };

  const logout = async () => {
    setUserState(null);
    setIsUserReady(false);
    setIsLoading(false);

    try {
      await AsyncStorage.multiRemove(["user_data", "auth_token", "emp_id"]);
    } catch (error) {
      console.error("Failed to logout", error);
    }
  };

  return (
    <UserContext.Provider
      value={{ user, setUser, logout, isLoading, isUserReady }}
    >
      {children}
    </UserContext.Provider>
  );
};
