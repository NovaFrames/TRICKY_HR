import { getDomainUrl } from "@/services/urldomain";

export const getCompanyLogoUrl = async (
  customerIdC?: string | null,
  compIdN?: string | number | null
): Promise<string | undefined> => {
  if (!customerIdC || !compIdN) return undefined;

  const domainUrl = await getDomainUrl();
  if (!domainUrl) return undefined;

  const safeCustomerId = encodeURIComponent(customerIdC);
  const safeCompId = encodeURIComponent(String(compIdN));

  return `${domainUrl}/kevit-Customer/${safeCustomerId}/COMPLOGO/${safeCompId}.jpg`;
};

export const getProfileImageUrl = async (
  customerIdC?: string | null,
  compIdN?: string | number | null,
  empIdN?: string | number | null
): Promise<string | undefined> => {
  if (!customerIdC || !compIdN || !empIdN) return undefined;

  const domainUrl = await getDomainUrl();
  if (!domainUrl) return undefined;

  const safeCustomerIdC = encodeURIComponent(customerIdC);
  const safeCompIdN = encodeURIComponent(String(compIdN));
  const safeEmpIdN = encodeURIComponent(String(empIdN));

  return `${domainUrl}/kevit-Customer/${safeCustomerIdC}/${safeCompIdN}/${safeEmpIdN}.jpg`;
};
