import Header from '@/components/Header';
import { useProtectedBack } from '@/hooks/useProtectedBack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { XMLParser } from 'fast-xml-parser';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import ApiService from '../../../services/ApiService';

interface ExitRequestData {
    EmpIdN?: number;
    RegNoticePeriodN?: number; // Notice Period (Display)
    RevokeDaysN?: number;      // Revoke Days
    ResDeclareD?: string;      // Date of Declaration
    ResExitDateD?: string;     // Last working date (Selected)
    ShortFallDaysN?: number;   // Short fall days
    RegWaiveN?: number;        // Waive Notice Period? (Enum/Int?) Value seems 'Recover' in string or mapped int
    // 'Waive Notice Period' display value likely mapped from RegWaiveN or similar.
    // In screenshot it says "Recover". Maybe 1=Recover?

    StatusC?: string;          // Exit Type e.g. "Resigned"
    RegReasonIdN?: number;     // Exit Reason ID (Selected)
    RegNoteC?: string;         // Exit Notes
}

interface ExitReason {
    IdN: number;
    NameC: string;
}

const parseAspDate = (dateString?: string) => {
    if (!dateString) return null;
    const match = dateString.match(/\/Date\((-?\d+)\)\//);
    if (match) return new Date(parseInt(match[1], 10));
    return new Date(dateString);
};

const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = parseAspDate(dateString);
    if (!date || isNaN(date.getTime()) || date.getFullYear() <= 1900) return null;
    return date.toDateString();
};

export default function ExitRequestScreen() {
    const { theme } = useTheme();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);

    const [exitData, setExitData] = useState<ExitRequestData>({});
    const [reasons, setReasons] = useState<ExitReason[]>([]);

    // Check if editing is allowed (new request only)
    const isReadOnly = !!exitData.EmpIdN;

    // Form States
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedReason, setSelectedReason] = useState<number>(0);
    const [notes, setNotes] = useState('');

    useProtectedBack({
        home: '/home',
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async (isRefresh = false) => {
        if (!isRefresh) setLoading(true);
        try {
            // Fetch Reasons
            const reasonsRes = await ApiService.getExitReasons();
            let reasonList: ExitReason[] = [];
            if (reasonsRes.success && reasonsRes.data) {
                let rData = reasonsRes.data;
                // If it's a string, try parsing XML (fallback)
                if (typeof rData === 'string' && rData.includes('<NewDataSet>')) {
                    const parser = new XMLParser();
                    const parsed = parser.parse(rData);
                    rData = parsed?.NewDataSet?.Table || [];
                }

                const rawList = Array.isArray(rData) ? rData : (rData ? [rData] : []);

                // Map API response fields (EmpCodeC as Name, EmpIdN as ID) to Component Interface
                reasonList = rawList.map((r: any) => ({
                    IdN: r.EmpIdN,
                    NameC: r.EmpCodeC // Based on User JSON: EmpCodeC holds the reason text "Personal", "Absconding" etc.
                }));

                setReasons(reasonList);
            }

            // Fetch Request Data
            const reqRes = await ApiService.getExitRequests();
            if (reqRes.success && reqRes.data) {
                let eData = reqRes.data;
                // It might return { Status: 'success', data: { ...object... } } 
                // or { Status: 'success', data: "<xml...>" }
                // The user snippet shows a C# class structure, likely serialized JSON or XML wrapped list.
                // Assuming typical API behavior from this user: likely wrapped in 'data' prop.

                let finalData: any = {};

                if (eData.data) {
                    let innerData = eData.data;
                    if (typeof innerData === 'string' && innerData.includes('<NewDataSet>')) {
                        const parser = new XMLParser();
                        const parsed = parser.parse(innerData);
                        innerData = parsed?.NewDataSet?.Table;
                    }
                    // It might be an array exit list? usually one active exit request?
                    finalData = Array.isArray(innerData) ? innerData[0] : innerData;
                }

                if (finalData) {
                    setExitData(finalData);
                    // Initialize form
                    if (finalData.ResExitDateD) {
                        const parsed = parseAspDate(finalData.ResExitDateD);
                        if (parsed) setSelectedDate(parsed);
                    }
                    if (finalData.RegReasonIdN) setSelectedReason(finalData.RegReasonIdN);
                    if (finalData.RegNoteC) setNotes(finalData.RegNoteC);
                }
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to fetch exit details');
        } finally {
            setLoading(false);
            if (isRefresh) setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchInitialData(true);
    };

    const handleDateChange = (event: any, date?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (date) {
            setSelectedDate(date);
        }
    };

    const handleSubmit = async (isExit: boolean = true) => {
        // According to instructions: "Exit" button likely means Submit/Update.
        // There is also "Upload" button - ignoring for now as no functionality requested.

        if (!selectedReason) {
            Alert.alert('Validation', 'Please select an Exit Reason');
            return;
        }

        setSubmitLoading(true);
        try {
            // Ensure dates are in ISO format
            let declareDate = exitData.ResDeclareD
                ? (exitData.ResDeclareD.includes('/Date(') ? parseAspDate(exitData.ResDeclareD) : new Date(exitData.ResDeclareD))
                : new Date();

            // Fix: If date is invalid or too old (e.g. 1899), use today
            if (!declareDate || isNaN(declareDate.getTime()) || declareDate.getFullYear() < 2000) {
                declareDate = new Date();
            }

            const payload = {
                EmpIdN: exitData.EmpIdN || ApiService.getCurrentUser().empId || 0,
                EmpStatusN: 3, // Default as requested
                RegClearanceN: false,
                RegNoteC: notes,
                RegNoticePeriodN: exitData.RegNoticePeriodN || 0,
                RegReasonIdN: String(selectedReason),
                RegWaiveN: exitData.RegWaiveN || 0,
                ResDeclareD: declareDate ? declareDate.toISOString() : new Date().toISOString(),
                ResExitDateD: selectedDate.toISOString(),
                RevokeDaysN: exitData.RevokeDaysN || 1,
                ShortFallDaysN: exitData.ShortFallDaysN || 0
            };

            const result = await ApiService.updateExitRequest(payload);
            console.log('Update Exit Request Response:', result);
            if (result.success) {
                Alert.alert('Success', 'Exit request updated successfully');
                fetchInitialData();
            } else {
                Alert.alert('Error', result.error || 'Failed to update');
            }
        } catch (error) {
            Alert.alert('Error', 'An error occurred');
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleRevoke = async () => {
        Alert.alert(
            "Revoke Request",
            "Are you sure you want to revoke your exit request?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Revoke",
                    style: "destructive",
                    onPress: async () => {
                        setSubmitLoading(true);
                        try {
                            const result = await ApiService.revokeExitRequest();
                            if (result.success) {
                                Alert.alert("Success", "Exit request revoked successfully");
                                setExitData({}); // Clear local data
                                setNotes('');
                                setSelectedReason(0);
                                fetchInitialData(); // Refresh to be sure
                            } else {
                                Alert.alert("Error", result.error || "Failed to revoke request");
                            }
                        } catch (error) {
                            Alert.alert("Error", "An error occurred while revoking");
                        } finally {
                            setSubmitLoading(false);
                        }
                    }
                }
            ]
        );
    };



    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Header title="Exit Request" />


            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />
                }
            >
                <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>

                    {/* Read Only Fields */}
                    <View style={styles.row}>
                        <Text style={[styles.label, { color: theme.text }]}>Notice Period (Policy)</Text>
                        <Text style={[styles.value, { color: theme.text }]}>{exitData.RegNoticePeriodN || 0}</Text>
                    </View>

                    <View style={styles.row}>
                        <Text style={[styles.label, { color: theme.text }]}>Revoke Days</Text>
                        <Text style={[styles.value, { color: theme.text }]}>{exitData.RevokeDaysN || 1}</Text>
                    </View>

                    <View style={styles.row}>
                        <Text style={[styles.label, { color: theme.text }]}>Date of Declaration</Text>
                        <Text style={[styles.value, { color: theme.text }]}>{formatDate(exitData.ResDeclareD) || new Date().toDateString()}</Text>
                    </View>

                    {/* Date Picker */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.text }]}>Last Working Date</Text>
                        <TouchableOpacity
                            style={[styles.dateButton, { borderColor: theme.inputBorder, backgroundColor: isReadOnly ? theme.background : theme.inputBg }]}
                            onPress={() => !isReadOnly && setShowDatePicker(true)}
                            disabled={isReadOnly}
                        >
                            <Text style={{ color: theme.text }}>{selectedDate.toLocaleDateString()}</Text>
                        </TouchableOpacity>
                        {showDatePicker && (
                            <DateTimePicker
                                value={selectedDate}
                                mode="date"
                                display="default"
                                onChange={handleDateChange}
                            />
                        )}
                    </View>

                    <View style={styles.row}>
                        <Text style={[styles.label, { color: theme.text }]}>Short Fall Days</Text>
                        <Text style={[styles.value, { color: theme.text }]}>{exitData.ShortFallDaysN || 0}</Text>
                    </View>

                    <View style={styles.row}>
                        <Text style={[styles.label, { color: theme.text }]}>Last Working Date (Policy)</Text>
                        <Text style={[styles.value, { color: theme.text }]}>
                            {/* Assuming this is calculated or same as declaration for now if not provided */}
                            {formatDate(exitData.ResExitDateD) || new Date().toDateString()}
                        </Text>
                    </View>

                    <View style={styles.row}>
                        <Text style={[styles.label, { color: theme.text }]}>Exit Type</Text>
                        {/* Default to Resigned if empty, as per screenshot */}
                        <Text style={[styles.value, { color: theme.text }]}>{exitData.StatusC || 'Resigned'}</Text>
                    </View>

                    {/* Picker */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.text }]}>Exit Reason</Text>
                        <View style={[styles.pickerContainer, { borderColor: theme.inputBorder, backgroundColor: isReadOnly ? theme.background : theme.inputBg }]}>
                            <Picker
                                enabled={!isReadOnly}
                                selectedValue={selectedReason}
                                onValueChange={(itemValue) => setSelectedReason(itemValue)}
                                style={{ color: theme.text }}
                                dropdownIconColor={theme.text}
                            >
                                <Picker.Item label="Select Reason" value={0} />
                                {reasons.map((r) => (
                                    <Picker.Item key={r.IdN} label={r.NameC} value={r.IdN} />
                                ))}
                            </Picker>
                        </View>
                    </View>

                    <View style={styles.row}>
                        <Text style={[styles.label, { color: theme.text }]}>Waive Notice Period</Text>
                        <Text style={[styles.value, { color: theme.text }]}>
                            {/* Map RegWaiveN to text if needed. User screenshot says 'Recover'. */}
                            {exitData.RegWaiveN === 1 ? 'Waive' : 'Recover'}
                        </Text>
                    </View>

                    {/* Notes */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.text }]}>Exit Notes</Text>
                        <TextInput
                            style={[styles.textArea, {
                                borderColor: theme.inputBorder,
                                backgroundColor: theme.inputBg,
                                color: theme.text
                            }]}
                            multiline
                            numberOfLines={4}
                            editable={!isReadOnly}
                            value={notes}
                            onChangeText={setNotes}
                            placeholder={isReadOnly ? "No notes provided" : "Enter notes..."}
                            placeholderTextColor={theme.placeholder}
                        />
                    </View>

                </View>
            </ScrollView>

            {/* Footer Buttons */}
            <View style={[styles.footer, { backgroundColor: theme.cardBackground, borderTopColor: theme.inputBorder }]}>
                {exitData.EmpIdN ? (
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: '#FF3B30' }]} // Red color for Revoke
                        onPress={handleRevoke}
                        disabled={submitLoading}
                    >
                        {submitLoading ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <Text style={styles.buttonText}>Revoke</Text>
                        )}
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: theme.primary }]}
                        onPress={() => handleSubmit()}
                        disabled={submitLoading}
                    >
                        {submitLoading ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <Text style={styles.buttonText}>Submit</Text>
                        )}
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        padding: 16,
    },
    card: {
        borderRadius: 8,
        padding: 16,
        elevation: 2,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#ccc', // fallback
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
    },
    value: {
        fontSize: 14,
        fontWeight: '400',
        textAlign: 'right',
        flex: 1,
    },
    inputGroup: {
        marginTop: 16,
    },
    dateButton: {
        padding: 12,
        borderRadius: 4,
        borderWidth: 1,
        marginTop: 8,
    },
    pickerContainer: {
        borderWidth: 1,
        borderRadius: 4,
        marginTop: 8,
        overflow: 'hidden',
    },
    textArea: {
        borderWidth: 1,
        borderRadius: 4,
        padding: 8,
        marginTop: 8,
        height: 100,
        textAlignVertical: 'top',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: 16,
        borderTopWidth: 1,
        gap: 12,
    },
    button: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 4,
        minWidth: 100,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});
