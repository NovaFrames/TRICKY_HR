import Header, { HEADER_HEIGHT } from "@/components/Header";
import { useUser } from "@/context/UserContext";
import { useProtectedBack } from "@/hooks/useProtectedBack";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  PanResponder,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ClaimModal from "../../../components/RequestPage/ClaimModal";
import DocModal from "../../../components/RequestPage/DocModal";
import LeaveModal from "../../../components/RequestPage/LeaveModal";
import LeaveSurrenderModal from "../../../components/RequestPage/LeaveSurrenderModal";
import ProfileModal from "../../../components/RequestPage/ProfileModal";
import RequestModal from "../../../components/RequestPage/RequestModal";
import RequestStatusItem from "../../../components/RequestPage/RequestStatusItem";
import TimeModal from "../../../components/RequestPage/TimeModal";
import { useTheme } from "../../../context/ThemeContext";
import ApiService from "../../../services/ApiService";

/* ---------------- TYPES ---------------- */

interface EmpRequest {
  DescC: string;
  IdN: number;
  LvDescC: string;
  StatusC: string;
  YearN: number;
  applyDateD: string;
}

interface RequestsState {
  empRequestWating: EmpRequest[];
  empRequestApproved: EmpRequest[];
  empRequestRejected: EmpRequest[];
}

/* ---------------- COMPONENT ---------------- */

export default function EmpRequestPage() {
  const { theme } = useTheme();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "waiting", title: "WAITING" },
    { key: "approved", title: "APPROVED" },
    { key: "rejected", title: "REJECTED" },
  ]);

  const [requests, setRequests] = useState<RequestsState>({
    empRequestWating: [],
    empRequestApproved: [],
    empRequestRejected: [],
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<EmpRequest | null>(null);

  useProtectedBack({
    home: "/home",
    settings: "/settings",
    dashboard: "/dashboard",
  });

  /* ---------------- HELPERS ---------------- */

  const parseDotNetDate = (dateStr: string) =>
    new Date(Number(dateStr.replace(/[^0-9]/g, "")));

  const sortByDateDesc = (arr: EmpRequest[]) =>
    [...arr].sort(
      (a, b) =>
        parseDotNetDate(b.applyDateD).getTime() -
        parseDotNetDate(a.applyDateD).getTime(),
    );

  /* ---------------- API ---------------- */

  const fetchRequests = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const result = await ApiService.getEmpRequestStatus();

      if (result.success && result.data) {
        const data = result.data as any;

        setRequests({
          empRequestWating: sortByDateDesc(data.empRequestWating || []),
          empRequestApproved: sortByDateDesc(data.empRequestApproved || []),
          empRequestRejected: sortByDateDesc(data.empRequestRejected || []),
        });
      } else {
        setRequests({
          empRequestWating: [],
          empRequestApproved: [],
          empRequestRejected: [],
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    // Refetch when tab changes
    fetchRequests();
  }, [index]);

  const onRefresh = () => fetchRequests(true);

  /* ---------------- DATA ---------------- */

  const getFilteredRequests = (): EmpRequest[] => {
    const currentTab = routes[index].key;
    if (currentTab === "waiting") return requests.empRequestWating;
    if (currentTab === "approved") return requests.empRequestApproved;
    if (currentTab === "rejected") return requests.empRequestRejected;
    return [];
  };

  const filteredRequests = getFilteredRequests();

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

  /* ---------------- UI ---------------- */

  const activeTabName = routes[index].title;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Fixed Header */}
      <Header title="Request Status" />

      <View style={{ paddingTop: HEADER_HEIGHT + 6, flex: 1 }}>
        {/* Fixed Tabs */}
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

        {/* Scrollable Content */}
        <View style={{ flex: 1, paddingHorizontal: 16 }} {...panResponder.panHandlers}>
          <FlatList
            data={filteredRequests ?? []}
            keyExtractor={(item, index) =>
              `${item.StatusC?.trim() || "UNKNOWN"}-${item.IdN}-${index}`
            }
            contentContainerStyle={{ paddingTop: 8, paddingBottom: 16 }}
            renderItem={({ item }) => (
              <RequestStatusItem
                item={{ ...item, CodeC: user?.EmpCodeC }}
                onPress={() => {
                  setSelectedItem(item);
                  setModalVisible(true);
                }}
              />
            )}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme.primary]}
                tintColor={theme.primary}
              />
            }
            ListEmptyComponent={
              loading ? null : (
                <View style={styles.emptyContainer}>
                  <Ionicons
                    name="document-text-outline"
                    size={48}
                    color={theme.placeholder}
                  />
                  <Text style={[styles.emptyTitle, { color: theme.text }]}>
                    No {activeTabName} Requests
                  </Text>
                </View>
              )
            }
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>

      {modalVisible &&
        selectedItem &&
        (selectedItem.DescC?.toLowerCase().includes("claim") ? (
          <ClaimModal
            visible={modalVisible}
            item={selectedItem}
            onClose={() => setModalVisible(false)}
            onRefresh={() => fetchRequests(true)}
          />
        ) : selectedItem.DescC?.toLowerCase().includes("profile") ? (
          <ProfileModal
            visible={modalVisible}
            item={selectedItem}
            onClose={() => setModalVisible(false)}
            onRefresh={() => fetchRequests(true)}
          />
        ) : selectedItem.DescC?.toLowerCase().includes("time") ? (
          <TimeModal
            visible={modalVisible}
            item={selectedItem}
            onClose={() => setModalVisible(false)}
            onRefresh={() => fetchRequests(true)}
          />
        ) : selectedItem.DescC?.toLowerCase().includes("document") ? (
          <DocModal
            visible={modalVisible}
            item={selectedItem}
            onClose={() => setModalVisible(false)}
            onRefresh={() => fetchRequests(true)}
          />
        ) : selectedItem.DescC?.toLowerCase().includes("surrender") ? (
          <LeaveSurrenderModal
            visible={modalVisible}
            item={selectedItem}
            onClose={() => setModalVisible(false)}
            onRefresh={() => fetchRequests(true)}
          />
        ) : selectedItem.DescC?.toLowerCase().includes("leave") ? (
          <LeaveModal
            visible={modalVisible}
            item={selectedItem}
            onClose={() => setModalVisible(false)}
            onRefresh={() => fetchRequests(true)}
          />
        ) : (
          <RequestModal
            visible={modalVisible}
            item={selectedItem}
            onClose={() => setModalVisible(false)}
            onRefresh={() => fetchRequests(true)}
          />
        ))}
    </View>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
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
