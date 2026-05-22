import Modal from "@/components/common/SingleModal";
import { lockAndroidNavigationBar } from "@/utils/systemUI";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
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
  inline?: boolean;
}
const CenterModalSelection: React.FC<CenterModalSelectionProps> = ({
  visible,
  onClose,
  onSelect,
  options,
  title,
  selectedValue,
  inline = false,
}) => {
  const { theme, isDark } = useTheme();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!visible) return;
    // LOCK nav bar when modal opens
    lockAndroidNavigationBar(theme.background, isDark);
    return () => {
      // RESTORE nav bar when modal closes
      lockAndroidNavigationBar(theme.background, isDark);
    };
  }, [visible, isDark, theme.background]);
  useEffect(() => {
    if (!visible) setQuery("");
  }, [visible]);
  const filteredOptions = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return options;
    return options.filter((option) => {
      const haystack = `${option.label} ${option.subLabel ?? ""}`.toLowerCase();
      return haystack.includes(trimmed);
    });
  }, [options, query]);
  const content = (
    <View
      style={inline ? styles.inlineOverlay : styles.overlay}
      pointerEvents="box-none"
    >
      <View style={styles.backdrop}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={onClose}
          style={StyleSheet.absoluteFillObject}
        />
      </View>
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
        {/* Search */}
        <View
          style={[
            styles.searchRow,
            { borderBottomColor: theme.inputBorder },
          ]}
        >
          <Ionicons name="search" size={18} color={theme.icon} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search..."
            placeholderTextColor={theme.placeholder}
            style={[
              styles.searchInput,
              {
                backgroundColor: theme.inputBg,
                borderColor: theme.inputBorder,
                color: theme.text,
              },
            ]}
          />
          {!!query && (
            <TouchableOpacity
              onPress={() => setQuery("")}
              accessibilityLabel="Clear search"
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={18} color={theme.icon} />
            </TouchableOpacity>
          )}
        </View>
        {/* Options List */}
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
          onStartShouldSetResponder={() => true}
        >
          {filteredOptions.map((option, index) => {
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
          {filteredOptions.length === 0 && (
            <Text style={[styles.emptyText, { color: theme.textLight }]}>
              No results found.
            </Text>
          )}
          <View style={{ height: 20 }} />
        </ScrollView>
      </View>
    </View>
  );

  if (!visible) return null;
  if (inline) {
    return content;
  }

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {content}
    </Modal>
  );
};
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  inlineOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
    zIndex: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },

  modalContainer: {
    width: "100%",
    maxHeight: "80%",
    minHeight: 350,

    borderRadius: 24,

    overflow: "hidden",

    elevation: 12,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
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
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  searchInput: {
    flex: 1,
    height: 36,
    paddingHorizontal: 10,
    borderRadius: 4,
    borderWidth: 1,
    fontSize: 14,
  },
  clearButton: {
    padding: 4,
  },
  closeButton: {
    padding: 4,
  },
  list: {
    flex: 1,
  },

  listContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
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
  emptyText: {
    paddingVertical: 16,
    textAlign: "center",
    fontSize: 14,
  },
});
export default CenterModalSelection;
