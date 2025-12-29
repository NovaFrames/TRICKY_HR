import React from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { useTheme } from '../context/ThemeContext';

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
    const { theme } = useTheme();

    return (
        <TouchableOpacity
            style={[
                styles.button,
                {
                    backgroundColor: theme.primary,
                    ...Platform.select({
                        default: {
                            shadowColor: theme.primary,
                        },
                    }),
                },
                style
            ]}
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
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
});
