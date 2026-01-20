import Header, { HEADER_HEIGHT } from "@/components/Header";
import { useProtectedBack } from "@/hooks/useProtectedBack";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import CenterModalSelection from "../../../components/common/CenterModalSelection";
import { CustomButton } from "../../../components/CustomButton";
import AttenderSignatureModal from "../../../components/ServiceReport/AttenderSignatureModal";
import ClientSignatureModal from "../../../components/ServiceReport/ClientSignatureModal";
import SelectServiceStatusModal from "../../../components/ServiceReport/SelectServiceStatusModal";
import SelectServiceTypeModal from "../../../components/ServiceReport/SelectServiceTypeModal";
import ServiceDetailsModal from "../../../components/ServiceReport/ServiceDetailsModal";
import { useTheme } from "../../../context/ThemeContext";
import ApiService from "../../../services/ApiService";

interface Client {
  IdN: number;
  NameC: string;
  EmailIdC: string;
}

interface ServiceType {
  IdN: number;
  NameC: string;
  selected: boolean;
}

interface ServiceDetail {
  WHC: string;
  PartCodeC: string;
  PartDescC: string;
  QtyN: number;
  UnitN: number;
}

export default function ServiceReport() {
  const { theme } = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Client data
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientModal, setShowClientModal] = useState(false);

  // Service types and status
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [serviceStatus, setServiceStatus] = useState<ServiceType[]>([]);
  const [selectedServiceTypes, setSelectedServiceTypes] = useState<number[]>(
    [],
  );
  const [selectedServiceStatus, setSelectedServiceStatus] = useState<number[]>(
    [],
  );
  const [showServiceTypeModal, setShowServiceTypeModal] = useState(false);
  const [showServiceStatusModal, setShowServiceStatusModal] = useState(false);

  // Service details
  const [serviceDetails, setServiceDetails] = useState<ServiceDetail[]>([]);
  const [showServiceDetailsModal, setShowServiceDetailsModal] = useState(false);
  const [editingDetailIndex, setEditingDetailIndex] = useState<number | null>(
    null,
  );

  // Form fields
  const [ticketNumber, setTicketNumber] = useState("");
  const [faultDescription, setFaultDescription] = useState("");
  const [actionTaken, setActionTaken] = useState("");
  const [remarks, setRemarks] = useState("");

  // Date/Time fields
  const [callTime, setCallTime] = useState(new Date());
  const [appointmentTime, setAppointmentTime] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [followUpDate, setFollowUpDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState<{
    visible: boolean;
    type: "call" | "appointment" | "start" | "followup" | null;
    mode: "date" | "time";
  }>({ visible: false, type: null, mode: "date" });

  // Signatures
  const [clientSignature, setClientSignature] = useState<string>("");
  const [attendeeSignature, setAttendeeSignature] = useState<string>("");
  const [showAttenderSignatureModal, setShowAttenderSignatureModal] =
    useState(false);
  const [showClientSignatureModal, setShowClientSignatureModal] =
    useState(false);

  useProtectedBack({
    home: "/home",
    settings: "/settings",
    dashboard: "/dashboard",
  });

  useEffect(() => {
    fetchClientList();
  }, []);

  const fetchClientList = async () => {
    setLoading(true);
    try {
      const result = await ApiService.getClientList();
      if (result.success && result.data) {
        setClients(result.data.clients || []);
        setServiceTypes(
          (result.data.serviceTypes || [])
            .filter((st: any) => st.IdN <= 100)
            .map((st: any) => ({ ...st, selected: false })),
        );
        setServiceStatus(
          (result.data.serviceTypes || [])
            .filter((st: any) => st.IdN > 100)
            .map((st: any) => ({ ...st, selected: false })),
        );
      } else {
        Alert.alert("Error", result.error || "Failed to fetch client list");
      }
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to fetch client list");
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (date: Date) => {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${month}/${day}/${year} ${hours}:${minutes}`;
  };

  const formatDate = (date: Date) => {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const handleDateTimeChange = (event: any, selectedDate?: Date) => {
    if (!selectedDate) {
      setShowDatePicker({ visible: false, type: null, mode: "date" });
      return;
    }

    const { type, mode } = showDatePicker;

    if (mode === "date" && type !== "followup") {
      setShowDatePicker({ visible: true, type, mode: "time" });

      if (type === "call") setCallTime(selectedDate);
      else if (type === "appointment") setAppointmentTime(selectedDate);
      else if (type === "start") setStartTime(selectedDate);
    } else {
      setShowDatePicker({ visible: false, type: null, mode: "date" });

      if (type === "call") setCallTime(selectedDate);
      else if (type === "appointment") setAppointmentTime(selectedDate);
      else if (type === "start") setStartTime(selectedDate);
      else if (type === "followup") setFollowUpDate(selectedDate);
    }
  };

  const handleSubmit = async () => {
    if (!selectedClient) {
      Alert.alert("Error", "Please select a client");
      return;
    }
    if (!ticketNumber.trim()) {
      Alert.alert("Error", "Please enter ticket number");
      return;
    }
    if (selectedServiceTypes.length === 0) {
      Alert.alert("Error", "Please select at least one service type");
      return;
    }
    if (selectedServiceStatus.length === 0) {
      Alert.alert("Error", "Please select service status");
      return;
    }
    if (faultDescription.length < 10) {
      Alert.alert("Error", "Fault description must be at least 10 characters");
      return;
    }
    if (actionTaken.length < 10) {
      Alert.alert("Error", "Action taken must be at least 10 characters");
      return;
    }
    if (!attendeeSignature) {
      Alert.alert("Error", "Attendee signature is required");
      return;
    }
    if (!clientSignature) {
      Alert.alert("Error", "Client signature is required");
      return;
    }

    Alert.alert(
      "Confirm Submission",
      "Are you sure you want to submit this service report?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Submit", onPress: submitReport },
      ],
    );
  };

  const submitReport = async () => {
    setSubmitting(true);
    try {
      const serviceTypeIds = [
        ...selectedServiceTypes,
        ...selectedServiceStatus,
      ].join(",");

      const result = await ApiService.submitServiceReport({
        ClientIdN: selectedClient!.IdN,
        TicketNoC: ticketNumber,
        Remark1C: faultDescription,
        Remark2C: actionTaken,
        Remark3C: remarks,
        ServiceTypeC: serviceTypeIds,
        FollowUpDateD: followUpDate ? formatDate(followUpDate) : "01/01/1900",
        ServiceDtl: JSON.stringify(serviceDetails),
        StartTimeD: formatDateTime(startTime),
        CallTimeD: formatDateTime(callTime),
        AppointmentTimeD: formatDateTime(appointmentTime),
        ClientSign: clientSignature,
        EmpSign: attendeeSignature,
      });

      if (result.success) {
        Alert.alert("Success", "Service report submitted successfully", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        Alert.alert("Error", result.error || "Failed to submit service report");
      }
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to submit service report");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddServiceDetail = () => {
    setEditingDetailIndex(null);
    setShowServiceDetailsModal(true);
  };

  const handleEditServiceDetail = (index: number) => {
    setEditingDetailIndex(index);
    setShowServiceDetailsModal(true);
  };

  const handleDeleteServiceDetail = (index: number) => {
    Alert.alert(
      "Delete Service Detail",
      "Are you sure you want to delete this service detail?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            const newDetails = serviceDetails.filter((_, i) => i !== index);
            setServiceDetails(newDetails);
          },
        },
      ],
    );
  };

  const handleSaveServiceDetail = (detail: ServiceDetail) => {
    if (editingDetailIndex !== null) {
      // Edit existing
      const newDetails = [...serviceDetails];
      newDetails[editingDetailIndex] = detail;
      setServiceDetails(newDetails);
    } else {
      // Add new
      setServiceDetails([...serviceDetails, detail]);
    }
  };

  const getSelectedServiceTypeNames = () => {
    return serviceTypes
      .filter((st) => selectedServiceTypes.includes(st.IdN))
      .map((st) => st.NameC)
      .join(", ");
  };

  const getSelectedServiceStatusNames = () => {
    return serviceStatus
      .filter((st) => selectedServiceStatus.includes(st.IdN))
      .map((st) => st.NameC)
      .join(", ");
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Header title="Service Report" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Loading...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header title="Service Report" />

      <View style={{ flex: 1, paddingTop: HEADER_HEIGHT }}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Client Selection */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.text }]}>
              Select Client Name
            </Text>

            <TouchableOpacity
              style={[
                styles.selectorContainer,
                {
                  backgroundColor: theme.inputBg,
                  borderColor: theme.inputBorder,
                },
              ]}
              onPress={() => setShowClientModal(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="person-outline" size={20} color={theme.primary} />
              <Text
                style={[
                  styles.selectorText,
                  { color: selectedClient ? theme.text : theme.placeholder },
                ]}
              >
                {selectedClient ? selectedClient.NameC : "Select Client"}
              </Text>
              <Ionicons
                name="chevron-down"
                size={20}
                color={theme.text + "80"}
              />
            </TouchableOpacity>

            {selectedClient && (
              <Text style={[styles.clientEmail, { color: theme.placeholder }]}>
                Client Email Id : {selectedClient.EmailIdC}
              </Text>
            )}
          </View>

          {/* Ticket Number */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.text }]}>
              Ticket number
            </Text>
            <View
              style={[
                styles.input,
                {
                  backgroundColor: theme.inputBg,
                  borderColor: theme.inputBorder,
                },
              ]}
            >
              <TextInput
                style={[styles.textInput, { color: theme.text }]}
                placeholder=""
                placeholderTextColor={theme.placeholder}
                value={ticketNumber}
                onChangeText={setTicketNumber}
              />
            </View>
          </View>

          {/* Service Type */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.text }]}>
              Select Service Types
            </Text>
            <TouchableOpacity
              style={[
                styles.input,
                {
                  backgroundColor: theme.inputBg,
                  borderColor: theme.inputBorder,
                },
              ]}
              onPress={() => setShowServiceTypeModal(true)}
            >
              <Text
                style={[
                  styles.inputText,
                  {
                    color:
                      selectedServiceTypes.length > 0
                        ? theme.text
                        : theme.placeholder,
                  },
                ]}
              >
                {selectedServiceTypes.length > 0
                  ? getSelectedServiceTypeNames()
                  : "--Select--"}
              </Text>
              <Ionicons
                name="chevron-down"
                size={20}
                color={theme.placeholder}
              />
            </TouchableOpacity>
          </View>

          {/* Time Fields */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.text }]}>Call Time</Text>
            <TouchableOpacity
              style={[
                styles.input,
                {
                  backgroundColor: theme.inputBg,
                  borderColor: theme.inputBorder,
                },
              ]}
              onPress={() =>
                setShowDatePicker({ visible: true, type: "call", mode: "date" })
              }
            >
              <Text style={[styles.inputText, { color: theme.text }]}>
                {formatDateTime(callTime)}
              </Text>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={theme.placeholder}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.text }]}>
              Appointment Time
            </Text>
            <TouchableOpacity
              style={[
                styles.input,
                {
                  backgroundColor: theme.inputBg,
                  borderColor: theme.inputBorder,
                },
              ]}
              onPress={() =>
                setShowDatePicker({
                  visible: true,
                  type: "appointment",
                  mode: "date",
                })
              }
            >
              <Text style={[styles.inputText, { color: theme.text }]}>
                {formatDateTime(appointmentTime)}
              </Text>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={theme.placeholder}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.text }]}>
              Arrival Date & Time
            </Text>
            <TouchableOpacity
              style={[
                styles.input,
                {
                  backgroundColor: theme.inputBg,
                  borderColor: theme.inputBorder,
                },
              ]}
              onPress={() =>
                setShowDatePicker({
                  visible: true,
                  type: "start",
                  mode: "date",
                })
              }
            >
              <Text style={[styles.inputText, { color: theme.text }]}>
                {formatDateTime(startTime)}
              </Text>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={theme.placeholder}
              />
            </TouchableOpacity>
          </View>

          {/* Service Details */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.label, { color: theme.text }]}>
                Service Details
              </Text>
              <CustomButton
                title="Add"
                icon="add"
                onPress={handleAddServiceDetail}
                style={[styles.addButton, { backgroundColor: theme.primary }]}
              />
            </View>

            {serviceDetails.length > 0 && (
              <View style={styles.serviceDetailsList}>
                {serviceDetails.map((detail, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.serviceDetailItem,
                      {
                        backgroundColor: theme.cardBackground,
                        borderColor: theme.inputBorder,
                      },
                    ]}
                    onPress={() => handleEditServiceDetail(index)}
                  >
                    <View style={styles.serviceDetailContent}>
                      <Text
                        style={[
                          styles.serviceDetailTitle,
                          { color: theme.text },
                        ]}
                      >
                        Service Description {index + 1}
                      </Text>
                      {detail.PartDescC && (
                        <Text
                          style={[
                            styles.serviceDetailText,
                            { color: theme.placeholder },
                          ]}
                          numberOfLines={1}
                        >
                          {detail.PartDescC}
                        </Text>
                      )}
                      {detail.PartCodeC && (
                        <Text
                          style={[
                            styles.serviceDetailText,
                            { color: theme.placeholder },
                          ]}
                          numberOfLines={1}
                        >
                          Part: {detail.PartCodeC}
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteServiceDetail(index)}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={20}
                        color="#F44336"
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Service Status */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.text }]}>
              Select Service Status
            </Text>
            <TouchableOpacity
              style={[
                styles.input,
                {
                  backgroundColor: theme.inputBg,
                  borderColor: theme.inputBorder,
                },
              ]}
              onPress={() => setShowServiceStatusModal(true)}
            >
              <Text
                style={[
                  styles.inputText,
                  {
                    color:
                      selectedServiceStatus.length > 0
                        ? theme.text
                        : theme.placeholder,
                  },
                ]}
              >
                {selectedServiceStatus.length > 0
                  ? getSelectedServiceStatusNames()
                  : "--Select--"}
              </Text>
              <Ionicons
                name="chevron-down"
                size={20}
                color={theme.placeholder}
              />
            </TouchableOpacity>
          </View>

          {/* Fault Description */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.text }]}>
              Fault Description
            </Text>
            <View
              style={[
                styles.textAreaContainer,
                {
                  backgroundColor: theme.inputBg,
                  borderColor: theme.inputBorder,
                },
              ]}
            >
              <TextInput
                style={[styles.textArea, { color: theme.text }]}
                placeholder=""
                placeholderTextColor={theme.placeholder}
                value={faultDescription}
                onChangeText={setFaultDescription}
                multiline
                numberOfLines={4}
              />
            </View>
          </View>

          {/* Action Taken */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.text }]}>
              Action Taken
            </Text>
            <View
              style={[
                styles.textAreaContainer,
                {
                  backgroundColor: theme.inputBg,
                  borderColor: theme.inputBorder,
                },
              ]}
            >
              <TextInput
                style={[styles.textArea, { color: theme.text }]}
                placeholder=""
                placeholderTextColor={theme.placeholder}
                value={actionTaken}
                onChangeText={setActionTaken}
                multiline
                numberOfLines={4}
              />
            </View>
          </View>

          {/* Remarks */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.text }]}>Remarks</Text>
            <View
              style={[
                styles.textAreaContainer,
                {
                  backgroundColor: theme.inputBg,
                  borderColor: theme.inputBorder,
                },
              ]}
            >
              <TextInput
                style={[styles.textArea, { color: theme.text }]}
                placeholder=""
                placeholderTextColor={theme.placeholder}
                value={remarks}
                onChangeText={setRemarks}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Signatures */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.text }]}>
              Attender Signature
            </Text>
            <View style={styles.signatureRow}>
              <View
                style={[
                  styles.signatureBox,
                  { borderColor: theme.inputBorder },
                ]}
              >
                {attendeeSignature ? (
                  <Image
                    source={{ uri: attendeeSignature }}
                    style={styles.signatureImage}
                    resizeMode="contain"
                  />
                ) : null}
              </View>
              <TouchableOpacity
                style={[
                  styles.signButton,
                  { backgroundColor: theme.placeholder },
                ]}
                onPress={() => setShowAttenderSignatureModal(true)}
              >
                <Text style={styles.signButtonText}>Write the Sign</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.text }]}>
              Client Signature
            </Text>
            <View style={styles.signatureRow}>
              <View
                style={[
                  styles.signatureBox,
                  { borderColor: theme.inputBorder },
                ]}
              >
                {clientSignature ? (
                  <Image
                    source={{ uri: clientSignature }}
                    style={styles.signatureImage}
                    resizeMode="contain"
                  />
                ) : null}
              </View>
              <TouchableOpacity
                style={[
                  styles.signButton,
                  { backgroundColor: theme.placeholder },
                ]}
                onPress={() => setShowClientSignatureModal(true)}
              >
                <Text style={styles.signButtonText}>Write the Sign</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit Button */}
          <CustomButton
            title="SUBMIT"
            icon="send"
            onPress={handleSubmit}
            isLoading={submitting}
            disabled={submitting}
            style={[styles.submitButton, { backgroundColor: theme.primary }]}
          />

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Client Selection Modal */}
        <CenterModalSelection
          visible={showClientModal}
          onClose={() => setShowClientModal(false)}
          title="Select Client"
          options={clients.map((client) => ({
            label: `${client.NameC} (${client.EmailIdC})`,
            value: client.IdN,
          }))}
          selectedValue={selectedClient?.IdN}
          onSelect={(val: number) => {
            const client = clients.find((c) => c.IdN === val);
            if (client) setSelectedClient(client);
          }}
        />

        {/* Service Type Modal */}
        <SelectServiceTypeModal
          visible={showServiceTypeModal}
          serviceTypes={serviceTypes}
          selectedIds={selectedServiceTypes}
          onClose={() => setShowServiceTypeModal(false)}
          onDone={(ids) => setSelectedServiceTypes(ids)}
        />

        {/* Service Status Modal */}
        <SelectServiceStatusModal
          visible={showServiceStatusModal}
          serviceStatus={serviceStatus}
          selectedIds={selectedServiceStatus}
          onClose={() => setShowServiceStatusModal(false)}
          onDone={(ids) => setSelectedServiceStatus(ids)}
        />

        {/* Attender Signature Modal */}
        <AttenderSignatureModal
          visible={showAttenderSignatureModal}
          onClose={() => setShowAttenderSignatureModal(false)}
          onSave={(signature) => setAttendeeSignature(signature)}
        />

        {/* Client Signature Modal */}
        <ClientSignatureModal
          visible={showClientSignatureModal}
          onClose={() => setShowClientSignatureModal(false)}
          onSave={(signature) => setClientSignature(signature)}
        />

        {/* Service Details Modal */}
        <ServiceDetailsModal
          visible={showServiceDetailsModal}
          onClose={() => setShowServiceDetailsModal(false)}
          onSave={handleSaveServiceDetail}
          editingDetail={
            editingDetailIndex !== null
              ? serviceDetails[editingDetailIndex]
              : null
          }
        />

        {/* Date/Time Picker */}
        {showDatePicker.visible && showDatePicker.type && (
          <DateTimePicker
            value={
              showDatePicker.type === "call"
                ? callTime
                : showDatePicker.type === "appointment"
                  ? appointmentTime
                  : showDatePicker.type === "start"
                    ? startTime
                    : followUpDate || new Date()
            }
            mode={showDatePicker.mode}
            display="default"
            onChange={handleDateTimeChange}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingTop: 10,
    paddingBottom: 4,
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 4,
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
    marginHorizontal: 16,
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "400",
    marginBottom: 8,
  },
  input: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 4,
    borderWidth: 1,
  },
  inputText: {
    flex: 1,
    fontSize: 15,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  textAreaContainer: {
    borderRadius: 4,
    borderWidth: 1,
    padding: 12,
  },
  textArea: {
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: "top",
  },
  clientEmail: {
    fontSize: 13,
    marginTop: 8,
  },
  selectorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 4,
    borderWidth: 1.5,
    gap: 12,
  },
  selectorText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },
  signatureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  signatureBox: {
    width: 140,
    height: 80,
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  signatureImage: {
    width: "100%",
    height: "100%",
  },
  signButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: "center",
  },
  signButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  submitButton: {
    marginHorizontal: 16,
    paddingVertical: 16,
    marginTop: 10,
    marginBottom: 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 4,
    borderWidth: 1,
    marginBottom: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  clientItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  emptyText: {
    textAlign: "center",
    fontSize: 15,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  addButton: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 4,
    marginBottom: 0,
  },
  serviceDetailsList: {
    gap: 12,
  },
  serviceDetailItem: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: "center",
  },
  serviceDetailContent: {
    flex: 1,
  },
  serviceDetailTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  serviceDetailText: {
    fontSize: 13,
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
});
