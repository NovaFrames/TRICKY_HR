import React, { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import AppModal from "@/components/common/AppModal";

export type ConfirmModalButton = {
  text?: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
};

type ConfirmModalHandler = (
  title: string,
  message?: string,
  buttons?: ConfirmModalButton[],
) => void;

class ConfirmModalService {
  private handler?: ConfirmModalHandler;

  setHandler(handler?: ConfirmModalHandler) {
    this.handler = handler;
  }

  alert(title: string, message?: string, buttons?: ConfirmModalButton[]) {
    if (!this.handler) return;
    this.handler(title, message, buttons);
  }
}

const confirmModalService = new ConfirmModalService();

const ConfirmModal = {
  alert: (title: string, message?: string, buttons?: ConfirmModalButton[]) =>
    confirmModalService.alert(title, message, buttons),
};

export const ConfirmModalProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [buttons, setButtons] = useState<ConfirmModalButton[]>([]);

  const closeConfirmModal = useCallback(() => {
    setVisible(false);
  }, []);

  const showConfirmModal = useCallback<ConfirmModalHandler>(
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
    confirmModalService.setHandler(showConfirmModal);
    return () => confirmModalService.setHandler(undefined);
  }, [showConfirmModal]);

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
                closeConfirmModal();
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
  }, [
    buttons,
    closeConfirmModal,
    theme.inputBg,
    theme.inputBorder,
    theme.primary,
    theme.text,
    visible,
  ]);

  return (
    <>
      {children}
      <AppModal
        visible={visible}
        onClose={closeConfirmModal}
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

export default ConfirmModal;
