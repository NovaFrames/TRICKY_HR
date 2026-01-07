import Header from "@/components/Header";
import { API_ENDPOINTS } from "@/constants/api";
import { useTheme } from "@/context/ThemeContext";
import { useUser } from "@/context/UserContext";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
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

  /* ---------------- RENDER ITEM ---------------- */

  const router = useRouter();
const renderItem = ({ item }: { item: ApprovalItem }) => (
  <Pressable
    onPress={() =>
      router.push({
        pathname: "/(tabs)/officer/approvalreqdetails",
        params: { details: JSON.stringify(item) },
      })
    }
    style={({ pressed }) => [
      styles.card,
      pressed && { opacity: 0.85 },
    ]}
  >
    {/* Header */}
    <View style={styles.headerRow}>
      <View>
        <Text style={styles.name}>{item.NameC}</Text>
        <Text style={styles.code}>{item.CodeC}</Text>
      </View>

      <View
        style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(item.StatusC) },
        ]}
      >
        <Text style={styles.statusText}>{item.StatusC}</Text>
      </View>
    </View>

    {/* Info Grid */}
    <View style={styles.infoGrid}>
      <Info label="Request Type" value={item.DescC || "—"} />
      <Info label="Leave Type" value={item.LvDescC || "—"} />
      <Info label="Req Date" value={item.FromDateC || "—"} />
      <Info label="Approve Date" value={item.ToDateC || "—"} />
    </View>
  </Pressable>
);

  /* ---------------- UI ---------------- */

  return (
    <View style={styles.container}>
      <Header title="Approval Details" />

      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.IdN.toString()}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No approval records found</Text>
          }
        />
      )}
    </View>
  );
}

/* ---------------- SMALL COMPONENT ---------------- */

const Info = ({ label, value }: { label: string; value: string }) => (
  <View style={{ width: "48%", marginBottom: 12 }}>
    <Text style={{ fontSize: 12, opacity: 0.6 }}>{label}</Text>
    <Text style={{ fontSize: 14, fontWeight: "500" }}>{value}</Text>
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
      padding: 16,
      borderRadius: 14,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: theme.inputBorder,
    },

    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },

    name: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.text,
    },

    code: {
      fontSize: 12,
      color: theme.textLight,
      marginTop: 2,
    },

    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },

    statusText: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
    },

    infoGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      marginTop: 4,
    },

    remarkBox: {
      marginTop: 12,
      backgroundColor: theme.inputBg,
      padding: 12,
      borderRadius: 10,
    },

    remarkLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.textLight,
    },

    remarkText: {
      fontSize: 13,
      color: theme.text,
      marginTop: 2,
      lineHeight: 18,
    },

    emptyText: {
      textAlign: "center",
      marginTop: 40,
      color: theme.textLight,
    },
  });