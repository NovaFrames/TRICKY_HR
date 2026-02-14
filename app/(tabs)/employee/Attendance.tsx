import CenterModalSelection from "@/components/common/CenterModalSelection";
import ConfirmModal from "@/components/common/ConfirmModal";
import Snackbar from "@/components/common/Snackbar";
import { CustomButton } from "@/components/CustomButton";
import Header, { HEADER_HEIGHT } from "@/components/Header";
import { useTheme } from "@/context/ThemeContext";
import { useUser } from "@/context/UserContext";
import { useProtectedBack } from "@/hooks/useProtectedBack";
import ApiService, { markMobileAttendance } from "@/services/ApiService";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { Camera, CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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
  const { user } = useUser();
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

  const cameraRef = useRef<CameraView>(null);

  const [permission, requestPermission] = useCameraPermissions();
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
  } | null>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<"front" | "back">("front");
  const isFocused = useIsFocused();
  const [cameraKey, setCameraKey] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const captureLockRef = useRef(false);
  const [showCamera, setShowCamera] = useState(false);
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

  const [locationPermission, setLocationPermission] =
    useState<Location.PermissionStatus | null>(null);
  const [cameraPermissionStatus, setCameraPermissionStatus] = useState<
    "granted" | "denied" | "undetermined" | null
  >(null);

  const updateLocationFromCoords = async (coords: {
    latitude: number;
    longitude: number;
  }) => {
    setLocation(coords);
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

  const refreshCameraPermission = async () => {
    const current = await Camera.getCameraPermissionsAsync();
    setCameraPermissionStatus(current.status);
    return current;
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
        const current = await refreshCameraPermission();
        await refreshLocationPermission({ silent: true });

        if (current.status === "granted") {
          // 🔥 Force camera re-init
          setCameraReady(false);
          setTimeout(() => {
            setCameraKey((k) => k + 1);
            setCameraReady(true);
          }, 200);
        }
      }
    });

    return () => sub.remove();
  }, []);


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

      const loc = await Location.getCurrentPositionAsync({});
      await updateLocationFromCoords({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
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

  const isCameraGranted =
    cameraPermissionStatus === "granted" || permission?.granted === true;

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    if (isFocused && isCameraGranted && !capturedImage && showCamera) {
      setCameraReady(false); // reset first
      timeout = setTimeout(() => {
        setCameraReady(true);
        setCameraKey((prev) => prev + 1); // force fresh mount
      }, 250); // 🔑 small delay (200–300ms is ideal)
    }

    return () => {
      clearTimeout(timeout);
      setCameraReady(false);
    };
  }, [isFocused, isCameraGranted, capturedImage, cameraFacing, showCamera]);

  useEffect(() => {
    if (!showCamera) {
      setCameraReady(false);
    }
  }, [showCamera]);


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

  /* ---------------- CLOCK ---------------- */
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
    let baseTime = new Date(); // fallback

    // 1️⃣ Start local clock immediately
    setCurrentTime(baseTime);
    timer = setInterval(() => {
      baseTime = new Date(baseTime.getTime() + 1000);
      setCurrentTime(new Date(baseTime));
    }, 1000);

    // 2️⃣ Sync with server time (optional but accurate)
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


  useEffect(() => {
    if (!capturedImage && !showCamera) return;

    const timer = setTimeout(() => {
      ConfirmModal.alert(
        "Session Timeout",
        "Please fill again."
      );
      resetForm();
    }, 30000); // 30 seconds

    return () => clearTimeout(timer);
  }, [capturedImage, showCamera]);

  /* ---------------- PERMISSIONS ---------------- */

  useEffect(() => {
    if (isFocused && isCameraGranted && !capturedImage && showCamera) {
      setCameraKey((prev) => prev + 1);
    }
  }, [isFocused, isCameraGranted, capturedImage, cameraFacing, showCamera]);

  const protectedBack = useProtectedBack({
    home: "/home",
    dashboard: "/dashboard",
    employeelist: "/officer/emplist",
  });

  /* ---------------- LOCATION ---------------- */
  // useEffect(() => {
  //   (async () => {
  //     await ensureLocation({ silent: true });
  //   })();
  // }, []);

  const handleRequestLocationPermission = async () => {
    const current = await Location.getForegroundPermissionsAsync();
    setLocationPermission(current.status);

    console.log("Current location permission:", current);

    if (current.granted) {
      await ensureLocation();
      return;
    }

    if (current.canAskAgain) {
      const requested = await Location.requestForegroundPermissionsAsync(); // popup again
      setLocationPermission(requested.status);
      if (requested.granted) {
        await ensureLocation();
        return;
      }
      if (!requested.canAskAgain) {
        ConfirmModal.alert(
          "Location Permission Blocked",
          "Please enable location permission from settings",
          [{ text: "Open Settings", onPress: Linking.openSettings }]
        );
      }
      return;
    }

    if (!current.canAskAgain) {
      const requested = await Location.requestForegroundPermissionsAsync(); // popup again
      setLocationPermission(requested.status);
      if (requested.granted) {
        await ensureLocation();
        return;
      }
      if (!requested.canAskAgain) {
        ConfirmModal.alert(
          "Location Permission Blocked",
          "Please enable location permission from settings",
          [{ text: "Open Settings", onPress: Linking.openSettings }]
        );
      }
      return;
    }

    ConfirmModal.alert(
      "Location Permission Blocked",
      "Please enable location permission from settings",
      [{ text: "Open Settings", onPress: Linking.openSettings }]
    );
  };


  /* ---------------- PROJECT LIST ---------------- */
  useEffect(() => {
    if (isFocused) {
      fetchProjects();
    }
  }, [isFocused]);


  const fetchProjects = async (): Promise<boolean> => {
    try {
      setProjectLoading(true);
      setProjectError(null);

      const token = user?.TokenC || user?.Token;
      if (!token) {
        setProjectError("Session expired");
        showSnackbar("Session expired", "error");
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
        setProjects(projectList);
        setProjectError(null);
        setProjectRefreshAttempts(0);
        return true;
      }

    } catch (error) {
      console.error("Fetch projects error:", error);
      setProjectError("Failed to load projects");
      showSnackbar("Failed to load projects", "error");
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
      await fetchProjects();
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

  /* ---------------- MANUAL CAPTURE ---------------- */
  const handleRequestCameraPermission = async () => {
    let current = await refreshCameraPermission();

    // ✅ Already granted → just activate camera
    if (current.status === "granted") {
      setCameraReady(false);
      setTimeout(() => {
        setCameraKey(k => k + 1);
        setCameraReady(true);
      }, 200);
      return;
    }

    // ✅ Ask system popup (THIS shows Android dialog)
    if (current.canAskAgain) {
      console.log("Requesting can ask again permission...");
      const result = await requestPermission();

      // 🔁 Re-check after popup
      current = await refreshCameraPermission();

      if (current.status === "granted") {
        setCameraReady(false);
        setTimeout(() => {
          setCameraKey(k => k + 1);
          setCameraReady(true);
        }, 200);
      }
      return;
    } else {
      console.log("Requesting camera permission...");
      await requestPermission(); // Try again if user denied but can ask again
      await refreshCameraPermission();
    }

    // ❌ Only here we open settings
    ConfirmModal.alert(
      "Camera Permission Required",
      "Camera permission was permanently denied. Enable it from settings.",
      [{ text: "Open Settings", onPress: Linking.openSettings }]
    );
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;
    if (captureLockRef.current || isCapturing) return;
    if (!isCameraGranted || !cameraReady || capturedImage) return;

    try {
      captureLockRef.current = true;
      setIsCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.6,
        skipProcessing: true,
      });

      if (photo?.uri) {
        setCapturedImage(photo.uri);
        setShowCamera(false);
      }
    } catch {
      ConfirmModal.alert("Camera Error", "Failed to take picture");
    } finally {
      captureLockRef.current = false;
      setIsCapturing(false);
    }
  };

  /* ---------------- SUBMIT ---------------- */
  const resetForm = () => {
    setSelectedProject("");
    setRemarks("");
    setCapturedImage(null);
    setCameraFacing("front");
    setShowCamera(false);
  };

  const handleSubmit = async () => {
    if (!selectedProject) return ConfirmModal.alert("Required", "Select project");
    if (!capturedImage) return ConfirmModal.alert("Required", "Capture your photo");
    if (!location) return ConfirmModal.alert("Required", "Location not ready");

    setSubmitting(true);
    try {
      const token = user?.TokenC || user?.Token;

      if (!token || !empId) {
        ConfirmModal.alert("Session Error", "Please sign in again");
        return;
      }
      const project = projects.find(
        (p) => String(p.IdN) === String(selectedProject),
      );

      if (!project) {
        ConfirmModal.alert("Required", "Selected project not found");
        return;
      }

      // Only enforce geo-fencing for verified projects
      if (Number(project.VerifiedAddressN) === 1) {
        const projectCoords = parseProjectCoords(project);

        if (!projectCoords) {
          ConfirmModal.alert("Required", "Project location not available");
          return;
        }

        const distance = distanceMeters(
          Number(location.latitude),
          Number(location.longitude),
          Number(projectCoords.latitude),
          Number(projectCoords.longitude),
        );

        if (distance > 100) {
          const distanceDisplay =
            distance >= 1000
              ? `${(distance / 1000).toFixed(1)} km`
              : `${Math.round(distance)} meters`;

          ConfirmModal.alert(
            "Location Mismatch",
            `You are ${distanceDisplay} away from the project location`,
          );
          return;
        }
      }

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
        location,
        capturedImage,
        remarks,
        serverDate,
        createdUser,
      );

      if (res.success) {
        resetForm();
        ConfirmModal.alert("Success", "Attendance marked", [
          { text: "OK", onPress: () => protectedBack() },
        ]);
      } else {
        ConfirmModal.alert("Failed", res.message || "Attendance failed");
      }
    } catch (error) {
      console.error("Attendance submit error:", error);
      ConfirmModal.alert("Error", "Unable to submit attendance right now");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------- UI ---------------- */
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
  const cameraToggleLabel = showCamera
    ? "Hide Camera"
    : hasPhoto
      ? "View Camera"
      : "Open Camera";

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header title="Mobile Attendance" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}                 // iOS
        alwaysBounceVertical={false}    // iOS
        overScrollMode="never"          // Android 🔑
        contentContainerStyle={{
          paddingTop: HEADER_HEIGHT + 24,
        }}
      >
        {/* CLOCK SECTION */}
        <View style={styles.clockHeader}>
          <Text style={[styles.timeText, { color: theme.text }]}>
            {/* {currentTime.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })} */}
            {/* <Text style={{ fontSize: 18, fontWeight: "400" }}>
              :{currentTime.getSeconds().toString().padStart(2, "0")}
            </Text> */}
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


          <Text style={[styles.fieldLabel, { color: theme.textLight }]}>
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

        {/* CAMERA TOGGLE */}
        {!capturedImage && (
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
                {hasPhoto ? "Photo captured" : "Open the camera to capture your photo"}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.cameraToggleBtn, { backgroundColor: theme.primary }]}
              activeOpacity={0.85}
              onPress={() => setShowCamera(true)}
            >
              <Ionicons
                name={showCamera ? "close" : "camera"}
                size={18}
                color="#fff"
              />
              <Text style={styles.cameraToggleBtnText}>{cameraToggleLabel}</Text>
            </TouchableOpacity>
          </View>
        )}

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
                onPress={() => {
                  setCapturedImage(null);
                  setShowCamera(true);
                }}
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

      {/* CAMERA OVERLAY */}
      {showCamera && (
        <View style={styles.overlayRoot}>
          <TouchableOpacity
            style={styles.overlayBackdrop}
            activeOpacity={1}
            onPress={() => setShowCamera(false)}
          />
          <View
            style={[
              styles.modalCard,
              { backgroundColor: theme.cardBackground, borderColor: theme.inputBorder },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Capture Identity
              </Text>
              <TouchableOpacity
                onPress={() => setShowCamera(false)}
                style={styles.modalCloseBtn}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={20} color={theme.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.cameraFrame}>
              {isCameraGranted && !capturedImage && (
                <TouchableOpacity
                  style={styles.switchCameraBtn}
                  onPress={() =>
                    setCameraFacing((prev) =>
                      prev === "front" ? "back" : "front",
                    )
                  }
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="camera-reverse-outline"
                    size={22}
                    color="#fff"
                  />
                </TouchableOpacity>
              )}

              {isFocused && cameraReady && isCameraGranted ? (
                <CameraView
                  key={cameraKey}
                  ref={cameraRef}
                  facing={cameraFacing}
                  style={styles.preview}
                  onMountError={() => {
                    ConfirmModal.alert(
                      "Camera Error",
                      "Unable to start camera"
                    );
                  }}
                />
              ) : !isCameraGranted ? (
                <View
                  style={[
                    styles.permissionBlock,
                    { backgroundColor: theme.inputBg },
                  ]}
                >
                  <Ionicons
                    name="camera-outline"
                    size={32}
                    color={theme.placeholder}
                  />
                  <Text
                    style={[styles.permissionText, { color: theme.placeholder }]}
                  >
                    Camera permission is required
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[
                      styles.permissionBtn,
                      { backgroundColor: theme.primary },
                    ]}
                    onPress={handleRequestCameraPermission}
                  >
                    <Text style={styles.permissionBtnText}>Allow Camera</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View
                  style={[
                    styles.preview,
                    { backgroundColor: "#000", justifyContent: "center", alignItems: "center" },
                  ]}
                >
                  <Ionicons name="camera-outline" size={32} color="#777" />
                  <Text style={{ color: "#777", marginTop: 6 }}>Loading camera…</Text>
                </View>
              )}

              {isCameraGranted && (
                <View style={styles.cameraOverlay}>
                  <View
                    style={[
                      styles.faceGuide,
                      { borderColor: theme.primary + "50" },
                    ]}
                  />
                </View>
              )}
            </View>

            <View
              style={[
                styles.cameraActions,
                { backgroundColor: theme.cardBackground },
              ]}
            >
              <CustomButton
                title="CAPTURE IDENTITY"
                onPress={takePicture}
                style={{ marginHorizontal: 8 }}
                icon="camera"
                isLoading={isCapturing}
                disabled={isCapturing || !cameraReady || !isCameraGranted}
              />
            </View>
          </View>
        </View>
      )}

      {/* Project Selection Modal */}
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

/* ---------------- STYLES ---------------- */
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

  cameraContainer: {
    borderRadius: 4,
    overflow: "hidden",
    borderWidth: 0,
    marginBottom: 16,
    alignItems: "center"
  },
  cameraFrame: {
    height: 260,
    width: Math.min(width * 0.82, 340),
    overflow: "hidden",
    borderRadius: 4,
  },
  switchCameraBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 10,
    borderRadius: 24,
    zIndex: 10,
  },
  preview: { width: "100%", height: "100%" },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  faceGuide: {
    width: 180,
    height: 220,
    borderRadius: 4,
    borderWidth: 2,
    borderStyle: "dashed",
  },
  cameraActions: {
    padding: 12,
  },
  permissionBlock: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  permissionText: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 8,
  },
  permissionBtn: {
    marginTop: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  permissionBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
  captureBtnFull: {
    flexDirection: "row",
    height: 50,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  captureBtnText: {
    color: "#fff",
    fontWeight: "700",
    marginLeft: 8,
  },
  retakeRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 4,
  },
  retakeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

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

  submitBtn: {
    height: 60,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 1,
  },

  overlayRoot: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    zIndex: 50,
  },
  overlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  modalCard: {
    width: "100%",
    borderRadius: 6,
    borderWidth: 1,
    padding: 12,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 18,
  },
});
