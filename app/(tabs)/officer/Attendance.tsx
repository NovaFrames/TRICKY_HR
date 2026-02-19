import ConfirmModal from "@/components/common/ConfirmModal";
import DynamicTable, { ColumnDef } from "@/components/DynamicTable";
import Header, { HEADER_HEIGHT } from "@/components/Header";
import { API_ENDPOINTS } from "@/constants/api";
import { useTheme } from "@/context/ThemeContext";
import { UserData, useUser } from "@/context/UserContext";
import { useProtectedBack } from "@/hooks/useProtectedBack";
import { api, ensureBaseUrl } from "@/services/ApiService";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Types for Attendance Data
export interface AttendanceShift {
  EmpCodeC: string;
  EmpNameC: string;
  ShiftInN: number;
  ShiftOutN: number;
  ShiftCodeC: string;
  ReaCodeC?: string;
}

export interface AttendanceOther {
  EmpNameC: string;
  EmpCodeC: string;
  ActN: number;
  NRMN: number;
  LateN: number;
  UnderN: number;
  TInN: number;
  TOutN: number;
}

const normalizeDate = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12);

export default function AttendanceList() {
  const { theme } = useTheme();
  const { user } = useUser();
  const router = useRouter();

  useProtectedBack({
    home: "/home",
  });

  // Date states
  const [selectedDate, setSelectedDate] = useState(() =>
    normalizeDate(new Date()),
  );

  const [showDatePicker, setShowDatePicker] = useState(false);

  const [loading, setLoading] = useState(false);
  const [shiftData, setShiftData] = useState<AttendanceShift[]>([]);

  const loginData: Partial<UserData> = user ?? {};
  const token = loginData.Token || loginData.TokenC;

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate]);

  const formatDateForApi = (d: Date) => {
    const local = normalizeDate(d);
    const month = String(local.getMonth() + 1).padStart(2, "0");
    const day = String(local.getDate()).padStart(2, "0");
    const year = local.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const formatDisplayDate = (d: Date) => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2, "0")} ${d.getFullYear()}`;
  };

  const fetchAttendance = async () => {
    if (!token) return;

    const today = normalizeDate(new Date());

    if (selectedDate > today) {
      ConfirmModal.alert("Invalid Date", "Future dates are not allowed");
      setSelectedDate(today);
      return;
    }

    setLoading(true);
    try {
      await ensureBaseUrl();
      const payload = {
        TokenC: token,
        FDate: formatDateForApi(selectedDate),
        TDate: formatDateForApi(selectedDate),
      };

      const response = await api.post(API_ENDPOINTS.ATTENDANCE_LIST, payload);

      if (response.data.Status === "success") {
        const data = response.data.data || [];
        // console.log("Attendance Data:", data);
        setShiftData(data);
      } else {
        setShiftData([]);
      }
    } catch (error) {
      console.error("Fetch Attendance Error:", error);
      ConfirmModal.alert("Error", "Failed to fetch attendance records.");
    } finally {
      setLoading(false);
    }
  };

  const onChangeDate = (_: any, selected?: Date) => {
    setShowDatePicker(false);
    if (!selected) return;

    const newDate = normalizeDate(selected);
    setSelectedDate(newDate);
  };

  const renderHeader = () => (
    <View style={styles.headerWrapper}>
      {/* Date Picker Card */}
      <View style={styles.datePickerSection}>
        <View
          style={[
            styles.dateCard,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.inputBorder,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={[styles.dateLabel, { color: theme.textLight }]}>
              Date
            </Text>
            <View style={styles.dateRow}>
              <Ionicons
                name="calendar-outline"
                size={18}
                color={theme.primary}
              />
              <Text style={[styles.dateValue, { color: theme.text }]}>
                {formatDisplayDate(selectedDate)}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // single table view (SHIFT only)

  // Table columns for DynamicTable (SHIFT view)
  const tableWidth = Math.max(780, Dimensions.get("window").width);

  const shiftColumns: ColumnDef[] = [
    {
      key: "DateD",
      label: "Date",
      flex: 0.5,
      align: "flex-start",
      formatter: (v) =>
        typeof v === "string"
          ? new Date(Number(v.replace(/\D/g, ""))).toLocaleDateString()
          : "",
    },
    { key: "EmpCodeC", label: "Code", flex: 0.5, align: "flex-start" },
    { key: "EmpNameC", label: "Name", flex: 0.8, align: "flex-start" },
    { key: "ShiftCodeC", label: "Shift", flex: 0.7, align: "center" },

    {
      key: "ShiftInN",
      label: "Shift In",
      flex: 0.4,
      align: "flex-end",
      formatter: (v) => (typeof v === "number" ? v.toFixed(2) : "0.00"),
    },
    {
      key: "ShiftOutN",
      label: "Shift Out",
      flex: 0.5,
      align: "flex-end",
      formatter: (v) => (typeof v === "number" ? v.toFixed(2) : "0.00"),
    },
    { key: "ReaCodeC", label: "Reason", flex: 0.5, align: "center" },

    { key: "AttC", label: "Attendance", flex: 0.6, align: "center" },
    {
      key: "TInN",
      label: "Actual In",
      flex: 0.5,
      align: "flex-end",
      formatter: (v) => (typeof v === "number" ? v.toFixed(2) : "0.00"),
    },
    {
      key: "TOutN",
      label: "Actual Out",
      flex: 0.6,
      align: "flex-end",
      formatter: (v) => (typeof v === "number" ? v.toFixed(2) : "0.00"),
    },
    {
      key: "ShiftNRMN",
      label: "Shift NRM",
      flex: 0.5,
      align: "flex-end",
    },
    { key: "LateN", label: "Late", flex: 0.4, align: "flex-end" },
    { key: "UnderN", label: "Under", flex: 0.4, align: "flex-end" },

    { key: "NRMN", label: "NRM", flex: 0.4, align: "flex-end" },
    { key: "AOTN", label: "AOT", flex: 0.4, align: "flex-end" },
    { key: "EOTN", label: "EOT", flex: 0.4, align: "flex-end" },

    {
      key: "LockN",
      label: "Locked",
      flex: 0.6,
      align: "center",
      formatter: (v) => (v === 1 ? "Yes" : "No"),
    },
  ];

  return (
    <View style={[styles.safeArea]}>
      <View
        style={[
          styles.listContainer,
          { backgroundColor: theme.background, flex: 1 },
        ]}
      >
        <Header title="Attendance List" />
        <ScrollView contentContainerStyle={{ paddingTop: HEADER_HEIGHT }}>
          {renderHeader()}

          {/* <Text
            style={{
              textAlign: "center",
              marginTop: 8,
              color: theme.textLight,
            }}
          >
            Showing attendance on{" "}
            <Text style={{ fontWeight: "700" }}>
              {formatDisplayDate(selectedDate)}
            </Text>
          </Text> */}

          <View style={{ paddingHorizontal: 16, paddingTop: 8, flex: 1 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <DynamicTable
                data={shiftData}
                columns={shiftColumns}
                tableWidth={1400}
                theme={theme}
              />
            </ScrollView>

            {!shiftData.length && !loading && (
              <View style={styles.emptyState}>
                <Ionicons
                  name="document-text-outline"
                  size={64}
                  color={theme.textLight}
                />
                <Text style={[styles.emptyText, { color: theme.textLight }]}>
                  No records found
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={onChangeDate}
          maximumDate={new Date()}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerWrapper: {
    backgroundColor: "transparent",
    borderRadius: 4,
  },
  headerContainer: {
    paddingTop: Platform.OS === "ios" ? 0 : 10,
    paddingBottom: 4,
    zIndex: 1,
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  iconButton: {
    padding: 8,
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  datePickerSection: {
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  dateCard: {
    flexDirection: "row",
    borderRadius: 4,
    padding: 4,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    alignItems: "center",
    borderWidth: 1,
  },
  dateInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  tabsContainer: {
    flexDirection: "row",
    marginTop: 5,
    marginHorizontal: 16,
    borderRadius: 4,
    padding: 4,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 4,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
  },
  activeTabText: {
    color: "#fff",
  },
  listContainer: {
    flex: 1,
    marginTop: 0,
    elevation: 2,
    overflow: "hidden",
  },
  listHeader: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    marginTop: 15,
  },
  headerCell: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
  },
  listContent: {
    paddingBottom: 40,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    alignItems: "center",
  },
  cell: {
    justifyContent: "center",
    alignItems: "center",
  },
  cellText: {
    fontSize: 12,
    textAlign: "center",
  },
  cellTextBold: {
    fontSize: 12,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 50,
    opacity: 0.6,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
  },
});
