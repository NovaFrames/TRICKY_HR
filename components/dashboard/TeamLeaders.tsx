import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

interface TeamLeadersProps {
    theme: any;
}

/* 🔹 Sample Team Leads Data */
const TEAM_LEADS = [
    {
        id: 1,
        name: 'Alex',
        image: 'https://img.freepik.com/premium-vector/avatar-profile-icon-flat-style-male-user-profile-vector-illustration-isolated-background-man-profile-sign-business-concept_157943-38866.jpg',
    },
    {
        id: 2,
        name: 'Priya',
        image: 'https://img.freepik.com/premium-vector/avatar-profile-icon-flat-style-male-user-profile-vector-illustration-isolated-background-man-profile-sign-business-concept_157943-38866.jpg',
    },
    {
        id: 3,
        name: 'Rahul',
        image: 'https://img.freepik.com/premium-vector/avatar-profile-icon-flat-style-male-user-profile-vector-illustration-isolated-background-man-profile-sign-business-concept_157943-38866.jpg',
    },
];

export const TeamLeaders: React.FC<TeamLeadersProps> = ({
    theme,
}) => {

    return (
        <View
            style={styles.container}
        >
            <View style={styles.header}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Your Supervisors</Text>

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
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    header: {
        alignItems: 'flex-start', // Left-aligned
    },

    sectionTitle: {
        fontSize: 18, // Matched with Quick Actions
        fontWeight: '700', // Matched with Quick Actions
        marginBottom: 16, // Matched with Quick Actions
    },

    /* 🔹 Team leaders styles */
    teamRow: {
        flexDirection: 'row',
        justifyContent: 'flex-start', // Left-aligned
    },
    profileWrapper: {
        alignItems: 'center',
        marginRight: 24, // Added margin right for spacing between items instead of marginHorizontal
    },

    profileImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: '#F3F4F6', // Light gray border for better definition on white
    },
    profileName: {
        fontSize: 12,
        marginTop: 6,
        fontWeight: '500',
    },
});
