import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import AppModal from '../../components/common/AppModal';
import { useTheme } from '../../context/ThemeContext';
import ApiService from '../../services/ApiService';

interface ProfileModalProps {
    visible: boolean;
    onClose: () => void;
    item: any;
    onRefresh?: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ visible, onClose, item, onRefresh }) => {
    const { theme } = useTheme();
    const [loading, setLoading] = useState(false);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [profileData, setProfileData] = useState<any>(null);

    if (!item) return null;

    const status = item.StatusC || item.StatusResult || item.Status || 'Waiting';

    // Status Logic for Color
    let statusInfo = { color: '#D97706', bg: '#FEF3C7', label: 'WAITING' };
    if (status.toLowerCase().includes('approv')) statusInfo = { color: '#16A34A', bg: '#DCFCE7', label: 'APPROVED' };
    if (status.toLowerCase().includes('reject') || status.toLowerCase().includes('cancel')) {
        statusInfo = { color: '#DC2626', bg: '#FEE2E2', label: status.toUpperCase() };
    }

    // Helper to format ASP.NET JSON Date
    const formatDate = (dateString: string) => {
        try {
            if (!dateString) return 'N/A';

            if (typeof dateString === 'string' && dateString.includes('/Date(')) {
                const timestamp = parseInt(dateString.replace(/\/Date\((-?\d+)\)\//, '$1'));
                const date = new Date(timestamp);
                const year = date.getFullYear();
                if (year <= 1900) return 'N/A';
                return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
            }

            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;
            return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
        } catch (e) {
            return dateString;
        }
    };

    const getMaritalStatus = (status: number) => {
        const statuses = ['', 'Married', 'Unmarried', 'Divorce', 'Others', 'Widow'];
        return statuses[status] || 'N/A';
    };

    const getBloodGroup = (type: number) => {
        const types = ['', 'O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'A1+', 'A1B+', 'A1B-', 'A1-', 'B1+', 'B1-'];
        return types[type] || 'N/A';
    };

    // Fetch profile details
    useEffect(() => {
        const fetchProfileDetails = async () => {
            if (!visible || !item) return;

            setDetailsLoading(true);

            try {
                const result = await ApiService.getProfileUpdate();

                if (result?.success && result?.data?.data?.[0]) {
                    setProfileData(result.data.data[0]);
                }
            } catch (error) {
                console.error('Error fetching profile details:', error);
            } finally {
                setDetailsLoading(false);
            }
        };

        fetchProfileDetails();
    }, [visible, item]);

    const handleCancelRequest = async () => {
        Alert.alert(
            "Cancel Request",
            "Are you sure you want to cancel this profile update request?",
            [
                { text: "No", style: "cancel" },
                {
                    text: "Yes, Cancel",
                    style: "destructive",
                    onPress: async () => {
                        setLoading(true);
                        try {
                            const requestId = item.IdN || item.Id || item.id;
                            const parseDate = (dateStr: string | undefined) => {
                                if (!dateStr) return undefined;
                                try {
                                    if (typeof dateStr === 'string' && dateStr.includes('/Date(')) {
                                        const timestamp = parseInt(dateStr.replace(/\/Date\((-?\d+)\)\//, '$1'));
                                        return new Date(timestamp);
                                    }
                                    return new Date(dateStr);
                                } catch (e) { return undefined; }
                            };

                            const fromDate = parseDate(item.LFromDateD || item.FromDate);
                            const toDate = parseDate(item.LToDateD || item.ToDate);

                            const result = await ApiService.deleteRequest(
                                requestId,
                                'Pro',
                                fromDate,
                                toDate,
                                'Cancelled by user'
                            );

                            if (result.success) {
                                Alert.alert("Success", "Profile update request cancelled successfully");
                                onClose();
                                onRefresh?.();
                            } else {
                                Alert.alert("Error", result.error || "Failed to cancel profile request.");
                            }
                        } catch (error: any) {
                            Alert.alert("Error", error.message || "An unexpected error occurred.");
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const renderContent = () => {
        if (detailsLoading) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={[styles.loadingText, { color: theme.placeholder }]}>Loading details...</Text>
                </View>
            );
        }

        if (!profileData || !profileData.empProfile) {
            return (
                <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyText, { color: theme.placeholder }]}>No profile details available</Text>
                </View>
            );
        }

        const profile = profileData.empProfile;
        const children = profileData.profileEmpChildUpdate || [];
        const education = profileData.profileEmpEducationUpdate || [];
        const nations = profileData.nation || [];

        const getCurrentNation = () => {
            const nation = nations.find((n: any) => n.NationIdN === profile.CNationN);
            return nation?.NationNameC || 'N/A';
        };

        const getPermanentNation = () => {
            const nation = nations.find((n: any) => n.NationIdN === profile.PNationN);
            return nation?.NationNameC || 'N/A';
        };

        return (
            <>
                {/* Personal Details */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.textLight }]}>Personal Details</Text>

                    <InfoRow label="First Name" value={profile.EmpNameC || 'N/A'} theme={theme} />
                    <InfoRow label="Middle Name" value={profile.MiddleNameC || ''} theme={theme} />
                    <InfoRow label="Last Name" value={profile.LastNameC || ''} theme={theme} />

                    {/* Photo placeholder - you can add image loading here */}
                    <View style={styles.photoContainer}>
                        <Text style={[styles.infoLabel, { color: theme.textLight }]}>Photo</Text>
                        <View style={[styles.photoPlaceholder, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                            <Ionicons name="person-outline" size={40} color={theme.placeholder} />
                        </View>
                    </View>
                </View>

                {/* Other Details */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.textLight }]}>Other Details</Text>

                    <InfoRow label="Marital status" value={getMaritalStatus(profile.MaritalN)} theme={theme} />
                    {profile.MaritalN === 1 && (
                        <InfoRow label="Marriage Date" value={formatDate(profile.MarriedDateD)} theme={theme} />
                    )}
                    <InfoRow label="Blood Group" value={getBloodGroup(profile.BloodTypeN)} theme={theme} />
                    <InfoRow label="Phone No." value={profile.PhNoC || ''} theme={theme} />
                    <InfoRow label="Email_id" value={profile.EmailIdC || ''} theme={theme} />
                    <InfoRow label="Father Name" value={profile.FatherNameC || ''} theme={theme} />
                    <InfoRow label="Mother Name" value={profile.MotherNameC || ''} theme={theme} />

                    {profile.SpouseNameC && (
                        <>
                            <InfoRow label="Spouse Name" value={profile.SpouseNameC} theme={theme} />
                            <InfoRow label="Spouse Phone" value={profile.SpousePhNoC || ''} theme={theme} />
                            <InfoRow label="Spouse Email" value={profile.SpouseEmailIdC || ''} theme={theme} />
                        </>
                    )}
                </View>

                {/* Passport Details */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.textLight }]}>Passport Details</Text>

                    <InfoRow label="Passport No." value={profile.PassportNoC || ''} theme={theme} />
                    <InfoRow label="Issue_place" value={profile.IssuePlaceC || ''} theme={theme} />
                    <InfoRow label="Issue Date" value={formatDate(profile.IssueDateD)} theme={theme} />
                    <InfoRow label="Expiry date" value={formatDate(profile.ExpiryDateD)} theme={theme} />
                </View>

                {/* Current Address */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.textLight }]}>Current Address</Text>

                    <InfoRow label="Door No." value={profile.CDoorNoC || ''} theme={theme} />
                    <InfoRow label="Street" value={profile.CStreetC || ''} theme={theme} />
                    <InfoRow label="Area" value={profile.CAreaC || ''} theme={theme} />
                    <InfoRow label="City" value={profile.CCityC || ''} theme={theme} />
                    <InfoRow label="Pincode" value={profile.CPinC || ''} theme={theme} />
                    <InfoRow label="State" value={profile.CStateC || ''} theme={theme} />
                    <InfoRow label="Nation" value={getCurrentNation()} theme={theme} />
                </View>

                {/* Permanent Address */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.textLight }]}>Permanent Address</Text>

                    <InfoRow label="Door No." value={profile.PDoorNoC || ''} theme={theme} />
                    <InfoRow label="Street" value={profile.PStreetC || ''} theme={theme} />
                    <InfoRow label="Area" value={profile.PAreaC || ''} theme={theme} />
                    <InfoRow label="City" value={profile.PCityC || ''} theme={theme} />
                    <InfoRow label="pincode" value={profile.PPinC || ''} theme={theme} />
                    <InfoRow label="State" value={profile.PStateC || ''} theme={theme} />
                    <InfoRow label="Nation" value={getPermanentNation()} theme={theme} />
                </View>

                {/* Child Details */}
                {children.length > 0 && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.textLight }]}>Child Details</Text>
                        {children.map((child: any, index: number) => {
                            if (child.EmpIdN === 0) return null;
                            return (
                                <View key={index} style={[styles.childCard, { backgroundColor: theme.inputBg }]}>
                                    <Text style={[styles.childName, { color: theme.text }]}>
                                        {child.NameC || 'N/A'}
                                    </Text>
                                    <Text style={[styles.childDetail, { color: theme.placeholder }]}>
                                        DOB: {formatDate(child.BDateD)}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                )}

                {/* Education Details */}
                {education.length > 0 && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.textLight }]}>Education Details</Text>
                        {education.map((edu: any, index: number) => {
                            if (edu.EmpIdN === 0) return null;
                            return (
                                <View key={index} style={[styles.eduCard, { backgroundColor: theme.inputBg }]}>
                                    <Text style={[styles.eduTitle, { color: theme.text }]}>
                                        {edu.EducationC || 'N/A'}
                                    </Text>
                                    <Text style={[styles.eduDetail, { color: theme.placeholder }]}>
                                        {edu.CenterC || 'N/A'} • {edu.YearN || 'N/A'}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                )}
            </>
        );
    };

    return (
        <AppModal
            visible={visible}
            onClose={onClose}
            title="My Profile"
            subtitle={`Ref: #${item.IdN || 'N/A'}`}
            footer={(status.toLowerCase().includes('waiting') || status.toLowerCase().includes('pending')) ? (
                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleCancelRequest}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.cancelButtonText}>Cancel Request</Text>
                    )}
                </TouchableOpacity>
            ) : null}
        >
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.badgeRow}>
                    <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
                        <View style={[styles.dot, { backgroundColor: statusInfo.color }]} />
                        <Text style={[styles.statusLabelText, { color: statusInfo.color }]}>
                            {statusInfo.label}
                        </Text>
                    </View>
                </View>

                {renderContent()}
            </ScrollView>
        </AppModal>
    );
};

// Helper component for info rows
const InfoRow = ({ label, value, theme }: { label: string; value: string; theme: any }) => (
    <View style={styles.infoRow}>
        <Text style={[styles.infoLabel, { color: theme.textLight }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: theme.text }]}>: {value}</Text>
    </View>
);

const styles = StyleSheet.create({
    modalBody: {
        padding: 18,
        flexShrink: 1,
    },
    badgeRow: {
        flexDirection: 'row',
        marginBottom: 24,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
        gap: 6,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusLabelText: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
        letterSpacing: 0.5,
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 10,
        alignItems: 'flex-start',
    },
    infoLabel: {
        fontSize: 14,
        fontWeight: '500',
        width: 130,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '500',
        flex: 1,
    },
    photoContainer: {
        flexDirection: 'row',
        marginBottom: 10,
        alignItems: 'center',
    },
    photoPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 8,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
    childCard: {
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    childName: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    childDetail: {
        fontSize: 12,
        fontWeight: '500',
    },
    eduCard: {
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    eduTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    eduDetail: {
        fontSize: 12,
        fontWeight: '500',
    },
    cancelButton: {
        height: 56,
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FEE2E2',
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    cancelButtonText: {
        color: '#DC2626',
        fontWeight: '700',
        fontSize: 16,
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 14,
        fontWeight: '600',
    },
});

export default ProfileModal;
