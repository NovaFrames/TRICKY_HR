import Modal from "@/components/common/SingleModal";
import { CustomButton } from "@/components/CustomButton";
import { ThemeType } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import CenterModalSelection from "../common/CenterModalSelection";
interface TravelExpenseModalProps {
  visible: boolean;
  theme: ThemeType;
  isDark: boolean;
  editIndex: number | null;
  travelType: number;
  boardingPoint: string;
  destination: string;
  pnr: string;
  amount: string;
  travelByOptions: { text: string; value: number }[];
  onCancel: () => void;
  onSave: () => void;
  setTravelType: (val: number) => void;
  setBoardingPoint: (val: string) => void;
  setDestination: (val: string) => void;
  setPnr: (val: string) => void;
  setAmount: (val: string) => void;
}
const TravelExpenseModal: React.FC<TravelExpenseModalProps> = ({
  visible,
  theme,
  isDark,
  editIndex,
  travelType,
  boardingPoint,
  destination,
  pnr,
  amount,
  travelByOptions,
  onCancel,
  onSave,
  setTravelType,
  setBoardingPoint,
  setDestination,
  setPnr,
  setAmount,
}) => {
  const [showTravelTypeModal, setShowTravelTypeModal] = React.useState(false);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: theme.cardBackground }]}>
          <View style={[styles.header, { borderBottomColor: theme.inputBorder }]}>
            <Text style={[styles.title, { color: theme.text }]}>
              {editIndex !== null ? "Edit Travel" : "Add Travel/Expense"}
            </Text>
            <TouchableOpacity onPress={onCancel}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>Type</Text>

              <TouchableOpacity
                style={[
                  styles.selectorContainer,
                  {
                    backgroundColor: theme.inputBg,
                    borderColor: theme.inputBorder,
                  },
                ]}
                onPress={() => setShowTravelTypeModal(true)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="airplane-outline"
                  size={20}
                  color={theme.primary}
                />

                <Text
                  style={[
                    styles.selectorText,
                    { color: theme.text },
                  ]}
                >
                  {
                    travelByOptions.find(
                      (item) => item.value === travelType
                    )?.text || "Select Type"
                  }
                </Text>

                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={theme.text + "80"}
                />
              </TouchableOpacity>

              <CenterModalSelection
                visible={showTravelTypeModal}
                onClose={() => setShowTravelTypeModal(false)}
                title="Select Travel Type"
                options={travelByOptions.map((item) => ({
                  label: item.text,
                  value: item.value,
                }))}
                selectedValue={travelType}
                onSelect={(val: number) => setTravelType(val)}
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>
                Boarding Point/Description *
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.inputBg,
                    borderColor: theme.inputBorder,
                    color: theme.text,
                  },
                ]}
                value={boardingPoint}
                onChangeText={setBoardingPoint}
                placeholder="Enter boarding point or description"
                placeholderTextColor={theme.placeholder}
              />
            </View>
            {travelType !== 0 && (
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: theme.text }]}>
                  Destination *
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: theme.inputBg,
                      borderColor: theme.inputBorder,
                      color: theme.text,
                    },
                  ]}
                  value={destination}
                  onChangeText={setDestination}
                  placeholder="Enter destination"
                  placeholderTextColor={theme.placeholder}
                />
              </View>
            )}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>
                PNR/Ticket Number
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.inputBg,
                    borderColor: theme.inputBorder,
                    color: theme.text,
                  },
                ]}
                value={pnr}
                onChangeText={setPnr}
                placeholder="Enter PNR or ticket number"
                placeholderTextColor={theme.placeholder}
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>Amount *</Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.inputBg,
                    borderColor: theme.inputBorder,
                    color: theme.text,
                  },
                ]}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={theme.placeholder}
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.footer, { borderTopColor: theme.inputBorder }]}>

              <CustomButton
                title="Cancel"
                icon="close"
                onPress={onCancel}
                textColor={theme.textLight}
                iconColor={theme.textLight}
                containerStyle={{ flex: 1 }}
                style={[
                  { backgroundColor: theme.inputBg, borderWidth: 1, borderColor: theme.inputBorder }
                ]}
              />

              <CustomButton
                title={editIndex !== null ? "Update" : "Add"}
                icon={editIndex !== null ? "save-outline" : "add-circle-outline"}
                onPress={onSave}
                containerStyle={{ flex: 1 }}
                style={[
                  { backgroundColor: theme.primary }
                ]}
              />

            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
};

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
    width: "100%",
    maxHeight: "85%",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  body: {
    padding: 20,
  },
  bodyContent: {
    paddingBottom: 12,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 4,
    overflow: "hidden",
  },
  picker: {
    height: 50,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 50,
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  button: {
  },
  cancelButton: {
    borderWidth: 1,
  },
  saveButton: {},
  selectorContainer: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  borderWidth: 1.5,
  borderRadius: 4,
  paddingHorizontal: 16,
  paddingVertical: 14,
  gap: 12,
},

selectorText: {
  flex: 1,
  fontSize: 15,
  fontWeight: "500",
},
});
export default TravelExpenseModal;
