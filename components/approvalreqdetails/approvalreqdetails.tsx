import { useTheme } from "@/context/ThemeContext";
import { useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Header from "../Header";

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

export default function ApprovalReqDetails() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { details } = useLocalSearchParams();

  const approval = useMemo(() => {
    const detailsParam = Array.isArray(details) ? details[0] : details;
    if (!detailsParam || typeof detailsParam !== "string") {
      return null;
    }

    try {
      return JSON.parse(detailsParam) as ApprovalItem;
    } catch {
      return null;
    }
  }, [details]);

  if (!approval) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Approval Request</Text>
        <Text style={styles.emptyText}>No request details found.</Text>
      </View>
    );
  }

  const statusColor = getStatusColor(approval.StatusC);

  const DetailRow = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );

  const DetailPill = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.pill}>
      <Text style={styles.pillLabel}>{label}</Text>
      <Text style={styles.pillValue}>{value}</Text>
    </View>
  );

  const RemarkBlock = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.remarkBlock}>
      <Text style={styles.remarkLabel}>{label}</Text>
      <Text style={styles.remarkText}>{value}</Text>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
        <Header title="Approval Request Details" />
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.name}>{approval.NameC}</Text>
            <Text style={styles.code}>{approval.CodeC}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{approval.StatusC}</Text>
          </View>
        </View>
        <View style={styles.dateRow}>
          <DetailPill label="From" value={approval.FromDateC || "-"} />
          <DetailPill label="To" value={approval.ToDateC || "-"} />
          <DetailPill label="Days" value={approval.LeaveDaysN || "-"} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Request Information</Text>
        <DetailRow label="Request Type" value={approval.DescC || "-"} />
        <DetailRow label="Leave Type" value={approval.LvDescC || "-"} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Remarks</Text>
        <RemarkBlock
          label="Employee Remarks"
          value={approval.EmpRemarksC || "-"}
        />
        <RemarkBlock
          label="Approval Remarks"
          value={approval.ApproveRemarkC || "-"}
        />
      </View>
    </ScrollView>
  );
}

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

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    content: {
      padding: 16,
      paddingBottom: 32,
    },
    title: {
      fontSize: 22,
      fontWeight: "700",
      color: theme.text,
    },
    emptyText: {
      marginTop: 12,
      fontSize: 14,
      color: theme.textLight,
    },
    headerCard: {
      backgroundColor: theme.cardBackground,
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.inputBorder,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    name: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.text,
    },
    code: {
      marginTop: 4,
      fontSize: 12,
      color: theme.textLight,
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
    },
    statusText: {
      fontSize: 11,
      fontWeight: "700",
      color: "#fff",
      textTransform: "uppercase",
    },
    dateRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 16,
      gap: 8,
    },
    pill: {
      flex: 1,
      backgroundColor: theme.inputBg,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
    },
    pillLabel: {
      fontSize: 11,
      color: theme.textLight,
      textTransform: "uppercase",
      marginBottom: 4,
    },
    pillValue: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.text,
    },
    section: {
      marginTop: 20,
      backgroundColor: theme.cardBackground,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.inputBorder,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.text,
      marginBottom: 12,
      letterSpacing: 0.2,
    },
    detailRow: {
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.inputBorder,
    },
    detailLabel: {
      fontSize: 12,
      color: theme.textLight,
      marginBottom: 6,
    },
    detailValue: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.text,
    },
    remarkBlock: {
      paddingVertical: 10,
    },
    remarkLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.textLight,
      marginBottom: 6,
    },
    remarkText: {
      fontSize: 14,
      color: theme.text,
      lineHeight: 20,
    },
  });
