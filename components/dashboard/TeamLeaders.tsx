import { useUser } from "@/context/UserContext";
import ApiService from "@/services/ApiService";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import ProfileImage from "../common/ProfileImage";

interface TeamLeadersProps {
  theme: any;
  showHeader?: boolean;
}

type TeamMember = {
  SubDesig: string;
  SubEmpIdN: number;
  SubLevel: number;
  SubName: string;
};

export const TeamLeaders: React.FC<TeamLeadersProps> = ({
  theme,
  showHeader = true,
}) => {
  const [TeamMem, setTeamMem] = useState<TeamMember[]>();
  const { user } = useUser();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await ApiService.getEmpDashBoardList();
        // Ensure array
        setTeamMem(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Team fetch error:", err);
        setTeamMem([]);
      }
    };

    fetchData();
  }, []);

  return (
    <View style={[styles.container, !showHeader && styles.compactContainer]}>
      {showHeader && (
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Your Supervisors
        </Text>
      )}

      {/* Team Leaders */}
      <View style={styles.teamScrollWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.teamScroll}
          contentContainerStyle={styles.teamRow}
        >
          {TeamMem?.map((member) => (
            <View key={member.SubEmpIdN} style={styles.profileWrapper}>
              <ProfileImage
                customerIdC={user?.CustomerIdC}
                compIdN={user?.CompIdN}
                empIdN={member.SubEmpIdN}
                size={60}
              />

              <Text style={[styles.profileName, { color: theme.text }]}>
                {member.SubName?.trim()}
              </Text>

              <Text style={[styles.designation, { color: theme.text }]}>
                {member.SubDesig}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // marginBottom: 0, // Reduced from 24
  },
  compactContainer: {
    marginBottom: 0,
  },
  header: {
    alignItems: "flex-start", // Left-aligned
  },
  /* ⬇️ NEW wrapper prevents full-height expansion */
  teamScrollWrapper: {
    width: "100%",
    alignItems: "center",
  },

  sectionTitle: {
    fontSize: 16, // Reduced from 18
    fontWeight: "400",
    marginBottom: 12, // Reduced from 16
  },

  /* 🔹 Team leaders styles */
  teamRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexGrow: 1, // ⭐ THIS IS THE KEY FIX
  },

  profileWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    width: 90,
  },

  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#F3F4F6", // Light gray border for better definition on white
  },
  profileName: {
    fontSize: 12,
    marginTop: 6,
    fontWeight: "500",
  },
  designation: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: "200",
    textAlign: "center",
    lineHeight: 14,
    height: 28, // 👈 FIXED HEIGHT (2 lines)
  },
  teamScroll: {
    width: "100%",
  },
});
