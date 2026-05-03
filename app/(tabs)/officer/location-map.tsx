import Header, { HEADER_HEIGHT } from "@/components/Header";
import { useTheme } from "@/context/ThemeContext";
import { useProtectedBack } from "@/hooks/useProtectedBack";
import { getAllLocationMarkers } from "@/utils/locationMapStore";
import Constants from "expo-constants";
import { useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { WebView } from "react-native-webview";

type MarkerData = {
  empId: number;
  empCode: string;
  empName: string;
  dateD: string;
  coords: {
    latitude: number;
    longitude: number;
  };
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

const parseDotNetDateMs = (value?: string) => {
  if (!value || typeof value !== "string") return 0;
  const match = value.match(/\/Date\((\d+)\)\//);
  if (!match) return 0;
  const ms = Number(match[1]);
  return Number.isFinite(ms) ? ms : 0;
};

const toParamString = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
};

const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a3646" }] },
  {
    featureType: "administrative.country",
    elementType: "geometry.stroke",
    stylers: [{ color: "#4b6878" }],
  },
  {
    featureType: "administrative.land_parcel",
    elementType: "labels.text.fill",
    stylers: [{ color: "#64779e" }],
  },
  {
    featureType: "administrative.province",
    elementType: "geometry.stroke",
    stylers: [{ color: "#4b6878" }],
  },
  { featureType: "landscape.man_made", elementType: "geometry.stroke", stylers: [{ color: "#334e87" }] },
  { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#023e58" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#283d6a" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#6f9ba5" }] },
  { featureType: "poi", elementType: "labels.text.stroke", stylers: [{ color: "#1d2c4d" }] },
  { featureType: "poi.park", elementType: "geometry.fill", stylers: [{ color: "#023e58" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#3C7680" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#304a7d" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#98a5be" }] },
  { featureType: "road", elementType: "labels.text.stroke", stylers: [{ color: "#1d2c4d" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#2c6675" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#255763" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#b0d5ce" }] },
  { featureType: "road.highway", elementType: "labels.text.stroke", stylers: [{ color: "#023e58" }] },
  { featureType: "transit", elementType: "labels.text.fill", stylers: [{ color: "#98a5be" }] },
  { featureType: "transit", elementType: "labels.text.stroke", stylers: [{ color: "#1d2c4d" }] },
  { featureType: "transit.line", elementType: "geometry.fill", stylers: [{ color: "#283d6a" }] },
  { featureType: "transit.station", elementType: "geometry", stylers: [{ color: "#3a4762" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e1626" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#4e6d70" }] },
];

export default function OfficerLocationMapScreen() {
  const { theme, isDark } = useTheme();
  const params = useLocalSearchParams<{
    mode?: string | string[];
    markers?: string | string[];
    empId?: string | string[];
    empCode?: string | string[];
    empName?: string | string[];
    dateD?: string | string[];
    lat?: string | string[];
    lon?: string | string[];
  }>();

  const mode = toParamString(params.mode) === "all" ? "all" : "single";

  const protectedBack = useProtectedBack({
    home: "/home",
    settings: "/settings",
    dashboard: "/dashboard",
    location: "/officer/location",
  });

  const allMarkers = useMemo(() => {
    const raw = toParamString(params.markers);
    const source = raw
      ? raw
      : JSON.stringify(getAllLocationMarkers());
    if (!source) return [] as MarkerData[];
    try {
      const parsed = JSON.parse(source) as Array<{
        empId: number;
        empCode: string;
        empName: string;
        dateD: string;
        latitude: number;
        longitude: number;
      }>;
      return parsed
        .map((item) => ({
          empId: Number(item.empId),
          empCode: item.empCode || "",
          empName: item.empName || `Employee ${item.empId}`,
          dateD: item.dateD || "",
          coords: {
            latitude: Number(item.latitude),
            longitude: Number(item.longitude),
          },
        }))
        .filter(
          (item) =>
            Number.isFinite(item.empId) &&
            Number.isFinite(item.coords.latitude) &&
            Number.isFinite(item.coords.longitude),
        );
    } catch {
      return [] as MarkerData[];
    }
  }, [params.markers]);

  const androidMapsApiKey = useMemo(() => {
    const envKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";
    const expoConfigKey = Constants.expoConfig?.android?.config?.googleMaps?.apiKey || "";
    const expoExtraKey = Constants.expoConfig?.extra?.googleMapsApiKey || "";
    return [envKey, expoConfigKey, expoExtraKey].find((value) => value.trim()) || "";
  }, []);

  // Safety-first behavior:
  // Android release builds can crash at native map init on some devices/configs.
  // Keep Android on WebView map path to prevent app-close crashes in production.
const canUseNativeMap = MapViewComponent && MarkerComponent;

  const singleMarker = useMemo(() => {
    const empId = Number(toParamString(params.empId));
    const latitude = Number(toParamString(params.lat));
    const longitude = Number(toParamString(params.lon));
    if (!Number.isFinite(empId) || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }
    return {
      empId,
      empCode: toParamString(params.empCode),
      empName: toParamString(params.empName) || `Employee ${empId}`,
      dateD: toParamString(params.dateD),
      coords: { latitude, longitude },
    } as MarkerData;
  }, [params.dateD, params.empCode, params.empId, params.empName, params.lat, params.lon]);

  const visibleMarkers = useMemo(() => {
    if (mode === "all") return allMarkers;
    return singleMarker ? [singleMarker] : [];
  }, [allMarkers, mode, singleMarker]);

  const region = useMemo(() => {
    if (visibleMarkers.length === 0) return null;
    if (visibleMarkers.length === 1) {
      return {
        latitude: visibleMarkers[0].coords.latitude,
        longitude: visibleMarkers[0].coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }

    const first = visibleMarkers[0].coords;
    let minLat = first.latitude;
    let maxLat = first.latitude;
    let minLon = first.longitude;
    let maxLon = first.longitude;

    for (const marker of visibleMarkers) {
      minLat = Math.min(minLat, marker.coords.latitude);
      maxLat = Math.max(maxLat, marker.coords.latitude);
      minLon = Math.min(minLon, marker.coords.longitude);
      maxLon = Math.max(maxLon, marker.coords.longitude);
    }

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLon + maxLon) / 2,
      latitudeDelta: Math.max(0.01, (maxLat - minLat) * 1.4),
      longitudeDelta: Math.max(0.01, (maxLon - minLon) * 1.4),
    };
  }, [visibleMarkers]);

  const fallbackWebViewSource = useMemo(() => {
    if (!region) return { uri: "" };
    const zoom = mode === "all" ? 10 : 14;

    if (androidMapsApiKey.trim()) {
      const center = `${region.latitude},${region.longitude}`;
      return {
        uri:
          `https://www.google.com/maps?q=LAT,LNG&z=14` +
          `?key=${encodeURIComponent(androidMapsApiKey)}` +
          `&center=${encodeURIComponent(center)}` +
          `&zoom=${zoom}` +
          `&maptype=roadmap`,
      };
    }

    return {
      uri:
        `https://www.openstreetmap.org/?mlat=${region.latitude}` +
        `&mlon=${region.longitude}` +
        `#map=${zoom}/${region.latitude}/${region.longitude}`,
    };
  }, [androidMapsApiKey, mode, region]);

  const titleText =
    mode === "all" ? "All Locations" : singleMarker?.empName || "Location";
  const subtitleText =
    mode === "all"
      ? `Users: ${visibleMarkers.length}`
      : `Last updated: ${
          (() => {
            const ms = parseDotNetDateMs(singleMarker?.dateD);
            return ms ? new Date(ms).toLocaleString() : "N/A";
          })()
        }`;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header title="Location" />

      <View style={styles.body}>
        {!region ? (
          <View style={styles.center}>
            <Text style={[styles.messageText, { color: theme.placeholder }]}>
              Location data not available
            </Text>
            <TouchableOpacity onPress={protectedBack} style={styles.backButton}>
              <Text style={[styles.backButtonText, { color: theme.primary }]}>Back to list</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.mapCard, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.mapHeader}>
              <TouchableOpacity onPress={protectedBack} activeOpacity={0.8}>
                <Text style={[styles.backText, { color: theme.primary }]}>Back to list</Text>
              </TouchableOpacity>
              <Text style={[styles.mapTitle, { color: theme.text }]}>{titleText}</Text>
              <Text style={[styles.mapSubtitle, { color: theme.placeholder }]}>
                {subtitleText}
              </Text>
            </View>

            {canUseNativeMap ? (
              <MapViewComponent
                style={styles.map}
                initialRegion={region}
                customMapStyle={isDark ? DARK_MAP_STYLE : undefined}
              >
                {visibleMarkers.map((marker) => (
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
              <>
                {!androidMapsApiKey.trim() && Platform.OS === "android" ? (
                  <Text style={[styles.keyWarningText, { color: theme.placeholder }]}>
                    Google Maps API key is missing. Showing fallback map.
                  </Text>
                ) : null}
                <WebView
                  source={fallbackWebViewSource}
                  style={styles.map}
                  originWhitelist={["*"]}
                  javaScriptEnabled
                  domStorageEnabled
                />
              </>
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
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  messageText: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  mapCard: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  mapHeader: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#00000020",
  },
  backText: {
    fontSize: 13,
    fontWeight: "700",
  },
  mapTitle: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: "700",
  },
  mapSubtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "500",
  },
  map: {
    flex: 1,
  },
  keyWarningText: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  backButton: {
    marginTop: 10,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
