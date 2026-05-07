import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import ApiService from "./ApiService";

export const LIVE_LOCATION_TASK_NAME = "trickyhr-live-location-task";
const LIVE_LOCATION_TOKEN_KEY = "live_location_token";
const LIVE_LOCATION_EMP_ID_KEY = "live_location_emp_id";
const LIVE_LOCATION_INTERVAL_KEY = "live_location_interval";

type TaskData = {
  locations?: Array<{
    coords?: { latitude?: number; longitude?: number };
  }>;
};

if (!TaskManager.isTaskDefined(LIVE_LOCATION_TASK_NAME)) {
  TaskManager.defineTask(LIVE_LOCATION_TASK_NAME, async ({ data, error }) => {
    if (error) {
      console.error("Live location background task error:", error);
      return;
    }

    try {
      const payload = data as TaskData | undefined;
      const latest = payload?.locations?.[payload.locations.length - 1];

      console.log(
        `[Background Service] Task triggered. Location count: ${payload?.locations?.length ?? 0}`,
      );

      const latitude = latest?.coords?.latitude;
      const longitude = latest?.coords?.longitude;

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

      const token = (await AsyncStorage.getItem(LIVE_LOCATION_TOKEN_KEY)) || "";
      const empIdValue = await AsyncStorage.getItem(LIVE_LOCATION_EMP_ID_KEY);
      const empId = Number(empIdValue ?? 0);

      if (!token || !empId) return;

      await ApiService.updateLiveLocation(token, empId, latitude!, longitude!);
    } catch (taskError) {
      console.error("Live location background task failed:", taskError);
    }
  });
}

export const saveLiveLocationCredentials = async (
  token: string,
  empId: number,
  intervalSeconds?: number,
) => {
  await AsyncStorage.setItem(LIVE_LOCATION_TOKEN_KEY, token);
  await AsyncStorage.setItem(LIVE_LOCATION_EMP_ID_KEY, String(empId));
  if (intervalSeconds !== undefined) {
    await AsyncStorage.setItem(
      LIVE_LOCATION_INTERVAL_KEY,
      String(intervalSeconds),
    );
  }
};

export const clearLiveLocationCredentials = async () => {
  await AsyncStorage.multiRemove([
    LIVE_LOCATION_TOKEN_KEY,
    LIVE_LOCATION_EMP_ID_KEY,
    LIVE_LOCATION_INTERVAL_KEY,
  ]);
};

export const stopLiveLocationTask = async () => {
  const started = await Location.hasStartedLocationUpdatesAsync(
    LIVE_LOCATION_TASK_NAME,
  );
  if (started) {
    await Location.stopLocationUpdatesAsync(LIVE_LOCATION_TASK_NAME);
  }
};

export const startLiveLocationTask = async (
  liveDuration?: number,
): Promise<boolean> => {
  const foreground = await Location.getForegroundPermissionsAsync();
  let foregroundStatus = foreground.status;

  const DEFAULT_INTERVAL_MS = (liveDuration ?? 30) * 1000;

  if (foregroundStatus !== "granted") {
    const requestedForeground =
      await Location.requestForegroundPermissionsAsync();
    foregroundStatus = requestedForeground.status;
  }

  if (foregroundStatus !== "granted") return false;

  const background = await Location.getBackgroundPermissionsAsync();
  let backgroundStatus = background.status;

  if (backgroundStatus !== "granted") {
    const requestedBackground =
      await Location.requestBackgroundPermissionsAsync();
    backgroundStatus = requestedBackground.status;
  }

  if (backgroundStatus !== "granted") return false;

  const started = await Location.hasStartedLocationUpdatesAsync(
    LIVE_LOCATION_TASK_NAME,
  );

  const intervalValue = await AsyncStorage.getItem(LIVE_LOCATION_INTERVAL_KEY);
  const intervalMs = intervalValue
    ? Number(intervalValue) * 1000
    : DEFAULT_INTERVAL_MS;

  // Prevent redundant restarts which reset the update timer
  if (started) {
    console.log(
      `[LiveLocation] Task already running at ${intervalMs}ms interval.`,
    );
    return true;
  }

  console.log(
    `[LiveLocation] Initializing background task. Interval: ${intervalMs}ms`,
  );

  await Location.startLocationUpdatesAsync(LIVE_LOCATION_TASK_NAME, {
    accuracy: Location.Accuracy.High,
    activityType: Location.ActivityType.Other,
    deferredUpdatesDistance: 0,
    timeInterval: intervalMs,
    deferredUpdatesInterval: 0,
    distanceInterval: 0,
    pausesUpdatesAutomatically: false,
    mayShowUserSettingsDialog: true,
    foregroundService: {
      notificationTitle: "TrickyHr Live Location",
      notificationBody: "Live location sharing is active.",
      notificationColor: "#e46a23",
      killServiceOnDestroy: false,
    },
    showsBackgroundLocationIndicator: true,
  });

  return true;
};
