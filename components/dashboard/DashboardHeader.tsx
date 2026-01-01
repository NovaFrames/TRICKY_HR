import { useUser } from '@/context/UserContext';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface DashboardHeaderProps {
    isDark: boolean;
    theme: any;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
    isDark,
    theme,
}) => {

    const { user } = useUser();
    const [logoError, setLogoError] = React.useState(false);

    const logoUrl = useCompanyLogo(user?.CustomerIdC, user?.CompIdN);


    return (
        <View style={[styles.shadowWrapper, { shadowColor: theme.text }]}>
            <LinearGradient
                colors={isDark ? [theme.background, theme.inputBg] : ['#FFFFFF', '#FFFFFF']}
                style={[styles.headerBackground]}
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
                                    marginTop: 0,
                                    width: 130, // Reduced from 140
                                    height: 30, // Reduced from 35
                                    resizeMode: 'contain',
                                }}
                            />
                        </View>
                    </View>
                </SafeAreaView>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    shadowWrapper: {
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
        zIndex: 10,
        overflow: 'hidden',
        paddingBottom: 2,
    },
    headerBackground: {
        paddingTop: 0,
        paddingBottom: 6, // Reduced from 12
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    safeArea: {
        marginBottom: 0,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 0, // Removed margin
    },
});
