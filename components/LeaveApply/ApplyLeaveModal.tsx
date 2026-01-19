// ApplyLeaveModal.tsx
import { MaterialIcons as Icon } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useEffect, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import ApiService, {
    AvailableLeaveType,
    LeaveApplicationData,
    LeaveBalanceResponse,
} from "../../services/ApiService";
import AppModal from "../common/AppModal";
import CenterModalSelection from "../common/CenterModalSelection";
import { CustomButton } from "../CustomButton";

interface ApplyLeaveModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  availableLeaves: AvailableLeaveType[];
  leaveData: LeaveBalanceResponse | null;
}

const ApplyLeaveModal: React.FC<ApplyLeaveModalProps> = ({
  visible,
  onClose,
  onSuccess,
  availableLeaves,
  leaveData,
}) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [showLeaveTypeSelector, setShowLeaveTypeSelector] = useState(false);
  const [selectedLeaveType, setSelectedLeaveType] =
    useState<AvailableLeaveType | null>(null);
  const [fromDate, setFromDate] = useState<Date>(new Date());
  const [toDate, setToDate] = useState<Date>(new Date());
  const [showFromDatePicker, setShowFromDatePicker] = useState(false);
  const [showToDatePicker, setShowToDatePicker] = useState(false);
  const [fromTime, setFromTime] = useState<string>("09.00");
  const [toTime, setToTime] = useState<string>("17.00");
  const [totalTime, setTotalTime] = useState<string>("8.00");
  const [showFromTimePicker, setShowFromTimePicker] = useState(false);
  const [showToTimePicker, setShowToTimePicker] = useState(false);
  const [pastLeaveYes, setPastLeaveYes] = useState(false);
  const [pastLeaveNo, setPastLeaveNo] = useState(true);
  const [remarks, setRemarks] = useState("");
  const [claimAmount, setClaimAmount] = useState("");
  const [availableDays, setAvailableDays] = useState<number>(0);
  const [showTimeSection, setShowTimeSection] = useState(false);
  const [showMedicalSection, setShowMedicalSection] = useState(false);

  useEffect(() => {
    if (availableLeaves.length > 0 && !selectedLeaveType) {
      setSelectedLeaveType(availableLeaves[0]);
      checkLeaveTypeChange(availableLeaves[0]);
    }
  }, [availableLeaves]);

  const checkLeaveTypeChange = (leaveType: AvailableLeaveType) => {
    const isTimeRequired =
      leaveType.ReaTypeN === 4 || leaveType.ReaGrpIdN === 8;
    setShowTimeSection(isTimeRequired);
    const isMedical = leaveType.ReaGrpIdN === 16;
    setShowMedicalSection(isMedical);
    if (leaveType.PastLeaveN === 0) {
      setPastLeaveNo(true);
      setPastLeaveYes(false);
    }
  };

  const calculateTimeDifference = (from: string, to: string): string => {
    const [fromHours, fromMinutes] = from.split(".").map(Number);
    const [toHours, toMinutes] = to.split(".").map(Number);
    let totalHours = toHours - fromHours;
    let totalMinutes = toMinutes - fromMinutes;
    if (totalMinutes < 0) {
      totalHours -= 1;
      totalMinutes += 60;
    }
    if (totalHours < 0) {
      totalHours += 24;
    }
    return `${totalHours}.${totalMinutes.toString().padStart(2, "0")}`;
  };

  const handleFromTimeChange = (time: string) => {
    setFromTime(time);
    setTotalTime(calculateTimeDifference(time, toTime));
  };

  const handleToTimeChange = (time: string) => {
    setToTime(time);
    setTotalTime(calculateTimeDifference(fromTime, time));
  };

  const formatDateForAPI = (date: Date): string => {
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const validateForm = (): boolean => {
    if (!selectedLeaveType) {
      Alert.alert("Error", "Please select leave type");
      return false;
    }
    if (fromDate > toDate) {
      Alert.alert("Error", "To date must be after from date");
      return false;
    }
    if (!pastLeaveYes && !pastLeaveNo) {
      Alert.alert("Error", "Please select past leave option");
      return false;
    }
    if (pastLeaveYes && fromDate > new Date()) {
      Alert.alert("Error", "Past leave must be before current date");
      return false;
    }
    if (showTimeSection && parseFloat(totalTime) <= 0) {
      Alert.alert("Error", "Please enter valid time");
      return false;
    }
    if (showMedicalSection) {
      const claim = parseFloat(claimAmount) || 0;
      const maxPerVisit = leaveData?.MLPerVisitMaxN || 0;
      if (claim > maxPerVisit) {
        Alert.alert("Error", `Claim amount cannot exceed ₹${maxPerVisit}`);
        return false;
      }
    }
    if (remarks.trim().length === 0) {
      Alert.alert("Error", "Please enter remarks");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !selectedLeaveType) return;
    try {
      setLoading(true);
      const isHourly =
        selectedLeaveType.ReaTypeN === 4 || selectedLeaveType.ReaGrpIdN === 8;
      const applicationData: LeaveApplicationData = {
        AppEmpIdN: ApiService.getCurrentUser().empId!,
        LIdN: selectedLeaveType.ReaIdN,
        LFromDateD: formatDateForAPI(fromDate),
        LToDateD: formatDateForAPI(toDate),
        FHN: isHourly ? parseFloat(fromTime) || 0 : 0,
        THN: isHourly ? parseFloat(toTime) || 0 : 0,
        THrsN: isHourly ? parseFloat(totalTime) || 0 : 0,
        UnitN:
          selectedLeaveType.ReaTypeN === 1
            ? 1
            : selectedLeaveType.ReaTypeN === 4
              ? 0
              : selectedLeaveType.ReaTypeN === 2 ||
                  selectedLeaveType.ReaTypeN === 3
                ? 0.5
                : 1,
        MLClaimAmtN: parseFloat(claimAmount) || 0,
        LVRemarksC: remarks.trim(),
        PastLeaveN: pastLeaveYes ? 1 : 0,
      };

      const result = await ApiService.applyLeave(applicationData);
      if (result.success) {
        Alert.alert("Success", "Leave applied successfully!", [
          { text: "OK", onPress: onSuccess },
        ]);
      } else {
        Alert.alert("Error", result.error || "Failed to apply leave");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to apply leave");
    } finally {
      setLoading(false);
    }
  };

  const labelStyle = [styles.label, { color: theme.text }];
  const inputStyle = [
    styles.input,
    {
      backgroundColor: theme.inputBg,
      borderColor: theme.inputBorder,
      color: theme.text,
    },
  ];
  const dateInputStyle = [
    styles.dateInput,
    { backgroundColor: theme.inputBg, borderColor: theme.inputBorder },
  ];

  return (
    <>
      <AppModal
        visible={visible}
        onClose={onClose}
        title="Apply Leave"
        footer={
          <View style={styles.footerRow}>
            <CustomButton
              title="Cancel"
              isLoading={loading}
              disabled={loading}
              onPress={onClose}
              style={styles.cancelButton}
            />

            <CustomButton
              title="Submit"
              icon="send"
              isLoading={loading}
              disabled={loading}
              onPress={handleSubmit}
              style={styles.submitButton}
            />
          </View>
        }
      >
        <ScrollView
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formGroup}>
            <Text style={labelStyle}>Leave Type</Text>
            <TouchableOpacity
              style={[
                styles.selectorContainer,
                {
                  backgroundColor: theme.inputBg,
                  borderColor: theme.inputBorder,
                },
              ]}
              onPress={() => setShowLeaveTypeSelector(true)}
            >
              <Text
                style={[
                  styles.selectorText,
                  { color: selectedLeaveType ? theme.text : theme.placeholder },
                ]}
              >
                {selectedLeaveType
                  ? selectedLeaveType.ReaNameC
                  : "Select Leave Type"}
              </Text>
              <Icon name="keyboard-arrow-down" size={24} color={theme.icon} />
            </TouchableOpacity>
          </View>

          <View style={styles.dateRow}>
            <View style={styles.dateGroup}>
              <Text style={labelStyle}>From Date</Text>
              <TouchableOpacity
                style={dateInputStyle}
                onPress={() => setShowFromDatePicker(true)}
              >
                <Text style={{ color: theme.text }}>
                  {fromDate.toLocaleDateString()}
                </Text>
                <Icon name="calendar-today" size={20} color={theme.icon} />
              </TouchableOpacity>
            </View>

            <View style={styles.dateGroup}>
              <Text style={labelStyle}>To Date</Text>
              <TouchableOpacity
                style={dateInputStyle}
                onPress={() => setShowToDatePicker(true)}
              >
                <Text style={{ color: theme.text }}>
                  {toDate.toLocaleDateString()}
                </Text>
                <Icon name="calendar-today" size={20} color={theme.icon} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={labelStyle}>Past Leave</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => {
                  setPastLeaveYes(true);
                  setPastLeaveNo(false);
                }}
              >
                <View
                  style={[styles.radioCircle, { borderColor: theme.primary }]}
                >
                  {pastLeaveYes && (
                    <View
                      style={[
                        styles.radioSelected,
                        { backgroundColor: theme.primary },
                      ]}
                    />
                  )}
                </View>
                <Text style={[styles.radioLabel, { color: theme.text }]}>
                  Yes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => {
                  setPastLeaveYes(false);
                  setPastLeaveNo(true);
                }}
              >
                <View
                  style={[styles.radioCircle, { borderColor: theme.primary }]}
                >
                  {pastLeaveNo && (
                    <View
                      style={[
                        styles.radioSelected,
                        { backgroundColor: theme.primary },
                      ]}
                    />
                  )}
                </View>
                <Text style={[styles.radioLabel, { color: theme.text }]}>
                  No
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {showTimeSection && (
            <View style={styles.formGroup}>
              <Text style={labelStyle}>Time Details</Text>
              <View style={styles.timeRow}>
                <View style={styles.timeGroup}>
                  <Text
                    style={[styles.timeLabel, { color: theme.placeholder }]}
                  >
                    From Time
                  </Text>
                  <TouchableOpacity
                    style={dateInputStyle}
                    onPress={() => setShowFromTimePicker(true)}
                  >
                    <Text style={{ color: theme.text }}>{fromTime}</Text>
                    <Icon name="access-time" size={20} color={theme.icon} />
                  </TouchableOpacity>
                </View>
                <View style={styles.timeGroup}>
                  <Text
                    style={[styles.timeLabel, { color: theme.placeholder }]}
                  >
                    To Time
                  </Text>
                  <TouchableOpacity
                    style={dateInputStyle}
                    onPress={() => setShowToTimePicker(true)}
                  >
                    <Text style={{ color: theme.text }}>{toTime}</Text>
                    <Icon name="access-time" size={20} color={theme.icon} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          <View style={styles.formGroup}>
            <Text style={labelStyle}>Remarks</Text>
            <TextInput
              style={[inputStyle, styles.textArea]}
              placeholder="Enter remarks (min. 10 characters)"
              placeholderTextColor={theme.placeholder}
              multiline
              numberOfLines={4}
              value={remarks}
              onChangeText={setRemarks}
            />
          </View>
        </ScrollView>
      </AppModal>

      {showFromDatePicker && (
        <DateTimePicker
          value={fromDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowFromDatePicker(false);
            if (date) setFromDate(date);
          }}
        />
      )}

      {showToDatePicker && (
        <DateTimePicker
          value={toDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowToDatePicker(false);
            if (date) setToDate(date);
          }}
        />
      )}

      {showFromTimePicker && (
        <DateTimePicker
          value={(() => {
            const [h, m] = fromTime.split(".").map(Number);
            const d = new Date();
            d.setHours(h || 9, m || 0);
            return d;
          })()}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={(event, date) => {
            setShowFromTimePicker(false);
            if (event.type === "set" && date) {
              handleFromTimeChange(
                `${date.getHours()}.${date.getMinutes().toString().padStart(2, "0")}`,
              );
            }
          }}
        />
      )}

      {showToTimePicker && (
        <DateTimePicker
          value={(() => {
            const [h, m] = toTime.split(".").map(Number);
            const d = new Date();
            d.setHours(h || 17, m || 0);
            return d;
          })()}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={(event, date) => {
            setShowToTimePicker(false);
            if (event.type === "set" && date) {
              handleToTimeChange(
                `${date.getHours()}.${date.getMinutes().toString().padStart(2, "0")}`,
              );
            }
          }}
        />
      )}

      <CenterModalSelection
        visible={showLeaveTypeSelector}
        onClose={() => setShowLeaveTypeSelector(false)}
        title="Select Leave Type"
        options={availableLeaves.map((l) => ({
          label: l.ReaNameC,
          value: l.ReaIdN,
        }))}
        selectedValue={selectedLeaveType?.ReaIdN}
        onSelect={(val: number) => {
          const selected = availableLeaves.find((l) => l.ReaIdN === val);
          if (selected) {
            setSelectedLeaveType(selected);
            checkLeaveTypeChange(selected);
          }
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: 18,
    flexShrink: 1,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  selectorContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  selectorText: {
    fontSize: 15,
    fontWeight: "600",
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 20,
  },
  dateGroup: {
    flex: 1,
  },
  dateInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  leaveTypeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  leaveTypeItem: {
    width: "48.5%",
    padding: 12,
    borderRadius: 4,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  leaveTypeTextContainer: {
    flex: 1,
  },
  leaveTypeName: {
    fontSize: 13,
    fontWeight: "700",
  },
  leaveTypeBalance: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
    gap: 8,
  },
  radioGroup: {
    flexDirection: "row",
    gap: 24,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
  },
  radioSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  radioLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  timeGroup: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
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
  cancelButton: {
    padding: 10,
  },
  submitButton: {
    padding: 10,
  },
});

export default ApplyLeaveModal;
