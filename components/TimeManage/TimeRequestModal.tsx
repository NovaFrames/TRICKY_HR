import { useUser } from "@/context/UserContext";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useEffect, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import ApiService from "../../services/ApiService";
import AppModal from "../common/AppModal";
import CenterModalSelection from "../common/CenterModalSelection";
import InModalConfirmDialog from "../common/InModalConfirmDialog";
import { CustomButton } from "../CustomButton";

interface TimeRequestModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const RequestTypes = [
  { label: "In Time", value: "In Time" },
  { label: "Out Time", value: "Out Time" },
];

const RequestTypesTwo = [
  { label: "In Time", value: "In Time" },
  { label: "Out Time", value: "Out Time" },
  { label: "In & Out Time", value: "In & Out Time" },
];

const TimeRequestModal: React.FC<TimeRequestModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const isIOS = Platform.OS === "ios";
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [showRequestTypeSelector, setShowRequestTypeSelector] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [projects, setProjects] = useState<{ label: string; value: number }[]>(
    [],
  );
  const [showInTimePicker, setShowInTimePicker] = useState(false);
  const [showOutTimePicker, setShowOutTimePicker] = useState(false);
  const [dialog, setDialog] = useState<{
    type: "error" | "confirm" | "success";
    title: string;
    message: string;
    closeAfter?: boolean;
  } | null>(null);

  const [formData, setFormData] = useState({
    date: new Date(),
    projectId: 0,
    requestType: "In Time",
    inTime: "00:00",
    outTime: "00:00",
    remarks: "",
  });

  const {user} = useUser();

  useEffect(() => {
    if (visible) {
      fetchProjects();
      setFormData({
        date: new Date(),
        projectId: 0,
        requestType: "In Time",
        inTime: "00:00",
        outTime: "00:00",
        remarks: "",
      });
      setDialog(null);
    }
  }, [visible]);

  const fetchProjects = async () => {
    try {
      const projectsData = await ApiService.getProjectList();

      if (projectsData && projectsData.length > 0) {
        const mapped = projectsData.map((p: any) => ({
          label:
            p.ProjectNameC || p.NameC || `Project ${p.ProjectIdN || p.IdN}`,
          value: p.ProjectIdN || p.IdN,
        }));
        setProjects(mapped);
      }
    } catch (error) {
      console.log("Error fetching projects", error);
    }
  };

  const getTimePickerDate = (time: string) => {
    const [hourRaw, minuteRaw] = time.split(":");
    const hour = Number(hourRaw);
    const minute = Number(minuteRaw);
    const date = new Date();
    if (!Number.isNaN(hour) && !Number.isNaN(minute)) {
      date.setHours(hour, minute, 0, 0);
    }
    return date;
  };

  const closeTransientPanels = () => {
    setShowProjectSelector(false);
    setShowRequestTypeSelector(false);
    setShowDatePicker(false);
    setShowInTimePicker(false);
    setShowOutTimePicker(false);
  };

  const openSelector = (type: "project" | "requestType") => {
    closeTransientPanels();
    if (type === "project") {
      setShowProjectSelector(true);
      return;
    }
    setShowRequestTypeSelector(true);
  };

  const showError = (title: string, message: string) => {
    setDialog({ type: "error", title, message });
  };

  const handleSubmit = async () => {
    if (!formData.projectId) {
      showError("Validation", "Please select a project");
      return;
    }
    setDialog({
      type: "confirm",
      title: "Submit Request",
      message: "Are you sure you want to submit this time request?",
    });
  };

  const submitTimeRequest = async () => {
    setLoading(true);
    try {
      const currentUser = ApiService.getCurrentUser();
      const empId =
        currentUser?.empId || (await AsyncStorage.getItem("emp_id"));
      if (!empId) {
        showError("Error", "User ID not found");
        return;
      }

      const d = formData.date;
      const dateString = `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
      const requests = [];

      if (formData.requestType === "In Time") {
        requests.push({ InTimeN: formData.inTime, OutTimeN: "00:00" });
      } else if (formData.requestType === "Out Time") {
        requests.push({ InTimeN: "00:00", OutTimeN: formData.outTime });
      } else if (formData.requestType === "In & Out Time") {
        requests.push({ InTimeN: formData.inTime, OutTimeN: formData.outTime });
      }

      let successCount = 0;
      let errorMsg = "";

      for (const req of requests) {
        const payload = {
          TokenC: "",
          model: {
            EmpIdN: Number(empId),
            DateD: dateString,
            InTimeN: req.InTimeN.replace(":", "."),
            OutTimeN: req.OutTimeN.replace(":", "."),
            ProjectIdN: formData.projectId,
            TMSRemarksC: formData.remarks,
          },
        };
        const result = await ApiService.submitTimeRequest(payload);
        if (result.success) successCount++;
        else errorMsg = result.error || "Failed";
      }

      if (successCount === requests.length) {
        setDialog({
          type: "success",
          title: "Success",
          message: "Time request submitted successfully",
          closeAfter: true,
        });
      } else {
        setDialog({
          type: successCount > 0 ? "success" : "error",
          title: successCount > 0 ? "Partial Success" : "Error",
          message: errorMsg || "Failed to submit request",
          closeAfter: successCount > 0,
        });
      }
    } catch {
      showError("Error", "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const labelStyle = [styles.label, { color: theme.text }];
  const inputStyle = [
    styles.inputWrapper,
    { backgroundColor: theme.inputBg, borderColor: theme.inputBorder },
  ];

  return (
    <>
      <AppModal visible={visible} onClose={() => {
        closeTransientPanels();
        onClose();
      }} title="Time Request"
        footer={
          <View style={styles.footerRow}>
            <CustomButton
              title="Cancel"
              icon="close"
              onPress={onClose}
              disabled={loading || dialog !== null}
              textColor={theme.text}
              iconColor={theme.text}
              style={[
                styles.footerButton,
                styles.cancelButton,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.inputBorder,
                },
              ]}
            />

            <CustomButton
              title="Submit"
              icon="send"
              onPress={handleSubmit}
              isLoading={loading}
              disabled={loading || dialog !== null}
              style={[
                styles.footerButton,
                styles.submitButton,
                { backgroundColor: theme.primary },
              ]}
            />
          </View>
        }>
        <View style={styles.contentFrame}>
          <ScrollView
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
          {/* Date Field */}
          <View style={styles.formGroup}>
            <Text style={labelStyle}>Date</Text>
            {isIOS ? (
              <View style={inputStyle}>
                <DateTimePicker
                  value={formData.date}
                  mode="date"
                  display="compact"
                  onChange={(_, date) => {
                    if (date) {
                      setFormData((prev) => ({ ...prev, date }));
                    }
                  }}
                />
              </View>
            ) : (
              <TouchableOpacity
                style={inputStyle}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={{ color: theme.text }}>
                  {formData.date.toLocaleDateString()}
                </Text>
                <Ionicons name="calendar-outline" size={20} color={theme.icon} />
              </TouchableOpacity>
            )}
          </View>

          {/* Project Dropdown */}
          <View style={styles.formGroup}>
            <Text style={labelStyle}>Project</Text>
            <TouchableOpacity
              style={inputStyle}
              onPress={() => openSelector("project")}
            >
              <Text
                style={{
                  color: formData.projectId ? theme.text : theme.placeholder,
                }}
              >
                {formData.projectId
                  ? projects.find((p) => p.value === formData.projectId)?.label
                  : "Select Project"}
              </Text>
              <Ionicons name="chevron-down" size={24} color={theme.icon} />
            </TouchableOpacity>
          </View>

          {/* Request Type */}
          <View style={styles.formGroup}>
            <Text style={labelStyle}>Request Type</Text>
            <TouchableOpacity
              style={inputStyle}
              onPress={() => openSelector("requestType")}
            >
              <Text style={{ color: theme.text }}>{formData.requestType}</Text>
              <Ionicons name="chevron-down" size={24} color={theme.icon} />
            </TouchableOpacity>
          </View>

          {/* In/Out Time */}
          <View style={styles.timeRow}>
            {(formData.requestType === "In Time" ||
              formData.requestType === "In & Out Time") && (
                <View style={styles.timeGroup}>
                  <Text style={labelStyle}>In Time</Text>
                  {isIOS ? (
                    <View style={inputStyle}>
                      <DateTimePicker
                        value={getTimePickerDate(formData.inTime)}
                        mode="time"
                        display="compact"
                        onChange={(_, date) => {
                          if (date) {
                            const hours = String(date.getHours()).padStart(2, "0");
                            const minutes = String(date.getMinutes()).padStart(2, "0");
                            setFormData((prev) => ({
                              ...prev,
                              inTime: `${hours}:${minutes}`,
                            }));
                          }
                        }}
                      />
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={inputStyle}
                      onPress={() => setShowInTimePicker(true)}
                    >
                      <Text style={{ color: theme.text }}>{formData.inTime}</Text>
                      <Ionicons name="time-outline" size={20} color={theme.icon} />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            {(formData.requestType === "Out Time" ||
              formData.requestType === "In & Out Time") && (
                <View style={styles.timeGroup}>
                  <Text style={labelStyle}>Out Time</Text>
                  {isIOS ? (
                    <View style={inputStyle}>
                      <DateTimePicker
                        value={getTimePickerDate(formData.outTime)}
                        mode="time"
                        display="compact"
                        onChange={(_, date) => {
                          if (date) {
                            const hours = String(date.getHours()).padStart(2, "0");
                            const minutes = String(date.getMinutes()).padStart(2, "0");
                            setFormData((prev) => ({
                              ...prev,
                              outTime: `${hours}:${minutes}`,
                            }));
                          }
                        }}
                      />
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={inputStyle}
                      onPress={() => setShowOutTimePicker(true)}
                    >
                      <Text style={{ color: theme.text }}>{formData.outTime}</Text>
                      <Ionicons name="time-outline" size={20} color={theme.icon} />
                    </TouchableOpacity>
                  )}
                </View>
              )}
          </View>

          <View style={styles.formGroup}>
            <Text style={labelStyle}>Remarks</Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: theme.inputBg,
                  borderColor: theme.inputBorder,
                  color: theme.text,
                },
              ]}
              value={formData.remarks}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, remarks: text }))
              }
              placeholder="Reason for request"
              placeholderTextColor={theme.placeholder}
              multiline
              numberOfLines={4}
            />
          </View>

          </ScrollView>

          <CenterModalSelection
            inline
            visible={showProjectSelector}
            onClose={() => setShowProjectSelector(false)}
            title="Select Project"
            options={projects}
            selectedValue={formData.projectId}
            onSelect={(val) => setFormData((prev) => ({ ...prev, projectId: val }))}
          />
          <CenterModalSelection
            inline
            visible={showRequestTypeSelector}
            onClose={() => setShowRequestTypeSelector(false)}
            title="Select Request Type"
            options={user?.TRInorOutN === 1 ? RequestTypes : RequestTypesTwo}
            selectedValue={formData.requestType}
            onSelect={(val) =>
              setFormData((prev) => ({ ...prev, requestType: val }))
            }
          />
          <InModalConfirmDialog
            visible={dialog !== null}
            title={dialog?.title || ""}
            message={dialog?.message || ""}
            confirmLabel={dialog?.type === "confirm" ? "Submit" : "OK"}
            cancelLabel={dialog?.type === "confirm" ? "Cancel" : ""}
            loading={loading && dialog?.type === "confirm"}
            onCancel={() => {
              if (dialog?.type === "confirm" && loading) return;
              setDialog(null);
            }}
            onConfirm={() => {
              if (dialog?.type === "confirm") {
                submitTimeRequest();
                return;
              }

              const shouldClose = dialog?.closeAfter;
              setDialog(null);
              if (shouldClose) {
                onSuccess?.();
                onClose();
              }
            }}
          />
        </View>
      </AppModal>

      {/* Time Pickers */}
      {!isIOS && showDatePicker && (
        <DateTimePicker
          value={formData.date}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date) {
              setFormData((prev) => ({ ...prev, date }));
            }
          }}
        />
      )}
      {!isIOS && showInTimePicker && (
        <DateTimePicker
          value={getTimePickerDate(formData.inTime)}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={(event, date) => {
            setShowInTimePicker(false);
            if (date) {
              const hours = String(date.getHours()).padStart(2, "0");
              const minutes = String(date.getMinutes()).padStart(2, "0");
              setFormData((prev) => ({
                ...prev,
                inTime: `${hours}:${minutes}`,
              }));
            }
          }}
        />
      )}
      {!isIOS && showOutTimePicker && (
        <DateTimePicker
          value={getTimePickerDate(formData.outTime)}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={(event, date) => {
            setShowOutTimePicker(false);
            if (date) {
              const hours = String(date.getHours()).padStart(2, "0");
              const minutes = String(date.getMinutes()).padStart(2, "0");
              setFormData((prev) => ({
                ...prev,
                outTime: `${hours}:${minutes}`,
              }));
            }
          }}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  contentFrame: {
    position: "relative",
    flexShrink: 1,
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 24,
    flexShrink: 1,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  timeRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  timeGroup: {
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: "600",
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  footerRow: {
    display: "flex",
    flexDirection: "row-reverse",
    gap: 12,
    alignItems: "flex-end",
  },
  footerButton: {
    minWidth: 132,
    flexGrow: 0,
    flexShrink: 0,
    height: 56,
    borderRadius: 4,
    marginBottom: 0,
    padding: 8,
  },
  cancelButton: {
    borderWidth: 1,
  },
  submitButton: {
    elevation: 2,
  },
});

export default TimeRequestModal;
