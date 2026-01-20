import React, { useEffect, useState } from "react";
import { Image, LayoutAnimation, StyleSheet, Text, View } from "react-native";

import { useUser } from "@/context/UserContext";
import { getProfileImageUrl } from "@/hooks/useGetImage";
import { ThemeType } from "../../theme/theme";
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
  const [isTracking, setIsTracking] = React.useState(true);

  const toggleTracking = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsTracking(!isTracking);
  };

  const { user } = useUser();

  const [logoError, setLogoError] = React.useState(false);
  const [logoUrl, setLogoUrl] = useState<string | undefined>();

  useEffect(() => {
    let isActive = true;
    setLogoError(false);

    const loadLogoUrl = async () => {
      const url = await getProfileImageUrl(
        user?.CustomerIdC,
        user?.CompIdN,
        user?.EmpIdN,
      );
      if (isActive) {
        setLogoUrl(url);
      }
    };

    loadLogoUrl();

    return () => {
      isActive = false;
    };
  }, [user?.CustomerIdC, user?.CompIdN, user?.EmpIdN]);

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
              {
                backgroundColor: theme.primary + "10", // Light orange tint
                borderColor: theme.primary + "20",
              },
            ]}
          >
            <Image
              source={
                !logoError && logoUrl
                  ? { uri: logoUrl }
                  : require("@/assets/images/trickyhr.png")
              }
              onError={() => setLogoError(true)}
              style={styles.avatarImage}
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

        {/* <View style={[styles.idCardBottom, { borderTopColor: theme.inputBorder }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: isTracking ? '#10B981' : '#CBD5E1', justifyContent: 'center', alignItems: 'center' }}>
                            <Feather name="map-pin" size={12} color="#fff" />
                        </View>
                        <View>
                            <Text style={[styles.trackingTitle, { color: theme.text, fontSize: 13, fontWeight: '600' }]}>
                                Live Tracking: <Text style={{ color: isTracking ? '#10B981' : '#64748B' }}>{isTracking ? 'ON' : 'OFF'}</Text>
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={toggleTracking}
                        style={[
                            styles.toggleTrack,
                            {
                                backgroundColor: isTracking ? theme.primary + '20' : '#F1F5F9',
                                alignItems: isTracking ? 'flex-end' : 'flex-start'
                            }
                        ]}
                    >
                        <View style={[styles.toggleThumb, { backgroundColor: isTracking ? theme.primary : '#94A3B8' }]} />
                    </TouchableOpacity>
                </View> */}
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

  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 4,
    resizeMode: "cover",
  },

  avatarLargeText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
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
    borderRadius: 3,
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
    borderRadius: 14,
    padding: 2,
    justifyContent: "center",
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});
