import AppModal from "@/components/common/AppModal";
import ProfileImage from "@/components/common/ProfileImage";
import Snackbar from "@/components/common/Snackbar";
import Header, { HEADER_HEIGHT } from "@/components/Header";
import { formatDisplayDate } from "@/constants/timeFormat";
import { useTheme } from "@/context/ThemeContext";
import { useUser } from "@/context/UserContext";
import { useProtectedBack } from "@/hooks/useProtectedBack";
import ApiService from "@/services/ApiService";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  PanResponder,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

/* -------------------- COMPONENT -------------------- */

export default function Celebration() {
  const { theme } = useTheme();
  const { user } = useUser();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [index, setIndex] = useState(0);
  const [wishModalVisible, setWishModalVisible] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<any | null>(null);
  const [wishesTitle, setWishesTitle] = useState("");
  const [wishesBody, setWishesBody] = useState("");
  const [wishSending, setWishSending] = useState(false);
  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: "",
    type: "info" as "info" | "error" | "success",
  });
  const [routes] = useState([
    { key: "birthday", title: "BIRTHDAY", icon: "gift-outline" },
    { key: "work", title: "WORK ANNIVERSARY", icon: "ribbon-outline" },
    { key: "wedding", title: "WEDDING", icon: "heart-outline" },
  ]);

  useProtectedBack({ home: "/home" });
  const [userMail, setUserMail] = useState<any | null>(null);

  const fetchUserData = async () => {
    try {
      if (!user?.TokenC) return;
      const result = await ApiService.getUserProfile(user.TokenC);
      const profile = result.data?.[0]?.empProfile;
      setUserMail(profile || null);
      console.log("Result: ", profile.EmailIdC);
    } catch (err: any) {
      console.error("Profile API Error:", err?.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [user]);

  const getWishSubject = (type: "birthday" | "work" | "wedding") => {
    switch (type) {
      case "birthday":
        return "Birthday Wishes";
      case "work":
        return "Service Day Wishes";
      case "wedding":
        return "Wedding Wishes";
      default:
        return "Best Wishes";
    }
  };

  const fetchCelebration = async () => {
    try {
      if (!user?.TokenC) {
        setData({});
        return;
      }
      const responseData = await ApiService.getCelebrationData(user.TokenC, 1);

      setData(responseData);
    } catch (err) {
      console.error("Celebration API error:", err);
      setData({});
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCelebration();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCelebration();
  };

  const showSnackbar = (
    message: string,
    type: "info" | "error" | "success" = "info",
  ) => {
    setSnackbar({ visible: true, message, type });
  };

  const normalizeEmail = (value?: string) =>
    typeof value === "string" ? value.trim() : "";

  const isValidEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const resolveErrorMessage = (error: any) => {
    if (typeof error?.message === "string" && error.message.trim()) {
      return error.message;
    }
    if (typeof error?.response?.data?.error === "string") {
      return error.response.data.error;
    }
    if (typeof error?.response?.data?.Error === "string") {
      return error.response.data.Error;
    }
    return "Unable to send wishes";
  };


  const getEmpEmail = (item: any) => {
    return (item?.EmailIdC || "")
  }

  const openWishesModal = (item: any, type: "birthday" | "work" | "wedding") => {
    const mailFrom = normalizeEmail(userMail?.EmailIdC);
    const mailTo = normalizeEmail(getEmpEmail(item));
    const mailToCC = normalizeEmail(userMail?.EmailIdC);

    if (!isValidEmail(mailFrom) || !isValidEmail(mailTo)) {
      showSnackbar("Email id not found", "error");
      return;
    }

    const subject = getWishSubject(type);

    setSelectedEmp({
      ...item,
      mailFrom,
      mailTo,
      ...(isValidEmail(mailToCC) && { mailToCC }),
      wishType: type,
    });

    setWishesTitle(subject);   // 🔥 AUTO SUBJECT
    setWishesBody("");
    setWishModalVisible(true);
  };


  const closeWishesModal = (force = false) => {
    if (wishSending && !force) return;
    setWishModalVisible(false);
    setSelectedEmp(null);
    setWishesTitle("");
    setWishesBody("");
  };

  const handleSendWishes = async () => {
    if (!selectedEmp?.mailFrom || !selectedEmp?.mailTo) {
      showSnackbar("Email id not found", "error");
      return;
    }
    if (!wishesTitle.trim()) {
      showSnackbar("Please enter a subject", "error");
      return;
    }
    setWishSending(true);

    try {
      const response = await ApiService.sendEmailWishes({
        EmpName: selectedEmp?.EmpNameC || "",
        mailFrom: selectedEmp.mailFrom,
        mailTo: selectedEmp.mailTo,
        mailToCC: user?.EmpNameC || "",
        subject: wishesTitle.trim(),
        body: wishesBody.trim(),
        TokenC: user?.TokenC
      });


      if (response?.Status === "success") {
        showSnackbar("Wishes sent successfully", "success");
        closeWishesModal(true);
      } else {
        showSnackbar(response?.Error || "Unable to send wishes", "error");
      }
    } catch (error) {
      showSnackbar(resolveErrorMessage(error), "error");
    } finally {
      setWishSending(false);
    }
  };

  // PanResponder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Determine if swipe is horizontal and significant enough
        return (
          Math.abs(gestureState.dx) > 20 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy)
        );
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > 50) {
          // Swipe Right -> Previous Tab
          setIndex((prev) => Math.max(0, prev - 1));
        } else if (gestureState.dx < -50) {
          // Swipe Left -> Next Tab
          setIndex((prev) => Math.min(routes.length - 1, prev + 1));
        }
      },
    }),
  ).current;

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const birthdays = data?.DashBoardBirdth ?? [];
  const weddings = data?.DashBoardAnniversary ?? [];
  const workAnniv = data?.DashEmpService ?? [];

  const renderCards = (
    list: any[],
    type: "birthday" | "work" | "wedding"
  ) => {
    if (list.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color={theme.textLight} />
          <Text style={[styles.emptyText, { color: theme.textLight }]}>
            No {type} celebrations found today
          </Text>
        </View>
      );
    }

    return list.map((item: any) => (
      <TouchableOpacity
        key={item.EmpIdN}
        style={[
          styles.card,
          { backgroundColor: theme.inputBg, shadowColor: theme.text },
        ]}
        activeOpacity={0.85}
        onPress={() => openWishesModal(item, type)}
      >
        <View
          style={[styles.iconContainer, { backgroundColor: theme.inputBg }]}
        >
          <ProfileImage
            customerIdC={user?.CustomerIdC}
            compIdN={user?.CompIdN}
            empIdN={item.EmpIdN}
            size={60}
          />
        </View>
        <View style={styles.detailsContainer}>
          <Text style={[styles.name, { color: theme.text }]}>
            {item.EmpNameC}
          </Text>
          <Text style={[styles.dept, { color: theme.textLight }]}>
            {item.DeptNameC}
          </Text>

          <View style={styles.infoRow}>
            {type === "birthday" && (
              <>
                <Ionicons name="gift-outline" size={16} color={theme.primary} />
                <Text style={[styles.infoText, { color: theme.primary }]}>
                  Birthday: {formatDisplayDate(item.BirthDateD)}
                </Text>
              </>
            )}

            {type === "work" && (
              <>
                <Ionicons name="star-outline" size={16} color={theme.primary} />
                <Text style={[styles.infoText, { color: theme.primary }]}>
                  {item.ServiceN} Years of Excellence
                </Text>
              </>
            )}

            {type === "wedding" && (
              <>
                <Ionicons
                  name="heart-outline"
                  size={16}
                  color={theme.primary}
                />
                <Text style={[styles.infoText, { color: theme.primary }]}>
                  Anniversary: {formatDisplayDate(item.MarriageDateD)}
                </Text>
              </>
            )}
          </View>

          <TouchableOpacity
            style={[styles.wishButton, { backgroundColor: theme.primary }]}
            onPress={() => openWishesModal(item, type)}
          >
            <Text style={styles.wishButtonText}>Send Wishes</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    ));
  };

  const currentTab = routes[index].key;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header title="Celebrations" />

      <View style={[styles.body, { paddingTop: HEADER_HEIGHT + 4 }]}>
        {/* Custom Tab Bar */}
        <View
          style={[styles.tabBar, { backgroundColor: theme.cardBackground }]}
        >
          {routes.map((item, i) => (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.tabItem,
                index === i && { borderBottomColor: theme.primary },
              ]}
              onPress={() => setIndex(i)}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: index === i ? theme.primary : theme.textLight },
                ]}
              >
                {item.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content Area with Swipe Support */}
        <View style={styles.contentContainer} {...panResponder.panHandlers}>
          <ScrollView
            contentContainerStyle={styles.content}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme.primary]}
              />
            }
          >
            {currentTab === "birthday" && renderCards(birthdays, "birthday")}
            {currentTab === "wedding" && renderCards(weddings, "wedding")}
            {currentTab === "work" && renderCards(workAnniv, "work")}
          </ScrollView>
        </View>
      </View>

      <AppModal
        visible={wishModalVisible}
        onClose={() => closeWishesModal()}
        title="Send Wishes"
        subtitle={selectedEmp?.EmpNameC ? `To ${selectedEmp.EmpNameC}` : undefined}
        footer={
          <View style={styles.modalFooterActions}>
            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.modalCancel,
                { borderColor: theme.inputBorder },
              ]}
              onPress={() => closeWishesModal()}
              disabled={wishSending}
            >
              <Text style={[styles.modalButtonText, { color: theme.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.primary }]}
              onPress={handleSendWishes}
              disabled={wishSending}
            >
              {wishSending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.modalButtonPrimaryText}>Send</Text>
              )}
            </TouchableOpacity>
          </View>
        }
      >
        <View style={styles.modalBody}>
          <View style={styles.modalRow}>
            <Text style={[styles.modalLabel, { color: theme.textLight }]}>
              From
            </Text>
            <Text style={[styles.modalValue, { color: theme.text }]}>
              {selectedEmp?.mailFrom || "-"}
            </Text>
          </View>
          <View style={styles.modalRow}>
            <Text style={[styles.modalLabel, { color: theme.textLight }]}>
              To
            </Text>
            <Text style={[styles.modalValue, { color: theme.text }]}>
              {selectedEmp?.mailTo || "-"}
            </Text>
          </View>

          <Text style={[styles.inputLabel, { color: theme.textLight }]}>
            Subject
          </Text>
          <TextInput
            value={wishesTitle}
            editable={false}
            selectTextOnFocus={false}
            style={[
              styles.input,
              {
                color: theme.text,
                backgroundColor: theme.inputBg,
                borderColor: theme.inputBorder,
                opacity: 0.8,
              },
            ]}
          />

          <Text style={[styles.inputLabel, { color: theme.textLight }]}>
            Message
          </Text>
          <TextInput
            value={wishesBody}
            onChangeText={setWishesBody}
            placeholder="Write your wishes..."
            placeholderTextColor={theme.placeholder}
            multiline
            textAlignVertical="top"
            style={[
              styles.textArea,
              {
                color: theme.text,
                backgroundColor: theme.inputBg,
                borderColor: theme.inputBorder,
              },
            ]}
          />
        </View>
      </AppModal>

      <Snackbar
        visible={snackbar.visible}
        message={snackbar.message}
        type={snackbar.type}
        topOffset={HEADER_HEIGHT}
        onDismiss={() => setSnackbar((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

/* -------------------- STYLES -------------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
  tabBar: {
    flexDirection: "row",
    height: 50,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  tabText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  contentContainer: {
    flex: 1,
  },
  content: {
    paddingTop: 4,
    gap: 4,
  },
  card: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 4,
    alignItems: "center",
    marginHorizontal: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  detailsContainer: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 2,
  },
  dept: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  wishButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginTop: 10,
  },
  wishButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.3,
  },
  infoText: {
    fontSize: 14,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBody: {
    paddingHorizontal: 18,
    paddingBottom: 18,
    paddingTop: 8,
    gap: 12,
  },
  modalRow: {
    gap: 4,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  modalValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 110,
  },
  modalFooterActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  modalButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 4,
    minWidth: 96,
    alignItems: "center",
  },
  modalCancel: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  modalButtonText: {
    fontSize: 13,
    fontWeight: "700",
  },
  modalButtonPrimaryText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
});
