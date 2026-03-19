import { useUser } from "@/context/UserContext";
import { resolveWorkingDomain } from "@/utils/domainResolver";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { CustomButton } from "../../components/CustomButton";
import { CustomInput } from "../../components/CustomInput";
import Modal from "../../components/common/SingleModal";
import Snackbar from "../../components/common/Snackbar";
import { useTheme } from "../../context/ThemeContext";
import ApiService, {
  compPoliciesUpdate,
  loginUser,
  refreshLoginUser,
  setBaseUrl,
} from "../../services/ApiService";

export default function Login() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [empCode, setEmpCode] = useState("");
  const [password, setPassword] = useState("");
  const [domainId, setDomainId] = useState("");
  const [domainUrl, setDomainUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: "",
    type: "info" as "info" | "error" | "success",
  });
  const [policyModalVisible, setPolicyModalVisible] = useState(false);
  const [policyUrl, setPolicyUrl] = useState("");
  const [policyId, setPolicyId] = useState<number | null>(null);
  const [policyAcceptLoading, setPolicyAcceptLoading] = useState(false);
  const [pendingLogin, setPendingLogin] = useState<{
    token: string;
    empId: string;
    workingDomain: string;
    domainId?: string;
    userData: any;
  } | null>(null);

  const { theme } = useTheme();
  const { setUser, logout } = useUser();
  const isWeb = Platform.OS === "web";
  const isSmall = width < 380;
  const isTablet = width >= 768;
  const cardMaxWidth = isTablet ? 520 : 420;

  useEffect(() => {
    const fetchStoredDomain = async () => {
      try {
        const storedDomainUrl =
          (await AsyncStorage.getItem("_domain")) ||
          (await AsyncStorage.getItem("domain_url"));
        const storedDomainId = await AsyncStorage.getItem("domain_id");
        if (storedDomainUrl) {
          setDomainUrl(storedDomainUrl);
        }
        if (storedDomainId) {
          setDomainId(storedDomainId);
        }
      } catch (error) {
        console.error("Failed to load stored domain info", error);
      }
    };

    fetchStoredDomain();
  }, []);

  useEffect(() => {
    const tryAutoLogin = async () => {
      if (Platform.OS === "web") {
        return;
      }

      try {
        const [
          storedToken,
          storedEmpId,
          storedDomainUrl,
          legacyDomainUrl,
          storedDomainId,
        ] = await Promise.all([
          AsyncStorage.getItem("auth_token"),
          AsyncStorage.getItem("emp_id"),
          AsyncStorage.getItem("domain_url"),
          AsyncStorage.getItem("_domain"),
          AsyncStorage.getItem("domain_id"),
        ]);

        const resolvedDomain = storedDomainUrl || legacyDomainUrl;
        if (!storedToken || !storedEmpId || !resolvedDomain) return;

        const domain = resolvedDomain.trim();
        const domainIdValue = storedDomainId?.trim() || undefined;
        if (!domain) return;

        setIsLoading(true);
        await setBaseUrl(domain);
        ApiService.setCredentials(storedToken, Number(storedEmpId));

        const refreshedResponse = await refreshLoginUser(
          storedToken,
          storedEmpId,
          domain,
          domainIdValue,
        );
        const refreshedData =
          refreshedResponse?.data?.data ?? refreshedResponse?.data ?? {};

        const mergedUserData = {
          ...refreshedData,
          TokenC: refreshedData?.TokenC ?? storedToken,
          EmpIdN: Number(refreshedData?.EmpIdN ?? storedEmpId),
          domain_url: domain,
          domain_id: domainIdValue ?? refreshedData?.domain_id ?? "",
        };

        await setUser(mergedUserData);
        router.replace("/(tabs)/dashboard");
      } catch (error) {
        console.warn("Auto-login failed. Clearing stale session.", error);
        await logout();
      } finally {
        setIsLoading(false);
      }
    };

    tryAutoLogin();
  }, [logout, router, setUser]);

  const showSnackbar = (
    message: string,
    type: "info" | "error" | "success" = "info",
  ) => {
    setSnackbar({ visible: true, message, type });
  };

  const resolveErrorMessage = (error: any) => {
    if (typeof error?.response?.data?.error === "string") {
      return error.response.data.error;
    }
    if (typeof error?.response?.data?.Error === "string") {
      return error.response.data.Error;
    }
    if (typeof error?.message === "string" && error.message.trim()) {
      return error.message;
    }
    return "Unable to connect to server";
  };

  const buildPolicyUrl = (baseUrl: string, filePath: string) => {
    if (!filePath) return "";
    if (/^https?:\/\//i.test(filePath)) return filePath;
    const trimmedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    const trimmedPath = filePath.startsWith("/") ? filePath : `/${filePath}`;
    return `${trimmedBase}${trimmedPath}`;
  };

  const finalizeLogin = async (payload: {
    token: string;
    empId: string;
    workingDomain: string;
    domainId?: string;
    userData: any;
  }) => {
    const { token, empId, workingDomain, domainId, userData } = payload;

    await AsyncStorage.setItem("auth_token", token);
    await AsyncStorage.setItem("emp_id", empId || "");
    await AsyncStorage.setItem("_domain", workingDomain);
    await AsyncStorage.setItem("domain_url", workingDomain);
    if (domainId) {
      await AsyncStorage.setItem("domain_id", domainId);
    } else {
      await AsyncStorage.removeItem("domain_id");
    }

    await setBaseUrl(workingDomain);
    ApiService.setCredentials(token, empId ? Number(empId) : null);

    let latestUserData = userData;
    try {
      const refreshResponse = await refreshLoginUser(
        token,
        empId,
        workingDomain,
        domainId,
      );
      const refreshedPayload =
        refreshResponse?.data?.data ?? refreshResponse?.data;
      if (refreshedPayload && typeof refreshedPayload === "object") {
        latestUserData = {
          ...userData,
          ...refreshedPayload,
        };
      }
    } catch (refreshError) {
      console.warn("Post-login user refresh failed", refreshError);
    }

    await setUser({
      ...latestUserData,
      TokenC: latestUserData?.TokenC ?? token,
      EmpIdN: Number(latestUserData?.EmpIdN ?? empId),
      domain_url: workingDomain,
      domain_id: domainId ?? latestUserData?.domain_id ?? "",
    });
    router.replace("/(tabs)/dashboard");
  };

  const handlePolicyDecline = async () => {
    setPolicyModalVisible(false);
    setPolicyUrl("");
    setPolicyId(null);
    setPendingLogin(null);
    setPolicyAcceptLoading(false);
    await logout();
    showSnackbar("Policy not accepted. Please sign in again.", "error");
  };

  const handlePolicyAccept = async () => {
    if (!pendingLogin || !policyId) return;
    setPolicyAcceptLoading(true);
    try {
      await compPoliciesUpdate(
        pendingLogin.workingDomain,
        pendingLogin.token,
        policyId,
      );
      setPolicyModalVisible(false);
      await finalizeLogin(pendingLogin);
    } catch (error: any) {
      showSnackbar(resolveErrorMessage(error), "error");
    } finally {
      setPolicyAcceptLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!empCode || !password || !domainUrl) {
      showSnackbar("Please fill in all required fields", "error");
      return;
    }

    setIsLoading(true);
    const normalizedDomainId = domainId.trim();

    try {
      const workingDomain = await resolveWorkingDomain(
        domainUrl,
        empCode,
        password,
        normalizedDomainId || undefined,
      );

      const response = await loginUser(
        empCode,
        password,
        workingDomain,
        normalizedDomainId || undefined,
      );

      const token = response.data.data?.TokenC;
      const empId = response.data.data?.EmpIdN;

      if (!token) {
        showSnackbar("Invalid credentials. Please check your details.", "error");
        return;
      }

      const userData = {
        ...(response.data.data || response),
        domain_url: workingDomain,
        domain_id: normalizedDomainId || undefined,
      };

      const policyFileName = response.data?.PoliciseFileName;
      const policyIdValue = Number(response.data?.PoliciseId || 0);
      const hasPolicy =
        policyIdValue > 0 &&
        typeof policyFileName === "string" &&
        policyFileName.trim();

      if (hasPolicy) {
        const resolvedPolicyUrl = buildPolicyUrl(workingDomain, policyFileName);
        setPendingLogin({
          token,
          empId: empId?.toString() ?? "",
          workingDomain,
          domainId: normalizedDomainId || undefined,
          userData,
        });
        setPolicyId(policyIdValue);
        setPolicyUrl(resolvedPolicyUrl);
        setPolicyModalVisible(true);
        return;
      }

      await finalizeLogin({
        token,
        empId: empId?.toString() ?? "",
        workingDomain,
        domainId: normalizedDomainId || undefined,
        userData,
      });
    } catch (error: any) {
      showSnackbar(resolveErrorMessage(error), "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableWithoutFeedback
            onPress={Platform.OS === "web" ? undefined : Keyboard.dismiss}
          >
            <SafeAreaView style={styles.safeArea}>
              <View
                style={[
                  styles.loginCard,
                  {
                    maxWidth: cardMaxWidth,
                    paddingHorizontal: isSmall ? 14 : isTablet ? 24 : 20,
                    paddingVertical: isSmall ? 18 : isTablet ? 28 : 24,
                  },
                  isWeb && {
                    backgroundColor: theme.cardBackground ?? theme.background,
                    borderColor: theme.inputBorder ?? "rgba(0, 0, 0, 0.08)",
                  },
                ]}
              >
                <View style={styles.headerBlock}>
                  <Text
                    style={[
                      styles.logoText,
                      { color: theme.primary, fontSize: isSmall ? 26 : isTablet ? 36 : 32 },
                    ]}
                  >
                    trickyhr
                  </Text>
                  <Text
                    style={[
                      styles.headerTitle,
                      { color: theme.text, fontSize: isSmall ? 20 : isTablet ? 26 : 24 },
                    ]}
                  >
                    Sign in
                  </Text>
                  <Text style={[styles.headerSubtitle, { color: theme.textLight }]}>
                    Enter your credentials to continue
                  </Text>
                </View>

                <CustomInput
                  placeholder="Employee Code"
                  value={empCode}
                  onChangeText={setEmpCode}
                  autoCapitalize="none"
                  icon="user"
                />

                <CustomInput
                  placeholder="Password"
                  secureTextEntry={!isPasswordVisible}
                  value={password}
                  onChangeText={setPassword}
                  icon={isPasswordVisible ? "eye" : "eye-off"}
                  onIconPress={() => setIsPasswordVisible(!isPasswordVisible)}
                />

                <CustomInput
                  placeholder="Server URL"
                  value={domainUrl}
                  onChangeText={setDomainUrl}
                  autoCapitalize="none"
                  icon="link"
                />

                <CustomInput
                  placeholder="Domain ID"
                  value={domainId}
                  onChangeText={setDomainId}
                  autoCapitalize="none"
                  icon="server"
                />

                <CustomButton
                  title="Sign In"
                  icon="log-in-outline"
                  onPress={handleLogin}
                  isLoading={isLoading}
                  style={styles.actionButton}
                />
              </View>

              <View style={styles.footer}>
                <Text style={[styles.footerText, { color: theme.textLight }]}>Created by</Text>
                <Text style={[styles.footerBrand, { color: theme.text }]}>Kevit Hisoft Solutions Pvt Ltd</Text>
              </View>
            </SafeAreaView>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>

      <Snackbar
        visible={snackbar.visible}
        message={snackbar.message}
        type={snackbar.type}
        onDismiss={() => setSnackbar((prev) => ({ ...prev, visible: false }))}
      />
      <Modal
        visible={policyModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={handlePolicyDecline}
      >
        <SafeAreaView
          style={[styles.policyModal, { backgroundColor: theme.background }]}
        >
          <View style={styles.policyHeader}>
            <Text style={[styles.policyTitle, { color: theme.text }]}>Company Policy</Text>
          </View>
          <View style={styles.policyBody}>
            {policyUrl ? (
              <WebView
                source={{ uri: policyUrl }}
                style={{ flex: 1 }}
                startInLoadingState={true}
              />
            ) : (
              <View style={styles.policyEmpty}>
                <Text style={[styles.policyEmptyText, { color: theme.text }]}>Policy file not available.</Text>
              </View>
            )}
          </View>
          <View style={styles.policyActions}>
            <CustomButton
              title="Decline & Logout"
              onPress={handlePolicyDecline}
              disabled={policyAcceptLoading}
              style={[
                styles.policyButton,
                { backgroundColor: theme.textLight, shadowColor: theme.text },
              ]}
            />
            <CustomButton
              title="Accept & Continue"
              onPress={handlePolicyAccept}
              isLoading={policyAcceptLoading}
              style={styles.policyButton}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  safeArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  loginCard: {
    width: "100%",
    borderRadius: 14,
    borderWidth: Platform.OS === "web" ? 1 : 0,
    gap: 8,
  },
  headerBlock: {
    marginBottom: 16,
    gap: 2,
  },
  logoText: {
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  actionButton: {
    marginTop: 10,
    borderRadius: 6,
  },
  footer: {
    marginTop: 20,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
  },
  footerBrand: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
    textAlign: "center",
  },
  policyModal: {
    flex: 1,
  },
  policyHeader: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
    alignItems: "center",
  },
  policyTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  policyBody: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  policyActions: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  policyButton: {
    width: "100%",
    marginBottom: 0,
  },
  policyEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  policyEmptyText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
