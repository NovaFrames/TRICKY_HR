import EmployeeLeaveBalance from '@/components/EmployeeList/EmployeeLeaveBalance';
import Header, { HEADER_HEIGHT } from '@/components/Header';
import { useProtectedBack } from '@/hooks/useProtectedBack';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import ApiService, { Employee } from '../../../services/ApiService';

interface EmployeeSection {
    title: string;
    data: Employee[];
}

export default function EmployeeListScreen() {
    const { theme, isDark } = useTheme();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
    const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDesignation, setSelectedDesignation] = useState<string>('All');
    const [designations, setDesignations] = useState<string[]>([]);
    const [showBalanceModal, setShowBalanceModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

    useProtectedBack({
        home: '/home',
    });

    useEffect(() => {
        fetchEmployeeList();
    }, []);

    useEffect(() => {
        filterEmployees();
    }, [searchQuery, selectedDesignation, allEmployees]);

    const fetchEmployeeList = async () => {
        try {
            setLoading(true);
            const response = await ApiService.getEmployeeList();

            if (response.success && response.data) {

                console.log('Fetched Employees in emplist:', response.data);

                // Sort by code
                const sorted = response.data.sort((a, b) => a.CodeC.localeCompare(b.CodeC));
                setAllEmployees(sorted);

                // Get unique designations
                const uniqueDesignations = Array.from(new Set(sorted.map(emp => emp.DescC)));
                setDesignations(['All', ...uniqueDesignations]);
            } else {
                Alert.alert('Error', response.error || 'Failed to fetch employee list');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    const filterEmployees = () => {
        let filtered = allEmployees;

        // Filter by designation
        if (selectedDesignation !== 'All') {
            filtered = filtered.filter(emp => emp.DescC === selectedDesignation);
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(emp =>
                emp.NameC.toLowerCase().includes(query) ||
                emp.CodeC.toLowerCase().includes(query)
            );
        }

        setFilteredEmployees(filtered);
    };

    const handleEmployeePress = (employee: Employee) => {
        Alert.alert(
            employee.NameC,
            `Code: ${employee.CodeC}\nDesignation: ${employee.DescC}`,
            [
                {
                    text: 'View Balance',
                    onPress: () => {
                        setSelectedEmployee(employee);
                        setShowBalanceModal(true);
                    }
                },
                { text: 'Cancel', style: 'cancel' }
            ]
        );
    };


    const renderEmployee = ({ item, index }: { item: Employee; index: number }) => {
        return (
            <TouchableOpacity
                style={[styles.employeeCard, { backgroundColor: theme.cardBackground }]}
                onPress={() => handleEmployeePress(item)}
                activeOpacity={0.7}
            >
                {/* Left Section - Avatar & Info */}
                <View style={styles.employeeLeft}>
                    <View style={[styles.avatarContainer, { backgroundColor: theme.primary }]}>
                        <Text style={styles.avatarText}>
                            {item.NameC.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </Text>
                    </View>
                    <View style={styles.employeeInfo}>
                        <Text style={[styles.employeeName, { color: theme.text }]} numberOfLines={1}>
                            {item.NameC}
                        </Text>
                        <View style={styles.employeeMeta}>
                            <View style={[styles.codeBadge, { backgroundColor: theme.inputBg }]}>
                                <Ionicons name="card-outline" size={12} color={theme.placeholder} />
                                <Text style={[styles.employeeCode, { color: theme.placeholder }]}>
                                    {item.CodeC}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.designationRow}>
                            <Ionicons name="briefcase-outline" size={12} color={theme.placeholder} />
                            <Text style={[styles.designation, { color: theme.placeholder }]} numberOfLines={1}>
                                {item.DescC}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Right Section - Action Button */}
                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: theme.primary + '15' }]}
                    onPress={() => handleEmployeePress(item)}
                >
                    <Ionicons name="chevron-forward" size={20} color={theme.primary} />
                </TouchableOpacity>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container]}>
            <Header title="Employee List" />

            <View style={{ paddingTop: HEADER_HEIGHT }}>
                {/* Stats Bar */}
                <View style={[styles.statsBar, { backgroundColor: theme.inputBg }]}>
                    <View style={styles.statItem}>
                        <Ionicons name="people" size={18} color={theme.primary} />
                        <Text style={[styles.statText, { color: theme.text }]}>
                            {filteredEmployees.length} Employees
                        </Text>
                    </View>
                    {selectedDesignation !== 'All' && (
                        <View style={styles.statItem}>
                            <Ionicons name="filter" size={16} color={theme.placeholder} />
                            <Text style={[styles.statSubtext, { color: theme.placeholder }]}>
                                Filtered
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Employee List */}
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={[styles.loadingText, { color: theme.placeholder }]}>
                        Loading employees...
                    </Text>
                </View>
            ) : filteredEmployees.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <View style={[styles.emptyIconBox, { backgroundColor: theme.inputBg }]}>
                        <Ionicons
                            name={searchQuery ? "search-outline" : "people-outline"}
                            size={64}
                            color={theme.placeholder}
                        />
                    </View>
                    <Text style={[styles.emptyTitle, { color: theme.text }]}>
                        {searchQuery ? 'No Results Found' : 'No Employees'}
                    </Text>
                    <Text style={[styles.emptySubtitle, { color: theme.placeholder }]}>
                        {searchQuery
                            ? `No employees match "${searchQuery}"`
                            : 'There are no employees in the system'
                        }
                    </Text>
                    {searchQuery && (
                        <TouchableOpacity
                            style={[styles.clearButton, { backgroundColor: theme.primary }]}
                            onPress={() => setSearchQuery('')}
                        >
                            <Text style={styles.clearButtonText}>Clear Search</Text>
                        </TouchableOpacity>
                    )}
                </View>
            ) : (
                <FlatList
                    data={filteredEmployees}
                    keyExtractor={(item, index) => item.EmpIdN.toString() + index}
                    renderItem={renderEmployee}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}

            <EmployeeLeaveBalance
                visible={showBalanceModal}
                onClose={() => setShowBalanceModal(false)}
                empId={selectedEmployee?.EmpIdN || 0}
                empName={selectedEmployee?.NameC || ''}
            />
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
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        fontWeight: '500',
    },

    // Search Bar Styles
    searchContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 4,
        borderWidth: 1,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
    },

    // Filter Styles
    filterContainer: {
        paddingVertical: 8,
    },
    filterList: {
        paddingHorizontal: 16,
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 4,
        marginRight: 8,
        borderWidth: 1,
    },
    filterChipText: {
        fontSize: 13,
        fontWeight: '600',
    },

    // Stats Bar Styles
    statsBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statText: {
        fontSize: 14,
        fontWeight: '600',
    },
    statSubtext: {
        fontSize: 12,
        fontWeight: '500',
    },

    // Employee Card Styles
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 24,
    },
    employeeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
        borderRadius: 4,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    employeeLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 12,
    },
    avatarContainer: {
        width: 52,
        height: 52,
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    employeeInfo: {
        flex: 1,
    },
    employeeName: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    employeeMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    codeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
        gap: 4,
    },
    employeeCode: {
        fontSize: 12,
        fontWeight: '600',
    },
    designationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    designation: {
        fontSize: 12,
        fontWeight: '500',
        flex: 1,
    },
    actionButton: {
        width: 36,
        height: 36,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Empty State Styles
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingTop: 40,
    },
    emptyIconBox: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
    },
    clearButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 4,
    },
    clearButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
});
