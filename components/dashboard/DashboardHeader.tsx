import { useUser } from '@/context/UserContext';
import { getCompanyLogoUrl } from '@/hooks/useGetImage';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
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
    const [logoUrl, setLogoUrl] = useState<string | undefined>();

    useEffect(() => {
        let isActive = true;
        setLogoError(false);

        const loadLogoUrl = async () => {
            const url = await getCompanyLogoUrl(user?.CustomerIdC, user?.CompIdN);
            if (isActive) {
                setLogoUrl(url);
            }
        };

        loadLogoUrl();

        return () => {
            isActive = false;
        };
    }, [user?.CustomerIdC, user?.CompIdN]);


    return (
        <View style={[styles.shadowWrapper, { shadowColor: theme.text }]}>
            {/* <LinearGradient
                colors={isDark ? [theme.background || '#130b1d', theme.inputBg || '#1e293b'] : ['#FFFFFF', '#FFFFFF']}
                style={[styles.headerBackground]}
            > */}
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
                                width: 125,
                                height: 48,
                                resizeMode: 'contain',
                            }}
                        />
                    </View>

                </View>
                <Text style={{
                    color: theme.text,
                    fontSize: 14,
                    fontWeight: '800',
                    textAlign: 'center',
                    letterSpacing: 2,
                    textTransform: 'uppercase',
                    opacity: 0.9,
                    marginTop: 4,
                    marginBottom: 8
                }}>
                    {user?.CompNameC}
                </Text>
            </SafeAreaView>
            {/* </LinearGradient> */}
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
        // paddingBottom: 2,
    },
    headerBackground: {
        paddingTop: 0,
        paddingBottom: 2, // Reduced from 4
        borderBottomLeftRadius: 16, // Reduced from 20
        borderBottomRightRadius: 16, // Reduced from 20
    },
    safeArea: {
        marginBottom: 0,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 0,
    },
});
