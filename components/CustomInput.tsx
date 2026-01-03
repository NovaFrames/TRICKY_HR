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
    onFocus,
    onBlur,
    ...props
}) => {
    const { theme } = useTheme();
    const [isFocused, setIsFocused] = React.useState(false);

    const handleFocus = (e: any) => {
        setIsFocused(true);
        onFocus?.(e);
    };

    const handleBlur = (e: any) => {
        setIsFocused(false);
        onBlur?.(e);
    };

    const activeIconColor = isFocused ? theme.primary : (iconColor || theme.icon);

    return (
        <View style={[
            styles.inputWrapper,
            {
                backgroundColor: theme.inputBg,
                borderColor: isFocused ? theme.primary : theme.inputBorder,
                borderWidth: 1,
            }
        ]}>
            {icon && (
                <View style={styles.iconContainer}>
                    <Feather name={icon} size={18} color={activeIconColor} />
                </View>
            )}
            <TextInput
                style={[styles.input, { color: theme.text }, style]}
                placeholderTextColor={theme.placeholder}
                onFocus={handleFocus}
                onBlur={handleBlur}
                {...props}
            />
            {onIconPress && (
                <TouchableOpacity onPress={onIconPress} style={styles.rightIconContainer}>
                    <Feather
                        name={props.secureTextEntry !== undefined ? (props.secureTextEntry ? "eye-off" : "eye") : icon}
                        size={18}
                        color={activeIconColor}
                    />
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
        borderRadius: 12,
        height: 52,
        paddingHorizontal: 16,
    },
    input: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
        height: '100%',
    },
    iconContainer: {
        marginRight: 12,
        width: 20,
        alignItems: 'center',
    },
    rightIconContainer: {
        marginLeft: 12,
        width: 20,
        alignItems: 'center',
    },
});
