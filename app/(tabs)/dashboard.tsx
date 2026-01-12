import DashboardCards from '@/components/dashboard/DashboardCards';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { UserData, useUser } from '@/context/UserContext';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { IdCard } from '../../components/dashboard/IdCard';
import { useTheme } from '../../context/ThemeContext';

export default function HomeScreen() {
    const { theme, isDark } = useTheme();
    const { user } = useUser();

    const loginData: Partial<UserData> = user ?? {};

    const empName = loginData.EmpNameC || loginData.EmpName || loginData.Name || '-';
    const empCode = loginData.EmpCodeC || loginData.EmpCode || '-';
    const designation = loginData.DesigNameC || loginData.Designation || '-';
    const company = loginData.CompNameC || loginData.DomainId || '-';

    const initial = empName.charAt(0);

    return (
        <View style={[styles.container, { backgroundColor: isDark ? theme.background : '#FFFFFF' }]}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                style={styles.scrollView}
            >
                <DashboardHeader isDark={isDark} theme={theme} />

                <IdCard
                    empName={empName}
                    designation={designation}
                    empCode={empCode}
                    company={company}
                    initial={initial}
                    theme={theme}
                />

                <Text style={[styles.sectionHeader, { color: theme.text }]}>Quick Actions</Text>

                <DashboardCards />

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        // paddingTop: 12,
        paddingHorizontal: 16,
        paddingBottom: 40,
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
    },
    logoutRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
        marginTop: 10,
        marginBottom: 30,
        gap: 8,
    },
    logoutText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#EF4444',
    }
});
