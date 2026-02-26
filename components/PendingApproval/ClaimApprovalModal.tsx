import ConfirmModal from "@/components/common/ConfirmModal";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import WebView from "react-native-webview";
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
}

interface PendingApprovalModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    data: PendingApprovalData | null;
}

export default function ClaimApprovalModal({
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
    const [claimData, setClaimData] = useState<any>({});
    const [documents, setDocuments] = useState<any[]>([]);

    const travelExpenses = Array.isArray(claimData?.ClaimExpenseDtl1)
        ? claimData.ClaimExpenseDtl1
        : [];

    const [viewingDoc, setViewingDoc] = useState<{
        url: string;
        name: string;
    } | null>(null);
    const imageExtRegex = /\.(jpg|jpeg|png|gif|bmp|webp|heic|heif)$/i;
    const getTravelTypeLabel = (type: number) => {
        const types = [
            "",
            "Flight",
            "Train",
            "Bus",
            "Taxi",
            "Own Vehicle",
            "Other",
        ];
        return types[type] || "Unknown";
    };

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

    const handleViewDocument = async (fileName: string) => {
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
            const empId = claimData.EmpIdN || currentUser.empId;
            const requestId = claimData.IdN || claimData.Id;
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

    useEffect(() => {
        const fetchClaimDetails = async () => {
            if (!visible || !data) return;
            try {
                const [claimResult, docsResult] = await Promise.all([
                    ApiService.getClaimDetails(data.IdN),
                    ApiService.getClaimDocuments(data.IdN),
                ]);
                if (claimResult?.success && claimResult?.data) {
                    setClaimData(claimResult.data);
                }
                if (docsResult?.success && docsResult.data?.xx) {
                    setDocuments(docsResult.data.xx);
                    // console.log(docsResult.data.xx);
                }
            } catch (error) {
                console.error("Error fetching claim details:", error);
            }
        };
        fetchClaimDetails();
    }, [visible, data]);

    const getViewerUri = (url: string) => {
        if (imageExtRegex.test(url)) {
            return url;
        }
        if (Platform.OS === "android") {
            return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`;
        }
        return url;
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
                Remarks: remarks,
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
            footer={
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
            }
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

                {travelExpenses.length > 0 && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.primary }]}>
                            Travel and Other Expense
                        </Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.tableScrollView}
                            contentContainerStyle={styles.tableScrollContent}
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

                <Modal
                    visible={!!viewingDoc}
                    transparent={true}
                    onRequestClose={() => {
                        setViewingDoc(null);
                    }}
                    animationType="slide"
                >
                    <SafeAreaView style={{ flex: 1, backgroundColor: "black" }}>
                        <View style={styles.viewerHeader}>
                            <TouchableOpacity
                                onPress={() => {
                                    setViewingDoc(null);
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
                                        }}
                                        onHttpError={(event) => {
                                            console.error("Document viewer HTTP error:", event.nativeEvent);
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

                                </>
                            )}
                        </View>
                    </SafeAreaView>
                </Modal>
            </ScrollView>
        </AppModal>
    );
}

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
    tableScrollView: {
        marginBottom: 8,
    },
    tableScrollContent: {
        paddingRight: 16,
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
    section: {
        marginBottom: 24,
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
