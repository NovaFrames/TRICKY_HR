import axios from 'axios';
import { API_ENDPOINTS } from './api';

export interface APIResponse {
    Status: 'success' | 'error';
    Error?: string;
    data?: any;
    IdN?: number;
    EnableCurrency?: boolean;
    Currency?: Array<{ IdN: number; NameC: string }>;
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

export interface DocumentFile {
    uri: string;
    type: string;
    name: string;
}

const BASE_URL = API_ENDPOINTS.CompanyUrl;

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const ClaimAPI = {
    // Get claim types and currency list
    getClaimList: async (token: string): Promise<APIResponse> => {
        try {
            const response = await api.post<APIResponse>(`${API_ENDPOINTS.CompanyUrl}/WebApi/GetEClaimList`, {
                TokenC: token
            });

            return response.data;
        } catch (error) {
            console.error('Error fetching claim list:', error);
            throw error;
        }
    },

    // Submit claim data
    updateClaim: async (token: string, claimData: ClaimData): Promise<APIResponse> => {
        try {
            const data = {
                TokenC: token,
                ...claimData
            };

            const response = await api.post<APIResponse>(`${API_ENDPOINTS.CompanyUrl}/WebApi/UpdateClaim`, data);
            return response.data;
        } catch (error) {
            console.error('Error submitting claim:', error);
            throw error;
        }
    },

    // Upload claim documents
    updateClaimDoc: async (token: string, claimId: number, files: DocumentFile[]): Promise<APIResponse> => {
        try {
            const formData = new FormData();
            formData.append('TokenC', token || '');
            formData.append('IdN', claimId.toString());

            // Add files to form data
            files.forEach((file, index) => {
                const fileData: any = {
                    uri: file.uri,
                    type: file.type,
                    name: file.name
                };
                formData.append(`File[${index}]`, fileData);
            });

            const response = await axios.post<APIResponse>(
                `${API_ENDPOINTS.CompanyUrl}/WebApi/UpdateClaimDoc`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            return response.data;
        } catch (error) {
            console.error('Error uploading documents:', error);
            throw error;
        }
    },
};

export default ClaimAPI;