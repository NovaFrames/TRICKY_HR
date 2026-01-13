import Header from '@/components/Header';
import { useTheme } from '@/context/ThemeContext';
import { useProtectedBack } from '@/hooks/useProtectedBack';
import ApiService from '@/services/ApiService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function ChangePassword() {
    const { theme } = useTheme();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [formData, setFormData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    useProtectedBack({
        home: '/home',
        settings: '/settings',
    });

    const validateForm = () => {
        if (!formData.oldPassword.trim()) {
            Alert.alert('Validation Error', 'Old password is required');
            return false;
        }

        if (!formData.newPassword.trim()) {
            Alert.alert('Validation Error', 'New password is required');
            return false;
        }

        if (!formData.confirmPassword.trim()) {
            Alert.alert('Validation Error', 'Please confirm your new password');
            return false;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            Alert.alert('Validation Error', 'New passwords do not match');
            return false;
        }

        // Optional: Add minimum password length validation
        // if (formData.newPassword.length < 7) {
        //     Alert.alert('Validation Error', 'Password is too short. Minimum 7 characters required');
        //     return false;
        // }

        return true;
    };

    const handleChangePassword = async () => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            const result = await ApiService.changePassword(
                formData.oldPassword,
                formData.newPassword
            );

            if (result.success) {
                Alert.alert(
                    'Success',
                    'Password changed successfully. Please login again with your new password.',
                    [
                        {
                            text: 'OK',
                            onPress: async () => {
                                // Logout and redirect to login
                                await ApiService.logout();
                                router.replace('/');
                            },
                        },
                    ]
                );
            } else {
                Alert.alert('Error', result.error || 'Failed to change password');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setFormData({
            oldPassword: '',
            newPassword: '',
            confirmPassword: '',
        });
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Header title="Change Password" />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header Banner */}
                    <LinearGradient
                        colors={[theme.primary, theme.primary + 'CC']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.headerBanner}
                    >
                        <View style={styles.bannerIcon}>
                            <Ionicons name="lock-closed" size={40} color="#fff" />
                        </View>
                        <Text style={styles.bannerTitle}>Change Your Password</Text>
                        <Text style={styles.bannerSubtitle}>
                            Enter your current password and choose a new one
                        </Text>
                    </LinearGradient>

                    {/* Form Card */}
                    <View style={[styles.formCard, { backgroundColor: theme.cardBackground }]}>
                        {/* Old Password */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: theme.text }]}>
                                <Ionicons name="key-outline" size={16} color={theme.primary} /> Current Password *
                            </Text>
                            <View style={[styles.passwordContainer, { borderColor: theme.inputBorder, backgroundColor: theme.inputBg }]}>
                                <Ionicons name="lock-closed-outline" size={20} color={theme.primary} style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.passwordInput, { color: theme.text }]}
                                    placeholder="Enter current password"
                                    placeholderTextColor={theme.placeholder}
                                    secureTextEntry={!showOldPassword}
                                    value={formData.oldPassword}
                                    onChangeText={(text) => setFormData({ ...formData, oldPassword: text })}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowOldPassword(!showOldPassword)}
                                    style={styles.eyeButton}
                                >
                                    <Ionicons
                                        name={showOldPassword ? 'eye-off-outline' : 'eye-outline'}
                                        size={22}
                                        color={theme.text + '80'}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* New Password */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: theme.text }]}>
                                <Ionicons name="create-outline" size={16} color={theme.primary} /> New Password *
                            </Text>
                            <View style={[styles.passwordContainer, { borderColor: theme.inputBorder, backgroundColor: theme.inputBg }]}>
                                <Ionicons name="lock-open-outline" size={20} color={theme.primary} style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.passwordInput, { color: theme.text }]}
                                    placeholder="Enter new password"
                                    placeholderTextColor={theme.placeholder}
                                    secureTextEntry={!showNewPassword}
                                    value={formData.newPassword}
                                    onChangeText={(text) => setFormData({ ...formData, newPassword: text })}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowNewPassword(!showNewPassword)}
                                    style={styles.eyeButton}
                                >
                                    <Ionicons
                                        name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                                        size={22}
                                        color={theme.text + '80'}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Confirm Password */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: theme.text }]}>
                                <Ionicons name="checkmark-circle-outline" size={16} color={theme.primary} /> Confirm New Password *
                            </Text>
                            <View style={[styles.passwordContainer, { borderColor: theme.inputBorder, backgroundColor: theme.inputBg }]}>
                                <Ionicons name="shield-checkmark-outline" size={20} color={theme.primary} style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.passwordInput, { color: theme.text }]}
                                    placeholder="Re-enter new password"
                                    placeholderTextColor={theme.placeholder}
                                    secureTextEntry={!showConfirmPassword}
                                    value={formData.confirmPassword}
                                    onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                    style={styles.eyeButton}
                                >
                                    <Ionicons
                                        name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                                        size={22}
                                        color={theme.text + '80'}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Password Requirements Info */}
                        <View style={[styles.infoBox, { backgroundColor: theme.primary + '10', borderColor: theme.primary + '30' }]}>
                            <Ionicons name="information-circle" size={20} color={theme.primary} />
                            <View style={styles.infoContent}>
                                <Text style={[styles.infoTitle, { color: theme.primary }]}>Password Requirements:</Text>
                                <Text style={[styles.infoText, { color: theme.text }]}>
                                    • Use a strong password{'\n'}
                                    • Avoid using common words{'\n'}
                                    • Mix letters, numbers, and symbols
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Buttons */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.button, styles.resetButton, { borderColor: theme.inputBorder }]}
                            onPress={handleReset}
                            disabled={loading}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="refresh-outline" size={20} color={theme.text} />
                            <Text style={[styles.resetButtonText, { color: theme.text }]}>Reset</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.saveButton, { backgroundColor: theme.primary }]}
                            onPress={handleChangePassword}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                                    <Text style={styles.saveButtonText}>Change Password</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 32,
    },

    // Header Banner
    headerBanner: {
        borderRadius: 16,
        padding: 24,
        marginBottom: 20,
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    bannerIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    bannerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 8,
        textAlign: 'center',
    },
    bannerSubtitle: {
        fontSize: 14,
        color: '#fff',
        opacity: 0.9,
        textAlign: 'center',
    },

    // Form Card
    formCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3.84,
    },

    // Input Group
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 50,
    },
    inputIcon: {
        marginRight: 10,
    },
    passwordInput: {
        flex: 1,
        fontSize: 15,
        height: '100%',
    },
    eyeButton: {
        padding: 4,
    },

    // Info Box
    infoBox: {
        flexDirection: 'row',
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        marginTop: 8,
        gap: 12,
    },
    infoContent: {
        flex: 1,
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 6,
    },
    infoText: {
        fontSize: 13,
        lineHeight: 20,
    },

    // Buttons
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    resetButton: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        elevation: 0,
        shadowOpacity: 0,
    },
    resetButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    saveButton: {
        flex: 2,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});
