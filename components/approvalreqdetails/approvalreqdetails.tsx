import { formatDisplayDate, formatTimeNumber } from "@/constants/timeFormat";
import { useTheme } from "@/context/ThemeContext";
import { useProtectedBack } from "@/hooks/useProtectedBack";
import ApiService, { LeaveType } from "@/services/ApiService";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Href, useLocalSearchParams } from "expo-router";
import { XMLParser } from "fast-xml-parser";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import DynamicTable, { ColumnDef } from "../DynamicTable";
import Header from "../Header";

/* ---------------- TYPES ---------------- */

type ApprovalItem = {
  IdN: number;
  EmpIdN: number;
  NameC: string;
  CodeC: string;
  DescC: string;
  LvDescC: string;
  FromDateC: string;
  ToDateC: string;
  LeaveDaysN: string;
  StatusC: string;
  EmpRemarksC: string;
  ApproveRemarkC: string;
  ApproveRejDateD: string;
  ApplyDateD: string;
};

interface FormattedLeaveType extends LeaveType {
  formattedBalance: string;
  formattedEligible: string;
  formattedCredit: string;
  formattedSurrender: string;
  formattedBF: string;
  formattedEarn: string;
  formattedTotal: string;
  formattedRequest: string;
  formattedTaken: string;
}

/* ---------------- COMPONENT ---------------- */

export default function ApprovalReqDetails() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { details, parentFrom } = useLocalSearchParams<{
    details?: string;
    parentFrom?: string;
  }>();

  /* ---------------- BACK HANDLING ---------------- */

  const parentFromParam =
    typeof parentFrom === "string" ? parentFrom : undefined;

  const approvalDetailsBackTarget: Href = parentFromParam
    ? { pathname: "/(tabs)/officer/approvaldetails", params: { from: parentFromParam } }
    : "/(tabs)/officer/approvaldetails";

  useProtectedBack({
    approvaldetails: approvalDetailsBackTarget,
  });


  const [loading, setLoading] = useState(false);
  const [formattedLeaves, setFormattedLeaves] = useState<FormattedLeaveType[]>([]);

  /* ---------------- PARSE PARAM ---------------- */

  const approval = useMemo<ApprovalItem | null>(() => {
    const param = Array.isArray(details) ? details[0] : details;
    if (!param || typeof param !== "string") return null;

    try {
      return JSON.parse(param);
    } catch {
      return null;
    }
  }, [details]);

  /* ---------------- TABLE COLUMNS ---------------- */

  const ATTENDANCE_COLUMNS: ColumnDef[] = [
    { key: "ReaGrpNameC", label: "Leave", flex: 2 },
    { key: "EligibleN", label: "Eligible", align: "center" },
    { key: "BFN", label: "B/F", align: "center", formatter: formatTimeNumber },
    { key: "CreditN", label: "Credit", align: "center", formatter: formatTimeNumber },
    { key: "ALEarnN", label: "Earn", align: "center" },
    { key: "ALTotalN", label: "Total", align: "center", formatter: formatTimeNumber },
    { key: "TakenN", label: "Taken", align: "center", formatter: formatTimeNumber },
    { key: "BalanceN", label: "Balance", flex: 1.32, align: "center", formatter: formatTimeNumber },
  ];

  /* ---------------- API ---------------- */

  const loadLeaveData = async (id: number) => {
    try {
      setLoading(true);
      setFormattedLeaves([]);

      if (!approval) return;

      const result = await ApiService.getLeaveApprovalDetails({
        IdN: approval.EmpIdN,
      });

      const rawData = result?.data?.data;
      if (!rawData) {
        Alert.alert("Info", "No leave data found");
        return;
      }

      let tableData: LeaveType[] = [];

      /* ----------------------------------
         CASE 1: API already returned JSON
      -----------------------------------*/
      if (Array.isArray(rawData)) {
        tableData = rawData[0]?.EmpLeaveApply ?? [];
      }

      /* ----------------------------------
         CASE 2: API returned XML string
      -----------------------------------*/
      else if (typeof rawData === "string") {
        const parser = new XMLParser({
          ignoreAttributes: false,
          parseTagValue: true,
        });

        const json = parser.parse(rawData);

        const table =
          json?.NewDataSet?.Table &&
            Array.isArray(json.NewDataSet.Table)
            ? json.NewDataSet.Table
            : json?.NewDataSet?.Table
              ? [json.NewDataSet.Table]
              : [];

        tableData = table;
      }

      if (!tableData.length) {
        Alert.alert("Info", "No leave data found");
        return;
      }

      const formatted = tableData.map(formatLeaveData);
      setFormattedLeaves(formatted);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to load leave details");
    } finally {
      setLoading(false);
    }
  };


  /* ---------------- IMPORTANT FIX ---------------- */
  /* Re-run EVERY TIME screen is focused */

  useFocusEffect(
    useCallback(() => {
      if (!approval?.IdN) return;

      loadLeaveData(approval.IdN);
    }, [approval?.IdN])
  );

  /* ---------------- FORMATTER ---------------- */

  const formatLeaveData = (leave: LeaveType): FormattedLeaveType => {
    const safe = (v?: number) => Number(v ?? 0).toFixed(2);

    return {
      ...leave,
      formattedBalance: safe(leave.BalanceN),
      formattedEligible: safe(leave.EligibleN),
      formattedCredit: safe(leave.CreditN),
      formattedSurrender: safe(leave.LVSurrenderN),
      formattedBF: safe(leave.BFN),
      formattedEarn: safe(leave.ALEarnN),
      formattedTotal: safe(leave.ALTotalN),
      formattedRequest: safe(leave.RequestN),
      formattedTaken: safe(leave.TakenN),
    };
  };
  /* ---------------- RENDER GUARD ---------------- */

  if (!approval) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No request details found.</Text>
      </View>
    );
  }

  const statusInfo = getStatusInfo(approval.StatusC);

  /* ---------------- SMALL UI COMPONENTS ---------------- */

  const DetailItem = ({
    label,
    value,
    icon,
  }: {
    label: string;
    value: string;
    icon: keyof typeof Ionicons.glyphMap;
  }) => (
    <View style={styles.detailItem}>
      <View style={[styles.detailIcon, { backgroundColor: theme.inputBg }]}>
        <Ionicons name={icon} size={18} color={theme.primary} />
      </View>
      <View style={styles.detailText}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value || "—"}</Text>
      </View>
    </View>
  );

  /* ---------------- RENDER ---------------- */

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Header title="Approval/Reject Details" />

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.name}>{approval.NameC}</Text>
            <Text style={styles.code}>{approval.CodeC}</Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
            <View style={[styles.dot, { backgroundColor: statusInfo.color }]} />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.inputBorder }]} />

        <DetailItem
          icon="document-text-outline"
          label="REQUEST TYPE"
          value={approval.DescC || "-"}
        />
        <DetailItem
          icon="time-outline"
          label="LEAVE TYPE"
          value={approval.LvDescC || "-"}
        />
        <DetailItem
          icon="calendar-outline"
          label="APPLY DATE"
          value={formatDisplayDate(approval.ApplyDateD)}
        />
        <DetailItem
          icon="calendar-clear-outline"
          label="APPROVE/REJECT DATE"
          value={formatDisplayDate(approval.ApproveRejDateD)}
        />
        <DetailItem
          icon="hourglass-outline"
          label="DAYS"
          value={approval.LeaveDaysN}
        />
        <DetailItem
          icon="chatbubble-outline"
          label="EMPLOYEE REMARKS"
          value={approval.EmpRemarksC || "-"}
        />
        <DetailItem
          icon="chatbubble-ellipses-outline"
          label="APPROVE REMARKS"
          value={approval.ApproveRemarkC || "-"}
        />
      </View>

      {/* TABLE */}
      <View style={{ marginTop: 16 }}>
        {approval.DescC === "LEAVE" ? (
          loading ? (
            <ActivityIndicator size="large" color={theme.primary} />
          ) : (
            <DynamicTable
              data={formattedLeaves}
              columns={ATTENDANCE_COLUMNS}
              theme={theme}
              tableWidth={600}
            />
          )
        ) : (
          <Text style={styles.emptyText}>
            No leave data available for this request.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

/* ---------------- HELPERS ---------------- */

const getStatusInfo = (status: string) => {
  const normalized = status?.toLowerCase() || "";
  if (normalized.includes("approv")) {
    return { color: "#16A34A", bg: "#DCFCE7", label: "APPROVED" };
  }
  if (normalized.includes("reject") || normalized.includes("terminate")) {
    return {
      color: "#DC2626",
      bg: "#FEE2E2",
      label: status?.toUpperCase() || "REJECTED",
    };
  }
  return { color: "#D97706", bg: "#FEF3C7", label: status?.toUpperCase() || "PENDING" };
};

/* ---------------- STYLES ---------------- */

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    content: {
      padding: 16,
      paddingBottom: 28,
    },
    card: {
      backgroundColor: theme.cardBackground,
      padding: 16,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: theme.inputBorder,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    name: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.text,
    },
    code: {
      fontSize: 12,
      color: theme.textLight,
      marginTop: 2,
    },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 4,
      gap: 6,
    },
    statusText: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.5,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    divider: {
      height: 1,
      marginVertical: 14,
      opacity: 0.5,
    },
    detailItem: {
      flexDirection: "row",
      marginBottom: 20,
      alignItems: "flex-start",
    },
    detailLabel: {
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 1,
      color: theme.textLight,
      marginBottom: 4,
    },
    detailValue: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.text,
      lineHeight: 22,
    },
    detailIcon: {
      width: 40,
      height: 40,
      borderRadius: 4,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 16,
    },
    detailText: {
      flex: 1,
    },
    emptyText: {
      marginTop: 20,
      textAlign: "center",
      color: theme.textLight,
    },
  });
