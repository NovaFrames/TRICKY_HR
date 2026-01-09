import { formatTimeNumber } from "@/constants/timeFormat";
import { useTheme } from "@/context/ThemeContext";
import ApiService, { LeaveType } from "@/services/ApiService";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
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
  const { details } = useLocalSearchParams();

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
    { key: "BalanceN", label: "Balance", align: "center", formatter: formatTimeNumber },
  ];

  /* ---------------- API ---------------- */

  const loadLeaveData = async (id: number) => {
    try {
      setLoading(true);
      setFormattedLeaves([]); // 🔥 CLEAR OLD DATA

      if (!approval) return;

      const result = await ApiService.getLeaveApprovalDetails({ IdN: approval.IdN });

      console.log("Leave Details Result:", result);
      
      if (result.success && result.data?.data?.length) {
        const formatted = result.data.data[0].EmpLeaveApply.map(formatLeaveData);
        setFormattedLeaves(formatted);
      } else {
        Alert.alert("Info", "No leave data found");
      }
    } catch {
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
    const format = (v: number) => v.toFixed(2);

    return {
      ...leave,
      formattedBalance: format(leave.BalanceN),
      formattedEligible: format(leave.EligibleN),
      formattedCredit: format(leave.CreditN),
      formattedSurrender: format(leave.LVSurrenderN),
      formattedBF: format(leave.BFN),
      formattedEarn: format(leave.ALEarnN),
      formattedTotal: format(leave.ALTotalN),
      formattedRequest: format(leave.RequestN),
      formattedTaken: format(leave.TakenN),
    };
  };

  if (!approval) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No request details found.</Text>
      </View>
    );
  }

  const statusColor = getStatusColor(approval.StatusC);

  /* ---------------- SMALL UI COMPONENTS ---------------- */

  const DetailRow = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );

  const RemarkBlock = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.remarkBlock}>
      <Text style={styles.remarkLabel}>{label}</Text>
      <Text style={styles.remarkText}>{value}</Text>
    </View>
  );

  /* ---------------- RENDER ---------------- */

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Header title="Approval Request Details" />

      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.name}>{approval.NameC}</Text>
          <Text style={styles.code}>{approval.CodeC}</Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>{approval.StatusC}</Text>
        </View>
      </View>

      {/* META */}
      <View style={styles.metaRow}>
        <Text style={styles.metaText}>From: {approval.FromDateC}</Text>
        <Text style={styles.metaText}>To: {approval.ToDateC}</Text>
        <Text style={styles.metaText}>Days: {approval.LeaveDaysN}</Text>
      </View>

      {/* REQUEST INFO */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Request Information</Text>
        <DetailRow label="Request Type" value={approval.DescC || "-"} />
        <DetailRow label="Leave Type" value={approval.LvDescC || "-"} />
      </View>

      {/* REMARKS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Remarks</Text>
        <RemarkBlock
          label="Employee Remarks"
          value={approval.EmpRemarksC || "-"}
        />
      </View>

      {/* TABLE */}
      <View style={{ marginTop: 16 }}>
        {loading ? (
          <ActivityIndicator size="large" color={theme.primary} />
        ) : (
          <DynamicTable
            data={formattedLeaves}
            columns={ATTENDANCE_COLUMNS}
            theme={theme}
            tableWidth={600}
          />
        )}
      </View>
    </ScrollView>
  );
}

/* ---------------- HELPERS ---------------- */

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "approved":
      return "#16a34a";
    case "rejected":
      return "#dc2626";
    case "terminate":
      return "#f97316";
    default:
      return "#2563eb";
  }
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
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.inputBorder,
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
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
    },
    statusText: {
      fontSize: 10,
      fontWeight: "700",
      color: "#fff",
      textTransform: "uppercase",
    },
    metaRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 6,
    },
    metaText: {
      fontSize: 12,
      color: theme.textLight,
    },
    section: {
      marginTop: 16,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: theme.text,
      marginBottom: 6,
    },
    detailRow: {
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: theme.inputBorder,
    },
    detailLabel: {
      fontSize: 11,
      color: theme.textLight,
    },
    detailValue: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.text,
    },
    remarkBlock: {
      marginBottom: 8,
    },
    remarkLabel: {
      fontSize: 11,
      fontWeight: "600",
      color: theme.textLight,
      marginBottom: 2,
    },
    remarkText: {
      fontSize: 14,
      color: theme.text,
      lineHeight: 18,
    },
    emptyText: {
      marginTop: 20,
      textAlign: "center",
      color: theme.textLight,
    },
  });
