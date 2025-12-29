
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
        return response.data;
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
        return response.data;
    } catch (error) {
        throw error;
    }
}

export default api;
