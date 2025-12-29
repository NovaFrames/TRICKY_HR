import React from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { THEME } from '../theme/theme';

interface CustomButtonProps extends TouchableOpacityProps {
    title: string;
    isLoading?: boolean;
}

export const CustomButton: React.FC<CustomButtonProps> = ({
    title,
    isLoading,
    style,
    disabled,
    ...props
}) => {
    return (
        <TouchableOpacity
            style={[styles.button, style]}
            activeOpacity={0.8}
            disabled={isLoading || disabled}
            {...props}
        >
            {isLoading ? (
                <ActivityIndicator color="#fff" />
            ) : (
                <Text style={styles.buttonText}>{title}</Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        backgroundColor: THEME.primary,
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        ...Platform.select({
            web: {
                boxShadow: '0px 4px 8px rgba(255, 98, 0, 0.3)',
            },
            default: {
                shadowColor: THEME.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
            },
        }),
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
});
