// SurrenderLeaveModal.tsx
import { MaterialIcons as Icon } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ConfirmModal from "@/components/common/ConfirmModal";
import { useTheme } from "../../context/ThemeContext";
import ApiService, { SurrenderData } from "../../services/ApiService";
import AppModal from "../common/AppModal";
import { CustomButton } from "../CustomButton";

interface SurrenderLeaveModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SurrenderLeaveModal: React.FC<SurrenderLeaveModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [eligibleDays, setEligibleDays] = useState<number>(10);
  const [surrenderDays, setSurrenderDays] = useState<string>("");
  const [payoutDate, setPayoutDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (visible) {
      checkEligibility();
    }
  }, [visible]);

  const checkEligibility = async () => {
    try {
      setCheckingEligibility(true);
      const result = await ApiService.getSurrenderBalance();
      if (result.success && result.eligLeave !== undefined) {
        setEligibleDays(result.eligLeave || 10);
      } else {
        ConfirmModal.alert(
          "Error",
          result.error || "Failed to check surrender eligibility",
        );
      }
    } catch (error) {
      ConfirmModal.alert("Error", "Failed to check surrender eligibility");
    } finally {
      setCheckingEligibility(false);
    }
  };

  const formatDateForAPI = (date: Date): string => {
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const validateForm = (): boolean => {
    const days = parseFloat(surrenderDays);
    if (isNaN(days) || days <= 0) {
      ConfirmModal.alert("Error", "Please enter valid surrender days");
      return false;
    }
    if (days > eligibleDays) {
      ConfirmModal.alert("Error", `Cannot surrender more than ${eligibleDays} days`);
      return false;
    }
    if (remarks.trim().length < 10) {
      ConfirmModal.alert("Error", "Remarks must be at least 10 characters");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      setLoading(true);
      const surrenderData: SurrenderData = {
        EmpIdN: ApiService.getCurrentUser().empId!,
        SurrenderN: parseFloat(surrenderDays),
        PayoutDateD: formatDateForAPI(payoutDate),
        RemarksC: remarks.trim(),
      };
      const result = await ApiService.submitSurrender(surrenderData);
      if (result.success) {
        ConfirmModal.alert("Success", "Request submitted successfully!", [
          { text: "OK", onPress: onSuccess },
        ]);
      } else {
        ConfirmModal.alert("Error", result.error || "Failed to submit request");
      }
    } catch (error) {
      ConfirmModal.alert("Error", "Failed to submit request");
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
      <AppModal visible={visible} onClose={onClose} title="Leave Surrender">
        <ScrollView
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[styles.eligibilityCard, { backgroundColor: theme.inputBg }]}
          >
            <View style={styles.eligibilityHeader}>
              <Icon name="info" size={20} color={theme.primary} />
              <Text style={[styles.eligibilityTitle, { color: theme.primary }]}>
                Eligibility Information
              </Text>
            </View>
            {checkingEligibility ? (
              <ActivityIndicator
                size="small"
                color={theme.primary}
                style={styles.loader}
              />
            ) : (
              <View style={styles.eligibilityRow}>
                <Text
                  style={[styles.eligibilityLabel, { color: theme.secondary }]}
                >
                  Available for Surrender:
                </Text>
                <Text
                  style={[styles.eligibilityValue, { color: theme.primary }]}
                >
                  {eligibleDays} Days
                </Text>
              </View>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={labelStyle}>Surrender Days</Text>
            <TextInput
              style={inputStyle}
              placeholder={`Max: ${eligibleDays} days`}
              placeholderTextColor={theme.placeholder}
              keyboardType="decimal-pad"
              value={surrenderDays}
              onChangeText={setSurrenderDays}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={labelStyle}>Payout Date</Text>
            <TouchableOpacity
              style={dateInputStyle}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={{ color: theme.text }}>
                {payoutDate.toLocaleDateString()}
              </Text>
              <Icon name="calendar-today" size={20} color={theme.icon} />
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={labelStyle}>Remarks</Text>
            <TextInput
              style={[inputStyle, styles.textArea]}
              placeholder="Enter reason for surrender"
              placeholderTextColor={theme.placeholder}
              multiline
              numberOfLines={4}
              value={remarks}
              onChangeText={setRemarks}
            />
          </View>

          <View style={styles.footerRow}>
            <CustomButton
              title="Cancel"
              icon="close"
              onPress={onClose}
              disabled={loading}
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
              icon="checkmark-circle-outline"
              onPress={handleSubmit}
              isLoading={loading}
              disabled={loading || checkingEligibility}
              style={[
                styles.footerButton,
                styles.submitButton,
                { backgroundColor: theme.primary },
              ]}
            />
          </View>
        </ScrollView>
      </AppModal>

      {showDatePicker && (
        <DateTimePicker
          value={payoutDate}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date) setPayoutDate(date);
          }}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: 18,
    flexShrink: 1,
  },
  eligibilityCard: {
    borderRadius: 4,
    padding: 20,
    marginBottom: 24,
  },
  eligibilityHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  eligibilityTitle: {
    fontSize: 14,
    fontWeight: "800",
    marginLeft: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  loader: {
    padding: 10,
  },
  eligibilityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  eligibilityLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  eligibilityValue: {
    fontSize: 20,
    fontWeight: "800",
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
  input: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: "600",
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
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  footerRow: {
    flexDirection: "row-reverse",
    gap: 12,
  },
  footerButton: {
    flex: 1,
    height: "100%",
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

export default SurrenderLeaveModal;
