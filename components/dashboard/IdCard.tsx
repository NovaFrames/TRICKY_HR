import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useUser } from "@/context/UserContext";
import { ThemeType } from "../../theme/theme";
import ProfileImage from "../common/ProfileImage";
import { TeamLeaders } from "./TeamLeaders";

interface IdCardProps {
  empName: string;
  designation: string;
  empCode: string;
  company: string;
  initial: string;
  theme: ThemeType;
}

export const IdCard: React.FC<IdCardProps> = ({
  empName,
  designation,
  empCode,
  company,
  initial,
  theme,
}) => {

  const { user } = useUser();

  return (
    <View
      style={[
        styles.idCard,
        {
          shadowColor: "#000", // Neutral shadow
          backgroundColor: theme.cardBackground,
          borderColor: theme.inputBorder,
          borderWidth: 1,
        },
      ]}
    >
      <View style={styles.idCardGradient}>
        <View style={styles.idCardTop}>
          <View
            style={[
              styles.avatarLarge,
            ]}
          >
            <ProfileImage
              customerIdC={user?.CustomerIdC}
              compIdN={user?.CompIdN}
              empIdN={user?.EmpIdN}
              size={80}
            />
          </View>
          <View style={styles.idCardInfo}>
            <Text style={[styles.idName, { color: theme.text }]}>
              {empName}
            </Text>
            <Text style={[styles.idRole, { color: theme.placeholder }]}>
              ID: {empCode}
            </Text>
            <Text style={[styles.idRole, { color: theme.placeholder }]}>
              {designation}
            </Text>
          </View>
        </View>

        {/* Integration of Supervisors list inside IdCard */}
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: theme.inputBorder,
            paddingTop: 12,
            marginBottom: 4,
          }}
        >
          <TeamLeaders theme={theme} showHeader={true} />
        </View>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  idCard: {
    borderRadius: 4,
    marginBottom: 16, // Reduced from 24
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  idCardGradient: {
    borderRadius: 4,
    padding: 16, // Reduced from 24
  },
  idCardTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12, // Reduced from 20
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    marginRight: 16,
    overflow: "hidden", // 🔑 important
  },

  idCardInfo: {
    flex: 1,
  },
  idName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  idRole: {
    fontSize: 14,
    color: "#94A3B8",
    marginBottom: 10,
  },
  idBadgeRow: {
    flexDirection: "row",
    gap: 8,
  },
  idBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  idBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#E2E8F0",
  },
  idCardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  locationText: {
    fontSize: 12,
    color: "#94A3B8",
    marginLeft: 6,
    paddingRight: 10,
  },
  liveTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 4,
    marginRight: 6,
  },
  liveText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
    textTransform: "uppercase",
  },
  trackingTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  trackingSub: {
    fontSize: 12,
  },
  toggleTrack: {
    width: 48,
    height: 28,
    borderRadius: 4,
    padding: 2,
    justifyContent: "center",
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});
