import { API_ENDPOINTS } from "@/constants/api";
import { useTheme } from "@/context/ThemeContext";
import { useUser } from "@/context/UserContext";
import axios from "axios";
import React, { useEffect, useState } from "react";
import {
    FlatList,
    StyleSheet,
    Text,
    View,
} from "react-native";

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

/* ---------------- COMPONENT ---------------- */

export default function ApprovalDetails() {
  const { user } = useUser();
  const { theme } = useTheme();

  const styles = createStyles(theme);

  const [data, setData] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(false);

  /* ---------------- API ---------------- */

  const fetchApprovalDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${API_ENDPOINTS.CompanyUrl}${API_ENDPOINTS.SUP_DETAPPROVE_URL}`,
        { TokenC: user?.TokenC }
      );

      if (response.data?.Status === "success") {
        setData(response.data.data || []);
      }
    } catch (error) {
      console.error("Approval Details API error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovalDetails();
  }, []);

  /* ---------------- RENDER ITEM ---------------- */

  const renderItem = ({ item }: { item: ApprovalItem }) => (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.name}>{item.NameC}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{item.StatusC}</Text>
        </View>
      </View>

      {/* Details */}
      <Info label="Code" value={item.CodeC} />
      <Info label="Type" value={item.DescC || "—"} />
      <Info label="Leave" value={item.LvDescC || "—"} />
      <Info
        label="Date"
        value={
          item.FromDateC
            ? `${item.FromDateC} ${item.ToDateC ? `→ ${item.ToDateC}` : ""}`
            : "—"
        }
      />
      <Info label="Days" value={item.LeaveDaysN?.trim() || "—"} />

      {!!item.EmpRemarksC && (
        <View style={styles.remarkBox}>
          <Text style={styles.remarkLabel}>Employee Remark</Text>
          <Text style={styles.remarkText}>{item.EmpRemarksC}</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Approval Details</Text>

      <FlatList
        data={data}
        keyExtractor={(item) => item.IdN.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.emptyText}>No approval records found</Text>
          ) : null
        }
      />
    </View>
  );
}

/* ---------------- SMALL COMPONENT ---------------- */

const Info = ({ label, value }: { label: string; value: string }) => (
  <View style={{ marginTop: 6 }}>
    <Text style={{ fontSize: 12, opacity: 0.6 }}>{label}</Text>
    <Text style={{ fontSize: 14 }}>{value}</Text>
  </View>
);

/* ---------------- STYLES ---------------- */

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      padding: 16,
    },
    title: {
      fontSize: 22,
      fontWeight: "700",
      color: theme.text,
      marginBottom: 16,
    },

    card: {
      backgroundColor: theme.cardBackground,
      padding: 14,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.inputBorder,
    },

    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 6,
    },

    name: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
    },

    statusBadge: {
      backgroundColor: theme.primary,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
    },

    statusText: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "600",
    },

    remarkBox: {
      marginTop: 10,
      backgroundColor: theme.inputBg,
      padding: 10,
      borderRadius: 8,
    },

    remarkLabel: {
      fontSize: 12,
      color: theme.textLight,
      marginBottom: 4,
    },

    remarkText: {
      fontSize: 13,
      color: theme.text,
    },

    emptyText: {
      textAlign: "center",
      marginTop: 40,
      color: theme.textLight,
    },
  });
