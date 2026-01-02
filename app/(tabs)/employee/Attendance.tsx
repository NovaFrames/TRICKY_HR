import Header from '@/components/Header';
import { API_ENDPOINTS } from '@/constants/api';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { markAttendance } from './MobileAttenRpt';

const { width } = Dimensions.get('window');

export default function Attendance() {
    const { theme } = useTheme();
    const { user } = useUser();
    const router = useRouter();

    const cameraRef = useRef<CameraView>(null);

    const [permission, requestPermission] = useCameraPermissions();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [attendanceType, setAttendanceType] = useState<'Check-in' | 'Check-out'>('Check-in');
    const [selectedProject, setSelectedProject] = useState('');
    const [remarks, setRemarks] = useState('');
    const [projects, setProjects] = useState<any[]>([]);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [location, setLocation] = useState<{ latitude: number; longitude: number; address?: string } | null>(null);

    /* ---------------- CLOCK ---------------- */
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    /* ---------------- PERMISSIONS ---------------- */
    useEffect(() => {
        requestPermission();
        fetchProjects();
    }, []);

    /* ---------------- LOCATION ---------------- */
    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Required', 'Location permission is required');
                return;
            }

            const loc = await Location.getCurrentPositionAsync({});
            const coords = {
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
            };

            setLocation(coords);

            try {
                const address = await Location.reverseGeocodeAsync(coords);
                if (address?.length) {
                    const a = address[0];
                    setLocation(prev =>
                        prev
                            ? {
                                ...prev,
                                address: `${a.street || ''} ${a.city || ''} ${a.region || ''}`,
                            }
                            : null,
                    );
                }
            } catch { }
        })();
    }, []);

    /* ---------------- PROJECT LIST ---------------- */
    const fetchProjects = async () => {
        try {
            const token = user?.TokenC || user?.Token;
            if (!token) return;

            const formData = new FormData();
            formData.append('TokenC', token);
            formData.append('blnEmpMaster', 'false');
            formData.append('ViewReject', 'false');

            const res = await axios.post(
                `https://hr.trickyhr.com${API_ENDPOINTS.GET_PROJECT_LIST}`,
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );

            if (res.data?.Status === 'success') {
                setProjects(res.data.data || []);
            }
        } catch {
            setProjects([]);
        }
    };

    /* ---------------- MANUAL CAPTURE ---------------- */
    const takePicture = async () => {
        if (!cameraRef.current) return;

        try {
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.6,
                skipProcessing: true,
            });

            if (photo?.uri) {
                setCapturedImage(photo.uri);
            }
        } catch {
            Alert.alert('Camera Error', 'Failed to take picture');
        }
    };

    /* ---------------- SUBMIT ---------------- */
    const handleSubmit = async () => {
        if (!selectedProject) return Alert.alert('Required', 'Select project');
        if (!capturedImage) return Alert.alert('Required', 'Capture your photo');
        if (!location) return Alert.alert('Required', 'Location not ready');

        setSubmitting(true);
        try {
            const token = user?.TokenC || user?.Token;
            const empId = user?.EmpIdN || user?.EmpId;
            const companyUrl = 'https://hr.trickyhr.com';
            const mode = attendanceType === 'Check-in' ? 0 : 1;

            const serverDate = new Date().toLocaleString('en-GB');

            const res = await markAttendance(
                companyUrl,
                token,
                empId,
                Number(selectedProject),
                mode,
                location,
                capturedImage,
                remarks,
                serverDate
            );

            if (res.success) {
                Alert.alert('Success', 'Attendance marked', [
                    { text: 'OK', onPress: () => router.back() },
                ]);
            } else {
                Alert.alert('Failed', res.message || 'Attendance failed');
            }
        } finally {
            setSubmitting(false);
        }
    };

    /* ---------------- UI ---------------- */
    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <Header title="Attendance" />
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
                {/* CLOCK */}
                <View style={[styles.clockCard, { backgroundColor: theme.primary }]}>
                    <Text style={[styles.timeText, { color: theme.inputBg }]}>
                        {currentTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    <Text style={[styles.dateText, { color: theme.inputBg }]}>
                        {currentTime.toLocaleDateString('en-GB', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                        })}
                    </Text>
                </View>

                {/* TYPE */}
                <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
                    {['Check-in', 'Check-out'].map(type => (
                        <TouchableOpacity
                            key={type}
                            style={[
                                styles.toggle,
                                {
                                    backgroundColor: attendanceType === type ? theme.primary : theme.inputBg,
                                    borderColor: theme.inputBorder
                                }
                            ]}
                            onPress={() => setAttendanceType(type as any)}
                        >
                            <Text style={{
                                color: attendanceType === type ? '#fff' : theme.text,
                                fontWeight: '600',
                                textAlign: 'center'
                            }}>
                                {type}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* PROJECT */}
                <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
                    <View style={{ borderWidth: 1, borderColor: theme.inputBorder, borderRadius: 16 }}>
                        <Picker
                            selectedValue={selectedProject}
                            onValueChange={setSelectedProject}
                            style={{ color: theme.text }}
                            dropdownIconColor={theme.text}
                        >
                            <Picker.Item label="Select Project" value="" color={theme.textLight} />
                            {projects.map(p => (
                                <Picker.Item key={p.IdN} label={p.NameC} value={String(p.IdN)} color={theme.text} />
                            ))}
                        </Picker>
                    </View>

                    <TextInput
                        placeholder="Remarks (optional)"
                        placeholderTextColor={theme.placeholder}
                        value={remarks}
                        onChangeText={setRemarks}
                        style={[styles.input, {
                            borderColor: theme.inputBorder,
                            backgroundColor: theme.inputBg,
                            color: theme.text
                        }]}
                    />
                </View>

                {/* CAMERA */}
                <View style={styles.cameraBox}>
                    {capturedImage ? (
                        <Image source={{ uri: capturedImage }} style={styles.preview} />
                    ) : (
                        <CameraView ref={cameraRef} facing="front" style={styles.preview} />
                    )}

                    {!capturedImage ? (
                        <TouchableOpacity
                            style={[styles.captureBtn, { backgroundColor: theme.primary }]}
                            onPress={takePicture}
                        >
                            <Ionicons name="camera" size={28} color="#fff" />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity onPress={() => setCapturedImage(null)} style={{ padding: 10 }}>
                            <Text style={{ color: theme.primary, textAlign: 'center', fontWeight: 'bold' }}>Retake</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* SUBMIT */}
                <TouchableOpacity
                    style={[
                        styles.submitBtn,
                        { backgroundColor: theme.primary },
                        (!capturedImage || submitting) && { opacity: 0.6 }
                    ]}
                    disabled={!capturedImage || submitting}
                    onPress={handleSubmit}
                >
                    {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit Attendance</Text>}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
    container: { flex: 1 },
    clockCard: { padding: 20, borderRadius: 16, marginBottom: 16 },
    timeText: { fontSize: 32, color: '#fff', fontWeight: '800' },
    dateText: { color: '#fff', marginTop: 4 },

    section: { borderRadius: 12, padding: 16, marginBottom: 16, },
    toggle: { padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1 },

    input: { borderWidth: 1, borderRadius: 8, padding: 12, marginTop: 12 },

    cameraBox: { borderRadius: 16, overflow: 'hidden', marginBottom: 20, backgroundColor: '#000' },
    preview: { width: '100%', height: 300 },

    captureBtn: {
        position: 'absolute',
        bottom: 16,
        alignSelf: 'center',
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },

    submitBtn: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
