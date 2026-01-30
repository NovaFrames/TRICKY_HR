import Modal from "@/components/common/SingleModal";
import { lockAndroidNavigationBar } from "@/utils/systemUI";
import { Ionicons } from "@expo/vector-icons";
import * as NavigationBar from "expo-navigation-bar";
import React, { useEffect } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
interface Option {
  label: string;
  value: any;
  subLabel?: string;
}
interface CenterModalSelectionProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (value: any) => void;
  options: Option[];
  title?: string;
  selectedValue?: any;
}
const CenterModalSelection: React.FC<CenterModalSelectionProps> = ({
  visible,
  onClose,
  onSelect,
  options,
  title,
  selectedValue,
}) => {
  const { theme, isDark } = useTheme();
  useEffect(() => {
    if (!visible) return;
    void NavigationBar.setButtonStyleAsync(isDark ? "light" : "dark");
    return () => {
      void NavigationBar.setButtonStyleAsync(isDark ? "light" : "dark");
    };
  }, [visible, theme.background, isDark]);
  useEffect(() => {
    if (!visible) return;
    // LOCK nav bar when modal opens
    lockAndroidNavigationBar(theme.background, isDark);
    return () => {
      // RESTORE nav bar when modal closes
      lockAndroidNavigationBar(theme.background, isDark);
    };
  }, [visible, isDark, theme.background]);
  if (!visible) return null;
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={onClose}
          style={styles.backdrop}
        />
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: theme.cardBackground },
          ]}
        >
          {/* Header */}
          <View
            style={[styles.header, { borderBottomColor: theme.inputBorder }]}
          >
            <Text style={[styles.title, { color: theme.text }]}>
              {title || "Select Option"}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.icon} />
            </TouchableOpacity>
          </View>
          {/* Options List */}
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {options.map((option, index) => {
              const isSelected = selectedValue === option.value;
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.option,
                    isSelected && { backgroundColor: theme.primary + "10" },
                  ]}
                  onPress={() => {
                    onSelect(option.value);
                    onClose();
                  }}
                >
                  <View style={styles.optionTextBlock}>
                    <Text
                      style={[
                        styles.optionText,
                        { color: theme.text },
                        isSelected && { color: theme.primary, fontWeight: "700" },
                      ]}
                      numberOfLines={1}
                    >
                      {option.label}
                    </Text>
                    {/* {option.subLabel ? (
                      <Text
                        style={[
                          styles.optionSubText,
                          { color: theme.textLight },
                        ]}
                        // numberOfLines={2}
                      >
                        {option.subLabel}
                      </Text>
                    ) : null} */}
                  </View>
                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={theme.primary}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    width: "100%",
    maxWidth: 400,
    maxHeight: "70%",
    borderRadius: 4,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  closeButton: {
    padding: 4,
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginVertical: 4,
  },
  optionText: {
    fontSize: 16,
  },
  optionTextBlock: {
    flex: 1,
    marginRight: 12,
  },
  optionSubText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },
});
export default CenterModalSelection;