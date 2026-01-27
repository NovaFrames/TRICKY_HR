import Modal from "@/components/common/SingleModal";
import { CustomButton } from "@/components/CustomButton";
import { ThemeType } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
interface ConfirmationModalProps {
  visible: boolean;
  totalAmount: number;
  theme: ThemeType;
  onCancel: () => void;
  onConfirm: () => void;
}
const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  totalAmount,
  theme,
  onCancel,
  onConfirm,
}) => (
  <Modal
    visible={visible}
    animationType="fade"
    transparent={true}
    onRequestClose={onCancel}
  >
    <View style={styles.overlay}>
      <View style={[styles.modal, { backgroundColor: theme.cardBackground }]}>
        <Ionicons
          name="help-circle"
          size={60}
          color={theme.primary}
          style={styles.icon}
        />
        <Text style={[styles.title, { color: theme.text }]}>
          Confirm Submission
        </Text>
        <Text style={[styles.message, { color: theme.textLight }]}>
          Are you sure you want to submit this claim for 
          {totalAmount.toFixed(2)}?
        </Text>
        <View style={styles.buttons}>
          <CustomButton
            title="No, Review"
            icon="close"
            onPress={onCancel}
            textColor={theme.textLight}
            iconColor={theme.textLight}
            style={[
              styles.button,
              styles.noButton,
              { backgroundColor: theme.inputBg },
            ]}
          />
          <CustomButton
            title="Yes"
            icon="checkmark-circle"
            onPress={onConfirm}
            style={[
              styles.button,
              styles.yesButton,
              { backgroundColor: theme.primary },
            ]}
          />
        </View>
      </View>
    </View>
  </Modal>
);
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modal: {
    borderRadius: 4,
    padding: 25,
    width: "90%",
    alignItems: "center",
  },
  icon: {
    marginBottom: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 25,
    lineHeight: 22,
  },
  buttons: {
    flexDirection: "row",
    width: "100%",
  },
  button: {
    flex: 1,
    borderRadius: 4,
    marginHorizontal: 8,
    marginBottom: 0,
  },
  noButton: {},
  yesButton: {},
});
export default ConfirmationModal;