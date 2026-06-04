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
  let cleaned = rawInput.trim();

  cleaned = cleaned.replace(/\/$/, "").replace(/ /g, "");
  cleaned = cleaned.replace(/^https?:\/\//, "");

  const candidates = [`https://${cleaned}`, `http://${cleaned}`];

  for (const baseUrl of candidates) {
    try {
      await axios.post(
        `${baseUrl}/${API_ENDPOINTS.LOGIN}`,
        {
          EmpCode: empCode,
          Password: password,
          ...(domainId ? { DomainId: domainId } : {}),
        },
        { timeout: 6000 },
      );

      return baseUrl; // ✅ working domain
    } catch (err: any) {
      console.log("URL:", `${baseUrl}${API_ENDPOINTS.LOGIN}`);
      console.log("MESSAGE:", err?.message);
      console.log("CODE:", err?.code);
      console.log("STATUS:", err?.response?.status);
      console.log("DATA:", err?.response?.data);

      if (err?.request?._response) {
        console.log("RAW:", err.request._response);
      }

      continue;
    }
  }

  // ❌ If no domain worked
  throw new Error("Unable to resolve working domain");
};
