import Header from "@/components/Header";
import SegmentTabs from "@/components/SegmentTabs";
import { API_ENDPOINTS } from "@/constants/api";
import { formatDisplayDate } from "@/constants/timeFormat";
import { useTheme } from "@/context/ThemeContext";
import { useUser } from "@/context/UserContext";
import { useProtectedBack } from "@/hooks/useProtectedBack";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  State,
} from 'react-native-gesture-handler';


/* ---------------- TYPES ---------------- */

type ApprovalItem = {
  IdN: number;
  NameC: string;
  CodeC: string;
  DescC: string;
  LvDescC: string;
  FromDateC: string;
  ToDateC: string;
  StatusC: string;
  ApproveRejDateD: string;
  ApplyDateD: string;
};

/* ---------------- COMPONENT ---------------- */

export default function ApprovalDetails() {
  const { user } = useUser();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const originFrom = typeof from === "string" ? from : "home";

  const onSwipeEnd = (event: PanGestureHandlerGestureEvent) => {
    if (event.nativeEvent.state !== State.END) return;

    const { translationX } = event.nativeEvent;

    // swipe left → Approved → Rejected
    if (translationX < -60 && activeTab === 'Approved') {
      setActiveTab('Rejected');
    }

    // swipe right → Rejected → Approved
    if (translationX > 60 && activeTab === 'Rejected') {
      setActiveTab('Approved');
    }
  };


  const [activeTab, setActiveTab] = useState<"Approved" | "Rejected">(
    "Approved"
  );
  const [data, setData] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(false);

  useProtectedBack({
    home: "/home",
    settings: "/settings",
    dashboard: "/dashboard",
  });

  /* ---------------- API ---------------- */

  const fetchData = async () => {
    try {
      setLoading(true);

      const endpoint =
        activeTab === "Approved"
          ? API_ENDPOINTS.SUP_DETAPPROVE_URL
          : API_ENDPOINTS.SUP_GETREJECT_URL;

      const response = await axios.post(
        `${API_ENDPOINTS.CompanyUrl}${endpoint}`,
        { TokenC: user?.TokenC }
      );

      if (response.data?.Status === "success") {
        setData(response.data.data || []);
      } else {
        setData([]);
      }
    } catch (error) {
      console.error("Approval API error:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

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


  const TABS: Array<'Approved' | 'Rejected'> = ['Approved', 'Rejected'];

  /* ---------------- RENDER ITEM ---------------- */

  const renderItem = ({ item }: { item: ApprovalItem }) => (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/(tabs)/officer/approvalreqdetails",
          params: {
            details: JSON.stringify(item),
            from: "approvaldetails",
            parentFrom: originFrom,
          },
        })
      }
      style={styles.card}
    >
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

      <View style={styles.infoGrid}>
        <Info label="Request Type" value={item.DescC || "—"} />
        <Info label="Leave Type" value={item.LvDescC || "—"} />
        <Info label="Apply Date" value={formatDisplayDate(item.ApplyDateD)} />
        <Info label="Approve/Reject Date" value={formatDisplayDate(item.ApproveRejDateD)} />
      </View>
    </Pressable>
  );

  /* ---------------- UI ---------------- */

  return (

    <PanGestureHandler
      onHandlerStateChange={onSwipeEnd}
      activeOffsetX={[-30, 30]}
      failOffsetY={[-30, 30]}
    >
      <View style={styles.container}>
        <Header title="Approval Requests" />

        {/* Tabs */}

        <SegmentTabs
          tabs={TABS}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {loading ? (
          <ActivityIndicator size="large" color={theme.primary} />
        ) : (
          <FlatList
            data={data}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 32 }}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No records found</Text>
            }
          />
        )}
      </View>
    </PanGestureHandler>
  );
}

/* ---------------- SMALL COMPONENTS ---------------- */

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

    tabRow: {
      flexDirection: "row",
      backgroundColor: theme.cardBackground,
      borderRadius: 12,
      padding: 4,
      marginBottom: 16,
    },

    tab: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      alignItems: "center",
    },

    activeTab: {
      backgroundColor: theme.primary,
    },

    tabText: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.textLight,
    },

    activeTabText: {
      color: "#fff",
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
    },

    emptyText: {
      textAlign: "center",
      marginTop: 40,
      color: theme.textLight,
    },
  });
