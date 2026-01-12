import Header from "@/components/Header";
import RequestStatusItem from "@/components/RequestPage/RequestStatusItem";
import SegmentTabs from "@/components/SegmentTabs";
import { API_ENDPOINTS } from "@/constants/api";
import { useTheme } from "@/context/ThemeContext";
import { useUser } from "@/context/UserContext";
import { useProtectedBack } from "@/hooks/useProtectedBack";
import { getDomainUrl } from "@/services/urldomain";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  State,
} from 'react-native-gesture-handler';


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

  const onSwipeEnd = (event: PanGestureHandlerGestureEvent) => {
    if (event.nativeEvent.state !== State.END) return;

    const { translationX } = event.nativeEvent;

    // swipe left → Approved → Rejected
    if (translationX < -60 && activeTab === 'Approved') {
      setActiveTab('Rejected');
    }

    // swipe right → Rejected → Approved
    if (translationX > 60 && activeTab === 'Rejected') {
      setActiveTab('Approved');
    }
  };


  const [activeTab, setActiveTab] = useState<"Approved" | "Rejected">(
    "Approved"
  );
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

      const endpoint =
        activeTab === "Approved"
          ? API_ENDPOINTS.SUP_DETAPPROVE_URL
          : API_ENDPOINTS.SUP_GETREJECT_URL;

      const response = await axios.post(
        `${domainUrl}${endpoint}`,
        { TokenC: user?.TokenC }
      );

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
  }, [activeTab]);

  /* ---------------- HELPERS ---------------- */

  const TABS: Array<'Approved' | 'Rejected'> = ['Approved', 'Rejected'];

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

  const renderListHeader = () => (
    <View>
      <Header title="Approval Requests" />

      <SegmentTabs
        tabs={TABS}
        activeTab={activeTab}
        onChange={setActiveTab}
      />
    </View>
  );

  /* ---------------- UI ---------------- */

  return (

    <PanGestureHandler
      onHandlerStateChange={onSwipeEnd}
      activeOffsetX={[-30, 30]}
      failOffsetY={[-30, 30]}
    >
      <View style={styles.container}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.placeholder }]}>
              Loading requests...
            </Text>
          </View>
        ) : (
          <FlatList
            ListHeaderComponent={renderListHeader}
            data={data}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={[styles.emptyIconBox, { backgroundColor: theme.inputBg }]}>
                  <Ionicons
                    name="document-text-outline"
                    size={48}
                    color={theme.placeholder}
                  />
                </View>
                <Text style={[styles.emptyTitle, { color: theme.text }]}>
                  No {activeTab} Requests
                </Text>
                <Text style={[styles.emptySubtitle, { color: theme.placeholder }]}>
                  When you have {activeTab.toLowerCase()} requests, they will appear here.
                </Text>
              </View>
            }
          />
        )}
      </View>
    </PanGestureHandler>
  );
}

/* ---------------- SMALL COMPONENTS ---------------- */

/* ---------------- STYLES ---------------- */

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
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
      borderRadius: 30,
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
