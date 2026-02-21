import ConfirmModal from "@/components/common/ConfirmModal";
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

interface LeaveSurrenderModalProps {
  visible: boolean;
  onClose: () => void;
  item: any;
  onRefresh?: () => void;
}

const LeaveSurrenderModal: React.FC<LeaveSurrenderModalProps> = ({
  visible,
  onClose,
  item,
  onRefresh,
}) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [surrenderData, setSurrenderData] = useState<any>(null);

  const status = item?.StatusC || item?.StatusResult || item?.Status || "Waiting";

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

  // Fetch surrender details
  useEffect(() => {
    const fetchSurrenderDetails = async () => {
      if (!visible || !item) return;

      setDetailsLoading(true);

      try {
        const result = await ApiService.getSurrenderDetails(item.IdN);

        if (result?.success && result?.data?.data?.[0]) {
          setSurrenderData(result.data.data[0]);
        }
      } catch (error) {
        console.error("Error fetching surrender details:", error);
      } finally {
        setDetailsLoading(false);
      }
    };

    fetchSurrenderDetails();
  }, [visible, item]);

  if (!item) return null;

  const handleCancelRequest = async () => {
    ConfirmModal.alert(
      "Cancel Request",
      "Are you sure you want to cancel this leave surrender request?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              const requestId = item.IdN || item.Id || item.id;
              const result = await ApiService.deleteRequest(
                requestId,
                "LVSurrender",
                undefined,
                undefined,
                "Cancelled by user",
              );

              if (result.success) {
                ConfirmModal.alert(
                  "Success",
                  "Leave surrender request cancelled successfully",
                );
                onClose();
                onRefresh?.();
              } else {
                ConfirmModal.alert(
                  "Error",
                  result.error || "Failed to cancel leave surrender request.",
                );
              }
            } catch (error: any) {
              ConfirmModal.alert(
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

    if (!surrenderData) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.placeholder }]}>
            No surrender details available
          </Text>
        </View>
      );
    }

    // Safe string helper
    const safeString = (val: any): string => {
      if (val === null || val === undefined || val === "") return "N/A";
      const str = String(val);
      return str.trim().length > 0 ? str : "N/A";
    };

    // Format date helper
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

    // Format number helper
    const formatNumber = (numVal: any): string => {
      try {
        if (numVal === null || numVal === undefined) return "N/A";
        const num = Number(numVal);
        if (isNaN(num)) return "N/A";
        return num.toFixed(2);
      } catch {
        return "N/A";
      }
    };

    // Pre-calculate display values
    const displayValues = {
      surrenderLeave: formatNumber(surrenderData.SurrenderN),
      payoutDate: formatDate(surrenderData.PayoutDateD),
      remarks:
        safeString(surrenderData.RemarksC) === "N/A"
          ? "No remarks"
          : safeString(surrenderData.RemarksC),
    };

    return (
      <View style={styles.content}>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.textLight }]}>
            Surrender Leave
          </Text>
          <Text
            style={[styles.infoValue, { color: theme.text }]}
            numberOfLines={2}
          >
            {`: ${displayValues.surrenderLeave}`}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.textLight }]}>
            Payout Date
          </Text>
          <Text
            style={[styles.infoValue, { color: theme.text }]}
            numberOfLines={2}
          >
            {`: ${displayValues.payoutDate}`}
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
      </View>
    );
  };

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title="Leave Surrender"
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

export default LeaveSurrenderModal;
