import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface TeamLeadersProps {
    theme: any;
}

/* 🔹 Sample Team Leads Data */
const TEAM_LEADS = [
    {
        id: 1,
        name: 'Alex',
        image: 'https://randomuser.me/api/portraits/men/32.jpg',
    },
    {
        id: 2,
        name: 'Priya',
        image: 'https://randomuser.me/api/portraits/women/44.jpg',
    },
    {
        id: 3,
        name: 'Rahul',
        image: 'https://randomuser.me/api/portraits/men/65.jpg',
    },
];

export const TeamLeaders: React.FC<TeamLeadersProps> = ({
    theme,
}) => {

    return (
        <View
            style={[styles.headerBackground, { backgroundColor: theme.cardBackground }]}
        >
            <SafeAreaView>
                <View style={styles.header}>

                    {/* 🔹 Team Leaders (Instagram Style) */}
                    <View style={styles.teamRow}>
                        {TEAM_LEADS.map(member => (
                            <View key={member.id} style={styles.profileWrapper}>

                                <Image
                                    source={{ uri: member.image }}
                                    style={styles.profileImage}
                                />

                                <Text style={[styles.profileName, { color: theme.text }]}>
                                    {member.name}
                                </Text>
                            </View>
                        ))}
                    </View>

                </View>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    headerBackground: {
        borderRadius: 30,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 5,
        zIndex: 10,
        marginBottom: 24,
        padding: 12,
    },
    header: {
        alignItems: 'center',
    },

    /* 🔹 Team leaders styles */
    teamRow: {
        flexDirection: 'row',
    },
    profileWrapper: {
        alignItems: 'center',
        marginHorizontal: 12,
    },

    profileImage: {
        width: 64,
        height: 64,
        borderRadius: 32,
        borderWidth: 2,
        borderColor: '#fff',
    },
    profileName: {
        fontSize: 12,
        marginTop: 6,
        fontWeight: '500',
    },
});
