import CenterModalSelection from "@/components/common/CenterModalSelection";
import ConfirmModal from "@/components/common/ConfirmModal";
import Snackbar from "@/components/common/Snackbar";
import { CustomButton } from "@/components/CustomButton";
import Header, { HEADER_HEIGHT } from "@/components/Header";
import { useTheme } from "@/context/ThemeContext";
import { useUser } from "@/context/UserContext";
import { useProtectedBack } from "@/hooks/useProtectedBack";
import ApiService, {
  ensureBaseUrl,
  markMobileAttendance,
} from "@/services/ApiService";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import * as Sentry from "@sentry/react-native";
import * as ImagePicker from "expo-image-picker"; // ✅ replaced expo-camera
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Dimensions,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

type AttendanceParams = {
  propEmpIdN?: string | string[];
  propEmpName?: string | string[];
  propEmpCodeC?: string | string[];
};

const Attendance = () => {
  const { theme } = useTheme();
  const { user, logout } = useUser();
  const router = useRouter();
  const params = useLocalSearchParams() as AttendanceParams;
  const { propEmpIdN, propEmpName, propEmpCodeC } = params;

  const normalizeParam = (value?: string | string[]) =>
    Array.isArray(value) ? value[0] : value;

  const normalizedEmpId = normalizeParam(propEmpIdN);
  const normalizedEmpName = normalizeParam(propEmpName);
  const normalizedEmpCodeC = normalizeParam(propEmpCodeC);

  const parsedEmpId = normalizedEmpId ? Number(normalizedEmpId) : undefined;
  const empId = Number.isFinite(parsedEmpId)
    ? parsedEmpId
    : user?.EmpIdN ?? user?.EmpId;
  const empName = normalizedEmpName ?? user?.EmpNameC ?? "";
  const empCodeC = normalizedEmpCodeC ?? user?.EmpCodeC ?? "";

  const [currentTime, setCurrentTime] = useState(new Date());
  const [attendanceType, setAttendanceType] = useState<
    "Check-in" | "Check-out"
  >("Check-in");
  const [selectedProject, setSelectedProject] = useState("");
  const [remarks, setRemarks] = useState("");
  const [projects, setProjects] = useState<any[]>([]);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    address?: string;
    accuracy?: number;
  } | null>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const isFocused = useIsFocused();
  const [projectLoading, setProjectLoading] = useState(false);
  const [projectModalLoading, setProjectModalLoading] = useState(false);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [projectRefreshAttempts, setProjectRefreshAttempts] = useState(0);
  const [projectRefreshing, setProjectRefreshing] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    visible: boolean;
    message: string;
    type: "error" | "success" | "info";
  }>({
    visible: false,
    message: "",
    type: "info",
  });
  const [snackbarKey, setSnackbarKey] = useState(0);

  // Camera permission state (using ImagePicker)
  const [cameraPermission, setCameraPermission] = useState<
    ImagePicker.PermissionStatus | null
  >(null);

  const [locationPermission, setLocationPermission] =
    useState<Location.PermissionStatus | null>(null);

  const LOCATION_FROM_USER = user?.AttDistanceN;
  const LOCATION_MAX_RETRIES = 3;
  const LOCATION_RETRY_DELAY_MS = 1000;
  const LOCATION_REQUIRED_ACCURACY_METERS = 50;
  const DEFAULT_ALLOWED_RADIUS_METERS = 200;
  const MAX_GPS_DRIFT_BUFFER_METERS = 25;

  const wait = (ms: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, ms));

  const updateLocationFromCoords = async (coords: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  }) => {
    setLocation({
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy,
    });
    try {
      const address = await Location.reverseGeocodeAsync(coords);
      if (address?.length) {
        const a = address[0];
        setLocation((prev) =>
          prev
            ? {
              ...prev,
              address: formatAddress(a),
            }
            : null,
        );
      }
    } catch { }
  };

  // Refresh permissions on app focus
  const refreshCameraPermission = async () => {
    const { status } = await ImagePicker.getCameraPermissionsAsync();
    setCameraPermission(status);
  };

  const refreshLocationPermission = async (opts?: { silent?: boolean }) => {
    const current = await Location.getForegroundPermissionsAsync();
    setLocationPermission(current.status);
    if (current.status === "granted") {
      await ensureLocation({ silent: opts?.silent });
    }
    return current;
  };

  useEffect(() => {
    void refreshCameraPermission();
    void refreshLocationPermission({ silent: true });
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener("change", async (state) => {
      if (state === "active") {
        await refreshCameraPermission();
        await refreshLocationPermission({ silent: true });
      }
    });
    return () => sub.remove();
  }, []);

  // Request camera permission using ImagePicker
  const handleRequestCameraPermission = async () => {
    try {
      const { status, canAskAgain } =
        await ImagePicker.getCameraPermissionsAsync();

      if (status === "granted") {
        setCameraPermission(status);
        return;
      }

      if (canAskAgain) {
        const { status: newStatus } =
          await ImagePicker.requestCameraPermissionsAsync();
        setCameraPermission(newStatus);
        if (newStatus !== "granted" && !canAskAgain) {
          ConfirmModal.alert(
            "Camera Permission Blocked",
            "Please enable camera permission from settings.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Open Settings", onPress: () => Linking.openSettings() },
            ]
          );
        }
      } else {
        ConfirmModal.alert(
          "Camera Permission Blocked",
          "Camera permission was permanently denied. Enable it from settings.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() },
          ]
        );
      }
    } catch (error) {
      console.log("Camera permission error:", error);
    }
  };

  // Request location permission
  const handleRequestLocationPermission = async () => {
    try {
      const requested = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(requested.status);

      if (requested.status === "granted") {
        const success = await ensureLocation();
        if (!success) {
          showSnackbar("Unable to fetch location. Try again.", "error");
        }
        return;
      }

      if (!requested.canAskAgain) {
        ConfirmModal.alert(
          "Location Permission Blocked",
          "Please enable location permission from settings",
          [{ text: "Open Settings", onPress: Linking.openSettings }]
        );
      }
    } catch (error) {
      console.log("Location permission error:", error);
    }
  };

  const isCameraGranted = cameraPermission === "granted";

  // Ensure location with retries and accuracy check
  const ensureLocation = async (opts?: { silent?: boolean }) => {
    try {
      const current = await Location.getForegroundPermissionsAsync();
      let status = current.status;
      let canAskAgain = current.canAskAgain;

      if (status !== "granted") {
        const requested = await Location.requestForegroundPermissionsAsync();
        status = requested.status;
        canAskAgain = requested.canAskAgain;
      }

      setLocationPermission(status);

      if (status !== "granted") {
        if (!opts?.silent) {
          if (canAskAgain === false) {
            ConfirmModal.alert(
              "Location Permission Blocked",
              "Location access is blocked. Enable it from settings.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Open Settings",
                  onPress: () => Linking.openSettings(),
                },
              ]
            );
          } else {
            ConfirmModal.alert(
              "Permission Required",
              "Location permission is required to submit attendance",
            );
          }
        }
        return false;
      }

      let bestLocation: Location.LocationObject | null = null;
      let bestAccuracy = Number.POSITIVE_INFINITY;

      for (let attempt = 1; attempt <= LOCATION_MAX_RETRIES; attempt++) {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
          mayShowUserSettingsDialog: true,
        });

        const accuracy = Number(loc.coords.accuracy ?? Number.POSITIVE_INFINITY);
        if (accuracy < bestAccuracy) {
          bestLocation = loc;
          bestAccuracy = accuracy;
        }

        if (accuracy <= LOCATION_REQUIRED_ACCURACY_METERS) {
          break;
        }

        if (attempt < LOCATION_MAX_RETRIES) {
          await wait(LOCATION_RETRY_DELAY_MS);
        }
      }

      if (!bestLocation) {
        if (!opts?.silent) {
          ConfirmModal.alert(
            "Location Error",
            "Unable to access location. Please enable GPS/location services and try again.",
          );
        }
        return false;
      }

      await updateLocationFromCoords({
        latitude: bestLocation.coords.latitude,
        longitude: bestLocation.coords.longitude,
        accuracy: Number.isFinite(bestAccuracy) ? bestAccuracy : undefined,
      });

      if (bestAccuracy > LOCATION_REQUIRED_ACCURACY_METERS) {
        if (!opts?.silent) {
          ConfirmModal.alert(
            "Weak GPS Signal",
            "Weak GPS Signal. Please move to open area and try again.",
          );
        }
        return false;
      }

      return true;
    } catch {
      if (!opts?.silent) {
        ConfirmModal.alert(
          "Location Error",
          "Unable to access location. Please enable GPS/location services and try again.",
        );
      }
      return false;
    }
  };

  useEffect(() => {
    if (locationPermission === "granted" && !location) {
      ensureLocation();
    }
  }, [locationPermission]);

  const formatAddress = (a: Location.LocationGeocodedAddress) => {
    const parts = [
      a.name,
      a.street,
      a.district,
      a.city,
      a.subregion,
      a.region,
      a.postalCode,
      a.country,
    ]
      .map((part) => (part || "").trim())
      .filter(Boolean);
    return parts.join(", ");
  };

  const toRadians = (value: number) => (value * Math.PI) / 180;
  const distanceMeters = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ) => {
    const earthRadius = 6371000;
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadius * c;
  };

  const formatDistance = (distance: number) =>
    distance < 1000
      ? `${Math.round(distance)} meters`
      : `${(distance / 1000).toFixed(1)} km`;

  const parseProjectCoords = (project: any) => {
    const raw = project?.GPRSC || project?.GPRS;
    if (!raw) return null;
    const [latStr, lonStr] = String(raw).split(",");
    const latitude = Number((latStr || "").trim());
    const longitude = Number((lonStr || "").trim());
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }
    return { latitude, longitude };
  };

  const showSnackbar = (
    message: string,
    type: "error" | "success" | "info" = "error",
  ) => {
    setSnackbarKey((prev) => prev + 1);
    setSnackbar({ visible: true, message, type });
  };

  const forceLogoutForMissingToken = async () => {
    await logout();
    ConfirmModal.alert("Session Expired", "Please sign in again.", [
      { text: "OK", onPress: () => router.replace("/auth/login") },
    ]);
  };

  const getProjectLocationText = (project: any) => {
    if (!project) return "";
    const parts = [
      project.AddressC,
      project.CompAddress1C,
      project.CompAddress2C,
    ]
      .map((part: unknown) => String(part || "").trim())
      .filter(Boolean);
    if (parts.length) return parts.join(", ");
    const coords = project?.GPRSC || project?.GPRS;
    return coords ? String(coords).trim() : "";
  };

  // Clock sync (unchanged)
  const parseServerTime = (raw: string) => {
    const trimmed = String(raw || "").trim();
    if (!trimmed) return null;

    const parts = trimmed.split(" ");
    if (parts.length < 4) return null;

    const [day, monthStr, year, time] = parts;
    const [hour, minute, second] = String(time || "")
      .split(":")
      .map(Number);

    const months: Record<string, number> = {
      Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
      Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
    };

    if (!months.hasOwnProperty(monthStr)) return null;

    const date = new Date(
      Number(year),
      months[monthStr],
      Number(day),
      hour,
      minute,
      second
    );

    return isNaN(date.getTime()) ? null : date;
  };

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    let baseTime = new Date();

    setCurrentTime(baseTime);
    timer = setInterval(() => {
      baseTime = new Date(baseTime.getTime() + 1000);
      setCurrentTime(new Date(baseTime));
    }, 1000);

    const syncServerTime = async () => {
      try {
        const token = user?.TokenC || user?.Token;
        if (!token) return;

        const raw = await ApiService.getRawServerTime(token);
        const serverNow = parseServerTime(raw);

        if (serverNow) {
          baseTime = serverNow;
          setCurrentTime(serverNow);
        }
      } catch (e) {
        console.log("Server time sync failed, using local time");
      }
    };

    syncServerTime();

    return () => {
      clearInterval(timer);
    };
  }, [user?.TokenC]);

  // ⏰ Removed the 30-second timeout effect – it caused issues with native camera

  const protectedBack = useProtectedBack({
    home: "/home",
    dashboard: "/dashboard",
    employeelist: "/officer/emplist",
  });

  // Project list fetch (unchanged)
  useEffect(() => {
    if (!isFocused) return;
    if (!user?.TokenC && !user?.Token) return;

    fetchProjects();
  }, [isFocused, user]);

  const fetchProjects = async (): Promise<boolean> => {
    try {
      setProjectLoading(true);
      setProjectError(null);

      const token = user?.TokenC || user?.Token;
      if (!token) {
        setProjectError("Session expired");
        await forceLogoutForMissingToken();
        return false;
      }

      const projectList = await ApiService.getAttendanceProjectList({
        token,
      });

      if (!projectList || projectList.length === 0) {
        setProjectError("No projects available");
        setProjects([]);
        return false;
      } else {
        const sortedProjects = [...projectList].sort((a, b) =>
          (a.NameC || "")
            .trim()
            .toLowerCase()
            .localeCompare((b.NameC || "").trim().toLowerCase())
        );

        setProjects(sortedProjects);
        setProjectError(null);
        setProjectRefreshAttempts(0);
        return true;
      }
    } catch (error) {
      console.error("Fetch projects error:", error);
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Failed to load projects";
      setProjectError(message);
      showSnackbar(message, "error");
      setProjects([]);
      return false;
    } finally {
      setProjectLoading(false);
    }
  };

  const handleOpenProjectModal = async () => {
    if (projectLoading || projectModalLoading) return;
    setProjectModalLoading(true);
    try {
      setShowProjectModal(true);
    } finally {
      setProjectModalLoading(false);
    }
  };

  const handleProjectNoDataRefresh = async () => {
    if (projectLoading || projectRefreshing || projectRefreshAttempts >= 2) return;

    const nextAttempts = projectRefreshAttempts + 1;
    setProjectRefreshAttempts(nextAttempts);
    setProjectRefreshing(true);

    try {
      const hasProjects = await fetchProjects();

      if (!hasProjects) {
        if (nextAttempts >= 2) {
          setProjectError("Please try again sometime");
          showSnackbar("Please try again sometime", "info");
        } else {
          showSnackbar("Please Contact Support", "info");
        }
      }
    } finally {
      setProjectRefreshing(false);
    }
  };

  // ✅ New camera capture using ImagePicker
  const takePicture = async () => {
    if (!isCameraGranted) {
      await handleRequestCameraPermission();
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.6,
        allowsEditing: false,
        aspect: [4, 3],
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setCapturedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("ImagePicker launchCamera failed:", error);
      ConfirmModal.alert("Camera Error", "Failed to take picture");
    }
  };

  // Reset form
  const resetForm = () => {
    setSelectedProject("");
    setRemarks("");
    setCapturedImage(null);
  };

  // Submit attendance (fresh location always taken)
  const handleSubmit = async () => {
    Sentry.setUser({
      id: String(empId),
      username: empName,
    });

    if (!selectedProject)
      return ConfirmModal.alert("Required", "Select project");

    if (!capturedImage)
      return ConfirmModal.alert("Required", "Capture your photo");

    setSubmitting(true);

    try {
      const token = user?.TokenC || user?.Token;

      if (!token || !empId) {
        await forceLogoutForMissingToken();
        return;
      }

      // 🔥 FRESH LOCATION ON EVERY SUBMIT
      let latestLocation: Location.LocationObject;

      try {
        latestLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
          mayShowUserSettingsDialog: true,
        });
      } catch {
        ConfirmModal.alert(
          "Location Error",
          "Unable to fetch current location. Please enable GPS and try again."
        );
        return;
      }

      const freshLocation = {
        latitude: latestLocation.coords.latitude,
        longitude: latestLocation.coords.longitude,
        accuracy: latestLocation.coords.accuracy,
      };

      // Check accuracy
      if (
        Number(freshLocation.accuracy ?? Number.POSITIVE_INFINITY) >
        LOCATION_REQUIRED_ACCURACY_METERS
      ) {
        ConfirmModal.alert(
          "Weak GPS Signal",
          "Weak GPS Signal. Please move to open area and try again."
        );
        return;
      }

      // Update UI with fresh location (optional)
      await updateLocationFromCoords({
        latitude: latestLocation.coords.latitude,
        longitude: latestLocation.coords.longitude,
        accuracy:
          latestLocation.coords.accuracy ?? undefined,
      });

      await ensureBaseUrl();

      const project = projects.find(
        (p) => String(p.IdN) === String(selectedProject)
      );

      if (!project) {
        ConfirmModal.alert("Required", "Selected project not found");
        return;
      }

      // Geo-fencing check
      if (Number(project.VerifiedAddressN) === 1) {
        const projectCoords = parseProjectCoords(project);

        if (!projectCoords) {
          ConfirmModal.alert("Required", "Project location not available");
          return;
        }

        const distance = distanceMeters(
          Number(freshLocation.latitude),
          Number(freshLocation.longitude),
          Number(projectCoords.latitude),
          Number(projectCoords.longitude)
        );

        const userRadius = Number(LOCATION_FROM_USER);
        const projectRadius = Number(project.AllowedRadiusN);

        const allowedRadius =
          Number.isFinite(projectRadius) && projectRadius > 0
            ? projectRadius
            : Number.isFinite(userRadius) && userRadius > 0
              ? userRadius
              : DEFAULT_ALLOWED_RADIUS_METERS;

        const gpsAccuracy = Math.max(0, Number(freshLocation.accuracy ?? 0));
        const driftBuffer = Math.min(gpsAccuracy, MAX_GPS_DRIFT_BUFFER_METERS);
        const effectiveRadius = allowedRadius + driftBuffer;

        if (distance > effectiveRadius) {
          const distanceDisplay = formatDistance(distance);

          ConfirmModal.alert(
            "Location Mismatch",
            `You are ${distanceDisplay} away from the project location (allowed ${Math.round(
              allowedRadius
            )}m).`
          );

          return;
        }
      }

      // Submit attendance
      const mode = attendanceType === "Check-in" ? 0 : 1;
      const serverDate = await ApiService.getRawServerTime(token);
      const createdUser = user?.EmpIdN;

      if (!createdUser) {
        ConfirmModal.alert("Session Error", "Please sign in again");
        return;
      }

      const res = await markMobileAttendance(
        token,
        empId,
        Number(selectedProject),
        mode,
        freshLocation,
        capturedImage,
        remarks,
        serverDate,
        createdUser
      );

      if (res.success) {
        resetForm();
        ConfirmModal.alert("Success", "Attendance marked", [
          {
            text: "OK",
            onPress: () => {
              try {
                protectedBack();
              } catch (error) {
                router.replace("/(tabs)/dashboard");
              }
            },
          },
        ]);
      } else {
        ConfirmModal.alert("Failed", res.message || "Attendance failed");
      }
    } catch (error) {
      console.error("Attendance submit error:", error);
      Sentry.captureException(error);
      ConfirmModal.alert("Error", "Unable to submit attendance right now");
    } finally {
      setSubmitting(false);
    }
  };

  // UI helpers (unchanged)
  const renderSegmentedControl = () => (
    <View
      style={[
        styles.segmentedContainer,
        { backgroundColor: theme.inputBg, borderColor: theme.inputBorder },
      ]}
    >
      {["Check-in", "Check-out"].map((type) => (
        <TouchableOpacity
          key={type}
          activeOpacity={0.8}
          style={[
            styles.segmentButton,
            attendanceType === type && {
              backgroundColor: theme.primary,
              shadowColor: theme.primary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 4,
            },
          ]}
          onPress={() => setAttendanceType(type as any)}
        >
          <Ionicons
            name={type === "Check-in" ? "log-in-outline" : "log-out-outline"}
            size={18}
            color={attendanceType === type ? "#fff" : theme.textLight}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[
              styles.segmentText,
              { color: attendanceType === type ? "#fff" : theme.textLight },
            ]}
          >
            {type}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const selectedProjectData = selectedProject
    ? projects.find((p) => String(p.IdN) === selectedProject)
    : null;
  const selectedProjectLocation = getProjectLocationText(selectedProjectData);
  const hasPhoto = Boolean(capturedImage);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header title="Mobile Attendance" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        alwaysBounceVertical={false}
        overScrollMode="never"
        contentContainerStyle={{
          paddingTop: HEADER_HEIGHT + 24,
        }}
      >
        {/* CLOCK SECTION */}
        <View style={styles.clockHeader}>
          <Text style={[styles.timeText, { color: theme.text }]}>
            {currentTime.toLocaleTimeString("en-US", {
              hour12: false,
            })}
          </Text>
          <Text style={[styles.dateText, { color: theme.placeholder }]}>
            {currentTime.toLocaleDateString("en-GB", {
              weekday: "short",
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </Text>
        </View>

        {/* MODE TOGGLE */}
        {renderSegmentedControl()}

        {/* FORM SECTION */}
        <View
          style={[
            styles.formCard,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.inputBorder,
            },
          ]}
        >
          <Text style={[styles.fieldLabel, { color: theme.textLight, marginTop: 16 }]}>
            PROJECT / SITE
          </Text>

          {projectError !== "No projects available" &&
            projects.length === 0 &&
            projectRefreshAttempts < 2 && (
              <TouchableOpacity
                activeOpacity={0.8}
                disabled={projectRefreshing || projectLoading}
                onPress={handleProjectNoDataRefresh}
                style={[styles.projectRefreshButton, { borderColor: theme.inputBorder }]}
              >
                {projectRefreshing ? (
                  <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                  <Ionicons name="refresh" size={13} color={theme.primary} />
                )}
                <Text style={[styles.projectRefreshButtonText, { color: theme.primary }]}>
                  {projectRefreshing ? "Refreshing..." : "Refresh Projects"}
                </Text>
              </TouchableOpacity>
            )}

          <TouchableOpacity
            style={[
              styles.selectorContainer,
              {
                backgroundColor: theme.inputBg,
                borderColor: theme.inputBorder,
              },
            ]}
            onPress={handleOpenProjectModal}
            activeOpacity={0.7}
          >
            <Ionicons
              name="briefcase-outline"
              size={20}
              color={theme.primary}
            />
            {selectedProject ? (
              <View style={styles.selectorTextBlock}>
                <Text
                  style={[styles.selectorText, { color: theme.text }]}
                  numberOfLines={1}
                >
                  {selectedProjectData?.NameC}
                </Text>
              </View>
            ) : (
              <Text style={[styles.selectorText, { color: theme.placeholder }]}>
                Select Project
              </Text>
            )}
            <Ionicons name="chevron-down" size={20} color={theme.text + "80"} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.selectorContainer,
              {
                backgroundColor: theme.inputBg,
                borderColor: theme.inputBorder,
              },
            ]}
            activeOpacity={0.7}
          >
            <Ionicons
              name="location-outline"
              size={20}
              color={theme.primary}
            />
            {selectedProject ? (
              <View style={styles.selectorTextBlock}>
                <Text
                  style={[styles.selectorText, { color: theme.text }]}
                >
                  {selectedProjectLocation}
                </Text>
              </View>
            ) : (
              <Text style={[styles.selectorText, { color: theme.placeholder }]}>
                Project Location
              </Text>
            )}
          </TouchableOpacity>

          <Text
            style={[
              styles.fieldLabel,
              { color: theme.textLight, marginTop: 16 },
            ]}
          >
            REMARKS
          </Text>
          <TextInput
            placeholder="Add some notes..."
            placeholderTextColor={theme.placeholder}
            value={remarks}
            onChangeText={setRemarks}
            multiline
            style={[
              styles.remarksInput,
              {
                borderColor: theme.inputBorder,
                backgroundColor: theme.inputBg,
                color: theme.text,
              },
            ]}
          />
        </View>

        {/* LOCATION STATUS */}
        <View style={styles.locationFooter}>
          <Ionicons name="location" size={16} color={theme.primary} />

          {location ? (
            <>
              <Text
                style={[styles.locationText, { color: theme.placeholder }]}
                numberOfLines={2}
              >
                <Text
                  style={[styles.locationText, { color: theme.text }]}
                  numberOfLines={1}
                >
                  {"Your Location: "}
                </Text>
                {location.address || "Geo-Location Active"}
              </Text>
            </>
          ) : (
            <View style={styles.locationDeniedWrap}>
              <Text
                style={[styles.locationText, { color: theme.placeholder }]}
                numberOfLines={2}
              >
                {locationPermission === "denied"
                  ? "Location permission is required"
                  : "Location not available"}
              </Text>
              {locationPermission !== "granted" && (
                <TouchableOpacity
                  onPress={handleRequestLocationPermission}
                  style={[
                    styles.locationAllowBtn,
                    { backgroundColor: theme.primary },
                  ]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.locationAllowBtnText}>
                    Allow Location
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        <View style={styles.employeeNameSection}>
          <Text style={[styles.employeeNameLabel, { color: theme.textLight }]}>
            Attendance for{" "}
          </Text>
          <Text
            style={[styles.employeeName, { color: theme.text }]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {empName}{` (${empCodeC})`}
          </Text>
        </View>

        {/* CAMERA TOGGLE - NOW USES IMAGE PICKER */}
        <View
          style={[
            styles.cameraToggleCard,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.inputBorder,
            },
          ]}
        >
          <View style={styles.cameraToggleTextWrap}>
            <Text style={[styles.cameraToggleTitle, { color: theme.text }]}>
              Identity Capture
            </Text>
            <Text style={[styles.cameraToggleSubtitle, { color: theme.placeholder }]}>
              {hasPhoto ? "Photo captured" : "Take a photo for verification"}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.cameraToggleBtn, { backgroundColor: theme.primary }]}
            activeOpacity={0.85}
            onPress={takePicture}
          >
            <Ionicons name="camera" size={18} color="#fff" />
            <Text style={styles.cameraToggleBtnText}>
              {isCameraGranted ? (hasPhoto ? "Retake Photo" : "Capture Photo") : "Allow Camera"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* CAPTURED IMAGE PREVIEW */}
        {capturedImage && (
          <View
            style={[
              styles.capturedCard,
              { backgroundColor: theme.cardBackground, borderColor: theme.inputBorder },
            ]}
          >
            <View style={styles.capturedHeader}>
              <View style={styles.capturedHeaderLeft}>
                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                <Text style={[styles.capturedTitle, { color: theme.text }]}>
                  Identity Photo
                </Text>
              </View>
              <TouchableOpacity
                onPress={takePicture} // Just call takePicture again
                style={styles.retakeBtn}
              >
                <Text style={{ color: theme.primary, fontWeight: "700" }}>
                  Retake
                </Text>
              </TouchableOpacity>
            </View>
            <Image source={{ uri: capturedImage }} style={styles.capturedPreview} />
          </View>
        )}

        {/* SUBMIT BUTTON */}
        <CustomButton
          title="SUBMIT ATTENDANCE"
          icon="arrow-forward"
          isLoading={submitting}
          disabled={!capturedImage}
          onPress={handleSubmit}
          style={{ marginHorizontal: 16 }}
        />
      </ScrollView>

      {/* Project Selection Modal (unchanged) */}
      <CenterModalSelection
        visible={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        title="Select Project"
        options={projects.map((p) => ({
          label: p.NameC,
          value: String(p.IdN),
          subLabel: getProjectLocationText(p),
        }))}
        selectedValue={selectedProject}
        onSelect={(val: string | number) => setSelectedProject(String(val))}
      />

      {projectModalLoading && (
        <View style={styles.projectLoadingOverlay}>
          <View
            style={[
              styles.projectLoadingModal,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.inputBorder,
              },
            ]}
          >
            <ActivityIndicator size="small" color={theme.primary} />
            <Text style={[styles.projectLoadingText, { color: theme.text }]}>
              Loading projects...
            </Text>
          </View>
        </View>
      )}

      <Snackbar
        key={snackbarKey}
        visible={snackbar.visible}
        message={snackbar.message}
        type={snackbar.type}
        topOffset={HEADER_HEIGHT}
        onDismiss={() => setSnackbar((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
};

export default Attendance;

// Styles remain exactly the same – no changes
const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  clockHeader: {
    alignItems: "center",
    paddingBottom: 20,
  },
  timeText: {
    fontSize: 48,
    fontWeight: "800",
    letterSpacing: -1,
  },
  dateText: {
    fontSize: 16,
    fontWeight: "500",
    marginTop: 4,
  },
  segmentedContainer: {
    flexDirection: "row",
    padding: 6,
    borderRadius: 4,
    borderWidth: 1,
    marginBottom: 24,
  },
  segmentButton: {
    flex: 1,
    flexDirection: "row",
    height: 44,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  segmentText: {
    fontSize: 14,
    fontWeight: "700",
  },
  formCard: {
    padding: 20,
    borderRadius: 4,
    borderWidth: 1,
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  pickerWrapper: {
    borderRadius: 4,
    borderWidth: 1,
    height: 50,
    justifyContent: "center",
    overflow: "hidden",
  },
  selectorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 4,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    marginTop: 4
  },
  selectorText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },
  selectorTextBlock: {
    flex: 1,
  },
  selectorSubText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },
  remarksInput: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 12,
    height: 80,
    textAlignVertical: "top",
    fontSize: 14,
  },
  projectRefreshButton: {
    alignSelf: "center",
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  projectRefreshButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  projectLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  projectLoadingModal: {
    minWidth: 170,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  projectLoadingText: {
    fontSize: 13,
    fontWeight: "600",
  },
  cameraToggleCard: {
    borderRadius: 4,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  cameraToggleTextWrap: {
    flex: 1,
  },
  cameraToggleTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  cameraToggleSubtitle: {
    fontSize: 12,
    fontWeight: "500",
  },
  cameraToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 4,
    gap: 6,
  },
  cameraToggleBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  // Removed cameraContainer, cameraFrame, etc. – not used anymore
  capturedCard: {
    borderRadius: 4,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  capturedHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  capturedHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  capturedTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  capturedPreview: {
    width: "100%",
    height: 250,
    borderRadius: 4,
  },
  retakeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  locationFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  locationDeniedWrap: {
    flex: 1,
    alignItems: "center",
  },
  locationText: {
    fontSize: 12,
    marginLeft: 6,
    fontWeight: "500",
  },
  locationAllowBtn: {
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  locationAllowBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
  employeeNameSection: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  employeeNameLabel: {
    flexShrink: 0,
    fontSize: 14,
    marginRight: 4,
  },
  employeeName: {
    flexShrink: 1,
    fontSize: 20,
    maxWidth: "100%",
    textAlign: "center",
  },
  // Removed overlayRoot, overlayBackdrop, modalCard, modalHeader, etc.
});