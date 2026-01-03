import { API_ENDPOINTS } from "@/constants/api";

const BASE_URL = API_ENDPOINTS.CompanyUrl;

export const useCompanyLogo = (
    customerIdC?: string | null,
    compIdN?: string | number | null
) => {
    const safeCustomerId = encodeURIComponent(customerIdC ?? '');
    const safeCompId = encodeURIComponent(String(compIdN ?? ''));

    if (!safeCustomerId || !safeCompId) return undefined;

    return `${BASE_URL}/kevit-Customer/${safeCustomerId}/COMPLOGO/${safeCompId}.jpg`;
};

export const useProfileImage = (
    customerIdC?: string | null,
    compIdN?: string | number | null,
    EmpIdN?: string | number | null
) => {
    const safeCustomerIdC = encodeURIComponent(customerIdC ?? '');
    const safeCompIdN = encodeURIComponent(String(compIdN ?? ''));
    const safeEmpIdN = encodeURIComponent(String(EmpIdN ?? ''));

    if (!safeCustomerIdC || !safeCompIdN || !safeEmpIdN) return undefined;
    return `${BASE_URL}/kevit-Customer/${safeCustomerIdC}/${safeCompIdN}/${safeEmpIdN}.jpg`;
};
