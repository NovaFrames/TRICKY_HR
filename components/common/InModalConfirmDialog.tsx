import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";

interface InModalConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const InModalConfirmDialog: React.FC<InModalConfirmDialogProps> = ({
  visible,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}) => {
  const { theme } = useTheme();

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <TouchableOpacity
        activeOpacity={1}
        style={styles.backdrop}
        onPress={onCancel}
      />
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.cardBackground,
            borderColor: theme.inputBorder,
          },
        ]}
      >
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.message, { color: theme.placeholder }]}>
          {message}
        </Text>
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={onCancel}
            disabled={loading}
            style={[
              styles.button,
              {
                backgroundColor: theme.inputBg,
                borderColor: theme.inputBorder,
              },
            ]}
          >
            <Text style={[styles.buttonText, { color: theme.text }]}>
              {cancelLabel}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onConfirm}
            disabled={loading}
            style={[
              styles.button,
              {
                backgroundColor: destructive ? "#DC2626" : theme.primary,
                borderColor: destructive ? "#DC2626" : theme.primary,
                opacity: loading ? 0.7 : 1,
              },
            ]}
          >
            <Text style={[styles.buttonText, { color: "#fff" }]}>
              {loading ? "Please wait..." : confirmLabel}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    zIndex: 40,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
  },
  card: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 8,
    padding: 18,
    gap: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  button: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: "700",
  },
});

export default InModalConfirmDialog;
