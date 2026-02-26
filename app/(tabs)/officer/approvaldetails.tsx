import ApprovalClaimModal from "@/components/ApprovalRejectedModals/ApprovalClaimModal";
import ApprovalLeaveModal from "@/components/ApprovalRejectedModals/ApprovalLeaveModal";
import ApprovalTimeModal from "@/components/ApprovalRejectedModals/ApprovalTimeModal";
import DatePicker from "@/components/DatePicker";
import Header, { HEADER_HEIGHT } from "@/components/Header";
import DocModal from "@/components/RequestPage/DocModal";
import LeaveSurrenderModal from "@/components/RequestPage/LeaveSurrenderModal";
import ProfileModal from "@/components/RequestPage/ProfileModal";
import RequestModal from "@/components/RequestPage/RequestModal";
import RequestStatusItem from "@/components/RequestPage/RequestStatusItem";
import { API_ENDPOINTS } from "@/constants/api";
import { useTheme } from "@/context/ThemeContext";
import { useUser } from "@/context/UserContext";
import { useProtectedBack } from "@/hooks/useProtectedBack";
import { api, ensureBaseUrl } from "@/services/ApiService";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

/* ---------------- TYPES ---------------- */

type ApprovalItem = {
  IdN: number;
  NameC: string;
  CodeC: string;
  DescC: string;
  LvDescC: string;
  FromDateC: string;
  ToDateC: string;
  StatusC: string;
  ApproveRejDateD: string;
  ApplyDateD: string;
};

type ApprovalMode = "approved" | "rejected";

const addMonths = (date: Date, months: number) => {
  const newDate = new Date(date);
  const day = newDate.getDate();
  newDate.setMonth(newDate.getMonth() + months);
  if (newDate.getDate() !== day) {
    newDate.setDate(0);
  }
  return newDate;
};

const formatDateDDMMMYYYY = (date: Date) => {
  const day = date.getDate().toString().padStart(2, "0");
  const month = date.toLocaleString("en-GB", { month: "short" }); // Feb
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
};

const today = new Date();
const defaultFromDate = addMonths(today, -1);

/* ---------------- COMPONENT ---------------- */

export default function ApprovalDetails() {
  const { user } = useUser();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { from } = useLocalSearchParams<{ from?: string }>();
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ApprovalItem | null>(null);


  const [index, setIndex] = useState(0);

  const [routes] = useState<{ key: ApprovalMode; title: string }[]>([
    { key: "approved", title: "APPROVED" },
    { key: "rejected", title: "REJECTED" },
  ]);

  const currentmode = routes[index].key;

  const [data, setData] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [fromDate, setFromDate] = useState<Date>(defaultFromDate);
  const [toDate, setToDate] = useState<Date>(today);

  useEffect(() => {
    setToDate(addMonths(fromDate, 1));
  }, [fromDate]);

  useProtectedBack({
    home: "/home",
    settings: "/settings",
    dashboard: "/dashboard",
    approvalreqdetails:
      typeof from === "string"
        ? { pathname: "/(tabs)/officer/approvaldetails", params: { from } }
        : "/(tabs)/officer/approvaldetails",
  });

  /* ---------------- API ---------------- */

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      if (!user?.TokenC) {
        setData([]);
        return;
      }
      await ensureBaseUrl();
      const currentTab = routes[index].key;

      const endpoint =
        currentTab === "approved"
          ? API_ENDPOINTS.SUP_DETAPPROVEFT_URL
          : API_ENDPOINTS.SUP_GETREJECTFT_URL;

      const response = await api.post(endpoint, {
        TokenC: user?.TokenC,
        EmpIdN: user?.EmpIdN,
        FromDate: formatDateDDMMMYYYY(fromDate),
        ToDate: formatDateDDMMMYYYY(toDate),
      });

      console.log("From Date: ", formatDateDDMMMYYYY(fromDate), "To Date: ", formatDateDDMMMYYYY(toDate));

      if (response.data?.Status === "success") {
        const rows = response.data?.data || response.data?.xx || [];
        setData(Array.isArray(rows) ? rows : []);
      } else {
        setData([]);
      }
    } catch (error) {
      console.error("Approval API error:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [fromDate, index, routes, toDate, user?.EmpIdN, user?.TokenC]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ---------------- SWIPE GESTURES ---------------- */

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

  /* ---------------- HELPERS ---------------- */

  const activeTabName = routes[index].title;

  /* ---------------- RENDER ITEM ---------------- */

  const renderItem = ({ item }: { item: ApprovalItem }) => (
    <RequestStatusItem
      item={{
        ...item,
        DescC: item.DescC ? `${item.NameC} • ${item.DescC}` : item.NameC,
        applyDateD: item.ApplyDateD,
      }}
      status={false}
      onPress={() => {
        setSelectedItem(item);
        setShowModal(true);
      }}
    />
  );

  /* ---------------- UI ---------------- */

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header title="Approval Requests" />

      <View style={{ paddingTop: HEADER_HEIGHT + 4, flex: 1 }}>
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

        <View style={styles.datePickerSection}>
          <DatePicker
            fromDate={fromDate}
            toDate={toDate}
            onFromChange={setFromDate}
          />
        </View>

        {/* Content Area with Swipe Support */}
        <View
          style={{ flex: 1, marginHorizontal: 16 }}
          {...panResponder.panHandlers}
        >
          {loading ? (
            <View
              style={[styles.center, { backgroundColor: theme.background }]}
            >
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={[styles.loadingText, { color: theme.textLight }]}>
                Loading requests...
              </Text>
            </View>
          ) : (
            <FlatList
              data={data}
              keyExtractor={(item, index) => index.toString()}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <View
                    style={[
                      styles.emptyIconBox,
                      { backgroundColor: theme.inputBg },
                    ]}
                  >
                    <Ionicons
                      name="document-text-outline"
                      size={48}
                      color={theme.placeholder}
                    />
                  </View>
                  <Text style={[styles.emptyTitle, { color: theme.text }]}>
                    No {activeTabName} Requests
                  </Text>
                  <Text
                    style={[styles.emptySubtitle, { color: theme.placeholder }]}
                  >
                    When you have {activeTabName.toLowerCase()} requests, they
                    will appear here.
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </View>
      {showModal &&
        selectedItem &&
        (selectedItem.DescC?.toLowerCase().includes("claim") ? (
          <ApprovalClaimModal
            visible={showModal}
            mode={currentmode}
            item={selectedItem}
            onClose={() => {
              setShowModal(false);
              setSelectedItem(null);
            }}
            onRefresh={fetchData}
            onSuccess={() => {
              setShowModal(false);
              setSelectedItem(null);
              fetchData();
            }}
          />
        ) : selectedItem.DescC?.toLowerCase().includes("profile") ? (
          <ProfileModal
            visible={showModal}
            item={selectedItem}
            onClose={() => {
              setShowModal(false);
              setSelectedItem(null);
            }}
            onRefresh={fetchData}
          />
        ) : selectedItem.DescC?.toLowerCase().includes("time") ? (
          <ApprovalTimeModal
            visible={showModal}
            mode="approval"
            item={selectedItem}
            onClose={() => {
              setShowModal(false);
              setSelectedItem(null);
            }}
            onRefresh={fetchData}
          />
        ) : selectedItem.DescC?.toLowerCase().includes("document") ? (
          <DocModal
            visible={showModal}
            item={selectedItem}
            onClose={() => {
              setShowModal(false);
              setSelectedItem(null);
            }}
            onRefresh={fetchData}
          />
        ) : selectedItem.DescC?.toLowerCase().includes("surrender") ? (
          <LeaveSurrenderModal
            visible={showModal}
            item={selectedItem}
            onClose={() => {
              setShowModal(false);
              setSelectedItem(null);
            }}
            onRefresh={fetchData}
          />
        ) : selectedItem.DescC?.toLowerCase().includes("leave") ? (
          <ApprovalLeaveModal
            visible={showModal}
            item={selectedItem}
            onClose={() => {
              setShowModal(false);
              setSelectedItem(null);
            }}
            onRefresh={fetchData}
          />
        ) : (
          <RequestModal
            visible={showModal}
            item={selectedItem}
            onClose={() => {
              setShowModal(false);
              setSelectedItem(null);
            }}
            onRefresh={fetchData}
          />
        ))}
    </View>
  );
}

/* ---------------- STYLES ---------------- */

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
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
      fontSize: 14,
      fontWeight: "600",
    },
    datePickerSection: {
      paddingHorizontal: 8,
      paddingTop: 8,
    },
    listContent: {
      paddingTop: 10,
      paddingBottom: 120,
    },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      fontWeight: "600",
    },
    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      marginTop: 100,
      paddingHorizontal: 40,
    },
    emptyIconBox: {
      width: 100,
      height: 100,
      borderRadius: 4,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 20,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "800",
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 14,
      textAlign: "center",
      lineHeight: 20,
      fontWeight: "500",
    },
  });
