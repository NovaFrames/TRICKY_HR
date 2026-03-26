import Header, { HEADER_HEIGHT } from "@/components/Header";
import { useTheme } from "@/context/ThemeContext";
import { useUser } from "@/context/UserContext";
import ApiService from "@/services/ApiService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { WebView } from "react-native-webview";
import {
  LIVE_LOCATION_TASK_NAME,
  startLiveLocationTask,
  stopLiveLocationTask,
} from "@/services/liveLocationBackground";

type Coordinates = {
  latitude: number;
  longitude: number;
};

let MapViewComponent: any = null;
let MarkerComponent: any = null;

try {
  const maps = require("react-native-maps");
  MapViewComponent = maps.default;
  MarkerComponent = maps.Marker;
} catch (_e) {
  MapViewComponent = null;
  MarkerComponent = null;
}

const parseCoordinate = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const LOCATION_REFRESH_MS = 10000;
const LOCATION_FETCH_TIMEOUT_MS = 6000;

export default function OfficerLocationScreen() {
  const { theme } = useTheme();
  const { user } = useUser();

  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [employeeName, setEmployeeName] = useState("Employee Location");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const inFlightRef = useRef(false);
  const updateInFlightRef = useRef(false);
  const syncInFlightRef = useRef(false);
  const restartBackgroundRef = useRef(false);
  const mountedRef = useRef(true);

  const token = (user?.TokenC || user?.Token || "").trim();
  const empId = Number(user?.EmpIdN ?? 0);

  const loadLocation = useCallback(async (options?: { initial?: boolean }) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    const isInitial = !!options?.initial;

    if (isInitial) {
      if (mountedRef.current) setLoading(true);
    } else {
      if (mountedRef.current) setUpdating(true);
    }

    try {
      const res = await ApiService.getLiveLocation(token, empId, new Date());
      const latest = res?.data?.data?.[0];

      if (!latest) return;

      const nameFromApi =
        typeof latest.EmpNameC === "string" && latest.EmpNameC.trim()
          ? latest.EmpNameC.trim()
          : null;
      const fallbackName =
        typeof user?.NameC === "string" && user.NameC.trim()
          ? user.NameC.trim()
          : "Employee Location";
      const nextName = nameFromApi || fallbackName;

      const latitude =
        parseCoordinate(latest.LatC) ??
        parseCoordinate(latest.LatN) ??
        parseCoordinate(latest.Latitude);
      const longitude =
        parseCoordinate(latest.LonC) ??
        parseCoordinate(latest.LonN) ??
        parseCoordinate(latest.Longitude);

      if (latitude !== null && longitude !== null) {
        if (mountedRef.current) {
          setCoords({ latitude, longitude });
          setEmployeeName(nextName);
        }
      }
    } catch (error) {
      console.log("Location fetch error:", error);
    } finally {
      inFlightRef.current = false;
      if (isInitial) {
        if (mountedRef.current) setLoading(false);
      } else {
        if (mountedRef.current) setUpdating(false);
      }
    }
  }, [empId, token, user?.NameC]);

  const updateMyLocation = useCallback(async (): Promise<boolean> => {
    if (updateInFlightRef.current) return false;
    if (!token || !empId) return false;

    updateInFlightRef.current = true;
    try {
      const permission = await Location.getForegroundPermissionsAsync();
      if (permission.status !== "granted") return false;

      const lastKnown = await Location.getLastKnownPositionAsync({
        maxAge: 15000,
      });

      const current =
        lastKnown ??
        (await Promise.race([
          Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          }),
          new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error("Location fetch timeout")),
              LOCATION_FETCH_TIMEOUT_MS,
            ),
          ),
        ]));

      await ApiService.updateLiveLocation(
        token,
        empId,
        current.coords.latitude,
        current.coords.longitude,
      );
      return true;
    } catch (error) {
      console.log("Update my location error:", error);
      return false;
    } finally {
      updateInFlightRef.current = false;
    }
  }, [empId, token]);

  useEffect(() => {
    mountedRef.current = true;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const syncLocationCycle = async (options?: { initial?: boolean }) => {
      if (syncInFlightRef.current) return;
      syncInFlightRef.current = true;
      try {
        const enabled =
          (await AsyncStorage.getItem("live_location_enabled")) === "true";

        if (!enabled) {
          await loadLocation(options);
          return;
        }

        await updateMyLocation();
        await loadLocation(options);
      } finally {
        syncInFlightRef.current = false;
      }
    };

    void syncLocationCycle({ initial: true });
    intervalId = setInterval(() => {
      void syncLocationCycle();
    }, LOCATION_REFRESH_MS);

    return () => {
      mountedRef.current = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [loadLocation, updateMyLocation]);

  useEffect(() => {
    let cancelled = false;

    const pauseBackgroundWhileOnScreen = async () => {
      const enabled = (await AsyncStorage.getItem("live_location_enabled")) === "true";
      if (!enabled) return;

      const running = await Location.hasStartedLocationUpdatesAsync(
        LIVE_LOCATION_TASK_NAME,
      );
      if (running) {
        await stopLiveLocationTask();
        if (!cancelled) {
          restartBackgroundRef.current = true;
        }
      }
    };

    void pauseBackgroundWhileOnScreen();

    return () => {
      cancelled = true;
      if (restartBackgroundRef.current) {
        restartBackgroundRef.current = false;
        void startLiveLocationTask();
      }
    };
  }, []);

  const region = useMemo(() => {
    if (!coords) return null;
    return {
      latitude: coords.latitude,
      longitude: coords.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }, [coords]);

  const fallbackMapUrl = useMemo(() => {
    if (!coords) return "";
    const label = encodeURIComponent(employeeName);
    return `https://maps.google.com/maps?q=loc:${coords.latitude},${coords.longitude}(${label})&z=16&output=embed`;
  }, [coords, employeeName]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header title="Location" />

      <View style={styles.body}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.messageText, { color: theme.placeholder }]}>Loading location...</Text>
          </View>
        ) : !coords || !region ? (
          <View style={styles.center}>
            <Text style={[styles.messageText, { color: theme.placeholder }]}>Location not found</Text>
          </View>
        ) : (
          <View style={[styles.mapCard, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.coordinateBar}>
              <Text style={[styles.coordinateText, { color: theme.text }]}>
                {coords.latitude.toFixed(6)}, {coords.longitude.toFixed(6)}
              </Text>
              {updating ? (
                <Text style={[styles.updatingText, { color: theme.placeholder }]}>
                  Updating...
                </Text>
              ) : null}
            </View>

            <View style={styles.mapHolder}>
              {MapViewComponent && MarkerComponent ? (
                <MapView style={styles.map} region={region}>
                  <Marker
                    coordinate={coords}
                    anchor={{ x: 0.5, y: 0.9 }} // 👈 adjust anchor
                    tracksViewChanges={true}
                    title={employeeName}
                  >
                  </Marker>
                </MapView>
              ) : (
                <WebView
                  source={{ uri: fallbackMapUrl }}
                  style={styles.map}
                  originWhitelist={["*"]}
                  javaScriptEnabled
                  domStorageEnabled
                />
              )}
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  body: {
    flex: 1,
    paddingTop: HEADER_HEIGHT + 6,
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  messageText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "500",
  },
  mapCard: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  coordinateBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  coordinateText: {
    fontSize: 13,
    fontWeight: "600",
  },
  updatingText: {
    fontSize: 12,
    fontWeight: "500",
  },
  mapHolder: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});
