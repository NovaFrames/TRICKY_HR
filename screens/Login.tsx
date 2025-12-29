import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import Animated, {
    Easing,
    interpolate,
    interpolateColor,
    useAnimatedStyle,
    useSharedValue,
    withTiming
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loginUser } from '../services/ApiService';

const { width, height } = Dimensions.get('window');

// Theme Colors
const THEME = {
    primary: '#ff6200ff', // Teal/Green
    secondary: '#115E59',
    background: '#F0FDFA', // Light Teal/White
    text: '#134E4A',
    textLight: '#5EEAD4',
    inputBg: '#E0F2F1',
    inputBorder: '#CCFBF1',
};

export default function LoginScreen() {
    const router = useRouter();
    const [empCode, setEmpCode] = useState('');
    const [password, setPassword] = useState('');
    const [domainId, setDomainId] = useState('trickyhr');
    const [domainUrl, setDomainUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Animation Values
    const animationProgress = useSharedValue(0); // 0 to 1

    useEffect(() => {
        // Start Animation Sequence
        const startAnimation = async () => {
            // Wait a bit for the splash feel
            await new Promise(resolve => setTimeout(resolve, 800));

            // Animate to Login State
            // Using withTiming for smooth, non-bouncy transition
            animationProgress.value = withTiming(1, {
                duration: 1200,
                easing: Easing.bezier(0.25, 0.1, 0.25, 1), // Ease-in-out cubic
            });
        };

        startAnimation();
    }, []);

    const handleLogin = async () => {
        if (!empCode || !password || !domainId) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setIsLoading(true);
        try {
            const response = await loginUser(empCode, password, domainId);
            console.log('Login response:', JSON.stringify(response));

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

    // --- Animated Styles ---

    // 1. The Blob (Background Shape)
    const blobStyle = useAnimatedStyle(() => {
        // Interpolate values based on progress (0 -> 1)

        // Size
        const w = interpolate(animationProgress.value, [0, 1], [width * 0.8, width * 1.5]);
        const h = interpolate(animationProgress.value, [0, 1], [width * 0.8, height * 0.5]);

        // Position
        const top = interpolate(animationProgress.value, [0, 1], [height / 2 - (width * 0.4), height * 0.85]);
        const left = interpolate(animationProgress.value, [0, 1], [width / 2 - (width * 0.4), -width * 0.2]);

        // Border Radius
        const radius = interpolate(animationProgress.value, [0, 1], [width * 0.4, width * 0.8]);

        // Rotation (optional, for organic feel)
        const rotate = interpolate(animationProgress.value, [0, 1], [0, -15]);

        return {
            width: w,
            height: h,
            top: top,
            left: left,
            borderRadius: radius,
            transform: [{ rotate: `${rotate}deg` }],
        };
    });

    // 2. Logo Animation
    const logoStyle = useAnimatedStyle(() => {
        const top = interpolate(animationProgress.value, [0, 1], [height / 2 - 50, height * 0.15]);
        const scale = interpolate(animationProgress.value, [0, 1], [1, 0.8]);

        return {
            top: top,
            transform: [{ scale }],
        };
    });

    const logoTextStyle = useAnimatedStyle(() => {
        const color = interpolateColor(
            animationProgress.value,
            [0, 1],
            ['#ffffff', THEME.primary] // white → primary
        );

        return {
            color,
        };
    });


    // 3. Form Fade In
    const formStyle = useAnimatedStyle(() => {
        const opacity = interpolate(animationProgress.value, [0.6, 1], [0, 1]);
        const translateY = interpolate(animationProgress.value, [0.6, 1], [50, 0]);

        return {
            opacity,
            transform: [{ translateY }],
            zIndex: animationProgress.value > 0.5 ? 10 : -1, // Ensure form is clickable only when visible
        };
    });

    return (
        <View style={styles.container}>

            {/* The Blob Element */}
            <Animated.View style={[styles.blob, blobStyle]} />

            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <SafeAreaView style={styles.safeArea}>

                    {/* Logo Section (Absolute to animate freely) */}
                    <Animated.View style={[styles.logoContainer, logoStyle]}>
                        {/* Using Text for Logo as per reference "Ventures Pastries" style */}
                        <Animated.Text style={[styles.logoText, logoTextStyle]}>
                            NovaFrames
                        </Animated.Text>

                        <Text style={styles.tagline}>AI SECURITY</Text>
                    </Animated.View>

                    {/* Login Form Section */}
                    <Animated.View style={[styles.formContainer, formStyle]}>
                        <View style={styles.welcomeContainer}>
                            <Text style={styles.welcomeTitle}>Welcome</Text>
                        </View>

                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                            style={styles.keyboardAvoidingView}
                        >
                            {/* EMPCODE Input */}
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="EmpCode"
                                    placeholderTextColor="#94A3B8"
                                    value={empCode}
                                    onChangeText={setEmpCode}
                                    autoCapitalize="none"
                                />
                            </View>

                            {/* PASSWORD Input */}
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Password"
                                    placeholderTextColor="#94A3B8"
                                    secureTextEntry
                                    value={password}
                                    onChangeText={setPassword}
                                />
                                <TouchableOpacity style={styles.eyeIcon}>
                                    <Feather name="eye-off" size={20} color="#94A3B8" />
                                </TouchableOpacity>
                            </View>

                            {/* EMPCODE Input */}
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Domain Id"
                                    placeholderTextColor="#94A3B8"
                                    value={domainId}
                                    onChangeText={setDomainId}
                                    autoCapitalize="none"
                                />
                            </View>

                            {/* EMPCODE Input */}
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Domain Url"
                                    placeholderTextColor="#94A3B8"
                                    value={domainUrl}
                                    onChangeText={setDomainUrl}
                                    autoCapitalize="none"
                                />
                            </View>

                            {/* Options */}
                            {/* <View style={styles.optionsRow}>
                                <View style={styles.rememberMe}>
                                    <View style={styles.checkbox} />
                                    <Text style={styles.optionText}>Remember me</Text>
                                </View>
                                <TouchableOpacity>
                                    <Text style={styles.optionText}>Forgot password?</Text>
                                </TouchableOpacity>
                            </View> */}

                            {/* Sign In Button */}
                            <TouchableOpacity
                                style={styles.loginButton}
                                onPress={handleLogin}
                                activeOpacity={0.8}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.loginButtonText}>Log in</Text>
                                )}
                            </TouchableOpacity>

                        </KeyboardAvoidingView>
                    </Animated.View>

                    {/* Footer Text on top of Blob */}
                    <Animated.View style={[styles.footer, formStyle]}>
                        <Text style={styles.footerText}>@created by Novaframes</Text>
                    </Animated.View>

                </SafeAreaView>
            </TouchableWithoutFeedback>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.background,
    },
    safeArea: {
        flex: 1,
        alignItems: 'center',
    },
    blob: {
        position: 'absolute',
        backgroundColor: THEME.primary,
        // Initial dimensions and position handled by Animated Style
    },
    logoContainer: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
        width: width,
        zIndex: 20,
    },
    logoText: {
        fontSize: 36,
        fontWeight: '900',
        // For simplicity, let's assume the logo moves OUT of the blob to the white area.
        color: THEME.primary,
    },
    tagline: {
        fontSize: 14,
        fontWeight: '600',
        color: THEME.text,
        letterSpacing: 2,
        marginTop: 5,
    },
    formContainer: {
        width: '100%',
        paddingHorizontal: 30,
        marginTop: height * 0.25, // Push down to make room for logo
        zIndex: 10,
    },
    welcomeContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    welcomeTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: THEME.text,
        letterSpacing: 1,
    },
    keyboardAvoidingView: {
        width: '100%',
    },
    inputWrapper: {
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E2E8F0', // Light Gray like reference
        borderRadius: 8,
        height: 50,
        paddingHorizontal: 16,
    },
    input: {
        flex: 1,
        fontSize: 14,
        color: '#334155',
    },
    eyeIcon: {
        padding: 4,
    },
    optionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    rememberMe: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkbox: {
        width: 16,
        height: 16,
        borderWidth: 1,
        borderColor: '#94A3B8',
        borderRadius: 4,
        marginRight: 8,
    },
    optionText: {
        fontSize: 12,
        color: '#64748B',
    },
    loginButton: {
        backgroundColor: THEME.primary,
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: THEME.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    loginButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E2E8F0',
    },
    dividerText: {
        marginHorizontal: 16,
        color: '#94A3B8',
        fontSize: 12,
    },
    socialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F1F5F9',
        height: 50,
        borderRadius: 8,
        marginBottom: 16,
    },
    socialButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
        marginLeft: 8,
    },
    footer: {
        position: 'absolute',
        bottom: 50,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: '#fff', // White text because it sits on the Green Blob
        fontWeight: '500',
    },
    signUpText: {
        fontWeight: 'bold',
        textDecorationLine: 'underline',
    },
});
