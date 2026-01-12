import Header from '@/components/Header';
import { API_ENDPOINTS } from '@/constants/api';
import { formatDateForApi, formatDisplayDate } from '@/constants/timeFormat';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { useProtectedBack } from '@/hooks/useProtectedBack';
import { getServerTime } from '@/services/ServerTime';
import {
    Ionicons,
    MaterialIcons
} from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    FlatList,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

type Nation = {
    NationIdN: number;
    NationNameC: string;
};

// Helper function to check if an object has meaningful data
const hasMeaningfulData = (obj: any, fields: string[]): boolean => {
    if (!obj) return false;
    return fields.some(field => {
        const value = obj[field];
        if (value === null || value === undefined || value === '') return false;
        // Check for empty dates (like "/Date(-2209008600000)/" which is 01/01/1900)
        if (field.includes('Date') && typeof value === 'string' && value.includes('/Date(-2209008600000)/')) {
            return false;
        }
        // Check for number fields with 0
        if (typeof value === 'number' && value === 0) return false;
        return true;
    });
};

// Fields to check for meaningful data in each type
const CHILD_FIELDS = ['NameC', 'BDateD', 'StatusN', 'HidNationIdN'];
const EDUCATION_FIELDS = ['EducationC', 'CenterC', 'YearN'];
const FAMILY_FIELDS = ['NamesC', 'DateofBirthD', 'RelationshipN', 'OccupationC', 'PhNoC', 'EmailIDC'];
const COMPANY_FIELDS = ['CompNameC', 'DesignationC', 'FromDateD', 'ToDateD', 'ExperienceN', 'DescC'];

// Filter functions for each type
const filterMeaningfulChildren = (children: any[]) =>
    children.filter(child => hasMeaningfulData(child, CHILD_FIELDS));

const filterMeaningfulEducation = (education: any[]) =>
    education.filter(edu => hasMeaningfulData(edu, EDUCATION_FIELDS));

const filterMeaningfulFamily = (family: any[]) =>
    family.filter(member => hasMeaningfulData(member, FAMILY_FIELDS));

const filterMeaningfulCompanies = (companies: any[]) =>
    companies.filter(company => hasMeaningfulData(company, COMPANY_FIELDS));

// CollapsibleCard component
const CollapsibleCard = ({
    title,
    icon,
    children,
    isOpen,
    onToggle,
    theme,
}: {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    isOpen: boolean;
    onToggle: () => void;
    theme: any;
}) => {
    const animatedHeight = React.useRef(new Animated.Value(0)).current;
    const rotateAnim = React.useRef(new Animated.Value(0)).current;
    const [measuredHeight, setMeasuredHeight] = useState(0);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(animatedHeight, {
                toValue: isOpen ? measuredHeight : 0,
                duration: 300,
                useNativeDriver: false,
            }),
            Animated.timing(rotateAnim, {
                toValue: isOpen ? 1 : 0,
                duration: 300,
                useNativeDriver: false,
            }),
        ]).start();
    }, [isOpen, measuredHeight]);

    const rotateIcon = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'],
    });

    return (
        <View style={[styles.collapsibleCard, { backgroundColor: theme.cardBackground }]}>
            {/* Header */}
            <TouchableOpacity
                style={styles.collapsibleHeader}
                onPress={onToggle}
                activeOpacity={0.7}
            >
                <View style={styles.collapsibleHeaderLeft}>
                    <LinearGradient
                        colors={[`${theme.primary}25`, `${theme.primary}10`]}
                        style={styles.cardIcon}
                    >
                        {icon}
                    </LinearGradient>
                    <Text style={[styles.collapsibleTitle, { color: theme.text }]}>
                        {title}
                    </Text>
                </View>
                <Animated.View style={{ transform: [{ rotate: rotateIcon }] }}>
                    <Ionicons name="chevron-down" size={24} color={theme.primary} />
                </Animated.View>
            </TouchableOpacity>

            {/* Animated visible container */}
            <Animated.View style={{ height: animatedHeight, overflow: 'hidden' }}>
                <View style={styles.collapsibleContent}>{children}</View>
            </Animated.View>

            {/* Hidden measurement container */}
            <View
                style={{
                    position: 'absolute',
                    opacity: 0,
                    zIndex: -1,
                    left: 0,
                    right: 0,
                }}
                pointerEvents="none"
                onLayout={(e) => {
                    const h = e.nativeEvent.layout.height;
                    if (h > 0 && measuredHeight !== h) {
                        setMeasuredHeight(h);
                    }
                }}
            >
                <View style={styles.collapsibleContent}>{children}</View>
            </View>
        </View>
    );
};

// Reusable component for edit mode array sections
const EditArraySection = ({
    title,
    data,
    renderItem,
    onAdd,
    onRemove,
    theme,
    emptyMessage = "No items added yet"
}: {
    title: string;
    data: any[];
    renderItem: (item: any, index: number) => React.ReactNode;
    onAdd: () => void;
    onRemove: (index: number) => void;
    theme: any;
    emptyMessage?: string;
}) => (
    <View style={styles.arraySection}>
        <View style={styles.arraySectionHeader}>
            <Text style={[styles.arraySectionTitle, { color: theme.text }]}>
                {title}
            </Text>
            <TouchableOpacity
                style={[styles.addButton, { backgroundColor: theme.primary }]}
                onPress={onAdd}
            >
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.addButtonText}>Add More</Text>
            </TouchableOpacity>
        </View>

        {data.length > 0 ? (
            data.map((item, index) => (
                <View key={index} style={[styles.arrayItemContainer, { backgroundColor: `${theme.primary}05` }]}>
                    <View style={styles.arrayItemHeader}>
                        <Text style={[styles.arrayItemIndex, { color: theme.primary }]}>
                            {title} {index + 1}
                        </Text>
                        {data.length > 1 && (
                            <TouchableOpacity
                                style={[styles.removeButton, { backgroundColor: theme.error || '#dc2626' }]}
                                onPress={() => onRemove(index)}
                            >
                                <Ionicons name="trash-outline" size={16} color="#fff" />
                            </TouchableOpacity>
                        )}
                    </View>
                    {renderItem(item, index)}
                </View>
            ))
        ) : (
            <View style={[styles.emptyArrayContainer, { backgroundColor: `${theme.primary}05` }]}>
                <Text style={[styles.emptyArrayText, { color: theme.textLight }]}>{emptyMessage}</Text>
                <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: theme.primary }]}
                    onPress={onAdd}
                >
                    <Ionicons name="add" size={18} color="#fff" />
                    <Text style={styles.addButtonText}>Add First Item</Text>
                </TouchableOpacity>
            </View>
        )}
    </View>
);

export default function UserProfile() {
    const { theme } = useTheme();
    const { user } = useUser();

    const [userData, setUserData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [sameAddress, setSameAddress] = useState(false);

    // Collapsible states
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        basic: true,
        personal: false,
        spouse: false,
        currentAddress: false,
        permanentAddress: false,
        passport: false,
        children: false,
        education: false,
        family: false,
        companies: false,
    });

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    // Modal states for selection
    const [showMaritalModal, setShowMaritalModal] = useState(false);
    const [showBloodGroupModal, setShowBloodGroupModal] = useState(false);
    const [showNationalityModal, setShowNationalityModal] = useState(false);
    const [showChildNationModal, setShowChildNationModal] = useState(false);
    const [childIndexForNation, setChildIndexForNation] = useState(0);
    const [datePickerState, setDatePickerState] = useState<{
        visible: boolean;
        target:
        | { scope: 'form'; field: keyof typeof formData }
        | { scope: 'child'; field: 'BDateD'; index: number }
        | { scope: 'family'; field: 'DateofBirthD'; index: number }
        | { scope: 'company'; field: 'FromDateD' | 'ToDateD'; index: number }
        | null;
        initialDate: Date;
    }>({
        visible: false,
        target: null,
        initialDate: new Date(),
    });

    // Selection options
    const maritalOptions = [
        { id: 1, label: 'Single' },
        { id: 2, label: 'Married' },
    ];

    const bloodGroupOptions = [
        { id: 1, label: 'A+' },
        { id: 2, label: 'A-' },
        { id: 3, label: 'B+' },
        { id: 4, label: 'B-' },
        { id: 5, label: 'O+' },
        { id: 6, label: 'O-' },
        { id: 7, label: 'AB+' },
        { id: 8, label: 'AB-' },
    ];

    const [formData, setFormData] = useState({
        // Basic Info
        EmpNameC: '',
        MiddleNameC: '',
        LastNameC: '',
        EmailIdC: '',
        PhNoC: '',

        // Current Address
        CDoorNoC: '',
        CStreetC: '',
        CAreaC: '',
        CCityC: '',
        CStateC: '',
        CPinC: '',
        CNationN: 1,

        // Permanent Address
        PDoorNoC: '',
        PStreetC: '',
        PAreaC: '',
        PCityC: '',
        PStateC: '',
        PPinC: '',
        PNationN: 1,

        // Personal Details
        MaritalN: 1,
        BloodTypeN: 0,
        FatherNameC: '',
        MotherNameC: '',

        // Spouse Details
        MarriedDateD: '',
        SpouseNameC: '',
        SpousePhNoC: '',
        SpouseEmailIdC: '',

        // Passport Details
        PassportNoC: '',
        IssuePlaceC: '',
        IssueDateD: '',
        ExpiryDateD: '',

        // Same address flag
        SameCurrentAddN: 0,
    });

    // Children and Education arrays - start with empty arrays
    const [children, setChildren] = useState<any[]>([]);
    const [education, setEducation] = useState<any[]>([]);
    const [family, setFamily] = useState<any[]>([]);
    const [previousCompanies, setPreviousCompanies] = useState<any[]>([]);

    // Helper functions to create empty items
    const createEmptyChild = () => ({
        EmpIdN: profile?.EmpIdN || 0,
        NameC: '',
        BDateD: '',
        NationIdN: '',
        HidNationIdN: 0,
        StatusN: ''
    });

    const createEmptyEducation = () => ({
        EmpIdN: profile?.EmpIdN || 0,
        EducationC: '',
        CenterC: '',
        YearN: 0
    });

    const createEmptyFamily = () => ({
        EmpIdN: profile?.EmpIdN || 0,
        NamesC: '',
        DateofBirthD: '',
        RelationshipN: '',
        OccupationC: '',
        PhNoC: '',
        EmailIDC: ''
    });

    const createEmptyCompany = () => ({
        EmpIdN: profile?.EmpIdN || 0,
        CompNameC: '',
        DesignationC: '',
        FromDateD: '',
        ToDateD: '',
        ExperienceN: '',
        DescC: ''
    });

    // Add item functions
    const addNewChild = () => {
        setChildren(prev => [...prev, createEmptyChild()]);
    };

    const addNewEducation = () => {
        setEducation(prev => [...prev, createEmptyEducation()]);
    };

    const addNewFamilyMember = () => {
        setFamily(prev => [...prev, createEmptyFamily()]);
    };

    const addNewCompany = () => {
        setPreviousCompanies(prev => [...prev, createEmptyCompany()]);
    };

    // Remove item functions
    const removeChild = (index: number) => {
        setChildren(prev => prev.filter((_, i) => i !== index));
    };

    const removeEducation = (index: number) => {
        setEducation(prev => prev.filter((_, i) => i !== index));
    };

    const removeFamilyMember = (index: number) => {
        setFamily(prev => prev.filter((_, i) => i !== index));
    };

    const removeCompany = (index: number) => {
        setPreviousCompanies(prev => prev.filter((_, i) => i !== index));
    };

    const formatApiDateSafe = (val: any, fallback: string) => {
        if (!val) return fallback;
        if (typeof val === 'string' && val.includes('/Date(')) {
            const timestamp = parseInt(val.replace(/\D/g, ''), 10);
            if (!Number.isFinite(timestamp)) return fallback;
            return formatDateForApi(new Date(timestamp));
        }
        const parsed = new Date(val);
        if (isNaN(parsed.getTime())) return fallback;
        return formatDateForApi(parsed);
    };

    const formatDateInput = (dateStr: string) => {
        if (!dateStr || dateStr === '01/01/1900' || dateStr.includes('/Date(-2209008600000)/')) {
            return '';
        }
        return dateStr;
    };

    const parseDateValue = (value?: string) => {
        if (!value) return null;
        if (value.includes('/Date(')) {
            const timestamp = parseInt(value.replace(/\D/g, ''), 10);
            if (!Number.isFinite(timestamp)) return null;
            return new Date(timestamp);
        }
        const parsed = new Date(value);
        return isNaN(parsed.getTime()) ? null : parsed;
    };

    const formatDateValueForInput = (value?: string) => {
        if (!value) return '';
        const parsed = parseDateValue(value);
        return parsed ? formatDateForApi(parsed) : value;
    };

    const openDatePicker = (
        target:
            | { scope: 'form'; field: keyof typeof formData }
            | { scope: 'child'; field: 'BDateD'; index: number }
            | { scope: 'family'; field: 'DateofBirthD'; index: number }
            | { scope: 'company'; field: 'FromDateD' | 'ToDateD'; index: number },
        currentValue?: string
    ) => {
        const parsed = parseDateValue(currentValue);
        setDatePickerState({
            visible: true,
            target,
            initialDate: parsed || new Date(),
        });
    };

    const applyPickedDate = (
        target:
            | { scope: 'form'; field: keyof typeof formData }
            | { scope: 'child'; field: 'BDateD'; index: number }
            | { scope: 'family'; field: 'DateofBirthD'; index: number }
            | { scope: 'company'; field: 'FromDateD' | 'ToDateD'; index: number },
        selected: Date
    ) => {
        const formatted = formatDateForApi(selected);
        if (target.scope === 'form') {
            handleFieldChange(target.field, formatted as typeof formData[typeof target.field]);
            return;
        }
        if (target.scope === 'child') {
            handleChildChange(target.index, target.field, formatted);
            return;
        }
        if (target.scope === 'family') {
            handleFamilyChange(target.index, target.field, formatted);
            return;
        }
        handleCompanyChange(target.index, target.field, formatted);
    };

    /* -------------------- API -------------------- */
    const fetchUserData = async () => {
        try {
            if (!user?.TokenC) return;

            const res = await axios.post(
                `${API_ENDPOINTS.CompanyUrl}${API_ENDPOINTS.PROFILE_URL}`,
                {
                    TokenC: user.TokenC,
                    BlnEmpMaster: true,
                    ViewReject: false,
                },
                { headers: { 'Content-Type': 'application/json' } }
            );

            setUserData(res.data?.data || []);
        } catch (err: any) {
            console.error('Profile API Error:', err?.response?.data || err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatServerDateSafe = async (
        token: string,
        value?: string,
        fallback = '/Date(-2209008600000)/' // 01/01/1900
    ): Promise<string> => {
        if (!value) return fallback;

        // Already server format → send as-is
        if (typeof value === 'string' && value.includes('/Date(')) {
            return value;
        }

        // Convert using server
        try {
            return await getServerTime(token, value);
        } catch {
            return fallback;
        }
    };


    const updateProfileData = async () => {
        try {
            if (!user?.TokenC || !profile) return;
            setIsSaving(true);

            const token = user?.TokenC;

            const resolvedPermanent = sameAddress
                ? {
                    PDoorNoC: formData.CDoorNoC,
                    PStreetC: formData.CStreetC,
                    PAreaC: formData.CAreaC,
                    PCityC: formData.CCityC,
                    PStateC: formData.CStateC,
                    PPinC: formData.CPinC,
                    PNationN: formData.CNationN,
                }
                : {
                    PDoorNoC: formData.PDoorNoC,
                    PStreetC: formData.PStreetC,
                    PAreaC: formData.PAreaC,
                    PCityC: formData.PCityC,
                    PStateC: formData.PStateC,
                    PPinC: formData.PPinC,
                    PNationN: formData.PNationN,
                };

            const payload = {
                TokenC: token,

                Model: [
                    {
                        EmpIdN: profile.EmpIdN,
                        EmpNameC: formData.EmpNameC.trim(),
                        MiddleNameC: formData.MiddleNameC.trim(),
                        LastNameC: formData.LastNameC.trim(),

                        CDoorNoC: formData.CDoorNoC.trim(),
                        CStreetC: formData.CStreetC.trim(),
                        CAreaC: formData.CAreaC.trim(),
                        CCityC: formData.CCityC.trim(),
                        CStateC: formData.CStateC.trim(),
                        CPinC: formData.CPinC.trim(),
                        CNationN: formData.CNationN,

                        ...resolvedPermanent,

                        PhNoC: formData.PhNoC.trim(),
                        EmailIdC: formData.EmailIdC.trim(),

                        MaritalN: formData.MaritalN,
                        BloodTypeN: formData.BloodTypeN,

                        MarriedDateD: await formatServerDateSafe(
                            token,
                            formData.MarriedDateD
                        ),

                        SpouseNameC: formData.SpouseNameC || '',
                        SpousePhNoC: formData.SpousePhNoC || '',
                        SpouseEmailIdC: formData.SpouseEmailIdC || '',

                        FatherNameC: formData.FatherNameC || '',
                        MotherNameC: formData.MotherNameC || '',

                        PassportNoC: formData.PassportNoC || '',
                        IssuePlaceC: formData.IssuePlaceC || '',

                        IssueDateD: await formatServerDateSafe(
                            token,
                            formData.IssueDateD,
                        ),

                        ExpiryDateD: await formatServerDateSafe(
                            token,
                            formData.ExpiryDateD,
                        ),

                        SameCurrentAddN: sameAddress ? 1 : 0,
                    },
                ],

                Child: await Promise.all(
                    children.map(async (child) => ({
                        EmpIdN: profile.EmpIdN,
                        NameC: child.NameC || '',
                        BDateD: await formatServerDateSafe(
                            token,
                            child.BDateD,
                        ),
                        HidNationIdN: child.HidNationIdN || 0,
                        StatusN: child.StatusN || '',
                    }))
                ),

                Education: education.map((edu) => ({
                    EmpIdN: profile.EmpIdN,
                    EducationC: edu.EducationC || '',
                    CenterC: edu.CenterC || '',
                    YearN: edu.YearN || 0,
                })),
            };

            const res = await axios.post(
                `${API_ENDPOINTS.CompanyUrl}${API_ENDPOINTS.UPLOADPRO_URL}`,
                payload,
                { headers: { 'Content-Type': 'application/json' } }
            );

            if (res.data?.Status === 'success') {
                setIsEditing(false);
                await fetchUserData();
                Alert.alert('Success', 'Profile updated successfully!');
            } else {
                Alert.alert('Profile Update', res.data?.Error || 'Update failed.');
            }
        } catch (err: any) {
            Alert.alert(
                'Profile Update',
                err?.response?.data?.Error || err.message
            );
        } finally {
            setIsSaving(false);
        }
    };


    useEffect(() => {
        fetchUserData();
    }, [user]);

    useProtectedBack({
        home: '/home',
        settings: '/settings',
        dashboard: '/dashboard',
    });

    /* -------------------- DATA -------------------- */
    const profile = userData?.[0]?.empProfile;
    const nations: Nation[] = userData?.[0]?.nation || [];

    useEffect(() => {
        if (!profile) return;

        // Initialize form data
        setFormData({
            EmpNameC: profile.EmpNameC || '',
            MiddleNameC: profile.MiddleNameC || '',
            LastNameC: profile.LastNameC || '',
            EmailIdC: profile.EmailIdC || '',
            PhNoC: profile.PhNoC || '',
            CDoorNoC: profile.CDoorNoC || '',
            CStreetC: profile.CStreetC || '',
            CAreaC: profile.CAreaC || '',
            CCityC: profile.CCityC || '',
            CStateC: profile.CStateC || '',
            CPinC: profile.CPinC || '',
            CNationN: profile.CNationN || 1,
            PDoorNoC: profile.PDoorNoC || '',
            PStreetC: profile.PStreetC || '',
            PAreaC: profile.PAreaC || '',
            PCityC: profile.PCityC || '',
            PStateC: profile.PStateC || '',
            PPinC: profile.PPinC || '',
            PNationN: profile.PNationN || 1,
            MaritalN: profile.MaritalN || 1,
            BloodTypeN: profile.BloodTypeN || 0,
            FatherNameC: profile.FatherNameC || '',
            MotherNameC: profile.MotherNameC || '',
            MarriedDateD: formatDateInput(profile.MarriedDateD),
            SpouseNameC: profile.SpouseNameC || '',
            SpousePhNoC: profile.SpousePhNoC || '',
            SpouseEmailIdC: profile.SpouseEmailIdC || '',
            PassportNoC: profile.PassportNoC || '',
            IssuePlaceC: profile.IssuePlaceC || '',
            IssueDateD: formatDateInput(profile.IssueDateD),
            ExpiryDateD: formatDateInput(profile.ExpiryDateD),
            SameCurrentAddN: profile.SameCurrentAddN || 0,
        });

        // Filter out empty items from API response
        const rawChildren = userData?.[0]?.ProfileEmpChild || [];
        const rawEducation = userData?.[0]?.ProfileEmpEducation || [];
        const rawFamily = userData?.[0]?.EmpFamily || [];
        const rawCompanies = userData?.[0]?.PerviousComp || [];

        // Initialize arrays with meaningful data only
        const meaningfulChildren = filterMeaningfulChildren(rawChildren);
        const meaningfulEducation = filterMeaningfulEducation(rawEducation);
        const meaningfulFamily = filterMeaningfulFamily(rawFamily);
        const meaningfulCompanies = filterMeaningfulCompanies(rawCompanies);

        // If there's meaningful data, use it. Otherwise, start with empty array.
        setChildren(meaningfulChildren);
        setEducation(meaningfulEducation);
        setFamily(meaningfulFamily);
        setPreviousCompanies(meaningfulCompanies);

        // Set same address flag
        setSameAddress(!!profile.SameCurrentAddN);
    }, [profile]);

    const nationality = nations.find((n: any) => n.NationIdN === formData.CNationN)?.NationNameC || '-';
    const permanentNationality = nations.find((n: any) => n.NationIdN === formData.PNationN)?.NationNameC || '-';
    const maritalStatusLabel = maritalOptions.find(m => m.id === formData.MaritalN)?.label || '-';
    const bloodGroupLabel = bloodGroupOptions.find(b => b.id === formData.BloodTypeN)?.label || '-';

    const syncPermanentAddress = (data: typeof formData) => ({
        ...data,
        PDoorNoC: data.CDoorNoC,
        PStreetC: data.CStreetC,
        PAreaC: data.CAreaC,
        PCityC: data.CCityC,
        PStateC: data.CStateC,
        PPinC: data.CPinC,
        PNationN: data.CNationN,
    });

    const handleFieldChange = <K extends keyof typeof formData>(
        field: K,
        value: typeof formData[K]
    ) => {
        setFormData((prev) => {
            const next = { ...prev, [field]: value };

            const currentToPermanentMap: Partial<
                Record<keyof typeof formData, keyof typeof formData>
            > = {
                CDoorNoC: 'PDoorNoC',
                CStreetC: 'PStreetC',
                CAreaC: 'PAreaC',
                CCityC: 'PCityC',
                CStateC: 'PStateC',
                CPinC: 'PPinC',
                CNationN: 'PNationN',
            };

            if (sameAddress) {
                const mappedKey = currentToPermanentMap[field];
                if (mappedKey) {
                    next[mappedKey] = value as typeof formData[typeof mappedKey];
                }
            }

            return next;
        });
    };

    const handleChildChange = (index: number, field: string, value: string) => {
        const newChildren = [...children];
        newChildren[index] = { ...newChildren[index], [field]: value };
        setChildren(newChildren);
    };

    const handleEducationChange = (index: number, field: string, value: string | number) => {
        const newEducation = [...education];
        newEducation[index] = { ...newEducation[index], [field]: value };
        setEducation(newEducation);
    };

    const handleFamilyChange = (index: number, field: string, value: string) => {
        const newFamily = [...family];
        newFamily[index] = { ...newFamily[index], [field]: value };
        setFamily(newFamily);
    };

    const handleCompanyChange = (index: number, field: string, value: string) => {
        const newCompanies = [...previousCompanies];
        newCompanies[index] = { ...newCompanies[index], [field]: value };
        setPreviousCompanies(newCompanies);
    };

    const handleToggleSameAddress = (value: boolean) => {
        setSameAddress(value);
        if (value) {
            setFormData((prev) => syncPermanentAddress(prev));
        }
    };

    const SelectionModal = ({
        visible,
        title,
        options,
        selectedId,
        onSelect,
        onClose
    }: {
        visible: boolean;
        title: string;
        options: Array<{ id: number; label: string }>;
        selectedId: number;
        onSelect: (id: number) => void;
        onClose: () => void;
    }) => (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
                    <Text style={[styles.modalTitle, { color: theme.text }]}>{title}</Text>
                    <FlatList
                        data={options}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[styles.modalItem, {
                                    backgroundColor: item.id === selectedId ? `${theme.primary}20` : 'transparent',
                                }]}
                                onPress={() => {
                                    onSelect(item.id);
                                    onClose();
                                }}
                            >
                                <Text style={[styles.modalItemText, { color: theme.text }]}>
                                    {item.label}
                                </Text>
                                {item.id === selectedId && (
                                    <Ionicons name="checkmark" size={20} color={theme.primary} />
                                )}
                            </TouchableOpacity>
                        )}
                    />
                    <TouchableOpacity
                        style={[styles.modalCloseButton, { backgroundColor: theme.primary }]}
                        onPress={onClose}
                    >
                        <Text style={styles.modalCloseButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    const NationSelectionModal = ({
        visible,
        title,
        selectedId,
        onSelect,
        onClose
    }: {
        visible: boolean;
        title: string;
        selectedId: number;
        onSelect: (id: number) => void;
        onClose: () => void;
    }) => (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
                    <Text style={[styles.modalTitle, { color: theme.text }]}>{title}</Text>
                    <FlatList
                        data={nations}
                        keyExtractor={(item) => item.NationIdN.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[styles.modalItem, {
                                    backgroundColor: item.NationIdN === selectedId ? `${theme.primary}20` : 'transparent',
                                }]}
                                onPress={() => {
                                    onSelect(item.NationIdN);
                                    onClose();
                                }}
                            >
                                <Text style={[styles.modalItemText, { color: theme.text }]}>
                                    {item.NationNameC}
                                </Text>
                                {item.NationIdN === selectedId && (
                                    <Ionicons name="checkmark" size={20} color={theme.primary} />
                                )}
                            </TouchableOpacity>
                        )}
                    />
                    <TouchableOpacity
                        style={[styles.modalCloseButton, { backgroundColor: theme.primary }]}
                        onPress={onClose}
                    >
                        <Text style={styles.modalCloseButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    if (loading || !profile) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.emptyState}>
                    <Ionicons name="person-circle-outline" size={80} color={theme.textLight} />
                    <Text style={[styles.emptyStateTitle, { color: theme.text }]}>
                        Loading Profile
                    </Text>
                    <Text style={[styles.emptyStateText, { color: theme.textLight }]}>
                        Please wait...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    /* -------------------- UI HELPERS -------------------- */
    const DetailRow = ({
        label,
        value,
        withDivider = true,
    }: {
        label: string;
        value: string | number;
        withDivider?: boolean;
    }) => (
        <>
            <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.textLight }]}>
                    {label}
                </Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>
                    {value}
                </Text>
            </View>
            {withDivider && <View style={[styles.divider, { backgroundColor: `${theme.textLight}20` }]} />}
        </>
    );

    const EditableRow = ({
        label,
        value,
        onChangeText,
        editable = true,
        keyboardType = 'default',
        placeholder = '-',
        multiline = false,
    }: {
        label: string;
        value: string;
        onChangeText: (text: string) => void;
        editable?: boolean;
        keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
        placeholder?: string;
        multiline?: boolean;
    }) => (
        <View style={styles.editRow}>
            <Text style={[styles.detailLabel, { color: theme.textLight }]}>{label}</Text>
            <TextInput
                value={value}
                onChangeText={onChangeText}
                editable={editable}
                keyboardType={keyboardType}
                placeholder={placeholder}
                placeholderTextColor={theme.textLight}
                multiline={multiline}
                style={[
                    styles.input,
                    {
                        backgroundColor: theme.inputBg,
                        borderColor: theme.inputBorder,
                        color: theme.text,
                        minHeight: multiline ? 80 : 40,
                        textAlignVertical: multiline ? 'top' : 'center',
                    },
                    !editable && styles.inputDisabled,
                ]}
            />
        </View>
    );

    const DateRow = ({
        label,
        value,
        onPress,
        placeholder = 'Select date',
    }: {
        label: string;
        value: string;
        onPress: () => void;
        placeholder?: string;
    }) => (
        <TouchableOpacity style={styles.editRow} onPress={onPress} activeOpacity={0.7}>
            <Text style={[styles.detailLabel, { color: theme.textLight }]}>{label}</Text>
            <View
                style={[
                    styles.selectionInput,
                    {
                        backgroundColor: theme.inputBg,
                        borderColor: theme.inputBorder,
                    },
                ]}
            >
                <View style={styles.dateValueRow}>
                    <Ionicons name="calendar-outline" size={18} color={theme.primary} />
                    <Text
                        style={[
                            styles.dateValueText,
                            { color: value ? theme.text : theme.textLight },
                        ]}
                    >
                        {value || placeholder}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    const SelectionRow = ({
        label,
        value,
        onPress,
    }: {
        label: string;
        value: string;
        onPress: () => void;
    }) => (
        <TouchableOpacity style={styles.editRow} onPress={onPress}>
            <Text style={[styles.detailLabel, { color: theme.textLight }]}>{label}</Text>
            <View style={[styles.selectionInput, { backgroundColor: theme.inputBg }]}>
                <Text style={{ color: theme.text }}>{value}</Text>
                <Ionicons name="chevron-down" size={20} color={theme.textLight} />
            </View>
        </TouchableOpacity>
    );

    const ViewArraySection = ({
        title,
        data,
        renderItem,
        emptyMessage = 'No items added',
    }: {
        title: string;
        data: any[];
        renderItem: (item: any, index: number) => React.ReactNode;
        emptyMessage?: string;
    }) => (
        <View style={styles.arraySection}>
            <Text style={[styles.arraySectionTitle, { color: theme.text }]}>{title}</Text>
            {data.length > 0 ? (
                data.map((item, index) => (
                    <View key={index} style={[styles.arrayItemContainer, { backgroundColor: `${theme.primary}05` }]}>
                        {renderItem(item, index)}
                    </View>
                ))
            ) : (
                <Text style={[styles.emptyArrayText, { color: theme.textLight }]}>{emptyMessage}</Text>
            )}
        </View>
    );

    /* -------------------- RENDER -------------------- */
    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Header title="Profile" />

                {/* Selection Modals */}
                <SelectionModal
                    visible={showMaritalModal}
                    title="Select Marital Status"
                    options={maritalOptions}
                    selectedId={formData.MaritalN}
                    onSelect={(id) => handleFieldChange('MaritalN', id)}
                    onClose={() => setShowMaritalModal(false)}
                />

                <SelectionModal
                    visible={showBloodGroupModal}
                    title="Select Blood Group"
                    options={bloodGroupOptions}
                    selectedId={formData.BloodTypeN}
                    onSelect={(id) => handleFieldChange('BloodTypeN', id)}
                    onClose={() => setShowBloodGroupModal(false)}
                />

                <NationSelectionModal
                    visible={showNationalityModal}
                    title="Select Nationality"
                    selectedId={formData.CNationN}
                    onSelect={(id) => handleFieldChange('CNationN', id)}
                    onClose={() => setShowNationalityModal(false)}
                />

                <NationSelectionModal
                    visible={showChildNationModal}
                    title="Select Child's Nationality"
                    selectedId={children[childIndexForNation]?.HidNationIdN || 0}
                    onSelect={(id) => {
                        const newChildren = [...children];
                        newChildren[childIndexForNation] = {
                            ...newChildren[childIndexForNation],
                            HidNationIdN: id
                        };
                        setChildren(newChildren);
                    }}
                    onClose={() => setShowChildNationModal(false)}
                />

                {/* PROFILE HEADER */}
                <LinearGradient
                    colors={[theme.primary, `${theme.primary}cc`]}
                    style={styles.profileHeader}
                >
                    <Ionicons name="person-circle" size={90} color="#fff" />
                    <Text style={styles.profileName}>{profile.EmpNameC}</Text>
                    <Text style={styles.profileSub}>{profile.EmailIdC}</Text>
                </LinearGradient>

                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: theme.primary }]}
                        onPress={isEditing ? updateProfileData : () => setIsEditing(true)}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons
                                    name={isEditing ? 'save-outline' : 'create-outline'}
                                    size={18}
                                    color="#fff"
                                />
                                <Text style={styles.actionButtonText}>
                                    {isEditing ? 'Save' : 'Edit'}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {isEditing &&
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: theme.primary || '#dc2626' }]}
                            onPress={() => setIsEditing(false)}
                            disabled={isSaving}
                        >
                            <>
                                <Ionicons
                                    name='close'
                                    size={18}
                                    color="#fff"
                                />
                                <Text style={styles.actionButtonText}>
                                    Cancel
                                </Text>
                            </>
                        </TouchableOpacity>
                    }
                </View>

                {/* BASIC INFO - Collapsible */}
                <CollapsibleCard
                    title="Basic Information"
                    icon={<Ionicons name="person-outline" size={22} color={theme.primary} />}
                    isOpen={expandedSections.basic}
                    onToggle={() => toggleSection('basic')}
                    theme={theme}
                >
                    <DetailRow label="Employee ID" value={profile.EmpIdN} />
                    {isEditing ? (
                        <>
                            <EditableRow
                                label="Full Name"
                                value={formData.EmpNameC}
                                onChangeText={(text) => handleFieldChange('EmpNameC', text)}
                            />
                            <EditableRow
                                label="Middle Name"
                                value={formData.MiddleNameC}
                                onChangeText={(text) => handleFieldChange('MiddleNameC', text)}
                            />
                            <EditableRow
                                label="Last Name"
                                value={formData.LastNameC}
                                onChangeText={(text) => handleFieldChange('LastNameC', text)}
                            />
                            <EditableRow
                                label="Email"
                                value={formData.EmailIdC}
                                keyboardType="email-address"
                                onChangeText={(text) => handleFieldChange('EmailIdC', text)}
                            />
                            <EditableRow
                                label="Phone"
                                value={formData.PhNoC}
                                keyboardType="phone-pad"
                                onChangeText={(text) => handleFieldChange('PhNoC', text)}
                            />
                        </>
                    ) : (
                        <>
                            <DetailRow label="Full Name" value={profile.EmpNameC} />
                            <DetailRow label="Middle Name" value={profile.MiddleNameC || '-'} />
                            <DetailRow label="Last Name" value={profile.LastNameC || '-'} />
                            <DetailRow label="Email" value={profile.EmailIdC || '-'} />
                            <DetailRow label="Phone" value={profile.PhNoC || '-'} withDivider={false} />
                        </>
                    )}
                </CollapsibleCard>

                {/* PERSONAL INFO - Collapsible */}
                <CollapsibleCard
                    title="Personal Details"
                    icon={<Ionicons name="heart-outline" size={22} color={theme.primary} />}
                    isOpen={expandedSections.personal}
                    onToggle={() => toggleSection('personal')}
                    theme={theme}
                >
                    {isEditing ? (
                        <>
                            <SelectionRow
                                label="Marital Status"
                                value={maritalStatusLabel}
                                onPress={() => setShowMaritalModal(true)}
                            />
                            <SelectionRow
                                label="Blood Group"
                                value={bloodGroupLabel}
                                onPress={() => setShowBloodGroupModal(true)}
                            />
                            <EditableRow
                                label="Father's Name"
                                value={formData.FatherNameC}
                                onChangeText={(text) => handleFieldChange('FatherNameC', text)}
                            />
                            <EditableRow
                                label="Mother's Name"
                                value={formData.MotherNameC}
                                onChangeText={(text) => handleFieldChange('MotherNameC', text)}
                            />
                        </>
                    ) : (
                        <>
                            <DetailRow label="Marital Status" value={maritalStatusLabel} />
                            <DetailRow label="Blood Group" value={bloodGroupLabel} />
                            <DetailRow label="Father's Name" value={profile.FatherNameC || '-'} />
                            <DetailRow label="Mother's Name" value={profile.MotherNameC || '-'} withDivider={false} />
                        </>
                    )}
                </CollapsibleCard>

                {/* SPOUSE INFO - Collapsible */}
                <CollapsibleCard
                    title="Spouse Details"
                    icon={<Ionicons name="people-outline" size={22} color={theme.primary} />}
                    isOpen={expandedSections.spouse}
                    onToggle={() => toggleSection('spouse')}
                    theme={theme}
                >
                    {isEditing ? (
                        <>
                            <DateRow
                                label="Marital Date"
                                value={formatDateValueForInput(formData.MarriedDateD)}
                                placeholder="MM/DD/YYYY"
                                onPress={() =>
                                    openDatePicker(
                                        { scope: 'form', field: 'MarriedDateD' },
                                        formData.MarriedDateD
                                    )
                                }
                            />
                            <EditableRow
                                label="Spouse Name"
                                value={formData.SpouseNameC}
                                onChangeText={(text) => handleFieldChange('SpouseNameC', text)}
                            />
                            <EditableRow
                                label="Spouse Phone"
                                value={formData.SpousePhNoC}
                                keyboardType="phone-pad"
                                onChangeText={(text) => handleFieldChange('SpousePhNoC', text)}
                            />
                            <EditableRow
                                label="Spouse Email"
                                value={formData.SpouseEmailIdC}
                                keyboardType="email-address"
                                onChangeText={(text) => handleFieldChange('SpouseEmailIdC', text)}
                            />
                        </>
                    ) : (
                        <>
                            <DetailRow label="Marital Date" value={formatDisplayDate(profile.MarriedDateD) || '-'} />
                            <DetailRow label="Spouse Name" value={profile.SpouseNameC || '-'} />
                            <DetailRow label="Spouse Phone" value={profile.SpousePhNoC || '-'} />
                            <DetailRow label="Spouse Email" value={profile.SpouseEmailIdC || '-'} withDivider={false} />
                        </>
                    )}
                </CollapsibleCard>

                {/* CURRENT ADDRESS - Collapsible */}
                <CollapsibleCard
                    title="Current Address"
                    icon={<Ionicons name="home-outline" size={22} color={theme.primary} />}
                    isOpen={expandedSections.currentAddress}
                    onToggle={() => toggleSection('currentAddress')}
                    theme={theme}
                >
                    {isEditing ? (
                        <>
                            <EditableRow
                                label="Current Door No"
                                value={formData.CDoorNoC}
                                onChangeText={(text) => handleFieldChange('CDoorNoC', text)}
                            />
                            <EditableRow
                                label="Current Street"
                                value={formData.CStreetC}
                                onChangeText={(text) => handleFieldChange('CStreetC', text)}
                            />
                            <EditableRow
                                label="Current Area"
                                value={formData.CAreaC}
                                onChangeText={(text) => handleFieldChange('CAreaC', text)}
                            />
                            <EditableRow
                                label="Current City"
                                value={formData.CCityC}
                                onChangeText={(text) => handleFieldChange('CCityC', text)}
                            />
                            <EditableRow
                                label="Current Pin Code"
                                value={formData.CPinC}
                                keyboardType="numeric"
                                onChangeText={(text) => handleFieldChange('CPinC', text)}
                            />
                            <EditableRow
                                label="Current State"
                                value={formData.CStateC}
                                onChangeText={(text) => handleFieldChange('CStateC', text)}
                            />
                            <SelectionRow
                                label="Current Nation"
                                value={nationality}
                                onPress={() => setShowNationalityModal(true)}
                            />
                        </>
                    ) : (
                        <>
                            <DetailRow label="Current Door No" value={profile.CDoorNoC || '-'} />
                            <DetailRow label="Current Street" value={profile.CStreetC || '-'} />
                            <DetailRow label="Current Area" value={profile.CAreaC || '-'} />
                            <DetailRow label="Current City" value={profile.CCityC || '-'} />
                            <DetailRow label="Current Pin Code" value={profile.CPinC || '-'} />
                            <DetailRow label="Current State" value={profile.CStateC || '-'} />
                            <DetailRow label="Current Nation" value={nationality} withDivider={false} />
                        </>
                    )}
                </CollapsibleCard>

                {/* PERMANENT ADDRESS - Collapsible */}
                <CollapsibleCard
                    title="Permanent Address"
                    icon={<Ionicons name="home-outline" size={22} color={theme.primary} />}
                    isOpen={expandedSections.permanentAddress}
                    onToggle={() => toggleSection('permanentAddress')}
                    theme={theme}
                >
                    {isEditing ? (
                        <>
                            <View style={styles.switchRow}>
                                <Text style={[styles.detailLabel, { color: theme.textLight }]}>
                                    Same as current address
                                </Text>
                                <Switch
                                    value={sameAddress}
                                    onValueChange={handleToggleSameAddress}
                                    trackColor={{ false: theme.inputBorder, true: theme.primary }}
                                    thumbColor="#fff"
                                />
                            </View>
                            <EditableRow
                                label="Permanent Door No"
                                value={formData.PDoorNoC}
                                onChangeText={(text) => handleFieldChange('PDoorNoC', text)}
                                editable={!sameAddress}
                            />
                            <EditableRow
                                label="Permanent Street"
                                value={formData.PStreetC}
                                onChangeText={(text) => handleFieldChange('PStreetC', text)}
                                editable={!sameAddress}
                            />
                            <EditableRow
                                label="Permanent Area"
                                value={formData.PAreaC}
                                onChangeText={(text) => handleFieldChange('PAreaC', text)}
                                editable={!sameAddress}
                            />
                            <EditableRow
                                label="Permanent City"
                                value={formData.PCityC}
                                onChangeText={(text) => handleFieldChange('PCityC', text)}
                                editable={!sameAddress}
                            />
                            <EditableRow
                                label="Permanent Pin Code"
                                value={formData.PPinC}
                                keyboardType="numeric"
                                onChangeText={(text) => handleFieldChange('PPinC', text)}
                                editable={!sameAddress}
                            />
                            <EditableRow
                                label="Permanent State"
                                value={formData.PStateC}
                                onChangeText={(text) => handleFieldChange('PStateC', text)}
                                editable={!sameAddress}
                            />
                            <DetailRow
                                label="Permanent Nation"
                                value={sameAddress ? nationality : permanentNationality}
                                withDivider={false}
                            />
                        </>
                    ) : (
                        <>
                            <DetailRow label="Permanent Door No" value={profile.PDoorNoC || '-'} />
                            <DetailRow label="Permanent Street" value={profile.PStreetC || '-'} />
                            <DetailRow label="Permanent Area" value={profile.PAreaC || '-'} />
                            <DetailRow label="Permanent City" value={profile.PCityC || '-'} />
                            <DetailRow label="Permanent Pin Code" value={profile.PPinC || '-'} />
                            <DetailRow label="Permanent State" value={profile.PStateC || '-'} />
                            <DetailRow label="Permanent Nation" value={permanentNationality} withDivider={false} />
                        </>
                    )}
                </CollapsibleCard>

                {/* PASSPORT DETAILS - Collapsible */}
                <CollapsibleCard
                    title="Passport Details"
                    icon={<MaterialIcons name="badge" size={22} color={theme.primary} />}
                    isOpen={expandedSections.passport}
                    onToggle={() => toggleSection('passport')}
                    theme={theme}
                >
                    {isEditing ? (
                        <>
                            <EditableRow
                                label="Passport No"
                                value={formData.PassportNoC}
                                onChangeText={(text) => handleFieldChange('PassportNoC', text)}
                            />
                            <EditableRow
                                label="Issue Place"
                                value={formData.IssuePlaceC}
                                onChangeText={(text) => handleFieldChange('IssuePlaceC', text)}
                            />
                            <DateRow
                                label="Issue Date"
                                value={formatDateValueForInput(formData.IssueDateD)}
                                placeholder="MM/DD/YYYY"
                                onPress={() =>
                                    openDatePicker(
                                        { scope: 'form', field: 'IssueDateD' },
                                        formData.IssueDateD
                                    )
                                }
                            />
                            <DateRow
                                label="Expiry Date"
                                value={formatDateValueForInput(formData.ExpiryDateD)}
                                placeholder="MM/DD/YYYY"
                                onPress={() =>
                                    openDatePicker(
                                        { scope: 'form', field: 'ExpiryDateD' },
                                        formData.ExpiryDateD
                                    )
                                }
                            />
                        </>
                    ) : (
                        <>
                            <DetailRow label="Passport No" value={profile.PassportNoC || '-'} />
                            <DetailRow label="Issue Place" value={profile.IssuePlaceC || '-'} />
                            <DetailRow label="Issue Date" value={formatDisplayDate(profile.IssueDateD) || '-'} />
                            <DetailRow label="Expiry Date" value={formatDisplayDate(profile.ExpiryDateD) || '-'} withDivider={false} />
                        </>
                    )}
                </CollapsibleCard>

                {/* CHILDREN DETAILS - Collapsible */}
                <CollapsibleCard
                    title="Children Details"
                    icon={<MaterialIcons name="child-friendly" size={22} color={theme.primary} />}
                    isOpen={expandedSections.children}
                    onToggle={() => toggleSection('children')}
                    theme={theme}
                >
                    {isEditing ? (
                        <EditArraySection
                            title="Children"
                            data={children}
                            renderItem={(child, index) => (
                                <>
                                    <EditableRow
                                        label="Name"
                                        value={child.NameC || ''}
                                        onChangeText={(text) => handleChildChange(index, 'NameC', text)}
                                    />
                                    <DateRow
                                        label="Birth Date"
                                        value={formatDateValueForInput(child.BDateD)}
                                        placeholder="MM/DD/YYYY"
                                        onPress={() =>
                                            openDatePicker(
                                                { scope: 'child', field: 'BDateD', index },
                                                child.BDateD
                                            )
                                        }
                                    />
                                    <EditableRow
                                        label="Status"
                                        value={child.StatusN || ''}
                                        onChangeText={(text) => handleChildChange(index, 'StatusN', text)}
                                    />
                                    <TouchableOpacity
                                        style={styles.editRow}
                                        onPress={() => {
                                            setChildIndexForNation(index);
                                            setShowChildNationModal(true);
                                        }}
                                    >
                                        <Text style={[styles.detailLabel, { color: theme.textLight }]}>
                                            Nation
                                        </Text>
                                        <View style={[styles.selectionInput, { backgroundColor: theme.inputBg }]}>
                                            <Text style={{ color: theme.text }}>
                                                {nations.find(n => n.NationIdN === child.HidNationIdN)?.NationNameC || 'Select Nation'}
                                            </Text>
                                            <Ionicons name="chevron-down" size={20} color={theme.textLight} />
                                        </View>
                                    </TouchableOpacity>
                                </>
                            )}
                            onAdd={addNewChild}
                            onRemove={removeChild}
                            theme={theme}
                            emptyMessage="No children added yet"
                        />
                    ) : (
                        <ViewArraySection
                            title="Children"
                            data={children}
                            emptyMessage="No children added"
                            renderItem={(child, index) => (
                                <>
                                    <Text style={[styles.arrayItemIndex, { color: theme.primary }]}>
                                        Child {index + 1}
                                    </Text>
                                    <DetailRow label="Name" value={child.NameC || '-'} />
                                    <DetailRow label="Birth Date" value={formatDisplayDate(child.BDateD) || '-'} />
                                    <DetailRow label="Status" value={child.StatusN || '-'} />
                                    <DetailRow
                                        label="Nation"
                                        value={nations.find(n => n.NationIdN === child.HidNationIdN)?.NationNameC || '-'}
                                        withDivider={false}
                                    />
                                </>
                            )}
                        />
                    )}
                </CollapsibleCard>

                {/* EDUCATION DETAILS - Collapsible */}
                <CollapsibleCard
                    title="Education Details"
                    icon={<MaterialIcons name="school" size={22} color={theme.primary} />}
                    isOpen={expandedSections.education}
                    onToggle={() => toggleSection('education')}
                    theme={theme}
                >
                    {isEditing ? (
                        <EditArraySection
                            title="Education"
                            data={education}
                            renderItem={(edu, index) => (
                                <>
                                    <EditableRow
                                        label="Education"
                                        value={edu.EducationC || ''}
                                        multiline
                                        onChangeText={(text) => handleEducationChange(index, 'EducationC', text)}
                                    />
                                    <EditableRow
                                        label="Center"
                                        value={edu.CenterC || ''}
                                        multiline
                                        onChangeText={(text) => handleEducationChange(index, 'CenterC', text)}
                                    />
                                    <EditableRow
                                        label="Year"
                                        value={edu.YearN?.toString() || ''}
                                        keyboardType="numeric"
                                        onChangeText={(text) => handleEducationChange(index, 'YearN', parseInt(text) || 0)}
                                    />
                                </>
                            )}
                            onAdd={addNewEducation}
                            onRemove={removeEducation}
                            theme={theme}
                            emptyMessage="No education details added yet"
                        />
                    ) : (
                        <ViewArraySection
                            title="Education"
                            data={education}
                            emptyMessage="No education details added"
                            renderItem={(edu, index) => (
                                <>
                                    <Text style={[styles.arrayItemIndex, { color: theme.primary }]}>
                                        Education {index + 1}
                                    </Text>
                                    <DetailRow label="Education" value={edu.EducationC || '-'} />
                                    <DetailRow label="Center" value={edu.CenterC || '-'} />
                                    <DetailRow label="Completed Year" value={edu.YearN || '-'} withDivider={false} />
                                </>
                            )}
                        />
                    )}
                </CollapsibleCard>

                {/* FAMILY DETAILS - Collapsible */}
                <CollapsibleCard
                    title="Family Details"
                    icon={<Ionicons name="people-outline" size={22} color={theme.primary} />}
                    isOpen={expandedSections.family}
                    onToggle={() => toggleSection('family')}
                    theme={theme}
                >
                    {isEditing ? (
                        <EditArraySection
                            title="Family Members"
                            data={family}
                            renderItem={(member, index) => (
                                <>
                                    <EditableRow
                                        label="Name"
                                        value={member.NamesC || ''}
                                        onChangeText={(text) => handleFamilyChange(index, 'NamesC', text)}
                                    />
                                    <DateRow
                                        label="Date of Birth"
                                        value={formatDateValueForInput(member.DateofBirthD)}
                                        placeholder="MM/DD/YYYY"
                                        onPress={() =>
                                            openDatePicker(
                                                { scope: 'family', field: 'DateofBirthD', index },
                                                member.DateofBirthD
                                            )
                                        }
                                    />
                                    <EditableRow
                                        label="Relationship"
                                        value={member.RelationshipN || ''}
                                        onChangeText={(text) => handleFamilyChange(index, 'RelationshipN', text)}
                                    />
                                    <EditableRow
                                        label="Occupation"
                                        value={member.OccupationC || ''}
                                        onChangeText={(text) => handleFamilyChange(index, 'OccupationC', text)}
                                    />
                                    <EditableRow
                                        label="Phone"
                                        value={member.PhNoC || ''}
                                        keyboardType="phone-pad"
                                        onChangeText={(text) => handleFamilyChange(index, 'PhNoC', text)}
                                    />
                                    <EditableRow
                                        label="Email"
                                        value={member.EmailIDC || ''}
                                        keyboardType="email-address"
                                        onChangeText={(text) => handleFamilyChange(index, 'EmailIDC', text)}
                                    />
                                </>
                            )}
                            onAdd={addNewFamilyMember}
                            onRemove={removeFamilyMember}
                            theme={theme}
                            emptyMessage="No family members added yet"
                        />
                    ) : (
                        <ViewArraySection
                            title="Family Members"
                            data={family}
                            emptyMessage="No family members added"
                            renderItem={(member, index) => (
                                <>
                                    <Text style={[styles.arrayItemIndex, { color: theme.primary }]}>
                                        Family Member {index + 1}
                                    </Text>
                                    <DetailRow label="Name" value={member.NamesC || '-'} />
                                    <DetailRow label="Date of Birth" value={formatDisplayDate(member.DateofBirthD) || '-'} />
                                    <DetailRow label="Relationship" value={member.RelationshipN || '-'} />
                                    <DetailRow label="Occupation" value={member.OccupationC || '-'} />
                                    <DetailRow label="Phone" value={member.PhNoC || '-'} />
                                    <DetailRow label="Email" value={member.EmailIDC || '-'} withDivider={false} />
                                </>
                            )}
                        />
                    )}
                </CollapsibleCard>

                {/* PREVIOUS COMPANIES - Collapsible */}
                <CollapsibleCard
                    title="Previous Companies"
                    icon={<MaterialIcons name="business" size={22} color={theme.primary} />}
                    isOpen={expandedSections.companies}
                    onToggle={() => toggleSection('companies')}
                    theme={theme}
                >
                    {isEditing ? (
                        <EditArraySection
                            title="Previous Employment"
                            data={previousCompanies}
                            renderItem={(company, index) => (
                                <>
                                    <EditableRow
                                        label="Company Name"
                                        value={company.CompNameC || ''}
                                        multiline
                                        onChangeText={(text) => handleCompanyChange(index, 'CompNameC', text)}
                                    />
                                    <EditableRow
                                        label="Designation"
                                        value={company.DesignationC || ''}
                                        onChangeText={(text) => handleCompanyChange(index, 'DesignationC', text)}
                                    />
                                    <DateRow
                                        label="From Date"
                                        value={formatDateValueForInput(company.FromDateD)}
                                        placeholder="MM/DD/YYYY"
                                        onPress={() =>
                                            openDatePicker(
                                                { scope: 'company', field: 'FromDateD', index },
                                                company.FromDateD
                                            )
                                        }
                                    />
                                    <DateRow
                                        label="To Date"
                                        value={formatDateValueForInput(company.ToDateD)}
                                        placeholder="MM/DD/YYYY"
                                        onPress={() =>
                                            openDatePicker(
                                                { scope: 'company', field: 'ToDateD', index },
                                                company.ToDateD
                                            )
                                        }
                                    />
                                    <EditableRow
                                        label="Experience"
                                        value={company.ExperienceN || ''}
                                        onChangeText={(text) => handleCompanyChange(index, 'ExperienceN', text)}
                                    />
                                    <EditableRow
                                        label="Description"
                                        value={company.DescC || ''}
                                        multiline
                                        onChangeText={(text) => handleCompanyChange(index, 'DescC', text)}
                                    />
                                </>
                            )}
                            onAdd={addNewCompany}
                            onRemove={removeCompany}
                            theme={theme}
                            emptyMessage="No previous companies added yet"
                        />
                    ) : (
                        <ViewArraySection
                            title="Previous Employment"
                            data={previousCompanies}
                            emptyMessage="No previous companies added"
                            renderItem={(company, index) => (
                                <>
                                    <Text style={[styles.arrayItemIndex, { color: theme.primary }]}>
                                        Company {index + 1}
                                    </Text>
                                    <DetailRow label="Company Name" value={company.CompNameC || '-'} />
                                    <DetailRow label="Designation" value={company.DesignationC || '-'} />
                                    <DetailRow label="From Date" value={formatDisplayDate(company.FromDateD) || '-'} />
                                    <DetailRow label="To Date" value={formatDisplayDate(company.ToDateD) || '-'} />
                                    <DetailRow label="Experience" value={company.ExperienceN || '-'} />
                                    <DetailRow label="Description" value={company.DescC || '-'} withDivider={false} />
                                </>
                            )}
                        />
                    )}
                </CollapsibleCard>
            </ScrollView>
            {datePickerState.visible && datePickerState.target && (
                <DateTimePicker
                    value={datePickerState.initialDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(_, selected) => {
                        setDatePickerState((prev) => ({ ...prev, visible: false }));
                        if (selected) {
                            applyPickedDate(datePickerState.target!, selected);
                        }
                    }}
                />
            )}
        </View>
    );
}

/* -------------------- STYLES -------------------- */
const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyStateTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 12,
    },
    emptyStateText: {
        fontSize: 14,
        marginTop: 4,
    },
    profileHeader: {
        alignItems: 'center',
        paddingVertical: 24,
        borderRadius: 16,
        marginBottom: 20,
    },
    profileName: {
        fontSize: 22,
        fontWeight: '700',
        color: '#fff',
        marginTop: 8,
    },
    profileSub: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 16,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 999,
        gap: 8,
        marginLeft: 12,
    },
    actionButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    // Collapsible Card Styles
    collapsibleCard: {
        borderRadius: 16,
        marginBottom: 12,
        elevation: 3,
        overflow: 'hidden',
    },
    collapsibleHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    collapsibleHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    collapsibleTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 12,
        flex: 1,
    },
    collapsibleContent: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    cardIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
    },
    detailLabel: {
        fontSize: 14,
    },
    detailValue: {
        fontSize: 15,
        fontWeight: '600',
        maxWidth: '60%',
        textAlign: 'right',
    },
    divider: {
        height: 1,
    },
    editRow: {
        paddingVertical: 10,
    },
    input: {
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 14,
        marginTop: 6,
    },
    inputDisabled: {
        opacity: 0.6,
    },
    selectionInput: {
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 14,
        marginTop: 6,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderColor: '#ccc',
    },
    dateValueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dateValueText: {
        fontSize: 14,
        fontWeight: '600',
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxHeight: '80%',
        borderRadius: 16,
        padding: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
        textAlign: 'center',
    },
    modalItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginBottom: 8,
    },
    modalItemText: {
        fontSize: 16,
    },
    modalCloseButton: {
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 16,
    },
    modalCloseButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    arraySection: {
        marginTop: 10,
    },
    arraySectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    arraySectionTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 6,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    removeButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    arrayItem: {
        marginBottom: 20,
    },
    arrayItemContainer: {
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
    },
    arrayItemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    arrayItemIndex: {
        fontSize: 14,
        fontWeight: '600',
    },
    emptyArrayContainer: {
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
    },
    emptyArrayText: {
        fontSize: 14,
        fontStyle: 'italic',
        textAlign: 'center',
        marginBottom: 12,
    },
});
