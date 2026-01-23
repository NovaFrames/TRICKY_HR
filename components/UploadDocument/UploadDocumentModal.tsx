// UploadDocumentModal.tsx
import Alert from "@/components/common/AppAlert";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import React, { useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import AppModal from "../common/AppModal";
import CenterModalSelection from "../common/CenterModalSelection";
import { CustomButton } from "../CustomButton";

interface UploadDocumentModalProps {
  visible: boolean;
  onClose: () => void;
  onUpload: (data: UploadData) => Promise<void>;
  uploading: boolean;
}

interface UploadData {
  name: string;
  type: string;
  remarks: string;
  file: {
    uri: string;
    name: string;
    type: string;
  };
}

const documentTypes = [
  { label: "Education", value: "EDUCATION" },
  { label: "Experience", value: "EXPERIENCE" },
  { label: "Proof", value: "PROOF" },
  { label: "Birth Certificate", value: "BIRTH" },
];

const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({
  visible,
  onClose,
  onUpload,
  uploading,
}) => {
  const { theme } = useTheme();
  const [documentName, setDocumentName] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [selectedFile, setSelectedFile] = useState<any | null>(null);

  const validateForm = (): boolean => {
    if (!documentName.trim()) {
      Alert.alert("Error", "Document name is required");
      return false;
    }
    if (!documentType) {
      Alert.alert("Error", "Please select a document type");
      return false;
    }
    if (remarks.trim().length < 11) {
      Alert.alert("Error", "Remarks should be more than 10 characters");
      return false;
    }
    if (!selectedFile) {
      Alert.alert("Error", "Please select a file to upload");
      return false;
    }
    return true;
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const file = result.assets ? result.assets[0] : (result as any);
      if (file.size && file.size > 10 * 1024 * 1024) {
        Alert.alert("Error", "File size should be less than 10MB");
        return;
      }
      setSelectedFile({
        uri: file.uri,
        name: file.name,
        type: file.mimeType || "application/octet-stream",
        size: file.size,
      });
    } catch (err) {
      Alert.alert("Error", "Failed to pick document");
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      const uploadData: UploadData = {
        name: documentName.trim(),
        type: documentType,
        remarks: remarks.trim(),
        file: {
          uri: selectedFile.uri,
          name: selectedFile.name || "document",
          type: selectedFile.type || "application/octet-stream",
        },
      };
      await onUpload(uploadData);
      resetForm();
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  const resetForm = () => {
    setDocumentName("");
    setDocumentType("");
    setRemarks("");
    setSelectedFile(null);
  };

  const handleClose = () => {
    if (uploading) {
      Alert.alert("Upload in Progress", "Are you sure you want to cancel?", [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          onPress: () => {
            resetForm();
            onClose();
          },
        },
      ]);
    } else {
      resetForm();
      onClose();
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

  return (
    <>
      <AppModal visible={visible} onClose={handleClose} title="Upload Document">
        <ScrollView
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formGroup}>
            <Text style={labelStyle}>Document Name</Text>
            <TextInput
              style={inputStyle}
              placeholder="Enter document name"
              placeholderTextColor={theme.placeholder}
              value={documentName}
              onChangeText={setDocumentName}
              editable={!uploading}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={labelStyle}>Document Type</Text>
            <TouchableOpacity
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: theme.inputBg,
                  borderColor: theme.inputBorder,
                },
              ]}
              onPress={() => setShowTypeSelector(true)}
              disabled={uploading}
            >
              <Text
                style={{ color: documentType ? theme.text : theme.placeholder }}
              >
                {documentType
                  ? documentTypes.find((t) => t.value === documentType)?.label
                  : "Select Type"}
              </Text>
              <Icon name="keyboard-arrow-down" size={24} color={theme.icon} />
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={labelStyle}>File Selection</Text>
            <TouchableOpacity
              style={[
                styles.filePicker,
                {
                  backgroundColor: theme.inputBg,
                  borderColor: theme.inputBorder,
                },
              ]}
              onPress={pickDocument}
              disabled={uploading}
            >
              {selectedFile ? (
                <View style={styles.fileInfo}>
                  <Icon
                    name="insert-drive-file"
                    size={24}
                    color={theme.primary}
                  />
                  <Text
                    style={[styles.fileName, { color: theme.text }]}
                    numberOfLines={1}
                  >
                    {selectedFile.name}
                  </Text>
                  <Icon name="check-circle" size={20} color="#4CAF50" />
                </View>
              ) : (
                <View style={styles.filePlaceholder}>
                  <Icon name="cloud-upload" size={32} color={theme.icon} />
                  <Text
                    style={[
                      styles.filePlaceholderText,
                      { color: theme.textLight },
                    ]}
                  >
                    Tap to select document
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={labelStyle}>Remarks</Text>
            <TextInput
              style={[inputStyle, styles.textArea]}
              placeholder="Min. 11 characters"
              placeholderTextColor={theme.placeholder}
              multiline
              numberOfLines={4}
              value={remarks}
              onChangeText={setRemarks}
              editable={!uploading}
            />
          </View>

          <View style={styles.footerRow}>
            <CustomButton
              title="Cancel"
              icon="close"
              onPress={handleClose}
              disabled={uploading}
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
              title="Upload Now"
              icon="cloud-upload-outline"
              onPress={handleSubmit}
              isLoading={uploading}
              disabled={uploading}
              style={[
                styles.footerButton,
                styles.submitButton,
                { backgroundColor: theme.primary },
              ]}
            />
          </View>
        </ScrollView>
      </AppModal>

      <CenterModalSelection
        visible={showTypeSelector}
        onClose={() => setShowTypeSelector(false)}
        title="Select Document Type"
        options={documentTypes}
        selectedValue={documentType}
        onSelect={(val) => {
          setDocumentType(val as string);
          setShowTypeSelector(false);
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
  inputWrapper: {
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
  filePicker: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 24,
    borderStyle: "dashed",
  },
  fileInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  fileName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },
  filePlaceholder: {
    alignItems: "center",
    gap: 8,
  },
  filePlaceholderText: {
    fontSize: 14,
    fontWeight: "600",
  },
  footerRow: {
    flexDirection: "row-reverse",
    gap: 12,
  },
  footerButton: {
    flex: 1,
    height: 56,
    borderRadius: 4,
    marginBottom: 0,
    padding: 10,
  },
  cancelButton: {
    borderWidth: 1,
  },
  submitButton: {
    elevation: 2,
  },
});

export default UploadDocumentModal;
