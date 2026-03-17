import { API_ENDPOINTS } from "@/constants/api";
import axios from "axios";

// export const resolveWorkingDomain = async (
//   rawInput: string,
//   empCode: string,
//   password: string,
//   domainId?: string,
// ): Promise<string> => {
//   let cleaned = rawInput.trim();

//   let baseUrl: string;

//   // ✅ If user already provided protocol → use as-is
//   if (/^https?:\/\//i.test(cleaned)) {
//     baseUrl = cleaned.replace(/\/$/, ""); // remove trailing slash if exists
//   } else {
//     // ✅ If no protocol → force http only
//     baseUrl = `http://${cleaned}`;
//   }

//   try {
//     await axios.post(
//       `${baseUrl}/${API_ENDPOINTS.LOGIN}`,
//       {
//         EmpCode: empCode,
//         Password: password,
//         ...(domainId ? { DomainId: domainId } : {}),
//       },
//       { timeout: 6000 },
//     );

//     return baseUrl; // ✅ working URL
//   } catch (err) {
//     console.warn(`Failed to connect to ${baseUrl}:`, err);
//     throw new Error("Server not reachable");
//   }
// };

export const resolveWorkingDomain = async (
  rawInput: string,
  empCode: string,
  password: string,
  domainId?: string,
): Promise<string> => {
  const normalizedInput = rawInput.trim().replace(/\/$/, "").replace(/ /g, "");

  const hasProtocol = /^https?:\/\//i.test(normalizedInput);
  const withoutProtocol = normalizedInput.replace(/^https?:\/\//i, "");
  const isLocalHost =
    /^localhost(:\d+)?$/i.test(withoutProtocol) ||
    /^127\.0\.0\.1(:\d+)?$/i.test(withoutProtocol);

  const candidates = hasProtocol
    ? [normalizedInput]
    : isLocalHost
      ? [`http://${withoutProtocol}`]
      : [`https://${withoutProtocol}`, `http://${withoutProtocol}`];

  const loginPath = API_ENDPOINTS.LOGIN.replace(/^\/+/, "");

  for (const baseUrl of candidates) {
    try {
      const loginUrl = `${baseUrl}/${loginPath}`;
      await axios.post(
        loginUrl,
        {
          EmpCode: empCode,
          Password: password,
          ...(domainId ? { DomainId: domainId } : {}),
        },
        { timeout: 6000 },
      );

      return baseUrl; // ✅ working domain
    } catch (err) {
      continue;
    }
  }

  // ❌ If no domain worked
  throw new Error("Unable to resolve working domain");
};
