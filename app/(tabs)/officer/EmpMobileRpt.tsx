import ConfirmModal from "@/components/common/ConfirmModal";
import DynamicTable, { ColumnDef } from "@/components/DynamicTable";
import Header, { HEADER_HEIGHT } from "@/components/Header";
import { formatDateForApi } from "@/constants/timeFormat";
import { useUser } from "@/context/UserContext";
import { useProtectedBack } from "@/hooks/useProtectedBack";
import { getDomainUrl } from "@/services/urldomain";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../../context/ThemeContext";
import ApiService from "../../../services/ApiService";

interface AttendanceRecord {
  ModeN: number;
  EmpNameC: string;
  EmpCodeC: string;
  ProjectNameC: string;
  DateD: string;
  ShiftCodeC: string;
  PunchTimeC: string;
  PunchLocC: string;
  RemarkC: string;
  ImageUrl?: string;
  DateC?: string;
  EmpIdN?: number;
}

export default function EmpMobileRpt() {
  const { theme } = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);

  // Date states
  const today = new Date();
  const tenDaysAgo = new Date();
  tenDaysAgo.setDate(today.getDate() - 10);
  const [fromDate, setFromDate] = useState(tenDaysAgo);
  const [toDate, setToDate] = useState(today);

  React.useEffect(() => {
    setToDate(new Date());
  }, [fromDate]);

  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const { user } = useUser();

  const tableWidth = Math.max(1100, Dimensions.get("window").width);

  useProtectedBack({
    home: "/home",
    settings: "/settings",
    dashboard: "/dashboard",
  });

  // Format date for display (MMM dd yyyy)
  const formatDisplayDate = (dateVal: string | Date | null) => {
    if (!dateVal) return "";

    let d: Date;
    if (typeof dateVal === "string") {
      // Handle ASP.NET format /Date(123456789)/
      if (dateVal.includes("/Date(")) {
        const timestamp = parseInt(
          dateVal.replace(/\/Date\((-?\d+)\)\//, "$1"),
        );
        if (!isNaN(timestamp)) {
          d = new Date(timestamp);
        } else {
          return dateVal;
        }
      } else {
        d = new Date(dateVal);
      }
    } else {
      d = dateVal;
    }

    if (isNaN(d.getTime())) return String(dateVal);
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

  // Format date for API (MM/dd/yyyy)
  // const formatDateForApi = (d: Date) => {
  //   const day = String(d.getDate()).padStart(2, "0");
  //   const month = String(d.getMonth() + 1).padStart(2, "0");
  //   const year = d.getFullYear();
  //   return `${month}/${day}/${year}`;
  // };

  const fetchAttendanceReport = async () => {
    setLoading(true);
    try {
      const fromDateStr = formatDateForApi(fromDate);
      const toDateStr = formatDateForApi(toDate);

      // console.log('Fetching attendance report:', { fromDateStr, toDateStr });

      const result = await ApiService.getAttendanceReport(
        fromDateStr,
        toDateStr,
        0,
      );

      // console.log(result, "result");

      const customerId = user?.CustomerIdC;
      const companyId = user?.CompIdN;

      const domainUrl = await getDomainUrl();

      if (result.success && result.data) {
        const withImages = result.data.map((row: AttendanceRecord) => {
          const canBuildImage =
            domainUrl && customerId && companyId && row.EmpIdN && row.DateC;
          const version = row.DateC || "";
          return {
            ...row,
            ImageUrl: canBuildImage
              ? `${domainUrl}/kevit-Customer/${customerId}/${companyId}/${row.EmpIdN}/MobileAtten/${row.DateC}.jpg?v=${version}`
              : undefined,
          };
        });
        setAttendanceData(withImages);
        // console.log("Attendance data loaded:", result.data.length, "records");
      } else {
        console.error("Failed to fetch attendance report:", result.error);
        ConfirmModal.alert(
          "Error",
          result.error || "Failed to fetch attendance report",
        );
      }
    } catch (error: any) {
      console.error("Error fetching attendance report:", error);
      ConfirmModal.alert(
        "Error",
        error?.message || "Failed to fetch attendance report",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAttendanceReport();
  }, [fromDate, toDate, user?.CustomerIdC, user?.CompIdN]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAttendanceReport();
  };

  const onChangeFrom = (event: any, selectedDate?: Date) => {
    setShowFromPicker(false);
    if (selectedDate) {
      if (selectedDate > toDate) {
        ConfirmModal.alert("Invalid Date", "From date cannot be after To date");
        return;
      }
      setFromDate(selectedDate);
    }
  };

  const onChangeTo = (event: any, selectedDate?: Date) => {
    setShowToPicker(false);
    if (selectedDate) {
      if (selectedDate < fromDate) {
        ConfirmModal.alert("Invalid Date", "To date cannot be before From date");
        return;
      }
      setToDate(selectedDate);
    }
  };

  const columns: ColumnDef[] = [
    {
      key: "DateD",
      label: "Date",
      flex: 0.6,
      align: "center",
      formatter: (v) => formatDisplayDate(v as string),
    },
    {
      key: "PunchTimeC",
      label: "Time",
      flex: 0.7,
      align: "center",
      formatter: (v) => (v ? String(v) : "N/A"),
    },
    {
      key: "EmpNameC",
      label: "Employee",
      flex: 0.9,
      align: "flex-start",
      formatter: (v) => (v ? String(v) : "N/A"),
    },
    {
      key: "ImageUrl",
      label: "Photo",
      flex: 0.5,
      align: "center",
    },
    {
      key: "EmpCodeC",
      label: "Code",
      flex: 0.6,
      align: "center",
      formatter: (v) => (v ? String(v) : "N/A"),
    },
    {
      key: "ModeN",
      label: "Mode",
      flex: 0.5,
      align: "center",
      formatter: (v) => (Number(v) === 0 ? "IN" : "OUT"),
    },
    {
      key: "ShiftCodeC",
      label: "Shift",
      flex: 0.7,
      align: "center",
      formatter: (v) => (v ? String(v) : "N/A"),
    },
    {
      key: "ProjectNameC",
      label: "Project",
      flex: 1.2,
      align: "flex-start",
      formatter: (v) => (v ? String(v) : "N/A"),
    },
    {
      key: "PunchLocC",
      label: "Location",
      flex: 1.4,
      align: "flex-start",
      formatter: (v) => (v ? String(v) : "N/A"),
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header title="Mobile Attendance Report" />

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      >
        {/* Date Picker Section */}
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
              onPress={() => setShowFromPicker(true)}
            >
              <Text style={[styles.dateLabel, { color: theme.placeholder }]}>
                From Date
              </Text>
              <View style={styles.dateRow}>
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={theme.primary}
                />
                <Text style={[styles.dateValue, { color: theme.text }]}>
                  {formatDisplayDate(fromDate)}
                </Text>
              </View>
            </TouchableOpacity>

            <View
              style={[
                styles.dateDivider,
                { backgroundColor: theme.inputBorder },
              ]}
            />

            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowToPicker(true)}
            >
              <Text style={[styles.dateLabel, { color: theme.placeholder }]}>
                To Date
              </Text>
              <View style={styles.dateRow}>
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={theme.primary}
                />
                <Text style={[styles.dateValue, { color: theme.text }]}>
                  {formatDisplayDate(toDate)}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Table Container */}
        <View style={styles.tableContainer}>
          {loading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={[styles.emptyText, { color: theme.placeholder }]}>
                Loading...
              </Text>
            </View>
          ) : attendanceData.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="document-text-outline"
                size={64}
                color={theme.icon}
              />
              <Text style={[styles.emptyText, { color: theme.placeholder }]}>
                No attendance records found
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.placeholder }]}>
                Try adjusting the date range
              </Text>
            </View>
          ) : (
            <DynamicTable
              data={attendanceData}
              columns={columns}
              tableWidth={tableWidth}
              theme={theme}
            />
          )}
        </View>
      </ScrollView>

      {/* Date Pickers */}
      {showFromPicker && (
        <DateTimePicker
          value={fromDate}
          mode="date"
          display="default"
          onChange={onChangeFrom}
        />
      )}
      {showToPicker && (
        <DateTimePicker
          value={toDate}
          mode="date"
          display="default"
          onChange={onChangeTo}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    marginTop: HEADER_HEIGHT,
  },
  scrollContent: {
    flexGrow: 1,
  },
  datePickerSection: {
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  dateCard: {
    flexDirection: "row",
    borderRadius: 4,
    padding: 4,
    elevation: 3,
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
  dateDivider: {
    width: 1,
    height: "60%",
  },
  tableContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    textAlign: "center",
  },
});
