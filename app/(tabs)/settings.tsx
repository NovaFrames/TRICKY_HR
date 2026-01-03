import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { useProfileImage } from '@/hooks/useGetImage';
import { Feather, FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Image,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

/* -------------------- TYPES ------------------- */

type IconProps = {
    color?: string;
    size?: number;
};


interface SettingItem {
    label: string;
    description?: string;
    icon: React.ReactElement<IconProps>;
    color: string;
    type?: 'navigation' | 'switch' | 'action';
    onPress?: () => void;
}


interface SettingSection {
    title: string;
    items: SettingItem[];
}

/* -------------------- SCREEN -------------------- */
export default function SettingsScreen() {
    const { theme, isDark, toggleTheme, setPrimaryColor } = useTheme();
    const { logout, user } = useUser();
    const router = useRouter();

    const profileImage = useProfileImage(
        user?.CustomerIdC,
        user?.CompIdN,
        user?.EmpIdN
    );

    const handleLogout = async () => {
        await logout();
        router.replace('/');
    };

    /* -------------------- SETTINGS CONFIG -------------------- */
    const SETTINGS_SECTIONS: SettingSection[] = [
        {
            title: 'Account Settings',
            items: [
                {
                    label: 'Profile',
                    description: 'Update your profile information',
                    icon: <FontAwesome5 name="user" />,
                    color: '#3b82f6',
                    onPress: () => {
                        router.push({ pathname: '/(tabs)/employee/profileupdate', params: { from: 'settings' } });
                    },
                },
                {
                    label: 'Personal Information',
                    description: 'Manage your personal details',
                    icon: <Ionicons name="document-text" />,
                    color: '#10b981',
                    onPress: () => { router.push({ pathname: '/settings/PersonalInformation', params: { from: 'settings' } }); },
                },
                {
                    label: 'Address',
                    description: 'Update your address information',
                    icon: <MaterialIcons name="home" />,
                    color: '#ec4899',
                    onPress: () => { },
                },
                {
                    label: 'Security',
                    description: 'Update your security information',
                    icon: <MaterialIcons name="lock" />,
                    color: '#f59e0b',
                    onPress: () => { },
                },
            ],
        },
        {
            title: 'App Preferences',
            items: [
                {
                    label: 'Dark Mode',
                    description: 'Toggle dark theme',
                    icon: <Ionicons name="moon" />,
                    color: '#6366f1',
                    type: 'switch',
                },
                {
                    label: 'Theme Colors',
                    description: 'Customize app colors',
                    icon: <Ionicons name="color-palette" />,
                    color: '#f59e0b',
                    onPress: () => { },
                },
            ],
        },
        {
            title: 'Others',
            items: [
                {
                    label: 'Passport Details',
                    description: 'Update your passport details',
                    icon: <Ionicons name="document-text-outline" />,
                    color: '#64748b',
                    onPress: () => { },
                },
                {
                    label: 'Child Details',
                    description: 'Update your child details',
                    icon: <MaterialIcons name="privacy-tip" />,
                    color: '#8b5cf6',
                    onPress: () => { },
                },
                {
                    label: 'Education Details',
                    description: 'Update your education details',
                    icon: <Ionicons name="help-circle" />,
                    color: '#3b82f6',
                    onPress: () => { },
                },
            ],
        },
        {
            title: 'Logout',
            items: [
                {
                    label: 'Sign Out',
                    description: 'Log out from your account',
                    icon: <Ionicons name="log-out-outline" />,
                    color: '#ef4444',
                    type: 'action',
                    onPress: handleLogout,
                },
            ],
        },
    ];

    /* -------------------- UI COMPONENTS -------------------- */
    const SectionHeader = ({ title }: { title: string }) => (
        <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
                {title}
            </Text>
        </View>
    );

    const THEME_COLORS = [
        { label: 'Orange', value: '#e46a23' },
        { label: 'Indigo', value: '#6366F1' },
        { label: 'Emerald', value: '#10B981' },
    ];

    const SettingsItem = ({
        item,
        isLast,
    }: {
        item: SettingItem;
        isLast: boolean;
    }) => {
        const { setPrimaryColor } = useTheme();

        const rightElement =
            item.type === 'switch' ? (
                <Switch
                    trackColor={{ false: theme.inputBorder, true: `${theme.primary}80` }}
                    thumbColor={isDark ? theme.primary : theme.inputBg}
                    onValueChange={toggleTheme}
                    value={isDark}
                />
            ) : (
                <Feather name="chevron-right" size={20} color={`${theme.text}80`} />
            );

        return (
            <TouchableOpacity
                style={[
                    styles.itemContainer,
                    { backgroundColor: theme.cardBackground },
                    !isLast && {
                        borderBottomWidth: 1,
                        borderBottomColor: theme.inputBorder,
                    },
                ]}
                onPress={item.onPress}
                disabled={item.type === 'switch'}
            >
                <View style={styles.itemLeft}>
                    <View
                        style={[
                            styles.iconContainer,
                            { backgroundColor: `${item.color}15` },
                        ]}
                    >
                        {React.cloneElement(item.icon, {
                            color: item.color,
                            size: 20,
                        })}
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={[styles.itemLabel, { color: theme.text }]}>
                            {item.label}
                        </Text>
                        {item.description && (
                            <Text
                                style={[
                                    styles.itemDescription,
                                    { color: theme.textLight },
                                ]}
                            >
                                {item.description}
                            </Text>
                        )}
                    </View>
                </View>
                {rightElement}
            </TouchableOpacity>
        );
    };

    /* -------------------- RENDER -------------------- */
    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            {/* Settings */}
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <DashboardHeader isDark={isDark} theme={theme} />

                {/* Header */}
                <View style={styles.headerContainer}>
                    <Text style={[styles.screenTitle, { color: theme.text }]}>
                        Settings
                    </Text>

                    <View style={[styles.profileCard, { backgroundColor: theme.cardBackground }]}>
                        <View style={styles.profileContent}>
                            <Image
                                source={{
                                    uri:
                                        profileImage ||
                                        'https://img.freepik.com/premium-vector/avatar-profile-icon-flat-style-male-user-profile-vector-illustration-isolated-background-man-profile-sign-business-concept_157943-38866.jpg',
                                }}
                                style={styles.avatar}
                            />
                            <View style={styles.userInfo}>
                                <Text style={[styles.userName, { color: theme.text }]}>
                                    {user?.EmpNameC}
                                </Text>
                                <Text style={[styles.userId, { color: theme.secondary }]}>
                                    ID: {user?.EmpCodeC}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {SETTINGS_SECTIONS.map((section, sectionIndex) => (
                    <View key={section.title} style={styles.section}>
                        <SectionHeader title={section.title} />
                        {section.items.map((item, index) => (
                            <SettingsItem
                                key={item.label}
                                item={item}
                                isLast={index === section.items.length - 1}
                            />
                        ))}

                        {/* Theme Customization Section Integration */}
                        {section.title === 'App Preferences' && (
                            <View style={styles.themeBadgeSection}>
                                <Text style={[styles.inlineLabel, { color: theme.text }]}>Accent Color</Text>
                                <View style={styles.inlineColorRow}>
                                    {THEME_COLORS.map((color) => {
                                        const isSelected = theme.primary === color.value;
                                        return (
                                            <TouchableOpacity
                                                key={color.value}
                                                style={[
                                                    styles.inlineColorCircle,
                                                    { backgroundColor: color.value },
                                                    isSelected && styles.inlineSelectedCircle
                                                ]}
                                                onPress={() => setPrimaryColor(color.value)}
                                            >
                                                {isSelected && <Feather name="check" size={14} color="#FFF" />}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        )}
                    </View>
                ))}

                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: theme.textLight }]}>
                        Version 1.0.0 • © 2026 Novaframes
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

/* -------------------- STYLES -------------------- */
const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingBottom: 100 },
    headerContainer: { padding: 12 }, // Reduced from 20
    screenTitle: { fontSize: 22, fontWeight: '700', marginBottom: 8 }, // Smaller title
    profileCard: { borderRadius: 16, padding: 12, elevation: 2 }, // Compact card
    profileContent: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 }, // Smaller avatar
    userInfo: { flex: 1 },
    userName: { fontSize: 18, fontWeight: '600' },
    userId: { fontSize: 13, marginTop: 2 },

    section: { marginHorizontal: 20, marginBottom: 16 },
    sectionHeader: { paddingVertical: 12 },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        textTransform: 'uppercase',
        opacity: 0.7,
    },

    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
    },
    itemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    textContainer: { flex: 1 },
    itemLabel: { fontSize: 16, fontWeight: '500' },
    itemDescription: { fontSize: 13, opacity: 0.7 },

    footer: { paddingVertical: 24, alignItems: 'center' },
    footerText: { fontSize: 12, opacity: 0.6 },

    themeBadgeSection: {
        marginTop: 12,
        paddingHorizontal: 8,
    },
    inlineLabel: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 12,
        opacity: 0.7,
        textTransform: 'uppercase',
    },
    inlineColorRow: {
        flexDirection: 'row',
        gap: 16,
        paddingBottom: 8,
    },
    inlineColorCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    inlineSelectedCircle: {
        borderWidth: 3,
        borderColor: '#FFF',
        transform: [{ scale: 1.1 }],
    },
});
