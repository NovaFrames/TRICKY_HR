import Header, { HEADER_HEIGHT } from "@/components/Header";
import RequestStatusItem from "@/components/RequestPage/RequestStatusItem";
import { API_ENDPOINTS } from "@/constants/api";
import { useTheme } from "@/context/ThemeContext";
import { useUser } from "@/context/UserContext";
import { useProtectedBack } from "@/hooks/useProtectedBack";
import { getDomainUrl } from "@/services/urldomain";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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

/* ---------------- COMPONENT ---------------- */

export default function ApprovalDetails() {
  const { user } = useUser();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const originFrom = typeof from === "string" ? from : "home";

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "approved", title: "APPROVED" },
    { key: "rejected", title: "REJECTED" },
  ]);

  const [data, setData] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(false);

  useProtectedBack({
    home: "/home",
    settings: "/settings",
    dashboard: "/dashboard",
  });

  /* ---------------- API ---------------- */

  const fetchData = async () => {
    try {
      setLoading(true);

      const domainUrl = await getDomainUrl();
      const currentTab = routes[index].key;

      const endpoint =
        currentTab === "approved"
          ? API_ENDPOINTS.SUP_DETAPPROVE_URL
          : API_ENDPOINTS.SUP_GETREJECT_URL;

      const response = await axios.post(`${domainUrl}${endpoint}`, {
        TokenC: user?.TokenC,
      });

      if (response.data?.Status === "success") {
        setData(response.data.data || []);
      } else {
        setData([]);
      }
    } catch (error) {
      console.error("Approval API error:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [index]);

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
      onPress={() =>
        router.push({
          pathname: "/(tabs)/officer/approvalreqdetails",
          params: {
            details: JSON.stringify(item),
            from: "approvaldetails",
            parentFrom: originFrom,
          },
        })
      }
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
