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
  Remarks: string;
  LeaveDaysN: string | null;
  Approve1C: string | null;
  Approve2C: string | null;
  FinalApproveC: string | null;
  ReaGrpNameC: string | null;
}

interface PendingApprovalModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  data: PendingApprovalData | null;
  currenttab: string;
}

interface LeaveManageDetail {
  AppEmpIdN: number;
  ReaGrpNameC: string;
  LVRemarksC: string;
  LeaveDaysN: string;
  LFromDateD: string;
  LToDateD: string;
}

export default function PendingApprovalModal({
  visible,
  onClose,
  onSuccess,
  data,
  currenttab,
}: PendingApprovalModalProps) {
  const { theme } = useTheme();

  const [rejectRemarks, setRejectRemarks] = useState("");
  const [approveAmt, setApproveAmt] = useState("");
  const [processingAction, setProcessingAction] = useState<
    "Approved" | "Rejected" | null
  >(null);

  const [yourPendings, setYourPendings] = useState<LeaveManageDetail | null>(null);;
  const [otherPendings, setOtherPendings] = useState<LeaveManageDetail | null>(null);;
  // GetSup_LeaveManageById

  const fetchPendingApprovals = async () => {
    try {
      const currentTab = currenttab;
      console.log("currentTab: ", currentTab)

      if (!data) return;
      const result = await ApiService.GetSup_LeaveManageById(data.IdN);

      if (result.success && result.data) {
        console.log(
          "Your Pending Data:",
          JSON.stringify(result.data[0], null, 2),
        );
        setYourPendings(result.data[0]);
      } else {
        ConfirmModal.alert(
          "Error",
          result.error || "Failed to fetch your pending approvals",
        );
      }

    } catch (error: any) {
      ConfirmModal.alert(
        "Error",
        error?.message || "Failed to fetch pending approvals",
      );
    }
  };

  useEffect(() => { fetchPendingApprovals() }, [data])

  // Determine flag helper
  const getFlag = (desc: string) => {
    const d = (desc || "").toLowerCase().trim();

    // CLAIM
    if (d.includes("claim") && !d.includes("expense")) {
      return "Claim";
    }

    // CLAIM EXPENSE
    if (d.includes("expense")) {
      return "EmpClaimExpense";
    }

    // TAX
    if (d.includes("tax")) {
      return "EmpTaxDeclaration";
    }

    // DOCUMENT
    if (d.includes("document")) {
      return "Employee Document";
    }

    // PROFILE
    if (d.includes("profile")) {
      return "Profile";
    }

    // LOAN
    if (d.includes("loan")) {
      return "Loan Request";
    }

    // TIME
    if (d.includes("time")) {
      return "Time";
    }

    // CANCEL LEAVE / CANCEL SURRENDER → API expects CancelLeave
    if (d.includes("cancel")) {
      return "CancelLeave";
    }

    // LEAVE SURRENDER
    if (d.includes("surrender") || d.includes("leave")) {
      return "Leave";
    }

    // DEFAULT → LEAVE
    return "Leave";
  };

  const flag = data ? getFlag(data.DescC) : "";
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

    setProcessingAction(status);

    try {
      const result = await ApiService.updatePendingApproval({
        IdN: data.IdN,
        StatusC: status,
        Remarks: remarks,
        EmpIdN: data.EmpIdN,
        Flag: flag,
        ApproveAmtN: amount,
        // Add specific fields if needed based on Flag
        title: "",
        // Defaults
        ReceiveYearN: 0,
        ReceiveMonthN: 0,
        PayTypeN: 0,
      });

      if (result.success) {
        console.log("Approval Result:", result); // Debug log
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
    value: string | number | any;
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
              {data.StatusC}
            </Text>
          </View>
        </View>

        <DetailItem
          icon="person-outline"
          label="EMPLOYEE CODE"
          value={data.CodeC}
        />

        <DetailItem
          icon="document-text-outline"
          label="LEAVE TYPE"
          value={yourPendings?.ReaGrpNameC || otherPendings?.ReaGrpNameC || "N/A"}
        />

        <DetailItem
          icon="calendar-outline"
          label="FROM DATE"
          value={formatFromDate(data.FromDateC)}
        />

        <DetailItem
          icon="calendar-outline"
          label="TO DATE"
          value={formatToDate(data.ToDateC)}
        />

        <DetailItem
          icon="calendar-outline"
          label="TOTAL DAYS"
          value={`${yourPendings?.LeaveDaysN || "0"} day(s)`}
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
