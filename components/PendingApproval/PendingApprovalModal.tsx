import ConfirmModal from "@/components/common/ConfirmModal";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import ApiService from "../../services/ApiService";
import AppModal from "../common/AppModal";
import { CustomButton } from "../CustomButton";

interface PendingApprovalData {
  IdN: number;
  EmpIdN: number;
  CodeC: string;
  NameC: string;
  CatgNameC: string;
  YearN: number;
  ApplyDateD: string;
  ApproveRejDateD: string;
  DescC: string;
  StatusC: string;
  LvDescC: string | null;
  FromDateC: string;
  ToDateC: string;
  EmpRemarksC: string;
  ApproveRemarkC: string;
  LeaveDaysN: number | null;
  Approve1C: string | null;
  Approve2C: string | null;
  FinalApproveC: string | null;
}

interface PendingApprovalModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  data: PendingApprovalData | null;
}

export default function PendingApprovalModal({
  visible,
  onClose,
  onSuccess,
  data,
}: PendingApprovalModalProps) {
  const { theme } = useTheme();

  const [rejectRemarks, setRejectRemarks] = useState("");
  const [approveAmt, setApproveAmt] = useState("");
  const [processingAction, setProcessingAction] = useState<
    "Approved" | "Rejected" | null
  >(null);

  // Determine flag helper
  const getFlag = (desc: string) => {
    console.log("Description:", desc); // Debug log

    const d = (desc || "").toLowerCase();
    if (d.includes("claim")) return "Claim";
    if (d.includes("document")) return "Employee Document";
    if (d.includes("profile")) return "Profile";
    if (d.includes("time")) return "Time";
    if (d.includes("surrender")) return "Leave Surrender";
    if (d.includes("cancel"))
      return d.includes("surrender")
        ? "Cancel Leave Surrender"
        : "Cancel Leave";
    return "Lev"; // Default to Leave
  };

  const flag = data ? getFlag(data.DescC) : "Lev";
  const isClaim = flag === "Claim";

  useEffect(() => {
    if (visible && data) {
      setRejectRemarks("");
      setProcessingAction(null);

      // For claims, pre-fill amount from remarks if possible
      if (getFlag(data.DescC) === "Claim" && data.EmpRemarksC) {
        const match = data.EmpRemarksC.match(/(\d+(\.\d+)?)/);
        if (match) {
          setApproveAmt(match[0]);
        } else {
          setApproveAmt("");
        }
      } else {
        setApproveAmt("");
      }
    }
  }, [visible, data]);

  if (!data) return null;

  // Helper to format ASP.NET JSON Date /Date(1234567890)/
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

  const handleSubmission = async (
    status: "Approved" | "Rejected",
    remarks: string,
  ) => {
    if (!data) return;

    // Validation based on Java snippets
    if (status === "Rejected") {
      if (remarks.trim().length < 11) {
        ConfirmModal.alert(
          "Validation Error",
          "Remarks should be more than 10 characters",
        );
        return;
      }
    }

    let amount = 0;
    if (flag === "Claim") {
      if (status === "Approved") {
        if (!approveAmt || parseFloat(approveAmt) <= 0) {
          ConfirmModal.alert("Validation Error", "Enter approved amount");
          return;
        }
        // Optional: Validating against Claim Amount if you want to implement strictly
      }
      amount = parseFloat(approveAmt) || 0;
    }

    setProcessingAction(status);

    try {
      const result = await ApiService.updatePendingApproval({
        IdN: data.IdN,
        StatusC: status,
        ApproveRemarkC: remarks,
        EmpIdN: data.EmpIdN,
        Flag: flag,
        ApproveAmtN: amount,
        // Add specific fields if needed based on Flag
        title:
          flag === "Employee Document"
            ? data.CatgNameC || data.DescC
            : flag === "Claim"
              ? "ClaimDoc"
              : "",
        DocName:
          flag === "Employee Document"
            ? data.NameC || ""
            : flag === "Claim"
              ? "tyht"
              : "",
        // Defaults
        ReceiveYearN: 0,
        ReceiveMonthN: 0,
        PayTypeN: 0,
        ClaimExpenseDtl1: [],
      });

      if (result.success) {
        ConfirmModal.alert("Success", `Request ${status.toLowerCase()} successfully`, [
          {
            text: "OK",
            onPress: () => {
              onSuccess();
              onClose();
            },
          },
        ]);
      } else {
        ConfirmModal.alert("Error", result.error || "Failed to update approval");
      }
    } catch (error: any) {
      ConfirmModal.alert("Error", error?.message || "Failed to update approval");
    } finally {
      setProcessingAction(null);
    }
  };

  // Status Logic for Color
  const statusStr = data.StatusC || "Waiting";
  let statusInfo = { color: "#D97706", bg: "#FEF3C7", label: "PENDING" };
  if (statusStr.toLowerCase().includes("approv"))
    statusInfo = { color: "#16A34A", bg: "#DCFCE7", label: "APPROVED" };
  if (
    statusStr.toLowerCase().includes("reject") ||
    statusStr.toLowerCase().includes("cancel")
  ) {
    statusInfo = {
      color: "#DC2626",
      bg: "#FEE2E2",
      label: statusStr.toUpperCase(),
    };
  }

  const handleApprove = () => {
    ConfirmModal.alert(
      "Approve Request",
      "Are you sure you want to approve this request?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          style: "default",
          onPress: () => handleSubmission("Approved", rejectRemarks),
        },
      ],
    );
  };

  const handleReject = () => {
    if (!rejectRemarks.trim()) {
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
          onPress: () => handleSubmission("Rejected", rejectRemarks),
        },
      ],
    );
  };

  const DetailItem = ({
    label,
    value,
    icon,
  }: {
    label: string;
    value: string | number;
    icon: any;
  }) => (
    <View style={styles.detailItem}>
      <View style={[styles.detailIcon, { backgroundColor: theme.inputBg }]}>
        <Ionicons name={icon} size={18} color={theme.primary} />
      </View>
      <View style={styles.detailText}>
        <Text style={[styles.detailLabel, { color: theme.placeholder }]}>
          {label}
        </Text>
        <Text style={[styles.detailValue, { color: theme.text }]}>
          {value || "—"}
        </Text>
      </View>
    </View>
  );

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title="Approval Request"
      subtitle={`Employee: ${data.NameC} • Ref: #${data.IdN}`}
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

        <DetailItem
          icon="person-outline"
          label="EMPLOYEE CODE"
          value={data.CodeC}
        />
        <DetailItem
          icon="briefcase-outline"
          label="PROJECT NAME"
          value={data.CatgNameC || "N/A"}
        />
        <DetailItem
          icon="document-text-outline"
          label="REQUEST TYPE"
          value={data.DescC || "N/A"}
        />
        <DetailItem
          icon="calendar-outline"
          label="APPLY DATE"
          value={formatDate(data.ApplyDateD)}
        />

        {data.LvDescC && (
          <DetailItem
            icon="time-outline"
            label="SCHEDULE/DURATION"
            value={data.LvDescC}
          />
        )}

        {data.LeaveDaysN !== null && (
          <DetailItem
            icon="timer-outline"
            label="LEAVE DAYS"
            value={data.LeaveDaysN}
          />
        )}

        {data.EmpRemarksC && (
          <DetailItem
            icon="chatbubble-outline"
            label="EMPLOYEE REMARKS"
            value={data.EmpRemarksC}
          />
        )}

        {isClaim && (
          <View style={styles.inputContainer}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>
              Approve Amount
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.inputBg,
                  borderColor: theme.inputBorder,
                  color: theme.text,
                },
              ]}
              placeholder="Enter amount"
              placeholderTextColor={theme.placeholder}
              value={approveAmt}
              onChangeText={setApproveAmt}
              keyboardType="numeric"
            />
          </View>
        )}

        {/* Approval Section */}
        <View style={styles.approvalSection}>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>
            APPROVAL DECISION
          </Text>

          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>
              Remarks
            </Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: theme.inputBg,
                  borderColor: theme.inputBorder,
                  color: theme.text,
                },
              ]}
              placeholder="Enter your remarks here (required for rejection)"
              placeholderTextColor={theme.placeholder}
              value={rejectRemarks}
              onChangeText={setRejectRemarks}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        <View style={styles.footerButtons}>
          <CustomButton
            title="Reject"
            icon="close-circle-outline"
            onPress={handleReject}
            isLoading={processingAction === "Rejected"}
            disabled={processingAction !== null}
            textColor="#DC2626"
            iconColor="#DC2626"
            indicatorColor="#DC2626"
            style={[styles.actionButton, styles.rejectButton]}
          />

          <CustomButton
            title="Approve"
            icon="checkmark-circle-outline"
            onPress={handleApprove}
            isLoading={processingAction === "Approved"}
            disabled={processingAction !== null}
            style={[
              styles.actionButton,
              styles.approveButton,
              { backgroundColor: theme.primary },
            ]}
          />
        </View>
      </ScrollView>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  modalBody: {
    padding: 18,
  },
  badgeRow: {
    flexDirection: "row",
    marginBottom: 40,
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
  detailItem: {
    flexDirection: "row",
    marginBottom: 24,
    alignItems: "flex-start",
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  detailText: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 12,
    fontSize: 15,
    height: 48,
  },
  approvalSection: {
    marginTop: 8,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
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
    paddingBottom: 30,
  },
  actionButton: {
    minWidth: 130,
    flexGrow: 0,
    flexShrink: 0,
    marginBottom: 0,
    padding: 10,
  },
  approveButton: {
    backgroundColor: "#16A34A",
  },
  rejectButton: {
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
});
