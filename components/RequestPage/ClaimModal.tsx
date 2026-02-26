import ConfirmModal from "@/components/common/ConfirmModal";
import Modal from "@/components/common/SingleModal";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import AppModal from "../../components/common/AppModal";
import { useTheme } from "../../context/ThemeContext";
import ApiService from "../../services/ApiService";
import { CustomButton } from "../CustomButton";
interface ClaimModalProps {
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
    approveAmount: number;
    flag: string;
  }) => Promise<{ success: boolean; error?: string }> | { success: boolean; error?: string };
  onReject?: (params: {
    item: any;
    remarks: string;
    approveAmount: number;
    flag: string;
  }) => Promise<{ success: boolean; error?: string }> | { success: boolean; error?: string };
  onSuccess?: () => void;
}
const ClaimModal: React.FC<ClaimModalProps> = ({
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
  const [rejectRemarks, setRejectRemarks] = useState("");
  const [approveAmt, setApproveAmt] = useState("");
  const [claimData, setClaimData] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [viewingDoc, setViewingDoc] = useState<{
    url: string;
    name: string;
  } | null>(null);
  const [viewerError, setViewerError] = useState<string | null>(null);
  const isApprovalMode = mode === "approval";
  const status = item?.StatusC || item?.StatusResult || item?.Status || "Waiting";
  const imageExtRegex = /\.(jpg|jpeg|png|gif|bmp|webp|heic|heif)$/i;
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
  const getFlag = (desc: string) => {
    const d = (desc || "").toLowerCase().trim();
    if (d.includes("claim") && !d.includes("expense")) return "Claim";
    if (d.includes("expense")) return "EmpClaimExpense";
    if (d.includes("tax")) return "EmpTaxDeclaration";
    if (d.includes("document")) return "Employee Document";
    if (d.includes("profile")) return "Profile";
    if (d.includes("loan")) return "Loan Request";
    if (d.includes("time")) return "Time";
    if (d.includes("cancel")) return "CancelLeave";
    if (d.includes("surrender") || d.includes("leave")) return "Leave";
    return "Leave";
  };
  const flag = getFlag(item?.DescC || "");
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
  // Fetch claim details and documents
  useEffect(() => {
    const fetchClaimDetails = async () => {
      if (!visible || !item) return;
      setDetailsLoading(true);
      try {
        const [claimResult, docsResult] = await Promise.all([
          ApiService.getClaimDetails(item.IdN),
          ApiService.getClaimDocuments(item.IdN),
        ]);
        if (claimResult?.success && claimResult?.data) {
          setClaimData(claimResult.data);
        }
        if (docsResult?.success && docsResult.data?.xx) {
          setDocuments(docsResult.data.xx);
        }
      } catch (error) {
        console.error("Error fetching claim details:", error);
      } finally {
        setDetailsLoading(false);
      }
    };
    fetchClaimDetails();
  }, [visible, item]);

  useEffect(() => {
    if (!visible || !item || !isApprovalMode) return;
    setRejectRemarks("");
    setProcessingAction(null);
    if (item.EmpRemarksC) {
      const match = item.EmpRemarksC.match(/(\d+(\.\d+)?)/);
      setApproveAmt(match ? match[0] : "");
    } else {
      setApproveAmt("");
    }
  }, [visible, item, isApprovalMode]);

  if (!item) return null;

  const handleCancelRequest = async () => {
    ConfirmModal.alert(
      "Cancel Request",
      "Are you sure you want to cancel this claim request?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              const parseDate = (dateStr: string | undefined) => {
                if (!dateStr) return undefined;
                try {
                  if (typeof dateStr === "string" && dateStr.includes("/Date(")) {
                    const timestamp = parseInt(
                      dateStr.replace(/\/Date\((-?\d+)\)\//, "$1"),
                    );
                    return new Date(timestamp);
                  }
                  return new Date(dateStr);
                } catch {
                  return undefined;
                }
              };
              const defaultCancel = async () => {
                const requestId = item.IdN || item.Id || item.id;
                const fromDate = parseDate(item.LFromDateD || item.FromDate);
                const toDate = parseDate(item.LToDateD || item.ToDate);
                return ApiService.deleteRequest(
                  requestId,
                  "Claim",
                  fromDate,
                  toDate,
                  "Cancelled by user",
                );
              };
              const result = onCancelRequest
                ? await onCancelRequest(item)
                : await defaultCancel();
              if (result.success) {
                ConfirmModal.alert("Success", "Claim request cancelled successfully");
                onClose();
                onRefresh?.();
                onSuccess?.();
              } else {
                ConfirmModal.alert(
                  "Error",
                  result.error || "Failed to cancel claim request.",
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
  const handleViewDocument = async (fileName: string) => {
    try {
      setViewerError(null);
      // Get user data for URL construction
      const userDataStr = await AsyncStorage.getItem("user_data");
      const userData = userDataStr ? JSON.parse(userDataStr) : null;
      const companyId = userData?.CompIdN || userData?.CompanyId || "1";
      const customerId =
        userData?.CustomerIdC || userData?.DomainId || "trickyhr";
      // Get company URL
      let companyUrl = await AsyncStorage.getItem("domain_url");
      if (companyUrl && companyUrl.endsWith("/")) {
        companyUrl = companyUrl.slice(0, -1);
      }
      const currentUser = ApiService.getCurrentUser();
      const empId = claimData?.EmpIdN || item.EmpIdN || currentUser.empId;
      const requestId = claimData?.IdN || claimData?.Id || item.IdN || item.Id;
      if (companyUrl) {
        // URL Pattern: https://hr.trickyhr.com/kevit-Customer/{CustomerId}/{CompanyId}/EmpPortal/ClaimDoc/{EmpId}/{ClaimId}/{FileName}
        const url = `${companyUrl}/kevit-Customer/${customerId}/${companyId}/EmpPortal/ClaimDoc/${empId}/${requestId}/${fileName}`;
        // console.log("Viewing URL:", url);
        setViewingDoc({ url, name: fileName });
      } else {
        ConfirmModal.alert("Error", "Missing company URL");
      }
    } catch (error) {
      console.error("Error building document URL:", error);
      ConfirmModal.alert("Error", "Failed to open document");
    }
  };
  const getViewerUri = (url: string) => {
    if (imageExtRegex.test(url)) {
      return url;
    }
    if (Platform.OS === "android") {
      return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`;
    }
    return url;
  };
  const handleOpenInBrowser = async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch (error) {
      console.error("Error opening browser:", error);
      ConfirmModal.alert("Error", "Unable to open the document in the browser.");
    }
  };
  const handleApprovalSubmission = async (
    actionStatus: "Approved" | "Rejected",
  ) => {
    if (actionStatus === "Rejected" && rejectRemarks.trim().length < 11) {
      ConfirmModal.alert(
        "Validation Error",
        "Remarks should be more than 10 characters",
      );
      return;
    }

    if (actionStatus === "Approved" && (!approveAmt || parseFloat(approveAmt) <= 0)) {
      ConfirmModal.alert("Validation Error", "Enter approved amount");
      return;
    }

    setProcessingAction(actionStatus);
    try {
      const amount = parseFloat(approveAmt) || 0;
      const callPayload = {
        item,
        remarks: rejectRemarks,
        approveAmount: amount,
        flag,
      };
      const defaultAction = async () => {
        return ApiService.updatePendingApproval({
          IdN: item.IdN,
          StatusC: actionStatus,
          Remarks: rejectRemarks,
          EmpIdN: item.EmpIdN,
          Flag: flag,
          ApproveAmtN: amount,
          title:
            flag === "Employee Document"
              ? item.CatgNameC || item.DescC
              : flag === "Claim"
                ? "ClaimDoc"
                : "",
          DocName:
            flag === "Employee Document"
              ? item.NameC || ""
              : flag === "Claim"
                ? "tyht"
                : "",
          ReceiveYearN: 0,
          ReceiveMonthN: 0,
          PayTypeN: 0,
          ClaimExpenseDtl1: [],
        });
      };

      const result =
        actionStatus === "Approved"
          ? onApprove
            ? await onApprove(callPayload)
            : await defaultAction()
          : onReject
            ? await onReject(callPayload)
            : await defaultAction();

      if (result.success) {
        ConfirmModal.alert(
          "Success",
          `Request ${actionStatus.toLowerCase()} successfully`,
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
        ConfirmModal.alert("Error", result.error || "Failed to update approval");
      }
    } catch (error: any) {
      ConfirmModal.alert("Error", error?.message || "Failed to update approval");
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
          onPress: () => handleApprovalSubmission("Rejected"),
        },
      ],
    );
  };
  const getTravelTypeLabel = (type: number) => {
    const types = [
      "None",
      "Train",
      "Bus",
      "Travels",
      "Two Wheeler",
      "Flight",
      "Accomdation/Food",
    ];
    return types[type] || "Unknown";
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
    if (!claimData) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.placeholder }]}>
            No claim details available
          </Text>
        </View>
      );
    }
    const travelExpenses = claimData.ClaimExpenseDtl1 || [];
    return (
      <>
        {/* Claim Information */}
        <View style={styles.section}>
          <InfoRow
            label="Claim Amount"
            value={`${claimData.ClaimAmtN?.toFixed(2) || "0"}`}
            theme={theme}
          />
          <InfoRow
            label="Claim Name"
            value={claimData.NameC || "N/A"}
            theme={theme}
          />
          <InfoRow
            label="Period From"
            value={formatDate(claimData.FromDateD)}
            theme={theme}
          />
          <InfoRow
            label="Period To"
            value={formatDate(claimData.ToDateD)}
            theme={theme}
          />
          {claimData.CurrencyNameC && (
            <InfoRow
              label="Currency"
              value={claimData.CurrencyNameC}
              theme={theme}
            />
          )}
          <InfoRow
            label="Description"
            value={claimData.DescC || "No description"}
            theme={theme}
          />
        </View>
        {/* Travel and Other Expense */}
        {travelExpenses.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>
              Travel and Other Expense
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tableScrollView}
            >
              <View style={styles.tableContainer}>
                <View
                  style={[
                    styles.tableHeader,
                    { backgroundColor: theme.inputBg },
                  ]}
                >
                  <Text style={[styles.tableHeaderText, { color: theme.text }]}>
                    Travel By
                  </Text>
                  <Text style={[styles.tableHeaderText, { color: theme.text }]}>
                    Boarding Point/Desc
                  </Text>
                  <Text style={[styles.tableHeaderText, { color: theme.text }]}>
                    Destination
                  </Text>
                  <Text style={[styles.tableHeaderText, { color: theme.text }]}>
                    PNR
                  </Text>
                  <Text style={[styles.tableHeaderText, { color: theme.text }]}>
                    Amount
                  </Text>
                </View>
                {travelExpenses.map((expense: any, index: number) => (
                  <View
                    key={index}
                    style={[
                      styles.tableRow,
                      { borderBottomColor: theme.inputBorder },
                    ]}
                  >
                    <Text
                      style={[styles.tableCell, { color: theme.text }]}
                      numberOfLines={1}
                    >
                      {getTravelTypeLabel(expense.TravelByN)}
                    </Text>
                    <Text
                      style={[styles.tableCell, { color: theme.text }]}
                      numberOfLines={1}
                    >
                      {expense.BoardintPointC || "-"}
                    </Text>
                    <Text
                      style={[styles.tableCell, { color: theme.text }]}
                      numberOfLines={1}
                    >
                      {expense.DestinationC || "-"}
                    </Text>
                    <Text
                      style={[styles.tableCell, { color: theme.text }]}
                      numberOfLines={1}
                    >
                      {expense.PNRC || "-"}
                    </Text>
                    <Text
                      style={[
                        styles.tableCell,
                        { color: theme.text, fontWeight: "600" },
                      ]}
                      numberOfLines={1}
                    >
                      {expense.TravelAmountN?.toFixed(2) || "0.00"}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}
        {/* Claim Documents */}
        {documents.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>
              Claim Documents
            </Text>
            {documents.map((doc: any, index: number) => {
              const fileName = doc.NameC || "Unknown";
              const fileDate = doc.LastWriteTimeC
                ? formatDate(doc.LastWriteTimeC)
                : "N/A";
              const fileExtension =
                fileName.split(".").pop()?.toLowerCase() || "";
              let iconName = "document-outline";
              let iconColor = theme.primary;
              let iconBg = theme.primary + "20";
              if (["jpg", "jpeg", "png", "gif"].includes(fileExtension)) {
                iconName = "image-outline";
              } else if (fileExtension === "pdf") {
                iconName = "document-text-outline";
                iconColor = "#DC2626";
                iconBg = "#FEE2E2";
              }
              return (
                <View
                  key={index}
                  style={[
                    styles.documentItem,
                    { backgroundColor: theme.inputBg },
                  ]}
                >
                  <View
                    style={[styles.documentIcon, { backgroundColor: iconBg }]}
                  >
                    <Ionicons
                      name={iconName as any}
                      size={28}
                      color={iconColor}
                    />
                  </View>
                  <View style={styles.documentInfo}>
                    <Text
                      style={[styles.documentName, { color: theme.text }]}
                      numberOfLines={1}
                    >
                      {fileName}
                    </Text>
                    <Text
                      style={[
                        styles.documentDate,
                        { color: theme.placeholder },
                      ]}
                    >
                      {fileDate}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.viewButton}
                    onPress={() => handleViewDocument(fileName)}
                  >
                    <Ionicons
                      name="eye-outline"
                      size={22}
                      color={theme.primary}
                    />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
      </>
    );
  };
  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title={isApprovalMode ? "Approval Request" : "Claim"}
      subtitle={
        isApprovalMode
          ? `Employee: ${item.NameC || "N/A"} • Ref: #${item.IdN || "N/A"}`
          : `Ref: #${item.IdN || "N/A"}`
      }
      footer={(() => {
        if (isApprovalMode) {
          return (
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
          );
        }

        if (
          status.toLowerCase().includes("waiting") ||
          status.toLowerCase().includes("pending")
        ) {
          return (
            <CustomButton
              title="Cancel Request"
              icon="close"
              isLoading={loading}
              disabled={loading}
              onPress={handleCancelRequest}
              style={styles.cancelButton}
            />
          );
        }
        return null;
      })()}
    >
      <ScrollView style={styles.modalBody} contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
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
        {isApprovalMode && (
          <>
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
            <View
              style={[
                styles.approvalSection,
                { borderTopColor: theme.inputBorder },
              ]}
            >
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
          </>
        )}
      </ScrollView>
      <Modal
        visible={!!viewingDoc}
        transparent={true}
        onRequestClose={() => {
          setViewingDoc(null);
          setViewerError(null);
        }}
        animationType="slide"
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: "black" }}>
          <View style={styles.viewerHeader}>
            <TouchableOpacity
              onPress={() => {
                setViewingDoc(null);
                setViewerError(null);
              }}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            <Text
              style={{ color: "white", fontWeight: "bold" }}
              numberOfLines={1}
            >
              {viewingDoc?.name}
            </Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={{ flex: 1 }}>
            {viewingDoc?.url && (
              <>
                <WebView
                  source={{ uri: getViewerUri(viewingDoc.url) }}
                  style={{ flex: 1 }}
                  originWhitelist={["*"]}
                  setSupportMultipleWindows={false}
                  startInLoadingState={true}
                  onError={(event) => {
                    console.error("Document viewer error:", event.nativeEvent);
                    setViewerError("This document can't be previewed here.");
                  }}
                  onHttpError={(event) => {
                    console.error("Document viewer HTTP error:", event.nativeEvent);
                    setViewerError("This document can't be previewed here.");
                  }}
                  renderLoading={() => (
                    <View
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <ActivityIndicator size="large" color={theme.primary} />
                    </View>
                  )}
                />
                {viewerError && (
                  <View style={styles.viewerErrorContainer}>
                    <Text style={styles.viewerErrorText}>{viewerError}</Text>
                    <TouchableOpacity
                      style={[styles.viewerFallbackButton, { borderColor: theme.primary }]}
                      onPress={() => handleOpenInBrowser(viewingDoc.url)}
                    >
                      <Text style={[styles.viewerFallbackButtonText, { color: theme.primary }]}>
                        Open in Browser
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        </SafeAreaView>
      </Modal>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 12,
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
  tableScrollView: {
    marginBottom: 8,
  },
  tableContainer: {
    minWidth: "100%",
  },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  tableHeaderText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    width: 110,
    marginRight: 8,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  tableCell: {
    fontSize: 13,
    fontWeight: "500",
    width: 110,
    marginRight: 8,
  },
  scrollHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 8,
  },
  scrollHintText: {
    fontSize: 11,
    fontWeight: "500",
  },
  documentItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 4,
    marginBottom: 8,
    gap: 12,
  },
  documentIcon: {
    width: 48,
    height: 48,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  documentDate: {
    fontSize: 12,
    fontWeight: "500",
  },
  downloadButton: {
    padding: 8,
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
  viewButton: {
    padding: 8,
  },
  viewerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  closeButton: {
    padding: 8,
  },
  viewerErrorContainer: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 24,
    backgroundColor: "rgba(0,0,0,0.8)",
    borderRadius: 8,
    padding: 16,
    gap: 12,
  },
  viewerErrorText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  viewerFallbackButton: {
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
  },
  viewerFallbackButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
export default ClaimModal;
