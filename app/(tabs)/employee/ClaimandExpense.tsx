import { useTheme } from "@/context/ThemeContext";
import { useUser } from "@/context/UserContext";
import { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { FC, useEffect, useState } from "react";

// Import new components
import ClaimDetailsSection from "@/components/claim/ClaimDetailsSection";
import ConfirmationModal from "@/components/claim/ConfirmationModal";
import DocumentPickerModal from "@/components/claim/DocumentPickerModal";
import DocumentsSection from "@/components/claim/DocumentsSection";
import TravelExpenseModal from "@/components/claim/TravelExpenseModal";
import TravelExpensesSection from "@/components/claim/TravelExpensesSection";
import { CustomButton } from "@/components/CustomButton";

import Header, { HEADER_HEIGHT } from "@/components/Header";
import { useProtectedBack } from "@/hooks/useProtectedBack";
import ApiService, { ClaimData, TravelExpense } from "@/services/ApiService";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Alert from "@/components/common/AppAlert";

export interface TravelExpenseItem {
  type: number;
  typeName: string;
  boarding: string;
  destination: string;
  pnr: string;
  amount: number;
}

export interface DocumentItem {
  id: string;
  uri: string;
  name: string;
  type: "image" | "document";
  ext: string;
}

export interface ClaimAndExpenseProps {
  navigation: any;
  route: {
    params?: {
      title?: string;
    };
  };
}

export interface DatePickerEvent {
  type: string;
  nativeEvent: {
    timestamp: number;
  };
}

export interface PickerItem {
  label: string;
  value: number;
}

const ClaimAndExpense: FC<ClaimAndExpenseProps> = () => {
  const { theme, isDark } = useTheme();
  const { user } = useUser();
  const router = useRouter();

  // State variables
  const [loading, setLoading] = useState<boolean>(false);
  const [claimNames, setClaimNames] = useState<string[]>([]);
  const [claimIds, setClaimIds] = useState<number[]>([]);
  const [currencyNames, setCurrencyNames] = useState<string[]>([]);
  const [currencyIds, setCurrencyIds] = useState<number[]>([]);
  const [currencyStatus, setCurrencyStatus] = useState<boolean>(false);

  const [selectedClaim, setSelectedClaim] = useState<number>(0);
  const [selectedCurrency, setSelectedCurrency] = useState<number>(0);
  const [description, setDescription] = useState<string>("");
  const [totalAmount, setTotalAmount] = useState<number>(0);

  // Date states
  const [fromDate, setFromDate] = useState<Date>(new Date());
  const [toDate, setToDate] = useState<Date>(new Date());
  const [showFromDatePicker, setShowFromDatePicker] = useState<boolean>(false);
  const [showToDatePicker, setShowToDatePicker] = useState<boolean>(false);

  // Travel expenses
  const [travelExpenses, setTravelExpenses] = useState<TravelExpenseItem[]>([]);
  const [showTravelModal, setShowTravelModal] = useState<boolean>(false);
  const [editTravelIndex, setEditTravelIndex] = useState<number | null>(null);

  // Travel form fields
  const [travelType, setTravelType] = useState<number>(0);
  const [boardingPoint, setBoardingPoint] = useState<string>("");
  const [destination, setDestination] = useState<string>("");
  const [pnr, setPnr] = useState<string>("");
  const [amount, setAmount] = useState<string>("");

  // Documents
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [showDocModal, setShowDocModal] = useState<boolean>(false);

  useProtectedBack({
    home: "/home",
  });

  // Confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const travelTypes: string[] = [
    "Other Expenses",
    "Flight",
    "Train",
    "Bus",
    "Taxi",
    "Travels",
    "Two Wheeler",
    "Accommodation/Food",
  ];

  // Initialize on component mount
  useEffect(() => {
    fetchClaimList();
    requestPermissions();
  }, []);

  const requestPermissions = async (): Promise<void> => {
    if (Platform.OS !== "web") {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Sorry, we need camera roll permissions to make this work!",
        );
      }
    }
  };

  const fetchClaimList = async (): Promise<void> => {
    try {
      setLoading(true);
      const data = await ApiService.getClaimList(user?.TokenC || "");

      if (data.Status === "success") {
        // Process claim names
        const claimNamesArr: string[] = [""];
        const claimIdsArr: number[] = [-1];

        if (data.data && Array.isArray(data.data)) {
          data.data.forEach((item: any) => {
            claimNamesArr.push(item.NameC);
            claimIdsArr.push(item.IdN);
          });
        }

        setClaimNames(claimNamesArr);
        setClaimIds(claimIdsArr);

        // Process currency if enabled
        if (
          data.EnableCurrency &&
          data.Currency &&
          Array.isArray(data.Currency)
        ) {
          setCurrencyStatus(true);
          const currencyNamesArr: string[] = [""];
          const currencyIdsArr: number[] = [-1];

          data.Currency.forEach((item: any) => {
            currencyNamesArr.push(item.NameC);
            currencyIdsArr.push(item.IdN);
          });

          setCurrencyNames(currencyNamesArr);
          setCurrencyIds(currencyIdsArr);
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load claim data");
    } finally {
      setLoading(false);
    }
  };

  // Date handling
  const formatDate = (date: Date): string => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const day = date.getDate().toString().padStart(2, "0");
    return `${months[date.getMonth()]} ${day} ${date.getFullYear()}`;
  };

  const onFromDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ): void => {
    setShowFromDatePicker(false);
    if (selectedDate) {
      setFromDate(selectedDate);
    }
  };

  const onToDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ): void => {
    setShowToDatePicker(false);
    if (selectedDate) {
      setToDate(selectedDate);
    }
  };

  // Travel expense handling
  const handleAddTravel = (): void => {
    if (!boardingPoint.trim()) {
      Alert.alert("Error", "Enter Boarding Point/Description");
      return;
    }

    if (travelType !== 0 && !destination.trim()) {
      Alert.alert("Error", "Enter Destination");
      return;
    }

    if (!amount.trim() || parseFloat(amount) <= 0) {
      Alert.alert("Error", "Enter valid Amount");
      return;
    }

    const newTravel: TravelExpenseItem = {
      type: travelType,
      typeName: travelTypes[travelType],
      boarding: boardingPoint,
      destination: destination,
      pnr: pnr,
      amount: parseFloat(amount),
    };

    if (editTravelIndex !== null) {
      // Edit existing
      const updatedTravels = [...travelExpenses];
      updatedTravels[editTravelIndex] = newTravel;
      setTravelExpenses(updatedTravels);
    } else {
      // Add new
      setTravelExpenses([...travelExpenses, newTravel]);
    }

    // Recalculate total
    const newTotal =
      travelExpenses.reduce((sum: number, item: TravelExpenseItem) => {
        if (
          editTravelIndex !== null &&
          travelExpenses[editTravelIndex] === item
        ) {
          return sum + parseFloat(amount);
        }
        return sum + item.amount;
      }, 0) + (editTravelIndex === null ? parseFloat(amount) : 0);

    setTotalAmount(newTotal);

    // Reset form
    resetTravelForm();
    setShowTravelModal(false);
  };

  const resetTravelForm = (): void => {
    setTravelType(0);
    setBoardingPoint("");
    setDestination("");
    setPnr("");
    setAmount("");
    setEditTravelIndex(null);
  };

  const resetFullForm = (): void => {
    setSelectedClaim(0);
    setSelectedCurrency(0);
    setDescription("");
    setTotalAmount(0);
    setFromDate(new Date());
    setToDate(new Date());
    setTravelExpenses([]);
    setDocuments([]);
    resetTravelForm();
  };

  const handleEditTravel = (index: number): void => {
    const travel = travelExpenses[index];
    setTravelType(travel.type);
    setBoardingPoint(travel.boarding);
    setDestination(travel.destination);
    setPnr(travel.pnr);
    setAmount(travel.amount.toString());
    setEditTravelIndex(index);
    setShowTravelModal(true);
  };

  const handleDeleteTravel = (index: number): void => {
    Alert.alert(
      "Delete Travel",
      "Are you sure you want to delete this travel expense?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            const deletedAmount = travelExpenses[index].amount;
            const updatedTravels = travelExpenses.filter((_, i) => i !== index);
            setTravelExpenses(updatedTravels);

            // Recalculate total
            const newTotal = totalAmount - deletedAmount;
            setTotalAmount(newTotal);
          },
        },
      ],
    );
  };

  // Document handling
  const pickImage = async (): Promise<void> => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newDoc: DocumentItem = {
          id: Date.now().toString(),
          uri: result.assets[0].uri,
          name: `image_${Date.now()}.jpg`,
          type: "image",
          ext: "jpg",
        };

        setDocuments([...documents, newDoc]);
      }
    } catch (error) {
      console.error("Error picking image:", error);
    }
    setShowDocModal(false);
  };

  const takePhoto = async (): Promise<void> => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newDoc: DocumentItem = {
          id: Date.now().toString(),
          uri: result.assets[0].uri,
          name: `photo_${Date.now()}.jpg`,
          type: "image",
          ext: "jpg",
        };

        setDocuments([...documents, newDoc]);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
    }
    setShowDocModal(false);
  };

  const pickDocument = async (): Promise<void> => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        const name = result.assets[0].name;
        const ext = name.split(".").pop()?.toLowerCase() || "unknown";

        const newDoc: DocumentItem = {
          id: Date.now().toString(),
          uri: uri,
          name: name,
          type: "document",
          ext: ext,
        };

        setDocuments([...documents, newDoc]);
      }
    } catch (error) {
      console.error("Error picking document:", error);
    }
    setShowDocModal(false);
  };

  const handleDeleteDocument = (id: string): void => {
    Alert.alert(
      "Delete Document",
      "Are you sure you want to delete this document?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setDocuments(documents.filter((doc) => doc.id !== id));
          },
        },
      ],
    );
  };

  // Validation
  const validateForm = (): boolean => {
    if (selectedClaim === 0) {
      Alert.alert("Error", "Select Claim name");
      return false;
    }

    if (currencyStatus && selectedCurrency === 0) {
      Alert.alert("Error", "Select Currency");
      return false;
    }

    if (!description.trim()) {
      Alert.alert("Error", "Description should not be empty");
      return false;
    }

    if (travelExpenses.length === 0) {
      Alert.alert("Error", "Add Travel OR Other Expenses");
      return false;
    }

    if (documents.length === 0) {
      Alert.alert("Error", "Attach documents");
      return false;
    }

    if (fromDate > toDate) {
      Alert.alert("Error", "From date must be smaller than To date");
      return false;
    }

    return true;
  };

  // Submit claim
  const handleSubmit = (): void => {
    if (!validateForm()) {
      return;
    }

    setShowConfirmModal(true);
  };

  const confirmSubmit = async (): Promise<void> => {
    setShowConfirmModal(false);
    setLoading(true);

    try {
      // Prepare travel expenses array
      const travelExpensesArray: TravelExpense[] = travelExpenses.map(
        (expense) => ({
          TravelAmountN: expense.amount,
          PNRC: expense.pnr,
          DestinationC: expense.destination,
          BoardintPointC: expense.boarding,
          TravelByN: expense.type,
        }),
      );

      // Format dates
      const formatDateForAPI = (date: Date): string => {
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const day = date.getDate().toString().padStart(2, "0");
        return `${month}/${day}/${date.getFullYear()}`;
      };

      const fromDateStr = await ApiService.getServerTime(
        user?.TokenC || "",
        fromDate,
      );
      const toDateStr = await ApiService.getServerTime(
        user?.TokenC || "",
        toDate,
      );

      // Prepare claim data
      const claimData: ClaimData = {
        ClaimAmtN: totalAmount,
        DescC: description,
        AllownIdN: claimIds[selectedClaim],
        CurrencyIdN: currencyStatus ? currencyIds[selectedCurrency] : 0,
        FromDateD: formatDateForAPI(fromDate),
        ToDateD: formatDateForAPI(toDate),
        ClaimExpenseDtl1: travelExpensesArray,
      };

      // Submit claim
      const result = await ApiService.updateClaim(
        user?.TokenC || "",
        claimData,
      );

      if (result.Status === "success" && result.IdN) {
        const claimId = result.IdN;

        // Prepare documents for upload
        const filesForUpload = documents.map((doc) => ({
          uri: doc.uri,
          type: doc.type === "image" ? "image/jpeg" : `application/${doc.ext}`,
          name: doc.name,
        }));

        // Upload documents
        const uploadResult = await ApiService.updateClaimDoc(
          user?.TokenC || "",
          claimId,
          filesForUpload,
        );

        if (uploadResult.Status === "success") {
          resetFullForm();
          Alert.alert("Success", "Claim submitted successfully", [
            {
              text: "OK",
              onPress: () => router.back(),
            },
          ]);
        } else {
          Alert.alert(
            "Error",
            uploadResult.Error || "Failed to upload documents",
          );
        }
      } else {
        Alert.alert("Error", result.Error || "Failed to submit claim");
      }
    } catch (error) {
      Alert.alert("Error", "An error occurred while submitting the claim");
      console.error("Submit error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !showConfirmModal) {
    return (
      <View
        style={[styles.centerContainer, { backgroundColor: theme.background }]}
      >
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textLight }]}>
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <Header title="Claim & Expense" />

      <ScrollView
        contentContainerStyle={{
          paddingTop: HEADER_HEIGHT + 6, // 👈 KEY LINE
        }}
        showsVerticalScrollIndicator={false}
        style={styles.content}
      >
        <ClaimDetailsSection
          theme={theme}
          isDark={isDark}
          selectedClaim={selectedClaim}
          claimNames={claimNames}
          currencyStatus={currencyStatus}
          selectedCurrency={selectedCurrency}
          currencyNames={currencyNames}
          fromDate={fromDate}
          toDate={toDate}
          description={description}
          showFromDatePicker={showFromDatePicker}
          showToDatePicker={showToDatePicker}
          onClaimChange={(val: number) => setSelectedClaim(val)}
          onCurrencyChange={(val: number) => setSelectedCurrency(val)}
          onFromDatePress={() => setShowFromDatePicker(true)}
          onToDatePress={() => setShowToDatePicker(true)}
          onFromDateChange={onFromDateChange}
          onToDateChange={onToDateChange}
          onDescriptionChange={(text: string) => setDescription(text)}
          formatDate={formatDate}
        />

        <TravelExpensesSection
          theme={theme}
          travelExpenses={travelExpenses}
          totalAmount={totalAmount}
          onAddPress={() => {
            resetTravelForm();
            setShowTravelModal(true);
          }}
          onEdit={handleEditTravel}
          onDelete={handleDeleteTravel}
        />

        <DocumentsSection
          theme={theme}
          documents={documents}
          onAddPress={() => setShowDocModal(true)}
          onDelete={handleDeleteDocument}
        />

        {/* Submit Button */}
        <CustomButton
          title="Submit Claim"
          icon="checkmark-circle"
          onPress={handleSubmit}
          isLoading={loading}
          disabled={loading}
          style={[styles.submitButton, { backgroundColor: theme.primary }]}
        />
      </ScrollView>

      <TravelExpenseModal
        visible={showTravelModal}
        theme={theme}
        isDark={isDark}
        editIndex={editTravelIndex}
        travelType={travelType}
        boardingPoint={boardingPoint}
        destination={destination}
        pnr={pnr}
        amount={amount}
        travelTypes={travelTypes}
        onCancel={() => setShowTravelModal(false)}
        onSave={handleAddTravel}
        setTravelType={setTravelType}
        setBoardingPoint={setBoardingPoint}
        setDestination={setDestination}
        setPnr={setPnr}
        setAmount={setAmount}
      />

      <DocumentPickerModal
        visible={showDocModal}
        theme={theme}
        onCancel={() => setShowDocModal(false)}
        onTakePhoto={takePhoto}
        onPickImage={pickImage}
        onPickDocument={pickDocument}
      />

      <ConfirmationModal
        visible={showConfirmModal}
        totalAmount={totalAmount}
        theme={theme}
        onCancel={() => setShowConfirmModal(false)}
        onConfirm={confirmSubmit}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 15,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    marginHorizontal: 16,
  },
  submitButton: {
    marginHorizontal: 15,
    marginVertical: 20,
    paddingVertical: 15,
    borderRadius: 4,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
});

export default ClaimAndExpense;
