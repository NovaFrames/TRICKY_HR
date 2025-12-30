import { useUser } from '@/context/UserContext';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableWithoutFeedback,
    View
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
import { CustomButton } from '../components/CustomButton';
import { CustomInput } from '../components/CustomInput';
import { useTheme } from '../context/ThemeContext';
import { loginUser } from '../services/ApiService';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
    const router = useRouter();
    const [empCode, setEmpCode] = useState('10005');
    const [password, setPassword] = useState('10005');
    const [domainId, setDomainId] = useState('trickyhr');
    const [domainUrl, setDomainUrl] = useState('hr.trickyhr.com');
    const [isLoading, setIsLoading] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const { theme } = useTheme();

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

    const { setUser } = useUser();

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

            const userData = response.data || response;
            await setUser(userData);

            router.replace('/home');
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
            backgroundColor: theme.primary,
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
            [theme.textLight, theme.primary] // white → primary
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
        <View style={[styles.container, { backgroundColor: theme.background }]}>

            {/* The Blob Element */}
            <Animated.View style={[styles.blob, blobStyle]} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <SafeAreaView style={styles.safeArea}>

                            {/* Logo Section (Absolute to animate freely) */}
                            <Animated.View style={[styles.logoContainer, logoStyle]}>
                                {/* Using Text for Logo as per reference "Ventures Pastries" style */}
                                <Animated.Text style={[styles.logoText, logoTextStyle]}>
                                    trickyhr
                                </Animated.Text>

                                <Text style={[styles.tagline, { color: theme.text }]}>Sign in to Continue</Text>
                            </Animated.View>

                            {/* Login Form Section */}
                            <Animated.View style={[styles.formContainer, formStyle]}>
                                <View style={styles.welcomeContainer}>
                                    <Text style={[styles.welcomeTitle, { color: theme.text }]}>Welcome</Text>
                                </View>

                                {/* EMPCODE Input */}
                                <CustomInput
                                    placeholder="EmpCode"
                                    value={empCode}
                                    onChangeText={setEmpCode}
                                    autoCapitalize="none"
                                />

                                {/* PASSWORD Input */}
                                <CustomInput
                                    placeholder="Password"
                                    secureTextEntry={!isPasswordVisible}
                                    value={password}
                                    onChangeText={setPassword}
                                    icon={isPasswordVisible ? "eye" : "eye-off"}
                                    onIconPress={() => setIsPasswordVisible(!isPasswordVisible)}
                                />

                                {/* Domain Id Input */}
                                <CustomInput
                                    placeholder="Domain Id"
                                    value={domainId}
                                    onChangeText={setDomainId}
                                    autoCapitalize="none"
                                />

                                {/* Domain Url Input */}
                                <CustomInput
                                    placeholder="Domain Url"
                                    value={domainUrl}
                                    onChangeText={setDomainUrl}
                                    autoCapitalize="none"
                                />

                                {/* Sign In Button */}
                                <CustomButton
                                    title="Log in"
                                    onPress={handleLogin}
                                    isLoading={isLoading}
                                />

                            </Animated.View>

                            {/* Footer Text on top of Blob */}
                            <Animated.View style={[styles.footer, formStyle]}>
                                <Text style={[styles.footerText, { color: theme.textLight }]}>@created by trickyhr</Text>
                            </Animated.View>

                        </SafeAreaView>
                    </TouchableWithoutFeedback>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
        alignItems: 'center',
    },
    blob: {
        position: 'absolute',
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
    },
    tagline: {
        fontSize: 14,
        fontWeight: '600',
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
        letterSpacing: 1,
    },
    keyboardAvoidingView: {
        width: '100%',
    },
    footer: {
        marginTop: 'auto',
        paddingBottom: 30,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        fontWeight: '500',
    },
    signUpText: {
        fontWeight: 'bold',
        textDecorationLine: 'underline',
    },
});
