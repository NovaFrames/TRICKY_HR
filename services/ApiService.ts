
import { API_ENDPOINTS } from '@/constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as FileSystem from 'expo-file-system/legacy';
const BASE_URL = API_ENDPOINTS.CompanyUrl;

// Create an axios instance
const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const loginUser = async (empCode: string, password: string, domainId: string) => {
    try {
        const response = await api.post(API_ENDPOINTS.LOGIN, {
            EmpCode: empCode,
            Password: password,
            DomainId: domainId,
        });
        return response?.data ?? null;
    } catch (error) {
        throw error;
    }
};

// function moved to class

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
    }
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
    async getProjectList(token: string) {
        try {
            const response = await api.get('/GetProjectList/', {
                params: {
                    TokenC: token
                }
            });
            // Handle both direct array or wrapped data { Status: 'success', data: [...] }
            return response?.data?.data || response?.data || [];
        } catch (error) {
            // Fallback or rethrow
            throw error;
        }
    }

    async getLeaveDetails(): Promise<{ success: boolean, data?: LeaveBalanceResponse, error?: string }> {
        try {
            if (!this.token) {
                await this.loadCredentials();
            }

            console.log('getLeaveDetails Request Payload:', {
                TokenC: this.token,
                EmpIdN: this.empId
            });

            const response = await axios.post(
                BASE_URL + API_ENDPOINTS.GET_LEAVE_DETAILS,
                {
                    TokenC: this.token,
                    EmpIdN: this.empId
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

    async getLeaveApprovalDetails({ IdN }: { IdN: number }): Promise<{ success: boolean, data?: LeaveBalanceResponse, error?: string }> {
        try {
            if (!this.token) {
                await this.loadCredentials();
            }

            console.log('getLeaveDetails Request Payload:', {
                TokenC: this.token,
                EmpIdN: IdN
            });

            const response = await axios.post(
                BASE_URL + API_ENDPOINTS.GET_LEAVE_BALANCE_DETAILS,
                {
                    TokenC: this.token,
                    EmpIdN: IdN
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
                BASE_URL + API_ENDPOINTS.GET_LEAVE_BALANCE,
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
            if (!this.token) {
                await this.loadCredentials();
            }

            // Ensure AppEmpIdN is set if missing
            if (!leaveData.AppEmpIdN && this.empId) {
                leaveData.AppEmpIdN = this.empId;
            }

            const response = await axios.post(
                BASE_URL + API_ENDPOINTS.APPLY_LEAVE,
                {
                    TokenC: this.token,
                    lap: leaveData,
                },
                { headers: this.getHeaders() }
            );
            console.log(this.token);
            console.log(this.empId);
            console.log(leaveData);
            const status = response.data.Status ? response.data.Status.toLowerCase() : '';
            const success = status === 'success';

            return {
                success: success,
                data: response.data,
                error: !success ? (response.data.Error || 'Unknown Error') : undefined
            };
        } catch (error: any) {
            console.log('Apply Leave API Error:', error);
            if (error.response) {
                console.log('Error Data:', JSON.stringify(error.response.data));
                console.log('Error Status:', error.response.status);
            }
            return {
                success: false,
                error: error.response?.data?.Error || error.message || 'Network error'
            };
        }
    }

    async getSurrenderBalance(): Promise<{ success: boolean, eligLeave?: number, error?: string }> {
        try {
            if (!this.token) {
                await this.loadCredentials();
            }

            const response = await axios.post(
                BASE_URL + API_ENDPOINTS.GET_SURRENDER_BALANCE,
                {
                    TokenC: this.token,
                    EmpIdN: this.empId
                },
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
            if (!this.token) {
                await this.loadCredentials();
            }

            // Ensure EmpIdN is set if missing
            if (!surrenderData.EmpIdN && this.empId) {
                surrenderData.EmpIdN = this.empId;
            }

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
            if (!this.token) {
                await this.loadCredentials();
            }

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

    async cancelLeave(payload: any): Promise<{ success: boolean, data?: any, error?: string }> {
        try {
            if (!this.token) {
                await this.loadCredentials();
            }

            const requestPayload = {
                ...payload,
                TokenC: this.token,
                Tokenc: this.token, // Add lowercase Key as requested
            };

            console.log('Cancel Leave Request Payload:', JSON.stringify(requestPayload));

            const response = await axios.post(
                BASE_URL + API_ENDPOINTS.SAVE_APPROVAL,
                requestPayload,
                { headers: this.getHeaders() }
            );

            console.log('Cancel Leave Response:', JSON.stringify(response.data));

            if (response.data.Status === 'success') {
                return { success: true, data: response.data };
            } else {
                return { success: false, error: response.data.Error };
            }
        } catch (error: any) {
            console.log('Cancel Leave API Error:', error);
            return {
                success: false,
                error: error.response?.data?.Error || 'Network error'
            };
        }
    }

    async deleteRequest(
        requestId: number | string,
        requestType: string = 'Lev',
        fromDate?: Date,
        toDate?: Date,
        remarks: string = 'Cancelled by user'
    ): Promise<{ success: boolean, data?: any, error?: string }> {
        try {
            if (!this.token || !this.empId) {
                await this.loadCredentials();
            }

            if (!this.token || !this.empId) {
                return {
                    success: false,
                    error: 'Authentication token not found. Please login again.'
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
                RemarksC: remarks
            };

            console.log('Delete Request Payload:', JSON.stringify(payload, null, 2));
            console.log('Delete Request Endpoint:', BASE_URL + API_ENDPOINTS.GET_DELETE_APPLY);

            const response = await axios.post(
                BASE_URL + API_ENDPOINTS.GET_DELETE_APPLY,
                payload,
                { headers: this.getHeaders() }
            );

            console.log('Delete Request Response Status:', response.status);
            console.log('Delete Request Response Data:', JSON.stringify(response.data, null, 2));

            // Check for success in the response
            const status = response.data.Status || response.data.status;

            if (status === 'success' || status === 'Success') {
                return {
                    success: true,
                    data: response.data,
                    error: undefined
                };
            } else {
                // API returned but operation failed
                const errorMessage = response.data.Error ||
                    response.data.Message ||
                    response.data.error ||
                    response.data.message ||
                    'Failed to cancel request';

                console.error('Delete Request Failed:', errorMessage);
                return {
                    success: false,
                    error: errorMessage !== 'ok' ? errorMessage : 'Failed to cancel request'
                };
            }
        } catch (error: any) {
            console.error('Delete Request API Error:', error);

            // Log detailed error information
            if (error.response) {
                console.error('Error Response Status:', error.response.status);
                console.error('Error Response Data:', JSON.stringify(error.response.data));
                console.error('Error Response Headers:', JSON.stringify(error.response.headers));

                // Extract error message from response
                const errorMessage = error.response.data?.Error ||
                    error.response.data?.Message ||
                    error.response.data?.error ||
                    error.response.data?.message ||
                    `Server error: ${error.response.status}`;

                return {
                    success: false,
                    error: errorMessage
                };
            } else if (error.request) {
                console.error('No response received from server');
                return {
                    success: false,
                    error: 'No response from server. Please check your connection.'
                };
            } else {
                console.error('Error Message:', error.message);
                return {
                    success: false,
                    error: error.message || 'Network error'
                };
            }
        }
    }

    // Request Status
    async getEmpRequestStatus(): Promise<{ success: boolean, data?: any[], error?: string }> {
        try {
            if (!this.token) {
                await this.loadCredentials();
            }

            const response = await axios.post(
                BASE_URL + API_ENDPOINTS.GET_EMP_REQUEST_STATUS,
                {
                    TokenC: this.token,
                    EmpIdN: this.empId
                },
                { headers: this.getHeaders() }
            );

            if (response.data.Status === 'success') {
                return { success: true, data: response.data.xx ? response.data.xx[0] : null };
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
    // Time Management
    async submitTimeRequest(payload: TimeRequestPayload): Promise<{ success: boolean, data?: any, error?: string }> {
        try {
            if (!this.token) {
                await this.loadCredentials();
            }

            // Ensure TokenC is correct
            payload.TokenC = this.token || '';

            const response = await axios.post(
                BASE_URL + API_ENDPOINTS.UPDATE_TIME,
                payload,
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

    async getTimeManageList(fromDate: string, toDate: string): Promise<{ success: boolean, data?: any[], error?: string }> {
        try {
            if (!this.token) {
                await this.loadCredentials();
            }

            const payload = {
                TokenC: this.token,
                Id: this.empId,
                FDate: fromDate,
                TDate: toDate
            };

            const response = await axios.post(
                BASE_URL + API_ENDPOINTS.GET_TIME_MANAGE_LIST,
                payload,
                { headers: this.getHeaders() }
            );

            if (response.data.Status === 'success') {
                return { success: true, data: response.data.data || response.data.xx || [] }; // Adjust based on actual response
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

    async downloadTimeReport(fromDate: string, toDate: string): Promise<{ success: boolean, url?: string, alternativeUrl?: string, error?: string; data?: any }> {
        try {
            if (!this.token) {
                await this.loadCredentials();
            }

            if (!this.token || !this.empId) {
                return { success: false, error: 'Authentication details missing. Please login again.' };
            }

            // Get additional user data needed for URL construction
            const userDataStr = await AsyncStorage.getItem('user_data');
            const userData = userDataStr ? JSON.parse(userDataStr) : null;

            console.log('User data for download:', userData);

            // Use fallback values if user data is missing
            const empId = this.empId;
            const companyId = userData?.CompIdN || userData?.CompanyId || '1';
            const customerId = userData?.CustomerIdC || userData?.DomainId || 'kevit';
            const companyUrl = 'https://hr.trickyhr.com'; // Base URL is constant for now

            console.log('Download parameters:', { empId, companyId, customerId });

            // Build payload exactly as requested
            const payload = {
                TokenC: this.token,
                FromDate: fromDate,  // Expects "MM/dd/yyyy" format
                ToDate: toDate,      // Expects "MM/dd/yyyy" format
                Where: `A.EmpIdN IN(${this.empId})`,
                Group: "Employee",
                OrderBy: 1
            };

            console.log('Download Report Payload:', payload);

            const response = await axios.post(
                BASE_URL + API_ENDPOINTS.DOWNLOAD_REPORT,
                payload,
                { headers: this.getHeaders() }
            );

            console.log('Download Report Response Status:', response.data.Status);
            console.log('Download Report Full Response:', JSON.stringify(response.data));

            if (response.data.Status === 'success') {
                // Construct URL manually
                // Pattern: https://hr.trickyhr.com/kevit-Customer/{customerId}/{companyId}/EmpPortal/TMSReport/{empId}.pdf

                const downloadUrl = `${companyUrl}/kevit-Customer/${customerId}/${companyId}/EmpPortal/TMSReport/${empId}.pdf`;
                console.log('Generated download URL:', downloadUrl);

                return {
                    success: true,
                    url: downloadUrl,
                    data: response.data
                };
            } else {
                const errorMsg = response.data.Error || 'Download failed';
                console.error('API returned error:', errorMsg);
                return {
                    success: false,
                    error: errorMsg
                };
            }
        } catch (error: any) {
            console.error('Download Report Error:', error);

            let errorMessage = 'Network error';
            if (error.response) {
                console.error('Error response data:', error.response.data);
                console.error('Error response status:', error.response.status);
                errorMessage = error.response.data?.Error ||
                    error.response.data?.message ||
                    `Server error: ${error.response.status}`;
            } else if (error.request) {
                console.error('No response received from server');
                errorMessage = 'No response from server';
            } else {
                console.error('Error message:', error.message);
                errorMessage = error.message;
            }

            return { success: false, error: errorMessage };
        }
    }

    // --- Document Management ---

    async getDocuments(category: string = 'All'): Promise<any[]> {
        try {
            if (!this.token) {
                await this.loadCredentials();
            }
            // Assuming an endpoint exists. If not, this might need adjustment.
            // Using /GetEmpDocument based on naming conventions (or user's /documents)
            // User prompt used /documents. I will try to follow conventions or use what is requested.
            // Since the user is providing code to "add this function", I'll adapt it.
            // The user's code: axios.get(`${API_BASE_URL}/documents`, params: { employeeId })

            // I'll assume we likely don't have this endpoint working yet if I invent it, 
            // but I will add the method. 
            // Note: The user provided specific endpoints for upload: '/UploadDocument_Emp' (implied by content type example?)
            // No, the user provided Request/Response for Upload.
            // For getDocuments, I'll use a placeholder or best guess.

            const response = await axios.post(
                BASE_URL + API_ENDPOINTS.GET_OFFICE_DOCUMENTS,
                {
                    TokenC: this.token,
                    Id: this.empId,           // C# backend expects 'Id', not 'EmpID'
                    FolderName: category === 'All' ? '' : category,
                    DocName: 'All'            // Required parameter
                },
                { headers: this.getHeaders() }
            );

            console.log('Get Documents Request - Category:', category);
            console.log('Get Documents Response:', response.data);

            if (response.data.Status === 'success') {
                // The C# backend returns documents in the 'data' or 'xx' field
                const docs = response.data.data || response.data.xx || [];
                return docs.map((doc: any, index: number) => ({
                    id: `${doc.DocIdN || 'doc'}_${index}`, // Ensure unique key for FlatList
                    name: doc.NameC || 'Document',
                    fileName: doc.FileNameC || doc.NameC,
                    type: doc.FolderNameC || 'Unknown',
                    icon: doc.IconC || '',
                    date: doc.LastWriteTimeC && doc.LastWriteTimeC.includes('/Date(')
                        ? new Date(parseInt(doc.LastWriteTimeC.replace(/\/Date\((-?\d+)\)\//, '$1'))).toLocaleDateString()
                        : (doc.LastWriteTimeC || new Date().toLocaleDateString()),
                    size: 'Unknown',
                    url: `${BASE_URL}/Employee/DownloadDocByFile?FileName=${encodeURIComponent(doc.FileNameC || doc.NameC)}&FolderName=${encodeURIComponent((doc.FolderNameC || '') + (doc.FileNameC || doc.NameC))}`
                }));
            }
            return [];
        } catch (error) {
            console.log('Error fetching documents', error);
            return [];
        }
    }

    async getPaySlipList(): Promise<{ success: boolean; data?: PaySlip[]; error?: string }> {
        try {
            if (!this.token) {
                await this.loadCredentials();
            }

            const response = await axios.post(
                BASE_URL + API_ENDPOINTS.GET_PAYSLIP_LIST,
                {
                    TokenC: this.token,
                    EmpIdN: this.empId,
                },
                { headers: this.getHeaders() }
            );

            if (response.data.Status === 'success') {
                return { success: true, data: response.data.data };
            } else {
                return { success: false, error: response.data.Error };
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.Error || 'Network error',
            };
        }
    }

    async downloadPaySlip(paySlip: PaySlip): Promise<{ success: boolean; url?: string; error?: string }> {
        try {
            if (!this.token) {
                await this.loadCredentials();
            }

            // Get additional user data needed for URL construction
            const userDataStr = await AsyncStorage.getItem('user_data');
            const userData = userDataStr ? JSON.parse(userDataStr) : null;

            if (!this.token || !this.empId || !userData) {
                return { success: false, error: 'Authentication or user details missing' };
            }

            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const payPeriod = `${months[paySlip.MonthN - 1]} ${paySlip.YearN}`;

            // 1. Trigger the API to generate/prepare the PDF (Method 70 in Java)
            // Even if we construct the URL manually, some backends require this trigger.
            try {
                await axios.post(
                    BASE_URL + API_ENDPOINTS.DOWNLOAD_PAYSLIP,
                    {
                        TokenC: this.token,
                        Month: paySlip.MonthN,
                        Year: paySlip.YearN,
                        PayPeriod: payPeriod,
                        PayTypeC: paySlip.PayTypeC
                    },
                    { headers: this.getHeaders() }
                );
            } catch (e) {
                console.log('Trigger PDF gen error (ignoring if URL works):', e);
            }

            // 2. Construct the URL
            const companyId = userData.CompIdN || userData.CompanyId;
            const customerId = userData.CustomerIdC || userData.DomainId;
            const companyUrl = 'https://hr.trickyhr.com'; // Or from storage if dynamic

            // Pattern from Java: company_url+"/kevit-Customer/"+customer_id+"/"+company_id+ "/EmpPortal/EmpPaySlip/"+emp_id+"/" + pay_period+".pdf"
            const downloadUrl = `${companyUrl}/kevit-Customer/${customerId}/${companyId}/EmpPortal/EmpPaySlip/${this.empId}/${payPeriod}.pdf`;

            return { success: true, url: downloadUrl };

        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.Error || 'Network error',
            };
        }
    }

    async uploadDocument(data: { name: string; type: string; remarks: string; file: { uri: string; name: string; type: string } }): Promise<{ success: boolean; data?: any; error?: string }> {
        try {
            if (!this.token) {
                await this.loadCredentials();
            }

            const formData = new FormData();
            formData.append('TokenC', this.token || '');
            formData.append('EmpID', String(this.empId));
            formData.append('EmpDocName', data.name);
            formData.append('Type', data.type);
            formData.append('Remarks', data.remarks);

            // Handle file
            if (data.file) {
                formData.append('EmpDoc', {
                    uri: data.file.uri,
                    name: data.file.name,
                    type: data.file.type || 'application/pdf', // Ensure type is present
                } as any);
            }

            console.log('Uploading document...');

            const response = await axios.post(
                BASE_URL + API_ENDPOINTS.UPLOAD_DOCUMENT,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        // Axios might handle boundary automatically if we let it, 
                        // but usually we need to be careful with headers in RN.
                        // Often it's best to let axios sets content-type for multipart
                        'Accept': 'application/json',
                    },
                    transformRequest: (data, headers) => {
                        // React Native FormData needs to remain as is
                        return data;
                    },
                }
            );

            console.log('Upload response:', response.data);

            if (response.data.Status === 'success') {
                return { success: true, data: response.data };
            } else {
                return { success: false, error: response.data.Error || 'Upload failed' };
            }
        } catch (error: any) {
            console.error('Error uploading document:', error);
            let errorMessage = 'Upload failed';
            if (error.response) {
                errorMessage = error.response.data?.Error || error.message;
            }
            return { success: false, error: errorMessage };
        }
    }

    // --- Office Documents ---
    async getOfficeDocuments(folderName: string = 'OfficeDoc'): Promise<{ success: boolean; data?: any[]; error?: string }> {
        try {
            if (!this.token) {
                await this.loadCredentials();
            }

            const response = await axios.post(
                BASE_URL + API_ENDPOINTS.GET_OFFICE_DOCUMENTS,
                {
                    TokenC: this.token,
                    Id: this.empId,
                    FolderName: folderName
                },
                { headers: this.getHeaders() }
            );

            if (response.data.Status === 'success') {
                return { success: true, data: response.data.data };
            } else {
                return { success: false, error: response.data.Error };
            }
        } catch (error: any) {
            console.log('Error fetching office documents', error);
            return {
                success: false,
                error: error.response?.data?.Error || error.message || 'Network error'
            };
        }
    }

    async downloadFile(url: string, fileName: string): Promise<string | null> {
        try {
            const fs = FileSystem as any;
            const downloadDir = fs.documentDirectory + 'OfficeDoc/';
            const dirInfo = await fs.getInfoAsync(downloadDir);

            if (!dirInfo.exists) {
                await fs.makeDirectoryAsync(downloadDir, { intermediates: true });
            }

            const fileUri = downloadDir + fileName;

            const downloadObject = fs.createDownloadResumable(
                url,
                fileUri,
                {
                    headers: { 'Token': this.token || '' }
                }
            );

            const result = await downloadObject.downloadAsync();

            if (result && result.uri && result.status === 200) {
                return result.uri;
            }
            return null;
        } catch (error) {
            console.error('Download error:', error);
            return null;
        }
    }

    async getCalendarEvents(month: number, year: number): Promise<{ success: boolean; data?: CalendarEvent[]; error?: string }> {
        try {
            if (!this.token) {
                await this.loadCredentials();
            }

            const response = await axios.post(
                BASE_URL + API_ENDPOINTS.GET_CALENDAR_EVENTS,
                {
                    TokenC: this.token,
                    Year: year,
                    Month: month
                },
                { headers: this.getHeaders() }
            );

            if (response.data.Status === 'success') {
                return { success: true, data: response.data.cllist };
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

    async getCalendarDetails(dateStr: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
        // dateStr should be formatted as "MMM dd yyyy"
        try {
            if (!this.token) {
                await this.loadCredentials();
            }

            const response = await axios.post(
                BASE_URL + API_ENDPOINTS.GET_CALENDAR_DETAILS,
                {
                    TokenC: this.token,
                    StartDate: dateStr
                },
                { headers: this.getHeaders() }
            );

            if (response.data.Status === 'success') {
                return { success: true, data: response.data.xx };
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

    async getEmployeeList(): Promise<{ success: boolean; data?: Employee[]; error?: string }> {
        try {
            if (!this.token) {
                await this.loadCredentials();
            }

            const response = await axios.post(
                BASE_URL + API_ENDPOINTS.GET_EMPLOYEE_LIST,
                {
                    TokenC: this.token
                },
                { headers: this.getHeaders() }
            );

            if (response.data.Status === 'success') {
                return { success: true, data: response.data.data };
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

    async getAttendanceReport(fromDate: string, toDate: string, type: number = 0): Promise<{ success: boolean; data?: any[]; error?: string }> {
        try {
            if (!this.token) {
                await this.loadCredentials();
            }

            const payload = {
                TokenC: this.token,
                FromDate: fromDate,
                ToDate: toDate,
                Type: 1           // 1 for all records
            };

            console.log('Attendance Report Payload:', payload);

            const response = await axios.post(
                BASE_URL + API_ENDPOINTS.GET_MOBILE_ATTENDANCE_REPORT,
                payload,
                { headers: this.getHeaders() }
            );

            console.log('Attendance Report Response Status:', response.data.Status);

            if (response.data.Status === 'success') {
                return { success: true, data: response.data.data || [] };
            } else {
                return { success: false, error: response.data.Error || 'Failed to fetch attendance report' };
            }
        } catch (error: any) {
            console.error('Attendance Report Error:', error);
            return {
                success: false,
                error: error.response?.data?.Error || error.message || 'Network error'
            };
        }
    }

    async getClientList(): Promise<{ success: boolean; data?: { clients: any[]; serviceTypes: any[] }; error?: string }> {
        try {
            if (!this.token) {
                await this.loadCredentials();
            }

            const response = await axios.post(
                BASE_URL + API_ENDPOINTS.GET_CLIENT_LIST,
                {
                    TokenC: this.token
                },
                { headers: this.getHeaders() }
            );

            console.log('Client List Response Status:', response.data.Status);

            if (response.data.Status === 'success') {
                return {
                    success: true,
                    data: {
                        clients: response.data.data || [],
                        serviceTypes: response.data.ServiceType || []
                    }
                };
            } else {
                return { success: false, error: response.data.Error || 'Failed to fetch client list' };
            }
        } catch (error: any) {
            console.error('Client List Error:', error);
            return {
                success: false,
                error: error.response?.data?.Error || error.message || 'Network error'
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
            formData.append('TokenC', this.token || '');
            formData.append('EmpIdN', String(this.empId));
            formData.append('ClientIdN', String(data.ClientIdN));
            formData.append('TicketNoC', data.TicketNoC);
            formData.append('Remark1C', data.Remark1C);
            formData.append('Remark2C', data.Remark2C);
            formData.append('Remark3C', data.Remark3C);
            formData.append('ServiceTypeC', data.ServiceTypeC);
            formData.append('FollowUpDateD', data.FollowUpDateD);
            formData.append('ServiceDtl', data.ServiceDtl);
            formData.append('StartTimeD', data.StartTimeD);
            formData.append('CallTimeD', data.CallTimeD);
            formData.append('AppointmentTimeD', data.AppointmentTimeD);

            // Add signatures if available
            if (data.ClientSign) {
                formData.append('ClientSign', {
                    uri: data.ClientSign,
                    name: 'client_signature.png',
                    type: 'image/png'
                } as any);
            }

            if (data.EmpSign) {
                formData.append('EmpSign', {
                    uri: data.EmpSign,
                    name: 'emp_signature.png',
                    type: 'image/png'
                } as any);
            }

            console.log('Submitting Service Report...');

            const response = await axios.post(
                BASE_URL + API_ENDPOINTS.SUBMIT_SERVICE_REPORT,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Token': this.token || ''
                    }
                }
            );

            console.log('Service Report Response Status:', response.data.Status);

            if (response.data.Status === 'success') {
                return { success: true };
            } else {
                return { success: false, error: response.data.Error || 'Failed to submit service report' };
            }
        } catch (error: any) {
            console.error('Submit Service Report Error:', error);
            return {
                success: false,
                error: error.response?.data?.Error || error.message || 'Network error'
            };
        }
    }

    async getYourPendingApprovals(): Promise<{ success: boolean; data?: any[]; error?: string }> {
        try {
            if (!this.token || !this.empId) {
                await this.loadCredentials();
            }

            const response = await axios.post(
                BASE_URL + API_ENDPOINTS.GET_YOUR_PENDING_APPROVALS,
                {
                    TokenC: this.token,
                    EmpIdN: this.empId
                },
                { headers: this.getHeaders() }
            );

            console.log('Your Pending Approvals Response Status:', response.data.Status);

            if (response.data.Status === 'success') {
                return {
                    success: true,
                    data: response.data.data || response.data.xx || []
                };
            } else {
                return { success: false, error: response.data.Error || 'Failed to fetch your pending approvals' };
            }
        } catch (error: any) {
            console.error('Your Pending Approvals Error:', error);
            return {
                success: false,
                error: error.response?.data?.Error || error.message || 'Network error'
            };
        }
    }

    async getOtherPendingApprovals(): Promise<{ success: boolean; data?: any[]; error?: string }> {
        try {
            if (!this.token || !this.empId) {
                await this.loadCredentials();
            }

            const response = await axios.post(
                BASE_URL + API_ENDPOINTS.GET_OTHER_PENDING_APPROVALS,
                {
                    TokenC: this.token,
                    EmpIdN: this.empId
                },
                { headers: this.getHeaders() }
            );

            console.log('Other Pending Approvals Response Status:', response.data.Status);

            if (response.data.Status === 'success') {
                return {
                    success: true,
                    data: response.data.data || response.data.xx || []
                };
            } else {
                return { success: false, error: response.data.Error || 'Failed to fetch other pending approvals' };
            }
        } catch (error: any) {
            console.error('Other Pending Approvals Error:', error);
            return {
                success: false,
                error: error.response?.data?.Error || error.message || 'Network error'
            };
        }
    }

    async updatePendingApproval(data: {
        IdN: number;
        StatusC: string;
        ApproveRemarkC: string;
    }): Promise<{ success: boolean; error?: string }> {
        try {
            if (!this.token || !this.empId) {
                await this.loadCredentials();
            }

            // Convert status to Approval number: 1 = Approved, 2 = Rejected
            const approvalStatus = data.StatusC.toLowerCase() === 'approved' ? 1 : 2;

            const payload = {
                Flag: "SaveApproval",
                Tokenc: this.token,
                EmpId: this.empId,
                Id: data.IdN,
                Approval: approvalStatus,
                YearN: 0,
                Remarks: data.ApproveRemarkC || '',
                title: "",
                DocName: "",
                ReceiveYearN: 0,
                ReceiveMonthN: 0,
                ApproveAmtN: 0,
                PayTypeN: 0,
                LFromDateD: new Date().toISOString().split('T')[0],
                LToDateD: new Date().toISOString().split('T')[0],
            };

            console.log('Update Pending Approval Payload:', JSON.stringify(payload, null, 2));

            const response = await axios.post(
                BASE_URL + API_ENDPOINTS.SAVE_APPROVAL,
                payload,
                { headers: this.getHeaders() }
            );

            console.log('Update Pending Approval Response:', JSON.stringify(response.data, null, 2));

            if (response.data.Status === 'success') {
                return { success: true };
            } else {
                return { success: false, error: response.data.Error || 'Failed to update approval' };
            }
        } catch (error: any) {
            console.error('Update Pending Approval Error:', error);
            if (error.response) {
                console.error('Error Response:', JSON.stringify(error.response.data, null, 2));
            }
            return {
                success: false,
                error: error.response?.data?.Error || error.message || 'Network error'
            };
        }
    }
}

export default ApiService.getInstance();
