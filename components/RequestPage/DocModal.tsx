import Alert from "@/components/common/AppAlert";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import AppModal from "../../components/common/AppModal";
import { useTheme } from "../../context/ThemeContext";
import ApiService from "../../services/ApiService";
import { CustomButton } from "../CustomButton";

interface DocModalProps {
  visible: boolean;
  onClose: () => void;
  item: any;
  onRefresh?: () => void;
}

const DocModal: React.FC<DocModalProps> = ({
  visible,
  onClose,
  item,
  onRefresh,
}) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [docData, setDocData] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [viewingDoc, setViewingDoc] = useState<{
    url: string;
    name: string;
  } | null>(null);

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
        return (
          date.toLocaleDateString("en-US", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }) +
          ", " +
          date.toLocaleDateString("en-US", { weekday: "short" })
        );
      }

      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return (
        date.toLocaleDateString("en-US", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }) +
        ", " +
        date.toLocaleDateString("en-US", { weekday: "short" })
      );
    } catch (e) {
      return dateString;
    }
  };

  // Fetch document details
  useEffect(() => {
    const fetchDocDetails = async () => {
      if (!visible || !item) return;

      setDetailsLoading(true);

      try {
        const docResult = await ApiService.getEmployeeDocument(item.IdN);

        if (docResult?.success && docResult?.data?.data?.[0]) {
          const docInfo = docResult.data.data[0];
          setDocData(docInfo);

          // Get employee ID - try multiple sources
          const currentUser = ApiService.getCurrentUser();
          const empId = docInfo.EmpIdN || item.EmpIdN || currentUser.empId;

          // Fetch documents using getEmployeeDocuments with proper parameters
          if (empId && docInfo.DocTypeC && docInfo.DocNameC) {
            const docsResult = await ApiService.getEmployeeDocuments(
              empId,
              docInfo.DocTypeC,
              docInfo.DocNameC,
            );

            if (docsResult?.success && docsResult.data?.xx) {
              setDocuments(docsResult.data.xx);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching document details:", error);
      } finally {
        setDetailsLoading(false);
      }
    };

    fetchDocDetails();
  }, [visible, item]);

  const handleCancelRequest = async () => {
    Alert.alert(
      "Cancel Request",
      "Are you sure you want to cancel this document request?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
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
                Flag: "Employee Document",
                ApproveAmtN: 0,
                title: docData?.DocTypeC || "",
                DocName: docData?.DocNameC || "",
                ReceiveYearN: 0,
                ReceiveMonthN: 0,
                PayTypeN: 0,
              });

              if (result.success) {
                Alert.alert(
                  "Success",
                  "Document request cancelled successfully",
                );
                onClose();
                onRefresh?.();
              } else {
                Alert.alert(
                  "Error",
                  result.error || "Failed to cancel document request.",
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

  const handleViewDocument = async (fileName: string, folderName: string) => {
    try {
      const AsyncStorage =
        require("@react-native-async-storage/async-storage").default;

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
      const empId = docData?.EmpIdN || item.EmpIdN || currentUser.empId;

      if (companyUrl) {
        // URL Pattern: https://hr.trickyhr.com/kevit-Customer/{CustomerId}/{CompanyId}/{EmpId}/EmpDocuments/{FolderName}/{FileName}
        const url = `${companyUrl}/kevit-Customer/${customerId}/${companyId}/${empId}/EmpPortalDocuments/${folderName}/${fileName}`;
        // console.log("Viewing URL:", url);
        setViewingDoc({ url, name: fileName });
      } else {
        Alert.alert("Error", "Missing company URL");
      }
    } catch (error) {
      console.error("Error building document URL:", error);
      Alert.alert("Error", "Failed to open document");
    }
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

    if (!docData) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.placeholder }]}>
            No document details available
          </Text>
        </View>
      );
    }

    return (
      <>
        <View style={styles.content}>
          <InfoRow
            label="Doc Name"
            value={docData.DocNameC || "N/A"}
            theme={theme}
          />
          <InfoRow
            label="Doc Type"
            value={docData.DocTypeC || "N/A"}
            theme={theme}
          />
          <InfoRow
            label="Remarks"
            value={docData.PDRemarksC || "No remarks"}
            theme={theme}
          />
        </View>

        {/* Documents */}
        {documents.length > 0 && (
          <View style={styles.documentsSection}>
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
                    onPress={() =>
                      handleViewDocument(fileName, docData.DocTypeC)
                    }
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
      title="Employee Document Manage"
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

      <Modal
        visible={!!viewingDoc}
        transparent={true}
        onRequestClose={() => setViewingDoc(null)}
        animationType="slide"
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: "black" }}>
          <View style={styles.viewerHeader}>
            <TouchableOpacity
              onPress={() => setViewingDoc(null)}
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
              <WebView
                source={{
                  uri:
                    Platform.OS === "android" &&
                    !/\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(viewingDoc.url)
                      ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(viewingDoc.url)}`
                      : viewingDoc.url,
                }}
                style={{ flex: 1 }}
                startInLoadingState={true}
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
  content: {
    paddingVertical: 8,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "flex-start",
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "600",
    width: 100,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  documentsSection: {
    marginTop: 8,
  },
  documentItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 4,
    marginBottom: 10,
    gap: 12,
  },
  documentIcon: {
    width: 52,
    height: 52,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 15,
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
});

export default DocModal;
