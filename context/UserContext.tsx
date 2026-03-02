import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import React, { createContext, useContext, useEffect, useState } from "react";
import ApiService, { refreshLoginUser, setBaseUrl } from "@/services/ApiService";

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
    void bootstrap();
  }, []);

  const getAppStorageVersion = () => {
    const expoConfig = Constants.expoConfig ?? (Constants as any).manifest;
    const version = expoConfig?.version ?? Constants.nativeAppVersion ?? "0";
    const build =
      expoConfig?.ios?.buildNumber ??
      expoConfig?.android?.versionCode ??
      Constants.nativeBuildVersion ??
      "0";
    return `${version}(${build})`;
  };

  const ensureStorageVersion = async () => {
    const versionKey = "__app_storage_version";
    try {
      const currentVersion = getAppStorageVersion();
      const storedVersion = await AsyncStorage.getItem(versionKey);

      if (storedVersion !== currentVersion) {
        // Clear stale cache from previous app installs/updates.
        await AsyncStorage.clear();
        await AsyncStorage.setItem(versionKey, currentVersion);
      }
    } catch (error) {
      console.error("Failed to validate storage version", error);
    }
  };

  const bootstrap = async () => {
    await ensureStorageVersion();
    await loadUser();
  };

  const loadUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("user_data");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUserState(parsedUser);
          const domainUrl =
            parsedUser?.domain_url ||
            (await AsyncStorage.getItem("domain_url")) ||
            (await AsyncStorage.getItem("_domain")) ||
            "";
          const normalizedDomain = String(domainUrl || "").trim();

          if (normalizedDomain) {
            await setBaseUrl(normalizedDomain);
          }
          await ApiService.refreshCredentials();

          const authToken = (await AsyncStorage.getItem("auth_token"))?.trim();
          const empId = (await AsyncStorage.getItem("emp_id"))?.trim();
          const domainId =
            String(
              parsedUser?.domain_id ?? (await AsyncStorage.getItem("domain_id")) ?? "",
            ).trim() || undefined;

          if (authToken && empId && normalizedDomain) {
            try {
              const refreshRes = await refreshLoginUser(
                authToken,
                empId,
                normalizedDomain,
                domainId,
              );
              const latestData = refreshRes?.data?.data ?? refreshRes?.data;

              if (latestData && typeof latestData === "object") {
                const freshUser = {
                  ...parsedUser,
                  ...latestData,
                  TokenC: latestData?.TokenC ?? authToken,
                  EmpIdN: Number(latestData?.EmpIdN ?? empId),
                  domain_url: normalizedDomain,
                  domain_id: domainId ?? latestData?.domain_id ?? "",
                };
                setUserState(freshUser);
                await AsyncStorage.setItem("user_data", JSON.stringify(freshUser));
              }
            } catch (refreshError) {
              console.warn("Auto-login user refresh failed", refreshError);
            }
          }

          setIsUserReady(true);
        } catch (parseError) {
          console.error("Invalid user cache, clearing", parseError);
          await AsyncStorage.removeItem("user_data");
        }
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

      if (userData.domain_url) {
        await setBaseUrl(userData.domain_url);
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
