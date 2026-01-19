import DatePicker from "@/components/DatePicker";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

import DynamicTable, { ColumnDef } from "@/components/DynamicTable";
import { BACK_FALLBACKS } from "@/components/Header";
import {
    formatDateForApi,
    formatDisplayDate,
    formatTimeNumber,
} from "@/constants/timeFormat";
import { useProtectedBack } from "@/hooks/useProtectedBack";
import TimeRequestModal from "../../../components/TimeManage/TimeRequestModal";
import { useTheme } from "../../../context/ThemeContext";
import ApiService from "../../../services/ApiService";

/* ---------------- CONSTANTS ---------------- */

const ROW_HEIGHT = 44;
const TABLE_WIDTH = 780;

const TIME_COLUMNS: ColumnDef[] = [
  {
    key: "DateD",
    label: "Date",
    flex: 2,
    align: "flex-start",
    formatter: (v) => formatDisplayDate(v),
  },
  { key: "ShiftCodeC", label: "Shift", flex: 1.6, align: "center" },
  {
    key: "TInN",
    label: "In",
    flex: 1,
    align: "flex-end",
    formatter: (v) => formatTimeNumber(v),
  },
  {
    key: "TOutN",
    label: "Out",
    flex: 1,
    align: "flex-end",
    formatter: (v) => formatTimeNumber(v),
  },
  { key: "ReaCodeC", label: "Reason", flex: 1.2, align: "flex-start" },
  {
    key: "ActN",
    label: "Actual",
    flex: 1,
    align: "flex-end",
    formatter: (v) => formatTimeNumber(v),
  },
  {
    key: "NRMN",
    label: "NRM",
    flex: 1,
    align: "flex-end",
    formatter: (v) => formatTimeNumber(v),
  },
  {
    key: "LateN",
    label: "Late",
    flex: 1,
    align: "flex-end",
    formatter: (v) => formatTimeNumber(v),
  },
  {
    key: "UnderN",
    label: "Under",
    flex: 1,
    align: "flex-end",
    formatter: (v) => formatTimeNumber(v),
  },
  {
    key: "OTH1N",
    label: "OT1",
    flex: 1,
    align: "flex-end",
    formatter: (v) => formatTimeNumber(v),
  },
  {
    key: "OTH2N",
    label: "OT2",
    flex: 1,
    align: "flex-end",
    formatter: (v) => formatTimeNumber(v),
  },
  {
    key: "OTH3N",
    label: "OT3",
    flex: 1,
    align: "flex-end",
    formatter: (v) => formatTimeNumber(v),
  },
  {
    key: "OTH4N",
    label: "OT4",
    flex: 1,
    align: "flex-end",
    formatter: (v) => formatTimeNumber(v),
  },
];

/* ---------------- COMPONENT ---------------- */

export default function TimeManage() {
  const { theme } = useTheme();
  const router = useRouter();

  const [timeData, setTimeData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [viewingUrl, setViewingUrl] = useState<string | null>(null);

  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [toDate, setToDate] = useState(new Date());

  useProtectedBack({
    home: "/home",
    settings: "/settings",
    dashboard: "/dashboard",
  });

  useEffect(() => {
    const d = new Date(fromDate);
    d.setDate(d.getDate() + 30);
    setToDate(d);
  }, [fromDate]);

  /* ---------------- API ---------------- */

  const fetchTimeData = async () => {
    setLoading(true);
    try {
      const res = await ApiService.getTimeManageList(
        formatDateForApi(fromDate),
        formatDateForApi(toDate),
      );
      if (res?.success) setTimeData(res.data || []);
      console.log("timemanageData: ", res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeData();
  }, [fromDate, toDate]);

  const handleDownloadedFile = async (
    url: string,
    shouldShare: boolean = false,
  ) => {
    try {
      if (!url) {
        throw new Error("Download URL is empty");
      }

      // Define temp path for sharing or iOS download logic
      const fileName = `TimeReport_${new Date().getTime()}.pdf`;
      const fileUri = FileSystem.documentDirectory + fileName;

      // Log details
      console.log("Starting download from URL:", url);

      // 1. If explicit "Download" on Android -> Use Storage Access Framework to save to user's folder
      if (!shouldShare && Platform.OS === "android") {
        const permissions =
          await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (permissions.granted) {
          // Download to temp first
          const downloadRes = await FileSystem.downloadAsync(url, fileUri);
          if (downloadRes.status !== 200)
            throw new Error("Failed to download temp file");

          // Read content
          const base64 = await FileSystem.readAsStringAsync(downloadRes.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });

          // Create file in user's chosen directory
          const createdUri =
            await FileSystem.StorageAccessFramework.createFileAsync(
              permissions.directoryUri,
              fileName,
              "application/pdf",
            );

          // Write content
          await FileSystem.writeAsStringAsync(createdUri, base64, {
            encoding: FileSystem.EncodingType.Base64,
          });

          Alert.alert("Success", "File saved successfully to selected folder.");
          return;
        } else {
          // User cancelled or denied permission
          return;
        }
      }

      // 2. Default logic: Download to app document directory (for Sharing or iOS)
      const downloadRes = await FileSystem.downloadAsync(url, fileUri);

      if (downloadRes.status === 200) {
        console.log("Download complete:", downloadRes.uri);

        if (shouldShare) {
          const isAvailable = await Sharing.isAvailableAsync();
          if (isAvailable) {
            await Sharing.shareAsync(downloadRes.uri, {
              mimeType: "application/pdf",
              dialogTitle: "Download Time Report",
              UTI: "com.adobe.pdf",
            });
          } else {
            Alert.alert("Success", "File downloaded to: " + downloadRes.uri);
          }
        } else {
          Alert.alert("Success", "File downloaded successfully.");
        }
      } else {
        throw new Error(`Download failed with status: ${downloadRes.status}`);
      }
    } catch (error: any) {
      console.error("Error downloading file:", error);
      Alert.alert(
        "Download Error",
        error?.message || "Could not download the file.",
      );
    }
  };

  const validateAndGetDates = () => {
    if (toDate < fromDate) {
      Alert.alert("Error", "To date must be greater than From date");
      return null;
    }

    const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 31) {
      Alert.alert("Error", "Total days must be less than 31 days");
      return null;
    }

    return {
      fromDateStr: formatDateForApi(fromDate),
      toDateStr: formatDateForApi(toDate),
    };
  };

  const handleShare = async () => {
    const dates = validateAndGetDates();
    if (!dates) return;

    setDownloading(true);

    try {
      console.log("Downloading report for sharing:", dates);
      const result = await ApiService.downloadTimeReport(
        dates.fromDateStr,
        dates.toDateStr,
      );

      if (result.success && result.url) {
        await handleDownloadedFile(result.url, true);
      } else {
        const errorMsg = result.error || "Failed to download report";
        Alert.alert("Download Failed", errorMsg);
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.message || "Download failed. Please try again.",
      );
    } finally {
      setDownloading(false);
    }
  };

  const handleView = async () => {
    const dates = validateAndGetDates();
    if (!dates) return;

    setDownloading(true);

    try {
      console.log("Downloading report for viewing:", dates);
      const result = await ApiService.downloadTimeReport(
        dates.fromDateStr,
        dates.toDateStr,
      );

      if (result.success && result.url) {
        setViewingUrl(result.url);
      } else {
        const errorMsg = result.error || "Failed to open report";
        Alert.alert("View Failed", errorMsg);
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.message || "Failed to open report. Please try again.",
      );
    } finally {
      setDownloading(false);
    }
  };

  const { from } = useLocalSearchParams<{ from?: string }>();

  const handleBack = () => {
    if (typeof from === "string" && BACK_FALLBACKS[from]) {
      router.replace(BACK_FALLBACKS[from]);
      return;
    }
    router.back();
  };

  /* ---------------- HEADER ---------------- */

  const renderHeader = () => (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => handleBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>

        <Text style={[styles.navTitle, { color: theme.text }]}>
          Time Management
        </Text>

        <View style={{ flexDirection: "row", gap: 16 }}>
          <TouchableOpacity onPress={handleView} disabled={downloading}>
            {downloading ? (
              <ActivityIndicator size="small" color={theme.text} />
            ) : (
              <Ionicons
                name="document-text-outline"
                size={24}
                color={theme.text}
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleShare} disabled={downloading}>
            <Ionicons
              name="share-social-outline"
              size={24}
              color={theme.text}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.datePickerSection}>
        <DatePicker
          fromDate={fromDate}
          toDate={toDate}
          onFromChange={setFromDate}
        />
      </View>
    </>
  );

  /* ---------------- RENDER ---------------- */

  return (
    <View style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {renderHeader()}

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {/* <View style={{ width: TABLE_WIDTH }}> */}

        <DynamicTable
          data={timeData}
          columns={TIME_COLUMNS} // remove this to auto-generate
          theme={theme}
          tableWidth={900}
        />

        {/* </View> */}
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.primary }]}
        onPress={() => setShowRequestModal(true)}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      <TimeRequestModal
        visible={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        onSuccess={fetchTimeData}
      />

      {/* PDF Viewer Modal */}
      <Modal
        visible={!!viewingUrl}
        transparent={true}
        onRequestClose={() => setViewingUrl(null)}
        animationType="slide"
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: "black" }}>
          <View style={styles.viewerHeader}>
            <TouchableOpacity
              onPress={() => setViewingUrl(null)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            <Text
              style={{
                color: "white",
                fontWeight: "bold",
                flex: 1,
                textAlign: "center",
              }}
            >
              Report Preview
            </Text>
            <TouchableOpacity
              onPress={() =>
                viewingUrl && handleDownloadedFile(viewingUrl, false)
              }
            >
              <Ionicons name="download-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1 }}>
            {viewingUrl && (
              <WebView
                source={{
                  uri:
                    Platform.OS === "android"
                      ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(viewingUrl)}`
                      : viewingUrl,
                }}
                style={{ flex: 1 }}
                startInLoadingState={true}
                renderLoading={() => (
                  <View
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <ActivityIndicator size="large" color={theme.primary} />
                  </View>
                )}
              />
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  safeArea: { flex: 1 },

  navBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    alignItems: "center",
  },

  navTitle: {
    fontSize: 17,
    fontWeight: "700",
  },

  datePickerSection: {
    paddingHorizontal: 8,
  },

  tableRow: {
    flexDirection: "row",
    height: ROW_HEIGHT,
    minWidth: TABLE_WIDTH,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },

  headerRow: {
    borderBottomWidth: 2,
  },

  cell: {
    justifyContent: "center",
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderColor: "#e5e7eb",
  },

  headerText: {
    fontSize: 12,
    fontWeight: "700",
  },

  cellText: {
    fontSize: 11,
    fontWeight: "500",
  },

  fab: {
    position: "absolute",
    bottom: 60,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  viewerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.8)",
  },
  closeButton: {
    padding: 8,
  },
});
