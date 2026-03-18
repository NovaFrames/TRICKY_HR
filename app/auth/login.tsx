import { useUser } from "@/context/UserContext";
import { resolveWorkingDomain } from "@/utils/domainResolver";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
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

const { width, height } = Dimensions.get("window");

const HARD_CODED_LOGIN_RESPONSE = {
  Status: "success",
  data: {
    EmpIdN: 38,
    IsLiveLocN: 1,
    LiveDurN: 30,
    EmpCodeC: "10005",
    EmpNameC: "DR.Baiju",
    DesigNameC: "Senior Executive",
    CustomerIdC: "trickyhr",
    CountryIdN: 0,
    AttDistanceN: 2000,
    FaceVerN: 0,
    EmpFaceIdC: "",
    EmpFaceRejectRemarksC: null,
    CompIdN: 1,
    CompNameC: "TRICKY HR - DEMO",
    WebsiteC: "",
    TokenC:
      "OoqlfJFUjuBppUGkSi3NVdNQ+7Nuztx7wsGySdhzCFkgYiafofUISOD9e4roqrDZ2owzbYGAqLXZOYKN/JYRptC92XvHGBHfWvzHD7E6uBKpL0GloAZanFbK8T/cie8bumKN2cqyBVDsS436CLBI8wk4hXt59tqO7RuMJFCbVCEjlxu+LSZWmcoPs9vym7ZBLIyrT538/h3UN0r29ANZ1P9lvEWeAtnRpjPKgB+gNgp5HSmoS6U7YsRFf536NdxM",
    PastLeaveN: 0,
    EnableMidMonthN: 0,
    GenderN: 1,
    EmpMenu: [
      { IdN: 13, MenuNameC: "Mobile Attendance", ActionC: "employee/Attendance", IconC: "fa fa-th-large", IconcolorC: "#ca007899", NCountN: 0 },
      { IdN: 20, MenuNameC: "Mobile Atten.Report", ActionC: "employee/MobileAttenRpt", IconC: "fa fa-mobile", IconcolorC: "#3eb79f", NCountN: 0 },
      { IdN: 2, MenuNameC: "Profile", ActionC: "employee/profileupdate", IconC: "fa fa-user", IconcolorC: "#299ef6", NCountN: 0 },
      { IdN: 3, MenuNameC: "Request Status", ActionC: "employee/empRequest", IconC: "fa fa-bar-chart", IconcolorC: "#0ab558", NCountN: 0 },
      { IdN: 4, MenuNameC: "Leave Manage", ActionC: "employee/leavemanage", IconC: "fa fa-plane", IconcolorC: "#ce9717", NCountN: 0 },
      { IdN: 5, MenuNameC: "Time Manage", ActionC: "employee/timemanage", IconC: "fa fa-clock-o", IconcolorC: "#ef6747", NCountN: 19 },
      { IdN: 6, MenuNameC: "Uploaded Document", ActionC: "employee/empdocument", IconC: "fa fa-file-text", IconcolorC: "#00b5ca", NCountN: 0 },
      { IdN: 12, MenuNameC: "Office Document", ActionC: "employee/OfficeDocument", IconC: "fa fa-building-o", IconcolorC: "#ca007899", NCountN: 0 },
      { IdN: 7, MenuNameC: "PaySlip", ActionC: "employee/payslip", IconC: "fa fa-files-o", IconcolorC: "#f65aa8", NCountN: 0 },
      { IdN: 9, MenuNameC: "Holiday", ActionC: "employee/holiday", IconC: "fa fa-list-alt", IconcolorC: "#b86eef", NCountN: 0 },
      { IdN: 10, MenuNameC: "Upcoming Celebration", ActionC: "employee/celebration", IconC: "fa fa-birthday-cake", IconcolorC: "#9acd32", NCountN: 0 },
      { IdN: 128, MenuNameC: "Calender", ActionC: "officer/calender", IconC: "fa fa-calendar", IconcolorC: "#4682b4", NCountN: 0 },
      { IdN: 102, MenuNameC: "Employee List", ActionC: "officer/emplist", IconC: "fa fa-users", IconcolorC: "#299ef6", NCountN: 0 },
      { IdN: 103, MenuNameC: "Employee Attendance", ActionC: "officer/Attendance", IconC: "fa fa-newspaper-o", IconcolorC: "#81bd72", NCountN: 0 },
      { IdN: 16, MenuNameC: "Claim & Expense", ActionC: "employee/ClaimandExpense", IconC: "fa fa-money", IconcolorC: "#299ef6", NCountN: 0 },
      { IdN: 111, MenuNameC: "Emp Mobile Atten.Rpt", ActionC: "officer/EmpMobileRpt", IconC: "fa fa-mobile", IconcolorC: "#ca007899", NCountN: 0 },
      { IdN: 18, MenuNameC: "Service Report", ActionC: "employee/ServiceReport", IconC: "fa fa-handshake-o", IconcolorC: "#3eb79f", NCountN: 0 },
      { IdN: 106, MenuNameC: "Pending Approval", ActionC: "officer/pendingapproval", IconC: "fa fa-th-large", IconcolorC: "#00b5ca", NCountN: 2 },
      { IdN: 107, MenuNameC: "Approved / Rejected Details", ActionC: "officer/approvaldetails", IconC: "fa fa-thumbs-up", IconcolorC: "#00b5ca", NCountN: 0 },
      { IdN: 41, MenuNameC: "Exit Request", ActionC: "employee/ExitRequest", IconC: "fa fa-tachometer ", IconcolorC: "#3eb79f", NCountN: 0 },
    ],
  },
  PoliciseId: 0,
  PoliciseFileName: "",
  Error: "",
} as const;

export default function Login() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
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

  // Animation Values
  const animationProgress = useSharedValue(0);
  const formItemsProgress = useSharedValue(0);

  useEffect(() => {
    const startAnimation = async () => {
      // Wait a bit for the splash feel
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Animate to Login State
      animationProgress.value = withTiming(
        1,
        {
          duration: 1200,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        },
        () => {
          // Once primary animation finishes, stagger the form items
          formItemsProgress.value = withTiming(1, {
            duration: 800,
            easing: Easing.out(Easing.quad),
          });
        },
      );
    };

    startAnimation();
  }, []);

  const { setUser, logout } = useUser();

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

  // const handleLogin = async () => {
  //   if (Platform.OS === "web") {
  //     setIsLoading(true);
  //     try {
  //       const workingDomain = (domainUrl || "http://localhost:8080").trim();
  //       const dataNode = HARD_CODED_LOGIN_RESPONSE.data;

  //       await finalizeLogin({
  //         token: dataNode.TokenC,
  //         empId: String(dataNode.EmpIdN),
  //         workingDomain,
  //         domainId: domainId.trim() || undefined,
  //         userData: {
  //           ...dataNode,
  //           domain_url: workingDomain,
  //           domain_id: domainId.trim() || undefined,
  //         },
  //       });
  //     } catch (error: any) {
  //       showSnackbar(resolveErrorMessage(error), "error");
  //     } finally {
  //       setIsLoading(false);
  //     }
  //     return;
  //   }

  //   if (!empCode || !password || !domainUrl) {
  //     showSnackbar("Please fill in all required fields", "error");
  //     return;
  //   }

  //   setIsLoading(true);
  //   const normalizedDomainId = domainId.trim();

  //   try {
  //     // 🔥 Detect correct protocol
  //     const workingDomain = await resolveWorkingDomain(
  //       domainUrl,
  //       empCode,
  //       password,
  //       normalizedDomainId || undefined,
  //     );

  //     // 🔥 Now login using confirmed URL
  //     const response = await loginUser(
  //       empCode,
  //       password,
  //       workingDomain,
  //       normalizedDomainId || undefined,
  //     );
  //     const root = response?.data ?? {};
  //     const dataNode =
  //       root?.data && typeof root.data === "object" ? root.data : root;
  //     const status = String(
  //       root?.Status ?? dataNode?.Status ?? "",
  //     ).toLowerCase();
  //     const token = dataNode?.TokenC ?? root?.TokenC;
  //     const empId = dataNode?.EmpIdN ?? root?.EmpIdN;

  //     if (status && status !== "success") {
  //       showSnackbar(
  //         root?.Error || dataNode?.Error || "Invalid credentials",
  //         "error",
  //       );
  //       return;
  //     }

  //     if (!token) {
  //       showSnackbar(
  //         "Invalid credentials. Please check your details.",
  //         "error",
  //       );
  //       return;
  //     }

  //     const userData = {
  //       ...dataNode,
  //       domain_url: workingDomain,
  //       domain_id: normalizedDomainId || undefined,
  //     };

  //     const policyFileName = root?.PoliciseFileName;
  //     const policyIdValue = Number(root?.PoliciseId || 0);
  //     const hasPolicy =
  //       policyIdValue > 0 &&
  //       typeof policyFileName === "string" &&
  //       policyFileName.trim();

  //     if (hasPolicy) {
  //       const resolvedPolicyUrl = buildPolicyUrl(workingDomain, policyFileName);
  //       setPendingLogin({
  //         token,
  //         empId: empId?.toString() ?? "",
  //         workingDomain,
  //         domainId: normalizedDomainId || undefined,
  //         userData,
  //       });
  //       setPolicyId(policyIdValue);
  //       setPolicyUrl(resolvedPolicyUrl);
  //       setPolicyModalVisible(true);
  //       return;
  //     }

  //     await finalizeLogin({
  //       token,
  //       empId: empId?.toString() ?? "",
  //       workingDomain,
  //       domainId: normalizedDomainId || undefined,
  //       userData,
  //     });
  //   } catch (error: any) {
  //     showSnackbar(resolveErrorMessage(error), "error");
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

    const handleLogin = async () => {
    if (!empCode || !password || !domainUrl) {
      showSnackbar("Please fill in all required fields", "error");
      return;
    }

    setIsLoading(true);
    const normalizedDomainId = domainId.trim();

    try {
      // 🔥 Detect correct protocol
      const workingDomain = await resolveWorkingDomain(
        domainUrl,
        empCode,
        password,
        normalizedDomainId || undefined,
      );

      // 🔥 Now login using confirmed URL
      const response = await loginUser(
        empCode,
        password,
        workingDomain,
        normalizedDomainId || undefined,
      );
      
      const token = response.data.data?.TokenC;
      const empId = response.data.data?.EmpIdN;

      if (!token) {
        showSnackbar(
          "Invalid credentials. Please check your details.",
          "error",
        );
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
        const resolvedPolicyUrl = buildPolicyUrl(
          workingDomain,
          policyFileName,
        );
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

  // --- Animated Styles (Blob Design) ---

  // 1. The Blob (Background Shape)
  const blobStyle = useAnimatedStyle(() => {
    const w = interpolate(
      animationProgress.value,
      [0, 1],
      [width * 0.8, width * 1.5],
    );
    const h = interpolate(
      animationProgress.value,
      [0, 1],
      [width * 0.8, height * 0.5],
    );
    const top = interpolate(
      animationProgress.value,
      [0, 1],
      [height / 2 - width * 0.4 - insets.top, height * 0.9 - insets.bottom],
    );

    const left = interpolate(
      animationProgress.value,
      [0, 1],
      [width / 2 - width * 0.4, -width * 0.2],
    );
    const radius = interpolate(
      animationProgress.value,
      [0, 1],
      [width * 0.4, width * 0.8],
    );
    const rotate = interpolate(animationProgress.value, [0, 1], [0, -15]);

    return {
      width: w,
      height: h,
      top: top,
      left: left,
      borderRadius: radius,
      transform: [{ rotate: `${rotate}deg` }],
      backgroundColor: theme.primary,
    };
  });

  // 2. Logo Animation (Center to Top)
  const logoStyle = useAnimatedStyle(() => {
    const top = interpolate(
      animationProgress.value,
      [0, 1],
      [height / 2 - 50, height * 0.12],
    );
    const scale = interpolate(animationProgress.value, [0, 1], [1.1, 0.9]);

    return {
      top: top,
      transform: [{ scale }],
    };
  });

  const logoTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      animationProgress.value,
      [0, 1],
      [theme.textLight, theme.primary],
    ),
  }));

  // 3. Form Fade In
  const formStyle = useAnimatedStyle(() => ({
    opacity: interpolate(animationProgress.value, [0.7, 1], [0, 1]),
    transform: [
      { translateY: interpolate(animationProgress.value, [0.7, 1], [20, 0]) },
    ],
  }));

  // 4. Staggered Item Animations
  const itemStyle0 = useAnimatedStyle(() => ({
    opacity: interpolate(formItemsProgress.value, [0, 0.4], [0, 1], "clamp"),
    transform: [
      {
        translateX: interpolate(
          formItemsProgress.value,
          [0, 0.4],
          [20, 0],
          "clamp",
        ),
      },
    ],
  }));

  const itemStyle1 = useAnimatedStyle(() => ({
    opacity: interpolate(formItemsProgress.value, [0.1, 0.5], [0, 1], "clamp"),
    transform: [
      {
        translateX: interpolate(
          formItemsProgress.value,
          [0.1, 0.5],
          [20, 0],
          "clamp",
        ),
      },
    ],
  }));

  const itemStyle2 = useAnimatedStyle(() => ({
    opacity: interpolate(formItemsProgress.value, [0.2, 0.6], [0, 1], "clamp"),
    transform: [
      {
        translateX: interpolate(
          formItemsProgress.value,
          [0.2, 0.6],
          [20, 0],
          "clamp",
        ),
      },
    ],
  }));

  const itemStyle3 = useAnimatedStyle(() => ({
    opacity: interpolate(formItemsProgress.value, [0.3, 0.7], [0, 1], "clamp"),
    transform: [
      {
        translateX: interpolate(
          formItemsProgress.value,
          [0.3, 0.7],
          [20, 0],
          "clamp",
        ),
      },
    ],
  }));

  const itemStyle4 = useAnimatedStyle(() => ({
    opacity: interpolate(formItemsProgress.value, [0.4, 0.8], [0, 1], "clamp"),
    transform: [
      {
        translateX: interpolate(
          formItemsProgress.value,
          [0.4, 0.8],
          [20, 0],
          "clamp",
        ),
      },
    ],
  }));

  const itemStyle5 = useAnimatedStyle(() => ({
    opacity: interpolate(formItemsProgress.value, [0.5, 0.9], [0, 1], "clamp"),
    transform: [
      {
        translateX: interpolate(
          formItemsProgress.value,
          [0.5, 0.9],
          [20, 0],
          "clamp",
        ),
      },
    ],
  }));

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* The Blob Element */}
      <Animated.View pointerEvents="none" style={[styles.blob, blobStyle]} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableWithoutFeedback
            onPress={Platform.OS === "web" ? undefined : Keyboard.dismiss}
          >
            <SafeAreaView style={styles.safeArea}>
              {/* Logo Section (Absolute to animate) */}
              <Animated.View style={[styles.logoContainer, logoStyle]}>
                <Animated.Text style={[styles.logoText, logoTextStyle]}>
                  trickyhr
                </Animated.Text>
                <Text style={[styles.tagline, { color: theme.text }]}>
                  Sign in to Continue
                </Text>
              </Animated.View>

              {/* Form Section */}
              <Animated.View style={[styles.formContainer, formStyle]}>
                <Animated.View style={[styles.welcomeSection, itemStyle0]}>
                  <Text style={[styles.welcomeTitle, { color: theme.text }]}>
                    Welcome
                  </Text>
                  <Text
                    style={[styles.welcomeSubtitle, { color: theme.textLight }]}
                  >
                    Enter your credentials
                  </Text>
                </Animated.View>

                <Animated.View style={itemStyle1}>
                  <CustomInput
                    placeholder="Employee Code"
                    value={empCode}
                    onChangeText={setEmpCode}
                    autoCapitalize="none"
                    icon="user"
                  />
                </Animated.View>

                <Animated.View style={itemStyle2}>
                  <CustomInput
                    placeholder="Password"
                    secureTextEntry={!isPasswordVisible}
                    value={password}
                    onChangeText={setPassword}
                    icon={isPasswordVisible ? "eye" : "eye-off"}
                    onIconPress={() => setIsPasswordVisible(!isPasswordVisible)}
                  />
                </Animated.View>

                <Animated.View style={itemStyle4}>
                  <CustomInput
                    placeholder="Server URL"
                    value={domainUrl}
                    onChangeText={setDomainUrl}
                    autoCapitalize="none"
                    icon="link"
                  />
                </Animated.View>

                <Animated.View style={itemStyle3}>
                  <CustomInput
                    placeholder="Domain ID"
                    value={domainId}
                    onChangeText={setDomainId}
                    autoCapitalize="none"
                    icon="server"
                  />
                </Animated.View>

                <Animated.View style={itemStyle5}>
                  <CustomButton
                    title="Sign In"
                    icon="log-in-outline"
                    onPress={handleLogin}
                    isLoading={isLoading}
                    style={styles.actionButton}
                  />
                </Animated.View>
              </Animated.View>

              <Animated.View style={[styles.footer, formStyle]}>
                <Text style={styles.footerText}>
                  <Text style={{ color: theme.textLight }}>
                    @created by{"\n"}
                  </Text>
                  <Text style={{ color: theme.text, fontWeight: "900" }}>
                    Kevit Hisoft Solutions Pvt Ltd
                  </Text>
                </Text>
              </Animated.View>
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
            <Text style={[styles.policyTitle, { color: theme.text }]}>
              Company Policy
            </Text>
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
                <Text style={[styles.policyEmptyText, { color: theme.text }]}>
                  Policy file not available.
                </Text>
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
  safeArea: {
    flex: 1,
    alignItems: "center",
  },
  blob: {
    position: "absolute",
  },
  logoContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    width: width,
    zIndex: 20,
  },
  logoText: {
    fontSize: 44,
    fontWeight: "900",
    letterSpacing: -2,
  },
  tagline: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginTop: 4,
    textTransform: "uppercase",
  },
  formContainer: {
    width: "100%",
    paddingHorizontal: 28,
    marginTop: height * 0.22,
    zIndex: 10,
  },
  welcomeSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  welcomeSubtitle: {
    fontSize: 14,
    marginTop: 4,
    opacity: 0.6,
  },
  domainRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    marginTop: 10,
    borderRadius: 4,
  },
  footer: {
    marginTop: "auto",
    paddingVertical: 24,
    alignItems: "center",
  },
  footerText: {
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 2,
    textTransform: "uppercase",
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
