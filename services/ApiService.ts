
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const BASE_URL = 'https://hr.trickyhr.com/WebApi';

// Create an axios instance
const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const loginUser = async (empCode: string, password: string, domainId: string) => {
    try {
        const response = await api.post('/Login', {
            EmpCode: empCode,
            Password: password,
            DomainId: domainId,
        });
        return response?.data ?? null;
    } catch (error) {
        throw error;
    }
};

export const getProjectList = async (token: string) => {
    try {
        const response = await api.get('/GetProjectList/', {
            params: {
                TokenC: token
            }
        });
        return response?.data ?? null;
    } catch (error) {
        throw error;
    }
}

// Adapted for React Native FormData
export const faceRegApi = async ({ image, imageFile, userToken, empId }: any) => {
    const formData = new FormData();
    formData.append('TokenC', String(userToken));
    formData.append('EmpIdN', String(empId));
    formData.append('EmpFaceIdC', image);

    // React Native expects object with uri, name, type for files
    if (imageFile) {
        formData.append('EmpImages', {
            uri: imageFile.uri,
            name: imageFile.name || 'photo.jpg',
            type: imageFile.type || 'image/jpeg',
        } as any);
    }

    try {
        // Using explicit full URL to be safe, matching the standard WebApi pattern
        const response = await axios.post(`${BASE_URL}/UpdateFaceRegister`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response?.data ?? null;
    } catch (error) {
        throw error;
    }
};

export const attendanceEnrolApi = async ({ projectId, latLon, imageFile, userToken, empId }: any) => {
    const formData = new FormData();
    formData.append('TokenC', String(userToken));
    formData.append('DateD', new Date().toISOString());
    formData.append('EmpIdN', String(empId));
    formData.append('ProjectIdN', String(projectId));
    formData.append('GPRSC', latLon || '17.23232,37.45435454');

    if (imageFile) {
        formData.append('MobilePht', {
            uri: imageFile.uri,
            name: imageFile.name || 'attendance.jpg',
            type: imageFile.type || 'image/jpeg',
        } as any);
    }

    try {
        // Assuming /EmployeeAttendance is correct endpoint relative to WebApi
        const response = await api.post('/EmployeeAttendance', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response?.data ?? null;
    } catch (error) {
        throw error;
    }
};

export { api };
export const API_ENDPOINTS = {
    // Authentication
    LOGIN: '/Login',
    REFRESH_LOGIN: '/RefreshLogin',

    // Leave Management
    GET_LEAVE_DETAILS: '/GetEmpLeaveApplyDtlById',
    GET_LEAVE_MANAGE: '/GetEmpLeaveManageById',
    GET_LEAVE_BALANCE: '/GetEmpLeaveBalanceByEmpId',
    GET_SURRENDER_BALANCE: '/GetEmpLVSurrenderBalance',
    GET_SURRENDER_DETAILS: '/GetEmpLvSurrenderById',

    // Leave Operations
    APPLY_LEAVE: '/UpdateEmpLeaveApply',
    SUBMIT_SURRENDER: '/UpdateEmpSurrender',
    CHECK_LEAVE_BALANCE: '/GetEmpLeaveBalanceByEmpId',

    // Medical Documents
    UPLOAD_MEDICAL_DOC: '/UploadMedicalDoc',

    // Manager Approvals
    GET_PENDING_LEAVES: '/GetSup_LeaveManageById',
    GET_PENDING_SURRENDERS: '/GetSup_LVSurrenderById',
    SAVE_APPROVAL: '/SaveApproval_Supervisor',

    // Employee Info
    GET_PROFILE: '/GetEmpProfile',
    GET_PENDING_LIST: '/GetPendingApprove_YourList',
};

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
            this.token = await AsyncStorage.getItem('auth_token');
            const empIdStr = await AsyncStorage.getItem('emp_id');
            this.empId = empIdStr ? parseInt(empIdStr) : null;
        } catch (error) {
            console.error('Error loading credentials:', error);
        }
    }

    private async saveCredentials(token: string, empId: number) {
        try {
            await AsyncStorage.setItem('auth_token', token);
            await AsyncStorage.setItem('emp_id', empId.toString());
            this.token = token;
            this.empId = empId;
        } catch (error) {
            console.error('Error saving credentials:', error);
        }
    }

    private getHeaders() {
        return {
            'Content-Type': 'application/json',
            'Token': this.token || '',
        };
    }

    // Authentication
    async login(username: string, password: string, companyCode: string) {
        try {
            const response = await axios.post(BASE_URL + API_ENDPOINTS.LOGIN, {
                username,
                password,
                companyCode,
            });

            if (response.data.Status === 'success') {
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
                error: error.response?.data?.Error || 'Network error'
            };
        }
    }

    // Leave Management APIs
    async getLeaveDetails(): Promise<{ success: boolean, data?: LeaveBalanceResponse, error?: string }> {
        try {
            if (!this.token) {
                await this.loadCredentials();
            }

            const response = await axios.post(
                BASE_URL + API_ENDPOINTS.GET_LEAVE_DETAILS,
                { TokenC: this.token },
                { headers: this.getHeaders() }
            );

            if (response.data.Status === 'success') {
                return { success: true, data: response.data };
            } else {
                return { success: false, error: response.data.Error };
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.Error || 'Network error'
            };
        }
    }

    async checkLeaveAvailability(
        fromDate: string,
        toDate: string,
        reaGrpIdN: number,
        thrsN: number = 0,
        unit: number = 1
    ): Promise<{ success: boolean, leaveDays?: number, error?: string }> {
        try {
            if (!this.token) {
                await this.loadCredentials();
            }

            const response = await axios.post(
                BASE_URL + API_ENDPOINTS.CHECK_LEAVE_BALANCE,
                {
                    TokenC: this.token,
                    EmpIdN: this.empId,
                    LDateD: fromDate,
                    LToDateD: toDate,
                    ReaGrpIdN: reaGrpIdN,
                    THrsN: thrsN,
                    unit: unit,
                },
                { headers: this.getHeaders() }
            );

            if (response.data.Status === 'success') {
                return { success: true, leaveDays: response.data.LeaveDays };
            } else {
                return { success: false, error: response.data.Error };
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.Error || 'Network error'
            };
        }
    }

    async applyLeave(leaveData: LeaveApplicationData): Promise<{ success: boolean, data?: LeaveApplicationResponse, error?: string }> {
        try {
            const response = await axios.post(
                BASE_URL + API_ENDPOINTS.APPLY_LEAVE,
                {
                    TokenC: this.token,
                    lap: leaveData,
                },
                { headers: this.getHeaders() }
            );

            return {
                success: response.data.Status === 'success',
                data: response.data,
                error: response.data.Status === 'error' ? response.data.Error : undefined
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.Error || 'Network error'
            };
        }
    }

    async getSurrenderBalance(): Promise<{ success: boolean, eligLeave?: number, error?: string }> {
        try {
            const response = await axios.post(
                BASE_URL + API_ENDPOINTS.GET_SURRENDER_BALANCE,
                { TokenC: this.token },
                { headers: this.getHeaders() }
            );

            if (response.data.Status === 'success') {
                return { success: true, eligLeave: response.data.EligLeave };
            } else {
                return { success: false, error: response.data.Error };
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.Error || 'Network error'
            };
        }
    }

    async submitSurrender(surrenderData: SurrenderData): Promise<{ success: boolean, data?: LeaveApplicationResponse, error?: string }> {
        try {
            const response = await axios.post(
                BASE_URL + API_ENDPOINTS.SUBMIT_SURRENDER,
                {
                    TokenC: this.token,
                    data: surrenderData,
                },
                { headers: this.getHeaders() }
            );

            return {
                success: response.data.Status === 'success',
                data: response.data,
                error: response.data.Status === 'error' ? response.data.Error : undefined
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.Error || 'Network error'
            };
        }
    }

    async getSurrenderDetails(surrenderId: number) {
        try {
            const response = await axios.post(
                BASE_URL + API_ENDPOINTS.GET_SURRENDER_DETAILS,
                {
                    TokenC: this.token,
                    Id: surrenderId,
                },
                { headers: this.getHeaders() }
            );

            if (response.data.Status === 'success') {
                return { success: true, data: response.data };
            } else {
                return { success: false, error: response.data.Error };
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.Error || 'Network error'
            };
        }
    }

    // Logout
    async logout() {
        try {
            await AsyncStorage.removeItem('auth_token');
            await AsyncStorage.removeItem('emp_id');
            this.token = null;
            this.empId = null;
        } catch (error) {
            console.error('Error logging out:', error);
        }
    }

    // Get current token and empId
    getCurrentUser() {
        return {
            token: this.token,
            empId: this.empId,
        };
    }
}

export default ApiService.getInstance();