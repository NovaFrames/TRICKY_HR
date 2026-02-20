import { API_ENDPOINTS } from "@/constants/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as FileSystem from "expo-file-system/legacy";
import { getAuthTokenSafely, setDomainUrlSafely } from "./urldomain";

const normalizeBaseUrl = (domainUrl: string) => {
  const trimmed = domainUrl.trim();
  if (!trimmed) return "";
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
};

export const getSafeDomain = async (): Promise<string | null> => {
  const domain = await AsyncStorage.getItem("domain_url");
  const normalized = normalizeBaseUrl(domain ?? "");
  return normalized || null;
};

export const getSafeToken = async (): Promise<string | null> => {
  const token = await getAuthTokenSafely();
  return token ?? null;
};

// Create an axios instance
const api = axios.create({
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

export const ensureBaseUrl = async () => {
  const domainUrl = await getSafeDomain();
  if (!domainUrl) {
    throw new Error("Domain URL not configured");
  }
  return domainUrl;
};

export const setBaseUrl = async (
  domainUrl: string,
  options?: { force?: boolean },
) => {
  const normalized = normalizeBaseUrl(domainUrl);
  if (!normalized) return;
  await setDomainUrlSafely(normalized, options);
};

api.interceptors.request.use(async (config) => {
  const resolvedBaseUrl =
    normalizeBaseUrl(config.baseURL ?? "") || (await getSafeDomain());

  if (!resolvedBaseUrl) {
    throw new Error("Domain URL missing. Please login again.");
  }

  config.baseURL = resolvedBaseUrl;

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("[ApiService] Request failed", {
      message: error?.message,
      status: error?.response?.status,
      endpoint: error?.config?.url,
      baseURL: error?.config?.baseURL,
      data: error?.response?.data,
    });
    return Promise.reject(error);
  },
);

export const loginUser = async (
  empCode: string,
  password: string,
  domainUrl: string,
  domainId?: string,
) => {
  try {
    const response = await api.post(
      API_ENDPOINTS.LOGIN,
      {
        EmpCode: empCode,
        Password: password,
        ...(domainId ? { DomainId: domainId } : {}),
      },
      {
        baseURL: normalizeBaseUrl(domainUrl),
      },
    );
    return response ?? null;
  } catch (error) {
    throw error;
  }
};

export const compPoliciesUpdate = async (
  domainUrl: string,
  token: string,
  policyId: number,
) => {
  try {
    const normalized = normalizeBaseUrl(domainUrl);
    const response = await api.post(
      API_ENDPOINTS.COMP_POLICIES_UPDATE,
      {
        TokenC: token,
        PoliciseId: policyId,
      },
      {
        baseURL: normalized,
        headers: {
          "Content-Type": "application/json",
          Token: token,
        },
      },
    );
    return response?.data ?? null;
  } catch (error) {
    throw error;
  }
};

// function moved to class

// Adapted for React Native FormData
export const faceRegApi = async ({
  image,
  imageFile,
  userToken,
  empId,
}: any) => {
  const formData = new FormData();
  formData.append("TokenC", String(userToken));
  formData.append("EmpIdN", String(empId));
  formData.append("EmpFaceIdC", image);

  // React Native expects object with uri, name, type for files
  if (imageFile) {
    formData.append("EmpImages", {
      uri: imageFile.uri,
      name: imageFile.name || "photo.jpg",
      type: imageFile.type || "image/jpeg",
    } as any);
  }

  try {
    // Using explicit full URL to be safe, matching the standard WebApi pattern
    const response = await api.post("/UpdateFaceRegister", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response?.data ?? null;
  } catch (error) {
    throw error;
  }
};

export interface AttendanceResponse {
  success: boolean;
  message?: string;
  raw?: any;
}

const parseServerDate = (serverDateTime?: string) => {
  const monthMap: Record<string, string> = {
    Jan: "01",
    Feb: "02",
    Mar: "03",
    Apr: "04",
    May: "05",
    Jun: "06",
    Jul: "07",
    Aug: "08",
    Sep: "09",
    Oct: "10",
    Nov: "11",
    Dec: "12",
  };

  const formatParts = (date: Date) => {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    const ss = String(date.getSeconds()).padStart(2, "0");
    return { date: `${month}/${day}/${year}`, time: `${hh}:${mm}:${ss}` };
  };

  if (!serverDateTime || typeof serverDateTime !== "string") {
    return formatParts(new Date());
  }

  const dotNetMatch = serverDateTime.match(/\/Date\((\d+)\)\//);
  if (dotNetMatch) {
    const ms = Number(dotNetMatch[1]);
    if (Number.isFinite(ms)) {
      return formatParts(new Date(ms));
    }
  }

  const [day, monthStr, year, time] = serverDateTime.trim().split(" ");
  if (day && monthStr && year && monthMap[monthStr]) {
    return {
      date: `${monthMap[monthStr]}/${day}/${year}`,
      time: time || "00:00:00",
    };
  }

  return formatParts(new Date());
};

const parseServerTimeToUTC = (dateInput: string | Date): number => {
  if (dateInput instanceof Date) {
    if (Number.isNaN(dateInput.getTime())) {
      throw new Error("Invalid Date object");
    }
    return Date.UTC(
      dateInput.getUTCFullYear(),
      dateInput.getUTCMonth(),
      dateInput.getUTCDate(),
      dateInput.getUTCHours(),
      dateInput.getUTCMinutes(),
      dateInput.getUTCSeconds(),
    );
  }

  if (typeof dateInput === "string" && dateInput.includes("/Date(")) {
    const timestamp = Number(dateInput.replace(/\D/g, ""));
    if (Number.isFinite(timestamp)) {
      return timestamp;
    }
  }

  const dmy =
    typeof dateInput === "string"
      ? dateInput.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
      : null;
  if (dmy) {
    const [, day, month, year] = dmy;
    return Date.UTC(+year, +month - 1, +day);
  }

  const textDate =
    typeof dateInput === "string"
      ? dateInput.match(
          /^(\d{1,2}) ([A-Za-z]{3}) (\d{4}) (\d{2}):(\d{2}):(\d{2})$/,
        )
      : null;

  if (textDate) {
    const [, day, mon, year, hh, mm, ss] = textDate;
    const monthIndex = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ].indexOf(mon);

    if (monthIndex !== -1) {
      return Date.UTC(+year, monthIndex, +day, +hh, +mm, +ss);
    }
  }

  throw new Error(`Invalid date format: ${String(dateInput)}`);
};

const toDotNetDate = (dateInput: string | Date): string => {
  const utcTimestamp = parseServerTimeToUTC(dateInput);
  return `/Date(${utcTimestamp})/`;
};

export const markMobileAttendance = async (
  token: string,
  empId: number,
  projectId: number,
  mode: 0 | 1,
  location: { latitude: number; longitude: number; address?: string },
  imageUri: string,
  remark: string,
  serverDateTime: string,
  createdUser: number,
  selectedDate?: Date,
): Promise<AttendanceResponse> => {
  const tokenBefore = await getSafeToken();
  console.log("[Attendance] token before submit:", tokenBefore ?? "missing");

  try {
    await ensureBaseUrl();
  } catch (error: any) {
    console.error("[Attendance] Missing domain/baseURL:", error?.message);
    return { success: false, message: "Domain not available" };
  }

  if (!serverDateTime) {
    return { success: false, message: "Invalid server time" };
  }

  let date = "";
  let time = "";

  try {
    const parsed = parseServerDate(serverDateTime);
    date = parsed.date;
    time = parsed.time;

    if (selectedDate && Number.isFinite(selectedDate.getTime())) {
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");
      const year = selectedDate.getFullYear();
      date = `${month}/${day}/${year}`;
    }
  } catch {
    return { success: false, message: "Date parsing failed" };
  }

  const formData = new FormData();
  formData.append("MobilePht", {
    uri: imageUri,
    name: "attendance.jpg",
    type: "image/jpeg",
  } as any);

  formData.append("TokenC", token);
  formData.append("EmpIdN", empId.toString());
  formData.append("DateD", date);
  formData.append("TimeD", time);
  formData.append("GPRSC", `${location.latitude},${location.longitude}`);
  formData.append("ModeN", mode.toString());
  formData.append("PunchLocC", location.address || "");
  formData.append("RemarkC", remark || "");
  formData.append("ProjectIdN", projectId.toString());
  formData.append("CreatedByN", createdUser.toString());

  try {
    const response = await api.post(
      API_ENDPOINTS.INSERT_MOBILE_ATTENDANCE,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 30000,
      },
    );

    if (response.data?.Status === "success") {
      return {
        success: true,
        message: response.data?.Message || "Attendance marked successfully",
        raw: response.data,
      };
    }

    return {
      success: false,
      message: response.data?.Message || "Attendance failed",
      raw: response.data,
    };
  } catch (error: any) {
    console.error("[Attendance] markMobileAttendance error", {
      message: error?.message,
      status: error?.response?.status,
      data: error?.response?.data,
    });
    return {
      success: false,
      message: error?.message || "Network / Server error",
    };
  } finally {
    const tokenAfter = await getSafeToken();
    console.log("[Attendance] token after submit:", tokenAfter ?? "missing");
  }
};

export { api };

// Types
export interface LeaveType {
  ReaGrpNameC: string;
  BalanceN: number;
  EligibleN: number;
  CreditN: number;
  LVSurrenderN: number;
  BFN: number;
  ALEarnN: number;
  ALTotalN: number;
  RequestN: number;
  TakenN: number;
  HrlN: number;
  ReaGrpIdN: number;
}

export interface AvailableLeaveType {
  ReaIdN: number;
  ReaNameC: string;
  ReaGrpIdN: number;
  ReaTypeN: number;
  ReaTypeNameC: string;
  PastLeaveN: number;
  HrlN: number;
}

export interface LeaveApplicationData {
  AppEmpIdN: number;
  LIdN: number;
  LFromDateD: string;
  LToDateD: string;
  FHN: number;
  THN: number;
  THrsN: number;
  UnitN: number;
  MLClaimAmtN: number;
  LVRemarksC: string;
  PastLeaveN: number;
}

export interface SurrenderData {
  EmpIdN: number;
  SurrenderN: number;
  PayoutDateD: string;
  RemarksC: string;
}

export interface PaySlip {
  PayDateD: string;
  MonthN: number;
  YearN: number;
  PaySalIdN: number;
  PayTypeC: string;
}

export interface CalendarEvent {
  DescC: string;
  LDateD: string; // Format: /Date(1518028200000)/
}

export interface CalendarLeaveDetail {
  EmpCodeC: string;
  DescC: string;
  RemarksC: string;
  LeaveTypeC: string;
}

export interface Employee {
  NameC: string;
  CodeC: string;
  EmpIdN: number;
  DescC: string; // Designation
  ImageUrl?: string;
  AllowEmpAttToSupN: boolean;
}

export interface TimeRequestPayload {
  TokenC: string;
  model: {
    EmpIdN: number;
    DateD: string;
    InTimeN: string;
    OutTimeN: string;
    ProjectIdN: number;
    TMSRemarksC: string;
  };
}

export interface LeaveBalanceResponse {
  Status: string;
  Error: string;
  LVSurrenderN: number;
  LvApplyBeforeN: number;
  MLClaimLimitN: number;
  MLPerVisitMaxN: number;
  MLClaimAvailN: number;
  data: Array<{
    EmpLeaveApply: LeaveType[];
    Reason: AvailableLeaveType[];
  }>;
  GenderN: number;
}

export interface LeaveApplicationResponse {
  Status: string;
  Error: string;
  IdN: number;
  data?: string;
}

export interface AttendanceProject {
  ProjectIdN: number;
  ProjectNameC: string;
}

export interface TravelExpense {
  TravelAmountN: number;
  PNRC: string;
  DestinationC: string;
  BoardintPointC: string;
  TravelByN: number;
}

export interface ClaimData {
  ClaimAmtN: number;
  DescC: string;
  AllownIdN: number;
  CurrencyIdN: number;
  FromDateD: string;
  ToDateD: string;
  ClaimExpenseDtl1: TravelExpense[];
}

export interface APIResponse {
  Status: "success" | "error";
  Error?: string;
  data?: any;
  IdN?: number;
  EnableCurrency?: boolean;
  Currency?: Array<{ IdN: number; NameC: string }>;
}

export interface DocumentFile {
  uri: string;
  type: string;
  name: string;
}

class ApiService {
  private static instance: ApiService;
  private token: string | null = null;
  private empId: number | null = null;

  private constructor() {
    this.loadCredentials();
  }

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private async loadCredentials() {
    try {
      const domainUrl = await getSafeDomain();
      if (!domainUrl) {
        // First launch / logged-out state: credentials cannot be loaded yet.
        this.token = null;
        this.empId = null;
        return;
      }
      this.token = await getSafeToken();
      const empIdStr = await AsyncStorage.getItem("emp_id");
      this.empId = empIdStr ? parseInt(empIdStr) : null;
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.message === "Domain URL not configured"
      ) {
        // Expected in pre-login state.
        this.token = null;
        this.empId = null;
        return;
      }
      console.error("Error loading credentials:", error);
    }
  }

  private async ensureApiReady() {
    await ensureBaseUrl();
  }

  private async saveCredentials(token: string, empId: number) {
    try {
      await AsyncStorage.setItem("auth_token", token);
      await AsyncStorage.setItem("emp_id", empId.toString());
      this.token = token;
      this.empId = empId;
    } catch (error) {
      console.error("Error saving credentials:", error);
    }
  }

  private getHeaders() {
    return {
      "Content-Type": "application/json",
      Token: this.token || "",
    };
  }

  // Authentication
  async login(username: string, password: string, companyCode: string) {
    try {
      const response = await api.post(API_ENDPOINTS.LOGIN, {
        username,
        password,
        companyCode,
      });

      if (response.data.Status === "success") {
        const token = response.data.TokenC;
        const empId = response.data.data.EmpIdN;
        await this.saveCredentials(token, empId);
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.data.Error };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.Error || "Network error",
      };
    }
  }

  // Leave Management APIs
  async getProjectList() {
    try {
      if (!this.token) {
        await this.loadCredentials();
      }

      const response = await api.post(
        API_ENDPOINTS.GET_PROJECT_LIST,
        {
          TokenC: this.token,
        },
        { headers: this.getHeaders() },
      );

      if (response.data.Status === "success") {
        return response.data.data || [];
      } else if (Array.isArray(response.data)) {
        return response.data;
      }

      return [];
    } catch (error: any) {
      console.error("Error fetching project list:", error);
      return [];
    }
  }

  async getLeaveBalance(): Promise<{
    success: boolean;
    data?: LeaveBalanceResponse;
    error?: string;
  }> {
    try {
      if (!this.token) {
        await this.loadCredentials();
      }

      // console.log("getLeaveBalance Request Payload:", {
      //   TokenC: this.token,
      //   EmpIdN: this.empId,
      // });

      const response = await api.post(
        API_ENDPOINTS.GET_LEAVE_DETAILS,
        {
          TokenC: this.token,
          EmpIdN: this.empId,
        },
        { headers: this.getHeaders() },
      );

      if (response.data.Status === "success") {
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.data.Error };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.Error || "Network error",
      };
    }
  }

  async getLeaveApprovalDetails({ IdN }: { IdN: number }): Promise<{
    success: boolean;
    data?: LeaveBalanceResponse;
    error?: string;
  }> {
    try {
      if (!this.token) {
        await this.loadCredentials();
      }

      // console.log("getLeaveDetails Request Payload:", {
      //   TokenC: this.token,
      //   EmpIdN: IdN,
      // });

      const response = await api.post(
        API_ENDPOINTS.GET_LEAVE_BALANCE_DETAILS,
        {
          TokenC: this.token,
          EmpIdN: IdN,
        },
        { headers: this.getHeaders() },
      );

      if (response.data.Status === "success") {
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.data.Error };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.Error || "Network error",
      };
    }
  }

  async checkLeaveAvailability(
    fromDate: string,
    toDate: string,
    reaGrpIdN: number,
    thrsN: number = 0,
    unit: number = 1,
  ): Promise<{ success: boolean; leaveDays?: number; error?: string }> {
    try {
      if (!this.token) {
        await this.loadCredentials();
      }

      const response = await api.post(
        API_ENDPOINTS.GET_LEAVE_BALANCE,
        {
          TokenC: this.token,
          EmpIdN: this.empId,
          LDateD: fromDate,
          LToDateD: toDate,
          ReaGrpIdN: reaGrpIdN,
          THrsN: thrsN,
          unit: unit,
        },
        { headers: this.getHeaders() },
      );

      if (response.data.Status === "success") {
        return { success: true, leaveDays: response.data.LeaveDays };
      } else {
        return { success: false, error: response.data.Error };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.Error || "Network error",
      };
    }
  }

  async applyLeave(leaveData: LeaveApplicationData): Promise<{
    success: boolean;
    data?: LeaveApplicationResponse;
    error?: string;
  }> {
    try {
      if (!this.token) {
        await this.loadCredentials();
      }

      // Ensure AppEmpIdN is set if missing
      if (!leaveData.AppEmpIdN && this.empId) {
        leaveData.AppEmpIdN = this.empId;
      }

      const response = await api.post(
        API_ENDPOINTS.APPLY_LEAVE,
        {
          TokenC: this.token,
          lap: leaveData,
        },
        { headers: this.getHeaders() },
      );
      // console.log(this.token);
      // console.log(this.empId);
      // console.log(leaveData);
      const status = response.data.Status
        ? response.data.Status.toLowerCase()
        : "";
      const success = status === "success";

      return {
        success: success,
        data: response.data,
        error: !success ? response.data.Error || "Unknown Error" : undefined,
      };
    } catch (error: any) {
      console.log("Apply Leave API Error:", error);
      if (error.response) {
        console.log("Error Data:", JSON.stringify(error.response.data));
        console.log("Error Status:", error.response.status);
      }
      return {
        success: false,
        error: error.response?.data?.Error || error.message || "Network error",
      };
    }
  }

  async getSurrenderBalance(): Promise<{
    success: boolean;
    eligLeave?: number;
    error?: string;
  }> {
    try {
      if (!this.token) {
        await this.loadCredentials();
      }

      const response = await api.post(
        API_ENDPOINTS.GET_SURRENDER_BALANCE,
        {
          TokenC: this.token,
          EmpIdN: this.empId,
        },
        { headers: this.getHeaders() },
      );

      if (response.data.Status === "success") {
        return { success: true, eligLeave: response.data.EligLeave };
      } else {
        return { success: false, error: response.data.Error };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.Error || "Network error",
      };
    }
  }

  async submitSurrender(surrenderData: SurrenderData): Promise<{
    success: boolean;
    data?: LeaveApplicationResponse;
    error?: string;
  }> {
    try {
      if (!this.token) {
        await this.loadCredentials();
      }

      // Ensure EmpIdN is set if missing
      if (!surrenderData.EmpIdN && this.empId) {
        surrenderData.EmpIdN = this.empId;
      }

      const response = await api.post(
        API_ENDPOINTS.SUBMIT_SURRENDER,
        {
          TokenC: this.token,
          data: surrenderData,
        },
        { headers: this.getHeaders() },
      );

      return {
        success: response.data.Status === "success",
        data: response.data,
        error:
          response.data.Status === "error" ? response.data.Error : undefined,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.Error || "Network error",
      };
    }
  }

  async getSurrenderDetails(surrenderId: number) {
    try {
      if (!this.token) {
        await this.loadCredentials();
      }

      const response = await api.post(
        API_ENDPOINTS.GET_SURRENDER_DETAILS,
        {
          TokenC: this.token,
          Id: surrenderId,
        },
        { headers: this.getHeaders() },
      );

      if (response.data.Status === "success") {
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.data.Error };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.Error || "Network error",
      };
    }
  }

  async cancelLeave(
    payload: any,
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      if (!this.token) {
        await this.loadCredentials();
      }

      const requestPayload = {
        ...payload,
        TokenC: this.token,
        Tokenc: this.token, // Add lowercase Key as requested
      };

      // console.log(
      //   "Cancel Leave Request Payload:",
      //   JSON.stringify(requestPayload),
      // );

      const response = await api.post(
        API_ENDPOINTS.SAVE_APPROVAL,
        requestPayload,
        { headers: this.getHeaders() },
      );

      // console.log("Cancel Leave Response:", JSON.stringify(response.data));

      if (response.data.Status === "success") {
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.data.Error };
      }
    } catch (error: any) {
      console.log("Cancel Leave API Error:", error);
      return {
        success: false,
        error: error.response?.data?.Error || "Network error",
      };
    }
  }

  async deleteRequest(
    requestId: number | string,
    requestType: string = "Lev",
    fromDate?: Date,
    toDate?: Date,
    remarks: string = "Cancelled by user",
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      if (!this.token || !this.empId) {
        await this.loadCredentials();
      }

      if (!this.token || !this.empId) {
        return {
          success: false,
          error: "Authentication token not found. Please login again.",
        };
      }

      // Format dates to match backend expectations (ISO format or specific format)
      const formatDate = (date?: Date) => {
        if (!date) return new Date().toISOString();
        return date.toISOString();
      };

      // Build payload matching the backend C# method signature
      const payload = {
        TokenC: this.token,
        EmpId: this.empId,
        Type: requestType, // 'Lev' for Leave, 'Claim' for Claim, 'Pro' for Profile, 'Doc' for Document
        Id: Number(requestId),
        FromDate: formatDate(fromDate),
        ToDate: formatDate(toDate),
        RemarksC: remarks,
      };

      // console.log("Delete Request Payload:", JSON.stringify(payload, null, 2));
      // console.log(
      //   "Delete Request Endpoint:",
      //   API_ENDPOINTS.GET_DELETE_APPLY,
      // );

      const response = await api.post(API_ENDPOINTS.GET_DELETE_APPLY, payload, {
        headers: this.getHeaders(),
      });

      // console.log("Delete Request Response Status:", response.status);
      // console.log(
      //   "Delete Request Response Data:",
      //   JSON.stringify(response.data, null, 2),
      // );

      // Check for success in the response
      const status = response.data.Status || response.data.status;

      if (status === "success" || status === "Success") {
        return {
          success: true,
          data: response.data,
          error: undefined,
        };
      } else {
        // API returned but operation failed
        const errorMessage =
          response.data.Error ||
          response.data.Message ||
          response.data.error ||
          response.data.message ||
          "Failed to cancel request";

        console.error("Delete Request Failed:", errorMessage);
        return {
          success: false,
          error:
            errorMessage !== "ok" ? errorMessage : "Failed to cancel request",
        };
      }
    } catch (error: any) {
      console.error("Delete Request API Error:", error);

      // Log detailed error information
      if (error.response) {
        console.error("Error Response Status:", error.response.status);
        console.error(
          "Error Response Data:",
          JSON.stringify(error.response.data),
        );
        console.error(
          "Error Response Headers:",
          JSON.stringify(error.response.headers),
        );

        // Extract error message from response
        const errorMessage =
          error.response.data?.Error ||
          error.response.data?.Message ||
          error.response.data?.error ||
          error.response.data?.message ||
          `Server error: ${error.response.status}`;

        return {
          success: false,
          error: errorMessage,
        };
      } else if (error.request) {
        console.error("No response received from server");
        return {
          success: false,
          error: "No response from server. Please check your connection.",
        };
      } else {
        console.error("Error Message:", error.message);
        return {
          success: false,
          error: error.message || "Network error",
        };
      }
    }
  }

  // Request Status
  async getEmpRequestStatus(): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
  }> {
    try {
      if (!this.token) {
        await this.loadCredentials();
      }

      const response = await api.post(
        API_ENDPOINTS.GET_EMP_REQUEST_STATUS,
        {
          TokenC: this.token,
          EmpIdN: this.empId,
        },
        { headers: this.getHeaders() },
      );

      if (response.data.Status === "success") {
        return {
          success: true,
          data: response.data.xx ? response.data.xx[0] : null,
        };
      } else {
        return { success: false, error: response.data.Error };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.Error || "Network error",
      };
    }
  }

  // Logout
  async logout() {
    try {
      await AsyncStorage.removeItem("auth_token");
      await AsyncStorage.removeItem("emp_id");
      this.token = null;
      this.empId = null;
    } catch (error) {
      console.error("Error logging out:", error);
    }
  }

  // Get current token and empId
  getCurrentUser() {
    return {
      token: this.token,
      empId: this.empId,
    };
  }

  async refreshCredentials() {
    await this.loadCredentials();
    return this.getCurrentUser();
  }

  setCredentials(token: string | null, empId: number | null) {
    this.token = token;
    this.empId = empId;
  }

  // Time Management
  async submitTimeRequest(
    payload: TimeRequestPayload,
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      if (!this.token) {
        await this.loadCredentials();
      }

      // Ensure TokenC is correct
      payload.TokenC = this.token || "";

      const response = await api.post(API_ENDPOINTS.UPDATE_TIME, payload, {
        headers: this.getHeaders(),
      });

      if (response.data.Status === "success") {
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.data.Error };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.Error || "Network error",
      };
    }
  }

  async getTimeManageList(
    fromDate: string,
    toDate: string,
  ): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      if (!this.token) {
        await this.loadCredentials();
      }

      const payload = {
        TokenC: this.token,
        Id: this.empId,
        FDate: fromDate,
        TDate: toDate,
      };

      const response = await api.post(
        API_ENDPOINTS.GET_TIME_MANAGE_LIST,
        payload,
        { headers: this.getHeaders() },
      );

      if (response.data.Status === "success") {
        return {
          success: true,
          data: response.data.data || response.data.xx || [],
        }; // Adjust based on actual response
      } else {
        return { success: false, error: response.data.Error };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.Error || "Network error",
      };
    }
  }

  async downloadTimeReport(
    fromDate: string,
    toDate: string,
  ): Promise<{
    success: boolean;
    url?: string;
    alternativeUrl?: string;
    error?: string;
    data?: any;
  }> {
    try {
      if (!this.token) {
        await this.loadCredentials();
      }

      if (!this.token || !this.empId) {
        return {
          success: false,
          error: "Authentication details missing. Please login again.",
        };
      }

      // Get additional user data needed for URL construction
      const userDataStr = await AsyncStorage.getItem("user_data");
      const userData = userDataStr ? JSON.parse(userDataStr) : null;

      // console.log("User data for download:", userData);

      // Use fallback values if user data is missing
      const empId = this.empId;
      const companyId = userData?.CompIdN || userData?.CompanyId || "1";
      const customerId = userData?.CustomerIdC || userData?.DomainId || "kevit";
      const companyUrl = await ensureBaseUrl();

      // console.log("Download parameters:", { empId, companyId, customerId });

      // Build payload exactly as requested
      const payload = {
        TokenC: this.token,
        FromDate: fromDate, // Expects "MM/dd/yyyy" format
        ToDate: toDate, // Expects "MM/dd/yyyy" format
        Where: `A.EmpIdN IN(${this.empId})`,
        Group: "Employee",
        OrderBy: 1,
      };

      // console.log("Download Report Payload:", payload);

      const response = await api.post(API_ENDPOINTS.DOWNLOAD_REPORT, payload, {
        headers: this.getHeaders(),
      });

      // console.log("Download Report Response Status:", response.data.Status);
      // console.log(
      //   "Download Report Full Response:",
      //   JSON.stringify(response.data),
      // );

      if (response.data.Status === "success") {
        // Construct URL manually
        // Pattern: https://hr.trickyhr.com/kevit-Customer/{customerId}/{companyId}/EmpPortal/TMSReport/{empId}.pdf

        const downloadUrl = `${companyUrl}/kevit-Customer/${customerId}/${companyId}/EmpPortal/TMSReport/${empId}.pdf`;
        // console.log("Generated download URL:", downloadUrl);

        return {
          success: true,
          url: downloadUrl,
          data: response.data,
        };
      } else {
        const errorMsg = response.data.Error || "Download failed";
        console.error("API returned error:", errorMsg);
        return {
          success: false,
          error: errorMsg,
        };
      }
    } catch (error: any) {
      console.error("Download Report Error:", error);

      let errorMessage = "Network error";
      if (error.response) {
        console.error("Error response data:", error.response.data);
        console.error("Error response status:", error.response.status);
        errorMessage =
          error.response.data?.Error ||
          error.response.data?.message ||
          `Server error: ${error.response.status}`;
      } else if (error.request) {
        console.error("No response received from server");
        errorMessage = "No response from server";
      } else {
        console.error("Error message:", error.message);
        errorMessage = error.message;
      }

      return { success: false, error: errorMessage };
    }
  }

  // --- Document Management ---

  async getDocuments(category: string = "All"): Promise<any[]> {
    try {
      if (!this.token) {
        await this.loadCredentials();
      }

      // Get user data for URL construction
      const userDataStr = await AsyncStorage.getItem("user_data");
      const userData = userDataStr ? JSON.parse(userDataStr) : null;
      const companyId = userData?.CompIdN || userData?.CompanyId || "1";
      const customerId =
        userData?.CustomerIdC || userData?.DomainId || "trickyhr";
      const companyUrl = await ensureBaseUrl();

      const response = await api.post(
        API_ENDPOINTS.GET_OFFICE_DOCUMENTS,
        {
          TokenC: this.token,
          Id: this.empId, // C# backend expects 'Id', not 'EmpID'
          FolderName: category === "All" ? "" : category,
          DocName: "All", // Required parameter
        },
        { headers: this.getHeaders() },
      );

      // console.log("Get Documents Request - Category:", category);
      // console.log("Get Documents Response:", response.data);

      if (response.data.Status === "success") {
        // The C# backend returns documents in the 'data' or 'xx' field
        const docs = response.data.data || response.data.xx || [];
        return docs.map((doc: any, index: number) => {
          const fileName = doc.FileNameC || doc.NameC;
          const folderName = category;

          // URL Pattern: https://hr.trickyhr.com/kevit-Customer/{CustomerId}/{CompanyId}/{EmpId}/EmpDocuments/{FolderName}/{FileName}
          // Example: https://hr.trickyhr.com/kevit-Customer/trickyhr/1/38/EmpDocuments/Experience/Naveen_EmpPortal_.jpg

          // Handle potential double slashes if folderName is empty/mixed
          const cleanFolder =
            folderName && folderName !== "All" ? `${folderName}/` : "";

          // If FolderNameC is just the category name e.g. "Experience", perfect.
          // If it includes full path, we might need adjustment, but assuming simple name per example.

          const url = `${companyUrl}/kevit-Customer/${customerId}/${companyId}/${this.empId}/EmpDocuments/${folderName}/${fileName}`;
          // console.log("Generated document URL:", url);

          return {
            id: `${doc.DocIdN || "doc"}_${index}`,
            name: doc.NameC || "Document",
            fileName: fileName,
            type: doc.FolderNameC || "Unknown",
            icon: doc.IconC || "",
            date:
              doc.LastWriteTimeC && doc.LastWriteTimeC.includes("/Date(")
                ? new Date(
                    parseInt(
                      doc.LastWriteTimeC.replace(/\/Date\((-?\d+)\)\//, "$1"),
                    ),
                  ).toLocaleDateString()
                : doc.LastWriteTimeC || new Date().toLocaleDateString(),
            size: "Unknown",
            url: url,
          };
        });
      }
      return [];
    } catch (error) {
      console.log("Error fetching documents", error);
      return [];
    }
  }

  async getPaySlipList(): Promise<{
    success: boolean;
    data?: PaySlip[];
    error?: string;
  }> {
    try {
      if (!this.token) {
        await this.loadCredentials();
      }

      const response = await api.post(
        API_ENDPOINTS.GET_PAYSLIP_LIST,
        {
          TokenC: this.token,
          EmpIdN: this.empId,
        },
        { headers: this.getHeaders() },
      );

      if (response.data.Status === "success") {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.Error };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.Error || "Network error",
      };
    }
  }

  async downloadPaySlip(
    paySlip: PaySlip,
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      if (!this.token) {
        await this.loadCredentials();
      }

      // Get additional user data needed for URL construction
      const userDataStr = await AsyncStorage.getItem("user_data");
      const userData = userDataStr ? JSON.parse(userDataStr) : null;

      if (!this.token || !this.empId || !userData) {
        return {
          success: false,
          error: "Authentication or user details missing",
        };
      }

      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const payPeriod = `${months[paySlip.MonthN - 1]} ${paySlip.YearN}`;

      // 1. Trigger the API to generate/prepare the PDF (Method 70 in Java)
      // Even if we construct the URL manually, some backends require this trigger.
      try {
        await api.post(
          API_ENDPOINTS.DOWNLOAD_PAYSLIP,
          {
            TokenC: this.token,
            Month: paySlip.MonthN,
            Year: paySlip.YearN,
            PayPeriod: payPeriod,
            PayTypeC: paySlip.PayTypeC,
          },
          { headers: this.getHeaders() },
        );
      } catch (e) {
        console.log("Trigger PDF gen error (ignoring if URL works):", e);
      }

      // 2. Construct the URL
      const companyId = userData.CompIdN || userData.CompanyId;
      const customerId = userData.CustomerIdC || userData.DomainId;
      const companyUrl = await ensureBaseUrl();

      // Pattern from Java: company_url+"/kevit-Customer/"+customer_id+"/"+company_id+ "/EmpPortal/EmpPaySlip/"+emp_id+"/" + pay_period+".pdf"
      const downloadUrl = `${companyUrl}/kevit-Customer/${customerId}/${companyId}/EmpPortal/EmpPaySlip/${this.empId}/${payPeriod}.pdf`;

      return { success: true, url: downloadUrl };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.Error || "Network error",
      };
    }
  }

  async uploadDocument(data: {
    name: string;
    type: string;
    remarks: string;
    file: { uri: string; name: string; type: string };
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      if (!this.token) {
        await this.loadCredentials();
      }

      const formData = new FormData();
      formData.append("TokenC", this.token || "");
      formData.append("EmpID", String(this.empId));
      formData.append("EmpDocName", data.name);
      formData.append("Type", data.type);
      formData.append("Remarks", data.remarks);

      // Handle file
      if (data.file) {
        formData.append("EmpDoc", {
          uri: data.file.uri,
          name: data.file.name,
          type: data.file.type || "application/pdf", // Ensure type is present
        } as any);
      }

      // console.log("Uploading document...");

      const response = await api.post(API_ENDPOINTS.UPLOAD_DOCUMENT, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          // Axios might handle boundary automatically if we let it,
          // but usually we need to be careful with headers in RN.
          // Often it's best to let axios sets content-type for multipart
          Accept: "application/json",
        },
        transformRequest: (data, headers) => {
          // React Native FormData needs to remain as is
          return data;
        },
      });

      // console.log("Upload response:", response.data);

      if (response.data.Status === "success") {
        return { success: true, data: response.data };
      } else {
        return {
          success: false,
          error: response.data.Error || "Upload failed",
        };
      }
    } catch (error: any) {
      console.error("Error uploading document:", error);
      let errorMessage = "Upload failed";
      if (error.response) {
        errorMessage = error.response.data?.Error || error.message;
      }
      return { success: false, error: errorMessage };
    }
  }

  // --- Office Documents ---
  async getOfficeDocuments(
    folderName: string = "OfficeDoc",
  ): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      if (!this.token) {
        await this.loadCredentials();
      }

      const response = await api.post(
        API_ENDPOINTS.GET_OFFICE_DOCUMENTS,
        {
          TokenC: this.token,
          Id: this.empId,
          FolderName: folderName,
        },
        { headers: this.getHeaders() },
      );

      if (response.data.Status === "success") {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.Error };
      }
    } catch (error: any) {
      console.log("Error fetching office documents", error);
      return {
        success: false,
        error: error.response?.data?.Error || error.message || "Network error",
      };
    }
  }

  async getCompanyPolicies(
    folderName: string = "CompanyPolicies",
  ): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      if (!this.token) {
        await this.loadCredentials();
      }

      const response = await api.post(
        API_ENDPOINTS.GET_COMPANY_POLICIES_LIST,
        {
          TokenC: this.token,
          Id: this.empId,
          FolderName: folderName,
        },
        { headers: this.getHeaders() },
      );

      if (response.data.Error === "ok") {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.Error };
      }
    } catch (error: any) {
      console.log("Error fetching office documents", error);
      return {
        success: false,
        error: error.response?.data?.Error || error.message || "Network error",
      };
    }
  }

  async downloadFile(url: string, fileName: string): Promise<string | null> {
    try {
      const fs = FileSystem as any;
      const downloadDir = fs.documentDirectory + "OfficeDoc/";
      const dirInfo = await fs.getInfoAsync(downloadDir);

      if (!dirInfo.exists) {
        await fs.makeDirectoryAsync(downloadDir, { intermediates: true });
      }

      const fileUri = downloadDir + fileName;

      const downloadObject = fs.createDownloadResumable(url, fileUri, {
        headers: { Token: this.token || "" },
      });

      const result = await downloadObject.downloadAsync();

      if (result && result.uri && result.status === 200) {
        return result.uri;
      }
      return null;
    } catch (error) {
      console.error("Download error:", error);
      return null;
    }
  }

  async getCalendarEvents(
    month: number,
    year: number,
  ): Promise<{ success: boolean; data?: CalendarEvent[]; error?: string }> {
    try {
      if (!this.token) {
        await this.loadCredentials();
      }

      const response = await api.post(
        API_ENDPOINTS.GET_CALENDAR_EVENTS,
        {
          TokenC: this.token,
          Year: year,
          Month: month,
        },
        { headers: this.getHeaders() },
      );

      if (response.data.Status === "success") {
        return { success: true, data: response.data.cllist };
      } else {
        return { success: false, error: response.data.Error };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.Error || "Network error",
      };
    }
  }

  async getCalendarDetails(
    dateStr: string,
  ): Promise<{ success: boolean; data?: any[]; error?: string }> {
    // dateStr should be formatted as "MMM dd yyyy"
    try {
      if (!this.token) {
        await this.loadCredentials();
      }

      const response = await api.post(
        API_ENDPOINTS.GET_CALENDAR_DETAILS,
        {
          TokenC: this.token,
          StartDate: dateStr,
        },
        { headers: this.getHeaders() },
      );

      if (response.data.Status === "success") {
        return { success: true, data: response.data.xx };
      } else {
        return { success: false, error: response.data.Error };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.Error || "Network error",
      };
    }
  }

  async getEmployeeList(): Promise<{
    success: boolean;
    data?: Employee[];
    error?: string;
  }> {
    try {
      if (!this.token) {
        await this.loadCredentials();
      }

      const response = await api.post(
        API_ENDPOINTS.GET_EMPLOYEE_LIST,
        {
          TokenC: this.token,
        },
        { headers: this.getHeaders() },
      );

      if (response.data.Status === "success") {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.Error };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.Error || "Network error",
      };
    }
  }

  async getAttendanceReport(
    fromDate: string,
    toDate: string,
    type: number = 0,
  ): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      if (!this.token) {
        await this.loadCredentials();
      }

      const payload = {
        TokenC: this.token,
        FromDate: fromDate,
        ToDate: toDate,
        Type: 1, // 1 for all records
      };

      // console.log("Attendance Report Payload:", payload);

      const response = await api.post(
        API_ENDPOINTS.GET_MOBILE_ATTENDANCE_REPORT,
        payload,
        { headers: this.getHeaders() },
      );

      // console.log("Attendance Report Response Status:", response.data.Status);

      if (response.data.Status === "success") {
        return { success: true, data: response.data.data || [] };
      } else {
        return {
          success: false,
          error: response.data.Error || "Failed to fetch attendance report",
        };
      }
    } catch (error: any) {
      console.error("Attendance Report Error:", error);
      return {
        success: false,
        error: error.response?.data?.Error || error.message || "Network error",
      };
    }
  }

  async getClientList(): Promise<{
    success: boolean;
    data?: { clients: any[]; serviceTypes: any[] };
    error?: string;
  }> {
    try {
      if (!this.token) {
        await this.loadCredentials();
      }

      const response = await api.post(
        API_ENDPOINTS.GET_CLIENT_LIST,
        {
          TokenC: this.token,
        },
        { headers: this.getHeaders() },
      );

      // console.log("Client List Response Status:", response.data.Status);

      if (response.data.Status === "success") {
        return {
          success: true,
          data: {
            clients: response.data.data || [],
            serviceTypes: response.data.ServiceType || [],
          },
        };
      } else {
        return {
          success: false,
          error: response.data.Error || "Failed to fetch client list",
        };
      }
    } catch (error: any) {
      console.error("Client List Error:", error);
      return {
        success: false,
        error: error.response?.data?.Error || error.message || "Network error",
      };
    }
  }

  async submitServiceReport(data: {
    ClientIdN: number;
    TicketNoC: string;
    Remark1C: string;
    Remark2C: string;
    Remark3C: string;
    ServiceTypeC: string;
    FollowUpDateD: string;
    ServiceDtl: string;
    StartTimeD: string;
    CallTimeD: string;
    AppointmentTimeD: string;
    ClientSign: string;
    EmpSign: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.token || !this.empId) {
        await this.loadCredentials();
      }

      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append("TokenC", this.token || "");
      formData.append("EmpIdN", String(this.empId));
      formData.append("ClientIdN", String(data.ClientIdN));
      formData.append("TicketNoC", data.TicketNoC);
      formData.append("Remark1C", data.Remark1C);
      formData.append("Remark2C", data.Remark2C);
      formData.append("Remark3C", data.Remark3C);
      formData.append("ServiceTypeC", data.ServiceTypeC);
      formData.append("FollowUpDateD", data.FollowUpDateD);
      formData.append("ServiceDtl", data.ServiceDtl);
      formData.append("StartTimeD", data.StartTimeD);
      formData.append("CallTimeD", data.CallTimeD);
      formData.append("AppointmentTimeD", data.AppointmentTimeD);

      // Add signatures if available
      if (data.ClientSign) {
        formData.append("ClientSign", {
          uri: data.ClientSign,
          name: "client_signature.png",
          type: "image/png",
        } as any);
      }

      if (data.EmpSign) {
        formData.append("EmpSign", {
          uri: data.EmpSign,
          name: "emp_signature.png",
          type: "image/png",
        } as any);
      }

      // console.log("Submitting Service Report...");

      const response = await api.post(
        API_ENDPOINTS.SUBMIT_SERVICE_REPORT,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Token: this.token || "",
          },
        },
      );

      // console.log("Service Report Response Status:", response.data.Status);

      if (response.data.Status === "success") {
        return { success: true };
      } else {
        return {
          success: false,
          error: response.data.Error || "Failed to submit service report",
        };
      }
    } catch (error: any) {
      console.error("Submit Service Report Error:", error);
      return {
        success: false,
        error: error.response?.data?.Error || error.message || "Network error",
      };
    }
  }

  async getYourPendingApprovals(): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
  }> {
    try {
      if (!this.token || !this.empId) {
        await this.loadCredentials();
      }

      const response = await api.post(
        API_ENDPOINTS.GET_YOUR_PENDING_APPROVALS,
        {
          TokenC: this.token,
          EmpIdN: this.empId,
          Type: 0,
        },
        { headers: this.getHeaders() },
      );

      // console.log(
      //   "Your Pending Approvals Response Status:",
      //   response.data.Status,
      // );

      if (response.data.Status === "success") {
        return {
          success: true,
          data: response.data.data || response.data.xx || [],
        };
      } else {
        return {
          success: false,
          error:
            response.data.Error || "Failed to fetch your pending approvals",
        };
      }
    } catch (error: any) {
      console.error("Your Pending Approvals Error:", error);
      return {
        success: false,
        error: error.response?.data?.Error || error.message || "Network error",
      };
    }
  }

  async getOtherPendingApprovals(): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
  }> {
    try {
      if (!this.token || !this.empId) {
        await this.loadCredentials();
      }

      const response = await api.post(
        API_ENDPOINTS.GET_OTHER_PENDING_APPROVALS,
        {
          TokenC: this.token,
          EmpIdN: this.empId,
        },
        { headers: this.getHeaders() },
      );

      // console.log(
      //   "Other Pending Approvals Response Status:",
      //   response.data.Status,
      // );

      if (response.data.Status === "success") {
        return {
          success: true,
          data: response.data.data || response.data.xx || [],
        };
      } else {
        return {
          success: false,
          error:
            response.data.Error || "Failed to fetch other pending approvals",
        };
      }
    } catch (error: any) {
      console.error("Other Pending Approvals Error:", error);
      return {
        success: false,
        error: error.response?.data?.Error || error.message || "Network error",
      };
    }
  }

  async getExitRequests(): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      if (!this.token || !this.empId) await this.loadCredentials();

      const whereClause = this.empId ? `and a.EmpIdN=${this.empId}` : "";

      const response = await api.post(
        API_ENDPOINTS.GET_EXIT_REQUEST,
        {
          TokenC: this.token,
          where: whereClause,
        },
        { headers: this.getHeaders() },
      );

      // C# returns { Error, data, FileList }
      if (response.data.Status === "success" || response.data.Error === "ok") {
        return { success: true, data: response.data };
      }
      return { success: false, error: response.data.Error };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getExitReasons(): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      if (!this.token) await this.loadCredentials();
      const response = await api.post(
        API_ENDPOINTS.GET_EXIT_REASON,
        {
          TokenC: this.token,
        },
        { headers: this.getHeaders() },
      );

      // C# returns { Error, reason }
      if (response.data.Status === "success" || response.data.Error === "ok") {
        return { success: true, data: response.data.reason || [] };
      }
      return { success: false, error: response.data.Error };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async updateExitRequest(
    data: any,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.token) await this.loadCredentials();

      const payload = {
        TokenC: this.token,
        EmpIdN: this.empId,
        ...data,
      };

      // console.log("Update Exit Request Payload:", JSON.stringify(payload));

      const response = await api.post(
        API_ENDPOINTS.UPDATE_EXIT_REQUEST,
        payload,
        { headers: this.getHeaders() },
      );

      // C# returns { Error }
      if (response.data.Status === "success" || response.data.Error === "ok") {
        return { success: true };
      }
      return {
        success: false,
        error: response.data.Error || "Failed to update exit request",
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async revokeExitRequest(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.token) await this.loadCredentials();

      const payload = {
        TokenC: this.token,
        EmpIdN: this.empId,
      };

      const response = await api.post(
        API_ENDPOINTS.REVOKE_EXIT_REQUEST,
        payload,
        { headers: this.getHeaders() },
      );

      // C# returns { Status, Error }
      if (response.data.Status === "success" || response.data.Error === "ok") {
        return { success: true };
      }
      return {
        success: false,
        error: response.data.Error || "Failed to revoke exit request",
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Existing updatePendingApproval...
  async updatePendingApproval(data: {
    IdN: number;
    StatusC: string;
    ApproveRemarkC: string;
    EmpIdN: number;
    Flag: string;
    ApproveAmtN?: number;
    title?: string;
    DocName?: string;
    ReceiveYearN?: number;
    ReceiveMonthN?: number;
    PayTypeN?: number;
    ClaimExpenseDtl1?: any[];
  }): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.token || !this.empId) {
        await this.loadCredentials();
      }

      // Convert status to Approval number: 1 = Approved, 2 = Rejected
      const approvalStatus =
        data.StatusC.toLowerCase() === "approved" ||
        data.StatusC.toLowerCase() === "approve"
          ? 1
          : 2;

      // Construct payload matching C# SaveApproval_Supervisor signature
      const payload = {
        Tokenc: this.token, // Note: Java uses 'Tokenc', C# might expect 'TokenC' or 'Tokenc' depending on binding. Keeping 'Tokenc' as per User Java snippet.
        Flag: data.Flag,
        EmpId: data.EmpIdN,
        Id: data.IdN,
        Approval: approvalStatus,
        YearN: 0, // Java snippet sets this to 0
        Remarks: data.ApproveRemarkC || "",
        title: data.title || "",
        DocName: data.DocName || "",
        ReceiveYearN: data.ReceiveYearN || 0,
        ReceiveMonthN: data.ReceiveMonthN || 0,
        PayTypeN: data.PayTypeN || 0,
        ApproveAmtN: data.ApproveAmtN || 0,
        ClaimExpenseDtl1: data.ClaimExpenseDtl1 || [],
      };

      // console.log(
      //   "Update Pending Approval Payload:",
      //   JSON.stringify(payload, null, 2),
      // );

      const response = await api.post(API_ENDPOINTS.SAVE_APPROVAL, payload, {
        headers: this.getHeaders(),
      });

      // console.log(
      //   "Update Pending Approval Response:",
      //   JSON.stringify(response.data, null, 2),
      // );

      if (response.data.Status === "success") {
        return { success: true };
      } else {
        return {
          success: false,
          error: response.data.Error || "Failed to update approval",
        };
      }
    } catch (error: any) {
      console.error("Update Pending Approval Error:", error);
      if (error.response) {
        console.error(
          "Error Response:",
          JSON.stringify(error.response.data, null, 2),
        );
      }
      return {
        success: false,
        error: error.response?.data?.Error || error.message || "Network error",
      };
    }
  }

  async getAttendanceProjectList(data: { token: string }) {
    try {
      console.log("STEP 1 - Inside getAttendanceProjectList");
      await this.ensureApiReady();

      // console.log("STEP 4 - Token:", data.token);
      // console.log("STEP 5 - Calling API:", API_ENDPOINTS.GET_PROJECT_LIST);

      const res = await api.post(
        API_ENDPOINTS.GET_PROJECT_LIST,
        {
          TokenC: data.token,
          blnEmpMaster: false,
          ViewReject: false,
        },
        { timeout: 30000 },
      );

      // console.log("STEP 6 - Response:", res.data);

      if (res.data?.Status === "success") {
        return res.data.data || [];
      }

      console.log("STEP 7 - Status not success");
      return [];
    } catch (error: any) {
      console.log("STEP ERROR:", error?.message);
      console.log("STEP ERROR RESPONSE:", error?.response?.data);
      return [];
    }
  }

  async getMobileAttendanceReport(
    token: string,
    fromDate: string,
    toDate: string,
    type = 0,
  ): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      if (!token) {
        return { success: false, error: "Token not available" };
      }
      await this.ensureApiReady();

      const payload = {
        TokenC: token,
        FromDate: fromDate,
        ToDate: toDate,
        Type: type,
      };

      const response = await api.post(API_ENDPOINTS.ATTENDANCE_REPORT, payload);

      if (response.data?.Status === "success") {
        return { success: true, data: response.data.data || [] };
      }

      return {
        success: false,
        error: response.data?.Error || "No attendance records found.",
      };
    } catch (error: any) {
      console.error("getMobileAttendanceReport error:", error);
      return {
        success: false,
        error: error.response?.data?.Error || error.message || "Network error",
      };
    }
  }

  async getServerTime(
    token: string,
    overrideDate?: string | Date,
  ): Promise<string> {
    if (overrideDate) {
      return toDotNetDate(overrideDate);
    }
    await this.ensureApiReady();

    const response = await api.post(API_ENDPOINTS.SERVERTIME_URL, {
      TokenC: token,
    });

    return toDotNetDate(response.data);
  }

  async getRawServerTime(token: string): Promise<string> {
    await this.ensureApiReady();

    const response = await api.post(API_ENDPOINTS.SERVERTIME_URL, {
      TokenC: token,
    });

    if (typeof response.data === "string") {
      return response.data;
    }

    return String(response.data ?? "");
  }

  async getUserProfile(token: string): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
    EditDenied?: boolean;
  }> {
    try {
      if (!token) {
        return { success: false, error: "Token not available" };
      }
      await this.ensureApiReady();

      const response = await api.post(
        API_ENDPOINTS.PROFILE_URL,
        {
          TokenC: token,
          BlnEmpMaster: true,
          ViewReject: false,
        },
        { headers: { "Content-Type": "application/json" } },
      );

      return {
        success: true,
        data: response.data?.data ?? [],
        EditDenied: Boolean(response.data?.EditDenied),
      };
    } catch (error: any) {
      console.error("getUserProfile error:", error);
      return {
        success: false,
        error: error.response?.data?.Error || error.message || "Network error",
      };
    }
  }

  async updateUserProfile(payload: any): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      await this.ensureApiReady();

      const response = await api.post(API_ENDPOINTS.UPLOADPRO_URL, payload, {
        headers: { "Content-Type": "application/json" },
      });

      if (response.data?.Status === "success") {
        return { success: true };
      }

      return {
        success: false,
        error: response.data?.Error || "Update failed.",
      };
    } catch (error: any) {
      console.error("updateUserProfile error:", error);
      return {
        success: false,
        error: error.response?.data?.Error || error.message || "Network error",
      };
    }
  }

  async getClaimList(token: string): Promise<APIResponse> {
    try {
      await this.ensureApiReady();

      const response = await api.post<APIResponse>(
        API_ENDPOINTS.GETCLAIM_LIST,
        { TokenC: token },
      );

      return response.data;
    } catch (error) {
      console.error("Error fetching claim list:", error);
      throw error;
    }
  }

  async updateClaim(token: string, claimData: ClaimData): Promise<APIResponse> {
    try {
      await this.ensureApiReady();

      const payload = {
        TokenC: token,
        ...claimData,
      };

      // console.log("Submitting claim data:", payload);

      const response = await api.post<APIResponse>(
        API_ENDPOINTS.UPDATE_CLAIM,
        payload,
      );

      return response.data;
    } catch (error) {
      console.error("Error submitting claim:", error);
      throw error;
    }
  }

  async updateClaimDoc(
    token: string,
    claimId: number,
    files: DocumentFile[],
  ): Promise<APIResponse> {
    try {
      await this.ensureApiReady();

      const formData = new FormData();
      formData.append("TokenC", token);
      formData.append("IdN", claimId.toString());

      files.forEach((file, index) => {
        formData.append(`File[${index}]`, {
          uri: file.uri,
          type: file.type,
          name: file.name,
        } as any);
      });

      const response = await api.post<APIResponse>(
        API_ENDPOINTS.UPDATECLAIM_DOC,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      return response.data;
    } catch (error) {
      console.error("Error uploading documents:", error);
      throw error;
    }
  }

  async getCelebrationData(token: string, type = 1): Promise<any> {
    try {
      await this.ensureApiReady();

      const payload = {
        TokenC: token,
        Type: type,
      };

      const response = await api.post(API_ENDPOINTS.CELEBRATION, payload);

      if (response.data?.Status === "success") {
        return response.data?.DashData?.[0] ?? {};
      }

      return {};
    } catch (error) {
      console.error("getCelebrationData error:", error);
      return {};
    }
  }

  async sendEmailWishes(payload: {
    EmpName: string;
    mailFrom: string;
    mailTo: string;
    mailToCC?: string;
    subject: string;
    body: string;
    TokenC: string;
  }): Promise<APIResponse> {
    try {
      await this.ensureApiReady();

      const response = await api.post(API_ENDPOINTS.SEND_EMAIL_WISHES, payload);

      return response?.data ?? { Status: "error", Error: "Invalid response" };
    } catch (error: any) {
      console.error("sendEmailWishes error:", error);
      return {
        Status: "error",
        Error:
          error?.response?.data?.Error ||
          error?.response?.data?.error ||
          error?.message ||
          "Network error",
      };
    }
  }

  async getHolidayList(token: string, year: string): Promise<any[]> {
    try {
      if (!token) return [];
      await this.ensureApiReady();

      const payload = {
        TokenC: token,
        Year: year,
      };

      const response = await api.post(API_ENDPOINTS.HOLIDAY, payload);

      return response.data?.Holiday ?? [];
    } catch (error) {
      console.error("getHolidayList error:", error);
      return [];
    }
  }

  async getEmpDashBoardList(): Promise<any> {
    try {
      if (!this.token) {
        await this.loadCredentials();
      }

      if (!this.token) return [];
      await this.ensureApiReady();

      const payload = {
        TokenC: this.token,
      };

      const response = await api.post(
        API_ENDPOINTS.GET_EMPDASHBOARD_LIST,
        payload,
      );
      return response.data;
    } catch (error) {
      console.log("Get Emp Document List error: ", error);
      return [];
    }
  }

  async changePassword(
    oldPassword: string,
    newPassword: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.token) {
        await this.loadCredentials();
      }

      if (!this.token) {
        return { success: false, error: "Not authenticated" };
      }
      await this.ensureApiReady();

      const payload = {
        TokenC: this.token,
        OldPassword: oldPassword.trim(),
        NewPassword: newPassword.trim(),
      };

      const response = await api.post(API_ENDPOINTS.CHANGE_PASSWORD, payload, {
        headers: this.getHeaders(),
      });

      if (response.data?.Status === "success") {
        return { success: true };
      } else {
        return {
          success: false,
          error: response.data?.Error || "Failed to change password",
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.Error || error.message || "Network error",
      };
    }
  }

  // Request Details APIs
  async getEmployeeDocument(
    id: number,
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      if (!this.token) {
        await this.loadCredentials();
      }

      const response = await api.post(
        API_ENDPOINTS.EMP_DOC_URL,
        {
          TokenC: this.token,
          Id: id,
        },
        { headers: this.getHeaders() },
      );

      if (response.data.Status === "success") {
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.data.Error };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.Error || "Network error",
      };
    }
  }

  async getTimeUpdate(
    id: number,
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      if (!this.token) {
        await this.loadCredentials();
      }

      const response = await api.post(
        API_ENDPOINTS.TIME_URL,
        {
          TokenC: this.token,
          Id: id,
        },
        { headers: this.getHeaders() },
      );

      if (response.data.Status === "success") {
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.data.Error };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.Error || "Network error",
      };
    }
  }

  async getLeaveDetails(
    id: number,
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      if (!this.token) {
        await this.loadCredentials();
      }

      const response = await api.post(
        API_ENDPOINTS.LEAVE_URL,
        {
          TokenC: this.token,
          Id: id,
        },
        { headers: this.getHeaders() },
      );

      if (response.data.Status === "success") {
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.data.Error };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.Error || "Network error",
      };
    }
  }

  async getLeaveSurrender(
    id: number,
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      if (!this.token) {
        await this.loadCredentials();
      }

      const response = await api.post(
        API_ENDPOINTS.GET_SURRENDER_DETAILS,
        {
          TokenC: this.token,
          Id: id,
        },
        { headers: this.getHeaders() },
      );

      if (response.data.Status === "success") {
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.data.Error };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.Error || "Network error",
      };
    }
  }

  async getProfileUpdate(): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      if (!this.token) {
        await this.loadCredentials();
      }

      const response = await api.post(
        API_ENDPOINTS.PROFILE_URL,
        {
          TokenC: this.token,
          blnEmpMaster: false,
          ViewReject: false,
        },
        { headers: this.getHeaders() },
      );

      if (response.data.Status === "success") {
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.data.Error };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.Error || "Network error",
      };
    }
  }

  async getClaimDetails(
    id: number,
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      if (!this.token) {
        await this.loadCredentials();
      }

      const response = await api.post(
        API_ENDPOINTS.GETCLAIM_URL,
        {
          TokenC: this.token,
          id: id,
        },
        { headers: this.getHeaders() },
      );

      if (response.data.Status === "success") {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.Error };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.Error || "Network error",
      };
    }
  }

  async getClaimDocuments(
    id: number,
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      if (!this.token) {
        await this.loadCredentials();
      }

      const response = await api.post(
        API_ENDPOINTS.GETCLAIMDOC_URL,
        {
          TokenC: this.token,
          Id: id,
          FolderName: "/EmpPortal/ClaimDoc",
          DocName: "ClaimDoc",
        },
        { headers: this.getHeaders() },
      );

      if (response.data.Status === "success") {
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.data.Error };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.Error || "Network error",
      };
    }
  }

  async getEmployeeDocuments(
    empId: number,
    folderName: string,
    docName: string,
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      if (!this.token) {
        await this.loadCredentials();
      }

      const response = await api.post(
        API_ENDPOINTS.GETCLAIMDOC_URL,
        {
          TokenC: this.token,
          Id: empId,
          FolderName: folderName,
          DocName: docName,
        },
        { headers: this.getHeaders() },
      );

      if (response.data.Status === "success") {
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.data.Error };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.Error || "Network error",
      };
    }
  }
}

export default ApiService.getInstance();
