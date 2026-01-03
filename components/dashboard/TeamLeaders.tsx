import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

interface TeamLeadersProps {
    theme: any;
    showHeader?: boolean;
}

/* 🔹 Sample Team Leads Data */
const TEAM_LEADS = [
    {
        id: 1,
        name: 'Alex Johnson',
        image: 'https://randomuser.me/api/portraits/men/32.jpg',
    },
    {
        id: 2,
        name: 'Sarah Chen',
        image: 'https://randomuser.me/api/portraits/women/44.jpg',
    },
    {
        id: 3,
        name: 'Michael Ross',
        image: 'https://randomuser.me/api/portraits/men/65.jpg',
    },
];

export const TeamLeaders: React.FC<TeamLeadersProps> = ({
    theme,
    showHeader = true,
}) => {

    return (
        <View
            style={[styles.container, !showHeader && { marginBottom: 12 }]}
        >
            <View style={styles.header}>
                {showHeader && <Text style={[styles.sectionTitle, { color: theme.text }]}>Your Supervisors</Text>}

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
        marginBottom: 16, // Reduced from 24
    },
    header: {
        alignItems: 'flex-start', // Left-aligned
    },

    sectionTitle: {
        fontSize: 16, // Reduced from 18
        fontWeight: '700',
        marginBottom: 12, // Reduced from 16
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
