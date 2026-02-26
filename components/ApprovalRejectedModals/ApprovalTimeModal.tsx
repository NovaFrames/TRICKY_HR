import ConfirmModal from "@/components/common/ConfirmModal";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    View
} from "react-native";
import AppModal from "../../components/common/AppModal";
import { useTheme } from "../../context/ThemeContext";
import ApiService from "../../services/ApiService";

interface TimeModalProps {
  visible: boolean;
  onClose: () => void;
  item: any;
  onRefresh?: () => void;
  mode?: "employee" | "approval";
  onCancelRequest?: (
    item: any,
  ) => Promise<{ success: boolean; error?: string }> | { success: boolean; error?: string };
  onApprove?: (params: {
    item: any;
    remarks: string;
  }) => Promise<{ success: boolean; error?: string }> | { success: boolean; error?: string };
  onReject?: (params: {
    item: any;
    remarks: string;
  }) => Promise<{ success: boolean; error?: string }> | { success: boolean; error?: string };
  onSuccess?: () => void;
}

const ApprovalTimeModal: React.FC<TimeModalProps> = ({
  visible,
  onClose,
  item,
  onRefresh,
  mode = "employee",
  onCancelRequest,
  onApprove,
  onReject,
  onSuccess,
}) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [processingAction, setProcessingAction] = useState<
    "Approved" | "Rejected" | null
  >(null);
  const [remarks, setRemarks] = useState("");
  const [timeData, setTimeData] = useState<any>(null);
  const isApprovalMode = mode === "approval";

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
    } catch {
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

  useEffect(() => {
    if (!visible || !isApprovalMode) return;
    setProcessingAction(null);
    setRemarks("");
  }, [visible, isApprovalMode]);

  if (!item) return null;

  const handleCancelRequest = async () => {
    ConfirmModal.alert(
      "Cancel Request",
      "Are you sure you want to cancel this time update request?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              const defaultCancel = async () => {
                const requestId = item.IdN || item.Id || item.id;
                const currentUser = ApiService.getCurrentUser();
                const empId = item.EmpIdN || item.EmpId || currentUser.empId;

                if (!empId) {
                  return { success: false, error: "Employee ID not found." };
                }

                return ApiService.updatePendingApproval({
                  IdN: requestId,
                  StatusC: "Rejected",
                  Remarks: "Cancelled by user",
                  EmpIdN: empId,
                  Flag: "Time",
                  ApproveAmtN: 0,
                  title: "",
                  DocName: "",
                  ReceiveYearN: 0,
                  ReceiveMonthN: 0,
                  PayTypeN: 0,
                });
              };
              const result = onCancelRequest
                ? await onCancelRequest(item)
                : await defaultCancel();

              if (result.success) {
                ConfirmModal.alert(
                  "Success",
                  "Time update request cancelled successfully",
                );
                onClose();
                onRefresh?.();
                onSuccess?.();
              } else {
                ConfirmModal.alert(
                  "Error",
                  result.error || "Failed to cancel time request.",
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

  const handleApprovalSubmission = async (status: "Approved" | "Rejected") => {
    if (status === "Rejected" && remarks.trim().length < 11) {
      ConfirmModal.alert(
        "Validation Error",
        "Remarks should be more than 10 characters",
      );
      return;
    }

    setProcessingAction(status);
    try {
      const defaultAction = async () => {
        const currentUser = ApiService.getCurrentUser();
        const empId = item.EmpIdN || item.EmpId || currentUser.empId;

        if (!empId) {
          return { success: false, error: "Employee ID not found." };
        }

        return ApiService.updatePendingApproval({
          IdN: item.IdN || item.Id || item.id,
          StatusC: status,
          Remarks: remarks,
          EmpIdN: empId,
          Flag: "Time",
          ApproveAmtN: 0,
          title: "",
          DocName: "",
          ReceiveYearN: 0,
          ReceiveMonthN: 0,
          PayTypeN: 0,
        });
      };

      const result =
        status === "Approved"
          ? onApprove
            ? await onApprove({ item, remarks })
            : await defaultAction()
          : onReject
            ? await onReject({ item, remarks })
            : await defaultAction();

      if (result.success) {
        ConfirmModal.alert(
          "Success",
          `Request ${status.toLowerCase()} successfully`,
          [
            {
              text: "OK",
              onPress: () => {
                onSuccess?.();
                onRefresh?.();
                onClose();
              },
            },
          ],
        );
      } else {
        ConfirmModal.alert("Error", result.error || "Failed to update request.");
      }
    } catch (error: any) {
      ConfirmModal.alert("Error", error?.message || "Failed to update request.");
    } finally {
      setProcessingAction(null);
    }
  };

  const handleApprove = () => {
    ConfirmModal.alert(
      "Approve Request",
      "Are you sure you want to approve this request?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          style: "default",
          onPress: () => handleApprovalSubmission("Approved"),
        },
      ],
    );
  };

  const handleReject = () => {
    if (!remarks.trim()) {
      ConfirmModal.alert("Error", "Please enter reject remarks");
      return;
    }

    ConfirmModal.alert(
      "Reject Request",
      "Are you sure you want to reject this request?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: () => handleApprovalSubmission("Rejected"),
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
      title={isApprovalMode ? "Approval Request" : "Time Manage"}
      subtitle={
        isApprovalMode
          ? `Employee: ${item.NameC || "N/A"} • Ref: #${item.IdN || "N/A"}`
          : `Ref: #${item.IdN || "N/A"}`
      }
    >
      <ScrollView
        style={styles.modalBody}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
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
  approvalSection: {
    marginTop: 8,
    paddingTop: 24,
    borderTopWidth: 1,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 12,
    fontSize: 15,
    minHeight: 100,
  },
  footerButtons: {
    flexDirection: "row-reverse",
    justifyContent: "flex-end",
    gap: 12,
  },
  actionButton: {
    flexGrow: 0,
    flexShrink: 0,
    marginBottom: 0,
  },
  approveButton: {
    backgroundColor: "#16A34A",
  },
  rejectButton: {
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FECACA",
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

export default ApprovalTimeModal;
