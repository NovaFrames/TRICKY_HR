// liveLocationForeground.ts

import * as Location from "expo-location";
import ApiService from "./ApiService";

let locationInterval: ReturnType<typeof setInterval> | null = null;

export const startForegroundLiveLocation = async (
  token: string,
  empId: number,
  intervalMs: number = 30000,
) => {
  // stop existing
  if (locationInterval) {
    clearInterval(locationInterval);
  }

  const { status } = await Location.requestForegroundPermissionsAsync();

  if (status !== "granted") {
    console.log("Location permission denied");
    return;
  }

  // start interval
  locationInterval = setInterval(async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });

      const lat = location.coords.latitude;
      const lon = location.coords.longitude;

      console.log(
        "[FOREGROUND LOCATION]",
        lat,
        lon,
        new Date().toLocaleTimeString(),
      );

      await ApiService.updateLiveLocation(token, empId, lat, lon);
    } catch (error) {
      console.log("Foreground location error:", error);
    }
  }, intervalMs);
};

export const stopForegroundLiveLocation = () => {
  if (locationInterval) {
    clearInterval(locationInterval);
    locationInterval = null;
  }
};
