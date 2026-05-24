import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import ApiService from "./ApiService";

const LIVE_LOCATION_ENABLED_KEY = "live_location_enabled";
const LIVE_LOCATION_TOKEN_KEY = "live_location_token";
const LIVE_LOCATION_EMP_ID_KEY = "live_location_emp_id";
const LIVE_LOCATION_INTERVAL_KEY = "live_location_interval";
const LIVE_LOCATION_LAST_SENT_AT_KEY = "live_location_last_sent_at";

let locationSubscription: Location.LocationSubscription | null = null;
let isSendingLocation = false;

const normalizeIntervalMinutes = (rawValue?: number | string | null) => {
  const numericValue = Number(rawValue ?? 0);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return 30;
  }

  if (numericValue >= 1000) {
    return Math.max(Math.round(numericValue / 60000), 1);
  }

  return Math.max(Math.round(numericValue), 1);
};

const sendCurrentLocation = async (location: Location.LocationObject) => {
  if (isSendingLocation) return;

  try {
    isSendingLocation = true;

    const latitude = location.coords.latitude;
    const longitude = location.coords.longitude;

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

    const token = (await AsyncStorage.getItem(LIVE_LOCATION_TOKEN_KEY)) || "";
    const empIdValue = await AsyncStorage.getItem(LIVE_LOCATION_EMP_ID_KEY);
    const empId = Number(empIdValue ?? 0);

    if (!token || !empId) return;

    const intervalValue = await AsyncStorage.getItem(LIVE_LOCATION_INTERVAL_KEY);
    const intervalMinutes = normalizeIntervalMinutes(intervalValue);
    const intervalMs = intervalMinutes * 60 * 1000;
    const lastSentAtValue = await AsyncStorage.getItem(
      LIVE_LOCATION_LAST_SENT_AT_KEY,
    );
    const lastSentAt = Number(lastSentAtValue ?? 0);
    const now = Date.now();

    if (
      Number.isFinite(lastSentAt) &&
      lastSentAt > 0 &&
      now - lastSentAt < intervalMs
    ) {
      return;
    }

    const result = await ApiService.updateLiveLocation(
      token,
      empId,
      latitude,
      longitude,
    );

    if (result.success) {
      await AsyncStorage.setItem(LIVE_LOCATION_LAST_SENT_AT_KEY, String(now));
    }
  } catch (error) {
    console.error("Live location update failed:", error);
  } finally {
    isSendingLocation = false;
  }
};

export const saveForegroundLocationCredentials = async (
  token: string,
  empId: number,
  intervalMinutes?: number,
) => {
  await AsyncStorage.setItem(LIVE_LOCATION_TOKEN_KEY, token);
  await AsyncStorage.setItem(LIVE_LOCATION_EMP_ID_KEY, String(empId));

  if (intervalMinutes !== undefined) {
    await AsyncStorage.setItem(
      LIVE_LOCATION_INTERVAL_KEY,
      String(normalizeIntervalMinutes(intervalMinutes)),
    );
  }
};

export const isForegroundLocationSharingEnabled = async () =>
  (await AsyncStorage.getItem(LIVE_LOCATION_ENABLED_KEY)) === "true";

export const setForegroundLocationSharingEnabled = async (enabled: boolean) => {
  await AsyncStorage.setItem(LIVE_LOCATION_ENABLED_KEY, enabled ? "true" : "false");
};

export const pauseForegroundLocationSharing = () => {
  locationSubscription?.remove();
  locationSubscription = null;
};

export const clearForegroundLocationSharing = async () => {
  pauseForegroundLocationSharing();

  await AsyncStorage.multiRemove([
    LIVE_LOCATION_TOKEN_KEY,
    LIVE_LOCATION_EMP_ID_KEY,
    LIVE_LOCATION_INTERVAL_KEY,
    LIVE_LOCATION_LAST_SENT_AT_KEY,
  ]);
};

export const startForegroundLocationSharing = async (
  intervalMinutes?: number,
): Promise<boolean> => {
  const foreground = await Location.getForegroundPermissionsAsync();
  let foregroundStatus = foreground.status;

  if (foregroundStatus !== "granted") {
    const requestedForeground =
      await Location.requestForegroundPermissionsAsync();
    foregroundStatus = requestedForeground.status;
  }

  if (foregroundStatus !== "granted") return false;

  pauseForegroundLocationSharing();

  const normalizedIntervalMinutes = normalizeIntervalMinutes(intervalMinutes);
  const intervalMs = normalizedIntervalMinutes * 60 * 1000;

  const initialLocation = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  await sendCurrentLocation(initialLocation);

  locationSubscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.Balanced,
      distanceInterval: 0,
      mayShowUserSettingsDialog: true,
      timeInterval: intervalMs,
    },
    sendCurrentLocation,
  );

  return true;
};

