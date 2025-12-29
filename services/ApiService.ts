
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

export default api;
