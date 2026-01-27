import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/context/ThemeContext";
import ApiService from "@/services/ApiService";

type ScheduleProps = {
  DateD: string | number;
  ShiftNameC: string;
  ReasonNameC: string;
};

export const Schedule = () => {
  const { theme, isDark } = useTheme();
  const [shedule, setShedule] = useState<ScheduleProps[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await ApiService.getEmpDashBoardList();
        const sheduleData = data.Schedule;
        // Ensure array
        setShedule(Array.isArray(sheduleData) ? sheduleData : []);
      } catch (err) {
        console.error("Team fetch error:", err);
        setShedule([]);
      }
    };

    fetchData();
  }, []);

  const parseScheduleDate = (val: string | number) => {
    if (!val) return null;
    if (typeof val === "string" && val.includes("/Date(")) {
      const match = val.match(/\/Date\((-?\d+)\)\//);
      if (!match) return null;
      const timestamp = parseInt(match[1], 10);
      const parsed = new Date(timestamp);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    const parsed = new Date(val);
    return isNaN(parsed.getTime()) ? null : parsed;
  };

  const sortedSchedule = useMemo(() => {
    return [...shedule].sort((a, b) => {
      const aDate = parseScheduleDate(a.DateD)?.getTime() ?? 0;
      const bDate = parseScheduleDate(b.DateD)?.getTime() ?? 0;
      return aDate - bDate;
    });
  }, [shedule]);

  const getReasonStyle = (reason: string) => {
    if (!reason) {
      return { bg: theme.primary + "14", text: theme.primary };
    }
    const r = reason.toLowerCase();
    if (r.includes("abs") || r.includes("leave") || r.includes("off")) {
      return { bg: "#FEE2E2", text: "#DC2626" };
    }
    return { bg: theme.inputBg, text: theme.text };
  };

  return (
   <View style={styles.wrapper}>
  <View
    style={[
      styles.card,
      { backgroundColor: theme.cardBackground },
    ]}
  >
    {sortedSchedule.length === 0 ? (
      <Text style={[styles.emptyText, { color: theme.textLight }]}>
        No upcoming schedule
      </Text>
    ) : (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        {sortedSchedule.map((item, index) => {
          const parsedDate = parseScheduleDate(item.DateD);
          const weekday = parsedDate?.toLocaleDateString("en-US", {
            weekday: "short",
          });
          const day = parsedDate?.getDate();
          const month = parsedDate?.toLocaleDateString("en-US", {
            month: "short",
          });

          const reason = item.ReasonNameC?.trim();
          const reasonStyle = getReasonStyle(reason || "");

          return (
            <View
              key={`${item.DateD}-${index}`}
              style={[
                styles.scheduleCard,
                { backgroundColor: theme.inputBg },
              ]}
            >
              {/* Date */}
              <View style={styles.dateColumn}>
                <Text style={[styles.weekday, { color: theme.textLight }]}>
                  {weekday}
                </Text>
                <Text style={[styles.day, { color: theme.text }]}>
                  {day}
                </Text>
                <Text style={[styles.month, { color: theme.textLight }]}>
                  {month}
                </Text>
              </View>

              {/* Info */}
              <View style={styles.infoColumn}>
                <Text
                  numberOfLines={1}
                  style={[styles.shift, { color: theme.text }]}
                >
                  {item.ShiftNameC || "General Shift"}
                </Text>

                <View
                  style={[
                    styles.reasonPill,
                    { backgroundColor: reasonStyle.bg },
                  ]}
                >
                  <Text
                    style={[
                      styles.reasonText,
                      { color: reasonStyle.text },
                    ]}
                  >
                    {reason || "Scheduled"}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
    )}
  </View>
</View>

  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 0,
  },

  card: {
    borderRadius: 8,
    paddingVertical: 12,
  },

  headerRow: {
    paddingHorizontal: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  title: {
    fontSize: 16,
    fontWeight: "700",
  },

  subtitle: {
    fontSize: 12,
    fontWeight: "500",
  },

  list: {
    paddingHorizontal: 12,
  },

  scheduleCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 4,
    padding: 12,
    marginRight: 4,
    minWidth: 180,
  },

  dateColumn: {
    alignItems: "center",
    marginRight: 12,
    width: 44,
  },

  weekday: {
    fontSize: 11,
    fontWeight: "600",
  },

  day: {
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 26,
  },

  month: {
    fontSize: 11,
    fontWeight: "500",
  },

  infoColumn: {
    flex: 1,
  },

  shift: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },

  reasonPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },

  reasonText: {
    fontSize: 11,
    fontWeight: "600",
  },

  emptyText: {
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});

