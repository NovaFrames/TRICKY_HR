import Header, { HEADER_HEIGHT } from "@/components/Header";
import { useTheme } from "@/context/ThemeContext";
import { useUser } from "@/context/UserContext";
import { useProtectedBack } from "@/hooks/useProtectedBack";
import ApiService from "@/services/ApiService";
import { useLocalSearchParams } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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

const parseCoordinate = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const normalizeMarker = (
  row: LiveLocationRow,
): MarkerData | null => {
  const empId = Number(row.EmpIdN ?? 0);

  if (!Number.isFinite(empId) || empId <= 0) {
    return null;
  }

  const latitude =
    parseCoordinate(row.LatC) ??
    parseCoordinate(row.LatN) ??
    parseCoordinate(row.Latitude);

  const longitude =
    parseCoordinate(row.LonC) ??
    parseCoordinate(row.LonN) ??
    parseCoordinate(row.Longitude);

  if (latitude === null || longitude === null) {
    return null;
  }

  return {
    empId,

    empCode:
      typeof row.EmpCodeC === "string"
        ? row.EmpCodeC
        : "",

    empName:
      typeof row.EmpNameC === "string"
        ? row.EmpNameC
        : `Employee ${empId}`,

    dateD:
      typeof row.DateD === "string"
        ? row.DateD
        : "",

    coords: {
      latitude,
      longitude,
    },
  };
};

let MapViewComponent: any = null;
let MarkerComponent: any = null;
let PolylineComponent: any = null;

try {
  const maps = require("react-native-maps");

  MapViewComponent = maps.default;

  MarkerComponent = maps.Marker;

  PolylineComponent =
    maps.Polyline;
} catch {
  MapViewComponent = null;
  MarkerComponent = null;
  PolylineComponent = null;
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
  const { user } = useUser();

  const params = useLocalSearchParams<{
    mode?: string | string[];
    markers?: string | string[];
    empId?: string | string[];
    empCode?: string | string[];
    empName?: string | string[];
    dateD?: string | string[];
    lat?: string | string[];
    lon?: string | string[];
    from?: string | string[];
    parentFrom?: string | string[];
    selectedDate?: string | string[];
  }>();

  const mode = toParamString(params.mode) === "all" ? "all" : "single";

  const token = (
    user?.TokenC ||
    user?.Token ||
    ""
  ).trim();

  const [visibleMarkers, setVisibleMarkers] =
    useState<MarkerData[]>([]);

  const [loading, setLoading] =
    useState(true);

  const mountedRef = useRef(true);

  const inFlightRef = useRef(false);

  const empId = Number(
    toParamString(params.empId),
  );

  const selectedDateParam =
    toParamString(
      params.selectedDate,
    );

  const selectedDate =
    selectedDateParam
      ? new Date(
        selectedDateParam,
      )
      : new Date();

  const LIVE_REFRESH_MS =
    useMemo(() => {
      // backend value is in minutes
      const minutes = Math.max(
        Number(user?.LiveDurN) || 1,
        1,
      );

      return minutes * 60 * 1000;
    }, [user?.LiveDurN]);

  const protectedBack = useProtectedBack({
    location: {
      pathname: "/(tabs)/officer/LiveLocation",
      params: { from: toParamString(params.parentFrom) || "home" },
    },
  });

  // Safety-first behavior:
  // Android release builds can crash at native map init on some devices/configs.
  // Keep Android on WebView map path to prevent app-close crashes in production.
  const canUseNativeMap =
    Platform.OS !== "android" && MapViewComponent && MarkerComponent;


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
      latitudeDelta: Math.max(
        0.02,
        (maxLat - minLat) * 2,
      ),
      longitudeDelta: Math.max(
        0.02,
        (maxLon - minLon) * 2,
      ),
    };
  }, [visibleMarkers]);

  const employeeGroups =
    useMemo(() => {
      const grouped: Record<
        number,
        MarkerData[]
      > = {};

      visibleMarkers.forEach(
        (marker) => {
          if (
            !grouped[
            marker.empId
            ]
          ) {
            grouped[
              marker.empId
            ] = [];
          }

          grouped[
            marker.empId
          ].push(marker);
        },
      );

      Object.values(grouped).forEach(
        (group) => {
          group.sort((a, b) => {
            return (
              parseDotNetDateMs(
                a.dateD,
              ) -
              parseDotNetDateMs(
                b.dateD,
              )
            );
          });
        },
      );

      return grouped;
    }, [visibleMarkers]);

  const mapHtml = useMemo(() => {
    if (!region) return "";

    return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0"
    />

    <link
      rel="stylesheet"
      href="https://unpkg.com/leaflet/dist/leaflet.css"
    />

    <style>
      html,
      body,
      #map {
        height: 100%;
        margin: 0;
      }

      .leaflet-control-attribution {
        display: none !important;
      }

      .custom-popup {
        font-size: 13px;
        font-weight: 600;
        line-height: 1.5;
      }

      .route-marker {
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.35);
      }

      .start-marker {
        border-radius: 50%;
      }

      .end-marker {
        border-radius: 4px;
      }
    </style>
  </head>

  <body>
    <div id="map"></div>

    <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>

    <script>

      const markers =
        ${JSON.stringify(
      visibleMarkers
    )};

      const map = L.map("map");

      // INITIAL REGION
      if (markers.length === 1) {

        map.setView(
          [
            markers[0].coords.latitude,
            markers[0].coords.longitude
          ],
          16
        );

      } else {

        const bounds =
          markers.map(m => [
            m.coords.latitude,
            m.coords.longitude
          ]);

        map.fitBounds(bounds, {
          padding: [30, 30]
        });
      }

      // TILE
      L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution: ""
        }
      ).addTo(map);

      // DATE FORMAT
      const formatDate = (
        value
      ) => {

        const match =
          value.match(
            /\\/Date\\((\\d+)\\)\\//
          );

        if (!match) {
          return "Unknown";
        }

        const date =
          new Date(
            Number(match[1])
          );

        return date.toLocaleString(
          "en-IN",
          {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true
          }
        );
      };

      // COLORS
      const routeColors = [
        "#2563EB",
        "#DC2626",
        "#16A34A",
        "#9333EA",
        "#EA580C",
        "#0891B2",
        "#DB2777",
        "#CA8A04",
        "#4F46E5",
        "#65A30D"
      ];

      const getEmployeeColor =
        (index) =>
          routeColors[
            index %
            routeColors.length
          ];

      // GROUP EMPLOYEES
      const grouped = {};

      markers.forEach(marker => {

        const key =
          marker.empId;

        if (!grouped[key]) {
          grouped[key] = [];
        }

        grouped[key].push(marker);
      });

      // RENDER ROUTES
      Object.values(grouped)
        .forEach(
          (
            group,
            groupIndex
          ) => {

            const employeeColor =
              getEmployeeColor(
                groupIndex
              );

            // SORT BY TIME
            group.sort(
              (a, b) => {

                const getMs =
                  (value) => {

                    const match =
                      value.match(
                        /\\/Date\\((\\d+)\\)\\//
                      );

                    return match
                      ? Number(
                          match[1]
                        )
                      : 0;
                  };

                return (
                  getMs(
                    a.dateD
                  ) -
                  getMs(
                    b.dateD
                  )
                );
              }
            );

            // SINGLE LOCATION
            if (
              group.length === 1
            ) {

              const marker =
                group[0];

              const singleMarker =
                L.marker([
                  marker.coords.latitude,
                  marker.coords.longitude
                ]).addTo(map);

              singleMarker.bindPopup(
                '<div class="custom-popup">' +
                '<b>' +
                marker.empName +
                '</b><br/>' +
                'Updated: ' +
                formatDate(
                  marker.dateD
                ) +
                '</div>'
              );

              return;
            }

            // ROUTE LINE
            const routeCoords =
              group.map(m => [
                m.coords.latitude,
                m.coords.longitude
              ]);

            const polyline =
              L.polyline(
                routeCoords,
                {
                  color:
                    employeeColor,
                  weight: 5,
                  opacity: 0.9
                }
              ).addTo(map);

            // START
            const start =
              group[0];

            const startIcon =
              L.divIcon({
                html:
                  '<div class="route-marker start-marker" style="background:' +
                  employeeColor +
                  ';width:18px;height:18px;"></div>',
                className: "",
                iconSize: [18, 18]
              });

            const startMarker =
              L.marker(
                [
                  start.coords.latitude,
                  start.coords.longitude
                ],
                {
                  icon:
                    startIcon
                }
              ).addTo(map);

            startMarker.bindPopup(
              '<div class="custom-popup">' +
              '<b>START - ' +
              start.empName +
              '</b><br/>' +
              'Updated: ' +
              formatDate(
                start.dateD
              ) +
              '</div>'
            );

            // END
            const end =
              group[
                group.length - 1
              ];

            const endIcon =
              L.divIcon({
                html:
                  '<div class="route-marker end-marker" style="background:' +
                  employeeColor +
                  ';width:18px;height:18px;"></div>',
                className: "",
                iconSize: [18, 18]
              });

            const endMarker =
              L.marker(
                [
                  end.coords.latitude,
                  end.coords.longitude
                ],
                {
                  icon:
                    endIcon
                }
              ).addTo(map);

            endMarker.bindPopup(
              '<div class="custom-popup">' +
              '<b>END - ' +
              end.empName +
              '</b><br/>' +
              'Updated: ' +
              formatDate(
                end.dateD
              ) +
              '</div>'
            );

            // CLICK ROUTE
            polyline.on(
              "click",
              function(e) {

                const clicked =
                  e.latlng;

                let nearest =
                  null;

                let nearestDistance =
                  Infinity;

                group.forEach(
                  point => {

                    const distance =
                      clicked.distanceTo([
                        point.coords.latitude,
                        point.coords.longitude
                      ]);

                    if (
                      distance <
                      nearestDistance
                    ) {

                      nearestDistance =
                        distance;

                      nearest =
                        point;
                    }
                  }
                );

                if (!nearest) {
                  return;
                }

                L.popup()
                  .setLatLng(
                    clicked
                  )
                  .setContent(
                    '<div class="custom-popup">' +
                    '<b>' +
                    nearest.empName +
                    '</b><br/>' +
                    'Updated: ' +
                    formatDate(
                      nearest.dateD
                    ) +
                    '</div>'
                  )
                  .openOn(map);
              }
            );
          }
        );
    </script>
  </body>
  </html>
  `;
  }, [region, visibleMarkers]);

  const titleText =
    mode === "all"
      ? "All Locations"
      : toParamString(
        params.empName,
      ) || "Location";

  const subtitleText =
    mode === "all"
      ? `Users: ${visibleMarkers.length}`
      : `Last updated: ${(() => {
        const ms =
          parseDotNetDateMs(
            visibleMarkers[0]
              ?.dateD,
          );

        return ms
          ? new Date(
            ms,
          ).toLocaleString()
          : "N/A";
      })()}`;


  const fetchLocations = useCallback(async () => {
    if (
      !token ||
      inFlightRef.current
    ) {
      return;
    }

    inFlightRef.current = true;

    try {
      const requestDate =
        selectedDate;

      const response =
        await ApiService.getLiveLocations(
          token,
          mode === "all"
            ? 0
            : empId,
          requestDate,
        );

      const rows: LiveLocationRow[] =
        Array.isArray(response?.data)
          ? response.data
          : [];

      const normalized = rows
        .map((row) =>
          normalizeMarker(row),
        )
        .filter(
          (
            row,
          ): row is MarkerData =>
            !!row,
        )
        .sort((a, b) => {
          return (
            parseDotNetDateMs(
              a.dateD,
            ) -
            parseDotNetDateMs(
              b.dateD,
            )
          );
        });

      if (mountedRef.current) {
        setVisibleMarkers(
          normalized,
        );
      }
    } catch (error) {
      console.log(
        "Location fetch error:",
        error,
      );
    } finally {
      inFlightRef.current =
        false;

      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [mode, empId, token]);

  useEffect(() => {
    mountedRef.current = true;

    fetchLocations();

    const today =
      new Date().toDateString();

    const selected =
      selectedDate.toDateString();

    // don't refresh old dates
    if (today !== selected) {
      return () => {
        mountedRef.current = false;
      };
    }

    const interval = setInterval(() => {
      fetchLocations();
    }, LIVE_REFRESH_MS);

    return () => {
      mountedRef.current = false;

      clearInterval(interval);
    };
  }, [
    fetchLocations,
    LIVE_REFRESH_MS,
  ]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header title="Location" onBack={protectedBack} />

      <View style={styles.body}>
        {loading ? (
          <View style={styles.center}>
            <Text
              style={[
                styles.messageText,
                {
                  color:
                    theme.placeholder,
                },
              ]}
            >
              Loading locations...
            </Text>
          </View>
        ) : !region ? (
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
                {/* ROUTES */}
                {PolylineComponent &&
                  Object.values(
                    employeeGroups,
                  ).map((group) => {
                    // only draw path if employee has multiple locations
                    if (group.length <= 1) {
                      return null;
                    }

                    return (
                      <PolylineComponent
                        key={`route-${group[0].empId}`}
                        coordinates={group.map(
                          (marker) => ({
                            latitude:
                              marker.coords
                                .latitude,
                            longitude:
                              marker.coords
                                .longitude,
                          }),
                        )}
                        strokeWidth={4}
                        strokeColor="#2563EB"
                      />
                    );
                  })}

                {/* MARKERS */}
                {Object.values(
                  employeeGroups,
                ).flatMap((group) => {
                  // SINGLE LOCATION
                  if (group.length === 1) {
                    const marker = group[0];

                    return (
                      <MarkerComponent
                        key={`single-${marker.empId}`}
                        coordinate={
                          marker.coords
                        }
                        title={
                          marker.empName
                        }
                        description={
                          marker.empCode
                            ? `Code: ${marker.empCode}`
                            : undefined
                        }
                        pinColor="orange"
                        tracksViewChanges={
                          false
                        }
                      />
                    );
                  }

                  // MULTIPLE LOCATIONS
                  return group.map(
                    (marker, index) => {
                      const isStart =
                        index === 0;

                      const isEnd =
                        index ===
                        group.length - 1;

                      return (
                        <MarkerComponent
                          key={`${marker.empId}-${index}`}
                          coordinate={
                            marker.coords
                          }
                          title={
                            isStart
                              ? `Start - ${marker.empName}`
                              : isEnd
                                ? `End - ${marker.empName}`
                                : marker.empName
                          }
                          description={
                            marker.empCode
                              ? `Code: ${marker.empCode}`
                              : undefined
                          }
                          pinColor={
                            isStart
                              ? "green"
                              : isEnd
                                ? "red"
                                : "orange"
                          }
                          tracksViewChanges={
                            false
                          }
                        />
                      );
                    },
                  );
                })}
              </MapViewComponent>
            ) : (
              <>
                <WebView
                  originWhitelist={["*"]}
                  source={{ html: mapHtml }}
                  style={styles.map}
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
