import Alert from "@/components/common/AppAlert";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import AppModal from "../../components/common/AppModal";
import { useTheme } from "../../context/ThemeContext";
import ApiService from "../../services/ApiService";
import { CustomButton } from "../CustomButton";

interface LeaveModalProps {
  visible: boolean;
  onClose: () => void;
  item: any;
  onRefresh?: () => void;
}

const LeaveModal: React.FC<LeaveModalProps> = ({
  visible,
  onClose,
  item,
  onRefresh,
}) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [leaveData, setLeaveData] = useState<any>(null);

  if (!item) return null;

  const status = item.StatusC || item.StatusResult || item.Status || "Waiting";

  // Status Logic for Color
  let statusInfo = { color: "#D97706", bg: "#FEF3C7", label: "WAITING" };
  if (status.toLowerCase().includes("approv"))
    statusInfo = { color: "#16A34A", bg: "#DCFCE7", label: "APPROVED" };
  if (
    status.toLowerCase().includes("reject") ||
    status.toLowerCase().includes("cancel")
  ) {
    statusInfo = {
      color: "#DC2626",
      bg: "#FEE2E2",
      label: status.toUpperCase(),
    };
  }

  // Fetch leave details
  useEffect(() => {
    const fetchLeaveDetails = async () => {
      if (!visible || !item) return;

      setDetailsLoading(true);

      try {
        const result = await ApiService.getLeaveDetails(item.IdN);

        if (result?.success && result?.data?.data?.[0]) {
          setLeaveData(result.data.data[0]);
        }
      } catch (error) {
        console.error("Error fetching leave details:", error);
      } finally {
        setDetailsLoading(false);
      }
    };

    fetchLeaveDetails();
  }, [visible, item]);

  const handleCancelRequest = async () => {
    Alert.alert(
      "Cancel Request",
      "Are you sure you want to cancel this leave request?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              const requestId = item.IdN || item.Id || item.id;
              const parseDate = (dateStr: string | undefined) => {
                if (!dateStr) return undefined;
                try {
                  if (
                    typeof dateStr === "string" &&
                    dateStr.includes("/Date(")
                  ) {
                    const timestamp = parseInt(
                      dateStr.replace(/\/Date\((-?\d+)\)\//, "$1"),
                    );
                    return new Date(timestamp);
                  }
                  return new Date(dateStr);
                } catch (e) {
                  return undefined;
                }
              };

              const fromDate = parseDate(item.LFromDateD || item.FromDate);
              const toDate = parseDate(item.LToDateD || item.ToDate);

              const result = await ApiService.deleteRequest(
                requestId,
                "Leave",
                fromDate,
                toDate,
                "Cancelled by user",
              );

              if (result.success) {
                Alert.alert("Success", "Leave request cancelled successfully");
                onClose();
                onRefresh?.();
              } else {
                Alert.alert(
                  "Error",
                  result.error || "Failed to cancel leave request.",
                );
              }
            } catch (error: any) {
              Alert.alert(
                "Error",
                error.message || "An unexpected error occurred.",
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const renderContent = () => {
    if (detailsLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.placeholder }]}>
            Loading details...
          </Text>
        </View>
      );
    }

    if (!leaveData) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.placeholder }]}>
            No leave details available
          </Text>
        </View>
      );
    }

    // Pre-process ALL values to ensure they're safe strings
    const safeString = (val: any): string => {
      if (val === null || val === undefined || val === "") return "N/A";
      const str = String(val);
      return str.trim().length > 0 ? str : "N/A";
    };

    const formatDate = (dateVal: any): string => {
      try {
        if (!dateVal) return "N/A";
        if (typeof dateVal === "string" && dateVal.includes("/Date(")) {
          const timestamp = parseInt(
            dateVal.replace(/\/Date\((-?\d+)\)\//, "$1"),
          );
          if (isNaN(timestamp)) return "N/A";
          const date = new Date(timestamp);
          if (isNaN(date.getTime())) return "N/A";
          return (
            date.toLocaleDateString("en-US", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }) || "N/A"
          );
        }
        const date = new Date(dateVal);
        if (isNaN(date.getTime())) return "N/A";
        return (
          date.toLocaleDateString("en-US", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }) || "N/A"
        );
      } catch {
        return "N/A";
      }
    };

    const formatNumber = (numVal: any): string => {
      try {
        if (numVal === null || numVal === undefined || numVal === 0)
          return "N/A";
        const num = Number(numVal);
        if (isNaN(num)) return "N/A";
        return num.toFixed(2);
      } catch {
        return "N/A";
      }
    };

    // Pre-calculate all display values
    const displayValues = {
      fromDate: formatDate(leaveData.LFromDateD),
      toDate: formatDate(leaveData.LToDateD),
      leaveType: safeString(leaveData.ReaGrpNameC),
      remarks:
        safeString(leaveData.LVRemarksC) === "N/A"
          ? "No remarks"
          : safeString(leaveData.LVRemarksC),
      fromTime: formatNumber(leaveData.FHN),
      toTime: formatNumber(leaveData.THN),
      totalHours: formatNumber(leaveData.THrsN),
      claimAmount:
        leaveData.MLClaimAmtN && leaveData.MLClaimAmtN > 0
          ? `₹${Number(leaveData.MLClaimAmtN).toFixed(2)}`
          : "₹0.00",
    };

    const hasPermission = leaveData.THrsN && leaveData.THrsN > 0;
    const hasMedicalClaim = leaveData.ReaGrpIdN === 2;

    return (
      <View style={styles.content}>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.textLight }]}>
            From Date
          </Text>
          <Text
            style={[styles.infoValue, { color: theme.text }]}
            numberOfLines={2}
          >
            {`: ${displayValues.fromDate}`}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.textLight }]}>
            To Date
          </Text>
          <Text
            style={[styles.infoValue, { color: theme.text }]}
            numberOfLines={2}
          >
            {`: ${displayValues.toDate}`}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.textLight }]}>
            Leave Type
          </Text>
          <Text
            style={[styles.infoValue, { color: theme.text }]}
            numberOfLines={2}
          >
            {`: ${displayValues.leaveType}`}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.textLight }]}>
            Remarks
          </Text>
          <Text
            style={[styles.infoValue, { color: theme.text }]}
            numberOfLines={3}
          >
            {`: ${displayValues.remarks}`}
          </Text>
        </View>

        {hasPermission ? (
          <View
            style={[
              styles.section,
              {
                backgroundColor: theme.inputBg,
                borderColor: theme.inputBorder,
              },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>
              Permission Details
            </Text>

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.textLight }]}>
                From Time
              </Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>
                {`: ${displayValues.fromTime}`}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.textLight }]}>
                To Time
              </Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>
                {`: ${displayValues.toTime}`}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.textLight }]}>
                Total Hours
              </Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>
                {`: ${displayValues.totalHours}`}
              </Text>
            </View>
          </View>
        ) : null}

        {hasMedicalClaim ? (
          <View
            style={[
              styles.section,
              {
                backgroundColor: theme.inputBg,
                borderColor: theme.inputBorder,
              },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>
              Medical Claim
            </Text>

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.textLight }]}>
                Claim Amount
              </Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>
                {`: ${displayValues.claimAmount}`}
              </Text>
            </View>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title="Leave Manage"
      subtitle={`Ref: #${item.IdN || "N/A"}`}
      footer={
        status.toLowerCase().includes("waiting") ||
        status.toLowerCase().includes("pending") ? (
          <CustomButton
            title="Cancel Request"
            icon="close"
            isLoading={loading}
            disabled={loading}
            onPress={handleCancelRequest}
            style={styles.cancelButton}
          />
        ) : null
      }
    >
      <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
        <View style={styles.badgeRow}>
          <View
            style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}
          >
            <View style={[styles.dot, { backgroundColor: statusInfo.color }]} />
            <Text style={[styles.statusLabelText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
        </View>

        {renderContent()}
      </ScrollView>
    </AppModal>
  );
};

const styles = StyleSheet.create({
  modalBody: {
    padding: 18,
    flexShrink: 1,
  },
  badgeRow: {
    flexDirection: "row",
    marginBottom: 24,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 4,
  },
  statusLabelText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  content: {
    paddingVertical: 8,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "flex-start",
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "600",
    width: 120,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  section: {
    marginTop: 16,
    padding: 14,
    borderRadius: 4,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  cancelButton: {
    height: 56,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  cancelButtonText: {
    color: "#DC2626",
    fontWeight: "700",
    fontSize: 16,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "600",
  },
});

export default LeaveModal;
