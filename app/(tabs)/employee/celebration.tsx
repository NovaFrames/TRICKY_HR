import ProfileImage from "@/components/common/ProfileImage";
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
  const [routes] = useState([
    { key: "birthday", title: "BIRTHDAY", icon: "gift-outline" },
    { key: "work", title: "WORK ANNIVERSARY", icon: "ribbon-outline" },
    { key: "wedding", title: "WEDDING", icon: "heart-outline" },
  ]);

  useProtectedBack({ home: "/home" });

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

  const renderCards = (list: any[], type: string) => {
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
      <View
        key={item.EmpIdN}
        style={[
          styles.card,
          { backgroundColor: theme.cardBackground, shadowColor: theme.text },
        ]}
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
        </View>
      </View>
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
});
