import Header from "@/components/Header";
import { API_ENDPOINTS } from "@/constants/api";
import { useTheme } from "@/context/ThemeContext";
import { useUser } from "@/context/UserContext";
import { useProfileImage } from "@/hooks/useGetImage";
import { useProtectedBack } from "@/hooks/useProtectedBack";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

/* -------------------- HELPERS -------------------- */
const parseDotNetDate = (value?: string) => {
    if (!value) return '';
    const match = /\/Date\((\d+)\)\//.exec(value);
    if (!match) return '';
    const date = new Date(Number(match[1]));
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};

/* -------------------- TABS -------------------- */
type TabKey = 'birthday' | 'wedding' | 'work';

export default function Celebration() {
    const { theme } = useTheme();
    const { user } = useUser();

    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<TabKey>('birthday');

    useProtectedBack({ home: '/home' });

    const fetchCelebration = async () => {
        try {
            const payload = {
                TokenC: user?.TokenC,
                Type: 1,
            };

            const response = await axios.post(
                `${API_ENDPOINTS.CompanyUrl}${API_ENDPOINTS.CELEBRATION}`,
                payload
            );

            if (response.data.Status === "success") {
                setData(response.data.DashData?.[0] ?? {});
            } else {
                setData({});
            }
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

    const profileUrl = (item: any) => {
        console.log("from celebration item:", item)
        return useProfileImage(user?.CustomerIdC, user?.CompIdN, item?.EmpIdN)
    };

    const renderCards = (list: any[], type: TabKey) => {
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
            <View key={item.EmpIdN} style={[styles.card, { backgroundColor: theme.cardBackground, shadowColor: theme.text }]}>
                <View style={[styles.iconContainer, { backgroundColor: theme.inputBg }]}>
                    <Image
                        source={
                            { uri: profileUrl(item) }
                        }
                        style={{
                            marginTop: 0,
                            width: 60, // Reduced from 140
                            height: 60, // Reduced from 35
                            resizeMode: 'cover',
                            borderRadius: 100,
                        }}
                    />
                </View>
                <View style={styles.detailsContainer}>
                    <Text style={[styles.name, { color: theme.text }]}>{item.EmpNameC}</Text>
                    <Text style={[styles.dept, { color: theme.textLight }]}>{item.DeptNameC}</Text>

                    <View style={styles.infoRow}>
                        {type === 'birthday' && (
                            <>
                                <Ionicons name="gift-outline" size={16} color={theme.primary} />
                                <Text style={[styles.infoText, { color: theme.primary }]}>
                                    Birthday: {parseDotNetDate(item.BirthDateD)}
                                </Text>
                            </>
                        )}

                        {type === 'work' && (
                            <>
                                <Ionicons name="star-outline" size={16} color={theme.primary} />
                                <Text style={[styles.infoText, { color: theme.primary }]}>
                                    {item.ServiceN} Years of Excellence
                                </Text>
                            </>
                        )}

                        {type === 'wedding' && (
                            <>
                                <Ionicons name="heart-outline" size={16} color={theme.primary} />
                                <Text style={[styles.infoText, { color: theme.primary }]}>
                                    Anniversary: {parseDotNetDate(item.MarriageDateD)}
                                </Text>
                            </>
                        )}
                    </View>
                </View>
            </View>
        ));
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Header title="Celebrations" />

            {/* ----------- TABS ----------- */}
            <View style={[styles.tabContainer, { backgroundColor: theme.inputBg }]}>
                {[
                    { key: 'birthday', label: 'Birthday', icon: 'gift-outline' },
                    { key: 'work', label: 'Work', icon: 'ribbon-outline' },
                    { key: 'wedding', label: 'Wedding', icon: 'heart-outline' },
                ].map(tab => (
                    <TouchableOpacity
                        key={tab.key}
                        onPress={() => setActiveTab(tab.key as TabKey)}
                        style={[
                            styles.tab,
                            activeTab === tab.key && {
                                backgroundColor: theme.primary,
                                elevation: 4,
                                shadowColor: theme.primary,
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.3,
                                shadowRadius: 4,
                            },
                        ]}
                    >
                        <Ionicons
                            name={tab.icon as any}
                            size={18}
                            color={activeTab === tab.key ? '#fff' : theme.textLight}
                        />
                        <Text
                            style={[
                                styles.tabText,
                                {
                                    color: activeTab === tab.key ? '#fff' : theme.textLight,
                                }
                            ]}
                        >
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* ----------- CONTENT ----------- */}
            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />
                }
            >
                {activeTab === 'birthday' && renderCards(birthdays, 'birthday')}
                {activeTab === 'wedding' && renderCards(weddings, 'wedding')}
                {activeTab === 'work' && renderCards(workAnniv, 'work')}
            </ScrollView>
        </View>
    );
}

/* -------------------- STYLES -------------------- */
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    tabContainer: {
        flexDirection: 'row',
        margin: 16,
        borderRadius: 16,
        padding: 6,
        gap: 4,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        gap: 6,
    },
    tabText: {
        fontSize: 13,
        fontWeight: '700',
    },
    content: {
        paddingHorizontal: 16,
        paddingBottom: 30,
        gap: 12,
    },
    card: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 20,
        alignItems: 'center',
        elevation: 3,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    detailsContainer: {
        flex: 1,
    },
    name: {
        fontSize: 17,
        fontWeight: '800',
        marginBottom: 2,
    },
    dept: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    infoText: {
        fontSize: 14,
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
        gap: 16,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
