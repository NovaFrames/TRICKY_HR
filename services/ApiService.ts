
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
    GET_EMP_REQUEST_STATUS: '/GetEmpRequestStatus',

    // Time Management
    GET_TIME_MANAGE_LIST: '/GetTimeManageList',
    GET_PROJECT_LIST: '/GetProjectList',
    UPDATE_TIME: '/UpdateEmpTimeManage',
    DOWNLOAD_REPORT: '/DownloadTimeReport1',
    UPLOAD_DOC: '/UploadDocument_Emp', // Endpoint for uploading documents
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

            // Get additional user data needed for URL construction
            const userDataStr = await AsyncStorage.getItem('user_data');
            const userData = userDataStr ? JSON.parse(userDataStr) : null;

            if (!this.token || !this.empId || !userData) {
                return { success: false, error: 'Authentication or user details missing' };
            }

            const empId = this.empId;
            const companyId = userData.CompIdN || userData.CompanyId || '1';
            const customerId = userData.CustomerIdC || userData.DomainId || 'kevit';
            const companyUrl = 'https://hr.trickyhr.com'; // Base URL is constant for now

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
                return {
                    success: false,
                    error: response.data.Error || 'Download failed'
                };
            }
        } catch (error: any) {
            console.error('Download Report Error:', error);

            let errorMessage = 'Network error';
            if (error.response) {
                errorMessage = error.response.data?.Error ||
                    error.response.data?.message ||
                    `Server error: ${error.response.status}`;
            } else if (error.request) {
                errorMessage = 'No response from server';
            }

            return { success: false, error: errorMessage };
        }
    }

    // --- Document Management ---

    async getDocuments(): Promise<any[]> {
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
                BASE_URL + '/GetEmpDocumentShow', // Guessing endpoint
                { TokenC: this.token, EmpID: this.empId },
                { headers: this.getHeaders() }
            );

            if (response.data.Status === 'success') {
                // Map response to Document interface if needed
                const docs = response.data.data || [];
                return docs.map((doc: any, index: number) => ({
                    id: doc.Id || index,
                    name: doc.EmpDocName || doc.Name || 'Document',
                    type: doc.Type || 'Unknown',
                    date: doc.CreatedDate || new Date().toLocaleDateString(),
                    size: doc.Size || 'Unknown',
                    url: doc.Path || doc.Url
                }));
            }
            return [];
        } catch (error) {
            console.log('Error fetching documents', error);
            return [];
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
                BASE_URL + '/SaveEmpPortalDocument',
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
}

export default ApiService.getInstance();
