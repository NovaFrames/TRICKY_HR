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
  const [TeamMem, setTeamMem] = useState<TeamMember[]>([]);
  const { user } = useUser();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await ApiService.getEmpDashBoardList();
        setTeamMem(Array.isArray(data.supDataList) ? data.supDataList : []);
      } catch (err) {
        console.error("Team fetch error:", err);
        setTeamMem([]);
      }
    };

    fetchData();
  }, []);

  if (!TeamMem.length) return null;

  return (
    <View>
      {showHeader && (
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          My Officer
        </Text>
      )}

      <ScrollView>
        {TeamMem.map((member) => (
          <View
            key={member.SubEmpIdN}
            style={[
              styles.card,
            ]}
          >
            {/* Left avatar */}
            <ProfileImage
              customerIdC={user?.CustomerIdC}
              compIdN={user?.CompIdN}
              empIdN={member.SubEmpIdN}
              size={48}
              borderRadius={20}
            />

            {/* Middle content */}
            <View style={styles.info}>
              <Text style={[styles.name, { color: theme.text }]}>
                {member.SubName?.trim()}
              </Text>
              <Text style={[styles.subText, { color: theme.textLight }]}>
                {member.SubDesig}
              </Text>
            </View>

          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 12,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },

  info: {
    flex: 1,
    marginLeft: 12,
  },

  name: {
    fontSize: 14,
    fontWeight: "600",
  },

  subText: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.8,
  },
});
