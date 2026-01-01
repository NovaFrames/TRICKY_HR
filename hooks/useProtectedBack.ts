import { useFocusEffect } from '@react-navigation/native';
import {
    Href,
    router,
    useLocalSearchParams,
} from 'expo-router';
import { useCallback } from 'react';
import { BackHandler } from 'react-native';

type BackMap = Record<string, Href>;

export function useProtectedBack(backMap: BackMap) {
    const { from } = useLocalSearchParams<{ from?: string }>();

    useFocusEffect(
        useCallback(() => {
            const onBackPress = () => {
                if (from && backMap[from]) {
                    router.replace(backMap[from]); // ✅ now typed
                    return true;
                }
                return false;
            };

            const subscription = BackHandler.addEventListener(
                'hardwareBackPress',
                onBackPress
            );

            return () => subscription.remove(); // ✅ correct cleanup
        }, [from, backMap])
    );
}
