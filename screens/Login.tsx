
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loginUser } from '../services/api';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
    const router = useRouter();
    const [empCode, setEmpCode] = useState('');
    const [password, setPassword] = useState('');
    const [domainId, setDomainId] = useState('trickyhr'); // Default as per prompt
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        if (!empCode || !password || !domainId) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setIsLoading(true);
        try {
            const response = await loginUser(empCode, password, domainId);
            console.log('Login response:', JSON.stringify(response));

            // Validate response - Check for Token or explicit Success status
            const isValidLogin =
                (response.Status === 'success' || response.Status === 'Success') ||
                (response.Token) ||
                (response.TokenC) ||
                (response.data?.TokenC);

            if (!isValidLogin) {
                Alert.alert('Login Failed', response.Message || 'Invalid credentials. Please try again.');
                return;
            }

            router.replace({
                pathname: '/Dashboard',
                params: { userData: JSON.stringify(response) }
            });
        } catch (error: any) {
            console.error('Login error:', error);
            Alert.alert('Login Failed', error.message || 'An error occurred during login');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#ffffff', '#f0f4ff', '#e6efff']}
                style={styles.background}
            />

            <SafeAreaView style={styles.safeArea}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* Header Section */}
                    <View style={styles.header}>
                        <View style={styles.logoContainer}>
                            <View style={styles.logoIcon}>
                                <MaterialCommunityIcons name="fingerprint" size={32} color="#fff" />
                            </View>
                            <View>
                                <Text style={styles.logoText}>NovaFrames</Text>
                                <Text style={styles.tagline}>AI SECURITY & SMART SYSTEMS</Text>
                            </View>
                        </View>
                        <TouchableOpacity>
                            <Text style={styles.topLoginText}>LOGIN</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Login Card */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.signInTitle}>Sign In</Text>
                            <View style={styles.securityIconContainer}>
                                <Feather name="shield" size={24} color="#F59E0B" />
                            </View>
                        </View>

                        {/* EMPCODE Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>EMPCODE</Text>
                            <View style={styles.inputContainer}>
                                <Feather name="user" size={20} color="#94A3B8" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter EmpCode"
                                    placeholderTextColor="#94A3B8"
                                    value={empCode}
                                    onChangeText={setEmpCode}
                                />
                            </View>
                        </View>

                        {/* PASSWORD Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>PASSWORD</Text>
                            <View style={styles.inputContainer}>
                                <Feather name="lock" size={20} color="#94A3B8" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter Password"
                                    placeholderTextColor="#94A3B8"
                                    secureTextEntry
                                    value={password}
                                    onChangeText={setPassword}
                                />
                            </View>
                        </View>

                        {/* DOMAINID Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>DOMAINID</Text>
                            <View style={styles.inputContainer}>
                                <Feather name="briefcase" size={20} color="#94A3B8" style={styles.inputIcon} />
                                <TextInput
                                    value={domainId}
                                    editable={false}
                                    style={[styles.input, { color: '#333' }]} // Darker text for pre-filled
                                />
                            </View>
                        </View>

                        {/* Sign In Button */}
                        <TouchableOpacity
                            style={[styles.button, isLoading && { opacity: 0.7 }]}
                            onPress={handleLogin}
                            activeOpacity={0.8}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#1F2937" />
                            ) : (
                                <>
                                    <Feather name="arrow-right" size={24} color="#1F2937" style={{ marginRight: 8 }} />
                                    <Text style={styles.buttonText}>Sign In</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.copyright}>© 2025 NOVAFRAMES. ALL RIGHTS RESERVED.</Text>
                        <Text style={styles.subFooter}>AI-Powered Web, Mobile & Biometric Solutions</Text>
                    </View>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    background: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height: '100%',
    },
    safeArea: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingBottom: 20,
        justifyContent: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 40,
        marginTop: 20,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#3B82F6', // Blue like the image
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    logoText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#6366F1', // Indigo/Blue
        letterSpacing: 0.5,
    },
    tagline: {
        fontSize: 8,
        color: '#64748B',
        fontWeight: '600',
        letterSpacing: 1,
        marginTop: 2,
    },
    topLoginText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
        letterSpacing: 1,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 5, // For Android
        marginBottom: 40,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
    },
    signInTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#0F172A',
    },
    securityIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#FFFBEB', // Light yellow
        justifyContent: 'center',
        alignItems: 'center',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 11,
        fontWeight: '700',
        color: '#64748B',
        marginBottom: 8,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        height: 56,
        paddingHorizontal: 16,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#0F172A',
        fontWeight: '500',
    },
    button: {
        backgroundColor: '#FBBF24', // Amber/Yellow
        height: 56,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#FBBF24',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 4,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937', // Dark gray text
    },
    footer: {
        alignItems: 'center',
        marginTop: 'auto',
    },
    copyright: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '600',
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    subFooter: {
        fontSize: 10,
        color: '#94A3B8',
    },
});
