import React, { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import AppModal from "@/components/common/AppModal";

export type AlertButton = {
  text?: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
};

type AlertHandler = (
  title: string,
  message?: string,
  buttons?: AlertButton[],
) => void;

class AlertService {
  private handler?: AlertHandler;

  setHandler(handler?: AlertHandler) {
    this.handler = handler;
  }

  alert(title: string, message?: string, buttons?: AlertButton[]) {
    if (!this.handler) return;
    this.handler(title, message, buttons);
  }
}

const alertService = new AlertService();

const Alert = {
  alert: (title: string, message?: string, buttons?: AlertButton[]) =>
    alertService.alert(title, message, buttons),
};

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [buttons, setButtons] = useState<AlertButton[]>([]);

  const closeAlert = useCallback(() => {
    setVisible(false);
  }, []);

  const showAlert = useCallback<AlertHandler>(
    (nextTitle, nextMessage, nextButtons) => {
      const normalizedButtons =
        nextButtons && nextButtons.length > 0
          ? nextButtons
          : [{ text: "OK" }];

      setTitle(nextTitle);
      setMessage(nextMessage ?? "");
      setButtons(normalizedButtons);
      setVisible(true);
    },
    [],
  );

  useEffect(() => {
    alertService.setHandler(showAlert);
    return () => alertService.setHandler(undefined);
  }, [showAlert]);

  const footer = useMemo(() => {
    if (!visible) return null;

    return (
      <View style={styles.footer}>
        {buttons.map((button, index) => {
          const label = button.text || "OK";
          const textStyle = [
            styles.buttonText,
            { color: theme.primary },
            button.style === "cancel" && { color: theme.text },
            button.style === "destructive" && { color: "#DC2626" },
          ];

          return (
            <TouchableOpacity
              key={`${label}-${index}`}
              onPress={() => {
                closeAlert();
                button.onPress?.();
              }}
              style={[
                styles.button,
                { backgroundColor: theme.inputBg, borderColor: theme.inputBorder },
              ]}
            >
              <Text style={textStyle}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }, [buttons, closeAlert, theme.inputBg, theme.inputBorder, theme.primary, theme.text, visible]);

  return (
    <>
      {children}
      <AppModal
        visible={visible}
        onClose={closeAlert}
        title={title}
        footer={footer}
      >
        {message ? (
          <View style={styles.body}>
            <Text style={[styles.message, { color: theme.text }]}>
              {message}
            </Text>
          </View>
        ) : null}
      </AppModal>
    </>
  );
};

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  button: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 4,
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: "700",
  },
});

export default Alert;
