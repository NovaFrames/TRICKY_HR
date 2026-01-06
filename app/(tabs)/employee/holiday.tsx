import Header from "@/components/Header";
import { API_ENDPOINTS } from "@/constants/api";
import { useTheme } from "@/context/ThemeContext";
import { useUser } from "@/context/UserContext";
import { useProtectedBack } from "@/hooks/useProtectedBack";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function Holiday() {
    const { user } = useUser();
    const { theme } = useTheme();

    const [holidayData, setHolidayData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedYear, setSelectedYear] = useState(
        new Date().getFullYear().toString()
    );

    useProtectedBack({ home: "/home" });

    /* ---------------- HELPERS ---------------- */

    const parseDotNetDate = (dateStr: string) => {
        const timestamp = Number(dateStr.replace(/[^0-9]/g, ""));
        return new Date(timestamp);
    };

    const changeYear = (direction: "prev" | "next") => {
        setSelectedYear((prev) => {
            const year = Number(prev);
            if (direction === "prev")
                return String(year - 1);
            if (direction === "next")
                return String(year + 1);
            return prev;
        });
    };

    /* ---------------- API ---------------- */

    const fetchHoliday = async () => {
        try {
            const payload = {
                TokenC: user?.TokenC,
                Year: selectedYear,
            };

            const response = await axios.post(
                `${API_ENDPOINTS.CompanyUrl}${API_ENDPOINTS.HOLIDAY}`,
                payload
            );

            setHolidayData(response.data?.Holiday ?? []);
        } catch (error) {
            console.error("Holiday API error:", error);
            setHolidayData([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchHoliday();
    }, [selectedYear]);

    /* ---------------- RENDER ITEM ---------------- */

    const renderHolidayItem = ({ item }: any) => {
        const date = parseDotNetDate(item.HolidayDateD);

        return (
            <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
                <View style={[styles.dateBox, { backgroundColor: theme.primary }]}>
                    <Text style={styles.dateDay}>{date.getDate()}</Text>
                    <Text style={styles.dateMonth}>
                        {date.toLocaleString("default", { month: "short" })}
                    </Text>
                </View>

                <View style={styles.info}>
                    <Text style={[styles.name, { color: theme.text }]}>
                        {item.HolidayNameC}
                    </Text>
                    <Text style={[styles.day, { color: theme.textLight }]}>
                        {date.toLocaleString("default", { weekday: "long" })} •{" "}
                        {item.HolidayGrpNameC}
                    </Text>
                </View>
            </View>
        );
    };

    /* ---------------- UI ---------------- */

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Header title="Holidays" />

            {/* YEAR SWITCHER */}
            <View style={[styles.yearSwitcher, { backgroundColor: theme.cardBackground }]}>
                <TouchableOpacity
                    onPress={() => changeYear("prev")}
                >
                    <Ionicons
                        name="chevron-back"
                        size={26}
                        
                    />
                </TouchableOpacity>

                <Text style={[styles.yearText, { color: theme.text }]}>
                    {selectedYear}
                </Text>

                <TouchableOpacity
                    onPress={() => changeYear("next")}
                >
                    <Ionicons
                        name="chevron-forward"
                        size={26}
                       
                    />
                </TouchableOpacity>
            </View>

            {/* LIST */}
            {loading ? (
                <ActivityIndicator
                    size="large"
                    color={theme.primary}
                    style={{ marginTop: 40 }}
                />
            ) : (
                <FlatList
                    data={holidayData}
                    renderItem={renderHolidayItem}
                    keyExtractor={(_, index) => index.toString()}
                    contentContainerStyle={{ padding: 16 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={fetchHoliday}
                            colors={[theme.primary]}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Ionicons
                                name="calendar-outline"
                                size={64}
                                color={theme.textLight}
                            />
                            <Text
                                style={{
                                    marginTop: 12,
                                    color: theme.textLight,
                                    fontSize: 16,
                                }}
                            >
                                No holidays found for {selectedYear}
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

    yearSwitcher: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginHorizontal: 16,
        marginTop: 12,
        marginBottom: 6,
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 14,
        elevation: 3,
    },

    yearText: {
        fontSize: 20,
        fontWeight: "700",
        letterSpacing: 1,
    },

    card: {
        flexDirection: "row",
        padding: 14,
        borderRadius: 4,
        marginBottom: 2,
        elevation: 2,
    },

    dateBox: {
        width: 62,
        height: 62,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },

    dateDay: {
        color: "#fff",
        fontSize: 22,
        fontWeight: "bold",
    },

    dateMonth: {
        color: "#fff",
        fontSize: 12,
        textTransform: "uppercase",
        marginTop: -2,
    },

    info: {
        flex: 1,
        marginLeft: 14,
        justifyContent: "center",
    },

    name: {
        fontSize: 16,
        fontWeight: "600",
    },

    day: {
        fontSize: 13,
        marginTop: 4,
    },

    empty: {
        alignItems: "center",
        marginTop: 80,
    },
});
