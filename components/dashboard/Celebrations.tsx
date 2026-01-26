import AppModal from "@/components/common/AppModal";
import ProfileImage from "@/components/common/ProfileImage";
import Snackbar from "@/components/common/Snackbar";
import { HEADER_HEIGHT } from "@/components/Header";
import { formatDisplayDate } from "@/constants/timeFormat";
import { useTheme } from "@/context/ThemeContext";
import { useUser } from "@/context/UserContext";
import { useProtectedBack } from "@/hooks/useProtectedBack";
import ApiService from "@/services/ApiService";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

/* -------------------- COMPONENT -------------------- */

export default function Celebrations() {
    const { theme } = useTheme();
    const { user } = useUser();

    useProtectedBack({ home: "/dashboard" });

    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [userMail, setUserMail] = useState<any | null>(null);

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

    const MAX_ITEMS = 3;

    /* -------------------- HELPERS -------------------- */

    const showSnackbar = (
        message: string,
        type: "info" | "error" | "success" = "info",
    ) => setSnackbar({ visible: true, message, type });

    const normalizeEmail = (v?: string) =>
        typeof v === "string" ? v.trim() : "";

    const isValidEmail = (v: string) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

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

    /* -------------------- API -------------------- */

    const fetchUserData = async () => {
        try {
            if (!user?.TokenC) return;
            const res = await ApiService.getUserProfile(user.TokenC);
            setUserMail(res?.data?.[0]?.empProfile ?? null);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchCelebrations = async () => {
        try {
            if (!user?.TokenC) return;
            const res = await ApiService.getCelebrationData(user.TokenC, 1);
            setData(res);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchUserData();
        fetchCelebrations();
    }, [user]);

    /* -------------------- WISH FLOW -------------------- */

    const openWishesModal = (
        item: any,
        type: "birthday" | "work" | "wedding",
    ) => {
        const mailFrom = normalizeEmail(userMail?.EmailIdC);
        const mailTo = normalizeEmail(item?.EmailIdC);

        if (!isValidEmail(mailFrom) || !isValidEmail(mailTo)) {
            showSnackbar("Email id not found", "error");
            return;
        }

        setSelectedEmp({
            ...item,
            mailFrom,
            mailTo,
            wishType: type,
        });

        setWishesTitle(getWishSubject(type));
        setWishesBody("");
        setWishModalVisible(true);
    };

    const closeWishesModal = () => {
        if (wishSending) return;
        setWishModalVisible(false);
        setSelectedEmp(null);
        setWishesTitle("");
        setWishesBody("");
    };

    const handleSendWishes = async () => {
        if (!selectedEmp) return;

        try {
            setWishSending(true);

            const res = await ApiService.sendEmailWishes({
                EmpName: selectedEmp.EmpNameC,
                mailFrom: selectedEmp.mailFrom,
                mailTo: selectedEmp.mailTo,
                mailToCC: user?.EmpNameC || "",
                subject: wishesTitle,
                body: wishesBody,
                TokenC: user?.TokenC,
            });

            if (res?.Status === "success") {
                showSnackbar("Wishes sent successfully", "success");
                closeWishesModal();
            } else {
                showSnackbar(res?.Error || "Unable to send wishes", "error");
            }
        } catch (e: any) {
            showSnackbar(e?.message || "Unable to send wishes", "error");
        } finally {
            setWishSending(false);
        }
    };

    /* -------------------- COMBINED UPCOMING DATA -------------------- */

    const upcomingCelebrations = [
        ...(data?.DashBoardBirdth ?? []).map((i: any) => ({
            ...i,
            type: "birthday" as const,
            date: i.BirthDateD,
        })),
        ...(data?.DashBoardAnniversary ?? []).map((i: any) => ({
            ...i,
            type: "wedding" as const,
            date: i.MarriageDateD,
        })),
        ...(data?.DashEmpService ?? []).map((i: any) => ({
            ...i,
            type: "work" as const,
            date: i.ServiceDateD ?? new Date(),
        })),
    ]
        .sort(
            (a, b) =>
                new Date(a.date).getTime() - new Date(b.date).getTime(),
        )
        .slice(0, MAX_ITEMS);

    /* -------------------- RENDER -------------------- */

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.cardBackground }]}>
            <ScrollView
                contentContainerStyle={styles.dashboard}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => {
                            setRefreshing(true);
                            fetchCelebrations();
                        }}
                    />
                }
            >
                <View
                    style={[
                        styles.sectionCard,
                        { backgroundColor: theme.cardBackground },
                    ]}
                >
                    {/* <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Upcoming Celebrations
            </Text>
          </View> */}

                    {upcomingCelebrations.length === 0 ? (
                        <Text style={[styles.sectionEmpty, { color: theme.textLight }]}>
                            No upcoming celebrations
                        </Text>
                    ) : (
                        upcomingCelebrations.map((item) => (
                            <TouchableOpacity
                                key={`${item.EmpIdN}-${item.type}`}
                                style={[styles.sectionItem, { backgroundColor: theme.inputBg }]}
                                onPress={() => openWishesModal(item, item.type)}
                            >
                                <ProfileImage
                                    customerIdC={user?.CustomerIdC}
                                    compIdN={user?.CompIdN}
                                    empIdN={item.EmpIdN}
                                    size={42}
                                />

                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.itemName, { color: theme.text }]}>
                                        {item.EmpNameC}
                                    </Text>

                                    <View style={styles.metaRow}>
                                        <Ionicons
                                            name={
                                                item.type === "birthday"
                                                    ? "gift-outline"
                                                    : item.type === "wedding"
                                                        ? "heart-outline"
                                                        : "ribbon-outline"
                                            }
                                            size={14}
                                            color={theme.primary}
                                        />
                                        <Text
                                            style={[
                                                styles.itemSub,
                                                { color: theme.textLight },
                                            ]}
                                        >
                                            {item.type === "birthday" &&
                                                `Birthday • ${formatDisplayDate(
                                                    item.BirthDateD,
                                                )}`}
                                            {item.type === "wedding" &&
                                                `Wedding • ${formatDisplayDate(
                                                    item.MarriageDateD,
                                                )}`}
                                            {item.type === "work" &&
                                                `Work Anniversary • ${item.ServiceN} Years`}
                                        </Text>
                                    </View>
                                </View>

                                <Ionicons
                                    name="chevron-forward"
                                    size={18}
                                    color={theme.textLight}
                                />
                            </TouchableOpacity>
                        ))
                    )}
                </View>
            </ScrollView>

            {/* MODAL */}
            <AppModal
                visible={wishModalVisible}
                onClose={closeWishesModal}
                title="Send Wishes"
                subtitle={selectedEmp?.EmpNameC}
            >
                <View style={styles.modalBody}>
                    <TextInput
                        value={wishesTitle}
                        editable={false}
                        style={[styles.input, { backgroundColor: theme.inputBg, color: theme.textLight }]}
                    />
                    <TextInput
                        value={wishesBody}
                        onChangeText={setWishesBody}
                        placeholder="Write your wishes..."
                        placeholderTextColor={theme.textLight} // 👈 THIS
                        multiline
                        style={[
                            styles.textArea,
                            {
                                backgroundColor: theme.inputBg,
                                color: theme.text, // actual typed text color
                            },
                        ]}
                    />

                    <TouchableOpacity
                        style={[styles.sendBtn, { backgroundColor: theme.primary }]}
                        onPress={handleSendWishes}
                    >
                        {wishSending ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.sendText}>Send Wishes</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </AppModal>

            <Snackbar
                visible={snackbar.visible}
                message={snackbar.message}
                type={snackbar.type}
                topOffset={HEADER_HEIGHT}
                onDismiss={() =>
                    setSnackbar((p) => ({ ...p, visible: false }))
                }
            />
        </View>
    );
}

/* -------------------- STYLES -------------------- */

const styles = StyleSheet.create({
    container: { flex: 1 },
    dashboard: { padding: 16 },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },

    sectionCard: { borderRadius: 8, gap: 4 },
    sectionHeader: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 12,
        alignItems: "center",
    },
    sectionTitle: { fontSize: 15, fontWeight: "800" },
    sectionEmpty: { fontSize: 13, paddingVertical: 8 },

    sectionItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 4,
    },

    itemName: { fontSize: 14, fontWeight: "700" },
    itemSub: { fontSize: 12 },

    metaRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },

    modalBody: { padding: 16, gap: 12 },
    input: { borderWidth: 1, borderRadius: 6, padding: 10 },
    textArea: {
        borderWidth: 1,
        borderRadius: 6,
        padding: 10,
        minHeight: 100,
    },
    sendBtn: {
        padding: 14,
        borderRadius: 6,
        alignItems: "center",
    },
    sendText: { color: "#fff", fontWeight: "700" },
});
