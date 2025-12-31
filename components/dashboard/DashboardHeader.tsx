import { useUser } from '@/context/UserContext';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface DashboardHeaderProps {
    initial: string;
    isDark: boolean;
    theme: any;
    toggleTheme: () => void;

}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
    initial,
    isDark,
    theme,
    toggleTheme,
}) => {

    const { user } = useUser();
    const [logoError, setLogoError] = React.useState(false);

    const logoUrl = useCompanyLogo(user.CustomerIdC, user.CompIdN);


    return (
        <LinearGradient
            colors={isDark ? [theme.background, theme.inputBg] : ['#fff', '#f3f4f6']}
            style={[styles.headerBackground, { shadowColor: theme.text }]}
        >
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <View style={{ flexDirection: 'column', alignItems: 'center' }}>
                        {/* Logo */}
                        <Image
                            source={
                                !logoError && logoUrl
                                    ? { uri: logoUrl }
                                    : require('@/assets/images/trickyhr.png')
                            }
                            onError={() => setLogoError(true)}
                            style={{
                                marginTop: 20,
                                width: 180,
                                height: 30,
                                resizeMode: 'contain',
                            }}
                        />
                        {/* Text */}
                        <View>
                            <Text style={[styles.greeting, { color: theme.placeholder }]}>
                                trickyhr
                            </Text>
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    headerBackground: {
        paddingBottom: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 5,
        zIndex: 10,
    },
    safeArea: {
        marginBottom: 0,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingTop: 10,
    },
    greeting: {
        fontSize: 14,
        fontWeight: '500',
    },
});
