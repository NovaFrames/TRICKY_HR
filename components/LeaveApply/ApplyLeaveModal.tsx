import { MaterialIcons as Icon } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as DocumentPicker from "expo-document-picker";
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
import ApiService, {
  AvailableLeaveType,
  LeaveApplicationData,
  LeaveBalanceResponse,
  LeaveType,
} from "../../services/ApiService";
import AppModal from "../common/AppModal";
import InModalConfirmDialog from "../common/InModalConfirmDialog";
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
  const isIOS = Platform.OS === "ios";
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
  const [showPastLeave, setShowPastLeave] = useState(true);
  const [pastLeaveNo, setPastLeaveNo] = useState(true);
  const [remarks, setRemarks] = useState("");
  const [claimAmount, setClaimAmount] = useState("");
  const [medicalDocument, setMedicalDocument] = useState<{
    uri: string;
    name: string;
    type: string;
  } | null>(null);
  const [showTimeSection, setShowTimeSection] = useState(false);
  const [showMedicalSection, setShowMedicalSection] = useState(false);
  const [dialog, setDialog] = useState<{
    type: "error" | "confirm" | "success" | "unpaid";
    title: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (availableLeaves.length > 0 && !selectedLeaveType) {
      setSelectedLeaveType(availableLeaves[0]);
      checkLeaveTypeChange(availableLeaves[0]);
    }
  }, [availableLeaves]);

  const checkLeaveTypeChange = (leaveType: AvailableLeaveType) => {
    const isTimeRequired =
      leaveType.ReaTypeN === 4;
    setShowTimeSection(isTimeRequired);
    const isMedical = leaveType.ReaGrpIdN === 2;
    setShowMedicalSection(isMedical);
    setShowPastLeave(leaveType.ReaGrpIdN !== 16);
    
    if (!isMedical) {
      setClaimAmount("");
      setMedicalDocument(null);
    }
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

  const getTimePickerDate = (time: string, fallbackHour: number) => {
    const [hours, minutes] = time.split(".").map(Number);
    const date = new Date();
    date.setHours(hours || fallbackHour, minutes || 0, 0, 0);
    return date;
  };

  const closeTransientPanels = () => {
    setShowLeaveTypeSelector(false);
    setShowFromDatePicker(false);
    setShowToDatePicker(false);
    setShowFromTimePicker(false);
    setShowToTimePicker(false);
  };

  const toggleLeaveTypeSelector = () => {
    closeTransientPanels();
    setShowLeaveTypeSelector(true);
  };

  const handleLeaveTypeSelect = (leaveType: AvailableLeaveType) => {
    setSelectedLeaveType(leaveType);
    checkLeaveTypeChange(leaveType);
    setShowLeaveTypeSelector(false);
  };

  const togglePicker = (
    setter: React.Dispatch<React.SetStateAction<boolean>>,
    picker: "fromDate" | "toDate" | "fromTime" | "toTime",
  ) => {
    if (isIOS) return;

    setShowLeaveTypeSelector(false);
    setShowFromDatePicker(picker === "fromDate" ? (current) => !current : false);
    setShowToDatePicker(picker === "toDate" ? (current) => !current : false);
    setShowFromTimePicker(picker === "fromTime" ? (current) => !current : false);
    setShowToTimePicker(picker === "toTime" ? (current) => !current : false);

    setter(true);
  };

  const formatDateForAPI = (date: Date): string => {
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const getSelectedLeaveBalance = (): LeaveType | null => {
    const leaves = leaveData?.data?.[0]?.EmpLeaveApply;
    if (!leaves || !selectedLeaveType) return null;
    return (
      leaves.find((leave) => leave.ReaGrpIdN === selectedLeaveType.ReaGrpIdN) ||
      null
    );
  };

  const getLeaveUnit = () => {
    if (!selectedLeaveType) return 1;
    if (selectedLeaveType.ReaTypeN === 1) return 1;
    if (selectedLeaveType.ReaTypeN === 4) return 0;
    if (selectedLeaveType.ReaTypeN === 2 || selectedLeaveType.ReaTypeN === 3) {
      return 0.5;
    }
    return 1;
  };

  const pickMedicalDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;
      const file = result.assets?.[0];
      if (!file) return;

      setMedicalDocument({
        uri: file.uri,
        name: file.name || "medical-document",
        type: file.mimeType || "application/octet-stream",
      });
    } catch {
      showError("Failed to select medical document");
    }
  };

  const showError = (message: string) => {
    setDialog({ type: "error", title: "Error", message });
  };

  const validateForm = (): boolean => {
    if (!selectedLeaveType) {
      showError("Please select leave type");
      return false;
    }
    if (fromDate > toDate) {
      showError("To date must be after from date");
      return false;
    }
    if (!pastLeaveYes && !pastLeaveNo) {
      showError("Please select past leave option");
      return false;
    }
    if (pastLeaveYes && fromDate > new Date()) {
      showError("Past leave must be before current date");
      return false;
    }
    if (showTimeSection && parseFloat(totalTime) <= 0) {
      showError("Please enter valid time");
      return false;
    }
    if (showMedicalSection) {
      const claim = parseFloat(claimAmount) || 0;
      const maxPerVisit = leaveData?.MLPerVisitMaxN || 0;
      const claimAvailable = leaveData?.MLClaimAvailN || 0;

      if (claim > maxPerVisit) {
        showError(`Claim amount cannot exceed ${maxPerVisit}`);
        return false;
      }
      if (claim > claimAvailable) {
        showError(`Claim amount cannot exceed available claim ${claimAvailable}`);
        return false;
      }
      if (!medicalDocument) {
        showError("Please attach medical document");
        return false;
      }
    }
    if (remarks.trim().length === 0) {
      showError("Please enter remarks");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !selectedLeaveType) return;

    if (selectedLeaveType.ReaGrpIdN === 8) {
      setDialog({
        type: "confirm",
        title: "Apply Leave",
        message: "Are you sure you want to submit this leave request?",
      });
      return;
    }

    setCheckingAvailability(true);
    try {
      const isHourly =
        selectedLeaveType.ReaTypeN === 4 || selectedLeaveType.ReaGrpIdN === 8;
        
      const availability = await ApiService.checkLeaveAvailability(
        formatDateForAPI(fromDate),
        formatDateForAPI(toDate),
        selectedLeaveType.ReaGrpIdN,
        isHourly ? parseFloat(totalTime) || 0 : 0,
        getLeaveUnit(),
      );

      if (!availability.success) {
        showError(availability.error || "Failed to check leave availability");
        return;
      }

      const requestedDays = Number(availability.leaveDays || 0);
      const balance = Number(getSelectedLeaveBalance()?.BalanceN || 0);
      const unpaidDate = availability.strApp || formatDateForAPI(fromDate);
      const needsUnpaidConfirmation =
        requestedDays > balance ||
        (requestedDays === 1);

      if (needsUnpaidConfirmation) {
        setDialog({
          type: "unpaid",
          title: "Apply Unpaid Leave",
          message: `Leave Balance is not enough to apply. Leave Balance not Enough to Apply. Do you want apply Unpaid Leave for [${unpaidDate}]?`,
        });
        return;
      }

      setDialog({
        type: "confirm",
        title: "Apply Leave",
        message: "Are you sure you want to submit this leave request?",
      });
    } catch {
      showError("Failed to check leave availability");
    } finally {
      setCheckingAvailability(false);
    }
  };

  const submitLeaveRequest = async () => {
    if (!selectedLeaveType) return;
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
        UnitN: getLeaveUnit(),
        MLClaimAmtN: parseFloat(claimAmount) || 0,
        LVRemarksC: remarks.trim(),
        PastLeaveN: pastLeaveYes ? 1 : 0,
      };

      const result = await ApiService.applyLeave(applicationData);
      if (result.success) {
        const leaveId = result.data?.IdN;
        if (showMedicalSection && medicalDocument && leaveId) {
          const uploadResult = await ApiService.uploadMedicalDocument(
            leaveId,
            medicalDocument,
          );

          console.log("uploadResult: ", uploadResult);
          if (!uploadResult.success) {
            showError(
              uploadResult.error ||
              "Leave applied, but medical document upload failed",
            );
            return;
          }
        }

        setDialog({
          type: "success",
          title: "Success",
          message: "Leave applied successfully!",
        });
      } else {
        showError(result.error || "Failed to apply leave");
      }
    } catch {
      showError("Failed to apply leave");
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
        onClose={() => {
          closeTransientPanels();
          onClose();
        }}
        title="Apply Leave"
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
                styles.cancelButton,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.inputBorder,
                },
              ]}
            />

            <CustomButton
              title="Submit"
              icon="checkmark-circle-outline"
              isLoading={loading || checkingAvailability}
              disabled={loading || checkingAvailability || dialog !== null}
              onPress={handleSubmit}
              style={styles.submitButton}
            />
          </View>
        }
      >
        <View style={styles.contentFrame}>
          <ScrollView
            style={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
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
                onPress={toggleLeaveTypeSelector}
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
                {isIOS ? (
                  <View
                    style={[
                      styles.compactPickerWrapper,
                      {
                        backgroundColor: theme.inputBg,
                        borderColor: theme.inputBorder,
                      },
                    ]}
                  >
                    <DateTimePicker
                      value={fromDate}
                      mode="date"
                      display="compact"
                      onChange={(_, date) => {
                        if (date) setFromDate(date);
                      }}
                    />
                  </View>
                ) : (
                  <TouchableOpacity
                    style={dateInputStyle}
                    onPress={() =>
                      togglePicker(setShowFromDatePicker, "fromDate")
                    }
                  >
                    <Text style={{ color: theme.text }}>
                      {fromDate.toLocaleDateString()}
                    </Text>
                    <Icon name="calendar-today" size={20} color={theme.icon} />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.dateGroup}>
                <Text style={labelStyle}>To Date</Text>
                {isIOS ? (
                  <View
                    style={[
                      styles.compactPickerWrapper,
                      {
                        backgroundColor: theme.inputBg,
                        borderColor: theme.inputBorder,
                      },
                    ]}
                  >
                    <DateTimePicker
                      value={toDate}
                      mode="date"
                      display="compact"
                      onChange={(_, date) => {
                        if (date) setToDate(date);
                      }}
                    />
                  </View>
                ) : (
                  <TouchableOpacity
                    style={dateInputStyle}
                    onPress={() => togglePicker(setShowToDatePicker, "toDate")}
                  >
                    <Text style={{ color: theme.text }}>
                      {toDate.toLocaleDateString()}
                    </Text>
                    <Icon name="calendar-today" size={20} color={theme.icon} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {showPastLeave && (
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
            )}

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
                    {isIOS ? (
                      <View
                        style={[
                          styles.compactPickerWrapper,
                          {
                            backgroundColor: theme.inputBg,
                            borderColor: theme.inputBorder,
                          },
                        ]}
                      >
                        <DateTimePicker
                          value={getTimePickerDate(fromTime, 9)}
                          mode="time"
                          display="compact"
                          onChange={(_, date) => {
                            if (date) {
                              handleFromTimeChange(
                                `${date.getHours()}.${date
                                  .getMinutes()
                                  .toString()
                                  .padStart(2, "0")}`,
                              );
                            }
                          }}
                        />
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={dateInputStyle}
                        onPress={() =>
                          togglePicker(setShowFromTimePicker, "fromTime")
                        }
                      >
                        <Text style={{ color: theme.text }}>{fromTime}</Text>
                        <Icon name="access-time" size={20} color={theme.icon} />
                      </TouchableOpacity>
                    )}
                  </View>
                  <View style={styles.timeGroup}>
                    <Text
                      style={[styles.timeLabel, { color: theme.placeholder }]}
                    >
                      To Time
                    </Text>
                    {isIOS ? (
                      <View
                        style={[
                          styles.compactPickerWrapper,
                          {
                            backgroundColor: theme.inputBg,
                            borderColor: theme.inputBorder,
                          },
                        ]}
                      >
                        <DateTimePicker
                          value={getTimePickerDate(toTime, 17)}
                          mode="time"
                          display="compact"
                          onChange={(_, date) => {
                            if (date) {
                              handleToTimeChange(
                                `${date.getHours()}.${date
                                  .getMinutes()
                                  .toString()
                                  .padStart(2, "0")}`,
                              );
                            }
                          }}
                        />
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={dateInputStyle}
                        onPress={() =>
                          togglePicker(setShowToTimePicker, "toTime")
                        }
                      >
                        <Text style={{ color: theme.text }}>{toTime}</Text>
                        <Icon name="access-time" size={20} color={theme.icon} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            )}

            {showMedicalSection && (
              <View style={styles.medicalSection}>
                <View style={styles.medicalGrid}>
                  <View style={styles.medicalMetric}>
                    <Text style={labelStyle}>Claim Limit</Text>
                    <TextInput
                      style={[inputStyle, styles.readOnlyInput]}
                      value={(leaveData?.MLClaimLimitN || 0).toFixed(2)}
                      editable={false}
                    />
                  </View>
                  <View style={styles.medicalMetric}>
                    <Text style={labelStyle}>Claim Avail</Text>
                    <TextInput
                      style={[inputStyle, styles.readOnlyInput]}
                      value={(leaveData?.MLClaimAvailN || 0).toFixed(2)}
                      editable={false}
                    />
                  </View>
                </View>

                <View style={styles.medicalGrid}>
                  <View style={styles.medicalMetric}>
                    <Text style={labelStyle}>Claim Amt</Text>
                    <TextInput
                      style={inputStyle}
                      placeholder="0.00"
                      placeholderTextColor={theme.placeholder}
                      keyboardType="decimal-pad"
                      value={claimAmount}
                      onChangeText={setClaimAmount}
                    />
                  </View>
                  <View style={styles.medicalMetric}>
                    <Text style={labelStyle}>Claim Bal</Text>
                    <TextInput
                      style={[inputStyle, styles.readOnlyInput]}
                      value={Math.max(
                        (leaveData?.MLClaimAvailN || 0) -
                        (parseFloat(claimAmount) || 0),
                        0,
                      ).toFixed(2)}
                      editable={false}
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={labelStyle}>Medical Document</Text>
                  <TouchableOpacity
                    style={[
                      styles.filePicker,
                      {
                        backgroundColor: theme.inputBg,
                        borderColor: theme.inputBorder,
                      },
                    ]}
                    onPress={pickMedicalDocument}
                  >
                    <Icon name="attach-file" size={20} color={theme.primary} />
                    <Text
                      style={[
                        styles.fileName,
                        {
                          color: medicalDocument
                            ? theme.text
                            : theme.placeholder,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {medicalDocument?.name || "Choose file"}
                    </Text>
                  </TouchableOpacity>
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

          {showLeaveTypeSelector && (
            <View style={styles.overlayRoot}>
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => setShowLeaveTypeSelector(false)}
                style={styles.overlayBackdrop}
              />
              <View
                style={[
                  styles.leaveTypeModalCard,
                  {
                    backgroundColor: theme.cardBackground,
                    borderColor: theme.inputBorder,
                  },
                ]}
              >
                <View
                  style={[
                    styles.leaveTypeModalHeader,
                    { borderBottomColor: theme.inputBorder },
                  ]}
                >
                  <Text style={[styles.leaveTypeModalTitle, { color: theme.text }]}>
                    Select Leave Type
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowLeaveTypeSelector(false)}
                    style={[
                      styles.leaveTypeCloseButton,
                      { backgroundColor: theme.inputBg },
                    ]}
                  >
                    <Icon name="close" size={20} color={theme.icon} />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  style={styles.leaveTypeList}
                  showsVerticalScrollIndicator={false}
                >
                  {availableLeaves.map((leaveType) => {
                    const isSelected =
                      selectedLeaveType?.ReaIdN === leaveType.ReaIdN;

                    return (
                      <TouchableOpacity
                        key={leaveType.ReaIdN}
                        style={[
                          styles.leaveTypeRow,
                          {
                            borderBottomColor: theme.inputBorder,
                            backgroundColor: isSelected
                              ? `${theme.primary}14`
                              : "transparent",
                          },
                        ]}
                        onPress={() => handleLeaveTypeSelect(leaveType)}
                      >
                        <View style={styles.leaveTypeTextBlock}>
                          <Text
                            style={[
                              styles.leaveTypeNameText,
                              { color: isSelected ? theme.primary : theme.text },
                            ]}
                          >
                            {leaveType.ReaNameC}
                          </Text>
                          <Text
                            style={[
                              styles.leaveTypeMetaText,
                              { color: theme.placeholder },
                            ]}
                          >
                            {leaveType.ReaTypeN === 4 || leaveType.ReaGrpIdN === 8
                              ? "Hourly leave"
                              : "Regular leave"}
                          </Text>
                        </View>
                        {isSelected && (
                          <Icon
                            name="check-circle"
                            size={20}
                            color={theme.primary}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          )}
          <InModalConfirmDialog
            visible={dialog !== null}
            title={dialog?.title || ""}
            message={dialog?.message || ""}
            confirmLabel={
              dialog?.type === "confirm" || dialog?.type === "unpaid"
                ? "Submit"
                : "OK"
            }
            cancelLabel={
              dialog?.type === "confirm" || dialog?.type === "unpaid"
                ? "Cancel"
                : ""
            }
            loading={
              loading &&
              (dialog?.type === "confirm" || dialog?.type === "unpaid")
            }
            onCancel={() => {
              if (
                (dialog?.type === "confirm" || dialog?.type === "unpaid") &&
                loading
              ) {
                return;
              }

              const wasSuccess = dialog?.type === "success";
              setDialog(null);
              if (wasSuccess) {
                onSuccess();
              }
            }}
            onConfirm={() => {
              if (dialog?.type === "confirm" || dialog?.type === "unpaid") {
                submitLeaveRequest();
                return;
              }

              const wasSuccess = dialog?.type === "success";
              setDialog(null);
              if (wasSuccess) {
                onSuccess();
              }
            }}
          />
        </View>
      </AppModal>

      {!isIOS && showFromDatePicker && (
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

      {!isIOS && showToDatePicker && (
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

      {!isIOS && showFromTimePicker && (
        <DateTimePicker
          value={getTimePickerDate(fromTime, 9)}
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

      {!isIOS && showToTimePicker && (
        <DateTimePicker
          value={getTimePickerDate(toTime, 17)}
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

    </>
  );
};

const styles = StyleSheet.create({
  contentFrame: {
    position: "relative",
    flexShrink: 1,
  },
  scrollContent: {
    flexShrink: 1,
    paddingHorizontal: 16,
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
  compactPickerWrapper: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    justifyContent: "center",
  },
  overlayRoot: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  overlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.42)",
  },
  leaveTypeModalCard: {
    width: "100%",
    maxHeight: "72%",
    borderWidth: 1,
    borderRadius: 8,
    overflow: "hidden",
  },
  leaveTypeModalHeader: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leaveTypeModalTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  leaveTypeCloseButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  leaveTypeList: {
    maxHeight: 360,
  },
  leaveTypeRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  leaveTypeTextBlock: {
    flex: 1,
  },
  leaveTypeNameText: {
    fontSize: 15,
    fontWeight: "700",
  },
  leaveTypeMetaText: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4,
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
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 4,
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
    borderRadius: 4,
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
  medicalSection: {
    marginBottom: 20,
  },
  medicalGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  medicalMetric: {
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
  readOnlyInput: {
    opacity: 0.75,
  },
  filePicker: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  fileName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  footerRow: {
    display: "flex",
    flexDirection: "row-reverse",
    justifyContent: "flex-end",
    gap: 12,
    alignItems: "flex-end",
  },
  cancelButton: {
    minWidth: 132,
    flexGrow: 0,
    flexShrink: 0,
    padding: 10,
  },
  submitButton: {
    minWidth: 132,
    flexGrow: 0,
    flexShrink: 0,
    padding: 10,
  },
});

export default ApplyLeaveModal;
