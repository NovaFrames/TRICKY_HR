import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TextInput, TextInputProps, TouchableOpacity, View } from 'react-native';

interface CustomInputProps extends TextInputProps {
    icon?: keyof typeof Feather.glyphMap;
    onIconPress?: () => void;
    iconColor?: string;
}

export const CustomInput: React.FC<CustomInputProps> = ({
    icon,
    onIconPress,
    iconColor = "#94A3B8",
    style,
    ...props
}) => {
    return (
        <View style={styles.inputWrapper}>
            <TextInput
                style={[styles.input, style]}
                placeholderTextColor="#94A3B8"
                {...props}
            />
            {icon && (
                <TouchableOpacity onPress={onIconPress} style={styles.iconContainer} disabled={!onIconPress}>
                    <Feather name={icon} size={20} color={iconColor} />
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    inputWrapper: {
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E2E8F0',
        borderRadius: 8,
        height: 50,
        paddingHorizontal: 16,
    },
    input: {
        flex: 1,
        fontSize: 14,
        color: '#334155',
    },
    iconContainer: {
        padding: 4,
    },
});
