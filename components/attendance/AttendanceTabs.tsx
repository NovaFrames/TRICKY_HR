import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface AttendanceTabsProps {
    activeTab: 'SHIFT' | 'OTHERS';
    onTabChange: (tab: 'SHIFT' | 'OTHERS') => void;
    theme: any;
}

const AttendanceTabs: React.FC<AttendanceTabsProps> = ({ activeTab, onTabChange, theme }) => {
    return (
        <View style={[styles.container, { backgroundColor: theme.cardBackground }]}>
            <TouchableOpacity
                style={[
                    styles.tab,
                    activeTab === 'SHIFT' && { backgroundColor: theme.primary },
                ]}
                onPress={() => onTabChange('SHIFT')}
            >
                <Text
                    style={[
                        styles.tabText,
                        { color: activeTab === 'SHIFT' ? '#fff' : theme.textLight },
                    ]}
                >
                    SHIFT TIME
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[
                    styles.tab,
                    activeTab === 'OTHERS' && { backgroundColor: theme.primary },
                ]}
                onPress={() => onTabChange('OTHERS')}
            >
                <Text
                    style={[
                        styles.tabText,
                        { color: activeTab === 'OTHERS' ? '#fff' : theme.textLight },
                    ]}
                >
                    OTHERS
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginVertical: 12,
        borderRadius: 4,
        padding: 4,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 4,
    },
    tabText: {
        fontSize: 13,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
});

export default AttendanceTabs;
