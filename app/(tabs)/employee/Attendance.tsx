import CenterModalSelection from "@/components/common/CenterModalSelection";
import ConfirmModal from "@/components/common/ConfirmModal";
import { CustomButton } from "@/components/CustomButton";
import Header, { HEADER_HEIGHT } from "@/components/Header";
import { useTheme } from "@/context/ThemeContext";
import { useUser } from "@/context/UserContext";
import { useProtectedBack } from "@/hooks/useProtectedBack";
import ApiService, { markMobileAttendance } from "@/services/ApiService";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Image,
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
    if (!capturedImage) return;

    const timer = setTimeout(() => {
      ConfirmModal.alert(
        "Session Timeout",
        "Please fill again."
      );
      resetForm();
    }, 30000); // 30 seconds

    return () => clearTimeout(timer);
  }, [capturedImage]);


  /* ---------------- PERMISSIONS ---------------- */
  useEffect(() => {
    requestPermission();
    fetchProjects();
  }, []);

  useProtectedBack({
    home: "/home",
    dashboard: "/dashboard",
    employeelist: "/officer/emplist",
  });

  const protectedBack = useProtectedBack({
    home: "/home",
    dashboard: "/dashboard",
    employeelist: "/officer/emplist",
  });

  /* ---------------- LOCATION ---------------- */
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        ConfirmModal.alert("Permission Required", "Location permission is required");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };

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
    })();
  }, []);

  /* ---------------- PROJECT LIST ---------------- */
  const fetchProjects = async () => {
    try {
      const token = user?.TokenC || user?.Token;
      if (!token) return;

      const projectList = await ApiService.getAttendanceProjectList({
        token, // ✅ PASS AS OBJECT
      });

      setProjects(projectList);
    } catch (error) {
      console.error("Fetch projects error:", error);
      setProjects([]);
    }
  };

  /* ---------------- MANUAL CAPTURE ---------------- */
  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.6,
        skipProcessing: true,
      });

      if (photo?.uri) {
        setCapturedImage(photo.uri);
      }
    } catch {
      ConfirmModal.alert("Camera Error", "Failed to take picture");
    }
  };

  /* ---------------- SUBMIT ---------------- */
  const resetForm = () => {
    setSelectedProject("");
    setRemarks("");
    setCapturedImage(null);
    setCameraFacing("front");
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

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header title="Mobile Attendance" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: HEADER_HEIGHT + 24, // header + status bar
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
          <TouchableOpacity
            style={[
              styles.selectorContainer,
              {
                backgroundColor: theme.inputBg,
                borderColor: theme.inputBorder,
              },
            ]}
            onPress={() => setShowProjectModal(true)}
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
            <Text
              style={[styles.locationText, { color: theme.placeholder }]}
              numberOfLines={2}
            >
              {"Locatoin Not Found"}
            </Text>
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

        {/* CAMERA SECTION */}
        <View
          style={[styles.cameraContainer, { borderColor: theme.inputBorder }]}
        >
          <View style={styles.cameraFrame}>
            {permission?.granted && !capturedImage && (
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

            {capturedImage ? (
              <Image source={{ uri: capturedImage }} style={styles.preview} />
            ) : permission?.granted ? (
              <CameraView
                ref={cameraRef}
                facing={cameraFacing}
                style={styles.preview}
              />
            ) : (
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
                  onPress={requestPermission}
                >
                  <Text style={styles.permissionBtnText}>Allow Camera</Text>
                </TouchableOpacity>
              </View>
            )}

            {!capturedImage && permission?.granted && (
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
            {!capturedImage && permission?.granted ? (
              <CustomButton
                title="CAPTURE IDENTITY"
                onPress={takePicture}
                style={{ marginHorizontal: 8 }}
                icon="camera"
              />
            ) : (
              <View style={styles.retakeRow}>
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                <Text
                  style={{
                    color: "#10B981",
                    fontWeight: "600",
                    flex: 1,
                    marginLeft: 8,
                  }}
                >
                  Identity Verified
                </Text>
                <TouchableOpacity
                  onPress={() => setCapturedImage(null)}
                  style={styles.retakeBtn}
                >
                  <Text style={{ color: theme.primary, fontWeight: "700" }}>
                    Retake
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

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

  cameraContainer: {
    borderRadius: 4,
    overflow: "hidden",
    borderWidth: 0,
    marginBottom: 16,
    alignItems: "center"
  },
  cameraFrame: {
    height: 240,
    width: "80%",
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

  locationFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  locationText: {
    fontSize: 12,
    marginLeft: 6,
    fontWeight: "500",
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
});
