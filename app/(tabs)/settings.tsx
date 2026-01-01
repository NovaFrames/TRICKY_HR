import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { useProfileImage } from '@/hooks/useCompanyLogo';
import { Feather, FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Image,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

/* -------------------- TYPES -------------------- */

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
export default function settings() {
    const { theme, isDark, toggleTheme } = useTheme();
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
                    onPress: () => { },
                },
                {
                    label: 'Security',
                    description: 'Change password and security settings',
                    icon: <MaterialIcons name="lock" />,
                    color: '#ec4899',
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
                {
                    label: 'Notifications',
                    description: 'Manage notification preferences',
                    icon: <Ionicons name="notifications" />,
                    color: '#8b5cf6',
                    onPress: () => { },
                },
            ],
        },
        {
            title: 'Support & Legal',
            items: [
                {
                    label: 'Terms & Conditions',
                    icon: <Ionicons name="document-text-outline" />,
                    color: '#64748b',
                    onPress: () => { },
                },
                {
                    label: 'Privacy Policy',
                    icon: <MaterialIcons name="privacy-tip" />,
                    color: '#8b5cf6',
                    onPress: () => { },
                },
                {
                    label: 'Help & Support',
                    icon: <Ionicons name="help-circle" />,
                    color: '#3b82f6',
                    onPress: () => { },
                },
                {
                    label: 'About App',
                    description: 'Version 1.0.0',
                    icon: <Ionicons name="information-circle" />,
                    color: '#10b981',
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

    const SettingsItem = ({
        item,
        isLast,
    }: {
        item: SettingItem;
        isLast: boolean;
    }) => {
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
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

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

            {/* Settings */}
            <ScrollView showsVerticalScrollIndicator={false}>
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
                    </View>
                ))}

                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: theme.text }]}>
                        Version 1.0.0 • © 2024 Your App Name
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

/* -------------------- STYLES -------------------- */
const styles = StyleSheet.create({
    container: { flex: 1, paddingBottom: 60 },
    headerContainer: { padding: 20 },
    screenTitle: { fontSize: 28, fontWeight: '700', marginBottom: 16 },
    profileCard: { borderRadius: 16, padding: 20, elevation: 3 },
    profileContent: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 70, height: 70, borderRadius: 35, marginRight: 16 },
    userInfo: { flex: 1 },
    userName: { fontSize: 20, fontWeight: '600' },
    userId: { fontSize: 14, marginTop: 4 },

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
});
