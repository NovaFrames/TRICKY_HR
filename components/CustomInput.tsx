import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TextInput, TextInputProps, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface CustomInputProps extends TextInputProps {
    icon?: keyof typeof Feather.glyphMap;
    onIconPress?: () => void;
    iconColor?: string;
}

export const CustomInput: React.FC<CustomInputProps> = ({
    icon,
    onIconPress,
    iconColor,
    style,
    ...props
}) => {
    const { theme } = useTheme();
    const activeIconColor = iconColor || theme.icon;

    return (
        <View style={[styles.inputWrapper, { backgroundColor: theme.inputBg }]}>
            <TextInput
                style={[styles.input, { color: theme.text }, style]}
                placeholderTextColor={theme.placeholder}
                {...props}
            />
            {icon && (
                <TouchableOpacity onPress={onIconPress} style={styles.iconContainer} disabled={!onIconPress}>
                    <Feather name={icon} size={20} color={activeIconColor} />
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
        borderRadius: 8,
        height: 50,
        paddingHorizontal: 16,
    },
    input: {
        flex: 1,
        fontSize: 14,
    },
    iconContainer: {
        padding: 4,
    },
});
