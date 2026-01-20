import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    View
} from "react-native";
import AppModal from "../../components/common/AppModal";
import { useTheme } from "../../context/ThemeContext";
import ApiService from "../../services/ApiService";
import { CustomButton } from "../CustomButton";

interface TimeModalProps {
  visible: boolean;
  onClose: () => void;
  item: any;
  onRefresh?: () => void;
}

const TimeModal: React.FC<TimeModalProps> = ({
  visible,
  onClose,
  item,
  onRefresh,
}) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [timeData, setTimeData] = useState<any>(null);

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

  // Helper to format ASP.NET JSON Date
  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return "N/A";

      if (typeof dateString === "string" && dateString.includes("/Date(")) {
        const timestamp = parseInt(
          dateString.replace(/\/Date\((-?\d+)\)\//, "$1"),
        );
        const date = new Date(timestamp);
        return date.toLocaleDateString("en-US", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
      }

      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch (e) {
      return dateString;
    }
  };

  const formatTime = (timeValue: number) => {
    if (!timeValue || timeValue === 0) return "";
    return timeValue.toFixed(2);
  };

  // Fetch time details
  useEffect(() => {
    const fetchTimeDetails = async () => {
      if (!visible || !item) return;

      setDetailsLoading(true);

      try {
        const result = await ApiService.getTimeUpdate(item.IdN);

        if (result?.success && result?.data?.data?.[0]) {
          setTimeData(result.data.data[0]);
        }
      } catch (error) {
        console.error("Error fetching time details:", error);
      } finally {
        setDetailsLoading(false);
      }
    };

    fetchTimeDetails();
  }, [visible, item]);

  const handleCancelRequest = async () => {
    Alert.alert(
      "Cancel Request",
      "Are you sure you want to cancel this time update request?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              const requestId = item.IdN || item.Id || item.id;
              const currentUser = ApiService.getCurrentUser();
              const empId = item.EmpIdN || item.EmpId || currentUser.empId;

              if (!empId) {
                Alert.alert("Error", "Employee ID not found.");
                setLoading(false);
                return;
              }

              const result = await ApiService.updatePendingApproval({
                IdN: requestId,
                StatusC: "Rejected",
                ApproveRemarkC: "Cancelled by user",
                EmpIdN: empId,
                Flag: "Time",
                ApproveAmtN: 0,
                title: "",
                DocName: "",
                ReceiveYearN: 0,
                ReceiveMonthN: 0,
                PayTypeN: 0,
              });

              if (result.success) {
                Alert.alert(
                  "Success",
                  "Time update request cancelled successfully",
                );
                onClose();
                onRefresh?.();
              } else {
                Alert.alert(
                  "Error",
                  result.error || "Failed to cancel time request.",
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

    if (!timeData) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.placeholder }]}>
            No time details available
          </Text>
        </View>
      );
    }

    const inTime = timeData.InTimeN || 0;
    const outTime = timeData.OutTimeN || 0;

    // Determine request type
    let requestType = "In & Out Time";
    if (inTime === 0) requestType = "Out Time";
    if (outTime === 0) requestType = "In Time";

    return (
      <View style={styles.content}>
        <InfoRow
          label="Date"
          value={formatDate(timeData.DateD)}
          theme={theme}
        />
        <InfoRow
          label="Project Name"
          value={timeData.ProjectNameC || "N/A"}
          theme={theme}
        />
        <InfoRow label="Request Type" value={requestType} theme={theme} />

        {inTime > 0 && (
          <InfoRow label="In Time" value={formatTime(inTime)} theme={theme} />
        )}

        {outTime > 0 && (
          <InfoRow label="Out Time" value={formatTime(outTime)} theme={theme} />
        )}

        <InfoRow
          label="Remarks"
          value={timeData.TMSRemarksC || "No remarks"}
          theme={theme}
        />
      </View>
    );
  };

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title="Time Manage"
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

// Helper component for info rows
const InfoRow = ({
  label,
  value,
  theme,
}: {
  label: string;
  value: string;
  theme: any;
}) => (
  <View style={styles.infoRow}>
    <Text style={[styles.infoLabel, { color: theme.textLight }]}>{label}</Text>
    <Text style={[styles.infoValue, { color: theme.text }]}>: {value}</Text>
  </View>
);

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

export default TimeModal;
