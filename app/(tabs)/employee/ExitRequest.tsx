import Header, { HEADER_HEIGHT } from "@/components/Header";
import { useProtectedBack } from "@/hooks/useProtectedBack";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { XMLParser } from "fast-xml-parser";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { CustomButton } from "../../../components/CustomButton";
import CenterModalSelection from "../../../components/common/CenterModalSelection";
import { useTheme } from "../../../context/ThemeContext";
import ApiService from "../../../services/ApiService";

interface ExitRequestData {
  EmpIdN?: number;
  RegNoticePeriodN?: number; // Notice Period (Display)
  RevokeDaysN?: number; // Revoke Days
  ResDeclareD?: string; // Date of Declaration
  ResExitDateD?: string; // Last working date (Selected)
  ShortFallDaysN?: number; // Short fall days
  RegWaiveN?: number; // Waive Notice Period? (Enum/Int?) Value seems 'Recover' in string or mapped int
  // 'Waive Notice Period' display value likely mapped from RegWaiveN or similar.
  // In screenshot it says "Recover". Maybe 1=Recover?

  StatusC?: string; // Exit Type e.g. "Resigned"
  RegReasonIdN?: number; // Exit Reason ID (Selected)
  RegNoteC?: string; // Exit Notes
}

interface ExitReason {
  IdN: number;
  NameC: string;
}

const parseAspDate = (dateString?: string) => {
  if (!dateString) return null;
  const match = dateString.match(/\/Date\((-?\d+)\)\//);
  if (match) return new Date(parseInt(match[1], 10));
  return new Date(dateString);
};

const formatDate = (dateString?: string) => {
  if (!dateString) return null;
  const date = parseAspDate(dateString);
  if (!date || isNaN(date.getTime()) || date.getFullYear() <= 1900) return null;
  return date.toDateString();
};

export default function ExitRequestScreen() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [exitData, setExitData] = useState<ExitRequestData>({});
  const [reasons, setReasons] = useState<ExitReason[]>([]);

  // Check if editing is allowed (new request only)
  const isReadOnly = !!exitData.EmpIdN;

  // Form States
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedReason, setSelectedReason] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [showReasonModal, setShowReasonModal] = useState(false);

  useProtectedBack({
    home: "/home",
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      // Fetch Reasons
      const reasonsRes = await ApiService.getExitReasons();
      let reasonList: ExitReason[] = [];
      if (reasonsRes.success && reasonsRes.data) {
        let rData = reasonsRes.data;
        // If it's a string, try parsing XML (fallback)
        if (typeof rData === "string" && rData.includes("<NewDataSet>")) {
          const parser = new XMLParser();
          const parsed = parser.parse(rData);
          rData = parsed?.NewDataSet?.Table || [];
        }

        const rawList = Array.isArray(rData) ? rData : rData ? [rData] : [];

        // Map API response fields (EmpCodeC as Name, EmpIdN as ID) to Component Interface
        reasonList = rawList.map((r: any) => ({
          IdN: r.EmpIdN,
          NameC: r.EmpCodeC, // Based on User JSON: EmpCodeC holds the reason text "Personal", "Absconding" etc.
        }));

        setReasons(reasonList);
      }

      // Fetch Request Data
      const reqRes = await ApiService.getExitRequests();
      if (reqRes.success && reqRes.data) {
        let eData = reqRes.data;
        // It might return { Status: 'success', data: { ...object... } }
        // or { Status: 'success', data: "<xml...>" }
        // The user snippet shows a C# class structure, likely serialized JSON or XML wrapped list.
        // Assuming typical API behavior from this user: likely wrapped in 'data' prop.

        let finalData: any = {};

        if (eData.data) {
          let innerData = eData.data;
          if (
            typeof innerData === "string" &&
            innerData.includes("<NewDataSet>")
          ) {
            const parser = new XMLParser();
            const parsed = parser.parse(innerData);
            innerData = parsed?.NewDataSet?.Table;
          }
          // It might be an array exit list? usually one active exit request?
          finalData = Array.isArray(innerData) ? innerData[0] : innerData;
        }

        if (finalData) {
          setExitData(finalData);
          // Initialize form
          if (finalData.ResExitDateD) {
            const parsed = parseAspDate(finalData.ResExitDateD);
            if (parsed) setSelectedDate(parsed);
          }
          if (finalData.RegReasonIdN) setSelectedReason(finalData.RegReasonIdN);
          if (finalData.RegNoteC) setNotes(finalData.RegNoteC);
        }
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to fetch exit details");
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchInitialData(true);
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleSubmit = async (isExit: boolean = true) => {
    // According to instructions: "Exit" button likely means Submit/Update.
    // There is also "Upload" button - ignoring for now as no functionality requested.

    if (!selectedReason) {
      Alert.alert("Validation", "Please select an Exit Reason");
      return;
    }

    setSubmitLoading(true);
    try {
      // Ensure dates are in ISO format
      let declareDate = exitData.ResDeclareD
        ? exitData.ResDeclareD.includes("/Date(")
          ? parseAspDate(exitData.ResDeclareD)
          : new Date(exitData.ResDeclareD)
        : new Date();

      // Fix: If date is invalid or too old (e.g. 1899), use today
      if (
        !declareDate ||
        isNaN(declareDate.getTime()) ||
        declareDate.getFullYear() < 2000
      ) {
        declareDate = new Date();
      }

      const payload = {
        EmpIdN: exitData.EmpIdN || ApiService.getCurrentUser().empId || 0,
        EmpStatusN: 3, // Default as requested
        RegClearanceN: false,
        RegNoteC: notes,
        RegNoticePeriodN: exitData.RegNoticePeriodN || 0,
        RegReasonIdN: String(selectedReason),
        RegWaiveN: exitData.RegWaiveN || 0,
        ResDeclareD: declareDate
          ? declareDate.toISOString()
          : new Date().toISOString(),
        ResExitDateD: selectedDate.toISOString(),
        RevokeDaysN: exitData.RevokeDaysN || 1,
        ShortFallDaysN: exitData.ShortFallDaysN || 0,
      };

      const result = await ApiService.updateExitRequest(payload);
      // console.log("Update Exit Request Response:", result);
      if (result.success) {
        Alert.alert("Success", "Exit request updated successfully");
        fetchInitialData();
      } else {
        Alert.alert("Error", result.error || "Failed to update");
      }
    } catch (error) {
      Alert.alert("Error", "An error occurred");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleRevoke = async () => {
    Alert.alert(
      "Revoke Request",
      "Are you sure you want to revoke your exit request?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Revoke",
          style: "destructive",
          onPress: async () => {
            setSubmitLoading(true);
            try {
              const result = await ApiService.revokeExitRequest();
              if (result.success) {
                Alert.alert("Success", "Exit request revoked successfully");
                setExitData({}); // Clear local data
                setNotes("");
                setSelectedReason(0);
                fetchInitialData(); // Refresh to be sure
              } else {
                Alert.alert(
                  "Error",
                  result.error || "Failed to revoke request",
                );
              }
            } catch (error) {
              Alert.alert("Error", "An error occurred while revoking");
            } finally {
              setSubmitLoading(false);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.text }]}>
          Loading Exit Request...
        </Text>
      </View>
    );
  }

  // Helper to get status color
  const getStatusColor = () => {
    if (exitData.EmpIdN) return "#FF9500"; // Pending/Submitted
    return theme.primary;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header title="Exit Request" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Status Banner */}
        <LinearGradient
          colors={
            exitData.EmpIdN
              ? ["#FF9500", "#FF6B00"]
              : [theme.primary, theme.primary + "CC"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statusBanner}
        >
          <View style={styles.statusContent}>
            <Ionicons
              name={exitData.EmpIdN ? "time-outline" : "document-text-outline"}
              size={32}
              color="#fff"
            />
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusTitle}>
                {exitData.EmpIdN
                  ? "Exit Request Submitted"
                  : "New Exit Request"}
              </Text>
              <Text style={styles.statusSubtitle}>
                {exitData.EmpIdN
                  ? "Pending Approval"
                  : "Fill in the details below"}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Exit Type Badge */}
        <View
          style={[
            styles.badgeContainer,
            { backgroundColor: theme.cardBackground },
          ]}
        >
          <View
            style={[styles.badge, { backgroundColor: theme.primary + "20" }]}
          >
            <Ionicons name="exit-outline" size={16} color={theme.primary} />
            <Text style={[styles.badgeText, { color: theme.primary }]}>
              {exitData.StatusC || "Resigned"}
            </Text>
          </View>
        </View>

        {/* Policy Information Section */}
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: theme.cardBackground },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Ionicons
              name="information-circle"
              size={24}
              color={theme.primary}
            />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Policy Information
            </Text>
          </View>

          <View style={styles.infoGrid}>
            <View style={[styles.infoItem, { borderColor: theme.inputBorder }]}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={theme.primary}
              />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.text + "AA" }]}>
                  Notice Period
                </Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>
                  {exitData.RegNoticePeriodN || 0} days
                </Text>
              </View>
            </View>

            <View style={[styles.infoItem, { borderColor: theme.inputBorder }]}>
              <Ionicons
                name="refresh-outline"
                size={20}
                color={theme.primary}
              />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.text + "AA" }]}>
                  Revoke Days
                </Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>
                  {exitData.RevokeDaysN || 1} days
                </Text>
              </View>
            </View>

            <View style={[styles.infoItem, { borderColor: theme.inputBorder }]}>
              <Ionicons
                name="alert-circle-outline"
                size={20}
                color={theme.primary}
              />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.text + "AA" }]}>
                  Short Fall Days
                </Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>
                  {exitData.ShortFallDaysN || 0} days
                </Text>
              </View>
            </View>

            <View style={[styles.infoItem, { borderColor: theme.inputBorder }]}>
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color={theme.primary}
              />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.text + "AA" }]}>
                  Waive Notice
                </Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>
                  {exitData.RegWaiveN === 1 ? "Waive" : "Recover"}
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.dateRow, { borderTopColor: theme.inputBorder }]}>
            <Ionicons name="flag-outline" size={20} color={theme.primary} />
            <View style={styles.dateContent}>
              <Text style={[styles.infoLabel, { color: theme.text + "AA" }]}>
                Date of Declaration
              </Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>
                {formatDate(exitData.ResDeclareD) || new Date().toDateString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Exit Details Section */}
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: theme.cardBackground },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Ionicons name="create-outline" size={24} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Exit Details
            </Text>
          </View>

          {/* Last Working Date */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>
              <Ionicons name="calendar" size={16} color={theme.primary} /> Last
              Working Date
            </Text>
            <TouchableOpacity
              style={[
                styles.dateButton,
                {
                  borderColor: theme.inputBorder,
                  backgroundColor: isReadOnly
                    ? theme.background
                    : theme.inputBg,
                },
              ]}
              onPress={() => !isReadOnly && setShowDatePicker(true)}
              disabled={isReadOnly}
              activeOpacity={0.7}
            >
              <Ionicons
                name="calendar-outline"
                size={20}
                color={theme.primary}
              />
              <Text style={[styles.dateText, { color: theme.text }]}>
                {selectedDate.toLocaleDateString("en-US", {
                  weekday: "short",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </Text>
              {!isReadOnly && (
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={theme.text + "80"}
                />
              )}
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )}
          </View>

          {/* Exit Reason */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>
              <Ionicons name="list" size={16} color={theme.primary} /> Exit
              Reason *
            </Text>
            <TouchableOpacity
              style={[
                styles.pickerButton,
                {
                  borderColor: theme.inputBorder,
                  backgroundColor: isReadOnly
                    ? theme.background
                    : theme.inputBg,
                },
              ]}
              onPress={() => !isReadOnly && setShowReasonModal(true)}
              disabled={isReadOnly}
              activeOpacity={0.7}
            >
              <Ionicons
                name="clipboard-outline"
                size={20}
                color={theme.primary}
                style={styles.pickerIcon}
              />
              <Text style={[styles.pickerText, { color: theme.text }]}>
                {reasons.find((r) => r.IdN === selectedReason)?.NameC ||
                  "Select Reason"}
              </Text>
              {!isReadOnly && (
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={theme.text + "80"}
                />
              )}
            </TouchableOpacity>
          </View>

          {/* Exit Notes */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>
              <Ionicons name="document-text" size={16} color={theme.primary} />{" "}
              Exit Notes
            </Text>
            <View
              style={[
                styles.textAreaContainer,
                {
                  borderColor: theme.inputBorder,
                  backgroundColor: isReadOnly
                    ? theme.background
                    : theme.inputBg,
                },
              ]}
            >
              <TextInput
                style={[styles.textArea, { color: theme.text }]}
                multiline
                numberOfLines={4}
                editable={!isReadOnly}
                value={notes}
                onChangeText={setNotes}
                placeholder={
                  isReadOnly
                    ? "No notes provided"
                    : "Enter your exit notes here..."
                }
                placeholderTextColor={theme.placeholder}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Policy Last Working Date (Read-only) */}
          <View
            style={[
              styles.policyDateContainer,
              {
                backgroundColor: theme.background,
                borderColor: theme.inputBorder,
              },
            ]}
          >
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={theme.primary}
            />
            <View style={styles.policyDateContent}>
              <Text
                style={[styles.policyDateLabel, { color: theme.text + "AA" }]}
              >
                Last Working Date (As per Policy)
              </Text>
              <Text style={[styles.policyDateValue, { color: theme.text }]}>
                {formatDate(exitData.ResExitDateD) || new Date().toDateString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer Buttons */}
        <View
          style={[
            styles.footer,
            {
              backgroundColor: "transparent",
              borderTopWidth: 0,
              elevation: 0,
              shadowOpacity: 0,
              paddingBottom: 0,
            },
          ]}
        >
          {exitData.EmpIdN ? (
            <CustomButton
              title="Revoke Request"
              icon="close-circle"
              onPress={handleRevoke}
              isLoading={submitLoading}
              disabled={submitLoading}
              style={[styles.button, styles.revokeButton]}
            />
          ) : (
            <CustomButton
              title="Submit"
              icon="send"
              onPress={() => handleSubmit()}
              isLoading={submitLoading}
              disabled={submitLoading}
              style={[styles.button, { backgroundColor: theme.primary }]}
            />
          )}
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 20 }} />
      </ScrollView>

      <CenterModalSelection
        visible={showReasonModal}
        onClose={() => setShowReasonModal(false)}
        title="Select Exit Reason"
        options={reasons.map((r) => ({ label: r.NameC, value: r.IdN }))}
        selectedValue={selectedReason}
        onSelect={(val: number) => setSelectedReason(val)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "500",
  },
  scrollContent: {
    paddingTop: HEADER_HEIGHT + 12,
    marginHorizontal: 16,
  },

  // Status Banner
  statusBanner: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  statusContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
  },

  // Badge
  badgeContainer: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: "600",
  },

  // Section Card
  sectionCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },

  // Info Grid
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 12,
  },
  infoItem: {
    flex: 1,
    minWidth: "45%",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: "rgba(0,0,0,0.02)",
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "700",
  },

  // Date Row
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: 16,
    marginTop: 12,
    borderTopWidth: 1,
  },
  dateContent: {
    flex: 1,
  },

  // Input Group
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  // Date Button
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 12,
  },
  dateText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },

  // Picker
  pickerButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingLeft: 12,
    paddingRight: 12,
    paddingVertical: 14,
    gap: 8,
  },
  pickerIcon: {
    marginRight: 4,
  },
  pickerText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },

  // Text Area
  textAreaContainer: {
    borderWidth: 1.5,
    borderRadius: 12,
    overflow: "hidden",
  },
  textArea: {
    padding: 14,
    fontSize: 15,
    minHeight: 120,
    maxHeight: 200,
  },

  // Policy Date Container
  policyDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
  },
  policyDateContent: {
    flex: 1,
  },
  policyDateLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  policyDateValue: {
    fontSize: 15,
    fontWeight: "600",
  },

  // Footer
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    padding: 16,
    borderTopWidth: 1,
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 180,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    marginBottom: 0,
  },
  revokeButton: {
    backgroundColor: "#FF3B30",
  },
});
