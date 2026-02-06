import { useFocusEffect } from "@react-navigation/native";
import { Href, router, useLocalSearchParams } from "expo-router";
import { useCallback } from "react";
import { BackHandler } from "react-native";

type BackMap = Record<string, Href>;

export function useProtectedBack(backMap: BackMap) {
  const { from } = useLocalSearchParams<{ from?: string }>();

  const handleBack = useCallback(() => {
    if (from && backMap[from]) {
      router.replace(backMap[from]);
      return true;
    }
    if (router.canGoBack()) {
      router.back();
      return true;
    }
    if (BackHandler?.exitApp) {
      BackHandler.exitApp();
    }
    return true;
  }, [from, backMap]);

  // 🔐 Hardware back button
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => handleBack();

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => subscription.remove();
    }, [handleBack]),
  );

  // ✅ THIS is what you were missing
  return handleBack;
}
