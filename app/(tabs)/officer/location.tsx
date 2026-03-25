import Header, { HEADER_HEIGHT } from "@/components/Header";
import { useTheme } from "@/context/ThemeContext";
import { useUser } from "@/context/UserContext";
import ApiService from "@/services/ApiService";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";

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

export default function OfficerLocationScreen() {
  const { theme } = useTheme();
  const { user } = useUser();

  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(true);

  const token = (user?.TokenC || user?.Token || "").trim();
  const empId = Number(user?.EmpIdN ?? 0);

  useEffect(() => {
    let isMounted = true;

    const loadLocation = async () => {
      try {
        const res = await ApiService.getLiveLocation(token, empId, new Date());
        const latest = res?.data?.data?.[0];

        if (!latest || !isMounted) return;

        const latitude =
          parseCoordinate(latest.LatC) ??
          parseCoordinate(latest.LatN) ??
          parseCoordinate(latest.Latitude);
        const longitude =
          parseCoordinate(latest.LonC) ??
          parseCoordinate(latest.LonN) ??
          parseCoordinate(latest.Longitude);

        if (latitude !== null && longitude !== null) {
          setCoords({ latitude, longitude });
        }
      } catch (error) {
        console.log("Location fetch error:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void loadLocation();

    return () => {
      isMounted = false;
    };
  }, [empId, token]);

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
    return `https://maps.google.com/maps?q=${coords.latitude},${coords.longitude}&z=16&output=embed`;
  }, [coords]);

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
            </View>

            <View style={styles.mapHolder}>
              {MapViewComponent && MarkerComponent ? (
                <MapViewComponent style={styles.map} region={region}>
                  <MarkerComponent coordinate={coords} title="Employee Location" />
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
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  coordinateText: {
    fontSize: 13,
    fontWeight: "600",
  },
  mapHolder: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});
