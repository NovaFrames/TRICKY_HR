import Header, { HEADER_HEIGHT } from "@/components/Header";
import { useTheme } from "@/context/ThemeContext";
import { useUser } from "@/context/UserContext";
import { useProtectedBack } from "@/hooks/useProtectedBack";
import ApiService from "@/services/ApiService";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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
    coords: { latitude, longitude },
  };
};

const areMarkersEqual = (a: EmployeeMarker[], b: EmployeeMarker[]) => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    const left = a[i];
    const right = b[i];
    if (
      left.empId !== right.empId ||
      left.empCode !== right.empCode ||
      left.empName !== right.empName ||
      left.dateD !== right.dateD ||
      left.coords.latitude !== right.coords.latitude ||
      left.coords.longitude !== right.coords.longitude
    ) {
      return false;
    }
  }
  return true;
};

export default function OfficerLocationListScreen() {
  const { theme } = useTheme();
  const { user } = useUser();
  const router = useRouter();

  const [markers, setMarkers] = useState<EmployeeMarker[]>([]);
  const [loading, setLoading] = useState(true);

  const mountedRef = useRef(true);
  const inFlightRef = useRef(false);
  const token = (user?.TokenC || user?.Token || "").trim();

  useProtectedBack({
    home: "/home",
    settings: "/settings",
    dashboard: "/dashboard",
  });

  const syncLocations = useCallback(
    async (options?: { initial?: boolean }) => {
      if (inFlightRef.current || !token) {
        if (options?.initial && mountedRef.current) setLoading(false);
        return;
      }

      inFlightRef.current = true;
      const initial = !!options?.initial;
      if (initial && mountedRef.current) setLoading(true);

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
          if (markerMs > existingMs) latestByEmpId.set(marker.empId, marker);
        }

        const nextMarkers = Array.from(latestByEmpId.values()).sort((a, b) =>
          a.empName.localeCompare(b.empName),
        );

        if (mountedRef.current) {
          setMarkers((prev) =>
            areMarkersEqual(prev, nextMarkers) ? prev : nextMarkers,
          );
        }
      } catch (error) {
        console.log("Live location fetch error:", error);
      } finally {
        inFlightRef.current = false;
        if (initial && mountedRef.current) setLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    mountedRef.current = true;

    void syncLocations({ initial: true });
    const intervalId = setInterval(() => void syncLocations(), LIVE_REFRESH_MS);

    return () => {
      mountedRef.current = false;
      clearInterval(intervalId);
    };
  }, [syncLocations]);

  const formatLastUpdated = useCallback((value: string) => {
    const ms = parseDotNetDateMs(value);
    if (!ms) return "N/A";
    return new Date(ms).toLocaleString();
  }, []);

  const encodedAllMarkers = useMemo(() => {
    const minimal = markers.map((m) => ({
      empId: m.empId,
      empCode: m.empCode,
      empName: m.empName,
      dateD: m.dateD,
      latitude: m.coords.latitude,
      longitude: m.coords.longitude,
    }));
    return JSON.stringify(minimal);
  }, [markers]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header title="Location" />

      <View style={styles.body}>
        <View style={[styles.infoBar, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.infoTitle, { color: theme.text }]}>
            Live Employee Locations
          </Text>
          <Text style={[styles.infoValue, { color: theme.placeholder }]}>
            Employees: {markers.length}
          </Text>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.messageText, { color: theme.placeholder }]}>
              Loading live locations...
            </Text>
          </View>
        ) : markers.length === 0 ? (
          <View style={styles.center}>
            <Text style={[styles.messageText, { color: theme.placeholder }]}>
              No live location data found for today
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.listContainer}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity
              style={[styles.userCard, { backgroundColor: theme.cardBackground }]}
              activeOpacity={0.8}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/officer/location-map",
                  params: { mode: "all", markers: encodedAllMarkers, from: "location" },
                })
              }
            >
              <Text style={[styles.userName, { color: theme.text }]}>All Locations</Text>
              <Text style={[styles.userCode, { color: theme.placeholder }]}>
                Show all users on one map
              </Text>
              <Text style={[styles.userUpdated, { color: theme.placeholder }]}>
                Users: {markers.length}
              </Text>
            </TouchableOpacity>

            {markers.map((marker) => (
              <TouchableOpacity
                key={String(marker.empId)}
                style={[styles.userCard, { backgroundColor: theme.cardBackground }]}
                activeOpacity={0.8}
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/officer/location-map",
                    params: {
                      mode: "single",
                      from: "location",
                      empId: String(marker.empId),
                      empCode: marker.empCode,
                      empName: marker.empName,
                      dateD: marker.dateD,
                      lat: String(marker.coords.latitude),
                      lon: String(marker.coords.longitude),
                    },
                  })
                }
              >
                <Text style={[styles.userName, { color: theme.text }]}>{marker.empName}</Text>
                <Text style={[styles.userCode, { color: theme.placeholder }]}>
                  Code: {marker.empCode || "N/A"}
                </Text>
                <Text style={[styles.userUpdated, { color: theme.placeholder }]}>
                  Last updated: {formatLastUpdated(marker.dateD)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
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
  listContainer: {
    flex: 1,
  },
  listContent: {
    gap: 10,
    paddingBottom: 10,
  },
  userCard: {
    borderRadius: 12,
    padding: 12,
  },
  userName: {
    fontSize: 15,
    fontWeight: "700",
  },
  userCode: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: "500",
  },
  userUpdated: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "500",
  },
});
