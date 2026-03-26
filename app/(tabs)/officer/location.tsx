import Header, { HEADER_HEIGHT } from "@/components/Header";
import { useTheme } from "@/context/ThemeContext";
import { useUser } from "@/context/UserContext";
import ApiService from "@/services/ApiService";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";

type Coordinates = {
  latitude: number;
  longitude: number;
};

type LiveLocationRow = {
  EmpIdN?: number | string;
  EmpCodeC?: string;
  EmpNameC?: string;
  DateD?: string;
  LatC?: number | string;
  LatN?: number | string;
  Latitude?: number | string;
  LonC?: number | string;
  LonN?: number | string;
  Longitude?: number | string;
};

type EmployeeMarker = {
  empId: number;
  empCode: string;
  empName: string;
  dateD: string;
  coords: Coordinates;
};

let MapViewComponent: any = null;
let MarkerComponent: any = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const maps = require("react-native-maps");
  MapViewComponent = maps.default;
  MarkerComponent = maps.Marker;
} catch {
  MapViewComponent = null;
  MarkerComponent = null;
}

const LIVE_REFRESH_MS = 10000;

const parseCoordinate = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const parseDotNetDateMs = (value?: string) => {
  if (!value || typeof value !== "string") return 0;
  const match = value.match(/\/Date\((\d+)\)\//);
  if (!match) return 0;
  const ms = Number(match[1]);
  return Number.isFinite(ms) ? ms : 0;
};

const normalizeMarker = (row: LiveLocationRow): EmployeeMarker | null => {
  const empId = Number(row.EmpIdN ?? 0);
  if (!Number.isFinite(empId) || empId <= 0) return null;

  const latitude =
    parseCoordinate(row.LatC) ??
    parseCoordinate(row.LatN) ??
    parseCoordinate(row.Latitude);
  const longitude =
    parseCoordinate(row.LonC) ??
    parseCoordinate(row.LonN) ??
    parseCoordinate(row.Longitude);

  if (latitude === null || longitude === null) return null;

  return {
    empId,
    empCode:
      typeof row.EmpCodeC === "string" && row.EmpCodeC.trim()
        ? row.EmpCodeC.trim()
        : "",
    empName:
      typeof row.EmpNameC === "string" && row.EmpNameC.trim()
        ? row.EmpNameC.trim()
        : `Employee ${empId}`,
    dateD: typeof row.DateD === "string" ? row.DateD : "",
    coords: {
      latitude,
      longitude,
    },
  };
};

export default function OfficerLocationScreen() {
  const { theme } = useTheme();
  const { user } = useUser();

  const [markers, setMarkers] = useState<EmployeeMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const mountedRef = useRef(true);
  const inFlightRef = useRef(false);

  const token = (user?.TokenC || user?.Token || "").trim();

  const syncLocations = useCallback(
    async (options?: { initial?: boolean }) => {
      if (inFlightRef.current || !token) {
        if (options?.initial && mountedRef.current) setLoading(false);
        return;
      }

      inFlightRef.current = true;
      const initial = !!options?.initial;

      if (initial) {
        if (mountedRef.current) setLoading(true);
      } else {
        if (mountedRef.current) setRefreshing(true);
      }

      try {
        const requestDate = new Date();
        const response = await ApiService.getLiveLocation(token, 0, requestDate);
        const rows: LiveLocationRow[] = Array.isArray(response?.data?.data)
          ? response.data.data
          : [];

        const normalizedRows = rows
          .map((row) => normalizeMarker(row))
          .filter((row): row is EmployeeMarker => !!row);

        const latestByEmpId = new Map<number, EmployeeMarker>();
        for (const marker of normalizedRows) {
          const markerMs = parseDotNetDateMs(marker.dateD);
          if (!markerMs) continue;

          const existing = latestByEmpId.get(marker.empId);
          if (!existing) {
            latestByEmpId.set(marker.empId, marker);
            continue;
          }

          const existingMs = parseDotNetDateMs(existing.dateD);
          if (markerMs > existingMs) {
            latestByEmpId.set(marker.empId, marker);
          }
        }

        const nextMarkers = Array.from(latestByEmpId.values()).sort(
          (a, b) => a.empName.localeCompare(b.empName),
        );

        if (mountedRef.current) {
          setMarkers(nextMarkers);
        }
      } catch (error) {
        console.log("Live location fetch error:", error);
      } finally {
        inFlightRef.current = false;
        if (initial) {
          if (mountedRef.current) setLoading(false);
        } else {
          if (mountedRef.current) setRefreshing(false);
        }
      }
    },
    [token],
  );

  useEffect(() => {
    mountedRef.current = true;

    void syncLocations({ initial: true });

    const intervalId = setInterval(() => {
      void syncLocations();
    }, LIVE_REFRESH_MS);

    return () => {
      mountedRef.current = false;
      clearInterval(intervalId);
    };
  }, [syncLocations]);

  const region = useMemo(() => {
    if (markers.length === 0) return null;

    const first = markers[0].coords;
    let minLat = first.latitude;
    let maxLat = first.latitude;
    let minLon = first.longitude;
    let maxLon = first.longitude;

    for (const marker of markers) {
      minLat = Math.min(minLat, marker.coords.latitude);
      maxLat = Math.max(maxLat, marker.coords.latitude);
      minLon = Math.min(minLon, marker.coords.longitude);
      maxLon = Math.max(maxLon, marker.coords.longitude);
    }

    const latitude = (minLat + maxLat) / 2;
    const longitude = (minLon + maxLon) / 2;
    const latitudeDelta = Math.max(0.01, (maxLat - minLat) * 1.4);
    const longitudeDelta = Math.max(0.01, (maxLon - minLon) * 1.4);

    return {
      latitude,
      longitude,
      latitudeDelta,
      longitudeDelta,
    };
  }, [markers]);

  const fallbackMapUrl = useMemo(() => {
    if (markers.length === 0) return "";
    const first = markers[0].coords;
    return `https://maps.google.com/maps?q=loc:${first.latitude},${first.longitude}&z=13&output=embed`;
  }, [markers]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}> 
      <Header title="Location" />

      <View style={styles.body}>
        <View style={[styles.infoBar, { backgroundColor: theme.cardBackground }]}> 
          <Text style={[styles.infoTitle, { color: theme.text }]}>Live Employee Locations</Text>
          <Text style={[styles.infoValue, { color: theme.placeholder }]}>
            Employees: {markers.length}
          </Text>
          {refreshing ? (
            <Text style={[styles.refreshingText, { color: theme.placeholder }]}>Refreshing...</Text>
          ) : null}
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.messageText, { color: theme.placeholder }]}>Loading live locations...</Text>
          </View>
        ) : markers.length === 0 || !region ? (
          <View style={styles.center}>
            <Text style={[styles.messageText, { color: theme.placeholder }]}>No live location data found for today</Text>
          </View>
        ) : (
          <View style={[styles.mapCard, { backgroundColor: theme.cardBackground }]}> 
            {MapViewComponent && MarkerComponent ? (
              <MapViewComponent style={styles.map} region={region}>
                {markers.map((marker) => (
                  <MarkerComponent
                    key={String(marker.empId)}
                    coordinate={marker.coords}
                    title={marker.empName}
                    description={marker.empCode ? `Code: ${marker.empCode}` : undefined}
                    tracksViewChanges={false}
                  />
                ))}
              </MapViewComponent>
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
    gap: 10,
  },
  infoBar: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "500",
    marginTop: 2,
  },
  refreshingText: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  messageText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  mapCard: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  map: {
    flex: 1,
  },
});
