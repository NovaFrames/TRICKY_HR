import ConfirmModal from "@/components/common/ConfirmModal";
import Header, { HEADER_HEIGHT } from "@/components/Header";
import ClaimApprovalModal from "@/components/PendingApproval/ClaimApprovalModal";
import { useProtectedBack } from "@/hooks/useProtectedBack";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  PanResponder,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import PendingApprovalModal from "../../../components/PendingApproval/PendingApprovalModal";
import { useTheme } from "../../../context/ThemeContext";
import ApiService from "../../../services/ApiService";

interface PendingApproval {
  Id:number;
  IdN: number;
  EmpIdN: number;
  CodeC: string; // Employee Code
  NameC: string; // Employee Name
  CatgNameC: string; // Category Name
  YearN: number;
  ApplyDateD: string; // Apply Date
  ApproveRejDateD: string; // Approve/Reject Date
  DescC: string; // Description (Type: Claim, Leave, etc.)
  StatusC: string; // Status (Waiting, Approved, Rejected)
  LvDescC: string | null; // Leave Description
  FromDateC: string; // From Date
  ToDateC: string; // To Date
  EmpRemarksC: string; // Employee Remarks
  Remarks: string; // Approve Remark
  LeaveDaysN: string | null; // Leave Days
  Approve1C: string | null;
  Approve2C: string | null;
  FinalApproveC: string | null;
}

export default function PendingApproval() {
  const { theme } = useTheme();
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "your", title: "YOUR PENDING" },
    { key: "other", title: "OTHER PENDING" },
  ]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Your pending approvals
  const [yourPendings, setYourPendings] = useState<PendingApproval[]>([]);

  // Other pending approvals
  const [otherPendings, setOtherPendings] = useState<PendingApproval[]>([]);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PendingApproval | null>(
    null,
  );

  useProtectedBack({
    home: "/home",
    settings: "/settings",
    dashboard: "/dashboard",
  });

  useEffect(() => {
    fetchPendingApprovals();
  }, [index]);

  const fetchPendingApprovals = async () => {
    setLoading(true);
    try {
      const currentTab = routes[index].key;
      if (currentTab === "your") {
        const result = await ApiService.getYourPendingApprovals();
        if (result.success && result.data) {
          // console.log(
          //   "Your Pending Data:",
          //   JSON.stringify(result.data[0], null, 2),
          // );
          setYourPendings(result.data);
        } else {
          ConfirmModal.alert(
            "Error",
            result.error || "Failed to fetch your pending approvals",
          );
        }
      } else {
        const result = await ApiService.getOtherPendingApprovals();
        if (result.success && result.data) {
          setOtherPendings(result.data);
        } else {
          ConfirmModal.alert(
            "Error",
            result.error || "Failed to fetch other pending approvals",
          );
        }
      }
    } catch (error: any) {
      ConfirmModal.alert(
        "Error",
        error?.message || "Failed to fetch pending approvals",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPendingApprovals();
    setRefreshing(false);
  };

  // PanResponder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Determine if swipe is horizontal and significant enough
        return (
          Math.abs(gestureState.dx) > 20 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy)
        );
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > 50) {
          // Swipe Right -> Previous Tab
          setIndex((prev) => Math.max(0, prev - 1));
        } else if (gestureState.dx < -50) {
          // Swipe Left -> Next Tab
          setIndex((prev) => Math.min(routes.length - 1, prev + 1));
        }
      },
    }),
  ).current;

  const formatDate = (dateString: string) => {
    if (!dateString) return "";

    // Handle /Date(milliseconds)/ format from Android
    const match = dateString.match(/\/Date\((\d+)\)\//);
    if (match) {
      const millis = parseInt(match[1]);
      const date = new Date(millis);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
    }

    // Handle regular date string
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };

  // Helper to format ASP.NET JSON Date /Date(1234567890)/
  const formatFromDate = (dateString?: string | null): string => {
    if (!dateString) return "-";

    try {
      // Extract only date part (remove time if exists)
      const datePart = dateString.split(" ")[0]; // "2/3/2026"

      const parts = datePart.split("/");
      if (parts.length !== 3) return "-";

      const month = parseInt(parts[0], 10) - 1; // JS month is 0-based
      const day = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);

      const date = new Date(year, month, day);

      if (isNaN(date.getTime())) return "-";

      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      });
    } catch {
      return "-";
    }
  };
  // Helper to format ASP.NET JSON Date /Date(1234567890)/
  const formatToDate = (dateString?: string | null): string => {
    if (!dateString) return "-";

    try {
      // Extract only date part (remove time if exists)
      const datePart = dateString.split(" ")[0]; // "2/3/2026"

      const parts = datePart.split("/");
      if (parts.length !== 3) return "-";

      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // JS month is 0-based
      const year = parseInt(parts[2], 10);

      const date = new Date(year, month, day);

      if (isNaN(date.getTime())) return "-";

      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      });
    } catch {
      return "-";
    }
  };

  const getStatusIcon = (status?: string) => {
    if (!status) return "alert-circle";

    switch (status.toLowerCase()) {
      case "waiting":
      case "pending":
        return "alert-circle";
      case "approved":
        return "checkmark-circle";
      case "rejected":
        return "close-circle";
      default:
        return "alert-circle";
    }
  };

  const getStatusColor = (status?: string) => {
    if (!status) return "#FF9800";

    switch (status.toLowerCase()) {
      case "waiting":
      case "pending":
        return "#FF9800";
      case "approved":
        return "#4CAF50";
      case "rejected":
        return "#F44336";
      default:
        return "#FF9800";
    }
  };

  const handleItemPress = (index: number, item: PendingApproval) => {
    setSelectedIndex(index);
    setSelectedItem(item);
    setShowModal(true);
  };

  const renderCustomTab = () => {
    return (
      <View style={[styles.tabBar, { backgroundColor: theme.cardBackground }]}>
        {routes.map((item, i) => (
          <TouchableOpacity
            key={item.key}
            style={[
              styles.tabItem,
              index === i && { borderBottomColor: theme.primary },
            ]}
            onPress={() => setIndex(i)}
          >
            <Text
              style={[
                styles.tabText,
                { color: index === i ? theme.primary : theme.textLight },
              ]}
            >
              {item.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderPendingItem = ({
    item,
    index,
  }: {
    item: PendingApproval;
    index: number;
  }) => {
    const isSelected = selectedIndex === index;
    const statusColor = getStatusColor(item.StatusC);
    const statusIcon = getStatusIcon(item.StatusC);

    // Create period string from FromDateC and ToDateC
    const period =
      item.FromDateC && item.ToDateC
        ? `${formatFromDate(item.FromDateC)} - ${formatToDate(item.ToDateC)}`
        : "";

    return (
      <TouchableOpacity
        style={[
          styles.pendingCard,
          {
            backgroundColor: isSelected
              ? theme.inputBorder
              : theme.cardBackground,
            borderColor: theme.inputBorder,
          },
        ]}
        onPress={() => handleItemPress(index, item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.employeeInfo}>
            <Text style={[styles.employeeName, { color: theme.text }]}>
              {item.NameC || "N/A"}
            </Text>
            <Text style={[styles.employeeCode, { color: theme.textLight }]}>
              Emp code: {item.CodeC || "N/A"}
            </Text>
            <Text style={[styles.reqDate, { color: theme.textLight }]}>
              Req Date: {item.ApplyDateD ? formatDate(item.ApplyDateD) : "N/A"}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColor + "20" },
            ]}
          >
            <Ionicons name={statusIcon} size={20} color={statusColor} />
          </View>
        </View>

        {period && (
          <View style={styles.periodContainer}>
            <Ionicons name="arrow-up" size={16} color={theme.textLight} />
            <Text style={[styles.period, { color: theme.text }]}>{period}</Text>
          </View>
        )}

        {item.EmpRemarksC && (
          <Text
            style={[styles.remarks, { color: theme.textLight }]}
            numberOfLines={1}
          >
            Remarks: {item.EmpRemarksC}
          </Text>
        )}

        <View style={styles.cardFooter}>
          <View
            style={[
              styles.typeContainer,
              { backgroundColor: theme.inputBorder },
            ]}
          >
            <Text style={[styles.typeText, { color: theme.text }]}>
              {item.DescC || "Request"}
            </Text>
          </View>
          <View
            style={[
              styles.statusContainer,
              { backgroundColor: statusColor + "15" },
            ]}
          >
            <Text style={[styles.statusText, { color: statusColor }]}>
              {item.StatusC || "Pending"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      {renderCustomTab()}
      <Ionicons
        name="document-text-outline"
        size={64}
        color={theme.placeholder}
      />
      <Text style={[styles.emptyText, { color: theme.placeholder }]}>
        No pending approvals
      </Text>
    </View>
  );

  const currentData =
    routes[index].key === "your" ? yourPendings : otherPendings;

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Header title="Pending Approval" />

        <ScrollView contentContainerStyle={{ paddingTop: HEADER_HEIGHT + 4 }}>
          {/* Custom Tab Bar */}
          <View
            style={[styles.tabBar, { backgroundColor: theme.cardBackground }]}
          >
            {routes.map((item, i) => (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.tabItem,
                  index === i && { borderBottomColor: theme.primary },
                ]}
                onPress={() => setIndex(i)}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: index === i ? theme.primary : theme.textLight },
                  ]}
                >
                  {item.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.text }]}>
              Loading...
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* FIXED HEADER */}
      <Header title="Pending Approval" />

      {/* FIXED TAB BAR */}
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: theme.cardBackground,
            marginTop: HEADER_HEIGHT + 4,
          },
        ]}
      >
        {routes.map((item, i) => (
          <TouchableOpacity
            key={item.key}
            style={[
              styles.tabItem,
              index === i && { borderBottomColor: theme.primary },
            ]}
            onPress={() => setIndex(i)}
          >
            <Text
              style={[
                styles.tabText,
                { color: index === i ? theme.primary : theme.textLight },
              ]}
            >
              {item.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* SCROLLABLE CONTENT */}
      <View style={{ flex: 1 }} {...panResponder.panHandlers}>
        <FlatList
          data={currentData}
          keyExtractor={(item, index) => `${item.IdN}-${index}`}
          renderItem={renderPendingItem}
          showsVerticalScrollIndicator={false}
          // 🔑 THIS IS CRITICAL
          contentContainerStyle={{
            paddingTop: 12,
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name="document-text-outline"
                size={64}
                color={theme.placeholder}
              />
              <Text style={[styles.emptyText, { color: theme.placeholder }]}>
                No pending approvals
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
        />
      </View>

      {showModal && selectedItem && (
        selectedItem.DescC === "LEAVE" ? (
          <PendingApprovalModal
            visible={showModal}
            onClose={() => {
              setShowModal(false);
              setSelectedItem(null);
            }}
            onSuccess={() => {
              setShowModal(false);
              setSelectedItem(null);
              fetchPendingApprovals();
            }}
            data={selectedItem}
          />
        ) : selectedItem.DescC === "Claim" ? (
          <ClaimApprovalModal
            visible={showModal}
            onClose={() => {
              setShowModal(false);
              setSelectedItem(null);
            }}
            onSuccess={() => {
              setShowModal(false);
              setSelectedItem(null);
              fetchPendingApprovals();
            }}
            data={selectedItem}
          />
        ) : ('')
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 12,
    paddingTop: 16,
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
  tabBar: {
    flexDirection: "row",
    height: 50,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  pendingCard: {
    borderRadius: 4,
    padding: 16,
    marginBottom: 4,
    marginHorizontal: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  employeeCode: {
    fontSize: 13,
    marginBottom: 2,
  },
  reqDate: {
    fontSize: 13,
  },
  statusBadge: {
    width: 40,
    height: 40,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  periodContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 4,
  },
  period: {
    fontSize: 14,
    fontWeight: "600",
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  remarks: {
    fontSize: 13,
    marginBottom: 8,
    fontWeight: "600",
  },
  typeContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  typeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statusContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
});
